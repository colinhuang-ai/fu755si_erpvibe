import { useNavigate } from 'react-router-dom';
import {
  Banknote, BookOpen, ClipboardCheck, Droplet, Gauge, GraduationCap, ListChecks, Phone, Receipt, ShieldAlert,
  TriangleAlert, Truck, Wrench, type LucideIcon
} from 'lucide-react';
import { Avatar, etaInfo, ShiftCard, SosButton, TripSteps } from '../components/common';
import { CERTS, DRIVER, LEARN_BASE_MIN, LEARN_GOAL_MIN, VCHECK } from '../data/mock';
import { MOCK_TODAY, useNow } from '../lib/clock';
import { certDays, courseDone, jobStatus, kpiScore, liters, pay, scoreColor, tierOf, vcDone, vcCriticalLeft } from '../lib/domain';
import { daysBetween, dec, dm, dmy, fmt, sum, trieu, WD, dow } from '../lib/format';
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
  const score = kpiScore(s), p = pay(s);
  const learnMin = LEARN_BASE_MIN + s.learnExtra;

  const alerts: { icon: LucideIcon; tint: string; title: string; sub: string; go: () => void }[] = [];
  CERTS.forEach(c => {
    const d = certDays(c.exp);
    if (d <= 60) alerts.push({ icon: ShieldAlert, tint: 'var(--red)', title: `${c.name} sắp hết hạn`, sub: `Còn ${d} ngày · ${dmy(c.exp)}. Hết hạn sẽ bị chặn nhận chuyến.`, go: () => nav('/learn?tab=certs') });
  });
  s.courses.filter(c => c.required && courseDone(c) < c.lessons.length && c.due).forEach(c => {
    const d = daysBetween(MOCK_TODAY, c.due!);
    if (d <= 30) alerts.push({ icon: BookOpen, tint: 'var(--orange)', title: 'Khóa bắt buộc chưa hoàn thành', sub: `${c.title} · hạn ${dm(c.due!)}`, go: () => nav('/learn/' + c.id) });
  });
  if (vcCriticalLeft(s) > 0) alerts.push({ icon: ClipboardCheck, tint: 'var(--blue)', title: 'Chưa kiểm tra xe trước chuyến', sub: `Đã xong ${vcDone(s)}/${VCHECK.length} hạng mục · bắt buộc trước khi lấy hàng`, go: () => openSheet('vcheck') });
  s.tasks.filter(t => !t.done && daysBetween(MOCK_TODAY, t.due) <= 3).forEach(t =>
    alerts.push({ icon: ListChecks, tint: 'var(--indigo)', title: t.title, sub: `Nhiệm vụ · hạn ${dm(t.due)}`, go: () => nav('/me') }));
  const kmLeft = DRIVER.vehicle.nextService - DRIVER.vehicle.odo;
  if (kmLeft <= 2000) alerts.push({ icon: Wrench, tint: 'var(--gray)', title: 'Sắp đến kỳ bảo dưỡng', sub: `Còn ${fmt(kmLeft)} km tới mốc ${fmt(DRIVER.vehicle.nextService)} km`, go: () => nav('/me') });

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
            <div><span className="sum-v">{trieu(p.net)}</span><span className="sum-u">triệu</span></div>
            <div className="sum-sub">Dự kiến tháng 11</div>
          </SumCard>
          <SumCard icon={GraduationCap} color="var(--orange)" title="Học tập" onClick={() => nav('/learn')}>
            <div><span className="sum-v">{dec(learnMin / 60)}</span><span className="sum-u">/ {LEARN_GOAL_MIN / 60} giờ</span></div>
            <ProgressBar value={learnMin / LEARN_GOAL_MIN} color="var(--orange)" />
            <div className="sum-sub" style={{ marginTop: 5 }}>Giờ học tháng này</div>
          </SumCard>
        </div>
      </div>

      {alerts.length > 0 && (
        <Group header="Cần chú ý">
          {alerts.map((a, i) => <Cell key={i} icon={a.icon} tint={a.tint} title={a.title} subtitle={a.sub} chevron onClick={a.go} />)}
        </Group>
      )}

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
        <Cell icon={Phone} tint="var(--blue)" title={`Gọi điều độ · ${DRIVER.dispatcher.name}`} chevron href={`tel:${DRIVER.dispatcher.phone}`} />
      </Group>
    </Screen>
  );
}
