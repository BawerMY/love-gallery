import { t } from "../strings";
import { GalleryError } from "./errors";

/**
 * The built-in Themes an Occasion can carry. They live in code, not in
 * `database.json`: adding a Theme is a code change. An Occasion stores only
 * the Theme's key.
 */
export const THEME_KEYS = ["neutro", "anniversario", "san-valentino", "natale", "capodanno", "compleanno"] as const;

export type ThemeKey = (typeof THEME_KEYS)[number];

/** The Theme of every Occasion that hasn't chosen one, and the look of an unthemed Memory. */
export const DEFAULT_THEME: ThemeKey = "neutro";

/** The small decoration a Theme repeats on badges, dividers and corners. */
export type Motif = "heart" | "snowflake" | "star" | "confetti";

export type Theme = {
  key: ThemeKey;
  motif: Motif;
  /** The motif's colours: the first is the main one; confetti uses them all. */
  motifColors: string[];
  /** The thick left edge of a Timeline entry: always a CSS image, so it can be a gradient. */
  stripe: string;
  /** The soft background of a Timeline entry. */
  tint: string;
  /** The Memory page's title page: background (colour or gradient), text and accent colours. */
  titlePage: { background: string; text: string; accent: string };
  /** An Occasion badge: background and text colours. */
  badge: { background: string; text: string };
};

const solid = (color: string) => `linear-gradient(${color}, ${color})`;

export const THEMES: Record<ThemeKey, Theme> = {
  neutro: {
    key: "neutro",
    motif: "heart",
    motifColors: ["#E9B44C"],
    stripe: solid("#F1E3C2"),
    tint: "#FFFDF8",
    titlePage: { background: "#FBEFCF", text: "#3B2A2F", accent: "#9A6A12" },
    badge: { background: "#FBEFCF", text: "#9A6A12" },
  },
  anniversario: {
    key: "anniversario",
    motif: "heart",
    motifColors: ["#E9B44C", "#C48E24"],
    stripe: "linear-gradient(135deg, #F2C866, #C48E24)",
    tint: "#FEF6E2",
    titlePage: { background: "linear-gradient(160deg, #FBEFCF, #F4D489)", text: "#3B2A2F", accent: "#8A5E0E" },
    badge: { background: "#E9B44C", text: "#3B2A2F" },
  },
  "san-valentino": {
    key: "san-valentino",
    motif: "heart",
    motifColors: ["#C8374D", "#E58C9C"],
    stripe: solid("#C8374D"),
    tint: "#FDF1F2",
    titlePage: { background: "linear-gradient(160deg, #FCE6E9, #F5C6CE)", text: "#3B2A2F", accent: "#A8243A" },
    badge: { background: "#F9DADF", text: "#A1203A" },
  },
  natale: {
    key: "natale",
    motif: "snowflake",
    motifColors: ["#2E6B4E", "#B3312E"],
    stripe: "linear-gradient(135deg, #2E6B4E 60%, #B3312E)",
    tint: "#F2F7F2",
    titlePage: { background: "linear-gradient(160deg, #E5F0E6, #CDE2D2)", text: "#1F3328", accent: "#A12B28" },
    badge: { background: "#2E6B4E", text: "#FFF8EC" },
  },
  capodanno: {
    key: "capodanno",
    motif: "star",
    motifColors: ["#D4A23A", "#F3D27A"],
    stripe: "linear-gradient(135deg, #1E2B55 55%, #D4A23A)",
    tint: "#F2F3F8",
    titlePage: { background: "linear-gradient(160deg, #1E2B55, #31437C)", text: "#FBF6EF", accent: "#F0C75E" },
    badge: { background: "#1E2B55", text: "#F3D27A" },
  },
  compleanno: {
    key: "compleanno",
    motif: "confetti",
    motifColors: ["#E9B44C", "#E07A3A", "#8A6BC9", "#4F86C6", "#5BA89A"],
    stripe: "linear-gradient(90deg, #E9B44C, #E07A3A, #8A6BC9, #4F86C6, #5BA89A)",
    tint: "#FCF9F3",
    titlePage: { background: "linear-gradient(160deg, #FBEFCF, #E7EEF8 70%, #E6F2EE)", text: "#3B2A2F", accent: "#5B3E99" },
    badge: { background: "#ECE5F8", text: "#563A93" },
  },
};

export function isThemeKey(value: unknown): value is ThemeKey {
  return typeof value === "string" && (THEME_KEYS as readonly string[]).includes(value);
}

/** The Theme key to save: nothing chosen means Neutro, an unknown key is refused. */
export function cleanThemeKey(value: string | undefined): ThemeKey {
  if (value === undefined || value === "") return DEFAULT_THEME;
  if (!isThemeKey(value)) throw new GalleryError(t.occasions.unknownTheme);
  return value;
}
