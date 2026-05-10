import { amazonCatalogImageUrl } from "@/lib/shop/amazonImage";

import { describe, expect, it } from "vitest";

describe("amazonCatalogImageUrl", () => {
  it("rewrites tiny social/thumbnail Amazon URLs to SL1500", () => {
    expect(
      amazonCatalogImageUrl(
        "https://m.media-amazon.com/images/I/71OIhEpBJcL._AC_PT0_BL0_SX216_SY110_FMwebp_QL25_.jpg",
      ),
    ).toBe("https://m.media-amazon.com/images/I/71OIhEpBJcL._AC_SL1500_.jpg");
  });

  it("leaves full-size hiRes URLs unchanged (except stripping query)", () => {
    expect(
      amazonCatalogImageUrl("https://m.media-amazon.com/images/I/61N9HsCVfCL._AC_SL1500_.jpg?foo=1"),
    ).toBe("https://m.media-amazon.com/images/I/61N9HsCVfCL._AC_SL1500_.jpg");
  });
});
