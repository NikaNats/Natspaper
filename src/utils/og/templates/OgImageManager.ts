/**
 * OG Image Manager
 * Central controller for all OG image generation
 * Follows the Open/Closed Principle: open for extension, closed for modification
 */

import type { OgImageGenerator, OgImageOptions } from "./OgImageGenerator";
import { SiteOgImageGenerator } from "./SiteOgImageGenerator";

export class OgImageManager {
  private generators: Map<string, OgImageGenerator> = new Map();

  constructor() {
    // Register all available generators
    this.registerGenerator("site", new SiteOgImageGenerator());
  }

  /**
   * Register a new OG image generator
   * @param type - Type identifier for the generator
   * @param generator - The generator instance
   */
  registerGenerator(type: string, generator: OgImageGenerator): void {
    this.generators.set(type, generator);
  }

  /**
   * Generate an OG image using the specified generator
   * @param type - Type of generator to use
   * @param options - Options for the generator
   * @returns Promise resolving to SVG string
   */
  async generate(type: string, options?: OgImageOptions): Promise<string> {
    const generator = this.generators.get(type);
    if (!generator) {
      throw new Error(`No OG image generator registered for type: ${type}`);
    }
    return generator.generate(options);
  }

  /**
   * Check if a generator type is registered
   * @param type - Type to check
   * @returns True if generator exists
   */
  hasGenerator(type: string): boolean {
    return this.generators.has(type);
  }

  /**
   * Get all registered generator types
   * @returns Array of registered types
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.generators.keys());
  }
}

// Create a singleton instance
export const ogImageManager = new OgImageManager();
