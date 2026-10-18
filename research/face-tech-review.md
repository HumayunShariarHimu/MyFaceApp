# একক ছবির ভিত্তিতে 3D মুখ/অ্যাভাটার, যাচাইকরণ ও PAD: প্রযুক্তি, সীমা, লাইসেন্স এবং privacy-first নকশা

**পরিধি।** এই প্রতিবেদনটি ব্যবহারকারীর নিজের/অনুমোদিত ছবির ভিত্তিতে ওয়েব-অ্যাপের জন্য একক-ছবি 3D মুখ বা মাথার অ্যাভাটার, মুখের অ্যানিমেশন, 1:1 face verification এবং presentation-attack detection (PAD)/liveness—এই চারটি আলাদা সমস্যাকে বিশ্লেষণ করে। এখানে কেবল পর্যালোচনায় যাচাইকৃত repository, paper, model page ও standard/evaluation page-এর ফল ব্যবহার করা হয়েছে। এটি আইনি মতামত নয়; লাইসেন্স ও biometric/privacy বাধ্যবাধকতার জন্য লক্ষ্য-বাজারভিত্তিক আইনি পর্যালোচনা আবশ্যক।

## নির্বাহী সারাংশ

- **একটি 2D RGB ছবি থেকে লুকানো 3D জ্যামিতি জানা যায় না।** ছবিতে না-দেখা পাশ, মাথার পেছন, কান/প্রোফাইল, চুলের ভলিউম, depth/scale এবং occlusion-ঢাকা অংশের পর্যাপ্ত প্রমাণ নেই। মডেল এসব অংশে learned prior বা generative completion ব্যবহার করে—ফলটি একটি **সম্ভাব্য অনুমান**, scan বা ground truth নয়। [MICA paper](https://arxiv.org/abs/2204.06607), [DECA paper](https://arxiv.org/abs/2012.04012), [FaceLift paper](https://arxiv.org/html/2412.17812v1)
- **অ্যাভাটার অনুমান, face verification এবং PAD/liveness এক জিনিস নয়।** 3D reconstruction-এর resemblance বা identity-sensitive feature কোনো ব্যক্তির legal identity প্রমাণ করে না; 1:1 matching কেবল reference ও probe-এর template-সাদৃশ্যের সম্ভাব্য ফল; PAD দেখে capture-এর সময় artefact/attack-এর লক্ষণ আছে কি না—কোনোটিই একা liveness বা authorization প্রমাণ করে না। [NIST FRTE 1:1](https://pages.nist.gov/frvt/html/frvt11.html), [NIST FATE PAD](https://pages.nist.gov/frvt/html/frvt_pad.html), [ISO/IEC 30107-1:2023 listing](https://www.iso.org/standard/83828.html)
- **বাণিজ্যিক অ্যাপে গবেষণা-শুধু assets ship করা যাবে না।** DECA, MICA, EMOCA এবং legacy FLAME release-গুলোর যাচাইকৃত terms non-commercial research/education/artistic ব্যবহারে সীমিত। FaceLift-এর code Apache-2.0 হলেও weights Adobe Research License v1.2-এ academic research/teaching-এ সীমিত। 3DDFA-V2 ও PRNet-এর code MIT হলেও weights-এর অধিকার আলাদা/অসম্পূর্ণভাবে যাচাইকৃত। [DECA LICENSE](https://github.com/yfeng95/DECA/blob/master/LICENSE), [MICA LICENSE](https://github.com/Zielon/MICA/blob/master/LICENSE), [EMOCA](https://github.com/radekd91/emoca), [FLAME model license](https://flame.is.tue.mpg.de/modellicense.html), [FaceLift repository](https://github.com/weijielyu/FaceLift)
- **প্রস্তাবিত privacy-first পথ:** প্রথমে browser worker-এ MediaPipe Face Landmarker দিয়ে local landmark/blendshape preview; subject-specific 3D shape দরকার হলে explicit opt-in-এ short-retention server GPU inference; reference photo ও generated result default-এ সংরক্ষণ নয়; identity matching/PAD আলাদা consent, আলাদা pipeline ও আলাদা evaluation gate। [MediaPipe Web](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js)
- **এক-ছবির MVP-কে ‘plausible facial mesh/avatar estimate’ হিসেবে প্রকাশ করুন**, scan, exact measurement, identity proof বা liveness হিসেবে নয়। Full-head geometry বা metrical measurement সত্যিই দরকার হলে guided multi-view capture বা depth/scan input নিন। [COLMAP tutorial](https://colmap.github.io/tutorial.html)

## ১. সমস্যাগুলোর সীমানা: চারটি output আলাদা করুন

| সমস্যা | ইনপুট | কী output করা যায় | কী দাবি করা যাবে না |
|---|---|---|---|
| **Avatar/3D face estimation** | এক বা একাধিক consented ছবি/ভিডিও | plausible facial surface, pose, expression, texture/albedo, কিছু ক্ষেত্রে animatable parameters | hidden geometry-এর সত্যতা, complete 360° head, exact identity, forensic/medical measurement |
| **Expression tracking/rigging** | live camera stream বা ছবি | landmarks, blendshape scores, authored avatar-এ expression control | subject-এর সম্পূর্ণ personalized head reconstruction |
| **1:1 face verification** | enrolled reference + probe | claimed same-person relation-এর calibrated similarity score | civil identity, 1:N identification, liveness |
| **PAD/liveness** | sensor-এ fresh capture, সাধারণত বহু frame/challenge | presentationটি bona fide না attack—একটি risk/decision score | কে ব্যক্তি, authorization, বা single still-এর সত্যিকারের প্রাণবন্ততা |

MediaPipe Face Landmarker browser-এ estimated 478-point face mesh, 52 expression blendshape score এবং transformation matrix দিতে পারে; এগুলো dense correspondence হলেও complete deformable avatar বা hidden-side head asset নয়। [MediaPipe Face Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker), [Web JS guide](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js)

## ২. এক ছবির 3D পুনর্গঠনের মৌলিক সীমা

### ২.১ কেন এক ছবি scan নয়

একটি ordinary 2D projection থেকে 3D shape uniquely নির্ণয় করা যায় না। unseen side/rear, depth, scale, ears/profile, hair volume এবং occluded texture ছবিতে পর্যবেক্ষিত নয়। একই pixel pattern ভিন্ন geometry, lighting, camera ও expression দিয়ে তৈরি হতে পারে। MICA paper perspective projection-এর কারণে single image থেকে actual dimension recovery সীমিত বলে; DECA এক ছবির shape, detail, expression, pose, albedo ও lighting model prior দিয়ে অনুমান করে; FaceLift diffusion-generated unseen views ব্যবহার করে—অর্থাৎ unseen অংশ observed নয়, synthesized। [MICA](https://arxiv.org/abs/2204.06607), [DECA](https://arxiv.org/abs/2012.04012), [FaceLift](https://arxiv.org/html/2412.17812v1)

### ২.২ যা তুলনামূলকভাবে অনুমানযোগ্য

Visible contours, approximate pose/expression, canonical facial surface এবং model-dependent identity-related shape/detail estimate করা যায়। কিন্তু geometry, albedo, lighting, camera ও expression coupled: shading shape হিসেবে ভুল ধরা পড়তে পারে; frontal photo-তে nose projection, cheek depth, ears ও profile সম্পর্কে direct evidence অল্প। ফল image quality, crop, pose, occlusion, facial hair/hair, expression, training distribution ও model version-এর উপর নির্ভরশীল। [DECA repository](https://github.com/yfeng95/DECA), [FLAME project](https://flame.is.tue.mpg.de/)

### ২.৩ “identity” শব্দটির সঠিক অর্থ

DECA/FLAME-এর identity-related latent shape বা MICA-র face-recognition feature ব্যবহার **identity estimate/appearance resemblance উন্নত করতে পারে**, কিন্তু ব্যক্তির identity establish করে না এবং exact likeness-এর guarantee দেয় না। Inferred mesh/measurement-কে forensic বা medical truth বলা যাবে না। MICA face-recognition representation ব্যবহার করলেও তা face verification নয়। [MICA](https://arxiv.org/abs/2204.06607), [FLAME model](https://flame.is.tue.mpg.de/)

## ৩. প্রযুক্তি ও প্রার্থীসমূহ

### ৩.১ একক-ছবি face/head reconstruction

| প্রার্থী | শক্তি/প্রতিনিধিত্ব | সীমা ও compute | যাচাইকৃত লাইসেন্স/বাণিজ্যিক সিদ্ধান্ত |
|---|---|---|---|
| [DECA](https://github.com/yfeng95/DECA) | এক ছবিতে detailed, animatable FLAME-based facial geometry, expression-dependent detail, textured OBJ | PyTorch ও rasterizer/PyTorch3D-ভিত্তিক research stack; full scalp, rear head, neck বা সত্যিকারের complete head নয় | repository code/model non-commercial scientific research, education বা artistic use; commercial service/product নয়। **commercial launch-এ ship নয়**, আলাদা permission ছাড়া |
| [MICA](https://github.com/Zielon/MICA) | face-recognition feature দিয়ে subject-specific, বেশি metrically meaningful facial shape estimate | actual dimension ground truth নয়; FLAME ও face-recognition assets দরকার; full head নয় | LICENSE-এ non-commercial research/education/artistic terms; **commercial launch-এ ship নয়** |
| [EMOCA](https://github.com/radekd91/emoca) | expressive/emotion-oriented monocular face reconstruction; DECA-ভিত্তিক | deprecated; Inferno-র দিকে নির্দেশিত; PyTorch/PyTorch3D/CUDA research setup; full head নয় | repository non-commercial scientific research terms; **commercial launch-এ ship নয়** |
| [FaceLift](https://github.com/weijielyu/FaceLift) | diffusion-generated views + Gaussian reconstruction দিয়ে full-head 3D Gaussian avatar-এর দিকে সবচেয়ে সরাসরি | unseen back/hairline/details plausible hallucination; two neural stages; training-এ 8 GPU বলা হলেও inference minimum নির্দিষ্ট নয়; browser-ready নয় | code Apache-2.0, কিন্তু weights Adobe Research License v1.2—academic research/teaching only। **weights commercial নয়** |
| [PRNet](https://github.com/yfeng95/PRNet) | dense face geometry, landmarks, color/texture; position-map output | README self-occluded texture distortion সতর্ক করে; legacy TensorFlow 1.x/Python 2.7; full head নয় | code MIT; trained-model licensing আলাদা issue-এ, তাই **weights commercial clearance অমীমাংসিত** |
| [3DDFA-V2](https://github.com/cleardusk/3DDFA_V2) | CPU-capable fast dense alignment; landmarks, pose, depth, UV, OBJ/PLY | primarily alignment/3DMM face surface; extreme angle/tracking failure; hair/skull/rear head নয় | code MIT; bundled/downloaded weights/dependencies আলাদা যাচাই আবশ্যক। Author-reported পুরোনো CPU latency browser guarantee নয়। **শুধু rights clearance-এর পর prototype** |
| [Deep3DFaceReconstruction](https://github.com/microsoft/Deep3DFaceReconstruction) | 3DMM face shape, texture, color, landmarks, coefficients ও OBJ | no longer maintained; Basel Face Model asset আলাদা terms; full head নয় | repository MIT, কিন্তু BFM access/license আলাদা। **all assets clear না হওয়া পর্যন্ত commercial নয়** |

**সংশ্লেষ।** Detailed single-image facial surface-এর জন্য DECA গবেষণায় সবচেয়ে সরাসরি baseline, MICA shape-oriented, EMOCA expression-oriented; FaceLift full-head rendering-এর সম্ভাবনা বেশি কিন্তু unseen অংশের hallucination এবং weights license বাধা। 3DDFA-V2 দ্রুত alignment/surface MVP-র জন্য বাস্তবসম্মত, কিন্তু এটিকে “complete 3D head” বলা যাবে না।

### ৩.২ Parametric model ও delivery format

[FLAME](https://flame.is.tue.mpg.de/) articulated jaw/neck/eyeball, identity shape, expression space ও pose-dependent corrective blendshape-সহ structured 3D morphable head model। এটি fitting prior—নিজে এক-ছবির inference application নয়। **FLAME 2023 Open model**-এর জন্য CC BY 4.0, attribution ও link আবশ্যক এবং stated restrictions (যেমন pornographic material ও fake/libelous/misleading/defamatory content নিষেধ) মানতে হবে; FLAME 2017/2019/2020/2023 legacy releases non-commercial scientific research license-এ। Exact version, textures, registered data ও fitting code আলাদা যাচাই করতে হবে। [FLAME model license](https://flame.is.tue.mpg.de/modellicense.html)

[glTF 2.0 morph targets](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html) per-vertex displacement ও weights বহন করতে পারে, কিন্তু photo reconstruction করে না এবং tracker-এর blendshape names/order স্বয়ংক্রিয়ভাবে compatible করে না। Export-এর আগে neutral calibration, left/right mapping, normalization ও smoothing দরকার।

### ৩.৩ Multi-view capture

একটি guided video বা overlapping still set hidden geometry-র ambiguity কমায়, তবে complete truth guarantee করে না। [COLMAP-এর official SfM tutorial](https://colmap.github.io/tutorial.html) অনুযায়ী target feature অন্তত তিনটি ছবিতে দেখা, subject-কে ঘিরে camera move করা, similar/diffuse illumination, specular highlight ও textureless background এড়ানো এবং cost নিয়ন্ত্রণে video frame down-sample করা উপকারী। Face-specific UX হিসেবে slow left/right yaw, সামান্য pitch, stable focus/exposure, unobstructed ears ও neutral expression নির্দেশ করা যায়; animation চাইলে expression clip আলাদা নেওয়া উচিত। এগুলো cited capture principles-এর face-specific product implication, formal universal protocol নয়।

[COLMAP](https://github.com/colmap/colmap) New BSD code-licensed general-purpose SfM/MVS tool—camera pose, sparse/dense point cloud ও mesh দিতে পারে, কিন্তু face-aware identity model বা avatar rig নয়। [GAF](https://github.com/tangjiapeng/GAF) monocular-video/multi-view diffusion research direction হলেও official repository-তে review সময় “Source Code Coming Soon!” এবং code/model license নেই; deployable open-source recommendation নয়।

## ৪. Browser, server এবং privacy-first architecture

### ৪.১ প্রস্তাবিত staged system

**Stage 0 — consent ও input quality gate**

1. স্পষ্টভাবে বলুন: উদ্দেশ্য avatar preview, expression animation, verification বা PAD—কোনটি। এক consent-কে সব উদ্দেশ্যের blanket consent করবেন না।
2. user-owned photo দাবি করলেও ছবিতে অন্য ব্যক্তি থাকতে পারে; visible subjects-এর অনুমতি, jurisdiction ও biometric processing-এর legal basis আলাদাভাবে review করুন।
3. browser-এ single-face, face-size, blur, exposure, occlusion, pose ও neutral-expression check চালান; quality খারাপ হলে reconstruction/verification না করে retake বলুন।

**Stage 1 — local preview/rigging**

- Web worker-এ [MediaPipe Face Landmarker Web](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js) চালান; synchronous `detect`/`detectForVideo` UI block করতে পারে, তাই worker ব্যবহার করুন।
- local landmark/blendshape output দিয়ে **authored, licensed glTF avatar** animate করুন। এটি “expression-driven animation”, subject-এর faithful reconstructed head নয়।
- default-এ source image/frames upload করবেন না; local-only mode-এর সুস্পষ্ট indicator দিন। WebGPU availability device/browser-নির্ভর, তাই WASM/CPU fallback এবং বাস্তব-device benchmark রাখুন। [W3C WebGPU](https://www.w3.org/TR/webgpu/)

**Stage 2 — optional 3D estimate**

- user-এর explicit opt-in-এর পর server GPU-তে licensed reconstruction চালান; source image ও result encrypted transport/storage-এ রাখুন, short TTL দিন এবং user-triggered deletion দিন।
- output UI-তে label দিন: “model-generated estimated facial surface; hidden regions are generated/plausible, not scanned.” Confidence/quality caveat দেখান; exact dimensions বা forensic use নিষেধ করুন।
- commercial rights না মেলা পর্যন্ত DECA/MICA/EMOCA/legacy FLAME/FaceLift weights production-এ ব্যবহার নয়। Prototype-এ 3DDFA-V2 কেবল code ও exact weights/dependencies clearance-এর পর alignment baseline হিসেবে।

**Stage 3 — better-observed reconstruction (যদি product সত্যিই চায়)**

- guided multi-view video/stills বা depth/scan input নিন; capture coverage, focus, exposure, yaw/profile, occlusion ও expression নির্দেশ করুন।
- COLMAP-type geometry এবং face-specific licensed fitting আলাদা modules হিসেবে evaluate করুন। output representation স্পষ্ট করুন—PLY mesh, textured OBJ, FLAME parameters, বা Gaussian avatar। watertight full head দাবি করবেন না যদি scalp/back independently validated না হয়।

**Stage 4 — optional 1:1 verification (অ্যাভাটার থেকে সম্পূর্ণ আলাদা)**

- enrollment reference ও fresh probe-এর face quality checks-এর পর claimed-user-only 1:1 comparison করুন; 1:N search নয়। face-api.js browser candidate হিসেবে সরাসরি ব্যবহারযোগ্য [MIT repository](https://github.com/justadudewhohacks/face-api.js/), 128-value descriptor দেয় এবং docs-এ LFW 99.38% accuracy/~6.2 MB quantized model বলা আছে—এটি historical author-reported benchmark, production guarantee বা threshold নয়।
- reference template/photo sensitive biometric-like data; encryption, access restriction, deletion ও user-visible consent দিন। one reference দিয়ে pose, lighting, age, expression ও quality variation adequately model হয় না।
- [InsightFace](https://github.com/deepinsight/insightface)-এর code MIT হলেও recognition packs/weights-এর terms non-commercial research বা direct licensing contact-নির্ভর; written model-specific permission ছাড়া commercial deployment নয়।

**Stage 5 — PAD/liveness (fresh camera capture-এ, photo reference-এ নয়)**

- W3C permission-mediated camera stream ([Media Capture and Streams](https://www.w3.org/TR/mediacapture-streams/)) থেকে বহু frame নিন; still upload-কে liveness evidence হিসেবে গ্রহণ করবেন না।
- PAD ও matcher আলাদা score/decision রাখুন: matcher “claimed reference-এর সঙ্গে কতটা মেলে”; PAD “sensor presentation attack-এর মতো কি না”। উভয়কে AND/step-up policy-তে ব্যবহার করুন।
- [Silent-Face-Anti-Spoofing](https://github.com/minivision-ai/Silent-Face-Anti-Spoofing) Apache-2.0 repository হলেও model weights/data/dependencies আলাদা verify করুন; এটি passive RGB image classifier, liveness proof নয় এবং camera/domain/attack instrument-এ performance বদলায়।
- threat level অনুযায়ী unpredictable challenge-response (যেমন instructed head motion/illumination) ব্যবহার করা যেতে পারে; blink/head-turn একা যথেষ্ট নয়, replay/deepfake-এ নকল হতে পারে এবং কিছু user-কে exclude করতে পারে। [Face Flashing paper](https://www.ndss-symposium.org/wp-content/uploads/2019/02/ndss2018_03B-5_Tang_paper-updated.pdf)-ও challenge bypass ও mask/high-speed-camera limitation আলোচনা করে।
- client-only PAD score security-critical সিদ্ধান্তের একমাত্র authority করবেন না: browser code inspect/tamper করা যায়। Higher-assurance flow-তে server-controlled verification দরকার, কিন্তু এতে image/video upload ও retention risk বাড়ে।

## ৫. Compute ও deployment বাস্তবতা

- 3DDFA-V2-এর প্রকাশিত প্রায় 1–2 ms parameter regression ও ~1 ms dense reconstruction পুরোনো laptop CPU-র author-reported values; face detection dominant এবং browser/mobile guarantee নয়। PRNet README-র ~0.01 s GPU/~0.2 s CPU-ও cited hardware-specific।
- DECA/MICA/EMOCA PyTorch, CUDA/PyTorch3D বা compiled rasterizer/data/model assets-নির্ভর research stacks; browser inference চাইলে conversion, operator support, model packaging/quantization, memory ও target-device measurement দরকার।
- FaceLift-এর diffusion + Gaussian stages heavier; official materials reliable minimum inference GPU/latency দেয় না। training-এ 8 GPU বলা inference requirement নয়।
- local inference source photo server-এ না পাঠিয়ে privacy ও latency উন্নত করতে পারে; server inference বড় model/version control সহজ করে, কিন্তু sensitive upload, retention, access control ও breach exposure বাড়ায়। তাই **local preview + opt-in server reconstruction** hybrid পথটি সবচেয়ে বাস্তবসম্মত।

## ৬. লাইসেন্স ও asset clearance matrix

| asset/প্রার্থী | যাচাইকৃত status | launch gate |
|---|---|---|
| DECA | code/model research-only; commercial service/product নিষিদ্ধ | commercial permission না পাওয়া পর্যন্ত production নয় |
| MICA | research/education/artistic non-commercial terms | production নয় |
| EMOCA | non-commercial scientific research; legacy/deprecated | production নয় |
| FaceLift | code Apache-2.0, weights Adobe Research License v1.2 academic research/teaching only | weights-এর commercial grant না পাওয়া পর্যন্ত production নয় |
| FLAME 2023 Open | named model CC BY 4.0 + attribution ও stated restrictions | exact model/texture/code terms লিখিতভাবে audit |
| FLAME legacy releases | non-commercial scientific research | commercial নয় |
| 3DDFA-V2 | repository code MIT | exact downloaded weights, data, dependencies clear না হওয়া পর্যন্ত নয় |
| PRNet | code MIT; trained model license unresolved in reviewed material | weights provenance/permission clear না হওয়া পর্যন্ত নয় |
| Deep3DFaceReconstruction | repo MIT; Basel Face Model separate license; repo no longer maintained | BFM ও সব asset clear না হওয়া পর্যন্ত নয় |
| COLMAP | New BSD code; third-party dependency terms separate | dependencies ও distribution obligations audit |
| MediaPipe Face Landmarker | repository Apache-2.0; exact task bundle/model component verify | artifact-version license audit |
| face-api.js | repository MIT; recognition weight provenance separate check | exact distributed weights audit; benchmark নয় |
| InsightFace packs | code MIT হলেও packs/models non-commercial/requires contact | written model-specific commercial permission |
| Silent-Face-Anti-Spoofing | repository Apache-2.0 | weights/data/dependencies audit |
| FaceScape | internal non-commercial research/evaluation/testing; signed agreement | commercial training/product নয় |
| Basel Face Model legacy | non-commercial research/evaluation/testing; no redistribution | commercial নয় |
| VGGFace2 | reviewed authoritative material-এ commercial data license established নয় | rights/consent/redistribution terms clear না হওয়া পর্যন্ত training নয় |

**নীতি:** repository code license কখনোই automatically pretrained weights, datasets, textures, BFM/FLAME assets বা third-party dependencies-এর license নয়। Exact commit, downloaded artifact, model version এবং redistribution path-এর জন্য একটি SPDX/terms inventory রাখুন।

## ৭. Evaluation ও test path

### ৭.১ Avatar/3D estimate evaluation

1. **Input strata:** frontal/profile, yaw/pitch, hair/occlusion, glasses/facial hair, lighting, crop/resolution, expression, camera/device এবং intended demographic coverage। কোনো universal demographic accuracy claim করবেন না।
2. **Observed-region tests:** landmark reprojection error, visible contour alignment, pose/expression consistency, texture/color sanity, frame-to-frame stability।
3. **Multi-view validation:** consented capture-তে left/right profile, back/ear/hair visibility ও held-out view render comparison; single photo-র unseen regionকে “accuracy” হিসেবে score নয়—generated completion হিসেবে label।
4. **Product acceptance:** failure detection/retake, confidence calibration, no-scan disclosure, editable output, deletion audit, crash/memory/latency on target browsers/devices।
5. **Representation checks:** OBJ/PLY/FLAME/Gaussian output, scale convention, topology, UV, morph-target mapping, left/right orientation এবং glTF animation playback।

### ৭.২ Verification evaluation

- NIST terminology অনুযায়ী threshold-এর ওপরে impostor comparisons-এর হার **FMR**, threshold-এর নিচে genuine comparisons-এর হার **FNMR**। Representative, consented, held-out development set-এ target FMR ঠিক করে threshold calibrate করুন; final test-এর আগে threshold lock করুন; confidence interval ও per-condition/group ফল report করুন। [NIST FRVT](https://pages.nist.gov/frvt/html/frvt11.html)
- LFW-র 99.38% মতো historical figure production threshold নয়। pose/age/quality variation-এর জন্য CFP-FP, AgeDB-30, IJB-C-এর মতো protocol বিবেচনা করা যায়, কিন্তু dataset terms/subject-consent যাচাই ছাড়া data ব্যবহার নয়।
- enrolled reference-এর সংখ্যা ও variation, preprocessing, crop, camera, lighting, model version ও browser runtime lock করুন। release/model/capture change হলে revalidate করুন।
- high-stakes claim এড়ান; fallback/non-biometric path দিন। NIST face-recognition evaluations demographic error differentials ও image-quality effects দেখায়—aggregate accuracy একা যথেষ্ট নয়। [NIST demographics](https://pages.nist.gov/frvt/html/frvt_demographics.html)

### ৭.৩ PAD/liveness evaluation

- current ISO/IEC 30107 framework ও NIST FATE PAD definitions অনুযায়ী matcher ও PAD আলাদা test করুন; ISO listing-গুলো 2016/2017 editions-এর বদলে 2023 replacements নির্দেশ করে। [ISO 30107-1](https://www.iso.org/standard/83828.html), [ISO 30107-3 listing](https://www.iso.org/standard/67381.html), [NIST FATE PAD](https://pages.nist.gov/frvt/html/frvt_pad.html)
- bona fide users এবং intended attack instruments-এর জন্য APCER/BPCER report করুন; print/replay/display, compression, camera/device/domain shift, synthetic/deepfake ও novel attacks আলাদা করুন।
- 82 passive PAD algorithm-এর NIST report-এ algorithm/attack instrument অনুযায়ী performance substantial variation ও challenging attack class দেখা গেছে; তাই repository demo metric বা এক device-এর score assurance নয়। [NISTIR 8491](https://nvlpubs.nist.gov/nistpubs/ir/2023/NIST.IR.8491.pdf)
- cross-device/browser, network, client tampering, challenge completion, accessibility ও false reject fallback পরীক্ষা করুন। certification claim করবেন না যদি matching evaluation/standard evidence না থাকে।

## ৮. Recommended MVP ও non-negotiable gates

### Recommended MVP

1. **Local-only avatar preview:** MediaPipe worker → authored licensed glTF avatar → local WebGL rendering; label: “expression animation, not identity reconstruction.”
2. **Optional estimated facial mesh:** consented upload → quality gate → licensed server GPU pipeline → short-lived estimated output; hidden-region disclosure ও deletion button।
3. **No verification/PAD in first avatar release.** এগুলো আলাদা product mode, আলাদা consent, আলাদা threat model ও আলাদা evaluation dashboard।
4. **If verification is later added:** low-stakes, claimed-user 1:1 only; calibrated threshold, quality gate, fallback, no liveness claim।
5. **If authentication is later added:** fresh camera + server-validated PAD + independently calibrated 1:1 match; reference photo কখনো liveness evidence নয়।

### Release gates

- **License gate:** exact code, model, weight, dataset, texture ও dependency terms signed off; research-only asset production bundle-এ নেই।
- **Privacy gate:** purpose limitation, explicit consent, no-training-by-default, encryption, access logging, short retention, deletion verification, breach/abuse plan।
- **Truth-in-labeling gate:** scan/exact identity/medical or forensic measurement/liveness দাবি নেই; generated unseen geometry visibly disclosed।
- **Quality gate:** single-face, pose, blur, lighting, occlusion, crop ও expression rejection/retake behavior measured।
- **Model gate:** target browsers/devices-এ memory, latency, operator support, worker behavior, fallback ও version pinning tested।
- **Verification gate:** held-out representative evaluation, locked threshold, FMR/FNMR confidence intervals, condition/group report ও non-biometric fallback।
- **PAD gate:** bona fide বনাম attack protocol, APCER/BPCER, challenge/accessibility, cross-device/domain ও client-tampering test; standard compliance claim কেবল evidence থাকলে।
- **Security gate:** source photo, templates, meshes, scores ও camera frames-এর retention/access/deletion audit; public sharing default off।

## ৯. চূড়ান্ত সিদ্ধান্ত

Commercial consumer web app-এর জন্য এক-ছবি থেকে “সম্পূর্ণ বাস্তব 3D head” প্রতিশ্রুতি দেওয়া যাবে না। সবচেয়ে নিরাপদ product wording হবে: **“আপনার ছবির ভিত্তিতে মডেল-অনুমান করা, সম্পাদনাযোগ্য facial avatar/mesh”**। Full-head বা metrical fidelity সত্যিই business-critical হলে multi-view/depth/scan capture আবশ্যক।

Prototype-এর জন্য 3DDFA-V2 alignment/surface baseline হতে পারে—কেবল exact weights/dependencies-এর commercial rights যাচাই সাপেক্ষে। DECA/MICA/EMOCA/legacy FLAME research-only terms-এর কারণে commercial production-এ নয়; FaceLift-এর code/weight license আলাদা এবং weight commercial নয়; FLAME 2023 Open-এর CC BY 4.0 কেবল named model-এর জন্য, fitting code বা checkpoint-এর blanket permission নয়।

Privacy-first default হলো: **local landmark/animation → explicit opt-in heavy reconstruction → short-lived encrypted server processing → verified deletion → no secondary training/identity reuse**। Verification এবং PAD চাইলে সেগুলোকে পৃথক, risk-scored capabilities হিসেবে তৈরি করুন; কোনো 2D photo, generated mesh, embedding বা blink heuristic-কে identity proof বা liveness proof হিসেবে উপস্থাপন করবেন না।

## উৎসসমূহ

- [DECA paper](https://arxiv.org/abs/2012.04012) ও [repository/license](https://github.com/yfeng95/DECA)
- [MICA paper](https://arxiv.org/abs/2204.06607) ও [repository/license](https://github.com/Zielon/MICA)
- [EMOCA repository](https://github.com/radekd91/emoca)
- [FaceLift paper](https://arxiv.org/html/2412.17812v1) ও [repository](https://github.com/weijielyu/FaceLift)
- [3DDFA-V2](https://github.com/cleardusk/3DDFA_V2), [PRNet](https://github.com/yfeng95/PRNet), [Deep3DFaceReconstruction](https://github.com/microsoft/Deep3DFaceReconstruction)
- [FLAME project](https://flame.is.tue.mpg.de/) ও [model license](https://flame.is.tue.mpg.de/modellicense.html)
- [COLMAP tutorial](https://colmap.github.io/tutorial.html) ও [repository](https://github.com/colmap/colmap)
- [GAF project](https://tangjiapeng.github.io/projects/GAF/) ও [repository](https://github.com/tangjiapeng/GAF)
- [MediaPipe Face Landmarker Web](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js), [repository](https://github.com/google-ai-edge/mediapipe), [Face Mesh V2 model card](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20MediaPipe%20Face%20Mesh%20V2.pdf)
- [glTF 2.0 specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)
- [face-api.js](https://github.com/justadudewhohacks/face-api.js), [InsightFace](https://github.com/deepinsight/insightface), [ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/)
- [NIST FRTE 1:1](https://pages.nist.gov/frvt/html/frvt11.html), [NIST demographics](https://pages.nist.gov/frvt/html/frvt_demographics.html), [NIST FATE PAD](https://pages.nist.gov/frvt/html/frvt_pad.html), [NISTIR 8491](https://nvlpubs.nist.gov/nistpubs/ir/2023/NIST.IR.8491.pdf)
- [ISO/IEC 30107-1:2023](https://www.iso.org/standard/83828.html), [ISO/IEC 30107-3 listing](https://www.iso.org/standard/67381.html)
- [Silent-Face-Anti-Spoofing](https://github.com/minivision-ai/Silent-Face-Anti-Spoofing), [Face Flashing](https://www.ndss-symposium.org/wp-content/uploads/2019/02/ndss2018_03B-5_Tang_paper-updated.pdf)
- [W3C Media Capture and Streams](https://www.w3.org/TR/mediacapture-streams/), [W3C WebGPU](https://www.w3.org/TR/webgpu/)
