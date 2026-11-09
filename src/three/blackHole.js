import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { vertexShader, fragmentShader } from "./blackHoleShader.js";

// ------------------------------------------------------------
//  Camera keyframes — one per <section>, in order.
//  dist: distance from the singularity (in Schwarzschild radii)
//  elev: angle above the disk plane (radians)
//  azim: orbit angle around the hole (radians)
//  shift: where on screen the hole sits (x, y), fov: zoom
//  The last key sits *inside* the horizon (dist < 1): scrolling into the
//  Singularity section drops the camera through the event horizon.
// ------------------------------------------------------------
export const KEYS = [
  { dist: 24,   elev: 0.075, azim: 0.0, shift: [0.26, 0.08],  fov: 0.9,  roll: -0.06 }, // hero
  { dist: 15,   elev: 0.28,  azim: 0.7, shift: [0.36, 0.0],   fov: 0.95, roll: 0.04 },  // about (panel left)
  { dist: 13,   elev: 0.2,   azim: 1.2, shift: [-0.36, 0.02], fov: 0.95, roll: 0.06 },  // experience (panel right)
  { dist: 30,   elev: 0.55,  azim: 1.9, shift: [0.0, 0.22],   fov: 0.8,  roll: 0.0 },   // projects
  { dist: 11,   elev: 0.12,  azim: 2.6, shift: [0.36, 0.0],   fov: 1.0,  roll: -0.1 },  // skills (panel left)
  { dist: 0.55, elev: 0.04,  azim: 3.2, shift: [0.0, 0.3],    fov: 1.15, roll: 0.0 },   // contact — past the horizon; the light sits above the heading
];

const smoothstep = (e0, e1, x) => {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
  return t * t * (3 - 2 * t);
};

/**
 * Mounts the ray-traced black hole on `canvas`.
 * `hud` holds DOM nodes updated every frame: { r, dilation, local, earth, side, progress }.
 * Returns a cleanup function.
 */
export function createBlackHole({ canvas, hud, onReady }) {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = matchMedia("(max-width: 900px)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
  } catch (e) {
    console.warn("WebGL unavailable — showing static fallback.", e);
    onReady();
    return () => {};
  }

  // If the GPU drops the context (driver reset, too-slow frame), ask the
  // browser to give it back — three.js rebuilds its state on restore.
  const onLost = (e) => { e.preventDefault(); console.warn("WebGL context lost"); };
  const onRestored = () => console.warn("WebGL context restored");
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const uniforms = {
    uRes: { value: new THREE.Vector2() },
    uTime: { value: 0 },
    uCamPos: { value: new THREE.Vector3(0, 2, 24) },
    uCamTarget: { value: new THREE.Vector3(0, 0, 0) },
    uShift: { value: new THREE.Vector2() },
    uFov: { value: 0.85 },
    uRoll: { value: 0 },
    uSteps: { value: isMobile ? 160 : 260 },
    uDive: { value: 0 },
  };

  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, depthWrite: false, depthTest: false });
  const quad = new THREE.Mesh(geometry, material);
  quad.frustumCulled = false;
  scene.add(quad);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.45, 0.25, 0.85);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---------- adaptive resolution ----------
  // Ray-marching every pixel is expensive; render at a fraction of the
  // screen resolution and adjust on the fly to hold a smooth framerate.
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let quality = isMobile ? 0.5 : 0.75;
  const Q_MIN = 0.35, Q_MAX = 1.0;

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    const pr = dpr * quality;
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(pr);
    composer.setSize(w, h);
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    uniforms.uRes.value.copy(size);
    measureSections();
  }

  // ---------- scroll → camera ----------
  const sections = [...document.querySelectorAll("main > section")];
  let centers = [];
  function measureSections() {
    centers = sections.map((s) => s.offsetTop + s.offsetHeight / 2);
  }

  function scrollIndex() {
    if (!centers.length) return 0;
    const mid = window.scrollY + window.innerHeight / 2;
    if (mid <= centers[0]) return 0;
    for (let i = 0; i < centers.length - 1; i++) {
      if (mid < centers[i + 1]) return i + (mid - centers[i]) / (centers[i + 1] - centers[i]);
    }
    return centers.length - 1;
  }

  const ease = (t) => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  function keyAt(f) {
    const i = Math.min(Math.floor(f), KEYS.length - 2);
    const t = ease(Math.min(Math.max(f - i, 0), 1));
    const a = KEYS[i], b = KEYS[i + 1];
    return {
      // distance interpolates logarithmically so the final plunge
      // through the horizon is spread across the scroll, not crammed at the end
      dist: Math.exp(lerp(Math.log(a.dist), Math.log(b.dist), t)),
      elev: lerp(a.elev, b.elev, t),
      azim: lerp(a.azim, b.azim, t),
      sx: lerp(a.shift[0], b.shift[0], t),
      sy: lerp(a.shift[1], b.shift[1], t),
      fov: lerp(a.fov, b.fov, t),
      roll: lerp(a.roll, b.roll, t),
    };
  }

  const cur = { ...keyAt(0) };
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const onPointer = (e) => {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener("pointermove", onPointer);

  // ---------- HUD ----------
  let tLocal = 0, tEarth = 0;
  const fmt = (s) => {
    s = Math.floor(s);
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    return `${h}:${m}:${String(s % 60).padStart(2, "0")}`;
  };

  // ---------- loop ----------
  const clock = new THREE.Clock();
  let frames = 0, acc = 0, firstFrame = true, raf = 0;

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.1);
    if (!reducedMotion) uniforms.uTime.value += dt;

    // camera target from scroll
    const f = scrollIndex();
    const k = keyAt(f);
    hud.side.classList.toggle("hidden", f > 1.4 && f < 4.6); // stay clear of the content panels
    const damp = 1 - Math.exp(-dt * 3.2);
    for (const key in k) cur[key] += (k[key] - cur[key]) * damp;
    mouse.x += (mouse.tx - mouse.x) * damp;
    mouse.y += (mouse.ty - mouse.y) * damp;

    const drift = reducedMotion ? 0 : uniforms.uTime.value * 0.004;
    const azim = cur.azim + mouse.x * 0.06 + drift;
    const elev = cur.elev - mouse.y * 0.035;
    const d = cur.dist;
    uniforms.uCamPos.value.set(
      d * Math.cos(elev) * Math.sin(azim),
      d * Math.sin(elev),
      d * Math.cos(elev) * Math.cos(azim)
    );
    const shiftScale = isMobile ? 0.25 : 1;
    uniforms.uShift.value.set(cur.sx * shiftScale, cur.sy);
    uniforms.uFov.value = cur.fov;
    uniforms.uRoll.value = cur.roll;
    uniforms.uDive.value = smoothstep(1.3, 0.75, d); // fades in as the camera crosses r_s = 1

    composer.render();

    // HUD — gravitational time dilation for a static observer: γ = 1/√(1 − r_s/r).
    // Inside the horizon no static observer exists, so the clocks read ∞.
    const inside = d <= 1.0005;
    const gamma = inside ? Infinity : 1 / Math.sqrt(1 - 1 / d);
    tLocal += dt;
    if (!inside) tEarth += dt * gamma * 3600 * 0.25; // exaggerated for fun: every local second ≈ 15 Earth minutes × γ
    hud.r.textContent = d.toFixed(2);
    hud.dilation.textContent = inside ? "∞" : gamma.toFixed(4) + "×";
    hud.local.textContent = fmt(tLocal);
    hud.earth.textContent = inside ? "∞" : fmt(tEarth);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    hud.progress.style.height = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";

    // adaptive quality
    acc += dt; frames++;
    if (acc > 1.5) {
      const fps = frames / acc;
      if (fps < 40 && quality > Q_MIN) { quality = Math.max(Q_MIN, quality - 0.1); resize(); }
      else if (fps > 58 && quality < Q_MAX) { quality = Math.min(Q_MAX, quality + 0.05); resize(); }
      acc = 0; frames = 0;
    }

    if (firstFrame) { firstFrame = false; onReady(); }
    raf = requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("load", measureSections);
  // re-measure when content reflows (web fonts arriving, images, etc.)
  const ro = new ResizeObserver(measureSections);
  const main = document.querySelector("main");
  if (main) ro.observe(main);

  resize();
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    window.removeEventListener("resize", resize);
    window.removeEventListener("load", measureSections);
    window.removeEventListener("pointermove", onPointer);
    canvas.removeEventListener("webglcontextlost", onLost);
    canvas.removeEventListener("webglcontextrestored", onRestored);
    geometry.dispose();
    material.dispose();
    bloom.dispose();
    composer.dispose();
    renderer.dispose();
  };
}
