/* premium.js — полоса прокрутки, счётчики, подсветка раздела в меню */
(function () {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.prepend(bar);
  const header = document.getElementById('headerTop');
  function onScroll() {
    const h = document.documentElement;
    bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + '%';
    if (header) header.classList.toggle('scrolled', h.scrollTop > 40);
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Счётчики в карточке на главном экране (2000+, 100%)
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.spec-value').forEach(el => {
      const m = el.textContent.trim().match(/^(\d+)(.*)$/);
      if (!m || !+m[1]) return;
      const to = +m[1], tail = m[2], dur = 1600;
      let t0;
      el.textContent = '0' + tail;
      const step = t => {
        t0 = t0 || t;
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + tail;
        if (p < 1) requestAnimationFrame(step);
      };
      setTimeout(() => requestAnimationFrame(step), 700);
    });
  }

  // Подсветка текущего раздела в меню
  const links = [...document.querySelectorAll('.nav-link')];
  const map = new Map(links.map(l => [l.getAttribute('href').slice(1), l]));
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(l => l.classList.remove('is-current'));
    const l = map.get(e.target.id);
    if (l) l.classList.add('is-current');
  }), { rootMargin: '-35% 0px -55% 0px' });
  map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
})();
