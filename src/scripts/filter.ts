const grid = document.getElementById('grid')!;
const cards = [...grid.querySelectorAll<HTMLElement>('.card')];
const q = document.getElementById('q') as HTMLInputElement;
const sort = document.getElementById('sort') as HTMLSelectElement;
const count = document.getElementById('count')!;
const empty = document.getElementById('empty')!;
const catBtns = [...document.querySelectorAll<HTMLButtonElement>('[data-cat]')];
const tagBtns = [...document.querySelectorAll<HTMLButtonElement>('[data-tag]')];

let cat = 'all';
const tags = new Set<string>();

function apply() {
  const term = q.value.trim().toLowerCase();
  let shown = 0;
  for (const c of cards) {
    const ctags = (c.dataset.tags || '').split('|');
    const ok =
      (cat === 'all' || c.dataset.category === cat) &&
      [...tags].every((t) => ctags.includes(t)) &&
      (!term || (c.dataset.text || '').includes(term));
    c.hidden = !ok;
    if (ok) shown++;
  }
  const by = sort.value;
  const sorted = [...cards].sort((a, b) =>
    by === 'title' ? a.dataset.title!.localeCompare(b.dataset.title!)
    : by === 'oldest' ? Number(a.dataset.date) - Number(b.dataset.date)
    : Number(b.dataset.date) - Number(a.dataset.date));
  sorted.forEach((c) => grid.appendChild(c));
  count.textContent = `${shown} of ${cards.length} projects`;
  empty.hidden = shown > 0;
  const u = new URL(location.href);
  term ? u.searchParams.set('q', term) : u.searchParams.delete('q');
  cat !== 'all' ? u.searchParams.set('cat', cat) : u.searchParams.delete('cat');
  history.replaceState(null, '', u);
}

catBtns.forEach((b) => b.addEventListener('click', () => {
  cat = b.dataset.cat!;
  catBtns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  apply();
}));
tagBtns.forEach((b) => b.addEventListener('click', () => {
  const t = b.dataset.tag!;
  tags.has(t) ? tags.delete(t) : tags.add(t);
  b.setAttribute('aria-pressed', String(tags.has(t)));
  apply();
}));
q.addEventListener('input', apply);
sort.addEventListener('change', apply);
document.getElementById('reset')?.addEventListener('click', () => {
  q.value = ''; tags.clear(); cat = 'all';
  tagBtns.forEach((x) => x.setAttribute('aria-pressed', 'false'));
  catBtns.forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.cat === 'all')));
  apply();
});

// Restore state from URL (?q=...&cat=...)
const params = new URLSearchParams(location.search);
if (params.get('q')) q.value = params.get('q')!;
const pc = params.get('cat');
if (pc && catBtns.some((b) => b.dataset.cat === pc)) {
  cat = pc;
  catBtns.forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.cat === pc)));
}
apply();
