import { describe, expect, it } from "vitest";
import { listTimeline, openStorage } from "@/gallery";
import { makeDataDir } from "./helpers";

describe("memories", () => {
  it("has an empty Timeline in a new data folder", async () => {
    const storage = openStorage(await makeDataDir());

    expect(await listTimeline(storage)).toEqual([]);
  });
});
