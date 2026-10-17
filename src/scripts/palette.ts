interface Item { t: string; hint: string; href?: string; act?: string; v?: string; k?: string; ext?: boolean }
const dlg = document.getElementById('palette') as HTMLDialogElement | null;
const input = document.getElementById('palette-q') as HTMLInputElement | null;
const list = document.getElementById('palette-list');
const items: Item[] = JSON.parse(document.getElementById('palette-data')?.textContent || '[]');
let shown: Item[] = [], sel = 0;

/** Subsequence match: every typed character must appear in order. Earlier, tighter matches score higher. */
function score(item: Item, q: string): number {
  if (!q) return 1;
  const hay = `${item.t} ${item.hint} ${item.k || ''}`.toLowerCase();
  if (hay.includes(q)) return 100 - hay.indexOf(q);
  let i = 0, gaps = 0, last = -1;
  for (const ch of q) {
    const j = hay.indexOf(ch, i);
    if (j < 0) return 0;
    if (last >= 0) gaps += j - last - 1;
    last = j; i = j + 1;
  }
  return Math.max(1, 50 - gaps);
}
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

function render() {
  const q = (input?.value || '').trim().toLowerCase();
  shown = items.map((it) => [it, score(it, q)] as const).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]).map(([it]) => it).slice(0, 12);
  sel = Math.min(sel, Math.max(0, shown.length - 1));
  if (!list) return;
  list.innerHTML = shown.length
    ? shown.map((it, i) => `<li role="option" id="pal-${i}" aria-selected="${i === sel}" data-i="${i}"><span>${esc(it.t)}</span><small>${esc(it.hint)}</small></li>`).join('')
    : '<li class="palette-empty">No matches</li>';
  input?.setAttribute('aria-activedescendant', shown.length ? `pal-${sel}` : '');
  list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
}

function run(it?: Item) {
  if (!it) return;
  if (it.act === 'mode') { dlg?.close(); document.getElementById('mode-toggle')?.click(); return; }
  if (it.act === 'email' && it.v) {
    void navigator.clipboard?.writeText(it.v);
    if (input) { input.value = ''; input.placeholder = 'Email copied ✓'; }
    return;
  }
  if (it.href) {
    dlg?.close();
    if (it.ext) window.open(it.href, '_blank', 'noopener');
    else location.href = it.href;
  }
}

function openPalette() {
  if (!dlg || dlg.open) return;
  if (input) { input.value = ''; input.placeholder = 'Search pages, projects, actions…'; }
  sel = 0;
  render();
  dlg.showModal();
  input?.focus();
}

if (dlg && input && list) {
  input.addEventListener('input', () => { sel = 0; render(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, shown.length - 1); render(); e.preventDefault(); }
    if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); render(); e.preventDefault(); }
    if (e.key === 'Enter') { run(shown[sel]); e.preventDefault(); }
  });
  list.addEventListener('click', (e) => {
    const li = (e.target as Element).closest<HTMLElement>('[data-i]');
    if (li) run(shown[Number(li.dataset.i)]);
  });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  addEventListener('keydown', (e) => {
    const typing = (e.target as Element)?.closest?.('input, textarea, select, [contenteditable="true"]');
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (dlg.open) dlg.close(); else openPalette(); }
    else if (e.key === '/' && !typing && !dlg.open) { e.preventDefault(); openPalette(); }
  });
  document.querySelectorAll('[data-palette]').forEach((b) => b.addEventListener('click', openPalette));
}
