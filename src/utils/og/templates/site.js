/**
 * Legacy Site OG Image Generator
 * This file is kept for backward compatibility.
 * New implementations should use SiteOgImageGenerator class.
 */

import { ogImageManager } from "./OgImageManager";

/**
 * Generate site OG image using the new SOLID architecture
 * @returns Promise resolving to SVG string
 */
export default async function generateSiteOgImage() {
  return ogImageManager.generate("site");
}
