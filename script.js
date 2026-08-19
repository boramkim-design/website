const burger = document.getElementById("navBurger");
const mobileMenu = document.getElementById("mobileMenu");

burger.addEventListener("click", () => {
  const isOpen = mobileMenu.classList.toggle("open");
  burger.classList.toggle("open", isOpen);
  burger.setAttribute("aria-expanded", String(isOpen));
});

mobileMenu.querySelectorAll(".mobile-link").forEach((link) => {
  link.addEventListener("click", () => {
    mobileMenu.classList.remove("open");
    burger.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  });
});

const bubbles = document.querySelectorAll(".icon-bubble");

bubbles.forEach((bubble) => {
  const circle = bubble.querySelector(".bubble-circle");
  circle.addEventListener("click", (e) => {
    e.stopPropagation();
    const wasActive = bubble.classList.contains("active");
    bubbles.forEach((b) => b.classList.remove("active"));
    if (!wasActive) bubble.classList.add("active");
  });
});

document.addEventListener("click", () => {
  bubbles.forEach((b) => b.classList.remove("active"));
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") bubbles.forEach((b) => b.classList.remove("active"));
});

document.querySelector(".contact-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
});

// Reveal motion — docs/landing-structure-update.md §6.
// No Motion/React in this stack, so `whileInView` is implemented as a plain
// IntersectionObserver instead.
const revealEls = document.querySelectorAll(".work-head h2, .case");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (reduceMotion) {
  revealEls.forEach((el) => el.classList.add("is-visible"));
} else {
  revealEls.forEach((el, i) => {
    el.classList.add("reveal");
    el.style.transitionDelay = `${i * 90}ms`;
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.16 });

  revealEls.forEach((el) => revealObserver.observe(el));
}
