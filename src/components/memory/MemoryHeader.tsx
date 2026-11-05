import { OccasionBadges } from "@/components/occasions/OccasionBadges";
import { THEMES, type Memory, type Occasion, type ThemeKey } from "@/gallery";
import { formatCities, formatDateRange, t } from "@/strings";
import { CornerMotifs, MotifDivider } from "../themes/Decorations";

/**
 * The Memory page's centred title page: the Date range in small capitals, the
 * title, the Cities, the Occasion badges and the note as a handwritten quote.
 * It's decorated by the Memory's Theme (see `themeOfMemory`): motif dividers
 * above and below, the Theme's edge at the top and bottom, faint motifs in the
 * corners. It carries the Theme in `data-theme`.
 */
export function MemoryHeader({ memory, occasions, theme }: { memory: Memory; occasions: Occasion[]; theme: ThemeKey }) {
  const look = THEMES[theme];
  const { background, text, accent } = look.titlePage;
  return (
    <header
      className="relative mb-6 flex min-h-[56svh] flex-col items-center justify-center gap-4 overflow-hidden rounded-card px-8 py-14 text-center"
      style={{ background, color: text }}
      data-theme={theme}
    >
      <span className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundImage: look.stripe }} aria-hidden="true" />
      <span className="absolute inset-x-0 bottom-0 h-1.5" style={{ backgroundImage: look.stripe }} aria-hidden="true" />
      <CornerMotifs theme={look} />
      <MotifDivider theme={look} color={accent} />
      <p className="text-xs font-extrabold tracking-[0.16em] text-balance uppercase" style={{ color: accent }}>
        {formatDateRange(memory.startDay, memory.endDay)}
      </p>
      <h1 className="text-[2.6rem] leading-[1.02] font-medium text-balance sm:text-[3.4rem]">
        {memory.title ?? t.timeline.untitled}
      </h1>
      <p className="font-display text-xl italic" style={{ color: accent }}>
        {formatCities(memory.cities)}
      </p>
      <OccasionBadges occasions={occasions} className="justify-center" />
      {memory.note ? (
        <p className="mt-2 max-w-[30ch] font-hand text-[1.6rem] leading-snug whitespace-pre-line opacity-85">
          “{memory.note}”
        </p>
      ) : null}
      <MotifDivider theme={look} color={accent} />
    </header>
  );
}
