import type { Theme } from "@/gallery/themes";

/** The heart outline, shared by the heart motif and the Wordmark's heart. */
export const HEART_PATH =
  "M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.6.7-1.4 2.2-2.6 4.3-2.6 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21Z";

type Props = {
  theme: Theme;
  /** Width and height in pixels. */
  size?: number;
  /**
   * The colour of a single-colour motif; the Theme's main motif colour when
   * not given. Confetti ignores it and always cycles through all the Theme's
   * motif colours.
   */
  color?: string;
};

/** One small decorative motif of a Theme, hidden from screen readers. */
export function Motif({ theme, size = 14, color = theme.motifColors[0] }: Props) {
  const colors = theme.motifColors;
  const pick = (index: number) => colors[index % colors.length];
  const svg = { viewBox: "0 0 24 24", width: size, height: size, "aria-hidden": true, className: "shrink-0" } as const;

  switch (theme.motif) {
    case "heart":
      return (
        <svg {...svg}>
          <path d={HEART_PATH} fill={color} />
        </svg>
      );
    case "snowflake":
      return (
        <svg {...svg} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7" />
          <path d="m9.5 3.8 2.5 2 2.5-2M9.5 20.2l2.5-2 2.5 2M3.6 10.2l3.2-.5-1-3M20.4 13.8l-3.2.5 1 3M3.6 13.8l3.2.5-1 3M20.4 10.2l-3.2-.5 1-3" />
        </svg>
      );
    case "star":
      return (
        <svg {...svg}>
          <path d="m12 2.5 2.8 6.1 6.7.7-5 4.5 1.4 6.6L12 17l-5.9 3.4 1.4-6.6-5-4.5 6.7-.7Z" fill={color} />
        </svg>
      );
    case "confetti":
      return (
        <svg {...svg}>
          <rect x="2" y="4" width="5" height="3" rx="1" fill={pick(0)} transform="rotate(-20 4.5 5.5)" />
          <circle cx="16" cy="5" r="2" fill={pick(1)} />
          <rect x="10" y="11" width="5" height="3" rx="1" fill={pick(2)} transform="rotate(30 12.5 12.5)" />
          <circle cx="5" cy="17" r="2" fill={pick(3)} />
          <rect x="16" y="17" width="5" height="3" rx="1" fill={pick(4)} transform="rotate(-35 18.5 18.5)" />
        </svg>
      );
    case "egg":
      return (
        <svg {...svg}>
          <path d="M12 2.5c-3.9 0-7 6.1-7 11 0 4.4 3 8 7 8s7-3.6 7-8c0-4.9-3.1-11-7-11Z" fill={color} />
          <path d="M5.6 12.2 8.3 14l2.4-2 2.6 2 2.4-2 3.1 2" fill="none" stroke={pick(1)} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="17.6" r="1.2" fill={pick(1)} />
        </svg>
      );
    case "paper-plane":
      return (
        <svg {...svg} fill="none" stroke={color} strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round">
          <path d="M21.5 3 2.5 10.6l7.1 3.2L21.5 3Z" fill={color} fillOpacity="0.25" />
          <path d="M21.5 3 9.6 13.8l1.6 7.2 3.2-4.6L21.5 3Z" fill={color} fillOpacity="0.5" />
          <path d="m9.6 13.8 4.8 2.6" />
        </svg>
      );
    case "mountain":
      return (
        <svg {...svg}>
          <path d="M1.5 20.5 9 7l4.2 7.2 2.3-3.7 7 10H1.5Z" fill={color} />
          <path d="M9 7 6.6 11.3l1.3-.6 1.1 1 1.2-1 1.2.6L9 7Z" fill="#FFFFFF" fillOpacity="0.85" />
        </svg>
      );
  }
}
