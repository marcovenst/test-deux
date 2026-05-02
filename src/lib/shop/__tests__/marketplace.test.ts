import { describe, expect, it } from "vitest";

import {
  buyerTotalCents,
  platformFeeCents,
  POSTING_FEE_CENTS,
  sellerProceedsCents,
} from "@/lib/shop/marketplace";

describe("marketplace fees", () => {
  it("posting fee is 99 cents", () => {
    expect(POSTING_FEE_CENTS).toBe(99);
  });

  it("platform fee is 7% of item subtotal rounded", () => {
    expect(platformFeeCents(100_00)).toBe(7_00);
    expect(platformFeeCents(10_00)).toBe(70);
    expect(platformFeeCents(333)).toBe(23);
  });

  it("buyer total is item + shipping", () => {
    expect(buyerTotalCents(50_00, 5_00)).toBe(55_00);
  });

  it("seller gross from buyer item+shipping when fee charged separately", () => {
    expect(sellerProceedsCents(100_00, 10_00)).toBe(110_00);
  });
});
