import { Truck } from 'lucide-react';
import { Avatar, JobCard, useSticky } from '../components/common';
import { MOCK_TODAY } from '../lib/clock';
import { liters } from '../lib/domain';
import { fmt, sum } from '../lib/format';
import { useStore } from '../store';
import { Empty, Screen, Segmented } from '../ui/kit';

type Tab = 'today' | 'up' | 'hist';

export default function Jobs() {
  const { s } = useStore();
  const [tab, setTab] = useSticky<Tab>('jobs', 'today', ['today', 'up', 'hist']);
  const key = (d: string, t: string) => d + t;
  const jobs = s.jobs
    .filter(j => (tab === 'today' ? j.date === MOCK_TODAY : tab === 'up' ? j.date > MOCK_TODAY : j.date < MOCK_TODAY))
    .sort((a, b) => tab === 'hist'
      ? key(b.date, b.from.time).localeCompare(key(a.date, a.from.time))
      : key(a.date, a.from.time).localeCompare(key(b.date, b.from.time)));

  return (
    <Screen title="Công việc" trailing={<Avatar />}>
      <div className="pad">
        <Segmented value={tab} onChange={setTab} options={[['today', 'Hôm nay'], ['up', 'Sắp tới'], ['hist', 'Lịch sử']]} />
        <div className="caption">
          {jobs.length} chuyến · {fmt(sum(jobs, liters))} L · {fmt(sum(jobs, j => j.km))} km
        </div>
      </div>
      {jobs.length ? (
        <div className="stack">{jobs.map(j => <JobCard key={j.id} j={j} />)}</div>
      ) : (
        <Empty icon={Truck} title="Chưa có chuyến nào" text="Điều phối sẽ gửi thông báo khi có lệnh mới." />
      )}
    </Screen>
  );
}
