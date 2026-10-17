// Rotating aircraft wireframes drawn on a <canvas> with no libraries.
// The view keeps turning while the aircraft crossfade in turn: B-1B (with sweeping wings), A-10, B-2, F-22.
// Click the art to skip to the next one.
type V = [number, number, number]; // x: nose(+)/tail(-), y: right wing(+), z: up(+)
type Seg = [V, V];

const rad = (d: number) => (d * Math.PI) / 180;

/* ---------- geometry helpers ---------- */
class Shape {
  s: Seg[] = [];
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
    this.s = this.s.map(([a, b]) => [a, b].map((p) => [(p[0] - c[0]) * k, (p[1] - c[1]) * k, (p[2] - c[2]) * k] as V) as Seg);
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

/* ---------- aircraft list ---------- */
interface Model { name: string; label: string; value: (t: number) => string; segs: (t: number) => Seg[]; dwell: number; scale: number; elev?: number }
const sweepAt = (t: number) => 41.25 - 26.25 * Math.cos((t / 1000) * ((Math.PI * 2) / 14));
const MODELS: Model[] = [
  { name: 'B-1B Lancer', label: 'Wing sweep', value: (t) => `${sweepAt(t).toFixed(1)}°`, segs: (t) => b1Body.s.concat(b1Wings(sweepAt(t))), dwell: 16, scale: 1 },
  { name: 'A-10 Thunderbolt II', label: 'Role', value: () => 'Close air support', segs: () => a10.s, dwell: 12, scale: 0.98 },
  { name: 'B-2 Spirit', label: 'Wingspan', value: () => '172 ft', segs: () => b2.s, dwell: 12, scale: 1.05, elev: 40 },
  { name: 'F-22 Raptor', label: 'Top speed', value: () => 'Mach 2+', segs: () => f22.s, dwell: 12, scale: 0.98 },
];
const FADE = 1.6; // seconds of crossfade between aircraft

/* ---------- renderer ---------- */
export function mountAircraft(wrap: HTMLElement) {
  const canvas = wrap.querySelector('canvas')!;
  const ctx = canvas.getContext('2d')!;
  const hud = wrap.querySelector<HTMLElement>('.hud');
  const titleOut = wrap.querySelector<HTMLElement>('[data-name]');
  const labelOut = wrap.querySelector<HTMLElement>('[data-label]');
  const valueOut = wrap.querySelector<HTMLElement>('[data-value]');
  const hdgOut = wrap.querySelector<HTMLElement>('[data-hdg]');
  const pips = [...wrap.querySelectorAll<HTMLElement>('[data-pip]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let size = 0, dpr = 1, visible = true, last = 0, textAt = 0;
  let current = 0, since = -FADE * 1000, shownName = '', skip = false;
  let hudModel = MODELS[0]; // start fully faded in

  const resize = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    size = wrap.clientWidth;
    canvas.width = canvas.height = Math.round(size * dpr);
    canvas.style.width = canvas.style.height = `${size}px`;
  };

  function drawModel(segs: Seg[], yaw: number, alpha: number, scale: number, color: string, elevDeg = 20) {
    const ELEV = rad(elevDeg);
    const S = size * 0.5 * scale, cx = size / 2, cy = size * 0.46;
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), ce = Math.cos(ELEV), se = Math.sin(ELEV);
    let zMin = Infinity;
    for (const [a, b] of segs) zMin = Math.min(zMin, a[2], b[2]);
    const shadowZ = zMin - 0.3;
    const project = (p: V, zOverride?: number): [number, number, number] => {
      const z = zOverride ?? p[2];
      const x1 = p[0] * cyw - p[1] * syw, y1 = p[0] * syw + p[1] * cyw;
      const v = z * ce - x1 * se, d = x1 * ce + z * se;
      const k = 3.2 / (3.2 - d);
      return [cx + y1 * S * k, cy - v * S * k, d];
    };
    ctx.strokeStyle = color;
    // ground shadow
    ctx.globalAlpha = 0.1 * alpha;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const [a, b] of segs) {
      const pa = project(a, shadowZ), pb = project(b, shadowZ);
      ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]);
    }
    ctx.stroke();
    // airframe, brighter toward the viewer
    ctx.lineWidth = 1.15;
    for (const [a, b] of segs) {
      const pa = project(a), pb = project(b);
      ctx.globalAlpha = alpha * Math.max(0.18, Math.min(1, 0.55 + ((pa[2] + pb[2]) / 2) * 0.55));
      ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.stroke();
    }
  }

  const ease = (x: number) => x * x * (3 - 2 * x);

  function draw(time: number) {
    const color = getComputedStyle(canvas).color || '#cfb991'; // resolved from CSS --wire (follows light/dark)
    const yaw = reduced ? rad(-35) : rad(-35) + (time / 1000) * ((Math.PI * 2) / 32);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    ctx.lineCap = 'round';

    let m = MODELS[current];
    const age = (time - since) / 1000;
    if (!reduced && (skip || age > m.dwell)) { skip = false; current = (current + 1) % MODELS.length; since = time; m = MODELS[current]; }
    const a = reduced ? 1 : Math.min(1, ((time - since) / 1000) / FADE);
    const prev = MODELS[(current - 1 + MODELS.length) % MODELS.length];
    if (a < 1) drawModel(prev.segs(time), yaw, 1 - ease(a), prev.scale * (1 + 0.04 * ease(a)), color, prev.elev); // outgoing grows slightly as it fades
    drawModel(m.segs(time), yaw, ease(a), m.scale * (0.94 + 0.06 * ease(a)), color, m.elev);                   // incoming settles in
    ctx.globalAlpha = 1;

    if (m.name !== shownName) swapHud(m);
    if (time - textAt > 120 || reduced) {
      textAt = time;
      if (valueOut) valueOut.textContent = hudModel.value(time);
      if (hdgOut) hdgOut.textContent = String(Math.round((((yaw * 180) / Math.PI) % 360 + 360) % 360)).padStart(3, '0');
    }
  }

  function swapHud(m: Model) {
    const first = !shownName;
    shownName = m.name;
    const apply = () => {
      hudModel = m;
      if (valueOut) valueOut.textContent = m.value(last || 0);
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
    if (!visible || document.hidden || reduced) { last = 0; return; }
    last = t;
    draw(t);
    requestAnimationFrame(loop);
  };
  const start = () => { if (!reduced && visible && !last) requestAnimationFrame(loop); };

  // Click / tap to bring in the next aircraft right away.
  wrap.addEventListener('click', () => {
    if (reduced) { current = (current + 1) % MODELS.length; shownName = ''; draw(0); return; }
    skip = true; // switch on the next drawn frame
  });

  resize();
  draw(0);
  new ResizeObserver(() => { resize(); draw(last || 0); }).observe(wrap);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); }).observe(wrap);
  document.addEventListener('visibilitychange', start);
  // Redraw when light/dark changes so the line color follows.
  new MutationObserver(() => draw(last || 0)).observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => draw(last || 0));
  start();
}

document.querySelectorAll<HTMLElement>('.aircraft-art').forEach(mountAircraft);
