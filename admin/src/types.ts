/* Kiểu dữ liệu theo bảng Supabase (snake_case như trong DB) */
export type Role = 'admin' | 'dispatcher' | 'accountant' | 'hr';

export interface Staff { user_id: string; full_name: string | null; email: string | null; role: Role; created_at: string }

export interface Vehicle {
  id: string; driver_id: string; plate: string; model: string | null; compartments: number[];
  registry_exp: string | null; tank_inspect_exp: string | null; odo: number; next_service_km: number;
}
export interface Cert {
  id: string; driver_id: string; name: string; number: string | null; expires_on: string;
  icon: string; color: string; renewable: boolean; sort: number;
}
export interface Driver {
  id: string; user_id: string | null; email: string | null; code: string; full_name: string; phone: string | null;
  team: string | null; since: string | null; dob: string | null; rating: number; trips_year: number; km_safe: number;
  incidents: number; leave_left: number; company: string | null; dispatcher_name: string | null; dispatcher_phone: string | null;
  hse_name: string | null; hse_phone: string | null; learn_minutes_month: number; active: boolean; created_at: string;
  vehicles?: Vehicle[]; certificates?: Cert[];
}
export type DriverRef = { full_name: string; code: string } | null;

export interface Cargo { job_id: string; idx: number; label: string; item: string; qty: number; unit: 'L' | 'thùng'; loaded: number | null; delivered: number | null }
export interface Check { job_id: string; idx: number; title: string; phase: 'pickup' | 'deliver'; done: boolean; sign: boolean }
export interface Job {
  id: string; driver_id: string; code: string; job_date: string; status: number; vehicle: string | null; kind: 'bulk' | 'drum';
  from_name: string; from_addr: string | null; from_time: string | null; to_name: string; to_addr: string | null; to_eta: string | null;
  to_who: string | null; to_phone: string | null; km: number; fee: number; seal: string | null; note: string | null; late_min: number;
  rejected_reason: string | null; rejected_note: string | null; confirm_by: string | null; deviation_note: string | null; created_at: string;
  drivers?: DriverRef; job_cargo?: Cargo[]; job_checks?: Check[];
}

export interface Attendance {
  driver_id: string; work_date: string; check_in: string | null; check_out: string | null; note: string | null;
  explain: 'pending' | 'approved' | 'rejected' | null; explain_text: string | null;
}

export type ExpCat = 'fuel' | 'food' | 'toll' | 'parking' | 'repair' | 'other';
export interface Expense {
  id: string; driver_id: string; spent_on: string; spent_time: string | null; category: ExpCat; title: string; place: string | null;
  amount: number; status: 'pending' | 'approved' | 'rejected'; receipt: boolean; vat: boolean; reject_reason: string | null;
  liters: number | null; odo: number | null; job_code: string | null; over_note: string | null; reviewed_at: string | null; created_at: string;
  drivers?: DriverRef;
}
export interface Advance {
  id: string; driver_id: string; requested_on: string; amount: number; reason: string | null; status: 'pending' | 'paid';
  reviewed_at: string | null; created_at: string; drivers?: DriverRef;
}

export interface Lesson { course_id: string; idx: number; title: string; type: 'video' | 'read' | 'quiz'; minutes: number }
export interface Quiz { course_id: string; idx: number; question: string; options: string[]; answer: number }
export interface Course {
  id: string; title: string; required: boolean; due: string | null; color: string; icon: string; sort: number;
  lessons?: Lesson[]; quiz_questions?: Quiz[];
}
export interface Progress { driver_id: string; course_id: string; lesson_idx: number }

export type ReqKind = 'incident' | 'leave' | 'complaint' | 'renew' | 'sos';
export type ReqStatus = 'new' | 'processing' | 'done' | 'rejected';
export interface Req {
  id: string; driver_id: string; kind: ReqKind; title: string; detail: string | null; status: ReqStatus; response: string | null;
  handled_at: string | null; created_at: string; drivers?: DriverRef;
}
