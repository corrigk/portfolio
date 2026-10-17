// Small motion/interaction layer. Everything here is optional polish: the site works without it.
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
root.classList.add('js');

/* ---------- Rocket page transition ----------
   Clicking an internal link launches a tiny rocket along the header's gold rule, then navigates. */
const ROCKET = `<svg viewBox="0 0 48 20" width="48" height="20" aria-hidden="true"><path d="M2 10h14" stroke="url(#fl)" stroke-width="4" stroke-linecap="round"/><defs><linearGradient id="fl"><stop offset="0" stop-color="#daaa00" stop-opacity="0"/><stop offset="1" stop-color="#daaa00"/></linearGradient></defs><path d="M16 5h18c6 0 10 3 12 5-2 2-6 5-12 5H16z" fill="#f5f3ee"/><path d="M16 5l-4-4h8l4 4zM16 15l-4 4h8l4-4z" fill="#cfb991"/><circle cx="33" cy="10" r="2.2" fill="#08080a"/></svg>`;

// Top view of a swept-wing jet, nose pointing right, with a contrail.
const JET = `<svg viewBox="0 0 64 28" width="64" height="28" aria-hidden="true"><path d="M0 14h22" stroke="url(#ct)" stroke-width="2" stroke-linecap="round"/><defs><linearGradient id="ct"><stop offset="0" stop-color="#f5f3ee" stop-opacity="0"/><stop offset="1" stop-color="#f5f3ee" stop-opacity=".7"/></linearGradient></defs><path d="M62 14l-6-2.2-8-.8-10-9.5h-4l5 9.4-9 .3-4.5-4.7h-2.5l2 5.2-2 .3v4l2 .3-2 5.2h2.5l4.5-4.7 9 .3-5 9.4h4l10-9.5 8-.8z" fill="#cfb991" stroke="#08080a" stroke-width=".6"/></svg>`;

function launch(href: string) {
  const header = document.querySelector('.site-header');
  const y = header ? header.getBoundingClientRect().bottom - 11 : 40;
  const el = document.createElement('div');
  el.className = 'rocket-fly';
  el.innerHTML = root.dataset.motif === 'aircraft' ? JET : ROCKET;
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
const revealables = document.querySelectorAll<HTMLElement>('.card, .side-box, .t-cell, .gallery button, .tl-card, .idea-card');
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

/* ---------- Konami code (up up down down left right left right B A) opens the hidden hangar ---------- */
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let kIdx = 0;
addEventListener('keydown', (e) => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  kIdx = k === KONAMI[kIdx] ? kIdx + 1 : k === KONAMI[0] ? 1 : 0;
  if (kIdx === KONAMI.length) { kIdx = 0; location.href = `${root.dataset.base || ''}/hangar/`; }
});

/* ---------- Now and then: a formation flyby (aircraft motif) or a shooting star (space motif) across the hero ---------- */
const heroEl = document.querySelector<HTMLElement>('.hero');
if (heroEl && !reduced) {
  // top view of a swept-wing jet, nose pointing right
  const JET = '<path d="M28 10 21 8.6 14 8 9 1H6.5l3 7-6.3.3L1 5H0l.7 4.5L0 10l.7.5L0 15h1l2.2-3.3 6.3.3-3 7H9l5-7 7-.6z" fill="currentColor"/>';
  const flyby = () => {
    const el = document.createElement('div');
    if (root.dataset.motif === 'aircraft') {
      el.className = 'flyby';
      const jet = (x: number, y: number) => `<g transform="translate(${x} ${y})"><path d="M-160 10H0" stroke="currentColor" stroke-opacity=".25"/>${JET}</g>`;
      el.innerHTML = `<svg width="120" height="70" viewBox="0 0 120 70" aria-hidden="true">${jet(70, 25)}${jet(45, 5)}${jet(45, 45)}</svg>`;
      el.style.top = `${10 + Math.random() * 30}%`;
      heroEl.appendChild(el);
      const w = heroEl.clientWidth;
      el.animate([{ transform: 'translate(-160px, 0)' }, { transform: `translate(${w + 160}px, -40px)` }],
        { duration: 7000 + Math.random() * 2500, easing: 'linear' }).onfinish = () => el.remove();
    } else {
      el.className = 'shooting-star';
      el.style.top = `${8 + Math.random() * 35}%`;
      el.style.left = `${20 + Math.random() * 60}%`;
      heroEl.appendChild(el);
      el.animate([{ transform: 'rotate(-20deg) translateX(0)', opacity: 0 }, { opacity: 1, offset: 0.2 }, { transform: 'rotate(-20deg) translateX(-260px)', opacity: 0 }],
        { duration: 1100, easing: 'ease-out' }).onfinish = () => el.remove();
    }
  };
  const schedule = (ms: number) => setTimeout(() => { if (!document.hidden) flyby(); schedule(35000 + Math.random() * 25000); }, ms);
  schedule(9000);
}
