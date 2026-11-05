import type { Motif as MotifKind } from "@/gallery/themes";

/** The heart outline shared by the heart motif. */
const HEART_PATH =
  "M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.6.7-1.4 2.2-2.6 4.3-2.6 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21Z";

type Props = {
  kind: MotifKind;
  /** Width and height in pixels. */
  size?: number;
  /** The motif's colours: the first draws a single-colour motif, confetti cycles through them all. */
  colors: string[];
};

/** One small decorative motif of a Theme, hidden from screen readers. */
export function Motif({ kind, size = 14, colors }: Props) {
  const color = colors[0];
  const pick = (index: number) => colors[index % colors.length];
  const svg = { viewBox: "0 0 24 24", width: size, height: size, "aria-hidden": true, className: "shrink-0" } as const;

  switch (kind) {
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
  }
}
