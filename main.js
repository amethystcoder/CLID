gsap.registerPlugin(ScrollTrigger);

/* =========================
   LENIS SETUP (FIXED)
========================= */
const lenis = new Lenis({
  duration: 1.15,
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 1.5,
});

/* Sync Lenis with GSAP */
lenis.on("scroll", ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

/* =========================
   HERO TIMELINE
========================= */
const heroTl = gsap.timeline({
  scrollTrigger: {
    trigger: ".story-hero",
    start: "top top",
    end: "bottom bottom",
    scrub: 1.2,
  }
});

heroTl
  .to(".story-hero__image-wrap", {
    width: "80vw",
    height: "80vh",
    borderRadius: "0px",
    ease: "none"
  }, 0)

  .to(".story-hero__image", {
    scale: 1.08,
    ease: "none"
  }, 0)

  .to(".story-hero__text", {
    opacity: 0,
    y: -60,
    ease: "none"
  }, 0.05)

  .to(".scroll-indicator", {
    opacity: 0,
    y: 20,
    ease: "none"
  }, 0.08);


/* =========================
   SECTION 2 REVEAL
========================= */
gsap.from(".story-panel--origin .story-panel__inner", {
  y: 100,
  opacity: 0,
  ease: "power2.out",
  scrollTrigger: {
    trigger: ".story-panel--origin",
    start: "top 80%",
    end: "top 40%",
    scrub: 1,
  }
});


/* =========================
   STORY FLOW CONTROL (FIXED)
========================= */

const panels = gsap.utils.toArray(".story-panel");
const dots = document.querySelectorAll(".story-progress__dots li");
const progressFill = document.querySelector(".story-progress__fill");

/* Ensure first panel starts active */
panels.forEach((panel, i) => {
  panel.classList.remove("is-active", "is-dim");

  if (i === 0) {
    panel.classList.add("is-active");
  } else {
    panel.classList.add("is-dim");
  }
});

/* Create triggers */
panels.forEach((panel, i) => {

  ScrollTrigger.create({
    trigger: panel,
    start: "top 55%",
    end: "bottom 45%",

    onEnter: () => activatePanel(i),
    onEnterBack: () => activatePanel(i),
  });

});


function activatePanel(index) {

  panels.forEach((p, i) => {
    p.classList.remove("is-active", "is-dim");

    if (i === index) {
      p.classList.add("is-active");
    } else {
      p.classList.add("is-dim");
    }
  });

  /* dots */
  dots.forEach(d => d.classList.remove("active"));
  if (dots[index]) dots[index].classList.add("active");

  /* progress bar (safe) */
  const total = panels.length - 1;
  const progress = total > 0 ? index / total : 0;

  gsap.to(progressFill, {
    height: `${progress * 100}%`,
    duration: 0.35,
    ease: "power2.out"
  });
}


/* =========================
   FINAL FIX
========================= */
ScrollTrigger.refresh();