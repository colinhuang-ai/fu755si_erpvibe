import { useState } from 'react';
import { MessageSquareWarning, Target } from 'lucide-react';
import { Avatar, ShiftCard, useSticky } from '../components/common';
import { KPI_TIERS, KPI_TREND, SHIFT } from '../data/mock';
import { MOCK_TODAY } from '../lib/clock';
import { attStats, classify, classLabel, kpiItems, kpiScore, scoreColor, tierOf } from '../lib/domain';
import { dow, dur, money, pad, toMin, WD } from '../lib/format';
import { useStore } from '../store';
import { Cell, Group, Pill, ProgressBar, Ring, Screen, Segmented } from '../ui/kit';
import { useUI } from '../ui/overlay';

type Tab = 'att' | 'kpi';

export default function Attendance() {
  const [tab, setTab] = useSticky<Tab>('att', 'att', ['att', 'kpi']);
  return (
    <Screen title="Chấm công" trailing={<Avatar />}>
      <div className="pad"><Segmented value={tab} onChange={setTab} options={[['att', 'Bảng công'], ['kpi', 'KPI']]} /></div>
      {tab === 'att' ? <AttTab /> : <KpiTab />}
    </Screen>
  );
}

const DOT: Record<string, string> = { early: 'var(--green)', ontime: 'var(--blue)', late: 'var(--red)' };

function AttTab() {
  const { s } = useStore();
  const { openSheet } = useUI();
  const [sel, setSel] = useState(12);
  const a = attStats(s);
  const first = (new Date(2026, 10, 1).getDay() + 6) % 7;
  const today = Number(MOCK_TODAY.slice(8));

  const iso = `2026-11-${pad(sel)}`;
  const r = s.att[String(sel)];
  const c = classify(r);

  return (
    <>
      <div className="stack"><ShiftCard /></div>

      <div className="card mx stats4" style={{ marginBottom: 28 }}>
        <div><b>{a.worked}</b><span>Ngày công</span></div>
        <div><b style={{ color: 'var(--green)' }}>{a.early}</b><span>Đến sớm</span></div>
        <div><b style={{ color: 'var(--red)' }}>{a.late}</b><span>Đi muộn</span></div>
        <div><b style={{ color: 'var(--orange)' }}>{a.left}</b><span>Về sớm</span></div>
      </div>

      <section className="group">
        <div className="group-h">Tháng 11, 2026 · ca {SHIFT.start}–{SHIFT.end}</div>
        <div className="cells cal">
          <div className="cal-grid">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => <div key={d} className="cal-wd">{d}</div>)}
            {Array.from({ length: first }, (_, i) => <span key={'p' + i} />)}
            {Array.from({ length: 30 }, (_, i) => {
              const d = i + 1, rec = s.att[String(d)], cl = classify(rec);
              const sun = new Date(2026, 10, d).getDay() === 0;
              const cls = ['cal-d', d === today ? 'today' : '', d === sel ? 'sel' : '', sun ? 'sun' : '', d > today ? 'future' : ''].join(' ');
              return (
                <button key={d} className={cls} onClick={() => setSel(d)} aria-label={`Ngày ${d}`}>
                  <span className="n">{d}</span>
                  <span className="dots">
                    {cl && <i style={{ background: DOT[cl.st] }} />}
                    {cl?.left ? <i style={{ background: 'var(--orange)' }} /> : null}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="legend">
            <span><i style={{ background: 'var(--green)' }} />Đến sớm</span>
            <span><i style={{ background: 'var(--blue)' }} />Đúng giờ</span>
            <span><i style={{ background: 'var(--red)' }} />Đi muộn</span>
            <span><i style={{ background: 'var(--orange)' }} />Về sớm</span>
          </div>
        </div>
      </section>

      <Group header={`${WD[dow(iso)]}, ${pad(sel)}/11/2026`} footer={r?.note}>
        {sel > today ? <Cell title="Chưa đến ngày" /> : !c ? (
          <Cell title={dow(iso) === 0 ? 'Ngày nghỉ hằng tuần' : 'Không có dữ liệu chấm công'} subtitle={dow(iso) === 0 ? 'Chủ Nhật' : undefined} />
        ) : (
          <>
            <Cell title="Vào ca" detail={r!.in} trailing={<Pill tone={classLabel(c).tone}>{classLabel(c).t}</Pill>} />
            <Cell title="Ra ca" detail={r!.out ?? '—'}
              trailing={r!.out ? (c.left ? <Pill tone="orange">Về sớm {dur(c.left)}</Pill> : <Pill tone="green">Đủ ca</Pill>) : <Pill tone="blue">Đang làm</Pill>} />
            {r!.out && <Cell title="Thời gian làm" detail={dur(toMin(r!.out) - toMin(r!.in!))} />}
            {(c.st === 'late' || c.left > 0) && (r!.explain
              ? <Cell title="Giải trình" subtitle={r!.explainText} trailing={<Pill tone={r!.explain === 'approved' ? 'green' : 'orange'}>{r!.explain === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}</Pill>} />
              : <Cell title="Gửi giải trình" tone="blue" chevron onClick={() => openSheet('explain', { day: sel })} />)}
          </>
        )}
      </Group>
    </>
  );
}

function KpiTab() {
  const { s } = useStore();
  const { confirm, openSheet } = useUI();
  const items = kpiItems(s);
  const score = kpiScore(s), tier = tierOf(score);
  const idx = KPI_TIERS.indexOf(tier), next = idx > 0 ? KPI_TIERS[idx - 1] : null;
  const trend = [...KPI_TREND, { m: 'T11', v: score }];
  const worst = [...items].sort((x, y) => x.score - y.score)[0];

  return (
    <>
      <div className="card mx kpi-hero" style={{ marginBottom: 28 }}>
        <Ring value={score / 100} size={112} stroke={13} color={scoreColor(score)}>
          <b>{score}</b><span>/ 100</span>
        </Ring>
        <div>
          <div className="sum-sub">KPI tháng 11 · tạm tính</div>
          <div className="kpi-tier">{tier.name}</div>
          <div className="sum-sub" style={{ marginTop: 8 }}>Thưởng dự kiến</div>
          <div className="kpi-bonus">{money(tier.amt)}</div>
        </div>
      </div>

      {next && (
        <Group>
          <Cell icon={Target} tint="var(--green)" title={`Mục tiêu: ${next.name} (≥ ${next.min})`}
            subtitle={<><div>Còn {next.min - score} điểm · thưởng {money(next.amt)}</div><div style={{ marginTop: 6 }}><ProgressBar value={score / next.min} color="var(--green)" /></div></>} />
        </Group>
      )}

      <Group header="Chỉ tiêu" footer="Chạm vào từng chỉ tiêu để xem cách tính điểm.">
        {items.map(k => (
          <Cell key={k.k} chevron
            title={<span className="row-b"><span>{k.label} <span className="muted">· {k.w}%</span></span><b style={{ color: scoreColor(k.score) }}>{k.score}</b></span>}
            subtitle={<><div>{k.hint}</div><div style={{ margin: '6px 0 2px' }}><ProgressBar value={k.score / 100} color={scoreColor(k.score)} /></div></>}
            onClick={() => confirm({ title: k.label, message: `${k.how}\n\nĐiểm hiện tại: ${k.score} × trọng số ${k.w}%` })} />
        ))}
      </Group>

      <Group header="Xu hướng 4 tháng">
        <div className="bars">
          {trend.map((t, i) => (
            <div key={t.m} className={`bar-c ${i === trend.length - 1 ? 'cur' : ''}`}>
              <b>{t.v}</b>
              <i style={{ height: `${(t.v - 50) * 2}px` }} />
              <span>{t.m}</span>
            </div>
          ))}
        </div>
      </Group>

      <Group footer={`Gợi ý: cải thiện “${worst.label}” (${worst.score} điểm) giúp tăng tổng điểm nhanh nhất.`}>
        <Cell icon={MessageSquareWarning} tint="var(--orange)" title="Khiếu nại kết quả KPI" chevron onClick={() => openSheet('complaint')} />
      </Group>
    </>
  );
}
