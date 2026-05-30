/* =========================================================
   Alkan Zilgir — Portfolio
   Vanilla JS. No build step. Lenis loaded from CDN.
   ========================================================= */

(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
              || /[?&]static\b/.test(window.location.search);
  const isFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Static-screenshot helper ---------- */
  if (/[?&]static\b/.test(window.location.search)) {
    body.classList.add('is-static-shot');
  }
  const yMatch = window.location.search.match(/[?&]y=(\d+)/);
  if (yMatch) {
    const targetY = parseInt(yMatch[1], 10);
    const prev = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, targetY);
    requestAnimationFrame(() => { window.scrollTo(0, targetY); root.style.scrollBehavior = prev; });
  }

  /* ---------- Mark JS ready so reveal hides cleanly ---------- */
  // Add `.js-ready` only after the first paint so the very first frame is visible.
  // This way reveal items never ship blank if the IntersectionObserver never fires.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => root.classList.add('js-ready'));
  });

  /* =====================================================
     LENIS — smooth scroll (gracefully degrades if blocked)
     ===================================================== */
  let lenis = null;
  if (!reduce) {
    const lenisScript = document.createElement('script');
    lenisScript.src = 'https://cdn.jsdelivr.net/npm/lenis@1.1.20/dist/lenis.min.js';
    lenisScript.async = true;
    lenisScript.onload = () => {
      try {
        lenis = new window.Lenis({
          duration: 1.15,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          smoothTouch: false,
          lerp: 0.1,
        });
        const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);

        // Hook anchor clicks into Lenis so smooth scroll works on hash links
        document.querySelectorAll('a[href^="#"]').forEach((a) => {
          a.addEventListener('click', (e) => {
            const id = a.getAttribute('href');
            if (!id || id.length < 2) return;
            const target = document.querySelector(id);
            if (!target) return;
            e.preventDefault();
            lenis.scrollTo(target, { offset: -10, duration: 1.4 });
            // Close mobile menu if open
            document.getElementById('nav')?.classList.remove('menu-open');
            document.getElementById('navToggle')?.setAttribute('aria-expanded', 'false');
          });
        });
      } catch (_) { /* graceful fallback to native scroll */ }
    };
    document.head.appendChild(lenisScript);
  }

  /* =====================================================
     MAGNETIC ELEMENTS
     ===================================================== */
  if (isFine && !reduce) {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      const strength = parseFloat(el.dataset.magneticStrength || '0.35');
      const radius = parseFloat(el.dataset.magneticRadius || '110');
      let rect = null;

      const refresh = () => { rect = el.getBoundingClientRect(); };
      refresh();
      window.addEventListener('resize', refresh, { passive: true });
      window.addEventListener('scroll', () => { rect = null; }, { passive: true });

      el.addEventListener('pointermove', (e) => {
        if (!rect) refresh();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy);
        if (dist > radius) {
          el.style.transform = '';
          return;
        }
        const pull = (1 - dist / radius);
        el.style.transform = `translate(${dx * strength * pull}px, ${dy * strength * pull}px)`;
      });

      el.addEventListener('pointerleave', () => {
        el.style.transition = 'transform 540ms cubic-bezier(0.16, 1, 0.3, 1)';
        el.style.transform = '';
        setTimeout(() => { el.style.transition = ''; }, 560);
      });
      el.addEventListener('pointerdown', () => {
        el.style.transition = '';
      });
    });
  }

  /* =====================================================
     REVEAL ON SCROLL
     ---------------------------------------------------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    if ('IntersectionObserver' in window && !reduce) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
      revealEls.forEach((el) => io.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add('is-in'));
    }
  }

  /* =====================================================
     HERO — split-word entrance on load
     ---------------------------------------------------- */
  const heroTitle = document.querySelector('[data-split]');
  if (heroTitle && !reduce) {
    // Wrap each word in a span with overflow:hidden and slide-up children
    const splitNode = (node) => {
      if (node.nodeType === 3) {
        const text = node.textContent;
        const frag = document.createDocumentFragment();
        const parts = text.split(/(\s+)/);
        parts.forEach((p) => {
          if (/^\s+$/.test(p)) {
            frag.appendChild(document.createTextNode(p));
          } else if (p.length) {
            const w = document.createElement('span');
            w.className = 'split-word';
            const inner = document.createElement('span');
            inner.className = 'split-char';
            inner.textContent = p;
            inner.style.transform = 'translateY(110%)';
            inner.style.display = 'inline-block';
            w.appendChild(inner);
            frag.appendChild(w);
          }
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1 && node.tagName !== 'BR') {
        Array.from(node.childNodes).forEach(splitNode);
      }
    };
    Array.from(heroTitle.childNodes).forEach(splitNode);

    const chars = heroTitle.querySelectorAll('.split-char');
    chars.forEach((c, i) => {
      c.style.transition = `transform 900ms cubic-bezier(0.19, 1, 0.22, 1) ${80 + i * 70}ms`;
    });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        chars.forEach((c) => { c.style.transform = 'translateY(0)'; });
      });
    });
  }

  /* =====================================================
     NAV — scroll state + scroll spy
     ---------------------------------------------------- */
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = ['work', 'about', 'skills', 'timeline'].map((id) => document.getElementById(id)).filter(Boolean);

  const updateNavScroll = () => {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  updateNavScroll();
  window.addEventListener('scroll', updateNavScroll, { passive: true });

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('menu-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  if (sections.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === '#' + id));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach((s) => spy.observe(s));
  }

  /* =====================================================
     BACK TO TOP
     ---------------------------------------------------- */
  const btt = document.getElementById('backToTop');
  if (btt) {
    const updateBtt = () => btt.classList.toggle('is-visible', window.scrollY > 600);
    window.addEventListener('scroll', updateBtt, { passive: true });
    updateBtt();
  }

  /* =====================================================
     CONTACT FORM
     ---------------------------------------------------- */
  const form = document.getElementById('contact-form');
  if (form) {
    const validateField = (field) => {
      const input = field.querySelector('input, select, textarea');
      if (!input) return true;
      const valid = input.checkValidity();
      field.classList.toggle('has-error', !valid);
      return valid;
    };

    form.querySelectorAll('.field').forEach((field) => {
      const input = field.querySelector('input, select, textarea');
      if (!input) return;
      input.addEventListener('blur', () => {
        if (input.value || input.required) validateField(field);
      });
      input.addEventListener('input', () => {
        if (field.classList.contains('has-error')) validateField(field);
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('.field').forEach((f) => { if (!validateField(f)) valid = false; });
      const consent = document.getElementById('fConsent');
      if (consent && !consent.checked) {
        consent.closest('.checkbox')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        valid = false;
      }
      if (!valid) return;

      const btn = form.querySelector('.btn-send');
      const label = btn?.querySelector('.btn-send-label');
      const arrow = btn?.querySelector('.arrow');
      const original = label?.textContent;
      if (btn) {
        btn.disabled = true;
        if (label) label.textContent = 'Sending';
        if (arrow) arrow.textContent = '…';
      }

      try {
        const res = await fetch('https://formspree.io/f/xaqkvjpo', {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
          if (label) label.textContent = 'Message sent';
          if (arrow) arrow.textContent = '✓';
          form.reset();
          setTimeout(() => {
            if (btn) {
              btn.disabled = false;
              if (label) label.textContent = original || 'Send message';
              if (arrow) arrow.textContent = '→';
            }
          }, 3200);
        } else {
          throw new Error('send failed');
        }
      } catch (_) {
        if (label) label.textContent = 'Try again';
        if (arrow) arrow.textContent = '✕';
        if (btn) btn.disabled = false;
      }
    });
  }

})();
