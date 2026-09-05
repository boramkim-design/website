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

/* ---------- Hero headline: "learnable" untangles ---------- */
// The knot under the word pulls itself straight while the letters unwind from
// crooked to level. Driven by a rAF loop that recomputes the path's points and
// writes `d` every frame, rather than by a CSS transition, keyframe or
// stroke-dashoffset — those hand the interpolation to the browser, and the
// motion is the whole point of the word, so it should not depend on that.

const untangleWord = document.querySelector(".untangle");

if (untangleWord) {
  const messy = untangleWord.querySelector(".knot-messy");
  const tidy = untangleWord.querySelector(".knot-tidy");

  const PTS = 46;  // point count shared by both shapes, so they interpolate 1:1
  const MID = 30;  // baseline y inside the 0 0 200 48 viewBox
  const DURATION_MS = 1500;

  // The tangle doubles back on itself in x — that backtracking is what makes
  // it read as a knot with real crossings instead of a tidy wave. Both ends
  // are damped by the sine envelope so the knot resolves onto the line.
  const knotPoint = (i) => {
    const p = i / (PTS - 1);
    const envelope = Math.sin(p * Math.PI);
    return [
      4 + p * 192 + Math.sin(p * Math.PI * 8.5) * 26 * envelope,
      MID + Math.sin(p * Math.PI * 12.5 + 1.1) * 17 * envelope,
    ];
  };

  const linePoint = (i) => {
    const p = i / (PTS - 1);
    return [4 + p * 192, MID - Math.sin(p * Math.PI) * 4];
  };

  const KNOT = Array.from({ length: PTS }, (_, i) => knotPoint(i));
  const LINE = Array.from({ length: PTS }, (_, i) => linePoint(i));

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const clamp01 = (v) => Math.min(1, Math.max(0, v));

  const pathAt = (t) => {
    let d = "";
    for (let i = 0; i < PTS; i++) {
      // trailing points resolve slightly after leading ones, so the knot pulls
      // straight left-to-right instead of everywhere at once
      const e = easeOut(clamp01((t - (i / PTS) * 0.35) / 0.65));
      const x = KNOT[i][0] + (LINE[i][0] - KNOT[i][0]) * e;
      const y = KNOT[i][1] + (LINE[i][1] - KNOT[i][1]) * e;
      d += (i ? "L" : "M") + x.toFixed(2) + "," + y.toFixed(2);
    }
    return d;
  };

  // The per-letter spans are in the markup, not built here: injecting the word
  // meant the headline rendered as "I make complex systems ." until the script
  // ran, then reflowed once the letters landed. In the markup it also survives
  // the script failing outright.
  const letters = [...untangleWord.querySelectorAll(".ch")];

  const draw = (t) => {
    const d = pathAt(t);
    messy.setAttribute("d", d);
    tidy.setAttribute("d", d);
    // the gray knot hands off to the accent line as it resolves
    messy.style.opacity = String(Math.max(0, 1 - t * 1.6));
    tidy.style.opacity = String(clamp01((t - 0.35) / 0.5));
    // The letters hold their exact position — earlier they rotated and rose
    // into place, and even though the h1 box never actually changed size
    // (measured: 832x53 throughout), the splaying read as the whole sentence
    // resizing. Colour is the one property that can resolve left-to-right
    // without moving anything.
    letters.forEach((span, i) => {
      const e = easeOut(clamp01((t - i * 0.035) / 0.6));
      span.style.color =
        "color-mix(in srgb, var(--yellow) " + (e * 100).toFixed(1) + "%, var(--gray))";
    });
  };

  const knot = untangleWord.querySelector(".untangle-knot");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced) {
    draw(1);
  } else {
  // Nothing is drawn until the display face has settled. The headline is
  // centred, so when the fallback face swaps out the whole sentence shifts
  // sideways (measured: 19.5px) — landing on top of the knot animation, which
  // made the entire line look like it was part of the motion. The page now
  // loads the face with font-display: block, so the text simply appears at its
  // final metrics, and the knot waits for that moment before it starts.
  knot.style.visibility = "hidden";
  draw(0);

  const start = () => {
    knot.style.visibility = "";
    const step = (ts) => {
      if (step.begin === undefined) step.begin = ts;
      const t = Math.min(1, (ts - step.begin) / DURATION_MS);
      draw(t);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // never leave the knot hidden if font loading stalls or rejects
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  let started = false;
  const startOnce = () => { if (!started) { started = true; start(); } };
  fontsReady.then(startOnce, startOnce);
  setTimeout(startOnce, 3000);
  }
}

const contactForm = document.getElementById("contactForm");

if (contactForm) {
  const contactSubmit = contactForm.querySelector(".contact-submit");
  const contactMessage = document.getElementById("contactFormMessage");

  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    contactSubmit.disabled = true;
    contactMessage.textContent = "Sending...";
    contactMessage.className = "contact-form-message";

    try {
      const res = await fetch(contactForm.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(contactForm),
      });
      const result = await res.json();

      if (result.success) {
        contactMessage.textContent = "Thanks — your message is on its way. I'll reply within a couple of days.";
        contactMessage.classList.add("is-success");
        contactForm.reset();
      } else {
        throw new Error(result.message || "Submission failed");
      }
    } catch (err) {
      contactMessage.textContent = "Something went wrong sending that. Please try again or email me directly.";
      contactMessage.classList.add("is-error");
    } finally {
      contactSubmit.disabled = false;
    }
  });
}

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

  // Own reveal-in pass (separate from revealEls above) so its timing isn't
  // shared with unrelated elements on other pages — reuses the same
  // .reveal/.is-visible CSS pair.
  if (reduceMotion) {
    timelineItems.forEach((el) => el.classList.add("is-visible"));
  } else {
    timelineItems.forEach((el, i) => {
      el.classList.add("reveal");
      el.style.transitionDelay = `${i * 70}ms`;
    });

    const timelineRevealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        timelineRevealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.2 });

    timelineItems.forEach((el) => timelineRevealObserver.observe(el));
  }
}

// Case study pages (e.g. urcareer.html) — shared reveal helper, since there
// are several repeating groups (section blocks, cards, stats, tradeoffs)
// instead of just one like the blocks above.
function makeReveal(elements, { threshold = 0.16, stagger = 70 } = {}) {
  if (!elements.length) return;

  if (reduceMotion) {
    elements.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  elements.forEach((el, i) => {
    el.classList.add("reveal");
    el.style.transitionDelay = `${i * stagger}ms`;
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold });

  elements.forEach((el) => observer.observe(el));
}

makeReveal(document.querySelectorAll(".cs-block"), { threshold: 0.1, stagger: 0 });
makeReveal(document.querySelectorAll(".cs-solrow"), { stagger: 90 });
makeReveal(document.querySelectorAll(".cs-card"));
makeReveal(document.querySelectorAll(".cs-rowitem"));
makeReveal(document.querySelectorAll(".cs-tocol"));
makeReveal(document.querySelectorAll(".cs-stat"));
makeReveal(document.querySelectorAll(".cs-insightbox"));

// Case study pages: highlight whichever section the reader is currently in
// on the floating side nav (.cs-casenav), mirrors the timeline logic above.
const casenavLinks = [...document.querySelectorAll(".cs-casenav a")];

if (casenavLinks.length) {
  const casenavSections = casenavLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const casenavObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      casenavLinks.forEach((link) => link.classList.remove("is-active"));
      const active = casenavLinks.find((link) => link.getAttribute("href") === `#${entry.target.id}`);
      if (active) active.classList.add("is-active");
    });
  }, { rootMargin: "-45% 0px -50% 0px" });

  casenavSections.forEach((section) => casenavObserver.observe(section));
}

// Case study pages: inline Solution-section video players. Each autoplays
// muted, can be paused/resumed with its own button, and pauses itself when
// scrolled out of view so several videos aren't all decoding at once.
const PLAY_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
const PAUSE_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';

document.querySelectorAll(".cs-video").forEach((wrap) => {
  const video = wrap.querySelector(".cs-video-el");
  const button = wrap.querySelector(".cs-video-pp");
  if (!video || !button) return;

  let userPaused = false;

  function syncButton() {
    button.innerHTML = video.paused ? PLAY_ICON : PAUSE_ICON;
    button.setAttribute("aria-label", video.paused ? "Play video" : "Pause video");
  }

  button.addEventListener("click", () => {
    userPaused = !video.paused;
    if (video.paused) video.play(); else video.pause();
  });

  video.addEventListener("play", syncButton);
  video.addEventListener("pause", syncButton);

  if (reduceMotion) {
    video.pause();
    userPaused = true;
  }
  syncButton();

  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (!userPaused) video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.3 });

  videoObserver.observe(wrap);
});

// Case study pages: pan/zoom diagram viewer (.cs-viewer) — drag to pan,
// buttons or ⌘/Ctrl+scroll to zoom, double-click to toggle, always starts
// fit-to-frame. Used for large system-map and reference-board images.
document.querySelectorAll(".cs-viewer").forEach((viewer) => {
  const stage = viewer.querySelector(".cs-vstage");
  const img = stage && stage.querySelector("img");
  if (!stage || !img) return;

  const pctLabel = viewer.querySelector(".cs-vctrl-pct");
  const slider = viewer.querySelector(".cs-vctrl-slider");
  let fit = 1, scale = 1, tx = 0, ty = 0, natW = 0, natH = 0;
  // `el` starts as the placeholder <img> and gets swapped for the inlined
  // <svg> once it's fetched — see start(). Every other function reads this
  // variable rather than closing over `img`, so the swap is transparent.
  let el = img;
  // Fixed relative to "fit", so on a narrow (mobile-width) stage the same
  // 6x ceiling used to land on much smaller absolute text than on desktop,
  // since "fit" itself is smaller there. 10x keeps a legible floor across
  // stage widths.
  const maxZoom = 10;

  // Slider covers [fit, fit*maxZoom] exponentially, same feel as the
  // precedents-matrix zoom slider — a linear scrub over that big a range
  // would bunch all the useful zoom levels into the first few pixels.
  function t2s(t) { return fit * Math.pow(maxZoom, t / 1000); }
  function s2t(s) { return 1000 * Math.log(Math.max(s / fit, 1)) / Math.log(maxZoom); }

  function apply() {
    el.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`;
    if (pctLabel) pctLabel.textContent = `${Math.round((scale / fit) * 100)}%`;
    if (slider) slider.value = String(Math.round(s2t(scale)));
  }

  function clamp() {
    const W = stage.clientWidth, H = stage.clientHeight;
    const w = natW * scale, h = natH * scale;
    tx = w <= W ? (W - w) / 2 : Math.min(0, Math.max(W - w, tx));
    ty = h <= H ? (H - h) / 2 : Math.min(0, Math.max(H - h, ty));
  }

  function fitNow() {
    if (!natW) return;
    const W = stage.clientWidth, H = stage.clientHeight;
    fit = Math.min(W / natW, H / natH);
    scale = fit;
    clamp();
    apply();
  }

  function startView() {
    fitNow();
    const z = parseFloat(stage.dataset.startZoom || "0");
    if (!z || z <= 1) return;
    const ax = parseFloat(stage.dataset.startX ?? "0.5");
    const ay = parseFloat(stage.dataset.startY ?? "0.5");
    scale = fit * z;
    tx = stage.clientWidth / 2 - ax * natW * scale;
    ty = stage.clientHeight / 2 - ay * natH * scale;
    clamp();
    apply();
  }

  function zoomAt(factor, cx, cy) {
    const ns = Math.min(Math.max(scale * factor, fit), Math.max(fit, maxZoom * fit));
    if (ns === scale) return;
    const r = stage.getBoundingClientRect();
    const px = (cx - r.left - tx) / scale, py = (cy - r.top - ty) / scale;
    scale = ns;
    tx = cx - r.left - px * scale;
    ty = cy - r.top - py * scale;
    clamp();
    apply();
  }

  function zoomCenter(factor) {
    const r = stage.getBoundingClientRect();
    zoomAt(factor, r.left + r.width / 2, r.top + r.height / 2);
  }

  function sizeAndStart() {
    // data-natural-width/height (explicit override) wins if present;
    // otherwise use whatever size was already resolved (viewBox for an
    // inlined <svg>, naturalWidth for a plain <img> fallback).
    const explicitW = parseFloat(stage.dataset.naturalWidth);
    const explicitH = parseFloat(stage.dataset.naturalHeight);
    natW = explicitW || natW || el.naturalWidth;
    natH = explicitH || natH || el.naturalHeight;
    el.style.width = `${natW}px`;
    el.style.height = `${natH}px`;
    startView();
  }

  // An <img src="*.svg"> only ever rasterizes once, at its laid-out CSS
  // size, then a CSS transform: scale() just stretches that cached bitmap
  // — fine near "fit", but it turns to mush once a viewer starts pre-zoomed
  // (the two leverage-point sub-viewers open at ~2.7x already). Fetching
  // the SVG and inlining its markup makes it a live vector element instead,
  // so the browser repaints it at full sharpness at any zoom level.
  const src = img.getAttribute("src");
  fetch(src)
    .then((r) => r.text())
    .then((svgText) => {
      const svg = new DOMParser().parseFromString(svgText, "image/svg+xml").documentElement;
      if (svg.tagName.toLowerCase() !== "svg") throw new Error("not an svg");
      svg.classList.add("cs-vmedia");
      const vb = (svg.getAttribute("viewBox") || "").trim().split(/[\s,]+/).map(Number);
      if (vb.length === 4 && vb.every((n) => !Number.isNaN(n))) {
        natW = vb[2];
        natH = vb[3];
      }
      img.replaceWith(svg);
      el = svg;
      sizeAndStart();
    })
    .catch(() => {
      // Fall back to the plain <img> (e.g. cross-origin source) rather
      // than leaving the viewer inert.
      if (img.complete && img.naturalWidth) sizeAndStart();
      else img.addEventListener("load", sizeAndStart);
    });
  // Re-run the configured view (not just fitNow) on resize — mobile browsers
  // fire resize constantly as their chrome (URL bar, etc.) shows/hides, and
  // a bare fitNow() would silently wipe a sub-viewer's pre-zoomed framing
  // back to plain Fit on every one of those.
  window.addEventListener("resize", startView);

  viewer.querySelectorAll("[data-z]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.z;
      if (action === "in") zoomCenter(1.4);
      else if (action === "out") zoomCenter(1 / 1.4);
      else fitNow();
    });
  });

  if (slider) {
    slider.addEventListener("input", () => {
      const target = t2s(parseFloat(slider.value));
      const factor = target / scale;
      if (factor && isFinite(factor)) zoomCenter(factor);
    });
  }

  stage.addEventListener("wheel", (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    zoomAt(e.deltaY < 0 ? 1.045 : 1 / 1.045, e.clientX, e.clientY);
  }, { passive: false });

  stage.addEventListener("dblclick", (e) => zoomAt(scale > fit * 1.05 ? fit / scale : 2.2, e.clientX, e.clientY));

  // Single finger/pointer pans; a second finger switches to pinch-zoom
  // (tracked by pointer id so it also works with an actual mouse+touch mix).
  let drag = null;
  let pinch = null;
  const points = new Map();

  const pinchDist = () => {
    const [a, b] = [...points.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  const pinchMid = () => {
    const [a, b] = [...points.values()];
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  };

  stage.addEventListener("pointerdown", (e) => {
    stage.setPointerCapture(e.pointerId);
    points.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (points.size === 2) {
      drag = null;
      stage.classList.remove("is-dragging");
      pinch = { dist: pinchDist() };
    } else if (points.size === 1) {
      drag = { x: e.clientX, y: e.clientY, tx, ty };
      stage.classList.add("is-dragging");
    }
  });
  stage.addEventListener("pointermove", (e) => {
    if (!points.has(e.pointerId)) return;
    points.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pinch && points.size === 2) {
      const dist = pinchDist();
      const mid = pinchMid();
      zoomAt(dist / pinch.dist, mid.x, mid.y);
      pinch.dist = dist;
      return;
    }
    if (!drag || points.size !== 1) return;
    tx = drag.tx + (e.clientX - drag.x);
    ty = drag.ty + (e.clientY - drag.y);
    clamp();
    apply();
  });
  const endDrag = (e) => {
    points.delete(e.pointerId);
    if (points.size < 2) pinch = null;
    if (points.size === 1) {
      const [[, p]] = points;
      drag = { x: p.x, y: p.y, tx, ty };
      stage.classList.add("is-dragging");
    } else {
      drag = null;
      stage.classList.remove("is-dragging");
    }
  };
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);
});

// Case study solution videos play back sped up — reapply on loadedmetadata
// since some browsers reset playbackRate once the source is actually ready.
document.querySelectorAll(".cs-video-el").forEach((video) => {
  video.playbackRate = 1.5;
  video.addEventListener("loadedmetadata", () => { video.playbackRate = 1.5; });
});
