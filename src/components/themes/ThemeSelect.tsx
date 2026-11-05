import { THEME_KEYS, type ThemeKey } from "@/gallery/themes";
import { t } from "@/strings";
import { field } from "../ui";

type Props = {
  id: string;
  value: ThemeKey;
  onChange: (event: { target: { value: string } }) => void;
};

/** The labelled Theme selector of an Occasion form, sent as `theme`. Lists every built-in Theme, Neutro first. */
export function ThemeSelect({ id, value, onChange }: Props) {
  return (
    <>
      <label htmlFor={id}>{t.occasions.themeLabel}</label>
      <select className={field} id={id} name="theme" value={value} onChange={onChange}>
        {THEME_KEYS.map((key) => (
          <option key={key} value={key}>
            {t.themes[key]}
          </option>
        ))}
      </select>
    </>
  );
}
