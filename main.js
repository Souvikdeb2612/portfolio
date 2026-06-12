/* ─────────────────────────────────────────────
   Souvik Deb — Portfolio
   main.js
───────────────────────────────────────────── */

gsap.registerPlugin(ScrollTrigger);

/* ── Shared state ── */
const mouse = { x: -1000, y: -1000, nx: -1000, ny: -1000 };
const isTouch = window.matchMedia('(hover: none)').matches;

/* ══════════════════════════════════════════
   0. LENIS — smooth scroll (gracefully optional)
══════════════════════════════════════════ */
let lenis = null;
try {
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.2,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
} catch (e) {
  lenis = null;
}

/* Scroll-dependent UI: progress bar + nav state + scroll spy */
(function initScrollUI() {
  const bar      = document.getElementById('scrollProgress');
  const nav      = document.getElementById('nav');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
  const SPY_OFFSET = 100;

  function onScroll(scroll) {
    const limit = document.documentElement.scrollHeight - window.innerHeight;
    const progress = limit > 0 ? scroll / limit : 0;
    if (bar) bar.style.width = (progress * 100) + '%';
    if (nav) nav.classList.toggle('scrolled', scroll > 60);
    let current = '';
    sections.forEach(sec => {
      if (scroll >= sec.offsetTop - SPY_OFFSET) current = sec.id;
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
  }

  if (lenis) {
    lenis.on('scroll', ({ scroll }) => onScroll(scroll));
  } else {
    window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });
  }
})();

/* ══════════════════════════════════════════
   1. LOADER
══════════════════════════════════════════ */
(function runLoader() {
  const loader = document.getElementById('loader');
  const bar    = document.getElementById('loaderBar');
  if (!loader || !bar) { revealHero(); return; }

  let progress = 0;

  const tick = setInterval(() => {
    progress += Math.random() * 18 + 4;
    if (progress >= 100) {
      progress = 100;
      clearInterval(tick);
      bar.style.width = '100%';

      setTimeout(() => {
        gsap.to(loader, {
          yPercent: -100,
          duration: 0.8,
          ease: 'power3.inOut',
          onComplete: () => {
            loader.style.display = 'none';
            revealHero();
          }
        });
      }, 300);
    }
    bar.style.width = progress + '%';
  }, 60);
})();

/* ══════════════════════════════════════════
   2. THREE.JS — Particle Network (warm dark)
══════════════════════════════════════════ */
(function initParticles() {
  const canvas  = document.getElementById('heroCanvas');
  const section = document.querySelector('.hero');
  if (!canvas || !section || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  let camera;

  function buildCamera(w, h) {
    camera = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, -500, 500);
  }

  function resize() {
    const w = section.clientWidth;
    const h = section.clientHeight;
    renderer.setSize(w, h);
    buildCamera(w, h);
  }
  resize();

  const isMobile = window.innerWidth < 768;
  const COUNT    = isMobile ? 40 : 90;
  const MAX_DIST = 180;
  const particles = [];

  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x:  (Math.random() - 0.5) * section.clientWidth,
      y:  (Math.random() - 0.5) * section.clientHeight,
      z:  (Math.random() - 0.5) * 80,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
    });
  }

  /* Dots */
  const dotGeo = new THREE.BufferGeometry();
  const dotPos = new Float32Array(COUNT * 3);
  dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPos, 3));
  const dotMat = new THREE.PointsMaterial({ color: 0x3A3530, size: 2.5, sizeAttenuation: false });
  scene.add(new THREE.Points(dotGeo, dotMat));

  /* Lines */
  const maxLines = COUNT * COUNT;
  const lineGeo  = new THREE.BufferGeometry();
  const linePos  = new Float32Array(maxLines * 6);
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
  lineGeo.setDrawRange(0, 0);
  const lineMat = new THREE.LineBasicMaterial({ color: 0x2E2B27, transparent: true, opacity: 0.35 });
  scene.add(new THREE.LineSegments(lineGeo, lineMat));

  function animate() {
    requestAnimationFrame(animate);

    const hw = section.clientWidth  / 2;
    const hh = section.clientHeight / 2;

    for (let i = 0; i < COUNT; i++) {
      const p = particles[i];

      /* Repel from mouse */
      const dx = p.x - mouse.nx;
      const dy = p.y - mouse.ny;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 160 && dist > 0) {
        const f = ((160 - dist) / 160) * 0.7;
        p.vx += (dx / dist) * f;
        p.vy += (dy / dist) * f;
      }

      p.vx *= 0.975;
      p.vy *= 0.975;
      p.x  += p.vx;
      p.y  += p.vy;

      if (p.x >  hw) p.x = -hw;
      if (p.x < -hw) p.x =  hw;
      if (p.y >  hh) p.y = -hh;
      if (p.y < -hh) p.y =  hh;

      dotPos[i * 3]     = p.x;
      dotPos[i * 3 + 1] = p.y;
      dotPos[i * 3 + 2] = p.z;
    }
    dotGeo.attributes.position.needsUpdate = true;

    let li = 0;
    for (let i = 0; i < COUNT; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < MAX_DIST) {
          linePos[li++] = particles[i].x; linePos[li++] = particles[i].y; linePos[li++] = particles[i].z;
          linePos[li++] = particles[j].x; linePos[li++] = particles[j].y; linePos[li++] = particles[j].z;
        }
      }
    }
    lineGeo.attributes.position.needsUpdate = true;
    lineGeo.setDrawRange(0, li / 3);

    renderer.render(scene, camera);
  }

  animate();
  window.addEventListener('resize', resize);
})();

/* ══════════════════════════════════════════
   3. CUSTOM CURSOR — single element
══════════════════════════════════════════ */
(function initCursor() {
  const cursor = document.getElementById('cursor');
  if (!cursor || isTouch) {
    if (cursor) cursor.style.display = 'none';
    return;
  }

  document.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    /* Three.js world coords for particle repulsion */
    const hero = document.querySelector('.hero');
    if (hero) {
      const rect = hero.getBoundingClientRect();
      mouse.nx =   e.clientX - rect.left - rect.width  / 2;
      mouse.ny = -(e.clientY - rect.top  - rect.height / 2);
    }

    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
  });

  const hovers = 'a, button, .btn-fill, .btn-ghost, .skill, .project-card, .social-icon, .magnetic, .nav-logo, .footer-top, .contact-email-big, .hero-badge-ring';
  document.querySelectorAll(hovers).forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hovered'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hovered'));
  });

  document.addEventListener('mousedown', () => cursor.classList.add('clicked'));
  document.addEventListener('mouseup',   () => cursor.classList.remove('clicked'));
})();

/* ══════════════════════════════════════════
   4. HERO REVEAL (runs after loader)
══════════════════════════════════════════ */
function revealHero() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.to('.char', {
    y: 0,
    opacity: 1,
    duration: 0.9,
    stagger: 0.035,
  })
  .to('#heroEyebrow', { opacity: 1, y: 0, duration: 0.6 }, '-=0.5')
  .fromTo('#heroEyebrow > *',
    { opacity: 0, y: 8 },
    { opacity: 1, y: 0, duration: 0.5, stagger: 0.07 }, '<+0.05')
  .to('#heroBadge',     { opacity: 1, y: 0, duration: 0.6 }, '-=0.4')
  .to('#heroMeta',      { opacity: 1, y: 0, duration: 0.5 }, '-=0.4')
  .to('#heroDesc',      { opacity: 1, y: 0, duration: 0.6 }, '-=0.4')
  .to('#heroActions',   { opacity: 1, y: 0, duration: 0.6 }, '-=0.4')
  .to('#heroBadgeRing', { opacity: 1, duration: 1.0 },       '-=0.2')
  .to('#heroScroll',    { opacity: 1, duration: 0.6 },       '-=0.5');
}

/* ══════════════════════════════════════════
   5. SCROLL REVEALS
══════════════════════════════════════════ */
(function initScrollReveals() {
  document.querySelectorAll('.reveal-up:not(.project-card)').forEach(el => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        gsap.to(el, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
      },
    });
  });
})();

/* ══════════════════════════════════════════
   6. PROJECT CARDS — staggered reveal on reel
══════════════════════════════════════════ */
(function initProjectReveals() {
  const reel = document.getElementById('projectsReel') || document.querySelector('.projects-reel');
  if (!reel) return;

  const cards = reel.querySelectorAll('.project-card');
  if (!cards.length) return;

  gsap.set(cards, { opacity: 0, y: 40 });

  ScrollTrigger.create({
    trigger: reel,
    start: 'top 80%',
    once: true,
    onEnter: () => {
      gsap.to(cards, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.09,
        ease: 'power3.out',
      });
    },
  });
})();

/* ══════════════════════════════════════════
   7. HORIZONTAL REEL — drag with momentum
══════════════════════════════════════════ */
(function initProjectReel() {
  const reel = document.getElementById('projectsReel');
  if (!reel) return;

  let isDown = false, startX = 0, scrollLeft = 0, velX = 0, lastX = 0, rafId;

  reel.addEventListener('mousedown', e => {
    isDown = true;
    reel.classList.add('is-dragging');
    startX = e.pageX - reel.offsetLeft;
    scrollLeft = reel.scrollLeft;
    lastX = e.pageX;
    cancelAnimationFrame(rafId);
  });

  window.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    reel.classList.remove('is-dragging');
    momentum();
  });

  reel.addEventListener('mouseleave', () => {
    if (!isDown) return;
    isDown = false;
    reel.classList.remove('is-dragging');
    momentum();
  });

  reel.addEventListener('mousemove', e => {
    if (!isDown) return;
    e.preventDefault();
    velX = e.pageX - lastX;
    lastX = e.pageX;
    reel.scrollLeft = scrollLeft - (e.pageX - startX) * 1.5;
  });

  /* Prevent link drag-clicks after a real drag */
  let dragged = false;
  reel.addEventListener('mousedown', () => { dragged = false; });
  reel.addEventListener('mousemove', e => { if (isDown && Math.abs(e.pageX - startX - (scrollLeft - reel.scrollLeft) / 1.5) > 0) dragged = true; });
  reel.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', e => { if (dragged) e.preventDefault(); });
    a.setAttribute('draggable', 'false');
  });
  reel.querySelectorAll('img').forEach(img => img.setAttribute('draggable', 'false'));

  function momentum() {
    velX *= 0.9;
    reel.scrollLeft -= velX;
    if (Math.abs(velX) > 0.5) rafId = requestAnimationFrame(momentum);
  }
})();

/* ══════════════════════════════════════════
   8. PROJECT CARD 3D TILT
══════════════════════════════════════════ */
(function initTilt() {
  if (isTouch) return;

  document.querySelectorAll('[data-tilt]').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      gsap.to(card, {
        rotationX: -y * 7,
        rotationY:  x * 7,
        scale: 1.015,
        duration: 0.4,
        ease: 'power2.out',
        transformPerspective: 1200,
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotationX: 0,
        rotationY: 0,
        scale: 1,
        duration: 0.6,
        ease: 'elastic.out(1, 0.6)',
        transformPerspective: 1200,
      });
    });
  });
})();

/* ══════════════════════════════════════════
   9. MAGNETIC ELEMENTS
══════════════════════════════════════════ */
(function initMagnetic() {
  if (isTouch) return;

  document.querySelectorAll('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      gsap.to(el, {
        x: (e.clientX - cx) * 0.28,
        y: (e.clientY - cy) * 0.28,
        duration: 0.35,
        ease: 'power2.out',
      });
    });

    el.addEventListener('mouseleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.5)' });
    });
  });
})();

/* ══════════════════════════════════════════
   10. MOBILE MENU
══════════════════════════════════════════ */
(function initMobileMenu() {
  const btn  = document.getElementById('menuBtn');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;

  function toggle() {
    const open = menu.classList.toggle('open');
    btn.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    menu.setAttribute('aria-hidden', !open);
    if (lenis) { if (open) lenis.stop(); else lenis.start(); }
    document.body.style.overflow = open ? 'hidden' : '';
  }

  btn.addEventListener('click', toggle);

  menu.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      if (menu.classList.contains('open')) toggle();
    });
  });
})();

/* ══════════════════════════════════════════
   11. SMOOTH ANCHOR SCROLL — via Lenis
══════════════════════════════════════════ */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(target, { offset: -64, duration: 1.4 });
      } else {
        const top = target.getBoundingClientRect().top + window.scrollY - 64;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
})();

/* ══════════════════════════════════════════
   12. SCRAMBLE TEXT — contact email
══════════════════════════════════════════ */
(function initScramble() {
  const el = document.querySelector('.contact-email-big');
  if (!el) return;
  const textEl = el.querySelector('.email-text');
  if (!textEl) return;

  const final = textEl.textContent;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@._-';
  let interval = null;

  el.addEventListener('mouseenter', () => {
    clearInterval(interval);
    let frame = 0;
    interval = setInterval(() => {
      textEl.textContent = final.split('').map((ch, i) => {
        if (i < Math.floor(frame)) return ch;
        if (ch === '@' || ch === '.' || ch === ' ') return ch;
        return chars[Math.floor(Math.random() * chars.length)];
      }).join('');
      frame += 0.7;
      if (frame >= final.length) {
        clearInterval(interval);
        textEl.textContent = final;
      }
    }, 28);
  });

  el.addEventListener('mouseleave', () => {
    clearInterval(interval);
    textEl.textContent = final;
  });
})();

/* ══════════════════════════════════════════
   13. STAT COUNTERS
══════════════════════════════════════════ */
(function initCounters() {
  const stats = [
    { selector: '.stat-item:nth-child(1) .stat-num', target: 5,  suffix: '+' },
    { selector: '.stat-item:nth-child(2) .stat-num', target: 10, suffix: '+' },
    { selector: '.stat-item:nth-child(3) .stat-num', target: 6,  suffix: ''  },
  ];

  if (!document.querySelector('.stats-row')) return;

  ScrollTrigger.create({
    trigger: '.stats-row',
    start: 'top 85%',
    once: true,
    onEnter: () => {
      stats.forEach(({ selector, target, suffix }) => {
        const el = document.querySelector(selector);
        if (!el) return;
        let current = 0;
        const step = target / 30;
        const id = setInterval(() => {
          current = Math.min(current + step, target);
          el.textContent = Math.floor(current) + suffix;
          if (current >= target) clearInterval(id);
        }, 40);
      });
    },
  });
})();

/* ══════════════════════════════════════════
   14. SKILLS — stagger on scroll
══════════════════════════════════════════ */
(function initSkills() {
  const skills = document.querySelectorAll('.skill');
  if (!skills.length || !document.querySelector('.skills-block')) return;

  gsap.set(skills, { opacity: 0, y: 10 });

  ScrollTrigger.create({
    trigger: '.skills-block',
    start: 'top 85%',
    once: true,
    onEnter: () => {
      gsap.to(skills, { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: 'back.out(2)' });
    },
  });
})();
