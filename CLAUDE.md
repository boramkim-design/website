# CLAUDE.md

Always read `docs/design-system.md` before writing or editing UI.

Never introduce a raw hex value, px font size, or arbitrary duration in `styles.css` or inline styles. Every value must come from a token defined in the `:root` block at the top of `styles.css`. If a token is missing, propose adding it — don't hardcode.

Note: `docs/design-system.md` describes a Next.js + Tailwind + Motion stack for the case-study pages that don't exist yet. This landing page is currently plain HTML/CSS/JS (`index.html`, `styles.css`, `script.js`) — apply the design system's tokens, typography, and layout rules (Sections 2–4, 9) to this stack as-is rather than assuming the Next.js/Tailwind scaffolding is present.

Landing/about pages use the Section 9 exception tokens (warm cream background, yellow accent, floating icon motion) — everything else in the design system (typography, one-width `--measure`, spacing) applies with no exception.
