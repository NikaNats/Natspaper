declare module "remark-collapse" {
  import type { Plugin } from "unified";
  const plugin: Plugin;
  export default plugin;
}

declare module "sonda/astro" {
  import type { AstroIntegration } from "astro";

  interface SondaOptions {
    /** Output format(s) for the bundle analysis */
    format?: Array<"html" | "json">;
    /** Whether to open the report automatically */
    open?: boolean;
    /** Output directory for reports */
    outputDir?: string;
  }

  function SondaAstroPlugin(options?: SondaOptions): AstroIntegration;
  export default SondaAstroPlugin;
}
