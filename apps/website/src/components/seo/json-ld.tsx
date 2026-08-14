import { createJsonLd } from "@/lib/seo";

export function JsonLd() {
  const schemas = createJsonLd();

  return (
    <>
      {schemas.map((schema) => (
        <script
          key={schema["@id"] as string}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
