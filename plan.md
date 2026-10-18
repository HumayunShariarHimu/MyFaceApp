# MyFaceApp — Evidence-Based Implementation Plan

## Product goal and honest boundary

The app is a single-device, privacy-first portrait studio. A user may upload one 2D photo and explore an estimated, animated 3D facial avatar. The original uploaded 2D photo—not a generated avatar—may be compared with a fresh camera frame as an explicitly labeled, low-stakes 1:1 similarity demo. The 3D avatar, face matching, and presentation-attack detection (PAD/liveness) are separate systems and must never be presented as interchangeable.

A single RGB projection cannot reveal the unseen profile, rear head, hidden geometry or true depth uniquely. Any whole-head completion from one photo is model-inferred/plausible, not a scan or exact identity reconstruction. For observed geometry, the product must request multiple overlapping views/video or a depth scan. A face-matching score does not establish civil identity or liveness; the current app's fixed 0.52 threshold is a demo threshold, not a validated authenticator. See `research/face-tech-review.md`.

## Recommended implementation strategy

1. **Keep the current client-side intake private by default.** Accept one clear portrait, inspect face count/pose/quality locally, and provide explicit clear/delete behavior. No upload retention or training on user photos.
2. **Replace the misleading face-patch presentation before calling it a full avatar.** The existing MediaPipe/Delaunator pipeline produces a triangulated front facial surface. Keep it labeled as a 2.5D estimated facial surface until a distinct full-head asset path is implemented. Do not describe its unseen side as reconstructed.
3. **Separate avatar from verification.** The original photo is the reference; the camera frame is the probe. Never feed a generated/animated avatar as a real-person or liveness input. Keep similarity in demo mode until an independently evaluated model and locked operating threshold are available.
4. **Select reconstruction assets only after exact license and compute review.** DECA/MICA/EMOCA and most FLAME releases have non-commercial research restrictions; FaceLift weights have academic-research restrictions despite permissive code; 3DDFA-V2/PRNet code licenses do not settle weight rights. Do not silently package those assets as production-safe. A personal non-commercial prototype may evaluate a restricted model under its terms, but production redistribution/service requires permission.
5. **Use inference, not per-user model training.** One uploaded image is an inference input, not enough data to train a robust personalized face model. Fine-tuning requires consented multi-view/3D supervision, data rights, GPU compute, and separate validation. The app must not learn from user uploads by default.
6. **Offer a guided multi-view/depth-capture path only if the product scope changes.** Overlapping, sharp, consistently lit views improve geometric evidence; COLMAP is general SfM/MVS, not a face identity or avatar model. Any face-specific fitter, weights and downstream avatar rig require their own compatible licenses.
7. **Treat PAD as a separately licensed, separately evaluated later stage.** Fresh camera capture, matcher and PAD decisions must be distinct. A blink/head-turn prompt or face mesh is not a liveness guarantee. Do not claim certification, anti-spoofing or secure authentication without external evaluation.

## Existing stack and project structure

- `index.html`: one-page portrait intake, 3D exploration, and same-device similarity demo.
- `src/main.js`: upload lifecycle, Three.js scene, camera/view controls, and feature coordination.
- `src/portrait-mesh.js`: MediaPipe Face Landmarker landmark extraction, Delaunay front-surface construction, simple gaze/blink deformation.
- `src/face-engine.js`: local face-api model loading, one-face validation, descriptor creation, and uncalibrated Euclidean demo score.
- `src/verification.js`: explicit camera permission, fresh-frame comparison to the uploaded original, and camera cleanup.
- `src/styles.css`, `src/verification.css`: visual system and responsive styles.
- `public/models/`: model artifacts. Exact weight/license provenance must be reviewed before making production biometric claims or redistribution.
- `research/face-tech-review.md`: source-linked technology, license, privacy, compute, and evaluation review.
- `.github/workflows/deploy.yml`, `vite.config.js`: Vite build and GitHub Pages deployment.

## Design direction

Preserve the existing dark, neon-accented portrait-lab design. The interface should make uncertainty visible: separate stages for photo intake, estimated geometry, and live similarity; label generated surfaces as estimates; show that local comparison is not identity proof; ask for camera permission only on explicit action; stop camera tracks after capture; and visibly distinguish local processing from any future opt-in server processing. Avoid marketing language suggesting a real 3D scan, authentication, or liveness detection.

## Research basis

The source-linked review in `research/face-tech-review.md` covers monocular reconstruction (DECA, MICA, EMOCA, FaceLift, 3DDFA-V2, PRNet), multi-view capture/COLMAP, FLAME and glTF morph targets, MediaPipe browser landmarks/blendshapes, face-api.js/InsightFace matching, NIST 1:1/PAD, dataset/model licensing, compute, privacy and evaluation. Exact versions and assets must be rechecked before distribution because code, weights, datasets, textures and dependencies can have different terms.
