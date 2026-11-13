import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleCheck, Circle, Plus, Trash2, UserRoundCog } from 'lucide-react';
import { useAuth } from '../auth';
import { CHECKS, DEPOTS, DRUM_PRESETS, feeFor, JOB_ST, LOSS_LIMIT, PRODUCTS } from '../lib/config';
import { cargoText, etaState, isBulk, lossOf } from '../lib/domain';
import { dmy, fmt, hm, money, pct, TODAY } from '../lib/format';
import { useQuery } from '../lib/query';
import { must, sb } from '../lib/supabase';
import type { Driver, Job } from '../types';
import { Btn, Drawer, Field, Loading, Modal, Pill, Segmented } from '../ui/kit';
import { useFeedback } from '../ui/feedback';

export const JOB_SELECT = '*, drivers(full_name, code), job_cargo(*), job_checks(*)';

export function StatusPill({ j }: { j: Job }) {
  if (j.rejected_reason) return <Pill tone="red">Bị từ chối</Pill>;
  const s = JOB_ST[j.status];
  return <Pill tone={s.tone}>{s.t}</Pill>;
}

/** Danh sách lái xe kèm xe và giấy tờ — dùng cho chọn người phân công */
export function useDriverOptions() {
  return useQuery(async () => must(await sb.from('drivers')
    .select('id, full_name, code, team, active, vehicles(plate, compartments), certificates(name, expires_on)')
    .eq('active', true).order('full_name')) as unknown as Driver[], []);
}
const expiredOn = (d: Driver, date: string) => (d.certificates ?? []).filter(c => c.expires_on < date).map(c => c.name);

/* ======================= Ngăn chi tiết chuyến ======================= */
export function JobDrawer({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const { can } = useAuth();
  const { run, confirm } = useFeedback();
  const q = useQuery(async () => must(await sb.from('jobs').select(JOB_SELECT).eq('id', id).single()) as Job, [id]);
  const drivers = useDriverOptions();
  const [to, setTo] = useState('');
  const j = q.data;
  const reload = () => { q.reload(); onChanged(); };

  if (!j) return <Drawer onClose={onClose} header={<b>Đang tải…</b>}>{q.error ? <div className="error-box">{q.error}</div> : <Loading />}</Drawer>;

  const cargo = [...(j.job_cargo ?? [])].sort((a, b) => a.idx - b.idx);
  const checks = [...(j.job_checks ?? [])].sort((a, b) => a.idx - b.idx);
  const loss = lossOf(cargo);
  const eta = etaState(j);
  const unit = isBulk(cargo) ? 'L' : 'thùng';
  const editable = can('dispatcher') && j.status <= 1;

  const reassign = () => run(async () => {
    must(await sb.rpc('reassign_job', { p_job: j.id, p_driver: to }));
    setTo(''); reload();
  }, 'Đã phân công lại chuyến');
  const cancel = async () => {
    const ok = await confirm({ title: `Hủy lệnh ${j.code}?`, message: 'Lệnh chuyến sẽ bị xóa khỏi hệ thống và khỏi app của lái xe.', ok: 'Hủy lệnh', danger: true });
    if (ok && await run(async () => { must(await sb.from('jobs').delete().eq('id', j.id)); }, `Đã hủy lệnh ${j.code}`)) { onChanged(); onClose(); }
  };

  return (
    <Drawer onClose={onClose}
      header={<>
        <div className="row"><h2 style={{ fontSize: 19 }}>{j.code}</h2><StatusPill j={j} />{eta && <Pill tone={eta.tone}>{eta.t}</Pill>}</div>
        <div className="muted small" style={{ marginTop: 3 }}>{dmy(j.job_date)} · {j.vehicle ?? '—'} · {j.kind === 'bulk' ? 'Xe bồn' : 'Hàng đóng thùng'}</div>
      </>}
      footer={editable ? <>
        <select className="select" value={to} onChange={e => setTo(e.target.value)} style={{ flex: 1, minWidth: 200 }} aria-label="Chọn lái xe">
          <option value="">Phân công lại cho…</option>
          {(drivers.data ?? []).filter(d => d.id !== j.driver_id).map(d => {
            const ex = expiredOn(d, j.job_date);
            return <option key={d.id} value={d.id} disabled={ex.length > 0}>{d.full_name} · {d.code}{ex.length ? ' — giấy tờ hết hạn' : ''}</option>;
          })}
        </select>
        <Btn kind="primary" icon={UserRoundCog} disabled={!to} onClick={reassign}>Phân công</Btn>
        {j.status === 0 && <Btn kind="danger" icon={Trash2} onClick={cancel}>Hủy lệnh</Btn>}
      </> : undefined}>
      {j.rejected_reason && (
        <div className="error-box"><b>Lái xe từ chối:</b> {j.rejected_reason}{j.rejected_note ? ` — ${j.rejected_note}` : ''}. Hãy phân công lại.</div>
      )}
      <div className="sec-t">Lái xe & lộ trình</div>
      <dl className="kv">
        <dt>Lái xe</dt><dd><Link to={`/drivers/${j.driver_id}`}>{j.drivers?.full_name}</Link> <span className="muted">· {j.drivers?.code}</span></dd>
        <dt>Lấy hàng</dt><dd><b>{j.from_name}</b> · {hm(j.from_time)}<div className="muted small">{j.from_addr}</div></dd>
        <dt>Giao hàng</dt><dd><b>{j.to_name}</b> · hẹn {hm(j.to_eta)}<div className="muted small">{j.to_addr}</div></dd>
        <dt>Người nhận</dt><dd>{j.to_who ?? '—'} {j.to_phone && <a href={`tel:${j.to_phone}`}>· {j.to_phone}</a>}</dd>
        <dt>Quãng đường</dt><dd>{j.km} km · phụ cấp {money(j.fee)}</dd>
        {j.seal && <><dt>Số chì</dt><dd>{j.seal}</dd></>}
        {j.late_min > 0 && <><dt>Giao trễ</dt><dd className="red">{j.late_min} phút</dd></>}
        {j.confirm_by && <><dt>Xác nhận nhận hàng</dt><dd>{j.confirm_by}</dd></>}
        {j.note && <><dt>Ghi chú</dt><dd>{j.note}</dd></>}
      </dl>

      <div className="sec-t">Hàng hóa · {cargoText(cargo)}</div>
      <table className="t">
        <thead><tr><th>Ngăn</th><th>Hàng</th><th className="num">Lệnh</th><th className="num">Nạp</th><th className="num">Xả</th><th className="num">Hao hụt</th></tr></thead>
        <tbody>
          {cargo.map(c => (
            <tr key={c.idx}>
              <td className="muted">{c.label}</td><td>{c.item}</td><td className="num">{fmt(c.qty)}</td>
              <td className="num">{c.loaded != null ? fmt(c.loaded) : '—'}</td><td className="num">{c.delivered != null ? fmt(c.delivered) : '—'}</td>
              <td className="num">{c.loaded != null && c.delivered != null ? fmt(c.loaded - c.delivered) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {loss && (
        <div className={loss.over ? 'error-box mt' : 'muted small'} style={{ marginTop: 10 }}>
          Hao hụt {fmt(loss.loss)} {unit} ({pct(loss.rate, 2)}) · ngưỡng {pct(LOSS_LIMIT)}{loss.over && j.deviation_note ? ` · Giải trình: ${j.deviation_note}` : ''}
        </div>
      )}

      <div className="sec-t">Checklist</div>
      {checks.map(c => (
        <div key={c.idx} className="row" style={{ padding: '4px 0' }}>
          {c.done ? <CircleCheck size={16} color="var(--green)" /> : <Circle size={16} color="var(--label3)" />}
          <span className={c.done ? '' : 'muted'}>{c.title}</span>
          <span className="muted small" style={{ marginLeft: 'auto' }}>{c.phase === 'pickup' ? 'Tại kho' : 'Điểm giao'}</span>
        </div>
      ))}
    </Drawer>
  );
}

/* ======================= Tạo lệnh chuyến ======================= */
interface Line { label: string; item: string; qty: number }

export function CreateJobModal({ onClose, onCreated, driverId }: { onClose: () => void; onCreated: (id: string) => void; driverId?: string }) {
  const { run } = useFeedback();
  const drivers = useDriverOptions();
  const [date, setDate] = useState(TODAY);
  const [did, setDid] = useState(driverId ?? '');
  const [kind, setKind] = useState<'bulk' | 'drum'>('bulk');
  const [depot, setDepot] = useState(0);
  const [fromTime, setFromTime] = useState('07:00');
  const [toName, setToName] = useState('');
  const [toAddr, setToAddr] = useState('');
  const [eta, setEta] = useState('09:00');
  const [who, setWho] = useState('');
  const [phone, setPhone] = useState('');
  const [km, setKm] = useState(30);
  const [fee, setFee] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [bulk, setBulk] = useState<Record<number, { item: string; qty: number }>>({});
  const [drums, setDrums] = useState<Line[]>([{ ...DRUM_PRESETS[0], qty: 40 }]);
  const [busy, setBusy] = useState(false);

  const driver = (drivers.data ?? []).find(d => d.id === did);
  const comps = driver?.vehicles?.[0]?.compartments ?? [4000, 4000, 4000, 3000, 3000];
  const expired = driver ? expiredOn(driver, date) : [];
  const cargo = useMemo(() => kind === 'bulk'
    ? comps.map((cap, i) => ({ label: `Khoang ${i + 1}`, item: bulk[i]?.item ?? PRODUCTS[0], qty: bulk[i]?.qty ?? cap, unit: 'L' }))
        .filter(c => c.item !== '' && c.qty > 0)
    : drums.filter(d => d.item && d.qty > 0).map(d => ({ ...d, unit: 'thùng' })), [kind, comps, bulk, drums]);
  const valid = did && !expired.length && toName.trim() && cargo.length > 0 && fromTime && eta;

  const submit = async () => {
    setBusy(true);
    let created: { id: string; code: string } | null = null;
    const ok = await run(async () => {
      created = must(await sb.rpc('create_job', {
        payload: {
          driver_id: did, job_date: date, kind, vehicle: vehicle || driver?.vehicles?.[0]?.plate || null,
          from_name: DEPOTS[depot].name, from_addr: DEPOTS[depot].addr, from_time: fromTime,
          to_name: toName.trim(), to_addr: toAddr.trim(), to_eta: eta, to_who: who.trim(), to_phone: phone.trim(),
          km, fee: fee ?? feeFor(km), note: note.trim(),
          cargo, checks: CHECKS[kind].map(c => ({ title: c[0], phase: c[1], sign: c[2] ?? false }))
        }
      })) as { id: string; code: string };
    });
    setBusy(false);
    if (ok && created) { onCreated((created as { id: string }).id); }
  };

  return (
    <Modal wide title="Tạo lệnh chuyến" sub="Lệnh sẽ hiện ngay trong app của lái xe ở trạng thái “Chờ nhận”." onClose={onClose}
      footer={<><Btn onClick={onClose}>Hủy</Btn><Btn kind="primary" disabled={!valid || busy} onClick={submit}>{busy ? 'Đang tạo…' : 'Tạo lệnh'}</Btn></>}>
      {drivers.loading && !drivers.data ? <Loading /> : (
        <div className="form">
          <Field label="Ngày chạy"><input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
          <Field label="Lái xe" error={expired.length ? `Giấy tờ hết hạn vào ngày chạy: ${expired.join(', ')}` : undefined}>
            <select className="select" value={did} onChange={e => { setDid(e.target.value); setVehicle(''); setBulk({}); }}>
              <option value="">Chọn lái xe…</option>
              {(drivers.data ?? []).map(d => {
                const ex = expiredOn(d, date);
                return <option key={d.id} value={d.id}>{d.full_name} · {d.code}{ex.length ? ' ⚠ giấy tờ hết hạn' : ''}</option>;
              })}
            </select>
          </Field>
          <Field label="Loại hàng">
            <Segmented value={kind} onChange={setKind} options={[['bulk', 'Xe bồn (lít)'], ['drum', 'Đóng thùng/phuy']]} />
          </Field>
          <Field label="Phương tiện" hint={driver?.vehicles?.[0] ? `Xe được giao: ${driver.vehicles[0].plate}` : undefined}>
            <input className="input" value={vehicle} placeholder={driver?.vehicles?.[0]?.plate ?? 'Biển số'} onChange={e => setVehicle(e.target.value)} />
          </Field>
          <Field label="Kho lấy hàng">
            <select className="select" value={depot} onChange={e => setDepot(Number(e.target.value))}>
              {DEPOTS.map((d, i) => <option key={d.name} value={i}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Giờ lấy hàng"><input className="input" type="time" value={fromTime} onChange={e => setFromTime(e.target.value)} /></Field>
          <Field label="Điểm giao"><input className="input" value={toName} placeholder="VD: CHXD Số 18 – Thủ Đức" onChange={e => setToName(e.target.value)} /></Field>
          <Field label="Giờ hẹn giao"><input className="input" type="time" value={eta} onChange={e => setEta(e.target.value)} /></Field>
          <Field label="Địa chỉ giao" full><input className="input" value={toAddr} onChange={e => setToAddr(e.target.value)} /></Field>
          <Field label="Người nhận"><input className="input" value={who} onChange={e => setWho(e.target.value)} /></Field>
          <Field label="SĐT người nhận"><input className="input" value={phone} inputMode="tel" onChange={e => setPhone(e.target.value)} /></Field>
          <Field label="Quãng đường (km)"><input className="input" type="number" min={0} value={km} onChange={e => setKm(Number(e.target.value))} /></Field>
          <Field label="Phụ cấp chuyến (₫)" hint={`Theo định mức: ${money(feeFor(km))}`}>
            <input className="input" type="number" min={0} step={10000} value={fee ?? feeFor(km)} onChange={e => setFee(Number(e.target.value))} />
          </Field>

          <div className="full">
            <div className="sec-t" style={{ marginTop: 6 }}>Hàng hóa</div>
            {kind === 'bulk' ? (
              <table className="t">
                <thead><tr><th>Khoang</th><th>Sản phẩm</th><th className="num">Lượng (L)</th></tr></thead>
                <tbody>
                  {comps.map((cap, i) => (
                    <tr key={i}>
                      <td className="muted">Khoang {i + 1} <span className="small">({fmt(cap)} L)</span></td>
                      <td>
                        <select className="select" value={bulk[i]?.item ?? PRODUCTS[0]} style={{ width: '100%' }}
                          onChange={e => setBulk(b => ({ ...b, [i]: { item: e.target.value, qty: b[i]?.qty ?? cap } }))}>
                          {PRODUCTS.map(p => <option key={p}>{p}</option>)}
                          <option value="">— Để trống —</option>
                        </select>
                      </td>
                      <td className="num">
                        <input className="input num" type="number" min={0} max={cap} step={100} style={{ width: 110, textAlign: 'right' }}
                          value={bulk[i]?.qty ?? cap} onChange={e => setBulk(b => ({ ...b, [i]: { item: b[i]?.item ?? PRODUCTS[0], qty: Math.min(cap, Number(e.target.value)) } }))} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <>
                <table className="t">
                  <thead><tr><th>Quy cách</th><th>Sản phẩm</th><th className="num">Số lượng</th><th /></tr></thead>
                  <tbody>
                    {drums.map((d, i) => (
                      <tr key={i}>
                        <td><input className="input" value={d.label} onChange={e => setDrums(x => x.map((y, k) => (k === i ? { ...y, label: e.target.value } : y)))} /></td>
                        <td><input className="input" style={{ width: '100%' }} value={d.item} onChange={e => setDrums(x => x.map((y, k) => (k === i ? { ...y, item: e.target.value } : y)))} /></td>
                        <td className="num"><input className="input" type="number" min={0} style={{ width: 90, textAlign: 'right' }} value={d.qty}
                          onChange={e => setDrums(x => x.map((y, k) => (k === i ? { ...y, qty: Number(e.target.value) } : y)))} /></td>
                        <td className="act"><Btn size="sm" icon={Trash2} title="Xóa dòng" onClick={() => setDrums(x => x.filter((_, k) => k !== i))} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Btn size="sm" icon={Plus} style={{ marginTop: 8 }} onClick={() => setDrums(x => [...x, { ...DRUM_PRESETS[x.length % 3], qty: 20 }])}>Thêm dòng</Btn>
              </>
            )}
            <div className="muted small" style={{ marginTop: 8 }}>Tổng: {cargoText(cargo.map((c, i) => ({ ...c, idx: i, job_id: '', unit: c.unit as 'L' | 'thùng', loaded: null, delivered: null })))}</div>
          </div>
          <Field label="Ghi chú cho lái xe" full><textarea className="textarea" value={note} onChange={e => setNote(e.target.value)} placeholder="VD: Xả tại bể ngầm số 2, khách nhận từ 09:00" /></Field>
        </div>
      )}
    </Modal>
  );
}
