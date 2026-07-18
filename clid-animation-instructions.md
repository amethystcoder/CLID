# Instructions for Coding Agent: Add Jeton / Osmo / Phamily-Inspired Animations to CLID

## 0. Non-negotiable ground rules (read first)

1. **Do not touch existing theme, colors, fonts, layout structure, or existing GSAP timelines/ScrollTriggers on CLID.** Every animation below must be additive — new components, new sections, or enhancements layered onto existing elements without rewriting them.
2. **Namespace everything.** Prefix all new classes, IDs, GSAP timeline labels, and ScrollTrigger IDs with `insp-` (e.g. `.insp-stack-card`, `#insp-marquee-1`) so nothing collides with or accidentally overrides current selectors.
3. **Check before adding global libraries.** Before installing Lenis/Locomotive Scroll for smooth scrolling, check if CLID already has a smooth-scroll solution running. If it does, hook new ScrollTrigger animations into the existing scroller config (`scrollerProxy` or existing Lenis instance) instead of instantiating a second one — two smooth-scroll libraries running simultaneously will break scroll position math site-wide.
4. **Respect `prefers-reduced-motion`.** Every animation must have a reduced-motion fallback (simple opacity fade, no movement) via `window.matchMedia('(prefers-reduced-motion: reduce)')`.
5. **Use `gsap.matchMedia()`** for all scroll/hover animations so mobile gets simplified or disabled versions (no scroll-scrubbed pinning, no cursor-follow effects on touch devices).
6. **Kill/refresh ScrollTriggers on route change** if CLID is an SPA, to avoid duplicate triggers stacking up.
7. Register plugins once at the top of the new module: `gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, Flip)` (only register what's actually used — Flip and Draggable are separate paid/free Club GSAP plugins, confirm license availability before using them).
8. Build each animation as an isolated, self-contained function that can be dropped in or removed independently (e.g. `initMarquee()`, `initStackingCards()`) — don't chain them into one giant timeline that affects unrelated parts of the page.

---

## 1. From Jeton.com — fintech product storytelling patterns

### 1.1 Hero heading reveal (staggered line/word split)
- **Where:** Any hero heading you want to upgrade (don't touch CLID's *existing* hero if it already animates — apply this only to a *new* section or one explicitly approved for replacement).
- **Effect:** Split the heading into lines, each line masked (overflow hidden wrapper), and animated up from `yPercent: 110` to `0` with a slight stagger (0.08s–0.12s between lines) and a fade from `opacity: 0` to `1`.
- **Easing:** `power4.out`, duration `1–1.2s`.
- **Trigger:** Fires on page load / on scroll into view (`ScrollTrigger` with `start: 'top 80%'`, `toggleActions: 'play none none none'`), not scrubbed.
- **GSAP:**
```js
gsap.from(".insp-hero-line", {
  yPercent: 110,
  opacity: 0,
  duration: 1.1,
  ease: "power4.out",
  stagger: 0.1,
});
```

### 1.2 Scroll-synced "product carousel" (the Add / Send / Exchange snippet swap)
- **What it does on Jeton:** As you scroll through the "Unify your finances" section, a stack of app-screenshot images crossfades/swaps while a list of feature labels (Add, Send, Exchange...) highlights the active one, synced 1:1 with scroll position — no scrub-jank, feels like flipping through a deck.
- **Build it as:** A pinned section (`ScrollTrigger.pin`) containing an image stack on one side and a text list on the other. Use one ScrollTrigger with `scrub: 1` driving a timeline that:
  - Crossfades image N out (`opacity 1→0`, slight `scale 1→1.05`) while image N+1 fades in (`opacity 0→1`, `scale 0.95→1`).
  - Simultaneously toggles an `.is-active` class on the corresponding label (bold weight + color change via `gsap.timeline` labels, not CSS transitions, so it stays scroll-synced).
- **Timing:** Divide the pinned scroll distance evenly across N steps; use `labels` on the timeline (`tl.addLabel("step1")`, etc.) so each image swap occupies an equal scroll segment.
- **Important:** Pin only the inner content wrapper, not the whole viewport, and set `pinSpacing: true` with an explicit `end: "+=" + (steps * 400)` so the pinned duration scales with number of steps.

### 1.3 Numbered stepper with progress line ("Simple, fast & safe" — 01 Account → 05 Done)
- **Effect:** A horizontal (or vertical on mobile) row of numbered steps with a connecting line. As you scroll, a progress-fill line draws left-to-right beneath/behind the numbers, and each step's number/label scales up + changes color as it becomes "active."
- **Build:** SVG or CSS line with a `scaleX` transform animated via `scrub: true` tied to the same pinned scroll range as 1.2. Each step circle: `scale: 1 → 1.15`, `backgroundColor` swap, using `gsap.to()` triggered at scroll-fraction checkpoints (`ScrollTrigger.create({ start, end, onEnter, onLeaveBack })` per step, rather than one giant scrub, since discrete "active" states read cleaner than continuous scrub for stepper UI).
- **"Restart" button:** On click, `gsap.to(window, { scrollTo: sectionTop, duration: 1, ease: "power2.inOut" })` using ScrollToPlugin, then replay the intro reveal timeline.

### 1.4 Count-up stat ("1M+ users")
- **Effect:** Number counts up from 0 to target when scrolled into view, once only.
- **GSAP:**
```js
gsap.from({ val: 0 }, {
  val: 1000000,
  duration: 2,
  ease: "power1.out",
  onUpdate: function () {
    el.textContent = Math.floor(this.targets()[0].val).toLocaleString() + "+";
  },
  scrollTrigger: { trigger: el, start: "top 85%", once: true },
});
```

### 1.5 Testimonial card row (horizontal snap carousel)
- **Effect:** Cards sit in a horizontally scrollable row; dragging (mouse or touch) has momentum/inertia and snaps to the nearest card edge on release. Small cards scale down and dim slightly (`opacity: 0.6`, `scale: 0.94`) when not centered, scale up to `1` when active.
- **Build:** `Draggable` (GSAP Club plugin, or a lightweight custom pointer-drag implementation if Draggable isn't licensed) with `type: "x"`, `inertia: true`, `snap` function rounding to card-width increments. Pair with a `ScrollTrigger`-free `gsap.to()` on `scale`/`opacity` recalculated on `drag`/`throw` update.

### 1.6 Currency/logo micro-swap (EUR/GBP flag toggle)
- **Effect:** Small icon swap animates as a quick flip: current icon scales/rotates out (`rotateY: 0 → 90deg`, `opacity 1→0`), new icon rotates in (`rotateY: -90 → 0`, `opacity 0→1`). Needs `transformPerspective` on the parent for the 3D flip to read correctly.
- **Duration:** ~0.35s each half, `power2.in`/`power2.out`.

### 1.7 Certification/badge marquee (footer logo row)
- **Effect:** Infinite, seamless horizontal scroll of trust badges/logos, slow constant speed, pausing on hover.
- **Build:** Duplicate the logo list once in the DOM (so the loop is seamless), animate the whole track with `xPercent: -50` over a long duration, `ease: "none"`, `repeat: -1`. Pause via `.timeScale(0)` (not `.pause()`, so it resumes smoothly) on `mouseenter`, resume via `.timeScale(1)` on `mouseleave`.

---

## 2. From Osmo.supply — named techniques to lift directly

Osmo's homepage literally showcases named resources; below are the ones most relevant to a product/marketing site, each described precisely enough to implement:

### 2.1 Locomotive/Lenis Smooth Scroll Setup
- Only add if CLID doesn't already have smooth scrolling. Adds inertia/easing to native scroll (content "catches up" to scroll input with a lag, e.g. `lerp: 0.1`). Must sync with `ScrollTrigger.scrollerProxy` and call `ScrollTrigger.update()` on Lenis's `scroll` event, plus drive Lenis via `gsap.ticker` instead of `requestAnimationFrame` directly to keep it frame-synced with other GSAP animations.

### 2.2 Magnetic Cursor / Momentum-Based Hover (buttons, CTAs)
- **Effect:** As the cursor approaches a button, the button itself shifts slightly toward the cursor position (magnetic pull), and snaps back to center with a soft elastic ease on mouse-leave. "Momentum-based" variant adds slight overshoot/wobble using `elastic.out(1, 0.4)`.
- **Build:**
```js
btn.addEventListener("mousemove", (e) => {
  const rect = btn.getBoundingClientRect();
  const x = e.clientX - rect.left - rect.width / 2;
  const y = e.clientY - rect.top - rect.height / 2;
  gsap.to(btn, { x: x * 0.35, y: y * 0.35, duration: 0.4, ease: "power2.out" });
});
btn.addEventListener("mouseleave", () => {
  gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
});
```
- Apply this to primary CTA buttons only (2–4 buttons max) — overusing magnetic hover site-wide feels gimmicky.

### 2.3 Directional List Hover
- **Effect:** On a list of items (e.g. services, nav links, feature list), hovering reveals a thumbnail image or background fill that slides in from whichever edge the cursor entered (top/bottom/left), rather than a generic fade — giving a sense of directional intent.
- **Build:** Detect enter position (`e.offsetY < rect.height / 2 ? "top" : "bottom"`), then animate the reveal panel's `clipPath` or `yPercent` from that same edge (`yPercent: 100` if entering from bottom → `0`; `yPercent: -100` if entering from top → `0`), and mirror the direction on `mouseleave`.

### 2.4 Split-Text Reveal / Masked Text Reveal
- **Effect:** Headings/paragraphs reveal line-by-line or word-by-word as they scroll into view, each line clipped by an `overflow: hidden` wrapper and animated `yPercent: 100 → 0`. This is the same mechanic as Jeton's hero (2.1 above is broader — Osmo applies it consistently to *every* heading across the page, not just the hero).
- **Recommendation for CLID:** Apply this to section headings (h2/h3) throughout new sections, staggered per-word (`stagger: 0.03`) for short headings, per-line (`stagger: 0.08`) for longer paragraphs.

### 2.5 Stacking Sticky Cards (with bounce)
- **Effect:** A vertical stack of cards where, as you scroll, each card pins in place while the next card slides up over it, slightly scaling down and dimming the one underneath (creating a physical "stack" depth). The "bounce" variant adds a small overshoot on the incoming card as it settles (`back.out(1.7)`).
- **Build:** Each card gets its own `ScrollTrigger` with `pin: true`, `pinSpacing: false`, stacked in DOM order. As the *next* card's ScrollTrigger starts, animate the *current* card: `scale: 1 → 0.92`, `opacity: 1 → 0.6`, `filter: blur(0px) → blur(2px)` (optional). Good use case for CLID: a "how it works" or "features" section with 3–5 cards.

### 2.6 Number Odometer
- **Effect:** Like a mechanical odometer — digits roll vertically into place rather than just counting up as plain text. More visually rich version of Jeton's count-up (1.4).
- **Build:** Each digit is a vertical strip of 0–9 stacked in a masked container; GSAP animates `y` to the target digit's offset with slight stagger per digit column and a `power3.out` ease.

### 2.7 Marquee with Scroll Direction
- **Effect:** An infinite horizontal marquee (text or logos) that speeds up/reverses direction based on scroll velocity and direction — scrolling down pushes the marquee one way, scrolling up reverses it, scrolling fast speeds it up.
- **Build:** Base infinite loop timeline (as in 1.7) plus a scroll-velocity listener (via ScrollTrigger's `onUpdate` and `self.getVelocity()`) that modulates `timeline.timeScale()` proportionally, clamped to a min/max range so it never fully stalls or spins out of control.

### 2.8 3D Perspective / Momentum Hover on Cards
- **Effect:** Cards tilt slightly in 3D following cursor position within the card bounds (subtle, not a full tilt.js effect — max ~6–8 degrees), with a soft spring back to flat on leave.
- **Build:** `rotateX`/`rotateY` mapped from cursor position relative to card center, `transformPerspective: 800`, `ease: power2.out` on move, `elastic.out(1,0.5)` on leave.

### 2.9 Glowing Interactive Dots Grid (optional background flourish)
- **Effect:** A background grid of small dots that brighten/glow near the cursor as it moves, dimming as it moves away — good for a hero or footer background on a more "techy" section.
- **Note:** This is a heavier, more decorative effect — recommend using sparingly (one section max) to avoid conflicting with CLID's existing visual identity.

---

## 3. From Phamilypharma.com — softer, human, editorial patterns

### 3.1 Hand-drawn icon micro-animations
- **Effect:** Small illustrated icons (used throughout Phamily's site next to feature blocks) scale/rotate in gently as their section scrolls into view — `scale: 0.7 → 1`, slight `rotate: -8deg → 0`, `opacity 0 → 1`, `back.out(1.4)` ease, ~0.6s. Reinforces a warm, approachable tone rather than a sharp corporate one.
- **Use case for CLID:** If CLID has any illustrated/icon assets, apply this reveal instead of a plain fade when they scroll in.

### 3.2 Numbered step list with progressive reveal (01–04 "parcours" section)
- **Effect:** A vertical list of numbered steps (01, 02, 03, 04) where each step's number, heading, and paragraph fade/slide in sequentially as you scroll down the list — plus a thin vertical line that draws downward connecting the numbers as you progress (same concept as Jeton's 1.3 but vertical and non-pinned, simple scroll-linked reveal rather than a pinned scrub sequence).
- **Build:** Each step: `ScrollTrigger` with `start: "top 75%"`, animate `x: -20 → 0`, `opacity: 0 → 1`, `duration: 0.7`. The connecting line: one absolutely-positioned line with `scaleY` scrubbed from 0→1 across the full list's scroll range (`scrub: true`, `start: top of list`, `end: bottom of list`).

### 3.3 FAQ accordion (smooth height + icon rotate)
- **Effect:** Clicking a question smoothly expands/collapses the answer (not an instant CSS `display:none` toggle), while a plus/chevron icon rotates 45°/180°.
- **Build:** Animate `height` from `0` to `auto` using GSAP's ability to animate to a measured `scrollHeight` (measure with `el.scrollHeight` before animating, or use the free `Flip` plugin), `duration: 0.45`, `ease: "power2.inOut"`. Icon: `gsap.to(icon, { rotate: isOpen ? 45 : 0, duration: 0.35 })`. Only one panel open at a time if that matches CLID's existing FAQ pattern — otherwise allow independent toggling.

### 3.4 Team/advisor card hover reveal
- **Effect:** Hovering a person's card reveals their tagline/region tags sliding up from the bottom over a slight dark overlay fade-in.
- **Build:** Overlay `opacity: 0 → 0.85`, tag text `yPercent: 100 → 0`, both `duration: 0.35`, `ease: power2.out`, on `mouseenter`; reverse on `mouseleave`.

### 3.5 Staggered blog/resource card grid entrance
- **Effect:** Article/resource cards fade+rise into view in a staggered grid pattern (row-by-row or diagonally) rather than all at once.
- **Build:** `gsap.from(".insp-resource-card", { y: 30, opacity: 0, duration: 0.6, stagger: { each: 0.08, grid: "auto", from: "start" }, scrollTrigger: { trigger: gridContainer, start: "top 85%" } })`.

### 3.6 Alternating CTA blocks with icon bounce
- **Effect:** The "Vendre / Acheter" split CTA blocks — icon does a small looping bounce/breathing scale (`scale: 1 → 1.05 → 1`, `yoyo: true`, `repeat: -1`, slow ~2s cycle) to draw the eye without being distracting, on top of a standard scroll-in reveal for the block itself.

---

## 4. Suggested prioritization if you don't want to do all of this at once

**High impact, low risk (do first):**
- 1.1 / 2.4 split-text heading reveals
- 1.4 count-up stats
- 2.2 magnetic hover on primary CTAs
- 3.3 FAQ accordion smoothing
- 1.7 / 2.7 logo or trust-badge marquee

**Medium effort, high visual payoff:**
- 2.5 stacking sticky cards for a features/how-it-works section
- 3.2 numbered step list with drawing connector line
- 1.2 scroll-synced product image swap (only if CLID has an analogous product-screenshot section)

**Do last / optional (heavier or more decorative):**
- 2.1 Lenis smooth scroll (only if not already present — check first)
- 2.9 interactive dot grid background
- 2.6 number odometer (nice-to-have upgrade over plain count-up)
- 1.5 draggable testimonial carousel (only if Draggable plugin license is available)

---

## 5. What to hand the agent as the actual task prompt

When you brief the coding agent, tell it explicitly:
> "Implement the animations described in this document on the CLID codebase using GSAP + ScrollTrigger. Do not modify any existing components, styles, color variables, or animations already present on the site — only add new, namespaced (`insp-`) components/sections or additively enhance elements I point you to. Confirm with me before adding any new global library (like Lenis) or paid GSAP plugin (Draggable, Flip). Implement one animation at a time, in the priority order in section 4, and show me each one before moving to the next."
