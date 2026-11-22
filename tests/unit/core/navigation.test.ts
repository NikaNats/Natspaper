import { describe, it, expect, vi } from "vitest";

vi.mock("@/config", () => ({ NAVIGATION: [] }));

import { isActive } from "@/utils/core/navigation";

describe("isActive()", () => {
  it("matches the exact localized path, with or without a trailing slash", () => {
    expect(isActive("/en/posts", "/posts", "en")).toBe(true);
    expect(isActive("/en/posts/", "/posts", "en")).toBe(true);
    expect(isActive("/ka/tags", "/tags", "ka")).toBe(true);
  });

  it("matches nested pages by their first segment", () => {
    expect(isActive("/en/posts/my-post", "/posts", "en")).toBe(true);
    expect(isActive("/en/tags/astro/2", "/tags", "en")).toBe(true);
  });

  it("does not mark Posts active on the locale homepage", () => {
    expect(isActive("/en/", "/posts", "en")).toBe(false);
    expect(isActive("/en", "/posts", "en")).toBe(false);
  });

  it("does not match a different section", () => {
    expect(isActive("/en/about", "/posts", "en")).toBe(false);
    expect(isActive("/en/archives", "/tags", "en")).toBe(false);
  });

  it("keeps the root path intact", () => {
    expect(isActive("/", "/posts", "en")).toBe(false);
  });
});
