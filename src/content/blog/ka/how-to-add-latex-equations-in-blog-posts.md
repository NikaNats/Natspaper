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
    src="/images/latex-equations-blackboard.jpeg"
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

   ```bash title="Terminal"
   pnpm install rehype-katex remark-math katex
   ```

2. განაახლეთ Astro კონფიგურაცია ამ დამატებების გამოსაყენებლად:

   <!--
      Expressive Code:
      - title="astro.config.ts": აჩვენებს ფაილის სახელს
      - ins={9-11, 13}: აფერადებს მე-9-11 და მე-13 ხაზებს მწვანედ (დამატების აღსანიშნავად)
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
         // მეტი თემისთვის, ეწვიეთ https://shiki.style/themes
         themes: { light: "min-light", dark: "night-owl" },
         wrap: false,
       },
     },
     // ...
   });
   ```

3. **შემოიტანეთ KaTeX CSS თქვენი პოსტის განლაგების ფაილში**

   KaTeX სტილების კოდ-დაყოფის მეშვეობით ეფექტურად ჩატვირთვის უზრუნველსაყოფად, შემოიტანეთ CSS პირდაპირ თქვენი პოსტის განლაგებაში (მაგ., `src/layouts/PostDetails.astro`). ეს საშუალებას აძლევს Astro-ს აგების მეშვეობით ავტომატური კოდ-დაყოფა და ბუნდელის ოპტიმიზაცია.

   <!--
      Expressive Code:
      - {6}: ნეიტრალურად გამოყოფს მე-6 ხაზს ყურადღების მისაქცევად
   -->

   ```astro title="src/layouts/PostDetails.astro" {6}
   ---
   import { render, type CollectionEntry } from "astro:content";
   import Layout from "@/layouts/Layout.astro";
   // ... სხვა შემოტანები

   import "katex/dist/katex.min.css";

   export interface Props {
     // ...
   }
   ---
   ```

   ეს მიდგომა აღემატება გარე CDN სტილების დაკავშირებას, რადგან:
   - **არა ბლოკირდება რენდერი**: CSS იკრიბება თქვენი გვერდის JavaScript-ის ერთად, არა ცალკე გამოკრებულია
   - **კოდ-დაყოფა**: CSS მხოლოდ იმ გვერდებზე ჩაიტვირთება, რომლებიც რეალურად მათემატიკურ განტოლებებს იყენებენ
   - **ავტომატური ოპტიმიზაცია**: Astro ავტომატურად ამცირებს CSS-ს და ოპტიმიზებს
   - **ოფლაინ მხარდაჭერა**: არ არის გარე CDN დამოკიდებულება—ყველაფერი თვითმომსახურებელი

4. ბოლო ეტაპად, დაამატეთ ტექსტის ფერი `katex`-ზე `typography.css`-ში.

   <!--
      Expressive Code:
      - ins={7-9}: აფერადებს 7-დან 9-მდე ხაზებს მწვანედ
   -->

   ```css title="src/styles/typography.css" ins={7-9}
   @plugin "@tailwindcss/typography";

   @layer base {
     /* სხვა კლასები */

     /* Katex ტექსტის ფერი */
     .prose .katex-display {
       @apply text-foreground;
     }

     /* ===== კოდის ბლოკები და სინტაქსის ხაზგასმა ===== */
     /* სხვა კლასები */
   }
   ```

და _voilà_, ეს სეტაპი საშუალებას გაძლევთ დაწეროთ LaTeX განტოლებები თქვენი Markdown ფაილებში, რომლებიც სათანადოდ გამოჩნდება საიტის აგების დროს. როდესაც თქვენ ეს გააკეთებთ, დოკუმენტის დანარჩენი ნაწილი სწორად დაიხატება.

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

```latex
$$ \int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi} $$
```

რიმანის ზეტა ფუნქციის განმარტება:

```latex
$$ \zeta(s) = \sum_{n=1}^{\infty} \frac{1}{n^s} $$
```

მაქსველის განტოლებები დიფერენციალური ფორმით:

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

## მათემატიკური სიმბოლოების გამოყენება

LaTeX უზრუნველყოფს უამრავ მათემატიკურ სიმბოლოს:

- ბერძნული ასოები: $\alpha$, $\beta$, $\gamma$, $\delta$, $\epsilon$, $\pi$
- ოპერატორები: $\sum$, $\prod$, $\int$, $\partial$, $\nabla$
- ურთიერთობები: $\leq$, $\geq$, $\approx$, $\sim$, $\propto$
- ლოგიკური სიმბოლოები: $\forall$, $\exists$, $\neg$, $\wedge$, $\vee$
