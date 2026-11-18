/**
 * Component test: Datetime.astro
 * "Updated" must show for any later modification, including the same day.
 */

import { describe, it, expect } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import Datetime from "../../src/components/post/Datetime.astro";

async function render(props: Record<string, unknown>) {
  const container = await AstroContainer.create();
  // Locale defaults to "en" inside the component when none is routed.
  return container.renderToString(Datetime, { props });
}

describe("Datetime", () => {
  it("shows the publish date without 'Updated' when never modified", async () => {
    const html = await render({ pubDatetime: "2026-11-16T10:00:00Z" });
    expect(html).not.toContain("Updated");
    expect(html).toContain("2026-11-16T10:00:00.000Z");
  });

  it("shows 'Updated' for a same-day modification", async () => {
    const html = await render({
      pubDatetime: "2026-11-16T10:00:00Z",
      modDatetime: "2026-11-16T15:00:00Z",
    });
    expect(html).toContain("Updated");
    expect(html).toContain("2026-11-16T15:00:00.000Z");
  });

  it("shows 'Updated' for a later-day modification", async () => {
    const html = await render({
      pubDatetime: "2026-11-16T10:00:00Z",
      modDatetime: "2026-11-20T10:00:00Z",
    });
    expect(html).toContain("Updated");
    expect(html).toContain("2026-11-20T10:00:00.000Z");
  });

  it("ignores a modification date that is not after publication", async () => {
    const html = await render({
      pubDatetime: "2026-11-16T10:00:00Z",
      modDatetime: "2026-11-16T10:00:00Z",
    });
    expect(html).not.toContain("Updated");
  });
});
