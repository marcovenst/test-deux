import { absoluteUrl, SITE_NAME } from "@/lib/seo/site";

export function WebsiteJsonLd() {
  const base = absoluteUrl("/");
  const payload = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${base}#organization`,
        name: SITE_NAME,
        url: base,
        logo: absoluteUrl("/favicon.ico"),
      },
      {
        "@type": "WebSite",
        "@id": `${base}#website`,
        name: SITE_NAME,
        url: base,
        publisher: { "@id": `${base}#organization` },
        inLanguage: ["ht", "fr", "en"],
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${absoluteUrl("/search")}?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
