// ============================================================
//  Gargantua-style black hole — ray-traced in a fragment shader.
//
//  Every pixel fires a light ray from the camera and integrates it
//  through a Schwarzschild-like potential (a = -1.5 h² r / |r|^5,
//  units where the Schwarzschild radius r_s = 1). Rays that cross the
//  disk plane pick up accretion-disk light; rays that fall below r_s
//  are swallowed; rays that escape sample a procedural starfield.
//  The lensing (the disk arching over and under the shadow, the
//  photon ring, the Einstein ring of stars) all emerges from that.
//
//  uDive (0 → 1) fades in the view from *inside* the horizon: every
//  path leads inward, so the outside universe collapses into a single
//  point of light ahead, with infalling light streaming toward it.
// ============================================================

export const vertexShader = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const fragmentShader = /* glsl */ `
  precision highp float;

  uniform vec2  uRes;
  uniform float uTime;
  uniform vec3  uCamPos;
  uniform vec3  uCamTarget;
  uniform vec2  uShift;     // screen-space offset of the black hole
  uniform float uFov;
  uniform float uRoll;
  uniform int   uSteps;
  uniform float uDive;      // 0 outside the horizon → 1 once the camera has crossed it

  // ---------- hashing / noise ----------
  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  float hash13(vec3 p) {
    p = mod(p, 289.0);
    return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x),
               mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
    return v;
  }

  // ---------- background: stars + faint dust ----------
  vec3 starLayer(vec3 d, float scale, float threshold, float gain) {
    vec3 p  = d * scale;
    vec3 id = floor(p);
    vec3 f  = fract(p) - 0.5;
    float h = hash13(id);
    if (h < threshold) return vec3(0.0);
    vec3 off = vec3(hash13(id + 1.3), hash13(id + 2.7), hash13(id + 5.1)) - 0.5;
    float dist = length(f - off * 0.5);
    float b = smoothstep(0.22, 0.0, dist) * (h - threshold) / (1.0 - threshold);
    float tw = 0.75 + 0.25 * sin(uTime * (1.0 + 3.0 * hash13(id + 7.7)) + h * 40.0);
    vec3 tint = mix(vec3(1.0, 0.78, 0.55), vec3(0.65, 0.78, 1.0), hash13(id + 9.1));
    return tint * b * gain * tw;
  }

  vec3 background(vec3 d) {
    vec3 col = vec3(0.0);
    col += starLayer(d, 90.0,  0.992, 5.0);
    col += starLayer(d, 220.0, 0.985, 2.2);
    col += starLayer(d, 480.0, 0.975, 0.9);
    // dusty band
    float band = exp(-pow(d.y * 3.2 + 0.6 * d.x, 2.0));
    float n = fbm(d.xz * 4.0 + d.y * 3.0);
    col += vec3(0.035, 0.028, 0.026) * band * n * n;
    col += vec3(0.004, 0.005, 0.008) * n;
    return col;
  }

  // ---------- accretion disk ----------
  const float DISK_IN  = 2.4;
  const float DISK_OUT = 13.0;

  vec4 disk(vec3 p, vec3 rayDir) {
    float r = length(p.xz);
    if (r < DISK_IN || r > DISK_OUT) return vec4(0.0);

    // Keplerian differential rotation
    float omega = 1.4 / pow(r, 1.5);
    float a = uTime * omega;
    float c = cos(a), s = sin(a);
    vec2 q = mat2(c, -s, s, c) * p.xz;

    // fine concentric bands + swirling turbulence
    float bands  = fbm(vec2(r * 5.5, 3.7));
    float bands2 = noise(vec2(r * 22.0, 1.3));
    float swirl  = fbm(q * 0.9 + vec2(r * 0.6));
    float dens = bands * 0.75 + bands2 * 0.25;
    dens = dens * (0.55 + 0.75 * swirl);
    dens = smoothstep(0.18, 0.85, dens);

    // temperature ramp: white-hot inner edge → amber → deep red
    float t = clamp((r - DISK_IN) / (DISK_OUT - DISK_IN), 0.0, 1.0);
    vec3 hot  = vec3(1.0, 0.93, 0.80);
    vec3 warm = vec3(1.0, 0.62, 0.26);
    vec3 cool = vec3(0.55, 0.16, 0.04);
    vec3 col = mix(hot, warm, smoothstep(0.0, 0.25, t));
    col = mix(col, cool, smoothstep(0.3, 1.0, t));

    float intensity = 2.4 * pow(DISK_IN / r, 1.7);

    // relativistic beaming — the approaching side is brighter
    vec3 v = normalize(vec3(-p.z, 0.0, p.x));
    float beta = 0.55 / sqrt(r);
    float g = 1.0 + dot(v, -rayDir) * beta;
    intensity *= clamp(g * g * g, 0.25, 3.0);

    float edge = smoothstep(DISK_IN, DISK_IN + 0.35, r) * smoothstep(DISK_OUT, DISK_OUT - 5.0, r);
    float alpha = clamp(dens * 1.35, 0.0, 1.0) * edge;
    return vec4(col * intensity * (0.35 + dens), alpha);
  }

  // ---------- beyond the event horizon ----------
  // Total darkness, one point of light at the end, and faint lanes of
  // blueshifted light rushing inward toward it.
  vec3 singularity(vec2 uv) {
    float r = length(uv);
    float grow = smoothstep(0.0, 1.0, uDive);

    float pulse = 1.0 + 0.08 * sin(uTime * 1.3);
    float core = 0.0006 * grow * pulse / (r * r + 0.00015);
    float halo = 0.09 * grow * exp(-r * 6.0);
    vec3 col = vec3(1.0, 0.95, 0.88) * (core + halo);

    float a = atan(uv.y, uv.x) / 6.2831853 + 0.5;
    float lanePos = a * 90.0;
    float h = hash12(vec2(floor(lanePos), 17.0));
    float thin = pow(1.0 - abs(fract(lanePos) - 0.5) * 2.0, 8.0);
    float f = fract(-log(r + 1e-4) * 0.8 - uTime * (0.25 + h * 0.4) + h * 7.0);
    float dash = smoothstep(0.0, 0.08, f) * smoothstep(0.4, 0.08, f);
    float streak = step(0.8, h) * thin * dash * smoothstep(0.02, 0.15, r) * exp(-r * 2.2);
    col += vec3(0.7, 0.82, 1.0) * streak * 0.5 * grow;
    return col;
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y - uShift;
    float cr = cos(uRoll), sr = sin(uRoll);
    uv = mat2(cr, -sr, sr, cr) * uv;

    vec3 fw = normalize(uCamTarget - uCamPos);
    vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(rt, fw);
    vec3 dir = normalize(fw + (uv.x * rt + uv.y * up) * uFov);

    vec3 pos = uCamPos;
    vec3 vel = dir;
    vec3 hv = cross(pos, vel);
    float h2 = dot(hv, hv);

    vec3 col = vec3(0.0);
    float alpha = 0.0;
    bool escaped = false;
    float glow = 0.0;

    for (int i = 0; i < 400; i++) {
      if (i >= uSteps || uDive > 0.999) break;   // fully inside: skip the ray-march
      float r2 = dot(pos, pos);
      float r = sqrt(r2);
      float dt = clamp(0.065 * r * min(r / 3.0, 1.0), 0.03, 1.5);

      vec3 prev = pos;
      vec3 acc = -1.5 * h2 * pos / (r2 * r2 * r);
      vel += acc * dt;
      pos += vel * dt;

      // faint lensed halo hugging the photon sphere
      glow += dt * 0.012 / (abs(r - 1.5) + 0.25);

      // crossed the disk plane?
      if (prev.y * pos.y < 0.0) {
        float k = prev.y / (prev.y - pos.y);
        vec3 p = mix(prev, pos, k);
        vec4 d = disk(p, normalize(vel));
        col += (1.0 - alpha) * d.rgb * d.a;
        alpha += (1.0 - alpha) * d.a;
        if (alpha > 0.985) break;
      }

      if (dot(pos, pos) < 1.0) break;               // swallowed
      if (r > 60.0 && dot(pos, vel) > 0.0) { escaped = true; break; }
    }

    if (escaped) col += (1.0 - alpha) * background(normalize(vel));
    if (escaped) col += (1.0 - alpha) * vec3(1.0, 0.6, 0.3) * glow * 0.03;
    if (uDive > 0.0) col = mix(col, singularity(uv), uDive);

    gl_FragColor = vec4(col, 1.0);
  }
`;
