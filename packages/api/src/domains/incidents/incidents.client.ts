import {
  apiRequest,
  withAuth,
  type AuthRequestOptions,
} from '../../core';
import type {
  CreateIncidentRequest,
  Incident,
  ResolveIncidentRequest,
} from '../proof/proof.dto';
import { incidentsEndpoints } from './incidents.endpoint';

export type {
  CreateIncidentRequest,
  Incident,
  IncidentKind,
  IncidentStatus,
  ResolveIncidentRequest,
} from '../proof/proof.dto';

export const incidentsClient = {
  report(
    orderId: string,
    body: CreateIncidentRequest,
    options?: AuthRequestOptions,
  ) {
    return apiRequest<Incident>(
      incidentsEndpoints.report(orderId),
      withAuth({ ...options, method: 'POST', body }),
    );
  },

  listMine(options?: AuthRequestOptions) {
    return apiRequest<Incident[]>(
      incidentsEndpoints.me,
      withAuth({ ...options, method: 'GET' }),
    );
  },

  listOpen(options?: AuthRequestOptions) {
    return apiRequest<Incident[]>(
      incidentsEndpoints.list,
      withAuth({ ...options, method: 'GET' }),
    );
  },

  get(id: string, options?: AuthRequestOptions) {
    return apiRequest<Incident>(
      incidentsEndpoints.byId(id),
      withAuth({ ...options, method: 'GET' }),
    );
  },

  resolve(
    id: string,
    body: ResolveIncidentRequest,
    options?: AuthRequestOptions,
  ) {
    return apiRequest<Incident>(
      incidentsEndpoints.resolve(id),
      withAuth({ ...options, method: 'PATCH', body }),
    );
  },
};
