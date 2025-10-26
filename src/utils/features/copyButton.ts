/**
 * Copy Button Feature Module
 * Attaches copy-to-clipboard buttons to code blocks for easy code sharing
 *
 * Features:
 * - Automatically discovers all code blocks
 * - Positions button consistently (top-right of code block)
 * - Shows visual feedback when code is copied
 * - Safe re-initialization for page transitions (Astro Islands)
 * - Handles custom file name offsets from markdown plugins
 *
 * Usage in Astro components:
 * ```ts
 * import { initCopyButtons } from "@/utils/features/copyButton";
 * document.addEventListener('astro:page-load', initCopyButtons);
 * document.addEventListener('astro:after-swap', initCopyButtons);
 * ```
 */

const COPY_BUTTON_LABEL = "Copy";
const COPIED_FEEDBACK_DURATION = 700; // milliseconds

/**
 * Attach copy buttons to all code blocks
 * Re-initialization safely handles newly added code blocks
 * Skips code blocks that already have copy buttons
 */
export function initCopyButtons(): void {
  // Find code blocks that don't already have copy buttons
  // (prevents duplicate buttons during re-initialization)
  const codeBlocks = Array.from(
    document.querySelectorAll("pre:not(.has-copy-button)")
  );

  for (const codeBlock of codeBlocks) {
    attachCopyButtonToBlock(codeBlock);
  }
}

/**
 * Attach a copy button to a specific code block
 * Handles positioning based on file name offset (from markdown plugins)
 */
function attachCopyButtonToBlock(codeBlock: Element): void {
  const wrapper = document.createElement("div");
  wrapper.style.position = "relative";

  const computedStyle = getComputedStyle(codeBlock);
  const hasFileNameOffset =
    computedStyle.getPropertyValue("--file-name-offset").trim() !== "";

  const topClass = hasFileNameOffset ? "top-(--file-name-offset)" : "-top-3";

  const copyButton = document.createElement("button");
  copyButton.className = `copy-code absolute end-3 ${topClass} rounded bg-muted border border-muted px-2 py-1 text-xs leading-4 text-foreground font-medium`;
  copyButton.textContent = COPY_BUTTON_LABEL;
  copyButton.type = "button";
  copyButton.title = "Copy code block";

  codeBlock.setAttribute("tabindex", "0");
  codeBlock.appendChild(copyButton);
  codeBlock.classList.add("has-copy-button");

  codeBlock.parentNode?.insertBefore(wrapper, codeBlock);
  wrapper.appendChild(codeBlock);

  copyButton.addEventListener("click", async () => {
    await copyCode(codeBlock as HTMLElement, copyButton);
  });
}

/**
 * Copy code block content to clipboard and show feedback
 * Shows "Copied" message for COPIED_FEEDBACK_DURATION milliseconds
 */
async function copyCode(
  block: HTMLElement,
  button: HTMLButtonElement
): Promise<void> {
  const code = block.querySelector("code");
  const text = code?.innerText;

  try {
    await navigator.clipboard.writeText(text ?? "");

    button.textContent = "Copied";

    setTimeout(() => {
      button.textContent = COPY_BUTTON_LABEL;
    }, COPIED_FEEDBACK_DURATION);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to copy code:", error);
    button.textContent = "Copy failed";
    setTimeout(() => {
      button.textContent = COPY_BUTTON_LABEL;
    }, COPIED_FEEDBACK_DURATION);
  }
}
