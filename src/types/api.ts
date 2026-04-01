export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
  code?: string;
}

export type PlanTier = "FREE" | "PRO" | "ENTERPRISE";

export interface PlanLimits {
  maxDocuments: number;       // -1 = unlimited
  maxStorageMb: number;       // -1 = unlimited
  maxTeamMembers: number;     // -1 = unlimited
  ocrEnabled: boolean;
  aiEnabled: boolean;
  collaborationEnabled: boolean;
  apiAccessEnabled: boolean;
  versionHistoryDays: number; // -1 = unlimited
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  FREE: {
    maxDocuments: 5,
    maxStorageMb: 100,
    maxTeamMembers: 1,
    ocrEnabled: false,
    aiEnabled: false,
    collaborationEnabled: false,
    apiAccessEnabled: false,
    versionHistoryDays: 0,
  },
  PRO: {
    maxDocuments: -1,
    maxStorageMb: 10000,
    maxTeamMembers: 10,
    ocrEnabled: true,
    aiEnabled: false,
    collaborationEnabled: false,
    apiAccessEnabled: true,
    versionHistoryDays: 30,
  },
  ENTERPRISE: {
    maxDocuments: -1,
    maxStorageMb: -1,
    maxTeamMembers: -1,
    ocrEnabled: true,
    aiEnabled: true,
    collaborationEnabled: true,
    apiAccessEnabled: true,
    versionHistoryDays: -1,
  },
};
