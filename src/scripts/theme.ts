const root = document.documentElement;
const locked = root.dataset.locked === 'true';
const safe = (fn: () => void) => { try { fn(); } catch {} };

function paintThemeButtons() {
  document.querySelectorAll<HTMLButtonElement>('[data-set-theme]').forEach((b) =>
    b.setAttribute('aria-pressed', String(b.dataset.setTheme === root.dataset.theme)));
}
if (!locked) {
  document.querySelectorAll<HTMLButtonElement>('[data-set-theme]').forEach((b) =>
    b.addEventListener('click', () => {
      root.dataset.theme = b.dataset.setTheme!;
      safe(() => localStorage.setItem('theme', b.dataset.setTheme!));
      paintThemeButtons();
    }));
}
paintThemeButtons();

const icons: Record<string, string> = { auto: '◐', light: '☀', dark: '☾' };
const btn = document.getElementById('mode-toggle');
const icon = document.getElementById('mode-icon');
const current = () => root.dataset.mode || 'auto';
function paintMode() {
  if (icon) icon.textContent = icons[current()];
  btn?.setAttribute('title', `Mode: ${current()} (click to change)`);
}
btn?.addEventListener('click', () => {
  const next = ({ auto: 'light', light: 'dark', dark: 'auto' } as Record<string, string>)[current()];
  if (next === 'auto') { delete root.dataset.mode; safe(() => localStorage.removeItem('mode')); }
  else { root.dataset.mode = next; safe(() => localStorage.setItem('mode', next)); }
  paintMode();
});
paintMode();
