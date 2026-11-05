/*
 * Tailwind class lists shared by several components: page frames, Admin form
 * controls and messages. Kept as strings so each element still says plainly
 * what it looks like.
 */

/** The frame of every page: centred, with a side gutter. */
export const page = "mx-auto max-w-[1000px] p-4";

/** The narrower frame of the Admin pages. */
export const adminPage = "mx-auto max-w-[640px] p-4 pb-16";

/** The "← back" link at the top of a page. */
export const backLink = "mb-3 inline-block text-cocoa-soft no-underline";

export const adminTitle = "my-4 text-3xl font-semibold";

/** One section of an Admin page: a soft white card, its heading inside. */
export const adminCard = "mt-5 flex flex-col gap-3 rounded-card bg-white p-4 shadow-soft sm:p-5";
/** The heading of an Admin card. */
export const adminHeading = "m-0 text-xl font-semibold";
export const adminSubheading = "mt-3 mb-0 text-lg font-semibold";

/** A text field, date picker, select or textarea on the Admin page: tall and round, with a honey ring when focused. */
export const field =
  "min-h-12 w-full min-w-0 rounded-[14px] border border-cocoa/15 bg-cream/50 px-4 py-3 text-cocoa outline-none transition-shadow focus:border-honey focus:bg-white focus:ring-3 focus:ring-honey/40";

const buttonBase =
  "inline-flex min-h-12 shrink-0 cursor-pointer items-center justify-center rounded-[14px] border px-4 py-3 font-bold no-underline disabled:cursor-default disabled:opacity-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-honey/40";

/** The main action: honey, with cocoa text. */
export const button = `${buttonBase} border-honey bg-honey text-cocoa`;
export const secondaryButton = `${buttonBase} border-cocoa/20 bg-white text-cocoa`;
export const dangerButton = `${buttonBase} border-danger bg-danger text-white`;

/** A vertical stack of labels and fields. */
export const formStack = "flex flex-col gap-2";

/** A plain list of items inside an Admin card. */
export const list = "flex flex-col gap-2";
/** One Memory or Occasion in such a list: a soft cream tile on the white card. */
export const listCard = "rounded-tile border border-cocoa/10 bg-cream/70 px-4 py-3";
/** An Occasion card: its summary line, then its edit form when open. */
export const occasionItem = `${listCard} flex flex-col gap-2`;
/** An Occasion's name and day, with its buttons beside them. */
export const occasionSummary = "flex flex-wrap items-center gap-2";

export const errorText = "m-0 text-danger";
export const quietText = "m-0 text-cocoa-soft";
export const emptyText = "text-cocoa-soft";
