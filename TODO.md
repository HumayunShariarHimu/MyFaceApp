# Project outcomes

- [x] **2D portrait intake and local privacy:** প্রথম device-এ JPG/PNG/WEBP portrait upload/drag-drop হবে; preview, filename, file size ও remove action থাকবে; uploaded photo/descriptor app backend-এ persist হবে না.
- [ ] **User's 2D portrait থেকে পূর্ণ, জীবন্ত 3D face/head:** ব্যবহারকারী একটি নিজের 2D photo দেবেন; output-এ কেবল চোখ-নাক-মুখের floating patch নয়, ঘোরানো/দেখা যায় এমন পূর্ণ মুখ/মাথার avatar এবং animation থাকবে; output একই ব্যক্তির সঙ্গে দৃশ্যত মেলানোর চেষ্টা করবে। বর্তমান implementation শুধু MediaPipe landmark-ভিত্তিক frontal surface patch—এই criterion পূরণ হয়নি। এক ছবিতে unseen geometry জানা যায় না; full-head completion হলে সেটি estimated/generated বলে স্পষ্ট label দিতে হবে, scan/exact anatomy বলা যাবে না।
- [ ] **Same-device 1:1 photo/live-face comparison:** uploaded original portrait reference ও fresh camera frame browser-এ locally compare হবে; camera consent স্পষ্ট click-এ হবে; camera stream capture শেষে বন্ধ হবে; score-কে similarity/demo বলা হবে, identity proof বা liveness/PAD নয়। Current 0.52 threshold calibrated নয় এবং production verification criterion পূরণ করে না। Generated avatar কখনো live face/liveness input হিসেবে ব্যবহার হবে না.
- [x] **Research and architecture:** `research/face-tech-review.md`-এ এক-ছবির সীমা, 3D reconstruction/rigging/animation, matching/PAD, open-source candidates, license, compute, privacy ও evaluation-এর source-linked review আছে.
- [ ] **Model and asset clearance:** code, pretrained weights, datasets, textures এবং dependencies-এর exact license/provenance audit; commercial/service redistribution অধিকার না থাকলে restricted weights package/deploy হবে না. One user's photo-কে training data হিসেবে ব্যবহার করতে আলাদা informed opt-in লাগবে; default হলো no training.
- [ ] **Evaluation and safety:** representative consented data-তে avatar observed-region quality/pose/texture, matching FMR/FNMR ও threshold, এবং PAD-এর APCER/BPCER আলাদা করে assess করতে হবে; current prototype কোনো certified identity verification/liveness claim করবে না.
- [x] **Build and published site:** Vite production build GitHub Pages workflow-তে সফল হয়েছে; built assets, model files ও route manifest cache-busted live URL-এ HTTP 200 যাচাই করা হয়েছে.

## Accuracy and security notice

The current app is an estimated landmark-based facial surface plus an uncalibrated 1:1 descriptor demo. It does not provide a complete identity-faithful head scan, production authentication, presentation-attack detection, or liveness assurance.
