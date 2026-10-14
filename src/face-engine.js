import * as faceapi from '@vladmandic/face-api';

const MODEL_BASE = `${import.meta.env.BASE_URL}models`;
let loadPromise;

export function loadFaceModels() {
  if (!loadPromise) {
    loadPromise = (async () => {
      await faceapi.tf.ready();
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_BASE),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_BASE),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_BASE),
      ]);
    })().catch((error) => {
      loadPromise = undefined;
      throw error;
    });
  }
  return loadPromise;
}

export async function describeFace(source) {
  await loadFaceModels();
  const width = source.videoWidth || source.naturalWidth || source.width;
  const height = source.videoHeight || source.naturalHeight || source.height;
  const scale = Math.min(1, 640 / Math.max(width, height));
  const input = document.createElement('canvas');
  input.width = Math.max(1, Math.round(width * scale));
  input.height = Math.max(1, Math.round(height * scale));
  input.getContext('2d', { willReadFrequently: true }).drawImage(source, 0, 0, input.width, input.height);
  const results = await faceapi
    .detectAllFaces(input, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.45 }))
    .withFaceLandmarks()
    .withFaceDescriptors();
  if (results.length === 0) throw new Error('No clear face was found. Use one front-facing face with good lighting.');
  if (results.length !== 1) throw new Error('More than one face was found. Use a photo or camera view with one person only.');
  return Array.from(results[0].descriptor);
}

export function compareDescriptors(reference, candidate) {
  if (!Array.isArray(reference) || !Array.isArray(candidate) || reference.length !== 128 || candidate.length !== 128) {
    throw new Error('The face sample is invalid or incomplete.');
  }
  const distance = Math.sqrt(reference.reduce((sum, value, index) => sum + (value - candidate[index]) ** 2, 0));
  // This is a demo threshold, not a calibrated or certified authentication threshold.
  const demoThreshold = 0.52;
  return { distance, threshold: demoThreshold, matched: distance < demoThreshold };
}
