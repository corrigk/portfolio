const dlg = document.getElementById('lightbox') as HTMLDialogElement | null;
const items = [...document.querySelectorAll<HTMLButtonElement>('[data-lb]')];

if (dlg && items.length) {
  const img = document.getElementById('lb-img') as HTMLImageElement;
  const cap = document.getElementById('lb-cap')!;
  let i = 0;
  let opener: HTMLElement | null = null;

  const show = (n: number) => {
    i = (n + items.length) % items.length;
    const it = items[i];
    img.src = it.dataset.src!;
    img.alt = it.dataset.alt || '';
    cap.textContent = it.dataset.cap || it.dataset.alt || '';
  };
  items.forEach((b, n) => b.addEventListener('click', () => { opener = b; show(n); dlg.showModal(); }));
  document.getElementById('lb-close')!.addEventListener('click', () => dlg.close());
  document.getElementById('lb-prev')!.addEventListener('click', () => show(i - 1));
  document.getElementById('lb-next')!.addEventListener('click', () => show(i + 1));
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(i - 1);
    if (e.key === 'ArrowRight') show(i + 1);
  });
  // click on backdrop closes
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  // Esc closes (native); return focus to the thumbnail
  dlg.addEventListener('close', () => opener?.focus());
}
