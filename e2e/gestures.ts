import type { Locator, Page } from "@playwright/test";

/** The middle of an element on screen, scrolled into view first. */
export async function centre(locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  const box = (await locator.boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Drags with the mouse, in small steps like a hand would. */
export async function mouseDrag(page: Page, handle: Locator, dx: number, dy: number) {
  const start = await centre(handle);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + dx, start.y + dy, { steps: 8 });
  await page.mouse.up();
}

/** Drags with a finger: real touch events, which the browser turns into touch pointer events. */
export async function touchDrag(page: Page, handle: Locator, dx: number, dy: number) {
  const start = await centre(handle);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [start] });
  for (let step = 1; step <= 8; step++) {
    const point = { x: start.x + (dx * step) / 8, y: start.y + (dy * step) / 8 };
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [point] });
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
}
