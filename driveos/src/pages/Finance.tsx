import { Plus, Wallet } from 'lucide-react';
import { useState } from 'react';
import { Avatar, useSticky } from '../components/common';
import { CATS, SALARY } from '../data/config';
import { MOCK_TODAY } from '../lib/clock';
import { pay, payForecast } from '../lib/domain';
import { dmy, dow, fmt, money, sum, WD, dm } from '../lib/format';
import { useStore } from '../store';
import type { ExpCat, Expense } from '../types';
import { Cell, Empty, Group, NavIcon, Screen, Segmented } from '../ui/kit';
import { useUI } from '../ui/overlay';
import { catIcon } from '../sheets/catIcon';

type Tab = 'exp' | 'pay';
const ST: Record<Expense['status'], { t: string; c: string }> = {
  pending: { t: 'Chờ duyệt', c: 'var(--orange)' }, approved: { t: 'Đã duyệt', c: 'var(--green)' }, rejected: { t: 'Từ chối', c: 'var(--red)' }
};

export default function Finance() {
  const [tab, setTab] = useSticky<Tab>('fin', 'exp', ['exp', 'pay']);
  const { openSheet } = useUI();
  return (
    <Screen title="Tài chính" trailing={<><NavIcon icon={Plus} label="Thêm chi phí" onClick={() => openSheet('expense')} /><Avatar /></>}>
      <div className="pad"><Segmented value={tab} onChange={setTab} options={[['exp', 'Chi phí'], ['pay', 'Lương & tạm ứng']]} /></div>
      {tab === 'exp' ? <Expenses /> : <Pay />}
    </Screen>
  );
}

function Expenses() {
  const { s, update } = useStore();
  const { confirm, toast } = useUI();
  const [f, setF] = useState<'all' | ExpCat>('all');
  const all = [...s.expenses].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const valid = all.filter(e => e.status !== 'rejected');
  const total = sum(valid, e => e.amount);
  const byCat = (Object.keys(CATS) as ExpCat[]).map(k => ({ k, v: sum(valid.filter(e => e.cat === k), e => e.amount) })).filter(x => x.v > 0);
  const list = all.filter(e => f === 'all' || e.cat === f);
  const days = [...new Set(list.map(e => e.date))];

  const tapExp = async (e: Expense) => {
    const lines = [`${e.place} · ${dmy(e.date)} ${e.time}`, `Số tiền: ${money(e.amount)}`, e.liters ? `${e.liters} L · đồng hồ ${fmt(e.odo ?? 0)} km` : '',
      e.jobId ? `Chuyến: ${e.jobId}` : '', `Hóa đơn: ${e.receipt ? 'có ảnh' : 'không có'}${e.vat ? ' · VAT' : ''}`, e.reason ? `Lý do từ chối: ${e.reason}` : '', e.overNote ? `Giải trình: ${e.overNote}` : '']
      .filter(Boolean).join('\n');
    const v = await confirm({
      title: e.title, message: lines,
      actions: e.status === 'pending'
        ? [{ label: 'Thu hồi khoản chi', value: 'del', style: 'destructive' }, { label: 'Đóng', value: 'cancel', style: 'cancel' }]
        : [{ label: 'Đóng', value: 'cancel', style: 'cancel' }]
    });
    if (v === 'del') { update(d => { d.expenses = d.expenses.filter(x => x.id !== e.id); }); toast('Đã thu hồi khoản chi', 'info'); }
  };

  return (
    <>
      <div className="card mx" style={{ marginBottom: 14 }}>
        <div className="sum-sub">Tổng chi phí tháng 11</div>
        <div className="big-money">{money(total)}</div>
        <div className="stackbar">{byCat.map(c => <i key={c.k} style={{ flex: c.v, background: CATS[c.k].color }} />)}</div>
        <div className="legend2">
          {byCat.map(c => (
            <span key={c.k}><i style={{ background: CATS[c.k].color }} />{CATS[c.k].label}<b>{Math.round(c.v / total * 100)}%</b></span>
          ))}
        </div>
        <div className="divider" />
        <div className="trio">
          <div><span>Chờ duyệt</span><b style={{ color: 'var(--orange)' }}>{money(sum(all.filter(e => e.status === 'pending'), e => e.amount))}</b></div>
          <div><span>Đã duyệt</span><b style={{ color: 'var(--green)' }}>{money(sum(all.filter(e => e.status === 'approved'), e => e.amount))}</b></div>
        </div>
      </div>

      <div className="chips">
        {([['all', 'Tất cả'], ...(Object.keys(CATS) as ExpCat[]).map(k => [k, CATS[k].label])] as [typeof f, string][]).map(([k, l]) => (
          <button key={k} className={`chipb ${f === k ? 'on' : ''}`} onClick={() => setF(k)}>{l}</button>
        ))}
      </div>

      {!list.length && <Empty icon={Wallet} title="Chưa có khoản chi nào" />}
      {days.map(d => (
        <Group key={d} header={d === MOCK_TODAY ? 'Hôm nay' : `${WD[dow(d)]}, ${dm(d)}`}>
          {list.filter(e => e.date === d).map(e => (
            <Cell key={e.id} icon={catIcon(e.cat)} tint={CATS[e.cat].color} title={e.title}
              subtitle={e.reason ? <span style={{ color: 'var(--red)' }}>{e.reason}</span> : `${e.place} · ${e.time}`}
              trailing={<div className="amt"><div>{money(e.amount)}</div><span style={{ color: ST[e.status].c }}>{ST[e.status].t}</span></div>}
              onClick={() => tapExp(e)} />
          ))}
        </Group>
      ))}
    </>
  );
}

function Pay() {
  const { s } = useStore();
  const { openSheet } = useUI();
  const p = pay(s);
  const f = payForecast(s);
  return (
    <>
      <div className="wallet mx">
        <div className="w-top"><span>Thực nhận tạm tính đến hôm nay</span><span>Tháng 11/2026</span></div>
        <div className="w-amt">{money(p.net)}</div>
        <div className="w-sub">Dự kiến cuối tháng {money(f.net)} · chốt lương {dmy(SALARY.payday)}</div>
      </div>

      <Group header="Thu nhập">
        <Cell title="Lương cơ bản" detail={money(SALARY.base)} />
        <Cell title="Phụ cấp chuyến" subtitle={`${p.tripCount} chuyến hoàn tất`} detail={money(p.trips)} />
        <Cell title="Phụ cấp độc hại" detail={money(SALARY.hazard)} />
        <Cell title="Thưởng KPI" subtitle={`Mức “${p.tier.name}”`} detail={money(p.tier.amt)} />
        <Cell title="Hoàn chi phí đã duyệt" detail={'+' + money(p.reimb)} />
      </Group>
      <Group header="Khấu trừ">
        <Cell title="BHXH, BHYT, BHTN" subtitle="10,5% lương cơ bản" detail={'−' + money(p.ins)} />
        <Cell title="Đã tạm ứng" detail={'−' + money(p.adv)} />
      </Group>
      <Group header="Tạm ứng" footer="Khoản tạm ứng được trừ vào kỳ lương gần nhất.">
        {s.advances.map(a => (
          <Cell key={a.id} title={a.reason} subtitle={dmy(a.date)}
            trailing={<div className="amt"><div>{money(a.amount)}</div><span style={{ color: a.status === 'paid' ? 'var(--green)' : 'var(--orange)' }}>{a.status === 'paid' ? 'Đã chi' : 'Chờ duyệt'}</span></div>} />
        ))}
        <Cell title="Xin tạm ứng" tone="blue" onClick={() => openSheet('advance')} />
      </Group>
    </>
  );
}
