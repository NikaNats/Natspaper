/**
 * Site OG Image Generator
 * Generates OG images for the site homepage
 * Follows the Single Responsibility Principle
 */

import satori from "satori";
import { html } from "satori-html";
import { SITE } from "@/config";
import type { OgImageGenerator, OgImageOptions } from "./OgImageGenerator";
import { OgTemplateRenderer } from "./OgTemplateRenderer";

export class SiteOgImageGenerator implements OgImageGenerator {
  private readonly templateRenderer: OgTemplateRenderer;

  constructor() {
    this.templateRenderer = new OgTemplateRenderer();
  }

  /**
   * Generate site OG image
   * @param options - Optional configuration overrides
   * @returns Promise resolving to SVG string
   */
  async generate(options?: OgImageOptions): Promise<string> {
    const siteData = {
      title: SITE.title,
      desc: SITE.desc,
      hostname: new URL(SITE.website).hostname,
    };

    // Generate HTML markup using template renderer
    const markupHtml = this.templateRenderer.renderSiteTemplate(siteData);
    const markup = html(markupHtml);

    // Create Satori configuration
    const config = {
      width: 1200,
      height: 630,
      embedFont: true,
      fonts: [],
      ...options,
    };

    // Generate SVG using Satori
    return satori(markup, config);
  }
}
