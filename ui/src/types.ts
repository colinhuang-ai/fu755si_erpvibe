export type JobStatus = 0 | 1 | 2 | 3 | 4 | 5;
export type Unit = 'L' | 'thùng';

export interface CargoLine {
  label: string;
  item: string;
  qty: number;
  unit: Unit;
  /** lượng thực nạp tại kho */
  loaded?: number;
  /** lượng thực xả tại điểm giao */
  delivered?: number;
}

export interface TripCheck { t: string; ph: 'pickup' | 'deliver'; done: boolean; sign?: boolean }
export interface Place { name: string; addr: string }

export interface Job {
  id: string;
  date: string;
  status: JobStatus;
  vehicle: string;
  type: 'bulk' | 'drum';
  from: Place & { time: string };
  to: Place & { eta: string; who: string; phone: string };
  km: number;
  fee: number;
  cargo: CargoLine[];
  checks: TripCheck[];
  seal?: string;
  note?: string;
  lateMin: number;
  rejected?: { reason: string; note?: string };
  confirmBy?: string;
  deviationNote?: string;
}

export interface AttRec {
  in: string | null;
  out: string | null;
  note?: string;
  explain?: 'pending' | 'approved';
  explainText?: string;
}

export type ExpCat = 'fuel' | 'food' | 'toll' | 'parking' | 'repair' | 'other';
export type ExpStatus = 'pending' | 'approved' | 'rejected';
export interface Expense {
  id: string;
  date: string;
  time: string;
  cat: ExpCat;
  title: string;
  place: string;
  amount: number;
  status: ExpStatus;
  receipt: boolean;
  vat?: boolean;
  reason?: string;
  liters?: number;
  odo?: number;
  jobId?: string;
  overNote?: string;
}

export interface Advance { id: string; date: string; amount: number; reason: string; status: 'paid' | 'pending' }

export type LessonType = 'video' | 'read' | 'quiz';
export interface Lesson { t: string; type: LessonType; min: number; done: boolean }
export interface QuizQ { q: string; o: string[]; a: number }
export interface Course {
  id: string;
  title: string;
  required: boolean;
  due?: string;
  color: string;
  icon: string;
  lessons: Lesson[];
  quiz?: QuizQ[];
}

export interface Cert { name: string; no: string; exp: string; icon: string; color: string; renew?: boolean }

export type ReqKind = 'incident' | 'leave' | 'complaint' | 'renew' | 'sos';
export interface Req { id: string; kind: ReqKind; title: string; detail: string; date: string; time: string }

export interface Task { id: string; title: string; due: string; done: boolean }

export interface Settings { theme: 'auto' | 'light' | 'dark'; push: boolean; driving: boolean }

export interface State {
  v: number;
  att: Record<string, AttRec>;
  jobs: Job[];
  expenses: Expense[];
  advances: Advance[];
  courses: Course[];
  vcheck: boolean[];
  learnExtra: number;
  requests: Req[];
  tasks: Task[];
  settings: Settings;
}
