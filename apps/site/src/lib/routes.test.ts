import { describe, expect, it } from "vitest";
import { allPaths, matchPath, pathFor } from "./routes";

describe("routes", () => {
  it("match the gallery, with or without the trailing slash", () => {
    expect(matchPath("/")).toEqual({ page: "gallery" });
    expect(matchPath("")).toEqual({ page: "gallery" });
  });

  it("match an icon page and take its name", () => {
    expect(matchPath("/icons/heart-filled")).toEqual({ page: "icon", name: "heart-filled" });
    expect(matchPath("/icons/heart-filled/")).toEqual({ page: "icon", name: "heart-filled" });
  });

  it("send unknown paths to not-found instead of the gallery", () => {
    expect(matchPath("/nope")).toEqual({ page: "not-found" });
    expect(matchPath("/icons/")).toEqual({ page: "not-found" });
    expect(matchPath("/icons/Heart")).toEqual({ page: "not-found" });
    expect(matchPath("/icons/heart/extra")).toEqual({ page: "not-found" });
  });

  it("build paths that match back to the same route", () => {
    const icon = { page: "icon", name: "clock" } as const;
    expect(pathFor(icon)).toBe("/icons/clock");
    expect(matchPath(pathFor(icon))).toEqual(icon);
  });

  it("list every page for the build", () => {
    expect(allPaths(["bell", "clock"])).toEqual(["/", "/icons/bell", "/icons/clock"]);
  });
});
