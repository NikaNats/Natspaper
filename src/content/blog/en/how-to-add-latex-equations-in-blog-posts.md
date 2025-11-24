---
author: Alberto Perdomo
pubDatetime: 2024-09-08T20:58:52.737Z
modDatetime: 2025-03-22T09:25:46.734Z
title: How to add LaTeX Equations in Astro blog posts
tags:
  - docs
description: Learn how to add LaTeX equations in Astro blog posts using Markdown, KaTeX, and remark/rehype plugins.
---

This document demonstrates how to use LaTeX equations in your Markdown files for AstroPaper. LaTeX is a powerful typesetting system often used for mathematical and scientific documents.

<!--
  PERFORMANCE FIX:
  Replaced raw HTML <img> with Markdown syntax.
  Astro will now automatically:
  1. Convert this to WebP/AVIF (Format Optimization)
  2. Generate multiple sizes (Responsive Images)
  3. Lazy load it with decoding="async"
-->

![Close-up of complex equations on a chalkboard, showcasing chemistry and math symbols](../../../assets/images/latex-equations-blackboard.jpeg)

_Photo by [Vitaly Gariev](https://www.pexels.com/photo/close-up-of-complicated-equations-written-on-a-blackboard-22690748/)_

## Table of contents

## Instructions

In this section, you will find instructions on how to add support for LaTeX in your Markdown files for AstroPaper.

1. Install the necessary remark and rehype plugins by running:

   ```bash title="Terminal"
   pnpm install rehype-katex remark-math katex
   ```

2. Update the Astro configuration to use these plugins:

   <!--
      Expressive Code Feature:
      - title="astro.config.ts": Adds a file tab UI
      - ins={9-11, 13}: Highlights lines 9-11 and 13 in green (showing additions)
   -->

   ```ts title="astro.config.ts" ins={9-11, 13}
   // ...
   import remarkMath from "remark-math";
   import rehypeKatex from "rehype-katex";

   export default defineConfig({
     // ...
     markdown: {
       remarkPlugins: [
         remarkMath,
         [remarkToc, { heading: "(table of contents|შინაარსის ცხრილი)" }],
         [remarkCollapse, { test: "(Table of contents|შინაარსის ცხრილი)" }],
       ],
       rehypePlugins: [rehypeKatex],
       shikiConfig: {
         // For more themes, visit https://shiki.style/themes
         themes: { light: "min-light", dark: "night-owl" },
         wrap: false,
       },
     },
     // ...
   });
   ```

3. **Import KaTeX CSS in your post layout file**

   To ensure KaTeX styles are loaded efficiently only on pages that need them, import the CSS directly into your post layout (e.g., `src/layouts/PostDetails.astro`). This enables automatic code-splitting and bundling optimization by Astro's build tool.

   <!--
      Expressive Code Feature:
      - {6}: Highlights line 6 neutrally (focus attention)
      - title="...": Adds file context
   -->

   ```astro title="src/layouts/PostDetails.astro" {6}
   ---
   import { render, type CollectionEntry } from "astro:content";
   import Layout from "@/layouts/Layout.astro";
   // ... other imports

   import "katex/dist/katex.min.css";

   export interface Props {
     // ...
   }
   ---
   ```

   This approach is superior to linking external CDN stylesheets because:
   - **No render-blocking**: The CSS is bundled with your page JavaScript, not fetched separately
   - **Code-splitting**: CSS is only loaded on pages that actually use math equations
   - **Automatic optimization**: Astro minifies and optimizes the CSS automatically
   - **Offline support**: No external CDN dependency—everything is self-hosted

4. As the last step, add a text-color for `katex` in `typography.css`.

   <!--
      Expressive Code Feature:
      - ins={7-9}: Highlights the added CSS rule in green
   -->

   ```css title="src/styles/typography.css" ins={7-9}
   @plugin "@tailwindcss/typography";

   @layer base {
     /* other classes */

     /* Katex text color */
     .prose .katex-display {
       @apply text-foreground;
     }

     /* ===== Code Blocks & Syntax Highlighting ===== */
     /* other classes */
   }
   ```

And _voilà_, this setup allows you to write LaTeX equations in your Markdown files, which will be rendered properly when the site is built. Once you do it, the rest of the document will appear rendered correctly.

---

## Inline Equations

Inline equations are written between single dollar signs `$...$`. Here are some examples:

1. The famous mass-energy equivalence formula: $E = mc^2$
2. The quadratic formula: $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$
3. Euler's identity: $e^{i\pi} + 1 = 0$

---

## Block Equations

For more complex equations or when you want the equation to be displayed on its own line, use double dollar signs `$$...$$`:

The Gaussian integral:

```latex
$$ \int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi} $$
```

The definition of the Riemann zeta function:

```latex
$$ \zeta(s) = \sum_{n=1}^{\infty} \frac{1}{n^s} $$
```

Maxwell's equations in differential form:

```latex
$$
\begin{aligned}
\nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_0} \\
\nabla \cdot \mathbf{B} &= 0 \\
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\
\nabla \times \mathbf{B} &= \mu_0\left(\mathbf{J} + \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}\right)
\end{aligned}
$$
```

---

## Using Mathematical Symbols

LaTeX provides a wide range of mathematical symbols:

- Greek letters: $\alpha$, $\beta$, $\gamma$, $\delta$, $\epsilon$, $\pi$
- Operators: $\sum$, $\prod$, $\int$, $\partial$, $\nabla$
- Relations: $\leq$, $\geq$, $\approx$, $\sim$, $\propto$
- Logical symbols: $\forall$, $\exists$, $\neg$, $\wedge$, $\vee$
