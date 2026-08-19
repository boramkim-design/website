# Portfolio Design System — Boram Kim
Direction: White canvas, orange brand, one content width 
Stack: Next.js (App Router) + Tailwind CSS v4 + Motion (Framer Motion) 
Purpose: Single source of truth for building the portfolio with Claude Code.

0. How to use this file
Put this at `docs/design-system.md` in your repo and reference it in `CLAUDE.md`:

```markdown
# CLAUDE.md
Always read `docs/design-system.md` before writing or editing UI.
Never introduce a raw hex value, px font size, or arbitrary duration.
Every value must come from a token defined in `app/tokens.css`.
If a token is missing, propose adding it — don't hardcode.
```

Rules for any build session:
1. Tokens are law. No #hex, no text-[17px], no duration-[350ms] in components.
2. One width. Everything sits in `--measure`. No component sets its own max-width.
3. Build the components in Section 6 before building pages.
4. Case study pages follow the Section 7 blueprint. Don't invent new section types.
5. Every motion has a prefers-reduced-motion fallback (Section 5.5).
6. Word budgets in Section 8 are hard limits.

1. Design principles
# Principle | What it means in practice
--- | ---
1. Outcome first, story second | Impact metrics appear immediately after the hero — never buried at the bottom.
2. Headlines are claims, not labels | "One goal per week, with the tools attached to it" ✅ — "Design Solution" ❌
3. One width, no jitter | Prose, cards, figures and video all share `--measure`. Nothing steps in or out as you scroll.
4. Boxes carry the substance | Prose is connective tissue; boxed cards hold the content. A reader who only reads the boxes still gets the case.
5. Motion clarifies, never performs | Reveal, focus, transition. No scroll-jacking, no decorative particles.
6. The reader owns playback | Every video is pausable and scrubbable, and pauses itself off-screen.
7. Show the wrong turn | Each case study has one honest "this failed and here's what we changed" beat.
8. Restraint is the brand | White page, three hues, two typefaces. Personality comes from type and copy, not decoration.

2. Color
Three hues total: orange (brand), teal (secondary), and a warm neutral ramp. That's the whole palette.

2.1 Tokens
```css
:root { 
  /* ── Surface ─────────────────────────────────── */
  --color-paper: #FFFFFF; /* page background — white */
  --color-paper-sunken: #FAF8F6; /* cards, wells, quote boxes */
  --color-line: #E9E5E0; /* hairlines, dividers, card borders */
  --color-line-strong: #D5CFC7; /* hover borders, secondary buttons */
  
  /* ── Ink ─────────────────────────────────────── */
  --color-ink: #1A1714; /* headings, primary body (17.9:1) */
  --color-ink-secondary: #4A443D; /* body copy ( 9.6:1) */
  --color-ink-muted: #7C7469; /* captions, meta, eyebrow ( 4.6:1) */
  
  /* ── Brand: orange ───────────────────────────── */
  --color-brand: #EE964B; /* FILL ONLY — 2.3:1, never text on white */
  --color-brand-ink: #B25A14; /* orange text + links ( 4.8:1) */
  --color-brand-soft: #FDF1E6; /* tinted surface */
  
  /* ── Secondary: teal ─────────────────────────── */
  --color-teal: #1F6F63; /* positive metrics, 2nd accent ( 6.0:1) */
  --color-teal-soft: #E7F1EF;
  --color-focus: #B25A14;
}
```

2.2 Usage rules
- Orange has two forms and they are not interchangeable. `--color-brand` (`#EE964B`) is a fill — buttons, numbering, eyebrow rules, active nav indicator, chart bars. It fails contrast as text on white. Orange text and links use `--color-brand-ink` (`#B25A14`).
- One orange element per viewport. If two things are orange on screen, one of them is wrong.
- Teal is the number-two, not a second CTA. It marks positive metrics and the occasional secondary accent. It never competes with an orange button.
- Metrics: improvement → `--color-teal`; problem or reduction → `--color-brand-ink`; neutral → `--color-ink`.
- Primary button = orange fill + `--color-ink` text (7.7:1). Dark text on orange, not white.
- Case study imagery is the only place color runs free — the chrome stays neutral so screenshots pop.
- No dark/inverse sections. The page is white from top to bottom. Emphasis comes from `--color-brand-soft` tint, not a black band.
- No inline highlight/marker style. Emphasis in prose comes from sentence construction, not a background colour.

3. Typography
3.1 Families — two, with a clear division of labour
```css
:root {
  --font-display: "Sofia Sans","Helvetica Neue",Arial,sans-serif; /* headings */
  --font-body: "Geist",-apple-system,"Segoe UI",sans-serif; /* body copy */
  --font-accent: "Sofia Sans","Helvetica Neue",Arial,sans-serif; /* everything pointed */
}
```

3.2 Scale (fluid)
```css
:root {
  --text-display: clamp(2.75rem, 1.5rem + 5.2vw, 5rem); /* 44 → 80 hero only */
  --text-h1: clamp(2.25rem, 1.5rem + 3.0vw, 3.5rem); /* 36 → 56 page title */
  --text-h2: clamp(1.75rem, 1.35rem + 1.7vw, 2.375rem); /* 28 → 38 section */
  --text-h3: clamp(1.375rem,1.18rem + 0.8vw, 1.6875rem);/* 22 → 27 claim headline */
  --text-h4: 1.0625rem; /* 17 card title */
  --text-lead: clamp(1.125rem,1.05rem + 0.4vw, 1.375rem); /* 18 → 22 intro para */
  --text-body: 1.0625rem; /* 17 default */
  --text-body-sm: 0.9375rem; /* 15 dense UI */
  --text-caption: 0.875rem; /* 14 figure caption */
  --text-eyebrow: 0.8125rem; /* 13 section label */
  --text-metric: clamp(2.5rem, 1.8rem + 3.0vw, 3.75rem); /* 40 → 60 stat number */
  
  --leading-display: 1.0; 
  --leading-tight: 1.10;
  --leading-snug: 1.35;
  --leading-body: 1.72; /* generous — compensates for the single wide measure */
  
  --tracking-display: -0.022em;
  --tracking-tight: -0.014em;
  --tracking-normal: 0em;
  --tracking-accent: 0.09em;
}
```

4. Space & layout
4.1 One width — the rule that fixes the jitter
```css
:root {
  --measure: 52rem; /* 832px — prose, cards, media, video, all of it */
  --page-gutter: clamp(1.25rem, 5vw, 3rem);
  --rail-width: 8rem;
  --rail-gap: 2.5rem;
}
```

9. Page-level exceptions
9.1 Landing page + About page only
The landing page and the about page are allowed to break the Section 2 (Color) and Section 5 motion rules below. Every other page — case studies, index, everything else — follows Sections 2–5 with no exceptions. Typography (Section 3), the one-width rule (Section 4), and the stack (Next.js + Tailwind v4 + Motion) are NOT exceptions — landing and about follow those like any other page.

Reason: the landing page's job is introduction and personality (the "side quests" concept — floating icons for the person behind the work), not the restrained, case-study reading experience the rest of Section 2's rules were written for.

9.2 Landing/about color tokens (replace Section 2 tokens on these pages only)
```css
:root {
  --landing-bg: #FDF8F0; /* warm cream page background — replaces --color-paper here */
  --landing-ink: #16181D;
  --landing-gray: #6B7280;
  --landing-gray-dark: #4B4F58;
  --landing-accent: #FBB622; /* yellow — replaces --color-brand here */
  --landing-black: #111214; /* nav pills, buttons, avatar */
  --landing-white: #FFFFFF;
}
```
These tokens are still tokens — no raw hex in components even on these two pages. They just aren't the Section 2 set.

9.3 Motion exception
Section 5's "no decorative particles" rule is waived for the hero's floating side-quest icon bubbles (gentle continuous float, no scroll-jacking). Still must respect `prefers-reduced-motion` per Section 5.5. Every other motion rule (reveal, focus, transition — nothing performative) still applies.
