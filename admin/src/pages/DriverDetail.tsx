import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, KeyRound, Lock, LockOpen, Pencil, Plus, Save, Trash2, Truck, UserPlus } from 'lucide-react';
import { accounts, useAccounts, type Credential } from '../lib/accounts';
import { CredentialModal } from '../ui/CredentialModal';
import { timeAgo } from '../lib/format';
import { useAuth } from '../auth';
import { CATS, CERT_PRESETS } from '../lib/config';
import { attLabel, certState, classify, cargoText, lossOf } from '../lib/domain';
import { dm, dmy, dur, fmt, hm, money, pct, sum, toMin, WD, dow } from '../lib/format';
import { useQuery } from '../lib/query';
import { must, sb } from '../lib/supabase';
import type { Attendance, Cert, Driver, Expense, Job, Vehicle } from '../types';
import { Avatar, Btn, Card, Empty, Field, Loading, Modal, Pill, Segmented, Switch } from '../ui/kit';
import { useFeedback } from '../ui/feedback';
import { CreateJobModal, JOB_SELECT, JobDrawer, StatusPill } from './jobParts';
import { reviewExplain } from './Attendance';

type Tab = 'profile' | 'certs' | 'jobs' | 'att' | 'exp';

export default function DriverDetail() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { can } = useAuth();
  const [tab, setTab] = useState<Tab>('profile');
  const [creating, setCreating] = useState(false);
  const q = useQuery(async () => {
    const [d, j, a, e] = await Promise.all([
      sb.from('drivers').select('*, vehicles(*), certificates(*)').eq('id', id).single(),
      sb.from('jobs').select(JOB_SELECT).eq('driver_id', id).order('job_date', { ascending: false }).order('from_time', { ascending: false }),
      sb.from('attendance').select('*').eq('driver_id', id).order('work_date', { ascending: false }),
      sb.from('expenses').select('*').eq('driver_id', id).order('spent_on', { ascending: false })
    ]);
    return { d: must(d) as Driver, jobs: must(j) as Job[], att: must(a) as Attendance[], exp: must(e) as Expense[] };
  }, [id]);

  if (!q.data) return <div className="page">{q.error ? <div className="error-box">{q.error}</div> : <Loading />}</div>;
  const { d, jobs, att, exp } = q.data;
  const certs = [...(d.certificates ?? [])].sort((a, b) => a.sort - b.sort);
  const expired = certs.filter(c => certState(c.expires_on).days < 0);

  return (
    <div className="page">
      <button className="back" onClick={() => nav('/drivers')}><ChevronLeft size={16} />Lái xe</button>
      <div className="page-head">
        <div className="row" style={{ gap: 14 }}>
          <Avatar name={d.full_name} lg />
          <div>
            <h1>{d.full_name}</h1>
            <div className="row" style={{ marginTop: 4, flexWrap: 'wrap' }}>
              <span className="muted">{d.code} · {d.team}</span>
              {d.user_id ? <Pill tone="green">Có tài khoản app</Pill> : <Pill tone="orange">Chưa có tài khoản app</Pill>}
              {!d.active && <Pill tone="red">Ngừng hoạt động</Pill>}
              {expired.length > 0 && <Pill tone="red">Giấy tờ hết hạn — bị chặn phân công</Pill>}
            </div>
          </div>
        </div>
        {can('dispatcher') && <Btn kind="primary" icon={Truck} disabled={expired.length > 0} onClick={() => setCreating(true)}>Tạo lệnh cho lái xe này</Btn>}
      </div>

      <div className="toolbar">
        <Segmented value={tab} onChange={setTab} options={[
          ['profile', 'Hồ sơ & xe'], ['certs', 'Giấy tờ', certs.length], ['jobs', 'Chuyến', jobs.length],
          ['att', 'Chấm công', att.filter(a => a.check_in).length], ['exp', 'Chi phí', exp.length]]} />
      </div>

      {tab === 'profile' && <><AccountCard d={d} onChanged={q.reload} /><ProfileTab d={d} onSaved={q.reload} /></>}
      {tab === 'certs' && <CertsTab driverId={d.id} certs={certs} onChanged={q.reload} />}
      {tab === 'jobs' && <JobsTab jobs={jobs} onChanged={q.reload} />}
      {tab === 'att' && <AttTab att={att} driverId={d.id} onChanged={q.reload} />}
      {tab === 'exp' && <ExpTab exp={exp} />}
      {creating && <CreateJobModal driverId={d.id} onClose={() => setCreating(false)} onCreated={() => { setCreating(false); setTab('jobs'); q.reload(); }} />}
    </div>
  );
}

/** Tài khoản đăng nhập app lái xe: cấp mới, đặt lại mật khẩu, khóa */
function AccountCard({ d, onChanged }: { d: Driver; onChanged: () => void }) {
  const { can } = useAuth();
  const { run, confirm } = useFeedback();
  const acc = useAccounts();
  const [cred, setCred] = useState<{ c: Credential; title: string } | null>(null);
  const a = d.user_id ? acc.data?.get(d.user_id) : undefined;
  const login = d.email?.endsWith('@driveros.invalid') ? d.code : d.email;
  const hr = can('hr');

  const create = () => run(async () => {
    setCred({ c: await accounts<Credential>({ action: 'create', kind: 'driver', driver_id: d.id }), title: 'Đã cấp tài khoản cho lái xe' });
    onChanged(); acc.reload();
  });
  const reset = async () => {
    if (!await confirm({ title: `Đặt lại mật khẩu cho ${d.full_name}?`, message: 'Mật khẩu cũ sẽ không dùng được nữa.', ok: 'Đặt lại' })) return;
    await run(async () => setCred({ c: await accounts<Credential>({ action: 'reset_password', user_id: d.user_id }), title: 'Mật khẩu mới' }));
  };
  const ban = (banned: boolean) => run(async () => { await accounts({ action: 'set_banned', user_id: d.user_id, banned }); acc.reload(); },
    banned ? 'Đã khóa tài khoản' : 'Đã mở khóa');

  return (
    <Card title="Tài khoản đăng nhập app lái xe" style={{ marginBottom: 16 }}
      actions={hr && (d.user_id ? <>
        <Btn size="sm" icon={KeyRound} onClick={reset}>Đặt lại mật khẩu</Btn>
        {a && <Btn size="sm" kind={a.banned ? undefined : 'danger'} icon={a.banned ? LockOpen : Lock} onClick={() => ban(!a.banned)}>{a.banned ? 'Mở khóa' : 'Khóa'}</Btn>}
      </> : <Btn size="sm" kind="primary" icon={UserPlus} onClick={create}>Cấp tài khoản</Btn>)}>
      {d.user_id ? (
        <div className="row" style={{ flexWrap: 'wrap', gap: 16 }}>
          <span>Đăng nhập bằng <b>{login}</b></span>
          {a ? (a.banned ? <Pill tone="red">Đã khóa</Pill> : a.last_sign_in_at ? <span className="muted">Lần cuối: {timeAgo(a.last_sign_in_at)}</span> : <Pill tone="orange">Chưa đăng nhập lần nào</Pill>)
            : acc.error ? <span className="small red">{acc.error}</span> : null}
        </div>
      ) : (
        <div className="muted">Chưa có tài khoản. {hr ? `Bấm “Cấp tài khoản” để sinh mật khẩu — lái xe đăng nhập bằng ${d.email || `mã ${d.code}`}.` : 'Liên hệ nhân sự để cấp tài khoản.'}</div>
      )}
      {cred && <CredentialModal cred={cred.c} title={cred.title} onClose={() => setCred(null)} />}
    </Card>
  );
}

function ProfileTab({ d, onSaved }: { d: Driver; onSaved: () => void }) {
  const { can } = useAuth();
  const { run } = useFeedback();
  const ro = !can('hr');
  const v0 = d.vehicles?.[0];
  const [p, setP] = useState(d);
  const [v, setV] = useState<Partial<Vehicle>>(v0 ?? { plate: '', model: '', compartments: [], odo: 0, next_service_km: 0 });
  const [comps, setComps] = useState((v0?.compartments ?? []).join(', '));
  useEffect(() => { setP(d); setV(d.vehicles?.[0] ?? { plate: '', compartments: [] }); setComps((d.vehicles?.[0]?.compartments ?? []).join(', ')); }, [d]);
  const sp = (k: keyof Driver) => (e: { target: { value: string } }) => setP(x => ({ ...x, [k]: e.target.value }));
  const sv = (k: keyof Vehicle) => (e: { target: { value: string } }) => setV(x => ({ ...x, [k]: e.target.value }));

  const saveProfile = () => run(async () => {
    must(await sb.from('drivers').update({
      full_name: p.full_name, phone: p.phone, email: p.email ? p.email.toLowerCase().trim() : null, team: p.team, since: p.since,
      dob: p.dob || null, company: p.company, dispatcher_name: p.dispatcher_name, dispatcher_phone: p.dispatcher_phone,
      leave_left: Number(p.leave_left), rating: Number(p.rating), trips_year: Number(p.trips_year), km_safe: Number(p.km_safe),
      incidents: Number(p.incidents), active: p.active
    }).eq('id', d.id));
    onSaved();
  }, 'Đã lưu hồ sơ');
  const saveVehicle = () => run(async () => {
    const row = {
      driver_id: d.id, plate: v.plate, model: v.model, compartments: comps.split(/[,\s]+/).map(Number).filter(n => n > 0),
      registry_exp: v.registry_exp || null, tank_inspect_exp: v.tank_inspect_exp || null, odo: Number(v.odo) || 0, next_service_km: Number(v.next_service_km) || 0
    };
    must(v0 ? await sb.from('vehicles').update(row).eq('id', v0.id) : await sb.from('vehicles').insert(row));
    onSaved();
  }, 'Đã lưu thông tin xe');

  return (
    <div className="grid-eq">
      <Card title="Thông tin cá nhân" actions={!ro && <Btn kind="primary" size="sm" icon={Save} onClick={saveProfile}>Lưu</Btn>}>
        <fieldset disabled={ro} style={{ border: 0, padding: 0, margin: 0 }}>
          <div className="form">
            <Field label="Họ và tên" full><input className="input" value={p.full_name} onChange={sp('full_name')} /></Field>
            <Field label="Điện thoại"><input className="input" value={p.phone ?? ''} onChange={sp('phone')} /></Field>
            <Field label="Email liên hệ" hint={d.user_id ? 'Đổi email không đổi tài khoản đăng nhập' : 'Dùng làm tên đăng nhập khi cấp tài khoản'}><input className="input" value={p.email ?? ''} onChange={sp('email')} /></Field>
            <Field label="Đội"><input className="input" value={p.team ?? ''} onChange={sp('team')} /></Field>
            <Field label="Vào làm"><input className="input" value={p.since ?? ''} onChange={sp('since')} /></Field>
            <Field label="Ngày sinh"><input className="input" type="date" value={p.dob ?? ''} onChange={sp('dob')} /></Field>
            <Field label="Ngày phép còn lại"><input className="input" type="number" value={p.leave_left} onChange={sp('leave_left')} /></Field>
            <Field label="Điều độ phụ trách"><input className="input" value={p.dispatcher_name ?? ''} onChange={sp('dispatcher_name')} /></Field>
            <Field label="SĐT điều độ"><input className="input" value={p.dispatcher_phone ?? ''} onChange={sp('dispatcher_phone')} /></Field>
            <Field label="Chuyến năm nay"><input className="input" type="number" value={p.trips_year} onChange={sp('trips_year')} /></Field>
            <Field label="Km an toàn"><input className="input" type="number" value={p.km_safe} onChange={sp('km_safe')} /></Field>
            <Field label="Sự cố"><input className="input" type="number" value={p.incidents} onChange={sp('incidents')} /></Field>
            <Field label="Đánh giá (1–5)"><input className="input" type="number" step={0.1} min={1} max={5} value={p.rating} onChange={sp('rating')} /></Field>
            <Field label="Đang hoạt động" hint="Tắt để ngừng phân công"><Switch on={p.active} onChange={x => setP(y => ({ ...y, active: x }))} /></Field>
          </div>
        </fieldset>
      </Card>
      <Card title="Phương tiện được giao" actions={!ro && <Btn kind="primary" size="sm" icon={Save} onClick={saveVehicle} disabled={!v.plate}>Lưu</Btn>}>
        <fieldset disabled={ro} style={{ border: 0, padding: 0, margin: 0 }}>
          <div className="form">
            <Field label="Biển số"><input className="input" value={v.plate ?? ''} onChange={sv('plate')} /></Field>
            <Field label="Dung tích khoang (L)" hint={`Tổng ${fmt(sum(comps.split(/[,\s]+/).map(Number).filter(n => n > 0), n => n))} L`}><input className="input" value={comps} onChange={e => setComps(e.target.value)} /></Field>
            <Field label="Loại xe / bồn" full><input className="input" value={v.model ?? ''} onChange={sv('model')} /></Field>
            <Field label="Hạn đăng kiểm"><input className="input" type="date" value={v.registry_exp ?? ''} onChange={sv('registry_exp')} /></Field>
            <Field label="Hạn kiểm định bồn"><input className="input" type="date" value={v.tank_inspect_exp ?? ''} onChange={sv('tank_inspect_exp')} /></Field>
            <Field label="Số km đồng hồ"><input className="input" type="number" value={v.odo ?? 0} onChange={sv('odo')} /></Field>
            <Field label="Mốc bảo dưỡng (km)" hint={v.next_service_km ? `Còn ${fmt(Number(v.next_service_km) - Number(v.odo))} km` : undefined}>
              <input className="input" type="number" value={v.next_service_km ?? 0} onChange={sv('next_service_km')} /></Field>
          </div>
        </fieldset>
      </Card>
    </div>
  );
}

function CertsTab({ driverId, certs, onChanged }: { driverId: string; certs: Cert[]; onChanged: () => void }) {
  const { can } = useAuth();
  const { run, confirm } = useFeedback();
  const [edit, setEdit] = useState<Partial<Cert> | null>(null);
  const save = async () => {
    if (!edit) return;
    const preset = CERT_PRESETS.find(p => p.name === edit.name);
    const row = {
      driver_id: driverId, name: edit.name, number: edit.number || null, expires_on: edit.expires_on,
      icon: edit.icon ?? preset?.icon ?? 'id', color: edit.color ?? preset?.color ?? 'var(--blue)',
      renewable: edit.renewable ?? preset?.renewable ?? false, sort: edit.sort ?? certs.length + 1
    };
    if (await run(async () => { must(edit.id ? await sb.from('certificates').update(row).eq('id', edit.id) : await sb.from('certificates').insert(row)); }, 'Đã lưu giấy tờ')) {
      setEdit(null); onChanged();
    }
  };
  const del = async (c: Cert) => {
    if (await confirm({ title: `Xóa “${c.name}”?`, danger: true, ok: 'Xóa' })) {
      await run(async () => { must(await sb.from('certificates').delete().eq('id', c.id)); onChanged(); }, 'Đã xóa');
    }
  };
  return (
    <Card pad={false} title="Giấy tờ & chứng chỉ" actions={can('hr') && <Btn size="sm" icon={Plus} onClick={() => setEdit({ name: CERT_PRESETS[0].name, expires_on: '' })}>Thêm giấy tờ</Btn>}>
      {certs.length ? (
        <table className="t">
          <thead><tr><th>Tên</th><th>Số</th><th>Hết hạn</th><th>Tình trạng</th><th /></tr></thead>
          <tbody>
            {certs.map(c => {
              const s = certState(c.expires_on);
              return (
                <tr key={c.id}>
                  <td className="b">{c.name}</td><td className="muted">{c.number ?? '—'}</td><td className="num">{dmy(c.expires_on)}</td>
                  <td><Pill tone={s.tone}>{s.label}</Pill></td>
                  <td className="act">{can('hr') && <><Btn size="sm" icon={Pencil} title="Sửa" onClick={() => setEdit(c)} /> <Btn size="sm" icon={Trash2} title="Xóa" onClick={() => del(c)} /></>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : <Empty text="Chưa có giấy tờ" />}
      <div className="card-b muted small" style={{ paddingTop: 10 }}>Giấy tờ hết hạn trước ngày chạy sẽ chặn tạo lệnh và phân công chuyến cho lái xe này.</div>
      {edit && (
        <Modal title={edit.id ? 'Sửa giấy tờ' : 'Thêm giấy tờ'} onClose={() => setEdit(null)}
          footer={<><Btn onClick={() => setEdit(null)}>Hủy</Btn><Btn kind="primary" disabled={!edit.name || !edit.expires_on} onClick={save}>Lưu</Btn></>}>
          <div className="form">
            <Field label="Loại giấy tờ" full>
              <input className="input" list="cert-presets" value={edit.name ?? ''} onChange={e => setEdit(x => ({ ...x, name: e.target.value }))} />
              <datalist id="cert-presets">{CERT_PRESETS.map(p => <option key={p.name} value={p.name} />)}</datalist>
            </Field>
            <Field label="Số"><input className="input" value={edit.number ?? ''} onChange={e => setEdit(x => ({ ...x, number: e.target.value }))} /></Field>
            <Field label="Ngày hết hạn"><input className="input" type="date" value={edit.expires_on ?? ''} onChange={e => setEdit(x => ({ ...x, expires_on: e.target.value }))} /></Field>
          </div>
        </Modal>
      )}
    </Card>
  );
}

function JobsTab({ jobs, onChanged }: { jobs: Job[]; onChanged: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Card pad={false}>
      {jobs.length ? (
        <table className="t">
          <thead><tr><th>Ngày</th><th>Mã</th><th>Điểm giao</th><th>Hàng hóa</th><th>Trạng thái</th><th className="num">Hao hụt</th></tr></thead>
          <tbody>
            {jobs.map(j => {
              const l = lossOf(j.job_cargo);
              return (
                <tr key={j.id} className="tap" onClick={() => setOpen(j.id)}>
                  <td className="num">{dm(j.job_date)} <span className="sub">{hm(j.from_time)}</span></td><td className="b">{j.code}</td>
                  <td>{j.to_name}</td><td className="muted">{cargoText(j.job_cargo)}</td>
                  <td><div className="row"><StatusPill j={j} />{j.late_min > 0 && <Pill tone="red">trễ {j.late_min}′</Pill>}</div></td>
                  <td className="num">{l ? <span className={l.over ? 'red b' : ''}>{pct(l.rate, 2)}</span> : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : <Empty text="Chưa có chuyến" />}
      {open && <JobDrawer id={open} onClose={() => setOpen(null)} onChanged={onChanged} />}
    </Card>
  );
}

function AttTab({ att, driverId, onChanged }: { att: Attendance[]; driverId: string; onChanged: () => void }) {
  const { can } = useAuth();
  const fb = useFeedback();
  const rows = att.filter(a => a.check_in || a.note);
  return (
    <Card pad={false}>
      {rows.length ? (
        <table className="t">
          <thead><tr><th>Ngày</th><th className="num">Vào</th><th className="num">Ra</th><th>Phân loại</th><th className="num">Thời gian làm</th><th>Giải trình</th><th /></tr></thead>
          <tbody>
            {rows.map(a => {
              const c = classify(a);
              return (
                <tr key={a.work_date}>
                  <td>{WD[dow(a.work_date)]}, {dm(a.work_date)}</td>
                  <td className="num">{hm(a.check_in)}</td><td className="num">{hm(a.check_out)}</td>
                  <td><div className="row">{c ? <Pill tone={c.st === 'late' ? 'red' : c.st === 'early' ? 'green' : 'blue'}>{attLabel(c)}</Pill> : <Pill>Chưa vào ca</Pill>}
                    {c?.left ? <Pill tone="orange">Về sớm {c.left}′</Pill> : null}</div></td>
                  <td className="num">{a.check_in && a.check_out ? dur(toMin(a.check_out) - toMin(a.check_in)) : '—'}</td>
                  <td className="small">{a.explain_text ?? a.note ?? ''}{a.explain && <> <Pill tone={a.explain === 'pending' ? 'orange' : a.explain === 'approved' ? 'green' : 'red'}>{a.explain === 'pending' ? 'Chờ duyệt' : a.explain === 'approved' ? 'Đã duyệt' : 'Từ chối'}</Pill></>}</td>
                  <td className="act">{a.explain === 'pending' && can('hr') && <>
                    <Btn size="sm" kind="success" onClick={() => reviewExplain(fb, driverId, a.work_date, 'approved', onChanged)}>Duyệt</Btn>{' '}
                    <Btn size="sm" kind="danger" onClick={() => reviewExplain(fb, driverId, a.work_date, 'rejected', onChanged)}>Từ chối</Btn></>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : <Empty text="Chưa có dữ liệu chấm công" />}
    </Card>
  );
}

function ExpTab({ exp }: { exp: Expense[] }) {
  const ST = { pending: ['Chờ duyệt', 'orange'], approved: ['Đã duyệt', 'green'], rejected: ['Từ chối', 'red'] } as const;
  return (
    <Card pad={false} title={`Tổng ${money(sum(exp.filter(e => e.status !== 'rejected'), e => e.amount))}`}>
      {exp.length ? (
        <table className="t">
          <thead><tr><th>Ngày</th><th>Loại</th><th>Nội dung</th><th className="num">Số tiền</th><th>Trạng thái</th></tr></thead>
          <tbody>
            {exp.map(e => (
              <tr key={e.id}>
                <td className="num">{dm(e.spent_on)} <span className="sub">{hm(e.spent_time)}</span></td>
                <td><span className="row"><span className="dot" style={{ background: CATS[e.category].color }} />{CATS[e.category].label}</span></td>
                <td>{e.title}<div className="sub">{e.place}{e.reject_reason ? ` · ${e.reject_reason}` : ''}</div></td>
                <td className="num">{money(e.amount)}</td>
                <td><Pill tone={ST[e.status][1]}>{ST[e.status][0]}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <Empty text="Chưa có khoản chi" />}
    </Card>
  );
}
