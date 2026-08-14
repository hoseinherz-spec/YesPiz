import type { MetadataRoute } from "next";
import { landingContent } from "@/content/landing";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = landingContent.meta.siteUrl;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
