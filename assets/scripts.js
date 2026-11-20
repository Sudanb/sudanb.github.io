// Shared scripts — page fade transitions + lazy image loader for placeholders.

(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduce) {
    document.addEventListener('DOMContentLoaded', () => document.body.classList.add('page-in'));
    document.querySelectorAll('a.x-nav').forEach(a => {
      a.addEventListener('click', e => {
        const href = a.getAttribute('href');
        if (!href || href.startsWith('#') || a.target === '_blank') return;
        e.preventDefault();
        document.body.classList.remove('page-in');
        document.body.classList.add('page-out');
        setTimeout(() => (location.href = href), 150);
      }, { passive: false });
    });
  } else {
    document.body.classList.add('page-in');
  }
})();

// Avatar loader (tries a few filenames in /images/ then repo root).
(function () {
  const img = document.getElementById('avatar');
  if (!img) return;
  const candidates = [
    'images/profile.webp', 'images/profile.jpg', 'images/profile.png',
    'profile.webp', 'profile.jpg', 'profile.png'
  ];
  let i = 0;
  (function tryNext() {
    if (i >= candidates.length) return;
    const src = candidates[i++];
    const test = new Image();
    test.onload = () => { img.src = src; img.classList.remove('hidden'); };
    test.onerror = tryNext;
    test.src = src;
  })();
})();

// Media placeholder → real image swap.
// Each <figure class="media"> with data-img="images/foo.webp" will attempt to load
// that image; on success it replaces the placeholder with an <img>. On failure,
// the placeholder (with the filename hint) stays visible.
(function () {
  document.querySelectorAll('figure.media[data-img]').forEach(fig => {
    const src = fig.getAttribute('data-img');
    const alt = fig.getAttribute('data-alt') || '';
    const test = new Image();
    test.onload = () => {
      const real = document.createElement('img');
      real.src = src;
      real.alt = alt;
      real.loading = 'lazy';
      real.decoding = 'async';
      fig.innerHTML = '';
      fig.appendChild(real);
    };
    test.onerror = () => { /* keep placeholder as-is */ };
    test.src = src;
  });
})();
