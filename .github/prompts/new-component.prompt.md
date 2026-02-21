---
mode: "agent"
tools: ["filesystem", "sequential-thinking"]
description: "Scaffold a new Astro UI (dumb) or Feature (smart) component with correct patterns."
---

# New Component Scaffold

You are creating a new Astro component for Natspaper.

## Required Information

Ask the user if not provided:

1. **Component name** (PascalCase, e.g. `TagBadge`)
2. **Layer** — `ui` (dumb, props-only) or `features` (smart, can use window/3rd-party)
3. **Props** — list each prop with its TypeScript type and whether it is optional
4. **Interactive?** — does it need a Web Component (`<script>` block)?
5. **i18n strings needed?** — which UI text needs translation?

## Steps to Execute

1. Check `src/components/<layer>/` for naming conflicts.
2. Read an existing component in the same layer for conventions.
3. Create `src/components/<layer>/<ComponentName>.astro`.

### Template (UI — Dumb Component)

```astro
---
import type { Locale } from "@types";
import { getI18n } from "@i18n/index";

interface Props {
  // Props here — no side effects allowed
  locale: Locale;
}

const { locale } = Astro.props;
const i18n = getI18n(locale);
---

<div class="..." data-testid="<component-name>">
  <!-- markup -->
</div>
```

### Template (Feature — Smart Component)

```astro
---
import type { Locale } from "@types";
import { getI18n } from "@i18n/index";

interface Props {
  locale: Locale;
}

const { locale } = Astro.props;
const i18n = getI18n(locale);
---

<custom-element data-testid="<component-name>">
  <!-- markup -->
</custom-element>

<script>
  class CustomElement extends HTMLElement {
    connectedCallback(): void {
      // setup
    }
    disconnectedCallback(): void {
      // cleanup — remove all event listeners
    }
  }
  customElements.define("custom-element", CustomElement);
</script>
```

## Quality Checklist

- [ ] `interface Props` is defined in frontmatter
- [ ] All UI strings go through `getI18n(locale)`
- [ ] `data-testid` added to root and interactive elements
- [ ] Smart components implement `disconnectedCallback` for cleanup
- [ ] Semantic HTML used (correct element for the job)
- [ ] Focus state is visible for interactive elements
- [ ] Component is placed in the correct layer (`ui/` vs `features/`)

After creation, suggest a Vitest test stub (for utility helpers) or note that Playwright `data-testid` selectors should be added to E2E specs.
