/**
 * Image Zoom Feature Class (WAAPI FLIP + lazy singleton <dialog>)
 * ===============================================================
 * Zero external dependencies, CSP-safe (no inline style="" attributes).
 *
 * - Event delegation on #article: O(1) listeners regardless of image count.
 * - Lazy singleton <dialog>: no DOM/memory cost until the first interaction.
 * - CSS grid centering: no JS resize listener needed to stay centered.
 * - Compositor-only WAAPI FLIP animation (transform only, no forced reflow).
 */

import type { Feature } from "./Feature";

/** Intrinsic width must exceed rendered width by this factor to be zoomable. */
const MIN_ZOOM_GAIN = 1.15;
/** Cap decode wait so slow networks never make a click feel unresponsive. */
const DECODE_TIMEOUT_MS = 350;
const OPEN_DURATION_MS = 280;
const CLOSE_DURATION_MS = 220;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const TRIGGER_SELECTOR = "button.image-zoom-trigger";
/** `sizes` hint for the enlarged view so the browser picks a hi-res candidate. */
const LIGHTBOX_SIZES = "92vw";
const IDENTITY_TRANSFORM = "translate3d(0, 0, 0) scale(1)";

type ZoomState = "idle" | "opening" | "open" | "closing";

interface DialogRefs {
  dialog: HTMLDialogElement;
  view: HTMLImageElement;
  caption: HTMLParagraphElement;
}

export class ImageZoom implements Feature {
  #refs: DialogRefs | null = null;
  #controller: AbortController | null = null;
  #warmed: WeakSet<HTMLImageElement> | null = null;
  #prewarmImg: HTMLImageElement | null = null;
  #activeThumb: HTMLImageElement | null = null;
  #state: ZoomState = "idle";
  #enlargeLabel = "Enlarge image";
  #closeLabel = "Close";

  public init(): void {
    this.cleanup();

    const article = document.getElementById("article");
    if (!article) return;

    const images = article.querySelectorAll<HTMLImageElement>("img");
    if (images.length === 0) return;

    this.#enlargeLabel = article.dataset.zoomLabel || "Enlarge image";
    this.#closeLabel = article.dataset.zoomCloseLabel || "Close";

    // The controller exists before the scan so late-loading images can hook in.
    this.#controller = new AbortController();
    this.#warmed = new WeakSet();
    const { signal } = this.#controller;

    let zoomableCount = 0;
    for (const img of images) {
      if (this.#isWrapped(img)) {
        zoomableCount++;
      } else if (img.closest("a, button")) {
        continue;
      } else if (this.#hasKnownSize(img)) {
        if (this.#wrapIfZoomable(img, article)) zoomableCount++;
      } else {
        // Intrinsic size unknown until the bitmap loads: decide then, instead
        // of silently skipping images that were still in flight at init time.
        img.addEventListener(
          "load",
          () => {
            this.#wrapIfZoomable(img, article);
          },
          { once: true, signal }
        );
        zoomableCount++;
      }
    }

    if (zoomableCount === 0) {
      this.cleanup();
      return;
    }

    const thumbFrom = (event: Event): HTMLImageElement | null => {
      const target = event.target;
      if (!(target instanceof Element)) return null;
      return (
        target
          .closest<HTMLButtonElement>(TRIGGER_SELECTOR)
          ?.querySelector("img") ?? null
      );
    };

    // Single delegated listener handles clicks across all wrapped images.
    article.addEventListener(
      "click",
      event => {
        const thumb = thumbFrom(event);
        if (thumb) void this.#open(thumb, signal);
      },
      { signal }
    );

    // Pre-warm the high-res srcset candidate once on first interest.
    const onInterest = (event: Event): void => {
      const thumb = thumbFrom(event);
      if (thumb) this.#warmUp(thumb);
    };
    article.addEventListener("pointerover", onInterest, {
      passive: true,
      signal,
    });
    article.addEventListener("focusin", onInterest, { passive: true, signal });
    article.addEventListener("touchstart", onInterest, {
      passive: true,
      signal,
    });
  }

  public cleanup(): void {
    this.#controller?.abort();
    this.#controller = null;
    this.#warmed = null;
    this.#activeThumb = null;
    this.#state = "idle";

    if (this.#prewarmImg) {
      this.#prewarmImg.removeAttribute("srcset");
      this.#prewarmImg.removeAttribute("src");
      this.#prewarmImg = null;
    }

    if (this.#refs) {
      const { dialog } = this.#refs;
      if (dialog.open && typeof dialog.close === "function") {
        dialog.close();
      }
      dialog.remove();
      this.#refs = null;
    }
  }

  #isWrapped(img: HTMLImageElement): boolean {
    return img.parentElement?.classList.contains("image-zoom-trigger") ?? false;
  }

  #intrinsicWidth(img: HTMLImageElement): number {
    return (
      Number.parseInt(img.getAttribute("width") ?? "", 10) || img.naturalWidth
    );
  }

  #hasKnownSize(img: HTMLImageElement): boolean {
    return this.#intrinsicWidth(img) > 0;
  }

  #isWorthZooming(img: HTMLImageElement, article: HTMLElement): boolean {
    const intrinsic = this.#intrinsicWidth(img);
    // Zero width means "not laid out yet" (hidden container, no CSS yet):
    // fall back to the column width, the most the image can ever render at.
    const rendered = img.getBoundingClientRect().width || article.clientWidth;
    if (!intrinsic || !rendered) return false;
    return intrinsic > rendered * MIN_ZOOM_GAIN;
  }

  /** Single eligibility gate shared by the init scan and late `load` events. */
  #wrapIfZoomable(img: HTMLImageElement, article: HTMLElement): boolean {
    if (img.closest("a, button") || !this.#isWorthZooming(img, article)) {
      return false;
    }
    this.#wrap(img);
    return true;
  }

  #wrap(img: HTMLImageElement): void {
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "image-zoom-trigger";
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute(
      "aria-label",
      img.alt ? `${this.#enlargeLabel}: ${img.alt}` : this.#enlargeLabel
    );
    img.replaceWith(trigger);
    trigger.append(img);
  }

  #warmUp(thumb: HTMLImageElement): void {
    if (!thumb.srcset || this.#warmed?.has(thumb)) return;
    this.#warmed?.add(thumb);
    this.#prewarmImg ??= new Image();
    this.#prewarmImg.decoding = "async";
    this.#prewarmImg.sizes = LIGHTBOX_SIZES;
    this.#prewarmImg.srcset = thumb.srcset;
  }

  #ensureDialog(): DialogRefs {
    if (this.#refs) return this.#refs;

    const dialog = document.createElement("dialog");
    dialog.className = "image-lightbox";
    dialog.setAttribute("aria-label", this.#enlargeLabel);

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "image-lightbox__close";
    closeBtn.setAttribute("aria-label", this.#closeLabel);
    closeBtn.textContent = "×";
    closeBtn.autofocus = true;

    const view = document.createElement("img");
    view.className = "image-lightbox__img";
    view.decoding = "async";

    const caption = document.createElement("p");
    caption.className = "image-lightbox__caption";

    dialog.append(closeBtn, view, caption);
    document.body.append(dialog);

    const signal = this.#controller?.signal;

    // Any click inside the dialog (backdrop, image, caption, close) closes it.
    dialog.addEventListener("click", () => void this.#close(), { signal });

    // Intercept Escape / Android back so the reverse FLIP animation runs.
    dialog.addEventListener(
      "cancel",
      event => {
        event.preventDefault();
        void this.#close();
      },
      { signal }
    );

    // Release the decoded high-res bitmap as soon as the dialog closes.
    dialog.addEventListener(
      "close",
      () => {
        delete dialog.dataset.closing;
        view.removeAttribute("srcset");
        view.removeAttribute("src");
        view.removeAttribute("width");
        view.removeAttribute("height");
        this.#activeThumb = null;
        this.#state = "idle";
      },
      { signal }
    );

    this.#refs = { dialog, view, caption };
    return this.#refs;
  }

  async #open(thumb: HTMLImageElement, signal: AbortSignal): Promise<void> {
    if (this.#state !== "idle") return;
    this.#state = "opening";

    const { dialog, view, caption } = this.#ensureDialog();
    const thumbRect = thumb.getBoundingClientRect();

    // Reserve the exact aspect ratio so CSS centering computes the final box
    // accurately even if decoding hits the timeout on a slow connection.
    const natW =
      thumb.naturalWidth || thumb.width || Math.round(thumbRect.width);
    const natH =
      thumb.naturalHeight || thumb.height || Math.round(thumbRect.height);
    if (natW > 0 && natH > 0) {
      view.width = natW;
      view.height = natH;
    }

    if (thumb.srcset) {
      view.sizes = LIGHTBOX_SIZES;
      view.srcset = thumb.srcset;
    } else {
      view.removeAttribute("srcset");
    }
    view.src = thumb.currentSrc || thumb.src;
    view.alt = thumb.alt;

    const figCaption = thumb
      .closest("figure")
      ?.querySelector("figcaption")?.textContent;
    caption.textContent = figCaption?.trim() || "";
    caption.hidden = !caption.textContent;

    await this.#waitDecode(view);
    if (signal.aborted || !dialog.isConnected || !thumb.isConnected) {
      this.#state = "idle";
      return;
    }

    this.#activeThumb = thumb;
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
    this.#state = "open";

    this.#flip(view, view.getBoundingClientRect(), thumbRect, "in", {
      duration: OPEN_DURATION_MS,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    });
  }

  async #close(): Promise<void> {
    if (this.#state !== "open" || !this.#refs) return;
    this.#state = "closing";

    const { dialog, view } = this.#refs;
    const thumb = this.#activeThumb;
    dialog.dataset.closing = "true";

    const anim = thumb?.isConnected
      ? this.#flip(
          view,
          view.getBoundingClientRect(),
          thumb.getBoundingClientRect(),
          "out",
          {
            duration: CLOSE_DURATION_MS,
            easing: "cubic-bezier(0.4, 0, 0.2, 1)",
            fill: "forwards",
          }
        )
      : null;

    if (anim) {
      try {
        await anim.finished;
      } catch {
        // Animation cancelled (e.g. page transition) — still close cleanly.
      }
      anim.cancel();
    }

    if (typeof dialog.close === "function") {
      if (dialog.open) dialog.close();
    } else {
      dialog.removeAttribute("open");
      dialog.dispatchEvent(new Event("close"));
    }
  }

  /**
   * FLIP: animates `view` (whose layout box is `layout`) between its resting
   * place and the box of `other` using compositor-only transforms.
   * "in" plays other -> layout; "out" plays layout -> other.
   */
  #flip(
    view: HTMLImageElement,
    layout: DOMRect,
    other: DOMRect,
    direction: "in" | "out",
    options: KeyframeAnimationOptions
  ): Animation | null {
    if (this.#prefersReducedMotion() || typeof view.animate !== "function") {
      return null;
    }
    if (layout.width <= 0 || other.width <= 0) return null;

    const dx = other.left + other.width / 2 - (layout.left + layout.width / 2);
    const dy = other.top + other.height / 2 - (layout.top + layout.height / 2);
    const scale = other.width / layout.width;
    const displaced = `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`;

    const frames =
      direction === "in"
        ? [{ transform: displaced }, { transform: IDENTITY_TRANSFORM }]
        : [{ transform: IDENTITY_TRANSFORM }, { transform: displaced }];
    return view.animate(frames, options);
  }

  #waitDecode(img: HTMLImageElement): Promise<void> {
    if (typeof img.decode !== "function") return Promise.resolve();
    return Promise.race([
      img.decode().catch(() => undefined),
      new Promise<void>(resolve => setTimeout(resolve, DECODE_TIMEOUT_MS)),
    ]);
  }

  #prefersReducedMotion(): boolean {
    return (
      typeof window.matchMedia === "function" &&
      window.matchMedia(REDUCED_MOTION_QUERY).matches
    );
  }
}
