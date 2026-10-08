/* Happi.pie — static preview. Small UI helpers + animation (GSAP/ScrollTrigger/Lenis, only on pages with data-anim="on"). */
(function () {
  'use strict';

  /* ---------- Shared UI ---------- */
  var nav = document.querySelector('.nav');
  function onScroll() {
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var quick = document.querySelector('.quick');
  var toggle = document.querySelector('.quick__toggle');
  if (quick && toggle) {
    toggle.addEventListener('click', function () {
      var open = quick.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Forms: UI only
  Array.prototype.forEach.call(document.querySelectorAll('form'), function (f) {
    f.addEventListener('submit', function (e) { e.preventDefault(); });
  });

  // Quantity stepper (product / cart)
  Array.prototype.forEach.call(document.querySelectorAll('[data-qty]'), function (box) {
    var val = box.querySelector('[data-qty-value]');
    var n = parseInt(val.textContent, 10) || 1;
    var minus = box.querySelector('[data-qty-minus]');
    var plus = box.querySelector('[data-qty-plus]');
    minus.addEventListener('click', function () { n = Math.max(1, n - 1); val.textContent = n; });
    plus.addEventListener('click', function () { n = Math.min(99, n + 1); val.textContent = n; });
  });

  // Filters (category): visual toggle only
  Array.prototype.forEach.call(document.querySelectorAll('.filters__opt'), function (o) {
    o.addEventListener('click', function () { o.classList.toggle('is-on'); });
  });

  // Accordion (product)
  Array.prototype.forEach.call(document.querySelectorAll('.acc__head'), function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.acc__item');
      var closed = item.classList.toggle('is-closed');
      btn.setAttribute('aria-expanded', closed ? 'false' : 'true');
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  });

  /* ---------- Animation ---------- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (document.body.getAttribute('data-anim') !== 'on' || reduce || !window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power3.out' });

  // Smooth scroll
  if (window.Lenis) {
    var lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    // Anchor links (#explore)
    Array.prototype.forEach.call(document.querySelectorAll('a[href^="#"]'), function (a) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      a.addEventListener('click', function (e) {
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -72, duration: 1.4 });
      });
    });
  }

  var EASE_REVEAL = 'power4.inOut';

  /* Hero / page opening (runs on load) */
  var heroEls = document.querySelectorAll('[data-hero]');
  if (heroEls.length) {
    var tl = gsap.timeline({ delay: 0.15 });
    var eyebrow = document.querySelector('[data-hero="eyebrow"]');
    var titleLines = document.querySelectorAll('[data-hero="title"] .line > span');
    var fades = document.querySelectorAll('[data-hero="fade"]');
    var media = document.querySelector('[data-hero="media"]');
    var caption = document.querySelector('[data-hero="caption"]');
    var stagger = document.querySelector('[data-hero="stagger"]');

    if (eyebrow) { gsap.set(eyebrow, { autoAlpha: 0, y: 12 }); tl.to(eyebrow, { autoAlpha: 1, y: 0, duration: 0.8 }, 0); }
    if (titleLines.length) {
      gsap.set(titleLines, { yPercent: 110 });
      tl.to(titleLines, { yPercent: 0, duration: 1.3, ease: 'power4.out', stagger: 0.11 }, 0.1);
    }
    if (fades.length) { gsap.set(fades, { autoAlpha: 0, y: 20 }); tl.to(fades, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.1 }, 0.45); }
    if (media) {
      var img = media.querySelector('img');
      gsap.set(media, { clipPath: 'inset(0 0 100% 0)' });
      if (img) gsap.set(img, { scale: 1.12 });
      tl.to(media, { clipPath: 'inset(0 0 0% 0)', duration: 1.5, ease: EASE_REVEAL }, 0.25);
      if (img) tl.to(img, { scale: 1, duration: 1.8 }, 0.4);
    }
    if (caption) { gsap.set(caption, { autoAlpha: 0, y: 16 }); tl.to(caption, { autoAlpha: 1, y: 0, duration: 0.9 }, 1.2); }
    if (stagger) {
      var kids = stagger.children;
      gsap.set(kids, { autoAlpha: 0, y: 22 });
      tl.to(kids, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.07 }, 0.35);
    }
  }

  /* In viewport: fade up */
  gsap.utils.toArray('[data-fade]').forEach(function (el) {
    gsap.set(el, { autoAlpha: 0, y: 28 });
    gsap.to(el, {
      autoAlpha: 1, y: 0, duration: 1.1,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  /* In viewport: stagger children */
  gsap.utils.toArray('[data-stagger]').forEach(function (group) {
    var items = group.children;
    if (!items.length) return;
    gsap.set(items, { autoAlpha: 0, y: 34 });
    gsap.to(items, {
      autoAlpha: 1, y: 0, duration: 1.05, stagger: 0.11,
      scrollTrigger: { trigger: group, start: 'top 85%', once: true }
    });
  });

  /* Image reveal via clip-path */
  gsap.utils.toArray('[data-reveal]').forEach(function (el) {
    var img = el.querySelector('img');
    gsap.set(el, { clipPath: 'inset(0 0 100% 0)' });
    if (img) gsap.set(img, { scale: 1.12 });
    var t = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 82%', once: true } });
    t.to(el, { clipPath: 'inset(0 0 0% 0)', duration: 1.4, ease: EASE_REVEAL });
    if (img) t.to(img, { scale: 1, duration: 1.7 }, 0.15);
  });

  /* Gentle parallax (wrapper is 116% tall so edges never show) */
  gsap.utils.toArray('[data-parallax]').forEach(function (inner) {
    var wrap = inner.parentElement;
    gsap.fromTo(inner, { yPercent: -5 }, {
      yPercent: 5, ease: 'none',
      scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
