import { describe, expect, it } from "vitest";
import { galleryQuery, parseGalleryUrl } from "./gallery-url";

const allowed = {
  categories: ["actions", "status"],
  filters: ["new", "toggle", "filled", "half"] as const,
};

describe("gallery URL", () => {
  it("leaves the address empty for the default view", () => {
    expect(galleryQuery(parseGalleryUrl("", allowed))).toBe("");
  });

  it("round-trips search, category, filters, sort and icon", () => {
    const url = "?q=arrow&category=status&only=new,filled&sort=newest&icon=bell";
    expect(galleryQuery(parseGalleryUrl(url, allowed))).toBe(url);
  });

  it("writes filters in a fixed order", () => {
    expect(galleryQuery(parseGalleryUrl("?only=filled,new", allowed))).toBe("?only=new,filled");
  });

  it("drops unknown values instead of failing", () => {
    const s = parseGalleryUrl("?category=nope&only=bogus&sort=weird", allowed);
    expect(s.category).toBeNull();
    expect(s.filters.size).toBe(0);
    expect(s.sort).toBe("name");
  });

  it("keeps only one of filled and half", () => {
    expect([...parseGalleryUrl("?only=half,filled,toggle", allowed).filters]).toEqual([
      "half",
      "toggle",
    ]);
  });

  it("ignores filters the site does not offer right now", () => {
    const noNew = { ...allowed, filters: ["toggle", "filled", "half"] as const };
    expect(parseGalleryUrl("?only=new", noNew).filters.size).toBe(0);
  });
});

describe("gallery URL sort", () => {
  it("writes Z–A as za", () => {
    expect(galleryQuery({ ...parseGalleryUrl("", allowed), sort: "name-desc" })).toBe("?sort=za");
    expect(parseGalleryUrl("?sort=za", allowed).sort).toBe("name-desc");
  });
});
