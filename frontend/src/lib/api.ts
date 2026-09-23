import {
  AdminDashboardData,
  AuthResponse,
  Booking,
  CallRequest,
  ChatSession,
  Diagnosis,
  StarterCategory,
  UploadedMedia,
  UserProfile,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
export const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

export function getFullMediaUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${BACKEND_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Token management in localStorage
export const tokenStorage = {
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('car_mechanic_access_token');
  },
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('car_mechanic_refresh_token');
  },
  setTokens(access: string, refresh: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('car_mechanic_access_token', access);
    localStorage.setItem('car_mechanic_refresh_token', refresh);
  },
  clearTokens() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('car_mechanic_access_token');
    localStorage.removeItem('car_mechanic_refresh_token');
  },
};

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const headers = new Headers(options.headers || {});

  const token = tokenStorage.getAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle Token Expiry
  if (response.status === 401 && retry) {
    const refreshToken = tokenStorage.getRefreshToken();
    if (refreshToken) {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = (async () => {
          try {
            const refreshRes = await fetch(`${API_BASE}/auth/token/refresh/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh: refreshToken }),
            });
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              tokenStorage.setTokens(refreshData.access, refreshData.refresh || refreshToken);
              return refreshData.access;
            } else {
              tokenStorage.clearTokens();
              return null;
            }
          } catch {
            tokenStorage.clearTokens();
            return null;
          } finally {
            isRefreshing = false;
          }
        })();
      }

      const newAccessToken = await refreshPromise;
      if (newAccessToken) {
        const retryHeaders = new Headers(options.headers || {});
        retryHeaders.set('Authorization', `Bearer ${newAccessToken}`);
        if (!(options.body instanceof FormData) && !retryHeaders.has('Content-Type')) {
          retryHeaders.set('Content-Type', 'application/json');
        }
        const retryResponse = await fetch(url, {
          ...options,
          headers: retryHeaders,
        });
        if (!retryResponse.ok) {
          const errData = await retryResponse.json().catch(() => null);
          throw new ApiError(
            errData?.detail || Object.values(errData || {})[0] || 'API Error',
            retryResponse.status,
            errData
          );
        }
        return retryResponse.json();
      }
    }
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    const detailMsg =
      errData?.detail ||
      (typeof errData === 'object' && errData !== null
        ? Object.entries(errData)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
            .join('; ')
        : 'API request failed');
    throw new ApiError(detailMsg, response.status, errData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth
  register(data: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
  }): Promise<UserProfile> {
    return request<UserProfile>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  loginCustomer(credentials: {
    username: string;
    password: string;
  }): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  loginAdmin(credentials: {
    username: string;
    password: string;
  }): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/admin/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  getMe(): Promise<UserProfile> {
    return request<UserProfile>('/auth/me/');
  },

  // Chat
  sendChat(data: {
    session_id?: string;
    message?: string;
    starter_category?: StarterCategory;
  }): Promise<ChatSession> {
    return request<ChatSession>('/chat/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMySessions(): Promise<ChatSession[]> {
    return request<ChatSession[]>('/chat/sessions/');
  },

  getSession(sessionId: string): Promise<ChatSession> {
    return request<ChatSession>(`/chat/${sessionId}/`);
  },

  uploadMedia(sessionId: string, file: File): Promise<UploadedMedia> {
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('file', file);
    return request<UploadedMedia>('/upload/', {
      method: 'POST',
      body: formData,
    });
  },

  getDiagnosis(sessionId: string): Promise<Diagnosis> {
    return request<Diagnosis>('/diagnosis/', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    });
  },

  getMyDiagnoses(): Promise<Diagnosis[]> {
    return request<Diagnosis[]>('/diagnosis/');
  },

  // Bookings
  createBooking(data: {
    session_id?: string;
    diagnosis_id?: number;
    service_requested?: string;
    preferred_datetime?: string;
    notes?: string;
  }): Promise<Booking> {
    return request<Booking>('/booking/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMyBookings(): Promise<Booking[]> {
    return request<Booking[]>('/booking/');
  },

  getBooking(bookingId: string): Promise<Booking> {
    return request<Booking>(`/booking/${bookingId}/`);
  },

  createCallRequest(data: {
    session_id?: string;
    phone_number: string;
    preferred_time?: string;
  }): Promise<CallRequest> {
    return request<CallRequest>('/call-request/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMyCallRequests(): Promise<CallRequest[]> {
    return request<CallRequest[]>('/call-request/');
  },

  // Admin
  getAdminDashboard(): Promise<AdminDashboardData> {
    return request<AdminDashboardData>('/admin/dashboard/');
  },
};
