/**
 * Shiki Transformer for displaying filenames in code blocks
 * Adds a filename label above code blocks when specified in the fence
 *
 * Usage in markdown:
 * ```typescript fileName="src/main.ts"
 * // code here
 * ```
 */

import type { ShikiTransformer } from "shiki";

export interface TransformerFileNameOptions {
  /** Style version: 'v1' or 'v2' */
  style?: "v1" | "v2";
  /** Whether to hide the dot in filenames */
  hideDot?: boolean;
}

export function transformerFileName(
  options: TransformerFileNameOptions = {}
): ShikiTransformer {
  const { style = "v2", hideDot = false } = options;

  return {
    name: "transformer-filename",
    postprocess(html) {
      // This runs after code highlighting
      // Extract filename from data-file-name attribute if present
      const fileNameRegex = /data-file-name="([^"]+)"/;
      const fileNameMatch = fileNameRegex.exec(html);

      if (!fileNameMatch?.[1]) {
        return html;
      }

      const filename = fileNameMatch[1];
      let displayName = filename;

      // Optionally hide the leading dot in filenames like .gitignore
      if (hideDot && displayName.startsWith(".")) {
        displayName = displayName.substring(1);
      }

      // Add filename wrapper based on style
      if (style === "v1") {
        // Simple style: just add a div with the filename
        return `<div class="filename-label">${displayName}</div>\n${html}`;
      }

      // v2 style: more polished with data attributes
      return `<div class="code-filename" data-filename="${filename}">${displayName}</div>\n${html}`;
    },
  };
}
