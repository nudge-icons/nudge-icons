import { describe, expect, it } from "vitest";
import { searchEntries, type Searchable, type Variant } from "./search";

const icon = (name: string, extra: Partial<Searchable["icon"]> = {}) => ({
  name,
  category: "status",
  tags: [],
  equivalents: {},
  hasToggle: false,
  ...extra,
});
const entry = (id: string, i: Searchable["icon"], variant: Variant = "outline"): Searchable => ({
  id,
  variant,
  icon: i,
});

const heart = icon("heart", { tags: ["love"] });
const alert = icon("alert-triangle", { equivalents: { lucide: ["triangle-alert"] } });
const eye = icon("eye", { hasToggle: true, category: "interface" });
const ENTRIES = [
  entry("alert-triangle", alert),
  entry("eye", eye),
  entry("heart", heart),
  entry("heart-filled", heart, "filled"),
  entry("heart-half", heart, "half"),
];
const ids = (r: Searchable[]) => r.map((e) => e.id);
const none = new Set<never>();

describe("gallery search", () => {
  it("lists every variant as its own entry", () => {
    expect(ids(searchEntries(ENTRIES, "heart", null, none))).toEqual([
      "heart",
      "heart-filled",
      "heart-half",
    ]);
  });

  it("finds icons by tags and by names in other sets", () => {
    expect(ids(searchEntries(ENTRIES, "love", null, none))).toEqual([
      "heart",
      "heart-filled",
      "heart-half",
    ]);
    expect(ids(searchEntries(ENTRIES, "triangle alert", null, none))).toEqual(["alert-triangle"]);
  });

  it("shows only the chosen variants", () => {
    expect(ids(searchEntries(ENTRIES, "", null, new Set(["filled"] as const)))).toEqual([
      "heart-filled",
    ]);
    expect(ids(searchEntries(ENTRIES, "", null, new Set(["filled", "half"] as const)))).toEqual([
      "heart-filled",
      "heart-half",
    ]);
  });

  it("combines category and second state", () => {
    expect(ids(searchEntries(ENTRIES, "", "interface", new Set(["toggle"] as const)))).toEqual([
      "eye",
    ]);
  });
});
