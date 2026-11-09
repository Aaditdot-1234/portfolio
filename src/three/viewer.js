import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
/**
 * Interactive 3D project viewer.
 * Returns an API ({ showProject, loadFile, setWireframe, setAutoRotate, reset, dispose })
 * or null if WebGL is unavailable. Text output goes through onTitle / onStats.
 */
export function createViewer({ canvas, wrap, onTitle, onStats }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envTarget.texture;
  scene.environmentIntensity = 0.35;

  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 200);
  const HOME = new THREE.Vector3(3.6, 1.8, 4.6);
  camera.position.copy(HOME);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.9;
  controls.enablePan = false;
  controls.minDistance = 1.5;
  controls.maxDistance = 14;
  controls.enableZoom = true;

  // Lighting: warm "accretion" key, cold rim, dim fill
  const key = new THREE.DirectionalLight(0xffb36b, 3.2);
  key.position.set(4, 2, 3);
  const rim = new THREE.DirectionalLight(0x7fa8ff, 2.0);
  rim.position.set(-4, 1.5, -4);
  const fill = new THREE.HemisphereLight(0x332211, 0x000000, 0.6);
  scene.add(key, rim, fill);

  const grid = new THREE.PolarGridHelper(2.6, 12, 6, 64, 0x5a3a20, 0x2a1a10);
  grid.position.y = -1.25;
  grid.material.transparent = true;
  grid.material.opacity = 0.45;
  scene.add(grid);

  let current = null;     // { object, update? }
  let wireframe = false;

  // ---------- materials ----------
  const hull = () => new THREE.MeshStandardMaterial({ color: 0xbdb6ab, metalness: 0.75, roughness: 0.38 });
  const dark = () => new THREE.MeshStandardMaterial({ color: 0x2b2b30, metalness: 0.6, roughness: 0.5 });
  const glow = (c = 0xffa24a, i = 2.5) =>
    new THREE.MeshStandardMaterial({ color: 0x000000, emissive: c, emissiveIntensity: i });

  // ---------- procedural project visuals ----------
  const additive = (color, opacity) =>
    new THREE.LineBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });

  const builders = {
    // MindFirst: a two-hemisphere neural mesh with signals firing along synapses
    neural() {
      const g = new THREE.Group();
      const N = 170, pts = [];
      for (let i = 0; i < N; i++) {
        // Fibonacci sphere, squashed into a brain-like ellipsoid with a central fissure
        const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.39996;
        const p = new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r);
        p.x += Math.sign(p.x || 1) * 0.12;
        p.multiply(new THREE.Vector3(1.2, 0.9, 1.05));
        p.multiplyScalar(1 + Math.sin(i * 12.9898) * 0.04);
        pts.push(p);
      }
      const nodes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.028, 8, 8), glow(0xc59bff, 2.2), N);
      const m = new THREE.Matrix4();
      pts.forEach((p, i) => { m.makeTranslation(p.x, p.y, p.z); nodes.setMatrixAt(i, m); });
      g.add(nodes);

      const edges = [];
      pts.forEach((p, i) => {
        pts.map((q, j) => [j, p.distanceToSquared(q)])
          .filter(([j]) => j > i && Math.sign(pts[j].x) === Math.sign(p.x))
          .sort((a, b) => a[1] - b[1]).slice(0, 3)
          .forEach(([j]) => edges.push([i, j]));
      });
      const lineGeo = new THREE.BufferGeometry().setFromPoints(edges.flatMap(([a, b]) => [pts[a], pts[b]]));
      const lines = new THREE.LineSegments(lineGeo, additive(0x9a6bff, 0.35));
      g.add(lines);

      const S = 40;
      const sparkGeo = new THREE.BufferGeometry();
      sparkGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(S * 3), 3));
      const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({
        color: 0xffd6a0, size: 0.07, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      g.add(sparks);
      const state = Array.from({ length: S }, () => ({ e: (Math.random() * edges.length) | 0, t: Math.random(), s: 0.6 + Math.random() }));
      const tmp = new THREE.Vector3();
      let last = 0;
      return { object: g, update: (t) => {
        const dt = t - last; last = t;
        const arr = sparkGeo.attributes.position.array;
        state.forEach((s, k) => {
          s.t += dt * s.s;
          if (s.t > 1) { s.t = 0; s.e = (Math.random() * edges.length) | 0; }
          const [a, b] = edges[s.e];
          tmp.lerpVectors(pts[a], pts[b], s.t);
          arr[k * 3] = tmp.x; arr[k * 3 + 1] = tmp.y; arr[k * 3 + 2] = tmp.z;
        });
        sparkGeo.attributes.position.needsUpdate = true;
        lines.material.opacity = 0.28 + Math.sin(t * 2) * 0.08;
        g.rotation.y = t * 0.12;
      } };
    },

    // Sim Sim: a voice orb that ripples like speech, ringed by an equaliser
    voice() {
      const g = new THREE.Group();
      const geo = new THREE.IcosahedronGeometry(0.75, 20);
      const base = geo.attributes.position.array.slice();
      const orb = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        color: 0x0b1a22, metalness: 0.9, roughness: 0.2, emissive: 0x1aa6c9, emissiveIntensity: 0.35,
      }));
      g.add(orb);
      const core = new THREE.PointLight(0x4fd8ff, 4, 5);
      g.add(core);
      const BARS = 56, bars = [];
      for (let i = 0; i < BARS; i++) {
        const a = (i / BARS) * Math.PI * 2;
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1, 0.04), glow(i % 2 ? 0x4fd8ff : 0xffb36b, 2));
        bar.position.set(Math.cos(a) * 1.45, 0, Math.sin(a) * 1.45);
        g.add(bar); bars.push(bar);
      }
      const waves = [0, 1, 2].map(() => {
        const w = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.006, 6, 128), glow(0x4fd8ff, 3));
        w.material.transparent = true; w.rotation.x = Math.PI / 2;
        g.add(w); return w;
      });
      const v = new THREE.Vector3(), n = new THREE.Vector3();
      return { object: g, update: (t) => {
        const pos = geo.attributes.position;
        const talk = 0.5 + 0.5 * Math.sin(t * 1.7) * Math.sin(t * 0.6);
        for (let i = 0; i < pos.count; i++) {
          v.set(base[i * 3], base[i * 3 + 1], base[i * 3 + 2]);
          n.copy(v).normalize();
          const d = Math.sin(n.x * 5 + t * 3) * Math.sin(n.y * 6 - t * 2.3) * Math.sin(n.z * 4 + t * 1.7);
          v.multiplyScalar(1 + d * 0.12 * talk);
          pos.setXYZ(i, v.x, v.y, v.z);
        }
        pos.needsUpdate = true;
        geo.computeVertexNormals();
        bars.forEach((b, i) => {
          b.scale.y = 0.08 + talk * Math.abs(Math.sin(i * 0.7 + t * 6) * Math.sin(i * 0.23 - t * 2.5)) * 0.7;
        });
        waves.forEach((w, k) => {
          const p = (t * 0.5 + k / 3) % 1;
          w.scale.setScalar(0.9 + p * 1.2);
          w.material.opacity = 1 - p;
        });
        core.intensity = 2 + talk * 4;
        g.rotation.y = t * 0.2; g.rotation.x = 0.35;
      } };
    },

    // Committee Connect: committee hubs with members orbiting, all linked to a core
    network() {
      const g = new THREE.Group();
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 1), glow(0xffa24a, 3));
      g.add(core);
      const HUBS = 8, MEMBERS = 6;
      const hubs = [], members = [];
      for (let h = 0; h < HUBS; h++) {
        const a = (h / HUBS) * Math.PI * 2;
        const hub = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), hull());
        hub.userData.base = new THREE.Vector3(Math.cos(a) * 1.2, Math.sin(a * 2) * 0.35, Math.sin(a) * 1.2);
        g.add(hub); hubs.push(hub);
        for (let k = 0; k < MEMBERS; k++) {
          const mbr = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), glow(0xffd6a0, 1.8));
          mbr.userData = { hub, phase: (k / MEMBERS) * Math.PI * 2, tilt: k * 0.9 + h, r: 0.22 + (k % 2) * 0.06 };
          g.add(mbr); members.push(mbr);
        }
      }
      const segCount = HUBS * 2 + HUBS * MEMBERS; // core→hub, hub→next hub, hub→member
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(segCount * 6), 3));
      const lines = new THREE.LineSegments(lineGeo, additive(0xffb36b, 0.4));
      lines.frustumCulled = false;
      g.add(lines);
      const zero = new THREE.Vector3();
      return { object: g, update: (t) => {
        hubs.forEach((hub, h) => hub.position.copy(hub.userData.base).multiplyScalar(1 + Math.sin(t * 0.8 + h) * 0.04));
        members.forEach((mb) => {
          const { hub, phase, tilt, r } = mb.userData, a = phase + t * 1.2;
          mb.position.set(Math.cos(a) * r, Math.sin(a) * r * Math.sin(tilt), Math.sin(a) * r * Math.cos(tilt)).add(hub.position);
        });
        const arr = lineGeo.attributes.position.array;
        let o = 0;
        const seg = (p, q) => { arr[o++] = p.x; arr[o++] = p.y; arr[o++] = p.z; arr[o++] = q.x; arr[o++] = q.y; arr[o++] = q.z; };
        hubs.forEach((hub, h) => { seg(zero, hub.position); seg(hub.position, hubs[(h + 1) % HUBS].position); });
        members.forEach((mb) => seg(mb.userData.hub.position, mb.position));
        lineGeo.attributes.position.needsUpdate = true;
        core.rotation.y = t; core.rotation.x = t * 0.5;
        g.rotation.y = t * 0.15;
      } };
    },

    // Carbon Footprint Calculator: a living Earth-like world with drifting clouds
    planet() {
      const g = new THREE.Group();
      const geo = new THREE.IcosahedronGeometry(1.0, 48);
      const pos = geo.attributes.position;
      const colors = new Float32Array(pos.count * 3);
      const v = new THREE.Vector3();
      const ocean = new THREE.Color(0x0a2f55), shore = new THREE.Color(0x2a8a9a);
      const land = new THREE.Color(0x2f7a3a), high = new THREE.Color(0x7a6a45), snow = new THREE.Color(0xf0f4f2);
      const c = new THREE.Color();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).normalize();
        const h =
          Math.sin(v.x * 3.1 + v.y * 1.7) * 0.5 + Math.sin(v.z * 4.3 - v.x * 2.2) * 0.35 +
          Math.sin(v.y * 9 + v.z * 7) * 0.12 + Math.sin(v.x * 21 + v.y * 17) * 0.05;
        const n = (h + 1) / 2;
        const isLand = n > 0.55;
        if (isLand) v.multiplyScalar(1.0 + (n - 0.55) * 0.12);
        pos.setXYZ(i, v.x, v.y, v.z);
        if (!isLand) c.copy(ocean).lerp(shore, Math.pow(n / 0.55, 4));
        else c.copy(land).lerp(high, Math.min((n - 0.55) / 0.35, 1));
        if (Math.abs(v.y) > 0.88) c.copy(snow);
        colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
      }
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geo.computeVertexNormals();
      const planet = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.05 }));
      g.add(planet);

      const cloudGeo = new THREE.IcosahedronGeometry(1.07, 24);
      const cp = cloudGeo.attributes.position, alphas = [];
      for (let i = 0; i < cp.count; i++) {
        v.fromBufferAttribute(cp, i).normalize();
        const band = Math.sin(v.y * 9 + Math.sin(v.x * 3 + v.z * 2) * 2.5);
        const detail = Math.sin(v.x * 13 - v.z * 11) * Math.sin(v.y * 7 + v.z * 17);
        alphas.push(Math.max(0, band * 0.6 + detail * 0.5));
      }
      cloudGeo.setAttribute("alpha", new THREE.Float32BufferAttribute(alphas, 1));
      const clouds = new THREE.Mesh(cloudGeo, new THREE.ShaderMaterial({
        transparent: true, depthWrite: false,
        vertexShader: `attribute float alpha; varying float vA; varying vec3 vN;
          void main(){ vA = alpha; vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
        fragmentShader: `varying float vA; varying vec3 vN;
          void main(){ float l = 0.35 + 0.65*max(dot(vN, normalize(vec3(0.6,0.3,0.7))), 0.0); gl_FragColor = vec4(vec3(l), smoothstep(0.35,0.95,vA)*0.6); }`,
      }));
      g.add(clouds);

      const atmo = new THREE.Mesh(
        new THREE.SphereGeometry(1.22, 64, 64),
        new THREE.ShaderMaterial({
          transparent: true, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending,
          vertexShader: `varying vec3 vN; varying vec3 vV;
            void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
          fragmentShader: `varying vec3 vN; varying vec3 vV;
            void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 3.0); gl_FragColor = vec4(vec3(0.35,0.85,0.75)*f*1.4, f); }`,
        })
      );
      g.add(atmo);
      g.rotation.z = 0.4;
      return { object: g, update: (t) => { planet.rotation.y = t * 0.12; clouds.rotation.y = t * 0.17; } };
    },
  };

  // ---------- model management ----------
  function stats(obj) {
    let tris = 0, verts = 0;
    obj.traverse((o) => {
      if (!o.isMesh) return;
      const g = o.geometry;
      const n = o.isInstancedMesh ? o.count : 1;
      verts += g.attributes.position.count * n;
      tris += (g.index ? g.index.count / 3 : g.attributes.position.count / 3) * n;
    });
    onStats(`${Math.round(tris).toLocaleString()} tris · ${verts.toLocaleString()} verts · drag to orbit`);
  }

  function applyWire(obj) {
    obj.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
        if ("wireframe" in m && !(m instanceof THREE.ShaderMaterial)) m.wireframe = wireframe;
      });
    });
  }

  function dispose(obj) {
    obj.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    });
  }

  function setModel(entry, title) {
    if (current) { scene.remove(current.object); dispose(current.object); }
    current = entry;
    scene.add(entry.object);
    applyWire(entry.object);
    stats(entry.object);
    onTitle(title);
  }

  const gltfLoader = new GLTFLoader();
  let loadToken = 0;   // ignore stale loads if the user switches quickly
  let destroyed = false;
  function loadGLTF(url, title, onDone) {
    const token = ++loadToken;
    onTitle("Loading…");
    gltfLoader.load(
      url,
      (gltf) => {
        onDone?.();
        if (destroyed || token !== loadToken) return;
        const obj = gltf.scene;
        // centre and fit into a ~2.6 unit sphere
        const box = new THREE.Box3().setFromObject(obj);
        const size = box.getSize(new THREE.Vector3()).length();
        const center = box.getCenter(new THREE.Vector3());
        obj.position.sub(center);
        const holder = new THREE.Group();
        holder.add(obj);
        holder.scale.setScalar(2.6 / (size || 1));
        const mixer = gltf.animations.length ? new THREE.AnimationMixer(obj) : null;
        if (mixer) gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
        let last = 0;
        setModel({ object: holder, update: (t) => { if (mixer) { mixer.update(t - last); last = t; } } }, title);
      },
      undefined,
      (err) => {
        onDone?.();
        if (destroyed || token !== loadToken) return;
        console.error(err);
        onTitle("Couldn't load model — check the path");
      }
    );
  }

  // ---------- sizing & loop (only renders while on screen) ----------
  function resize() {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(wrap);

  let visible = false;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(wrap);

  const clock = new THREE.Clock();
  let t = 0, raf = 0;
  function loop() {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.1);
    if (!visible) return;
    t += dt;
    controls.update();
    if (current?.update) current.update(t);
    renderer.render(scene, camera);
  }

  resize();
  loop();

  return {
    showProject(p) {
      if (p.model) loadGLTF(p.model, p.title);
      else { loadToken++; setModel(builders[p.placeholder || "neural"](), `${p.title} — 3D visual`); }
    },
    loadFile(file) {
      const url = URL.createObjectURL(file);
      loadGLTF(url, file.name, () => URL.revokeObjectURL(url));
    },
    setWireframe(on) {
      wireframe = on;
      if (current) applyWire(current.object);
    },
    setAutoRotate(on) {
      controls.autoRotate = on;
    },
    reset() {
      camera.position.copy(HOME);
      controls.target.set(0, 0, 0);
    },
    dispose() {
      destroyed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      controls.dispose();
      if (current) dispose(current.object);
      grid.geometry.dispose();
      grid.material.dispose();
      envTarget.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
