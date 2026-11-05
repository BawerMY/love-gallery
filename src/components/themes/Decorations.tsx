import type { CSSProperties } from "react";
import type { Theme } from "@/gallery/themes";
import { Motif } from "./Motif";

/** A thin rule with three of the Theme's motifs in the middle, framing a title page. */
export function MotifDivider({ theme, color }: { theme: Theme; color: string }) {
  const [first, second = first] = theme.motifColors;
  const motif = (size: number, main: string) => <Motif theme={theme} size={size} color={main} />;
  return (
    <div className="flex items-center justify-center gap-2.5" aria-hidden="true">
      <span className="h-px w-14 opacity-40" style={{ backgroundColor: color }} />
      {motif(11, second)}
      {motif(18, first)}
      {motif(11, second)}
      <span className="h-px w-14 opacity-40" style={{ backgroundColor: color }} />
    </div>
  );
}

/** Where a corner cluster sits, and how it's mirrored so each one faces inwards. */
const CORNERS: CSSProperties[] = [
  { left: 10, top: 10 },
  { right: 10, top: 10, transform: "scaleX(-1)" },
  { left: 10, bottom: 10, transform: "scaleY(-1)" },
  { right: 10, bottom: 10, transform: "scale(-1)" },
];

/** A cluster's motifs: offset from its corner in pixels, size, and which motif colour. */
const CLUSTER = [
  { left: 0, top: 0, size: 22, color: 0 },
  { left: 30, top: 6, size: 12, color: 1 },
  { left: 8, top: 30, size: 14, color: 2 },
  { left: 50, top: 28, size: 8, color: 0 },
];

/** Faint clusters of the Theme's motif in the four corners of the nearest positioned parent. */
export function CornerMotifs({ theme }: { theme: Theme }) {
  const colors = theme.motifColors;
  return CORNERS.map((corner, index) => (
    <div key={index} className="pointer-events-none absolute h-14 w-[70px] opacity-30" style={corner} aria-hidden="true">
      {CLUSTER.map((motif, motifIndex) => (
        <span key={motifIndex} className="absolute" style={{ left: motif.left, top: motif.top }}>
          <Motif theme={theme} size={motif.size} color={colors[motif.color % colors.length]} />
        </span>
      ))}
    </div>
  ));
}
