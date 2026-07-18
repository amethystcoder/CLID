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
   STORY PANEL REVEALS (no snap)
========================= */
const panels = gsap.utils.toArray(".story-panel");

panels.forEach((panel) => {
  const h2 = panel.querySelector("h2");
  const paragraphs = panel.querySelectorAll(".secondary, p");

  if (h2) {
    gsap.fromTo(
      h2,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: panel,
          start: "top 80%",
          end: "top 60%",
          toggleActions: "play none none reverse",
        },
      }
    );
  }

  if (paragraphs.length > 0) {
    gsap.fromTo(
      paragraphs,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 0.2,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: panel,
          start: "top 75%",
          end: "top 50%",
          toggleActions: "play none none reverse",
        },
      }
    );
  }
});

/* =========================
   HERO ANIMATION
========================= */
gsap.fromTo(
  ".story-hero .story-panel__inner",
  { opacity: 0, y: 30 },
  { opacity: 1, y: 0, duration: 1.2, ease: "power2.out", delay: 0.3 }
);

ScrollTrigger.refresh();
