/* Yes4All preview — navigation + editorial animations (GSAP 3.13 + ScrollTrigger + Lenis). */
(function () {
  'use strict';

  var body = document.body;
  var page = body.dataset.page || '';
  var nav = document.getElementById('siteNav');

  /* ---------- Navigation: active link + mobile menu ---------- */
  document.querySelectorAll('[data-nav]').forEach(function (a) {
    if (a.dataset.nav === page) a.classList.add('is-active');
  });

  var toggle = nav && nav.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 960 && nav.classList.contains('menu-open')) {
        nav.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- Forms: UI only ---------- */
  document.querySelectorAll('form').forEach(function (f) {
    f.addEventListener('submit', function (e) { e.preventDefault(); });
  });

  /* ---------- Nav shadow on scroll (works without GSAP) ---------- */
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Animations ---------- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wantsAnim = body.dataset.anim === 'true';
  if (!wantsAnim || reduce || typeof window.gsap === 'undefined') return;

  var gsap = window.gsap;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
  var ST = window.ScrollTrigger;

  /* Lenis smooth scroll, driven by GSAP ticker */
  if (typeof window.Lenis !== 'undefined' && ST) {
    try {
      var lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
      lenis.on('scroll', ST.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      // close the mobile menu when a link is used
      document.querySelectorAll('.nav-menu a').forEach(function (a) {
        a.addEventListener('click', function () { nav.classList.remove('menu-open'); });
      });
    } catch (e) { /* fall back to native scroll */ }
  }

  var ease = 'power3.out';

  /* ----- Hero (home) ----- */
  var heroLines = gsap.utils.toArray('.hero-title .line-inner');
  var heroImage = document.querySelector('[data-hero="image"]');
  if (heroLines.length) {
    var tl = gsap.timeline({ defaults: { ease: ease } });
    var label = document.querySelector('[data-hero="label"]');
    var desc = document.querySelector('[data-hero="desc"]');
    var actions = document.querySelector('[data-hero="actions"]');
    var scope = document.querySelector('[data-hero="scope"]');

    gsap.set(heroLines, { yPercent: 110 });
    gsap.set([label, desc, actions].filter(Boolean), { autoAlpha: 0, y: 18 });
    if (heroImage) {
      gsap.set(heroImage, { clipPath: 'inset(0 0 100% 0)' });
      gsap.set(heroImage.querySelector('img'), { scale: 1.12 });
    }
    if (scope) gsap.set(scope, { autoAlpha: 0, y: 12 });

    tl.to(label, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.1)
      .to(heroLines, { yPercent: 0, duration: 1.1, stagger: 0.12 }, 0.15)
      .to(desc, { autoAlpha: 1, y: 0, duration: 0.7 }, 0.65)
      .to(actions, { autoAlpha: 1, y: 0, duration: 0.7 }, 0.8);
    if (heroImage) {
      tl.to(heroImage, { clipPath: 'inset(0 0 0% 0)', duration: 1.2, ease: 'power4.inOut' }, 0.3)
        .to(heroImage.querySelector('img'), { scale: 1, duration: 1.6, ease: 'power3.out' }, 0.3);
    }
    if (scope) tl.to(scope, { autoAlpha: 1, y: 0, duration: 0.7 }, 1.0);
  }

  /* ----- Page title lines (services) ----- */
  var pageLines = gsap.utils.toArray('.h1-page .line-inner');
  if (pageLines.length) {
    var intro = document.querySelector('.svc-promise');
    var others = intro ? Array.prototype.filter.call(intro.children, function (el) { return !el.classList.contains('h1-page'); }) : [];
    var img = document.querySelector('.svc-image');
    gsap.set(pageLines, { yPercent: 110 });
    gsap.set(others, { autoAlpha: 0, y: 16 });
    if (img) { gsap.set(img, { clipPath: 'inset(0 0 100% 0)' }); gsap.set(img.querySelector('img'), { scale: 1.1 }); }
    var tl2 = gsap.timeline({ defaults: { ease: ease } });
    tl2.to(pageLines, { yPercent: 0, duration: 1.0, stagger: 0.12 }, 0.1)
       .to(others, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.08 }, 0.3);
    if (img) tl2.to(img, { clipPath: 'inset(0 0 0% 0)', duration: 1.1, ease: 'power4.inOut' }, 0.25)
                .to(img.querySelector('img'), { scale: 1, duration: 1.5 }, 0.25);
  }

  if (!ST) return;

  /* ----- Count up ----- */
  gsap.utils.toArray('.figure-count[data-count]').forEach(function (el) {
    var target = parseInt(el.dataset.count, 10);
    var suffix = el.dataset.suffix || '';
    var obj = { v: 0 };
    el.textContent = '0' + suffix;
    ST.create({
      trigger: el, start: 'top 95%', once: true,
      onEnter: function () {
        gsap.to(obj, {
          v: target, duration: 1.6, ease: 'power2.out', delay: 0.9,
          onUpdate: function () { el.textContent = Math.round(obj.v) + suffix; }
        });
      }
    });
  });

  /* ----- Generic reveals ----- */
  gsap.utils.toArray('[data-reveal]').forEach(function (el) {
    if (el.dataset.reveal === 'clip') {
      var im = el.querySelector('img');
      gsap.set(el, { clipPath: 'inset(0 0 100% 0)' });
      if (im) gsap.set(im, { scale: 1.1 });
      ST.create({
        trigger: el, start: 'top 85%', once: true,
        onEnter: function () {
          gsap.to(el, { clipPath: 'inset(0 0 0% 0)', duration: 1.1, ease: 'power4.inOut' });
          if (im) gsap.to(im, { scale: 1, duration: 1.5, ease: 'power3.out' });
        }
      });
      return;
    }
    gsap.set(el, { autoAlpha: 0, y: 28 });
    ST.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: function () { gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.9, ease: ease }); }
    });
  });

  gsap.utils.toArray('[data-reveal-group]').forEach(function (group) {
    var items = Array.prototype.slice.call(group.children);
    if (!items.length) return;
    gsap.set(items, { autoAlpha: 0, y: 32 });
    ST.create({
      trigger: group, start: 'top 85%', once: true,
      onEnter: function () { gsap.to(items, { autoAlpha: 1, y: 0, duration: 0.9, ease: ease, stagger: 0.1 }); }
    });
  });

  /* ----- Soft parallax on large imagery (desktop only) ----- */
  if (window.innerWidth > 960) {
    gsap.utils.toArray('img[data-parallax]').forEach(function (img) {
      var box = img.parentElement;
      gsap.set(img, { scale: 1.16 });
      gsap.fromTo(img, { yPercent: -6 }, {
        yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  window.addEventListener('load', function () { ST.refresh(); });
})();
