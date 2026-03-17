(function () {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const prefersFinePointer = window.matchMedia("(pointer: fine)");

    function createLayer(tag, className, id) {
        const el = document.createElement(tag);
        el.className = className;
        if (id) {
            el.id = id;
        }
        return el;
    }

    function nearestHub(x, y, hubs) {
        let best = hubs[0];
        let bestDistance = Infinity;

        for (const hub of hubs) {
            const distance = Math.hypot(hub.x - x, hub.y - y);
            if (distance < bestDistance) {
                best = hub;
                bestDistance = distance;
            }
        }

        return best;
    }

    function randomBetween(min, max) {
        return min + Math.random() * (max - min);
    }

    function buildBackground() {
        if (!document.body || !document.body.classList.contains("camp-theme")) {
            return;
        }

        if (document.getElementById("camp-theme-bg")) {
            return;
        }

        const root = createLayer("div", "", "camp-theme-bg");
        root.setAttribute("aria-hidden", "true");
        const grid = createLayer("div", "camp-bg-grid");
        const hex = createLayer("div", "camp-hex-overlay");
        const canvas = createLayer("canvas", "camp-data-canvas", "camp-data-canvas");
        const orb1 = createLayer("div", "camp-orb camp-orb-1", "camp-orb-1");
        const orb2 = createLayer("div", "camp-orb camp-orb-2", "camp-orb-2");
        const orb3 = createLayer("div", "camp-orb camp-orb-3");
        const orb4 = createLayer("div", "camp-orb camp-orb-4", "camp-orb-4");
        const shouldAnimateBackground = !prefersReducedMotion.matches && prefersFinePointer.matches && window.innerWidth >= 768;

        root.append(grid, hex, canvas, orb1, orb2, orb3, orb4);
        document.body.prepend(root);

        canvas.setAttribute("aria-hidden", "true");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            return;
        }

        let width = 0;
        let height = 0;
        let pixelRatio = 1;
        let hubs = [];
        let vehicles = [];
        let uplinks = [];
        let animationFrameId = 0;
        let resizeFrameId = 0;
        let isRunning = false;
        const mouse = { x: -1000, y: -1000 };

        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
            canvas.width = Math.floor(width * pixelRatio);
            canvas.height = Math.floor(height * pixelRatio);
            canvas.style.width = width + "px";
            canvas.style.height = height + "px";
            ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
            createHubs();
            createVehicles();
            createUplinks();
        }

        function createHubs() {
            hubs = [];
            const count = Math.max(4, Math.floor((width * height) / 200000));

            for (let index = 0; index < count; index += 1) {
                hubs.push({
                    x: width * 0.1 + Math.random() * width * 0.8,
                    y: height * 0.1 + Math.random() * height * 0.8,
                    r: 2.5 + Math.random() * 1.5,
                    pulse: Math.random() * Math.PI * 2,
                });
            }
        }

        function createRoute() {
            const numWaypoints = 4 + Math.floor(Math.random() * 4);
            const waypoints = [];
            const edge = Math.floor(Math.random() * 4);
            let startX;
            let startY;

            if (edge === 0) {
                startX = -30;
                startY = Math.random() * height;
            } else if (edge === 1) {
                startX = width + 30;
                startY = Math.random() * height;
            } else if (edge === 2) {
                startX = Math.random() * width;
                startY = -30;
            } else {
                startX = Math.random() * width;
                startY = height + 30;
            }

            waypoints.push({ x: startX, y: startY });

            for (let index = 0; index < numWaypoints; index += 1) {
                waypoints.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                });
            }

            const lastEdge = Math.floor(Math.random() * 4);
            let endX;
            let endY;

            if (lastEdge === 0) {
                endX = -30;
                endY = Math.random() * height;
            } else if (lastEdge === 1) {
                endX = width + 30;
                endY = Math.random() * height;
            } else if (lastEdge === 2) {
                endX = Math.random() * width;
                endY = -30;
            } else {
                endX = Math.random() * width;
                endY = height + 30;
            }

            waypoints.push({ x: endX, y: endY });
            return waypoints;
        }

        function getRoutePoint(route, progress) {
            const segments = route.length - 1;
            const scaled = Math.min(progress * segments, segments - 0.0001);
            const index = Math.floor(scaled);
            const localT = scaled - index;
            const p0 = route[index];
            const p1 = route[index + 1];

            return {
                x: p0.x + (p1.x - p0.x) * localT,
                y: p0.y + (p1.y - p0.y) * localT,
            };
        }

        function createVehicle() {
            return {
                route: createRoute(),
                progress: Math.random(),
                speed: randomBetween(0.00018, 0.00045),
                color: Math.random() > 0.2 ? "blue" : "orange",
                trail: [],
                trailMax: Math.floor(randomBetween(18, 36)),
            };
        }

        function createVehicles() {
            vehicles = [];
            const count = Math.max(10, Math.floor((width * height) / 70000));

            for (let index = 0; index < count; index += 1) {
                vehicles.push(createVehicle());
            }
        }

        function createUplinks() {
            uplinks = [];
        }

        function spawnUplink(fromX, fromY, color) {
            const hub = nearestHub(fromX, fromY, hubs);
            uplinks.push({
                fromX,
                fromY,
                toX: hub.x,
                toY: hub.y,
                progress: 0,
                speed: randomBetween(0.004, 0.009),
                color,
                alpha: 0.5,
            });
        }

        function draw() {
            if (!isRunning) {
                return;
            }

            ctx.clearRect(0, 0, width, height);
            const time = Date.now() * 0.001;

            for (const hub of hubs) {
                const pulse = Math.sin(time * 0.8 + hub.pulse) * 0.3 + 1;
                const radius = hub.r * pulse;
                const ringAlpha = 0.05 + Math.sin(time * 0.6 + hub.pulse) * 0.025;

                ctx.beginPath();
                ctx.arc(hub.x, hub.y, radius * 7, 0, Math.PI * 2);
                ctx.strokeStyle = "rgba(0, 175, 215, " + ringAlpha + ")";
                ctx.lineWidth = 0.4;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(hub.x, hub.y, radius * 4, 0, Math.PI * 2);
                ctx.strokeStyle = "rgba(0, 175, 215, " + ringAlpha * 1.5 + ")";
                ctx.lineWidth = 0.3;
                ctx.stroke();

                const gradient = ctx.createRadialGradient(hub.x, hub.y, 0, hub.x, hub.y, radius * 10);
                gradient.addColorStop(0, "rgba(22, 148, 202, 0.12)");
                gradient.addColorStop(0.4, "rgba(22, 148, 202, 0.03)");
                gradient.addColorStop(1, "rgba(22, 148, 202, 0)");
                ctx.beginPath();
                ctx.arc(hub.x, hub.y, radius * 10, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(hub.x, hub.y, radius, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(0, 175, 215, " + (0.5 + Math.sin(time * 0.8 + hub.pulse) * 0.15) + ")";
                ctx.fill();

                const crosshair = radius * 3;
                ctx.strokeStyle = "rgba(0, 175, 215, 0.08)";
                ctx.lineWidth = 0.4;
                ctx.beginPath();
                ctx.moveTo(hub.x - crosshair, hub.y);
                ctx.lineTo(hub.x + crosshair, hub.y);
                ctx.moveTo(hub.x, hub.y - crosshair);
                ctx.lineTo(hub.x, hub.y + crosshair);
                ctx.stroke();
            }

            for (const vehicle of vehicles) {
                const position = getRoutePoint(vehicle.route, vehicle.progress);

                vehicle.trail.push({ x: position.x, y: position.y });
                if (vehicle.trail.length > vehicle.trailMax) {
                    vehicle.trail.shift();
                }

                if (vehicle.trail.length > 1) {
                    ctx.beginPath();
                    ctx.moveTo(vehicle.trail[0].x, vehicle.trail[0].y);
                    for (let index = 1; index < vehicle.trail.length; index += 1) {
                        ctx.lineTo(vehicle.trail[index].x, vehicle.trail[index].y);
                    }
                    ctx.strokeStyle = vehicle.color === "orange" ? "rgba(255, 150, 90, 0.08)" : "rgba(22, 148, 202, 0.08)";
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    for (let index = 0; index < vehicle.trail.length; index += 6) {
                        const alpha = (index / vehicle.trail.length) * 0.15;
                        ctx.beginPath();
                        ctx.arc(vehicle.trail[index].x, vehicle.trail[index].y, 0.8, 0, Math.PI * 2);
                        ctx.fillStyle = vehicle.color === "orange"
                            ? "rgba(255, 150, 90, " + alpha + ")"
                            : "rgba(22, 148, 202, " + alpha + ")";
                        ctx.fill();
                    }
                }

                const headGlow = ctx.createRadialGradient(position.x, position.y, 0, position.x, position.y, 12);
                if (vehicle.color === "orange") {
                    headGlow.addColorStop(0, "rgba(255, 150, 90, 0.35)");
                    headGlow.addColorStop(0.5, "rgba(255, 150, 90, 0.06)");
                    headGlow.addColorStop(1, "rgba(255, 150, 90, 0)");
                } else {
                    headGlow.addColorStop(0, "rgba(0, 175, 215, 0.35)");
                    headGlow.addColorStop(0.5, "rgba(0, 175, 215, 0.06)");
                    headGlow.addColorStop(1, "rgba(0, 175, 215, 0)");
                }
                ctx.beginPath();
                ctx.arc(position.x, position.y, 12, 0, Math.PI * 2);
                ctx.fillStyle = headGlow;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(position.x, position.y, 2.2, 0, Math.PI * 2);
                ctx.fillStyle = vehicle.color === "orange" ? "rgba(255, 180, 120, 0.8)" : "rgba(100, 210, 240, 0.8)";
                ctx.fill();

                if (Math.random() < 0.003) {
                    spawnUplink(position.x, position.y, vehicle.color);
                }

                vehicle.progress += vehicle.speed;
                if (vehicle.progress >= 1) {
                    const nextVehicle = createVehicle();
                    vehicle.route = nextVehicle.route;
                    vehicle.progress = 0;
                    vehicle.trail = [];
                    vehicle.speed = nextVehicle.speed;
                    vehicle.color = nextVehicle.color;
                    vehicle.trailMax = nextVehicle.trailMax;
                }
            }

            for (let index = uplinks.length - 1; index >= 0; index -= 1) {
                const uplink = uplinks[index];
                const x = uplink.fromX + (uplink.toX - uplink.fromX) * uplink.progress;
                const y = uplink.fromY + (uplink.toY - uplink.fromY) * uplink.progress;
                const lineAlpha = (1 - uplink.progress) * 0.15 * uplink.alpha;

                ctx.beginPath();
                ctx.moveTo(uplink.fromX, uplink.fromY);
                ctx.lineTo(x, y);
                ctx.strokeStyle = uplink.color === "orange"
                    ? "rgba(255, 150, 90, " + lineAlpha + ")"
                    : "rgba(0, 175, 215, " + lineAlpha + ")";
                ctx.lineWidth = 0.6;
                ctx.setLineDash([3, 4]);
                ctx.stroke();
                ctx.setLineDash([]);

                const packetAlpha = uplink.alpha * (1 - uplink.progress * 0.5);
                ctx.beginPath();
                ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                ctx.fillStyle = uplink.color === "orange"
                    ? "rgba(255, 180, 120, " + packetAlpha + ")"
                    : "rgba(100, 220, 255, " + packetAlpha + ")";
                ctx.fill();

                uplink.progress += uplink.speed;
                if (uplink.progress >= 1) {
                    const hub = hubs.find(function (candidate) {
                        return candidate.x === uplink.toX && candidate.y === uplink.toY;
                    });
                    if (hub) {
                        hub.pulse = time;
                    }
                    uplinks.splice(index, 1);
                }
            }

            for (const vehicle of vehicles) {
                if (vehicle.trail.length < 2) {
                    continue;
                }

                const position = vehicle.trail[vehicle.trail.length - 1];
                const distance = Math.hypot(position.x - mouse.x, position.y - mouse.y);
                if (distance < 200) {
                    const alpha = (1 - distance / 200) * 0.12;
                    ctx.beginPath();
                    ctx.moveTo(position.x, position.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.strokeStyle = "rgba(0, 175, 215, " + alpha + ")";
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }

            animationFrameId = window.requestAnimationFrame(draw);
        }

        function startAnimation() {
            if (!shouldAnimateBackground || isRunning) {
                return;
            }

            isRunning = true;
            animationFrameId = window.requestAnimationFrame(draw);
        }

        function stopAnimation() {
            isRunning = false;
            if (animationFrameId) {
                window.cancelAnimationFrame(animationFrameId);
                animationFrameId = 0;
            }
        }

        function handleVisibilityChange() {
            if (document.hidden) {
                stopAnimation();
                return;
            }

            startAnimation();
        }

        function handlePointerMove(event) {
            mouse.x = event.clientX;
            mouse.y = event.clientY;
            const cx = event.clientX / Math.max(width, 1) - 0.5;
            const cy = event.clientY / Math.max(height, 1) - 0.5;

            orb1.style.transform = "translate(" + cx * -40 + "px, " + cy * -30 + "px)";
            orb2.style.transform = "translate(" + cx * 30 + "px, " + cy * 40 + "px)";
            orb4.style.transform = "translate(" + cx * -20 + "px, " + cy * -20 + "px)";
        }

        function handleResize() {
            if (resizeFrameId) {
                window.cancelAnimationFrame(resizeFrameId);
            }

            resizeFrameId = window.requestAnimationFrame(function () {
                resize();
            });
        }

        resize();

        if (!shouldAnimateBackground) {
            canvas.remove();
            hex.style.animation = "none";
            return;
        }

        document.addEventListener("mousemove", handlePointerMove, { passive: true });
        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("resize", handleResize, { passive: true });

        startAnimation();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", buildBackground);
    } else {
        buildBackground();
    }
})();
