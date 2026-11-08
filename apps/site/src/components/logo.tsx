import { useState } from "react";

/**
 * The mark: a dot pushed by three motion lines. On load it plays once in full (the circle
 * draws, the lines appear one by one, push it, it bounces back); on hover only the push.
 * Drawn on the icon grid with the library's stroke rules. Static under reduced motion.
 */
export function Logo() {
  const [intro, setIntro] = useState(true);
  return (
    <svg
      className={`logo ${intro ? "logo-intro" : "logo-ready"}`}
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      onAnimationEnd={(e) => {
        if (e.animationName === "logo-dot-intro") setIntro(false);
      }}
    >
      <g className="logo-lines">
        <path className="logo-line" d="M3 9h4" />
        <path className="logo-line" d="M2.5 12h3" />
        <path className="logo-line" d="M3 15h4" />
      </g>
      <circle className="logo-dot" cx="15" cy="12" r="6" pathLength="1" />
    </svg>
  );
}
