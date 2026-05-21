import { describe, expect, it } from "vitest";

import { shouldRejectLikelyArabicContent } from "@/lib/ingestion/scriptFilter";

describe("shouldRejectLikelyArabicContent", () => {
  it("keeps Latin / Creole-style headlines", () => {
    expect(
      shouldRejectLikelyArabicContent("Ayiti jodi a: nouvèl cho", "Plis detay sou sitiyasyon an."),
    ).toBe(false);
  });

  it("rejects dominant Arabic script", () => {
    expect(
      shouldRejectLikelyArabicContent(
        "هaiti news اليوم من قناة العربية",
        "مقال بالعربية عن هايتي والمنطقة والمزيد من النصوص العربية هنا للاختبار",
      ),
    ).toBe(true);
  });
});
