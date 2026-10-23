import axios from 'axios';
import type {
  AttendanceItem,
  AuditLog,
  AuthResponse,
  ChargePaymentStatus,
  ClubSetting,
  Court,
  CourtAssignment,
  DashboardSummary,
  Expense,
  ExpenseCategory,
  MembershipType,
  NotificationItem,
  PagedResult,
  PaymentMethod,
  PaymentTransaction,
  Player,
  Session,
  SessionCharge,
  SessionRegistration,
  SessionStatus,
  SkillLevel,
  Venue,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const raw = localStorage.getItem('bh_auth_user');
  if (raw) {
    try {
      const parsed: AuthResponse = JSON.parse(raw);
      if (parsed.token) {
        config.headers.Authorization = `Bearer ${parsed.token}`;
      }
    } catch {
      // ignore invalid json
    }
  }
  return config;
});

export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const serverMsg = err.response?.data?.message;
    if (typeof serverMsg === 'string' && serverMsg.trim().length > 0) {
      return serverMsg;
    }
    if (status === 401) {
      return 'Phiên đăng nhập đã hết hạn hoặc thông tin xác thực không đúng. Vui lòng đăng nhập lại.';
    }
    if (status === 403) {
      return 'Bạn không có quyền thực hiện thao tác này.';
    }
    if (status === 404) {
      return 'Không tìm thấy dữ liệu phù hợp.';
    }
    if (status === 400) {
      return 'Dữ liệu gửi lên chưa hợp lệ. Vui lòng kiểm tra lại thông tin đã nhập.';
    }
  }
  return 'Không thể kết nối đến máy chủ. Vui lòng thử lại.';
}

export const badmintonApi = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', { username, password });
    return data;
  },

  getDashboard: async (): Promise<DashboardSummary> => {
    const { data } = await apiClient.get<DashboardSummary>('/dashboard');
    return data;
  },

  // Venues & Courts
  getVenues: async (): Promise<Venue[]> => {
    const { data } = await apiClient.get<Venue[]>('/venues');
    return data;
  },
  createVenue: async (payload: Omit<Venue, 'id' | 'courtsCount'>): Promise<Venue> => {
    const { data } = await apiClient.post<Venue>('/venues', payload);
    return data;
  },
  updateVenue: async (id: number, payload: Omit<Venue, 'id' | 'courtsCount'>): Promise<Venue> => {
    const { data } = await apiClient.put<Venue>(`/venues/${id}`, payload);
    return data;
  },

  getCourts: async (venueId?: number): Promise<Court[]> => {
    const { data } = await apiClient.get<Court[]>('/courts', { params: { venueId } });
    return data;
  },
  createCourt: async (payload: Omit<Court, 'id' | 'venueName'>): Promise<Court> => {
    const { data } = await apiClient.post<Court>('/courts', payload);
    return data;
  },
  updateCourt: async (id: number, payload: Omit<Court, 'id' | 'venueName'>): Promise<Court> => {
    const { data } = await apiClient.put<Court>(`/courts/${id}`, payload);
    return data;
  },

  // Players
  getPlayers: async (params: {
    search?: string;
    skillLevel?: SkillLevel;
    membershipType?: MembershipType;
    onlyActive?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<PagedResult<Player>> => {
    const { data } = await apiClient.get<PagedResult<Player>>('/players', { params });
    return data;
  },
  createPlayer: async (payload: {
    fullName: string;
    phoneNumber: string;
    email?: string;
    gender: string;
    skillLevel: SkillLevel;
    membershipType: MembershipType;
    isActive: boolean;
    notes?: string;
  }): Promise<Player> => {
    const { data } = await apiClient.post<Player>('/players', payload);
    return data;
  },
  updatePlayer: async (
    id: number,
    payload: {
      fullName: string;
      phoneNumber: string;
      email?: string;
      gender: string;
      skillLevel: SkillLevel;
      membershipType: MembershipType;
      isActive: boolean;
      notes?: string;
    }
  ): Promise<Player> => {
    const { data } = await apiClient.put<Player>(`/players/${id}`, payload);
    return data;
  },

  // Sessions & Registrations
  getSessions: async (params?: {
    status?: SessionStatus;
    venueId?: number;
    page?: number;
    pageSize?: number;
  }): Promise<PagedResult<Session>> => {
    const { data } = await apiClient.get<PagedResult<Session>>('/sessions', { params });
    return data;
  },
  createSession: async (payload: Record<string, unknown>): Promise<Session> => {
    const { data } = await apiClient.post<Session>('/sessions', payload);
    return data;
  },
  updateSession: async (id: number, payload: Record<string, unknown>): Promise<Session> => {
    const { data } = await apiClient.put<Session>(`/sessions/${id}`, payload);
    return data;
  },
  getSessionRegistrations: async (sessionId: number): Promise<SessionRegistration[]> => {
    const { data } = await apiClient.get<SessionRegistration[]>(`/sessions/${sessionId}/registrations`);
    return data;
  },
  registerSessionPlayer: async (
    sessionId: number,
    payload: { playerId: number; isGuest: boolean; guestsBroughtCount: number; note?: string }
  ): Promise<SessionRegistration> => {
    const { data } = await apiClient.post<SessionRegistration>(`/sessions/${sessionId}/registrations`, payload);
    return data;
  },
  cancelRegistration: async (sessionId: number, playerId: number): Promise<void> => {
    await apiClient.delete(`/sessions/${sessionId}/registrations/${playerId}`);
  },

  // Attendance
  getSessionAttendances: async (sessionId: number): Promise<AttendanceItem[]> => {
    const { data } = await apiClient.get<AttendanceItem[]>(`/attendance/session/${sessionId}`);
    return data;
  },
  upsertAttendance: async (payload: {
    sessionId: number;
    playerId: number;
    status: number;
    isGuest: boolean;
    extraGuestsCount: number;
    matchesPlayedCount: number;
    note?: string;
  }): Promise<AttendanceItem> => {
    const { data } = await apiClient.post<AttendanceItem>('/attendance', payload);
    return data;
  },
  initializeAttendance: async (sessionId: number): Promise<AttendanceItem[]> => {
    const { data } = await apiClient.post<AttendanceItem[]>(`/attendance/session/${sessionId}/initialize`);
    return data;
  },

  // Pricing & Payments
  getSessionCharges: async (params?: {
    sessionId?: number;
    status?: ChargePaymentStatus;
    playerId?: number;
  }): Promise<SessionCharge[]> => {
    const { data } = await apiClient.get<SessionCharge[]>('/payments/charges', { params });
    return data;
  },
  calculateSessionCharges: async (payload: {
    sessionId: number;
    shuttlecockCountUsed?: number;
    courtFeeTotal?: number;
    otherFeeTotal?: number;
  }): Promise<SessionCharge[]> => {
    const { data } = await apiClient.post<SessionCharge[]>('/payments/charges/calculate', payload);
    return data;
  },
  getPaymentTransactions: async (params?: {
    playerId?: number;
    method?: PaymentMethod;
    page?: number;
    pageSize?: number;
  }): Promise<PagedResult<PaymentTransaction>> => {
    const { data } = await apiClient.get<PagedResult<PaymentTransaction>>('/payments/transactions', { params });
    return data;
  },
  createPaymentTransaction: async (payload: {
    playerId: number;
    sessionChargeId?: number;
    amount: number;
    paymentMethod: PaymentMethod;
    referenceCode?: string;
    note?: string;
  }): Promise<PaymentTransaction> => {
    const { data } = await apiClient.post<PaymentTransaction>('/payments/transactions', payload);
    return data;
  },

  // Expenses
  getExpenses: async (params?: {
    category?: ExpenseCategory;
    sessionId?: number;
    page?: number;
    pageSize?: number;
  }): Promise<PagedResult<Expense>> => {
    const { data } = await apiClient.get<PagedResult<Expense>>('/expenses', { params });
    return data;
  },
  createExpense: async (payload: {
    title: string;
    category: ExpenseCategory;
    amount: number;
    expenseDate: string;
    sessionId?: number;
    paidBy: string;
    vendorName?: string;
    receiptNote?: string;
  }): Promise<Expense> => {
    const { data } = await apiClient.post<Expense>('/expenses', payload);
    return data;
  },
  deleteExpense: async (id: number): Promise<void> => {
    await apiClient.delete(`/expenses/${id}`);
  },

  // Court Assignments
  getCourtAssignments: async (sessionId: number): Promise<CourtAssignment[]> => {
    const { data } = await apiClient.get<CourtAssignment[]>(`/court-assignments/session/${sessionId}`);
    return data;
  },
  saveCourtAssignment: async (
    id: number | null,
    payload: {
      sessionId: number;
      courtId: number;
      matchOrder: number;
      teamAPlayerNames: string;
      teamBPlayerNames: string;
      teamAScore: number;
      teamBScore: number;
      status: number;
      notes?: string;
    }
  ): Promise<CourtAssignment> => {
    if (id && id > 0) {
      const { data } = await apiClient.put<CourtAssignment>(`/court-assignments/${id}`, payload);
      return data;
    }
    const { data } = await apiClient.post<CourtAssignment>('/court-assignments', payload);
    return data;
  },
  autoGenerateCourtAssignments: async (sessionId: number): Promise<CourtAssignment[]> => {
    const { data } = await apiClient.post<CourtAssignment[]>(`/court-assignments/session/${sessionId}/auto-generate`);
    return data;
  },

  // Notifications, Settings, Audit Logs
  getNotifications: async (): Promise<NotificationItem[]> => {
    const { data } = await apiClient.get<NotificationItem[]>('/notifications');
    return data;
  },
  markNotificationRead: async (id: number): Promise<void> => {
    await apiClient.post(`/notifications/${id}/read`);
  },
  markAllNotificationsRead: async (): Promise<void> => {
    await apiClient.post('/notifications/read-all');
  },
  getSettings: async (): Promise<ClubSetting> => {
    const { data } = await apiClient.get<ClubSetting>('/settings');
    return data;
  },
  updateSettings: async (payload: ClubSetting): Promise<ClubSetting> => {
    const { data } = await apiClient.put<ClubSetting>('/settings', payload);
    return data;
  },
  getAuditLogs: async (count = 30): Promise<AuditLog[]> => {
    const { data } = await apiClient.get<AuditLog[]>('/settings/audit-logs', { params: { count } });
    return data;
  },
};
