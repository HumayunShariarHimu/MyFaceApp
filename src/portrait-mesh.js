import * as THREE from 'three';
import Delaunator from 'delaunator';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let landmarkerPromise;
let activeMesh;
let latestRequest = 0;

async function getLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm');
      const options = {
        baseOptions: { modelAssetPath: `${import.meta.env.BASE_URL}models/face_landmarker.task` },
        runningMode: 'IMAGE',
        numFaces: 1,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      };
      try {
        return await FaceLandmarker.createFromOptions(vision, { ...options, baseOptions: { ...options.baseOptions, delegate: 'GPU' } });
      } catch {
        return FaceLandmarker.createFromOptions(vision, options);
      }
    })().catch((error) => {
      landmarkerPromise = undefined;
      throw error;
    });
  }
  return landmarkerPromise;
}

export async function createPortraitMesh(image) {
  const requestId = ++latestRequest;
  const landmarker = await getLandmarker();
  if (requestId !== latestRequest) throw new DOMException('Portrait request superseded.', 'AbortError');
  const result = landmarker.detect(image);
  const landmarks = result.faceLandmarks?.[0];
  if (!landmarks || landmarks.length < 300) {
    throw new Error('A front-facing face was not detected for the 3D portrait.');
  }

  const points = landmarks.length >= 478 ? landmarks.slice(0, 478) : landmarks.slice(0, 468);
  const eyeLeft = points[33];
  const eyeRight = points[263];
  const eyeAngle = Math.atan2(eyeRight.y - eyeLeft.y, eyeRight.x - eyeLeft.x);
  const cos = Math.cos(eyeAngle);
  const sin = Math.sin(eyeAngle);
  const eyeCenterX = (eyeLeft.x + eyeRight.x) / 2;
  const eyeCenterY = (eyeLeft.y + eyeRight.y) / 2;
  const aligned = points.map((point) => {
    const dx = point.x - eyeCenterX;
    const dy = point.y - eyeCenterY;
    return { x: dx * cos + dy * sin, y: -dx * sin + dy * cos };
  });
  const xs = aligned.map((point) => point.x);
  const ys = aligned.map((point) => point.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = points.reduce((sum, point) => sum + point.z, 0) / points.length;
  const faceWidth = Math.max(maxX - minX, 0.01);
  const faceHeight = Math.max(maxY - minY, 0.01);
  const widthScale = 1.45 / faceWidth;
  const heightScale = 2.0 / faceHeight;
  const scale = Math.min(widthScale, heightScale);
  const points2d = aligned.map((point) => [point.x, point.y]);
  const triangles = Delaunator.from(points2d).triangles;
  const positions = new Float32Array(points.length * 3);
  const uvs = new Float32Array(points.length * 2);

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    positions[index * 3] = (aligned[index].x - centerX) * scale;
    positions[index * 3 + 1] = (centerY - aligned[index].y) * scale;
    positions[index * 3 + 2] = THREE.MathUtils.clamp(0.79 - (point.z - centerZ) * scale * 1.5, 0.58, 1.05);
    uvs[index * 2] = point.x;
    uvs[index * 2 + 1] = 1 - point.y;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(Array.from(triangles));
  geometry.computeVertexNormals();

  const texture = new THREE.Texture(image);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.76,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'uploaded-photo-face-surface';
  mesh.position.set(0, 0.05, 0);
  mesh.userData.basePositions = positions.slice();
  const wireMaterial = new THREE.MeshBasicMaterial({ color: 0x70f0e6, wireframe: true, transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide });
  const wireOverlay = new THREE.Mesh(geometry, wireMaterial);
  wireOverlay.position.z = 0.003;
  wireOverlay.visible = false;
  mesh.add(wireOverlay);
  mesh.userData.wireOverlay = wireOverlay;
  mesh.userData.wireMaterial = wireMaterial;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  if (activeMesh) {
    activeMesh.geometry.dispose();
    activeMesh.material.map?.dispose();
    activeMesh.material.dispose();
    activeMesh.userData.wireMaterial?.dispose();
    activeMesh.parent?.remove(activeMesh);
  }
  if (requestId !== latestRequest) {
    geometry.dispose();
    texture.dispose();
    material.dispose();
    wireMaterial.dispose();
    throw new DOMException('Portrait request superseded.', 'AbortError');
  }
  activeMesh = mesh;
  return mesh;
}

export function animatePortrait(time, gaze = 'center') {
  if (!activeMesh) return;
  const position = activeMesh.geometry.attributes.position;
  const base = activeMesh.userData.basePositions;
  const irisIndices = activeMesh.geometry.attributes.position.count >= 478 ? [468, 469, 470, 471, 472, 473, 474, 475, 476, 477] : [];
  const gazeBias = gaze === 'left' ? -0.025 : gaze === 'right' ? 0.025 : Math.sin(time * 0.8) * 0.012;
  const blinkPhase = (time + 0.9) % 4.8;
  const blink = Math.max(0, 1 - Math.abs(blinkPhase - 4.55) / 0.08);

  for (let index = 0; index < position.count; index += 1) {
    position.array[index * 3] = base[index * 3];
    position.array[index * 3 + 1] = base[index * 3 + 1];
    position.array[index * 3 + 2] = base[index * 3 + 2];
  }
  for (const index of irisIndices) {
    position.array[index * 3] += gazeBias;
    position.array[index * 3 + 1] += Math.sin(time * 0.55) * 0.004;
  }
  const upperLids = [158, 159, 160, 385, 386, 387];
  const lowerLids = [144, 145, 153, 373, 374, 380];
  for (const index of upperLids) if (index < position.count) position.array[index * 3 + 1] -= blink * 0.022;
  for (const index of lowerLids) if (index < position.count) position.array[index * 3 + 1] += blink * 0.022;
  position.needsUpdate = true;
  activeMesh.geometry.computeVertexNormals();
}

export function clearPortraitMesh() {
  latestRequest += 1;
  if (!activeMesh) return;
  activeMesh.geometry.dispose();
  activeMesh.material.map?.dispose();
  activeMesh.material.dispose();
  activeMesh.userData.wireMaterial?.dispose();
  activeMesh.parent?.remove(activeMesh);
  activeMesh = undefined;
}

export function setPortraitWireframe(visible) {
  if (activeMesh?.userData.wireOverlay) activeMesh.userData.wireOverlay.visible = visible;
}
