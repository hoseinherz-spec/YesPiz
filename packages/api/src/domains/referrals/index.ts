import { apiRequest, withAuth, type AuthRequestOptions } from "../../core";
export type ReferralAccount = {
  code: string;
  pending: number;
  rewarded: number;
  applied: boolean;
  ownStatus?: string;
  rewardCents: number;
  agreedRewardCents?: number;
};
export type ReferralReview = {
  _id: string;
  inviterId: string;
  inviteeId: string;
  rewardCents: number;
  status: string;
  eligible: boolean;
  orderId?: string;
  approvedBy?: string;
};
export const referralsClient = {
  mine: (options?: AuthRequestOptions) =>
    apiRequest<ReferralAccount>(
      "/api/v1/referrals/me",
      withAuth({ ...options, method: "GET" }),
    ),
  apply: (code: string, options?: AuthRequestOptions) =>
    apiRequest(
      "/api/v1/referrals/apply",
      withAuth({ ...options, method: "POST", body: { code } }),
    ),
  queue: (options?: AuthRequestOptions) =>
    apiRequest<ReferralReview[]>(
      "/api/v1/referrals/admin",
      withAuth({ ...options, method: "GET" }),
    ),
  settings: (options?: AuthRequestOptions) =>
    apiRequest<{ rewardCents: number }>(
      "/api/v1/referrals/admin/settings",
      withAuth({ ...options, method: "GET" }),
    ),
  configure: (rewardCents: number, options?: AuthRequestOptions) =>
    apiRequest(
      "/api/v1/referrals/admin/settings",
      withAuth({ ...options, method: "PATCH", body: { rewardCents } }),
    ),
  approve: (id: string, options?: AuthRequestOptions) =>
    apiRequest(
      `/api/v1/referrals/admin/${encodeURIComponent(id)}/approve`,
      withAuth({ ...options, method: "POST" }),
    ),
};
