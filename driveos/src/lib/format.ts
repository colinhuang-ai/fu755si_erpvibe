export const pad = (n: number) => String(n).padStart(2, '0');
export const fmt = (n: number) => Math.round(n).toLocaleString('vi-VN');
export const money = (n: number) => fmt(n) + ' ₫';
export const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
export const dm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
export const dmy = (iso: string) => `${dm(iso)}/${iso.slice(0, 4)}`;
export const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
export const WD = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
export const dow = (iso: string) => new Date(iso + 'T00:00:00').getDay();
export const sum = <T>(a: T[], f: (x: T) => number) => a.reduce((s, x) => s + f(x), 0);
export const trieu = (n: number) => (n / 1e6).toFixed(1).replace('.', ',');
export const pct = (n: number, d = 1) => (n * 100).toFixed(d).replace('.', ',') + '%';
export const dec = (n: number, d = 1) => n.toFixed(d).replace('.', ',');

/** "3 giờ 18 phút" */
export const dur = (m: number) => {
  m = Math.max(0, Math.round(m));
  if (m < 60) return `${m} phút`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} giờ ${r} phút` : `${h} giờ`;
};
/** UUID v4 — dùng getRandomValues để chạy được cả khi truy cập qua http trong mạng LAN */
export const uid = (_prefix?: string) => {
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};
