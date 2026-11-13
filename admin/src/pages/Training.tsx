import { useState } from 'react';
import { ArrowDown, ArrowUp, BookOpen, Flame, Droplet, Fuel, Plus, ShieldCheck, Trash2, Truck, type LucideIcon } from 'lucide-react';
import { useAuth } from '../auth';
import { COURSE_COLORS, COURSE_ICONS } from '../lib/config';
import { daysBetween, dmy, norm, pct, sum, TODAY } from '../lib/format';
import { useQuery } from '../lib/query';
import { must, sb } from '../lib/supabase';
import type { Course, Driver, Lesson, Progress, Quiz } from '../types';
import { Bar, Btn, Card, Empty, Field, Loading, Modal, Pill, Segmented, Switch, Tile } from '../ui/kit';
import { useFeedback } from '../ui/feedback';

const ICONS: Record<string, LucideIcon> = { shield: ShieldCheck, flame: Flame, droplet: Droplet, truck: Truck, fuel: Fuel, book: BookOpen };

export default function Training() {
  const { can } = useAuth();
  const [tab, setTab] = useState<'courses' | 'progress'>('courses');
  const [edit, setEdit] = useState<Course | 'new' | null>(null);
  const q = useQuery(async () => {
    const [c, d, p] = await Promise.all([
      sb.from('courses').select('*, lessons(*), quiz_questions(*)').order('sort'),
      sb.from('drivers').select('id, full_name, code').eq('active', true).order('code'),
      sb.from('lesson_progress').select('driver_id, course_id, lesson_idx')
    ]);
    return { courses: must(c) as Course[], drivers: must(d) as Driver[], prog: must(p) as Progress[] };
  }, []);

  if (!q.data) return <div className="page"><h1>Đào tạo</h1>{q.error ? <div className="error-box mt">{q.error}</div> : <Loading />}</div>;
  const { courses, drivers, prog } = q.data;
  const ratio = (dId: string, c: Course) => {
    const n = c.lessons?.length ?? 0;
    return n ? prog.filter(p => p.driver_id === dId && p.course_id === c.id).length / n : 0;
  };

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Đào tạo</h1><div className="sub">Khóa học an toàn cho lái xe · khóa bắt buộc quá hạn sẽ hạn chế nhận chuyến</div></div>
        <div className="row">
          <Segmented value={tab} onChange={setTab} options={[['courses', 'Khóa học', courses.length], ['progress', 'Tiến độ lái xe']]} />
          {can('hr') && <Btn kind="primary" icon={Plus} onClick={() => setEdit('new')}>Khóa học mới</Btn>}
        </div>
      </div>

      {tab === 'courses' ? (
        courses.length ? (
          <div className="course-grid">
            {courses.map(c => {
              const avg = drivers.length ? sum(drivers, d => ratio(d.id, c)) / drivers.length : 0;
              const done = drivers.filter(d => ratio(d.id, c) === 1).length;
              const left = c.due ? daysBetween(TODAY, c.due) : null;
              return (
                <div key={c.id} className="card course-card" onClick={() => can('hr') && setEdit(c)} role={can('hr') ? 'button' : undefined}>
                  <div className="row"><Tile lg icon={ICONS[c.icon] ?? BookOpen} color={c.color} />
                    <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
                      {c.required ? <Pill tone="red">Bắt buộc</Pill> : <Pill>Tự chọn</Pill>}
                      {c.due && <Pill tone={left! < 0 ? 'red' : left! <= 30 ? 'orange' : 'gray'}>Hạn {dmy(c.due)}</Pill>}
                    </div>
                  </div>
                  <h3>{c.title}</h3>
                  <div className="muted small">{c.lessons?.length ?? 0} bài · {sum(c.lessons ?? [], l => l.minutes)} phút · {c.quiz_questions?.length ?? 0} câu hỏi kiểm tra</div>
                  <Bar value={avg} color={c.color} />
                  <div className="muted small">{done}/{drivers.length} lái xe hoàn thành · trung bình {pct(avg, 0)}</div>
                </div>
              );
            })}
          </div>
        ) : <Card><Empty icon={BookOpen} text="Chưa có khóa học" /></Card>
      ) : (
        <Card pad={false}>
          <div className="table-wrap">
            <table className="t">
              <thead><tr><th>Lái xe</th>{courses.map(c => <th key={c.id} title={c.title} style={{ minWidth: 130 }}><span className="ellip" style={{ display: 'block', maxWidth: 150 }}>{c.title}</span></th>)}</tr></thead>
              <tbody>
                {drivers.map(d => (
                  <tr key={d.id}>
                    <td><b>{d.full_name}</b> <span className="muted small">{d.code}</span></td>
                    {courses.map(c => {
                      const r = ratio(d.id, c);
                      const late = c.required && r < 1 && c.due && daysBetween(TODAY, c.due) < 0;
                      const soon = c.required && r < 1 && c.due && daysBetween(TODAY, c.due) <= 30;
                      const color = r === 1 ? 'var(--green)' : late ? 'var(--red)' : soon ? 'var(--orange)' : c.color;
                      return <td key={c.id}><div className="row"><div style={{ flex: 1 }}><Bar value={r} color={color} /></div><span className="small num" style={{ width: 36, textAlign: 'right', color: late ? 'var(--red)' : undefined }}>{pct(r, 0)}</span></div></td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {edit && <CourseEditor course={edit === 'new' ? null : edit} existing={courses} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); q.reload(); }} />}
    </div>
  );
}

type QDraft = { question: string; options: string[]; answer: number };
type LDraft = { title: string; type: Lesson['type']; minutes: number };

function CourseEditor({ course, existing, onClose, onSaved }: { course: Course | null; existing: Course[]; onClose: () => void; onSaved: () => void }) {
  const { run, confirm } = useFeedback();
  const [id, setId] = useState(course?.id ?? `c${existing.length + 1}`);
  const [title, setTitle] = useState(course?.title ?? '');
  const [required, setRequired] = useState(course?.required ?? false);
  const [due, setDue] = useState(course?.due ?? '');
  const [color, setColor] = useState(course?.color ?? COURSE_COLORS[3]);
  const [icon, setIcon] = useState(course?.icon ?? 'book');
  const [lessons, setLessons] = useState<LDraft[]>(() => [...(course?.lessons ?? [])].sort((a, b) => a.idx - b.idx).map(l => ({ title: l.title, type: l.type, minutes: l.minutes })));
  const [quiz, setQuiz] = useState<QDraft[]>(() => [...(course?.quiz_questions ?? [])].sort((a, b) => a.idx - b.idx).map(q => ({ question: q.question, options: [...q.options], answer: q.answer })));
  const idTaken = !course && existing.some(c => norm(c.id) === norm(id));
  const valid = id.trim() && !idTaken && title.trim() && lessons.every(l => l.title.trim()) && quiz.every(q => q.question.trim() && q.options.filter(o => o.trim()).length >= 2 && q.options[q.answer]?.trim());

  const setL = (i: number, p: Partial<LDraft>) => setLessons(x => x.map((l, k) => (k === i ? { ...l, ...p } : l)));
  const move = (i: number, d: number) => setLessons(x => { const y = [...x]; [y[i], y[i + d]] = [y[i + d], y[i]]; return y; });
  const setQ = (i: number, p: Partial<QDraft>) => setQuiz(x => x.map((q, k) => (k === i ? { ...q, ...p } : q)));

  const save = async () => {
    const cid = id.trim();
    const ok = await run(async () => {
      must(await sb.from('courses').upsert({ id: cid, title: title.trim(), required, due: due || null, color, icon, sort: course?.sort ?? existing.length }));
      must(await sb.from('lessons').delete().eq('course_id', cid).gte('idx', lessons.length));
      if (lessons.length) {
        must(await sb.from('lessons').upsert(lessons.map((l, i): Lesson => ({ course_id: cid, idx: i, title: l.title.trim(), type: l.type, minutes: Number(l.minutes) || 0 }))));
      }
      must(await sb.from('quiz_questions').delete().eq('course_id', cid));
      if (quiz.length) {
        must(await sb.from('quiz_questions').insert(quiz.map((q, i): Quiz => {
          const opts = q.options.map(o => o.trim());
          const kept = opts.filter(Boolean);
          return { course_id: cid, idx: i, question: q.question.trim(), options: kept, answer: kept.indexOf(opts[q.answer]) };
        })));
      }
    }, 'Đã lưu khóa học');
    if (ok) onSaved();
  };
  const del = async () => {
    if (!course) return;
    const yes = await confirm({ title: `Xóa khóa “${course.title}”?`, message: 'Tiến độ học của mọi lái xe trong khóa này cũng bị xóa.', ok: 'Xóa khóa học', danger: true });
    if (yes && await run(async () => { must(await sb.from('courses').delete().eq('id', course.id)); }, 'Đã xóa khóa học')) onSaved();
  };

  return (
    <Modal wide title={course ? 'Sửa khóa học' : 'Khóa học mới'} sub="Thay đổi hiện ngay trong app của lái xe." onClose={onClose}
      footer={<>{course && <span className="left"><Btn kind="danger" icon={Trash2} onClick={del}>Xóa khóa học</Btn></span>}
        <Btn onClick={onClose}>Hủy</Btn><Btn kind="primary" disabled={!valid} onClick={save}>Lưu</Btn></>}>
      <div className="form">
        <Field label="Tên khóa học" full><input className="input" value={title} onChange={e => setTitle(e.target.value)} autoFocus /></Field>
        <Field label="Mã khóa" error={idTaken ? 'Mã đã tồn tại' : undefined} hint={course ? 'Không đổi được mã' : undefined}>
          <input className="input" value={id} disabled={!!course} onChange={e => setId(e.target.value.replace(/\s/g, ''))} /></Field>
        <Field label="Hạn hoàn thành"><input className="input" type="date" value={due} onChange={e => setDue(e.target.value)} /></Field>
        <Field label="Bắt buộc"><div className="row"><Switch on={required} onChange={setRequired} /><span className="muted small">Quá hạn sẽ hạn chế nhận chuyến</span></div></Field>
        <Field label="Biểu tượng">
          <select className="select" value={icon} onChange={e => setIcon(e.target.value)}>{COURSE_ICONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        </Field>
        <Field label="Màu" full>
          <div className="swatches">{COURSE_COLORS.map(c => <button key={c} type="button" className={`swatch ${color === c ? 'on' : ''}`} style={{ background: c }} onClick={() => setColor(c)} aria-label={c} />)}</div>
        </Field>
      </div>

      <div className="sec-t" style={{ marginTop: 20 }}>Bài học · {lessons.length}</div>
      <table className="t">
        <thead><tr><th style={{ width: 30 }}>#</th><th>Tên bài</th><th style={{ width: 120 }}>Loại</th><th style={{ width: 80 }}>Phút</th><th style={{ width: 110 }} /></tr></thead>
        <tbody>
          {lessons.map((l, i) => (
            <tr key={i}>
              <td className="muted">{i + 1}</td>
              <td><input className="input" style={{ width: '100%' }} value={l.title} onChange={e => setL(i, { title: e.target.value })} /></td>
              <td><select className="select" value={l.type} onChange={e => setL(i, { type: e.target.value as Lesson['type'] })}>
                <option value="video">Video</option><option value="read">Bài đọc</option><option value="quiz">Kiểm tra</option></select></td>
              <td><input className="input" type="number" min={1} style={{ width: 64 }} value={l.minutes} onChange={e => setL(i, { minutes: Number(e.target.value) })} /></td>
              <td className="act">
                <Btn size="sm" icon={ArrowUp} title="Lên" disabled={i === 0} onClick={() => move(i, -1)} />{' '}
                <Btn size="sm" icon={ArrowDown} title="Xuống" disabled={i === lessons.length - 1} onClick={() => move(i, 1)} />{' '}
                <Btn size="sm" icon={Trash2} title="Xóa" onClick={() => setLessons(x => x.filter((_, k) => k !== i))} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Btn size="sm" icon={Plus} style={{ marginTop: 8 }} onClick={() => setLessons(x => [...x, { title: '', type: 'video', minutes: 10 }])}>Thêm bài</Btn>
      {course && <div className="muted small" style={{ marginTop: 6 }}>Lưu ý: tiến độ học được lưu theo thứ tự bài — đổi thứ tự sẽ chuyển tiến độ theo vị trí.</div>}

      <div className="sec-t" style={{ marginTop: 20 }}>Bài kiểm tra · {quiz.length} câu</div>
      <div className="col" style={{ gap: 10 }}>
        {quiz.map((q, i) => (
          <div key={i} className="q-card">
            <div className="row">
              <b className="small muted">Câu {i + 1}</b>
              <input className="input" style={{ flex: 1 }} value={q.question} placeholder="Nội dung câu hỏi" onChange={e => setQ(i, { question: e.target.value })} />
              <Btn size="sm" icon={Trash2} title="Xóa câu" onClick={() => setQuiz(x => x.filter((_, k) => k !== i))} />
            </div>
            {q.options.map((o, k) => (
              <label key={k} className="row" style={{ paddingLeft: 52 }}>
                <input type="radio" className="check" name={`q${i}`} checked={q.answer === k} onChange={() => setQ(i, { answer: k })} />
                <input className="input" style={{ flex: 1 }} value={o} placeholder={`Phương án ${String.fromCharCode(65 + k)}`}
                  onChange={e => setQ(i, { options: q.options.map((x, m) => (m === k ? e.target.value : x)) })} />
              </label>
            ))}
            <div className="muted small" style={{ paddingLeft: 52 }}>Chọn nút tròn ở phương án đúng.</div>
          </div>
        ))}
      </div>
      <Btn size="sm" icon={Plus} style={{ marginTop: 8 }} onClick={() => setQuiz(x => [...x, { question: '', options: ['', '', '', ''], answer: 0 }])}>Thêm câu hỏi</Btn>
    </Modal>
  );
}
