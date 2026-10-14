import * as THREE from 'three';
import './styles.css';
import './verification.css';
import { animatePortrait, clearPortraitMesh, createPortraitMesh, setPortraitWireframe } from './portrait-mesh.js';
import { clearVerificationReference, initVerification, setReferenceFromImage } from './verification.js';

const $ = (id) => document.getElementById(id);
const host = $('canvasHost');
const loading = $('viewerLoading');
const dropZone = $('dropZone');
const fileInput = $('fileInput');
const portraitPreview = $('portraitPreview');
const previewWrap = $('previewWrap');
const emptyUpload = $('emptyUpload');
const fileMeta = $('fileMeta');
const fileName = $('fileName');
const fileSize = $('fileSize');
const statusMessage = $('statusMessage');

let currentObjectUrl = null;
let scene, camera, renderer, headGroup, headMesh, wireMesh, autoRotate = true;
let currentView = 'front';
let currentExpression = 'center';
let photoSurfaceActive = false;
let dragging = false, pointerX = 0, pointerY = 0, targetRotY = 0, targetRotX = 0;
let eyeMeshes = [];
let resizeObserver;

function setStatus(message, error = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle('error', error);
}

function validateFile(file) {
  if (!file) return false;
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    setStatus('Unsupported file type. Please choose a JPG, PNG, or WEBP image.', true);
    return false;
  }
  if (file.size > 12 * 1024 * 1024) {
    setStatus('That image is larger than 12 MB. Choose a smaller image.', true);
    return false;
  }
  return true;
}

function loadPortrait(file) {
  if (!validateFile(file)) return;
  clearPortraitMesh();
  photoSurfaceActive = false;
  headGroup?.children.forEach((child) => { child.visible = true; });
  clearVerificationReference();
  if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
  currentObjectUrl = URL.createObjectURL(file);
  portraitPreview.onload = () => {
    setStatus('Portrait loaded. Building a landmark-based 3D estimate and local matching reference…');
    setReferenceFromImage(portraitPreview);
    createPortraitMesh(portraitPreview).then((mesh) => {
      if (!headGroup) return;
      headGroup.add(mesh);
      setPortraitWireframe($('wireframe').checked);
      headGroup.children.forEach((child) => { child.visible = child === mesh || child.name === 'portrait-orbit'; });
      photoSurfaceActive = true;
      targetRotY = 0;
      targetRotX = 0;
      autoRotate = true;
      $('autoRotate').checked = true;
      setStatus('Your portrait likeness is active in the estimated 3D view. It rotates gently and the eyes move/blink; drag for more angles.');
    }).catch((error) => {
      if (error.name === 'AbortError') return;
      console.error('3D portrait reconstruction failed', error);
      setStatus(error.message || 'Could not build the 3D face estimate. The portrait preview is still available.', true);
    });
  };
  portraitPreview.onerror = () => setStatus('The image could not be opened. Try another file.', true);
  portraitPreview.src = currentObjectUrl;
  emptyUpload.classList.add('hidden');
  previewWrap.classList.remove('hidden');
  fileMeta.classList.remove('hidden');
  fileName.textContent = file.name;
  fileSize.textContent = formatBytes(file.size);
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function clearPortrait(event) {
  event?.stopPropagation();
  if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
  currentObjectUrl = null;
  clearPortraitMesh();
  clearVerificationReference();
  photoSurfaceActive = false;
  headGroup?.children.forEach((child) => { child.visible = true; });
  portraitPreview.removeAttribute('src');
  fileInput.value = '';
  previewWrap.classList.add('hidden');
  emptyUpload.classList.remove('hidden');
  fileMeta.classList.add('hidden');
  setStatus('Portrait cleared from the workspace. Choose another image whenever you are ready.');
}

dropZone.addEventListener('click', (event) => {
  if (event.target.closest('#removePhoto')) return;
  fileInput.click();
});
dropZone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    fileInput.click();
  }
});
fileInput.addEventListener('change', (event) => loadPortrait(event.target.files?.[0]));
$('removePhoto').addEventListener('click', clearPortrait);
for (const eventName of ['dragenter', 'dragover']) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add('dragover');
  });
}
for (const eventName of ['dragleave', 'drop']) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove('dragover');
  });
}
dropZone.addEventListener('drop', (event) => {
  const file = event.dataTransfer?.files?.[0];
  if (file) loadPortrait(file);
});

function material(color, roughness = 0.6, metalness = 0.05) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function createFaceGeometry() {
  const geometry = new THREE.SphereGeometry(1, 64, 48);
  const position = geometry.attributes.position;
  // Sculpt a stylized oval head from a sphere; this is generic geometry, not photo reconstruction.
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
    const lowerNarrow = THREE.MathUtils.smoothstep(y, -0.8, 0.15);
    const width = 0.77 + lowerNarrow * 0.23;
    const cheek = Math.exp(-Math.pow((Math.abs(x) - 0.58) / 0.22, 2)) * Math.exp(-Math.pow((y + 0.03) / 0.4, 2));
    const jaw = Math.max(0, -y) * 0.07;
    position.setXYZ(i, x * width + Math.sign(x) * cheek * 0.035, y * 1.17, z * 0.82 + jaw);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function addSphere(parent, name, pos, scale, mat, segments = 32) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, segments, Math.max(16, segments / 2)), mat);
  mesh.name = name;
  mesh.position.set(...pos);
  mesh.scale.set(...scale);
  parent.add(mesh);
  return mesh;
}

function addCurve(parent, points, radius, mat, tubularSegments = 32) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, tubularSegments, radius, 8, false), mat);
  parent.add(mesh);
  return mesh;
}

function buildHead() {
  headGroup = new THREE.Group();
  const skin = material('#b98578', 0.7, 0.02);
  const skinLight = material('#d4a095', 0.67, 0.02);
  const shadow = material('#593e49', 0.75);
  const dark = material('#18202e', 0.35, 0.12);
  const iris = material('#4fe0d6', 0.28, 0.2);
  const lips = material('#8c5361', 0.5);
  const headGeo = createFaceGeometry();
  headMesh = new THREE.Mesh(headGeo, skin);
  headMesh.position.y = 0.05;
  headMesh.castShadow = true;
  headMesh.receiveShadow = true;
  headGroup.add(headMesh);

  // Ears
  for (const side of [-1, 1]) {
    const ear = addSphere(headGroup, 'ear', [side * 0.78, -0.02, 0.0], [0.15, 0.25, 0.12], skinLight);
    ear.rotation.z = side * -0.12;
    addSphere(headGroup, 'ear-inner', [side * 0.81, -0.015, 0.087], [0.055, 0.13, 0.025], shadow);
  }

  // Eyes, brows and pupils
  eyeMeshes = [];
  for (const side of [-1, 1]) {
    addSphere(headGroup, 'eye-socket', [side * 0.31, 0.17, 0.66], [0.205, 0.12, 0.105], shadow);
    const eye = addSphere(headGroup, 'eye', [side * 0.31, 0.17, 0.735], [0.15, 0.075, 0.055], material('#f1e6df', 0.28));
    eyeMeshes.push(eye);
    addSphere(headGroup, 'iris', [side * 0.31, 0.17, 0.785], [0.045, 0.047, 0.018], iris);
    addSphere(headGroup, 'pupil', [side * 0.31, 0.17, 0.8], [0.018, 0.027, 0.01], dark);
    addSphere(headGroup, 'eye-glint', [side * 0.322, 0.188, 0.811], [0.009, 0.01, 0.006], material('#ffffff', 0.15));
    addCurve(headGroup, [[side * 0.15, 0.31, 0.69], [side * 0.28, 0.36, 0.72], [side * 0.43, 0.33, 0.66]], 0.025, dark);
  }

  // Nose bridge, tip, and nostrils
  addSphere(headGroup, 'nose-bridge', [0, -0.005, 0.72], [0.105, 0.26, 0.12], skinLight);
  addSphere(headGroup, 'nose-tip', [0, -0.15, 0.81], [0.15, 0.105, 0.1], skinLight);
  for (const side of [-1, 1]) addSphere(headGroup, 'nostril', [side * 0.08, -0.205, 0.855], [0.032, 0.018, 0.014], shadow);

  // Mouth and subtle facial contours
  addSphere(headGroup, 'upper-lip', [0, -0.36, 0.715], [0.22, 0.045, 0.045], lips);
  addCurve(headGroup, [[-0.2, -0.36, 0.74], [-0.09, -0.34, 0.76], [0, -0.365, 0.77], [0.09, -0.34, 0.76], [0.2, -0.36, 0.74]], 0.012, skinLight);
  addSphere(headGroup, 'lower-lip', [0, -0.405, 0.715], [0.16, 0.025, 0.037], skinLight);

  // Minimal neck and shoulder bust
  addSphere(headGroup, 'neck', [0, -0.94, -0.02], [0.29, 0.43, 0.28], skin);
  addSphere(headGroup, 'shoulders', [0, -1.27, -0.12], [0.73, 0.25, 0.36], material('#253247', 0.55, 0.12));
  addCurve(headGroup, [[-0.47, -1.28, 0.19], [-0.22, -1.15, 0.2], [0, -1.19, 0.22], [0.22, -1.15, 0.2], [0.47, -1.28, 0.19]], 0.012, iris);
  scene.add(headGroup);

  // Fine orbit-like accents around the head
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x4b9caa, transparent: true, opacity: 0.27 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.003, 8, 128), ringMat);
  ring.rotation.x = Math.PI / 2.8;
  ring.position.y = -0.1;
  ring.name = 'portrait-orbit';
  headGroup.add(ring);

  wireMesh = new THREE.Mesh(headGeo.clone(), new THREE.MeshBasicMaterial({ color: 0x70f0e6, wireframe: true, transparent: true, opacity: 0.24 }));
  wireMesh.position.copy(headMesh.position);
  wireMesh.visible = false;
  headGroup.add(wireMesh);
}

function initThree() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#0d1521');
  camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0.02, 5.8);
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  host.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xbad8ff, 0x33283e, 2.0));
  const key = new THREE.DirectionalLight(0xffd8c2, 3.2); key.position.set(2.5, 3.5, 4); key.castShadow = true; scene.add(key);
  const rim = new THREE.PointLight(0x55e8df, 18, 9); rim.position.set(-2, 1, -1.2); scene.add(rim);
  const fill = new THREE.PointLight(0x8974ff, 9, 8); fill.position.set(2, -1, 2); scene.add(fill);

  buildHead();
  resizeObserver = new ResizeObserver(resizeRenderer);
  resizeObserver.observe(host);
  resizeRenderer();
  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
  loading.classList.add('hidden');
  renderer.setAnimationLoop(animate);
}

function resizeRenderer() {
  if (!renderer || !camera) return;
  const width = Math.max(1, host.clientWidth);
  const height = Math.max(1, host.clientHeight);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function onPointerDown(event) {
  dragging = true; pointerX = event.clientX; pointerY = event.clientY;
  renderer.domElement.setPointerCapture?.(event.pointerId);
}
function onPointerMove(event) {
  if (!dragging) return;
  const dx = event.clientX - pointerX, dy = event.clientY - pointerY;
  pointerX = event.clientX; pointerY = event.clientY;
  targetRotY += dx * 0.008;
  targetRotX = THREE.MathUtils.clamp(targetRotX + dy * 0.006, -0.45, 0.45);
  $('viewState').textContent = Math.abs(targetRotY) < 0.3 ? 'FRONT VIEW' : Math.abs(targetRotY) > 1.25 ? 'SIDE VIEW' : 'ROTATED VIEW';
}
function onPointerUp() { dragging = false; }
function onWheel(event) {
  event.preventDefault();
  camera.position.z = THREE.MathUtils.clamp(camera.position.z + event.deltaY * 0.004, 4.3, 7.8);
}

function setView(view) {
  currentView = view;
  const angles = { front: 0, threequarter: 0.72, side: 1.48 };
  targetRotY = angles[view] ?? 0;
  targetRotX = 0;
  $('viewState').textContent = view === 'front' ? 'FRONT VIEW' : view === 'side' ? 'SIDE VIEW' : 'THREE-QUARTER';
  document.querySelectorAll('[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === view));
}
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));

function setExpression(expression) {
  currentExpression = expression;
  if (!photoSurfaceActive) {
    const gazeOffset = expression === 'left' ? -0.045 : expression === 'right' ? 0.045 : 0;
    headGroup.traverse((obj) => {
      if (['iris', 'pupil', 'eye-glint'].includes(obj.name)) {
        if (obj.userData.gazeBaseX === undefined) obj.userData.gazeBaseX = obj.position.x;
        obj.position.x = obj.userData.gazeBaseX + gazeOffset;
      }
    });
  }
  document.querySelectorAll('[data-expression]').forEach(button => button.classList.toggle('active', button.dataset.expression === expression));
}
document.querySelectorAll('[data-expression]').forEach(button => button.addEventListener('click', () => setExpression(button.dataset.expression)));

$('autoRotate').addEventListener('change', (event) => { autoRotate = event.target.checked; });
$('wireframe').addEventListener('change', (event) => {
  if (photoSurfaceActive) setPortraitWireframe(event.target.checked);
  else if (wireMesh) wireMesh.visible = event.target.checked;
});
$('resetView').addEventListener('click', () => {
  setView('front');
  camera.position.set(0, 0.02, 5.8);
  $('autoRotate').checked = true; autoRotate = true;
  $('wireframe').checked = false; if (wireMesh) wireMesh.visible = false;
  setExpression('center');
});
function animate() {
  if (!renderer || !scene) return;
  if (headGroup) {
    if (autoRotate && !dragging) targetRotY += 0.00045;
    headGroup.rotation.y += (targetRotY - headGroup.rotation.y) * 0.07;
    headGroup.rotation.x += (targetRotX - headGroup.rotation.x) * 0.07;
    const time = performance.now() * 0.001;
    headGroup.position.y = Math.sin(time * 0.8) * 0.012;
    animatePortrait(time, currentExpression);
  }
  renderer.render(scene, camera);
}

$('helpBtn').addEventListener('click', () => $('helpDialog').showModal());
$('closeHelp').addEventListener('click', () => $('helpDialog').close());
$('gotIt').addEventListener('click', () => $('helpDialog').close());
$('helpDialog').addEventListener('click', (event) => {
  if (event.target === $('helpDialog')) $('helpDialog').close();
});

try {
  initVerification();
  initThree();
} catch (error) {
  console.error(error);
  loading.classList.remove('hidden');
  loading.innerHTML = '<span>3D view could not start in this browser.</span><span style="font-size:9px">Try a modern browser with WebGL enabled.</span>';
  setStatus('The interactive 3D viewer could not start. Check whether WebGL is enabled in your browser.', true);
}
