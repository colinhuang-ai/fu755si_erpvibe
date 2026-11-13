import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Clock, Droplet, ShieldAlert, Siren, Truck, Wallet } from 'lucide-react';
import { LOSS_LIMIT, REQ_KIND } from '../lib/config';
import { certState, classify, etaState, liters, lossOf } from '../lib/domain';
import { dm, fmt, hm, money, MONTH_START, pct, sum, TODAY, timeAgo, WD, dow } from '../lib/format';
import { useQuery, useRealtime } from '../lib/query';
import { must, sb } from '../lib/supabase';
import type { Attendance, Driver, Job, Req } from '../types';
import { Card, Empty, Loading, Pill, Stat, Tile } from '../ui/kit';
import { JobDrawer, StatusPill } from './jobParts';

export default function Dashboard() {
  const nav = useNavigate();
  const [open, setOpen] = useState<string | null>(null);
  const q = useQuery(async () => {
    const [drivers, today, month, att, exp, adv, reqs, expl] = await Promise.all([
      sb.from('drivers').select('id, full_name, code, team, active, certificates(name, expires_on)').eq('active', true),
      sb.from('jobs').select('*, drivers(full_name, code), job_cargo(qty, unit, loaded, delivered)').eq('job_date', TODAY).order('from_time'),
      sb.from('jobs').select('id, code, driver_id, job_date, status, late_min, rejected_reason, job_cargo(qty, unit, loaded, delivered)').gte('job_date', MONTH_START).lte('job_date', TODAY),
      sb.from('attendance').select('*').eq('work_date', TODAY),
      sb.from('expenses').select('amount').eq('status', 'pending'),
      sb.from('advances').select('amount').eq('status', 'pending'),
      sb.from('requests').select('*, drivers(full_name, code)').in('status', ['new', 'processing']).order('created_at', { ascending: false }),
      sb.from('attendance').select('driver_id, work_date, drivers(full_name)').eq('explain', 'pending')
    ]);
    return {
      drivers: must(drivers) as unknown as Driver[], today: must(today) as Job[], month: must(month) as Job[],
      att: must(att) as Attendance[], exp: must(exp) as { amount: number }[], adv: must(adv) as { amount: number }[],
      reqs: must(reqs) as Req[], expl: must(expl) as unknown as { driver_id: string; work_date: string; drivers: { full_name: string } }[]
    };
  }, []);
  useRealtime(['jobs', 'requests', 'expenses', 'attendance'], q.reload);

  if (!q.data) return <div className="page"><h1>Tổng quan</h1>{q.error ? <div className="error-box mt">{q.error}</div> : <Loading />}</div>;
  const { drivers, today, month, att, exp, adv, reqs, expl } = q.data;

  const active = today.filter(j => j.status >= 1 && j.status <= 4).length;
  const done = today.filter(j => j.status === 5).length;
  const waiting = today.filter(j => j.status === 0 && !j.rejected_reason).length;
  const late = today.filter(j => etaState(j)?.tone === 'red').length;
  const att2 = att.map(a => classify(a)).filter(Boolean);
  const lateIn = att2.filter(c => c!.st === 'late').length;
  const finished = month.filter(j => j.status === 5);
  const losses = finished.map(j => ({ j, l: lossOf(j.job_cargo) })).filter(x => x.l);
  const overLoss = losses.filter(x => x.l!.over);
  const certs = drivers.flatMap(d => (d.certificates ?? []).map(c => ({ d, c, s: certState(c.expires_on) }))).filter(x => x.s.days <= 30)
    .sort((a, b) => a.s.days - b.s.days);
  const sos = reqs.filter(r => r.kind === 'sos' && r.status === 'new');
  const rejected = month.filter(j => j.rejected_reason);

  const perDriver = drivers.map(d => {
    const mine = finished.filter(j => j.driver_id === d.id);
    const ls = mine.map(j => lossOf(j.job_cargo)).filter(Boolean);
    return {
      d, trips: mine.length, liters: sum(mine, j => liters(j.job_cargo)),
      onTime: mine.length ? mine.filter(j => !j.late_min).length / mine.length : 1,
      loss: ls.length ? sum(ls, l => l!.rate) / ls.length : 0
    };
  }).sort((a, b) => b.trips - a.trips);

  const todo: { icon: typeof Siren; color: string; t: string; s: string; go: () => void }[] = [
    ...sos.map(r => ({ icon: Siren, color: 'var(--red)', t: `SOS · ${r.drivers?.full_name}`, s: `${r.detail ?? ''} · ${timeAgo(r.created_at)}`, go: () => nav('/requests') })),
    ...rejected.map(j => ({ icon: Truck, color: 'var(--orange)', t: `Chuyến ${j.code} bị từ chối`, s: `${j.rejected_reason} · cần phân công lại`, go: () => setOpen(j.id) })),
    ...reqs.filter(r => r.kind !== 'sos' && r.status === 'new').map(r => ({ icon: ClipboardList, color: REQ_KIND[r.kind].color, t: `${REQ_KIND[r.kind].label} · ${r.drivers?.full_name}`, s: r.title, go: () => nav('/requests') })),
    ...certs.map(x => ({ icon: ShieldAlert, color: x.s.days < 0 ? 'var(--red)' : 'var(--orange)', t: `${x.d.full_name}: ${x.c.name}`, s: `${x.s.label} · ${dm(x.c.expires_on)}`, go: () => nav(`/drivers/${x.d.id}`) })),
    ...expl.map(e => ({ icon: Clock, color: 'var(--blue)', t: `Giải trình chấm công · ${e.drivers.full_name}`, s: `Ngày ${dm(e.work_date)} · chờ duyệt`, go: () => nav('/attendance') }))
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Tổng quan</h1><div className="sub">{WD[dow(TODAY)]}, {dm(TODAY)}/2026 · dữ liệu cập nhật trực tiếp</div></div>
      </div>

      <div className="stats">
        <Stat icon={Truck} color="var(--blue)" label="Chuyến hôm nay" value={today.length} onClick={() => nav('/jobs')}
          sub={<>{active} đang chạy · {done} hoàn tất · {waiting} chờ nhận{late ? <span className="red"> · {late} trễ hẹn</span> : null}</>} />
        <Stat icon={Clock} color="var(--orange)" label="Lái xe vào ca" value={`${att2.length}/${drivers.length}`} onClick={() => nav('/attendance')}
          sub={<>{lateIn ? <span className="red">{lateIn} đi muộn</span> : 'Không ai đi muộn'} · {drivers.length - att2.length} chưa chấm công</>} />
        <Stat icon={Wallet} color="var(--green)" label="Chờ duyệt chi" value={money(sum(exp, e => e.amount) + sum(adv, a => a.amount))} onClick={() => nav('/finance')}
          sub={`${exp.length} khoản chi · ${adv.length} tạm ứng`} />
        <Stat icon={ClipboardList} color={sos.length ? 'var(--red)' : 'var(--indigo)'} label="Yêu cầu chờ xử lý" value={reqs.length} onClick={() => nav('/requests')}
          sub={sos.length ? <span className="red">{sos.length} tín hiệu SOS mới</span> : 'Không có SOS'} />
        <Stat icon={Droplet} color="var(--teal)" label="Hao hụt vượt ngưỡng" value={overLoss.length}
          sub={`Tháng 11 · TB ${pct(losses.length ? sum(losses, x => x.l!.rate) / losses.length : 0, 2)} (ngưỡng ${pct(LOSS_LIMIT)})`} />
        <Stat icon={ShieldAlert} color="var(--red)" label="Giấy tờ ≤ 30 ngày" value={certs.length}
          sub={`${certs.filter(x => x.s.days < 0).length} đã hết hạn — bị chặn phân công`} />
      </div>

      <div className="grid2">
        <Card title="Chuyến hôm nay" pad={false}>
          {today.length ? (
            <div className="table-wrap">
              <table className="t">
                <thead><tr><th>Giờ</th><th>Mã</th><th>Lái xe</th><th>Điểm giao</th><th className="num">Lít</th><th>Trạng thái</th></tr></thead>
                <tbody>
                  {today.map(j => {
                    const e = etaState(j);
                    return (
                      <tr key={j.id} className="tap" onClick={() => setOpen(j.id)}>
                        <td className="num">{hm(j.from_time)}</td>
                        <td className="b">{j.code}</td>
                        <td>{j.drivers?.full_name}</td>
                        <td><div className="ellip" style={{ maxWidth: 220 }}>{j.to_name}</div><div className="sub">hẹn {hm(j.to_eta)}</div></td>
                        <td className="num">{fmt(liters(j.job_cargo))}</td>
                        <td><div className="row"><StatusPill j={j} />{e && <Pill tone={e.tone}>{e.t}</Pill>}</div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : <Empty text="Không có chuyến nào hôm nay" />}
        </Card>

        <Card title="Cần xử lý" actions={<span className="muted small">{todo.length} việc</span>} pad={false}>
          {todo.length ? todo.slice(0, 12).map((t, i) => (
            <div key={i} className="list-item tap" onClick={t.go}>
              <Tile icon={t.icon} color={t.color} />
              <div className="main-col"><div className="t1 ellip">{t.t}</div><div className="t2 ellip">{t.s}</div></div>
            </div>
          )) : <Empty text="Không có việc tồn đọng" />}
        </Card>
      </div>

      <Card title="Hiệu suất tháng 11 theo lái xe" pad={false} style={{ marginTop: 16 }}>
        <div className="table-wrap">
          <table className="t">
            <thead><tr><th>Lái xe</th><th>Đội</th><th className="num">Chuyến hoàn tất</th><th className="num">Lít đã giao</th><th className="num">Đúng hẹn</th><th className="num">Hao hụt TB</th></tr></thead>
            <tbody>
              {perDriver.map(p => (
                <tr key={p.d.id} className="tap" onClick={() => nav(`/drivers/${p.d.id}`)}>
                  <td><b>{p.d.full_name}</b> <span className="muted small">{p.d.code}</span></td>
                  <td className="muted">{p.d.team}</td>
                  <td className="num">{p.trips}</td>
                  <td className="num">{fmt(p.liters)}</td>
                  <td className="num">{pct(p.onTime, 0)}</td>
                  <td className="num"><span className={p.loss > LOSS_LIMIT ? 'red b' : p.loss > LOSS_LIMIT / 2 ? 'orange' : ''}>{pct(p.loss, 2)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {open && <JobDrawer id={open} onClose={() => setOpen(null)} onChanged={q.reload} />}
    </div>
  );
}
