import type { Attendance, Cargo, Job } from '../types';
import type { Tone } from '../ui/kit';
import { LOSS_LIMIT, SHIFT } from './config';
import { daysBetween, fmt, sum, TODAY, toMin } from './format';

export const isBulk = (cargo: Cargo[] = []) => cargo.every(c => c.unit === 'L');
export const liters = (cargo: Cargo[] = []) => sum(cargo.filter(c => c.unit === 'L'), c => c.qty);
export const cargoText = (cargo: Cargo[] = []) =>
  !cargo.length ? '—' : isBulk(cargo) ? `${fmt(liters(cargo))} L · ${cargo.length} khoang` : `${sum(cargo, c => c.qty)} thùng/phuy`;

export function lossOf(cargo: Cargo[] = []) {
  const lines = cargo.filter(c => c.unit === 'L' && c.loaded != null && c.delivered != null);
  if (!lines.length) return null;
  const loaded = sum(lines, c => c.loaded!), delivered = sum(lines, c => c.delivered!);
  const loss = loaded - delivered, rate = loaded ? loss / loaded : 0;
  return { loaded, delivered, loss, rate, over: rate > LOSS_LIMIT };
}

/** Chuyến đang chạy có trễ hẹn so với giờ hiện tại giả lập (09:12) không */
export function etaState(j: Job, nowMin = 9 * 60 + 12): { t: string; tone: Tone } | null {
  if (j.job_date !== TODAY || j.status < 1 || j.status > 4 || !j.to_eta) return null;
  const left = toMin(j.to_eta) - nowMin;
  return left >= 0 ? { t: `còn ${Math.floor(left / 60)}g${String(left % 60).padStart(2, '0')}`, tone: 'blue' } : { t: `trễ ${-left}′`, tone: 'red' };
}

export type AttClass = 'early' | 'ontime' | 'late';
export function classify(a?: Attendance | null) {
  if (!a?.check_in) return null;
  const d = toMin(a.check_in) - toMin(SHIFT.start);
  const st: AttClass = d < -SHIFT.grace ? 'early' : d > SHIFT.grace ? 'late' : 'ontime';
  const leftMin = a.check_out ? toMin(SHIFT.end) - toMin(a.check_out) : 0;
  return { st, d, left: leftMin > SHIFT.grace ? leftMin : 0 };
}
export const ATT_COLOR: Record<AttClass, string> = { early: 'var(--green)', ontime: 'var(--blue)', late: 'var(--red)' };
export const attLabel = (c: NonNullable<ReturnType<typeof classify>>) =>
  c.st === 'early' ? `Sớm ${-c.d}′` : c.st === 'late' ? `Muộn ${c.d}′` : 'Đúng giờ';

export function certState(exp: string): { days: number; tone: Tone; label: string } {
  const days = daysBetween(TODAY, exp);
  if (days < 0) return { days, tone: 'red', label: `Hết hạn ${-days} ngày` };
  if (days <= 30) return { days, tone: 'red', label: `Còn ${days} ngày` };
  if (days <= 60) return { days, tone: 'orange', label: `Còn ${days} ngày` };
  return { days, tone: 'green', label: 'Còn hạn' };
}
