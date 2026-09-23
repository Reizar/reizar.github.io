# aaronrama.com Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the single-screen B2 "Inside the network" personal site as static files ready for GitHub Pages.

**Architecture:**
- Plain HTML and CSS carry all the content, so the page works without JS or WebGL.
- An ES module (`js/main.js`) owns the renderer, animation loop, pointer, pausing, reduced motion and fallback.
- It builds its scene from a pure module (`js/network.js`), which generates the nodes and links and their shader materials.
- Verification is a bash script that drives headless Chrome, plus a browser-run unit-test page for `network.js`.

**Tech Stack:** HTML, CSS, Three.js 0.170.0 via jsdelivr import map, Inter Tight via Google Fonts, headless Chrome and python3 `http.server` for verification, Lighthouse via `npx` for the final audit.

**Spec:** `docs/superpowers/specs/2026-09-23-aaronrama-site-design.md`

## Global Constraints

- Static files only: no build step, no npm dependencies in the repo, no bundler.
- Three.js import: `https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js`.
- Colours: bg `#04050a`, fg `#eef0f4`, dim `#838894`, accent `#5aa9ff`, hairline `#ffffff2a`.
- Font: Inter Tight 400/500. No serif fonts, no status dots, no mono eyebrow labels.
- Copy (verbatim):
  - Name: "Aaron Rama".
  - Tagline: "AI-native CTO." (accent) + " Co-founder of Keyhook."
  - CTA: "Get in touch on LinkedIn →" → `https://www.linkedin.com/in/aaronrama/`.
  - Timeline: "Keyhook 2020 – now", "DeltaSift 2019 – 2020", "Algo → Meltwater 2015 – 2019".
- Title "Aaron Rama — AI-native CTO". Description "Aaron Rama is the co-founder and CTO of Keyhook, building AI-native software from Wellington, New Zealand."
- Node counts: 1500 desktop, 900 mobile (< 760px wide or coarse pointer). Pixel ratio cap: 2 desktop, 1.5 mobile.
- Never `git push`. Commit locally only.
- Every commit message ends with the trailer: `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.

## Review Focus

1. **The Three.js CDN or the module fails to load.** The text must still appear within ~2.5s, and it must be visible immediately with JS disabled. Pinned by Task 1's shell screenshots, taken before `main.js` exists.
2. **WebGL unavailable.** The page shows the text over the CSS gradient and throws no uncaught errors. Pinned by the `nowebgl` check in `scripts/verify.sh` (Task 3).
3. **Reduced motion.** One static frame is rendered with text visible and no animation loop. Pinned by the `reduced` screenshot plus the `data-anim="off"` DOM check (Task 3).
4. **Small and landscape phones (360×640, 844×390).** The name, tagline and CTA don't overlap the timeline or get clipped. The timeline hides on short viewports. Pinned by the `small` and `landscape` screenshots (Tasks 1 and 3).
5. **Resize and background tabs.** The canvas resizes without stretching, and the loop stops while the tab is hidden and resumes with no time jump. Headless Chrome can't switch tabs, so this is pinned by the `data-anim` checks in Task 3 plus the manual tab-switch and resize check in Task 4 Step 3.

---

### Task 1: Page shell and verification script

**Files:**
- Create: `index.html`, `style.css`, `favicon.svg`, `CNAME`, `.nojekyll`, `scripts/verify.sh`

**Interfaces:**
- Produces:
  - `<canvas id="scene" aria-hidden="true">`.
  - The `<html>` element's class and attributes:
    - `loading` is added by an inline script and removed after 2500ms by the same script, or earlier by `main.js`.
    - `ready` (set by `main.js`) fades in the canvas.
    - `no-webgl` (set by `main.js`).
    - `data-anim="on|off"` (set by `main.js`).
  - `scripts/verify.sh [outdir]` exits 0 only when every check passes.

- [ ] **Step 1: Write the verification script**

`scripts/verify.sh`:
```bash
#!/usr/bin/env bash
# Headless-Chrome checks for the static site. Usage: scripts/verify.sh [outdir]
set -uo pipefail
cd "$(dirname "$0")/.."
OUT=${1:-/tmp/aaronrama-verify}; rm -rf "$OUT"; mkdir -p "$OUT"
CHROME=${CHROME:-"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}
PORT=${PORT:-8777}
python3 -m http.server "$PORT" >/dev/null 2>&1 & SRV=$!
trap 'kill $SRV 2>/dev/null' EXIT
sleep 1
URL="http://localhost:$PORT/"
G=(--headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars --virtual-time-budget=5000 --enable-logging=stderr --v=0)
NOGL=(--disable-webgl --disable-3d-apis)

shot() { local name=$1 size=$2; shift 2
  "$CHROME" "${G[@]}" --window-size="$size" "$@" --screenshot="$OUT/$name.png" "$URL" 2>"$OUT/$name.log" >/dev/null; }
dom() { local url=$1; shift; "$CHROME" "${G[@]}" "$@" --dump-dom "$url" 2>/dev/null; }

shot desktop   1440,900
shot mobile    390,844
shot small     360,640
shot landscape 844,390
shot reduced   1440,900 --force-prefers-reduced-motion
shot nowebgl   1440,900 "${NOGL[@]}"

fail=0
check() { if eval "$2"; then echo "ok   $1"; else echo "FAIL $1"; fail=1; fi; }

for f in "$OUT"/*.log; do
  check "no console errors ($(basename "$f" .log))" "! grep -E 'CONSOLE.*(Uncaught|Error)' '$f' | grep -v 'WebGL' | grep -q ."
done
check "page reaches ready"            "dom '$URL' | grep -q 'class=\"ready\"'"
check "animation on by default"       "dom '$URL' | grep -q 'data-anim=\"on\"'"
check "reduced motion is static"      "dom '$URL' --force-prefers-reduced-motion | grep -q 'data-anim=\"off\"'"
check "no-webgl fallback applied"     "dom '$URL' ${NOGL[*]} | grep -q 'no-webgl'"
check "network unit tests pass"       "dom '${URL}tests/network.test.html' | grep -q '>PASS<'"

echo "screenshots: $OUT"
exit $fail
```

Run: `chmod +x scripts/verify.sh`

- [ ] **Step 2: Run it to confirm it fails**

Run: `scripts/verify.sh`
Expected: exits 1, with every DOM check failing because `index.html` doesn't exist yet.

- [ ] **Step 3: Write the shell files**

`index.html`:
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Aaron Rama — AI-native CTO</title>
  <meta name="description" content="Aaron Rama is the co-founder and CTO of Keyhook, building AI-native software from Wellington, New Zealand.">
  <link rel="canonical" href="https://aaronrama.com/">
  <meta name="theme-color" content="#04050a">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://aaronrama.com/">
  <meta property="og:title" content="Aaron Rama — AI-native CTO">
  <meta property="og:description" content="Aaron Rama is the co-founder and CTO of Keyhook, building AI-native software from Wellington, New Zealand.">
  <meta property="og:image" content="https://aaronrama.com/og.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500&display=swap">
  <link rel="stylesheet" href="style.css">
  <script>
    // Hide the text until the scene is ready, but never for longer than 2.5s (covers CDN/module failure).
    document.documentElement.classList.add('loading');
    setTimeout(() => document.documentElement.classList.remove('loading'), 2500);
  </script>
  <script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js"}}</script>
  <script type="module" src="js/main.js"></script>
</head>
<body>
  <canvas id="scene" aria-hidden="true"></canvas>
  <main>
    <h1>Aaron Rama</h1>
    <p class="tagline"><em>AI-native CTO.</em> <span>Co-founder of Keyhook.</span></p>
    <a class="cta" href="https://www.linkedin.com/in/aaronrama/">Get in touch on LinkedIn →</a>
  </main>
  <footer>
    <ul class="tl">
      <li><b>Keyhook</b>2020 – now</li>
      <li><b>DeltaSift</b>2019 – 2020</li>
      <li><b>Algo → Meltwater</b>2015 – 2019</li>
    </ul>
  </footer>
</body>
</html>
```

`style.css`:
```css
:root{--bg:#04050a;--fg:#eef0f4;--dim:#838894;--acc:#5aa9ff;--line:#ffffff2a}
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%}
body{background:radial-gradient(ellipse at 50% 45%,#0b1322 0%,var(--bg) 70%) fixed;color:var(--fg);
  font-family:'Inter Tight',system-ui,sans-serif;overflow:hidden;-webkit-font-smoothing:antialiased}

#scene{position:fixed;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity 1.2s ease}
.ready #scene{opacity:1}

main{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;padding:0 16px 64px}
h1{font-weight:500;font-size:clamp(56px,11vw,176px);letter-spacing:-.06em;line-height:.95}
.tagline{margin:22px 0 34px;font-size:clamp(17px,2vw,20px);line-height:1.4}
.tagline em{font-style:normal;color:var(--acc)}
.tagline span{color:var(--dim)}
.cta{display:inline-block;color:var(--fg);font-size:16px;text-decoration:none;padding:14px 22px;
  border:1px solid var(--line);border-radius:2px;transition:border-color .2s}
.cta:hover,.cta:focus-visible{border-color:var(--acc);outline:none}

.tl{position:fixed;bottom:28px;left:0;right:0;display:flex;justify-content:center;gap:40px;
  list-style:none;font-size:13px;line-height:1.35;color:var(--dim)}
.tl b{display:block;color:var(--fg);font-weight:500}

main,.tl{transition:opacity .8s ease .5s,transform .8s ease .5s}
.loading main,.loading .tl{opacity:0;transform:translateY(12px)}

@media (max-width:760px){
  .tl{flex-direction:column;align-items:center;gap:10px;bottom:24px;text-align:center}
  main{padding-bottom:170px}
}
@media (max-height:520px){ .tl{display:none} main{padding-bottom:0} }
@media (prefers-reduced-motion:reduce){ #scene,main,.tl{transition:none} }
```

`favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#04050a"/><path d="M8 22 15 9l9 6-6 9zM15 9l3 15" fill="none" stroke="#5aa9ff" stroke-width="1.6" stroke-opacity=".55"/><g fill="#eef0f4"><circle cx="8" cy="22" r="2.2"/><circle cx="15" cy="9" r="2.2"/><circle cx="24" cy="15" r="2.2"/></g><circle cx="18" cy="24" r="2.6" fill="#5aa9ff"/></svg>
```

`CNAME` (single line): `aaronrama.com`

`.nojekyll`: empty file.

- [ ] **Step 4: Run verification and inspect the screenshots**

Run: `scripts/verify.sh`
Expected:
- Exits 1. "page reaches ready", "animation on", "reduced motion", "no-webgl" and "network unit tests" fail, because `js/main.js` and the tests don't exist yet.
- The console-error checks may flag the missing `main.js` (404). That's expected at this stage.
- Screenshots (`desktop`, `mobile`, `small`, `landscape`) show the full text on the gradient. This proves the 2.5s fallback works when the module fails (Review Focus 1).
- `landscape` has no timeline, and nothing overlaps in `small`.

- [ ] **Step 5: Commit**

```bash
git add index.html style.css favicon.svg CNAME .nojekyll scripts/verify.sh
git commit -m "Add static page shell and headless verification script"
```

---

### Task 2: Network generation module

**Files:**
- Create: `tests/network.test.html`, `js/network.js`

**Interfaces:**
- Produces (from `js/network.js`):
  - `rng(seed = 1) → () => number`: a deterministic PRNG returning values in [0, 1).
  - `makeNodes(count, { inner = 1.6, outer = 9.1, random = rng(1) }) → THREE.Vector3[]`: points in a spherical shell with inner ≤ |p| ≤ outer.
  - `linkNeighbours(points, maxDist = 1.15, maxLinks = 2) → Array<[i, j]>`: index pairs with i < j and distance < maxDist, each i the first index at most maxLinks times.
  - `createNetwork({ count, accent, dpr = 1, fade = 9, pulseRate = .28, random = rng(1) }) → { group: THREE.Group, uniforms, stats: { nodes, links } }`.
    - `group.children` is `[Points, LineSegments]`.
    - `uniforms` is `{ t, pointer (Vector2 NDC; 9,9 = off-screen), accent, dpr, fade }`, each `{ value }`.

- [ ] **Step 1: Write the failing test page**

`tests/network.test.html`:
```html
<!doctype html>
<html><head><meta charset="utf-8"><title>network.js tests</title>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js"}}</script>
</head><body><pre id="out">RUNNING</pre>
<script type="module">
const out = document.getElementById('out');
const fails = [];
const assert = (cond, msg) => { if (!cond) fails.push(msg); };
try {
  const { rng, makeNodes, linkNeighbours, createNetwork } = await import('../js/network.js');

  const a = makeNodes(500, { random: rng(7) }), b = makeNodes(500, { random: rng(7) });
  assert(a.length === 500, 'makeNodes returns count points');
  assert(a.every((p, i) => p.equals(b[i])), 'same seed gives same points');
  assert(a.every(p => p.length() >= 1.6 - 1e-6 && p.length() <= 9.1 + 1e-6), 'points lie in shell 1.6..9.1');

  const links = linkNeighbours(a, 1.15, 2);
  const firsts = {};
  links.forEach(([i, j]) => { firsts[i] = (firsts[i] || 0) + 1; });
  assert(links.length > 0, 'some links exist');
  assert(links.every(([i, j]) => i < j && a[i].distanceTo(a[j]) < 1.15), 'links are i<j and shorter than maxDist');
  assert(Object.values(firsts).every(n => n <= 2), 'at most maxLinks per node');

  const net = createNetwork({ count: 300, accent: '#5aa9ff', dpr: 2 });
  assert(net.stats.nodes === 300, 'stats.nodes matches count');
  assert(net.stats.links > 0, 'stats.links > 0');
  assert(net.group.children.length === 2, 'group has points + lines');
  assert(net.group.children[0].isPoints && net.group.children[1].isLineSegments, 'children are Points then LineSegments');
  assert(net.uniforms.pointer.value.x === 9 && net.uniforms.dpr.value === 2, 'uniform defaults');
  assert(net.group.children[1].material.uniforms.t === net.uniforms.t, 'line material shares the t uniform');
} catch (e) { fails.push('threw: ' + e.message); }
out.textContent = fails.length ? 'FAIL\n' + fails.join('\n') : 'PASS';
</script></body></html>
```

- [ ] **Step 2: Run the test to confirm it fails**

Run:
```bash
python3 -m http.server 8777 >/dev/null 2>&1 & sleep 1
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --virtual-time-budget=5000 --dump-dom http://localhost:8777/tests/network.test.html 2>/dev/null | grep -A3 '<pre'
kill %1
```
Expected: `FAIL` then `threw: ...` (the module doesn't exist yet).

- [ ] **Step 3: Implement `js/network.js`**

```js
import * as THREE from 'three';

// Deterministic PRNG (Park–Miller) so the network looks the same on every load.
export function rng(seed = 1) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647, (s - 1) / 2147483646);
}

// Points in a hollow sphere around the camera: uniform direction, uniform radius in [inner, outer].
export function makeNodes(count, { inner = 1.6, outer = 9.1, random = rng(1) } = {}) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    const y = random() * 2 - 1, th = random() * Math.PI * 2, r = Math.sqrt(1 - y * y);
    const d = inner + random() * (outer - inner);
    pts.push(new THREE.Vector3(r * Math.cos(th) * d, y * d, r * Math.sin(th) * d));
  }
  return pts;
}

// Link each point to up to maxLinks later points closer than maxDist.
export function linkNeighbours(points, maxDist = 1.15, maxLinks = 2) {
  const links = [];
  for (let i = 0; i < points.length; i++) {
    let n = 0;
    for (let j = i + 1; j < points.length && n < maxLinks; j++) {
      if (points[i].distanceTo(points[j]) < maxDist) { links.push([i, j]); n++; }
    }
  }
  return links;
}

const FADE = `uniform float fade; float depthFade(float w){ return smoothstep(fade, fade * .25, w); }`;

const NODE_VERT = `uniform vec2 pointer; uniform float dpr; attribute float size; varying float vHot; varying float vFade; ${FADE}
  void main(){
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.);
    vHot = smoothstep(.35, 0., distance(clip.xy / clip.w, pointer));
    vFade = depthFade(clip.w);
    gl_PointSize = (2. + size * 3. + vHot * 6.) * .8 * dpr * (4. / clip.w);
    gl_Position = clip;
  }`;
const NODE_FRAG = `uniform vec3 accent; varying float vHot; varying float vFade;
  void main(){
    float d = length(gl_PointCoord - .5); if (d > .5) discard;
    gl_FragColor = vec4(mix(vec3(.9), accent, vHot), smoothstep(.5, 0., d) * (.55 + vHot * .45) * vFade);
  }`;
const LINE_VERT = `attribute float along; attribute float seed; varying float vAlong; varying float vSeed; varying float vFade; ${FADE}
  void main(){
    vAlong = along; vSeed = seed;
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.);
    vFade = depthFade(clip.w);
    gl_Position = clip;
  }`;
const LINE_FRAG = `uniform float t; uniform vec3 accent; uniform float pulseCut; varying float vAlong; varying float vSeed; varying float vFade;
  void main(){
    float phase = fract(t * (.15 + vSeed * .25) + vSeed * 7.);
    float pulse = smoothstep(.12, 0., abs(vAlong - phase)) * step(pulseCut, vSeed);
    gl_FragColor = vec4(mix(vec3(1.), accent, pulse), (.1 + pulse * .9) * vFade);
  }`;

const additive = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };

export function createNetwork({ count, accent, dpr = 1, fade = 9, pulseRate = .28, random = rng(1) }) {
  const uniforms = {
    t: { value: 0 },
    pointer: { value: new THREE.Vector2(9, 9) },
    accent: { value: new THREE.Color(accent) },
    dpr: { value: dpr },
    fade: { value: fade },
  };
  const points = makeNodes(count, { random });
  const links = linkNeighbours(points);

  const nodeGeo = new THREE.BufferGeometry().setFromPoints(points);
  nodeGeo.setAttribute('size', new THREE.Float32BufferAttribute(points.map(() => random()), 1));
  const nodes = new THREE.Points(nodeGeo, new THREE.ShaderMaterial({ uniforms, vertexShader: NODE_VERT, fragmentShader: NODE_FRAG, ...additive }));

  const pos = [], along = [], seed = [];
  for (const [i, j] of links) {
    pos.push(...points[i].toArray(), ...points[j].toArray());
    along.push(0, 1);
    const s = random(); seed.push(s, s);
  }
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  lineGeo.setAttribute('along', new THREE.Float32BufferAttribute(along, 1));
  lineGeo.setAttribute('seed', new THREE.Float32BufferAttribute(seed, 1));
  const lines = new THREE.LineSegments(lineGeo, new THREE.ShaderMaterial({
    uniforms: { ...uniforms, pulseCut: { value: 1 - pulseRate } }, vertexShader: LINE_VERT, fragmentShader: LINE_FRAG, ...additive }));

  const group = new THREE.Group();
  group.add(nodes, lines);
  return { group, uniforms, stats: { nodes: points.length, links: links.length } };
}
```
Note: `{ ...uniforms, pulseCut }` copies the object but keeps the same `{ value }` references, so updating `uniforms.t.value` drives both materials.

- [ ] **Step 4: Run the test to confirm it passes**

Run the same command as Step 2.
Expected: `<pre id="out">PASS</pre>`.

- [ ] **Step 5: Commit**

```bash
git add js/network.js tests/network.test.html
git commit -m "Add network generation module with browser unit tests"
```

---

### Task 3: Scene runtime (`js/main.js`)

**Files:**
- Create: `js/main.js`

**Interfaces:**
- Consumes: `createNetwork({ count, accent, dpr })` from Task 2. The `#scene` canvas and the `loading`/`ready`/`no-webgl` classes from Task 1.
- Produces: `<html data-anim="on|off">` reflecting whether the loop is running; `ready` or `no-webgl` class on `<html>`.

- [ ] **Step 1: Run verification to confirm the runtime checks fail**

Run: `scripts/verify.sh`
Expected:
- "network unit tests pass" now shows ok.
- "page reaches ready", "animation on", "reduced motion is static" and "no-webgl fallback applied" show FAIL.

- [ ] **Step 2: Implement `js/main.js`**

```js
import * as THREE from 'three';
import { createNetwork } from './network.js';

const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = innerWidth < 760 || matchMedia('(pointer: coarse)').matches;
const OFFSCREEN = new THREE.Vector2(9, 9), CENTRE = new THREE.Vector2();

function reveal(cls) {
  root.classList.add(cls);
  root.classList.remove('loading');
}

function start() {
  const canvas = document.getElementById('scene');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    root.dataset.anim = 'off';
    reveal('no-webgl');
    return;
  }
  const dpr = Math.min(devicePixelRatio, mobile ? 1.5 : 2);
  renderer.setPixelRatio(dpr);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 1, .1, 100);
  const { group, uniforms } = createNetwork({ count: mobile ? 900 : 1500, accent: '#5aa9ff', dpr });
  scene.add(group);

  // Pointer in normalised device coords; OFFSCREEN means "no pointer" (touch, or left the window).
  const pointer = OFFSCREEN.clone(), look = new THREE.Vector2();
  if (!mobile && !reducedMotion) {
    addEventListener('pointermove', e => pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1));
    document.addEventListener('pointerleave', () => pointer.copy(OFFSCREEN));
  }

  let running = false, last = 0, elapsed = 0;
  const render = () => renderer.render(scene, camera);

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    if (!running) render();
  }

  function frame(now) {
    elapsed += Math.min(now - last, 50); // clamp so a stalled tab doesn't jump
    last = now;
    uniforms.t.value = elapsed * .001;
    uniforms.pointer.value.lerp(pointer, .1);
    look.lerp(pointer.x < 5 ? pointer : CENTRE, .03);
    group.rotation.set(elapsed * .00001, elapsed * .00004, 0);
    camera.rotation.set(look.y * .08, -look.x * .12, 0);
    render();
  }

  function play() {
    if (reducedMotion || running || document.hidden) return;
    running = true; last = performance.now();
    root.dataset.anim = 'on';
    renderer.setAnimationLoop(frame);
  }
  function pause() {
    if (!running) return;
    running = false;
    root.dataset.anim = 'off';
    renderer.setAnimationLoop(null);
  }

  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : play()));
  addEventListener('blur', pause);
  addEventListener('focus', play);

  root.dataset.anim = 'off';
  resize(); // sizes the canvas and draws the first (for reduced motion: only) frame
  requestAnimationFrame(() => reveal('ready'));
  play();
}

start();
```

- [ ] **Step 3: Run verification to confirm everything passes**

Run: `scripts/verify.sh`
Expected:
- Every line shows `ok` and the script exits 0.
- If "animation on by default" fails in headless mode because the window starts unfocused and fires `blur`, confirm by printing `document.hasFocus()`. Fix it by only binding `blur`/`focus` when `document.hasFocus()` is true at startup. Don't remove the visibility pause.

- [ ] **Step 4: Inspect screenshots against the spec**

Open `/tmp/aaronrama-verify/*.png` and check:
- `desktop`: network fills the screen, name centred, timeline bottom-centre.
- `mobile` and `small`: timeline stacked, no overlap with the CTA.
- `landscape`: timeline hidden, text fits.
- `reduced`: network visible and static, text visible.
- `nowebgl`: text on the dark radial gradient, no canvas content.

- [ ] **Step 5: Commit**

```bash
git add js/main.js
git commit -m "Add scene runtime with pause, reduced-motion and WebGL fallback"
```

---

### Task 4: Social image, audit, final check

**Files:**
- Create: `og.png`

**Interfaces:**
- Consumes: the finished page from Tasks 1–3.

- [ ] **Step 1: Generate `og.png` (1200×630) from the live page**

```bash
python3 -m http.server 8777 >/dev/null 2>&1 & sleep 1
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars --window-size=1200,630 --virtual-time-budget=5000 --screenshot="$PWD/og.png" http://localhost:8777/ 2>/dev/null
kill %1
```
Expected: `og.png` shows the network with the name centred. Check it with an image viewer.

- [ ] **Step 2: Run Lighthouse**

```bash
python3 -m http.server 8777 >/dev/null 2>&1 & sleep 1
npx -y lighthouse http://localhost:8777/ --quiet --chrome-flags="--headless=new" --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=/tmp/aaronrama-lh.json
node -e 'const r=require("/tmp/aaronrama-lh.json").categories;for(const k in r)console.log(k,Math.round(r[k].score*100))'
kill %1
```
Expected: every category ≥ 90.
- If performance is below 90 because of CPU-rendered WebGL in headless mode, record the score and the main contributor. Don't chase it unless the issue also reproduces with GPU.
- Fix accessibility, best-practices or SEO failures in `index.html`/`style.css` and re-run.

- [ ] **Step 3: Full verification pass and manual check**

- Run `scripts/verify.sh` and expect it to exit 0.
- Open `http://localhost:8777/` in a real browser. Check that:
  - pointer hover lights up nearby nodes;
  - the camera eases toward the pointer;
  - switching tabs and back resumes smoothly, with no time jump;
  - resizing the window keeps the network undistorted;
  - the CTA opens LinkedIn;
  - Tab focus shows the accent border on the CTA.

- [ ] **Step 4: Commit**

```bash
git add og.png
git commit -m "Add social preview image"
```

Then report to Aaron that it's ready to push. Do **not** push.
