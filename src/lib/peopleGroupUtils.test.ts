import { describe, expect, it } from "vitest";
import { computeLimit } from "./peopleGroupUtils";

describe("computeLimit", () => {
  it("returns 10 for 20% share", () => {
    expect(computeLimit(200, 1000)).toBe(10);
  });

  it("returns 5 for 10% share", () => {
    expect(computeLimit(100, 1000)).toBe(5);
  });

  it("clamps to minimum 1 for tiny share", () => {
    expect(computeLimit(1, 10000)).toBe(1);
  });

  it("clamps to maximum 15 for dominant share", () => {
    expect(computeLimit(900, 1000)).toBe(15);
  });

  it("returns 1 when totalInternational is 0", () => {
    expect(computeLimit(0, 0)).toBe(1);
  });
});
