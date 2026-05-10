import { absoluteUrl, SITE_NAME, truncateForMeta } from "@/lib/seo/site";

type ClusterArticleJsonLdProps = {
  clusterId: string;
  headline: string;
  description: string;
  category: string;
  datePublished: string;
  dateModified: string;
};

export function ClusterArticleJsonLd({
  clusterId,
  headline,
  description,
  category,
  datePublished,
  dateModified,
}: ClusterArticleJsonLdProps) {
  const url = absoluteUrl(`/cluster/${clusterId}`);
  const payload = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: truncateForMeta(headline, 110),
    description: truncateForMeta(description, 300),
    datePublished,
    dateModified,
    inLanguage: "ht",
    articleSection: category,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: absoluteUrl("/"),
    },
    author: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    isAccessibleForFree: true,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
