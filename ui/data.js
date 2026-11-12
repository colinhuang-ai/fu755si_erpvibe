/* DriverOS – dữ liệu mock (tài xế xe bồn chở dầu) */
const MOCK_TODAY = '2026-11-12';

const DRIVER = {
  name: 'Nguyễn Văn Hùng', short: 'Hùng', id: 'TX-0127',
  phone: '0903 456 789', team: 'Đội 3 – Kho Nhà Bè', since: '03/2019', dob: '14/08/1988',
  rating: 4.8, trips: 312, km: 48230, incidents: 0,
  company: 'Nam Việt Petro Logistics',
  dispatcher: { name: 'Lê Thu Hà', phone: '0908111222' },
  vehicle: {
    plate: '51D-345.67', model: 'Hino FM8JNSA + bồn inox 18.000 lít',
    compartments: [4000, 4000, 4000, 3000, 3000],
    registry: '2027-02-18', odo: 248230, nextService: 250000
  }
};

const SHIFT = { start: '06:00', end: '15:00', grace: 5 };

/* ---------- Chấm công tháng 11/2026 (key = ngày) ---------- */
const ATT = {
  2:  { in: '05:52', out: '15:05' },
  3:  { in: '06:12', out: '15:10', note: 'Kẹt xe cầu Phú Mỹ' },
  4:  { in: '05:57', out: '15:02' },
  5:  { in: '05:41', out: '15:30', note: 'Đến sớm nhận chuyến gấp' },
  6:  { in: '05:58', out: '15:00' },
  7:  { in: '06:25', out: '14:20', note: 'Xe hỏng lốp, về sớm xin phép điều độ' },
  9:  { in: '05:55', out: '15:03' },
  10: { in: '05:44', out: '15:12' },
  11: { in: '05:59', out: '15:20' },
  12: { in: '05:54', out: null }
};

/* ---------- KPI ---------- */
const KPI_ITEMS = [
  { k: 'punctual', label: 'Chuyên cần (đi sớm / muộn)', w: 25, score: 82 },
  { k: 'delivery', label: 'Giao hàng đúng hẹn',         w: 25, score: 92 },
  { k: 'safety',   label: 'An toàn lái xe',             w: 20, score: 95, hint: '0 sự cố · 1 cảnh báo quá tốc độ' },
  { k: 'fuel',     label: 'Tiêu hao nhiên liệu',        w: 15, score: 78, hint: '31,8 L/100km (định mức 30)' },
  { k: 'process',  label: 'Tuân thủ quy trình & hồ sơ', w: 15, score: 88, hint: 'Thiếu 1 biên bản ký nhận tuần 2' }
];
const KPI_TIERS = [
  { min: 90, amt: 2000000, name: 'Xuất sắc' },
  { min: 80, amt: 1200000, name: 'Tốt' },
  { min: 70, amt: 600000,  name: 'Khá' },
  { min: 0,  amt: 0,       name: 'Cần cải thiện' }
];
const KPI_TREND = [{ m: 'T8', v: 84 }, { m: 'T9', v: 79 }, { m: 'T10', v: 89 }];

/* ---------- Công việc ---------- */
const K = (item, arr, start = 1) => arr.map((q, i) => ({ label: 'Khoang ' + (start + i), item, qty: q, unit: 'lít' }));
const CK = (p, d) => [
  ['Kiểm tra niêm phong chì kho, ghi số chì', 'pickup'],
  ['Đối chiếu loại/lượng hàng với phiếu xuất', 'pickup'],
  ['Đo nhiệt độ & tỷ trọng, ghi vào phiếu', 'pickup'],
  ['Nối dây tiếp địa, kiểm tra van & ống xả', 'deliver'],
  ['Chụp ảnh đồng hồ đo & niêm phong', 'deliver'],
  ['Ký biên bản giao nhận với khách', 'deliver']
].map(([t, ph]) => ({ t, ph, done: ph === 'pickup' ? p : d }));
const CK_DRUM = (p, d) => [
  ['Đếm số thùng/phuy, kiểm tra nắp & nhãn', 'pickup'],
  ['Chằng buộc hàng, kiểm tra rò rỉ', 'pickup'],
  ['Đối chiếu phiếu xuất kho', 'pickup'],
  ['Đếm lại số thùng khi giao', 'deliver'],
  ['Chụp ảnh hàng đã giao', 'deliver'],
  ['Ký biên bản giao nhận với khách', 'deliver']
].map(([t, ph]) => ({ t, ph, done: ph === 'pickup' ? p : d }));

const NHABE = { name: 'Kho xăng dầu Nhà Bè', addr: 'Đường Huỳnh Tấn Phát, Nhà Bè, TP.HCM' };
const HIEPPHUOC = { name: 'Kho Hiệp Phước', addr: 'Đường Nguyễn Văn Tạo, Nhà Bè, TP.HCM' };

const DEST = {
  q9:   { name: 'CHXD Số 31 – Quận 9',        addr: '120 Lê Văn Việt, Q.9, TP. Thủ Đức',        km: 22, who: 'Anh Tuấn', phone: '0912000031' },
  q7:   { name: 'CHXD Số 05 – Quận 7',        addr: '88 Nguyễn Thị Thập, Q.7, TP.HCM',          km: 14, who: 'Chị Lan',  phone: '0912000005' },
  bh:   { name: 'CHXD Số 22 – Biên Hòa',      addr: '1020 QL1K, P. Bình Đa, Biên Hòa, Đồng Nai', km: 41, who: 'Anh Phúc', phone: '0912000022' },
  lt:   { name: 'Trạm cấp dầu KCN Long Thành', addr: 'Đường số 5, KCN Long Thành, Đồng Nai',      km: 52, who: 'Anh Nghĩa', phone: '0912000052' },
  td:   { name: 'CHXD Số 18 – Thủ Đức',       addr: '256 Xa lộ Hà Nội, Thủ Đức, TP.HCM',         km: 32, who: 'Anh Bảo',  phone: '0912333444' },
  nb:   { name: 'CHXD Số 40 – Nhà Bè',        addr: '45 Lê Văn Lương, Nhà Bè, TP.HCM',           km: 9,  who: 'Chị Hoa',  phone: '0912000040' },
  bc:   { name: 'CHXD Số 11 – Bình Chánh',    addr: '12 QL1A, Bình Chánh, TP.HCM',               km: 25, who: 'Anh Dũng', phone: '0912000011' },
  la:   { name: 'Kho trung chuyển Long An',   addr: 'KCN Hải Sơn, Đức Hòa, Long An',             km: 48, who: 'Anh Khoa', phone: '0912000048' }
};

const fee = km => Math.round((150000 + km * 5000) / 10000) * 10000;
const addMin = (t, m) => { const x = (+t.slice(0, 2)) * 60 + (+t.slice(3)) + m; return String(Math.floor(x / 60) % 24).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0'); };

function mkJob(o) {
  const d = DEST[o.dest];
  const pick = o.pick || '06:30';
  return Object.assign({
    status: 5, vehicle: DRIVER.vehicle.plate, type: 'bulk', seal: '', note: '', lateMin: 0,
    from: Object.assign({}, NHABE, { time: pick }),
    to: { name: d.name, addr: d.addr, eta: addMin(pick, 55 + Math.round(d.km * 1.6)), who: d.who, phone: d.phone },
    km: d.km, fee: fee(d.km),
    cargo: K('Dầu DO 0,05S-II', [4000, 4000, 4000, 3000, 3000]),
    checks: CK(true, true)
  }, o);
}

const JOBS = [
  mkJob({ id: 'CH-2611-0188', date: '2026-11-12', dest: 'q7', pick: '06:10',
    cargo: [...K('Xăng RON95-III', [4000, 4000]), ...K('Xăng E5 RON92', [4000], 3)], seal: 'CT-448201 → 448203' }),
  mkJob({ id: 'CH-2611-0189', date: '2026-11-12', dest: 'td', pick: '07:30', status: 3,
    cargo: [...K('Dầu DO 0,05S-II', [4000, 4000, 4000]), ...K('Xăng RON95-III', [3000], 4), ...K('Xăng E5 RON92', [3000], 5)],
    seal: 'CT-448204 → 448208', note: 'Xả tại bể ngầm số 2 và 3. Đo tồn bể trước khi xả. Cửa hàng chỉ nhận hàng từ 09:00.',
    to: { name: DEST.td.name, addr: DEST.td.addr, eta: '10:30', who: DEST.td.who, phone: DEST.td.phone },
    checks: CK(true, false) }),
  mkJob({ id: 'CH-2611-0190', date: '2026-11-12', dest: 'lt', pick: '11:30', status: 0,
    cargo: K('Dầu DO 0,05S-II', [4000, 4000, 4000, 4000]),
    note: 'Khách yêu cầu có mặt trước 14:00. Mang theo giấy phép vào KCN.',
    to: { name: DEST.lt.name, addr: DEST.lt.addr, eta: '14:00', who: DEST.lt.who, phone: DEST.lt.phone },
    checks: CK(false, false) }),
  mkJob({ id: 'CH-2611-0191', date: '2026-11-13', dest: 'bh', pick: '07:00', status: 0, type: 'drum',
    vehicle: '51C-218.45 (xe tải thùng 8T)',
    from: Object.assign({}, HIEPPHUOC, { time: '07:00' }),
    to: { name: 'Công ty Cơ khí Tân Phát', addr: 'Đường 3A, KCN Biên Hòa 2, Đồng Nai', eta: '08:30', who: 'Anh Thành', phone: '0912777888' },
    km: 38, fee: 340000,
    cargo: [
      { label: 'Phuy 200L', item: 'Dầu thủy lực AW68', qty: 40, unit: 'thùng' },
      { label: 'Phuy 200L', item: 'Dầu động cơ 15W-40', qty: 20, unit: 'thùng' },
      { label: 'Thùng 18L', item: 'Dầu hộp số 80W-90', qty: 120, unit: 'thùng' }
    ],
    note: 'Chuyến dầu nhớt đóng thùng – dùng xe tải thùng, bốc xếp bằng xe nâng tại kho.',
    checks: CK_DRUM(false, false) }),
  mkJob({ id: 'CH-2611-0192', date: '2026-11-14', dest: 'bh', pick: '06:30', status: 0,
    cargo: K('Dầu DO 0,05S-II', [4000, 4000, 4000, 3000, 3000]), checks: CK(false, false) })
];

/* lịch sử trong tháng */
[
  ['2026-11-11', 'CH-2611-0184', 'lt', '06:20', 25],
  ['2026-11-10', 'CH-2611-0181', 'q9', '06:15', 0],
  ['2026-11-10', 'CH-2611-0182', 'q7', '10:00', 0],
  ['2026-11-09', 'CH-2611-0178', 'bh', '06:25', 0],
  ['2026-11-07', 'CH-2611-0173', 'td', '06:40', 0],
  ['2026-11-06', 'CH-2611-0170', 'bc', '06:10', 0],
  ['2026-11-06', 'CH-2611-0171', 'nb', '09:50', 0],
  ['2026-11-05', 'CH-2611-0166', 'la', '05:55', 0],
  ['2026-11-04', 'CH-2611-0162', 'q9', '06:20', 0],
  ['2026-11-03', 'CH-2611-0158', 'td', '06:35', 0],
  ['2026-11-02', 'CH-2611-0153', 'bc', '06:10', 0]
].forEach(([date, id, dest, pick, late]) => JOBS.push(mkJob({ id, date, dest, pick, lateMin: late,
  cargo: K(dest === 'lt' || dest === 'bh' ? 'Dầu DO 0,05S-II' : 'Xăng RON95-III', [4000, 4000, 4000, 3000, 3000].slice(0, dest === 'nb' ? 3 : 5)) })));

/* ---------- Tài chính ---------- */
const EXPENSES = [
  { id: 'e1',  date: '2026-11-12', time: '07:40', cat: 'food',   title: 'Ăn sáng – Bún bò Huế',           place: 'Quán Cô Lan, Nhà Bè', amount: 45000,   status: 'pending',  receipt: true },
  { id: 'e2',  date: '2026-11-11', time: '16:05', cat: 'fuel',   title: 'Đổ dầu DO – 65 lít',              place: 'CHXD Petrolimex Số 12', amount: 1384500, status: 'approved', receipt: true },
  { id: 'e3',  date: '2026-11-11', time: '10:30', cat: 'toll',   title: 'Phí cao tốc TP.HCM – Long Thành', place: 'Trạm Long Thành',     amount: 77000,   status: 'approved', receipt: true },
  { id: 'e4',  date: '2026-11-10', time: '11:45', cat: 'food',   title: 'Cơm trưa',                        place: 'Cơm tấm Ba Ghiền',    amount: 60000,   status: 'approved', receipt: true },
  { id: 'e5',  date: '2026-11-10', time: '15:10', cat: 'repair', title: 'Rửa bồn & vệ sinh xe',            place: 'Gara Minh Phát',      amount: 150000,  status: 'pending',  receipt: true },
  { id: 'e6',  date: '2026-11-09', time: '13:20', cat: 'other',  title: 'Phí đỗ xe qua đêm',               place: 'Bãi xe KCN Long Thành', amount: 80000, status: 'approved', receipt: true },
  { id: 'e7',  date: '2026-11-07', time: '06:50', cat: 'fuel',   title: 'Đổ dầu DO – 70 lít',              place: 'CHXD Petrolimex Số 12', amount: 1491000, status: 'approved', receipt: true },
  { id: 'e8',  date: '2026-11-07', time: '13:00', cat: 'repair', title: 'Vá lốp xe đầu kéo',               place: 'Tiệm lốp Hai Sơn',    amount: 120000,  status: 'approved', receipt: true },
  { id: 'e9',  date: '2026-11-06', time: '18:30', cat: 'food',   title: 'Ăn tối',                          place: 'Quán cơm Tư Béo',     amount: 75000,   status: 'rejected', receipt: false, reason: 'Thiếu hóa đơn' },
  { id: 'e10', date: '2026-11-05', time: '09:15', cat: 'toll',   title: 'Phí BOT Quốc lộ 51',              place: 'Trạm Biên Hòa',       amount: 70000,   status: 'approved', receipt: true },
  { id: 'e11', date: '2026-11-04', time: '12:10', cat: 'food',   title: 'Cơm trưa',                        place: 'Cơm gà Hải Nam',      amount: 55000,   status: 'approved', receipt: true }
];
const ADVANCES = [
  { id: 'a1', date: '2026-11-03', amount: 2000000, reason: 'Tạm ứng công tác phí đợt 1', status: 'paid' }
];
const SALARY = { base: 8500000, hazard: 500000, insuranceRate: 0.105 };

/* ---------- Học tập ---------- */
const L = (t, type, min, done = false) => ({ t, type, min, done });
const COURSES = [
  { id: 'c1', title: 'Vận chuyển hàng nguy hiểm (ADR) – bồi dưỡng định kỳ', required: true, due: '2026-11-30', color: '#ef4444', icon: 'shield',
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
    ] },
  { id: 'c2', title: 'Quy trình xuất – nhập xăng dầu tại kho', required: false, color: '#2563eb', icon: 'droplet',
    lessons: [L('Quy trình nhận lệnh xuất', 'video', 10, true), L('Kiểm tra niêm phong & chì', 'read', 7, true), L('Đo nhiệt độ, tỷ trọng', 'video', 12, true),
      L('Ghi phiếu giao nhận', 'read', 6, true), L('Xử lý chênh lệch số lượng', 'video', 11, true), L('Tổng kết khóa học', 'read', 5, true)] },
  { id: 'c3', title: 'Phòng cháy chữa cháy & xử lý tràn dầu', required: true, due: '2027-01-15', color: '#f59e0b', icon: 'alert',
    lessons: [L('Nguyên lý cháy và nguy cơ với xăng dầu', 'video', 12, true), L('Sử dụng bình chữa cháy xe bồn', 'video', 14, true),
      L('Quy trình xử lý tràn dầu', 'video', 16), L('Sơ cứu bỏng & ngạt khí', 'read', 9), L('Bài kiểm tra PCCC', 'quiz', 10)],
    quiz: [
      { q: 'Đám cháy xăng dầu KHÔNG nên dập bằng cách nào?', o: ['Bình bột ABC', 'Bình CO2', 'Bọt chữa cháy', 'Phun nước thẳng vào đám cháy'], a: 3 },
      { q: 'Số điện thoại cứu hỏa ở Việt Nam là?', o: ['113', '114', '115', '116'], a: 1 },
      { q: 'Khi dầu tràn ra nền, bước đầu tiên là gì?', o: ['Cô lập nguồn lửa, ngăn dầu lan bằng cát/vật liệu thấm', 'Xịt nước cho trôi', 'Lái xe đi ngay', 'Đổ bột giặt'], a: 0 }
    ] },
  { id: 'c4', title: 'Lái xe an toàn & phòng ngừa buồn ngủ', required: false, color: '#7c3aed', icon: 'truck',
    lessons: [L('Dấu hiệu mệt mỏi khi lái xe', 'video', 10, true), L('Lái xe bồn: trọng tâm & chất lỏng xô lệch', 'video', 14), L('Quy định thời gian lái xe liên tục', 'read', 6),
      L('Phanh & khoảng cách an toàn khi chở đầy', 'video', 12), L('Lái xe đêm & thời tiết xấu', 'read', 8), L('Bài kiểm tra', 'quiz', 8)],
    quiz: [
      { q: 'Dấu hiệu buồn ngủ khi lái xe là?', o: ['Ngáp liên tục, mắt díp, xe lệch làn', 'Thấy khỏe hơn, tim đập chậm', 'Muốn tăng tốc cho nhanh tới', 'Không có dấu hiệu nào'], a: 0 },
      { q: 'Khi vào cua với xe bồn chở chất lỏng cần?', o: ['Giảm tốc trước cua vì chất lỏng dễ gây xô lệch trọng tâm', 'Tăng tốc để thoát cua nhanh', 'Đánh lái gấp', 'Không cần chú ý'], a: 0 },
      { q: 'Lái xe liên tục tối đa bao lâu thì phải nghỉ?', o: ['4 giờ', '8 giờ', '10 giờ', 'Không giới hạn'], a: 0 }
    ] },
  { id: 'c5', title: 'Lái xe tiết kiệm nhiên liệu', required: false, color: '#16a34a', icon: 'fuel',
    lessons: [L('Kỹ thuật ga & số', 'video', 10, true), L('Áp suất lốp & tải trọng', 'read', 6, true), L('Hạn chế chạy không tải', 'video', 8, true), L('Theo dõi tiêu hao L/100km', 'read', 7)] }
];
const LEARN_BASE_MIN = 390; /* 6,5 giờ học trong tháng */
const LEARN_GOAL_MIN = 480;

const CERTS = [
  { name: 'Giấy phép lái xe hạng FC', no: '790123456789', exp: '2028-06-15' },
  { name: 'Chứng chỉ vận chuyển hàng nguy hiểm (ADR)', no: 'ADR-2024-0127', exp: '2026-11-30', renew: true },
  { name: 'Huấn luyện PCCC & cứu nạn cứu hộ', no: 'PCCC-0457/24', exp: '2027-03-20' },
  { name: 'Giấy khám sức khỏe lái xe', no: 'KSK-26-0912', exp: '2027-01-08' },
  { name: 'Thẻ an toàn kho xăng dầu Nhà Bè', no: 'AT-NB-3391', exp: '2027-06-01' }
];

const VCHECK_ITEMS = [
  'Lốp xe & áp suất', 'Phanh & hệ thống đèn', 'Rò rỉ dầu / nhớt dưới gầm',
  'Van đáy & nắp các khoang bồn', 'Dây tiếp địa chống tĩnh điện', '2 bình chữa cháy còn hạn',
  'Biển báo hàng nguy hiểm & đèn xoay', 'Giấy tờ xe, GPLX, chứng chỉ ADR'
];
