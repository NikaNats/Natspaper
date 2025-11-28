import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: ["selector", "[data-theme='dark']"],
  theme: {
    /**
     * Responsive Breakpoints for Extreme Scales
     * ==========================================
     * xs:  375px  - Modern mobile minimum (iPhone SE+)
     * sm:  640px  - Small tablets
     * md:  768px  - Tablets
     * lg:  1024px - Laptops
     * xl:  1280px - Desktop
     * 2xl: 1536px - Large desktop
     * 3xl: 1920px - Full HD Desktop
     * 4xl: 2560px - Ultrawide/4K displays
     */
    screens: {
      xs: "375px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
      "3xl": "1920px",
      "4xl": "2560px",
    },
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
       * Extended Spacing Scale for Large Screens
       * =========================================
       * Generous whitespace utilities for 4K and ultrawide displays
       */
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "26": "6.5rem",
        "30": "7.5rem",
        "34": "8.5rem",
        "38": "9.5rem",
        "42": "10.5rem",
        "46": "11.5rem",
        "50": "12.5rem",
        "54": "13.5rem",
        "58": "14.5rem",
        "62": "15.5rem",
        "66": "16.5rem",
        "70": "17.5rem",
        "screen-5": "5vw",
        "screen-10": "10vw",
        "screen-15": "15vw",
      },
      /**
       * Fluid Font Size Utilities using clamp()
       * =======================================
       * Scales smoothly from 320px to 2560px viewport width
       * Format: [min, preferred, max]
       */
      fontSize: {
        "fluid-xs": [
          "clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)",
          { lineHeight: "1.5" },
        ],
        "fluid-sm": [
          "clamp(0.875rem, 0.8rem + 0.35vw, 1rem)",
          { lineHeight: "1.5" },
        ],
        "fluid-base": [
          "clamp(1rem, 0.9rem + 0.5vw, 1.125rem)",
          { lineHeight: "1.6" },
        ],
        "fluid-lg": [
          "clamp(1.125rem, 1rem + 0.625vw, 1.25rem)",
          { lineHeight: "1.5" },
        ],
        "fluid-xl": [
          "clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)",
          { lineHeight: "1.4" },
        ],
        "fluid-2xl": [
          "clamp(1.5rem, 1.25rem + 1.25vw, 2rem)",
          { lineHeight: "1.3" },
        ],
        "fluid-3xl": [
          "clamp(1.875rem, 1.5rem + 1.875vw, 2.5rem)",
          { lineHeight: "1.2" },
        ],
        "fluid-4xl": [
          "clamp(2.25rem, 1.75rem + 2.5vw, 3.5rem)",
          { lineHeight: "1.15" },
        ],
        "fluid-5xl": [
          "clamp(3rem, 2.25rem + 3.75vw, 4.5rem)",
          { lineHeight: "1.1" },
        ],
        "fluid-6xl": [
          "clamp(3.75rem, 2.75rem + 5vw, 6rem)",
          { lineHeight: "1.05" },
        ],
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
