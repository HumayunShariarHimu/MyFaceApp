# MyFaceApp — 3D Portrait ও Face Match

MyFaceApp হলো একটি single-device browser portrait workspace। 2D photo থেকে MediaPipe facial landmarks ব্যবহার করে textured, estimated 3D face surface তৈরি হয়; subtle eye-gaze/blink motion ও interactive rotation থাকে। একই device-এর live camera frame browser-এর ভেতর photo reference-এর সঙ্গে 1:1 তুলনা হয়।

## কীভাবে ব্যবহার করবেন

1. এই device-এ JPG, PNG বা WEBP portrait (সর্বোচ্চ 12 MB) বেছে নিন। ছবিতে একটিমাত্র সামনে-তাকানো মুখ ও পর্যাপ্ত আলো রাখুন।
2. Browser-এ landmarks ও face descriptor তৈরি হবে। 3D panel-এ portrait-এর textured face surface দেখুন; drag করে ঘোরান, camera preset ও gaze controls ব্যবহার করুন।
3. `Start camera` চাপুন এবং camera permission দিন; তারপর `Capture & compare` চাপলে একই device-এর একটি live frame reference portrait-এর সঙ্গে compare হবে। Capture শেষে camera বন্ধ হয়।

Camera access-এর জন্য HTTPS দরকার। GitHub Pages-এর site URL: https://humayunshariarhimu.github.io/MyFaceApp/ .

## গোপনীয়তা

- Reference image, live camera frame এবং face descriptor browser-এ স্থানীয়ভাবে process হয়; app কোনো backend-এ সেগুলো upload বা persist করে না।
- কোনো QR, pairing বা দ্বিতীয় device flow নেই। Photo, face descriptor ও live camera frame এই browser-এর memory-তে থাকে; app server-এ পাঠায় না।
- Camera শুধু ব্যবহারকারী বোতাম চাপলে খোলে; একবার capture/compare হলে stream থামে। App কোনো ছবি বা frame সংরক্ষণ করে না।

## নির্ভুলতা ও নিরাপত্তার সীমা

একটি 2D ছবি দিয়ে পুরো 3D মুখের অদেখা পাশ/পেছনের geometry উদ্ধার করা যায় না। এখানে 3D mesh হলো MediaPipe-এর single-image landmark-ভিত্তিক আনুমানিক face surface, যার ওপর মূল photo texture করা হয়; এটি 3D scan বা photorealistic full-head reconstruction নয়।

Face matching-এ `@vladmandic/face-api` Tiny Face Detector/descriptor pipeline ও 0.52 Euclidean-distance demo threshold ব্যবহৃত হয়েছে। Threshold ব্যক্তিগত dataset-এ calibrate করা হয়নি; ফলটি আনুমানিক sample similarity, identity proof বা probability নয়। App-এ certified liveness / presentation-attack detection (PAD), camera injection protection, device integrity verification বা red-team validation নেই। Account access, financial, legal, medical বা অন্য high-impact decisions-এ এটি ব্যবহার করবেন না।

এটি uploaded reference ও একই device-এর একটি camera frame-এর 1:1 comparison; 1:N database search নয়। Production deployment-এর আগে model/threshold-এর independent accuracy evaluation, PAD test, security review, biometric-data consent/retention design, legal review এবং false-accept/false-reject risk controls প্রয়োজন।

## Local development

Node.js 20.19+ বা 22.12+:

```bash
npm ci
npm run start
```

Production build ও preview:

```bash
npm run build
npm run preview
```

Face recognition model assets `public/models/`-এ bundled। MediaPipe WASM jsDelivr CDN থেকে load হয়; MediaPipe face-landmarker model asset local `public/models/`-এ আছে.

## Deployment

`main` branch-এ push হলেই `.github/workflows/deploy.yml` build করে GitHub Pages-এ প্রকাশ করে। Repository Settings → Pages → Build and deployment-এ `GitHub Actions` source চালু থাকতে হবে.

## প্রযুক্তি ও সূত্র

Three.js 3D rendering, MediaPipe Tasks Vision 3D face landmarks, `@vladmandic/face-api` browser-side face descriptor.

- NIST FRTE 1:1 verification: https://pages.nist.gov/frvt/html/frvt11.html
- ISO/IEC 30107-3:2023 PAD testing/reporting: https://www.iso.org/standard/79520.html
- MediaPipe Face Landmarker: https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker
