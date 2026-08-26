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

// Hero icon-bubble entrance: burst out of the "side quests." anchor point
// and settle into an arch above the headline, at every viewport width — the
// arch's own scale-to-fit math (see computeArchTargets) keeps it on-screen
// even on narrow phones, so there's no separate mobile layout to fall back to.
const heroSection = document.querySelector(".hero");
const heroHighlight = document.querySelector(".hero-content .highlight");
const archBubbles = [...bubbles];

if (heroSection && heroHighlight && archBubbles.length) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const centerIndex = (archBubbles.length - 1) / 2;
  let hasPlayed = false;

  // Circular arch: badge i's angle is (i - center) * (42.5 / (n-1)) degrees,
  // spread across -21.25deg..+21.25deg regardless of badge count. x/y offsets
  // from the apex follow the standard parametric-circle formulas at radius
  // 1306px at full scale (~900px total width, ~80px depth) — computeArchTargets
  // scales that radius down on narrower viewports so it still fits.
  const ARCH_RADIUS = 1306;
  const ARCH_SPAN_DEGREES = 42.5;
  const ARCH_STEP_DEGREES = ARCH_SPAN_DEGREES / (archBubbles.length - 1);
  const toRad = (deg) => (deg * Math.PI) / 180;

  const getSampleBubbleRadius = () => {
    const sampleCircle = archBubbles[Math.round(centerIndex)].querySelector(".bubble-circle");
    return (sampleCircle ? sampleCircle.getBoundingClientRect().height : 70) / 2;
  };

  // Apex sits on the horizontal midpoint between "designer" and "few" in
  // the headline's first line.
  const getApexViewportX = () => {
    const headingEl = document.querySelector(".hero-content h1");
    if (!headingEl) return heroHighlight.getBoundingClientRect().left;
    const textNode = [...headingEl.childNodes].find(
      (n) => n.nodeType === Node.TEXT_NODE && n.textContent.includes("designer")
    );
    if (!textNode) return heroHighlight.getBoundingClientRect().left;
    const text = textNode.textContent;
    const startIdx = text.indexOf("designer");
    const fewIdx = text.indexOf("few");
    if (startIdx === -1 || fewIdx === -1) return heroHighlight.getBoundingClientRect().left;
    const range = document.createRange();
    range.setStart(textNode, startIdx);
    range.setEnd(textNode, fewIdx + "few".length);
    const rect = range.getBoundingClientRect();
    return rect.left + rect.width / 2;
  };

  const computeArchTargets = () => {
    const anchorRect = heroHighlight.getBoundingClientRect();
    const anchorViewportX = anchorRect.left + anchorRect.width / 2;
    const anchorViewportY = anchorRect.top + anchorRect.height / 2;

    const apexViewportX = getApexViewportX();
    const bubbleRadius = getSampleBubbleRadius();
    const archClearance = 24; // min gap between the arch's lowest point and the headline's top

    // Scale the arch down so it actually fits around the apex on this
    // viewport, instead of just shrinking proportionally with viewport width
    // (a flat viewport/900 ratio still overflowed narrower screens, since the
    // arch's own unscaled width is wider than 900px to begin with). Measured
    // against how much room really exists between the apex and each edge of
    // .hero-content, not just the raw viewport width.
    // bubbleRadius itself isn't scaled (only the arch's own geometry is), so
    // it has to come off the available budget *before* dividing to get the
    // scale — folding it into the same ratio as the geometric half-width
    // undercorrected: the badge's un-scaled radius still got added back on
    // top at the edge, overshooting the fit by bubbleRadius * (1 - scale).
    const halfSpanRad = toRad(ARCH_STEP_DEGREES * centerIndex);
    const naturalArcHalfWidth = ARCH_RADIUS * Math.sin(halfSpanRad);
    const heroContentEl = document.querySelector(".hero-content");
    const gutter = heroContentEl ? parseFloat(getComputedStyle(heroContentEl).paddingLeft) || 0 : 0;
    const availableHalfWidth = Math.min(apexViewportX, window.innerWidth - apexViewportX) - gutter - bubbleRadius;
    const archScale = naturalArcHalfWidth > 0
      ? Math.max(0.15, Math.min(1, availableHalfWidth / naturalArcHalfWidth))
      : 1;
    const radius = ARCH_RADIUS * archScale;
    const edgeDrop = radius * (1 - Math.cos(halfSpanRad));
    const headingEl = document.querySelector(".hero-content h1");
    const headingRect = (headingEl || heroHighlight).getBoundingClientRect();
    const apexViewportY = headingRect.top - archClearance - bubbleRadius - edgeDrop;

    return archBubbles.map((el, i) => {
      const container = el.parentElement;
      const containerRect = container.getBoundingClientRect();
      const anchorX = anchorViewportX - containerRect.left;
      const anchorY = anchorViewportY - containerRect.top;
      const thetaDeg = (i - centerIndex) * ARCH_STEP_DEGREES;
      const thetaRad = toRad(thetaDeg);
      const xOffset = radius * Math.sin(thetaRad);
      const yOffset = radius * (1 - Math.cos(thetaRad));
      const finalX = apexViewportX + xOffset - containerRect.left;
      const finalY = apexViewportY + yOffset - containerRect.top;
      return { el, anchorX, anchorY, finalX, finalY };
    });
  };

  // Post-entrance "click me" wave: a left-to-right sweep of pulses across
  // the settled badges, repeated a few times then stopped for good — a
  // one-off nudge, not an ongoing distraction next to the headline.
  // Gap between each badge's pulse start, left to right. Needs to be a large
  // enough fraction of the pulse's own 0.4s duration that only 2-3 adjacent
  // badges are ever mid-pulse at once — at 90ms, 4-5 of the 6 were active
  // simultaneously and it read as one synchronized swell instead of a sweep.
  const WAVE_STAGGER_MS = 150;
  const WAVE_ENTRANCE_DELAY_MS = (archBubbles.length - 1) * 80 + 600; // matches the arch entrance's own total run time
  const WAVE_REPEATS = 3;
  const WAVE_INTERVAL_MS = 1500;
  let waveTimers = [];
  // Separate from waveTimers.length: a click before the sequence has even
  // been scheduled (still mid-entrance) must permanently suppress it too,
  // not just clear whatever timers happen to exist at that moment.
  let waveCancelled = false;

  const stopWave = () => {
    waveCancelled = true;
    waveTimers.forEach(clearTimeout);
    waveTimers = [];
    archBubbles.forEach((el) => el.querySelector(".bubble-circle").classList.remove("wave-pulse"));
  };

  const playWaveSweep = () => {
    if (waveCancelled) return;
    archBubbles.forEach((el, i) => {
      waveTimers.push(
        setTimeout(() => {
          const circle = el.querySelector(".bubble-circle");
          circle.classList.remove("wave-pulse");
          void circle.offsetWidth; // restart the animation if it's still mid-pulse from a prior sweep
          circle.classList.add("wave-pulse");
          circle.addEventListener("animationend", () => circle.classList.remove("wave-pulse"), { once: true });
        }, i * WAVE_STAGGER_MS)
      );
    });
  };

  const startWaveSequence = () => {
    if (prefersReducedMotion || waveCancelled) return;
    for (let w = 0; w < WAVE_REPEATS; w++) {
      waveTimers.push(setTimeout(playWaveSweep, WAVE_ENTRANCE_DELAY_MS + w * WAVE_INTERVAL_MS));
    }
  };

  const playArchEntrance = () => {
    const targets = computeArchTargets();

    targets.forEach(({ el, anchorX, anchorY, finalX, finalY }, i) => {
      el.style.setProperty("--anchor-x", `${anchorX}px`);
      el.style.setProperty("--anchor-y", `${anchorY}px`);
      el.style.setProperty("--final-x", `${finalX}px`);
      el.style.setProperty("--final-y", `${finalY}px`);
      el.style.setProperty("--arch-delay", `${i * 80}ms`);

      if (prefersReducedMotion) {
        el.style.animation = "none";
        el.style.left = `${finalX}px`;
        el.style.top = `${finalY}px`;
        el.style.opacity = "1";
        el.style.transform = "translate(-50%, -50%) scale(1)";
      }

      el.classList.add("is-positioned");
    });

    hasPlayed = true;
    startWaveSequence();
  };

  const snapToArch = () => {
    computeArchTargets().forEach(({ el, finalX, finalY }) => {
      el.style.setProperty("--final-x", `${finalX}px`);
      el.style.setProperty("--final-y", `${finalY}px`);
      el.style.left = `${finalX}px`;
      el.style.top = `${finalY}px`;
    });
  };

  const startArch = () => {
    if (hasPlayed) return;
    playArchEntrance();
  };

  const runWhenReady = () => {
    const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    fontsReady.then(startArch);
  };

  if (document.readyState === "complete") runWhenReady();
  else window.addEventListener("load", runWhenReady);

  let archResizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(archResizeTimer);
    archResizeTimer = setTimeout(() => {
      if (hasPlayed) {
        snapToArch();
      } else {
        startArch();
      }
      if (heroCard.classList.contains("is-open")) closeIconCard();
    }, 150);
  });

  // Shared story card: one instance, repositioned and repopulated per
  // click rather than a separate speech-bubble tooltip per badge. Reuses
  // the clicked badge's own icon (no separate emoji) and always opens
  // directly above the clicked badge, clamped horizontally so it never
  // runs off the hero's edges.
  const heroCard = document.getElementById("iconStoryCard");
  const heroCardIcon = document.getElementById("iconStoryIcon");
  const heroCardTitle = document.getElementById("iconStoryTitle");
  const heroCardDesc = document.getElementById("iconStoryDesc");
  const CARD_EDGE_MARGIN = 8;
  const CARD_GAP_ABOVE_BADGE = 8;
  let activeBubble = null;

  const closeIconCard = () => {
    if (!activeBubble) return;
    activeBubble.classList.remove("active");
    activeBubble = null;
    heroCard.classList.remove("is-open");
    heroCard.setAttribute("aria-hidden", "true");
  };

  const openIconCard = (bubble) => {
    const circle = bubble.querySelector(".bubble-circle");
    const svg = circle.querySelector("svg");

    heroCardIcon.innerHTML = "";
    if (svg) heroCardIcon.appendChild(svg.cloneNode(true));
    heroCardTitle.textContent = bubble.dataset.title || "";
    heroCardDesc.textContent = bubble.dataset.desc || "";

    const heroRect = heroSection.getBoundingClientRect();
    const clickedRect = circle.getBoundingClientRect();
    // Measured live, not a hardcoded constant — the card's CSS width is
    // itself responsive (narrower on small phones), so a fixed number here
    // would drift out of sync with what's actually rendered.
    const halfCard = heroCard.getBoundingClientRect().width / 2;
    const minX = heroRect.left + CARD_EDGE_MARGIN + halfCard;
    const maxX = heroRect.right - CARD_EDGE_MARGIN - halfCard;
    const rawX = clickedRect.left + clickedRect.width / 2;
    const targetX = Math.max(minX, Math.min(maxX, rawX));
    const targetY = clickedRect.top - CARD_GAP_ABOVE_BADGE;

    heroCard.style.left = `${targetX - heroRect.left}px`;
    heroCard.style.top = `${targetY - heroRect.top}px`;

    archBubbles.forEach((b) => b.classList.remove("active"));
    bubble.classList.add("active");
    activeBubble = bubble;
    heroCard.classList.add("is-open");
    heroCard.setAttribute("aria-hidden", "false");
  };

  archBubbles.forEach((bubble) => {
    const circle = bubble.querySelector(".bubble-circle");
    circle.addEventListener("click", (e) => {
      e.stopPropagation();
      stopWave();
      const wasActive = bubble === activeBubble;
      closeIconCard();
      if (!wasActive) openIconCard(bubble);
    });
  });

  document.addEventListener("click", closeIconCard);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeIconCard();
  });

  // Close the card once the hero has scrolled fully out of view — otherwise
  // it stays pinned mid-screen over whatever section comes next.
  const heroExitObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) closeIconCard();
    });
  });
  heroExitObserver.observe(heroSection);
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

  let drag = null;
  stage.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX, y: e.clientY, tx, ty };
    stage.classList.add("is-dragging");
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!drag) return;
    tx = drag.tx + (e.clientX - drag.x);
    ty = drag.ty + (e.clientY - drag.y);
    clamp();
    apply();
  });
  const endDrag = () => { drag = null; stage.classList.remove("is-dragging"); };
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);
});
