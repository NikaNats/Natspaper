/**
 * Satori Configuration Manager
 * Handles Satori rendering configuration
 * Follows the Single Responsibility Principle
 */

export interface SatoriFont {
  name: string;
  data: ArrayBuffer | Buffer;
  weight?: number | string;
  style?: string;
}

export interface SatoriConfig {
  width: number;
  height: number;
  embedFont?: boolean;
  fonts?: SatoriFont[];
}

export class SatoriConfigManager {
  private readonly defaultConfig: Omit<SatoriConfig, "fonts"> = {
    width: 1200,
    height: 630,
    embedFont: true,
  };

  /**
   * Create Satori configuration for site OG images
   */
  createSiteConfig(fonts: SatoriFont[]): SatoriConfig {
    return {
      ...this.defaultConfig,
      fonts,
    };
  }

  /**
   * Create custom Satori configuration
   */
  createCustomConfig(
    options: Partial<SatoriConfig>,
    fonts: SatoriFont[]
  ): SatoriConfig {
    return {
      ...this.defaultConfig,
      ...options,
      fonts,
    };
  }
}
