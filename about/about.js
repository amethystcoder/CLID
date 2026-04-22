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

lenis.on("scroll", ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

/* =========================
   FADE-IN ANIMATIONS FOR ABOUT PAGE
========================= */
const panels = gsap.utils.toArray(".story-panel");

/* Add snapping */
ScrollTrigger.create({
  snap: 1 / (panels.length - 1), // snap to each section
  duration: { min: 0.2, max: 0.6 },
  delay: 0.1,
  ease: "power2.inOut"
});

panels.forEach((panel, index) => {
  const h2 = panel.querySelector('h2');
  const paragraphs = panel.querySelectorAll('.secondary, p');
  const lists = panel.querySelectorAll('ul, li');
  const buttons = panel.querySelectorAll('a');

  // Animate heading immediately
  if (h2) {
    gsap.fromTo(h2, 
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
          scrub: false,
          toggleActions: "play none none reverse"
        }
      }
    );
  }

  // Animate paragraphs with delay
  if (paragraphs.length > 0) {
    gsap.fromTo(paragraphs, 
      { opacity: 0, y: 50 }, 
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.9, 
        delay: 0.2,
        ease: "power2.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: panel,
          start: "top 75%",
          end: "top 50%",
          scrub: false,
          toggleActions: "play none none reverse"
        }
      }
    );
  }

  // Animate lists and other elements with more delay
  if (lists.length > 0) {
    gsap.fromTo(lists, 
      { opacity: 0, y: 40 }, 
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.8, 
        delay: 0.4,
        ease: "power2.out",
        stagger: 0.05,
        scrollTrigger: {
          trigger: panel,
          start: "top 70%",
          end: "top 45%",
          scrub: false,
          toggleActions: "play none none reverse"
        }
      }
    );
  }

  // Animate buttons last
  if (buttons.length > 0) {
    gsap.fromTo(buttons, 
      { opacity: 0, y: 30 }, 
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.7, 
        delay: 0.6,
        ease: "power2.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: panel,
          start: "top 65%",
          end: "top 40%",
          scrub: false,
          toggleActions: "play none none reverse"
        }
      }
    );
  }
});

/* =========================
   HERO ANIMATION
========================= */
gsap.fromTo(".story-hero .story-panel__inner",
  {
    opacity: 0,
    y: 30
  },
  {
    opacity: 1,
    y: 0,
    duration: 1.2,
    ease: "power2.out",
    delay: 0.3
  }
);

/* =========================
   FINAL FIX
========================= */
ScrollTrigger.refresh();