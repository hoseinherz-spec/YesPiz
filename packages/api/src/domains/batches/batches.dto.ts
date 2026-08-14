export type CreateBatchRequest = {
  providerId: string;
  orderIds: string[];
};

export type SuggestBatchRequest = {
  providerId: string;
};

export type ReduceBatchRequest = {
  keepOrderIds: string[];
};

export type AssignCourierRequest = {
  courierId: string;
};

export type BatchStatus =
  | 'open'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type Batch = {
  id: string;
  providerId: string;
  orderIds: string[];
  courierId?: string;
  status: BatchStatus;
  totalPrepWeight: number;
  createdAt?: string;
  updatedAt?: string;
};

export type SuggestBatchResponse = {
  providerId: string;
  suggestedOrderIds: string[];
  maxBatchSize: number;
};
