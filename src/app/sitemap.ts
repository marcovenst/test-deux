import type { MetadataRoute } from "next";

import { supabaseAdmin } from "@/lib/db/client";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${baseUrl}/news`,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  try {
    const { data } = await supabaseAdmin
      .from("clusters")
      .select("id,last_seen_at")
      .order("last_seen_at", { ascending: false })
      .limit(2000);

    const clusterPages: MetadataRoute.Sitemap = (data ?? []).map((cluster) => ({
      url: `${baseUrl}/cluster/${cluster.id as string}`,
      lastModified: new Date(cluster.last_seen_at as string),
      changeFrequency: "daily",
      priority: 0.7,
    }));

    return [...staticPages, ...clusterPages];
  } catch {
    return staticPages;
  }
}
