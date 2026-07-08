/* Villa U Dubu — site engine: i18n (CZ/FR/EN) + scroll choreography */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- i18n ---------- */
  var LANGS = ['cs', 'fr', 'en'];

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
  }

  document.querySelectorAll('.lang-switch button').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); });
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
    header.style.boxShadow = scrolled ? '0 1px 0 rgba(193,207,225,.15)' : 'none';
  }

  function onScroll() {
    var progress = heroSection ? -heroSection.getBoundingClientRect().top : 200;
    var s = progress > 80;
    if (s !== scrolled) { scrolled = s; applyHeader(); }
    var vh = window.innerHeight || 800;
    if (heroImg && !reduceMotion && progress > -vh && progress < vh * 1.25) {
      var z = 1 + Math.max(0, Math.min(progress / vh, 1)) * 0.08;
      heroImg.style.transform = 'translateY(' + (-progress * 0.12) + 'px) scale(' + z.toFixed(4) + ')';
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
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
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
  setLang(detectLang());
  applyHeader();
  onScroll();
})();
