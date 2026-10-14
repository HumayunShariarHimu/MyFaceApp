import { compareDescriptors, describeFace, loadFaceModels } from './face-engine.js';

const $ = (id) => document.getElementById(id);
let referenceDescriptor = null;
let cameraStream = null;
let processing = false;
let referenceGeneration = 0;

function setVerificationStatus(message, kind = 'neutral') {
  const element = $('verificationStatus');
  if (!element) return;
  element.textContent = message;
  element.dataset.kind = kind;
}

export async function setReferenceFromImage(image) {
  const generation = ++referenceGeneration;
  referenceDescriptor = null;
  stopCamera(false);
  $('matchResult')?.classList.add('hidden');
  $('startCamera')?.setAttribute('disabled', '');
  setVerificationStatus('Preparing the face reference locally in this browser…');
  $('verificationReferenceState').textContent = 'Analyzing the uploaded portrait…';
  try {
    await loadFaceModels();
    const descriptor = await describeFace(image);
    if (generation !== referenceGeneration) return false;
    referenceDescriptor = descriptor;
    $('startCamera')?.removeAttribute('disabled');
    $('verificationReferenceState').textContent = 'Reference face ready on this device';
    setVerificationStatus('Reference ready. Start this device’s camera to compare your live face.', 'ready');
    return true;
  } catch (error) {
    if (generation !== referenceGeneration) return false;
    $('verificationReferenceState').textContent = 'Could not create a reference';
    setVerificationStatus(error.message || 'Could not analyze this photo.', 'error');
    return false;
  }
}

export function clearVerificationReference() {
  referenceGeneration += 1;
  referenceDescriptor = null;
  stopCamera(false);
  $('startCamera')?.setAttribute('disabled', '');
  $('matchResult')?.classList.add('hidden');
  $('verificationReferenceState').textContent = 'Upload a portrait to prepare a reference';
  setVerificationStatus('Upload one clear portrait. Image and face data stay in this browser.', 'neutral');
}

export function initVerification() {
  $('startCamera')?.setAttribute('disabled', '');
  $('startCamera')?.addEventListener('click', startCamera);
  $('captureMatch')?.addEventListener('click', captureAndCompare);
  $('stopCamera')?.addEventListener('click', () => stopCamera(true));
}

async function startCamera() {
  if (!referenceDescriptor) {
    setVerificationStatus('Upload and analyze a portrait before opening the camera.', 'error');
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    setVerificationStatus('Camera access needs HTTPS and a supported browser.', 'error');
    return;
  }
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
    });
    const video = $('liveVideo');
    video.srcObject = cameraStream;
    await video.play();
    $('cameraPreview')?.classList.remove('hidden');
    $('cameraPlaceholder')?.classList.add('hidden');
    $('startCamera')?.classList.add('hidden');
    $('stopCamera')?.classList.remove('hidden');
    $('captureMatch')?.removeAttribute('disabled');
    setVerificationStatus('Camera is live on this device. Center one face, then capture a frame for local comparison.', 'ready');
  } catch (error) {
    cameraStream = null;
    setVerificationStatus(error.name === 'NotAllowedError' ? 'Camera permission was denied. Allow camera access and try again.' : `Could not open the camera: ${error.message}`, 'error');
  }
}

async function captureAndCompare() {
  if (processing) return;
  if (!referenceDescriptor) {
    setVerificationStatus('Upload a reference portrait first.', 'error');
    return;
  }
  const video = $('liveVideo');
  if (!cameraStream || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    setVerificationStatus('Wait for the live camera image, then try again.', 'error');
    return;
  }
  processing = true;
  $('captureMatch')?.setAttribute('disabled', '');
  setVerificationStatus('Analyzing one live camera frame locally…');
  try {
    const liveDescriptor = await describeFace(video);
    const result = compareDescriptors(referenceDescriptor, liveDescriptor);
    const progress = (1 - result.distance / result.threshold) * 100;
    if (result.matched) {
      setVerificationStatus(`Face samples are similar in this demo (distance ${result.distance.toFixed(3)}). This is not identity proof.`, 'match');
    } else {
      setVerificationStatus(`No demo match (distance ${result.distance.toFixed(3)}). Check lighting, camera angle, or portrait quality.`, 'nomatch');
    }
    $('matchDistance').textContent = `${result.distance.toFixed(3)} / ${result.threshold.toFixed(2)} demo threshold`;
    $('matchMeter').style.setProperty('--match-progress', `${Math.max(0, Math.min(100, progress))}%`);
    $('matchResult')?.classList.remove('hidden');
  } catch (error) {
    setVerificationStatus(error.message || 'Could not compare these samples.', 'error');
  } finally {
    processing = false;
    stopCamera(false);
  }
}

function stopCamera(updateMessage = true) {
  cameraStream?.getTracks().forEach((track) => track.stop());
  cameraStream = null;
  const video = $('liveVideo');
  if (video) video.srcObject = null;
  $('cameraPreview')?.classList.add('hidden');
  $('cameraPlaceholder')?.classList.remove('hidden');
  $('startCamera')?.classList.remove('hidden');
  $('stopCamera')?.classList.add('hidden');
  $('captureMatch')?.setAttribute('disabled', '');
  if (updateMessage) setVerificationStatus('Camera stopped. No live frame was saved by this app.', 'neutral');
}

window.addEventListener('pagehide', () => stopCamera(false));
