import { describe, expect, it } from "vitest";
import { getPostTitleTransitionName } from "@/utils/post";

describe("getPostTitleTransitionName", () => {
  it("uses the final slug segment for locale-prefixed paths", () => {
    const transitionName = getPostTitleTransitionName(
      "en/how-to-add-latex-equations-in-blog-posts"
    );

    expect(transitionName).toBe(
      "post-title-how-to-add-latex-equations-in-blog-posts"
    );
  });

  it("normalizes mixed-case slug segments", () => {
    const transitionName = getPostTitleTransitionName(
      "en/System-Design-Part-2"
    );

    expect(transitionName).toBe("post-title-system-design-part-2");
  });

  it("handles href-style values with trailing slash", () => {
    const transitionName = getPostTitleTransitionName(
      "/en/posts/how-to-add-latex-equations-in-blog-posts/"
    );

    expect(transitionName).toBe(
      "post-title-how-to-add-latex-equations-in-blog-posts"
    );
  });

  it("falls back to a deterministic hash when slug has no ASCII token", () => {
    const georgianSlug = "ka/ფიზიკის საფუძვლები";

    const first = getPostTitleTransitionName(georgianSlug);
    const second = getPostTitleTransitionName(georgianSlug);

    expect(first).toMatch(/^post-title-h[a-z0-9]+$/);
    expect(second).toBe(first);
  });

  it("returns a safe default for empty slug values", () => {
    expect(getPostTitleTransitionName("")).toBe("post-title-post");
  });
});
