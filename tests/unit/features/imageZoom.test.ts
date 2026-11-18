/**
 * Test Suite: ImageZoom feature
 * Lazy singleton <dialog> + delegated click-to-zoom for large article images.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ImageZoom } from "../../../src/utils/features/imageZoom";

function mockImgWidth(img: HTMLImageElement, rendered: number) {
  Object.defineProperty(img, "getBoundingClientRect", {
    value: () => ({ width: rendered, height: rendered * 0.5, left: 0, top: 0 }),
    configurable: true,
  });
}

describe("ImageZoom", () => {
  let zoom: ImageZoom;

  beforeEach(() => {
    zoom = new ImageZoom();
    document.body.innerHTML = `
      <article id="article" data-zoom-label="Enlarge" data-zoom-close-label="Close">
        <figure>
          <img id="large" src="/large.jpg" srcset="/large-800.jpg 800w, /large-1600.jpg 1600w" width="1600" height="900" alt="Thermal" />
          <figcaption>Sensor log</figcaption>
        </figure>
        <img id="small" src="/small.jpg" width="400" height="200" alt="Icon" />
        <a href="/post"><img id="linked" src="/link.jpg" width="1600" height="900" alt="Link" /></a>
      </article>`;
    mockImgWidth(document.getElementById("large") as HTMLImageElement, 720);
    mockImgWidth(document.getElementById("small") as HTMLImageElement, 400);
    mockImgWidth(document.getElementById("linked") as HTMLImageElement, 720);
  });

  afterEach(() => {
    zoom.cleanup();
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("wraps only images worth zooming and skips links and small images", () => {
    zoom.init();

    const large = document.getElementById("large")!;
    expect(large.parentElement?.classList.contains("image-zoom-trigger")).toBe(true);
    expect(large.parentElement?.getAttribute("aria-label")).toBe("Enlarge: Thermal");
    expect(document.getElementById("small")!.parentElement?.tagName).toBe("ARTICLE");
    expect(document.getElementById("linked")!.parentElement?.tagName).toBe("A");
    // Lazy singleton: no <dialog> until first click
    expect(document.querySelectorAll("dialog.image-lightbox")).toHaveLength(0);
  });

  it("does nothing outside an article page", () => {
    document.body.innerHTML = `<img src="big.webp" width="2400" height="1200">`;
    zoom.init();
    expect(document.querySelector("dialog")).toBeNull();
  });

  it("is idempotent across repeated init() calls", () => {
    zoom.init();
    zoom.init();
    expect(document.querySelectorAll("button.image-zoom-trigger")).toHaveLength(1);
  });

  it("lazily mounts the dialog on click, copies srcset & caption, clears on close", async () => {
    zoom.init();
    document.querySelector<HTMLButtonElement>("button.image-zoom-trigger")!.click();

    await vi.waitFor(() => {
      const dialog = document.querySelector<HTMLDialogElement>("dialog.image-lightbox");
      expect(dialog?.hasAttribute("open")).toBe(true);
    });

    const dialog = document.querySelector<HTMLDialogElement>("dialog.image-lightbox")!;
    const view = dialog.querySelector("img")!;
    expect(view.sizes).toBe("92vw");
    expect(view.srcset).toContain("1600w");
    expect(dialog.querySelector("p")!.textContent).toBe("Sensor log");

    dialog.click();
    await vi.waitFor(() => expect(dialog.hasAttribute("open")).toBe(false));
    expect(view.getAttribute("src")).toBeNull();
    expect(view.getAttribute("srcset")).toBeNull();
  });

  it("pre-warms on pointerover and cleanup removes the dialog", async () => {
    zoom.init();
    const trigger = document.querySelector<HTMLButtonElement>("button.image-zoom-trigger")!;
    trigger.dispatchEvent(new Event("pointerover", { bubbles: true }));
    trigger.dispatchEvent(new Event("pointerover", { bubbles: true }));

    trigger.click();
    await vi.waitFor(() =>
      expect(document.querySelector("dialog.image-lightbox")).not.toBeNull()
    );
    zoom.cleanup();
    expect(document.querySelector("dialog.image-lightbox")).toBeNull();
  });

  describe("late-loading images", () => {
    function addLateImage(parent: Element = document.getElementById("article")!) {
      const img = document.createElement("img");
      img.src = "/late.jpg";
      img.alt = "Late";
      parent.append(img);
      return img;
    }

    function finishLoading(img: HTMLImageElement, natural: number, rendered: number) {
      Object.defineProperty(img, "naturalWidth", { value: natural, configurable: true });
      mockImgWidth(img, rendered);
      img.dispatchEvent(new Event("load"));
    }

    it("wraps an image with unknown size once it loads and is large enough", () => {
      const late = addLateImage();
      zoom.init();
      expect(late.parentElement?.tagName).toBe("ARTICLE");

      finishLoading(late, 1600, 720);

      expect(late.parentElement?.classList.contains("image-zoom-trigger")).toBe(true);
    });

    it("leaves a late image unwrapped when it is too small to gain detail", () => {
      const late = addLateImage();
      zoom.init();

      finishLoading(late, 400, 400);

      expect(late.parentElement?.tagName).toBe("ARTICLE");
    });

    it("cleanup() aborts pending load listeners", () => {
      const late = addLateImage();
      zoom.init();
      zoom.cleanup();

      finishLoading(late, 1600, 720);

      expect(late.parentElement?.tagName).toBe("ARTICLE");
    });

    it("skips a late image that ends up inside a link", () => {
      const late = addLateImage();
      zoom.init();
      const link = document.createElement("a");
      link.href = "/x";
      document.getElementById("article")!.append(link);
      link.append(late);

      finishLoading(late, 1600, 720);

      expect(late.parentElement?.tagName).toBe("A");
    });

    it("skips a late image that ends up inside a button", () => {
      const late = addLateImage();
      zoom.init();
      const button = document.createElement("button");
      document.getElementById("article")!.append(button);
      button.append(late);

      finishLoading(late, 1600, 720);

      expect(late.parentElement?.tagName).toBe("BUTTON");
      expect(late.parentElement?.classList.contains("image-zoom-trigger")).toBe(false);
    });
  });

  it("does nothing when no image is zoomable", () => {
    document.getElementById("large")!.remove();
    document.getElementById("linked")!.remove();
    zoom.init();

    document.getElementById("small")!.click();

    expect(document.querySelector("button.image-zoom-trigger")).toBeNull();
    expect(document.querySelector("dialog.image-lightbox")).toBeNull();
  });

  describe("dismissal", () => {
    async function openDialog() {
      zoom.init();
      document.querySelector<HTMLButtonElement>("button.image-zoom-trigger")!.click();
      await vi.waitFor(() => {
        expect(
          document.querySelector("dialog.image-lightbox")?.hasAttribute("open")
        ).toBe(true);
      });
      return document.querySelector<HTMLDialogElement>("dialog.image-lightbox")!;
    }

    it("closes on the cancel event (Escape / Android back) and prevents the native close", async () => {
      const dialog = await openDialog();
      const cancel = new Event("cancel", { cancelable: true });

      dialog.dispatchEvent(cancel);

      expect(cancel.defaultPrevented).toBe(true);
      await vi.waitFor(() => expect(dialog.hasAttribute("open")).toBe(false));
    });

    it("closes when Escape is pressed", async () => {
      const dialog = await openDialog();

      dialog.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      // Browsers translate Escape into `cancel`; happy-dom does not, so emulate it.
      dialog.dispatchEvent(new Event("cancel", { cancelable: true }));

      await vi.waitFor(() => expect(dialog.hasAttribute("open")).toBe(false));
    });
  });

  describe("animation and fallbacks", () => {
    const restore: Array<() => void> = [];

    function define(target: object, key: string, value: unknown) {
      const had = Object.getOwnPropertyDescriptor(target, key);
      Object.defineProperty(target, key, { value, configurable: true, writable: true });
      restore.push(() => {
        if (had) Object.defineProperty(target, key, had);
        else delete (target as Record<string, unknown>)[key];
      });
    }

    function stubAnimate() {
      const cancel = vi.fn();
      const animate = vi.fn(() => ({ finished: Promise.resolve(), cancel }));
      define(HTMLImageElement.prototype, "animate", animate);
      // Lightbox image: centred, larger than the 720px thumbnail.
      vi.spyOn(HTMLImageElement.prototype, "getBoundingClientRect").mockReturnValue({
        width: 1440,
        height: 720,
        left: 100,
        top: 50,
      } as DOMRect);
      return { animate, cancel };
    }

    async function open() {
      zoom.init();
      document.querySelector<HTMLButtonElement>("button.image-zoom-trigger")!.click();
      await vi.waitFor(() => {
        expect(
          document.querySelector("dialog.image-lightbox")?.hasAttribute("open")
        ).toBe(true);
      });
      return document.querySelector<HTMLDialogElement>("dialog.image-lightbox")!;
    }

    afterEach(() => {
      while (restore.length) restore.pop()!();
    });

    it("plays a FLIP from the thumbnail to the centred view on open", async () => {
      const { animate } = stubAnimate();
      await open();

      expect(animate).toHaveBeenCalledTimes(1);
      const [frames, options] = animate.mock.calls[0] as unknown as [
        Array<{ transform: string }>,
        { duration: number },
      ];
      expect(frames[0]!.transform).toMatch(/^translate3d\(.+\) scale\(0\.5\)$/);
      expect(frames[1]!.transform).toBe("translate3d(0, 0, 0) scale(1)");
      expect(options.duration).toBeGreaterThan(0);
    });

    it("plays the reverse FLIP on close, cancels it, then closes the dialog", async () => {
      const { animate, cancel } = stubAnimate();
      const dialog = await open();
      animate.mockClear();

      dialog.click();

      await vi.waitFor(() => expect(dialog.hasAttribute("open")).toBe(false));
      expect(animate).toHaveBeenCalledTimes(1);
      const [frames, options] = animate.mock.calls[0] as unknown as [
        Array<{ transform: string }>,
        { fill: string },
      ];
      expect(frames[0]!.transform).toBe("translate3d(0, 0, 0) scale(1)");
      expect(options.fill).toBe("forwards");
      expect(cancel).toHaveBeenCalled();
    });

    it("still closes when the close animation is cancelled", async () => {
      const { animate } = stubAnimate();
      const dialog = await open();
      animate.mockReturnValue({
        finished: Promise.reject(new Error("cancelled")),
        cancel: vi.fn(),
      });

      dialog.click();

      await vi.waitFor(() => expect(dialog.hasAttribute("open")).toBe(false));
    });

    it("skips animation when the user prefers reduced motion", async () => {
      const { animate } = stubAnimate();
      define(window, "matchMedia", () => ({ matches: true }));
      const dialog = await open();

      dialog.click();

      await vi.waitFor(() => expect(dialog.hasAttribute("open")).toBe(false));
      expect(animate).not.toHaveBeenCalled();
    });

    it("falls back to the open attribute when showModal/close are unavailable", async () => {
      define(HTMLDialogElement.prototype, "showModal", undefined);
      define(HTMLDialogElement.prototype, "close", undefined);
      const dialog = await open();
      const closed = vi.fn();
      dialog.addEventListener("close", closed);

      dialog.click();

      await vi.waitFor(() => expect(dialog.hasAttribute("open")).toBe(false));
      expect(closed).toHaveBeenCalled();
    });

    it("waits for decode() and tolerates it rejecting", async () => {
      const decode = vi.fn(() => Promise.reject(new Error("bad image")));
      define(HTMLImageElement.prototype, "decode", decode);

      await open();

      expect(decode).toHaveBeenCalled();
    });

    it("does not open when cleaned up while the image is still decoding", async () => {
      let release!: () => void;
      define(
        HTMLImageElement.prototype,
        "decode",
        () => new Promise<void>(resolve => (release = resolve))
      );
      zoom.init();
      document.querySelector<HTMLButtonElement>("button.image-zoom-trigger")!.click();

      zoom.cleanup();
      release();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(document.querySelector("dialog.image-lightbox")).toBeNull();
    });

    it("ignores a second click while the first open is in flight", async () => {
      zoom.init();
      const trigger = document.querySelector<HTMLButtonElement>("button.image-zoom-trigger")!;

      trigger.click();
      trigger.click();

      await vi.waitFor(() =>
        expect(document.querySelectorAll("dialog.image-lightbox")).toHaveLength(1)
      );
    });

    it("ignores clicks that are not on a zoom trigger", () => {
      zoom.init();

      document.querySelector("figcaption")!.click();

      expect(document.querySelector("dialog.image-lightbox")).toBeNull();
    });

    it("opens an image without srcset using only its src", async () => {
      const plain = document.createElement("img");
      plain.src = "/plain.jpg";
      plain.setAttribute("width", "1600");
      plain.setAttribute("height", "900");
      document.getElementById("article")!.prepend(plain);
      mockImgWidth(plain, 720);
      zoom.init();

      plain.parentElement!.click();
      await vi.waitFor(() =>
        expect(document.querySelector("dialog.image-lightbox")?.hasAttribute("open")).toBe(true)
      );

      const view = document.querySelector("dialog.image-lightbox img")!;
      expect(view.hasAttribute("srcset")).toBe(false);
      expect(view.getAttribute("src")).toContain("plain.jpg");
    });

    it("pre-warms an image only once", () => {
      zoom.init();
      const thumb = document.getElementById("large") as HTMLImageElement;
      const spy = vi.spyOn(window, "Image");

      thumb.dispatchEvent(new Event("pointerover", { bubbles: true }));
      thumb.dispatchEvent(new Event("pointerover", { bubbles: true }));
      thumb.dispatchEvent(new Event("focusin", { bubbles: true }));

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
