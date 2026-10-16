// Timeline: type filters, plus a small craft that flies down the line as you scroll.
const btns = [...document.querySelectorAll<HTMLButtonElement>('[data-tl]')];
const items = [...document.querySelectorAll<HTMLElement>('.tl-item')];
const years = [...document.querySelectorAll<HTMLElement>('.tl-year')];
const empty = document.getElementById('tl-empty');

btns.forEach((b) => b.addEventListener('click', () => {
  const t = b.dataset.tl!;
  btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  items.forEach((i) => (i.hidden = t !== 'all' && i.dataset.type !== t));
  years.forEach((y) => (y.hidden = ![...y.querySelectorAll<HTMLElement>('.tl-item')].some((i) => !i.hidden)));
  if (empty) empty.hidden = items.some((i) => !i.hidden);
  update();
}));

const track = document.querySelector<HTMLElement>('.tl-track');
function update() {
  if (!track) return;
  const r = track.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, (innerHeight * 0.45 - r.top) / Math.max(1, r.height)));
  track.style.setProperty('--p', p.toFixed(4));
}
addEventListener('scroll', update, { passive: true });
addEventListener('resize', update);
update();
