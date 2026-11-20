// Shared scripts:
//   1. Page fade transition
//   2. Robotics trajectory background (injected on every page)
//   3. Avatar loader
//   4. Media placeholder → real image swap
//   5. IntersectionObserver reveal animations
//   6. Active-nav highlighting on landing-page anchors

/* 1. Page fade — only on outgoing navigation */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  document.querySelectorAll('a.x-nav').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || a.target === '_blank') return;
      e.preventDefault();
      document.body.classList.add('page-out');
      setTimeout(() => (location.href = href), 180);
    }, { passive: false });
  });
})();

/* 2. Robotics trajectory background — injected once into <body>. */
(function () {
  if (document.querySelector('.bg-trajectories')) return;
  const host = document.createElement('div');
  host.className = 'bg-trajectories';
  host.setAttribute('aria-hidden', 'true');

  // ViewBox is large so curves span viewport at any resolution.
  // Three bezier "trajectories" + waypoints. Each path has a short animated
  // dash moving along it, suggesting data/motion flow.
  host.innerHTML = `
    <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
      <defs>
        <path id="t1" d="M -40 220 C 260 80, 520 420, 800 300 S 1300 620, 1680 380"/>
        <path id="t2" d="M -20 760 C 320 640, 540 900, 880 760 S 1300 520, 1680 640"/>
        <path id="t3" d="M 220 -40 C 420 240, 340 520, 620 660 S 1080 760, 1200 1040"/>
      </defs>
      <use href="#t1"/>
      <use href="#t2"/>
      <use href="#t3"/>
      <use class="flow"   href="#t1"/>
      <use class="flow b" href="#t2"/>
      <use class="flow c" href="#t3"/>
      <!-- Waypoints along the curves -->
      <circle class="waypoint" cx="100"  cy="200" r="3"/>
      <circle class="waypoint hollow" cx="420" cy="220" r="5"/>
      <circle class="waypoint" cx="800"  cy="300" r="3"/>
      <circle class="waypoint hollow" cx="1180" cy="440" r="5"/>
      <circle class="waypoint" cx="1500" cy="400" r="3"/>

      <circle class="waypoint" cx="160"  cy="740" r="3"/>
      <circle class="waypoint hollow" cx="540" cy="820" r="5"/>
      <circle class="waypoint" cx="920"  cy="720" r="3"/>
      <circle class="waypoint hollow" cx="1300" cy="580" r="5"/>

      <circle class="waypoint" cx="240"  cy="40"  r="3"/>
      <circle class="waypoint hollow" cx="460" cy="320" r="5"/>
      <circle class="waypoint" cx="640"  cy="640" r="3"/>
      <circle class="waypoint hollow" cx="960" cy="800" r="5"/>

      <!-- Scattered single points (sparse "point cloud") -->
      <circle class="waypoint" cx="320"  cy="120" r="1.6" opacity="0.5"/>
      <circle class="waypoint" cx="700"  cy="80"  r="1.6" opacity="0.4"/>
      <circle class="waypoint" cx="1120" cy="180" r="1.6" opacity="0.5"/>
      <circle class="waypoint" cx="380"  cy="520" r="1.6" opacity="0.4"/>
      <circle class="waypoint" cx="880"  cy="480" r="1.6" opacity="0.5"/>
      <circle class="waypoint" cx="1420" cy="620" r="1.6" opacity="0.4"/>
      <circle class="waypoint" cx="520"  cy="920" r="1.6" opacity="0.4"/>
      <circle class="waypoint" cx="1040" cy="920" r="1.6" opacity="0.5"/>
    </svg>`;

  // Insert as first child so it sits under content.
  document.body.insertBefore(host, document.body.firstChild);
})();

/* 3. Avatar loader */
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

/* 4. Media placeholder → real image swap */
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
    test.src = src;
  });
})();

/* 5. Reveal-on-scroll — initially-visible elements reveal immediately
      (no animation), IO handles the rest as they scroll into view. */
(function () {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  // No IO support → just show everything.
  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('in'));
    return;
  }

  // Immediately reveal anything already within the viewport on load.
  requestAnimationFrame(() => {
    const vh = window.innerHeight;
    items.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.95 && r.bottom > 0) el.classList.add('in');
    });
  });

  // IO handles the rest as the user scrolls.
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  items.forEach(el => { if (!el.classList.contains('in')) io.observe(el); });

  // Final safety net for anything still pending after a beat.
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.in)').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 1.5) el.classList.add('in');
    });
  }, 600);
})();

/* 6. Active-nav highlighting on landing anchors
   When scrolling the landing page, update which nav link reads as active. */
(function () {
  const sections = document.querySelectorAll('section[data-nav]');
  if (!sections.length) return;
  const navMap = {};
  document.querySelectorAll('.nav-links a[data-anchor]').forEach(a => {
    navMap[a.getAttribute('data-anchor')] = a;
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const key = entry.target.getAttribute('data-nav');
      Object.keys(navMap).forEach(k => navMap[k].classList.toggle('active', k === key));
    });
  }, { threshold: 0.4 });
  sections.forEach(s => io.observe(s));
})();
