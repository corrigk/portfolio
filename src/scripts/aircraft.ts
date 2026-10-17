// Rotating aircraft wireframes drawn on a <canvas> with no libraries.
// Five aircraft (B-1B with sweeping wings, A-10, B-2, F-22, SR-71) swap in with a hologram-style scan line
// over a radar ground grid. They drift, and every few seconds bank, wiggle, pull up on afterburner or roll,
// with engine glow and wingtip vapor. Drag to spin (with momentum) and tilt; tap or click to switch aircraft.
type V = [number, number, number]; // x: nose(+)/tail(-), y: right wing(+), z: up(+)
type Seg = [V, V];

const rad = (d: number) => (d * Math.PI) / 180;

/* ---------- geometry helpers ---------- */
class Shape {
  s: Seg[] = [];
  k = 1;                         // scale applied by normalize()
  tf = (p: V): V => p;           // point transform applied by normalize()
  poly(p: V[], close = true) {
    for (let i = 0; i < p.length - (close ? 0 : 1); i++) this.s.push([p[i], p[(i + 1) % p.length]]);
    return this;
  }
  /** Same polygon on both sides (points given for the right side, y > 0). */
  mirror(p: V[], close = true) {
    this.poly(p, close);
    return this.poly(p.map(([x, y, z]) => [x, -y, z] as V), close);
  }
  /** Lofted body: elliptical rings [x, halfWidth, halfHeight, zCenter] joined by stringers.
   *  `top` draws only the upper half (for blended bodies like the B-2). */
  loft(st: [number, number, number, number][], opts: { K?: number; nose?: V; tail?: V; top?: boolean; y?: number } = {}) {
    const K = opts.K ?? 12, y0 = opts.y ?? 0, top = !!opts.top;
    const n = top ? K / 2 : K;
    const pt = (i: number, k: number): V => {
      const [x, w, h, zc] = st[i];
      const a = (k / K) * Math.PI * 2;
      return [x, y0 + w * Math.cos(a), zc + h * Math.sin(a)];
    };
    st.forEach((_, i) => { for (let k = 0; k < n; k++) this.s.push([pt(i, k), pt(i, (k + 1) % K)]); });
    for (let i = 0; i < st.length - 1; i++) for (let k = 0; k <= n; k += 2) this.s.push([pt(i, k % K), pt(i + 1, k % K)]);
    if (opts.nose) for (let k = 0; k <= n; k += 2) this.s.push([pt(0, k % K), opts.nose]);
    if (opts.tail) for (let k = 0; k <= n; k += 2) this.s.push([pt(st.length - 1, k % K), opts.tail]);
    return this;
  }
  /** Scale so the largest of length/span is `size`, centred on the origin. */
  normalize(size = 1.95) {
    const pts = this.s.flat();
    const ext = (i: number) => [Math.min(...pts.map((p) => p[i])), Math.max(...pts.map((p) => p[i]))];
    const [x0, x1] = ext(0), [y0, y1] = ext(1), [z0, z1] = ext(2);
    const k = size / Math.max(x1 - x0, y1 - y0);
    const c: V = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2];
    this.k = k;
    this.tf = (p: V): V => [(p[0] - c[0]) * k, (p[1] - c[1]) * k, (p[2] - c[2]) * k];
    this.s = this.s.map(([a, b]) => [this.tf(a), this.tf(b)] as Seg);
    return this;
  }
}

/* ---------- B-1B Lancer (variable-sweep wings) ---------- */
const b1Body = new Shape()
  .loft([
    [0.86, 0.035, 0.04, -0.01], [0.68, 0.06, 0.065, 0], [0.42, 0.078, 0.075, 0], [0.12, 0.09, 0.07, 0],
    [-0.2, 0.09, 0.066, 0], [-0.5, 0.075, 0.06, 0.005], [-0.76, 0.05, 0.05, 0.01], [-0.96, 0.02, 0.03, 0.015],
  ], { nose: [1.04, 0, -0.025] })
  .poly([[0.74, -0.03, 0.05], [0.74, 0.03, 0.05], [0.64, 0.045, 0.07], [0.64, -0.045, 0.07]])          // cockpit windows
  .mirror([[0.36, 0.085, 0.02], [-0.03, 0.215, 0.02], [-0.3, 0.215, 0.02], [-0.46, 0.08, 0.02]])     // wing glove
  .mirror([[-0.6, 0.045, 0.06], [-0.8, 0.31, 0.06], [-0.9, 0.31, 0.06], [-0.95, 0.035, 0.06]])       // stabilizers
  .poly([[-0.55, 0, 0.07], [-0.82, 0, 0.4], [-0.93, 0, 0.4], [-0.99, 0, 0.04]]);                     // fin
for (const side of [1, -1]) { // engine nacelles: box with a wider intake
  const y0 = 0.16 * side;
  const box = (x: number, w: number, h: number): V[] => [[x, y0 - w, -0.05], [x, y0 + w, -0.05], [x, y0 + w, -0.05 - h], [x, y0 - w, -0.05 - h]];
  const f = box(-0.04, 0.055, 0.075), b = box(-0.46, 0.045, 0.06);
  b1Body.poly(f).poly(b);
  f.forEach((p, i) => b1Body.s.push([p, b[i]]));
}
function b1Wings(sweep: number): Seg[] {
  const s: Seg[] = [];
  const t = rad(sweep);
  const base: [number, number][] = [[0.08, 0], [0.025, 0.74], [-0.05, 0.74], [-0.14, 0]];
  for (const side of [1, -1]) {
    const p: V[] = base.map(([x, y]) => [-0.1 + x * Math.cos(t) - y * Math.sin(t), side * (0.2 + x * Math.sin(t) + y * Math.cos(t)), 0.015]);
    for (let i = 0; i < 4; i++) s.push([p[i], p[(i + 1) % 4]]);
    const m = (a: V, b: V, k: number): V => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2]];
    s.push([m(p[0], p[3], 0.4), m(p[1], p[2], 0.4)]); // spar line
  }
  return s;
}

/* ---------- A-10 Thunderbolt II (units: feet) ---------- */
const a10 = new Shape()
  .loft([
    [24, 1.5, 1.8, 0], [20, 2.4, 2.8, 0.3], [14, 2.8, 3.2, 0.6], [8, 2.8, 3, 0.3], [0, 2.6, 2.8, 0],
    [-8, 2.2, 2.4, 0], [-16, 1.6, 2, 0.2], [-22, 1, 1.5, 0.5], [-25, 0.5, 1, 0.8],
  ], { nose: [26.5, 0, -0.6] })
  .poly([[26.5, 0, -1], [29.5, 0, -1]], false)                                                       // GAU-8 barrel
  .loft([[18, 0.2, 0.2, 2.9], [15.5, 1.1, 1, 3.1], [12, 1, 0.9, 3.1], [10, 0.3, 0.3, 2.9]])           // canopy
  .mirror([[4, 2.6, -1.6], [1.5, 28.7, -0.4], [-3.5, 28.7, -0.4], [-6, 2.6, -1.6]])                   // straight wing
  .mirror([[3.5, 9, -1.4], [-3.5, 9, -1.4]], false)                                                   // gear pod line
  .mirror([[-19, 1.2, 1.5], [-20, 10.5, 1.5], [-24.5, 10.5, 1.5], [-25, 1, 1.5]])                    // stabilizer
  .mirror([[-19.5, 10.5, -3], [-20.5, 10.5, 8], [-24.5, 10.5, 8], [-25.2, 10.5, -3]]);               // twin fins
for (const side of [1, -1]) { // pod-mounted engines high on the rear fuselage
  a10.loft([[-5.5, 2, 2, 4.6], [-8, 2.4, 2.4, 4.6], [-14, 2.2, 2.2, 4.6], [-16.5, 1.7, 1.7, 4.6]], { K: 10, y: 5.2 * side });
}
a10.mirror([[-7, 2.2, 1.8], [-7, 4.6, 3.4], [-12, 4.6, 3.4], [-12, 2.2, 1.8]], false);              // pylons
a10.normalize();

/* ---------- B-2 Spirit (flying wing, units: feet) ---------- */
const b2Outline: [number, number][] = [ // right half, nose to centre tail along the sawtooth trailing edge
  [30, 0], [-25.8, 86], [-31, 86], [-11, 62], [-27, 44], [-16, 22], [-30, 0],
];
const b2 = new Shape();
for (const z of [0.6, -0.6]) b2.mirror(b2Outline.map(([x, y]) => [x, y, z] as V), false);
b2.mirror([[-25.8, 86, 0.6], [-25.8, 86, -0.6]], false).mirror([[-31, 86, 0.6], [-31, 86, -0.6]], false);
b2.loft([[26, 1.5, 1, 0.6], [20, 6, 2.6, 0.6], [12, 8.5, 3.6, 0.6], [2, 9, 3.4, 0.6], [-10, 7, 2.4, 0.6], [-22, 3, 1.2, 0.6]], { top: true, nose: [30, 0, 0.6] });
b2.poly([[20, -2.5, 2.9], [20, 2.5, 2.9], [16.5, 3.6, 3.7], [16.5, -3.6, 3.7]]);                    // windscreen
for (const side of [1, -1]) {
  b2.loft([[8, 1, 0.6, 0.6], [4, 5, 2.4, 0.6], [-6, 5.2, 2.6, 0.6], [-16, 3, 1.4, 0.6]], { top: true, K: 10, y: 17 * side });
}
for (const y of [30, 52, 72]) { // ribs from leading to trailing edge
  const le = 30 - y * Math.tan(rad(33));
  const te = y < 44 ? -16 - ((y - 22) / 22) * 11 : y < 62 ? -27 + ((y - 44) / 18) * 16 : -11 - ((y - 62) / 24) * 20;
  b2.mirror([[le, y, 0.6], [te, y, 0.6]], false);
}
b2.normalize();

/* ---------- F-22 Raptor (units: feet) ---------- */
const f22 = new Shape()
  .loft([
    [27, 1, 1.1, 0], [22, 2.2, 2.2, 0.2], [17, 3, 2.5, 0.4], [12, 5.5, 2.6, 0.2], [5, 6.5, 2.4, 0],
    [-5, 6.5, 2.2, 0], [-15, 6, 2, 0], [-22, 5, 1.8, 0], [-27, 4.5, 1.6, 0],
  ], { nose: [31, 0, -0.2] })
  .loft([[24, 0.2, 0.2, 1.9], [20, 1.4, 1.2, 2.4], [14.5, 1.3, 1.1, 2.4], [11, 0.3, 0.3, 2]])         // canopy
  .mirror([[13.5, 4.2, 1.4], [13.5, 8, 0.6], [12, 8, -1.6], [12, 4.2, -1.6]])                        // caret intakes
  .mirror([[13.5, 8, 0.6], [4, 7, 0.4]], false).mirror([[12, 8, -1.6], [4, 7, -1.4]], false)
  .mirror([[8, 6.2, 0], [-6.6, 22.25, 0], [-11.6, 22.25, 0], [-16.6, 6.2, 0]])                         // diamond wing
  .mirror([[-17, 4.8, 0], [-25, 14, 0], [-29, 14, 0], [-28, 4.8, 0]])                                  // stabilators
  .mirror([[-12, 5.5, 1.5], [-20, 10.2, 10.3], [-25, 10.2, 10.3], [-24, 5.5, 1.5]])                   // canted fins
  .mirror([[-27, 1, 1.2], [-27, 4, 1.2], [-27, 4, -1.2], [-27, 1, -1.2]])                             // 2-D nozzles
  .mirror([[-30, 1.2, 0.9], [-30, 3.8, 0.9], [-30, 3.8, -0.9], [-30, 1.2, -0.9]])
  .mirror([[-27, 1, 1.2], [-30, 1.2, 0.9]], false).mirror([[-27, 4, 1.2], [-30, 3.8, 0.9]], false)
  .mirror([[-27, 4, -1.2], [-30, 3.8, -0.9]], false).mirror([[-27, 1, -1.2], [-30, 1.2, -0.9]], false)
  .normalize();

/* ---------- SR-71 Blackbird (units: feet) ---------- */
const sr71 = new Shape()
  .loft([
    [48, 1.2, 1, 0], [38, 2.6, 2, 0.2], [25, 3.4, 2.6, 0.5], [10, 3.8, 2.5, 0.3],
    [-10, 3.8, 2.3, 0.2], [-30, 3.3, 2.1, 0.2], [-45, 2.4, 1.7, 0.3], [-52, 1.4, 1.1, 0.3],
  ], { nose: [55, 0, -0.2] })
  .loft([[30, 0.2, 0.2, 2.6], [27, 1.2, 0.8, 2.9], [22, 1.1, 0.7, 2.9], [19, 0.3, 0.3, 2.6]])        // canopy
  .mirror([[50, 1.1, 0], [32, 5, 0], [12, 8.5, 0], [-6, 10.5, 0]], false)                           // chines
  .mirror([[-6, 10.5, 0], [-35, 27.8, 0], [-40.5, 27.8, 0], [-44, 9, 0], [-52, 1.4, 0.3]], false)  // delta wing
  .mirror([[-34, 13.5, 2.9], [-45, 11, 12.8], [-50, 10.8, 12.8], [-48.5, 13.5, 2.9]]);             // canted fins on the nacelles
for (const side of [1, -1]) { // J58 nacelles with inlet spikes
  sr71.loft([[-6, 2.1, 2.1, 0], [-12, 2.9, 2.9, 0], [-40, 2.9, 2.9, 0], [-48, 2.4, 2.4, 0]], { K: 10, y: 13.5 * side, nose: [3, 13.5 * side, 0] });
}
sr71.normalize();

/* ---------- aircraft list ---------- */
interface Exhaust { p: V; r: number }
interface Model {
  name: string; label: string; value: (t: number) => string; segs: (t: number) => Seg[]; dwell: number; scale: number; elev?: number;
  exhausts: Exhaust[];      // nozzle centres (model units) for the engine glow
  burner: boolean;          // has an afterburner (bright flame); otherwise just a faint heat glow
  fighter?: boolean;        // agile enough for full aileron rolls
  tips: (t: number) => V[]; // right wingtip(s) for vapor trails (mirrored to the left)
  mach: number;             // cruise Mach for the HUD
}
/** Nozzles given for the right side (y > 0) are mirrored; `sh` maps raw units onto a normalized model. */
const nozzles = (pts: V[], r: number, sh?: Shape): Exhaust[] =>
  pts.flatMap(([x, y, z]) => [[x, y, z], [x, -y, z]] as V[]).map((p) => ({ p: sh ? sh.tf(p) : p, r: sh ? r * sh.k : r }));
const sweepAt = (t: number) => 41.25 - 26.25 * Math.cos((t / 1000) * ((Math.PI * 2) / 14));
const b1Tip = (t: number): V[] => {
  const a = rad(sweepAt(t)), x = -0.0125, y = 0.74;
  return [[-0.1 + x * Math.cos(a) - y * Math.sin(a), 0.2 + x * Math.sin(a) + y * Math.cos(a), 0.015]];
};
const MODELS: Model[] = [
  { name: 'B-1B Lancer', label: 'Wing sweep', value: (t) => `${sweepAt(t).toFixed(1)}°`, segs: (t) => b1Body.s.concat(b1Wings(sweepAt(t))),
    dwell: 16, scale: 1, exhausts: nozzles([[-0.47, 0.137, -0.085], [-0.47, 0.183, -0.085]], 0.02), burner: true, tips: b1Tip, mach: 0.85 },
  { name: 'A-10 Thunderbolt II', label: 'Role', value: () => 'Close air support', segs: () => a10.s, dwell: 12, scale: 0.98,
    exhausts: nozzles([[-16.7, 5.2, 4.6]], 1.6, a10), burner: false, fighter: true, tips: () => [a10.tf([-1, 28.7, -0.4])], mach: 0.45 },
  { name: 'B-2 Spirit', label: 'Wingspan', value: () => '172 ft', segs: () => b2.s, dwell: 12, scale: 1.05, elev: 40,
    exhausts: nozzles([[-16.5, 17, 1]], 2, b2), burner: false, tips: () => [b2.tf([-28, 86, 0.6])], mach: 0.78 },
  { name: 'F-22 Raptor', label: 'Top speed', value: () => 'Mach 2+', segs: () => f22.s, dwell: 12, scale: 0.98,
    exhausts: nozzles([[-30.2, 2.5, 0]], 1.1, f22), burner: true, fighter: true, tips: () => [f22.tf([-9, 22.25, 0])], mach: 0.95 },
  { name: 'SR-71 Blackbird', label: 'Top speed', value: () => 'Mach 3.3', segs: () => sr71.s, dwell: 12, scale: 1,
    exhausts: nozzles([[-48.6, 13.5, 0]], 2.3, sr71), burner: true, tips: () => [sr71.tf([-38, 27.8, 0])], mach: 3.1 },
];
const FADE = 1.8; // seconds for the scan-line swap between aircraft

/* ---------- flight: gentle drift plus an occasional maneuver ---------- */
const smooth = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
interface Attitude { roll: number; pitch: number; yawOff: number; ab: number; g: number }
const LEVEL: Attitude = { roll: 0, pitch: 0, yawOff: 0, ab: 0, g: 0 };
/** Every 6.5 s one of: bank, yaw wiggle, afterburner pull-up, or (fighters) a full aileron roll.
 *  `ab` is afterburner 0..1 and `g` is how hard it's pulling (drives wingtip vapor). */
function attitude(time: number, fighter = false): Attitude {
  const P = 6.5, D = 2.8, s = time / 1000;
  let roll = rad(4) * Math.sin(s * 0.9), pitch = rad(1.8) * Math.sin(s * 0.6 + 1), yawOff = rad(2) * Math.sin(s * 0.45 + 2), ab = 0, g = 0;
  const idx = Math.floor(s / P), u = (s - idx * P - 1.5) / D;
  if (u > 0 && u < 1) {
    const env = Math.sin(Math.PI * u), dir = hash(idx + 7) > 0.5 ? 1 : -1;
    const kind = Math.floor(hash(idx) * 4);
    if (kind === 0) { roll += dir * rad(32) * env; g = 0.45 * env; }                        // bank
    else if (kind === 1) yawOff += dir * rad(10) * Math.sin(2 * Math.PI * u);                // yaw wiggle
    else if (kind === 2) { pitch += rad(12) * env; ab = env; g = env; }                      // pull up on afterburner
    else if (fighter) { roll += dir * 2 * Math.PI * smooth(u); ab = env; g = 0.5 * env; }   // full aileron roll
    else { roll += dir * rad(22) * env; ab = env * 0.8; g = 0.35 * env; }                   // bombers: burner + bank
  }
  return { roll, pitch, yawOff, ab, g };
}
const isDark = () => {
  const m = document.documentElement.dataset.mode;
  return m ? m === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
};

/* ---------- renderer ---------- */
export function mountAircraft(wrap: HTMLElement) {
  const canvas = wrap.querySelector('canvas')!;
  const ctx = canvas.getContext('2d')!;
  const $ = (sel: string) => wrap.querySelector<HTMLElement>(sel);
  const hud = $('.hud'), titleOut = $('[data-name]'), labelOut = $('[data-label]'), valueOut = $('[data-value]');
  const hdgOut = $('[data-hdg]'), bnkOut = $('[data-bnk]'), thrOut = $('[data-thr]'), machOut = $('[data-mach]');
  const horizon = wrap.querySelector<SVGGElement>('[data-horizon]');
  const pips = [...wrap.querySelectorAll<HTMLElement>('[data-pip]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const N = MODELS.length;

  let size = 0, dpr = 1, visible = true, raf = 0, lastT = 0, textAt = 0;
  let color = '#cfb991', dark = true;
  let current = 0, since = -1, skip = false, intro = !reduced, shownName = '', hudModel = MODELS[0];
  // pointer drag: spin with momentum, tilt the camera; a short tap switches aircraft
  let dragYaw = 0, yawVel = 0, elevOff = 0, dragging = false, moved = 0, lastX = 0, lastY = 0, lastMoveT = 0;

  const refreshColors = () => { color = getComputedStyle(canvas).color || '#cfb991'; dark = isDark(); };
  const resize = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    size = wrap.clientWidth;
    canvas.width = canvas.height = Math.round(size * dpr);
    canvas.style.width = canvas.style.height = `${size}px`;
  };

  /** Camera for a given elevation: world point -> [screenX, screenY, depth]. */
  const camera = (yaw: number, elevDeg: number, scale: number) => {
    const E = rad(elevDeg), ce = Math.cos(E), se = Math.sin(E), cy = Math.cos(yaw), sy = Math.sin(yaw);
    const S = size * 0.5 * scale, cx = size / 2, cyy = size * 0.46;
    return (p: V): [number, number, number] => {
      const x1 = p[0] * cy - p[1] * sy, y1 = p[0] * sy + p[1] * cy;
      const v = p[2] * ce - x1 * se, d = x1 * ce + p[2] * se;
      const k = 3.2 / (3.2 - d);
      return [cx + y1 * S * k, cyy - v * S * k, d];
    };
  };

  /* Ground: range rings, spokes that turn with the aircraft, and a radar sweep with a few blips. */
  const BLIPS: [number, number][] = [[0.7, 1.1], [0.85, 3.4], [0.5, 5.2]];
  function drawGround(time: number, yaw: number, elevDeg: number, alpha: number) {
    const proj = camera(yaw, elevDeg, 1);
    const Z = -0.5;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.09 * alpha;
    const rings = new Path2D();
    for (const r of [0.35, 0.65, 0.92]) {
      for (let i = 0; i <= 72; i++) {
        const t = (i / 72) * Math.PI * 2;
        const [x, y] = proj([r * Math.cos(t), r * Math.sin(t), Z]);
        i ? rings.lineTo(x, y) : rings.moveTo(x, y);
      }
    }
    for (let k = 0; k < 12; k++) {
      const t = (k / 12) * Math.PI * 2;
      const [x0, y0] = proj([0.12 * Math.cos(t), 0.12 * Math.sin(t), Z]), [x1, y1] = proj([0.92 * Math.cos(t), 0.92 * Math.sin(t), Z]);
      rings.moveTo(x0, y0); rings.lineTo(x1, y1);
    }
    ctx.stroke(rings);
    if (!reduced) {
      const sweep = (time / 1000) * 1.3;
      for (let i = 0; i < 16; i++) { // fading wedge behind the sweep line
        const t = sweep - i * 0.035;
        const [x0, y0] = proj([0, 0, Z]), [x1, y1] = proj([0.92 * Math.cos(t), 0.92 * Math.sin(t), Z]);
        ctx.globalAlpha = 0.22 * alpha * (1 - i / 16);
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      }
      ctx.fillStyle = color;
      for (const [r, ang] of BLIPS) { // blips flare as the sweep passes, then fade
        const since = ((sweep - ang) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const glow = Math.exp(-since * 1.6);
        if (glow < 0.02) continue;
        const [x, y] = proj([r * Math.cos(ang), r * Math.sin(ang), Z]);
        ctx.globalAlpha = 0.7 * glow * alpha;
        ctx.beginPath(); ctx.arc(x, y, 1.5 + 2 * glow, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  /** Draw one aircraft. `beam` 0..1 is the scan line running nose to tail during a swap:
   *  the incoming aircraft exists behind it, the outgoing one ahead of it. */
  function drawModel(m: Model, time: number, yaw: number, att: Attitude, mode: 'in' | 'out', beam: number) {
    const segs = m.segs(time);
    const proj = camera(yaw + att.yawOff, (m.elev ?? 20) + elevOff, m.scale);
    const cr = Math.cos(att.roll), sr = Math.sin(att.roll), cp = Math.cos(att.pitch), sp = Math.sin(att.pitch);
    const body = (p: V): V => { // roll about the fuselage axis, then pitch the nose
      const y = p[1] * cr - p[2] * sr, z1 = p[1] * sr + p[2] * cr;
      return [p[0] * cp - z1 * sp, y, p[0] * sp + z1 * cp];
    };
    const project = (p: V) => proj(body(p));

    let xMin = Infinity, xMax = -Infinity, zMin = Infinity;
    for (const [a, b] of segs) { xMin = Math.min(xMin, a[0], b[0]); xMax = Math.max(xMax, a[0], b[0]); zMin = Math.min(zMin, a[2], b[2]); }
    const span = xMax - xMin || 1, SOFT = 0.16;
    const pos = (x: number) => (xMax - x) / span;                      // 0 at the nose, 1 at the tail
    const shown = (x: number) => {
      const v = clamp01((beam * (1 + SOFT) - pos(x)) / SOFT);           // 1 once the beam has passed
      return mode === 'in' ? v : 1 - v;
    };
    const presence = mode === 'in' ? smooth(beam) : 1 - smooth(beam);

    // ground shadow
    const shadow = new Path2D();
    const sz = zMin - 0.3;
    for (const [a, b] of segs) {
      const ba = body(a), bb = body(b);
      const pa = proj([ba[0], ba[1], sz]), pb = proj([bb[0], bb[1], sz]);
      shadow.moveTo(pa[0], pa[1]); shadow.lineTo(pb[0], pb[1]);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.1 * presence;
    ctx.stroke(shadow);

    // airframe, batched into alpha buckets (brighter toward the viewer); lines right at the scan edge glow
    const B = 10;
    const buckets = Array.from({ length: B }, () => new Path2D());
    const edge = new Path2D();
    let hasEdge = false;
    for (const [a, b] of segs) {
      const v = shown((a[0] + b[0]) / 2);
      if (v <= 0.01) continue;
      const pa = project(a), pb = project(b);
      const depth = Math.max(0.18, Math.min(1, 0.55 + ((pa[2] + pb[2]) / 2) * 0.55));
      if (mode === 'in' && v < 0.98) { edge.moveTo(pa[0], pa[1]); edge.lineTo(pb[0], pb[1]); hasEdge = true; continue; }
      const i = Math.min(B - 1, Math.floor(depth * v * B));
      buckets[i].moveTo(pa[0], pa[1]); buckets[i].lineTo(pb[0], pb[1]);
    }
    ctx.lineWidth = 1.15;
    buckets.forEach((p, i) => { ctx.globalAlpha = (i + 0.5) / B; ctx.stroke(p); });
    if (hasEdge) {
      ctx.save();
      ctx.strokeStyle = dark ? '#fff4d6' : '#5c4521';
      ctx.shadowColor = '#daaa00';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = 0.95;
      ctx.stroke(edge);
      ctx.restore();
    }

    // scan hoop sweeping over the airframe during a swap
    if (mode === 'in' && beam > 0 && beam < 1) {
      const x = xMax - span * Math.min(1, beam * (1 + SOFT) - SOFT / 2);
      const hoop = new Path2D();
      for (let i = 0; i <= 48; i++) {
        const t = (i / 48) * Math.PI * 2;
        const [px, py] = project([x, 1.05 * Math.cos(t), 0.32 * Math.sin(t)]);
        i ? hoop.lineTo(px, py) : hoop.moveTo(px, py);
      }
      ctx.save();
      ctx.strokeStyle = '#daaa00';
      ctx.shadowColor = '#daaa00';
      ctx.shadowBlur = 10;
      ctx.globalAlpha = 0.55 * Math.sin(Math.PI * beam);
      ctx.lineWidth = 1.2;
      ctx.stroke(hoop);
      ctx.restore();
    }

    // wingtip vapor trails when pulling hard
    if (att.g > 0.05) {
      const L = 0.55 * att.g;
      ctx.save();
      ctx.lineWidth = 1.2;
      for (const tip of m.tips(time)) {
        for (const side of [1, -1]) {
          const t0: V = [tip[0], tip[1] * side, tip[2]];
          if (shown(t0[0]) < 0.5) continue;
          for (let i = 0; i < 10; i++) {
            const p0 = project([t0[0] - (L * i) / 10, t0[1], t0[2]]), p1 = project([t0[0] - (L * (i + 1)) / 10, t0[1], t0[2]]);
            const a = att.g * presence * 0.55 * (1 - i / 10);
            ctx.strokeStyle = dark ? `rgba(235,242,255,${a})` : `rgba(80,92,112,${a})`;
            ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
          }
        }
      }
      ctx.restore();
    }

    // engine glow: flickering hot core, plus an afterburner plume trailing behind each nozzle
    const flick = 0.82 + 0.18 * Math.sin(time * 0.031) * Math.sin(time * 0.017 + 1);
    const heat = (m.burner ? 0.35 + 0.65 * att.ab : 0.2 + 0.25 * att.ab) * flick;
    const len = m.burner ? 0.04 + 0.2 * att.ab : 0.03;
    const steps = m.burner ? 2 + Math.round(6 * att.ab) : 1;
    const S = size * 0.5 * m.scale;
    ctx.save();
    ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over';
    ctx.globalAlpha = 1;
    for (const e of m.exhausts) {
      const vis = shown(e.p[0]);
      if (vis <= 0.01) continue;
      for (let i = steps; i >= 0; i--) {
        const f = i / steps; // 0 at the nozzle, 1 at the plume tip
        const [px, py, d] = project([e.p[0] - f * len, e.p[1], e.p[2]]);
        const r = e.r * S * (3.2 / (3.2 - d)) * (2.4 - 1.3 * f) * (1 + 0.5 * att.ab);
        const a = heat * vis * (1 - 0.75 * f) * (dark ? 1 : 0.7);
        const g = ctx.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0, dark ? `rgba(255,244,214,${a})` : `rgba(255,140,30,${a})`);
        g.addColorStop(0.35, dark ? `rgba(255,170,60,${a * 0.7})` : `rgba(230,90,20,${a * 0.6})`);
        g.addColorStop(1, 'rgba(255,120,30,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  function draw(time: number) {
    const gap = lastT ? time - lastT : 0;
    if (gap > 250 && since >= 0) since += gap; // frames were paused (tab hidden, scrolled away): don't count that time
    const dt = lastT ? Math.min(0.05, gap / 1000) : 0;
    lastT = time;
    if (!dragging) { // momentum after a drag, and the camera tilt eases back
      dragYaw += yawVel * dt;
      yawVel *= Math.pow(0.05, dt);
      elevOff *= Math.pow(0.3, dt);
    }
    const yaw = (reduced ? rad(-35) : rad(-35) + (time / 1000) * ((Math.PI * 2) / 32)) + dragYaw;

    if (since < 0) since = reduced ? time - FADE * 1000 : time;
    let m = MODELS[current];
    if (!reduced && (skip || (time - since) / 1000 > m.dwell)) {
      skip = false; intro = false; current = (current + 1) % N; since = time; m = MODELS[current];
    }
    const beam = reduced ? 1 : clamp01((time - since) / 1000 / FADE);
    const prev = MODELS[(current - 1 + N) % N];
    const att = reduced ? LEVEL : attitude(time, m.fighter);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    ctx.lineCap = 'round';
    const elevGround = (intro ? (m.elev ?? 20) : (prev.elev ?? 20) + ((m.elev ?? 20) - (prev.elev ?? 20)) * smooth(beam)) + elevOff;
    drawGround(time, yaw, elevGround, intro ? smooth(beam) : 1);
    if (beam < 1 && !intro) drawModel(prev, time, yaw, att, 'out', beam);
    drawModel(m, time, yaw, att, 'in', beam);
    ctx.globalAlpha = 1;

    if (m.name !== shownName) swapHud(m);
    if (horizon) horizon.setAttribute('transform', `rotate(${(-att.roll * 180) / Math.PI}) translate(0 ${((att.pitch * 180) / Math.PI) * 0.9})`);
    if (time - textAt > 120 || reduced) {
      textAt = time;
      if (valueOut) valueOut.textContent = hudModel.value(time);
      if (hdgOut) hdgOut.textContent = String(Math.round(((((yaw + att.yawOff) * 180) / Math.PI) % 360 + 360) % 360)).padStart(3, '0');
      if (bnkOut) {
        const b = Math.round(((((att.roll * 180) / Math.PI) % 360) + 540) % 360 - 180);
        bnkOut.textContent = `${b < 0 ? 'L' : b > 0 ? 'R' : ''}${Math.abs(b)}°`;
      }
      const hot = att.ab > 0.35;
      if (thrOut) {
        thrOut.textContent = hot ? (hudModel.burner ? 'MAX A/B' : 'MAX') : 'MIL';
        thrOut.toggleAttribute('data-hot', hot && hudModel.burner);
      }
      if (machOut) machOut.textContent = `M${(hudModel.mach + att.ab * (hudModel.burner ? 0.3 : 0.08) + 0.006 * Math.sin(time * 0.0021)).toFixed(2)}`;
    }
  }

  function swapHud(m: Model) {
    const first = !shownName;
    shownName = m.name;
    const apply = () => {
      hudModel = m;
      if (valueOut) valueOut.textContent = m.value(lastT);
      if (titleOut) titleOut.textContent = m.name;
      if (labelOut) labelOut.textContent = m.label;
      pips.forEach((p, i) => p.toggleAttribute('data-on', i === current));
      hud?.classList.remove('swap');
    };
    if (first || reduced) return apply();
    hud?.classList.add('swap');
    setTimeout(apply, 280);
  }

  const loop = (t: number) => {
    if (!visible || document.hidden) { raf = 0; return; }
    draw(t);
    raf = requestAnimationFrame(loop);
  };
  const start = () => { if (!reduced && visible && !document.hidden && !raf) raf = requestAnimationFrame(loop); };
  const redraw = () => draw(reduced ? 0 : lastT || performance.now());

  /* pointer: drag to spin (with momentum) and tilt; tap/click to switch aircraft */
  wrap.addEventListener('pointerdown', (e) => {
    dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY; yawVel = 0; lastMoveT = performance.now();
    wrap.setPointerCapture(e.pointerId);
    wrap.classList.add('grabbing');
  });
  wrap.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY, now = performance.now();
    lastX = e.clientX; lastY = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    const dYaw = (dx / Math.max(200, size)) * Math.PI * 1.6;
    dragYaw += dYaw;
    yawVel = 0.6 * (dYaw / Math.max(0.008, (now - lastMoveT) / 1000)) + 0.4 * yawVel;
    if (e.pointerType !== 'touch') elevOff = Math.max(-25, Math.min(45, elevOff + dy * 0.25));
    lastMoveT = now;
    if (reduced) redraw();
  });
  const release = () => {
    if (!dragging) return;
    dragging = false;
    wrap.classList.remove('grabbing');
    if (performance.now() - lastMoveT > 90) yawVel = 0; // held still before letting go: no fling
    if (moved < 6) { // a tap, not a drag
      yawVel = 0;
      if (reduced) { current = (current + 1) % N; redraw(); } else skip = true;
    }
  };
  wrap.addEventListener('pointerup', release);
  wrap.addEventListener('pointercancel', release);

  refreshColors();
  resize();
  draw(0);
  new ResizeObserver(() => { resize(); redraw(); }).observe(wrap);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); }).observe(wrap);
  document.addEventListener('visibilitychange', start);
  // follow light/dark changes
  new MutationObserver(() => { refreshColors(); redraw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { refreshColors(); redraw(); });
  start();
}

document.querySelectorAll<HTMLElement>('.aircraft-art').forEach(mountAircraft);
