/* ALTAM — Villa U Dubu — interactions (recreated from Claude Design prototype) */
(function () {
  var root = document.documentElement;
  var header = document.querySelector('.site-header');
  var heroImg = document.querySelector('.hero-img');
  var heroSection = document.querySelector('.hero');
  var scrolled = false;

  function applyHeader() {
    if (!header) return;
    var primary = getComputedStyle(root).getPropertyValue('--color-primary').trim();
    if (scrolled) {
      header.style.background = primary;
      header.style.paddingTop = '16px';
      header.style.paddingBottom = '16px';
      header.style.boxShadow = '0 1px 0 rgba(255,255,255,.08)';
    } else {
      header.style.background = 'transparent';
      header.style.paddingTop = '22px';
      header.style.paddingBottom = '22px';
      header.style.boxShadow = 'none';
    }
  }

  function onScroll() {
    var progress = 0;
    if (heroSection) progress = -heroSection.getBoundingClientRect().top;
    var s = progress > 80;
    if (s !== scrolled) { scrolled = s; applyHeader(); }
    var vh = window.innerHeight || 800;
    if (heroImg && progress > -vh && progress < vh * 1.25) {
      var z = 1 + Math.max(0, Math.min(progress / vh, 1)) * 0.08;
      heroImg.style.transform = 'translateY(' + (-progress * 0.12) + 'px) scale(' + z.toFixed(4) + ')';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* section + image reveal */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* theme switch */
  var buttons = document.querySelectorAll('.theme-switch button');
  function setTheme(name) {
    document.body.setAttribute('data-theme', name);
    buttons.forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-set') === name); });
    try { localStorage.setItem('altam-villa-theme', name); } catch (e) {}
    applyHeader();
  }
  buttons.forEach(function (b) {
    b.addEventListener('click', function () { setTheme(b.getAttribute('data-set')); });
  });
  /* honor saved choice, else keep the page's default attribute */
  var saved = null;
  try { saved = localStorage.getItem('altam-villa-theme'); } catch (e) {}
  setTheme(saved || document.body.getAttribute('data-theme') || 'nuit');
})();
