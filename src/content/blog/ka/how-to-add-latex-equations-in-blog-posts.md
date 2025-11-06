---
author: Alberto Perdomo
pubDatetime: 2024-09-08T20:58:52.737Z
modDatetime: 2025-03-22T09:25:46.734Z
title: როგორ დავამატოთ LaTeX განტოლებები Astro ბლოგის პოსტებში
tags:
  - docs
description: ისწავლეთ როგორ დავამატოთ LaTeX განტოლებები Astro ბლოგის პოსტებში Markdown, KaTeX და remark/rehype დამატებების გამოყენებით.
---

ეს დოკუმენტი აჩვენებს როგორ გამოიყენოთ LaTeX განტოლებები თქვენი Markdown ფაილებში AstroPaper-ზე. LaTeX არის მძლავრი ტიპოგრაფიული სისტემა, რომელიც ხშირად გამოიყენება მათემატიკური და სამეცნიერო დოკუმენტებისთვის.

<figure>
  <img
    src="https://images.pexels.com/photos/22690748/pexels-photo-22690748/free-photo-of-close-up-of-complicated-equations-written-on-a-blackboard.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    alt="დახურული ხედი რთული განტოლებებით დაფაზე, რომელიც აჩვენებს ქიმიის და მათემატიკის სიმბოლოებს"
    width="1260"
    height="750"
    loading="lazy"
    decoding="async"
  />
  <figcaption class="text-center">
    ფოტო <a href="https://www.pexels.com/photo/close-up-of-complicated-equations-written-on-a-blackboard-22690748/">Vitaly Gariev</a>-ის მიერ
  </figcaption>
</figure>

## შინაარსის ცხრილი

## ინსტრუქციები

ამ განყოფილებაში ნახავთ ინსტრუქციებს, თუ როგორ დავამატოთ LaTeX-ის მხარდაჭერა თქვენი Markdown ფაილებში AstroPaper-ზე.

1. დააინსტალირეთ საჭირო remark და rehype დამატებები შემდეგი ბრძანების გაშვებით:

   ```bash
   pnpm install rehype-katex remark-math katex
   ```

2. განაახლეთ Astro კონფიგურაცია ამ დამატებების გამოსაყენებლად:

   ```ts file=astro.config.ts
   // ...
   import remarkMath from "remark-math";
   import rehypeKatex from "rehype-katex";

   export default defineConfig({
     // ...
     markdown: {
       remarkPlugins: [
         remarkMath, // [!code ++]
         remarkToc,
         [remarkCollapse, { test: "Table of contents" }],
       ],
       rehypePlugins: [rehypeKatex], // [!code ++]
       shikiConfig: {
         // მეტი თემისთვის, ეწვიეთ https://shiki.style/themes
         themes: { light: "min-light", dark: "night-owl" },
         wrap: false,
       },
     },
     // ...
   });
   ```

3. შემოიტანეთ KaTeX CSS მთავარ განლაგების ფაილში

   ```astro file=src/layouts/Layout.astro
   ---
   import { SITE } from "@config";

   // astro კოდი
   ---

   <!doctype html>
   <!-- სხვები... -->
   <script is:inline src="/toggle-theme.js"></script>

   <!-- [!code highlight:4] -->
   <link
     rel="stylesheet"
     href="https://cdn.jsdelivr.net/npm/katex@0.16.25/dist/katex.min.css"
   />

   <body>
     <slot />
   </body>
   ```

4. ბოლო ეტაპად, დაამატეთ ტექსტის ფერი `katex`-ზე `typography.css`-ში.

   ```css file=src/styles/typography.css
   @plugin "@tailwindcss/typography";

   @layer base {
     /* სხვა კლასები */

     /* Katex ტექსტის ფერი */
     /* [!code highlight:3] */
     .prose .katex-display {
       @apply text-foreground;
     }

     /* ===== კოდის ბლოკები და სინტაქსის ხაზგასმა ===== */
     /* სხვა კლასები */
   }
   ```

და _voilà_, ეს სეტআპი საშუალებას გაძლევთ დაწეროთ LaTeX განტოლებები თქვენი Markdown ფაილებში, რომლებიც სათანადოდ გამოჩნდება საიტის აგების დროს. როდესაც თქვენ ეს გააკეთებთ, დოკუმენტის დანარჩენი ნაწილი სწორად დაიხატება.

---

## წრფივი განტოლებები

წრფივი განტოლებები იწერება ერთი დოლარის ნიშნებს შორის `$...$`. აქ არის რამდენიმე მაგალითი:

1. ცნობილი მასა-ენერგიის ეკვივალენტობის ფორმულა: $E = mc^2$
2. კვადრატული ფორმულა: $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$
3. ეილერის იდენტობა: $e^{i\pi} + 1 = 0$

---

## ბლოკის განტოლებები

უფრო რთული განტოლებებისთვის ან როცა გსურთ განტოლება დამოუკიდებელ სტრიქონზე იყოს, გამოიყენეთ ორმაგი დოლარის ნიშნები `$$...$$`:

გაუსის ინტეგრალი:

```bash
$$ \int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi} $$
```

რიმანის ზეტა ფუნქციის განმარტება:

```bash
$$ \zeta(s) = \sum_{n=1}^{\infty} \frac{1}{n^s} $$
```

მაქსველის განტოლებები დიფერენციალური ფორმით:

```bash
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

## მათემატიკური სიმბოლოების გამოყენება

LaTeX უზრუნველყოფს უამრავ მათემატიკურ სიმბოლოს:

- ბერძნული ასოები: $\alpha$, $\beta$, $\gamma$, $\delta$, $\epsilon$, $\pi$
- ოპერატორები: $\sum$, $\prod$, $\int$, $\partial$, $\nabla$
- ურთიერთობები: $\leq$, $\geq$, $\approx$, $\sim$, $\propto$
- ლოგიკური სიმბოლოები: $\forall$, $\exists$, $\neg$, $\wedge$, $\vee$
