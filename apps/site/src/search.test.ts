import { describe, expect, it } from "vitest";
import {
  compareVersions,
  relatedEntries,
  searchEntries,
  type Searchable,
  type Variant,
} from "./search";

const icon = (name: string, extra: Partial<Searchable["icon"]> = {}) => ({
  name,
  category: "status",
  tags: [],
  equivalents: {},
  hasToggle: false,
  since: "0.1.0",
  isNew: false,
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

describe("related icons", () => {
  const bell = icon("bell", { tags: ["notification", "alert"], category: "interface" });
  const alertIcon = icon("alert-triangle", { tags: ["alert", "warning"] });
  const check = icon("check", { category: "actions" });
  const checkCircle = icon("check-circle", { category: "status" });
  const menu = icon("menu", { category: "interface" });
  const all = [
    entry("alert-triangle", alertIcon),
    entry("bell", bell),
    entry("bell-filled", bell, "filled"),
    entry("check", check),
    entry("check-circle", checkCircle),
    entry("menu", menu),
  ];
  const related = (id: string) => {
    const current = all.find((e) => e.id === id);
    if (!current) throw new Error(id);
    return relatedEntries(all, current).map((e) => e.id);
  };

  it("finds icons by shared tags and shared name words", () => {
    expect(related("bell")[0]).toBe("alert-triangle");
    expect(related("check")[0]).toBe("check-circle");
  });

  it("leaves out the icon itself and its variants", () => {
    expect(related("bell-filled")).not.toContain("bell");
    expect(related("bell-filled")).not.toContain("bell-filled");
  });

  it("matches plural and singular names", () => {
    const user = icon("user");
    const users = icon("users");
    const current = entry("user", user);
    const list = [current, entry("users", users)];
    expect(relatedEntries(list, current).map((e) => e.id)).toEqual(["users"]);
  });

  it("fills up from the same category, after the real matches", () => {
    expect(related("menu")).toEqual(["bell"]);
    expect(related("bell")[0]).toBe("alert-triangle");
  });
});

describe("new icons", () => {
  const old = icon("bell");
  const fresh = icon("sun", { since: "0.10.0", isNew: true });
  const list = [entry("bell", old), entry("sun", fresh)];

  it("filters to the latest release", () => {
    expect(ids(searchEntries(list, "", null, new Set(["new"] as const)))).toEqual(["sun"]);
  });

  it("sorts newest first, comparing versions as numbers", () => {
    expect(ids(searchEntries(list, "", null, none, "newest"))).toEqual(["sun", "bell"]);
    expect(compareVersions("0.10.0", "0.9.0")).toBeGreaterThan(0);
  });
});

describe("Z–A", () => {
  it("reverses icon names and keeps each icon's variants together, outline first", () => {
    expect(ids(searchEntries(ENTRIES, "", null, none, "name-desc"))).toEqual([
      "heart",
      "heart-filled",
      "heart-half",
      "eye",
      "alert-triangle",
    ]);
  });
});
