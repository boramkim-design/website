// Cross-page hash links (e.g. index.html#work from about.html) land with
// the browser's native jump landing at the top instead of the target section —
// the hero's dynamic viewport height (100svh) isn't settled yet when that jump
// happens. Redo it once everything (fonts, images) has actually loaded.
if (location.hash) {
  const hashTarget = document.querySelector(location.hash);
  if (hashTarget) {
    const scrollToHashTarget = () => hashTarget.scrollIntoView({ behavior: "instant" });
    if (document.readyState === "complete") scrollToHashTarget();
    else window.addEventListener("load", scrollToHashTarget);
  }
}

const burger = document.getElementById("navBurger");
const mobileMenu = document.getElementById("mobileMenu");

document.getElementById("footerYear").textContent = new Date().getFullYear();

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

// About page: photo stack — click brings a photo to the front of the pile.
const photoStackItems = document.querySelectorAll(".photo-stack-item");

if (photoStackItems.length) {
  let topZ = photoStackItems.length;
  photoStackItems.forEach((item) => {
    item.addEventListener("click", () => {
      photoStackItems.forEach((i) => i.classList.remove("is-front"));
      topZ += 1;
      item.style.zIndex = topZ;
      item.classList.add("is-front");
    });
  });
}

// About page: career timeline — highlight whichever entry is crossing the
// vertical center of the viewport as the reader scrolls.
const timelineItems = document.querySelectorAll(".timeline-item");

if (timelineItems.length) {
  const timelineObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("is-active", entry.isIntersecting);
    });
  }, { rootMargin: "-45% 0px -45% 0px" });

  timelineItems.forEach((item) => timelineObserver.observe(item));
}
