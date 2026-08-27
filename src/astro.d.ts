// src/types/global.d.ts
/// <reference types="astro/client" />

export {};

/**
 * W3C Digital Publishing WAI-ARIA Module 1.1 (DPUB-ARIA 1.1)
 * Official Recommendation (June 2025 / 2026)
 * @see https://www.w3.org/TR/dpub-aria-1.1/
 */
export type DPubAriaRole =
  | "doc-abstract"
  | "doc-acknowledgments"
  | "doc-afterword"
  | "doc-appendix"
  | "doc-backlink"
  | "doc-biblioentry"
  | "doc-bibliography"
  | "doc-biblioref"
  | "doc-chapter"
  | "doc-colophon"
  | "doc-conclusion"
  | "doc-cover"
  | "doc-credit"
  | "doc-credits"
  | "doc-dedication"
  | "doc-endnote"
  | "doc-endnotes"
  | "doc-epigraph"
  | "doc-epilogue"
  | "doc-errata"
  | "doc-example"
  | "doc-footnote"
  | "doc-foreword"
  | "doc-glossary"
  | "doc-glossref"
  | "doc-index"
  | "doc-introduction"
  | "doc-noteref"
  | "doc-notice"
  | "doc-pagebreak"
  | "doc-pagefooter"
  | "doc-pageheader"
  | "doc-pagelist"
  | "doc-part"
  | "doc-preface"
  | "doc-prologue"
  | "doc-pullquote"
  | "doc-qna"
  | "doc-subtitle"
  | "doc-tip"
  | "doc-toc";

declare global {
  type DPubAriaRoleType = DPubAriaRole;

  // 1. Extend Astro's native HTML namespace (Used in all .astro components)
  namespace astroHTML.JSX {
    interface HTMLAttributes {
      role?:
        | DPubAriaRole
        | astroHTML.JSX.AriaRole
        | (string & {})
        | null
        | undefined;
    }
  }

  // 2. Extend standard JSX namespace (Fixed: _T satisfies @typescript-eslint/no-unused-vars)
  namespace JSX {
    interface HTMLAttributes<_T = unknown> {
      role?: DPubAriaRole | (string & {}) | null | undefined;
    }
  }

  // 3. Window extensions for Vercel Web Analytics & Speed Insights
  interface Window {
    va?: (
      command: "event" | "pageview" | "beforeSend",
      payload?: unknown
    ) => void;
    webAnalyticsBeforeSend?: (
      event: Record<string, unknown> & { url: string }
    ) => Record<string, unknown> | null;
    speedInsightsBeforeSend?: (
      data: Record<string, unknown>
    ) => Record<string, unknown> | null;
  }
}
