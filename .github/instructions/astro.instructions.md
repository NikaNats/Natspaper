---
applyTo: "**/*.astro"
---

# Astro Component Standards — Natspaper

## Component Classification

| Layer               | Path                       | Purpose                                          |
| ------------------- | -------------------------- | ------------------------------------------------ |
| **Dumb (UI)**       | `src/components/ui/`       | Pure HTML/CSS, props-only, zero side effects     |
| **Smart (Feature)** | `src/components/features/` | Can bind `window` events, load 3rd-party scripts |
| **Layouts**         | `src/layouts/`             | Page shells, wrap `<slot />`                     |
| **Pages**           | `src/pages/`               | Route endpoints, `getStaticPaths` for SSG        |

## Data Layer — Non-Negotiable

**NEVER** call `getCollection()` inside a component. Always delegate to `PostRepository`:

```ts
// ✅ Correct
import { PostRepository } from "@utils/post/repository";
const posts = await PostRepository.getByLocale(locale);

// ❌ Forbidden
import { getCollection } from "astro:content";
const posts = await getCollection("blog");
```

## Frontmatter Rules

```astro
---
// 1. Type imports
import type { Locale } from "@types";
// 2. Component imports (Astro first, then others)
import Layout from "@layouts/Layout.astro";
import Button from "@components/ui/Button.astro";
// 3. Data fetching via PostRepository
// 4. Pure computations
// 5. Props destructuring: always define interface Props
interface Props {
  title: string;
  locale: Locale;
}
const { title, locale } = Astro.props;
---
```

## i18n — Mandatory

```astro
---
import { getI18n } from "@i18n/index";
const i18n = getI18n(locale);
---

<!-- ✅ -->
<button aria-label={i18n.t("button.close")}>{i18n.t("button.close")}</button>
<!-- ❌ Never hardcode UI strings -->
<button>Close</button>
```

## Script Pattern for Interactivity

Prefer native Web Components encapsulated in `<script>` — **not** scattered listeners:

```astro
<mobile-menu>
  <button slot="trigger" data-testid="menu-trigger">{i18n.t("nav.menu")}</button
  >
</mobile-menu>

<script>
  class MobileMenu extends HTMLElement {
    readonly #trigger: HTMLButtonElement;
    constructor() {
      super();
      this.#trigger = this.querySelector("[slot=trigger]")!;
      this.#trigger.addEventListener("click", this.#toggle);
    }
    #toggle = (): void => {
      /* ... */
    };
    disconnectedCallback(): void {
      this.#trigger.removeEventListener("click", this.#toggle);
    }
  }
  customElements.define("mobile-menu", MobileMenu);
</script>
```

Always implement `disconnectedCallback` for cleanup.

## FOUC Prevention

Dark-mode and theme scripts **must** use `is:inline` to run synchronously before paint:

```astro
<script is:inline>
  // Runs synchronously — safe to read localStorage here
  const theme = localStorage.getItem("theme") ?? "system";
</script>
```

## Accessibility Checklist (per component)

- [ ] Semantic HTML (`<nav>`, `<main>`, `<article>`, `<aside>`, `<header>`, `<footer>`)
- [ ] All interactive elements have `aria-label` or visible text
- [ ] Focus visible: `focus-visible:outline-2` or equivalent
- [ ] `data-testid` on every interactive/significant element
- [ ] Color contrast ≥ 4.5:1 (WCAG 2.2 AA)
- [ ] Images have descriptive `alt`; decorative images have `alt=""`

## Routing Conventions

Every page must derive its URL from `locale`:

```ts
// ✅ Always locale-prefixed
const href = `/${locale}/posts/${slug}`;

// ❌ Never locale-free
const href = `/posts/${slug}`;
```

`getStaticPaths` must return one set of paths **per supported locale**.
