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

  /* =====================================================
     THEME TOGGLE (light / dark)
     Initial theme is set by the inline <head> script to avoid FOUC.
     ---------------------------------------------------- */
  const themeBtn = document.getElementById('themeToggle');
  const syncThemeBtn = () => {
    if (!themeBtn) return;
    const dark = root.getAttribute('data-theme') === 'dark';
    themeBtn.setAttribute('aria-pressed', String(dark));
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    const icon = themeBtn.querySelector('i');
    if (icon) icon.className = dark ? 'bi bi-sun' : 'bi bi-moon-stars';
  };
  syncThemeBtn();
  // Enable colour transitions only after first paint so the initial load doesn't animate.
  requestAnimationFrame(() => root.classList.add('theme-ready'));
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      syncThemeBtn();
    });
  }

  /* =====================================================
     ACCESSIBILITY MENU (larger text / high contrast / reduce motion)
     ---------------------------------------------------- */
  const a11yBtn = document.getElementById('a11yToggle');
  const a11yPanel = document.getElementById('a11yPanel');
  if (a11yBtn && a11yPanel) {
    const opts = a11yPanel.querySelectorAll('.a11y-opt[data-a11y]');
    const syncOpts = () => opts.forEach((o) => {
      o.setAttribute('aria-checked', String(root.classList.contains('a11y-' + o.dataset.a11y)));
    });
    syncOpts();

    const openPanel = () => {
      a11yPanel.hidden = false;
      a11yBtn.setAttribute('aria-expanded', 'true');
      document.addEventListener('click', onOutside);
      document.addEventListener('keydown', onEsc);
    };
    const closePanel = () => {
      a11yPanel.hidden = true;
      a11yBtn.setAttribute('aria-expanded', 'false');
      document.removeEventListener('click', onOutside);
      document.removeEventListener('keydown', onEsc);
    };
    const onOutside = (e) => { if (!e.target.closest('.a11y')) closePanel(); };
    const onEsc = (e) => { if (e.key === 'Escape') { closePanel(); a11yBtn.focus(); } };

    a11yBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      a11yPanel.hidden ? openPanel() : closePanel();
    });

    opts.forEach((o) => o.addEventListener('click', () => {
      const cls = 'a11y-' + o.dataset.a11y;
      const on = root.classList.toggle(cls);
      try { localStorage.setItem(o.dataset.a11y, on ? '1' : '0'); localStorage.setItem('a11y-' + o.dataset.a11y, on ? '1' : '0'); } catch (e) {}
      syncOpts();
    }));

    const resetBtn = document.getElementById('a11yReset');
    if (resetBtn) resetBtn.addEventListener('click', () => {
      ['large-text', 'high-contrast', 'reduce-motion'].forEach((k) => {
        root.classList.remove('a11y-' + k);
        try { localStorage.setItem('a11y-' + k, '0'); } catch (e) {}
      });
      syncOpts();
    });
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
  const isCoarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const isNarrow = window.matchMedia('(max-width: 880px)').matches;
  if (!reduce && !isCoarse && !isNarrow) {
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
  const sections = ['work', 'about', 'skills', 'timeline', 'contact'].map((id) => document.getElementById(id)).filter(Boolean);

  const updateNavScroll = () => {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  updateNavScroll();
  window.addEventListener('scroll', updateNavScroll, { passive: true });

  const closeMenu = () => {
    if (!nav) return;
    nav.classList.remove('menu-open');
    body.classList.remove('nav-open');
    navToggle?.setAttribute('aria-expanded', 'false');
  };

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('menu-open');
      body.classList.toggle('nav-open', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Close mobile menu on any in-page anchor click, regardless of Lenis state.
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', () => closeMenu());
  });

  // Close on Escape, and if viewport grows past mobile breakpoint.
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  window.matchMedia('(min-width: 881px)').addEventListener?.('change', (ev) => {
    if (ev.matches) closeMenu();
  });

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
     WORK CARDS — tap to reveal badge + actions on touch
     ---------------------------------------------------- */
  if (window.matchMedia('(hover: none)').matches) {
    document.querySelectorAll('.work-item').forEach((item) => {
      const frame = item.querySelector('.work-frame');
      if (!frame) return;
      frame.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;          // let real link taps through
        e.preventDefault();
        document.querySelectorAll('.work-item.is-revealed').forEach((other) => {
          if (other !== item) other.classList.remove('is-revealed');
        });
        item.classList.toggle('is-revealed');
      });
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.work-item')) {
        document.querySelectorAll('.work-item.is-revealed').forEach((el) => el.classList.remove('is-revealed'));
      }
    });
  }

  /* =====================================================
     MAILTO links — copy to clipboard with feedback
     Always gives visible response even when no mail client is configured.
     ---------------------------------------------------- */
  const mailtoLinks = document.querySelectorAll('a[href^="mailto:"]');
  mailtoLinks.forEach((a) => {
    const email = a.getAttribute('href').replace(/^mailto:/, '').split('?')[0];
    a.addEventListener('click', () => {
      // Don't preventDefault — let mailto: still open the default mail client if one exists.
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(email).then(() => {
          const original = a.dataset.originalText || a.innerHTML;
          a.dataset.originalText = original;
          if (a.dataset.copyState === 'pending') return;
          a.dataset.copyState = 'pending';
          a.innerHTML = '<span style="color:var(--accent)">Copied ✓</span>';
          setTimeout(() => {
            a.innerHTML = original;
            delete a.dataset.copyState;
          }, 1600);
        }).catch(() => {});
      }
    });
  });

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

    // Phone: strip anything that isn't a digit / + / space / () / -
    const phone = document.getElementById('fPhone');
    if (phone) {
      const sanitize = () => {
        const cleaned = phone.value.replace(/[^\d+\s()\-]/g, '');
        if (cleaned !== phone.value) phone.value = cleaned;
      };
      phone.addEventListener('input', sanitize);
      phone.addEventListener('paste', () => setTimeout(sanitize, 0));
    }

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
