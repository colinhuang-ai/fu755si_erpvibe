import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Users } from 'lucide-react';
import { useAuth } from '../auth';
import { attLabel, certState, classify, liters, lossOf } from '../lib/domain';
import { fmt, MONTH_START, norm, pct, sum, TODAY } from '../lib/format';
import { LOSS_LIMIT } from '../lib/config';
import { useQuery } from '../lib/query';
import { must, sb } from '../lib/supabase';
import type { Attendance, Driver, Job } from '../types';
import { Avatar, Btn, Card, Empty, Field, Loading, Modal, Pill, Search, Segmented, Switch } from '../ui/kit';
import { useFeedback } from '../ui/feedback';
import { accounts, type Credential } from '../lib/accounts';
import { CredentialModal } from '../ui/CredentialModal';

export default function Drivers() {
  const { can } = useAuth();
  const nav = useNavigate();
  const [text, setText] = useState('');
  const [team, setTeam] = useState('all');
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ id: string; c: Credential } | null>(null);
  const q = useQuery(async () => {
    const [d, j, a] = await Promise.all([
      sb.from('drivers').select('*, vehicles(*), certificates(*)').order('code'),
      sb.from('jobs').select('driver_id, status, late_min, job_cargo(qty, unit, loaded, delivered)').gte('job_date', MONTH_START).lte('job_date', TODAY).eq('status', 5),
      sb.from('attendance').select('*').eq('work_date', TODAY)
    ]);
    return { drivers: must(d) as Driver[], jobs: must(j) as Job[], att: must(a) as Attendance[] };
  }, []);

  const data = q.data;
  const teams = [...new Set((data?.drivers ?? []).map(d => d.team).filter(Boolean))].sort() as string[];
  const s = norm(text);
  const rows = (data?.drivers ?? [])
    .filter(d => team === 'all' || d.team === team)
    .filter(d => !s || norm(`${d.full_name} ${d.code} ${d.email ?? ''} ${d.vehicles?.[0]?.plate ?? ''}`).includes(s));

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Lái xe</h1><div className="sub">{data?.drivers.length ?? '…'} hồ sơ · hồ sơ, xe được giao, giấy tờ và hiệu suất tháng</div></div>
        {can('hr') && <Btn kind="primary" icon={UserPlus} onClick={() => setCreating(true)}>Thêm lái xe</Btn>}
      </div>
      <div className="toolbar">
        <Segmented value={team} onChange={setTeam} options={[['all', 'Tất cả đội'], ...teams.map(t => [t, t.split(' – ')[0]] as [string, string])]} />
        <div className="grow" />
        <Search value={text} onChange={setText} placeholder="Tên, mã NV, email, biển số" />
      </div>
      {q.error && <div className="error-box">{q.error}</div>}
      <Card pad={false}>
        {!data ? <Loading /> : rows.length ? (
          <div className="table-wrap">
            <table className="t">
              <thead><tr><th>Lái xe</th><th>Đội</th><th>Xe</th><th>Tài khoản</th><th className="num">Chuyến T11</th><th className="num">Đúng hẹn</th><th className="num">Hao hụt TB</th><th>Giấy tờ</th><th>Hôm nay</th></tr></thead>
              <tbody>
                {rows.map(d => {
                  const mine = data.jobs.filter(j => j.driver_id === d.id);
                  const ls = mine.map(j => lossOf(j.job_cargo)).filter(Boolean);
                  const loss = ls.length ? sum(ls, l => l!.rate) / ls.length : 0;
                  const soon = [...(d.certificates ?? [])].sort((a, b) => a.expires_on.localeCompare(b.expires_on))[0];
                  const cs = soon ? certState(soon.expires_on) : null;
                  const att = classify(data.att.find(a => a.driver_id === d.id));
                  return (
                    <tr key={d.id} className="tap" onClick={() => nav(`/drivers/${d.id}`)}>
                      <td><div className="row"><Avatar name={d.full_name} /><div><b>{d.full_name}</b><div className="sub">{d.code}</div></div></div></td>
                      <td className="muted">{d.team ?? '—'}</td>
                      <td>{d.vehicles?.[0]?.plate ?? <span className="muted">Chưa giao xe</span>}</td>
                      <td>{d.user_id ? <Pill tone="green">Có tài khoản</Pill> : <Pill tone="orange">Chưa có tài khoản</Pill>}</td>
                      <td className="num">{mine.length}<div className="sub">{fmt(sum(mine, j => liters(j.job_cargo)))} L</div></td>
                      <td className="num">{mine.length ? pct(mine.filter(j => !j.late_min).length / mine.length, 0) : '—'}</td>
                      <td className="num"><span className={loss > LOSS_LIMIT ? 'red b' : ''}>{ls.length ? pct(loss, 2) : '—'}</span></td>
                      <td>{cs ? <Pill tone={cs.tone} title={soon!.name}>{cs.label}</Pill> : <span className="muted">—</span>}</td>
                      <td>{att ? <Pill tone={att.st === 'late' ? 'red' : att.st === 'early' ? 'green' : 'blue'}>{attLabel(att)}</Pill> : <Pill>Chưa vào ca</Pill>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <Empty icon={Users} text="Không tìm thấy lái xe" />}
      </Card>
      {creating && <CreateDriverModal existing={data?.drivers ?? []} onClose={() => setCreating(false)}
        onCreated={(id, c) => { setCreating(false); if (c) setCreated({ id, c }); else nav(`/drivers/${id}`); }} />}
      {created && <CredentialModal cred={created.c} title="Đã tạo hồ sơ và tài khoản lái xe" onClose={() => nav(`/drivers/${created.id}`)} />}
    </div>
  );
}

function CreateDriverModal({ existing, onClose, onCreated }: { existing: Driver[]; onClose: () => void; onCreated: (id: string, c?: Credential) => void }) {
  const { run, toast } = useFeedback();
  const [makeAccount, setMakeAccount] = useState(true);
  const [busy, setBusy] = useState(false);
  const next = Math.max(0, ...existing.map(d => Number(d.code.replace(/\D/g, '')) || 0)) + 1;
  const [f, setF] = useState({
    full_name: '', code: `TX-${String(next).padStart(4, '0')}`, email: '', phone: '', team: existing[0]?.team ?? 'Đội 1 – Kho Nhà Bè',
    since: '11/2026', plate: '', model: 'Hino FM8JNSA · bồn 18.000 L', compartments: '4000, 4000, 4000, 3000, 3000', odo: '0'
  });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF(x => ({ ...x, [k]: e.target.value }));
  const valid = f.full_name.trim().length > 2 && f.code.trim() && (!f.email || /\S+@\S+\.\S+/.test(f.email));

  const submit = async () => {
    setBusy(true);
    let id = '';
    const ok = await run(async () => {
      id = must(await sb.rpc('create_driver', {
        payload: {
          ...f, full_name: f.full_name.trim(), odo: Number(f.odo) || 0, next_service_km: Math.ceil(((Number(f.odo) || 0) + 1) / 10000) * 10000,
          compartments: f.compartments.split(/[,\s]+/).map(Number).filter(n => n > 0),
          company: 'Nam Việt Petro Logistics', dispatcher_name: 'Lê Thu Hà', dispatcher_phone: '0908111222', hse_phone: '0908333444'
        }
      })) as string;
    }, makeAccount ? undefined : 'Đã tạo hồ sơ lái xe');
    if (!ok) { setBusy(false); return; }
    if (!makeAccount) return onCreated(id);
    try {
      onCreated(id, await accounts<Credential>({ action: 'create', kind: 'driver', driver_id: id }));
    } catch (e) {
      toast(`Đã tạo hồ sơ nhưng chưa tạo được tài khoản: ${(e as Error).message}`, 'error');
      onCreated(id);
    }
  };

  return (
    <Modal title="Thêm lái xe" sub="Tạo hồ sơ, xe được giao và tài khoản đăng nhập app lái xe." onClose={onClose}
      footer={<><Btn onClick={onClose}>Hủy</Btn><Btn kind="primary" disabled={!valid || busy} onClick={submit}>{busy ? 'Đang tạo…' : 'Tạo hồ sơ'}</Btn></>}>
      <div className="form">
        <Field label="Họ và tên" full><input className="input" value={f.full_name} onChange={set('full_name')} autoFocus /></Field>
        <Field label="Mã nhân viên"><input className="input" value={f.code} onChange={set('code')} /></Field>
        <Field label="Đội"><input className="input" value={f.team} onChange={set('team')} list="teams" />
          <datalist id="teams">{[...new Set(existing.map(d => d.team))].map(t => <option key={t ?? ''} value={t ?? ''} />)}</datalist></Field>
        <Field label="Email" hint="Để trống thì lái xe đăng nhập bằng mã nhân viên"><input className="input" type="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Điện thoại"><input className="input" value={f.phone} onChange={set('phone')} /></Field>
        <Field label="Vào làm (MM/YYYY)"><input className="input" value={f.since} onChange={set('since')} /></Field>
        <Field label="Biển số xe giao" hint="Để trống nếu chưa giao xe"><input className="input" value={f.plate} onChange={set('plate')} placeholder="51D-000.00" /></Field>
        <Field label="Loại xe / bồn" full><input className="input" value={f.model} onChange={set('model')} /></Field>
        <Field label="Dung tích các khoang (L)" hint="Cách nhau bằng dấu phẩy"><input className="input" value={f.compartments} onChange={set('compartments')} /></Field>
        <Field label="Số km đồng hồ"><input className="input" type="number" value={f.odo} onChange={set('odo')} /></Field>
        <Field label="Tạo tài khoản đăng nhập app" full hint="Hệ thống sinh mật khẩu và hiện cho bạn một lần">
          <Switch on={makeAccount} onChange={setMakeAccount} label="Tạo tài khoản" /></Field>
      </div>
    </Modal>
  );
}
