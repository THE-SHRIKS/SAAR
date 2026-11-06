import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Header: solid once the page scrolls; mobile menu.
const header = document.querySelector<HTMLElement>("[data-hdr]");
if (header) {
  const dark = header.dataset.tone === "dark";
  const update = () => {
    if (dark) header.dataset.solid = window.scrollY > window.innerHeight * 0.6 ? "true" : "false";
  };
  update();
  window.addEventListener("scroll", update, { passive: true });

  const toggle = header.querySelector<HTMLButtonElement>("[data-menu]");
  toggle?.addEventListener("click", () => {
    const open = header.dataset.open !== "true";
    header.dataset.open = String(open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Close" : "Menu";
  });
  header.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      header.dataset.open = "false";
      if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "Menu";
      }
    }),
  );
}

// Hero video: pause when off screen.
const video = document.querySelector<HTMLVideoElement>(".hero__video");
if (video) {
  new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? void video.play().catch(() => undefined) : video.pause()));
  }).observe(video);
}

if (!reduced) {
  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis({
    duration: 1.5,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    wheelMultiplier: 0.9,
    anchors: { offset: -96 },
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Hero: the film drifts slower than the page, the copy lifts away.
  const hero = document.querySelector<HTMLElement>(".hero");
  const body = document.querySelector<HTMLElement>(".hero__body");
  if (hero && body) {
    gsap.to(body, { yPercent: -10, opacity: 0.2, ease: "none", scrollTrigger: { trigger: hero, start: "35% top", end: "bottom top", scrub: true } });
  }

  // Sections and rows ease in.
  document.querySelectorAll<HTMLElement>(".reveal").forEach((el) => {
    const staggered = el.matches("[data-stagger]");
    if (staggered) gsap.set(el, { opacity: 1, y: 0 });
    const kids = staggered ? [...el.children] : [el];
    gsap.fromTo(
      kids,
      { opacity: 0, y: 32 },
      { opacity: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.08, scrollTrigger: { trigger: el, start: "top 86%", once: true } },
    );
  });
} else {
  document.documentElement.classList.remove("js");
}

export {};
