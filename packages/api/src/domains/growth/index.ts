import { apiRequest, withAuth, type AuthRequestOptions } from "../../core";
export type CampaignInput = {
  code: string;
  name: string;
  channel: string;
  audience: string;
  startAt: string;
  endAt: string;
  budgetCents: number;
};
export type Campaign = CampaignInput & {
  _id: string;
  status: "planned" | "active" | "completed";
  spendCents: number;
};
export type GrowthDashboard = {
  campaigns: Campaign[];
  attribution: {
    _id: string;
    orders: number;
    orderValueCents: number;
    customers: number;
  }[];
  customers: {
    customers: number;
    repeatCustomers: number;
    lapsedCustomers: number;
  };
};
export type OperationsTask = {
  _id: string;
  title: string;
  area: string;
  dueAt: string;
  status: "todo" | "doing" | "done";
  ownerId?: string;
  revision: number;
  history: { at: string; actor: string; status: string }[];
};
export const growthClient = {
  dashboard: (options?: AuthRequestOptions) =>
    apiRequest<GrowthDashboard>(
      "/api/v1/growth",
      withAuth({ ...options, method: "GET" }),
    ),
  campaign: (body: CampaignInput, options?: AuthRequestOptions) =>
    apiRequest<Campaign>(
      "/api/v1/growth/campaigns",
      withAuth({ ...options, method: "POST", body }),
    ),
  updateCampaign: (
    id: string,
    body: { status: Campaign["status"]; spendCents: number },
    options?: AuthRequestOptions,
  ) =>
    apiRequest<Campaign>(
      `/api/v1/growth/campaigns/${encodeURIComponent(id)}`,
      withAuth({ ...options, method: "PATCH", body }),
    ),
  tasks: (options?: AuthRequestOptions) =>
    apiRequest<OperationsTask[]>(
      "/api/v1/growth/tasks",
      withAuth({ ...options, method: "GET" }),
    ),
  createTask: (
    body: { title: string; area: string; dueAt: string },
    options?: AuthRequestOptions,
  ) =>
    apiRequest<OperationsTask>(
      "/api/v1/growth/tasks",
      withAuth({ ...options, method: "POST", body }),
    ),
  updateTask: (
    id: string,
    body: { revision: number; status: OperationsTask["status"] },
    options?: AuthRequestOptions,
  ) =>
    apiRequest<OperationsTask>(
      `/api/v1/growth/tasks/${encodeURIComponent(id)}`,
      withAuth({ ...options, method: "PATCH", body }),
    ),
};
