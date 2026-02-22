// ec.config.mjs
import { defineEcConfig } from "astro-expressive-code";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";

export default defineEcConfig({
  // "Github Dark Dimmed" fits your academic/clean aesthetic better than "One Dark"
  themes: ["github-dark-dimmed", "github-light"],

  plugins: [
    pluginLineNumbers(),
    pluginCollapsibleSections(),
    // WCAG 2.1.1 (scrollable-region-focusable): add tabindex="0" to <pre>
    // so keyboard users can scroll code blocks that overflow horizontally
    {
      name: "a11y-focusable-pre",
      hooks: {
        postprocessRenderedBlock({ renderData }) {
          // blockAst is <figure>; find the <pre> child
          const figure = renderData.blockAst;
          const pre = figure.children?.find(
            node => node.type === "element" && node.tagName === "pre"
          );
          if (pre && pre.type === "element") {
            if (!pre.properties) pre.properties = {};
            pre.properties.tabIndex = 0;
          }
        },
      },
    },
  ],

  styleOverrides: {
    // Clean, subtle borders using transparency for better blending
    borderRadius: "0.5rem",
    borderWidth: "1px",
    borderColor: ({ theme }) =>
      theme.name.includes("dark")
        ? "rgba(255, 255, 255, 0.1)"
        : "rgba(0, 0, 0, 0.1)",

    // More breathing room for readability
    codePaddingBlock: "1.25rem",
    codePaddingInline: "1.5rem",

    // Remove default shadows for a flat, academic look
    frames: {
      shadowColor: "transparent",
      frameBoxShadowCssValue: "none",
    },

    // Use your site's JetBrains Mono variable
    codeFontFamily:
      "var(--font-jetbrains-mono), ui-monospace, SFMono-Regular, Menlo, monospace",
    codeFontSize: "0.875rem", // 14px
    codeLineHeight: "1.7", // High readability

    // Line numbers — must meet WCAG 4.5:1 on code background
    // github-dark-dimmed code bg is ≈#22272e; rgba(255,255,255,0.55) ≈#9C9EA1 → 5.4:1 ✓
    // github-light code bg is ≈#f6f8fa; #767676 → 4.54:1 ✓
    lineNumbers: {
      foreground: ({ theme }) =>
        theme.name.includes("dark") ? "rgba(255, 255, 255, 0.55)" : "#767676",
      background: "transparent",
    },

    // Selection/Highlight colors
    textMarkers: {
      defaultChroma: "45", // Slightly more vibrant highlights
      backgroundOpacity: "0.15",
      borderOpacity: "0.5",
    },

    // Minimal Scrollbars (Invisible until hover)
    scrollbarThumbColor: ({ theme }) =>
      theme.name.includes("dark")
        ? "rgba(255, 255, 255, 0.1)"
        : "rgba(0, 0, 0, 0.1)",
    scrollbarThumbHoverColor: ({ theme }) =>
      theme.name.includes("dark")
        ? "rgba(255, 255, 255, 0.3)"
        : "rgba(0, 0, 0, 0.3)",
  },

  defaultProps: {
    wrap: true, // Prevent horizontal scroll on mobile
    showLineNumbers: true, // Academic standard
    frame: "none", // We use your custom filename transformer instead
  },

  // Ensure accessibility standards
  minSyntaxHighlightingColorContrast: 5,
  useDarkModeMediaQuery: false, // Astro handles the class switching
});
