const startBtn = document.getElementById("startBtn");
        const video = document.getElementById("inputVideo");
        const canvas = document.getElementById("outputCanvas");
        const ctx = canvas.getContext("2d");
        const videoContainer = document.getElementById("videoContainer");
        const loadingText = document.getElementById("loadingText");
        const warningOverlay = document.getElementById("warningOverlay");
        const logBox = document.getElementById("logBox");
        const speedSlider = document.getElementById("speedSlider");
        const speedValue = document.getElementById("speedValue");
        const earSlider = document.getElementById("earSlider");
        const earValue = document.getElementById("earValue");
        const drowsySlider = document.getElementById("drowsySlider");
        const drowsyValue = document.getElementById("drowsyValue");
        const distractedSlider = document.getElementById("distractedSlider");
        const distractedValue = document.getElementById("distractedValue");
        const offroadSlider = document.getElementById("offroadSlider");
        const offroadValue = document.getElementById("offroadValue");
        const statusEyes = document.getElementById("statusEyes");
        const statusHead = document.getElementById("statusHead");
        const statusTOR = document.getElementById("statusTOR");
        const statusPresence = document.getElementById("statusPresence");
        const statusBlink = document.getElementById("statusBlink");
        const perclosValue = document.getElementById("perclosValue");
        const earLiveValue = document.getElementById("earLiveValue");
        const milesValue = document.getElementById("milesValue");
        const infractionsValue = document.getElementById("infractionsValue");
        const infractionsRate = document.getElementById("infractionsRate");

        let faceMesh, running = false, busy = false, milesDriven = 0, infractions = 0, eyeClosed = false, eyeClosedAt = 0, offRoadAt = 0, drowsyFrames = 0, distractedFrames = 0;
        let EAR_THRESHOLD = Number(earSlider.value), DROWSY_LIMIT = Number(drowsySlider.value), DISTRACTED_LIMIT = Number(distractedSlider.value), OFFROAD_MS = Number(offroadSlider.value);
        const BLINKS = [], CLOSED = [], ALL = [];

        const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
        const ear = (p, ids) => { const [a,b,c,d,e,f] = ids.map(i => p[i]); return (dist(b,f) + dist(c,e)) / Math.max(0.0001, 2 * dist(a,d)); };
        const yaw = p => dist(p[1], p[234]) / Math.max(0.0001, dist(p[1], p[454]));
        const log = msg => { const row = document.createElement("div"); row.textContent = "[" + new Date().toLocaleTimeString() + "] " + msg; logBox.prepend(row); };
        const badge = (el, text, cls) => { el.textContent = text; el.className = cls + " font-semibold"; };
        const infraction = () => { infractions += 1; infractionsValue.textContent = String(infractions); infractionsRate.textContent = (milesDriven > 0 ? infractions / milesDriven * 100 : 0).toFixed(1); };
        const trim = (arr, now) => { while (arr.length && now - arr[0] > 60000) arr.shift(); };

        function resizeCanvas() {
            if (!video.videoWidth) return;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const scale = Math.min((window.innerWidth - 80) / video.videoWidth, (window.innerHeight - 120) / video.videoHeight, 1);
            videoContainer.style.width = Math.max(320, Math.floor(video.videoWidth * scale)) + "px";
            videoContainer.style.height = Math.max(180, Math.floor(video.videoHeight * scale)) + "px";
        }

        function drawMesh(points) {
            const draw = (segments, color, width) => {
                if (!segments) return;
                ctx.beginPath();
                for (const segment of segments) {
                    const a = Array.isArray(segment) ? segment[0] : segment.start;
                    const b = Array.isArray(segment) ? segment[1] : segment.end;
                    ctx.moveTo(points[a].x, points[a].y);
                    ctx.lineTo(points[b].x, points[b].y);
                }
                ctx.strokeStyle = color;
                ctx.lineWidth = width;
                ctx.stroke();
            };
            draw(window.FACEMESH_TESSELATION, "rgba(255,255,255,0.10)", 0.7);
draw(window.FACEMESH_LEFT_EYE, "#1694CA", 2.5);
draw(window.FACEMESH_RIGHT_EYE, "#FF965A", 2.5);
        }

        function onResults(results) {
            const now = performance.now();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
            if (!results.multiFaceLandmarks || !results.multiFaceLandmarks.length) {
badge(statusPresence, "SEARCHING", "text-brand-warning");
                warningOverlay.classList.remove("alert-flash");
                return;
            }
badge(statusPresence, "PRESENT", "text-brand-success");
            const points = results.multiFaceLandmarks[0].map(point => ({ x: point.x * canvas.width, y: point.y * canvas.height }));
            drawMesh(points);
            const landmarks = results.multiFaceLandmarks[0];
            const avgEar = (ear(landmarks, [33,160,158,133,153,144]) + ear(landmarks, [362,385,387,263,373,380])) / 2;
            const headYaw = yaw(landmarks);
            ALL.push(now); trim(ALL, now);
            if (avgEar < EAR_THRESHOLD) CLOSED.push(now);
            trim(CLOSED, now);
            if (avgEar < EAR_THRESHOLD) {
                drowsyFrames += 1;
                if (!eyeClosed) { eyeClosed = true; eyeClosedAt = now; }
            } else {
                if (eyeClosed && now - eyeClosedAt >= 80 && now - eyeClosedAt <= 500) BLINKS.push(now);
                eyeClosed = false;
                drowsyFrames = 0;
            }
            trim(BLINKS, now);
            const lookingAway = headYaw > 2.2 || headYaw < 0.45;
            distractedFrames = lookingAway ? distractedFrames + 1 : 0;
            offRoadAt = (lookingAway || avgEar < EAR_THRESHOLD) ? (offRoadAt || now) : 0;
            const offRoadSeconds = offRoadAt ? (now - offRoadAt) / 1000 : 0;
            const perclos = ALL.length ? CLOSED.length / ALL.length : 0;
            earLiveValue.textContent = avgEar.toFixed(2);
            perclosValue.textContent = Math.round(perclos * 100) + "%";
badge(statusBlink, BLINKS.length + "/min", BLINKS.length < 5 ? "text-brand-warning" : "text-white");
if (drowsyFrames >= DROWSY_LIMIT || perclos > 0.35) { badge(statusEyes, "DROWSY", "text-brand-danger"); warningOverlay.classList.add("alert-flash"); }
else if (avgEar < EAR_THRESHOLD) { badge(statusEyes, "CLOSING", "text-brand-warning"); warningOverlay.classList.remove("alert-flash"); }
else { badge(statusEyes, "AWAKE", "text-brand-success"); warningOverlay.classList.remove("alert-flash"); }
if (distractedFrames >= DISTRACTED_LIMIT) badge(statusHead, "LOOKING AWAY", "text-brand-danger");
else if (lookingAway) badge(statusHead, "DRIFTING", "text-brand-warning");
else badge(statusHead, "FOCUSED", "text-brand-success");
if (offRoadAt && now - offRoadAt >= OFFROAD_MS) badge(statusTOR, offRoadSeconds.toFixed(1) + "s", "text-brand-danger");
else if (offRoadAt) badge(statusTOR, offRoadSeconds.toFixed(1) + "s", "text-brand-warning");
else badge(statusTOR, "0.0s", "text-brand-success");
            if (drowsyFrames === DROWSY_LIMIT || distractedFrames === DISTRACTED_LIMIT) { log("Driver risk event detected."); infraction(); }
        }

        async function processFrame() {
            if (!faceMesh || busy) return;
            busy = true;
            try { await faceMesh.send({ image: video }); } finally { busy = false; }
        }

        function frameLoop() {
            if (typeof video.requestVideoFrameCallback === "function") {
                video.requestVideoFrameCallback(() => { void processFrame(); frameLoop(); });
            } else {
                requestAnimationFrame(() => { void processFrame(); frameLoop(); });
            }
        }

        async function start() {
            if (running) return;
            loadingText.classList.remove("hidden");
            startBtn.disabled = true;
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
            video.srcObject = stream;
            await video.play();
            resizeCanvas();
            faceMesh = new FaceMesh({ locateFile: file => "../shared/vendor/mediapipe/face_mesh/" + file });
            faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: false, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
            faceMesh.onResults(onResults);
            frameLoop();
            running = true;
            loadingText.classList.add("hidden");
            startBtn.textContent = "System Active";
startBtn.className = "bg-brand-success px-6 py-2 rounded font-bold transition-colors";
            log("Local FaceMesh pipeline started.");
            log("Phone detection disabled in offline mode.");
        }

        startBtn.addEventListener("click", () => start().catch(error => { loadingText.classList.add("hidden"); startBtn.disabled = false; startBtn.textContent = "Error"; log("Failed to start: " + error.message); }));
        speedSlider.addEventListener("input", () => { speedValue.textContent = speedSlider.value + " mph"; });
        earSlider.addEventListener("input", () => { EAR_THRESHOLD = Number(earSlider.value); earValue.textContent = EAR_THRESHOLD.toFixed(2); });
        drowsySlider.addEventListener("input", () => { DROWSY_LIMIT = Number(drowsySlider.value); drowsyValue.textContent = String(DROWSY_LIMIT); });
        distractedSlider.addEventListener("input", () => { DISTRACTED_LIMIT = Number(distractedSlider.value); distractedValue.textContent = String(DISTRACTED_LIMIT); });
        offroadSlider.addEventListener("input", () => { OFFROAD_MS = Number(offroadSlider.value); offroadValue.textContent = OFFROAD_MS + " ms"; });
        window.addEventListener("resize", resizeCanvas);
        setInterval(() => { if (!running) return; milesDriven += Number(speedSlider.value) / 3600 / 4; milesValue.textContent = milesDriven.toFixed(2) + " mi"; infractionsRate.textContent = (milesDriven > 0 ? infractions / milesDriven * 100 : 0).toFixed(1); }, 250);
