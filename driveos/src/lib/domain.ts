import type { AttRec, Job, State } from '../types';
import { KPI_TIERS, LOSS_LIMIT, SALARY, SHIFT, VCHECK } from '../data/config';
import { MOCK_TODAY } from './clock';
import { daysBetween, dur, fmt, pct, sum, toMin } from './format';
import type { Tone } from '../ui/kit';

/* ---------------- Chuyến ---------------- */
export const JOB_ST: { t: string; tone: Tone }[] = [
  { t: 'Chờ nhận', tone: 'gray' }, { t: 'Đã nhận', tone: 'blue' }, { t: 'Đang lấy hàng', tone: 'blue' },
  { t: 'Đang chạy', tone: 'orange' }, { t: 'Đang xả hàng', tone: 'purple' }, { t: 'Hoàn tất', tone: 'green' }
];
export const STEPS = ['Nhận lệnh', 'Lấy hàng', 'Vận chuyển', 'Xả hàng', 'Hoàn tất'];
export const jobStatus = (j: Job) => (j.rejected ? { t: 'Đã từ chối', tone: 'red' as Tone } : JOB_ST[j.status]);

export const isBulk = (j: Job) => j.cargo.every(c => c.unit === 'L');
export const liters = (j: Job) => sum(j.cargo.filter(c => c.unit === 'L'), c => c.qty);
export const cargoSum = (j: Job) =>
  isBulk(j) ? `${fmt(liters(j))} L · ${j.cargo.length} khoang` : `${sum(j.cargo, c => c.qty)} thùng/phuy`;
export const productSum = (j: Job) => [...new Set(j.cargo.map(c => c.item))].join(', ');

export function lossOf(j: Job) {
  const lines = j.cargo.filter(c => c.unit === 'L' && c.loaded != null && c.delivered != null);
  if (!lines.length) return null;
  const loaded = sum(lines, c => c.loaded!), delivered = sum(lines, c => c.delivered!);
  const loss = loaded - delivered;
  return { loaded, delivered, loss, rate: loaded ? loss / loaded : 0, over: loaded ? loss / loaded > LOSS_LIMIT : false };
}

export const jobsOfMonth = (s: State) => s.jobs.filter(j => j.date.startsWith('2026-11'));
export const doneJobs = (s: State) => jobsOfMonth(s).filter(j => j.status === 5);

/* ---------------- Chấm công ---------------- */
export type AttClass = { st: 'early' | 'ontime' | 'late'; d: number; left: number };
export function classify(r?: AttRec | null): AttClass | null {
  if (!r || !r.in) return null;
  const d = toMin(r.in) - toMin(SHIFT.start);
  const st = d < -SHIFT.grace ? 'early' : d > SHIFT.grace ? 'late' : 'ontime';
  const left = r.out ? toMin(SHIFT.end) - toMin(r.out) : 0;
  return { st, d, left: left > SHIFT.grace ? left : 0 };
}
export const classLabel = (c: AttClass): { t: string; tone: Tone } =>
  c.st === 'early' ? { t: `Sớm ${-c.d} phút`, tone: 'green' } : c.st === 'late' ? { t: `Muộn ${c.d} phút`, tone: 'red' } : { t: 'Đúng giờ', tone: 'blue' };

export function attStats(s: State) {
  const days = Object.values(s.att).filter(r => r.in);
  const cs = days.map(r => classify(r)!);
  return {
    worked: days.length,
    early: cs.filter(c => c.st === 'early').length,
    ontime: cs.filter(c => c.st === 'ontime').length,
    late: cs.filter(c => c.st === 'late').length,
    lateMin: sum(cs.filter(c => c.st === 'late'), c => c.d),
    left: cs.filter(c => c.left).length
  };
}

/* ---------------- KPI ---------------- */
export interface KpiItem { k: string; label: string; w: number; score: number; hint: string; how: string }
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function kpiItems(s: State): KpiItem[] {
  const a = attStats(s);
  const done = doneJobs(s);
  const late = done.filter(j => j.lateMin > 0).length;
  const losses = done.map(lossOf).filter(Boolean) as NonNullable<ReturnType<typeof lossOf>>[];
  const avg = losses.length ? sum(losses, l => l.rate) / losses.length : 0;
  const over = losses.filter(l => l.over).length;
  const checks = done.flatMap(j => j.checks);
  const checkRate = checks.length ? checks.filter(c => c.done).length / checks.length : 1;
  return [
    { k: 'punctual', label: 'Chuyên cần', w: 20, score: clamp(100 - a.late * 6 - a.left * 4),
      hint: `${a.late} lần đi muộn (${a.lateMin} phút) · ${a.left} lần về sớm · ${a.early} lần đến sớm`,
      how: 'Bắt đầu từ 100 điểm.\nMỗi lần đi muộn quá 5 phút: −6 điểm.\nMỗi lần về sớm quá 5 phút: −4 điểm.\nĐến sớm không bị trừ điểm.' },
    { k: 'delivery', label: 'Giao hàng đúng hẹn', w: 20, score: clamp(done.length ? (done.length - late) / done.length * 100 : 100),
      hint: `${done.length - late}/${done.length} chuyến giao đúng khung giờ hẹn`,
      how: 'Tỷ lệ chuyến giao trong khung giờ hẹn với khách.\nThời gian chờ đã được điều phối duyệt không tính là trễ.' },
    { k: 'loss', label: 'Hao hụt hàng hóa', w: 20, score: clamp(100 - (avg / LOSS_LIMIT) * 40 - over * 6),
      hint: `Trung bình ${pct(avg, 2)} · ${over} chuyến vượt ngưỡng ${pct(LOSS_LIMIT)}`,
      how: `Hao hụt = (lượng nạp − lượng xả) / lượng nạp.\nĐiểm = 100 − 40 × (hao hụt TB / ${pct(LOSS_LIMIT)}) − 6 × số chuyến vượt ngưỡng.` },
    { k: 'safety', label: 'An toàn lái xe', w: 15, score: 95, hint: '0 sự cố · 1 cảnh báo quá tốc độ từ GPS',
      how: 'Bắt đầu từ 100 điểm.\nMỗi cảnh báo quá tốc độ: −5 điểm.\nMỗi sự cố có lỗi: −30 điểm.' },
    { k: 'fuel', label: 'Tiêu hao nhiên liệu', w: 15, score: 78, hint: '31,8 L/100 km (định mức 30 L/100 km)',
      how: 'So sánh lít dầu đổ với số km thực chạy từ GPS.\nVượt định mức 1% trừ 3,7 điểm.' },
    { k: 'process', label: 'Tuân thủ quy trình', w: 10, score: clamp(checkRate * 100 - 2),
      hint: `Checklist chuyến ${Math.round(checkRate * 100)}% · thiếu 1 bản gốc phiếu giao`,
      how: 'Tỷ lệ hoàn thành checklist tại kho và điểm giao, cộng nộp đủ chứng từ đúng hạn.' }
  ];
}
export const kpiScore = (s: State) => Math.round(sum(kpiItems(s), k => k.w * k.score) / 100);
export const tierOf = (score: number) => KPI_TIERS.find(t => score >= t.min)!;
export const scoreColor = (n: number) => (n >= 90 ? 'var(--green)' : n >= 80 ? 'var(--blue)' : n >= 70 ? 'var(--orange)' : 'var(--red)');

/* ---------------- Lương ---------------- */
export function pay(s: State) {
  const done = doneJobs(s);
  const trips = sum(done, j => j.fee);
  const tier = tierOf(kpiScore(s));
  const reimb = sum(s.expenses.filter(e => e.status === 'approved'), e => e.amount);
  const adv = sum(s.advances.filter(a => a.status === 'paid'), a => a.amount);
  const ins = SALARY.base * SALARY.insuranceRate;
  const income = SALARY.base + SALARY.hazard + trips + tier.amt;
  return { trips, tripCount: done.length, tier, reimb, adv, ins, income, net: income + reimb - ins - adv };
}

/**
 * Dự kiến thu nhập cuối tháng = phần đã chắc (chuyến hoàn tất) + chuyến đã xếp lịch trong tháng
 * + ước tính cho các ngày làm việc còn lại chưa có lịch (theo phụ cấp trung bình mỗi ngày đã chạy).
 */
export function payForecast(s: State) {
  const p = pay(s);
  const month = MOCK_TODAY.slice(0, 7);
  const [y, m] = month.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const done = doneJobs(s);
  const workedDays = new Set(done.map(j => j.date)).size;
  const perDayFee = workedDays ? p.trips / workedDays : 0;
  const perDayTrips = workedDays ? done.length / workedDays : 0;

  const open = s.jobs.filter(j => j.date.startsWith(month) && j.date >= MOCK_TODAY && j.status < 5 && !j.rejected);
  const planned = sum(open, j => j.fee);
  const plannedDates = new Set(open.filter(j => j.date > MOCK_TODAY).map(j => j.date));
  let estDays = 0;
  for (let d = Number(MOCK_TODAY.slice(8)) + 1; d <= lastDay; d++) {
    const iso = `${month}-${String(d).padStart(2, '0')}`;
    if (new Date(y, m - 1, d).getDay() !== 0 && !plannedDates.has(iso)) estDays++;
  }
  const estimated = Math.round((estDays * perDayFee) / 10000) * 10000;
  const estTrips = Math.round(estDays * perDayTrips);
  const trips = p.trips + planned + estimated;
  const income = SALARY.base + SALARY.hazard + trips + p.tier.amt;
  const score = kpiScore(s);
  const idx = KPI_TIERS.indexOf(p.tier);
  return {
    ...p, earned: p.net, earnedTrips: p.trips, doneCount: done.length,
    planned, plannedCount: open.length, estimated, estTrips, estDays,
    trips, tripCount: done.length + open.length + estTrips, income,
    net: income + p.reimb - p.ins - p.adv, score, next: idx > 0 ? KPI_TIERS[idx - 1] : null
  };
}

/* ---------------- Học tập & giấy tờ ---------------- */
export const certDays = (exp: string) => daysBetween(MOCK_TODAY, exp);
export const certTone = (d: number): Tone => (d < 0 ? 'red' : d <= 30 ? 'red' : d <= 60 ? 'orange' : 'green');
export const certLabel = (d: number) => (d < 0 ? 'Hết hạn' : d <= 60 ? `Còn ${d} ngày` : 'Còn hạn');
export const courseDone = (c: State['courses'][number]) => c.lessons.filter(l => l.done).length;

/* ---------------- Kiểm tra xe ---------------- */
export const vcDone = (s: State) => s.vcheck.filter(Boolean).length;
export const vcCriticalLeft = (s: State) => VCHECK.filter((v, i) => v.critical && !s.vcheck[i]).length;

export const workedLabel = (inT: string, outMin: number) => dur(outMin - toMin(inT));
