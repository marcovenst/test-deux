import { describe, expect, it } from "vitest";

import {
  buyerTotalCents,
  MIN_PAYOUT_CENTS,
  normalizeListingImageUrls,
  platformFeeCents,
  POSTING_FEE_CENTS,
  sellerProceedsCents,
} from "@/lib/shop/marketplace";

describe("marketplace fees", () => {
  it("posting fee constant kept for legacy (no longer charged at publish)", () => {
    expect(POSTING_FEE_CENTS).toBe(99);
  });

  it("minimum cash-out is $10", () => {
    expect(MIN_PAYOUT_CENTS).toBe(1000);
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

describe("normalizeListingImageUrls", () => {
  it("returns empty for null and empty input", () => {
    expect(normalizeListingImageUrls(null)).toEqual([]);
    expect(normalizeListingImageUrls(undefined)).toEqual([]);
  });

  it("filters and trims string array", () => {
    expect(normalizeListingImageUrls(["  https://x/a  ", "", "https://x/b"])).toEqual([
      "https://x/a",
      "https://x/b",
    ]);
  });

  it("parses JSON array string", () => {
    expect(normalizeListingImageUrls('["https://x/a"]')).toEqual(["https://x/a"]);
  });

  it("treats non-JSON string as single URL", () => {
    expect(normalizeListingImageUrls("https://x/one")).toEqual(["https://x/one"]);
  });
});
