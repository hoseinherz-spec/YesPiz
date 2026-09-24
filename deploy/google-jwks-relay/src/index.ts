const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const RELAY_PATH = "/google/oauth2/v3/certs";

export default {
  async fetch(request): Promise<Response> {
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
      cf: { cacheEverything: true, cacheTtl: 300 },
      headers: { Accept: "application/json" },
    });
    if (!upstream.ok) {
      console.error(
        JSON.stringify({
          event: "google_jwks_upstream_failure",
          status: upstream.status,
        }),
      );
      return new Response("JWKS upstream unavailable", {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const headers = new Headers({
      "Cache-Control": upstream.headers.get("Cache-Control") ?? "public, max-age=300",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    });
    return new Response(request.method === "HEAD" ? null : upstream.body, {
      status: 200,
      headers,
    });
  },
} satisfies ExportedHandler;
