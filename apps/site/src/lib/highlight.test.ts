import { describe, expect, it } from "vitest";
import { tokenize, type Lang, type TokenType } from "./highlight";

const typed = (code: string, lang: Lang) =>
  tokenize(code, lang)
    .filter((t) => t.type !== "text" || t.text.trim() !== "")
    .map((t) => [t.type, t.type === "text" ? t.text.trim() : t.text] as [TokenType, string]);

describe("highlight", () => {
  it("keeps the code unchanged", () => {
    const code = '{/* note */}\n<button aria-label="Bell"><Bell size={16} /></button>';
    expect(
      tokenize(code, "tsx")
        .map((t) => t.text)
        .join(""),
    ).toBe(code);
  });

  it("colours JSX comments, tags, attributes, strings and numbers", () => {
    expect(typed('{/* hi */}\n<Bell size={16} color="red" />', "tsx")).toEqual([
      ["comment", "{/* hi */}"],
      ["punct", "<"],
      ["tag", "Bell"],
      ["attr", "size"],
      ["punct", "="],
      ["punct", "{"],
      ["number", "16"],
      ["punct", "}"],
      ["attr", "color"],
      ["punct", "="],
      ["string", '"red"'],
      ["punct", "/>"],
    ]);
  });

  it("colours import keywords outside tags", () => {
    expect(typed('import { Bell } from "@nudge-icons/react";', "tsx")).toEqual([
      ["keyword", "import"],
      ["punct", "{"],
      ["text", "Bell"],
      ["punct", "}"],
      ["keyword", "from"],
      ["string", '"@nudge-icons/react"'],
      ["punct", ";"],
    ]);
  });

  it("treats text between tags as text, not as attributes", () => {
    const types = typed("<button>Alert triangle</button>", "tsx").map(([t]) => t);
    expect(types).toEqual(["punct", "tag", "punct", "text", "punct", "tag", "punct"]);
  });

  it("colours Vue bindings and HTML comments", () => {
    expect(typed('<!-- c -->\n<Bell :size="16" />', "vue")).toEqual([
      ["comment", "<!-- c -->"],
      ["punct", "<"],
      ["tag", "Bell"],
      ["attr", ":size"],
      ["punct", "="],
      ["string", '"16"'],
      ["punct", "/>"],
    ]);
  });

  it("colours CSS properties", () => {
    const tokens = typed('.nudge-bell [data-part="body"] {\n  stroke: #e11d48;\n}', "css");
    expect(tokens).toContainEqual(["attr", "stroke"]);
    expect(tokens).toContainEqual(["string", '"body"']);
    expect(tokens).not.toContainEqual(["tag", "data-part"]);
  });

  it("does not take a selector before :is() for a property", () => {
    const tokens = typed('.nudge-eye :is([data-part="a"]) {\n  stroke: red;\n}', "css");
    expect(tokens).not.toContainEqual(["attr", "nudge-eye"]);
    expect(tokens).toContainEqual(["attr", "stroke"]);
  });

  it("does not read the digits inside names as numbers", () => {
    expect(typed('<svg stroke-width="2" x1="3"', "html")).toContainEqual(["attr", "x1"]);
  });
});
