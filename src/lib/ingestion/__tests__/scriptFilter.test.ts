import { describe, expect, it } from "vitest";

import {
  shouldHideArabicTrendItem,
  shouldRejectLikelyArabicContent,
} from "@/lib/ingestion/scriptFilter";

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

  it("rejects Arabic headline even when the article body is mostly Latin/Creole", () => {
    expect(
      shouldRejectLikelyArabicContent(
        "انظر منتخب هايتي يتحدى المغرب في كأس العالم",
        `${"Rezime rapid sou sitiyasyon ekip nasyonal la. ".repeat(12)}N ap kontinye mete ajou pwen yo an Kreyòl.`,
      ),
    ).toBe(true);
  });
});

describe("shouldHideArabicTrendItem", () => {
  it("hides legacy clusters with Arabic headlines like the Kreyòl-mixed promo cards", () => {
    expect(
      shouldHideArabicTrendItem(
        "انظر منتخب هايتي يتحدى المغرب في كأس العالم",
        `${"Rezime rapid sou sitiyasyon ekip nasyonal la. ".repeat(6)}`,
      ),
    ).toBe(true);
  });

  it("does not hide normal Creole items", () => {
    expect(
      shouldHideArabicTrendItem(
        "Ayiti: rapò sou mache a",
        "Kèk detay sou pri yo ak konjonkti lokal la.",
      ),
    ).toBe(false);
  });
});
