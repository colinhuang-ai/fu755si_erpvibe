import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { useAuth } from '../auth';
import { SHIFT } from '../lib/config';
import { ATT_COLOR, attLabel, classify } from '../lib/domain';
import { dm, dur, hm, pad, TODAY, toMin, WD, WD_SHORT, dow } from '../lib/format';
import { useQuery, useRealtime } from '../lib/query';
import { must, sb } from '../lib/supabase';
import type { Attendance as Att, Driver } from '../types';
import { Btn, Card, Empty, Loading, Modal, Pill } from '../ui/kit';
import { useFeedback } from '../ui/feedback';

type FB = ReturnType<typeof useFeedback>;
/** Duyệt / từ chối giải trình đi muộn – về sớm */
export async function reviewExplain(fb: FB, driverId: string, date: string, decision: 'approved' | 'rejected', done: () => void) {
  const ok = await fb.run(async () => {
    must(await sb.from('attendance').update({ explain: decision }).eq('driver_id', driverId).eq('work_date', date));
  }, decision === 'approved' ? 'Đã duyệt giải trình — không trừ điểm KPI' : 'Đã từ chối giải trình');
  if (ok) done();
}

const MONTH = '2026-11';
const DAYS = Array.from({ length: 30 }, (_, i) => `${MONTH}-${pad(i + 1)}`);

export default function Attendance() {
  const { can } = useAuth();
  const fb = useFeedback();
  const [cell, setCell] = useState<{ d: Driver; a?: Att; date: string } | null>(null);
  const q = useQuery(async () => {
    const [d, a] = await Promise.all([
      sb.from('drivers').select('id, full_name, code, team').eq('active', true).order('code'),
      sb.from('attendance').select('*').gte('work_date', `${MONTH}-01`).lte('work_date', `${MONTH}-30`)
    ]);
    return { drivers: must(d) as Driver[], att: must(a) as Att[] };
  }, []);
  useRealtime(['attendance'], q.reload);

  if (!q.data) return <div className="page"><h1>Chấm công</h1>{q.error ? <div className="error-box mt">{q.error}</div> : <Loading />}</div>;
  const { drivers, att } = q.data;
  const byKey = new Map(att.map(a => [`${a.driver_id}|${a.work_date}`, a]));
  const pending = att.filter(a => a.explain === 'pending');
  const name = (id: string) => drivers.find(d => d.id === id)?.full_name ?? '—';

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Chấm công</h1><div className="sub">Tháng 11/2026 · ca {SHIFT.start}–{SHIFT.end}, dung sai {SHIFT.grace} phút</div></div>
        <div className="legend">
          <span><i className="dot" style={{ background: ATT_COLOR.early }} />Đến sớm</span>
          <span><i className="dot" style={{ background: ATT_COLOR.ontime }} />Đúng giờ</span>
          <span><i className="dot" style={{ background: ATT_COLOR.late }} />Đi muộn</span>
          <span><i className="dot" style={{ boxShadow: 'inset 0 0 0 2px var(--orange)' }} />Về sớm</span>
          <span><i className="dot" style={{ border: '1px dashed var(--label3)' }} />Vắng</span>
        </div>
      </div>

      {pending.length > 0 && (
        <Card title={`Giải trình chờ duyệt · ${pending.length}`} pad={false} style={{ marginBottom: 16 }}>
          {pending.map(a => {
            const c = classify(a);
            return (
              <div key={a.driver_id + a.work_date} className="list-item">
                <div className="main-col">
                  <div className="t1">{name(a.driver_id)} · {WD[dow(a.work_date)]} {dm(a.work_date)}</div>
                  <div className="t2">Vào {hm(a.check_in)} – ra {hm(a.check_out)} · {c ? attLabel(c) : ''}{c?.left ? ` · về sớm ${c.left}′` : ''} · “{a.explain_text}”</div>
                </div>
                {can('hr') && <div className="row">
                  <Btn size="sm" kind="success" icon={Check} onClick={() => reviewExplain(fb, a.driver_id, a.work_date, 'approved', q.reload)}>Duyệt</Btn>
                  <Btn size="sm" kind="danger" icon={X} onClick={() => reviewExplain(fb, a.driver_id, a.work_date, 'rejected', q.reload)}>Từ chối</Btn>
                </div>}
              </div>
            );
          })}
        </Card>
      )}

      <Card pad={false}>
        {drivers.length ? (
          <div className="table-wrap">
            <table className="matrix">
              <thead>
                <tr>
                  <th className="name">Lái xe</th>
                  {DAYS.map(d => <th key={d} className={d === TODAY ? 'today' : ''}>{Number(d.slice(8))}<small>{WD_SHORT[dow(d)]}</small></th>)}
                  <th style={{ minWidth: 52 }}>Công</th><th style={{ minWidth: 52 }}>Muộn</th><th style={{ minWidth: 52 }}>Sớm</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(d => {
                  let work = 0, late = 0, early = 0;
                  return (
                    <tr key={d.id}>
                      <td className="name"><Link to={`/drivers/${d.id}`}><b>{d.full_name}</b></Link> <span className="muted small">{d.code}</span></td>
                      {DAYS.map(date => {
                        const a = byKey.get(`${d.id}|${date}`);
                        const c = classify(a);
                        if (c) { work++; if (c.st === 'late') late++; if (c.st === 'early') early++; }
                        const future = date > TODAY, sunday = dow(date) === 0;
                        const title = c ? `${dm(date)}: vào ${hm(a!.check_in)}, ra ${hm(a!.check_out)} · ${attLabel(c)}` : future ? '' : sunday ? 'Chủ Nhật' : 'Không chấm công';
                        return (
                          <td key={date} className={date === TODAY ? 'today' : ''} title={title}>
                            {c ? (
                              <button className={`cell-dot ${c.left ? 'left' : ''}`} style={{ background: ATT_COLOR[c.st], position: 'relative' }} onClick={() => setCell({ d, a, date })}>
                                {a!.explain === 'pending' ? '?' : ''}
                              </button>
                            ) : !future && !sunday ? <button className="cell-dot absent" onClick={() => setCell({ d, date })}>×</button> : null}
                          </td>
                        );
                      })}
                      <td className="num b">{work}</td><td className={`num ${late ? 'red b' : 'muted'}`}>{late}</td><td className="num muted">{early}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <Empty text="Chưa có lái xe" />}
      </Card>

      {cell && (() => {
        const c = classify(cell.a);
        const a = cell.a;
        return (
          <Modal title={`${cell.d.full_name} · ${WD[dow(cell.date)]} ${dm(cell.date)}`} onClose={() => setCell(null)}
            footer={a?.explain === 'pending' && can('hr') ? <>
              <Btn kind="danger" onClick={() => reviewExplain(fb, cell.d.id, cell.date, 'rejected', () => { setCell(null); q.reload(); })}>Từ chối giải trình</Btn>
              <Btn kind="primary" onClick={() => reviewExplain(fb, cell.d.id, cell.date, 'approved', () => { setCell(null); q.reload(); })}>Duyệt giải trình</Btn>
            </> : <Btn onClick={() => setCell(null)}>Đóng</Btn>}>
            {!c ? <div className="muted">{a?.note ?? 'Không có dữ liệu chấm công trong ngày.'}</div> : (
              <dl className="kv">
                <dt>Vào ca</dt><dd>{hm(a!.check_in)} <Pill tone={c.st === 'late' ? 'red' : c.st === 'early' ? 'green' : 'blue'}>{attLabel(c)}</Pill></dd>
                <dt>Ra ca</dt><dd>{hm(a!.check_out)} {c.left ? <Pill tone="orange">Về sớm {c.left}′</Pill> : a!.check_out ? <Pill tone="green">Đủ ca</Pill> : <Pill tone="blue">Đang làm</Pill>}</dd>
                {a!.check_out && <><dt>Thời gian làm</dt><dd>{dur(toMin(a!.check_out) - toMin(a!.check_in!))}</dd></>}
                {a!.note && <><dt>Ghi chú</dt><dd>{a!.note}</dd></>}
                {a!.explain && <><dt>Giải trình</dt><dd>{a!.explain_text} <Pill tone={a!.explain === 'pending' ? 'orange' : a!.explain === 'approved' ? 'green' : 'red'}>
                  {a!.explain === 'pending' ? 'Chờ duyệt' : a!.explain === 'approved' ? 'Đã duyệt' : 'Từ chối'}</Pill></dd></>}
              </dl>
            )}
          </Modal>
        );
      })()}
    </div>
  );
}
