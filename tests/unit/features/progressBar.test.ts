/**
 * Test Suite: Progress Bar Feature Module
 * Tests for progress bar creation, scroll tracking, and re-initialization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { initProgressBar } from "@/utils/features/progressBar";

describe("Progress Bar Feature", () => {
  beforeEach(() => {
    // Create a simple DOM structure
    document.body.innerHTML = '<article id="article">Content</article>';

    // Mock scroll properties
    Object.defineProperty(document.body, "scrollTop", {
      value: 0,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(document.documentElement, "scrollTop", {
      value: 0,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(document.documentElement, "scrollHeight", {
      value: 1000,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(document.documentElement, "clientHeight", {
      value: 500,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("should create a progress container element", () => {
    initProgressBar();

    const container = document.getElementById("progress-container");
    expect(container).toBeTruthy();
    expect(container?.className).toContain("progress-container");
    expect(container?.className).toContain("fixed");
  });

  it("should create a progress bar element inside container", () => {
    initProgressBar();

    const bar = document.getElementById("myBar");
    expect(bar).toBeTruthy();
    expect(bar?.className).toContain("progress-bar");
    expect(bar?.className).toContain("bg-accent");
  });

  it("should initialize progress bar width to 0", () => {
    initProgressBar();

    const bar = document.getElementById("myBar") as HTMLElement;
    expect(bar.style.width).toBe("");
  });

  it("should update progress bar width on scroll", async () => {
    initProgressBar();

    const bar = document.getElementById("myBar") as HTMLElement;

    // Simulate scroll to 50%
    Object.defineProperty(document.documentElement, "scrollTop", {
      value: 250,
      writable: true,
      configurable: true,
    });

    // Trigger scroll event
    const scrollEvent = new Event("scroll");
    document.dispatchEvent(scrollEvent);

    // Check after event processing
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(bar.style.width).toBe("50%");
  });

  it("should update progress bar to 100% at bottom", async () => {
    initProgressBar();

    const bar = document.getElementById("myBar") as HTMLElement;

    // Simulate scroll to bottom (500 pixels scrolled)
    Object.defineProperty(document.documentElement, "scrollTop", {
      value: 500,
      writable: true,
      configurable: true,
    });

    const scrollEvent = new Event("scroll");
    document.dispatchEvent(scrollEvent);

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(bar.style.width).toBe("100%");
  });

  it("should remove existing progress bar on re-initialization", () => {
    initProgressBar();
    const firstContainer = document.getElementById("progress-container");
    expect(firstContainer).toBeTruthy();

    // Re-initialize
    initProgressBar();
    const secondContainer = document.getElementById("progress-container");

    // Should be a new element (not the same reference)
    expect(secondContainer).toBeTruthy();
    expect(secondContainer).not.toBe(firstContainer);

    // Should only have one progress bar
    const containers = document.querySelectorAll(".progress-container");
    expect(containers.length).toBe(1);
  });

  it("should attach scroll listener with passive flag", () => {
    const addEventListenerSpy = vi.spyOn(document, "addEventListener");

    initProgressBar();

    // Check that addEventListener was called with scroll event
    const scrollCall = addEventListenerSpy.mock.calls.find(
      (call) => call[0] === "scroll"
    );

    expect(scrollCall).toBeTruthy();
    // Check options (should include passive: true)
    expect(scrollCall?.[2]).toEqual({ passive: true });

    addEventListenerSpy.mockRestore();
  });

  it("should handle percentage calculation at various scroll positions", async () => {
    initProgressBar();

    const bar = document.getElementById("myBar") as HTMLElement;
    const testCases = [
      { scrollTop: 0, expected: "0%" },
      { scrollTop: 125, expected: "25%" },
      { scrollTop: 250, expected: "50%" },
      { scrollTop: 375, expected: "75%" },
      { scrollTop: 500, expected: "100%" },
    ];

    for (const testCase of testCases) {
      Object.defineProperty(document.documentElement, "scrollTop", {
        value: testCase.scrollTop,
        writable: true,
        configurable: true,
      });

      const scrollEvent = new Event("scroll");
      document.dispatchEvent(scrollEvent);

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(bar.style.width).toBe(testCase.expected);
    }
  });

  it("should use document.body.scrollTop as fallback", async () => {
    // Set documentElement.scrollTop to 0
    Object.defineProperty(document.documentElement, "scrollTop", {
      value: 0,
      writable: true,
      configurable: true,
    });

    // Initialize with body scroll instead
    initProgressBar();

    const bar = document.getElementById("myBar") as HTMLElement;

    Object.defineProperty(document.body, "scrollTop", {
      value: 250,
      writable: true,
      configurable: true,
    });

    const scrollEvent = new Event("scroll");
    document.dispatchEvent(scrollEvent);

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(bar.style.width).toBe("50%");
  });
});
