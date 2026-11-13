/** Ngày "hôm nay" của bộ dữ liệu mẫu — khớp với đồng hồ giả lập của app lái xe */
export const TODAY = '2026-11-12';
export const MONTH_START = '2026-11-01';

export const pad = (n: number) => String(n).padStart(2, '0');
export const fmt = (n: number) => Math.round(n).toLocaleString('vi-VN');
export const money = (n: number) => fmt(n) + ' ₫';
export const moneyShort = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1).replace('.', ',')} tr` : fmt(n));
export const hm = (t: string | null | undefined) => (t ? t.slice(0, 5) : '—');
export const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
export const dm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
export const dmy = (iso: string | null | undefined) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '—');
export const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
export const addDays = (iso: string, n: number) => new Date(Date.parse(iso + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
export const WD = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
export const WD_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
export const dow = (iso: string) => new Date(iso + 'T00:00:00').getDay();
export const sum = <T>(a: T[], f: (x: T) => number) => a.reduce((s, x) => s + f(x), 0);
export const pct = (n: number, d = 1) => (n * 100).toFixed(d).replace('.', ',') + '%';
export const dur = (m: number) => {
  m = Math.max(0, Math.round(m));
  if (m < 60) return `${m} phút`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} giờ ${r} phút` : `${h} giờ`;
};
export const initials = (name: string) => {
  const w = name.trim().split(/\s+/);
  return (w[0][0] + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase();
};
export const timeAgo = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
};
export const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
