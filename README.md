# MyFaceApp — 3D Portrait Avatar ও Live Face Similarity

MyFaceApp একটি এক-device portrait workspace। পরিষ্কার একক 2D photo থেকে MediaPipe Face Landmarker মুখের landmarks বের করে; সেই photo-র textured front-face surface-কে একটি locally generated, rotatable estimated head shell (head volume, hair cap, ears, neck)-এর সঙ্গে যুক্ত করা হয়। Three.js-এ auto-rotation, drag/zoom, preset views, wireframe, eye-gaze ও blink mesh animation আছে। একই device-এর live camera frame-কে **মূল uploaded photo**-র সঙ্গে আলাদা 1:1 similarity demo-তে compare করা যায়।

## ব্যবহার

1. JPG/PNG/WEBP, সর্বোচ্চ 12 MB, একটিমাত্র সামনে-তাকানো মুখসহ upload করুন; ভালো আলো, sharp focus, খোলা মুখের contour এবং কম occlusion ফল উন্নত করে।
2. inference শেষ হলে drag/touch করে head ঘোরান, wheel/pinch-এ zoom করুন; front/three-quarter/side view, auto-rotation, gaze ও wireframe ব্যবহার করুন। Upload-এর পর সামনের দৃশ্য photo-textured landmark surface; পাশ/পেছন procedural model-prior দিয়ে অনুমান করা head shell—কোনোটিই scan নয়।
3. Face comparison চাইলে `Start camera` চাপুন, permission দিন, একটি live frame capture করুন। Browser uploaded original ও probe-র face descriptor compare করে; capture-এর পর camera stream বন্ধ হয়।
4. ছবি সরাতে Remove চাপুন। Page refresh/close করলে in-memory photo, descriptor ও frame অ্যাপের server-এ সংরক্ষিত হয় না।

Live site: https://humayunshariarhimu.github.io/MyFaceApp/ . HTTPS camera permission-এর জন্য প্রয়োজন।

## 3D ও animation-এর প্রকৃত সীমা

একটি ordinary 2D ছবি থেকে অদেখা profile, rear head, true depth, ears-এর পেছন, চুলের volume বা occlusion-এর নিচের geometry uniquely recover করা অসম্ভব। বর্তমান implementation-এ বাস্তব front photo-র landmarks/texture আছে; মাথার পাশ/পেছন, ears, hair cap ও neck হলো code-এ locally তৈরি করা plausible procedural completion। Foto-driven exact 360° identity-faithful scan, learned personalized 3D model, measured anatomy কিংবা photorealistic generative reconstruction নয়। একাধিক overlapping angle/video বা depth scan বেশি geometry evidence দেয়; pretrained reconstruction model inference করতে পারে, কিন্তু license-clear commercial model/weights না পাওয়া পর্যন্ত restricted research assets ship করা হয়নি।

Blink/gaze হলো landmark surface-এর subtle mesh motion; এটি natural facial performance capture নয়, nor proof of liveness. High-fidelity mouth/cheek/jaw animation-এর জন্য compatible facial rig/blendshape model, expression capture data এবং license-cleared model দরকার।

## Matching, liveness ও model learning

`@vladmandic/face-api` browser-এ descriptor তৈরি করে; বর্তমান 0.52 Euclidean threshold কেবল demo constant, representative held-out population/device dataset-এ calibrated নয়। Result similarity signal—identity proof, secure login/authentication, 1:N identity search বা reliable biometric verification নয়। Liveness/PAD আলাদা problem; camera stream বা blink/head-turn নিজে spoof detection প্রমাণ করে না। High-impact ব্যবহারে অ্যাপটি ব্যবহার করবেন না।

একটি upload থেকে নতুন model train হয় না। এখানে pretrained face/landmark model-এর inference হচ্ছে। Personalization training-এর জন্য user consent, বহু-view/3D supervision, data rights, GPU compute এবং স্বাধীন evaluation প্রয়োজন; user uploads default-এ training data নয়।

## Privacy

- Face photo/descriptor/camera frame browser memory-তে থাকে; application backend-এ upload/persist হয় না। Camera শুধু user click-এর পর খোলে।
- MediaPipe WASM বর্তমান build-এ jsDelivr CDN থেকে load হয়; তাই প্রথম load-এ browser ওই third party-তে network request করে। ছবি/ভিডিও তাতে পাঠানো হয় না।
- Clear/close করলে app-side in-memory reference শেষ হয়। Browser/devtools/network extensions বা OS-level capture-এর বিরুদ্ধে এটি privacy guarantee নয়।
- Visible photo-তে অন্য কেউ থাকলে তাদের সম্মতি ছাড়া ব্যবহার করবেন না।

## Development

Node.js 20.19+ বা 22.12+:

```bash
npm ci
npm run start
```

Production:

```bash
npm run build
npm run preview
```

`src/portrait-mesh.js` landmarks দিয়ে photo-textured face surface ও procedural estimated avatar shell তৈরি করে। `src/main.js` Three.js scene/UI নিয়ন্ত্রণ করে। `src/face-engine.js` local face descriptor ও demo distance তৈরি করে। `src/verification.js` same-device permission/capture/cleanup flow নিয়ন্ত্রণ করে। `research/face-tech-review.md` source-linked model, license, compute, privacy ও evaluation review।

## License reminder

Project source MIT/open license ধরে নেওয়া যাবে না যতক্ষণ repository-তে স্পষ্ট license নেই। Dependencies, bundled face-api weights, MediaPipe model/WASM, datasets ও downloadable avatar assets-এর exact version/terms আলাদাভাবে audit করতে হবে। DECA/MICA/EMOCA/অনেক FLAME version এবং FaceLift weights-এর মতো research-only assets production-এ অনুমতি ছাড়া যোগ করবেন না। Open repo code license মানেই weights-এর permission নয়।

## Deploy

Push to `main` runs `.github/workflows/deploy.yml`, Vite build করে GitHub Pages artifact deploy করে। GitHub Settings → Pages → Build and deployment source `GitHub Actions` হতে হবে.

## Sources

- Technical/open-source review: `research/face-tech-review.md`
- [MediaPipe Face Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker)
- [NIST FRTE 1:1 verification](https://pages.nist.gov/frvt/html/frvt11.html)
- [NIST FATE PAD](https://pages.nist.gov/frvt/html/frvt_pad.html)
- [ISO/IEC 30107-1](https://www.iso.org/standard/83828.html)
