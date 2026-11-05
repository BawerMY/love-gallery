"use client";

import { t } from "@/strings";
import { field, secondaryButton } from "../ui";

type Props = {
  cities: string[];
  onChange: (cities: string[]) => void;
  /** Cities used by earlier Memories, offered as the Curator types. */
  suggestions: string[];
};

/** The ordered Cities of a Memory: one field each, with suggestions. */
export function CityList({ cities, onChange, suggestions }: Props) {
  function setCity(index: number, value: string) {
    onChange(cities.map((city, i) => (i === index ? value : city)));
  }

  function moveUp(index: number) {
    const next = [...cities];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  }

  return (
    <fieldset className="my-2 flex flex-col gap-2">
      <legend className="mb-2">{t.admin.citiesLabel}</legend>
      <datalist id="city-suggestions">
        {suggestions.map((city) => (
          <option key={city} value={city} />
        ))}
      </datalist>
      <ol className="flex flex-col gap-2">
        {cities.map((city, index) => (
          <li key={index} className="flex gap-2">
            <input
              className={`${field} flex-1`}
              name="city"
              list="city-suggestions"
              aria-label={t.admin.cityLabel(index + 1)}
              autoComplete="off"
              required={index === 0}
              value={city}
              onChange={(event) => setCity(index, event.target.value)}
            />
            {index > 0 ? (
              <button
                type="button"
                className={secondaryButton}
                aria-label={t.admin.moveCityUp(index + 1)}
                title={t.admin.moveCityUp(index + 1)}
                onClick={() => moveUp(index)}
              >
                ↑
              </button>
            ) : null}
            {cities.length > 1 ? (
              <button
                type="button"
                className={secondaryButton}
                aria-label={t.admin.removeCity(index + 1)}
                title={t.admin.removeCity(index + 1)}
                onClick={() => onChange(cities.filter((_, i) => i !== index))}
              >
                ✕
              </button>
            ) : null}
          </li>
        ))}
      </ol>
      <button type="button" className={`${secondaryButton} self-start`} onClick={() => onChange([...cities, ""])}>
        {t.admin.addCity}
      </button>
    </fieldset>
  );
}
