export type ExpertStatus = "active" | "suspended" | "blocked";

export type ExpertStats = {
  completedCount: number;
  missedDeadlineCount: number;
  avgCompletionHoursLast5: number | null;
};

export type Expert = {
  _id: string;
  name: string;
  email: string;
  profilePicture: string | null;
  oneLineDescription: string | null;
  yearsOfXp: string | null;
  expertise: string | null;
  isInternal: boolean;
  isAvailableForRequests: boolean;
  supportedCountries: string[];
  status: ExpertStatus;
  activeCommittedRequestCount: number;
  stats: ExpertStats;
  lastOfferedAt: string | null;
  lastAssignedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserRequestStats = {
  totalRequests: number;
  activeRequests: number;
  completedRequests: number;
  deadlineMissedRequests: number;
  refundedRequests: number;
  adminCreatedRequests: number;
  creditsSpentOnRequests: number;
  lastRequestAt: string | null;
  withResult?: number;
  withoutResult?: number;
};

export type User = {
  _id: string;
  externalUserId: string;
  name: string | null;
  email: string | null;
  creditBalance: number;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  stats?: UserRequestStats;
};

export type AdminUserRequest = {
  _id: string;
  displayId: string | null;
  coinTitle: string | null;
  userId: string | null;
  country: string;
  status: string;
  assignedExpertId: string | null;
  reportId: string | null;
  isAdminCreated: boolean;
  creditLedgerId: string | null;
  hasResult: boolean;
  deadlineAt: string | null;
  acceptedAt: string | null;
  submittedAt: string | null;
  completedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CreditLedger = {
  _id: string;
  userId: string;
  type: string;
  amount: number;
  balanceAfter: number;
  purchaseId: string | null;
  requestId: string | null;
  metadata: {
    adjustedBy: string;
    reason: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type AdminRequest = {
  _id: string;
  displayId: string | null;
  coinTitle: string | null;
  userId: string | null;
  country: string;
  payload: {
    media?: {
      obverse?: string[];
      reverse?: string[];
      edge?: string[];
      video?: string | null;
    };
  };
  status: string;
  creditLedgerId: string | null;
  assignedExpertId: string | null;
  previousExpertIds: string[];
  internalExpertId: string | null;
  allocationRound: number;
  isAdminCreated: boolean;
  firstAcceptanceWindowEndsAt: string | null;
  ttlExpiresAt: string | null;
  deadlineAt: string | null;
  acceptedAt: string | null;
  submittedAt: string | null;
  completedAt: string | null;
  acceptedByFallback: boolean;
  reportId: string | null;
  hasResult: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AllocationSummaryRow = {
  expertId: string;
  workloadPenalty: number;
  speedPenalty: number;
  score: number;
  rank: number;
  offered: boolean;
};

export type AllocationAttempt = {
  attemptId: string;
  round: number;
  attemptedAt: string;
  summary: AllocationSummaryRow[];
};

export type AllocationStage =
  | "initial"
  | "first_window_expired"
  | "skip_refill";

export type AllocationSummaryByStage = {
  requestId: string;
  stages: Record<AllocationStage, AllocationAttempt[]>;
  request?: AllocationRequestContext;
  user?: AllocationUserContext;
};

export type AllocationSummaryForStage = {
  requestId: string;
  stage: AllocationStage;
  attempts: AllocationAttempt[];
  request?: AllocationRequestContext;
  user?: AllocationUserContext;
};

export type AllocationRequestContext = {
  _id: string;
  displayId: string | null;
  status: string;
  country: string;
  userId: string;
  assignedExpertId: string | null;
  allocationRound: number;
  isAdminCreated: boolean;
  createdAt: string;
};

export type AllocationUserContext = {
  _id: string;
  externalUserId: string;
  name: string;
  email: string;
  creditBalance: number;
  createdAt?: string;
  updatedAt?: string;
};

export type AllocationSummaryListItem = {
  attemptId: string;
  requestId: string;
  displayId: string;
  stage: AllocationStage;
  round: number;
  attemptedAt: string;
  expertCount: number;
  offeredExpertId: string | null;
  requestStatus?: string;
  requestCountry?: string;
  user?: AllocationUserContext | null;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AllocationSummaryListResponse = {
  items: AllocationSummaryListItem[];
  pagination: PaginationMeta;
};

export type ApiEnvelope<T> = {
  error: boolean;
  message: string | null;
  data: T;
};

/** Writable fields for POST /admin/experts. Never include isInternal. */
export type CreateExpertBody = {
  name: string;
  email: string;
  password: string;
  supportedCountries: string[];
  yearsOfXp: string;
  expertise: string;
  profilePicture?: string;
  oneLineDescription?: string;
};

/** Writable fields for PATCH /admin/experts/:id. Never include isInternal or status. */
export type UpdateExpertBody = {
  name?: string;
  email?: string;
  password?: string;
  supportedCountries?: string[];
  yearsOfXp?: string;
  expertise?: string;
  profilePicture?: string;
  oneLineDescription?: string;
};

export type CreditAdjustBody = {
  amount: number;
  reason: string;
};

export type CreateUserRequestBody = {
  country: string;
  payload?: {
    media?: {
      obverse?: string[];
      reverse?: string[];
      edge?: string[];
      video?: string | null;
    };
  };
};
