import type { LiveOperationsView } from "./orders.dto";
import { apiRequest, withAuth, type AuthRequestOptions } from "../../core";
import type {
  AtRiskDashboardResponse,
  OrderTrackingView,
  CourierLocationView,
  CreateAddressRequest,
  CreateOrderRequest,
  CustomerOrderView,
  DeleteAddressResponse,
  DeliveryAddress,
  Order,
  OrderQuote,
  ReorderPreviewResponse,
  ResolveAdminReviewRequest,
  UpdateKitchenStatusRequest,
} from "./orders.dto";
import { ordersEndpoints } from "./orders.endpoint";

export const ordersClient = {
  tracking(id: string, options?: AuthRequestOptions) {
    return apiRequest<OrderTrackingView>(
      ordersEndpoints.tracking(id),
      withAuth({ ...options, method: "GET" }),
    );
  },
  callCourier(id: string, options?: AuthRequestOptions) {
    return apiRequest<{ message: string }>(
      `/api/v1/communications/orders/${encodeURIComponent(id)}/call`,
      withAuth({ ...options, method: "POST" }),
    );
  },
  quote(body: CreateOrderRequest, options?: AuthRequestOptions) {
    return apiRequest<OrderQuote>(
      ordersEndpoints.quote,
      withAuth({ ...options, method: "POST", body }),
    );
  },
  createAddress(body: CreateAddressRequest, options?: AuthRequestOptions) {
    return apiRequest<DeliveryAddress>(
      ordersEndpoints.addresses,
      withAuth({ ...options, method: "POST", body }),
    );
  },

  listAddresses(options?: AuthRequestOptions) {
    return apiRequest<DeliveryAddress[]>(
      ordersEndpoints.addresses,
      withAuth({ ...options, method: "GET" }),
    );
  },

  deleteAddress(id: string, options?: AuthRequestOptions) {
    return apiRequest<DeleteAddressResponse>(
      ordersEndpoints.address(id),
      withAuth({ ...options, method: "DELETE" }),
    );
  },

  create(body: CreateOrderRequest, options?: AuthRequestOptions) {
    return apiRequest<CustomerOrderView>(
      ordersEndpoints.list,
      withAuth({ ...options, method: "POST", body }),
    );
  },

  list(options?: AuthRequestOptions) {
    return apiRequest<CustomerOrderView[]>(
      ordersEndpoints.list,
      withAuth({ ...options, method: "GET" }),
    );
  },

  listAdminReview(options?: AuthRequestOptions) {
    return apiRequest<Order[]>(
      ordersEndpoints.adminReview,
      withAuth({ ...options, method: "GET" }),
    );
  },

  liveOperations(options?: AuthRequestOptions) {
    return apiRequest<LiveOperationsView>(
      "/api/v1/orders/admin/live",
      withAuth({ ...options, method: "GET" }),
    );
  },
  listAtRisk(options?: AuthRequestOptions) {
    return apiRequest<AtRiskDashboardResponse>(
      ordersEndpoints.adminAtRisk,
      withAuth({ ...options, method: "GET" }),
    );
  },

  reorder(orderId: string, options?: AuthRequestOptions) {
    return apiRequest<ReorderPreviewResponse>(
      ordersEndpoints.reorder(orderId),
      withAuth({ ...options, method: "POST" }),
    );
  },

  resolveAdminReview(
    id: string,
    body: ResolveAdminReviewRequest,
    options?: AuthRequestOptions,
  ) {
    return apiRequest<Order>(
      ordersEndpoints.adminResolve(id),
      withAuth({ ...options, method: "PATCH", body }),
    );
  },

  listKitchen(options?: AuthRequestOptions) {
    return apiRequest<Order[]>(
      ordersEndpoints.kitchen,
      withAuth({ ...options, method: "GET" }),
    );
  },

  get(id: string, options?: AuthRequestOptions) {
    return apiRequest<CustomerOrderView>(
      ordersEndpoints.byId(id),
      withAuth({ ...options, method: "GET" }),
    );
  },

  getCourierLocation(id: string, options?: AuthRequestOptions) {
    return apiRequest<CourierLocationView>(
      ordersEndpoints.courierLocation(id),
      withAuth({ ...options, method: "GET" }),
    );
  },

  updateKitchenStatus(
    id: string,
    body: UpdateKitchenStatusRequest,
    options?: AuthRequestOptions,
  ) {
    return apiRequest<Order>(
      ordersEndpoints.kitchenStatus(id),
      withAuth({ ...options, method: "PATCH", body }),
    );
  },

  markFailedCash(id: string, options?: AuthRequestOptions) {
    return apiRequest<Order>(
      ordersEndpoints.failedCash(id),
      withAuth({ ...options, method: "POST" }),
    );
  },
};
