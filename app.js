/* Villa U Dubu — site engine: i18n (CZ/FR/EN), themes, scroll choreography */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- i18n ---------- */
  var LANGS = ['cs', 'fr', 'en'];
  var current = 'fr';

  function detectLang() {
    var p = new URLSearchParams(location.search).get('lang');
    if (LANGS.indexOf(p) > -1) return p;
    try {
      var saved = localStorage.getItem('villa-lang');
      if (LANGS.indexOf(saved) > -1) return saved;
    } catch (e) {}
    var nav = (navigator.languages || [navigator.language || 'en']).map(function (l) { return l.slice(0, 2).toLowerCase(); });
    for (var i = 0; i < nav.length; i++) {
      if (nav[i] === 'cs' || nav[i] === 'sk') return 'cs';
      if (nav[i] === 'fr') return 'fr';
      if (nav[i] === 'en') return 'en';
    }
    return 'en';
  }

  function setLang(lang) {
    if (!window.I18N || !window.I18N[lang]) return;
    current = lang;
    var dict = window.I18N[lang];
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (dict[k] != null) el.textContent = dict[k];
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-ph');
      if (dict[k] != null) el.setAttribute('placeholder', dict[k]);
    });
    document.querySelectorAll('[data-i18n-content]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-content');
      if (dict[k] != null) el.setAttribute('content', dict[k]);
    });
    document.querySelectorAll('.lang-switch button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-lang') === lang);
    });
    try { localStorage.setItem('villa-lang', lang); } catch (e) {}
    updateConceptCaption();
  }

  document.querySelectorAll('.lang-switch button').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); });
  });

  /* ---------- theme ---------- */
  var themeButtons = document.querySelectorAll('.theme-switch button');
  function setTheme(name) {
    document.body.setAttribute('data-theme', name);
    themeButtons.forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-set') === name); });
    try { localStorage.setItem('altam-villa-theme', name); } catch (e) {}
    applyHeader();
  }
  themeButtons.forEach(function (b) {
    b.addEventListener('click', function () { setTheme(b.getAttribute('data-set')); });
  });

  /* ---------- header + hero parallax ---------- */
  var header = document.querySelector('.site-header');
  var heroImg = document.querySelector('.hero-img');
  var heroSection = document.querySelector('.hero');
  var scrolled = false;

  function applyHeader() {
    if (!header) return;
    var primary = getComputedStyle(document.body).getPropertyValue('--color-primary').trim();
    header.style.background = scrolled ? primary : 'transparent';
    header.style.paddingTop = scrolled ? '14px' : '22px';
    header.style.paddingBottom = scrolled ? '14px' : '22px';
    header.style.boxShadow = scrolled ? '0 1px 0 rgba(255,255,255,.08)' : 'none';
  }

  /* ---------- concept build scene ---------- */
  var conceptSection = document.querySelector('.concept-scroll');
  var scene = document.querySelector('.build-scene');
  var caption = document.getElementById('concept-caption');
  var dots = document.querySelectorAll('.concept-progress i');
  var stageEls = scene ? Array.prototype.slice.call(scene.querySelectorAll('[data-stage]')) : [];
  var lastStage = -1;

  /* map a global progress p (0..1) into a phase progress for [a,b] */
  function phase(p, a, b) { return Math.max(0, Math.min(1, (p - a) / (b - a))); }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  var PHASES = [ /* per data-stage: [start, end] of its entrance */
    [0.02, 0.20],  /* platform */
    [0.22, 0.44],  /* v1 */
    [0.46, 0.68],  /* v2 + pool */
    [0.70, 0.88]   /* v3 */
  ];
  var ENTER = [ /* entrance vector per stage: [dx%, dy%] */
    [0, 60], [-120, 0], [120, 0], [0, -140]
  ];

  function updateConceptCaption() {
    if (!caption || !window.I18N) return;
    var stage = Math.max(0, lastStage);
    var dict = window.I18N[current] || {};
    caption.textContent = dict['concept.s' + stage] || '';
  }

  function renderConcept(p) {
    var stageNow = 0;
    for (var s = 0; s < 4; s++) {
      var t = easeOut(phase(p, PHASES[s][0], PHASES[s][1]));
      if (t > 0.5) stageNow = s;
      stageEls.forEach(function (el) {
        if (+el.getAttribute('data-stage') !== s) return;
        var isLbl = el.classList.contains('bs-lbl');
        if (isLbl) {
          el.style.opacity = t >= 1 ? '1' : '0';
          el.style.transition = 'opacity .5s ease';
        } else {
          el.style.opacity = String(Math.min(1, t * 1.4));
          el.style.transform = 'translate(' + (ENTER[s][0] * (1 - t)) + '%,' + (ENTER[s][1] * (1 - t)) + '%)';
        }
      });
    }
    var lit = p > 0.90;
    scene.classList.toggle('lit', lit);
    if (lit) stageNow = 3;
    if (stageNow !== lastStage) {
      lastStage = stageNow;
      caption.style.opacity = '0';
      setTimeout(function () { updateConceptCaption(); caption.style.opacity = '1'; }, 180);
      dots.forEach(function (d, i) { d.classList.toggle('on', i <= stageNow); });
    }
  }

  /* ---------- unified scroll handler ---------- */
  function onScroll() {
    /* header state + hero parallax */
    var progress = heroSection ? -heroSection.getBoundingClientRect().top : 200;
    var s = progress > 80;
    if (s !== scrolled) { scrolled = s; applyHeader(); }
    var vh = window.innerHeight || 800;
    if (heroImg && !reduceMotion && progress > -vh && progress < vh * 1.25) {
      var z = 1 + Math.max(0, Math.min(progress / vh, 1)) * 0.08;
      heroImg.style.transform = 'translateY(' + (-progress * 0.12) + 'px) scale(' + z.toFixed(4) + ')';
    }
    /* concept scene */
    if (conceptSection && scene && !reduceMotion) {
      var r = conceptSection.getBoundingClientRect();
      var total = r.height - vh;
      var p = total > 0 ? Math.max(0, Math.min(1, -r.top / total)) : 1;
      renderConcept(p);
    }
  }
  var ticking = false;
  function scheduleScroll() {
    if (ticking) return;
    ticking = true;
    var done = false;
    function run() { if (done) return; done = true; onScroll(); ticking = false; }
    requestAnimationFrame(run);           /* normal path */
    setTimeout(run, 120);                 /* fallback when rAF is throttled (hidden tab) */
  }
  window.addEventListener('scroll', scheduleScroll, { passive: true });

  if (reduceMotion && scene) { /* static final state */
    stageEls.forEach(function (el) { el.style.opacity = '1'; el.style.transform = 'none'; });
    scene.classList.add('lit');
    lastStage = 3;
    dots.forEach(function (d) { d.classList.add('on'); });
  }

  /* ---------- reveals ---------- */
  var revealEls = document.querySelectorAll('.reveal, .reveal-img');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- count-up facts ---------- */
  function fmt(n) {
    var s = String(Math.round(n));
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' '); /* thin space, works for cs/fr; en close enough */
  }
  var counters = document.querySelectorAll('[data-count]');
  function runCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (reduceMotion) { el.textContent = fmt(target); return; }
    var t0 = null, dur = 1600;
    function step(ts) {
      if (!t0) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur);
      el.textContent = fmt(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runCounter(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(function (el) { el.textContent = fmt(parseInt(el.getAttribute('data-count'), 10)); });
  }

  /* ---------- lightbox ---------- */
  var lb = document.getElementById('lightbox');
  var lbImg = lb ? lb.querySelector('img') : null;
  var galImgs = Array.prototype.slice.call(document.querySelectorAll('.gal-grid img'));
  var lbIndex = 0;
  function openLb(i) {
    lbIndex = (i + galImgs.length) % galImgs.length;
    lbImg.src = galImgs[lbIndex].src;
    lbImg.alt = galImgs[lbIndex].alt;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLb() { lb.classList.remove('open'); document.body.style.overflow = ''; }
  galImgs.forEach(function (img, i) { img.addEventListener('click', function () { openLb(i); }); });
  if (lb) {
    lb.querySelector('.lb-close').addEventListener('click', closeLb);
    lb.querySelector('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); openLb(lbIndex - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); openLb(lbIndex + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') openLb(lbIndex - 1);
      if (e.key === 'ArrowRight') openLb(lbIndex + 1);
    });
  }

  /* ---------- boot ---------- */
  var themeParam = new URLSearchParams(location.search).get('theme');
  var savedTheme = null;
  try { savedTheme = localStorage.getItem('altam-villa-theme'); } catch (e) {}
  setTheme(themeParam === 'nuit' || themeParam === 'pierre' ? themeParam : (savedTheme || document.body.getAttribute('data-theme') || 'nuit'));
  setLang(detectLang());
  onScroll();
})();
