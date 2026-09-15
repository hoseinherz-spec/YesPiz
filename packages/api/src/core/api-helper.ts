export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  baseUrl?: string;
  locale?: string;
  timeoutMs?: number;
};

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function getDefaultBaseUrl() {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  return "http://localhost:8058";
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    body,
    baseUrl = getDefaultBaseUrl(),
    locale,
    headers,
    timeoutMs = 20000,
    signal,
    ...init
  } = options;
  const url = path.startsWith("http")
    ? path
    : `${baseUrl.replace(/\/$/, "")}${path}`;

  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  if (signal?.aborted) abort();
  else signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(
    () =>
      controller.abort(
        new Error("Request timed out. Check your connection and retry."),
      ),
    timeoutMs,
  );
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      ...init,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(locale ? { "Accept-Language": locale } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message =
        typeof payload === "object" &&
        payload !== null &&
        "message" in payload &&
        (typeof (payload as { message: unknown }).message === "string" ||
          Array.isArray((payload as { message: unknown }).message))
          ? [(payload as { message: unknown }).message]
              .flat()
              .filter((v) => typeof v === "string")
              .join(". ")
          : `Request failed with status ${response.status}`;

      throw new ApiError(message, response.status, payload);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted) throw controller.signal.reason ?? error;
    throw new ApiError(
      "Unable to connect. Check your connection and retry.",
      0,
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
