import {
  apiRequest,
  withAuth,
  type ApiRequestOptions,
  type AuthRequestOptions,
} from '../../core';
import type {
  Category,
  CreateCategoryRequest,
  CreateMenuItemRequest,
  CreateMenuVersionRequest,
  MenuItem,
  MenuVersion,
  MenuVersionDetail,
  PublishedMenuResponse,
  UpdateMenuItemRequest,
} from './catalog.dto';
import { catalogEndpoints } from './catalog.endpoint';

export const catalogClient = {
  getPublishedMenu(options?: ApiRequestOptions) {
    return apiRequest<PublishedMenuResponse>(catalogEndpoints.menu, {
      ...options,
      method: 'GET',
    });
  },

  listVersions(options?: AuthRequestOptions) {
    return apiRequest<MenuVersion[]>(
      catalogEndpoints.versions,
      withAuth({ ...options, method: 'GET' }),
    );
  },

  getVersion(versionId: string, options?: AuthRequestOptions) {
    return apiRequest<MenuVersionDetail>(
      catalogEndpoints.version(versionId),
      withAuth({ ...options, method: 'GET' }),
    );
  },

  createVersion(body: CreateMenuVersionRequest, options?: AuthRequestOptions) {
    return apiRequest<MenuVersion>(
      catalogEndpoints.versions,
      withAuth({ ...options, method: 'POST', body }),
    );
  },

  publish(versionId: string, options?: AuthRequestOptions) {
    return apiRequest<MenuVersion>(
      catalogEndpoints.publish(versionId),
      withAuth({ ...options, method: 'POST' }),
    );
  },

  addCategory(
    versionId: string,
    body: CreateCategoryRequest,
    options?: AuthRequestOptions,
  ) {
    return apiRequest<Category>(
      catalogEndpoints.categories(versionId),
      withAuth({ ...options, method: 'POST', body }),
    );
  },

  addItem(
    versionId: string,
    body: CreateMenuItemRequest,
    options?: AuthRequestOptions,
  ) {
    return apiRequest<MenuItem>(
      catalogEndpoints.items(versionId),
      withAuth({ ...options, method: 'POST', body }),
    );
  },

  updateItem(
    itemId: string,
    body: UpdateMenuItemRequest,
    options?: AuthRequestOptions,
  ) {
    return apiRequest<MenuItem>(
      catalogEndpoints.updateItem(itemId),
      withAuth({ ...options, method: 'PATCH', body }),
    );
  },
};
