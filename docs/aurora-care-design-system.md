# MomMate Aurora Care Design System

## 1. Brand Principles

MomMate should feel clinically trustworthy without becoming cold. Aurora Care uses softness as a signal of safety, clarity as a signal of medical credibility, and restrained luxury as a signal that the service is premium.

- Calm before decoration: every surface should reduce anxiety for first-time mothers.
- Editorial healthcare: layouts should feel curated, spacious, and informed, not like a generic marketplace.
- Trust-sensitive UI: verification, pricing, policies, and next steps must be visually explicit.
- Living, not noisy: motion should breathe softly and guide attention without stealing it.
- Premium through restraint: fewer colors, better spacing, precise typography, and quiet depth.

## 2. Color Tokens

Core palette:

- `--brand-aura-lavender: #B79CED`
- `--brand-aura-mist: #EEE8FF`
- `--brand-aura-veil: #F8F5FF`
- `--brand-rose-care: #EAB8CE`
- `--brand-mint-clinical: #BFE7D2`
- `--brand-sky-calm: #BFDDF2`
- `--brand-ink: #2D2640`

Semantic tokens:

- Page: `--ds-bg-page`, `--ds-bg-ambient`
- Surface: `--ds-surface`, `--ds-surface-soft`, `--ds-surface-raised`
- Text: `--ds-text`, `--ds-text-muted`, `--ds-text-subtle`
- Action: `--ds-accent`, `--ds-accent-soft`
- Status: `--ds-success`, `--ds-warning`, `--ds-danger`
- Border: `--ds-border`, `--ds-border-strong`

Usage rule: lavender is the primary emotional color, rose is for warmth, mint and sky are clinical support colors, and dark ink carries authority.

## 3. Typography

Font family: Inter, system UI fallback.

Scale:

- Display: `--type-display`
- H1: `--type-h1`
- H2: `--type-h2`
- H3: `--type-h3`
- Body large: `--type-body-lg`
- Body: `--type-body`
- Body small: `--type-body-sm`
- Caption: `--type-caption`

Rules:

- Use sentence case for calm readability.
- Use `--leading-display` for large editorial moments.
- Use `--leading-body` for guidance, care details, policies, and health information.
- Keep letter spacing at `0` for UI precision.

## 4. Motion System

Tokens:

- Fast: `--motion-fast`
- Base: `--motion-base`
- Slow: `--motion-slow`
- Standard ease: `--motion-ease-standard`
- Emphasized ease: `--motion-ease-emphasized`
- Living ease: `--motion-ease-living`

Rules:

- Micro interactions use fast motion.
- Cards, sheets, and modals use base motion.
- Ambient reveal or page-level transitions use slow motion.
- Respect `prefers-reduced-motion`.
- Motion should suggest care and continuity, not excitement.

## 5. Component Language

Components should look tactile, clear, and healthcare-grade.

- Buttons: high contrast, rounded, icon-led when possible.
- Cards: quiet surfaces with clear hierarchy, never nested visually unless required.
- Inputs: large touch targets, visible labels, strong focus ring.
- Badges: use for verification, role, service status, or clinical trust markers.
- Navigation: glass or soft solid surfaces with persistent orientation.
- Tables and admin controls: denser, flatter, less atmospheric than public pages.

## 6. Grid

Tokens:

- Max width: `--grid-max`
- Desktop gutter: `--grid-gutter-desktop`
- Tablet gutter: `--grid-gutter-tablet`
- Mobile gutter: `--grid-gutter-mobile`
- Gap: `--grid-gap`

System:

- Desktop: 12 columns
- Tablet: 8 columns
- Mobile: 4 columns

Utilities:

- `.ds-container`
- `.ds-grid`
- `.ds-stack`

## 7. Radius

Tokens:

- XS: `--ds-radius-xs`
- SM: `--ds-radius-sm`
- MD: `--ds-radius-md`
- LG: `--ds-radius-lg`
- XL: `--ds-radius-xl`
- Round: `--ds-radius-round`

Rules:

- Buttons and pills may use round radius.
- Cards and panels should usually use LG.
- Dense admin controls should use SM or MD.
- Avoid overly playful radius on clinical information.

## 8. Shadow

Tokens:

- Rest: `--ds-shadow-rest`
- Raised: `--ds-shadow-raised`
- Floating: `--ds-shadow-floating`
- Focus: `--ds-shadow-focus`

Rules:

- Use shadow to communicate layer and actionability.
- Public UI may use soft lavender depth.
- Admin UI should use lighter shadows and clearer borders.
- Focus rings must be visible and consistent.

## 9. Glass Recipe

Tokens:

- Background: `--ds-glass-bg`
- Strong background: `--ds-glass-bg-strong`
- Border: `--ds-glass-border`
- Blur: `--ds-glass-blur`
- Highlight: `--ds-glass-highlight`

Utility:

- `.ds-glass`

Recipe:

```css
background: var(--ds-glass-bg);
border: 1px solid var(--ds-glass-border);
box-shadow: var(--ds-shadow-rest), var(--ds-glass-highlight);
backdrop-filter: var(--ds-glass-blur);
```

Use glass for navigation, elevated summaries, care cards, confirmation panels, and soft overlays. Do not use glass for dense text blocks where legibility matters more than atmosphere.

## 10. Responsive Rules

- Design mobile first for one-handed use.
- Preserve minimum 44px touch targets.
- Collapse 12-column layouts to 8 columns at tablet and 4 columns at mobile.
- Prefer stacking over squeezing.
- Keep text readable before preserving visual symmetry.
- Avoid viewport-scaled font sizes outside defined clamp tokens.
- On mobile, reduce glass blur and shadow density if readability drops.
- Page content must never depend on hover-only interactions.
