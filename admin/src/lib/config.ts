/* Quy tắc nghiệp vụ — giữ khớp với driveos/src/data/config.ts của app lái xe */
import type { ExpCat, ReqKind, ReqStatus, Role } from '../types';
import type { Tone } from '../ui/kit';

export const SHIFT = { start: '06:00', end: '15:00', grace: 5 };
export const LOSS_LIMIT = 0.003;
export const NO_RECEIPT_LIMIT = 200000;
export const FOOD_LIMIT = 150000;
export const feeFor = (km: number) => Math.round((150000 + km * 5000) / 10000) * 10000;

export const ROLES: Record<Role, { label: string; desc: string }> = {
  admin: { label: 'Quản trị', desc: 'Toàn quyền, phân quyền nhân viên' },
  dispatcher: { label: 'Điều phối', desc: 'Tạo lệnh chuyến, phân công, xử lý phát sinh' },
  accountant: { label: 'Kế toán', desc: 'Duyệt chi phí, tạm ứng' },
  hr: { label: 'Nhân sự', desc: 'Hồ sơ lái xe, giấy tờ, chấm công, đào tạo' }
};

export const JOB_ST: { t: string; tone: Tone }[] = [
  { t: 'Chờ nhận', tone: 'gray' }, { t: 'Đã nhận', tone: 'blue' }, { t: 'Đang lấy hàng', tone: 'blue' },
  { t: 'Đang chạy', tone: 'orange' }, { t: 'Đang xả hàng', tone: 'purple' }, { t: 'Hoàn tất', tone: 'green' }
];

export const CATS: Record<ExpCat, { label: string; color: string }> = {
  fuel: { label: 'Nhiên liệu', color: 'var(--orange)' }, food: { label: 'Ăn uống', color: 'var(--pink)' },
  toll: { label: 'Cầu đường', color: 'var(--blue)' }, parking: { label: 'Bến bãi', color: 'var(--indigo)' },
  repair: { label: 'Sửa chữa', color: 'var(--purple)' }, other: { label: 'Khác', color: 'var(--gray)' }
};

export const REQ_KIND: Record<ReqKind, { label: string; color: string }> = {
  sos: { label: 'SOS', color: 'var(--red)' }, incident: { label: 'Sự cố', color: 'var(--orange)' },
  leave: { label: 'Nghỉ phép', color: 'var(--purple)' }, complaint: { label: 'Khiếu nại KPI', color: 'var(--indigo)' },
  renew: { label: 'Gia hạn giấy tờ', color: 'var(--teal)' }
};
export const REQ_ST: Record<ReqStatus, { t: string; tone: Tone }> = {
  new: { t: 'Mới', tone: 'orange' }, processing: { t: 'Đang xử lý', tone: 'blue' },
  done: { t: 'Đã xong', tone: 'green' }, rejected: { t: 'Từ chối', tone: 'red' }
};

export const DEPOTS = [
  { name: 'Kho xăng dầu Nhà Bè', addr: 'Đường Huỳnh Tấn Phát, Nhà Bè, TP.HCM' },
  { name: 'Kho Hiệp Phước', addr: 'Đường Nguyễn Văn Tạo, Nhà Bè, TP.HCM' },
  { name: 'Kho Cát Lái', addr: 'Đường Nguyễn Thị Định, TP. Thủ Đức' }
];
export const PRODUCTS = ['Dầu DO 0,05S-II', 'Xăng RON95-III', 'Xăng E5 RON92', 'Dầu FO', 'Dầu hỏa'];
export const DRUM_PRESETS = [
  { label: 'Phuy 200 L', item: 'Dầu thủy lực AW68' },
  { label: 'Phuy 200 L', item: 'Dầu động cơ 15W-40' },
  { label: 'Thùng 18 L', item: 'Dầu hộp số 80W-90' }
];
export const CHECKS = {
  bulk: [
    ['Kiểm tra niêm phong chì kho, ghi số chì', 'pickup'], ['Đối chiếu loại & lượng hàng với phiếu xuất', 'pickup'],
    ['Đo nhiệt độ, tỷ trọng và ghi vào phiếu', 'pickup'], ['Đối chiếu số chì khi tới nơi', 'deliver'],
    ['Nối dây tiếp địa, kiểm tra van & ống xả', 'deliver'], ['Người nhận ký xác nhận biên bản', 'deliver', true]
  ],
  drum: [
    ['Đếm số thùng/phuy, kiểm tra nắp & nhãn', 'pickup'], ['Chằng buộc hàng, kiểm tra rò rỉ', 'pickup'],
    ['Đối chiếu phiếu xuất kho', 'pickup'], ['Đếm lại số thùng khi giao', 'deliver'],
    ['Chụp ảnh hàng đã giao', 'deliver'], ['Người nhận ký xác nhận biên bản', 'deliver', true]
  ]
} as const;

export const CERT_PRESETS = [
  { name: 'Giấy phép lái xe hạng FC', icon: 'id', color: 'var(--blue)' },
  { name: 'Chứng chỉ vận chuyển hàng nguy hiểm', icon: 'shield', color: 'var(--red)', renewable: true },
  { name: 'Huấn luyện PCCC & cứu nạn', icon: 'flame', color: 'var(--orange)' },
  { name: 'Giấy khám sức khỏe lái xe', icon: 'heart', color: 'var(--pink)' },
  { name: 'Thẻ an toàn kho', icon: 'lock', color: 'var(--teal)' }
];
export const COURSE_COLORS = ['var(--red)', 'var(--orange)', 'var(--green)', 'var(--blue)', 'var(--indigo)', 'var(--purple)', 'var(--teal)', 'var(--pink)'];
export const COURSE_ICONS: [string, string][] = [['shield', 'An toàn'], ['flame', 'PCCC'], ['droplet', 'Xăng dầu'], ['truck', 'Lái xe'], ['fuel', 'Nhiên liệu'], ['book', 'Chung']];
