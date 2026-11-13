/* Cấu hình nghiệp vụ dùng trong app (ngưỡng, định mức, danh mục cố định). Dữ liệu người dùng nằm ở Supabase. */
import type { ExpCat } from '../types';

export const SHIFT = { start: '06:00', end: '15:00', grace: 5 };
/** Ngưỡng hao hụt nạp–xả cho phép */
export const LOSS_LIMIT = 0.003;
/** Ngưỡng chênh lệch giữa lượng thực nạp và lệnh xuất */
export const LOAD_DEV_LIMIT = 0.005;
export const FOOD_LIMIT = 150000;
export const NO_RECEIPT_LIMIT = 200000;
export const FUEL_PRICE = 21300;

export const KPI_TIERS = [
  { min: 90, amt: 2000000, name: 'Xuất sắc' },
  { min: 80, amt: 1200000, name: 'Tốt' },
  { min: 70, amt: 600000, name: 'Khá' },
  { min: 0, amt: 0, name: 'Cần cải thiện' }
];
export const KPI_TREND = [{ m: 'T8', v: 84 }, { m: 'T9', v: 79 }, { m: 'T10', v: 89 }];

export const CATS: Record<ExpCat, { label: string; color: string }> = {
  fuel: { label: 'Nhiên liệu', color: 'var(--orange)' },
  food: { label: 'Ăn uống', color: 'var(--pink)' },
  toll: { label: 'Cầu đường', color: 'var(--blue)' },
  parking: { label: 'Bến bãi', color: 'var(--indigo)' },
  repair: { label: 'Sửa chữa', color: 'var(--purple)' },
  other: { label: 'Khác', color: 'var(--gray)' }
};

export const SALARY = { base: 8500000, hazard: 500000, insuranceRate: 0.105, payday: '2026-12-05' };
export const LEARN_GOAL_MIN = 480;

/** Checklist trước chuyến — `critical` chưa đạt sẽ khóa bắt đầu chuyến */
export const VCHECK = [
  { t: 'Lốp xe & áp suất', critical: true },
  { t: 'Phanh & hệ thống đèn', critical: true },
  { t: 'Rò rỉ dầu / nhớt dưới gầm', critical: true },
  { t: 'Van đáy & nắp các khoang bồn', critical: true },
  { t: 'Dây tiếp địa chống tĩnh điện', critical: true },
  { t: '2 bình chữa cháy còn hạn', critical: true },
  { t: 'Biển báo hàng nguy hiểm & đèn xoay', critical: false },
  { t: 'Bảo hộ: găng tay, kính, giày chống tĩnh điện', critical: false },
  { t: 'Sức khỏe: tỉnh táo, không dùng rượu bia', critical: true }
];

export const EMERGENCY_CARDS = [
  { t: 'Rò rỉ xăng dầu', steps: '1. Dừng xe nơi thoáng, xa khu dân cư.\n2. Tắt máy, ngắt cầu dao điện.\n3. Cấm lửa trong bán kính 50 m.\n4. Đóng van đáy, chặn dòng chảy bằng cát.\n5. Báo điều độ và gọi 114.' },
  { t: 'Cháy xe bồn', steps: '1. Tắt máy, đưa mọi người ra xa ít nhất 100 m.\n2. Gọi 114 ngay.\n3. Chỉ dập đám cháy nhỏ bằng bình bột/CO2.\n4. Không phun nước thẳng vào xăng dầu.' },
  { t: 'Tai nạn giao thông', steps: '1. Bật đèn khẩn cấp, đặt biển cảnh báo.\n2. Kiểm tra rò rỉ hàng.\n3. Sơ cứu người bị nạn, gọi 115.\n4. Giữ nguyên hiện trường, báo 113 và điều độ.' }
];
