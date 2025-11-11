/**
 * Copy Buttons Feature Class
 * Attaches copy-to-clipboard buttons to code blocks for easy code sharing
 *
 * Features:
 * - Automatically discovers all code blocks
 * - Positions button consistently (top-right of code block)
 * - Shows visual feedback when code is copied
 * - Safe re-initialization for page transitions (Astro Islands)
 * - Handles custom file name offsets from markdown plugins
 * - Proper cleanup for memory management
 *
 * Usage:
 * ```ts
 * const copyButtons = new CopyButtons();
 * copyButtons.init(); // Initialize the feature
 * copyButtons.cleanup(); // Clean up when done
 * ```
 */

import type { Feature } from "./Feature";

export class CopyButtons implements Feature {
  private readonly COPY_LABEL = "Copy";
  private readonly COPIED_LABEL = "Copied";
  private readonly COPY_FAILED_LABEL = "Copy failed";
  private readonly FEEDBACK_DURATION = 700; // milliseconds

  /**
   * Initialize the copy buttons feature
   * Attaches copy buttons to all code blocks that don't already have them
   * Safe to call multiple times (re-initialization for page transitions)
   */
  public init(): void {
    const codeBlocks = document.querySelectorAll<HTMLElement>(
      "pre:not(.has-copy-button)"
    );
    codeBlocks.forEach(block => this.attachButton(block));
  }

  /**
   * Clean up the copy buttons feature
   * Since buttons are part of the DOM that gets replaced during navigation,
   * cleanup is less critical here, but good practice for consistency
   */
  public cleanup(): void {
    // Buttons are part of the DOM that gets replaced, so manual cleanup is less critical here,
    // but good practice for more complex listeners or persistent state.
  }

  /**
   * Attach a copy button to a specific code block
   * Handles positioning based on file name offset (from markdown plugins)
   */
  private attachButton(codeBlock: HTMLElement): void {
    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";

    const computedStyle = getComputedStyle(codeBlock);
    const hasFileNameOffset =
      computedStyle.getPropertyValue("--file-name-offset").trim() !== "";

    const topClass = hasFileNameOffset ? "top-(--file-name-offset)" : "-top-3";

    const copyButton = document.createElement("button");
    copyButton.className = `copy-code absolute end-3 ${topClass} rounded bg-muted border border-muted px-2 py-1 text-xs leading-4 text-foreground font-medium`;
    copyButton.textContent = this.COPY_LABEL;
    copyButton.type = "button";
    copyButton.title = "Copy code block";

    codeBlock.setAttribute("tabindex", "0");
    codeBlock.appendChild(copyButton);
    codeBlock.classList.add("has-copy-button");

    codeBlock.parentNode?.insertBefore(wrapper, codeBlock);
    wrapper.appendChild(codeBlock);

    copyButton.addEventListener("click", () =>
      this.handleCopy(codeBlock, copyButton)
    );
  }

  /**
   * Handle copying code block content to clipboard and show feedback
   * Shows appropriate message for COPIED_FEEDBACK_DURATION milliseconds
   */
  private async handleCopy(
    block: HTMLElement,
    button: HTMLButtonElement
  ): Promise<void> {
    const code = block.querySelector("code");
    const text = code?.innerText ?? "";

    try {
      await navigator.clipboard.writeText(text);
      button.textContent = this.COPIED_LABEL;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to copy code:", error);
      button.textContent = this.COPY_FAILED_LABEL;
    } finally {
      setTimeout(() => {
        button.textContent = this.COPY_LABEL;
      }, this.FEEDBACK_DURATION);
    }
  }
}
