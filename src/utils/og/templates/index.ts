/**
 * OG Templates Barrel Export
 * Exports the SOLID OG image generation system
 */

// Legacy exports for backward compatibility
export { default as generateSiteOgImage } from "./site";

// New SOLID architecture exports
export { ogImageManager } from "./OgImageManager";
export type { OgImageGenerator, OgImageOptions } from "./OgImageGenerator";
export { SiteOgImageGenerator } from "./SiteOgImageGenerator";
export {
  OgTemplateRenderer,
  defaultTemplate,
  type OgTemplate,
} from "./OgTemplateRenderer";
export {
  SatoriConfigManager,
  type SatoriConfig,
  type SatoriFont,
} from "./SatoriConfigManager";
