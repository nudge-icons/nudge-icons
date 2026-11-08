import { useState, type AnimationEvent } from "react";
import type { Animate } from "@nudge-icons/react";

/**
 * Replay plays the motion once whatever the mode: with "hover" a remount alone shows
 * nothing until the pointer reaches the icon. When every part has finished, the preview
 * goes back to the chosen mode.
 */
export function useReplay(mode: Animate) {
  const [run, setRun] = useState(0);
  const [once, setOnce] = useState(false);
  return {
    key: run,
    animate: once ? ("once" as const) : mode,
    replay: () => {
      setRun((n) => n + 1);
      setOnce(true);
    },
    // Parts end at different times; wait until none is still running.
    onAnimationEnd: (e: AnimationEvent<HTMLElement>) => {
      const box = e.currentTarget;
      requestAnimationFrame(() => {
        if (box.getAnimations({ subtree: true }).length === 0) setOnce(false);
      });
    },
  };
}
