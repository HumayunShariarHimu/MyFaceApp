# MyFaceApp — Evidence-Based Implementation Plan

## লক্ষ্য

এক-device portrait studio: ব্যবহারকারী 2D photo upload করে local 3D viewer-এ ঘোরানো photo-led estimated head avatar দেখবেন; একই app-এ চাইলে মূল uploaded photo-কে fresh live camera frame-এর সঙ্গে আলাদা low-stakes 1:1 similarity demo করবেন। Avatar output, biometric matching ও liveness/PAD আলাদা feature ও আলাদা দাবি।

## বর্তমান avatar implementation

`src/portrait-mesh.js` MediaPipe Face Landmarker থেকে face landmarks নিয়ে uploaded image-কে textured frontal surface-এ map করে। এটিকে procedural 3D head shell, hair cap, ears ও neck-এর সামনে fit করে Three.js group হিসেবে ফেরত দেয়। Surface-এ subtle gaze/blink mesh motion আছে; পুরো head auto-rotate, drag/preset view ও zoom সমর্থন করে। Face shell-এর proportions ও skin/hair palette ছবির face-box/color sample থেকে অনুমান করা হয়।

এটি আগের face-patch-only render-এর চেয়ে সম্পূর্ণ rotatable head silhouette দেয়, কিন্তু এটি learned AI full-head reconstruction বা আসল ব্যক্তির অদেখা পাশের উদ্ধার নয়। Front-এ photo pixels বেশি পরিচিত; profile/back, hair volume এবং কান/ঘাড়ের geometry generic/procedural estimates। এক ছবি থেকে সেগুলো uniquely জানা যায় না। UI ও README এই পার্থক্য প্রকাশ করবে; full scan/photoreal/identity-faithful দাবি করা যাবে না। Exact visual reconstruction চাইলে বহু-angle video/depth input এবং compatible commercial license-সহ pretrained model service প্রয়োজন।

## Matching, model use এবং safety

- Face-api pretrained browser models inference-এর জন্য চলে; user image থেকে model train হয় না এবং uploads default training data নয়।
- Original reference photo ও fresh camera frame descriptor locally compare হয়; generated avatar matcher reference বা liveness evidence নয়। বর্তমান 0.52 distance threshold demo-only, production calibration নয়।
- Camera permission explicit user action-এ; capture/stop/page hide হলে stream tracks বন্ধ হয়। Source photo/frame/descriptor app backend-এ persist হয় না। MediaPipe WASM CDN থেকে load হয়, কিন্তু image/video server-এ যায় না।
- Blink/head-turn animation PAD নয়। No certified liveness, camera injection defense, account authentication or high-impact access decision.
- Research report-এর license matrix অনুসরণ করে exact model/weight/dataset/texture/dependency clear না হলে model asset যোগ/redistribute নয়। One image fine-tuning-এর পর্যাপ্ত training set নয়।

## Project structure

- `index.html`: upload, 3D viewer, similarity workflow ও limitation labels.
- `src/main.js`: Three.js scene, upload lifecycle, view/expression controls.
- `src/portrait-mesh.js`: landmark inference, textured face surface, procedural head-shell completion, gaze/blink deformation.
- `src/face-engine.js`: local model inference, one-face checks, demo similarity distance.
- `src/verification.js`: camera permission, fresh-frame capture, comparison status ও stream cleanup.
- `src/styles.css`, `src/verification.css`: responsive styling.
- `public/models/`: bundled model artifacts; distribution rights আলাদাভাবে audit করতে হবে.
- `research/face-tech-review.md`: source-linked technical, license/privacy and evaluation research.
- `.github/workflows/deploy.yml`, `vite.config.js`: Pages deployment/build configuration.

## Design

বিদ্যমান portrait-lab look বজায়: deep navy canvas, teal/violet spatial accents, clear local-processing status এবং uncertainty-র জন্য amber cues। UI-তে front photo-surface বনাম inferred head shell আলাদা করে বলা হবে। Camera শুধু explicit click-এর পর; capture শেষে বন্ধ। 3D motion gentle, user interaction-এ responsive, reduced-motion preference সম্মান করবে।
