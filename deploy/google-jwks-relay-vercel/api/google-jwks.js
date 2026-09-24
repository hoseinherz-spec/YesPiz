const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const RELAY_PATH = "/google/oauth2/v3/certs";

export const config = { runtime: "edge" };

export default async function handler(request) {
  const url = new URL(request.url);
  if (url.pathname !== RELAY_PATH || url.search) {
    return new Response("Not found", { status: 404 });
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  }

  const upstream = await fetch(GOOGLE_JWKS_URL, {
    headers: { Accept: "application/json" },
  });
  if (!upstream.ok) {
    console.error("Google JWKS upstream failure", upstream.status);
    return new Response("JWKS upstream unavailable", {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }

  return new Response(request.method === "HEAD" ? null : upstream.body, {
    status: 200,
    headers: {
      "Cache-Control":
        upstream.headers.get("Cache-Control") ?? "public, max-age=300",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
