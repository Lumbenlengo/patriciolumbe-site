/* ============================================================
   patriciolumbe.com : main script
   ============================================================ */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Footer year ─────────────────────────────────────── */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ── Sticky nav state ────────────────────────────────── */
  const navbar = document.getElementById('navbar');
  const onScroll = () => {
    if (!navbar) return;
    navbar.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Mobile menu ─────────────────────────────────────── */
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');

  const closeMenu = () => {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    menu.classList.remove('is-open');
  };

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
      menu.classList.toggle('is-open', !open);
    });

    menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ── Reveal on scroll ────────────────────────────────── */
  const revealables = document.querySelectorAll('.reveal');

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealables.forEach((el) => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealables.forEach((el) => revealObserver.observe(el));
  }

  /* ── Active section highlight in nav ─────────────────── */
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          navLinks.forEach((link) =>
            link.classList.toggle('is-active', link.getAttribute('href') === '#' + id)
          );
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach((section) => spy.observe(section));
  }

  /* ── Signature: terminal + pipeline sequence ─────────── */
  const terminalCode = document.getElementById('terminal-code');
  const pipeline = document.getElementById('pipeline');

  // The deployment story the terminal tells, line by line.
  // type: 'cmd' lines are typed character by character; 'out' lines print at once.
  const SCRIPT = [
    { type: 'cmd', prompt: '$ ', cmd: 'terraform ', arg: 'plan -out=tfplan', stage: 2 },
    { type: 'out', html: '<span class="term-out">Plan: <span class="term-ok">24 to add</span>, 0 to change, 0 to destroy.</span>' },
    { type: 'cmd', prompt: '$ ', cmd: 'terraform ', arg: 'apply tfplan', stage: 3 },
    { type: 'out', html: '<span class="term-out">aws_vpc.main: Creation complete <span class="term-ok">✓</span></span>' },
    { type: 'out', html: '<span class="term-out">aws_eks_cluster.prod: Creation complete <span class="term-ok">✓</span></span>' },
    { type: 'out', html: '<span class="term-out"><span class="term-ok">Apply complete!</span> Resources: 24 added, 0 changed, 0 destroyed.</span>' },
    { type: 'cmd', prompt: '$ ', cmd: '', arg: '', stage: null, final: true }
  ];

  const setStage = (index, state) => {
    if (!pipeline) return;
    const stage = pipeline.querySelector('[data-stage="' + index + '"]');
    if (!stage) return;
    stage.classList.remove('is-running', 'is-done');
    if (state) stage.classList.add(state);
    if (state === 'is-done') {
      const line = pipeline.querySelector('[data-line="' + index + '"]');
      if (line) line.classList.add('is-done');
    }
  };

  const finishPipeline = () => {
    for (let i = 0; i < 4; i++) setStage(i, 'is-done');
    if (!pipeline) return;
    pipeline.querySelectorAll('.pipeline-line').forEach((l) => l.classList.add('is-done'));
  };

  const renderFinalTerminal = () => {
    if (!terminalCode) return;
    terminalCode.innerHTML =
      '<span class="term-prompt">$ </span><span class="term-cmd">terraform </span><span class="term-arg">plan -out=tfplan</span>\n' +
      '<span class="term-out">Plan: <span class="term-ok">24 to add</span>, 0 to change, 0 to destroy.</span>\n' +
      '<span class="term-prompt">$ </span><span class="term-cmd">terraform </span><span class="term-arg">apply tfplan</span>\n' +
      '<span class="term-out">aws_vpc.main: Creation complete <span class="term-ok">✓</span></span>\n' +
      '<span class="term-out">aws_eks_cluster.prod: Creation complete <span class="term-ok">✓</span></span>\n' +
      '<span class="term-out"><span class="term-ok">Apply complete!</span> Resources: 24 added, 0 changed, 0 destroyed.</span>\n' +
      '<span class="term-prompt">$ </span><span class="term-caret"></span>';
    finishPipeline();
  };

  if (terminalCode) {
    if (prefersReducedMotion) {
      renderFinalTerminal();
    } else {
      // Stages commit + test complete quickly on load, before terraform runs.
      setStage(0, 'is-running');
      setTimeout(() => { setStage(0, 'is-done'); setStage(1, 'is-running'); }, 500);
      setTimeout(() => { setStage(1, 'is-done'); }, 1050);

      let lineIndex = 0;

      const runLine = () => {
        if (lineIndex >= SCRIPT.length) return;
        const line = SCRIPT[lineIndex];

        if (line.type === 'out') {
          terminalCode.innerHTML += line.html + '\n';
          lineIndex++;
          setTimeout(runLine, 320);
          return;
        }

        if (line.stage !== null && line.stage !== undefined) setStage(line.stage, 'is-running');

        const promptSpan = '<span class="term-prompt">' + line.prompt + '</span>';
        const full = line.cmd + line.arg;

        if (line.final) {
          terminalCode.innerHTML += promptSpan + '<span class="term-caret"></span>';
          finishPipeline();
          return;
        }

        let typed = 0;
        const holder = document.createElement('span');
        terminalCode.insertAdjacentHTML('beforeend', promptSpan);
        terminalCode.appendChild(holder);

        const typer = setInterval(() => {
          typed++;
          const cmdPart = full.slice(0, Math.min(typed, line.cmd.length));
          const argPart = typed > line.cmd.length ? full.slice(line.cmd.length, typed) : '';
          holder.innerHTML =
            '<span class="term-cmd">' + cmdPart + '</span>' +
            '<span class="term-arg">' + argPart + '</span>';

          if (typed >= full.length) {
            clearInterval(typer);
            terminalCode.innerHTML += '\n';
            if (line.stage === 2) setTimeout(() => setStage(2, 'is-done'), 420);
            lineIndex++;
            setTimeout(runLine, 380);
          }
        }, 42);
      };

      setTimeout(runLine, 1150);
    }
  }

  /* ── Spotlight hover effect on cards (fine pointers only) ── */
  if (window.matchMedia('(pointer: fine)').matches && !prefersReducedMotion) {
    const spotlightTargets = document.querySelectorAll(
      '.service-card, .portfolio-card:not(.portfolio-card-placeholder), .cert-card, .social-link, .stack-panel, .contact-form-wrap'
    );
    spotlightTargets.forEach((el) => {
      el.classList.add('spotlight');
      el.addEventListener('pointermove', (e) => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
        el.style.setProperty('--my', (e.clientY - rect.top) + 'px');
      }, { passive: true });
    });
  }


  /* ── Scroll progress bar ─────────────────────────────── */
  const progressBar = document.getElementById('scroll-progress');
  if (progressBar) {
    let ticking = false;
    const updateProgress = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      progressBar.style.transform = 'scaleX(' + ratio + ')';
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(updateProgress); }
    }, { passive: true });
    updateProgress();
  }

  /* ── Staggered reveals: children of grids cascade in ─── */
  const staggerGroups = document.querySelectorAll(
    '.services-grid, .cert-grid, .videos-grid, .social-grid, .portfolio-grid'
  );
  staggerGroups.forEach((group) => {
    Array.from(group.children).forEach((child, i) => {
      if (child.classList.contains('reveal')) {
        child.style.setProperty('--rd', (i * 80) + 'ms');
      }
    });
  });

  /* ── 3D tilt on cards (fine pointers only) ───────────── */
  if (window.matchMedia('(pointer: fine)').matches && !prefersReducedMotion) {
    document.querySelectorAll('.service-card, .cert-card, .video-card, .portfolio-card:not(.portfolio-card-placeholder)').forEach((el) => {
      el.classList.add('tilt');
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ry', (px * 5) + 'deg');
        el.style.setProperty('--rx', (py * -5) + 'deg');
      }, { passive: true });
      el.addEventListener('pointerleave', () => {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ── Metrics count up on load ────────────────────────── */
  const animateValue = (el, target, suffix, duration) => {
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (!prefersReducedMotion) {
    document.querySelectorAll('.metric-value').forEach((el) => {
      const match = el.textContent.trim().match(/^(\d+)(.*)$/);
      if (!match) return;
      const target = parseInt(match[1], 10);
      const suffix = match[2];
      el.textContent = '0' + suffix;
      setTimeout(() => animateValue(el, target, suffix, 1300), 950);
    });
  }

  /* ── Video walkthrough filters ───────────────────────── */
  const filterButtons = document.querySelectorAll('.filter-btn');
  if (filterButtons.length) {
    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        filterButtons.forEach((b) => b.classList.remove('filter-btn-active'));
        btn.classList.add('filter-btn-active');
        document.querySelectorAll('.video-card').forEach((card) => {
          const show = filter === 'all' || card.getAttribute('data-category') === filter;
          card.style.display = show ? 'flex' : 'none';
          if (show) requestAnimationFrame(() => card.classList.add('is-visible'));
        });
      });
    });
  }

  /* ── Caption position: nudge captions down slightly ──────
     CSS (video::cue) only styles the text — color, font, size —
     it cannot move the caption box within the frame. That is
     controlled by the WebVTT cue's own "line" position, which
     only JavaScript can set. Every cue gets line = 92 (92% down
     the frame, snapToLines off) so captions sit a little lower
     without running past the bottom edge. */
  function lowerCaptionPosition(cue) {
    try {
      cue.snapToLines = false;
      cue.line = 92;
      cue.lineAlign = 'end';
    } catch (err) { /* older browsers: silently keep default position */ }
  }

  document.querySelectorAll('video track[kind="captions"]').forEach((trackEl) => {
    const apply = () => {
      const tt = trackEl.track;
      if (!tt || !tt.cues) return;
      Array.prototype.forEach.call(tt.cues, lowerCaptionPosition);
    };
    trackEl.addEventListener('load', apply);
    // Some browsers have already parsed the track by the time this runs
    if (trackEl.track && trackEl.track.cues && trackEl.track.cues.length) apply();
  });

  /* ── Contact form: Send opens the visitor's email app ── */
  /* The message is addressed to contact@patriciolumbe.com with a copy to the Gmail inbox. */
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');

  const CONTACT_TO = 'contact@patriciolumbe.com';
  const CONTACT_CC = 'patricioaleixo0@gmail.com';

  if (contactForm && formStatus) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Honeypot: if a bot filled the hidden field, do nothing.
      const honeypot = contactForm.querySelector('.form-honeypot');
      if (honeypot && honeypot.value) return;

      const first = (document.getElementById('cf-first') || {}).value || '';
      const last = (document.getElementById('cf-last') || {}).value || '';
      const company = (document.getElementById('cf-company') || {}).value || '';
      const contact = (document.getElementById('cf-contact') || {}).value || '';
      const question = (document.getElementById('cf-question') || {}).value || '';

      const subject = 'Cloud project enquiry from ' + (first + ' ' + last).trim();
      const bodyLines = [
        'Name: ' + (first + ' ' + last).trim(),
        'Company: ' + (company || 'Not provided'),
        'Contact: ' + contact,
        '',
        question
      ];

      const mailto =
        'mailto:' + CONTACT_TO +
        '?cc=' + encodeURIComponent(CONTACT_CC) +
        '&subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(bodyLines.join('\n'));

      formStatus.textContent = 'Opening your email app…';
      formStatus.className = 'form-status is-success';

      window.location.href = mailto;
    });
  }
})();