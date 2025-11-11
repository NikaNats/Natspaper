/**
 * OG Image Generator Interface
 * Defines the contract for all OG image generators
 * Follows the Dependency Inversion Principle
 */

export interface OgImageOptions {
  width?: number;
  height?: number;
}

export interface OgImageGenerator {
  /**
   * Generate an OG image buffer
   * @param options - Options specific to this generator
   * @returns Promise resolving to SVG string
   */
  generate(options?: OgImageOptions): Promise<string>;
}
