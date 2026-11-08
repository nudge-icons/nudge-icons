// A small highlighter for the code the site writes itself: JSX, Vue templates, SVG and CSS.
// Not a general parser; enough to colour comments, tags, attributes, strings and keywords.

export type TokenType =
  "comment" | "string" | "tag" | "attr" | "keyword" | "number" | "punct" | "text";

export interface Token {
  type: TokenType;
  text: string;
}

export type Lang = "tsx" | "vue" | "html" | "css";

interface State {
  lang: Lang;
  inTag: boolean;
  /** The character before the match, to tell `16` from the `16` in `x16`. */
  before: string;
}

interface Rule {
  re: RegExp;
  when?: (s: State) => boolean;
  emit: (text: string, s: State) => Token[];
}

const one = (type: TokenType) => (text: string) => [{ type, text }];

// Tried in order at each position; the first that matches wins.
const RULES: Rule[] = [
  { re: /^(?:\{\/\*[\s\S]*?\*\/\}|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->)/, emit: one("comment") },
  { re: /^\/\/[^\n]*/, when: (s) => s.lang === "tsx" && !s.inTag, emit: one("comment") },
  { re: /^(?:"[^"\n]*"|'[^'\n]*'|`[^`]*`)/, emit: one("string") },
  {
    re: /^<\/?[A-Za-z][\w.-]*/,
    when: (s) => s.lang !== "css",
    emit: (text, s) => {
      s.inTag = true;
      const close = text.startsWith("</");
      return [
        { type: "punct", text: close ? "</" : "<" },
        { type: "tag", text: text.slice(close ? 2 : 1) },
      ];
    },
  },
  {
    re: /^\/?>/,
    when: (s) => s.inTag,
    emit: (text, s) => {
      s.inTag = false;
      return [{ type: "punct", text }];
    },
  },
  { re: /^[:@]?[A-Za-z_][\w:.-]*/, when: (s) => s.inTag, emit: one("attr") },
  // A property touches its colon (`stroke:`); `.a :is(` has a space and is a selector.
  { re: /^[a-z-]+(?=:\s)/, when: (s) => s.lang === "css", emit: one("attr") },
  {
    re: /^(?:import|from|export|const|let|return|default)\b/,
    when: (s) => !s.inTag,
    emit: one("keyword"),
  },
  { re: /^\d+(?:\.\d+)?/, when: (s) => !/[\w-]/.test(s.before), emit: one("number") },
  { re: /^[{}()[\];,=]/, emit: one("punct") },
  { re: /^[A-Za-z_$][\w$-]*/, emit: one("text") },
];

export function tokenize(code: string, lang: Lang): Token[] {
  const out: Token[] = [];
  const state: State = { lang, inTag: false, before: "" };
  let i = 0;
  while (i < code.length) {
    const rest = code.slice(i);
    state.before = code.charAt(i - 1);
    let tokens: Token[] = [{ type: "text", text: code.charAt(i) }];
    let length = 1;
    for (const rule of RULES) {
      if (rule.when && !rule.when(state)) continue;
      const match = rule.re.exec(rest)?.[0];
      if (!match) continue;
      tokens = rule.emit(match, state);
      length = match.length;
      break;
    }
    for (const t of tokens) {
      const last = out[out.length - 1];
      // Plain text joins up, so the output is a few spans, not one per character.
      if (t.type === "text" && last?.type === "text") last.text += t.text;
      else out.push({ ...t });
    }
    i += length;
  }
  return out;
}
