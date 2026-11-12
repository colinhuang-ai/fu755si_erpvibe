import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { Avatar, useSticky } from '../components/common';
import { CERTS, LEARN_BASE_MIN, LEARN_GOAL_MIN } from '../data/mock';
import { MOCK_TODAY } from '../lib/clock';
import { certDays, certLabel, certTone, courseDone } from '../lib/domain';
import { daysBetween, dec, dm, dmy } from '../lib/format';
import { useStore } from '../store';
import type { Course } from '../types';
import { iconOf } from '../ui/icons';
import { Cell, Group, Pill, ProgressBar, Ring, Screen, Segmented, Tile } from '../ui/kit';
import { useUI } from '../ui/overlay';

type Tab = 'courses' | 'certs';

export default function Learning() {
  const [tab, setTab] = useSticky<Tab>('learn', 'courses', ['courses', 'certs']);
  return (
    <Screen title="Học tập" trailing={<Avatar />}>
      <div className="pad"><Segmented value={tab} onChange={setTab} options={[['courses', 'Khóa học'], ['certs', 'Chứng chỉ']]} /></div>
      {tab === 'courses' ? <Courses /> : <Certs />}
    </Screen>
  );
}

function CourseCell({ c }: { c: Course }) {
  const nav = useNavigate();
  const d = courseDone(c), n = c.lessons.length, ratio = d / n;
  const left = c.due ? daysBetween(MOCK_TODAY, c.due) : null;
  return (
    <Cell sepLeft={72} chevron onClick={() => nav('/learn/' + c.id)}
      leading={<Tile icon={iconOf(c.icon)} color={c.color} size="lg" />}
      title={c.title}
      subtitle={
        <>
          <div className="row" style={{ gap: 6, margin: '3px 0 7px' }}>
            {ratio === 1 ? <Pill tone="green">Hoàn thành</Pill> : <span>{d}/{n} bài · {Math.round(ratio * 100)}%</span>}
            {ratio < 1 && left !== null && <Pill tone={left <= 30 ? 'orange' : 'gray'}>Hạn {dm(c.due!)}</Pill>}
          </div>
          <ProgressBar value={ratio} color={ratio === 1 ? 'var(--green)' : c.color} />
        </>
      } />
  );
}

function Courses() {
  const { s } = useStore();
  const min = LEARN_BASE_MIN + s.learnExtra;
  const req = s.courses.filter(c => c.required), opt = s.courses.filter(c => !c.required);
  const reqLeft = req.filter(c => courseDone(c) < c.lessons.length).length;
  return (
    <>
      <div className="card mx kpi-hero" style={{ marginBottom: 28 }}>
        <Ring value={min / LEARN_GOAL_MIN} size={88} stroke={11} color="var(--orange)">
          <b style={{ fontSize: 22 }}>{Math.round(min / LEARN_GOAL_MIN * 100)}%</b>
        </Ring>
        <div>
          <div className="sum-sub">Giờ học tháng 11</div>
          <div className="kpi-tier">{dec(min / 60)} / {LEARN_GOAL_MIN / 60} giờ</div>
          <div className="sum-sub" style={{ marginTop: 4 }}>{reqLeft ? `Còn ${reqLeft} khóa bắt buộc chưa hoàn thành` : 'Đã hoàn thành mọi khóa bắt buộc'}</div>
        </div>
      </div>
      <Group header="Bắt buộc" footer="Quá hạn khóa bắt buộc sẽ bị hạn chế nhận chuyến loại hàng tương ứng.">
        {req.map(c => <CourseCell key={c.id} c={c} />)}
      </Group>
      <Group header="Tự chọn">{opt.map(c => <CourseCell key={c.id} c={c} />)}</Group>
    </>
  );
}

function Certs() {
  const { s, update } = useStore();
  const { toast } = useUI();
  const requested = s.requests.some(r => r.kind === 'renew');
  return (
    <>
      <Group header="Giấy tờ & chứng chỉ" footer="Giấy tờ bắt buộc hết hạn sẽ tự động chặn phân công và nhận chuyến.">
        {CERTS.map(c => {
          const d = certDays(c.exp);
          return (
            <Cell key={c.no} icon={iconOf(c.icon)} tint={c.color} title={c.name}
              subtitle={`Số ${c.no} · hết hạn ${dmy(c.exp)}`} trailing={<Pill tone={certTone(d)}>{certLabel(d)}</Pill>} />
          );
        })}
      </Group>
      <Group footer={requested ? 'Phòng nhân sự đã nhận yêu cầu và sẽ xếp lớp bồi dưỡng.' : 'Chứng chỉ ADR hết hạn ngày 30/11/2026.'}>
        {requested
          ? <Cell icon={RefreshCw} tint="var(--green)" title="Đã gửi yêu cầu gia hạn ADR" trailing={<Pill tone="orange">Đang xử lý</Pill>} />
          : <Cell icon={RefreshCw} tint="var(--blue)" title="Đăng ký gia hạn chứng chỉ ADR" tone="blue" chevron onClick={() => {
              update(d => { d.requests.push({ id: 'r' + Date.now(), kind: 'renew', title: 'Gia hạn chứng chỉ ADR', detail: 'Đăng ký lớp bồi dưỡng', date: MOCK_TODAY, time: '' }); });
              toast('Đã gửi yêu cầu gia hạn cho phòng nhân sự');
            }} />}
      </Group>
    </>
  );
}
