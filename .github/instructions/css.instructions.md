---
applyTo: "src/styles/**,**/*.astro,**/*.css"
---

# CSS & Styling Standards — Natspaper

## Foundational Rule

This project uses **Tailwind CSS v4** with native CSS Custom Properties. There is no `tailwind.config.js` design-token layer — tokens are defined as CSS variables.

## Tailwind v4 Usage

- Use utility classes directly; **avoid `@apply`** except in `src/styles/components.css` for strict component abstractions.
- Use `class:list` directive in Astro for conditional class logic:
  ```astro
  <div class:list={["base-class", { active: isActive }]}></div>
  ```
- Class order: layout → display → spacing → typography → colors → borders → effects.

## Responsive Design — Container Queries First

Use `@container` for **component-level** responsiveness. Only use `@media` for **page-level** layout or user preference queries.

```css
/* ✅ Container query — component adapts to its container */
@container (min-width: 480px) {
  .card__title {
    font-size: 1.25rem;
  }
}

/* ❌ Don't use media queries for this */
@media (min-width: 768px) {
  .card__title {
    font-size: 1.25rem;
  }
}
```

## Fluid Typography & Spacing

Use `clamp()` for values that should scale smoothly:

```css
/* Typography */
font-size: clamp(1rem, 2.5vw, 1.5rem);

/* Spacing */
padding: clamp(1rem, 5%, 2rem);
```

Avoid fixed `px` values for type sizes or layout spacing — prefer `rem` or `clamp()`.

## CSS Custom Properties

Define semantic tokens in `src/styles/global.css`:

```css
:root {
  --color-surface: #ffffff;
  --color-text: #111111;
  --spacing-section: clamp(2rem, 8vw, 6rem);
}
[data-theme="dark"] {
  --color-surface: #0f0f0f;
  --color-text: #eeeeee;
}
```

Reference tokens via CSS variables — never hardcode hex values in components.

## Animations — Reduced Motion

**ALWAYS** wrap non-trivial animations in the preference query:

```css
/* ✅ Safe — respects user accessibility settings */
@media (prefers-reduced-motion: no-preference) {
  .fade-in {
    animation: fadeIn 300ms ease-in-out;
  }
}

/* ❌ Forbidden — plays animation regardless of user setting */
.fade-in {
  animation: fadeIn 300ms ease-in-out;
}
```

Transitions on `hover` / `focus` must also be wrapped.

## Dark Mode

Dark mode is controlled by `data-theme="dark"` on `<html>`. The inline script in `public/toggle-theme.js` handles the FOUC prevention. **NEVER** query `prefers-color-scheme` in JS — read `localStorage` and the data attribute instead.

## Focus Visibility

All interactive elements must have a visible focus indicator:

```css
/* Minimum pattern */
:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}
```

Do not remove `outline` without providing an equally visible replacement.

## Heading Hierarchy

- One `<h1>` per page.
- `<h2>` for section headings, `<h3>` for subsections — never skip levels.
- Do not use headings for visual styling; use CSS classes instead.

## Stylelint

All CSS in `src/styles/` is linted by Stylelint. Run: `pnpm lint:style`. Fix all warnings before merging.
