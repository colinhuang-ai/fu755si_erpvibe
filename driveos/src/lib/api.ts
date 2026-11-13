/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AttRec, CargoLine, Job, Settings, State, TripCheck } from '../types';
import { VCHECK } from '../data/config';
import { MOCK_TODAY } from './clock';
import { pad } from './format';
import { sb } from './supabase';

type Row = Record<string, any>;
const hm = (t: string | null | undefined) => (t ? t.slice(0, 5) : null);
const u = <T>(v: T | null | undefined): T | undefined => (v === null ? undefined : v);
const nn = <T>(v: T | undefined): T | null => (v === undefined ? null : v);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const attDate = (day: string) => `${MOCK_TODAY.slice(0, 8)}${pad(Number(day))}`;

function check<T extends { error: any }>(r: T): T {
  if (r.error) throw r.error;
  return r;
}

/* ======================= Đọc ======================= */
function mapJob(r: Row): Job {
  return {
    id: r.code, dbId: r.id, date: r.job_date, status: r.status, vehicle: r.vehicle ?? '', type: r.kind,
    from: { name: r.from_name, addr: r.from_addr ?? '', time: hm(r.from_time) ?? '' },
    to: { name: r.to_name, addr: r.to_addr ?? '', eta: hm(r.to_eta) ?? '', who: r.to_who ?? '', phone: r.to_phone ?? '' },
    km: r.km, fee: r.fee, seal: u(r.seal), note: u(r.note), lateMin: r.late_min ?? 0,
    rejected: r.rejected_reason ? { reason: r.rejected_reason, note: u(r.rejected_note) } : undefined,
    confirmBy: u(r.confirm_by), deviationNote: u(r.deviation_note),
    cargo: [...(r.job_cargo ?? [])].sort((a, b) => a.idx - b.idx).map((c: Row): CargoLine => ({
      label: c.label, item: c.item, qty: c.qty, unit: c.unit, loaded: u(c.loaded), delivered: u(c.delivered)
    })),
    checks: [...(r.job_checks ?? [])].sort((a, b) => a.idx - b.idx).map((c: Row): TripCheck => ({
      t: c.title, ph: c.phase, done: c.done, sign: c.sign || undefined
    }))
  };
}

/** uid = auth.users.id của người đăng nhập */
export async function loadState(uid: string, settings: Settings): Promise<State> {
  check(await sb.rpc('seed_demo_data'));
  const drv = check(await sb.from('drivers').select('*').eq('user_id', uid).single());
  const did: string = drv.data!.id;
  const [veh, jobs, att, exps, advs, courses, prog, certs, reqs, tasks, vc] = await Promise.all([
    sb.from('vehicles').select('*').eq('driver_id', did).limit(1).maybeSingle(),
    sb.from('jobs').select('*, job_cargo(*), job_checks(*)').eq('driver_id', did).order('job_date').order('from_time'),
    sb.from('attendance').select('*').eq('driver_id', did),
    sb.from('expenses').select('*').eq('driver_id', did).order('spent_on', { ascending: false }),
    sb.from('advances').select('*').eq('driver_id', did).order('requested_on'),
    sb.from('courses').select('*, lessons(*), quiz_questions(*)').order('sort'),
    sb.from('lesson_progress').select('course_id, lesson_idx').eq('driver_id', did),
    sb.from('certificates').select('*').eq('driver_id', did).order('sort'),
    sb.from('requests').select('*').eq('driver_id', did).order('created_at'),
    sb.from('tasks').select('*').eq('driver_id', did).order('sort'),
    sb.from('vehicle_checks').select('items').eq('driver_id', did).eq('check_date', MOCK_TODAY).maybeSingle()
  ]);
  [veh, jobs, att, exps, advs, courses, prog, certs, reqs, tasks, vc].forEach(check);

  const d: Row = drv.data!;
  const words = String(d.full_name).trim().split(/\s+/);
  const done = new Set((prog.data ?? []).map((p: Row) => `${p.course_id}:${p.lesson_idx}`));
  const v: Row = veh.data ?? {};
  const vitems: boolean[] = vc.data?.items ?? [];

  return {
    driver: {
      dbId: d.id, name: d.full_name, short: words[words.length - 1], email: d.email ?? '',
      initials: (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase(),
      id: d.code, phone: d.phone ?? '', team: d.team ?? '', since: d.since ?? '',
      dob: d.dob ? `${d.dob.slice(8)}/${d.dob.slice(5, 7)}/${d.dob.slice(0, 4)}` : '',
      rating: Number(d.rating), trips: d.trips_year, km: d.km_safe, incidents: d.incidents, leaveLeft: d.leave_left,
      company: d.company ?? '', dispatcher: { name: d.dispatcher_name ?? '', phone: d.dispatcher_phone ?? '' },
      hse: { name: d.hse_name ?? '', phone: d.hse_phone ?? '' }
    },
    vehicle: {
      plate: v.plate ?? '—', model: v.model ?? '', compartments: v.compartments ?? [], registry: v.registry_exp ?? '',
      tankInspect: v.tank_inspect_exp ?? '', odo: v.odo ?? 0, nextService: v.next_service_km ?? 0
    },
    certs: (certs.data ?? []).map((c: Row) => ({ name: c.name, no: c.number ?? '', exp: c.expires_on, icon: c.icon, color: c.color, renew: c.renewable || undefined })),
    att: Object.fromEntries((att.data ?? [])
      .filter((a: Row) => String(a.work_date).startsWith(MOCK_TODAY.slice(0, 8)))
      .map((a: Row): [string, AttRec] => [String(Number(a.work_date.slice(8))), {
        in: hm(a.check_in), out: hm(a.check_out), note: u(a.note), explain: u(a.explain), explainText: u(a.explain_text)
      }])),
    jobs: (jobs.data ?? []).map(mapJob),
    expenses: (exps.data ?? []).map((e: Row) => ({
      id: e.id, date: e.spent_on, time: hm(e.spent_time) ?? '', cat: e.category, title: e.title, place: e.place ?? '',
      amount: Number(e.amount), status: e.status, receipt: e.receipt, vat: e.vat, reason: u(e.reject_reason),
      liters: e.liters == null ? undefined : Number(e.liters), odo: u(e.odo), jobId: u(e.job_code), overNote: u(e.over_note)
    })),
    advances: (advs.data ?? []).map((a: Row) => ({ id: a.id, date: a.requested_on, amount: Number(a.amount), reason: a.reason ?? '', status: a.status })),
    courses: (courses.data ?? []).map((c: Row) => {
      const quiz = [...(c.quiz_questions ?? [])].sort((a, b) => a.idx - b.idx).map((q: Row) => ({ q: q.question, o: q.options, a: q.answer }));
      return {
        id: c.id, title: c.title, required: c.required, due: u(c.due), color: c.color, icon: c.icon,
        lessons: [...(c.lessons ?? [])].sort((a, b) => a.idx - b.idx)
          .map((l: Row) => ({ t: l.title, type: l.type, min: l.minutes, done: done.has(`${c.id}:${l.idx}`) })),
        quiz: quiz.length ? quiz : undefined
      };
    }),
    vcheck: VCHECK.map((_, i) => Boolean(vitems[i])),
    learnMin: d.learn_minutes_month ?? 0,
    requests: (reqs.data ?? []).map((r: Row) => ({ id: r.id, kind: r.kind, title: r.title, detail: r.detail ?? '', date: r.created_at.slice(0, 10), time: r.created_at.slice(11, 16), status: r.status, response: u(r.response) })),
    tasks: (tasks.data ?? []).map((t: Row) => ({ id: t.id, title: t.title, due: t.due, done: t.done })),
    settings
  };
}

/* ======================= Ghi: đồng bộ phần thay đổi ======================= */
const jobRow = (j: Job) => ({
  status: j.status, seal: nn(j.seal), late_min: j.lateMin, rejected_reason: j.rejected?.reason ?? null,
  rejected_note: j.rejected?.note ?? null, confirm_by: nn(j.confirmBy), deviation_note: nn(j.deviationNote)
});
const cargoRow = (jobId: string, c: CargoLine, idx: number) => ({
  job_id: jobId, idx, label: c.label, item: c.item, qty: c.qty, unit: c.unit, loaded: nn(c.loaded), delivered: nn(c.delivered)
});
const checkRow = (jobId: string, c: TripCheck, idx: number) => ({ job_id: jobId, idx, title: c.t, phase: c.ph, done: c.done, sign: !!c.sign });
const attRow = (uid: string, day: string, r: AttRec) => ({
  driver_id: uid, work_date: attDate(day), check_in: r.in, check_out: r.out, note: nn(r.note), explain: nn(r.explain), explain_text: nn(r.explainText)
});
const expRow = (uid: string, e: State['expenses'][number]) => ({
  id: e.id, driver_id: uid, spent_on: e.date, spent_time: e.time || null, category: e.cat, title: e.title, place: e.place,
  amount: e.amount, status: e.status, receipt: e.receipt, vat: !!e.vat, reject_reason: nn(e.reason), liters: nn(e.liters),
  odo: nn(e.odo), job_code: nn(e.jobId), over_note: nn(e.overNote)
});

/** So sánh trạng thái trước/sau một thao tác và ghi những dòng thay đổi lên Supabase (uid = drivers.id) */
export async function syncDiff(prev: State, next: State, uid: string) {
  const ops: PromiseLike<{ error: any }>[] = [];

  if (prev.learnMin !== next.learnMin) ops.push(sb.from('drivers').update({ learn_minutes_month: next.learnMin }).eq('id', uid));

  for (const j of next.jobs) {
    const p = prev.jobs.find(x => x.id === j.id);
    if (!p || !j.dbId) continue;
    if (!same(jobRow(p), jobRow(j))) ops.push(sb.from('jobs').update(jobRow(j)).eq('id', j.dbId));
    const cargo = j.cargo.map((c, i) => cargoRow(j.dbId!, c, i)).filter((r, i) => !p.cargo[i] || !same(r, cargoRow(j.dbId!, p.cargo[i], i)));
    if (cargo.length) ops.push(sb.from('job_cargo').upsert(cargo));
    const checks = j.checks.map((c, i) => checkRow(j.dbId!, c, i)).filter((r, i) => !p.checks[i] || !same(r, checkRow(j.dbId!, p.checks[i], i)));
    if (checks.length) ops.push(sb.from('job_checks').upsert(checks));
  }

  const attChanged = Object.keys(next.att).filter(k => !same(prev.att[k], next.att[k]));
  if (attChanged.length) ops.push(sb.from('attendance').upsert(attChanged.map(k => attRow(uid, k, next.att[k]))));

  for (const e of next.expenses) {
    const p = prev.expenses.find(x => x.id === e.id);
    if (!p) ops.push(sb.from('expenses').insert(expRow(uid, e)));
    else if (!same(p, e)) ops.push(sb.from('expenses').update(expRow(uid, e)).eq('id', e.id));
  }
  const removed = prev.expenses.filter(p => !next.expenses.some(e => e.id === p.id)).map(p => p.id);
  if (removed.length) ops.push(sb.from('expenses').delete().in('id', removed));

  for (const a of next.advances) {
    if (!prev.advances.some(x => x.id === a.id)) {
      ops.push(sb.from('advances').insert({ id: a.id, driver_id: uid, requested_on: a.date, amount: a.amount, reason: a.reason, status: a.status }));
    }
  }

  for (const c of next.courses) {
    const p = prev.courses.find(x => x.id === c.id);
    c.lessons.forEach((l, i) => {
      if (!p || p.lessons[i]?.done === l.done) return;
      ops.push(l.done
        ? sb.from('lesson_progress').upsert({ driver_id: uid, course_id: c.id, lesson_idx: i })
        : sb.from('lesson_progress').delete().match({ driver_id: uid, course_id: c.id, lesson_idx: i }));
    });
  }

  if (!same(prev.vcheck, next.vcheck)) {
    ops.push(sb.from('vehicle_checks').upsert({ driver_id: uid, check_date: MOCK_TODAY, items: next.vcheck, updated_at: new Date().toISOString() }));
  }

  for (const r of next.requests) {
    if (!prev.requests.some(x => x.id === r.id)) {
      ops.push(sb.from('requests').insert({ id: r.id, driver_id: uid, kind: r.kind, title: r.title, detail: r.detail }));
    }
  }

  for (const t of next.tasks) {
    const p = prev.tasks.find(x => x.id === t.id);
    if (p && !same(p, t)) ops.push(sb.from('tasks').update({ title: t.title, due: t.due, done: t.done }).eq('id', t.id));
  }

  const results = await Promise.all(ops);
  const failed = results.find(r => r.error);
  if (failed) throw failed.error;
}

export async function resetDemo() {
  check(await sb.rpc('seed_demo_data', { force: true }));
}
