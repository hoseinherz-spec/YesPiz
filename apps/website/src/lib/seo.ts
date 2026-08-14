import type { Metadata, Viewport } from "next";
import { landingContent } from "@/content/landing";

const { meta } = landingContent;

export function createSiteViewport(): Viewport {
  return {
    themeColor: meta.themeColor,
    colorScheme: "light",
  };
}

export function createSiteMetadata(): Metadata {
  const title = meta.title;
  const description = meta.description;
  const siteUrl = meta.siteUrl;
  const ogImage = `${siteUrl}${meta.ogImage}`;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | ${meta.shortName}`,
    },
    description,
    keywords: [...meta.keywords],
    authors: [{ name: meta.shortName, url: siteUrl }],
    creator: meta.shortName,
    publisher: meta.shortName,
    category: "food",
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      type: "website",
      locale: meta.locale,
      url: siteUrl,
      siteName: meta.shortName,
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1024,
          height: 1024,
          alt: `${meta.shortName} — Order pizza with fast delivery`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    applicationName: meta.shortName,
    appleWebApp: {
      capable: true,
      title: meta.shortName,
      statusBarStyle: "default",
    },
  };
}

export function createJsonLd() {
  const { meta, footer, contact } = landingContent;

  return [
    {
      "@context": "https://schema.org",
      "@type": "FoodEstablishment",
      "@id": `${meta.siteUrl}/#restaurant`,
      name: "Yespizz",
      description: meta.description,
      url: meta.siteUrl,
      servesCuisine: ["Pizza", "Italian", "Neapolitan"],
      priceRange: "€€",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Neubaugasse 12",
        addressLocality: "Vienna",
        addressRegion: "Vienna",
        addressCountry: "AT",
      },
      email: contact.email,
      areaServed: {
        "@type": "City",
        name: "Vienna",
      },
      hasMenu: `${meta.siteUrl}/#menu`,
    },
    {
      "@context": "https://schema.org",
      "@type": "MobileApplication",
      "@id": `${meta.siteUrl}/#app`,
      name: "Yespizz",
      operatingSystem: "iOS, Android",
      applicationCategory: "FoodApplication",
      description: footer.description,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        ratingCount: "1200",
        bestRating: "5",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${meta.siteUrl}/#website`,
      name: "Yespizz",
      url: meta.siteUrl,
      description: meta.description,
      inLanguage: meta.locale,
      publisher: {
        "@id": `${meta.siteUrl}/#restaurant`,
      },
    },
  ];
}
