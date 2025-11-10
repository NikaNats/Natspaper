/**
 * Test Suite: Heading Links Feature Module
 * Tests for heading link creation and duplicate prevention
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initHeadingLinks } from "@/utils/features/headingLinks";

describe("Heading Links Feature", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <h1>Page Title</h1>
      <h2 id="section-1">Section 1</h2>
      <h3 id="subsection-1a">Subsection 1A</h3>
      <h4 id="heading-1a1">Heading 1A1</h4>
      <h5 id="heading-5">Heading 5</h5>
      <h6 id="heading-6">Heading 6</h6>
      <p>Some content</p>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("should find all heading elements (h2-h6)", () => {
    initHeadingLinks();

    // Check that all headings (h2-h6) have been processed
    const h2 = document.querySelector("h2");
    const h3 = document.querySelector("h3");
    const h4 = document.querySelector("h4");
    const h5 = document.querySelector("h5");
    const h6 = document.querySelector("h6");

    expect(h2?.querySelector("a.heading-link")).toBeTruthy();
    expect(h3?.querySelector("a.heading-link")).toBeTruthy();
    expect(h4?.querySelector("a.heading-link")).toBeTruthy();
    expect(h5?.querySelector("a.heading-link")).toBeTruthy();
    expect(h6?.querySelector("a.heading-link")).toBeTruthy();
  });

  it("should not add links to h1 elements", () => {
    initHeadingLinks();

    const h1 = document.querySelector("h1");
    expect(h1?.querySelector("a.heading-link")).toBeFalsy();
  });

  it("should add 'group' class to headings", () => {
    initHeadingLinks();

    const headings = document.querySelectorAll("h2, h3, h4, h5, h6");
    for (const heading of headings) {
      expect(heading.classList.contains("group")).toBe(true);
    }
  });

  it("should add 'has-heading-link' class to prevent duplicates", () => {
    initHeadingLinks();

    const headings = document.querySelectorAll("h2, h3, h4, h5, h6");
    for (const heading of headings) {
      expect(heading.classList.contains("has-heading-link")).toBe(true);
    }
  });

  it("should create heading links with correct href", () => {
    initHeadingLinks();

    const h2 = document.querySelector("h2") as HTMLElement;
    const link = h2.querySelector("a.heading-link") as HTMLAnchorElement;

    expect(link.href).toContain("#section-1");
  });

  it("should create link with anchor symbol", () => {
    initHeadingLinks();

    const h2 = document.querySelector("h2") as HTMLElement;
    const link = h2.querySelector("a.heading-link") as HTMLAnchorElement;
    const span = link.querySelector("span");

    expect(span?.textContent).toBe("#");
    expect(span?.ariaHidden).toBe("true");
  });

  it("should apply correct CSS classes to links", () => {
    initHeadingLinks();

    const h2 = document.querySelector("h2") as HTMLElement;
    const link = h2.querySelector("a.heading-link") as HTMLAnchorElement;

    expect(link.className).toContain("heading-link");
    expect(link.className).toContain("no-underline");
    expect(link.className).toContain("opacity-0");
    expect(link.className).toContain("group-hover:opacity-75");
    expect(link.className).toContain("focus:opacity-75");
  });

  it("should set title attribute on links for accessibility", () => {
    initHeadingLinks();

    const h2 = document.querySelector("h2") as HTMLElement;
    const link = h2.querySelector("a.heading-link") as HTMLAnchorElement;

    expect(link.title).toBe("Link to this section");
  });

  it("should prevent duplicate links on re-initialization", () => {
    initHeadingLinks();

    let links = document.querySelectorAll("a.heading-link");
    const initialCount = links.length;

    // Re-initialize
    initHeadingLinks();

    links = document.querySelectorAll("a.heading-link");
    expect(links.length).toBe(initialCount);
  });

  it("should add links to dynamically added headings", () => {
    initHeadingLinks();

    // Verify initial state
    let links = document.querySelectorAll("a.heading-link");
    const initialCount = links.length;

    // Add a new heading dynamically
    const newHeading = document.createElement("h2");
    newHeading.id = "dynamic-heading";
    newHeading.textContent = "Dynamically Added";
    document.body.appendChild(newHeading);

    // Re-initialize
    initHeadingLinks();

    // Should have added a link to the new heading
    const newLink = newHeading.querySelector("a.heading-link");
    expect(newLink).toBeTruthy();

    // Total links should increase
    links = document.querySelectorAll("a.heading-link");
    expect(links.length).toBeGreaterThan(initialCount);
  });

  it("should handle headings without id gracefully", () => {
    document.body.innerHTML = `
      <h2>Heading without ID</h2>
      <h3 id="with-id">Heading with ID</h3>
    `;

    initHeadingLinks();

    const h2 = document.querySelector("h2") as HTMLElement;
    const h2Link = h2.querySelector("a.heading-link") as HTMLAnchorElement;

    expect(h2Link).toBeTruthy();
    // Link href will be empty if heading has no id
    expect(h2Link.href).toBe("http://localhost:3000/#");
  });

  it("should append link to end of heading element", () => {
    initHeadingLinks();

    const h2 = document.querySelector("h2") as HTMLElement;
    const children = Array.from(h2.children);

    // Link should be the last child
    const lastChild = children.at(-1);
    expect(lastChild?.className).toContain("heading-link");
  });
});
