import { useEffect, useState } from 'react';
import { pad } from './format';

/**
 * Đồng hồ giả lập cho bản demo: ngày 12/11/2026, bắt đầu 09:12 và chạy theo thời gian thực,
 * để dữ liệu mock (đã vào ca, đang chở hàng, hẹn giao 10:30) luôn khớp với nhau.
 */
export const MOCK_TODAY = '2026-11-12';
const NOW0 = 9 * 3600 + 12 * 60 + 20;
const T0 = Date.now();

export const nowSec = () => (NOW0 + Math.floor((Date.now() - T0) / 1000)) % 86400;
export const nowMin = () => Math.floor(nowSec() / 60);
export const nowHM = () => `${pad(Math.floor(nowMin() / 60))}:${pad(nowMin() % 60)}`;
export const statusTime = () => `${Math.floor(nowMin() / 60)}:${pad(nowMin() % 60)}`;

/** Re-render định kỳ để cập nhật đồng hồ. */
export function useNow(ms = 1000) {
  const [, set] = useState(0);
  useEffect(() => {
    const t = setInterval(() => set(x => x + 1), ms);
    return () => clearInterval(t);
  }, [ms]);
  return nowSec();
}
