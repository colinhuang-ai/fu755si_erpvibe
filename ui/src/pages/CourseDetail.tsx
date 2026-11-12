import { useParams } from 'react-router-dom';
import { BookOpen, CircleCheck, FileText, ListChecks, PlayCircle } from 'lucide-react';
import { MOCK_TODAY } from '../lib/clock';
import { courseDone } from '../lib/domain';
import { daysBetween, dmy, sum } from '../lib/format';
import { useStore } from '../store';
import { iconOf } from '../ui/icons';
import { Btn, Cell, Empty, Group, Pill, ProgressBar, RCheck, Screen, Tile } from '../ui/kit';
import { useUI } from '../ui/overlay';

const TYPE = { video: { l: 'Video', I: PlayCircle }, read: { l: 'Bài đọc', I: FileText }, quiz: { l: 'Kiểm tra', I: ListChecks } };

export default function CourseDetail() {
  const { id } = useParams();
  const { s } = useStore();
  const { openSheet } = useUI();
  const c = s.courses.find(x => x.id === id);
  if (!c) return <Screen title="Khóa học" large={false} back={{ label: 'Học tập', to: '/learn' }}><Empty icon={BookOpen} title="Không tìm thấy khóa học" /></Screen>;

  const d = courseDone(c), n = c.lessons.length, next = c.lessons.findIndex(l => !l.done);
  const open = (i: number) => openSheet(c.lessons[i].type === 'quiz' && c.quiz ? 'quiz' : 'lesson', { course: c.id, idx: i });

  const action = next >= 0
    ? <Btn block icon={PlayCircle} onClick={() => open(next)}>Học tiếp · Bài {next + 1}</Btn>
    : <Btn block kind="tinted" icon={CircleCheck}>Đã hoàn thành khóa học</Btn>;

  return (
    <Screen title={c.title} large={false} back={{ label: 'Học tập', to: '/learn' }} action={action}>
      <div className="course-head">
        <Tile icon={iconOf(c.icon)} color={c.color} size="xl" />
        <div>
          <h2>{c.title}</h2>
          <div className="row" style={{ gap: 6, marginTop: 6 }}>
            {c.required ? <Pill tone="red">Bắt buộc</Pill> : <Pill>Tự chọn</Pill>}
            {c.due && <Pill tone={daysBetween(MOCK_TODAY, c.due) <= 30 ? 'orange' : 'gray'}>Hạn {dmy(c.due)}</Pill>}
          </div>
        </div>
      </div>
      <div className="card mx" style={{ marginBottom: 28 }}>
        <div className="row-b" style={{ marginBottom: 8 }}>
          <span className="bold">{d}/{n} bài hoàn thành</span>
          <span className="sum-sub">{sum(c.lessons, l => l.min)} phút</span>
        </div>
        <ProgressBar value={d / n} color={c.color} height={6} />
      </div>
      <Group header="Nội dung khóa học" footer={c.quiz ? 'Bài kiểm tra cần đúng tối thiểu 2/3 câu để đạt.' : undefined}>
        {c.lessons.map((l, i) => {
          const T = TYPE[l.type];
          return (
            <Cell key={i} sepLeft={52} leading={<RCheck on={l.done} green />} title={`${i + 1}. ${l.t}`}
              subtitle={<span className="row" style={{ gap: 5 }}><T.I size={13} strokeWidth={2.4} />{T.l} · {l.min} phút</span>}
              chevron onClick={() => open(i)} />
          );
        })}
      </Group>
    </Screen>
  );
}
