import {
  apiRequest,
  withAuth,
  type AuthRequestOptions,
} from '../../core';
import type {
  CourierLocationResponse,
  CourierProfile,
  CourierSession,
  SessionCodeRequest,
  UpdateCourierLocationRequest,
  UpdateCourierProfileRequest,
} from './couriers.dto';
import { couriersEndpoints } from './couriers.endpoint';

export const couriersClient = {
  getMe(options?: AuthRequestOptions) {
    return apiRequest<CourierProfile>(
      couriersEndpoints.me,
      withAuth({ ...options, method: 'GET' }),
    );
  },

  updateMe(body: UpdateCourierProfileRequest, options?: AuthRequestOptions) {
    return apiRequest<CourierProfile>(
      couriersEndpoints.me,
      withAuth({ ...options, method: 'PATCH', body }),
    );
  },

  updateLocation(
    body: UpdateCourierLocationRequest,
    options?: AuthRequestOptions,
  ) {
    return apiRequest<CourierLocationResponse>(
      couriersEndpoints.location,
      withAuth({ ...options, method: 'POST', body }),
    );
  },

  startSession(body: SessionCodeRequest, options?: AuthRequestOptions) {
    return apiRequest<CourierSession>(
      couriersEndpoints.sessionStart,
      withAuth({ ...options, method: 'POST', body }),
    );
  },

  endSession(body: SessionCodeRequest, options?: AuthRequestOptions) {
    return apiRequest<CourierSession>(
      couriersEndpoints.sessionEnd,
      withAuth({ ...options, method: 'POST', body }),
    );
  },
};
