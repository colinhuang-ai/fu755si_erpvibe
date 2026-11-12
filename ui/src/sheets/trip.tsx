import { useEffect, useRef, useState } from 'react';
import { Camera, Check } from 'lucide-react';
import { LOAD_DEV_LIMIT, LOSS_LIMIT } from '../data/mock';
import { fmt, pct, sum } from '../lib/format';
import { useStore } from '../store';
import { Btn, Cell, Group, Pill, Segmented } from '../ui/kit';
import { SheetHeader, useUI } from '../ui/overlay';

const REASONS = ['Xe không đủ điều kiện', 'Vượt giờ lái cho phép', 'Sức khỏe không đảm bảo', 'Trùng lịch chuyến khác', 'Khác'];

export function RejectSheet({ id }: { id: string }) {
  const { update } = useStore();
  const { closeSheet, toast } = useUI();
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const send = () => {
    update(d => { const j = d.jobs.find(x => x.id === id); if (j) j.rejected = { reason, note: note.trim() || undefined }; });
    toast('Đã từ chối · điều phối sẽ phân công lại', 'info');
    closeSheet();
  };
  return (
    <>
      <SheetHeader title="Từ chối chuyến" right="Gửi" onRight={send} rightDisabled={!reason} />
      <div className="sheet-body">
        <Group header={`Lý do từ chối ${id}`}>
          {REASONS.map(r => <Cell key={r} title={r} onClick={() => setReason(r)} trailing={reason === r ? <Check className="tick" size={20} strokeWidth={2.8} /> : null} />)}
        </Group>
        <Group header="Ghi chú" footer="Lý do là bắt buộc để điều phối sắp xếp lại người và xe.">
          <div className="cell"><textarea className="cell-area" value={note} onChange={e => setNote(e.target.value)} placeholder="Không bắt buộc" /></div>
        </Group>
      </div>
    </>
  );
}

/** Ô ký tên trên màn hình */
function SignaturePad({ onSigned }: { onSigned: (v: boolean) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [has, setHas] = useState(false);
  useEffect(() => {
    const c = ref.current!; const r = c.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1;
    c.width = r.width * dpr; c.height = r.height * dpr;
    const ctx = c.getContext('2d')!; ctx.scale(dpr, dpr); ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = getComputedStyle(c).color;
  }, []);
  const pos = (e: React.PointerEvent) => { const r = ref.current!.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const down = (e: React.PointerEvent) => { drawing.current = true; ref.current!.setPointerCapture(e.pointerId); const ctx = ref.current!.getContext('2d')!; const [x, y] = pos(e); ctx.beginPath(); ctx.moveTo(x, y); };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = ref.current!.getContext('2d')!; const [x, y] = pos(e); ctx.lineTo(x, y); ctx.stroke();
    if (!has) { setHas(true); onSigned(true); }
  };
  const clear = () => { const c = ref.current!; c.getContext('2d')!.clearRect(0, 0, c.width, c.height); setHas(false); onSigned(false); };
  return (
    <div className="sig">
      <canvas ref={ref} onPointerDown={down} onPointerMove={move} onPointerUp={() => { drawing.current = false; }} />
      {!has && <span className="sig-ph">Người nhận ký tên tại đây</span>}
      {has && <button className="sig-clear" onClick={clear}>Xóa</button>}
    </div>
  );
}

/** Ghi nhận nạp hàng tại kho (mode=load) hoặc xả hàng & xác nhận tại điểm giao (mode=unload) */
export function LoadSheet({ id, mode }: { id: string; mode: 'load' | 'unload' }) {
  const { s, update } = useStore();
  const { closeSheet, toast } = useUI();
  const j = s.jobs.find(x => x.id === id)!;
  const bulk = j.cargo.every(c => c.unit === 'L');
  const [vals, setVals] = useState<string[]>(() => j.cargo.map(c => String(mode === 'load' ? c.qty : (c.loaded ?? c.qty))));
  const [seal, setSeal] = useState(j.seal ?? '');
  const [temp, setTemp] = useState('29,5');
  const [photo, setPhoto] = useState(false);
  const [reason, setReason] = useState('');
  const [method, setMethod] = useState<'otp' | 'sign' | 'photo'>('otp');
  const [otp, setOtp] = useState('');
  const [signed, setSigned] = useState(false);

  const nums = vals.map(v => Number(v.replace(/[^\d]/g, '')) || 0);
  const planned = sum(j.cargo, c => c.qty);
  const loadedTotal = sum(j.cargo, c => c.loaded ?? c.qty);
  const total = sum(nums, x => x);
  const dev = mode === 'load' ? (total - planned) / planned : bulk ? (loadedTotal - total) / loadedTotal : 0;
  const over = mode === 'load' ? Math.abs(dev) > LOAD_DEV_LIMIT : dev > LOSS_LIMIT;
  const confirmed = method === 'otp' ? otp.length >= 4 : method === 'sign' ? signed : photo;
  const valid = total > 0 && (!over || reason.trim().length > 4) && (mode === 'load' ? seal.trim().length > 0 : confirmed);

  const save = () => {
    update(d => {
      const x = d.jobs.find(y => y.id === id)!;
      x.cargo.forEach((c, i) => { if (mode === 'load') c.loaded = nums[i]; else c.delivered = nums[i]; });
      if (over) x.deviationNote = reason.trim();
      if (mode === 'load') { x.seal = seal.trim(); x.status = 3; }
      else {
        x.status = 5;
        x.confirmBy = method === 'otp' ? 'Mã OTP' : method === 'sign' ? 'chữ ký điện tử' : 'ảnh phiếu giao';
        x.checks.forEach(c => { if (c.ph === 'deliver') c.done = true; });
      }
    });
    toast(mode === 'load' ? 'Đã ghi nhận nạp hàng · xuất bến' : `Hoàn tất chuyến ${id}`);
    closeSheet();
  };

  const unit = bulk ? 'L' : 'thùng';
  return (
    <>
      <SheetHeader title={mode === 'load' ? 'Ghi nhận nạp hàng' : 'Xả hàng & xác nhận'} right={mode === 'load' ? 'Xuất bến' : 'Hoàn tất'} onRight={save} rightDisabled={!valid} />
      <div className="sheet-body">
        <Group header={`Lượng thực ${mode === 'load' ? 'nạp' : 'xả'} từng khoang (${unit})`}>
          {j.cargo.map((c, i) => (
            <Cell key={i} title={c.label} subtitle={`${c.item} · ${mode === 'load' ? 'lệnh' : 'đã nạp'} ${fmt(mode === 'load' ? c.qty : (c.loaded ?? c.qty))}`}
              trailing={<input className="cell-input short" inputMode="numeric" value={vals[i]} aria-label={c.label}
                onChange={e => setVals(v => v.map((x, k) => (k === i ? e.target.value : x)))} />} />
          ))}
        </Group>

        <Group footer={mode === 'load'
          ? `Chênh lệch so với lệnh xuất vượt ${pct(LOAD_DEV_LIMIT)} phải giải trình trước khi rời kho.`
          : `Hao hụt cho phép tối đa ${pct(LOSS_LIMIT)} lượng đã nạp.`}>
          <Cell title={mode === 'load' ? 'Tổng theo lệnh' : 'Tổng đã nạp'} detail={`${fmt(mode === 'load' ? planned : loadedTotal)} ${unit}`} />
          <Cell title={mode === 'load' ? 'Tổng thực nạp' : 'Tổng thực xả'} detail={`${fmt(total)} ${unit}`} />
          {bulk && <Cell title={mode === 'load' ? 'Chênh lệch' : 'Hao hụt'}
            detail={`${fmt(mode === 'load' ? total - planned : loadedTotal - total)} ${unit}`}
            trailing={<Pill tone={over ? 'red' : 'green'}>{pct(Math.abs(dev), 2)}</Pill>} />}
        </Group>

        {over && (
          <Group header="Giải trình bắt buộc" footerTone="red" footer="Điều phối và HSE sẽ được thông báo về chênh lệch này.">
            <div className="cell"><textarea className="cell-area" value={reason} onChange={e => setReason(e.target.value)} placeholder="Nguyên nhân chênh lệch…" /></div>
          </Group>
        )}

        {mode === 'load' ? (
          <Group header="Niêm phong & phiếu xuất">
            <Cell title="Số chì niêm phong" trailing={<input className="cell-input" placeholder="CT-000000" value={seal} onChange={e => setSeal(e.target.value)} />} />
            {bulk && <Cell title="Nhiệt độ hàng (°C)" trailing={<input className="cell-input short" inputMode="decimal" value={temp} onChange={e => setTemp(e.target.value)} />} />}
            <Cell icon={Camera} tint="var(--blue)" title={photo ? 'Đã chụp phiếu xuất kho' : 'Chụp phiếu xuất kho'} tone={photo ? undefined : 'blue'}
              trailing={photo ? <Check className="tick" size={20} strokeWidth={2.8} /> : null} onClick={() => setPhoto(p => !p)} />
          </Group>
        ) : (
          <section className="group">
            <div className="group-h">Người nhận xác nhận · {j.to.who}</div>
            <div style={{ marginBottom: 10 }}>
              <Segmented value={method} onChange={setMethod} options={[['otp', 'Mã OTP'], ['sign', 'Chữ ký'], ['photo', 'Ảnh phiếu']]} />
            </div>
            <div className="cells">
              {method === 'otp' && <Cell title="Mã OTP" trailing={<input className="cell-input otp" inputMode="numeric" maxLength={6} placeholder="••••" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} />} />}
              {method === 'sign' && <SignaturePad onSigned={setSigned} />}
              {method === 'photo' && <Cell icon={Camera} tint="var(--blue)" title={photo ? 'Đã chụp phiếu giao có chữ ký' : 'Chụp phiếu giao có chữ ký'} tone={photo ? undefined : 'blue'}
                trailing={photo ? <Check className="tick" size={20} strokeWidth={2.8} /> : null} onClick={() => setPhoto(p => !p)} />}
            </div>
            <div className="group-f">
              {method === 'otp' ? `Mã OTP đã gửi tới SĐT ${j.to.phone.replace(/(\d{4})(\d{3})(\d+)/, '$1 $2 $3')}. Bản demo: nhập 4 số bất kỳ.` : method === 'sign' ? 'Dùng khi người nhận không nhận được OTP.' : 'Dùng khi người nhận chỉ ký phiếu giấy.'}
            </div>
          </section>
        )}
        {mode === 'unload' && method === 'otp' && otp.length < 4 && (
          <div className="mx"><Btn block kind="gray" onClick={() => setOtp('2468')}>Điền mã OTP demo</Btn></div>
        )}
      </div>
    </>
  );
}
