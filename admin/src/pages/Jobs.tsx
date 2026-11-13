import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Truck } from 'lucide-react';
import { useAuth } from '../auth';
import { cargoText, etaState, lossOf } from '../lib/domain';
import { addDays, dm, hm, norm, pct, TODAY } from '../lib/format';
import { useQuery, useRealtime } from '../lib/query';
import { must, sb } from '../lib/supabase';
import type { Job } from '../types';
import { Btn, Card, Empty, Loading, Pill, Search, Segmented } from '../ui/kit';
import { CreateJobModal, JOB_SELECT, JobDrawer, StatusPill } from './jobParts';

type F = 'all' | 'waiting' | 'active' | 'done' | 'rejected';

export default function Jobs() {
  const { can } = useAuth();
  const [date, setDate] = useState(TODAY);
  const [f, setF] = useState<F>('all');
  const [text, setText] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const q = useQuery(async () => {
    let query = sb.from('jobs').select(JOB_SELECT).order('job_date', { ascending: false }).order('from_time');
    if (date) query = query.eq('job_date', date);
    return must(await query) as Job[];
  }, [date]);
  useRealtime(['jobs'], q.reload);

  const all = q.data ?? [];
  const match = (j: Job, k: F) =>
    k === 'all' ? true : k === 'rejected' ? !!j.rejected_reason : k === 'waiting' ? j.status === 0 && !j.rejected_reason
      : k === 'active' ? j.status >= 1 && j.status <= 4 : j.status === 5;
  const s = norm(text);
  const rows = all.filter(j => match(j, f)).filter(j => !s || norm(`${j.code} ${j.drivers?.full_name} ${j.to_name} ${j.from_name}`).includes(s));
  const n = (k: F) => all.filter(j => match(j, k)).length;

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Chuyến & phân công</h1><div className="sub">Tạo lệnh, theo dõi tiến độ, hao hụt và phân công lại chuyến bị từ chối</div></div>
        {can('dispatcher') && <Btn kind="primary" icon={Plus} onClick={() => setCreating(true)}>Tạo lệnh chuyến</Btn>}
      </div>

      <div className="toolbar">
        <div className="row" style={{ gap: 4 }}>
          <Btn icon={ChevronLeft} title="Ngày trước" disabled={!date} onClick={() => setDate(addDays(date, -1))} />
          <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} aria-label="Ngày" />
          <Btn icon={ChevronRight} title="Ngày sau" disabled={!date} onClick={() => setDate(addDays(date, 1))} />
          <Btn onClick={() => setDate(TODAY)}>Hôm nay</Btn>
          <Btn onClick={() => setDate('')} kind={date ? undefined : 'primary'}>Mọi ngày</Btn>
        </div>
        <Segmented value={f} onChange={setF} options={[
          ['all', 'Tất cả', n('all')], ['waiting', 'Chờ nhận', n('waiting')], ['active', 'Đang chạy', n('active')],
          ['done', 'Hoàn tất', n('done')], ['rejected', 'Bị từ chối', n('rejected')]]} />
        <div className="grow" />
        <Search value={text} onChange={setText} placeholder="Mã chuyến, lái xe, điểm giao" />
      </div>

      {q.error && <div className="error-box">{q.error}</div>}
      <Card pad={false}>
        {!q.data ? <Loading /> : rows.length ? (
          <div className="table-wrap">
            <table className="t">
              <thead><tr><th>Mã</th><th>Ngày</th><th>Lái xe</th><th>Lộ trình</th><th>Hàng hóa</th><th>Lấy / giao</th><th>Trạng thái</th><th className="num">Hao hụt</th></tr></thead>
              <tbody>
                {rows.map(j => {
                  const l = lossOf(j.job_cargo), e = etaState(j);
                  return (
                    <tr key={j.id} className={`tap ${open === j.id ? 'sel' : ''}`} onClick={() => setOpen(j.id)}>
                      <td className="b">{j.code}</td>
                      <td className="num">{dm(j.job_date)}</td>
                      <td>{j.drivers?.full_name}<div className="sub">{j.drivers?.code}</div></td>
                      <td><div className="ellip" style={{ maxWidth: 260 }}>{j.to_name}</div><div className="sub ellip" style={{ maxWidth: 260 }}>từ {j.from_name} · {j.km} km</div></td>
                      <td className="muted">{cargoText(j.job_cargo)}</td>
                      <td className="num">{hm(j.from_time)} → {hm(j.to_eta)}</td>
                      <td><div className="row"><StatusPill j={j} />{e && <Pill tone={e.tone}>{e.t}</Pill>}{j.late_min > 0 && <Pill tone="red">trễ {j.late_min}′</Pill>}</div></td>
                      <td className="num">{l ? <span className={l.over ? 'red b' : ''}>{pct(l.rate, 2)}</span> : <span className="muted">—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <Empty icon={Truck} text={date ? `Không có chuyến nào ngày ${dm(date)}` : 'Không có chuyến nào'} />}
      </Card>

      {open && <JobDrawer id={open} onClose={() => setOpen(null)} onChanged={q.reload} />}
      {creating && <CreateJobModal onClose={() => setCreating(false)} onCreated={id => { setCreating(false); setOpen(id); q.reload(); }} />}
    </div>
  );
}
