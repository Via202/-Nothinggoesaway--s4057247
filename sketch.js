// SPDX-License-Identifier: GPL-3.0-or-later
// Nothing Goes Away — a 1920 × 1080 generative composition.
// Change the values below to adjust density, motion, scale and timing.
const CONFIG = {
    landingSpacing: 43,
    landingSize: 46.25,
    landingOpacity: 0.27,
    textureContrast: 1,
    textureTimeScale: 1,
    tunnelLevels: 13,
    tunnelDensity: 1,
    tunnelSpeed: 0.025,
    tunnelScale: 1,
    tunnelDepth: 1500,
    holdMs: 3000,
    fadeMs: 2000,
    appearMs: 350,
    textureFadeMs: 900,
};
const W = 1920,
    H = 1080,
    CX = 960,
    CY = 540;
const RECT = { x: 164, y: 140, w: 1582, h: 807 };
// Frame atlases are derived from the original GIFs, which remain unchanged.
// Every source frame lasts 70 ms. Explicit frame selection avoids browsers
// treating an animated image as a still when it is drawn into a canvas.
const gifs = {
    title: { w: 700, h: 367, grid: 4, count: 225 },
    bottle1: { w: 226, h: 321, grid: 8, count: 300 },
    bottle2: { w: 137, h: 350, grid: 8, count: 225 },
    bag: { w: 298, h: 350, grid: 8, count: 225 },
    apple: { w: 241, h: 350, grid: 8, count: 225 },
};
let art = {},
    landingObjects = [],
    tunnelObjects = [],
    tunnelOffset = 0,
    marks = [],
    scene = "landing",
    transitionStart = 0,
    selection = null,
    textureNow = null,
    textureOld = null,
    textureStarted = 0,
    ambientCanvas,
    ambientCtx;
let currentPatternMode = 0,
    previousPatternMode = -1,
    hoveredObject = null,
    outerDepth = 0;
let objectSounds = {},
    activeSound = null;

function preload() {
    art.bagResult = loadImage("assets/display/bag-result.svg");
    for (const n of [
        "eye",
        "shirt",
        "bird",
        "tree",
        "tree2",
        "title",
        "bottle1",
        "bottle2",
        "bag",
        "apple",
    ])
        art[n] = loadImage("assets/display/" + n + ".png");
}
function setup() {
    const canvas = createCanvas(W, H);
    canvas.parent("canvas-holder");
    pixelDensity(1);
    imageMode(CENTER);
    noStroke();
    loadFrameAtlases();
    makeComposition();
    loadAudioAssets();
    restorePage();
    initializeAmbientCanvas();
    bindNavigation();
}
function loadFrameAtlases() {
    for (const [name, g] of Object.entries(gifs)) {
        g.sheets = [];
        let n = Math.ceil(g.count / (g.grid * g.grid));
        for (let i = 0; i < n; i++) {
            let img = new Image();
            img.src = "assets/frames/" + name + "-" + i + ".webp";
            g.sheets.push(img);
        }
    }
}
function initializeAmbientCanvas() {
    ambientCanvas = document.getElementById("ambient");
    ambientCtx = ambientCanvas.getContext("2d");
    resizeDisplay();
}
function openArtwork() {
    initializeArtwork();
    scene = "transition";
    sessionStorage.setItem("ngaPage", "main");
    transitionStart = millis();
    document.getElementById("explore").disabled = true;
    document.getElementById("landing-nav").hidden = true;
}
function bindNavigation() {
    document.getElementById("explore").addEventListener("click", openArtwork);
    const dialog = document.getElementById("about");
    document.getElementById("about-open").onclick = () => dialog.showModal();
    document.getElementById("about-close").onclick = () => dialog.close();
    dialog.addEventListener("click", (e) => {
        if (e.target === dialog) dialog.close();
    });
}
function resizeDisplay() {
    let c = document.querySelector("#canvas-holder canvas");
    c.style.width = "100%";
    c.style.height = "100%";
    if (ambientCanvas) {
        ambientCanvas.width = window.innerWidth;
        ambientCanvas.height = window.innerHeight;
    }
}
function windowResized() {
    resizeDisplay();
}
function makeComposition() {
    generateLandingGrid();
    generateTunnel();
    initializeTextureMarks();
}
function generateTunnel() {
    tunnelObjects = [];
    tunnelOffset = random(TWO_PI);
    const orange = ["bag", "apple"],
        blue = ["bottle1", "bottle2"];
    const levels = CONFIG.tunnelLevels + floor(random(-1, 2)),
        density = CONFIG.tunnelDensity * random(0.95, 1.08);
    for (let side = 0; side < 4; side++)
        for (let row = 0; row < levels; row++) {
            const radius = 36 * Math.pow(CONFIG.tunnelDepth / 36, row / (levels - 1));
            const size = constrain(radius * random(0.2, 0.24) * CONFIG.tunnelScale, 12, 300);
            const count = Math.max(2, Math.round((8 + row * 0.34) * density));
            for (let col = 0; col < count; col++) {
                const offset = currentPatternMode === 2 ? (row % 2) * 0.38 : 0;
                const u = ((col + 0.5 + offset) / count) * 2 - 1,
                    x = u * radius * 0.94,
                    y = -radius;
                const q = side * HALF_PI;
                // Alternate original orange and blue illustrations in every row.
                const parity =
                    currentPatternMode === 1
                        ? (col + Math.floor(row / 2) + side) % 2
                        : (row + col) % 2;
                const group = parity === 0 ? orange : blue;
                const type = group[(Math.floor(col / 2) + row + side) % group.length];
                tunnelObjects.push({
                    type,
                    x: x * Math.cos(q) - y * Math.sin(q),
                    y: x * Math.sin(q) + y * Math.cos(q),
                    size,
                    rotation: q,
                    depth: radius,
                    hover: 0,
                });
            }
        }
    // Paint far rows first so hit testing can follow visual stacking order.
    tunnelObjects.sort((a, b) => a.depth - b.depth);
}
function draw() {
    background("#ffd5b6");
    let t = millis() / 1000;
    drawAmbient(t);
    if (scene === "landing") drawLanding(t);
    else if (scene === "transition") {
        drawLanding(t);
        let k = constrain((millis() - transitionStart) / 400, 0, 1);
        drawingContext.globalAlpha = k;
        drawMain(t);
        drawingContext.globalAlpha = 1;
        if (k >= 1) scene = "main";
    } else drawMain(t);
}
function dimensions(name, maxW, maxH) {
    let img = gifs[name];
    let w = img ? img.w : art[name].width,
        h = img ? img.h : art[name].height;
    let s = Math.min(maxW / w, maxH / h);
    return { w: w * s, h: h * s };
}
function fitImage(name, x, y, maxW, maxH, alpha = 255) {
    let d = dimensions(name, maxW, maxH),
        g = gifs[name];
    if (g) {
        let frame = Math.floor(millis() / 70) % g.count,
            per = g.grid * g.grid,
            sheet = g.sheets[Math.floor(frame / per)],
            idx = frame % per;
        if (sheet.complete && sheet.naturalWidth) {
            drawingContext.save();
            drawingContext.globalAlpha *= alpha / 255;
            drawingContext.drawImage(
                sheet,
                (idx % g.grid) * g.w,
                Math.floor(idx / g.grid) * g.h,
                g.w,
                g.h,
                x - d.w / 2,
                y - d.h / 2,
                d.w,
                d.h,
            );
            drawingContext.restore();
        } else {
            tint(255, alpha);
            image(art[name], x, y, d.w, d.h);
            noTint();
        }
    } else {
        tint(255, alpha);
        image(art[name], x, y, d.w, d.h);
        noTint();
    }
}
// Draw a GIF atlas frame without allocating p5 image objects each frame.
function drawNative(ctx, o, t, alpha) {
    let g = gifs[o.type],
        frame = Math.floor(millis() / 70) % g.count,
        per = g.grid * g.grid,
        im = g.sheets[Math.floor(frame / per)],
        idx = frame % per;
    let k = Math.min(o.size / g.w, o.size / g.h),
        w = g.w * k,
        h = g.h * k;
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(o.rot || 0);
    ctx.globalAlpha *= alpha;
    if (im.complete && im.naturalWidth)
        ctx.drawImage(
            im,
            (idx % g.grid) * g.w,
            Math.floor(idx / g.grid) * g.h,
            g.w,
            g.h,
            -w / 2,
            -h / 2,
            w,
            h,
        );
    else if (art[o.type] && art[o.type].canvas)
        ctx.drawImage(art[o.type].canvas, -w / 2, -h / 2, w, h);
    ctx.restore();
}
function landingAlpha() {
    return CONFIG.landingOpacity;
}
function drawLanding(t) {
    for (let o of landingObjects) {
        if (o.x < -50 || o.x > W + 50 || o.y < -50 || o.y > H + 50) continue;
        drawNative(drawingContext, o, t, landingAlpha(o));
    }
    fitImage("title", CX, CY, 1500, 680);
}
// The canonical 16:9 canvas stays fully visible. A separate viewport canvas
// continues the same pattern outside its bounds without changing artwork scale.
function drawAmbient(t) {
    if (!ambientCtx) return;
    let c = ambientCtx,
        vw = ambientCanvas.width,
        vh = ambientCanvas.height,
        box = document.getElementById("experience").getBoundingClientRect(),
        scale = box.width / W;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1;
    c.fillStyle = "#ffd5b6";
    c.fillRect(0, 0, vw, vh);
    c.save();
    c.beginPath();
    c.rect(0, 0, vw, vh);
    c.rect(box.left, box.top, box.width, box.height);
    c.clip("evenodd");
    c.translate(box.left, box.top);
    c.scale(scale, scale);
    if (scene === "landing" || scene === "transition") {
        let minX = -box.left / scale,
            maxX = (vw - box.left) / scale,
            minY = -box.top / scale,
            maxY = (vh - box.top) / scale;
        for (const o of landingObjects)
            if (o.x >= minX - 50 && o.x <= maxX + 50 && o.y >= minY - 50 && o.y <= maxY + 50)
                drawNative(c, o, t, landingAlpha(o));
    } else {
        c.translate(CX, CY);
        c.rotate(tunnelOffset + t * CONFIG.tunnelSpeed);
        for (const o of tunnelObjects)
            drawNative(
                c,
                { type: o.type, x: o.x, y: o.y, size: o.size, rot: o.rotation },
                t,
                o.depth === outerDepth ? (230 + 25 * o.hover) / 255 : 1,
            );
    }
    c.restore();
}
function drawMain(t) {
    drawRotatingTunnel(t);
    fill(66, 86, 172, 115);
    rect(RECT.x, RECT.y, RECT.w, RECT.h);
    drawTextures(t);
    fitImage("eye", CX, CY, 1500, 750);
    drawSelection();
}
// Texture marks are generated once, clipped to the rectangle, and evolve over time.
function drawTextures(t) {
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(RECT.x, RECT.y, RECT.w, RECT.h);
    drawingContext.clip();
    let k = constrain((millis() - textureStarted) / CONFIG.textureFadeMs, 0, 1);
    if (textureOld) drawTexture(textureOld, t, 1 - k);
    if (textureNow) drawTexture(textureNow, t, k);
    drawingContext.restore();
}
// Each material uses its own stable geometry and time-based stages. Texture
// opacity is independent of the translucent rectangle and all drawing is clipped.
function drawTexture(state, t, opacity) {
    if (opacity <= 0) return;
    const age = Math.max(0, ((millis() - state.start) / 1000) * CONFIG.textureTimeScale);
    const ramp = (a, b) => constrain((age - a) / (b - a), 0, 1);
    const pulse = 0.95 + 0.05 * sin(t * 0.7);
    push();
    drawingContext.globalAlpha *= Math.min(1, opacity * pulse * CONFIG.textureContrast);
    if (state.type === "bottle1") drawPetTexture(ramp, t);
    else if (state.type === "bottle2") drawPlasticTexture(ramp, t);
    else drawOrganicTexture(ramp, t);
    pop();
}
function drawSelection() {
    if (!selection) return;
    let elapsed = millis() - selection.start,
        alpha = constrain(elapsed / CONFIG.appearMs, 0, 1) * 255,
        eyeScale = Math.min(1500 / art.eye.width, 750 / art.eye.height),
        x = CX + (1000 - (155 + 1548 / 2)) * eyeScale,
        y = CY + (540 - (192 + 770 / 2)) * eyeScale;
    if (selection.type === "apple") {
        let k = constrain((elapsed - CONFIG.holdMs) / CONFIG.fadeMs, 0, 1);
        fitImage("tree", x, y, 260, 280, alpha * (1 - k));
        if (k > 0) fitImage("tree2", x, y, 260, 280, alpha * k);
    } else if (selection.type === "bag") fitImage("bagResult", x, y, 260, 280, alpha);
    else if (selection.type === "bottle1") fitImage("shirt", x, y, 260, 280, alpha);
    else fitImage("bird", x, y, 351, 378, alpha);
}
// Invert the shared rotation, then each sprite rotation and scale. The rectangle
// and eye sit above the tunnel; clicks inside the rectangle never reach the tunnel.
function mousePressed() {
    if (scene !== "main" || document.getElementById("about").open) return;
    const target = findObject(
        mouseX,
        mouseY,
        tunnelOffset + (millis() / 1000) * CONFIG.tunnelSpeed,
    );
    if (!target) return;
    const now = millis();
    playObjectSound(target.type);
    selection = { type: target.type, start: now };
    textureOld = textureNow;
    textureNow = target.type === "bag" ? null : { type: target.type, start: now };
    textureStarted = now;
    return false;
}
// Inverse rotation keeps hit detection attached to moving objects.
function findObject(mx, my, angle) {
    if (mx < 0 || my < 0 || mx > W || my > H) return null;
    if (mx >= RECT.x && mx <= RECT.x + RECT.w && my >= RECT.y && my <= RECT.y + RECT.h) return null;
    let dx = mx - CX,
        dy = my - CY,
        c = Math.cos(-angle),
        s = Math.sin(-angle);
    let tx = dx * c - dy * s,
        ty = dx * s + dy * c;
    for (let i = tunnelObjects.length - 1; i >= 0; i--) {
        let o = tunnelObjects[i],
            ox = tx - o.x,
            oy = ty - o.y,
            co = Math.cos(-o.rotation),
            si = Math.sin(-o.rotation),
            lx = ox * co - oy * si,
            ly = ox * si + oy * co,
            d = dimensions(o.type, o.size, o.size);
        if (Math.abs(lx) < d.w / 2 && Math.abs(ly) < d.h / 2) return o;
    }
    return null;
}
// The outermost visible row is determined from its depth and current viewport.
function updateHover(angle) {
    let c = Math.cos(angle),
        s = Math.sin(angle);
    outerDepth = 0;
    for (const o of tunnelObjects) {
        let x = CX + o.x * c - o.y * s,
            y = CY + o.x * s + o.y * c;
        if (
            x + o.size / 2 >= 0 &&
            x - o.size / 2 <= W &&
            y + o.size / 2 >= 0 &&
            y - o.size / 2 <= H
        )
            outerDepth = Math.max(outerDepth, o.depth);
    }
    hoveredObject = findObject(mouseX, mouseY, angle);
    for (const o of tunnelObjects) {
        let goal = o === hoveredObject && o.depth === outerDepth ? 1 : 0;
        o.hover += (goal - o.hover) * Math.min(1, deltaTime / 175);
    }
}
// User gestures trigger one sound at a time. Browsers may reject playback;
// the visual artwork remains usable if that happens.
function loadAudioAssets() {
    for (const name of ["apple", "bottle1", "bottle2", "bag"]) {
        objectSounds[name] = new Audio("assets/audio/" + name + ".wav");
        objectSounds[name].preload = "auto";
    }
}
function playObjectSound(name) {
    if (activeSound) {
        activeSound.pause();
        activeSound.currentTime = 0;
    }
    activeSound = objectSounds[name];
    if (activeSound) {
        activeSound.currentTime = 0;
        activeSound.play().catch(() => {});
    }
}
// A stable session choice changes only on entering or reloading the artwork.
function initializeArtwork() {
    let stored = sessionStorage.getItem("ngaPattern");
    let last = stored === null ? -1 : Number(stored);
    if (!Number.isInteger(last) || last < 0 || last > 2) last = -1;
    let options = [0, 1, 2].filter((n) => n !== last);
    currentPatternMode = options[Math.floor(Math.random() * options.length)];
    previousPatternMode = currentPatternMode;
    sessionStorage.setItem("ngaPattern", String(currentPatternMode));
    generateTunnel();
}
function restorePage() {
    if (sessionStorage.getItem("ngaPage") === "main") {
        initializeArtwork();
        scene = "main";
        document.getElementById("landing-nav").hidden = true;
    }
}

function drawPetTexture(ramp, t) {
    // PET: angular translucent flakes -> continuous filaments -> over/under weave.
    const fibres = ramp(2, 6),
        weave = ramp(6, 11),
        flakes = 1 - ramp(3, 8);
    drawPetFlakes(flakes);
    // Long, smooth directional strands form before settling into the weave.
    drawPetFilaments(fibres, weave, t);
    drawPetWeave(weave);
}
function drawPlasticTexture(ramp, t) {
    // Persistent plastic: jagged shards split and drift apart, never becoming fibres.
    let split = ramp(1.5, 7);
    drawPlasticFragments(split, t);
}
function drawOrganicTexture(ramp, t) {
    // Compost: rounded organic matter breaks into clusters as branching roots grow.
    let decay = ramp(2, 7),
        roots = ramp(3, 9);
    drawOrganicMatter(decay);
    drawOrganicRoots(roots);
}

function drawPetFlakes(flakes) {
    for (let i = 0; i < marks.length; i++) {
        let m = marks[i],
            z = 11 + m.size * 0.95;
        push();
        translate(m.x, m.y);
        rotate(m.angle);
        if (flakes > 0) {
            stroke(255, 248, 224, 220 * flakes);
            strokeWeight(2);
            fill(191, 223, 255, 185 * flakes);
            beginShape();
            vertex(-z, -z * 0.32);
            vertex(-z * 0.35, -z);
            vertex(z * 0.7, -z * 0.75);
            vertex(z, z * 0.22);
            vertex(z * 0.2, z * 0.85);
            vertex(-z * 0.8, z * 0.6);
            endShape(CLOSE);
            stroke(255, 255, 255, 135 * flakes);
            line(-z * 0.35, -z * 0.65, z * 0.42, -z * 0.4);
        }
        pop();
    }
}

function drawPetFilaments(fibres, weave, t) {
    if (fibres > 0) {
        noFill();
        for (let i = 0; i < 29; i++) {
            let y = RECT.y + i * 30 + sin(t * 0.38 + i) * 5;
            stroke(
                i % 5 === 0
                    ? color(255, 151, 68, 205 * fibres * (1 - weave * 0.45))
                    : color(255, 244, 219, 220 * fibres * (1 - weave * 0.45)),
            );
            strokeWeight(i % 4 === 0 ? 4 : 2.5);
            bezier(
                RECT.x - 50,
                y,
                RECT.x + RECT.w * 0.28,
                y - 45,
                RECT.x + RECT.w * 0.68,
                y + 45,
                RECT.x + RECT.w + 50,
                y,
            );
        }
    }
}

function drawPetWeave(weave) {
    if (weave > 0) {
        let step = 37;
        strokeWeight(4);
        for (let x = RECT.x - 10; x < RECT.x + RECT.w + step; x += step) {
            stroke(39, 104, 252, 235 * weave);
            line(x, RECT.y, x, RECT.y + RECT.h);
        }
        for (let y = RECT.y + 10; y < RECT.y + RECT.h + step; y += step) {
            stroke(255, 244, 211, 235 * weave);
            line(RECT.x, y, RECT.x + RECT.w, y);
        }
        strokeWeight(5);
        for (let row = 0, y = RECT.y + 10; y < RECT.y + RECT.h + step; y += step, row++)
            for (let col = 0, x = RECT.x - 10; x < RECT.x + RECT.w + step; x += step, col++)
                if ((row + col) % 2 === 0) {
                    stroke(39, 104, 252, 250 * weave);
                    line(x, y - 8, x, y + 8);
                } else {
                    stroke(255, 164, 86, 225 * weave);
                    line(x - 8, y, x + 8, y);
                }
    }
}

function drawPlasticFragments(split, t) {
    for (let i = 0; i < marks.length; i++) {
        let m = marks[i],
            z = 9 + m.size * 1.2,
            dx = cos(m.angle) * split * (8 + m.size * 1.2),
            dy = sin(m.angle) * split * (8 + m.size * 1.2);
        push();
        translate(m.x + dx, m.y + dy);
        rotate(m.angle + 0.04 * sin(t * 0.4 + m.phase));
        stroke(255, 247, 220, 220);
        strokeWeight(1.7);
        let colors = [
            [255, 157, 78],
            [25, 114, 249],
            [246, 218, 177],
            [235, 91, 51],
            [153, 199, 255],
        ];
        let c = colors[i % colors.length];
        fill(c[0], c[1], c[2], 225);
        beginShape();
        vertex(-z, -z * 0.28);
        vertex(-z * 0.48, -z * 0.9);
        vertex(z * 0.13, -z * 0.5);
        vertex(z * 0.72, -z * 0.9);
        vertex(z, z * 0.15);
        vertex(z * 0.28, z * 0.8);
        vertex(-z * 0.65, z * 0.62);
        endShape(CLOSE);
        if (split > 0) {
            noStroke();
            fill(255, 224, 169, 230 * split);
            push();
            translate(z * 1.6, z * 0.8);
            rotate(0.5);
            quad(-z * 0.3, 0, 0, -z * 0.3, z * 0.35, -z * 0.08, z * 0.12, z * 0.32);
            pop();
            fill(55, 146, 255, 220 * split);
            triangle(-z * 1.6, -z * 0.4, -z * 1.15, -z * 0.65, -z * 1.24, -z * 0.12);
        }
        pop();
    }
}

function drawOrganicMatter(decay) {
    for (let i = 0; i < marks.length; i++) {
        let m = marks[i],
            z = 9 + m.size * 0.9;
        push();
        translate(m.x, m.y);
        rotate(m.angle);
        noStroke();
        fill(
            i % 3 === 0
                ? color(255, 175, 102, 230)
                : i % 3 === 1
                  ? color(255, 225, 177, 220)
                  : color(103, 50, 143, 230),
        );
        ellipse(0, 0, z * (2 - decay * 0.65), z * (1.1 - decay * 0.25));
        ellipse(z * 0.5, -z * 0.3, z * 0.8, z * 0.65);
        if (decay > 0) {
            fill(255, 212, 151, 220 * decay);
            circle(z * 1.1, z * 0.8, 5 + m.size * 0.3);
            circle(-z * 0.9, z * 0.9, 4 + m.size * 0.2);
            fill(88, 43, 137, 215 * decay);
            circle(z * 0.8, -z, 4 + m.size * 0.3);
        }
        pop();
    }
}

function drawOrganicRoots(roots) {
    if (roots > 0) {
        noFill();
        for (let i = 0; i < marks.length; i += 3) {
            let m = marks[i],
                len = 55 + m.length * 0.75;
            push();
            translate(m.x, m.y);
            rotate(m.angle);
            stroke(255, 235, 191, 230 * roots);
            strokeWeight(3);
            bezier(0, -len * 0.4, -len * 0.17, -len * 0.05, len * 0.13, len * 0.2, 0, len * 0.7);
            strokeWeight(1.8);
            bezier(
                0,
                0,
                -len * 0.12,
                len * 0.05,
                -len * 0.32,
                -len * 0.02,
                -len * 0.42,
                -len * 0.18,
            );
            bezier(
                0,
                len * 0.25,
                len * 0.17,
                len * 0.27,
                len * 0.27,
                len * 0.12,
                len * 0.38,
                len * 0.08,
            );
            stroke(255, 158, 98, 180 * roots);
            strokeWeight(1);
            line(-len * 0.18, -len * 0.04, -len * 0.32, len * 0.08);
            line(len * 0.18, len * 0.19, len * 0.32, len * 0.28);
            pop();
        }
    }
}

function generateLandingGrid() {
    const types = ["bottle1", "bottle2", "bag", "apple"];
    let spacing = CONFIG.landingSpacing,
        seed = floor(random(10000));
    for (let row = -30; row < 55; row++)
        for (let col = -45; col < 90; col++) {
            let x = col * spacing + (row % 2) * spacing * 0.45,
                y = row * spacing;
            let h = (Math.imul(row + 200, 73856093) ^ Math.imul(col + 200, 19349663) ^ seed) >>> 0;
            let type = types[(((row + col) % 4) + 4) % 4],
                size = CONFIG.landingSize * (0.88 + (h % 25) / 100);
            landingObjects.push({
                type,
                x,
                y,
                size,
                rot: ((h % 17) - 8) * 0.018,
                phase: (h % 628) / 100,
                speed: 0.3 + (h % 40) / 100,
            });
        }
}
function initializeTextureMarks() {
    for (let i = 0; i < 180; i++)
        marks.push({
            x: random(RECT.x, RECT.x + RECT.w),
            y: random(RECT.y, RECT.y + RECT.h),
            size: random(3, 14),
            angle: random(TWO_PI),
            phase: random(TWO_PI),
            length: random(25, 120),
            branch: random(0.35, 0.75),
        });
}
function drawRotatingTunnel(t) {
    let angle = tunnelOffset + t * CONFIG.tunnelSpeed;
    updateHover(angle);
    push();
    translate(CX, CY);
    rotate(angle);
    for (const o of tunnelObjects) {
        push();
        translate(o.x, o.y);
        rotate(o.rotation);
        let alpha = o.depth === outerDepth ? 230 + 25 * o.hover : 255;
        fitImage(o.type, 0, 0, o.size, o.size, alpha);
        pop();
    }
    pop();
}
