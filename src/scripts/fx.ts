// Small motion/interaction layer. Everything here is optional polish: the site works without it.
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
root.classList.add('js');

/* ---------- Rocket page transition ----------
   Clicking an internal link launches a tiny rocket along the header's gold rule, then navigates. */
const ROCKET = `<svg viewBox="0 0 48 20" width="48" height="20" aria-hidden="true"><path d="M2 10h14" stroke="url(#fl)" stroke-width="4" stroke-linecap="round"/><defs><linearGradient id="fl"><stop offset="0" stop-color="#daaa00" stop-opacity="0"/><stop offset="1" stop-color="#daaa00"/></linearGradient></defs><path d="M16 5h18c6 0 10 3 12 5-2 2-6 5-12 5H16z" fill="#f5f3ee"/><path d="M16 5l-4-4h8l4 4zM16 15l-4 4h8l4-4z" fill="#cfb991"/><circle cx="33" cy="10" r="2.2" fill="#08080a"/></svg>`;

function launch(href: string) {
  const header = document.querySelector('.site-header');
  const y = header ? header.getBoundingClientRect().bottom - 11 : 40;
  const el = document.createElement('div');
  el.className = 'rocket-fly';
  el.innerHTML = ROCKET;
  el.style.top = `${Math.max(0, y)}px`;
  document.body.appendChild(el);
  const anim = el.animate(
    [{ transform: 'translateX(-60px)' }, { transform: `translateX(${innerWidth + 60}px)` }],
    { duration: 520, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' },
  );
  let gone = false;
  const go = () => { if (!gone) { gone = true; location.href = href; } };
  setTimeout(go, 380); // start loading before the rocket leaves the screen
  anim.onfinish = go;
}

if (!reduced) {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element).closest?.('a');
    if (!a || a.target || a.hasAttribute('download') || a.closest('.prose, dialog')) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || u.pathname.includes('/admin') || /\.(xml|png|pdf|svg|jpe?g)$/i.test(u.pathname)) return;
    if (u.pathname === location.pathname && u.hash) return; // in-page anchor
    if (u.href === location.href) return;
    e.preventDefault();
    launch(u.href);
  });
}

/* ---------- Scroll reveal for cards ---------- */
const revealables = document.querySelectorAll<HTMLElement>('.card, .side-box, .t-cell, .gallery button');
if (!reduced && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -40px 0px' });
  revealables.forEach((el, i) => { el.classList.add('will-reveal'); el.style.setProperty('--i', String(i % 6)); io.observe(el); });
}

/* ---------- Telemetry count-up ---------- */
const counters = document.querySelectorAll<HTMLElement>('[data-count]');
if (!reduced && counters.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target as HTMLElement;
      const end = Number(el.dataset.count);
      const t0 = performance.now();
      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / 900);
        el.textContent = String(Math.round(end * (1 - Math.pow(1 - k, 3)))).padStart(2, '0');
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  });
  counters.forEach((c) => io.observe(c));
}

/* ---------- Fuel gauge (reading progress) on project pages ---------- */
const gauge = document.querySelector<HTMLElement>('.fuel-gauge');
if (gauge) {
  const header = document.querySelector<HTMLElement>('.site-header');
  const update = () => {
    if (header) root.style.setProperty('--header-h', `${header.offsetHeight}px`);
    const max = document.documentElement.scrollHeight - innerHeight;
    gauge.style.setProperty('--p', String(max > 0 ? Math.min(1, scrollY / max) : 0));
  };
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
}

/* ---------- Back to top: rocket lifts off ---------- */
document.querySelectorAll<HTMLButtonElement>('[data-to-top]').forEach((b) =>
  b.addEventListener('click', () => {
    b.classList.add('liftoff');
    scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    setTimeout(() => b.classList.remove('liftoff'), 900);
  }));

/* ---------- Copy buttons ---------- */
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((b) =>
  b.addEventListener('click', async () => {
    const label = b.textContent;
    try { await navigator.clipboard.writeText(b.dataset.copy!); b.textContent = 'Copied ✓'; }
    catch { b.textContent = 'Press Ctrl+C'; }
    setTimeout(() => (b.textContent = label), 1600);
  }));

/* ---------- Pause SVG (SMIL) animations for reduced motion ---------- */
if (reduced) document.querySelectorAll<SVGSVGElement>('svg.hero-art').forEach((s) => s.pauseAnimations?.());
