const root = document.documentElement;
const safe = (fn: () => void) => { try { fn(); } catch {} };
const icons: Record<string,string> = { auto: '◐', light: '☀', dark: '☾' };
const btn = document.getElementById('mode-toggle');
const icon = document.getElementById('mode-icon');
const current = () => root.dataset.mode || 'auto';
function paint() {
  if (icon) icon.textContent = icons[current()];
  btn?.setAttribute('title', 'Mode: ' + current() + ' (click to change)');
}
btn?.addEventListener('click', () => {
  const next = ({ auto: 'light', light: 'dark', dark: 'auto' } as Record<string,string>)[current()];
  if (next === 'auto') { delete root.dataset.mode; safe(() => localStorage.removeItem('mode')); }
  else { root.dataset.mode = next; safe(() => localStorage.setItem('mode', next)); }
  paint();
});
paint();
