/* DriverOS – bộ dữ liệu mẫu. Chỉ dùng để sinh supabase/seed.sql (scripts/gen-seed.ts); app đọc dữ liệu thật từ Supabase. */
import type { AttRec, Advance, CargoLine, Cert, Course, Expense, Job, Lesson, Task, TripCheck } from '../types';

export const DRIVER = {
  name: 'Nguyễn Văn Hùng', short: 'Hùng', initials: 'NH', id: 'TX-0127',
  phone: '0903 456 789', team: 'Đội 3 – Kho Nhà Bè', since: '03/2019', dob: '14/08/1988',
  rating: 4.8, trips: 312, km: 48230, incidents: 0, leaveLeft: 7,
  company: 'Nam Việt Petro Logistics',
  dispatcher: { name: 'Lê Thu Hà', phone: '0908111222' },
  hse: { name: 'Phòng An toàn HSE', phone: '0908333444' },
  vehicle: {
    plate: '51D-345.67', model: 'Hino FM8JNSA · bồn inox 18.000 L',
    compartments: [4000, 4000, 4000, 3000, 3000],
    registry: '2027-02-18', tankInspect: '2027-05-30', odo: 248230, nextService: 250000
  }
};

/* ---------- Chấm công tháng 11/2026 ---------- */
const ATT: Record<string, AttRec> = {
  2: { in: '05:52', out: '15:05' },
  3: { in: '06:12', out: '15:10', note: 'Kẹt xe cầu Phú Mỹ', explain: 'approved', explainText: 'Kẹt xe do tai nạn trên cầu Phú Mỹ' },
  4: { in: '05:57', out: '15:02' },
  5: { in: '05:41', out: '15:30', note: 'Đến sớm nhận chuyến gấp' },
  6: { in: '05:58', out: '15:00' },
  7: { in: '06:25', out: '14:20', note: 'Hỏng lốp, về sớm đã xin phép điều độ' },
  9: { in: '05:55', out: '15:03' },
  10: { in: '05:44', out: '15:12' },
  11: { in: '05:59', out: '15:20' },
  12: { in: '05:54', out: null }
};

/* ---------- Công việc ---------- */
const K = (item: string, arr: number[], start = 1): CargoLine[] =>
  arr.map((q, i) => ({ label: `Khoang ${start + i}`, item, qty: q, unit: 'L' as const }));

const CK = (p: boolean, d: boolean): TripCheck[] => [
  { t: 'Kiểm tra niêm phong chì kho, ghi số chì', ph: 'pickup', done: p },
  { t: 'Đối chiếu loại & lượng hàng với phiếu xuất', ph: 'pickup', done: p },
  { t: 'Đo nhiệt độ, tỷ trọng và ghi vào phiếu', ph: 'pickup', done: p },
  { t: 'Đối chiếu số chì khi tới nơi', ph: 'deliver', done: d },
  { t: 'Nối dây tiếp địa, kiểm tra van & ống xả', ph: 'deliver', done: d },
  { t: 'Người nhận ký xác nhận biên bản', ph: 'deliver', done: d, sign: true }
];
const CK_DRUM = (p: boolean, d: boolean): TripCheck[] => [
  { t: 'Đếm số thùng/phuy, kiểm tra nắp & nhãn', ph: 'pickup', done: p },
  { t: 'Chằng buộc hàng, kiểm tra rò rỉ', ph: 'pickup', done: p },
  { t: 'Đối chiếu phiếu xuất kho', ph: 'pickup', done: p },
  { t: 'Đếm lại số thùng khi giao', ph: 'deliver', done: d },
  { t: 'Chụp ảnh hàng đã giao', ph: 'deliver', done: d },
  { t: 'Người nhận ký xác nhận biên bản', ph: 'deliver', done: d, sign: true }
];

const NHABE = { name: 'Kho xăng dầu Nhà Bè', addr: 'Đường Huỳnh Tấn Phát, Nhà Bè, TP.HCM' };
const HIEPPHUOC = { name: 'Kho Hiệp Phước', addr: 'Đường Nguyễn Văn Tạo, Nhà Bè, TP.HCM' };

const DEST: Record<string, { name: string; addr: string; km: number; who: string; phone: string }> = {
  q9: { name: 'CHXD Số 31 – Quận 9', addr: '120 Lê Văn Việt, TP. Thủ Đức', km: 22, who: 'Anh Tuấn', phone: '0912000031' },
  q7: { name: 'CHXD Số 05 – Quận 7', addr: '88 Nguyễn Thị Thập, Q.7, TP.HCM', km: 14, who: 'Chị Lan', phone: '0912000005' },
  bh: { name: 'CHXD Số 22 – Biên Hòa', addr: '1020 QL1K, Bình Đa, Biên Hòa, Đồng Nai', km: 41, who: 'Anh Phúc', phone: '0912000022' },
  lt: { name: 'Trạm cấp dầu KCN Long Thành', addr: 'Đường số 5, KCN Long Thành, Đồng Nai', km: 52, who: 'Anh Nghĩa', phone: '0912000052' },
  td: { name: 'CHXD Số 18 – Thủ Đức', addr: '256 Xa lộ Hà Nội, TP. Thủ Đức', km: 32, who: 'Anh Bảo', phone: '0912333444' },
  nb: { name: 'CHXD Số 40 – Nhà Bè', addr: '45 Lê Văn Lương, Nhà Bè, TP.HCM', km: 9, who: 'Chị Hoa', phone: '0912000040' },
  bc: { name: 'CHXD Số 11 – Bình Chánh', addr: '12 QL1A, Bình Chánh, TP.HCM', km: 25, who: 'Anh Dũng', phone: '0912000011' },
  la: { name: 'Kho trung chuyển Long An', addr: 'KCN Hải Sơn, Đức Hòa, Long An', km: 48, who: 'Anh Khoa', phone: '0912000048' }
};

const fee = (km: number) => Math.round((150000 + km * 5000) / 10000) * 10000;
const addMin = (t: string, m: number) => {
  const x = Number(t.slice(0, 2)) * 60 + Number(t.slice(3)) + m;
  return `${String(Math.floor(x / 60) % 24).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`;
};

/** Điền lượng thực nạp/xả có hao hụt nhỏ, ổn định theo seed */
function filled(cargo: CargoLine[], seed: number, stage: 'loaded' | 'delivered', boost = 0): CargoLine[] {
  return cargo.map((c, i) => {
    if (c.unit !== 'L') return { ...c, loaded: c.qty, delivered: stage === 'delivered' ? c.qty : undefined };
    const loaded = c.qty + (((seed * 7 + i * 3) % 7) - 3);
    const delivered = loaded - ((seed + i * 5) % 6) - Math.round(c.qty * boost);
    return { ...c, loaded, delivered: stage === 'delivered' ? delivered : undefined };
  });
}

type JobInput = Partial<Job> & { id: string; date: string; dest: string; pick?: string };
function mkJob(o: JobInput): Job {
  const d = DEST[o.dest];
  const pick = o.pick ?? '06:30';
  const { dest, pick: _p, ...rest } = o;
  void dest; void _p;
  return {
    status: 5, vehicle: DRIVER.vehicle.plate, type: 'bulk', lateMin: 0,
    from: { ...NHABE, time: pick },
    to: { name: d.name, addr: d.addr, eta: addMin(pick, 55 + Math.round(d.km * 1.6)), who: d.who, phone: d.phone },
    km: d.km, fee: fee(d.km),
    cargo: K('Dầu DO 0,05S-II', [4000, 4000, 4000, 3000, 3000]),
    checks: CK(true, true),
    confirmBy: 'Mã OTP',
    ...rest
  };
}

const JOBS: Job[] = [
  mkJob({
    id: 'CH-2611-0188', date: '2026-11-12', dest: 'q7', pick: '06:10', seal: 'CT-448201 → 448203',
    cargo: filled([...K('Xăng RON95-III', [4000, 4000]), ...K('Xăng E5 RON92', [4000], 3)], 3, 'delivered')
  }),
  mkJob({
    id: 'CH-2611-0189', date: '2026-11-12', dest: 'td', pick: '07:30', status: 3, confirmBy: undefined,
    cargo: filled([...K('Dầu DO 0,05S-II', [4000, 4000, 4000]), ...K('Xăng RON95-III', [3000], 4), ...K('Xăng E5 RON92', [3000], 5)], 5, 'loaded'),
    seal: 'CT-448204 → 448208',
    note: 'Xả tại bể ngầm số 2 và 3. Đo tồn bể trước khi xả. Cửa hàng chỉ nhận hàng từ 09:00.',
    to: { ...DEST.td, eta: '10:30' },
    checks: CK(true, false)
  }),
  mkJob({
    id: 'CH-2611-0190', date: '2026-11-12', dest: 'lt', pick: '11:30', status: 0, confirmBy: undefined,
    cargo: K('Dầu DO 0,05S-II', [4000, 4000, 4000, 4000]),
    note: 'Khách yêu cầu có mặt trước 14:00. Mang theo giấy phép ra vào KCN.',
    to: { ...DEST.lt, eta: '14:00' },
    checks: CK(false, false)
  }),
  mkJob({
    id: 'CH-2611-0191', date: '2026-11-13', dest: 'bh', pick: '07:00', status: 0, type: 'drum', confirmBy: undefined,
    vehicle: '51C-218.45 · xe tải thùng 8T',
    from: { ...HIEPPHUOC, time: '07:00' },
    to: { name: 'Công ty Cơ khí Tân Phát', addr: 'Đường 3A, KCN Biên Hòa 2, Đồng Nai', eta: '08:30', who: 'Anh Thành', phone: '0912777888' },
    km: 38, fee: 340000,
    cargo: [
      { label: 'Phuy 200 L', item: 'Dầu thủy lực AW68', qty: 40, unit: 'thùng' },
      { label: 'Phuy 200 L', item: 'Dầu động cơ 15W-40', qty: 20, unit: 'thùng' },
      { label: 'Thùng 18 L', item: 'Dầu hộp số 80W-90', qty: 120, unit: 'thùng' }
    ],
    note: 'Chuyến dầu nhớt đóng thùng – dùng xe tải thùng, bốc xếp bằng xe nâng tại kho.',
    checks: CK_DRUM(false, false)
  }),
  mkJob({
    id: 'CH-2611-0192', date: '2026-11-14', dest: 'bh', pick: '06:30', status: 0, confirmBy: undefined,
    checks: CK(false, false)
  })
];

/* lịch sử trong tháng */
([
  ['2026-11-11', 'CH-2611-0184', 'lt', '06:20', 25, 0],
  ['2026-11-10', 'CH-2611-0181', 'q9', '06:15', 0, 0],
  ['2026-11-10', 'CH-2611-0182', 'q7', '10:00', 0, 0],
  ['2026-11-09', 'CH-2611-0178', 'bh', '06:25', 0, 0],
  ['2026-11-07', 'CH-2611-0173', 'td', '06:40', 0, 0],
  ['2026-11-06', 'CH-2611-0170', 'bc', '06:10', 0, 0.0035],
  ['2026-11-06', 'CH-2611-0171', 'nb', '09:50', 0, 0],
  ['2026-11-05', 'CH-2611-0166', 'la', '05:55', 0, 0],
  ['2026-11-04', 'CH-2611-0162', 'q9', '06:20', 0, 0],
  ['2026-11-03', 'CH-2611-0158', 'td', '06:35', 0, 0],
  ['2026-11-02', 'CH-2611-0153', 'bc', '06:10', 0, 0]
] as const).forEach(([date, id, dest, pick, late, boost], i) => {
  const product = dest === 'lt' || dest === 'bh' || dest === 'la' ? 'Dầu DO 0,05S-II' : 'Xăng RON95-III';
  const base = K(product, [4000, 4000, 4000, 3000, 3000].slice(0, dest === 'nb' ? 3 : 5));
  JOBS.push(mkJob({
    id, date, dest, pick, lateMin: late,
    cargo: filled(base, i + 11, 'delivered', boost),
    deviationNote: boost ? 'Hao hụt vượt ngưỡng do nhiệt độ cao, đã giải trình với điều độ' : undefined
  }));
});

/* ---------- Tài chính ---------- */
const EXPENSES: Expense[] = [
  { id: 'e1', date: '2026-11-12', time: '07:40', cat: 'food', title: 'Ăn sáng – Bún bò Huế', place: 'Quán Cô Lan, Nhà Bè', amount: 45000, status: 'pending', receipt: true, jobId: 'CH-2611-0189' },
  { id: 'e2', date: '2026-11-11', time: '16:05', cat: 'fuel', title: 'Đổ dầu DO – 65 L', place: 'CHXD Petrolimex Số 12', amount: 1384500, status: 'approved', receipt: true, vat: true, liters: 65, odo: 248060 },
  { id: 'e3', date: '2026-11-11', time: '10:30', cat: 'toll', title: 'Phí cao tốc TP.HCM – Long Thành', place: 'Trạm Long Thành', amount: 77000, status: 'approved', receipt: true, jobId: 'CH-2611-0184' },
  { id: 'e4', date: '2026-11-10', time: '11:45', cat: 'food', title: 'Cơm trưa', place: 'Cơm tấm Ba Ghiền', amount: 60000, status: 'approved', receipt: true },
  { id: 'e5', date: '2026-11-10', time: '15:10', cat: 'repair', title: 'Rửa bồn & vệ sinh xe', place: 'Gara Minh Phát', amount: 150000, status: 'pending', receipt: true, vat: true },
  { id: 'e6', date: '2026-11-09', time: '13:20', cat: 'parking', title: 'Phí đỗ xe qua đêm', place: 'Bãi xe KCN Long Thành', amount: 80000, status: 'approved', receipt: true },
  { id: 'e7', date: '2026-11-07', time: '06:50', cat: 'fuel', title: 'Đổ dầu DO – 70 L', place: 'CHXD Petrolimex Số 12', amount: 1491000, status: 'approved', receipt: true, vat: true, liters: 70, odo: 247610 },
  { id: 'e8', date: '2026-11-07', time: '13:00', cat: 'repair', title: 'Vá lốp xe đầu kéo', place: 'Tiệm lốp Hai Sơn', amount: 120000, status: 'approved', receipt: true },
  { id: 'e9', date: '2026-11-06', time: '18:30', cat: 'food', title: 'Ăn tối', place: 'Quán cơm Tư Béo', amount: 75000, status: 'rejected', receipt: false, reason: 'Thiếu hóa đơn, ngoài giờ ca' },
  { id: 'e10', date: '2026-11-05', time: '09:15', cat: 'toll', title: 'Phí BOT Quốc lộ 51', place: 'Trạm Biên Hòa', amount: 70000, status: 'approved', receipt: true },
  { id: 'e11', date: '2026-11-04', time: '12:10', cat: 'food', title: 'Cơm trưa', place: 'Cơm gà Hải Nam', amount: 55000, status: 'approved', receipt: true }
];
const ADVANCES: Advance[] = [
  { id: 'a1', date: '2026-11-03', amount: 2000000, reason: 'Tạm ứng công tác phí đợt 1', status: 'paid' }
];

/* ---------- Học tập ---------- */
const L = (t: string, type: Lesson['type'], min: number, done = false): Lesson => ({ t, type, min, done });
const COURSES: Course[] = [
  {
    id: 'c1', title: 'Vận chuyển hàng nguy hiểm (ADR) – bồi dưỡng định kỳ', required: true, due: '2026-11-30', color: 'var(--red)', icon: 'shield',
    lessons: [
      L('Phân loại hàng nguy hiểm – Nhóm 3 (chất lỏng dễ cháy)', 'video', 12, true),
      L('Biển báo & báo hiệu trên xe bồn', 'read', 8, true),
      L('Giấy tờ bắt buộc khi vận chuyển', 'read', 10, true),
      L('Tĩnh điện & tiếp địa khi xả hàng', 'video', 15, true),
      L('Xử lý sự cố rò rỉ trên đường', 'video', 14, true),
      L('Tuyến đường & thời gian cấm tải', 'read', 9, true),
      L('Tình huống thực tế: tràn dầu tại trạm xăng', 'video', 18),
      L('Bài kiểm tra cuối khóa', 'quiz', 10)
    ],
    quiz: [
      { q: 'Khi xả xăng dầu tại cửa hàng, việc đầu tiên phải làm là gì?', o: ['Mở van xả ngay để kịp giờ', 'Dừng xe đúng vị trí, tắt máy, nối dây tiếp địa', 'Hút thuốc chờ hàng lắng', 'Mở nắp tất cả khoang cùng lúc'], a: 1 },
      { q: 'Xăng dầu thuộc nhóm hàng nguy hiểm nào?', o: ['Nhóm 3 – chất lỏng dễ cháy', 'Nhóm 2 – chất khí', 'Nhóm 8 – chất ăn mòn', 'Nhóm 9 – hàng nguy hiểm khác'], a: 0 },
      { q: 'Phát hiện rò rỉ trên đường, bạn nên làm gì?', o: ['Tiếp tục chạy về kho', 'Dừng nơi an toàn, tắt máy, báo điều độ và gọi 114', 'Dùng nước rửa trôi xuống cống', 'Châm lửa đốt cho hết'], a: 1 }
    ]
  },
  {
    id: 'c2', title: 'Quy trình xuất – nhập xăng dầu tại kho', required: false, color: 'var(--blue)', icon: 'droplet',
    lessons: [L('Quy trình nhận lệnh xuất', 'video', 10, true), L('Kiểm tra niêm phong & chì', 'read', 7, true), L('Đo nhiệt độ, tỷ trọng', 'video', 12, true),
      L('Ghi phiếu giao nhận', 'read', 6, true), L('Xử lý chênh lệch số lượng', 'video', 11, true), L('Tổng kết khóa học', 'read', 5, true)]
  },
  {
    id: 'c3', title: 'Phòng cháy chữa cháy & xử lý tràn dầu', required: true, due: '2027-01-15', color: 'var(--orange)', icon: 'flame',
    lessons: [L('Nguyên lý cháy và nguy cơ với xăng dầu', 'video', 12, true), L('Sử dụng bình chữa cháy trên xe bồn', 'video', 14, true),
      L('Quy trình xử lý tràn dầu', 'video', 16), L('Sơ cứu bỏng & ngạt khí', 'read', 9), L('Bài kiểm tra PCCC', 'quiz', 10)],
    quiz: [
      { q: 'Đám cháy xăng dầu KHÔNG nên dập bằng cách nào?', o: ['Bình bột ABC', 'Bình CO2', 'Bọt chữa cháy', 'Phun nước thẳng vào đám cháy'], a: 3 },
      { q: 'Số điện thoại cứu hỏa ở Việt Nam là?', o: ['113', '114', '115', '116'], a: 1 },
      { q: 'Khi dầu tràn ra nền, bước đầu tiên là gì?', o: ['Cô lập nguồn lửa, ngăn dầu lan bằng cát/vật liệu thấm', 'Xịt nước cho trôi', 'Lái xe đi ngay', 'Đổ bột giặt lên'], a: 0 }
    ]
  },
  {
    id: 'c4', title: 'Lái xe an toàn & phòng ngừa buồn ngủ', required: false, color: 'var(--indigo)', icon: 'truck',
    lessons: [L('Dấu hiệu mệt mỏi khi lái xe', 'video', 10, true), L('Xe bồn: trọng tâm & chất lỏng xô lệch', 'video', 14), L('Quy định thời gian lái xe liên tục', 'read', 6),
      L('Phanh & khoảng cách an toàn khi chở đầy', 'video', 12), L('Lái xe đêm & thời tiết xấu', 'read', 8), L('Bài kiểm tra', 'quiz', 8)],
    quiz: [
      { q: 'Dấu hiệu buồn ngủ khi lái xe là?', o: ['Ngáp liên tục, mắt díp, xe lệch làn', 'Thấy khỏe hơn, tim đập chậm', 'Muốn tăng tốc cho nhanh tới', 'Không có dấu hiệu nào'], a: 0 },
      { q: 'Khi vào cua với xe bồn chở chất lỏng cần?', o: ['Giảm tốc trước cua vì chất lỏng dễ xô lệch trọng tâm', 'Tăng tốc để thoát cua nhanh', 'Đánh lái gấp', 'Không cần chú ý'], a: 0 },
      { q: 'Lái xe liên tục tối đa bao lâu thì phải nghỉ?', o: ['4 giờ', '8 giờ', '10 giờ', 'Không giới hạn'], a: 0 }
    ]
  },
  {
    id: 'c5', title: 'Lái xe tiết kiệm nhiên liệu', required: false, color: 'var(--green)', icon: 'fuel',
    lessons: [L('Kỹ thuật ga & số', 'video', 10, true), L('Áp suất lốp & tải trọng', 'read', 6, true), L('Hạn chế chạy không tải', 'video', 8, true), L('Theo dõi tiêu hao L/100km', 'read', 7)]
  }
];

export const CERTS: Cert[] = [
  { name: 'Giấy phép lái xe hạng FC', no: '790123456789', exp: '2028-06-15', icon: 'id', color: 'var(--blue)' },
  { name: 'Chứng chỉ vận chuyển hàng nguy hiểm', no: 'ADR-2024-0127', exp: '2026-11-30', icon: 'shield', color: 'var(--red)', renew: true },
  { name: 'Huấn luyện PCCC & cứu nạn', no: 'PCCC-0457/24', exp: '2027-03-20', icon: 'flame', color: 'var(--orange)' },
  { name: 'Giấy khám sức khỏe lái xe', no: 'KSK-26-0912', exp: '2027-01-08', icon: 'heart', color: 'var(--pink)' },
  { name: 'Thẻ an toàn kho Nhà Bè', no: 'AT-NB-3391', exp: '2027-06-01', icon: 'lock', color: 'var(--teal)' }
];

const TASKS: Task[] = [
  { id: 't1', title: 'Nộp bản gốc phiếu giao CH-2611-0181', due: '2026-11-13', done: false },
  { id: 't2', title: 'Rửa bồn định kỳ tại Gara Minh Phát', due: '2026-11-15', done: false },
  { id: 't3', title: 'Đưa xe đi đăng kiểm', due: '2027-02-10', done: false }
];


export interface DemoRequest { kind: string; title: string; detail: string; status: string; created_at: string }

/** Bộ dữ liệu mẫu dạng JSON — mỗi tài khoản mới được nhân bản một bộ qua hàm SQL seed_demo_data() */
export function demoDataset() {
  const { vehicle, ...driver } = DRIVER;
  return {
    driver: { ...driver, learnMin: 390 },
    vehicle,
    jobs: JOBS, att: ATT, expenses: EXPENSES, advances: ADVANCES, certs: CERTS, tasks: TASKS,
    requests: [] as DemoRequest[],
    courses: COURSES.map(({ lessons, quiz, ...c }, i) => ({ ...c, sort: i, lessons: lessons.map(({ done: _d, ...l }) => l), quiz: quiz ?? [] })),
    progress: COURSES.flatMap(c => c.lessons.flatMap((l, i) => (l.done ? [{ course: c.id, idx: i }] : [])))
  };
}

/* ---------- 7 lái xe khác của đội xe (chỉ hiện trong app quản trị) ---------- */
const FLEET = [
  { name: 'Trần Minh Khoa', code: 'TX-0131', plate: '51D-412.08', team: 'Đội 1 – Kho Nhà Bè' },
  { name: 'Lê Quốc Bảo', code: 'TX-0135', plate: '51D-288.19', team: 'Đội 2 – Kho Cát Lái' },
  { name: 'Phạm Thanh Tùng', code: 'TX-0142', plate: '51D-736.40', team: 'Đội 3 – Kho Nhà Bè' },
  { name: 'Võ Văn Lâm', code: 'TX-0148', plate: '51D-509.33', team: 'Đội 1 – Kho Nhà Bè' },
  { name: 'Đặng Hữu Phước', code: 'TX-0153', plate: '60C-215.77', team: 'Đội 2 – Kho Cát Lái' },
  { name: 'Bùi Công Danh', code: 'TX-0160', plate: '51D-631.02', team: 'Đội 3 – Kho Nhà Bè' },
  { name: 'Huỳnh Tấn Lộc', code: 'TX-0166', plate: '51D-174.56', team: 'Đội 2 – Kho Cát Lái' }
];
const REQUESTS: Record<number, DemoRequest[]> = {
  1: [{ kind: 'incident', title: 'Hỏng xe / sự cố kỹ thuật', detail: 'Đèn báo áp suất dầu bật sáng trên QL51, đã dừng xe an toàn', status: 'new', created_at: '2026-11-12T08:42:00+07:00' }],
  2: [{ kind: 'complaint', title: 'Khiếu nại: Hao hụt hàng hóa', detail: 'Đồng hồ đo tại CHXD Số 11 sai số, đề nghị đối chiếu lại', status: 'new', created_at: '2026-11-11T17:05:00+07:00' }],
  4: [{ kind: 'leave', title: 'Phép năm · 2 ngày', detail: '18/11 → 19/11 · Việc gia đình', status: 'new', created_at: '2026-11-11T20:10:00+07:00' }],
  5: [{ kind: 'renew', title: 'Gia hạn giấy khám sức khỏe', detail: 'Đăng ký khám định kỳ', status: 'processing', created_at: '2026-11-10T09:00:00+07:00' }],
  6: [{ kind: 'sos', title: 'Tín hiệu SOS', detail: 'Vị trí GPS · bấm nhầm, đã xác nhận qua điện thoại', status: 'done', created_at: '2026-11-09T14:20:00+07:00' }]
};

export function fleetDatasets() {
  return FLEET.map((f, i) => {
    const k = i + 1;
    const d = structuredClone(demoDataset());
    const renum = (code: string) => code.replace(/-(\d)(\d{3})$/, (_m, _a, b) => `-${k}${b}`);
    const odo = DRIVER.vehicle.odo - k * 9137;
    d.driver = {
      ...d.driver, name: f.name, id: f.code, team: f.team, phone: `09${String(12345678 + k * 1111111).slice(0, 8)}`,
      rating: [4.9, 4.6, 4.7, 4.5, 4.8, 4.4, 4.7][i], trips: 312 - k * 17, km: 48230 - k * 2150,
      incidents: k === 4 ? 1 : 0, leaveLeft: 12 - k, learnMin: Math.max(120, 390 - k * 35)
    };
    d.vehicle = { ...d.vehicle, plate: f.plate, odo, nextService: Math.ceil((odo + 1) / 10000) * 10000 };

    const status = [3, 2, 4, 1, 3, 2, 4][i];
    d.jobs = d.jobs.map(j => {
      const job = { ...j, id: renum(j.id), vehicle: j.vehicle === DRIVER.vehicle.plate ? f.plate : j.vehicle };
      if (j.id === 'CH-2611-0189') {
        job.status = status as Job['status'];
        if (status < 3) job.cargo = job.cargo.map(c => ({ ...c, loaded: undefined }));
        job.checks = job.checks.map((c, ci) => ({
          ...c, done: c.ph === 'pickup' ? status >= 3 || (status === 2 && ci === 0) : status === 4 && !c.sign && ci === 3
        }));
      }
      if (j.id === 'CH-2611-0190') {
        if (k === 2) job.rejected = { reason: 'Trùng lịch chuyến khác', note: 'Đã nhận chuyến Biên Hòa từ hôm qua' };
        if (k === 5) job.status = 1;
      }
      if (j.status === 5 && j.date < '2026-11-12') {
        if (k % 3 === 1 && j.id.endsWith('162')) job.lateMin = 18;
        if (k === 4 && (j.id.endsWith('181') || j.id.endsWith('166'))) {
          job.cargo = job.cargo.map(c => (c.delivered != null ? { ...c, delivered: c.delivered - Math.round(c.qty * 0.004) } : c));
          job.deviationNote = 'Chênh lệch do đồng hồ đo tại cửa hàng';
        }
      }
      return job;
    });

    d.att = Object.fromEntries(Object.entries(d.att).map(([day, r]) => {
      const n = Number(day);
      if (n === 12 && k === 6) return [day, { in: null, out: null }];
      const inT = r.in ? addMin(r.in, ((k * 7 + n * 5) % 23) - 9) : null;
      const late = inT ? Number(inT.slice(0, 2)) * 60 + Number(inT.slice(3)) > 365 : false;
      return [day, {
        in: inT, out: r.out ? addMin(r.out, ((k * 3 + n) % 17) - 8) : null,
        explain: late && (k === 3 || k === 7) ? 'pending' as const : undefined,
        explainText: late && (k === 3 || k === 7) ? 'Kẹt xe trên cầu Phú Mỹ, đã báo điều độ' : undefined
      }];
    }));

    const mul = 0.8 + (k % 4) * 0.15;
    d.expenses = d.expenses.map((e, idx) => ({
      ...e, amount: Math.round((e.amount * mul) / 1000) * 1000, jobId: e.jobId ? renum(e.jobId) : undefined,
      status: e.status === 'rejected' ? e.status : idx < (k % 3) + 1 ? 'pending' : e.status
    }));
    if (k % 2 === 0) d.advances = [...d.advances, { id: 'a2', date: '2026-11-11', amount: 1500000, reason: 'Tạm ứng công tác phí đợt 2', status: 'pending' }];

    d.certs = d.certs.map(c => {
      if (c.renew) return { ...c, exp: k === 3 ? '2026-11-08' : `2027-0${(k % 9) + 1}-15`, renew: k === 3 || undefined };
      if (c.icon === 'heart' && k === 5) return { ...c, exp: '2026-11-25' };
      return c;
    });
    d.progress = d.progress.filter(p => (p.idx + k) % 4 !== 0);
    d.requests = REQUESTS[k] ?? [];
    return d;
  });
}
