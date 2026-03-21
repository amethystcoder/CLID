gsap.registerPlugin(ScrollTrigger);

/* =========================
   LENIS SETUP
========================= */
const lenis = new Lenis({
  duration: 1.15,
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 1.5,
});

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
    // markers: true, // uncomment while debugging
  }
});

/*
  What happens:
  - image wrapper grows from small card -> large cinematic frame
  - image inside scales slightly for a subtle zoom
  - text fades up and out
  - scroll indicator fades out
*/
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
/*
  Section 2 starts slightly lower and fades in as it comes up
  This gives the "chapter emerges over the image" effect
*/
gsap.from(".story-panel--origin .story-panel__inner", {
  y: 100,
  opacity: 0,
  ease: "power2.out",
  scrollTrigger: {
    trigger: ".story-panel--origin",
    start: "top 80%",
    end: "top 40%",
    scrub: 1,
    // markers: true,
  }
});