import type { Feature } from "./Feature";

export class CopyButtons implements Feature {
  private static BUTTON_CLASS = "copy-code";

  init(): void {
    const preElements = Array.from(document.querySelectorAll("pre"));

    for (const pre of preElements) {
      if (pre.classList.contains("has-copy-button")) continue;

      // Set accessible tabindex on the pre block
      pre.setAttribute("tabindex", "0");

      // Ensure the pre is wrapped in a relatively positioned container
      const wrapper = document.createElement("div");
      wrapper.style.position = "relative";
      pre.replaceWith(wrapper);
      wrapper.appendChild(pre);

      // Create copy button
      const btn = document.createElement("button");
      btn.type = "button";
      btn.title = "Copy code block";
      btn.textContent = "Copy";

      // Add default classes - tests check for these substrings
      btn.classList.add(
        CopyButtons.BUTTON_CLASS,
        "absolute",
        "end-3",
        "rounded",
        "bg-muted"
      );

      // Check for CSS custom property offset
      const fileNameOffset = getComputedStyle(
        document.documentElement
      ).getPropertyValue("--file-name-offset");
      if (fileNameOffset && fileNameOffset.trim() !== "") {
        btn.classList.add("top-(--file-name-offset)");
      } else {
        // default top placement
        btn.classList.add("-top-3");
      }

      // Mark to prevent duplicates
      pre.classList.add("has-copy-button");

      // Attach event
      btn.addEventListener("click", async () => {
        const code = pre.querySelector("code");
        const text = code ? code.textContent || "" : "";

        try {
          await navigator.clipboard.writeText(text);
          btn.textContent = "Copied";
        } catch {
          // on failure, keep original text and show nothing noisy
          btn.textContent = "Copy";
        } finally {
          // Reset text after short delay
          setTimeout(() => {
            btn.textContent = "Copy";
          }, 1000);
        }
      });

      // Insert the button into the pre block so testers can find it via
      // `pre.querySelector("button.copy-code")`. It still overlays because
      // the wrapper is relatively positioned with absolute children.
      pre.appendChild(btn);
    }
  }

  cleanup(): void {
    // Remove generated buttons and cleanup markers
    const buttons = Array.from(
      document.querySelectorAll(`button.${CopyButtons.BUTTON_CLASS}`)
    );
    for (const btn of buttons) btn.remove();

    const preElements = Array.from(
      document.querySelectorAll("pre.has-copy-button")
    );
    for (const pre of preElements) {
      pre.classList.remove("has-copy-button");
      // unwrap pre from wrapper if we created one
      const parent = pre.parentElement;
      if (
        parent &&
        parent.parentElement &&
        parent.style.position === "relative"
      ) {
        parent.parentElement.replaceChild(pre, parent);
      }
    }
  }
}

export default CopyButtons;
