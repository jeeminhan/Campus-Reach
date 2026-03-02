import { describe, expect, it } from "vitest";
import { computeLimit, interpolateBlue } from "./peopleGroupUtils";

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

describe("interpolateBlue", () => {
  it("returns dim blue at intensity 0", () => {
    expect(interpolateBlue(0)).toBe("rgb(30,58,95)");
  });

  it("returns full blue at intensity 1", () => {
    expect(interpolateBlue(1)).toBe("rgb(29,78,216)");
  });

  it("returns midpoint blue at intensity 0.5", () => {
    expect(interpolateBlue(0.5)).toBe("rgb(30,68,156)");
  });

  it("clamps intensity above 1", () => {
    expect(interpolateBlue(2)).toBe(interpolateBlue(1));
  });

  it("clamps intensity below 0", () => {
    expect(interpolateBlue(-1)).toBe(interpolateBlue(0));
  });
});
