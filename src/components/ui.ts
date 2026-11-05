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
export const adminHeading = "mt-8 mb-3 text-xl font-semibold";
export const adminSubheading = "mt-6 mb-2 text-lg font-semibold";

/** A text field, date picker, select or textarea on the Admin page. */
export const field = "min-w-0 rounded-tile border border-cocoa/20 bg-white px-3 py-2.5 text-cocoa";

const buttonBase =
  "inline-flex cursor-pointer items-center justify-center rounded-tile border px-3 py-2.5 font-bold no-underline disabled:cursor-default disabled:opacity-60";

/** The main action: honey, with cocoa text. */
export const button = `${buttonBase} border-honey bg-honey text-cocoa`;
export const secondaryButton = `${buttonBase} border-cocoa/20 bg-white text-cocoa`;
export const dangerButton = `${buttonBase} border-danger bg-danger text-white`;

/** A vertical stack of labels and fields. */
export const formStack = "flex flex-col gap-2";

/** A plain list of cards on the Admin page. */
export const list = "flex flex-col gap-2";
/** One Memory or Occasion card in such a list. */
export const listCard = "rounded-tile bg-white px-4 py-3";
/** An Occasion card: its summary line, then its edit form when open. */
export const occasionItem = `${listCard} flex flex-col gap-2`;
/** An Occasion's name and day, with its buttons beside them. */
export const occasionSummary = "flex flex-wrap items-center gap-2";

export const errorText = "m-0 text-danger";
export const quietText = "m-0 text-cocoa-soft";
export const emptyText = "text-cocoa-soft";
