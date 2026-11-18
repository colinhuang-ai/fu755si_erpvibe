import { useNavigate } from 'react-router-dom';
import { Banknote, ClipboardCheck, Droplet, Gauge, GraduationCap, Phone, Receipt, TriangleAlert, Truck } from 'lucide-react';
import { Avatar, etaInfo, ShiftCard, SosButton, TripSteps } from '../components/common';
import { LEARN_GOAL_MIN, VCHECK } from '../data/config';
import { MOCK_TODAY, useNow } from '../lib/clock';
import { jobStatus, liters, payForecast, scoreColor, tierOf, vcDone } from '../lib/domain';
import { dec, fmt, sum, trieu, WD, dow } from '../lib/format';
import { useStore } from '../store';
import { Cell, Group, Pill, ProgressBar, Screen, SumCard } from '../ui/kit';
import { useUI } from '../ui/overlay';

export default function Home() {
  const { s } = useStore();
  const { openSheet } = useUI();
  const nav = useNavigate();
  useNow(30000);

  const today = s.jobs.filter(j => j.date === MOCK_TODAY).sort((a, b) => a.from.time.localeCompare(b.from.time));
  const done = today.filter(j => j.status === 5);
  const active = today.find(j => j.status >= 1 && j.status < 5) ?? today.find(j => j.status === 0 && !j.rejected);
  const f = payForecast(s);
  const score = f.score;
  const { driver } = s;
  const eta = active ? etaInfo(active) : null;

  return (
    <Screen title="Hôm nay" eyebrow={`${WD[dow(MOCK_TODAY)]}, 12 tháng 11`} trailing={<><SosButton /><Avatar /></>}>
      <div className="stack">
        {s.settings.driving && (
          <div className="banner"><Truck size={18} strokeWidth={2.4} /> Chế độ đang lái · tạm khóa nhập liệu</div>
        )}
        <ShiftCard />

        {active && (
          <SumCard icon={Truck} color="var(--blue)" title="Chuyến hiện tại" meta={active.id} onClick={() => nav(`/jobs/${active.id}`)}>
            <div className="trip-dest">{active.to.name}</div>
            <div className="sum-sub" style={{ marginTop: 2 }}>{active.from.name} → {active.to.addr}</div>
            <TripSteps status={active.status} />
            <div className="row-b">
              <span className="sum-sub">Hẹn giao {active.to.eta} · {fmt(liters(active))} L</span>
              {eta ? <Pill tone={eta.tone}>{eta.t}</Pill> : <Pill tone={jobStatus(active).tone}>{jobStatus(active).t}</Pill>}
            </div>
          </SumCard>
        )}

        <div className="grid2">
          <SumCard icon={Droplet} color="var(--teal)" title="Đã giao">
            <div><span className="sum-v">{fmt(sum(done, liters))}</span><span className="sum-u">L</span></div>
            <div className="sum-sub">{done.length}/{today.length} chuyến hôm nay</div>
          </SumCard>
          <SumCard icon={Gauge} color="var(--indigo)" title="KPI" onClick={() => nav('/att?tab=kpi')}>
            <div><span className="sum-v" style={{ color: scoreColor(score) }}>{score}</span><span className="sum-u">/100</span></div>
            <ProgressBar value={score / 100} color={scoreColor(score)} />
            <div className="sum-sub" style={{ marginTop: 5 }}>{tierOf(score).name}</div>
          </SumCard>
          <SumCard icon={Banknote} color="var(--green)" title="Thu nhập" onClick={() => nav('/fin?tab=pay')}>
            <div><span className="sum-v">{trieu(f.earned)}</span><span className="sum-u">triệu</span></div>
            <div className="sum-sub">Tới hôm nay</div>
            <div className="inc-split" />
            <div><span className="sum-v sm">{trieu(f.net)}</span><span className="sum-u">triệu</span></div>
            <div className="sum-sub">Dự kiến cuối tháng</div>
          </SumCard>
          <SumCard icon={GraduationCap} color="var(--orange)" title="Học tập" onClick={() => nav('/learn')}>
            <div><span className="sum-v">{dec(s.learnMin / 60)}</span><span className="sum-u">/ {LEARN_GOAL_MIN / 60} giờ</span></div>
            <ProgressBar value={s.learnMin / LEARN_GOAL_MIN} color="var(--orange)" />
            <div className="sum-sub" style={{ marginTop: 5 }}>Giờ học tháng này</div>
          </SumCard>
        </div>

      </div>

      <Group header="Lịch chạy hôm nay">
        {today.map(j => {
          const st = jobStatus(j);
          return (
            <Cell key={j.id} sepLeft={76} onClick={() => nav(`/jobs/${j.id}`)} chevron
              leading={<span className="time-badge">{j.from.time}</span>}
              title={j.to.name} subtitle={`${j.id} · ${fmt(liters(j))} L · ${j.km} km`}
              trailing={<Pill tone={st.tone}>{st.t}</Pill>} />
          );
        })}
      </Group>

      <Group header="Truy cập nhanh">
        <Cell icon={Receipt} tint="var(--orange)" title="Thêm chi phí / hóa đơn" chevron onClick={() => openSheet('expense')} />
        <Cell icon={ClipboardCheck} tint="var(--green)" title="Kiểm tra xe trước chuyến" detail={`${vcDone(s)}/${VCHECK.length}`} chevron onClick={() => openSheet('vcheck')} />
        <Cell icon={TriangleAlert} tint="var(--red)" title="Báo sự cố / hỏng xe" chevron onClick={() => openSheet('incident')} />
        <Cell icon={Phone} tint="var(--blue)" title={`Gọi điều độ · ${driver.dispatcher.name}`} chevron href={`tel:${driver.dispatcher.phone}`} />
      </Group>
    </Screen>
  );
}
