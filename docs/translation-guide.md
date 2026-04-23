# Haitian Creole Translation Guide

To manually update Haitian Creole text in the app:

1. Open `src/lib/i18n/ht.ts`.
2. Edit values in `htCopy` (brand, tagline, homepage labels, CTA text).
3. Edit `categoryLabelsHt` if you want different category translations.
4. Save the file. The dev server updates automatically.

## Extra content files you can edit manually

- `src/lib/content/influencers.ts`
  - `fallbackCreoleTrends`: fallback homepage stories
  - `sportsHubTopics`: sports-focused snippets (Haitian national team, soccer, etc.)
  - `haitianInfluencers`: influencer seed list and tracked names

## Notes

- Keep keys unchanged in `htCopy`; only change the text values.
- If a new UI element is added later, add its translation key to `htCopy`.

