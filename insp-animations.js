/* =========================================================================
   INSP ANIMATIONS
   Additive, namespaced (insp-) animation enhancements for CLID.

   Ground rules honored:
   - Does NOT modify existing story/chapter styles, timelines, or ScrollTriggers.
   - Everything is namespaced with `insp-`.
   - Reuses the GSAP/ScrollTrigger/Lenis already loaded by the page
     (no second smooth-scroll library).
   - Respects prefers-reduced-motion.
   - Uses gsap.matchMedia so touch / no-hover devices get a simplified
     (disabled) version — no cursor-follow on touch.
   - Each effect is an isolated, self-contained init function.
========================================================================= */

(function () {
  "use strict";

  if (typeof window.gsap === "undefined") return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* -----------------------------------------------------------------
     01 — Magnetic CTA buttons  (Osmo §2.2)
     The button drifts toward the cursor while hovered and springs
     back to center on leave. Fine-pointer / hover devices only.
  ----------------------------------------------------------------- */
  function initMagneticButtons() {
    const magnets = gsap.utils.toArray(".insp-magnetic");
    if (!magnets.length) return () => {};

    const STRENGTH = 0.35; // how far the button follows the cursor (0–1)
    const bound = [];

    magnets.forEach((el) => {
      const xTo = gsap.quickTo(el, "x", {
        duration: 0.4,
        ease: "power2.out",
      });
      const yTo = gsap.quickTo(el, "y", {
        duration: 0.4,
        ease: "power2.out",
      });

      const onMove = (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        xTo(x * STRENGTH);
        yTo(y * STRENGTH);
      };

      const onLeave = () => {
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 0.6,
          ease: "elastic.out(1, 0.4)",
          overwrite: "auto",
        });
      };

      el.addEventListener("mousemove", onMove);
      el.addEventListener("mouseleave", onLeave);
      bound.push({ el, onMove, onLeave });
    });

    // cleanup — remove listeners and reset transforms
    return () => {
      bound.forEach(({ el, onMove, onLeave }) => {
        el.removeEventListener("mousemove", onMove);
        el.removeEventListener("mouseleave", onLeave);
        gsap.set(el, { clearProps: "transform" });
      });
    };
  }

  /* -----------------------------------------------------------------
     02 — Velocity-reactive marquee  (Jeton §1.7 + Osmo §2.7)
     Seamless infinite text loop with a gentle base drift. Scroll
     velocity temporarily boosts its speed and flips its direction
     to match the scroll direction; it settles back to the base
     drift and never fully stalls. Pauses on hover.
  ----------------------------------------------------------------- */
  function initMarquee() {
    const marquee = document.querySelector("#insp-marquee-1");
    if (!marquee || typeof window.ScrollTrigger === "undefined") {
      return () => {};
    }

    const track = marquee.querySelector(".insp-marquee__track");
    if (!track) return () => {};

    // Duplicate the content once so the -50% loop is seamless.
    track.innerHTML += track.innerHTML;

    const loop = gsap.to(track, {
      xPercent: -50,
      ease: "none",
      duration: 26,
      repeat: -1,
    });

    let direction = 1; // 1 = leftward drift, -1 = rightward
    let targetTS = 1; // desired multiplier from scroll velocity
    let currentTS = 1; // smoothed, applied multiplier
    let paused = false;

    const st = ScrollTrigger.create({
      onUpdate: (self) => {
        const v = self.getVelocity();
        if (v !== 0) direction = v > 0 ? 1 : -1;
        targetTS = gsap.utils.clamp(1, 6, 1 + Math.abs(v) / 400);
      },
    });

    // Per-frame smoothing: velocity boost decays back to the base drift.
    const tick = () => {
      targetTS = gsap.utils.interpolate(targetTS, 1, 0.05);
      const goal = paused ? 0 : targetTS;
      currentTS = gsap.utils.interpolate(currentTS, goal, 0.1);
      loop.timeScale(currentTS * direction);
    };
    gsap.ticker.add(tick);

    const onEnter = () => (paused = true);
    const onLeave = () => (paused = false);
    marquee.addEventListener("mouseenter", onEnter);
    marquee.addEventListener("mouseleave", onLeave);

    return () => {
      gsap.ticker.remove(tick);
      marquee.removeEventListener("mouseenter", onEnter);
      marquee.removeEventListener("mouseleave", onLeave);
      st.kill();
      loop.kill();
    };
  }

  /* -----------------------------------------------------------------
     03 — Count-up stats  (Jeton §1.4)
     Numbers count from 0 to a target once, when scrolled into view.
     Reduced motion: the final value is shown immediately (no count).
     Reads config from data-attributes on each `.insp-stat__num`:
       data-target   number to count to (required)
       data-suffix   text appended after the value (e.g. "+")
       data-prefix   text prepended before the value (e.g. "$")
       data-decimals fixed decimal places (default 0)
  ----------------------------------------------------------------- */
  function initCountUp() {
    const nums = gsap.utils.toArray(".insp-stat__num");
    if (!nums.length) return () => {};

    const tweens = [];

    nums.forEach((el) => {
      // Elements upgraded to the odometer are handled by initOdometer.
      if (el.classList.contains("insp-odometer")) return;

      const target = parseFloat(el.dataset.target) || 0;
      const suffix = el.dataset.suffix || "";
      const prefix = el.dataset.prefix || "";
      const decimals = parseInt(el.dataset.decimals || "0", 10);

      const render = (v) => {
        el.textContent =
          prefix +
          v.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }) +
          suffix;
      };

      if (prefersReducedMotion || typeof window.ScrollTrigger === "undefined") {
        render(target); // static final value
        return;
      }

      render(0);
      const counter = { val: 0 };
      const tween = gsap.to(counter, {
        val: target,
        duration: 2,
        ease: "power1.out",
        onUpdate: () => render(counter.val),
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
      });
      tweens.push(tween);
    });

    return () => {
      tweens.forEach((t) => {
        if (t.scrollTrigger) t.scrollTrigger.kill();
        t.kill();
      });
    };
  }

  /* -----------------------------------------------------------------
     04 — FAQ accordion  (Phamily §3.3)
     Smoothly expands/collapses answers (animated height, not display
     toggling) and rotates the +/- icon. Single-open behavior. Works
     with keyboard/AT via aria-expanded. Reduced motion => instant
     (duration 0) but still fully functional.
  ----------------------------------------------------------------- */
  function initFAQ() {
    const items = gsap.utils.toArray(".insp-faq__item");
    if (!items.length) return () => {};

    const openDur = prefersReducedMotion ? 0 : 0.45;
    const iconDur = prefersReducedMotion ? 0 : 0.35;
    const handlers = [];

    const closeItem = (item) => {
      const answer = item.querySelector(".insp-faq__a");
      const btn = item.querySelector(".insp-faq__q");
      const icon = item.querySelector(".insp-faq__icon");
      item.classList.remove("is-open");
      if (btn) btn.setAttribute("aria-expanded", "false");
      gsap.to(answer, {
        height: 0,
        duration: openDur,
        ease: "power2.inOut",
        overwrite: true,
      });
      gsap.to(icon, { rotate: 0, duration: iconDur, overwrite: true });
    };

    const openItem = (item) => {
      const answer = item.querySelector(".insp-faq__a");
      const btn = item.querySelector(".insp-faq__q");
      const icon = item.querySelector(".insp-faq__icon");
      item.classList.add("is-open");
      if (btn) btn.setAttribute("aria-expanded", "true");
      gsap.to(answer, {
        height: answer.scrollHeight,
        duration: openDur,
        ease: "power2.inOut",
        overwrite: true,
        onComplete: () => gsap.set(answer, { height: "auto" }),
      });
      gsap.to(icon, { rotate: 45, duration: iconDur, overwrite: true });
    };

    items.forEach((item) => {
      const btn = item.querySelector(".insp-faq__q");
      if (!btn) return;
      const onClick = () => {
        const isOpen = item.classList.contains("is-open");
        // Single-open: close any other open item first.
        items.forEach((other) => {
          if (other !== item && other.classList.contains("is-open")) {
            closeItem(other);
          }
        });
        isOpen ? closeItem(item) : openItem(item);
      };
      btn.addEventListener("click", onClick);
      handlers.push({ btn, onClick });
    });

    return () => {
      handlers.forEach(({ btn, onClick }) =>
        btn.removeEventListener("click", onClick)
      );
    };
  }

  /* -----------------------------------------------------------------
     05 — Numbered step list with drawing connector line  (Phamily §3.2)
     Each step slides/fades in as it scrolls into view; a thin vertical
     line draws downward (scaleY 0->1, scrubbed) connecting the numbers.
     Reduced motion: steps fade in place (no movement) and the line is
     shown fully drawn (no scrub).
  ----------------------------------------------------------------- */
  function initSteps() {
    const roots = gsap.utils.toArray(".insp-steps");
    if (!roots.length || typeof window.ScrollTrigger === "undefined") {
      return () => {};
    }

    const triggers = [];

    roots.forEach((root) => {
      const steps = gsap.utils.toArray(".insp-step", root);
      const lineFill = root.querySelector(".insp-steps__line-fill");
      const list = root.querySelector(".insp-steps__list");

      // Steps reveal
      steps.forEach((step) => {
        const from = prefersReducedMotion
          ? { opacity: 0 }
          : { opacity: 0, x: -20 };
        const tween = gsap.from(step, {
          ...from,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: step,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        });
        triggers.push(tween);
      });

      // Connector line draw
      if (lineFill && list) {
        if (prefersReducedMotion) {
          gsap.set(lineFill, { scaleY: 1 });
        } else {
          const tween = gsap.fromTo(
            lineFill,
            { scaleY: 0 },
            {
              scaleY: 1,
              ease: "none",
              scrollTrigger: {
                trigger: list,
                start: "top 70%",
                end: "bottom 70%",
                scrub: true,
              },
            }
          );
          triggers.push(tween);
        }
      }
    });

    return () => {
      triggers.forEach((t) => {
        if (t.scrollTrigger) t.scrollTrigger.kill();
        t.kill();
      });
    };
  }

  /* -----------------------------------------------------------------
     06 — 3D perspective hover on cards  (Osmo §2.8)
     Cards tilt subtly toward the cursor (max ~7deg) and spring back
     to flat on leave. Fine-pointer / hover devices only.
  ----------------------------------------------------------------- */
  function initTilt() {
    const cards = gsap.utils.toArray(".insp-tilt");
    if (!cards.length) return () => {};

    const MAX = 7; // max tilt in degrees
    const bound = [];

    cards.forEach((card) => {
      gsap.set(card, { transformPerspective: 800, transformOrigin: "center" });
      const rotX = gsap.quickTo(card, "rotationX", {
        duration: 0.4,
        ease: "power2.out",
      });
      const rotY = gsap.quickTo(card, "rotationY", {
        duration: 0.4,
        ease: "power2.out",
      });

      const onMove = (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        rotY(px * MAX * 2);
        rotX(-py * MAX * 2);
      };

      const onLeave = () => {
        gsap.to(card, {
          rotationX: 0,
          rotationY: 0,
          duration: 0.6,
          ease: "elastic.out(1, 0.5)",
          overwrite: "auto",
        });
      };

      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", onLeave);
      bound.push({ card, onMove, onLeave });
    });

    return () => {
      bound.forEach(({ card, onMove, onLeave }) => {
        card.removeEventListener("mousemove", onMove);
        card.removeEventListener("mouseleave", onLeave);
        gsap.set(card, { clearProps: "transform,perspective" });
      });
    };
  }

  /* -----------------------------------------------------------------
     07 — Staggered list reveal  (Phamily §3.5 style)
     Row lists reveal as they scroll in. The entrance style is chosen
     per-list via `data-reveal` on the <ul> (default "up"). Hover is
     handled by lightweight CSS (nudge + accent). Reduced motion => a
     simple opacity fade for every variant.
       up    fade + rise            (simple)
       left  fade + slide from left (simple)
       fade  opacity only           (simplest)
       scale fade + pop             (medium)
       blur  fade + defocus->sharp  (medium)
       clip  left-to-right wipe     (complex)
  ----------------------------------------------------------------- */
  function initListReveal() {
    if (typeof window.ScrollTrigger === "undefined") return () => {};

    // Row lists and generic reveal grids (e.g. the updates gallery) share
    // the same staggered-entrance logic and `data-reveal` variants.
    const groups = [
      ...gsap.utils.toArray(".insp-list").map((el) => ({
        el,
        sel: ".insp-list-item",
      })),
      ...gsap.utils.toArray(".insp-reveal").map((el) => ({
        el,
        sel: ".insp-reveal__item",
      })),
    ];
    if (!groups.length) return () => {};

    // Each entry merges from-state + tween config for a single gsap.from().
    const REVEALS = {
      fade: { opacity: 0, duration: 0.7, ease: "power1.out", stagger: 0.06 },
      up: { opacity: 0, y: 20, duration: 0.6, ease: "power2.out", stagger: 0.08 },
      left: { opacity: 0, x: -30, duration: 0.6, ease: "power2.out", stagger: 0.08 },
      scale: {
        opacity: 0,
        scale: 0.9,
        duration: 0.6,
        ease: "back.out(1.6)",
        stagger: 0.08,
        transformOrigin: "left center",
      },
      blur: {
        opacity: 0,
        filter: "blur(10px)",
        duration: 0.7,
        ease: "power2.out",
        stagger: 0.09,
      },
      clip: {
        opacity: 0,
        clipPath: "inset(0 100% 0 0)",
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.1,
      },
    };

    const REDUCED = {
      opacity: 0,
      duration: 0.4,
      ease: "power1.out",
      stagger: 0.04,
    };

    const tweens = [];

    groups.forEach(({ el, sel }) => {
      const items = gsap.utils.toArray(sel, el);
      if (!items.length) return;

      const key = el.dataset.reveal || "up";
      const spec = prefersReducedMotion ? REDUCED : REVEALS[key] || REVEALS.up;

      const tween = gsap.from(items, {
        ...spec,
        scrollTrigger: {
          trigger: el,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      });
      tweens.push(tween);
    });

    return () => {
      tweens.forEach((t) => {
        if (t.scrollTrigger) t.scrollTrigger.kill();
        t.kill();
      });
    };
  }

  /* -----------------------------------------------------------------
     08 — Masked split-text heading reveal  (Jeton §1.1 / Osmo §2.4)
     Splits a heading into words, each masked by an overflow-hidden
     wrapper, and slides them up (yPercent 110 -> 0) with a stagger as
     the heading scrolls in. Applied only to `.insp-split` headings
     (our own insp- sections) — never the story/chapter <h2>s.
     No paid SplitText plugin: the split is done manually here.
  ----------------------------------------------------------------- */
  function splitIntoWords(el) {
    const original = el.textContent;
    const tokens = original.split(/(\s+)/); // keep whitespace tokens
    el.textContent = "";
    el.setAttribute("aria-label", original.trim());

    const words = [];
    tokens.forEach((tok) => {
      if (tok === "") return;
      if (/^\s+$/.test(tok)) {
        el.appendChild(document.createTextNode(tok));
        return;
      }
      const mask = document.createElement("span");
      mask.className = "insp-split__mask";
      mask.setAttribute("aria-hidden", "true");
      const inner = document.createElement("span");
      inner.className = "insp-split__word";
      inner.textContent = tok;
      mask.appendChild(inner);
      el.appendChild(mask);
      words.push(inner);
    });
    return words;
  }

  function initSplitHeadings() {
    if (typeof window.ScrollTrigger === "undefined") return () => {};
    const els = gsap.utils.toArray(".insp-split");
    if (!els.length) return () => {};

    const tweens = [];

    els.forEach((el) => {
      if (el.dataset.splitDone) return;
      const words = splitIntoWords(el);
      el.dataset.splitDone = "true";

      if (prefersReducedMotion) {
        gsap.set(words, { yPercent: 0 });
        return;
      }

      const tween = gsap.from(words, {
        yPercent: 110,
        duration: 0.9,
        ease: "power4.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });
      tweens.push(tween);
    });

    return () => {
      tweens.forEach((t) => {
        if (t.scrollTrigger) t.scrollTrigger.kill();
        t.kill();
      });
    };
  }

  /* -----------------------------------------------------------------
     09 — Number odometer  (Osmo §2.6)
     A richer version of the count-up: each digit is a vertical strip
     (two 0-9 runs) inside a masked column, rolling up into place with a
     per-column stagger — so even a target ending in 0 does a full spin.
     Reads data-target / data-prefix / data-suffix like the count-up.
     Reduced motion: digits snap to their final value (no roll).
  ----------------------------------------------------------------- */
  function buildOdometer(el) {
    const target = String(Math.round(parseFloat(el.dataset.target) || 0));
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";

    el.textContent = "";
    el.setAttribute("aria-label", prefix + target + suffix);

    const affix = (text) => {
      const s = document.createElement("span");
      s.className = "insp-odometer__affix";
      s.setAttribute("aria-hidden", "true");
      s.textContent = text;
      el.appendChild(s);
    };

    if (prefix) affix(prefix);

    const cols = [];
    target.split("").forEach((ch) => {
      const digit = parseInt(ch, 10);
      const col = document.createElement("span");
      col.className = "insp-odometer__col";
      col.setAttribute("aria-hidden", "true");
      const strip = document.createElement("span");
      strip.className = "insp-odometer__strip";
      // Two 0-9 runs so the roll makes at least one full turn.
      for (let i = 0; i < 20; i++) {
        const cell = document.createElement("span");
        cell.className = "insp-odometer__cell";
        cell.textContent = i % 10;
        strip.appendChild(cell);
      }
      col.appendChild(strip);
      el.appendChild(col);
      cols.push({ strip, digit });
    });

    if (suffix) affix(suffix);
    return cols;
  }

  function initOdometer() {
    if (typeof window.ScrollTrigger === "undefined") return () => {};
    const els = gsap.utils.toArray(".insp-odometer");
    if (!els.length) return () => {};

    // 20 cells => each cell is 5% of the strip height. Land on the digit
    // in the SECOND run (index 10 + digit) so every column spins fully.
    const finalY = (digit) => -(10 + digit) * 5;

    const tweens = [];

    els.forEach((el) => {
      if (el.dataset.odoDone) return;
      const cols = buildOdometer(el);
      el.dataset.odoDone = "true";

      if (prefersReducedMotion) {
        cols.forEach(({ strip, digit }) =>
          gsap.set(strip, { yPercent: finalY(digit) })
        );
        return;
      }

      const tween = gsap.to(
        cols.map((c) => c.strip),
        {
          yPercent: (i) => finalY(cols[i].digit),
          duration: 1.4,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        }
      );
      tweens.push(tween);
    });

    return () => {
      tweens.forEach((t) => {
        if (t.scrollTrigger) t.scrollTrigger.kill();
        t.kill();
      });
    };
  }

  /* -----------------------------------------------------------------
     10 — Glowing interactive dot grid  (Osmo §2.9)
     A canvas grid of dots behind a section; dots brighten/swell near the
     cursor and dim with distance. Draws only while the section is in view
     and the cursor is moving (idle => single static frame, no rAF).
     Touch / reduced motion: a static faint grid, no interaction.
  ----------------------------------------------------------------- */
  function initDotGrid() {
    const hosts = gsap.utils.toArray(".insp-dotgrid-host");
    if (!hosts.length) return () => {};

    const canInteract =
      !prefersReducedMotion &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const cleanups = [];

    hosts.forEach((host) => {
      const canvas = document.createElement("canvas");
      canvas.className = "insp-dotgrid";
      canvas.setAttribute("aria-hidden", "true");
      host.prepend(canvas);

      const ctx = canvas.getContext("2d");
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const GAP = 34; // px between dots
      const BASE_R = 1.5; // resting radius
      const REACH = 130; // glow radius around cursor
      const BASE_A = 0.12; // resting alpha

      let width = 0;
      let height = 0;
      let dots = [];
      let color = "rgb(224,224,224)";
      const mouse = { x: -9999, y: -9999, active: false };

      const build = () => {
        const rect = host.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        color = getComputedStyle(host).color || color;
        ctx.fillStyle = color;
        dots = [];
        for (let y = GAP / 2; y < height; y += GAP) {
          for (let x = GAP / 2; x < width; x += GAP) {
            dots.push({ x, y });
          }
        }
      };

      const render = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = color;
        for (const d of dots) {
          let alpha = BASE_A;
          let r = BASE_R;
          if (mouse.active) {
            const dist = Math.hypot(d.x - mouse.x, d.y - mouse.y);
            if (dist < REACH) {
              const t = 1 - dist / REACH;
              alpha = BASE_A + t * 0.7;
              r = BASE_R + t * 1.8;
            }
          }
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      };

      let inView = false;
      let raf = null;
      const loop = () => {
        render();
        // Keep animating only while the cursor is actively glowing.
        if (mouse.active && inView) {
          raf = requestAnimationFrame(loop);
        } else {
          raf = null;
        }
      };
      const kick = () => {
        if (!raf && inView) raf = requestAnimationFrame(loop);
      };

      build();
      render();

      const io = new IntersectionObserver(
        (entries) => {
          inView = entries[0].isIntersecting;
          if (inView) render();
        },
        { threshold: 0 }
      );
      io.observe(host);

      let onMove, onLeave;
      if (canInteract) {
        onMove = (e) => {
          const rect = host.getBoundingClientRect();
          mouse.x = e.clientX - rect.left;
          mouse.y = e.clientY - rect.top;
          mouse.active = true;
          kick();
        };
        onLeave = () => {
          mouse.active = false;
          render(); // settle back to the static grid
        };
        host.addEventListener("mousemove", onMove);
        host.addEventListener("mouseleave", onLeave);
      }

      const onResize = () => {
        build();
        render();
      };
      window.addEventListener("resize", onResize);

      cleanups.push(() => {
        if (raf) cancelAnimationFrame(raf);
        io.disconnect();
        window.removeEventListener("resize", onResize);
        if (onMove) host.removeEventListener("mousemove", onMove);
        if (onLeave) host.removeEventListener("mouseleave", onLeave);
        canvas.remove();
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }

  /* -----------------------------------------------------------------
     11 — Draggable card carousel  (Jeton §1.5, custom pointer-drag)
     Horizontal drag with momentum + snap-to-card; cards scale/dim as
     they move away from center. Pointer events => works on mouse and
     touch, and `touch-action: pan-y` keeps vertical page scroll intact
     (no scroll hijack). No paid Draggable plugin. Reduced motion: still
     draggable, but no scale/dim and near-instant snap.
  ----------------------------------------------------------------- */
  function initCarousel() {
    const roots = gsap.utils.toArray(".insp-carousel");
    if (!roots.length) return () => {};

    const scaleAmt = prefersReducedMotion ? 0 : 0.12;
    const dimAmt = prefersReducedMotion ? 0 : 0.45;
    const cleanups = [];

    roots.forEach((root) => {
      const track = root.querySelector(".insp-carousel__track");
      if (!track) return;
      const cards = gsap.utils.toArray(".insp-carousel__card", track);
      if (!cards.length) return;

      let step = 0;
      let maxScroll = 0;
      let index = 0;

      const measure = () => {
        const styles = getComputedStyle(track);
        const gap = parseFloat(styles.columnGap || styles.gap || 0) || 0;
        step = cards[0].getBoundingClientRect().width + gap;
        maxScroll = Math.max(0, track.scrollWidth - root.clientWidth);
      };

      const clampX = (x) => gsap.utils.clamp(-maxScroll, 0, x);

      const updateScales = () => {
        if (prefersReducedMotion) return;
        const rr = root.getBoundingClientRect();
        const focal = rr.left + rr.width / 2;
        const span = rr.width / 1.2;
        cards.forEach((card) => {
          const cr = card.getBoundingClientRect();
          const center = cr.left + cr.width / 2;
          const t = gsap.utils.clamp(0, 1, Math.abs(center - focal) / span);
          gsap.set(card, { scale: 1 - t * scaleAmt, opacity: 1 - t * dimAmt });
        });
      };

      measure();
      gsap.set(track, { x: 0 });
      updateScales();

      let dragging = false;
      let startX = 0;
      let startTX = 0;
      let lastX = 0;
      let lastT = 0;
      let velo = 0;

      const onDown = (e) => {
        dragging = true;
        startX = e.clientX;
        startTX = Number(gsap.getProperty(track, "x"));
        lastX = e.clientX;
        lastT = performance.now();
        velo = 0;
        root.classList.add("is-dragging");
        gsap.killTweensOf(track);
      };

      const onMove = (e) => {
        if (!dragging) return;
        const x = clampX(startTX + (e.clientX - startX));
        gsap.set(track, { x });
        updateScales();
        const now = performance.now();
        const dt = now - lastT;
        if (dt > 0) velo = (e.clientX - lastX) / dt; // px/ms
        lastX = e.clientX;
        lastT = now;
      };

      const onUp = () => {
        if (!dragging) return;
        dragging = false;
        root.classList.remove("is-dragging");
        const curX = Number(gsap.getProperty(track, "x"));
        const projected = curX + velo * 180; // momentum projection
        index = gsap.utils.clamp(
          0,
          cards.length - 1,
          Math.round(-projected / step)
        );
        const targetX = clampX(-index * step);
        const dur = prefersReducedMotion
          ? 0.15
          : gsap.utils.clamp(0.3, 0.9, Math.abs(targetX - curX) / 600 + 0.3);
        gsap.to(track, {
          x: targetX,
          duration: dur,
          ease: "power3.out",
          onUpdate: updateScales,
        });
      };

      track.style.touchAction = "pan-y";
      root.addEventListener("pointerdown", onDown);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);

      const onResize = () => {
        measure();
        gsap.set(track, { x: clampX(-index * step) });
        updateScales();
      };
      window.addEventListener("resize", onResize);

      cleanups.push(() => {
        root.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("resize", onResize);
        gsap.killTweensOf(track);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }

  /* -----------------------------------------------------------------
     12 — Two-row photo scroller with counter-motion + edge shadow
     Two horizontal rows; the arrows drive them in opposite directions
     (top forward, bottom backward). CSS gradient overlays darken the
     left/right edges so the center reads clearly. Reduced motion: the
     arrows jump instantly instead of animating.
  ----------------------------------------------------------------- */
  function initPhotoRows() {
    const roots = gsap.utils.toArray(".insp-photorows");
    if (!roots.length) return () => {};

    const dur = prefersReducedMotion ? 0 : 0.7;
    const cleanups = [];

    roots.forEach((root) => {
      const tracks = gsap.utils.toArray(".insp-photorow__track", root);
      if (tracks.length < 2) return;
      const [topTrack, bottomTrack] = tracks;
      const prev = root.querySelector(".insp-photorows__arrow--prev");
      const next = root.querySelector(".insp-photorows__arrow--next");

      let maxTop = 0;
      let maxBottom = 0;
      let step = 0;
      let topX = 0;
      let bottomX = 0;

      const clamp = (x, max) => gsap.utils.clamp(-max, 0, x);

      const measure = () => {
        maxTop = Math.max(0, topTrack.scrollWidth - root.clientWidth);
        maxBottom = Math.max(0, bottomTrack.scrollWidth - root.clientWidth);
        step = root.clientWidth * 0.6;
      };

      const syncArrows = () => {
        const canNext = topX > -maxTop + 1 || bottomX < -1;
        const canPrev = topX < -1 || bottomX > -maxBottom + 1;
        if (next) next.disabled = !canNext;
        if (prev) prev.disabled = !canPrev;
      };

      measure();
      // Bottom starts at its far end so it can travel backward on "next".
      topX = 0;
      bottomX = -maxBottom;
      gsap.set(topTrack, { x: topX });
      gsap.set(bottomTrack, { x: bottomX });
      syncArrows();

      // dir = 1 -> next: top moves forward (left), bottom moves backward (right)
      const move = (dir) => {
        topX = clamp(topX - dir * step, maxTop);
        bottomX = clamp(bottomX + dir * step, maxBottom);
        gsap.to(topTrack, { x: topX, duration: dur, ease: "power3.out", overwrite: true });
        gsap.to(bottomTrack, { x: bottomX, duration: dur, ease: "power3.out", overwrite: true });
        syncArrows();
      };

      const onPrev = () => move(-1);
      const onNext = () => move(1);
      if (prev) prev.addEventListener("click", onPrev);
      if (next) next.addEventListener("click", onNext);

      const onResize = () => {
        measure();
        topX = clamp(topX, maxTop);
        bottomX = clamp(bottomX, maxBottom);
        gsap.set(topTrack, { x: topX });
        gsap.set(bottomTrack, { x: bottomX });
        syncArrows();
      };
      window.addEventListener("resize", onResize);

      cleanups.push(() => {
        if (prev) prev.removeEventListener("click", onPrev);
        if (next) next.removeEventListener("click", onNext);
        window.removeEventListener("resize", onResize);
        gsap.killTweensOf([topTrack, bottomTrack]);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }

  /* -----------------------------------------------------------------
     Decorative accents — auto-scatter
     Sprinkles faint, mission-themed line-art into the empty edges of
     each section. Skips any section that already has a hand-placed
     decoration, so the curated hero/footer accents are preserved.
     Everything inherits the theme color (and the home inversion).
  ----------------------------------------------------------------- */
  function initDecor() {
    const shapes = [
      "users", "users-group", "friends", "heart", "heart-handshake", "scale",
      "world", "bulb", "school", "book", "accessible", "puzzle", "star", "sun",
      "shield", "tree", "message", "ripple", "infinity", "mountain", "sunrise",
      "plant", "plant-2", "leaf", "flower", "spiral", "sparkles", "clover",
    ];
    const positions = [
      { top: "9%", right: "6%", rot: -8, size: 118 },
      { bottom: "11%", right: "9%", rot: 6, size: 108 },
      { top: "15%", left: "4%", rot: 10, size: 104 },
      { bottom: "13%", left: "7%", rot: -6, size: 116 },
      { top: "44%", right: "5%", rot: 4, size: 92 },
      { top: "40%", left: "3%", rot: -12, size: 88 },
    ];

    const hosts = gsap.utils.toArray(
      ".story-panel, .insp-faq, .insp-steps, .insp-carousel-section, .insp-updates"
    );

    let shapeIdx = 0;
    hosts.forEach((host, hi) => {
      if (host.querySelector(".insp-decor")) return; // keep curated placements
      host.classList.add("insp-decor-host");
      const count = 2 + (hi % 2); // 2 or 3 accents per section
      for (let k = 0; k < count; k++) {
        const pos = positions[(hi + k) % positions.length];
        const shape = shapes[shapeIdx++ % shapes.length];
        const span = document.createElement("span");
        span.className = "insp-decor insp-decor--" + shape;
        span.setAttribute("aria-hidden", "true");
        span.style.setProperty("--insp-decor-size", pos.size + "px");
        span.style.setProperty("--insp-decor-rot", pos.rot + "deg");
        span.style.setProperty("--insp-decor-opacity", "0.07");
        if (pos.top) span.style.top = pos.top;
        if (pos.bottom) span.style.bottom = pos.bottom;
        if (pos.left) span.style.left = pos.left;
        if (pos.right) span.style.right = pos.right;
        host.appendChild(span);
      }
    });
  }

  /* -----------------------------------------------------------------
     Boot
  ----------------------------------------------------------------- */
  function boot() {
    initDecor();
    // These run on every page and remain functional (or static) under
    // reduced motion, so they live outside the reduced-motion guard below.
    initCountUp();
    initOdometer();
    initFAQ();
    initSteps();
    initListReveal();
    initSplitHeadings();
    initDotGrid();
    initCarousel();
    initPhotoRows();

    if (prefersReducedMotion) return; // reduced-motion: skip movement effects

    const mm = gsap.matchMedia();

    // Only enable cursor-follow effects on devices with a fine, hovering pointer.
    mm.add("(hover: hover) and (pointer: fine)", () => {
      const cleanupMagnetic = initMagneticButtons();
      const cleanupTilt = initTilt();
      return () => {
        cleanupMagnetic();
        cleanupTilt();
      };
    });

    // Marquee runs on all screen sizes (no cursor required).
    mm.add("all", () => {
      const cleanupMarquee = initMarquee();
      return () => cleanupMarquee();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
