/* Delis — shared behaviour + editorial motion (GSAP / ScrollTrigger / Lenis when present) */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var animate = hasGsap && !reduceMotion;

  /* ---------- Header: shadow when scrolled ---------- */
  var header = document.getElementById('header');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile drawer ---------- */
  var drawer = document.getElementById('drawer');
  document.querySelectorAll('[data-drawer-open]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!drawer) return;
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });
  });
  document.querySelectorAll('[data-drawer-close]').forEach(function (btn) {
    btn.addEventListener('click', closeDrawer);
  });
  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });

  /* ---------- Quantity steppers ---------- */
  document.querySelectorAll('[data-qty]').forEach(function (box) {
    var out = box.querySelector('output');
    var minus = box.querySelector('[data-qty-minus]');
    var plus = box.querySelector('[data-qty-plus]');
    var n = parseInt(out.textContent, 10) || 1;
    function render() { out.textContent = n; }
    if (minus) minus.addEventListener('click', function () { n = Math.max(1, n - 1); render(); });
    if (plus) plus.addEventListener('click', function () { n = Math.min(99, n + 1); render(); });
  });

  /* ---------- Product: thumbnails + swatches ---------- */
  var mainImg = document.querySelector('[data-gallery-main]');
  var countEl = document.querySelector('[data-gallery-count]');
  document.querySelectorAll('[data-thumb]').forEach(function (t) {
    t.addEventListener('click', function () {
      document.querySelectorAll('[data-thumb]').forEach(function (x) { x.classList.remove('is-active'); });
      t.classList.add('is-active');
      var src = t.getAttribute('data-thumb');
      if (!mainImg || mainImg.getAttribute('src') === src) return;
      if (countEl) countEl.textContent = t.getAttribute('data-label') || '';
      if (animate) {
        gsap.to(mainImg, { opacity: 0, scale: 0.98, duration: 0.25, ease: 'power2.in', onComplete: function () {
          mainImg.setAttribute('src', src);
          gsap.to(mainImg, { opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' });
        } });
      } else {
        mainImg.setAttribute('src', src);
      }
    });
  });
  var swatchLabel = document.querySelector('[data-swatch-label]');
  document.querySelectorAll('[data-swatch]').forEach(function (s) {
    s.addEventListener('click', function () {
      document.querySelectorAll('[data-swatch]').forEach(function (x) { x.classList.remove('is-active'); });
      s.classList.add('is-active');
      if (swatchLabel) swatchLabel.textContent = s.getAttribute('data-swatch');
    });
  });

  /* ---------- Category: mobile filter toggle ---------- */
  var filters = document.querySelector('.filters');
  document.querySelectorAll('[data-filters-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () { filters.classList.toggle('is-open'); });
  });

  /* ---------- Checkout: select placeholder colour ---------- */
  document.querySelectorAll('[data-select]').forEach(function (sel) {
    sel.addEventListener('change', function () {
      sel.classList.toggle('is-placeholder', sel.value === '');
    });
  });

  /* ---------- Prevent any form from submitting (preview only) ---------- */
  document.querySelectorAll('form').forEach(function (f) {
    f.addEventListener('submit', function (e) { e.preventDefault(); });
  });

  /* =====================================================================
     Motion — only on pages that load GSAP (home / category / product)
     ===================================================================== */
  if (!hasGsap) return;
  gsap.registerPlugin(ScrollTrigger);

  if (reduceMotion) {
    // Everything stays visible; nothing to do.
    return;
  }

  /* Smooth scroll (Lenis) */
  var lenis = null;
  if (typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  var EASE = 'power3.out';
  var SLOW = 'expo.out';

  /* ---------- Hero / page opening ---------- */
  var heroLines = gsap.utils.toArray('[data-hero-lines] .line > span');
  var heroItems = gsap.utils.toArray('[data-hero-item]');
  var heroImg = document.querySelector('[data-hero-img]');
  var heroVisual = document.querySelector('[data-hero-visual]');
  var heroCaption = document.querySelector('[data-hero-caption]');

  var opening = gsap.timeline({ defaults: { ease: SLOW } });
  if (heroLines.length) {
    gsap.set(heroLines, { yPercent: 110 });
    opening.to(heroLines, { yPercent: 0, duration: 1.4, stagger: 0.14 }, 0.1);
  }
  if (heroItems.length) {
    gsap.set(heroItems, { opacity: 0, y: 24 });
    opening.to(heroItems, { opacity: 1, y: 0, duration: 1.1, stagger: 0.1, ease: EASE }, 0.45);
  }
  if (heroVisual && heroImg) {
    gsap.set(heroVisual, { clipPath: 'inset(0 0 0 100%)' });
    gsap.set(heroImg, { scale: 1.18 });
    opening.to(heroVisual, { clipPath: 'inset(0 0 0 0%)', duration: 1.6 }, 0.2);
    opening.to(heroImg, { scale: 1, duration: 2.2 }, 0.2);
    if (heroCaption) {
      gsap.set(heroCaption, { opacity: 0, y: 12 });
      opening.to(heroCaption, { opacity: 1, y: 0, duration: 0.9, ease: EASE }, 1.3);
    }
    // gentle parallax on the hero image while scrolling away
    gsap.to(heroImg, {
      yPercent: 8, ease: 'none',
      scrollTrigger: { trigger: heroVisual, start: 'top top', end: 'bottom top', scrub: true }
    });
  }

  /* ---------- Generic reveals ---------- */
  gsap.utils.toArray('[data-reveal]').forEach(function (el) {
    gsap.set(el, { opacity: 0, y: 28 });
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1.1, ease: EASE,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  gsap.utils.toArray('[data-stagger]').forEach(function (group) {
    var items = Array.prototype.slice.call(group.children);
    if (!items.length) return;
    gsap.set(items, { opacity: 0, y: 32 });
    gsap.to(items, {
      opacity: 1, y: 0, duration: 1.1, ease: EASE, stagger: 0.09,
      scrollTrigger: { trigger: group, start: 'top 86%', once: true }
    });
  });

  /* ---------- Clip reveals for editorial imagery ---------- */
  gsap.utils.toArray('[data-clip-reveal]').forEach(function (el) {
    var img = el.querySelector('img');
    gsap.set(el, { clipPath: 'inset(100% 0 0 0)' });
    if (img) gsap.set(img, { scale: 1.12 });
    var tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 82%', once: true } });
    tl.to(el, { clipPath: 'inset(0% 0 0 0)', duration: 1.5, ease: SLOW }, 0);
    if (img) tl.to(img, { scale: 1, duration: 2, ease: SLOW }, 0);
  });

  /* ---------- Parallax on portrait images ---------- */
  gsap.utils.toArray('[data-parallax]').forEach(function (img) {
    var wrap = img.parentElement;
    gsap.fromTo(img, { yPercent: -6 }, {
      yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
