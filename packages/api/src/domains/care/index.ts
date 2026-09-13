import { apiRequest, withAuth, type AuthRequestOptions } from "../../core";
export type FeedbackInput = {
  allowPublication?: boolean;
  taste: number;
  temperature: number;
  packaging: number;
  delivery: number;
  wouldOrderAgain: boolean;
  comment: string;
};
export type SupportRequest = {
  id: string;
  orderId: string;
  category: string;
  message: string;
  status: "open" | "investigating" | "resolved";
  response: string;
  createdAt: string;
};
export type AdminSupportRequest = Omit<SupportRequest, "id"> & {
  _id: string;
  ownerId?: string;
  providerId?: string;
  customerId: string;
  dueAt: string;
  revision: number;
  events: {
    at: string;
    action: string;
    internalNote?: string;
    actorId?: string;
  }[];
};
export type FeedbackMetrics = {
  periodDays: number;
  providers: {
    providerId: string;
    name?: string;
    responses: number;
    taste: number;
    temperature: number;
    packaging: number;
    delivery: number;
    repeatIntent: number;
    score: number;
  }[];
  recent: (FeedbackInput & {
    _id: string;
    orderId: string;
    providerId: string;
    createdAt: string;
    allowPublication?: boolean;
    pizzaItems: { id: string; name: string }[];
    published?: boolean;
    publishedPizzaId?: string;
    publishedText?: string;
    moderationRevision: number;
  })[];
};
export type PublicPizzaComment = {
  id: string;
  text: string;
  publishedAt: string;
};
export const careClient = {
  permission: (id: string, allowPublication: boolean, options?: AuthRequestOptions) => apiRequest<{ allowPublication: boolean }>(`/api/v1/care/orders/${encodeURIComponent(id)}/publication-permission`, withAuth({ ...options, method: 'PATCH', body: { allowPublication } })),
  comments: (id: string) =>
    apiRequest<PublicPizzaComment[]>(
      `/api/v1/pizza-comments/${encodeURIComponent(id)}`,
      { method: "GET", cache: "no-store" },
    ),
  moderate: (
    id: string,
    body: {
      revision: number;
      published: boolean;
      pizzaId: string;
      text: string;
    },
    options?: AuthRequestOptions,
  ) =>
    apiRequest(
      `/api/v1/care/admin/feedback/${encodeURIComponent(id)}/publication`,
      withAuth({ ...options, method: "PATCH", body }),
    ),
  feedbackState: (id: string, options?: AuthRequestOptions) =>
    apiRequest<{ submitted: boolean; eligible: boolean; allowPublication: boolean }>(
      `/api/v1/care/orders/${encodeURIComponent(id)}/feedback`,
      withAuth({ ...options, method: "GET" }),
    ),
  feedback: (id: string, body: FeedbackInput, options?: AuthRequestOptions) =>
    apiRequest<{ submitted: boolean }>(
      `/api/v1/care/orders/${encodeURIComponent(id)}/feedback`,
      withAuth({ ...options, method: "POST", body }),
    ),
  requests: (options?: AuthRequestOptions) =>
    apiRequest<SupportRequest[]>(
      "/api/v1/care/requests",
      withAuth({ ...options, method: "GET" }),
    ),
  create: (
    body: {
      orderId: string;
      category: string;
      message: string;
      requestKey: string;
    },
    options?: AuthRequestOptions,
  ) =>
    apiRequest<SupportRequest>(
      "/api/v1/care/requests",
      withAuth({ ...options, method: "POST", body }),
    ),
  queue: (options?: AuthRequestOptions) =>
    apiRequest<AdminSupportRequest[]>(
      "/api/v1/care/admin/requests",
      withAuth({ ...options, method: "GET" }),
    ),
  claim: (id: string, options?: AuthRequestOptions) =>
    apiRequest<AdminSupportRequest>(
      `/api/v1/care/admin/requests/${encodeURIComponent(id)}/claim`,
      withAuth({ ...options, method: "POST" }),
    ),
  resolve: (
    id: string,
    body: {
      revision: number;
      status: "investigating" | "resolved";
      response: string;
      internalNote: string;
    },
    options?: AuthRequestOptions,
  ) =>
    apiRequest<AdminSupportRequest>(
      `/api/v1/care/admin/requests/${encodeURIComponent(id)}`,
      withAuth({ ...options, method: "PATCH", body }),
    ),
  metrics: (options?: AuthRequestOptions) =>
    apiRequest<FeedbackMetrics>(
      "/api/v1/care/admin/feedback",
      withAuth({ ...options, method: "GET" }),
    ),
};
