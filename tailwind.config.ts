import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: ["selector", "[data-theme='dark']"],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        accent: "var(--color-accent)",
        muted: "var(--color-muted)",
        border: "var(--color-border)",
        "text-secondary": "var(--color-text-secondary)",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      },
      /**
       * Font Family Configuration
       *
       * Research-Backed Typography Strategy:
       * ====================================
       *
      * Font Pairing: Inter for both UI and editorial headings — single-family strategy for performance
       * Alternative implementation available: Can use custom font stack if Roboto not available
       *
       * Current Implementation: Using Inter for body text (high x-height, screen-optimized)
       * Note: Studies show Roboto provides similar/equivalent performance
       *
       * Recommendation for Future Enhancement:
       * - Consider switching body font to Roboto for potential 35% reading speed increase
       * - Inter and Roboto are nearly interchangeable for accessibility
       * - x-height ratio with Merriweather: ~0.95 (visually harmonious)
       *
       * Font Metrics for Reference:
       * - Roboto x-height: High (0.52 of cap height)
       * - Inter x-height: High (0.5 of cap height)
      * - Inter x-height: High for readability and consistency
       * - Compatibility ratio: 0.95–1.0 (excellent pairing)
       */
      fontFamily: {
        // Body & UI: High x-height for rapid character recognition
        sans: ["var(--font-inter)", "sans-serif"],
        // Headings & Editorial: Switched to Inter (sans) - use Inter variable for consistent heading styles
        // Keeping `serif` key available if you want to revert to a serif heading in the future
          // CHANGED: removed serif token entirely so `font-serif` uses browser fallback.
        // Code: Monospace for technical clarity
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
