import { useEffect, useState } from 'react';
import { Ambulance, Camera, Check, Flame, Phone, ShieldAlert, Siren, TriangleAlert } from 'lucide-react';
import { DRIVER, EMERGENCY_CARDS, VCHECK } from '../data/mock';
import { MOCK_TODAY, nowHM } from '../lib/clock';
import { vcCriticalLeft, vcDone } from '../lib/domain';
import { uid } from '../lib/format';
import { useStore } from '../store';
import { Btn, Cell, Group, ProgressBar, RCheck } from '../ui/kit';
import { SheetHeader, useUI } from '../ui/overlay';

export function VehicleCheckSheet() {
  const { s, update } = useStore();
  const { closeSheet, toast } = useUI();
  const left = vcCriticalLeft(s), done = vcDone(s);
  const finish = () => {
    if (!left) toast('Xe đủ điều kiện chạy chuyến');
    closeSheet();
  };
  return (
    <>
      <SheetHeader title="Kiểm tra xe trước chuyến" left={null} right="Xong" onRight={finish} />
      <div className="sheet-body">
        <div className="mx" style={{ marginBottom: 20 }}>
          <div className="row-b" style={{ marginBottom: 8 }}>
            <span className="bold">{DRIVER.vehicle.plate}</span>
            <span className="sum-sub">{done}/{VCHECK.length} hạng mục đạt</span>
          </div>
          <ProgressBar value={done / VCHECK.length} color={left ? 'var(--orange)' : 'var(--green)'} height={6} />
        </div>
        <Group footer={left ? `Còn ${left} hạng mục bắt buộc chưa đạt — chưa thể bắt đầu lấy hàng.` : 'Tất cả hạng mục bắt buộc đã đạt.'} footerTone={left ? 'red' : undefined}>
          {VCHECK.map((v, i) => (
            <Cell key={i} sepLeft={52} leading={<RCheck on={!!s.vcheck[i]} green />} title={v.t}
              subtitle={v.critical ? 'Bắt buộc' : 'Khuyến nghị'}
              onClick={() => update(d => { d.vcheck[i] = !d.vcheck[i]; })} />
          ))}
        </Group>
        <div className="mx">
          <Btn block kind="tinted" icon={Check} onClick={() => update(d => { d.vcheck = VCHECK.map(() => true); })}>Đánh dấu tất cả đạt</Btn>
        </div>
      </div>
    </>
  );
}

export function SosSheet() {
  const { s, update } = useStore();
  const { toast, confirm } = useUI();
  const [count, setCount] = useState<number | null>(null);
  const [sent, setSent] = useState(false);
  const active = s.jobs.find(j => j.date === MOCK_TODAY && j.status >= 1 && j.status < 5);

  useEffect(() => {
    if (count === null) return;
    if (count === 0) {
      setCount(null); setSent(true);
      update(d => { d.requests.push({ id: uid('r'), kind: 'sos', title: 'Tín hiệu SOS', detail: `Vị trí GPS${active ? ' · chuyến ' + active.id : ''}`, date: MOCK_TODAY, time: nowHM() }); });
      toast('Đã gửi SOS tới điều độ và HSE', 'error');
      return;
    }
    const t = setTimeout(() => setCount(c => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [count, active, toast, update]);

  return (
    <>
      <SheetHeader title="SOS khẩn cấp" left="Đóng" />
      <div className="sheet-body">
        <div className="sos-hero">
          {sent ? (
            <>
              <div className="sos-ring ok"><Check size={40} strokeWidth={3} /></div>
              <div className="bold">Đã gửi vị trí & thông tin chuyến</div>
              <div className="sum-sub">Điều độ {DRIVER.dispatcher.name} và HSE sẽ gọi lại ngay.</div>
            </>
          ) : count !== null ? (
            <>
              <button className="sos-ring counting" onClick={() => setCount(null)} aria-label="Hủy SOS"><b>{count}</b></button>
              <div className="bold">Đang gửi SOS sau {count} giây…</div>
              <Btn kind="gray" size="md" onClick={() => setCount(null)}>Hủy, tôi bấm nhầm</Btn>
            </>
          ) : (
            <>
              <button className="sos-ring" onClick={() => setCount(10)} aria-label="Gửi SOS"><Siren size={42} strokeWidth={2.2} /></button>
              <div className="bold">Chạm để gửi SOS</div>
              <div className="sum-sub">Gửi vị trí, xe {DRIVER.vehicle.plate}{active ? ` và chuyến ${active.id}` : ''}. Có 10 giây để hủy.</div>
            </>
          )}
        </div>
        <Group header="Gọi khẩn cấp" footer="Dừng xe ở nơi an toàn, tắt máy trước khi gọi.">
          <Cell icon={Flame} tint="var(--red)" title="Cứu hỏa" detail="114" href="tel:114" />
          <Cell icon={Ambulance} tint="var(--green)" title="Cấp cứu" detail="115" href="tel:115" />
          <Cell icon={ShieldAlert} tint="var(--blue)" title="Công an / CSGT" detail="113" href="tel:113" />
          <Cell icon={Phone} tint="var(--indigo)" title={`Điều độ · ${DRIVER.dispatcher.name}`} href={`tel:${DRIVER.dispatcher.phone}`} chevron />
          <Cell icon={Phone} tint="var(--orange)" title={DRIVER.hse.name} href={`tel:${DRIVER.hse.phone}`} chevron />
        </Group>
        <Group header="Thẻ xử lý khẩn cấp" footer="Dùng được cả khi mất sóng.">
          {EMERGENCY_CARDS.map(c => (
            <Cell key={c.t} icon={TriangleAlert} tint="var(--orange)" title={c.t} chevron onClick={() => confirm({ title: c.t, message: c.steps })} />
          ))}
        </Group>
      </div>
    </>
  );
}

const INCIDENTS = ['Hỏng xe / sự cố kỹ thuật', 'Rò rỉ / tràn dầu', 'Hao hụt / thiếu hàng', 'Sai số chì niêm phong', 'Tai nạn giao thông', 'Khác'];

export function IncidentSheet() {
  const { s, update } = useStore();
  const { closeSheet, toast } = useUI();
  const [type, setType] = useState(INCIDENTS[0]);
  const [desc, setDesc] = useState('');
  const [photo, setPhoto] = useState(false);
  const active = s.jobs.find(j => j.date === MOCK_TODAY && j.status >= 1 && j.status < 5);
  const send = () => {
    update(d => { d.requests.push({ id: uid('r'), kind: 'incident', title: type, detail: desc.trim() || 'Không có mô tả', date: MOCK_TODAY, time: nowHM() }); });
    toast('Đã báo sự cố cho điều độ');
    closeSheet();
  };
  return (
    <>
      <SheetHeader title="Báo sự cố" right="Gửi" onRight={send} />
      <div className="sheet-body">
        <Group header="Loại sự cố">
          {INCIDENTS.map(t => (
            <Cell key={t} title={t} onClick={() => setType(t)} trailing={type === t ? <Check className="tick" size={20} strokeWidth={2.8} /> : null} />
          ))}
        </Group>
        <Group header="Mô tả">
          <div className="cell"><textarea className="cell-area" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Xảy ra ở đâu, tình trạng hiện tại…" /></div>
        </Group>
        <Group footer={active ? `Sự cố sẽ được gắn với chuyến ${active.id} và vị trí GPS hiện tại.` : 'Sự cố sẽ được gắn với vị trí GPS hiện tại.'}>
          <Cell icon={Camera} tint="var(--blue)" title="Ảnh hiện trường" tone={photo ? undefined : 'blue'}
            detail={photo ? 'Đã đính kèm 1 ảnh' : undefined} onClick={() => setPhoto(p => !p)} />
        </Group>
      </div>
    </>
  );
}
