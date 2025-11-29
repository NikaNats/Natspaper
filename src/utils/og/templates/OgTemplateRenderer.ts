/**
 * OG Image Template System
 * Provides reusable styling templates for OG images
 * Follows the Single Responsibility Principle
 */

export interface OgTemplate {
  backgroundColor: string;
  borderColor: string;
  borderRadius: string;
  textColor: string;
  accentColor: string;
}

export const defaultTemplate: OgTemplate = {
  backgroundColor: "#fefbfb",
  borderColor: "#000",
  borderRadius: "4px",
  textColor: "#000",
  accentColor: "#ecebeb",
};

export class OgTemplateRenderer {
  private readonly template: OgTemplate;

  constructor(template: OgTemplate = defaultTemplate) {
    this.template = template;
  }

  /**
   * Render the site OG image template
   */
  renderSiteTemplate(siteData: {
    title: string;
    desc: string;
    hostname: string;
  }): string {
    return `
      <div style="background-color: ${this.template.backgroundColor}; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; top: -1px; right: -1px; border: 4px solid ${this.template.borderColor}; background: ${this.template.accentColor}; opacity: 0.9; border-radius: ${this.template.borderRadius}; display: flex; justify-content: center; margin: 2.5rem; width: 88%; height: 80%;"></div>

        <div style="border: 4px solid ${this.template.borderColor}; background: ${this.template.backgroundColor}; border-radius: ${this.template.borderRadius}; display: flex; justify-content: center; margin: 2rem; width: 88%; height: 80%;">
          <div style="display: flex; flex-direction: column; justify-content: space-between; margin: 20px; width: 90%; height: 90%;">
            <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 90%; max-height: 90%; overflow: hidden; text-align: center;">
              <p style="font-size: 72px; font-weight: bold; color: ${this.template.textColor};">${siteData.title}</p>
              <p style="font-size: 28px; color: ${this.template.textColor};">${siteData.desc}</p>
            </div>
            <div style="display: flex; justify-content: flex-end; width: 100%; margin-bottom: 8px; font-size: 28px;">
              <span style="overflow: hidden; font-weight: bold; color: ${this.template.textColor};">${siteData.hostname}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
