/**
 * Every interface string, in Italian. Each area of the gallery has its own
 * file in this folder; add a new area as a new file and one line below.
 * Dates and Cities are formatted with the helpers in `format.ts`.
 */
import { admin } from "./admin";
import { common } from "./common";
import { layout } from "./layout";
import { magnify } from "./magnify";
import { media } from "./media";
import { memory } from "./memory";
import { memories } from "./memories";
import { occasions } from "./occasions";
import { passwordScreen } from "./password-screen";
import { timeline } from "./timeline";

export const t = {
  admin,
  common,
  layout,
  magnify,
  media,
  memory,
  memories,
  occasions,
  passwordScreen,
  timeline,
};

export * from "./format";
