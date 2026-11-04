/**
 * Every interface string, in Italian. Each area of the gallery has its own
 * file in this folder; add a new area as a new file and one line below.
 */
import { common } from "./common";
import { login } from "./login";
import { timeline } from "./timeline";

export const t = {
  common,
  login,
  timeline,
};

/** Dates are always shown for the Italian locale. */
export const LOCALE = "it-IT";
