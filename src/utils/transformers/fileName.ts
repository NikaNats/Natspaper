/**
 * Shiki Transformer for displaying filenames in code blocks
 * Adds a filename label above code blocks when specified in the fence
 *
 * Usage in markdown:
 * ```typescript fileName="src/main.ts"
 * // code here
 * ```
 */

/* eslint-disable no-console */

// --- Rendering Strategies ---

// This interface defines the "contract" for any style we might add in the future.
interface StyleStrategy {
  render(filename: string, displayName: string): string;
}

const v1Strategy: StyleStrategy = {
  render: (_filename, displayName) =>
    `<div class="filename-label">${displayName}</div>`,
};

const v2Strategy: StyleStrategy = {
  render: (filename, displayName) =>
    `<div class="code-filename" data-filename="${filename}">${displayName}</div>`,
};

// This object maps style names to their strategy. It's easily extensible.
const strategies: Record<string, StyleStrategy> = {
  v1: v1Strategy,
  v2: v2Strategy,
};

// --- The Main Transformer Function ---

export interface TransformerFileNameOptions {
  style?: "v1" | "v2";
  hideDot?: boolean;
}

export function transformerFileName(
  options: TransformerFileNameOptions = {}
): Record<string, unknown> {
  const { style = "v2", hideDot = false } = options;

  // Select the rendering strategy based on the options.
  const strategy = strategies[style];

  if (!strategy) {
    // Fail gracefully if an invalid style is provided.
    console.warn(
      `[transformerFileName] Unknown style "${style}". Defaulting to "v2".`
    );
    return transformerFileName({ ...options, style: "v2" });
  }

  return {
    name: "transformer-filename",
    postprocess(html: string): string {
      const fileNameRegex = /data-file-name="([^"]+)"/;
      const match = html.match(fileNameRegex);
      const filename = match?.[1];

      if (!filename) {
        return html;
      }

      // 1. Logic: Process the data
      const displayName =
        hideDot && filename.startsWith(".") ? filename.substring(1) : filename;

      // 2. Presentation: Delegate rendering to the chosen strategy
      const headerHtml = strategy.render(filename, displayName);

      return `${headerHtml}\n${html}`;
    },
  };
}
