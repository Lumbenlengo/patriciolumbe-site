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

  /* ── Custom cursor ──────────────────────────────────── */
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;

  if (hasFinePointer) {
    const cursor = document.querySelector('.cursor-dot');

    if (cursor) {
      document.documentElement.classList.add('has-custom-cursor');

      let curX = 0, curY = 0;
      let targetX = 0, targetY = 0;
      const ease = prefersReducedMotion ? 1 : 0.2;

      const render = () => {
        curX += (targetX - curX) * ease;
        curY += (targetY - curY) * ease;
        cursor.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
        requestAnimationFrame(render);
      };

      window.addEventListener('pointermove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
      }, { passive: true });

      const hoverTargets = 'a, button, .btn, .chip, .service-card, .portfolio-card, .video-thumb, input, textarea, [role="button"]';
      document.addEventListener('mouseover', (e) => {
        if (e.target.closest(hoverTargets)) cursor.classList.add('is-hover');
      });
      document.addEventListener('mouseout', (e) => {
        if (e.target.closest(hoverTargets)) cursor.classList.remove('is-hover');
      });

      document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; });
      document.addEventListener('mouseenter', () => { cursor.style.opacity = ''; });

      requestAnimationFrame(render);
    }
  }

  /* ── Contact form ─────────────────────────────────────*/
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');

  if (contactForm && formStatus) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      formStatus.textContent = 'Sending…';
      formStatus.className = 'form-status';

      try {
        const response = await fetch(contactForm.action, {
          method: 'POST',
          body: new FormData(contactForm),
          headers: { Accept: 'application/json' },
        });

        if (response.ok) {
          formStatus.textContent = 'Message sent — I\'ll reply within a day.';
          formStatus.className = 'form-status is-success';
          contactForm.reset();
        } else {
          formStatus.textContent = 'Something went wrong. Please email me directly instead.';
          formStatus.className = 'form-status is-error';
        }
      } catch (err) {
        formStatus.textContent = 'Something went wrong. Please email me directly instead.';
        formStatus.className = 'form-status is-error';
      }
    });
  }
})();