export type Role = 'CUSTOMER' | 'ADMIN';
export type AdminSubRole = 'SUPPORT' | 'MANAGER' | 'SUPERADMIN';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  admin_sub_role?: AdminSubRole | null;
  phone_number?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  role: Role;
  username: string;
  user_id: number;
}

export type StarterCategory =
  | 'WONT_START'
  | 'ENGINE_NOISE'
  | 'OVERHEATING'
  | 'BRAKE_PROBLEM'
  | 'AC_NOT_COOLING';

export type Category = StarterCategory | 'OTHER';

export type SessionStatus =
  | 'ACTIVE'
  | 'COLLECTING'
  | 'READY'
  | 'DIAGNOSED'
  | 'REJECTED'
  | 'CLOSED';

export type MessageSender = 'CUSTOMER' | 'BOT';
export type MessageType = 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'SYSTEM';

export interface UploadedMedia {
  id: number;
  session: string;
  file: string;
  media_type: 'IMAGE' | 'AUDIO' | 'VIDEO';
  ai_analysis_summary: string;
  uploaded_at: string;
}

export interface Message {
  id: number;
  sender: MessageSender;
  message_type: MessageType;
  text: string;
  media?: UploadedMedia | null;
  created_at: string;
}

export interface PendingQuestion {
  key: string;
  question: string;
  options?: string[];
}

export interface DiagnosisCause {
  cause: string;
  confidence: number;
}

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Diagnosis {
  id: number;
  session: string;
  category: string;
  possible_causes: DiagnosisCause[];
  overall_confidence: number;
  severity: Severity;
  recommended_service: string;
  summary: string;
  source: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  category: Category | null;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
  messages: Message[];
  pending_question?: PendingQuestion | null;
  diagnosis?: Diagnosis | null;
}

export interface Booking {
  id: string;
  customer?: number;
  session?: string;
  diagnosis?: number;
  service_requested: string;
  preferred_datetime?: string;
  notes?: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
  updated_at?: string;
}

export interface CallRequest {
  id: string;
  session?: string;
  phone_number: string;
  preferred_time?: string;
  status: 'PENDING' | 'CALLED' | 'RESOLVED' | 'NO_ANSWER';
  created_at: string;
}

export interface CategoryMetric {
  category: string;
  count: number;
}

export interface ServiceMetric {
  recommended_service: string;
  count: number;
}

export interface SeverityMetric {
  severity: string;
  count: number;
}

export interface StatusCountMetric {
  status: string;
  count: number;
}

export interface AdminDashboardData {
  total_sessions: number;
  total_diagnoses: number;
  issue_categories: CategoryMetric[];
  service_recommendations: ServiceMetric[];
  severity_breakdown: SeverityMetric[];
  bookings: {
    total: number;
    by_status: StatusCountMetric[];
  };
  call_requests: {
    total: number;
    by_status: StatusCountMetric[];
  };
  conversion: {
    sessions_to_diagnosis_rate: number;
    diagnosis_to_booking_rate: number;
    sessions_to_booking_rate: number;
    sessions_rejected_rate: number;
  };
}
