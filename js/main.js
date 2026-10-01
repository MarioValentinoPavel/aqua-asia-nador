/* Aqua Asia · noren de entrada, cinta de kaiten con la carta real (color del plato = precio) */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof gsap !== 'undefined';
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  const D = window.I18N;
  let LANG = 'fr';
  const ix = () => (LANG === 'es' ? 1 : 0);
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } } };

  /* ---------- cinta ---------- */
  const belt = $('#belt');
  const plates = D.items.map((it, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `plate plate--${it[3]}`;
    b.dataset.i = i;
    b.setAttribute('aria-label', `${it[0]}, ${it[3]} DH`);
    b.innerHTML = `<i class="ph-light ${it[4]}"></i><small>${it[1]}</small>`;
    belt.appendChild(b);
    return b;
  });
  let W = 0, H = 0, band = 92, P = 1, offset = 0, speed = 46, paused = false, visible = false, last = 0;
  function measure() {
    W = belt.clientWidth; H = belt.clientHeight;
    band = parseFloat(getComputedStyle($('.belt__track')).borderTopWidth) || 92;
    const c = band / 2, horiz = W >= H;
    const r = (horiz ? H : W) / 2 - c, L = Math.abs(W - H);
    P = 2 * L + 2 * Math.PI * r;
    return { c, horiz, r, L };
  }
  let G = measure();
  function pointAt(s) {
    const { c, horiz, r, L } = G;
    s = ((s % P) + P) % P;
    const arc = Math.PI * r;
    if (horiz) {
      const x0 = H / 2, x1 = W - H / 2;
      if (s < L) return [x0 + s, c];
      s -= L;
      if (s < arc) { const a = -Math.PI / 2 + s / r; return [x1 + Math.cos(a) * r, H / 2 + Math.sin(a) * r]; }
      s -= arc;
      if (s < L) return [x1 - s, H - c];
      s -= L;
      const a = Math.PI / 2 + s / r; return [x0 + Math.cos(a) * r, H / 2 + Math.sin(a) * r];
    }
    const y0 = W / 2, y1 = H - W / 2;
    if (s < L) return [W - c, y0 + s];
    s -= L;
    if (s < arc) { const a = s / r; return [W / 2 + Math.cos(a) * r, y1 + Math.sin(a) * r]; }
    s -= arc;
    if (s < L) return [c, y1 - s];
    s -= L;
    const a = Math.PI + s / r; return [W / 2 + Math.cos(a) * r, y0 + Math.sin(a) * r];
  }
  function place() {
    const gap = P / plates.length;
    plates.forEach((p, i) => {
      const [x, y] = pointAt(offset + i * gap);
      p.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    });
  }
  function loop(t) {
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
    last = t;
    if (!paused && !REDUCE) offset += speed * dt;
    place();
    if (visible) requestAnimationFrame(loop); else last = 0;
  }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) requestAnimationFrame(loop); }, { threshold: 0.05 }).observe(belt);
  belt.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') paused = true; });
  belt.addEventListener('pointerleave', () => (paused = false));
  belt.addEventListener('focusin', () => (paused = true));
  belt.addEventListener('focusout', () => (paused = false));
  addEventListener('resize', () => { G = measure(); place(); });
  let picked = -1;
  function showPick(i, animate = true) {
    picked = i;
    plates.forEach((p, k) => p.classList.toggle('is-picked', k === i));
    const box = $('#pick');
    if (i < 0) return;
    const it = D.items[i];
    box.innerHTML = `<div class="pick__card"><p class="pick__cat">${D.cats[it[2]][ix()]}</p><p class="pick__name">${it[0]}</p><p class="pick__desc">${it[5 + ix()]}</p><p class="pick__price">${it[3]} DH</p></div>`;
    if (animate && hasGsap && !REDUCE) gsap.from('.pick__card > *', { y: 14, opacity: 0, filter: 'blur(4px)', duration: 0.5, ease: 'expo.out', stagger: 0.05 });
  }
  belt.addEventListener('click', (e) => {
    const p = e.target.closest('.plate');
    if (!p) return;
    const i = +p.dataset.i;
    showPick(i);
  });

  function renderReviews() {
    $('#reviews').innerHTML = D.reviews[LANG].map(([t, w]) => `<figure class="rv"><p>${LANG === 'fr' ? '« ' + t + ' »' : '«' + t + '»'}</p><cite>${w}, Google</cite></figure>`).join('');
  }

  /* ---------- idioma ---------- */
  function applyLang(l) {
    LANG = l;
    document.documentElement.lang = l;
    $$('[data-i18n]').forEach((el) => {
      if (el.dataset.fr === undefined) el.dataset.fr = el.innerHTML;
      el.innerHTML = l === 'fr' ? el.dataset.fr : (D.dom[l] && D.dom[l][el.dataset.i18n]) || el.dataset.fr;
    });
    $$('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
    store.set('aa-lang', l);
    renderReviews();
    if (picked >= 0) showPick(picked, false);
  }
  $$('.lang button').forEach((b) => b.addEventListener('click', () => applyLang(b.dataset.lang)));

  /* ---------- noren + héroe ---------- */
  const video = $('.hero__video');
  if (REDUCE) { video.removeAttribute('autoplay'); video.pause(); }
  function heroIn() {
    if (!hasGsap || REDUCE) return;
    gsap.timeline()
      .from('.hero__title span', { yPercent: 100, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: 0.12 })
      .from('.hero__sub, .hero__cta, .hero__hours', { y: 20, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08 }, '-=0.9')
      .from('.hero__video', { scale: 1.2, duration: 2.2, ease: 'expo.out' }, 0);
  }
  const noren = $('#noren');
  let seen = false;
  try { seen = sessionStorage.getItem('aa-intro') === '1'; sessionStorage.setItem('aa-intro', '1'); } catch (e) { }
  if (!hasGsap || REDUCE || seen) { noren.remove(); heroIn(); }
  else {
    document.body.classList.add('is-locked');
    const ps = $$('.noren__p');
    const tl = gsap.timeline({ onComplete: () => { noren.remove(); document.body.classList.remove('is-locked'); } });
    tl.from(ps, { scaleY: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06 })
      .to(ps, { skewX: (i) => (i < 2 ? 8 : -8), duration: 0.25, ease: 'power2.out' }, '+=0.25')
      .to(ps, { xPercent: (i) => (i < 2 ? -140 - (1 - i) * 60 : 140 + (i - 2) * 60), rotate: (i) => (i < 2 ? -6 : 6), opacity: 0, duration: 1, ease: 'expo.inOut' })
      .to('.noren__rod', { opacity: 0, duration: 0.4 }, '-=0.6')
      .to(noren, { backgroundColor: 'rgba(12,11,13,0)', duration: 0.5 }, '-=0.7')
      .add(heroIn, '-=0.8');
    noren.addEventListener('click', () => tl.progress(1));
  }

  /* ---------- scroll ---------- */
  function scrollFx() {
    if (!hasGsap || REDUCE) return;
    const nav = $('#nav');
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => { const y = s.scroll(); nav.classList.toggle('is-solid', y > 60); nav.classList.toggle('is-hidden', s.direction === 1 && y > 700); } });
    gsap.from('.belt__track', { scale: 0.9, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '#belt', start: 'top 80%' } });
    gsap.from('.legend li', { y: 10, opacity: 0, duration: 0.6, ease: 'expo.out', stagger: 0.05, scrollTrigger: { trigger: '.legend', start: 'top 85%' } });
    gsap.from('.sig__a', { clipPath: 'inset(0 0 100% 0)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: '.sig', start: 'top 75%' } });
    gsap.from('.sig__list li', { x: 30, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.sig__list', start: 'top 85%' } });
    gsap.from('.sig__b, .sig__c', { y: 70, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: '.sig__b', start: 'top 90%' } });
    gsap.from('.bar__a, .bar__b', { clipPath: 'inset(100% 0 0 0)', duration: 1.3, ease: 'expo.inOut', stagger: 0.15, scrollTrigger: { trigger: '.bar', start: 'top 75%' } });
    ScrollTrigger.batch('.rv', { start: 'top 90%', once: true, onEnter: (els) => gsap.from(els, { y: 30, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.1 }) });
  }

  place();
  const initial = [new URLSearchParams(location.search).get('lang'), store.get('aa-lang'), (navigator.language || '').slice(0, 2)].find((l) => l === 'fr' || l === 'es') || 'fr';
  applyLang(initial);
  scrollFx();
  addEventListener('load', () => { G = measure(); place(); hasGsap && ScrollTrigger.refresh(); });
})();
