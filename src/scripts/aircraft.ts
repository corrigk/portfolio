// Rotating wireframe of a B-1B Lancer, drawn on a <canvas> with no libraries.
// The wings sweep between 15° and 67.5° (like the real variable-sweep wing) while the aircraft turns.
type V = [number, number, number]; // x: nose(+)/tail(-), y: right wing(+), z: up(+)
type Seg = [V, V];

const rad = (d: number) => (d * Math.PI) / 180;

/* ---------- static geometry ---------- */
function staticSegs(): Seg[] {
  const s: Seg[] = [];
  const poly = (p: V[], close = true) => { for (let i = 0; i < p.length - (close ? 0 : 1); i++) s.push([p[i], p[(i + 1) % p.length]]); };

  // Fuselage: elliptical rings along the body, joined by stringers, ending in a pointed nose.
  const st: [number, number, number, number][] = [ // x, half-width, half-height, z-center
    [0.86, 0.035, 0.04, -0.01], [0.68, 0.06, 0.065, 0], [0.42, 0.078, 0.075, 0], [0.12, 0.09, 0.07, 0],
    [-0.2, 0.09, 0.066, 0], [-0.5, 0.075, 0.06, 0.005], [-0.76, 0.05, 0.05, 0.01], [-0.96, 0.02, 0.03, 0.015],
  ];
  const K = 12;
  const ring = (i: number, k: number): V => {
    const [x, w, h, zc] = st[i];
    const a = (k / K) * Math.PI * 2;
    return [x, w * Math.cos(a), zc + h * Math.sin(a)];
  };
  st.forEach((_, i) => { for (let k = 0; k < K; k++) s.push([ring(i, k), ring(i, (k + 1) % K)]); });
  for (let i = 0; i < st.length - 1; i++) for (let k = 0; k < K; k += 2) s.push([ring(i, k), ring(i + 1, k)]);
  const nose: V = [1.04, 0, -0.025];
  for (let k = 0; k < K; k += 2) s.push([ring(0, k), nose]);

  // Cockpit windows
  poly([[0.74, -0.03, 0.05], [0.74, 0.03, 0.05], [0.64, 0.045, 0.07], [0.64, -0.045, 0.07]]);

  for (const side of [1, -1]) {
    // Blended wing glove (fixed)
    poly([[0.36, 0.085 * side, 0.02], [-0.03, 0.215 * side, 0.02], [-0.3, 0.215 * side, 0.02], [-0.46, 0.08 * side, 0.02]]);
    // Horizontal stabilizer
    poly([[-0.6, 0.045 * side, 0.06], [-0.8, 0.31 * side, 0.06], [-0.9, 0.31 * side, 0.06], [-0.95, 0.035 * side, 0.06]]);
    // Engine nacelle under the glove (box with a wider intake)
    const y0 = 0.16 * side, nx = [-0.04, -0.46];
    const box = (x: number, w: number, h: number): V[] => [[x, y0 - w, -0.05], [x, y0 + w, -0.05], [x, y0 + w, -0.05 - h], [x, y0 - w, -0.05 - h]];
    const f = box(nx[0], 0.055, 0.075), b = box(nx[1], 0.045, 0.06);
    poly(f); poly(b); f.forEach((p, i) => s.push([p, b[i]]));
  }
  // Vertical fin
  poly([[-0.55, 0, 0.07], [-0.82, 0, 0.4], [-0.93, 0, 0.4], [-0.99, 0, 0.04]]);
  return s;
}

// Movable outer wing panel, rotated about its pivot by `sweep` degrees.
function wingSegs(sweep: number): Seg[] {
  const s: Seg[] = [];
  const t = rad(sweep);
  const base: [number, number][] = [[0.08, 0], [0.025, 0.74], [-0.05, 0.74], [-0.14, 0]];
  for (const side of [1, -1]) {
    const p: V[] = base.map(([x, y]) => [-0.1 + x * Math.cos(t) - y * Math.sin(t), side * (0.2 + x * Math.sin(t) + y * Math.cos(t)), 0.015]);
    for (let i = 0; i < 4; i++) s.push([p[i], p[(i + 1) % 4]]);
    // spar line
    const m = (a: V, b: V, k: number): V => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2]];
    s.push([m(p[0], p[3], 0.4), m(p[1], p[2], 0.4)]);
  }
  return s;
}

/* ---------- renderer ---------- */
export function mountAircraft(wrap: HTMLElement) {
  const canvas = wrap.querySelector('canvas')!;
  const ctx = canvas.getContext('2d')!;
  const sweepOut = wrap.querySelector<HTMLElement>('[data-sweep]');
  const hdgOut = wrap.querySelector<HTMLElement>('[data-hdg]');
  const fixed = staticSegs();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ELEV = rad(20);
  let size = 0, dpr = 1, running = !reduced, visible = true, last = 0, textAt = 0;

  const resize = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    size = wrap.clientWidth;
    canvas.width = canvas.height = Math.round(size * dpr);
    canvas.style.width = canvas.style.height = `${size}px`;
  };

  function draw(time: number) {
    const color = getComputedStyle(canvas).color || '#cfb991'; // resolved from CSS --wire (follows light/dark)
    const yaw = reduced ? rad(-35) : rad(-35) + (time / 1000) * ((Math.PI * 2) / 42);
    const sweep = reduced ? 25 : 41.25 - 26.25 * Math.cos((time / 1000) * ((Math.PI * 2) / 14));
    const segs = fixed.concat(wingSegs(sweep));
    const S = size * 0.5, cx = size / 2, cy = size * 0.46;
    const cy_ = Math.cos(yaw), sy = Math.sin(yaw), ce = Math.cos(ELEV), se = Math.sin(ELEV);

    const project = (p: V, zOverride?: number): [number, number, number] => {
      const z = zOverride ?? p[2];
      const x1 = p[0] * cy_ - p[1] * sy, y1 = p[0] * sy + p[1] * cy_;
      const v = z * ce - x1 * se, d = x1 * ce + z * se;
      const k = 3.2 / (3.2 - d);
      return [cx + y1 * S * k, cy - v * S * k, d];
    };

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;

    // ground shadow
    ctx.globalAlpha = 0.1;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const [a, b] of segs) {
      const pa = project(a, -0.42), pb = project(b, -0.42);
      ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]);
    }
    ctx.stroke();

    // aircraft, brighter toward the viewer
    ctx.lineWidth = 1.15;
    for (const [a, b] of segs) {
      const pa = project(a), pb = project(b);
      ctx.globalAlpha = Math.max(0.18, Math.min(1, 0.55 + ((pa[2] + pb[2]) / 2) * 0.55));
      ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    if (time - textAt > 120 || reduced) {
      textAt = time;
      if (sweepOut) sweepOut.textContent = `${sweep.toFixed(1)}°`;
      if (hdgOut) hdgOut.textContent = String(Math.round((((yaw * 180) / Math.PI) % 360 + 360) % 360)).padStart(3, '0');
    }
  }

  const loop = (t: number) => {
    if (!running || !visible || document.hidden) { last = 0; return; }
    last = t;
    draw(t);
    requestAnimationFrame(loop);
  };
  const start = () => { if (running && visible && !last) requestAnimationFrame(loop); };

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
