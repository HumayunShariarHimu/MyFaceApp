# Project outcomes

- [x] **2D portrait intake ও privacy:** প্রথম device-এ JPG/PNG/WEBP (সর্বোচ্চ 12 MB) upload/drag-drop হবে; preview, filename, file size ও remove action থাকবে; photo app backend-এ upload বা persist হবে না।
- [x] **Photo likeness-এর animated estimated 3D surface:** uploaded portrait-এর landmarks দিয়ে textured 3D face surface বানবে; rotate/zoom করা যাবে এবং gaze/blink motion থাকবে; unseen geometry estimate বলে জানানো হবে, full 3D scan দাবি হবে না।
- [x] **এক-device live-camera 1:1 matching:** একই browser/device-এ camera permission স্পষ্ট click-এ চাইবে; live frame থেকে face descriptor নিয়ে uploaded portrait reference-এর সঙ্গে demo threshold-এ compare করবে; result, distance ও limitation দেখাবে; capture শেষে camera stream বন্ধ হবে। কোনো QR, pairing বা দ্বিতীয় device flow নেই।
- [ ] **Engineering validation:** production build, route manifest, asset paths, browser permission flow, model loading এবং deployment action যাচাই করে actionable error ঠিক করতে হবে।
- [ ] **GitHub push ও deployment:** merged changes `main` branch-এ push; GitHub Pages workflow সফল হওয়া এবং public URL যাচাই করা।

## Accuracy and security notice

এটি demo-level face similarity, certified identity verification বা liveness/PAD নয়। Production/secure use-এর আগে independent model/threshold validation, PAD assessment, security review এবং applicable consent/privacy controls দরকার।
