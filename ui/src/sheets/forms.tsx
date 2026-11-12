import { useState } from 'react';
import { Camera, Check } from 'lucide-react';
import { CATS, DRIVER, FOOD_LIMIT, FUEL_PRICE, NO_RECEIPT_LIMIT } from '../data/mock';
import { MOCK_TODAY, nowHM } from '../lib/clock';
import { kpiItems } from '../lib/domain';
import { fmt, money, sum, uid } from '../lib/format';
import { useStore } from '../store';
import type { ExpCat } from '../types';
import { Cell, Group, Switch, Tile } from '../ui/kit';
import { SheetHeader, useUI } from '../ui/overlay';
import { catIcon } from './catIcon';

const digits = (v: string) => Number(v.replace(/[^\d]/g, '')) || 0;
const decimal = (v: string) => Number(v.replace(',', '.').replace(/[^\d.]/g, '')) || 0;

export function MoneyInput({ value, onChange, placeholder = '0' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input className="cell-input" inputMode="numeric" placeholder={placeholder}
      value={value ? fmt(digits(value)) : ''} onChange={e => onChange(e.target.value)} />
  );
}

export function ExpenseSheet() {
  const { s, update } = useStore();
  const { closeSheet, toast } = useUI();
  const today = s.jobs.filter(j => j.date === MOCK_TODAY && !j.rejected);
  const active = today.find(j => j.status >= 1 && j.status < 5);
  const [cat, setCat] = useState<ExpCat>('food');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [place, setPlace] = useState('');
  const [lit, setLit] = useState('');
  const [price, setPrice] = useState(String(FUEL_PRICE));
  const [odo, setOdo] = useState(String(DRIVER.vehicle.odo));
  const [photo, setPhoto] = useState(false);
  const [vat, setVat] = useState(false);
  const [note, setNote] = useState('');
  const [job, setJob] = useState(active?.id ?? '');

  const amt = cat === 'fuel' ? Math.round(decimal(lit) * digits(price)) : digits(amount);
  const foodToday = sum(s.expenses.filter(e => e.date === MOCK_TODAY && e.cat === 'food' && e.status !== 'rejected'), e => e.amount);
  const overFood = cat === 'food' && amt > 0 && foodToday + amt > FOOD_LIMIT;
  const noReceipt = !photo && amt > NO_RECEIPT_LIMIT;
  const valid = amt > 0 && !noReceipt && (!overFood || note.trim().length > 2);

  const submit = () => {
    update(d => {
      d.expenses.push({
        id: uid('e'), date: MOCK_TODAY, time: nowHM(), cat,
        title: title.trim() || (cat === 'fuel' ? `Đổ dầu DO – ${lit} L` : CATS[cat].label),
        place: place.trim() || 'Nhập từ ứng dụng', amount: amt, status: 'pending', receipt: photo, vat,
        liters: cat === 'fuel' ? decimal(lit) : undefined, odo: cat === 'fuel' ? digits(odo) : undefined,
        jobId: job || undefined, overNote: overFood ? note.trim() : undefined
      });
    });
    toast('Đã gửi khoản chi · chờ duyệt');
    closeSheet();
  };

  return (
    <>
      <SheetHeader title="Khoản chi mới" right="Gửi" onRight={submit} rightDisabled={!valid} />
      <div className="sheet-body">
        <div className="cat-grid mx">
          {(Object.keys(CATS) as ExpCat[]).map(k => (
            <button key={k} className={`cat-b ${cat === k ? 'on' : ''}`} onClick={() => setCat(k)}>
              <Tile icon={catIcon(k)} color={CATS[k].color} />
              <span>{CATS[k].label}</span>
            </button>
          ))}
        </div>

        {cat === 'fuel' ? (
          <Group header="Đổ nhiên liệu" footer="Số km đồng hồ dùng để đối soát tiêu hao nhiên liệu với định mức.">
            <Cell title="Số lít" trailing={<input className="cell-input" inputMode="decimal" placeholder="0" value={lit} onChange={e => setLit(e.target.value)} />} />
            <Cell title="Đơn giá (₫/L)" trailing={<MoneyInput value={price} onChange={setPrice} />} />
            <Cell title="Đồng hồ km" trailing={<MoneyInput value={odo} onChange={setOdo} />} />
            <Cell title="Thành tiền" detail={<b style={{ color: 'var(--label)' }}>{money(amt)}</b>} />
          </Group>
        ) : (
          <Group header="Số tiền">
            <Cell title="Số tiền (₫)" trailing={<MoneyInput value={amount} onChange={setAmount} />} />
          </Group>
        )}

        <Group header="Chi tiết">
          <Cell title="Nội dung" trailing={<input className="cell-input" placeholder={cat === 'fuel' ? 'Đổ dầu DO' : 'VD: Cơm trưa'} value={title} onChange={e => setTitle(e.target.value)} />} />
          <Cell title="Nơi chi" trailing={<input className="cell-input" placeholder="Tên cửa hàng" value={place} onChange={e => setPlace(e.target.value)} />} />
          <Cell title="Gắn chuyến" chevron
            trailing={<><span className="cell-detail">{job || 'Không'}</span>
              <select className="cell-select" value={job} onChange={e => setJob(e.target.value)} aria-label="Gắn với chuyến">
                <option value="">Không gắn chuyến</option>
                {today.map(j => <option key={j.id} value={j.id}>{j.id} · {j.to.name}</option>)}
              </select></>} />
        </Group>

        <Group header="Hóa đơn" footer={noReceipt ? `Không có hóa đơn chỉ được chấp nhận với khoản dưới ${money(NO_RECEIPT_LIMIT)}.` : undefined} footerTone={noReceipt ? 'red' : undefined}>
          <Cell icon={Camera} tint="var(--blue)" title={photo ? 'Đã chụp ảnh hóa đơn' : 'Chụp ảnh hóa đơn'} tone={photo ? undefined : 'blue'}
            trailing={photo ? <Check className="tick" size={20} strokeWidth={2.8} /> : null} onClick={() => setPhoto(p => !p)} />
          <Cell title="Hóa đơn VAT" trailing={<Switch on={vat} onChange={setVat} label="Hóa đơn VAT" />} />
        </Group>

        {overFood && (
          <Group header="Giải trình vượt định mức" footerTone="red"
            footer={`Định mức ăn uống ${money(FOOD_LIMIT)}/ngày. Hôm nay đã chi ${money(foodToday)}. Khoản này sẽ cần quản lý duyệt.`}>
            <div className="cell"><textarea className="cell-area" value={note} onChange={e => setNote(e.target.value)} placeholder="Lý do vượt định mức…" /></div>
          </Group>
        )}
      </div>
    </>
  );
}

export function AdvanceSheet() {
  const { update } = useStore();
  const { closeSheet, toast } = useUI();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const amt = digits(amount);
  const send = () => {
    update(d => { d.advances.push({ id: uid('a'), date: MOCK_TODAY, amount: amt, reason: reason.trim() || 'Tạm ứng công tác phí', status: 'pending' }); });
    toast('Đã gửi yêu cầu tạm ứng');
    closeSheet();
  };
  return (
    <>
      <SheetHeader title="Xin tạm ứng" right="Gửi" onRight={send} rightDisabled={amt < 100000} />
      <div className="sheet-body">
        <Group footer="Tối thiểu 100.000 ₫. Khoản tạm ứng sẽ được trừ vào kỳ lương gần nhất.">
          <Cell title="Số tiền (₫)" trailing={<MoneyInput value={amount} onChange={setAmount} />} />
          <Cell title="Lý do" trailing={<input className="cell-input" placeholder="Công tác phí đợt 2" value={reason} onChange={e => setReason(e.target.value)} />} />
        </Group>
      </div>
    </>
  );
}

export function LeaveSheet() {
  const { update } = useStore();
  const { closeSheet, toast } = useUI();
  const [from, setFrom] = useState('2026-11-16');
  const [to, setTo] = useState('2026-11-16');
  const [type, setType] = useState('Phép năm');
  const [reason, setReason] = useState('');
  const days = Math.max(1, Math.round((Date.parse(to) - Date.parse(from)) / 864e5) + 1);
  const send = () => {
    update(d => { d.requests.push({ id: uid('r'), kind: 'leave', title: `${type} · ${days} ngày`, detail: `${from.slice(8)}/${from.slice(5, 7)} → ${to.slice(8)}/${to.slice(5, 7)}${reason ? ' · ' + reason : ''}`, date: MOCK_TODAY, time: nowHM() }); });
    toast('Đã gửi đơn nghỉ phép');
    closeSheet();
  };
  return (
    <>
      <SheetHeader title="Xin nghỉ phép" right="Gửi" onRight={send} rightDisabled={to < from} />
      <div className="sheet-body">
        <Group footer={`Phép năm còn lại: ${DRIVER.leaveLeft} ngày. Điều độ sẽ duyệt và sắp xếp người thay.`}>
          <Cell title="Từ ngày" trailing={<input type="date" className="cell-input" value={from} min={MOCK_TODAY} onChange={e => setFrom(e.target.value)} />} />
          <Cell title="Đến ngày" trailing={<input type="date" className="cell-input" value={to} min={from} onChange={e => setTo(e.target.value)} />} />
          <Cell title="Loại nghỉ" chevron trailing={<><span className="cell-detail">{type}</span>
            <select className="cell-select" value={type} onChange={e => setType(e.target.value)} aria-label="Loại nghỉ">
              {['Phép năm', 'Việc riêng', 'Ốm đau', 'Học / thi chứng chỉ'].map(x => <option key={x}>{x}</option>)}
            </select></>} />
          <Cell title="Số ngày" detail={days} />
        </Group>
        <Group header="Lý do">
          <div className="cell"><textarea className="cell-area" value={reason} onChange={e => setReason(e.target.value)} placeholder="Không bắt buộc" /></div>
        </Group>
      </div>
    </>
  );
}

export function ExplainSheet({ day }: { day: number }) {
  const { update } = useStore();
  const { closeSheet, toast } = useUI();
  const [text, setText] = useState('');
  const send = () => {
    update(d => { const r = d.att[String(day)]; if (r) { r.explain = 'pending'; r.explainText = text.trim(); } });
    toast('Đã gửi giải trình cho quản lý');
    closeSheet();
  };
  return (
    <>
      <SheetHeader title={`Giải trình ngày ${day}/11`} right="Gửi" onRight={send} rightDisabled={text.trim().length < 5} />
      <div className="sheet-body">
        <Group header="Lý do" footer="Quản lý đội sẽ xem xét. Nếu được duyệt, lần đi muộn/về sớm này không bị trừ điểm KPI.">
          <div className="cell"><textarea className="cell-area" autoFocus value={text} onChange={e => setText(e.target.value)} placeholder="VD: Kẹt xe do tai nạn trên cầu Phú Mỹ…" /></div>
        </Group>
      </div>
    </>
  );
}

export function ComplaintSheet() {
  const { s, update } = useStore();
  const { closeSheet, toast } = useUI();
  const items = kpiItems(s);
  const [k, setK] = useState(items[0].k);
  const [text, setText] = useState('');
  const send = () => {
    const it = items.find(x => x.k === k)!;
    update(d => { d.requests.push({ id: uid('r'), kind: 'complaint', title: `Khiếu nại: ${it.label}`, detail: text.trim(), date: MOCK_TODAY, time: nowHM() }); });
    toast('Đã gửi khiếu nại KPI');
    closeSheet();
  };
  return (
    <>
      <SheetHeader title="Khiếu nại KPI" right="Gửi" onRight={send} rightDisabled={text.trim().length < 5} />
      <div className="sheet-body">
        <Group header="Chỉ tiêu">
          {items.map(i => <Cell key={i.k} title={i.label} detail={i.score} onClick={() => setK(i.k)} trailing={<Check className="tick" size={20} strokeWidth={2.8} style={{ opacity: k === i.k ? 1 : 0 }} />} />)}
        </Group>
        <Group header="Nội dung" footer="Hạn gửi khiếu nại: 5 ngày sau khi chốt KPI tháng.">
          <div className="cell"><textarea className="cell-area" value={text} onChange={e => setText(e.target.value)} placeholder="Mô tả điểm chưa đúng, kèm bằng chứng nếu có…" /></div>
        </Group>
      </div>
    </>
  );
}
