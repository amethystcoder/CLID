gsap.registerPlugin(ScrollTrigger);

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

const panels = gsap.utils.toArray(".story-panel");

ScrollTrigger.create({
  snap: 1 / (panels.length - 1),
  duration: { min: 0.2, max: 0.6 },
  delay: 0.1,
  ease: "power2.inOut"
});

panels.forEach((panel) => {
  const heading = panel.querySelector('h2');
  const paragraphs = panel.querySelectorAll('.secondary, p');
  const ctas = panel.querySelectorAll('.cta-button');

  if (heading) {
    gsap.fromTo(heading,
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
          toggleActions: "play none none reverse"
        }
      }
    );
  }

  if (paragraphs.length > 0) {
    gsap.fromTo(paragraphs,
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
          toggleActions: "play none none reverse"
        }
      }
    );
  }

  if (ctas.length > 0) {
    gsap.fromTo(ctas,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        delay: 0.4,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: panel,
          start: "top 70%",
          end: "top 45%",
          toggleActions: "play none none reverse"
        }
      }
    );
  }
});

ScrollTrigger.refresh();