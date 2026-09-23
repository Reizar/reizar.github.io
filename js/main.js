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
  // Start motion only after the fade-in: a busy render loop can stall the CSS transitions and leave the text invisible.
  setTimeout(play, 1500);
}

start();
