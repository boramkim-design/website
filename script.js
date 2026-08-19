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
