# MyFaceApp — Implementation Plan

## লক্ষ্য

ব্যবহারকারী একটি device-এ 2D portrait upload করবেন; browser single-image face landmarks দিয়ে likeness-ভিত্তিক আনুমানিক textured 3D face surface বানাবে, subtle gaze/blink animation ও interactive rotation দেখাবে। একই device-এর camera-র live frame upload করা portrait descriptor-এর সঙ্গে browser-এ compare হবে। 3D reconstruction ও identity descriptor আলাদা pipeline; কোনো user image/descriptor server-এ যাবে না। QR, pairing বা দ্বিতীয় device flow নেই।

## বাস্তবায়ন ও dependency

- বিদ্যমান Vite + Three.js codebase, upload UI ও interactive scene পুনর্ব্যবহার।
- `@mediapipe/tasks-vision` IMAGE FaceLandmarker থেকে 3D normalized landmarks; `delaunator` দিয়ে triangulated front-face surface; uploaded photo texture হিসেবে mesh-এ map। একক ছবির বাইরে থাকা geometry অনুমিত থাকবে।
- `@vladmandic/face-api`-এর Tiny Face Detector, 68-landmark model ও face-recognition model browser-এ load করে reference এবং live video frame descriptor তৈরি করা। 128-value descriptor-এ demo Euclidean distance; 0.52 threshold শুধু demonstration, operational target নয়।
- `verification.js` একই page-এর camera stream থেকে এক live frame নিয়ে uploaded reference-এর সঙ্গে 1:1 distance compare করে। Backend, QR, pairing, DB বা user account নেই।
- Browser security/permission: camera কেবল স্পষ্ট click-এর পরে, HTTPS-এ; এক capture-এর পর stream stop; photo, descriptor ও video frame browser memory-র বাইরে যায় না।
- GitHub Actions build করে Vite static artifact GitHub Pages-এ deploy করবে। Vite `base` local root ও repository Pages subpath অনুযায়ী বদলাবে।

## Project structure

- `index.html`: portrait UI, 3D viewer, same-device live-camera comparison UX.
- `src/main.js`: upload lifecycle, Three.js viewer, controls এবং module coordination.
- `src/portrait-mesh.js`: MediaPipe landmarks থেকে textured 3D face surface.
- `src/face-engine.js`: local model loading, descriptor extraction এবং 1:1 distance compare.
- `src/verification.js`: same-device camera permission/stream, one-frame comparison ও match status.
- `src/styles.css`, `src/verification.css`: base UI ও verification responsive styling.
- `public/models/`: locally bundled face-api weights ও MediaPipe model file.
- `public/manus-routes.json`: root page declaration.
- `.github/workflows/deploy.yml`: GitHub Pages build/deploy.
- `vite.config.js`: development root বনাম GitHub Pages base path.

## Design

**Style shortlist** (নিম্ন-সম্ভাবনার বিকল্পের সম্ভাবনা): clean clinic instrument panel — 0.04; editorial portrait atelier — 0.03; monochrome biometric console — 0.02. **নির্বাচিত:** বিদ্যমান dark-neon technical portrait lab; upload, 3D এবং camera output একই visual language-এ থাকবে।

- **Design movement:** contemporary instrument-panel UI এবং digital portrait studio.
- **Core principles:** স্থানীয় প্রক্রিয়াকরণ দৃশ্যমান; reference ও live capture আলাদা ধাপ; score-কে সত্যের দাবি না বানানো; camera consent স্পষ্ট.
- **Color philosophy:** deep navy grounding; teal live/ready states; violet spatial visualization; amber uncertainty/safety warnings.
- **Layout paradigm:** বামে portrait intake, ডানে বড় 3D canvas; নিচে wide camera/reference comparison stage; mobile-এ single-column.
- **Signature elements:** fine measurement grid; 3D face orbit accent; compact monospace stage metadata.
- **Interaction philosophy:** camera permission only after button click; capture শেষে camera stream বন্ধ; photo/reference clear control; one-shot comparison.
- **Animation:** gentle 3D rotation, eye-gaze shift and short blink morph on the estimated textured face surface; avoid claiming the animation proves identity or liveness; respect reduced-motion preference.
- **Typography:** Manrope headings/UI এবং DM Mono technical status/metric.
- **Brand essence:** নিজের portrait নিয়ে private 3D exploration ও transparent demo-level comparison; ব্যক্তিগত, প্রযুক্তিনির্ভর, সতর্ক.
- **Brand voice:** direct এবং measurable. উদাহরণ: “Reference stays in this browser.” / “A similarity score is not identity proof.”
- **Wordmark/logo:** angular M glyph-এর চারপাশে 3D orbit ring.
- **Signature color:** teal `#57e4df`.

## সীমা

Single image full-head 3D scan নয়। Browser descriptor + heuristic threshold production face authentication নয়। Camera feed থাকা মানেই robust liveness/PAD নয়; এই deliverable-এ certified PAD, injection defense বা high-impact authorization নেই।
