/**
 * Copy Button Feature
 * Attaches copy-to-clipboard buttons to code blocks
 */

const COPY_BUTTON_LABEL = "Copy";

export function initCopyButtons(): void {
  const codeBlocks = Array.from(document.querySelectorAll("pre"));

  for (const codeBlock of codeBlocks) {
    attachCopyButtonToBlock(codeBlock);
  }
}

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

  codeBlock.setAttribute("tabindex", "0");
  codeBlock.appendChild(copyButton);

  codeBlock.parentNode?.insertBefore(wrapper, codeBlock);
  wrapper.appendChild(codeBlock);

  copyButton.addEventListener("click", async () => {
    await copyCode(codeBlock as HTMLElement, copyButton as HTMLButtonElement);
  });
}

async function copyCode(
  block: HTMLElement,
  button: HTMLButtonElement
): Promise<void> {
  const code = block.querySelector("code");
  const text = code?.innerText;

  await navigator.clipboard.writeText(text ?? "");

  button.textContent = "Copied";

  setTimeout(() => {
    button.textContent = COPY_BUTTON_LABEL;
  }, 700);
}
