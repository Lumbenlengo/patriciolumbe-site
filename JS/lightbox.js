/* ==================================================================
   lightbox.js — Patricio Lumbe portfolio
   Diagram viewer for every [data-lightbox] trigger.

   Controls: zoom out / zoom in through fixed steps (40% → 250%),
   live percentage readout, reset, drag to pan when the image is
   bigger than the stage, arrow keys to move between images,
   Escape to close. Mouse wheel zooms, double click toggles.
   ================================================================== */

(function () {
  'use strict';

  var STEPS = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5,
               1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.4, 2.5];
  var DEFAULT_STEP = 6; // 100%

  var lb, stage, img, thumbsWrap, titleEl, captionEl, levelEl, hintEl;
  var outBtn, inBtn, resetBtn;

  var images = [];
  var activeIndex = 0;
  var stepIndex = DEFAULT_STEP;
  var baseW = 0, baseH = 0;      // natural fit size at 100%
  var panX = 0, panY = 0;
  var dragging = false, startX = 0, startY = 0, startPanX = 0, startPanY = 0;
  var lastFocused = null;
  var hintTimer = null;

  function build() {
    if (lb) return;

    lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Diagram viewer');

    lb.innerHTML =
      '<div class="lightbox-bar">' +
        '<p class="lightbox-title"></p>' +
        '<div class="lightbox-controls">' +
          '<div class="lightbox-zoomgroup">' +
            '<button class="lightbox-btn lightbox-out" type="button" aria-label="Zoom out">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></svg>' +
            '</button>' +
            '<span class="lightbox-level" role="status" aria-live="polite">100%</span>' +
            '<button class="lightbox-btn lightbox-in" type="button" aria-label="Zoom in">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>' +
            '</button>' +
          '</div>' +
          '<button class="lightbox-reset" type="button">Reset</button>' +
          '<button class="lightbox-btn lightbox-close" type="button" aria-label="Close diagram viewer">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="lightbox-stage" data-pannable="false">' +
        '<img class="lightbox-img" alt="" draggable="false" />' +
        '<span class="lightbox-hint">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11V6.5a1.5 1.5 0 013 0V11m0-1.5a1.5 1.5 0 013 0V12m0-1a1.5 1.5 0 013 0v4a5 5 0 01-5 5h-2a5 5 0 01-4.5-2.8L6 14a1.5 1.5 0 012.6-1.5L9 13"/></svg>' +
          'Drag to move the diagram' +
        '</span>' +
      '</div>' +
      '<p class="lightbox-caption"></p>' +
      '<div class="lightbox-thumbs"></div>';

    document.body.appendChild(lb);

    stage      = lb.querySelector('.lightbox-stage');
    img        = lb.querySelector('.lightbox-img');
    thumbsWrap = lb.querySelector('.lightbox-thumbs');
    titleEl    = lb.querySelector('.lightbox-title');
    captionEl  = lb.querySelector('.lightbox-caption');
    levelEl    = lb.querySelector('.lightbox-level');
    hintEl     = lb.querySelector('.lightbox-hint');
    outBtn     = lb.querySelector('.lightbox-out');
    inBtn      = lb.querySelector('.lightbox-in');
    resetBtn   = lb.querySelector('.lightbox-reset');

    lb.querySelector('.lightbox-close').addEventListener('click', close);
    outBtn.addEventListener('click', function () { setStep(stepIndex - 1); });
    inBtn.addEventListener('click', function () { setStep(stepIndex + 1); });
    resetBtn.addEventListener('click', function () { setStep(DEFAULT_STEP); resetPan(); });

    // Click the dim area to close, but never while dragging the image
    stage.addEventListener('click', function (e) {
      if (e.target === stage && !justDragged) close();
    });
    img.addEventListener('dblclick', function () {
      setStep(stepIndex >= DEFAULT_STEP ? DEFAULT_STEP : DEFAULT_STEP + 3);
    });

    // Wheel zoom
    stage.addEventListener('wheel', function (e) {
      e.preventDefault();
      setStep(stepIndex + (e.deltaY < 0 ? 1 : -1));
    }, { passive: false });

    // Drag to pan (mouse + touch through pointer events)
    stage.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    img.addEventListener('load', fitToStage);
    window.addEventListener('resize', fitToStage);

    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') show(activeIndex + 1);
      else if (e.key === 'ArrowLeft') show(activeIndex - 1);
      else if (e.key === '+' || e.key === '=') setStep(stepIndex + 1);
      else if (e.key === '-' || e.key === '_') setStep(stepIndex - 1);
      else if (e.key === '0') { setStep(DEFAULT_STEP); resetPan(); }
    });
  }

  /* ── Sizing ─────────────────────────────────────────────── */
  // 100% = the image fully visible inside the stage. Everything
  // else scales from there, so the percentage means something.
  function fitToStage() {
    if (!img.naturalWidth) return;
    var pad = 40;
    var availW = stage.clientWidth - pad;
    var availH = stage.clientHeight - pad;
    var ratio = Math.min(availW / img.naturalWidth, availH / img.naturalHeight, 1);
    baseW = img.naturalWidth * ratio;
    baseH = img.naturalHeight * ratio;
    img.style.width = baseW + 'px';
    img.style.height = 'auto';
    apply();
  }

  function setStep(next) {
    var clamped = Math.max(0, Math.min(STEPS.length - 1, next));
    if (clamped === stepIndex) return;
    stepIndex = clamped;
    if (STEPS[stepIndex] <= 1) resetPan();
    apply();
  }

  function resetPan() { panX = 0; panY = 0; }

  function apply() {
    var scale = STEPS[stepIndex];

    // Keep the image inside sensible bounds when panning
    var overflowX = Math.max(0, (baseW * scale - stage.clientWidth) / 2);
    var overflowY = Math.max(0, (baseH * scale - stage.clientHeight) / 2);
    panX = Math.max(-overflowX, Math.min(overflowX, panX));
    panY = Math.max(-overflowY, Math.min(overflowY, panY));

    img.style.transform =
      'translate(' + panX + 'px, ' + panY + 'px) scale(' + scale + ')';

    levelEl.textContent = Math.round(scale * 100) + '%';
    outBtn.disabled = stepIndex === 0;
    inBtn.disabled = stepIndex === STEPS.length - 1;

    var pannable = overflowX > 1 || overflowY > 1;
    stage.setAttribute('data-pannable', pannable ? 'true' : 'false');
    toggleHint(pannable);
  }

  function toggleHint(pannable) {
    clearTimeout(hintTimer);
    if (!pannable) { hintEl.classList.remove('is-visible'); return; }
    hintEl.classList.add('is-visible');
    hintTimer = setTimeout(function () { hintEl.classList.remove('is-visible'); }, 2200);
  }

  /* ── Panning ────────────────────────────────────────────── */
  var justDragged = false;

  function onDown(e) {
    if (stage.getAttribute('data-pannable') !== 'true') return;
    dragging = true;
    justDragged = false;
    startX = e.clientX; startY = e.clientY;
    startPanX = panX; startPanY = panY;
    stage.setAttribute('data-panning', 'true');
  }

  function onMove(e) {
    if (!dragging) return;
    var dx = e.clientX - startX;
    var dy = e.clientY - startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) justDragged = true;
    panX = startPanX + dx;
    panY = startPanY + dy;
    apply();
  }

  function onUp() {
    if (!dragging) return;
    dragging = false;
    stage.removeAttribute('data-panning');
    setTimeout(function () { justDragged = false; }, 0);
  }

  /* ── Images ─────────────────────────────────────────────── */
  function renderThumbs() {
    thumbsWrap.innerHTML = '';
    if (images.length < 2) { thumbsWrap.style.display = 'none'; return; }
    thumbsWrap.style.display = 'flex';
    images.forEach(function (item, i) {
      var t = document.createElement('button');
      t.type = 'button';
      t.className = 'lightbox-thumb' + (i === activeIndex ? ' is-active' : '');
      t.setAttribute('aria-label', 'Show image ' + (i + 1) + ' of ' + images.length);
      t.innerHTML = '<img src="' + item.src + '" alt="" loading="lazy" />';
      t.addEventListener('click', function () { show(i); });
      thumbsWrap.appendChild(t);
    });
  }

  function show(index) {
    if (!images.length) return;
    activeIndex = (index + images.length) % images.length;
    var item = images[activeIndex];
    stepIndex = DEFAULT_STEP;
    resetPan();
    img.src = item.src;
    img.alt = item.caption || '';
    captionEl.textContent = item.caption || '';
    Array.prototype.forEach.call(
      thumbsWrap.querySelectorAll('.lightbox-thumb'),
      function (t, i) { t.classList.toggle('is-active', i === activeIndex); }
    );
  }

  function open(trigger) {
    build();
    try {
      images = JSON.parse(trigger.getAttribute('data-lightbox-images') || '[]');
    } catch (err) { images = []; }
    if (!images.length) return;

    titleEl.textContent = trigger.getAttribute('data-lightbox-title') || 'Diagram';
    lastFocused = document.activeElement;
    renderThumbs();
    show(0);

    lb.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    lb.querySelector('.lightbox-close').focus();
  }

  function close() {
    if (!lb) return;
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-lightbox]');
    if (!trigger) return;
    e.preventDefault();
    open(trigger);
  });
})();