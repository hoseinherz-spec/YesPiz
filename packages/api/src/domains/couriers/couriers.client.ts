import { apiRequest, withAuth, type AuthRequestOptions } from "../../core";
import type {
  CourierLocationResponse,
  CourierProfile,
  CourierSession,
  SessionCodeRequest,
  UpdateCourierLocationRequest,
  UpdateCourierProfileRequest,
} from "./couriers.dto";
import { couriersEndpoints } from "./couriers.endpoint";

export const couriersClient = {
  operations(options?: AuthRequestOptions) {
    return apiRequest<
      Array<{ userId: string; name: string; session: CourierSession | null }>
    >("/api/v1/couriers/operations", withAuth({ ...options, method: "GET" }));
  },
  issueCode(
    courierId: string,
    action: "start" | "end",
    options?: AuthRequestOptions,
  ) {
    return apiRequest<{ code: string; expiresAt: string }>(
      "/api/v1/couriers/sessions/code",
      withAuth({ ...options, method: "POST", body: { courierId, action } }),
    );
  },
  currentSession(options?: AuthRequestOptions) {
    return apiRequest<CourierSession | null>(
      "/api/v1/couriers/sessions/current",
      withAuth({ ...options, method: "GET" }),
    );
  },
  available(options?: AuthRequestOptions) {
    return apiRequest<
      Array<{ userId: string; name: string; vehicleType?: string }>
    >("/api/v1/couriers/available", withAuth({ ...options, method: "GET" }));
  },
  getMe(options?: AuthRequestOptions) {
    return apiRequest<CourierProfile>(
      couriersEndpoints.me,
      withAuth({ ...options, method: "GET" }),
    );
  },

  updateMe(body: UpdateCourierProfileRequest, options?: AuthRequestOptions) {
    return apiRequest<CourierProfile>(
      couriersEndpoints.me,
      withAuth({ ...options, method: "PATCH", body }),
    );
  },

  updateLocation(
    body: UpdateCourierLocationRequest,
    options?: AuthRequestOptions,
  ) {
    return apiRequest<CourierLocationResponse>(
      couriersEndpoints.location,
      withAuth({ ...options, method: "POST", body }),
    );
  },

  startSession(body: SessionCodeRequest, options?: AuthRequestOptions) {
    return apiRequest<CourierSession>(
      couriersEndpoints.sessionStart,
      withAuth({ ...options, method: "POST", body }),
    );
  },

  endSession(body: SessionCodeRequest, options?: AuthRequestOptions) {
    return apiRequest<CourierSession>(
      couriersEndpoints.sessionEnd,
      withAuth({ ...options, method: "POST", body }),
    );
  },
};
