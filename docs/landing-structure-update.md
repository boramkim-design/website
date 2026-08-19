# Landing Page — Hero → Case Studies Structure Update

**Scope:** structure, layout, spacing, and motion only.

**Do not change:** any font family, any type scale token, or any color token. Every
font and color value below references a token that already exists in
`app/tokens.css` (§2.1 and §9.2 of `docs/design-system.md`).

**Do not introduce:** new hex values, new font families, new entries in the §3.2
type scale. Sections 0a and 0b below add two token groups — those are the only new
tokens permitted, and they go in `app/tokens.css`, never inline in a component.

Everything else in this file is a layout number — spacing, position, ratio,
duration — and belongs in the component.

---

## 0a. New tokens: elevation

The system has no elevation tokens. Case study cards are white on a white section,
so they read as cards through shadow rather than a fill difference.

```css
:root {
  /* ── Elevation ───────────────────────────────── */
  --shadow-card:       0 1px 2px rgb(26 23 20 / .05),
                       0 6px 20px rgb(26 23 20 / .07);
  --shadow-card-hover: 0 2px 4px rgb(26 23 20 / .06),
                       0 14px 32px rgb(26 23 20 / .11);
}
```

Both are two-layer: a tight contact shadow that defines the card edge, plus a wide
ambient shadow that produces the lift. A single-layer shadow blurs on white without
ever resolving into an edge. The rgb values are `--color-ink` (#1A1714) at low
alpha, so the shadow stays warm and belongs to the palette instead of reading as
neutral gray.

Do not add further elevation levels. Two is the whole set.

---

## 0b. New token: wide measure — amends §4.1

§4.1 states one width for everything. Card grids need a second one: at `--measure`
(52rem) a two-up grid gives ~400px cards that huddle in the centre of a desktop
viewport. Raising `--measure` itself is not the fix — 52rem is the correct prose
measure and widening it damages case study reading.

```css
:root {
  --measure-wide: 72rem;   /* card grids only */
}
```

**Add this sentence to §4.1 of `docs/design-system.md`:**

> `--measure-wide` (72rem) is permitted for card grids only — the landing page case
> study grid and the projects index. Prose, figures, video, and all case study page
> content always use `--measure`. There is no third width.

Two container utilities, and no component sets its own `max-width`:

```css
.measure      { width:100%; max-width:var(--measure);      margin-inline:auto; padding-inline:var(--page-gutter); }
.measure-wide { width:100%; max-width:var(--measure-wide); margin-inline:auto; padding-inline:var(--page-gutter); }
```

Hero content uses `.measure`. The case studies section uses `.measure-wide`.

---

## 1. Hero → page background transition

Remove any hard color boundary between the hero and the section below it. The hero
carries the transition itself via a background gradient. **No divider element** —
no wave, no SVG shape, no border, no separator of any kind. The gradient is the
entire transition.

```css
.hero {
  position: relative;
  min-height: 100svh;
  display: grid;
  place-items: center;
  padding: 6.5rem 0 5.75rem;   /* top clears the header, bottom clears the scroll cue */
  overflow: hidden;
  color: var(--landing-ink);

  background: linear-gradient(
    to bottom,
    var(--landing-bg) 0%,
    var(--landing-bg) 72%,
    var(--color-paper) 100%
  );
}
```

Notes:
- Flat `--landing-bg` for the top 72%, fading to `--color-paper` across the bottom
  28%. Only the fade region changes; the hero still reads as the warm landing
  surface. The section below sits on `--color-paper` with no seam.
- `100svh`, not `100vh` — prevents the mobile URL bar from adding a dead strip
  below the fold.
- Hero content is vertically centred by `place-items: center`. Do not add vertical
  margins to the inner block to position it.

---

## 2. Floating side-quest emoji (§9.3 motion exception)

Eight emoji arranged as a ring around the centred hero content — not scattered.
An absolutely positioned layer behind the content, `aria-hidden="true"`.

```css
.orbit { position: absolute; inset: 0; z-index: 1; pointer-events: none; }

.orbit span {
  position: absolute;
  font-size: clamp(2.125rem, 3.4vw, 3.125rem);   /* 34 → 50px */
  filter: drop-shadow(0 8px 16px rgb(22 24 29 / .12));
  animation: float 6.5s ease-in-out infinite;
}
```

All eight, in DOM order:

| # | Emoji | top | horizontal | rotate | animation-delay |
|---|-------|-----|-----------|--------|-----------------|
| 1 | 🎓 | 11% | `left:50%; margin-left:-1.5rem` | -6deg  | 0s |
| 2 | 🥨 | 19% | `left:19%`  | -12deg | -0.9s |
| 3 | 🍁 | 18% | `right:18%` | 9deg   | -1.8s |
| 4 | 🇰🇷 | 47% | `left:11%`  | 4deg   | -2.7s |
| 5 | 🎹 | 47% | `right:11%` | -4deg  | -3.6s |
| 6 | 🏔️ | 70% | `left:19%`  | 7deg   | -4.5s |
| 7 | 🧑 | 68% | `right:19%` | -8deg  | -5.4s |
| 8 | 📺 | 79% | `left:50%; margin-left:-1.5rem` | 3deg | -6s |

```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-0.75rem); }
}
```

Notes:
- All positions are percentages so the ring scales with the hero rather than
  drifting apart on large screens.
- The staggered negative delays are load-bearing — without them the eight bob in
  unison and read as a single moving block.
- This layer is positioned against the full hero, not `.measure`. It is ambient
  background, not content, and is the one exception to the container rule.
- Responsive: hide #4 and #5 below `900px`; additionally hide #6 and #7 below
  `620px`. The ring narrows rather than overlapping the headline.

---

## 3. Scroll cue

A single centred affordance pinned to the bottom of the hero. It is a real anchor
link to `#work`, not decoration.

**Copy: `What I've built`** — first person, matching the hero's voice
("They give me more ways to see..."). Do not use "Selected work" or "See the work".

```css
.scroll-cue {
  position: absolute;
  bottom: 1.75rem;
  left: 50%;
  translate: -50% 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4375rem;

  font-family: var(--font-accent);
  font-size: var(--text-eyebrow);
  font-weight: 600;
  letter-spacing: var(--tracking-accent);
  text-transform: uppercase;
  color: var(--color-ink-muted);
  text-decoration: none;
}

.scroll-cue svg { animation: nudge 2.2s ease-in-out infinite; }

@keyframes nudge {
  0%, 100% { transform: translateY(0);        opacity: .4; }
  50%      { transform: translateY(.375rem);  opacity: 1; }
}
```

Arrow markup — 16×16, `currentColor`, stroke only:

```html
<a class="scroll-cue" href="#work">
  What I've built
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 2v11M3.5 9L8 13.5 12.5 9"
          stroke="currentColor" stroke-width="1.7"
          stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</a>
```

Drops to `bottom: 1rem` below `620px`.

---

## 4. Case Studies section

```css
.work {
  background: var(--color-paper);
  padding: clamp(3rem, 6vw, 5rem) 0 clamp(5rem, 12vw, 8.75rem);
}

.work-head { text-align: center; margin-bottom: clamp(2.5rem, 5vw, 3.75rem); }

.work-head h2 {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: var(--text-h1);          /* not --text-h2 */
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  color: var(--color-ink);
}
```

Required:
- **No eyebrow above the heading.** Do not render `SELECTED WORK` or any other
  small-caps label above `Case Studies`. The scroll cue already announces the
  section from above, and two tracked-out uppercase labels stacked ~60px apart read
  as one broken label rather than two elements.
- **Centred heading.** The hero is centre-aligned; the heading holds the same
  vertical axis so the eye does not jump left at the section change.
- The heading uses `--text-h1`, not `--text-h2`. It needs to outweigh the scroll
  cue sitting directly above it — the size and weight gap is what separates them,
  which is why the top padding can stay modest.

---

## 5. Case study cards

Four cases, in a fixed two-column grid inside `.measure-wide`.

```
┌──────────────────────────┐  ┌──────────────────────────┐
│ ┌──────────────────────┐ │  │ ┌──────────────────────┐ │
│ │      thumbnail       │ │  │ │      thumbnail       │ │   3:2
│ └──────────────────────┘ │  │ └──────────────────────┘ │
│ (tag) (tag)              │  │ (tag) (tag)              │
│ Title                    │  │ Title                    │
│ Two lines of description │  │ Two lines of description │
└──────────────────────────┘  └──────────────────────────┘
┌──────────────────────────┐  ┌──────────────────────────┐
│           ...            │  │           ...            │
└──────────────────────────┘  └──────────────────────────┘
```

```css
.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.75rem;
}

.case {
  display: block;
  background: var(--color-paper);
  border-radius: 1rem;
  padding: 0.875rem 0.875rem 1.5rem;
  box-shadow: var(--shadow-card);
  text-decoration: none;
  color: inherit;
  transition: box-shadow 180ms cubic-bezier(.22,.61,.36,1),
              transform  180ms cubic-bezier(.22,.61,.36,1);
}
.case:hover { box-shadow: var(--shadow-card-hover); transform: translateY(-3px); }

.thumb {
  aspect-ratio: 3 / 2;
  border-radius: 0.625rem;
  background: var(--color-brand-soft);
  margin-bottom: 1.25rem;
  display: grid;
  place-items: center;
}

.case-body { padding-inline: 0.625rem; }

.tags { display: flex; gap: 0.4375rem; flex-wrap: wrap; margin-bottom: 0.6875rem; }

.tag {
  padding: 0.3125rem 0.6875rem;
  border-radius: 999px;
  background: var(--color-brand-soft);
  font-family: var(--font-body);
  font-size: var(--text-caption);
  font-weight: 500;
  color: var(--color-ink-muted);
  line-height: 1;
}

.case h3 {
  margin: 0 0 0.5rem;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--text-h4);
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-tight);
  color: var(--color-ink);
}

.case p {
  margin: 0;
  font-size: var(--text-body-sm);
  line-height: var(--leading-body);
  color: var(--color-ink-secondary);
}
```

Notes:
- **Two columns, fixed — not `auto-fit`.** At `--measure-wide` an
  `auto-fit`/`minmax` grid resolves to three columns and strands the fourth card
  alone on the second row.
- Collapses to a single column below `46rem`, with `gap: 1.25rem`.
- **No border on the card.** It reads as a card purely through `--shadow-card`. A
  hairline plus a shadow on white doubles the edge and reads heavier than either
  alone.
- Only two surfaces appear inside the card: white (the card itself) and
  `--color-brand-soft` (thumbnail block and tag pills). The thumbnail and tags
  sharing one tint is intentional — it keeps the card to two tones.
- The thumbnail is `3:2`, not `4:3`. At the wider card size a 4:3 block takes over
  the card's whole height.
- The whole card is one `<a>`. Do not nest a separate "View case study" link inside.
- Hover deepens the shadow and lifts 3px. No scale, no border appearing on hover.
- No metric block on the landing card. Impact numbers live on the case study page.

---

## 6. Reveal motion

The heading and each card fade up on entry, staggered 90ms apart in DOM order.

- Start: `opacity: 0`, `translateY(1.25rem)`
- End: `opacity: 1`, `translateY(0)`
- Duration `560ms`, easing `cubic-bezier(.22,.61,.36,1)`
- Fires once, at ~16% visibility. Do not re-animate on scroll back up.

Implement with Motion (`whileInView` + `viewport={{ once: true, amount: 0.16 }}`),
not a hand-rolled IntersectionObserver.

Per §5.5, under `prefers-reduced-motion: reduce`:
- Reveal renders in its final state immediately.
- The emoji float and the arrow nudge do not run.
- `scroll-behavior` falls back to `auto`.

---

## 7. Header

Unchanged in structure: brand mark and name on the left, nav pill centred, icon
button on the right, `position: absolute` over the hero. Below `900px` it wraps and
centres. Do not convert it to `position: fixed` — it belongs to the hero, and
fixing it puts a persistent bar over the case study cards.

---

## 8. Content still to be filled

Cards three and four are placeholders in the mockup. Real content needed for both,
including tags. Card descriptions run two lines and should state the problem and
the turn — the outcome belongs on the case study page, not the landing card.
