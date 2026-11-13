import { useState } from 'react';
import { Check, Fuel, Receipt, TriangleAlert, Wallet, X } from 'lucide-react';
import { useAuth } from '../auth';
import { CATS, FOOD_LIMIT, NO_RECEIPT_LIMIT } from '../lib/config';
import { dm, fmt, hm, money, MONTH_START, norm, sum } from '../lib/format';
import { useQuery, useRealtime } from '../lib/query';
import { must, sb } from '../lib/supabase';
import type { Advance, ExpCat, Expense } from '../types';
import { Btn, Card, Empty, Loading, Pill, Search, Segmented, Stat } from '../ui/kit';
import { useFeedback } from '../ui/feedback';

type St = 'pending' | 'approved' | 'rejected' | 'all';
const ST = { pending: ['Chờ duyệt', 'orange'], approved: ['Đã duyệt', 'green'], rejected: ['Từ chối', 'red'] } as const;
const REASONS = ['Thiếu hóa đơn', 'Vượt định mức', 'Không thuộc chuyến công tác', 'Hóa đơn không hợp lệ', 'Trùng khoản đã nộp'];

export default function Finance() {
  const { can } = useAuth();
  const { run, confirm } = useFeedback();
  const [tab, setTab] = useState<'exp' | 'adv'>('exp');
  const [st, setSt] = useState<St>('pending');
  const [cat, setCat] = useState<'all' | ExpCat>('all');
  const [text, setText] = useState('');
  const [sel, setSel] = useState<Set<string>>(new Set());
  const q = useQuery(async () => {
    const [e, a] = await Promise.all([
      sb.from('expenses').select('*, drivers(full_name, code)').gte('spent_on', MONTH_START).order('spent_on', { ascending: false }).order('spent_time', { ascending: false }),
      sb.from('advances').select('*, drivers(full_name, code)').order('requested_on', { ascending: false })
    ]);
    return { exp: must(e) as Expense[], adv: must(a) as Advance[] };
  }, []);
  useRealtime(['expenses'], q.reload);
  const ok = can('accountant');

  if (!q.data) return <div className="page"><h1>Chi phí & tạm ứng</h1>{q.error ? <div className="error-box mt">{q.error}</div> : <Loading />}</div>;
  const { exp, adv } = q.data;

  const s = norm(text);
  const rows = exp.filter(e => (st === 'all' || e.status === st) && (cat === 'all' || e.category === cat))
    .filter(e => !s || norm(`${e.title} ${e.place ?? ''} ${e.drivers?.full_name} ${e.job_code ?? ''}`).includes(s));
  const pend = exp.filter(e => e.status === 'pending');
  const appr = exp.filter(e => e.status === 'approved');
  const fuel = appr.filter(e => e.category === 'fuel');
  const foodDay = (e: Expense) => sum(exp.filter(x => x.driver_id === e.driver_id && x.spent_on === e.spent_on && x.category === 'food' && x.status !== 'rejected'), x => x.amount);
  const flags = (e: Expense) => [
    !e.receipt && e.amount > NO_RECEIPT_LIMIT ? 'Không hóa đơn, vượt 200.000 ₫' : '',
    e.category === 'food' && foodDay(e) > FOOD_LIMIT ? `Ăn uống ngày ${dm(e.spent_on)}: ${money(foodDay(e))} > định mức` : '',
    e.over_note ? `Giải trình: ${e.over_note}` : ''
  ].filter(Boolean);

  const approve = (ids: string[]) => run(async () => {
    must(await sb.from('expenses').update({ status: 'approved', reject_reason: null }).in('id', ids));
    setSel(new Set()); q.reload();
  }, `Đã duyệt ${ids.length} khoản chi`);
  const reject = async (ids: string[]) => {
    const reason = await confirm({ title: `Từ chối ${ids.length} khoản chi`, ok: 'Từ chối', danger: true, input: { label: 'Lý do (lái xe sẽ thấy)', presets: REASONS, required: true } });
    if (reason) await run(async () => {
      must(await sb.from('expenses').update({ status: 'rejected', reject_reason: reason }).in('id', ids));
      setSel(new Set()); q.reload();
    }, 'Đã từ chối');
  };
  const pay = (a: Advance) => run(async () => { must(await sb.from('advances').update({ status: 'paid' }).eq('id', a.id)); q.reload(); }, `Đã duyệt chi tạm ứng ${money(a.amount)}`);
  const toggle = (id: string) => setSel(x => { const n = new Set(x); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const pendRows = rows.filter(e => e.status === 'pending');

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Chi phí & tạm ứng</h1><div className="sub">Tháng 11/2026 · duyệt hóa đơn, phí và tạm ứng của lái xe</div></div>
        <Segmented value={tab} onChange={setTab} options={[['exp', 'Chi phí', pend.length], ['adv', 'Tạm ứng', adv.filter(a => a.status === 'pending').length]]} />
      </div>

      <div className="stats">
        <Stat icon={Receipt} color="var(--orange)" label="Chờ duyệt" value={money(sum(pend, e => e.amount))} sub={`${pend.length} khoản chi`} />
        <Stat icon={Check} color="var(--green)" label="Đã duyệt T11" value={money(sum(appr, e => e.amount))} sub={`${appr.length} khoản`} />
        <Stat icon={Fuel} color="var(--teal)" label="Nhiên liệu T11" value={`${fmt(sum(fuel, e => Number(e.liters ?? 0)))} L`} sub={money(sum(fuel, e => e.amount))} />
        <Stat icon={Wallet} color="var(--indigo)" label="Tạm ứng chờ chi" value={money(sum(adv.filter(a => a.status === 'pending'), a => a.amount))} sub={`${adv.filter(a => a.status === 'pending').length} yêu cầu`} />
      </div>

      {tab === 'exp' ? (
        <>
          <div className="toolbar">
            <Segmented value={st} onChange={v => { setSt(v); setSel(new Set()); }} options={[
              ['pending', 'Chờ duyệt', pend.length], ['approved', 'Đã duyệt'], ['rejected', 'Từ chối'], ['all', 'Tất cả']]} />
            <select className="select" value={cat} onChange={e => setCat(e.target.value as typeof cat)} aria-label="Loại chi phí">
              <option value="all">Mọi loại</option>
              {(Object.keys(CATS) as ExpCat[]).map(k => <option key={k} value={k}>{CATS[k].label}</option>)}
            </select>
            <div className="grow" />
            {ok && sel.size > 0 && <>
              <span className="muted small">Đã chọn {sel.size}</span>
              <Btn kind="success" icon={Check} onClick={() => approve([...sel])}>Duyệt</Btn>
              <Btn kind="danger" icon={X} onClick={() => reject([...sel])}>Từ chối</Btn>
            </>}
            <Search value={text} onChange={setText} placeholder="Nội dung, lái xe, chuyến" />
          </div>
          <Card pad={false}>
            {rows.length ? (
              <div className="table-wrap">
                <table className="t">
                  <thead><tr>
                    {ok && <th style={{ width: 30 }}>{pendRows.length > 0 && <input type="checkbox" className="check" aria-label="Chọn tất cả"
                      checked={pendRows.every(e => sel.has(e.id))} onChange={e => setSel(e.target.checked ? new Set(pendRows.map(r => r.id)) : new Set())} />}</th>}
                    <th>Ngày</th><th>Lái xe</th><th>Loại</th><th>Nội dung</th><th>Chứng từ</th><th className="num">Số tiền</th><th>Trạng thái</th>{ok && <th />}
                  </tr></thead>
                  <tbody>
                    {rows.map(e => {
                      const fl = flags(e);
                      return (
                        <tr key={e.id} className={sel.has(e.id) ? 'sel' : ''}>
                          {ok && <td>{e.status === 'pending' && <input type="checkbox" className="check" checked={sel.has(e.id)} onChange={() => toggle(e.id)} aria-label="Chọn" />}</td>}
                          <td className="num">{dm(e.spent_on)}<div className="sub">{hm(e.spent_time)}</div></td>
                          <td>{e.drivers?.full_name}<div className="sub">{e.drivers?.code}</div></td>
                          <td><span className="row"><span className="dot" style={{ background: CATS[e.category].color }} />{CATS[e.category].label}</span></td>
                          <td style={{ maxWidth: 320 }}>
                            <div className="b">{e.title}</div>
                            <div className="sub">{e.place}{e.job_code ? ` · ${e.job_code}` : ''}{e.liters ? ` · ${e.liters} L · ${fmt(e.odo ?? 0)} km` : ''}</div>
                            {fl.map(f => <div key={f} className="small orange row" style={{ gap: 4 }}><TriangleAlert size={12} />{f}</div>)}
                            {e.reject_reason && <div className="small red">Lý do từ chối: {e.reject_reason}</div>}
                          </td>
                          <td>{e.receipt ? <Pill tone="green">Có hóa đơn</Pill> : <Pill tone="red">Không HĐ</Pill>} {e.vat && <Pill tone="blue">VAT</Pill>}</td>
                          <td className="num b">{money(e.amount)}</td>
                          <td><Pill tone={ST[e.status][1]}>{ST[e.status][0]}</Pill></td>
                          {ok && <td className="act">{e.status === 'pending' && <>
                            <Btn size="sm" kind="success" icon={Check} title="Duyệt" onClick={() => approve([e.id])} />{' '}
                            <Btn size="sm" kind="danger" icon={X} title="Từ chối" onClick={() => reject([e.id])} /></>}</td>}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : <Empty icon={Receipt} text="Không có khoản chi phù hợp" />}
          </Card>
        </>
      ) : (
        <Card pad={false}>
          {adv.length ? (
            <table className="t">
              <thead><tr><th>Ngày</th><th>Lái xe</th><th>Lý do</th><th className="num">Số tiền</th><th>Trạng thái</th>{ok && <th />}</tr></thead>
              <tbody>
                {adv.map(a => (
                  <tr key={a.id}>
                    <td className="num">{dm(a.requested_on)}</td>
                    <td>{a.drivers?.full_name}<div className="sub">{a.drivers?.code}</div></td>
                    <td>{a.reason}</td>
                    <td className="num b">{money(a.amount)}</td>
                    <td>{a.status === 'paid' ? <Pill tone="green">Đã chi</Pill> : <Pill tone="orange">Chờ duyệt</Pill>}</td>
                    {ok && <td className="act">{a.status === 'pending' && <Btn size="sm" kind="success" icon={Check} onClick={() => pay(a)}>Duyệt chi</Btn>}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <Empty text="Chưa có yêu cầu tạm ứng" />}
        </Card>
      )}
    </div>
  );
}
