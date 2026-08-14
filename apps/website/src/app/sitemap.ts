import type { MetadataRoute } from "next";
import { landingContent } from "@/content/landing";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = landingContent.meta.siteUrl;

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
