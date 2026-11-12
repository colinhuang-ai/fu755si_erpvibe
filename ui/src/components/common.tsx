import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, Droplet, MapPin, Package, Route as RouteIcon } from 'lucide-react';
import { DRIVER, SHIFT } from '../data/mock';
import { MOCK_TODAY, nowHM, nowMin, useNow } from '../lib/clock';
import { classify, classLabel, cargoSum, isBulk, jobStatus, STEPS } from '../lib/domain';
import { dm, dur, fmt, toMin } from '../lib/format';
import { useStore } from '../store';
import type { Job } from '../types';
import { Btn, Pill, SumCard } from '../ui/kit';
import { useUI } from '../ui/overlay';

/** Giữ trạng thái tab con (segmented) khi chuyển màn hình */
export function useSticky<T extends string>(key: string, def: T, allowed?: readonly T[]): [T, (v: T) => void] {
  const [sp] = useSearchParams();
  const [v, setV] = useState<T>(() => {
    const q = sp.get('tab') as T | null;
    if (q && (!allowed || allowed.includes(q))) return q;
    try { return (sessionStorage.getItem('st.' + key) as T) || def; } catch { return def; }
  });
  const set = (x: T) => { setV(x); try { sessionStorage.setItem('st.' + key, x); } catch { /* ignore */ } };
  return [v, set];
}

export function Avatar({ size = 32 }: { size?: number }) {
  const nav = useNavigate();
  return (
    <button className="avatar" style={{ width: size, height: size, fontSize: size * 0.4 }} onClick={() => nav('/me')} aria-label="Hồ sơ cá nhân">
      {DRIVER.initials}
    </button>
  );
}

export function SosButton() {
  const { openSheet } = useUI();
  return <button className="sos-btn" onClick={() => openSheet('sos')} aria-label="SOS khẩn cấp">SOS</button>;
}

/* ---------------- Chấm công ---------------- */
export function ShiftCard() {
  const { s, update } = useStore();
  const { confirm, toast } = useUI();
  useNow(1000);
  const r = s.att['12'];
  const c = classify(r);

  const checkout = async () => {
    const t = nowHM();
    const early = toMin(SHIFT.end) - toMin(t);
    const v = await confirm({
      title: `Chấm công ra ca lúc ${t}?`,
      message: early > SHIFT.grace ? `Ca kết thúc lúc ${SHIFT.end}. Ra ca bây giờ sẽ được tính là về sớm ${dur(early)}.` : undefined,
      actions: [{ label: 'Hủy', value: 'cancel', style: 'cancel' }, { label: 'Ra ca', value: 'ok', style: early > SHIFT.grace ? 'destructive' : 'default' }]
    });
    if (v !== 'ok') return;
    update(d => { d.att['12'].out = t; });
    toast(`Đã chấm công ra ca lúc ${t}`);
  };
  const checkin = () => {
    const t = nowHM();
    update(d => { d.att['12'] = { in: t, out: null }; });
    toast(`Đã chấm công vào ca lúc ${t}`);
  };

  let body;
  if (!r || !r.in) {
    body = (<>
      <div className="sum-v">Chưa vào ca</div>
      <Btn block icon={Clock} onClick={checkin} style={{ marginTop: 12 }}>Chấm công vào ca</Btn>
    </>);
  } else if (!r.out) {
    const l = classLabel(c!);
    body = (<>
      <div className="row-b">
        <div><span className="sum-v">{r.in}</span><span className="sum-u">vào ca</span></div>
        <Pill tone={l.tone}>{l.t}</Pill>
      </div>
      <div className="sum-sub">Đã làm {dur(nowMin() - toMin(r.in))}</div>
      <div className="geo"><MapPin size={14} strokeWidth={2.5} /> Kho Nhà Bè · trong vùng cho phép (120 m)</div>
      <Btn block kind="gray" onClick={checkout} style={{ marginTop: 12 }}>Chấm công ra ca</Btn>
    </>);
  } else {
    body = (<>
      <div className="row-b">
        <div><span className="sum-v">{r.in} – {r.out}</span></div>
        {c!.left ? <Pill tone="orange">Về sớm {dur(c!.left)}</Pill> : <Pill tone="green">Đủ ca</Pill>}
      </div>
      <div className="sum-sub">Tổng thời gian làm {dur(toMin(r.out) - toMin(r.in))}</div>
      <Btn block kind="plain" onClick={() => update(d => { d.att['12'].out = null; })} style={{ marginTop: 6 }}>Hoàn tác (demo)</Btn>
    </>);
  }
  return <SumCard icon={Clock} color="var(--orange)" title="Chấm công" meta={`Ca ${SHIFT.start}–${SHIFT.end}`}>{body}</SumCard>;
}

/* ---------------- Chuyến ---------------- */
export function TripSteps({ status }: { status: number }) {
  return (
    <div className="steps">
      {STEPS.map((l, i) => {
        const k = i + 1;
        const st = status === 5 || status > k ? 'done' : status === k ? 'cur' : '';
        return <div key={l} className={`step ${st}`}><i /><span>{l}</span></div>;
      })}
    </div>
  );
}

export function etaInfo(j: Job) {
  if (j.date !== MOCK_TODAY || j.status < 1 || j.status > 4) return null;
  const left = toMin(j.to.eta) - nowMin();
  return left >= 0 ? { t: `Còn ${dur(left)}`, tone: 'blue' as const } : { t: `Trễ ${dur(-left)}`, tone: 'red' as const };
}

export function JobCard({ j }: { j: Job }) {
  const nav = useNavigate();
  const st = jobStatus(j);
  const eta = etaInfo(j);
  return (
    <div className="card job tap" role="button" onClick={() => nav(`/jobs/${j.id}`)}>
      <div className="row-b">
        <span className="job-id">{j.id}{j.date !== MOCK_TODAY && ` · ${dm(j.date)}`}</span>
        <span className="row" style={{ gap: 6 }}>
          {j.lateMin > 0 && <Pill tone="red">Trễ {j.lateMin}′</Pill>}
          <Pill tone={st.tone}>{st.t}</Pill>
        </span>
      </div>
      <div className="route">
        <div className="rp"><span className="rdot" /><div><div className="rp-t">{j.from.name}</div><div className="rp-s">Lấy hàng {j.from.time}</div></div></div>
        <div className="rp"><span className="rdot to" /><div><div className="rp-t">{j.to.name}</div><div className="rp-s">{j.to.addr}</div></div></div>
      </div>
      <div className="meta">
        <span>{isBulk(j) ? <Droplet size={13} strokeWidth={2.4} /> : <Package size={13} strokeWidth={2.4} />}{cargoSum(j)}</span>
        <span><Clock size={13} strokeWidth={2.4} />Giao {j.to.eta}</span>
        <span><RouteIcon size={13} strokeWidth={2.4} />{j.km} km</span>
        {eta && <Pill tone={eta.tone}>{eta.t}</Pill>}
      </div>
    </div>
  );
}

export const litersText = (n: number) => `${fmt(n)} L`;
