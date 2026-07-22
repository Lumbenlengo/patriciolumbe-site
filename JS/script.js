// patriciolumbe.com


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
    navbar.classList.remove('is-menu-open');
  };

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
      menu.classList.toggle('is-open', !open);
      navbar.classList.toggle('is-menu-open', !open);
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

  /* ── Terminal typing effect (signature element) ──────── */
  const cmdEl = document.getElementById('t-cmd');
  const argEl = document.getElementById('t-arg');
  const outEl = document.getElementById('t-out');
  const caret = document.getElementById('t-caret');

  const CMD = 'terraform apply ';
  const ARG = '--target=aws_production.live';
  const OUTPUT = 'Apply complete: <b>24 added, 0 changed, 0 destroyed.</b>';

  const showFinalState = () => {
    if (!cmdEl || !argEl || !outEl) return;
    cmdEl.textContent = CMD;
    argEl.textContent = ARG;
    outEl.innerHTML = OUTPUT;
    if (caret) caret.remove();
  };

  if (cmdEl && argEl && outEl) {
    if (prefersReducedMotion) {
      showFinalState();
    } else {
      let i = 0;
      const full = CMD + ARG;

      const typer = setInterval(() => {
        if (i < CMD.length) {
          cmdEl.textContent += full[i];
        } else {
          argEl.textContent += full[i];
        }
        i++;

        if (i >= full.length) {
          clearInterval(typer);
          setTimeout(() => {
            outEl.innerHTML = OUTPUT;
            if (caret) caret.remove();
          }, 550);
        }
      }, 55);
    }
  }

  
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;

  if (hasFinePointer) {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');

    if (dot && ring) {
      document.documentElement.classList.add('has-custom-cursor');

      let ringX = 0, ringY = 0;
      let targetX = 0, targetY = 0;

      // Ring trails the dot with easing — the "walking" feel.
      // Reduced motion: snap instantly instead of trailing.
      const ease = prefersReducedMotion ? 1 : 0.18;

      const render = () => {
        ringX += (targetX - ringX) * ease;
        ringY += (targetY - ringY) * ease;

        dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
        ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;

        requestAnimationFrame(render);
      };

      window.addEventListener('pointermove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
      }, { passive: true });

      // Grow the ring over anything clickable.
      const hoverTargets = 'a, button, .btn, .chip, .service-card, .portfolio-card, .video-thumb, input, textarea, [role="button"]';
      document.addEventListener('mouseover', (e) => {
        if (e.target.closest(hoverTargets)) ring.classList.add('is-hover');
      });
      document.addEventListener('mouseout', (e) => {
        if (e.target.closest(hoverTargets)) ring.classList.remove('is-hover');
      });

      // Hide when the pointer leaves the window entirely.
      document.addEventListener('mouseleave', () => {
        dot.style.opacity = '0';
        ring.style.opacity = '0';
      });
      document.addEventListener('mouseenter', () => {
        dot.style.opacity = '';
        ring.style.opacity = '';
      });

      requestAnimationFrame(render);
    }
  }
})();