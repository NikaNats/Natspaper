/**
 * Test Suite: Copy Button Feature Module
 * Tests for copy button creation, clipboard functionality, and feedback
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { initCopyButtons } from "@/utils/features/copyButton";

describe("Copy Button Feature", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <pre><code>const greeting = "Hello, World!";</code></pre>
      <pre><code>console.log("Test");</code></pre>
      <p>Normal paragraph</p>
    `;

    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    // Mock getComputedStyle
    globalThis.getComputedStyle = vi.fn().mockReturnValue({
      getPropertyValue: () => "",
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("should find all code blocks", () => {
    initCopyButtons();

    const buttons = document.querySelectorAll("button.copy-code");
    expect(buttons.length).toBe(2);
  });

  it("should create copy button for each code block", () => {
    initCopyButtons();

    const codeBlocks = document.querySelectorAll("pre");
    for (const block of codeBlocks) {
      const button = block.querySelector("button.copy-code");
      expect(button).toBeTruthy();
      expect(button?.textContent).toBe("Copy");
    }
  });

  it("should add 'has-copy-button' class to prevent duplicates", () => {
    initCopyButtons();

    const codeBlocks = document.querySelectorAll("pre");
    for (const block of codeBlocks) {
      expect(block.classList.contains("has-copy-button")).toBe(true);
    }
  });

  it("should apply correct CSS classes to copy button", () => {
    initCopyButtons();

    const button = document.querySelector("button.copy-code");
    expect(button?.className).toContain("copy-code");
    expect(button?.className).toContain("absolute");
    expect(button?.className).toContain("end-3");
    expect(button?.className).toContain("rounded");
    expect(button?.className).toContain("bg-muted");
  });

  it("should set title for accessibility", () => {
    initCopyButtons();

    const button = document.querySelector("button.copy-code") as HTMLButtonElement;
    expect(button.title).toBe("Copy code block");
  });

  it("should set button type to 'button'", () => {
    initCopyButtons();

    const button = document.querySelector("button.copy-code") as HTMLButtonElement;
    expect(button.type).toBe("button");
  });

  it("should set tabindex on code block", () => {
    initCopyButtons();

    const codeBlock = document.querySelector("pre");
    expect(codeBlock?.getAttribute("tabindex")).toBe("0");
  });

  it("should wrap code block in div with relative position", () => {
    initCopyButtons();

    const codeBlock = document.querySelector("pre");
    const wrapper = codeBlock?.parentElement;

    expect(wrapper?.style.position).toBe("relative");
  });

  it("should copy code content to clipboard on button click", async () => {
    initCopyButtons();

    const button = document.querySelector("button.copy-code") as HTMLButtonElement;
    button.click();

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'const greeting = "Hello, World!";'
    );
  });

  it("should show 'Copied' feedback after successful copy", async () => {
    vi.useFakeTimers();

    initCopyButtons();

    const button = document.querySelector("button.copy-code") as HTMLButtonElement;
    expect(button.textContent).toBe("Copy");

    button.click();
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(button.textContent).toBe("Copied");

    vi.advanceTimersByTime(700);

    expect(button.textContent).toBe("Copy");

    vi.useRealTimers();
  });

  it("should handle copy failure gracefully", async () => {
    vi.useFakeTimers();

    // Mock clipboard failure
    const clipboardMock = navigator.clipboard
      .writeText as unknown as ReturnType<typeof vi.fn>;
    clipboardMock.mockRejectedValueOnce(new Error("Clipboard access denied"));

    initCopyButtons();

    const button = document.querySelector("button.copy-code") as HTMLButtonElement;

    button.click();
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(button.textContent).toBe("Copy failed");

    vi.advanceTimersByTime(700);

    expect(button.textContent).toBe("Copy");

    vi.useRealTimers();
  });

  it("should handle code blocks with empty content", async () => {
    document.body.innerHTML = '<pre><code></code></pre>';

    initCopyButtons();

    const button = document.querySelector("button.copy-code") as HTMLButtonElement;
    button.click();

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("");
  });

  it("should handle code blocks without code element", async () => {
    document.body.innerHTML = "<pre>Plain text content</pre>";

    initCopyButtons();

    const button = document.querySelector("button.copy-code") as HTMLButtonElement;
    button.click();

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Should not crash, should copy empty string
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("");
  });

  it("should prevent duplicate buttons on re-initialization", () => {
    initCopyButtons();

    let buttons = document.querySelectorAll("button.copy-code");
    const initialCount = buttons.length;

    // Re-initialize
    initCopyButtons();

    buttons = document.querySelectorAll("button.copy-code");
    expect(buttons.length).toBe(initialCount);
  });

  it("should add buttons to dynamically added code blocks", async () => {
    initCopyButtons();

    let buttons = document.querySelectorAll("button.copy-code");
    const initialCount = buttons.length;

    // Add new code block dynamically
    const newPre = document.createElement("pre");
    const newCode = document.createElement("code");
    newCode.textContent = "new code";
    newPre.appendChild(newCode);
    document.body.appendChild(newPre);

    // Re-initialize
    initCopyButtons();

    buttons = document.querySelectorAll("button.copy-code");
    expect(buttons.length).toBeGreaterThan(initialCount);
  });

  it("should handle file name offset styling", () => {
    // Mock getComputedStyle to return file name offset
    const getComputedStyleMock = globalThis
      .getComputedStyle as unknown as ReturnType<typeof vi.fn>;
    getComputedStyleMock.mockReturnValueOnce({
      getPropertyValue: (prop: string) => {
        if (prop === "--file-name-offset") {
          return "2.5rem";
        }
        return "";
      },
    });

    document.body.innerHTML = "<pre><code>test</code></pre>";

    initCopyButtons();

    const button = document.querySelector("button.copy-code");
    expect(button?.className).toContain("top-(--file-name-offset)");
  });

  it("should use default top class without file name offset", () => {
    document.body.innerHTML = '<pre><code>test</code></pre>';

    initCopyButtons();

    const button = document.querySelector("button.copy-code");
    expect(button?.className).toContain("-top-3");
  });
});
