import * as THREE from 'three';
import Delaunator from 'delaunator';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let landmarkerPromise;
let activeAvatar;
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

function averageColor(image, x0, y0, x1, y1, fallback) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, 32, 32);
    const pixels = context.getImageData(0, 0, 32, 32).data;
    let r = 0, g = 0, b = 0, count = 0;
    for (let y = Math.floor(y0 * 32); y < Math.ceil(y1 * 32); y += 1) {
      for (let x = Math.floor(x0 * 32); x < Math.ceil(x1 * 32); x += 1) {
        const i = (y * 32 + x) * 4;
        if (pixels[i + 3] < 20) continue;
        r += pixels[i]; g += pixels[i + 1]; b += pixels[i + 2]; count += 1;
      }
    }
    if (!count) return new THREE.Color(fallback);
    const color = new THREE.Color(r / count / 255, g / count / 255, b / count / 255);
    color.multiplyScalar(0.92);
    return color;
  } catch {
    return new THREE.Color(fallback);
  }
}

function makeHeadGeometry(width, height, depth) {
  const geometry = new THREE.SphereGeometry(1, 72, 56);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const chinTaper = THREE.MathUtils.smoothstep(y, -0.85, 0.12);
    const cheekFullness = 1 + 0.055 * Math.exp(-(((y + 0.12) / 0.34) ** 2));
    const jawInset = 1 - 0.17 * (1 - chinTaper);
    const frontPlane = Math.max(0, z);
    const noseBridge = 0.08 * Math.exp(-((x / 0.12) ** 2)) * Math.exp(-(((y + 0.02) / 0.36) ** 2));
    const noseTip = 0.09 * Math.exp(-((x / 0.18) ** 2)) * Math.exp(-(((y + 0.28) / 0.13) ** 2));
    const zOffset = frontPlane * (noseBridge + noseTip);
    position.setXYZ(i, x * width * jawInset * cheekFullness, y * height, z * depth + zOffset);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function makeAvatarShell(image, faceWidth, faceHeight) {
  const group = new THREE.Group();
  group.name = 'estimated-full-head-avatar';
  const skinColor = averageColor(image, 0.38, 0.48, 0.62, 0.66, '#b98578');
  const hairColor = averageColor(image, 0.18, 0.32, 0.3, 0.62, '#30242a')
    .lerp(averageColor(image, 0.7, 0.32, 0.82, 0.62, '#30242a'), 0.5)
    .multiplyScalar(0.78);
  const proportions = THREE.MathUtils.clamp(faceWidth / Math.max(faceHeight, 0.01), 0.65, 0.96);
  const width = THREE.MathUtils.clamp(0.88 * (proportions / 0.78), 0.76, 0.99);
  const height = THREE.MathUtils.clamp(faceHeight * 0.59, 0.88, 1.18);
  const depth = THREE.MathUtils.clamp(width * 0.72, 0.59, 0.78);
  const skin = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.74, metalness: 0.01 });
  const shell = new THREE.Mesh(makeHeadGeometry(width, height, depth), skin);
  shell.name = 'estimated-head-shell';
  shell.position.y = 0.04;
  shell.castShadow = true;
  shell.receiveShadow = true;
  group.add(shell);

  const hairMaterial = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.88, metalness: 0.01 });
  const hair = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 36, 0, Math.PI * 2, 0, Math.PI * 0.58), hairMaterial);
  hair.name = 'inferred-hair-cap';
  hair.scale.set(width * 1.03, height * 0.44, depth * 0.82);
  hair.position.set(0, height * 0.62, depth * 0.24);
  hair.castShadow = true;
  group.add(hair);

  const earMaterial = new THREE.MeshStandardMaterial({ color: skinColor.clone().multiplyScalar(0.9), roughness: 0.8 });
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), earMaterial);
    ear.name = 'estimated-ear';
    ear.scale.set(width * 0.16, height * 0.21, depth * 0.2);
    ear.position.set(side * width * 0.91, -height * 0.02, 0);
    group.add(ear);
  }

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(width * 0.31, width * 0.38, height * 0.62, 36, 1, false),
    skin.clone(),
  );
  neck.name = 'estimated-neck';
  neck.position.set(0, -height * 1.16, -depth * 0.07);
  neck.castShadow = true;
  group.add(neck);
  group.userData.estimatedProportions = { width, height, depth };
  return group;
}

function disposeObject(object) {
  object?.traverse((child) => {
    if (!child.isMesh) return;
    child.geometry?.dispose();
    if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose());
    else child.material?.dispose();
    child.material?.map?.dispose();
  });
  object?.parent?.remove(object);
}

export async function createPortraitMesh(image) {
  const requestId = ++latestRequest;
  const landmarker = await getLandmarker();
  if (requestId !== latestRequest) throw new DOMException('Portrait request superseded.', 'AbortError');
  const result = landmarker.detect(image);
  const landmarks = result.faceLandmarks?.[0];
  if (!landmarks || landmarks.length < 300) {
    throw new Error('A front-facing face was not detected for the 3D portrait. Try a clear, forward-facing photo.');
  }

  const points = landmarks.length >= 478 ? landmarks.slice(0, 478) : landmarks.slice(0, 468);
  const eyeLeft = points[33];
  const eyeRight = points[263];
  const aspect = (image.naturalWidth || image.width) / (image.naturalHeight || image.height);
  const eyeAngle = Math.atan2(eyeRight.y - eyeLeft.y, (eyeRight.x - eyeLeft.x) * aspect);
  const cos = Math.cos(eyeAngle);
  const sin = Math.sin(eyeAngle);
  const eyeCenterX = (eyeLeft.x + eyeRight.x) / 2;
  const eyeCenterY = (eyeLeft.y + eyeRight.y) / 2;
  const aligned = points.map((point) => {
    const dx = (point.x - eyeCenterX) * aspect;
    const dy = point.y - eyeCenterY;
    return { x: dx * cos + dy * sin, y: -dx * sin + dy * cos };
  });
  const xs = aligned.map((point) => point.x);
  const ys = aligned.map((point) => point.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rawXs = points.map((point) => point.x * aspect);
  const rawYs = points.map((point) => point.y);
  const rawCenterX = (Math.min(...rawXs) + Math.max(...rawXs)) / 2;
  const rawCenterY = (Math.min(...rawYs) + Math.max(...rawYs)) / 2;
  const centerZ = points.reduce((sum, point) => sum + point.z, 0) / points.length;
  const faceWidth = Math.max(maxX - minX, 0.01);
  const faceHeight = Math.max(maxY - minY, 0.01);
  const scale = Math.min(1.45 / faceWidth, 2.0 / faceHeight);
  const points2d = points.map((point) => [point.x * aspect, point.y]);
  const triangles = Delaunator.from(points2d).triangles;
  const positions = new Float32Array(points.length * 3);
  const uvs = new Float32Array(points.length * 2);

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    positions[index * 3] = (point.x * aspect - rawCenterX) * scale;
    positions[index * 3 + 1] = (rawCenterY - point.y) * scale;
    positions[index * 3 + 2] = THREE.MathUtils.clamp(0.81 - (point.z - centerZ) * scale * 1.5, 0.58, 1.05) + 0.075;
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
  const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.76, metalness: 0, side: THREE.DoubleSide });
  const faceSurface = new THREE.Mesh(geometry, material);
  faceSurface.name = 'uploaded-photo-facial-surface';
  faceSurface.position.set(0, 0.05, 0);
  faceSurface.rotation.z = eyeAngle;
  faceSurface.userData.basePositions = positions.slice();
  const wireMaterial = new THREE.MeshBasicMaterial({ color: 0x70f0e6, wireframe: true, transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide });
  const wireOverlay = new THREE.Mesh(geometry, wireMaterial);
  wireOverlay.position.z = 0.003;
  wireOverlay.visible = false;
  faceSurface.add(wireOverlay);
  faceSurface.userData.wireOverlay = wireOverlay;
  faceSurface.userData.wireMaterial = wireMaterial;
  faceSurface.castShadow = true;
  faceSurface.receiveShadow = true;

  const avatar = makeAvatarShell(image, faceWidth, faceHeight);
  avatar.name = 'estimated-portrait-avatar';
  avatar.add(faceSurface);
  if (activeAvatar) disposeObject(activeAvatar);
  if (requestId !== latestRequest) {
    disposeObject(avatar);
    throw new DOMException('Portrait request superseded.', 'AbortError');
  }
  activeAvatar = avatar;
  activeAvatar.userData.faceSurface = faceSurface;
  activeAvatar.userData.animatedPositions = positions;
  return avatar;
}

export function animatePortrait(time, gaze = 'center') {
  const faceSurface = activeAvatar?.userData.faceSurface;
  if (!faceSurface) return;
  const position = faceSurface.geometry.attributes.position;
  const base = faceSurface.userData.basePositions;
  const irisIndices = position.count >= 478 ? [468, 469, 470, 471, 472, 473, 474, 475, 476, 477] : [];
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
  faceSurface.geometry.computeVertexNormals();
}

export function clearPortraitMesh() {
  latestRequest += 1;
  disposeObject(activeAvatar);
  activeAvatar = undefined;
}

export function setPortraitWireframe(visible) {
  const faceSurface = activeAvatar?.userData.faceSurface;
  if (faceSurface?.userData.wireOverlay) faceSurface.userData.wireOverlay.visible = visible;
}
