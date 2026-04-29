/* ============================================================
   patriciolumbe.com — Main JavaScript
   Author: Patricio Lumbe
   Description: Interactivity for Cloud & DevOps portfolio
   ============================================================ */

console.log('%c Welcome to Patricio\'s Infrastructure Lab 🚀', 'color:#2563eb;font-weight:bold;font-size:14px;');

/*  CUSTOM HAND CURSOR 
   Replaces the default OS cursor with an SVG hand on desktop.
   Changes colour to purple when hovering over interactive elements.
   Hidden on mobile via CSS (max-width: 900px).
   */
const cursor = document.getElementById('cursor');

document.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top  = e.clientY + 'px';
});

document.querySelectorAll('a, button').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.classList.add('hovering');
    cursor.querySelectorAll('path').forEach(p => p.setAttribute('stroke', '#7c3aed'));
  });

  el.addEventListener('mouseleave', () => {
    cursor.classList.remove('hovering');
    cursor.querySelectorAll('path').forEach(p => p.setAttribute('stroke', '#2563eb'));
  });
});


/* SCROLL REVEAL ANIMATIONS 
   Uses IntersectionObserver to trigger CSS transitions when
   elements enter the viewport. Three animation directions:
     .fade-up      → slides up from below
     .reveal-left  → slides in from the left
     .reveal-right → slides in from the right
   Once visible, the 'visible' class is added and stays.
    */
const scrollObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-up, .reveal-left, .reveal-right').forEach(el => {
  scrollObserver.observe(el);
});


/* STAGGERED SERVICE CARDS 
   Each service card gets a slightly longer transition delay
   than the previous one, creating a cascade reveal effect.
   */
document.querySelectorAll('.service-card').forEach((card, index) => {
  card.style.transitionDelay = (index * 0.08) + 's';
});


/*  STICKY NAV ON SCROLL 
   Adds a frosted-glass background + border shadow to the nav
   after the user scrolls past 60px from the top.
    */
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    navbar.style.background     = 'rgba(244, 246, 249, 0.97)';
    navbar.style.boxShadow      = '0 1px 0 #dce4ef';
    navbar.style.backdropFilter = 'blur(12px)';
  } else {
    navbar.style.background     = '';
    navbar.style.boxShadow      = '';
    navbar.style.backdropFilter = '';
  }
});


/* TERMINAL TYPING EFFECT 
   Simulates a real terminal by typing the terraform command
   character by character. After completion, a blinking block
   cursor (▊) is appended to indicate the shell is ready.

   p1 = the command name and flag
   p2 = the argument (different colour via .arg CSS class)
   */
const termCmd  = document.getElementById('t-cmd');
const termArg  = document.getElementById('t-arg');
const p1       = 'terraform apply ';
const p2       = '--target=aws_eks_cluster.prod';
let   charIdx  = 0;

const typingInterval = setInterval(() => {
  if (charIdx < p1.length) {
    termCmd.textContent += p1[charIdx];
  } else {
    termArg.textContent += p2[charIdx - p1.length];
  }

  charIdx++;

  if (charIdx >= p1.length + p2.length) {
    clearInterval(typingInterval);

    // Blinking block cursor after typing is done
    let blink = true;
    setInterval(() => {
      termArg.textContent = blink ? p2 + ' \u258a' : p2;
      blink = !blink;
    }, 600);
  }
}, 55);
