'use strict';
/* DriverOS – app logic (vanilla JS, không cần build) */

/* ================= Icons ================= */
const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  truck: '<path d="M1 6h13v10H1z"/><path d="M14 9h4l3 3v4h-7z"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  wallet: '<path d="M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 7V6a2 2 0 0 1 2-2h12"/><circle cx="16.5" cy="13.5" r="1"/>',
  book: '<path d="M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2z"/><path d="M22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  droplet: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.01"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  nav: '<path d="M3 11l18-8-8 18-2-8z"/>',
  file: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  clip: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9zM9 14l2 2 4-4"/>',
  out: '<path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9"/>',
  fuel: '<path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M4 21h10M14 9h2.5a1.5 1.5 0 0 1 1.5 1.5V16a1.5 1.5 0 0 0 3 0V8l-3-3M6 8h6"/>',
  utensils: '<path d="M6 3v7a2 2 0 0 0 2 2v9M10 3v7M6 3v7M18 3c-2 1-3 4-3 8h3v10"/>',
  road: '<path d="M4 20L8 4M20 20L16 4M12 6v3M12 12v3M12 18v2"/>',
  tool: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8 6.2 21l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.5-.5-.5-2.5z"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  dollar: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5a2.5 2 0 0 0-2.5-1.5c-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2a2.5 2 0 0 1-2.5-1.5M12 6v2m0 8v2"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  refresh: '<path d="M20 11A8 8 0 0 0 5.5 7M4 4v4h4M4 13a8 8 0 0 0 14.5 4M20 20v-4h-4"/>',
  doc: '<path d="M7 3h7l4 4v14H7z"/><path d="M9 12h6M9 16h6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>'
};
const ic = (n, c = '') => `<svg class="ic ${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* ================= Helpers ================= */
const $ = (s, el = document) => el.querySelector(s);
const clone = o => JSON.parse(JSON.stringify(o));
const pad = n => String(n).padStart(2, '0');
const fmt = n => Math.round(n).toLocaleString('vi-VN');
const money = n => fmt(n) + 'đ';
const toMin = t => (+t.slice(0, 2)) * 60 + (+t.slice(3, 5));
const dmy = iso => iso.slice(8, 10) + '/' + iso.slice(5, 7);
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);
const hm = m => { m = Math.max(0, Math.round(m)); return m < 60 ? m + ' phút' : Math.floor(m / 60) + 'g ' + pad(m % 60) + 'p'; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const chip = (t, c) => `<span class="chip ${c}">${t}</span>`;
const WD = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const dowOf = iso => new Date(iso + 'T00:00:00').getDay();
const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
const tr = n => (n / 1e6).toFixed(1).replace('.', ',') + ' tr';

/* Đồng hồ mock: bắt đầu 09:12 và chạy theo thời gian thực */
const NOW0 = 9 * 3600 + 12 * 60 + 20, T0 = Date.now();
const nowSec = () => (NOW0 + Math.floor((Date.now() - T0) / 1000)) % 86400;
const nowMin = () => Math.floor(nowSec() / 60);
const nowHM = () => pad(Math.floor(nowMin() / 60)) + ':' + pad(nowMin() % 60);
const clockStr = () => { const s = nowSec(); return pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s % 3600 / 60)) + ':' + pad(s % 60); };

/* ================= State ================= */
const KEY = 'driveros.v1';
const defaultState = () => ({ att: clone(ATT), jobs: clone(JOBS), expenses: clone(EXPENSES), advances: clone(ADVANCES),
  courses: clone(COURSES), vcheck: [], learnExtra: 0, requests: [] });
let S = null;
try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { /* ignore */ }
if (!S || !S.jobs) S = defaultState();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } };
const UI = { jobTab: 'today', attTab: 'att', selDay: 12, finTab: 'exp', fin: 'all', learnTab: 'courses', sheet: null };

/* ================= Domain ================= */
const JOB_ST = [
  { t: 'Chờ nhận', c: 'c-gray' }, { t: 'Đã nhận lệnh', c: 'c-blue' }, { t: 'Đang lấy hàng', c: 'c-blue' },
  { t: 'Đang vận chuyển', c: 'c-amber' }, { t: 'Đang xả hàng', c: 'c-violet' }, { t: 'Hoàn tất', c: 'c-green' }
];
const NEXT = ['Nhận chuyến', 'Bắt đầu lấy hàng', 'Đã lấy hàng – xuất bến', 'Đã tới điểm giao', 'Hoàn tất giao hàng'];
const STEPS = ['Nhận lệnh', 'Lấy hàng', 'Vận chuyển', 'Xả hàng', 'Hoàn tất'];
const CAT = {
  fuel: { label: 'Nhiên liệu', ic: 'fuel', color: '#f59e0b' }, food: { label: 'Ăn uống', ic: 'utensils', color: '#ef4444' },
  toll: { label: 'Cầu đường', ic: 'road', color: '#3b82f6' }, repair: { label: 'Sửa chữa', ic: 'tool', color: '#8b5cf6' },
  other: { label: 'Khác', ic: 'receipt', color: '#64748b' }
};
const EXP_ST = { pending: ['Chờ duyệt', 'c-amber'], approved: ['Đã duyệt', 'c-green'], rejected: ['Từ chối', 'c-red'] };

const liters = j => sum(j.cargo.filter(c => c.unit === 'lít'), c => c.qty);
const cargoSum = j => j.cargo.every(c => c.unit === 'lít')
  ? `${fmt(liters(j))} lít · ${j.cargo.length} khoang` : `${sum(j.cargo, c => c.qty)} thùng/phuy`;

function classify(r) {
  if (!r || !r.in) return null;
  const d = toMin(r.in) - toMin(SHIFT.start);
  const st = d < -SHIFT.grace ? 'early' : d > SHIFT.grace ? 'late' : 'ontime';
  const left = r.out ? toMin(SHIFT.end) - toMin(r.out) : 0;
  return { st, d, left: left > SHIFT.grace ? left : 0 };
}
const stChip = c => c.st === 'early' ? chip(`Sớm ${-c.d} phút`, 'c-green') : c.st === 'late' ? chip(`Muộn ${c.d} phút`, 'c-red') : chip('Đúng giờ', 'c-blue');

function attStats() {
  const days = Object.entries(S.att).filter(([, r]) => r.in);
  const st = days.map(([, r]) => classify(r));
  return {
    worked: days.length,
    early: st.filter(c => c.st === 'early').length, ontime: st.filter(c => c.st === 'ontime').length,
    late: st.filter(c => c.st === 'late').length, lateMin: sum(st.filter(c => c.st === 'late'), c => c.d),
    left: st.filter(c => c.left).length
  };
}
function kpiItems() {
  const done = S.jobs.filter(j => j.status === 5 && j.date.startsWith('2026-11'));
  const late = done.filter(j => j.lateMin > 0).length;
  const a = attStats();
  return KPI_ITEMS.map(k => Object.assign({}, k, {
    hint: k.k === 'punctual' ? `${a.late} lần đi muộn (${a.lateMin} phút) · ${a.early} lần đi sớm`
      : k.k === 'delivery' ? `${done.length - late}/${done.length} chuyến giao đúng hẹn` : k.hint
  }));
}
const kpiScore = () => Math.round(sum(KPI_ITEMS, k => k.w * k.score) / 100);
const tierOf = s => KPI_TIERS.find(t => s >= t.min);
function pay() {
  const done = S.jobs.filter(j => j.status === 5 && j.date.startsWith('2026-11'));
  const trips = sum(done, j => j.fee), tier = tierOf(kpiScore());
  const reimb = sum(S.expenses.filter(e => e.status === 'approved'), e => e.amount);
  const adv = sum(S.advances.filter(a => a.status === 'paid'), a => a.amount);
  const ins = SALARY.base * SALARY.insuranceRate;
  const net = SALARY.base + SALARY.hazard + trips + tier.amt + reimb - ins - adv;
  return { done: done.length, trips, tier, reimb, adv, ins, net };
}
const certDays = c => daysBetween(MOCK_TODAY, c.exp);
const courseDone = c => c.lessons.filter(l => l.done).length;
const courseNext = c => c.lessons.findIndex(l => !l.done);
const vcDone = () => VCHECK_ITEMS.filter((_, i) => S.vcheck[i]).length;

/* ================= Shared UI ================= */
function shiftCard() {
  const r = S.att[12], c = classify(r);
  const clk = `<span class="clock" id="clk">${clockStr()}</span>`;
  let mid, btn;
  if (!r || !r.in) {
    mid = `<div class="bigtime">Chưa vào ca</div><div class="small muted">Ca ${SHIFT.start} – ${SHIFT.end}</div>`;
    btn = `<button class="btn block" data-a="checkin">${ic('clock')}Chấm công vào ca</button>`;
  } else if (!r.out) {
    mid = `<div class="flex wrap"><div class="bigtime">${r.in}</div>${stChip(c)}</div>
      <div class="small muted" id="worked">Đang trong ca · đã làm ${hm(nowMin() - toMin(r.in))}</div>`;
    btn = `<button class="btn navy block" data-a="checkout">${ic('out')}Chấm công ra ca</button>`;
  } else {
    mid = `<div class="flex wrap"><div class="bigtime">${r.in} – ${r.out}</div>${c.left ? chip('Về sớm ' + hm(c.left), 'c-amber') : chip('Đủ ca', 'c-green')}</div>
      <div class="small muted">Tổng thời gian làm: ${hm(toMin(r.out) - toMin(r.in))}</div>`;
    btn = `<button class="btn ghost block" data-a="undoshift">${ic('refresh')}Hoàn tác (demo)</button>`;
  }
  return `<div class="card">
    <div class="flex between"><span class="bold">Chấm công hôm nay</span>${clk}</div>
    <div style="margin:10px 0 8px">${mid}</div>
    <div class="geo">${ic('pin', 'sm')}Kho Nhà Bè · trong vùng cho phép (120 m)</div>
    <div style="margin-top:12px">${btn}</div></div>`;
}

function jobCard(j) {
  const st = JOB_ST[j.status], today = j.date === MOCK_TODAY;
  return `<div class="card job" data-a="go" data-v="/jobs/${j.id}">
    <div class="flex between"><span class="small muted bold">${j.id}${today ? '' : ' · ' + dmy(j.date)}</span>
      <span class="flex" style="gap:6px">${j.lateMin ? chip('Trễ ' + j.lateMin + ' phút', 'c-red') : ''}${chip(st.t, st.c)}</span></div>
    <div class="route">
      <div class="rline"><span class="rdot"></span><div class="grow"><div class="bold ellip">${j.from.name}</div><div class="small muted">Lấy hàng · ${j.from.time}</div></div></div>
      <div class="rsep"></div>
      <div class="rline"><span class="rdot to"></span><div class="grow"><div class="bold ellip">${j.to.name}</div><div class="small muted ellip">${j.to.addr}</div></div></div>
    </div>
    <div class="meta"><span>${ic('droplet', 'xs')}${cargoSum(j)}</span><span>${ic('clock', 'xs')}Giao ${j.to.eta}</span><span>${ic('road', 'xs')}${j.km} km</span><span>${ic('dollar', 'xs')}${money(j.fee)}</span></div>
  </div>`;
}
const heroSimple = (title, sub, extra = '') => `<div class="hero"><div class="row"><div class="grow"><h1>${title}</h1><div class="sub">${sub}</div></div>${extra}</div></div>`;
const seg = (opts, cur, action) => `<div class="seg">${opts.map(([k, l]) => `<button class="${cur === k ? 'on' : ''}" data-a="${action}" data-v="${k}">${l}</button>`).join('')}</div>`;

/* ================= Screens ================= */
function screenHome() {
  const today = S.jobs.filter(j => j.date === MOCK_TODAY).sort((a, b) => a.from.time.localeCompare(b.from.time));
  const done = today.filter(j => j.status === 5);
  const active = today.find(j => j.status >= 1 && j.status < 5) || today.find(j => j.status === 0);
  const p = pay(), score = kpiScore();
  const h = Math.floor(nowMin() / 60);
  const greet = h < 11 ? 'Chào buổi sáng' : h < 13 ? 'Chào buổi trưa' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  const alerts = [];
  CERTS.forEach(c => { const d = certDays(c); if (d <= 60) alerts.push(['red', 'shield', `${c.name} sắp hết hạn`, `Còn ${d} ngày (${dmy(c.exp)}/${c.exp.slice(0, 4)}) – cần gia hạn`, '/learn']); });
  S.courses.filter(c => c.required && courseDone(c) < c.lessons.length).forEach(c => {
    const d = daysBetween(MOCK_TODAY, c.due); if (d <= 30) alerts.push(['amber', 'book', 'Khóa bắt buộc chưa hoàn thành', `${c.title} · hạn ${dmy(c.due)} (còn ${d} ngày)`, '/learn/' + c.id]);
  });
  if (vcDone() < VCHECK_ITEMS.length) alerts.push(['blue', 'clip', 'Chưa kiểm tra xe trước chuyến', `Hoàn thành ${vcDone()}/${VCHECK_ITEMS.length} hạng mục`, 'sheet:vcheck']);
  const km = DRIVER.vehicle.nextService - DRIVER.vehicle.odo;
  if (km <= 2000) alerts.push(['amber', 'tool', 'Sắp đến kỳ bảo dưỡng xe', `Còn ${fmt(km)} km tới mốc ${fmt(DRIVER.vehicle.nextService)} km`, '/me']);

  return `<div class="screen">
  <div class="hero tall"><div class="row">
    <div class="avatar">NH</div>
    <div class="grow"><div class="sub">${greet},</div><h1>${DRIVER.name}</h1></div>
    <button class="iconbtn" data-a="toast" data-v="Không có thông báo mới"  aria-label="Thông báo">${ic('bell')}<i class="badge"></i></button>
    <button class="iconbtn sos" data-a="sheet" data-v="sos" aria-label="SOS">SOS</button></div>
    <div class="sub" style="margin-top:12px;position:relative;z-index:1">${WD[dowOf(MOCK_TODAY)]}, 12/11/2026 · ${DRIVER.vehicle.plate} · ${DRIVER.team}</div>
  </div>
  <div class="pull">${shiftCard()}</div>

  <div class="sec"><span>Chuyến hiện tại</span><a href="#/jobs">Tất cả</a></div>
  <div class="list">${active ? jobCard(active) : '<div class="card empty">Hôm nay chưa có chuyến nào</div>'}</div>

  <div class="sec"><span>Hôm nay</span></div>
  <div class="grid2">
    <div class="stat"><div class="l">Chuyến hoàn tất</div><div class="v">${done.length}/${today.length}</div></div>
    <div class="stat"><div class="l">Đã giao</div><div class="v">${fmt(sum(done, liters))} <small class="muted" style="font-size:13px">lít</small></div></div>
    <div class="stat" data-a="go" data-v="/att" style="cursor:pointer"><div class="l">KPI tháng này</div><div class="v">${score} <small class="muted" style="font-size:13px">/100</small></div></div>
    <div class="stat" data-a="go" data-v="/fin" style="cursor:pointer"><div class="l">Thu nhập dự kiến</div><div class="v">${tr(p.net)}</div></div>
  </div>

  ${alerts.length ? `<div class="sec"><span>Cần chú ý</span></div><div class="list">${alerts.map(a => `
    <button class="alert ${a[0]}" data-a="${a[4].startsWith('sheet:') ? 'sheet' : 'go'}" data-v="${a[4].replace('sheet:', '')}">
      ${ic(a[1], 'lg')}<div class="grow"><div class="bold">${a[2]}</div><div class="small muted">${a[3]}</div></div>${ic('chev', 'sm')}</button>`).join('')}</div>` : ''}

  <div class="sec"><span>Truy cập nhanh</span></div>
  <div class="qa">
    <button data-a="sheet" data-v="expense"><span class="tile" style="background:#f59e0b">${ic('receipt')}</span>Thêm chi phí</button>
    <button data-a="sheet" data-v="vcheck"><span class="tile" style="background:#16a34a">${ic('clip')}</span>Kiểm tra xe</button>
    <button data-a="sheet" data-v="incident"><span class="tile" style="background:#dc2626">${ic('alert')}</span>Báo sự cố</button>
    <a href="tel:${DRIVER.dispatcher.phone}"><button style="width:100%" type="button"><span class="tile" style="background:#2563eb">${ic('phone')}</span>Gọi điều độ</button></a>
  </div>

  <div class="sec"><span>Lịch chạy hôm nay</span></div>
  <div class="list">${today.map(jobCard).join('')}</div>
  </div>`;
}

function screenJobs() {
  const t = UI.jobTab;
  let jobs = S.jobs.filter(j => t === 'today' ? j.date === MOCK_TODAY : t === 'up' ? j.date > MOCK_TODAY : j.date < MOCK_TODAY);
  jobs.sort((a, b) => t === 'hist' ? (b.date + b.from.time).localeCompare(a.date + a.from.time) : (a.date + a.from.time).localeCompare(b.date + b.from.time));
  const km = sum(jobs, j => j.km), lit = sum(jobs, liters);
  return `<div class="screen">
  ${heroSimple('Công việc', 'Lệnh điều xe & chuyến chở dầu')}
  ${seg([['today', 'Hôm nay'], ['up', 'Sắp tới'], ['hist', 'Lịch sử']], t, 'jobTab')}
  <div class="grid2 mt">
    <div class="stat"><div class="l">Số chuyến</div><div class="v">${jobs.length}</div></div>
    <div class="stat"><div class="l">${t === 'hist' ? 'Tổng quãng đường' : 'Tổng khối lượng'}</div><div class="v">${t === 'hist' ? fmt(km) + ' km' : fmt(lit) + ' lít'}</div></div>
  </div>
  <div class="list mt">${jobs.length ? jobs.map(jobCard).join('') : '<div class="card empty">Chưa có chuyến nào</div>'}</div></div>`;
}

function screenJob(id) {
  const j = S.jobs.find(x => x.id === id);
  if (!j) return `<div class="screen">${heroSimple('Không tìm thấy chuyến', '')}<div class="empty">Chuyến không tồn tại.</div></div>`;
  const st = JOB_ST[j.status], isToday = j.date === MOCK_TODAY;
  const eta = j.status >= 1 && j.status < 5 && isToday ? toMin(j.to.eta) - nowMin() : null;
  const steps = STEPS.map((l, i) => { const k = i + 1, cls = (j.status > k || j.status === 5) ? 'done' : j.status === k ? 'cur' : '';
    return `<div class="stp ${cls}"><i>${cls === 'done' ? ic('check', 'xs') : ''}</i>${l}</div>`; }).join('');
  const chk = ph => j.checks.map((c, i) => c.ph === ph ? `<button class="chk ${c.done ? 'on' : ''}" data-a="chk" data-v="${j.id}" data-v2="${i}"><span class="box">${c.done ? ic('check', 'xs') : ''}</span><span>${c.t}</span></button>` : '').join('');
  const mapq = a => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(a);
  const total = j.cargo.every(c => c.unit === 'lít') ? fmt(liters(j)) + ' lít' : sum(j.cargo, c => c.qty) + ' thùng';
  const cDone = j.checks.filter(c => c.done).length;
  return `<div class="screen">
  <div class="hero"><button class="back" data-a="go" data-v="/jobs">${ic('chev', 'xs')}Công việc</button>
    <div class="row"><div class="grow"><h1>${j.id}</h1><div class="sub">${WD[dowOf(j.date)]}, ${dmy(j.date)}/2026 · ${j.vehicle}</div></div>${chip(st.t, st.c)}</div></div>

  <div class="card mx mt" style="margin-top:-1px;border-radius:0 0 var(--r) var(--r)">
    <div class="stepper">${steps}</div>
    ${eta !== null ? `<div class="flex between" style="margin-top:12px"><span class="muted small">Hẹn giao ${j.to.eta}</span>${eta >= 0 ? chip('Còn khoảng ' + hm(eta), 'c-blue') : chip('Trễ hẹn ' + hm(-eta), 'c-red')}</div>` : ''}
  </div>

  <div class="sec"><span>Lộ trình · ${j.km} km</span></div>
  <div class="card mx"><div class="tl">
    <div class="pt"><div class="bold">${j.from.name}</div><div class="small muted">${j.from.addr}</div><div class="small" style="margin-top:2px">Lấy hàng lúc <b>${j.from.time}</b></div></div>
    <div class="pt to"><div class="bold">${j.to.name}</div><div class="small muted">${j.to.addr}</div><div class="small" style="margin-top:2px">Hẹn giao lúc <b>${j.to.eta}</b></div></div></div>
    <div class="divider"></div>
    <div class="flex"><div class="grow"><div class="small muted">Người nhận hàng</div><div class="bold">${j.to.who}</div></div>
      <a class="btn ghost sm" href="tel:${j.to.phone}">${ic('phone', 'sm')}Gọi</a>
      <a class="btn navy sm" href="${mapq(j.to.addr)}" target="_blank" rel="noopener">${ic('nav', 'sm')}Chỉ đường</a></div>
  </div>

  <div class="sec"><span>Hàng hóa</span><span class="muted" style="font-weight:700">${total}</span></div>
  <div class="card mx"><table class="cargo">${j.cargo.map(c => `<tr><td><div class="small muted">${c.label}</div><div class="bold">${c.item}</div></td><td class="q">${fmt(c.qty)} ${c.unit}</td></tr>`).join('')}</table></div>

  <div class="sec"><span>Danh sách kiểm tra</span><span class="muted small bold">${cDone}/${j.checks.length}</span></div>
  <div class="card mx">
    <div class="small muted bold">TẠI ĐIỂM LẤY HÀNG</div>${chk('pickup')}
    <div class="divider"></div>
    <div class="small muted bold">TẠI ĐIỂM GIAO HÀNG</div>${chk('deliver')}
  </div>

  <div class="sec"><span>Thông tin chuyến</span></div>
  <div class="card mx">
    <div class="kv"><span>Phương tiện</span><b>${j.vehicle}</b></div>
    ${j.seal ? `<div class="kv"><span>Số chì niêm phong</span><b>${j.seal}</b></div>` : ''}
    <div class="kv"><span>Phụ cấp chuyến</span><b>${money(j.fee)}</b></div>
    ${j.note ? `<div class="note" style="margin-top:8px">${ic('info', 'sm')}<span>${esc(j.note)}</span></div>` : ''}
  </div></div>
  <div class="cta">${j.status < 5
      ? `<button class="btn block" data-a="advance" data-v="${j.id}">${ic(j.status === 4 ? 'check' : 'play', 'sm')}${NEXT[j.status]}</button>`
      : `<div class="card flex" style="justify-content:center;color:#15803d;font-weight:800">${ic('check')}Chuyến đã hoàn tất · +${money(j.fee)}</div>`}</div>`;
}

function calendar() {
  const first = (new Date(2026, 10, 1).getDay() + 6) % 7;
  let cells = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => `<div class="h">${d}</div>`).join('') + '<button class="ph"></button>'.repeat(first);
  for (let d = 1; d <= 30; d++) {
    const r = S.att[d], c = classify(r), dow = new Date(2026, 10, d).getDay();
    let cls = '';
    if (d > 12) cls = 'f'; else if (c) cls = c.st === 'early' ? 'e' : c.st === 'late' ? 'l' : 'o'; else if (dow === 0) cls = 'off';
    if (d === 12) cls += ' td'; if (c && c.left) cls += ' le'; if (UI.selDay === d) cls += ' sel';
    cells += `<button class="${cls}" data-a="selDay" data-v="${d}">${d}</button>`;
  }
  return `<div class="cal">${cells}</div>
  <div class="legend"><span><i style="background:#bbf7d0"></i>Đi sớm</span><span><i style="background:#bfdbfe"></i>Đúng giờ</span><span><i style="background:#fecaca"></i>Đi muộn</span><span><i style="background:#f59e0b;border-radius:50%"></i>Về sớm</span><span><i style="background:#e2e8f0"></i>Nghỉ</span></div>`;
}
function dayDetail() {
  const d = UI.selDay, iso = `2026-11-${pad(d)}`, r = S.att[d], c = classify(r);
  const head = `<div class="bold">${WD[dowOf(iso)]}, ${pad(d)}/11/2026</div>`;
  if (d > 12) return `<div class="card mx mt">${head}<div class="muted small">Chưa đến ngày.</div></div>`;
  if (!c) return `<div class="card mx mt">${head}<div class="muted small">${dowOf(iso) === 0 ? 'Ngày nghỉ hằng tuần (Chủ nhật).' : 'Không có dữ liệu chấm công.'}</div></div>`;
  return `<div class="card mx mt">${head}
    <div class="kv"><span>Vào ca</span><span class="flex"><b>${r.in}</b>${stChip(c)}</span></div>
    <div class="kv"><span>Ra ca</span><span class="flex"><b>${r.out || '—'}</b>${r.out ? (c.left ? chip('Về sớm ' + hm(c.left), 'c-amber') : chip('Đủ ca', 'c-green')) : chip('Đang làm', 'c-blue')}</span></div>
    ${r.out ? `<div class="kv"><span>Thời gian làm</span><b>${hm(toMin(r.out) - toMin(r.in))}</b></div>` : ''}
    ${r.note ? `<div class="note" style="margin-top:6px">${ic('info', 'sm')}<span>${esc(r.note)}</span></div>` : ''}</div>`;
}

function screenAtt() {
  let body;
  if (UI.attTab === 'att') {
    const a = attStats();
    body = `<div class="mx mt">${shiftCard()}</div>
    <div class="grid2 mt" style="grid-template-columns:repeat(4,1fr);gap:8px">
      <div class="stat" style="padding:10px 6px;text-align:center"><div class="v" style="margin:0">${a.worked}</div><div class="l">Ngày công</div></div>
      <div class="stat" style="padding:10px 6px;text-align:center"><div class="v" style="margin:0;color:#15803d">${a.early}</div><div class="l">Đi sớm</div></div>
      <div class="stat" style="padding:10px 6px;text-align:center"><div class="v" style="margin:0;color:#b91c1c">${a.late}</div><div class="l">Đi muộn</div></div>
      <div class="stat" style="padding:10px 6px;text-align:center"><div class="v" style="margin:0;color:#b45309">${a.left}</div><div class="l">Về sớm</div></div>
    </div>
    <div class="sec"><span>Tháng 11/2026</span><span class="muted small">Ca ${SHIFT.start} – ${SHIFT.end}</span></div>
    <div class="card mx">${calendar()}</div>${dayDetail()}`;
  } else {
    const score = kpiScore(), tier = tierOf(score), items = kpiItems();
    const idx = KPI_TIERS.indexOf(tier), nxt = idx > 0 ? KPI_TIERS[idx - 1] : null;
    const C = 2 * Math.PI * 52, col = score >= 90 ? '#16a34a' : score >= 80 ? '#f59e0b' : '#ef4444';
    const trend = KPI_TREND.concat([{ m: 'T11', v: score, cur: 1 }]);
    const worst = items.slice().sort((x, y) => x.score - y.score)[0];
    body = `<div class="card mx mt flex" style="gap:16px">
      <div class="ring"><svg width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="#eef1f5" stroke-width="11"/>
        <circle cx="60" cy="60" r="52" fill="none" stroke="${col}" stroke-width="11" stroke-linecap="round" stroke-dasharray="${(score / 100 * C).toFixed(1)} ${C.toFixed(1)}"/></svg>
        <div class="n"><div>${score}<small>/ 100</small></div></div></div>
      <div class="grow"><div class="muted small">KPI tháng 11 (tạm tính)</div><div style="font-size:20px;font-weight:800">${tier.name}</div>
        <div class="small" style="margin-top:6px">Thưởng KPI dự kiến</div><div class="bold" style="font-size:18px;color:#15803d">${money(tier.amt)}</div></div></div>
    ${nxt ? `<div class="card mx mt"><div class="flex between"><span class="bold">Mục tiêu tiếp theo</span>${chip('Thưởng ' + tr(nxt.amt), 'c-green')}</div>
      <div class="bar mt"><i style="width:${Math.min(100, score / nxt.min * 100)}%"></i></div>
      <div class="small muted" style="margin-top:8px">Còn <b>${nxt.min - score} điểm</b> để đạt mức “${nxt.name}” (≥ ${nxt.min}).</div></div>` : ''}
    <div class="sec"><span>Chi tiết chỉ tiêu</span></div>
    <div class="card mx">${items.map(k => { const c = k.score >= 90 ? '#16a34a' : k.score >= 80 ? '#f59e0b' : '#ef4444'; return `<div class="kpi">
      <div class="top"><span>${k.label} <span class="muted small">· ${k.w}%</span></span><b style="color:${c}">${k.score}</b></div>
      <div class="bar"><i style="width:${k.score}%;background:${c}"></i></div><div class="small muted" style="margin-top:4px">${k.hint}</div></div>`; }).join('')}</div>
    <div class="sec"><span>Xu hướng 4 tháng</span></div>
    <div class="card mx"><div class="trend">${trend.map(t => `<div class="c ${t.cur ? 'cur' : ''}">${t.v}<i style="height:${(t.v - 50) * 1.6}px"></i><span>${t.m}</span></div>`).join('')}</div></div>
    <div class="note mx mt">${ic('trend', 'sm')}<span><b>Gợi ý:</b> cải thiện “${worst.label}” (${worst.score}đ) sẽ giúp tăng điểm nhanh nhất. ${worst.k === 'punctual' ? 'Đến kho trước 05:55 để được tính đi sớm.' : worst.k === 'fuel' ? 'Hạn chế chạy không tải, giữ tốc độ đều.' : ''}</span></div>`;
  }
  return `<div class="screen">${heroSimple('Chấm công & KPI', 'Theo dõi đi sớm, đi muộn và điểm thưởng')}
    ${seg([['att', 'Chấm công'], ['kpi', 'KPI']], UI.attTab, 'attTab')}${body}</div>`;
}

function screenFin() {
  const p = pay();
  let body;
  if (UI.finTab === 'exp') {
    const all = S.expenses.slice().sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    const valid = all.filter(e => e.status !== 'rejected');
    const list = all.filter(e => UI.fin === 'all' || e.cat === UI.fin);
    const tot = sum(valid, e => e.amount);
    const byCat = Object.keys(CAT).map(k => [k, sum(valid.filter(e => e.cat === k), e => e.amount)]).filter(x => x[1] > 0);
    let last = '', rows = '';
    list.forEach(e => {
      if (e.date !== last) { last = e.date; rows += `<div class="dayh">${e.date === MOCK_TODAY ? 'Hôm nay' : WD[dowOf(e.date)]} · ${dmy(e.date)}</div>`; }
      const c = CAT[e.cat], s = EXP_ST[e.status];
      rows += `<div class="card exp"><span class="tile" style="background:${c.color}">${ic(c.ic)}</span>
        <div class="grow"><div class="bold ellip">${esc(e.title)}</div><div class="small muted ellip">${esc(e.place || c.label)} · ${e.time}${e.receipt ? ' · có HĐ' : ''}</div>
        ${e.reason ? `<div class="small" style="color:#b91c1c">${esc(e.reason)}</div>` : ''}</div>
        <div class="right"><div class="bold">${money(e.amount)}</div>${chip(s[0], s[1])}</div></div>`;
    });
    body = `<div class="card mx mt">
      <div class="flex between"><div><div class="small muted">Tổng chi phí tháng 11</div><div class="bigtime">${money(tot)}</div></div></div>
      <div class="stack mt">${byCat.map(([k, v]) => `<i style="flex:${v};background:${CAT[k].color}"></i>`).join('')}</div>
      <div class="legend">${byCat.map(([k, v]) => `<span><i style="background:${CAT[k].color};border-radius:50%"></i>${CAT[k].label} ${Math.round(v / tot * 100)}%</span>`).join('')}</div>
      <div class="divider"></div>
      <div class="flex between small"><span>${chip('Chờ duyệt', 'c-amber')} <b>${money(sum(all.filter(e => e.status === 'pending'), e => e.amount))}</b></span>
        <span>${chip('Đã duyệt', 'c-green')} <b>${money(p.reimb)}</b></span></div></div>
    <div class="chips">${[['all', 'Tất cả']].concat(Object.entries(CAT).map(([k, v]) => [k, v.label])).map(([k, l]) => `<button class="fchip ${UI.fin === k ? 'on' : ''}" data-a="fin" data-v="${k}">${l}</button>`).join('')}</div>
    <div class="list mt">${rows || '<div class="card empty">Chưa có chi phí nào</div>'}</div>`;
  } else {
    const adv = S.advances;
    const line = (l, v, cls = '') => `<div class="kv"><span>${l}</span><b class="${cls}">${v}</b></div>`;
    body = `<div class="card net mx mt"><div class="small" style="color:#b8c4d9">Thực nhận dự kiến – tháng 11/2026</div><div class="bigtime">${money(p.net)}</div>
      <div class="small" style="color:#b8c4d9;margin-top:4px">Chốt lương ngày 05/12 · số liệu tạm tính</div></div>
    <div class="sec"><span>Chi tiết thu nhập</span></div>
    <div class="card mx">
      ${line('Lương cơ bản', money(SALARY.base))}${line(`Phụ cấp chuyến (${p.done} chuyến)`, money(p.trips))}
      ${line('Phụ cấp độc hại', money(SALARY.hazard))}${line(`Thưởng KPI (${p.tier.name})`, money(p.tier.amt))}
      ${line('Hoàn chi phí đã duyệt', '+' + money(p.reimb))}<div class="divider" style="margin:6px 0"></div>
      ${line('BHXH, BHYT, BHTN (10,5%)', '−' + money(p.ins), 'red')}${line('Đã tạm ứng', '−' + money(p.adv))}</div>
    <div class="sec"><span>Tạm ứng</span><button data-a="sheet" data-v="advance">+ Xin tạm ứng</button></div>
    <div class="list">${adv.map(a => `<div class="card exp"><span class="tile" style="background:#0ea5e9">${ic('dollar')}</span>
      <div class="grow"><div class="bold">${esc(a.reason)}</div><div class="small muted">${dmy(a.date)}/2026</div></div>
      <div class="right"><div class="bold">${money(a.amount)}</div>${a.status === 'paid' ? chip('Đã chi', 'c-green') : chip('Chờ duyệt', 'c-amber')}</div></div>`).join('')}</div>`;
  }
  return `<div class="screen">${heroSimple('Tài chính', 'Chi phí, hóa đơn & lương')}
    ${seg([['exp', 'Chi phí'], ['pay', 'Lương & tạm ứng']], UI.finTab, 'finTab')}${body}</div>
    ${UI.finTab === 'exp' ? `<div class="cta"><button class="btn block" data-a="sheet" data-v="expense">${ic('plus', 'sm')}Thêm chi phí / hóa đơn</button></div>` : ''}`;
}

function screenLearn() {
  let body;
  if (UI.learnTab === 'courses') {
    const min = LEARN_BASE_MIN + S.learnExtra, req = S.courses.filter(c => c.required && courseDone(c) < c.lessons.length).length;
    body = `<div class="card mx mt"><div class="flex between"><span class="bold">Giờ học tháng 11</span><b>${(min / 60).toFixed(1).replace('.', ',')} / ${LEARN_GOAL_MIN / 60} giờ</b></div>
      <div class="bar mt"><i style="width:${Math.min(100, min / LEARN_GOAL_MIN * 100)}%"></i></div>
      <div class="small muted" style="margin-top:8px">${req ? `Còn <b>${req} khóa bắt buộc</b> chưa hoàn thành.` : 'Bạn đã hoàn thành mọi khóa bắt buộc.'}</div></div>
    <div class="sec"><span>Khóa học của bạn</span></div>
    <div class="list">${S.courses.map(c => { const d = courseDone(c), n = c.lessons.length, pct = Math.round(d / n * 100), left = c.due ? daysBetween(MOCK_TODAY, c.due) : null;
      return `<button class="card course" data-a="go" data-v="/learn/${c.id}"><span class="tile" style="background:${c.color}">${ic(c.icon)}</span>
        <div class="grow"><div class="flex wrap" style="gap:6px;margin-bottom:4px">${c.required ? chip('Bắt buộc', 'c-red') : chip('Tự chọn', 'c-gray')}${pct === 100 ? chip('Hoàn thành', 'c-green') : left !== null ? chip('Hạn ' + dmy(c.due) + ' · ' + left + ' ngày', left <= 30 ? 'c-amber' : 'c-gray') : ''}</div>
        <div class="bold">${c.title}</div>
        <div class="bar" style="margin:8px 0 4px"><i style="width:${pct}%;background:${pct === 100 ? '#16a34a' : '#f59e0b'}"></i></div>
        <div class="small muted">${d}/${n} bài · ${pct}%</div></div></button>`; }).join('')}</div>`;
  } else {
    body = `<div class="sec" style="margin-top:16px"><span>Chứng chỉ & giấy tờ</span></div><div class="list">${CERTS.map(c => {
      const d = certDays(c), s = d < 0 ? ['Hết hạn', 'c-red'] : d <= 60 ? ['Sắp hết hạn', 'c-amber'] : ['Còn hạn', 'c-green'];
      return `<div class="card"><div class="flex between" style="align-items:flex-start"><div class="bold grow">${c.name}</div>${chip(s[0], s[1])}</div>
        <div class="small muted">Số: ${c.no} · hết hạn ${c.exp.slice(8)}/${c.exp.slice(5, 7)}/${c.exp.slice(0, 4)}</div>
        <div class="bar mt"><i style="width:${Math.max(4, Math.min(100, d / 730 * 100))}%;background:${d <= 60 ? '#f59e0b' : '#16a34a'}"></i></div>
        <div class="small" style="margin-top:6px;font-weight:700;color:${d <= 60 ? '#b45309' : 'var(--muted)'}">Còn ${d} ngày</div>
        ${c.renew ? `<button class="btn sm block" style="margin-top:10px" data-a="toast" data-v="Đã gửi yêu cầu gia hạn ADR cho phòng nhân sự">Đăng ký gia hạn</button>` : ''}</div>`; }).join('')}</div>`;
  }
  return `<div class="screen">${heroSimple('Học tập', 'Đào tạo an toàn & chứng chỉ')}
    ${seg([['courses', 'Khóa học'], ['certs', 'Chứng chỉ']], UI.learnTab, 'learnTab')}${body}</div>`;
}

function screenCourse(id) {
  const c = S.courses.find(x => x.id === id);
  if (!c) return `<div class="screen">${heroSimple('Không tìm thấy khóa học', '')}</div>`;
  const d = courseDone(c), n = c.lessons.length, nx = courseNext(c);
  const typeIc = { video: 'play', read: 'doc', quiz: 'clip' };
  return `<div class="screen"><div class="hero"><button class="back" data-a="go" data-v="/learn">${ic('chev', 'xs')}Học tập</button>
    <div class="row"><div class="grow"><h1 style="font-size:18px">${c.title}</h1><div class="sub">${d}/${n} bài · ${sum(c.lessons, l => l.min)} phút</div></div></div>
    <div class="bar" style="margin-top:12px;background:rgba(255,255,255,.2)"><i style="width:${d / n * 100}%"></i></div></div>
    <div class="sec"><span>Nội dung khóa học</span>${c.required ? chip('Bắt buộc', 'c-red') : ''}</div>
    <div class="card mx" style="padding:4px 14px">${c.lessons.map((l, i) => `<button class="lesson ${l.done ? 'done' : ''}" data-a="lesson" data-v="${c.id}" data-v2="${i}">
      <span class="ck">${l.done ? ic('check', 'xs') : ''}</span><div class="grow"><div class="bold" style="font-size:14px">${i + 1}. ${l.t}</div>
      <div class="small muted flex" style="gap:5px">${ic(typeIc[l.type], 'xs')}${{ video: 'Video', read: 'Bài đọc', quiz: 'Kiểm tra' }[l.type]} · ${l.min} phút</div></div></button>`).join('')}</div></div>
    <div class="cta">${nx >= 0 ? `<button class="btn block" data-a="lesson" data-v="${c.id}" data-v2="${nx}">${ic('play', 'sm')}Học tiếp: bài ${nx + 1}</button>`
      : `<div class="card flex" style="justify-content:center;color:#15803d;font-weight:800">${ic('check')}Đã hoàn thành khóa học</div>`}</div>`;
}

function screenMe() {
  const v = DRIVER.vehicle, vc = vcDone(), kmLeft = v.nextService - v.odo;
  const row = (icn, color, t, sub, act, val, tag = 'button') => `<${tag} class="mrow" ${act}><span class="tile" style="background:${color}">${ic(icn)}</span>
    <div class="grow"><div class="bold">${t}</div><div class="small muted">${sub}</div></div>${val || ''}${ic('chev', 'sm chev')}</${tag}>`;
  return `<div class="screen"><div class="hero" style="padding-bottom:26px"><div class="row"><div class="avatar big">NH</div>
    <div class="grow"><h1>${DRIVER.name}</h1><div class="sub">Mã NV ${DRIVER.id} · ${DRIVER.team}</div>
    <div class="flex" style="margin-top:8px;gap:6px">${chip(ic('star', 'xs') + DRIVER.rating, 'on-dark')}${chip('Hạng FC', 'on-dark')}${chip('Từ ' + DRIVER.since, 'on-dark')}</div></div></div></div>
  <div class="card mx" style="margin-top:-16px;position:relative"><div class="stats3"><div><b>${DRIVER.trips}</b><span>Chuyến năm nay</span></div><div><b>${fmt(DRIVER.km)}</b><span>Km an toàn</span></div><div><b>${DRIVER.incidents}</b><span>Sự cố</span></div></div></div>

  <div class="sec"><span>Thông tin cá nhân</span></div>
  <div class="card mx"><div class="kv"><span>Điện thoại</span><b>${DRIVER.phone}</b></div><div class="kv"><span>Ngày sinh</span><b>${DRIVER.dob}</b></div><div class="kv"><span>Công ty</span><b>${DRIVER.company}</b></div></div>

  <div class="sec"><span>Phương tiện được giao</span></div>
  <div class="card mx"><div class="flex"><span class="tile" style="background:#0b1b33">${ic('truck')}</span><div class="grow"><div class="bold" style="font-size:16px">${v.plate}</div><div class="small muted">${v.model}</div></div></div>
    <div class="flex wrap" style="margin-top:10px;gap:6px">${v.compartments.map((q, i) => chip(`K${i + 1}: ${fmt(q)}L`, 'c-blue')).join('')}</div>
    <div class="divider"></div><div class="kv"><span>Hạn đăng kiểm</span><b>${v.registry.slice(8)}/${v.registry.slice(5, 7)}/${v.registry.slice(0, 4)}</b></div>
    <div class="kv"><span>Bảo dưỡng tiếp theo</span><b>${fmt(v.nextService)} km <span class="muted small">(còn ${fmt(kmLeft)})</span></b></div></div>

  <div class="sec"><span>Công việc khác</span></div>
  <div class="card mx menu">
    ${row('clip', '#16a34a', 'Kiểm tra xe trước chuyến', 'Checklist 8 hạng mục an toàn', 'data-a="sheet" data-v="vcheck"', vc === 8 ? chip('Xong', 'c-green') : chip(vc + '/8', 'c-amber'))}
    ${row('alert', '#dc2626', 'Báo sự cố / hao hụt', 'Tai nạn, rò rỉ, thiếu hàng, hỏng xe', 'data-a="sheet" data-v="incident"')}
    ${row('cal', '#7c3aed', 'Xin nghỉ phép', 'Gửi đơn cho điều độ duyệt', 'data-a="sheet" data-v="leave"')}
    ${row('doc', '#0ea5e9', 'Giấy tờ & chứng chỉ', 'GPLX, ADR, PCCC, khám sức khỏe', 'data-a="certs"')}
    ${row('phone', '#2563eb', 'Gọi điều độ', DRIVER.dispatcher.name + ' · ' + DRIVER.dispatcher.phone, `href="tel:${DRIVER.dispatcher.phone}"`, '', 'a')}
    ${row('alert', '#b91c1c', 'SOS khẩn cấp', 'Cứu hỏa 114 · Cấp cứu 115 · Công an 113', 'data-a="sheet" data-v="sos"')}
  </div>
  ${S.requests.length ? `<div class="sec"><span>Yêu cầu đã gửi</span></div><div class="list">${S.requests.slice().reverse().map(r => `<div class="card flex"><span class="tile" style="background:${r.kind === 'leave' ? '#7c3aed' : '#dc2626'}">${ic(r.kind === 'leave' ? 'cal' : 'alert')}</span>
    <div class="grow"><div class="bold">${esc(r.title)}</div><div class="small muted ellip">${esc(r.detail || '')}</div></div>${chip('Đã gửi', 'c-amber')}</div>`).join('')}</div>` : ''}
  <div class="sec"><span>Hệ thống</span></div>
  <div class="card mx menu">
    ${row('refresh', '#64748b', 'Đặt lại dữ liệu demo', 'Khôi phục toàn bộ dữ liệu mock ban đầu', 'data-a="reset"')}
    ${row('out', '#64748b', 'Đăng xuất', 'DriverOS v1.0 (demo)', 'data-a="toast" data-v="Đây là bản demo – không đăng xuất thật"')}
  </div></div>`;
}

/* ================= Sheets ================= */
const optRadio = (name, list, block) => `<div class="opts">${list.map(([v, l, icn], i) => `<label class="opt ${block ? 'block' : ''}"><input type="radio" name="${name}" value="${v}" ${i === 0 ? 'checked' : ''}><span>${icn ? ic(icn, 'xs') : ''}${l}</span></label>`).join('')}</div>`;
const photoField = label => `<div class="field"><label class="photo"><input type="checkbox" name="photo">${ic('camera')}<span>${label}</span></label></div>`;

function sheetBody() {
  const { name, arg } = UI.sheet;
  if (name === 'expense') return `<h2>Thêm chi phí</h2><div class="muted small">Gửi điều độ duyệt hoàn ứng</div><form data-form="expense">
    <div class="field"><label class="t">Loại chi phí</label>${optRadio('cat', Object.entries(CAT).map(([k, c]) => [k, c.label, c.ic]))}</div>
    <div class="field"><label class="t">Số tiền (đ)</label><input type="number" name="amount" inputmode="numeric" min="1000" placeholder="VD: 60000" required></div>
    <div class="field"><label class="t">Nội dung</label><input type="text" name="title" placeholder="VD: Cơm trưa tại quán..." maxlength="80"></div>
    ${photoField('Chụp / đính kèm hóa đơn')}<button class="btn block" style="margin-top:18px">Gửi duyệt</button></form>`;
  if (name === 'advance') return `<h2>Xin tạm ứng</h2><div class="muted small">Sẽ được trừ vào lương tháng này</div><form data-form="advance">
    <div class="field"><label class="t">Số tiền (đ)</label><input type="number" name="amount" inputmode="numeric" min="100000" step="50000" placeholder="VD: 1000000" required></div>
    <div class="field"><label class="t">Lý do</label><input type="text" name="reason" placeholder="VD: Công tác phí đợt 2" maxlength="80"></div>
    <button class="btn block" style="margin-top:18px">Gửi yêu cầu</button></form>`;
  if (name === 'incident') return `<h2>Báo sự cố</h2><div class="muted small">Điều độ sẽ nhận thông báo ngay</div><form data-form="incident">
    <div class="field"><label class="t">Loại sự cố</label>${optRadio('type', [['Hỏng xe / sự cố kỹ thuật', 'Hỏng xe / sự cố kỹ thuật', 'tool'], ['Rò rỉ / tràn dầu', 'Rò rỉ / tràn dầu', 'droplet'], ['Hao hụt / thiếu hàng', 'Hao hụt / thiếu hàng', 'fuel'], ['Tai nạn giao thông', 'Tai nạn giao thông', 'alert'], ['Khác', 'Khác', 'info']], true)}</div>
    <div class="field"><label class="t">Mô tả</label><textarea name="detail" rows="3" placeholder="Xảy ra ở đâu, tình trạng hiện tại..."></textarea></div>
    ${photoField('Đính kèm ảnh hiện trường')}<button class="btn red block" style="margin-top:18px">Gửi báo cáo</button></form>`;
  if (name === 'leave') return `<h2>Xin nghỉ phép</h2><form data-form="leave">
    <div class="field"><label class="t">Từ ngày</label><input type="date" name="from" value="2026-11-16" required></div>
    <div class="field"><label class="t">Đến ngày</label><input type="date" name="to" value="2026-11-16" required></div>
    <div class="field"><label class="t">Lý do</label><select name="reason"><option>Việc gia đình</option><option>Ốm / khám sức khỏe</option><option>Học / thi chứng chỉ</option><option>Khác</option></select></div>
    <button class="btn block" style="margin-top:18px">Gửi đơn</button></form>`;
  if (name === 'sos') return `<h2 style="color:#b91c1c">SOS khẩn cấp</h2><div class="muted small">Dừng xe ở nơi an toàn, tắt máy trước khi gọi.</div>
    ${[['Cứu hỏa', '114', '#dc2626', 'alert'], ['Cấp cứu', '115', '#16a34a', 'shield'], ['Công an / CSGT', '113', '#2563eb', 'shield'], ['Điều độ – ' + DRIVER.dispatcher.name, DRIVER.dispatcher.phone, '#0b1b33', 'phone']]
      .map(([l, n, c, i]) => `<a class="sosrow" href="tel:${n}"><span class="tile" style="background:${c}">${ic(i)}</span>${l}<span class="n">${n}</span></a>`).join('')}
    <button class="btn ghost block" style="margin-top:14px" data-a="sendloc">${ic('pin', 'sm')}Gửi vị trí hiện tại cho điều độ</button>`;
  if (name === 'vcheck') { const d = vcDone(), all = d === VCHECK_ITEMS.length;
    return `<h2>Kiểm tra xe trước chuyến</h2><div class="muted small">${DRIVER.vehicle.plate} · ${d}/${VCHECK_ITEMS.length} hạng mục</div><div class="bar mt"><i style="width:${d / VCHECK_ITEMS.length * 100}%;background:#16a34a"></i></div>
    <div style="margin-top:6px">${VCHECK_ITEMS.map((t, i) => `<button class="chk ${S.vcheck[i] ? 'on' : ''}" data-a="vc" data-v="${i}"><span class="box">${S.vcheck[i] ? ic('check', 'xs') : ''}</span><span>${t}</span></button>`).join('')}</div>
    <button class="btn ${all ? 'green' : 'ghost'} block" style="margin-top:12px" data-a="${all ? 'closeSheet' : 'vcAll'}">${all ? 'Hoàn tất – xe đủ điều kiện chạy' : 'Đánh dấu tất cả đã kiểm tra'}</button>`; }
  if (name === 'quiz') { const [cid, li] = arg.split(':'), c = S.courses.find(x => x.id === cid);
    return `<h2>${c.lessons[li].t}</h2><div class="muted small">Cần đúng ít nhất 2/3 câu để hoàn thành</div><form data-form="quiz" data-c="${cid}" data-l="${li}">
    ${c.quiz.map((q, i) => `<div class="field"><label class="t">${i + 1}. ${q.q}</label><div style="display:flex;flex-direction:column;gap:8px">${q.o.map((o, k) => `<label class="opt block"><input type="radio" name="q${i}" value="${k}" required><span>${o}</span></label>`).join('')}</div></div>`).join('')}
    <button class="btn block" style="margin-top:18px">Nộp bài</button></form>`; }
  return '';
}
function showSheet(still) {
  const w = $('#sheet');
  if (!UI.sheet) { w.hidden = true; w.innerHTML = ''; return; }
  const sc = still ? ($('.sheet', w) || {}).scrollTop : 0;
  w.hidden = false;
  w.innerHTML = `<div class="backdrop" data-a="closeSheet" ${still ? 'style="animation:none"' : ''}></div><div class="sheet" ${still ? 'style="animation:none"' : ''}><div class="grab"></div>
    <button class="x" data-a="closeSheet" aria-label="Đóng">${ic('x', 'sm')}</button>${sheetBody()}</div>`;
  if (still) $('.sheet', w).scrollTop = sc;
}

/* ================= Router & render ================= */
const NAV = [['home', 'Trang chủ', 'home'], ['jobs', 'Công việc', 'truck'], ['att', 'Chấm công', 'clock'], ['fin', 'Tài chính', 'wallet'], ['learn', 'Học tập', 'book'], ['me', 'Cá nhân', 'user']];
let lastRoute = null;
function route() { const p = (location.hash.replace(/^#\/?/, '') || 'home').split('/'); return { tab: NAV.some(n => n[0] === p[0]) ? p[0] : 'home', id: p[1] }; }
function render() {
  const r = route(), v = $('#view'), key = r.tab + '/' + (r.id || '');
  const y = v.scrollTop;
  const html = r.tab === 'home' ? screenHome() : r.tab === 'jobs' ? (r.id ? screenJob(r.id) : screenJobs()) : r.tab === 'att' ? screenAtt()
    : r.tab === 'fin' ? screenFin() : r.tab === 'learn' ? (r.id ? screenCourse(r.id) : screenLearn()) : screenMe();
  v.innerHTML = html;
  v.scrollTop = key === lastRoute ? y : 0; lastRoute = key;
  const pendingJobs = S.jobs.some(j => j.date === MOCK_TODAY && j.status === 0);
  $('#nav').innerHTML = NAV.map(([k, l, i]) => `<button class="${r.tab === k ? 'on' : ''}" data-a="go" data-v="/${k}" aria-label="${l}"><span class="iw">${ic(i)}${k === 'jobs' && pendingJobs ? '<i class="dot"></i>' : ''}</span>${l}</button>`).join('');
}
const refresh = () => { save(); render(); if (UI.sheet) showSheet(true); };
let tt;
function toast(msg) { const t = $('#toast'); t.innerHTML = ic('check', 'sm') + `<span>${esc(msg)}</span>`; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2400); }

/* ================= Actions ================= */
const ACT = {
  go: v => { if (location.hash === '#' + v) render(); else location.hash = v; },
  toast: v => toast(v),
  jobTab: v => { UI.jobTab = v; render(); },
  attTab: v => { UI.attTab = v; render(); },
  finTab: v => { UI.finTab = v; render(); },
  learnTab: v => { UI.learnTab = v; render(); },
  fin: v => { UI.fin = v; render(); },
  selDay: v => { UI.selDay = +v; render(); },
  certs: () => { UI.learnTab = 'certs'; location.hash = '#/learn'; render(); },
  sheet: v => { UI.sheet = { name: v }; showSheet(); },
  closeSheet: () => { UI.sheet = null; showSheet(); },
  checkin: () => { S.att[12] = { in: nowHM(), out: null }; refresh(); toast('Đã chấm công vào ca lúc ' + nowHM()); },
  checkout: () => { S.att[12].out = nowHM(); refresh(); toast('Đã chấm công ra ca lúc ' + nowHM()); },
  undoshift: () => { S.att[12] = { in: '05:54', out: null }; refresh(); toast('Đã hoàn tác'); },
  advance: v => {
    const j = S.jobs.find(x => x.id === v); j.status++;
    const msg = ['', 'Đã nhận chuyến ' + j.id, 'Bắt đầu lấy hàng tại ' + j.from.name, 'Đã xuất bến – chúc lái xe thượng lộ bình an', 'Đã tới điểm giao – nhớ nối dây tiếp địa', 'Hoàn tất chuyến! +' + money(j.fee)][j.status];
    refresh(); toast(msg);
  },
  chk: (v, i) => { const j = S.jobs.find(x => x.id === v); j.checks[+i].done = !j.checks[+i].done; refresh(); },
  vc: v => { S.vcheck[+v] = !S.vcheck[+v]; refresh(); },
  vcAll: () => { S.vcheck = VCHECK_ITEMS.map(() => true); refresh(); toast('Xe đã kiểm tra đầy đủ'); },
  lesson: (cid, i) => {
    const c = S.courses.find(x => x.id === cid), l = c.lessons[+i];
    if (l.done) return toast('Bài này đã hoàn thành');
    if (l.type === 'quiz' && c.quiz) { UI.sheet = { name: 'quiz', arg: cid + ':' + i }; return showSheet(); }
    l.done = true; S.learnExtra += l.min; refresh(); toast(`Hoàn thành bài: ${l.t}`);
  },
  sendloc: () => { UI.sheet = null; showSheet(); toast('Đã gửi vị trí GPS cho điều độ'); },
  reset: () => { S = defaultState(); save(); render(); toast('Đã khôi phục dữ liệu demo'); }
};
const FORMS = {
  expense: fd => {
    const amount = +fd.get('amount'); if (!(amount > 0)) return;
    const cat = fd.get('cat');
    S.expenses.push({ id: 'e' + Date.now(), date: MOCK_TODAY, time: nowHM(), cat, title: (fd.get('title') || '').trim() || CAT[cat].label, place: 'Nhập từ ứng dụng', amount, status: 'pending', receipt: !!fd.get('photo') });
    UI.sheet = null; UI.fin = 'all'; UI.finTab = 'exp'; refresh(); showSheet(); toast('Đã gửi chi phí – chờ duyệt');
  },
  advance: fd => {
    const amount = +fd.get('amount'); if (!(amount > 0)) return;
    S.advances.push({ id: 'a' + Date.now(), date: MOCK_TODAY, amount, reason: (fd.get('reason') || '').trim() || 'Tạm ứng', status: 'pending' });
    UI.sheet = null; refresh(); showSheet(); toast('Đã gửi yêu cầu tạm ứng');
  },
  incident: fd => {
    S.requests.push({ kind: 'incident', title: fd.get('type'), detail: (fd.get('detail') || '').trim() || 'Không có mô tả' });
    UI.sheet = null; refresh(); showSheet(); toast('Đã báo sự cố cho điều độ');
  },
  leave: fd => {
    S.requests.push({ kind: 'leave', title: 'Xin nghỉ ' + dmy(fd.get('from')) + (fd.get('to') !== fd.get('from') ? ' → ' + dmy(fd.get('to')) : ''), detail: fd.get('reason') });
    UI.sheet = null; refresh(); showSheet(); toast('Đã gửi đơn xin nghỉ phép');
  },
  quiz: (fd, f) => {
    const c = S.courses.find(x => x.id === f.dataset.c), li = +f.dataset.l;
    const ok = c.quiz.filter((q, i) => +fd.get('q' + i) === q.a).length, pass = ok >= 2;
    if (pass) { c.lessons[li].done = true; S.learnExtra += c.lessons[li].min; save(); }
    const sh = $('.sheet'); const body = `<div style="text-align:center;padding:18px 0 6px"><div class="tile" style="width:64px;height:64px;border-radius:50%;margin:0 auto 12px;background:${pass ? '#16a34a' : '#dc2626'}">${ic(pass ? 'check' : 'x', 'lg')}</div>
      <h2>${pass ? 'Đạt yêu cầu!' : 'Chưa đạt'}</h2><div class="muted">Bạn trả lời đúng ${ok}/${c.quiz.length} câu.</div></div>
      <button class="btn block" style="margin-top:16px" data-a="${pass ? 'closeSheet' : 'lesson'}" ${pass ? '' : `data-v="${c.id}" data-v2="${li}"`}>${pass ? 'Tiếp tục' : 'Làm lại'}</button>`;
    sh.innerHTML = `<div class="grab"></div><button class="x" data-a="closeSheet">${ic('x', 'sm')}</button>` + body;
    if (pass) render();
  }
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  const fn = ACT[el.dataset.a]; if (fn) fn(el.dataset.v, el.dataset.v2);
});
document.addEventListener('submit', e => {
  const f = e.target.closest('form[data-form]'); if (!f) return;
  e.preventDefault(); FORMS[f.dataset.form](new FormData(f), f);
});
window.addEventListener('hashchange', () => { UI.sheet = null; showSheet(); render(); });
setInterval(() => {
  const c = $('#clk'); if (c) c.textContent = clockStr();
  const w = $('#worked'), r = S.att[12]; if (w && r && r.in && !r.out) w.textContent = 'Đang trong ca · đã làm ' + hm(nowMin() - toMin(r.in));
}, 1000);

render();
