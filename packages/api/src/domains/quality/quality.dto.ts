export type ChecklistAnswer = {
  item: string;
  ok: boolean;
};

export type KitchenQualityView = {
  id: string;
  status: string;
  sealId: string | null;
  checklistCompletedAt: string | null;
  checklistAnswers: ChecklistAnswer[];
  readyPhotoUrl: string | null;
  isTestOrder: boolean;
};

export type ProviderQualityView = {
  id: string;
  qualityScore: number;
  complaintCount: number;
  delayCount: number;
  errorCount: number;
  autoSuspended: boolean;
  suspendedAt?: string;
  suspendReason?: string;
  acceptingOrders: boolean;
  rating: number;
};

export type SubmitChecklistRequest = {
  answers: ChecklistAnswer[];
};

export type SubmitSealRequest = {
  sealId: string;
};

export type SubmitReadyPhotoRequest = {
  photoUrl: string;
};

export type RecordQualityIncidentRequest = {
  kind: 'complaint' | 'delay' | 'error';
};

export type UnsuspendProviderRequest = {
  reason?: string;
};

export type CreateTestOrderRequest = {
  providerId: string;
  addressId: string;
  customerId: string;
  menuVersion: number;
  lines: Array<{ menuItemId: string; quantity: number }>;
  notes?: string;
};
