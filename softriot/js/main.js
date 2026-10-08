/* Soft Riot — shared script. Page logic is switched on body[data-page]: home | collection | product.
   Hidden states are only ever set with gsap.set, so a failed script never leaves anything invisible. */
(function () {
  'use strict';
  var doc = document;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var page = doc.body.getAttribute('data-page');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasG = !!(window.gsap && window.ScrollTrigger);
  var lenis = null;

  /* ---------- bag count (no real cart; remembered per tab so the nav agrees across pages) ---------- */
  var bagEls = $$('[data-bag]');
  function readBag() { try { return parseInt(sessionStorage.getItem('sr-bag'), 10) || 0; } catch (e) { return 0; } }
  function setBag(n) {
    try { sessionStorage.setItem('sr-bag', String(n)); } catch (e) {}
    bagEls.forEach(function (el) { el.textContent = 'Bag (' + n + ')'; });
  }
  setBag(readBag());

  /* placeholder links stay inert */
  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#"]');
    if (a) e.preventDefault();
  });

  /* ---------- smooth scroll ---------- */
  if (hasG) {
    gsap.registerPlugin(ScrollTrigger);
    if (!reduce && window.Lenis) {
      lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.95, anchors: { offset: -(parseInt(getComputedStyle(doc.documentElement).getPropertyValue('--nav'), 10) || 0) - 24 } });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
  }

  /* a hanger lands, then swings past vertical and settles */
  function landSway(els, delay) {
    if (!hasG || reduce || !els.length) return;
    gsap.fromTo(els, { rotation: -1.8, transformOrigin: '50% 12px' },
      { rotation: 0, duration: 2.4, ease: 'elastic.out(1,0.3)', stagger: 0.06, delay: delay || 0, overwrite: 'auto' });
  }

  /* =====================================================================
     HOME
     ===================================================================== */
  function home() {
    var rail = $('#rail'), vp = $('#vp'), track = $('#track');
    var hangs = $$('.hang', track), done = $('#done'), needleB = $('#needleB'), countEl = $('#count');
    var hint = $('#hint');
    var N = hangs.length, pinned = false, tween = null, st = null, centers = [], lit = -1;

    function pad2(n) { return (n < 10 ? '0' : '') + n; }
    function measure() { centers = hangs.map(function (h) { return h.offsetLeft + h.offsetWidth / 2; }); }

    /* the thread is the progress bar; the counter and the one lit garment follow it */
    function setProgress(p, x) {
      p = Math.max(0, Math.min(1, p || 0));
      done.style.clipPath = 'inset(0 calc(' + ((1 - p) * 100) + '% + 40px) 0 0)';
      needleB.style.left = (p * 100) + '%';
      if (!centers.length) return;
      var T = centers[0] + p * (centers[N - 1] - centers[0]), best = 0, bd = 1e9;
      for (var i = 0; i < N; i++) { var d = Math.abs(centers[i] - T); if (d < bd) { bd = d; best = i; } }
      if (best !== lit) {
        if (lit > -1) hangs[lit].classList.remove('is-lit');
        hangs[best].classList.add('is-lit');
        lit = best;
        countEl.textContent = pad2(best + 1) + ' / ' + N;
      }
    }
    function nativeScroll() {
      if (pinned) return;
      var max = vp.scrollWidth - vp.clientWidth;
      setProgress(max > 0 ? vp.scrollLeft / max : 0, -vp.scrollLeft);
    }
    vp.addEventListener('scroll', function () {
      if (pinned) { vp.scrollLeft = 0; return; }
      nativeScroll();
    }, { passive: true });

    measure(); setProgress(0, 0);

    if (!hasG) return;

    /* arrival: the underline is sewn in on load */
    var stitch = $('#stitch'), needleA = $('#needleA'), tagline = $('#tagline'), ameta = $('#ameta');
    if (!reduce) {
      gsap.set(stitch, { clipPath: 'inset(0 100% 0 0)' });
      gsap.set(needleA, { opacity: 0 });
      gsap.set([tagline, ameta], { opacity: 0, y: 12 });
      var o = { p: 0 };
      gsap.timeline({ delay: 0.25 })
        .set(needleA, { opacity: 1 })
        .to(o, {
          p: 1, duration: 1.7, ease: 'power2.inOut',
          onUpdate: function () {
            var w = $('.mark').offsetWidth;
            stitch.style.clipPath = 'inset(0 ' + (100 - o.p * 100) + '% 0 0)';
            needleA.style.left = (o.p * (w - 6) + 6) + 'px';
          }
        })
        .to(needleA, { opacity: 0, y: -8, duration: 0.45, ease: 'power2.in' }, '>-0.05')
        .to(tagline, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.9')
        .to(ameta, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.55');
    }

    /* the pinned rail */
    var mm = gsap.matchMedia();
    mm.add('(min-width: 761px) and (prefers-reduced-motion: no-preference)', function () {
      pinned = true;
      rail.classList.add('is-pinned');
      vp.scrollLeft = 0;
      hint.textContent = 'Scroll to glide the rail →';
      var dist = function () { return Math.max(0, track.scrollWidth - vp.clientWidth); };
      tween = gsap.to(track, { x: function () { return -dist(); }, ease: 'none' });
      st = ScrollTrigger.create({
        trigger: rail, start: 'top top',
        end: function () { return '+=' + Math.round(dist() * 0.92); },
        pin: true, scrub: 0.55, animation: tween,
        invalidateOnRefresh: true, anticipatePin: 1,
        onRefresh: function () { measure(); }
      });

      /* pendulum: each hanger is a spring following the rail's lean; when the rail stops the lean
         snaps to zero and the cards swing past it, then settle */
      var K = hangs.map(function (_, i) { return { a: 0, w: 0, k: 22 + (i * 7 % 9), c: 1.05 + (i % 4) * 0.18 }; });
      var lastX = gsap.getProperty(track, 'x'), vSm = 0, resting = true;
      var swing = function (time, dt) {
        var d = Math.min(dt, 50) / 1000; if (!d) return;
        var x = gsap.getProperty(track, 'x');
        var v = (x - lastX) / d; lastX = x;
        vSm += (v - vSm) * 0.3;
        var target = Math.max(-2.2, Math.min(2.2, vSm * 0.0007));
        var moving = Math.abs(target) > 0.004;
        if (resting && !moving) return;
        var still = !moving;
        for (var i = 0; i < K.length; i++) {
          var s = K[i];
          var acc = -s.k * (s.a - target) - s.c * s.w;
          s.w += acc * d; s.a += s.w * d;
          if (still && Math.abs(s.a) < 0.003 && Math.abs(s.w) < 0.02) { s.a = 0; s.w = 0; }
          hangs[i].style.transform = 'rotate(' + s.a.toFixed(3) + 'deg)';
          if (s.a !== 0 || s.w !== 0) still = false;
        }
        resting = still && !moving;
      };
      gsap.ticker.add(swing);
      tween.eventCallback('onUpdate', function () {
        resting = false;
        setProgress(tween.progress(), gsap.getProperty(track, 'x'));
      });

      /* keyboard: focusing a hanger brings it into view */
      var onFocus = function (e) {
        var h = e.target.closest && e.target.closest('.hang'); if (!h || !st) return;
        var idx = hangs.indexOf(h); if (idx < 0) return;
        var want = Math.max(0, Math.min(dist(), centers[idx] - vp.clientWidth * 0.4));
        var y = st.start + (want / dist()) * (st.end - st.start);
        if (lenis) lenis.scrollTo(y, { duration: 0.9 }); else window.scrollTo(0, y);
      };
      track.addEventListener('focusin', onFocus);

      return function () {
        pinned = false;
        track.removeEventListener('focusin', onFocus);
        gsap.ticker.remove(swing);
        rail.classList.remove('is-pinned');
        hangs.forEach(function (h) { h.style.transform = ''; });
        track.style.transform = '';
        measure(); nativeScroll();
      };
    });
    mm.add('(max-width: 760px), (prefers-reduced-motion: reduce)', function () {
      hint.textContent = 'Swipe the rail →';
      nativeScroll();
    });

    /* the sewn label: its border thread is pulled through once */
    if (!reduce) {
      var sewn = $('#sewn');
      gsap.set(sewn, { clipPath: 'inset(0 100% 0 0)' });
      ScrollTrigger.create({
        trigger: '#label', start: 'top 78%', once: true,
        onEnter: function () { gsap.to(sewn, { clipPath: 'inset(0 0% 0 0)', duration: 1.9, ease: 'power2.inOut' }); }
      });
    }

    var toHash = function () {
      if (location.hash.length < 2) return;
      var t = $(location.hash); if (!t) return;
      if (lenis) lenis.resize();
      var y = t.getBoundingClientRect().top + window.pageYOffset - 76;
      if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y);
    };
    var refresh = function () {
      measure(); ScrollTrigger.refresh();
      toHash(); setTimeout(toHash, 250);
    };
    window.addEventListener('load', refresh);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { measure(); ScrollTrigger.refresh(); });
  }

  /* =====================================================================
     COLLECTION — the back room
     ===================================================================== */
  function collection() {
    var rowsEl = $('#rows'), tabs = $$('.stubtab'), countEl = $('#shown');
    var pieces = $$('.piece', rowsEl);
    var CATS = { all: 'All', knitwear: 'Knitwear', corsetry: 'Corsetry', dresses: 'Dresses', accessories: 'Accessories' };
    var current = 'all', triggers = [];

    function cols() { return parseInt(getComputedStyle(rowsEl).getPropertyValue('--cols'), 10) || 4; }

    /* every row is its own wire: re-chunk whatever is visible */
    function render(cat, animate) {
      triggers.forEach(function (t) { t.kill(); }); triggers = [];
      var vis = pieces.filter(function (li) { return cat === 'all' || li.getAttribute('data-cat') === cat; });
      var n = cols();
      rowsEl.innerHTML = '';
      var rows = [];
      for (var i = 0; i < vis.length; i += n) {
        var ul = doc.createElement('ul');
        ul.className = 'row';
        vis.slice(i, i + n).forEach(function (li) { ul.appendChild(li); });
        rowsEl.appendChild(ul); rows.push(ul);
      }
      pieces.forEach(function (li) { li.querySelector('.hang').style.transform = ''; });
      countEl.textContent = 'Showing ' + vis.length + ' of ' + pieces.length + (cat === 'all' ? '' : ': ' + CATS[cat]);
      tabs.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-cat') === cat ? 'true' : 'false'); });
      current = cat;
      if (animate && hasG && !reduce) {
        rows.forEach(function (row) {
          gsap.set(row, { y: 24, opacity: 0 });
          triggers.push(ScrollTrigger.create({
            trigger: row, start: 'top 90%', once: true,
            onEnter: function () {
              gsap.to(row, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
                onComplete: function () { landSway($$('.hang', row), 0); } });
            }
          }));
        });
        ScrollTrigger.refresh();
      } else if (hasG) { ScrollTrigger.refresh(); }
    }

    function fromHash() {
      var h = (location.hash || '').replace('#', '').toLowerCase();
      return CATS[h] ? h : 'all';
    }
    tabs.forEach(function (b) {
      b.addEventListener('click', function () {
        var c = b.getAttribute('data-cat');
        try { history.replaceState(null, '', c === 'all' ? location.pathname + location.search : '#' + c); } catch (e) {}
        render(c, false);
      });
    });
    window.addEventListener('hashchange', function () { render(fromHash(), false); });

    var lastCols = cols();
    window.addEventListener('resize', function () {
      var n = cols(); if (n !== lastCols) { lastCols = n; render(current, false); }
    });

    render(fromHash(), true);
  }

  /* =====================================================================
     PRODUCT — Riot Corset in Bone
     ===================================================================== */
  function product() {
    var garment = $('#garment'), main = $('#mainImg');
    if (hasG && !reduce && garment) {
      gsap.timeline({ delay: 0.15 })
        .fromTo(garment, { y: -30, transformOrigin: '50% 12px' }, { y: 0, duration: 0.42, ease: 'power2.in' })
        .fromTo(garment, { rotation: 2.4 }, { rotation: 0, duration: 2.6, ease: 'elastic.out(1,0.28)' }, '>-0.02');
    }

    /* pegged prints swap the main picture */
    $$('.printbtn').forEach(function (b) {
      b.addEventListener('click', function () {
        var im = $('img', b);
        var a = { src: main.getAttribute('src'), alt: main.getAttribute('alt'), pos: main.style.objectPosition };
        main.setAttribute('src', im.getAttribute('src')); main.setAttribute('alt', im.getAttribute('alt')); main.style.objectPosition = im.style.objectPosition;
        im.setAttribute('src', a.src); im.setAttribute('alt', a.alt); im.style.objectPosition = a.pos;
        b.setAttribute('aria-label', 'Show this view: ' + a.alt);
      });
    });

    /* size pegs clip onto the ticket */
    var pegs = $$('.peg'), sizeLabel = $('#sizeLabel');
    pegs.forEach(function (p) {
      p.addEventListener('click', function () {
        pegs.forEach(function (q) { q.setAttribute('aria-pressed', q === p ? 'true' : 'false'); });
        sizeLabel.textContent = 'Size ' + p.getAttribute('data-size');
      });
    });

    /* tear-off strip */
    var tear = $('#tear'), tearTxt = $('#tearTxt'), live = $('#bagLive');
    tear.addEventListener('click', function () {
      if (tear.classList.contains('is-torn')) return;
      tear.classList.add('is-torn');
      tear.setAttribute('aria-disabled', 'true');
      tearTxt.textContent = 'Torn off — in your bag';
      setBag(1);
      var size = ($('.peg[aria-pressed="true"]') || { getAttribute: function () { return ''; } }).getAttribute('data-size');
      live.textContent = 'Riot Corset in Bone' + (size ? ', size ' + size : '') + ' added. Bag has 1 item.';
    });
  }

  if (page === 'home') home();
  else if (page === 'collection') collection();
  else if (page === 'product') product();
})();
