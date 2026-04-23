import trendCategoriesConfig from "@/config/trend-categories.json";

type TrendCategoryConfig = {
  id: string;
  labelHt?: string;
  aliases?: string[];
};

const categoryConfig = (trendCategoriesConfig.categories ?? []) as TrendCategoryConfig[];

export const TREND_CATEGORIES = categoryConfig.map((entry) => entry.id);
export type TrendCategory = string;

const CATEGORY_SET = new Set<string>(TREND_CATEGORIES);

const CATEGORY_ALIASES: Record<string, TrendCategory> = categoryConfig.reduce<
  Record<string, TrendCategory>
>((acc, entry) => {
  const canonical = entry.id.trim().toLowerCase();
  if (!canonical) {
    return acc;
  }
  acc[canonical] = canonical;
  if (entry.labelHt?.trim()) {
    acc[entry.labelHt.trim().toLowerCase()] = canonical;
  }
  for (const alias of entry.aliases ?? []) {
    const normalizedAlias = alias.trim().toLowerCase();
    if (normalizedAlias) {
      acc[normalizedAlias] = canonical;
    }
  }
  return acc;
}, {});

export const categoryLabelsFromConfigHt: Record<string, string> = categoryConfig.reduce<
  Record<string, string>
>((acc, entry) => {
  if (entry.id && entry.labelHt) {
    acc[entry.id] = entry.labelHt;
  }
  return acc;
}, {});

export function normalizeTrendCategory(
  input: string | null | undefined,
  options?: {
    defaultCategory?: TrendCategory;
    allowAll?: boolean;
  },
): TrendCategory {
  const defaultCategory = options?.defaultCategory ?? "all";
  const allowAll = options?.allowAll ?? true;
  if (!input) {
    return defaultCategory;
  }

  const value = input.trim().toLowerCase();
  const mapped = CATEGORY_ALIASES[value] ?? (value as TrendCategory);
  if (!allowAll && mapped === "all") {
    return defaultCategory;
  }
  return CATEGORY_SET.has(mapped) ? mapped : defaultCategory;
}
