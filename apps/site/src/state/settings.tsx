import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Animate } from "@nudge-icons/react";

export type AnimateMode = "hover" | "loop" | "once" | "3" | "off";

/** What the Customizer sets: the props of the icon in the preview and in the code. */
export interface Settings {
  color: string | null;
  strokeWidth: number;
  size: number;
  animate: AnimateMode;
  active: boolean;
}

export const DEFAULTS: Settings = {
  color: null,
  strokeWidth: 2,
  size: 24,
  animate: "hover",
  active: false,
};

export const toAnimate = (mode: AnimateMode): Animate =>
  mode === "off" ? false : mode === "3" ? 3 : mode;

/** How the gallery moves, separate from the `animate` prop: a page setting, not a component one. */
export type PageMotion = "play" | "hover" | "off";
export type Framework = "react" | "vue";
export type Theme = "light" | "dark";

function load<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v !== null && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage: the choice just is not remembered.
  }
}

function useStored<T extends string>(key: string, allowed: readonly T[], fallback: () => T) {
  const [value, setValue] = useState<T>(() => load(key, allowed, fallback()));
  const set = (v: T) => {
    setValue(v);
    save(key, v);
  };
  return [value, set] as const;
}

const reducedMotion = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

interface SettingsContext {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
  /** True when any setting differs from the library defaults. */
  changed: boolean;
  applyToAll: boolean;
  setApplyToAll: (v: boolean) => void;
  pageMotion: PageMotion;
  setPageMotion: (v: PageMotion) => void;
  framework: Framework;
  setFramework: (v: Framework) => void;
  theme: Theme;
  setTheme: (v: Theme) => void;
}

const Context = createContext<SettingsContext | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  // On by default, so selecting an icon does not undo how the gallery was styled.
  const [applyToAll, setApplyToAll] = useState(true);
  const [pageMotion, setPageMotion] = useStored<PageMotion>(
    "nudge-page-motion",
    ["play", "hover", "off"],
    () => (reducedMotion() ? "off" : "hover"),
  );
  const [framework, setFramework] = useStored<Framework>(
    "nudge-framework",
    ["react", "vue"],
    () => "react",
  );
  // Light is the main theme; dark is the alternative and is remembered once chosen.
  const [theme, setTheme] = useStored<Theme>("nudge-theme", ["light", "dark"], () => "light");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <Context
      value={{
        settings,
        update: (patch) => setSettings((s) => ({ ...s, ...patch })),
        reset: () => setSettings(DEFAULTS),
        changed: (Object.keys(DEFAULTS) as (keyof Settings)[]).some(
          (k) => settings[k] !== DEFAULTS[k],
        ),
        applyToAll,
        setApplyToAll,
        pageMotion,
        setPageMotion,
        framework,
        setFramework,
        theme,
        setTheme,
      }}
    >
      {children}
    </Context>
  );
}

export function useSettings(): SettingsContext {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useSettings needs <SettingsProvider>");
  return ctx;
}

/** The settings as one icon can use them: `active` needs a second state. */
export const forIcon = (s: Settings, entry: { icon: { hasToggle: boolean } }): Settings => ({
  ...s,
  active: entry.icon.hasToggle && s.active,
});
