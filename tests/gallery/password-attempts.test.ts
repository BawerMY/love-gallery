import { describe, expect, it } from "vitest";
import { clientAddress, createPasswordThrottle } from "@/gallery";

const SECOND = 1000;

describe("wrong Gallery passwords", () => {
  it("are allowed a few times, then make the same client wait longer after each further one", () => {
    const throttle = createPasswordThrottle();
    let now = 0;
    for (let i = 0; i < 5; i++) {
      expect(throttle.waitMs("1.2.3.4", now)).toBe(0);
      throttle.recordFailure("1.2.3.4", now);
    }
    expect(throttle.waitMs("1.2.3.4", now)).toBe(30 * SECOND);
    expect(throttle.waitMs("5.6.7.8", now)).toBe(0);

    now += 30 * SECOND;
    expect(throttle.waitMs("1.2.3.4", now)).toBe(0);
    throttle.recordFailure("1.2.3.4", now);
    expect(throttle.waitMs("1.2.3.4", now)).toBe(60 * SECOND);
  });

  it("never make a client wait more than 15 minutes", () => {
    const throttle = createPasswordThrottle();
    let now = 0;
    for (let i = 0; i < 30; i++) {
      now += throttle.waitMs("1.2.3.4", now);
      throttle.recordFailure("1.2.3.4", now);
    }
    expect(throttle.waitMs("1.2.3.4", now)).toBe(15 * 60 * SECOND);
  });

  it("are forgotten once the right password is entered, or after a quiet day", () => {
    const throttle = createPasswordThrottle();
    for (let i = 0; i < 6; i++) throttle.recordFailure("a", 0);
    for (let i = 0; i < 6; i++) throttle.recordFailure("b", 0);

    throttle.recordSuccess("a");
    expect(throttle.waitMs("a", 0)).toBe(0);
    throttle.recordFailure("b", 24 * 60 * 60 * SECOND);
    expect(throttle.waitMs("b", 24 * 60 * 60 * SECOND)).toBe(0);
  });
});

describe("the client address", () => {
  it("is the X-Real-IP nginx sets, else the address nginx appended to X-Forwarded-For", () => {
    expect(clientAddress(new Headers({ "x-real-ip": "203.0.113.7", "x-forwarded-for": "1.1.1.1" }))).toBe("203.0.113.7");
    // The leftmost entries come from the client and can be made up; nginx appends the real one.
    expect(clientAddress(new Headers({ "x-forwarded-for": "1.1.1.1, 203.0.113.7" }))).toBe("203.0.113.7");
    expect(clientAddress(new Headers())).toBe("unknown");
  });
});
