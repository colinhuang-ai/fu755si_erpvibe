import { useState } from 'react';
import { Check, CircleCheck, CircleX, FileText, Play } from 'lucide-react';
import { useStore } from '../store';
import { Btn, Cell, Group } from '../ui/kit';
import { SheetHeader, useUI } from '../ui/overlay';

export function LessonSheet({ course, idx }: { course: string; idx: number }) {
  const { s, update } = useStore();
  const { closeSheet, toast } = useUI();
  const c = s.courses.find(x => x.id === course)!;
  const l = c.lessons[idx];
  const done = () => {
    if (!l.done) {
      update(d => { const x = d.courses.find(y => y.id === course)!; x.lessons[idx].done = true; d.learnExtra += l.min; });
      toast(`Hoàn thành bài ${idx + 1} · +${l.min} phút học`);
    }
    closeSheet();
  };
  return (
    <>
      <SheetHeader title={`Bài ${idx + 1}`} left="Đóng" />
      <div className="sheet-body">
        <div className="mx">
          {l.type === 'video' ? (
            <div className="player" style={{ background: c.color }}>
              <button className="play" aria-label="Phát video"><Play size={28} fill="currentColor" strokeWidth={0} /></button>
              <span className="p-dur">{l.min}:00</span>
            </div>
          ) : (
            <div className="reader">
              <FileText size={22} strokeWidth={2} />
              <p>Nội dung bài đọc được tải sẵn để học khi mất sóng. Đọc kỹ các quy định, ghi nhớ quy trình và tình huống minh họa trước khi chuyển sang bài tiếp theo.</p>
            </div>
          )}
          <h2 className="lesson-t">{l.t}</h2>
          <div className="sum-sub" style={{ marginBottom: 20 }}>{c.title} · {l.min} phút</div>
          <Btn block kind={l.done ? 'tinted' : 'filled'} icon={l.done ? CircleCheck : Check} onClick={done}>
            {l.done ? 'Đã học xong' : 'Đánh dấu đã học xong'}
          </Btn>
        </div>
      </div>
    </>
  );
}

export function QuizSheet({ course, idx }: { course: string; idx: number }) {
  const { s, update } = useStore();
  const { closeSheet, toast } = useUI();
  const c = s.courses.find(x => x.id === course)!;
  const quiz = c.quiz ?? [];
  const [ans, setAns] = useState<(number | null)[]>(() => quiz.map(() => null));
  const [result, setResult] = useState<number | null>(null);
  const pass = result !== null && result >= Math.ceil(quiz.length * 2 / 3);

  const submit = () => {
    const ok = quiz.filter((q, i) => ans[i] === q.a).length;
    setResult(ok);
    if (ok >= Math.ceil(quiz.length * 2 / 3)) {
      update(d => { const x = d.courses.find(y => y.id === course)!; if (!x.lessons[idx].done) { x.lessons[idx].done = true; d.learnExtra += x.lessons[idx].min; } });
      toast('Đạt bài kiểm tra');
    }
  };

  if (result !== null) {
    return (
      <>
        <SheetHeader title="Kết quả" left={null} right="Xong" onRight={closeSheet} />
        <div className="sheet-body">
          <div className="result">
            {pass ? <CircleCheck size={64} color="var(--green)" strokeWidth={1.8} /> : <CircleX size={64} color="var(--red)" strokeWidth={1.8} />}
            <h2>{pass ? 'Đạt yêu cầu' : 'Chưa đạt'}</h2>
            <div className="sum-sub">Bạn trả lời đúng {result}/{quiz.length} câu</div>
          </div>
          <Group>
            {quiz.map((q, i) => (
              <Cell key={i} leading={ans[i] === q.a ? <CircleCheck size={22} color="var(--green)" /> : <CircleX size={22} color="var(--red)" />}
                title={q.q} subtitle={`Đáp án: ${q.o[q.a]}`} />
            ))}
          </Group>
          {!pass && <div className="mx"><Btn block onClick={() => { setAns(quiz.map(() => null)); setResult(null); }}>Làm lại</Btn></div>}
        </div>
      </>
    );
  }

  return (
    <>
      <SheetHeader title={c.lessons[idx].t} right="Nộp bài" onRight={submit} rightDisabled={ans.some(a => a === null)} />
      <div className="sheet-body">
        {quiz.map((q, i) => (
          <section key={i} className="group">
            <div className="q-t"><span>Câu {i + 1}/{quiz.length}</span>{q.q}</div>
            <div className="cells">
              {q.o.map((o, k) => (
                <Cell key={k} title={o} onClick={() => setAns(a => a.map((x, m) => (m === i ? k : x)))}
                  trailing={<Check className="tick" size={20} strokeWidth={2.8} style={{ opacity: ans[i] === k ? 1 : 0 }} />} />
              ))}
            </div>
          </section>
        ))}
        <div className="group-f" style={{ margin: '0 16px' }}>Cần đúng tối thiểu {Math.ceil(quiz.length * 2 / 3)}/{quiz.length} câu để đạt.</div>
      </div>
    </>
  );
}
