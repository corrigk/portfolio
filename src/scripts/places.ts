// Places map: view tabs (world / europe / canada / USA with animated zoom) and name tooltips.
const frame = document.getElementById('map-frame');
const world = document.getElementById('map-world') as SVGSVGElement | null;
const usa = document.getElementById('map-usa') as SVGSVGElement | null;
const tip = document.getElementById('map-tip');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (frame && world && usa && tip) {
  const views: Record<string, number[]> = JSON.parse(frame.dataset.views || '{}');
  const tabs = [...document.querySelectorAll<HTMLButtonElement>('[data-view]')];
  let cur = views.world.slice();
  let anim = 0;

  /** Keep pins and dots a constant on-screen size as the viewBox zooms. */
  const scalePins = () => {
    const k = cur[2] / views.world[2];
    world.style.setProperty('--k', String(k));
  };
  const setVB = (v: number[]) => { cur = v; world.setAttribute('viewBox', v.map((n) => n.toFixed(2)).join(' ')); scalePins(); };
  const zoomTo = (target: number[]) => {
    cancelAnimationFrame(anim);
    if (reduced) return setVB(target);
    const from = cur.slice(), t0 = performance.now(), D = 700;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / D), e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      setVB(from.map((n, i) => n + (target[i] - n) * e));
      if (p < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  };

  const show = (view: string) => {
    tabs.forEach((t) => t.setAttribute('aria-pressed', String(t.dataset.view === view)));
    tip.hidden = true;
    world.toggleAttribute('hidden', view === 'usa');
    usa.toggleAttribute('hidden', view !== 'usa');
    if (view === 'usa') return;
    zoomTo(views[view] || views.world);
  };
  tabs.forEach((t) => t.addEventListener('click', () => {
    show(t.dataset.view!);
    const u = new URL(location.href);
    t.dataset.view === 'world' ? u.searchParams.delete('view') : u.searchParams.set('view', t.dataset.view!);
    history.replaceState(null, '', u);
  }));
  const start = new URLSearchParams(location.search).get('view');
  if (start && views[start]) { if (start !== 'usa') setVB(views[start]); show(start); } // deep link: jump straight there
  scalePins();

  // name tooltips (mouse and keyboard-free touch taps)
  const move = (e: PointerEvent) => {
    const el = (e.target as Element).closest<SVGElement>('[data-name]');
    if (!el) { tip.hidden = true; return; }
    const isState = el.classList.contains('m-state');
    if (isState && !el.classList.contains('on')) { tip.textContent = `${el.dataset.name}`; tip.dataset.on = 'false'; }
    else { tip.textContent = el.dataset.name || ''; tip.dataset.on = 'true'; }
    tip.hidden = false;
    const r = frame.getBoundingClientRect();
    const x = Math.min(r.width - 8, Math.max(8, e.clientX - r.left)), y = Math.max(24, e.clientY - r.top - 14);
    tip.style.left = `${x}px`;
    tip.style.top = `${y}px`;
  };
  frame.addEventListener('pointermove', move);
  frame.addEventListener('pointerdown', move);
  frame.addEventListener('pointerleave', () => { tip.hidden = true; });
}
