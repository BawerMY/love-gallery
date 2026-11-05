import { Caveat, Fraunces, Nunito } from "next/font/google";

/*
 * The gallery's three voices, self-hosted and preloaded by next/font. They are
 * exposed to Tailwind as the font tokens display, hand and body (globals.css).
 * `block` keeps text hidden for the brief moment before a font arrives, so it
 * never shows in a fallback font and then changes.
 */

/** Titles. Italic on the Timeline. */
const fraunces = Fraunces({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-fraunces", display: "block" });
/** Handwritten touches: the wordmark, rail markers, days apart, notes. */
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat", display: "block" });
/** Everything else. */
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", display: "block" });

/** The classes that define the font variables, for the root element. */
export const fontVariables = `${fraunces.variable} ${caveat.variable} ${nunito.variable}`;
