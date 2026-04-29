/* ============================================================
   patriciolumbe.com — Main JavaScript
   ============================================================ */

console.log('Welcome to Patricio\'s Infrastructure Lab 🚀');

/* ── CUSTOM WHITE HAND CURSOR ── */
const cursor = document.getElementById('cursor');

document.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top  = e.clientY + 'px';
});

// Cursor interaction logic
document.querySelectorAll('a, button, .social-link').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.classList.add('hovering');
    // Keeping it white as requested
    cursor.querySelectorAll('path').forEach(p => p.setAttribute('stroke', 'white'));
  });

  el.addEventListener('mouseleave', () => {
    cursor.classList.remove('hovering');
    cursor.querySelectorAll('path').forEach(p => p.setAttribute('stroke', 'white'));
  });
});

/* ── STICKY NAV ── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.style.background = 'rgba(255, 255, 255, 0.95)';
    navbar.style.backdropFilter = 'blur(10px)';
    navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
  } else {
    navbar.style.background = 'transparent';
    navbar.style.boxShadow = 'none';
  }
});

/* ── TERMINAL TYPING EFFECT ── */
const termCmd  = document.getElementById('t-cmd');
const termArg  = document.getElementById('t-arg');
const p1       = 'terraform apply ';
const p2       = '--target=aws_production.live';
let charIdx    = 0;

if(termCmd && termArg) {
    const typingInterval = setInterval(() => {
      if (charIdx < p1.length) {
        termCmd.textContent += p1[charIdx];
      } else {
        termArg.textContent += p2[charIdx - p1.length];
      }
      charIdx++;
      if (charIdx >= p1.length + p2.length) {
        clearInterval(typingInterval);
      }
    }, 60);
}