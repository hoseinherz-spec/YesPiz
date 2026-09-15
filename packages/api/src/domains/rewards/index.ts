import { apiRequest, withAuth, type AuthRequestOptions } from "../../core";
export type RewardsSummary = {
  rules: {
    version:number;
    ordersPerReward: number;
    rewardCents: number;
    minimumOrderCents: number;
  };
  nextRewardCents:number;
  campaigns:Array<{version:number;ordersPerReward:number;rewardCents:number;completed:number;progress:number;available:number}>;
  completed: number;
  claimed: number;
  available: number;
  progress: number;
  balanceCents: number;
  membership: {
    priceCents: number;
    days: number;
    minimumSubtotalCents: number;
    active: boolean;
    until: string | null;
    cancelled: boolean;
    mock: boolean;
    canEnroll: boolean;
  };
};
export const rewardsClient = {
  summary: (options?: AuthRequestOptions) =>
    apiRequest<RewardsSummary>(
      "/api/v1/rewards",
      withAuth({ ...options, method: "GET" }),
    ),
  claim: (options?: AuthRequestOptions) =>
    apiRequest<RewardsSummary>(
      "/api/v1/rewards/claim",
      withAuth({ ...options, method: "POST" }),
    ),
  enroll: (requestId: string, options?: AuthRequestOptions) =>
    apiRequest<RewardsSummary>(
      "/api/v1/rewards/membership",
      withAuth({ ...options, method: "POST", body: { requestId } }),
    ),
  cancel: (options?: AuthRequestOptions) =>
    apiRequest<RewardsSummary>(
      "/api/v1/rewards/membership/cancel",
      withAuth({ ...options, method: "POST" }),
    ),
};
