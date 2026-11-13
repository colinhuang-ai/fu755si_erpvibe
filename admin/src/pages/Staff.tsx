import { useState } from 'react';
import { KeyRound, Lock, LockOpen, Pencil, UserMinus, UserPlus } from 'lucide-react';
import { useAuth } from '../auth';
import { accounts, useAccounts, type Credential } from '../lib/accounts';
import { FOOD_LIMIT, LOSS_LIMIT, NO_RECEIPT_LIMIT, ROLES, SHIFT } from '../lib/config';
import { money, pct, timeAgo } from '../lib/format';
import { useQuery } from '../lib/query';
import { must, sb } from '../lib/supabase';
import type { Role, Staff } from '../types';
import { Avatar, Btn, Card, Field, Loading, Modal, Pill } from '../ui/kit';
import { CredentialModal } from '../ui/CredentialModal';
import { useFeedback } from '../ui/feedback';

export default function StaffPage() {
  const { can, staff: me } = useAuth();
  const { run, confirm } = useFeedback();
  const q = useQuery(async () => must(await sb.from('staff').select('*').order('created_at')) as Staff[], []);
  const acc = useAccounts();
  const [adding, setAdding] = useState(false);
  const [cred, setCred] = useState<{ c: Credential; title: string } | null>(null);
  const [renaming, setRenaming] = useState<Staff | null>(null);
  const admin = can('admin');

  const setRole = (mail: string, r: Role | null, msg: string) =>
    run(async () => { must(await sb.rpc('set_staff_role', { p_email: mail, p_role: r })); q.reload(); }, msg);
  const resetPw = async (s: Staff) => {
    if (!await confirm({ title: `Đặt lại mật khẩu cho ${s.full_name || s.email}?`, message: 'Mật khẩu cũ sẽ không dùng được nữa.', ok: 'Đặt lại' })) return;
    await run(async () => setCred({ c: await accounts<Credential>({ action: 'reset_password', user_id: s.user_id }), title: 'Mật khẩu mới' }));
  };
  const setBan = (s: Staff, banned: boolean) =>
    run(async () => { await accounts({ action: 'set_banned', user_id: s.user_id, banned }); acc.reload(); }, banned ? 'Đã khóa tài khoản' : 'Đã mở khóa');

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Nhân viên & phân quyền</h1><div className="sub">Tài khoản do quản trị viên tạo — không có tự đăng ký. Vai trò được kiểm tra bằng RLS trên Supabase.</div></div>
        {admin && <Btn kind="primary" icon={UserPlus} onClick={() => setAdding(true)}>Thêm nhân viên</Btn>}
      </div>
      {acc.error && <div className="error-box">{acc.error}</div>}
      <div className="grid2">
        <Card title="Nhân viên back-office" pad={false}>
          {!q.data ? <Loading /> : (
            <div className="table-wrap">
              <table className="t">
                <thead><tr><th>Nhân viên</th><th>Vai trò</th><th>Đăng nhập gần nhất</th><th /></tr></thead>
                <tbody>
                  {q.data.map(s => {
                    const a = acc.data?.get(s.user_id);
                    const self = s.user_id === me.user_id;
                    return (
                      <tr key={s.user_id}>
                        <td><div className="row"><Avatar name={s.full_name || s.email || '?'} /><div><b>{s.full_name || s.email}</b>{self && <span className="muted small"> (bạn)</span>}<div className="sub">{s.email}</div></div>
                          {admin && <Btn size="sm" kind="plain" icon={Pencil} title="Sửa tên" onClick={() => setRenaming(s)} />}</div></td>
                        <td>
                          {admin && !self && s.email ? (
                            <select className="select" value={s.role} onChange={e => setRole(s.email!, e.target.value as Role, 'Đã đổi vai trò')}>
                              {(Object.keys(ROLES) as Role[]).map(r => <option key={r} value={r}>{ROLES[r].label}</option>)}
                            </select>
                          ) : <Pill tone={s.role === 'admin' ? 'purple' : 'blue'}>{ROLES[s.role].label}</Pill>}
                        </td>
                        <td>{a ? (a.banned ? <Pill tone="red">Đã khóa</Pill> : a.last_sign_in_at ? <span className="small">{timeAgo(a.last_sign_in_at)}</span> : <Pill tone="orange">Chưa đăng nhập</Pill>) : <span className="muted">—</span>}</td>
                        <td className="act">{admin && !self && <>
                          <Btn size="sm" icon={KeyRound} title="Đặt lại mật khẩu" onClick={() => resetPw(s)} />{' '}
                          {a && <><Btn size="sm" icon={a.banned ? LockOpen : Lock} title={a.banned ? 'Mở khóa' : 'Khóa đăng nhập'} onClick={() => setBan(s, !a.banned)} />{' '}</>}
                          {s.email && <Btn size="sm" kind="danger" icon={UserMinus} title="Gỡ quyền" onClick={async () => {
                            if (await confirm({ title: `Gỡ quyền của ${s.full_name || s.email}?`, message: 'Tài khoản vẫn còn nhưng không vào được app quản trị.', danger: true, ok: 'Gỡ quyền' })) await setRole(s.email!, null, 'Đã gỡ quyền');
                          }} />}
                        </>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <div className="col" style={{ gap: 16 }}>
          <Card title="Vai trò">
            {(Object.keys(ROLES) as Role[]).map(r => (
              <div key={r} style={{ padding: '6px 0' }}><b>{ROLES[r].label}</b><div className="muted small">{ROLES[r].desc}</div></div>
            ))}
          </Card>
          <Card title="Quy tắc nghiệp vụ đang áp dụng">
            <dl className="kv">
              <dt>Ca làm</dt><dd>{SHIFT.start}–{SHIFT.end}, dung sai {SHIFT.grace} phút</dd>
              <dt>Hao hụt cho phép</dt><dd>{pct(LOSS_LIMIT)} lượng nạp</dd>
              <dt>Định mức ăn uống</dt><dd>{money(FOOD_LIMIT)}/ngày</dd>
              <dt>Không hóa đơn</dt><dd>chỉ chấp nhận dưới {money(NO_RECEIPT_LIMIT)}</dd>
            </dl>
            <div className="muted small" style={{ marginTop: 10 }}>Các ngưỡng này đang cố định trong mã nguồn của cả hai app.</div>
          </Card>
        </div>
      </div>
      {adding && <AddStaffModal onClose={() => setAdding(false)} onCreated={c => { setAdding(false); setCred({ c, title: 'Đã tạo tài khoản nhân viên' }); q.reload(); acc.reload(); }} />}
      {cred && <CredentialModal cred={cred.c} title={cred.title} onClose={() => setCred(null)} />}
      {renaming && <RenameModal s={renaming} onClose={() => setRenaming(null)} onSaved={() => { setRenaming(null); q.reload(); }} />}
    </div>
  );
}

function RenameModal({ s, onClose, onSaved }: { s: Staff; onClose: () => void; onSaved: () => void }) {
  const { run } = useFeedback();
  const [name, setName] = useState(s.full_name ?? '');
  const save = async () => {
    if (await run(async () => { must(await sb.from('staff').update({ full_name: name.trim() }).eq('user_id', s.user_id)); }, 'Đã đổi tên')) onSaved();
  };
  return (
    <Modal title="Sửa tên nhân viên" sub={s.email ?? undefined} onClose={onClose}
      footer={<><Btn onClick={onClose}>Hủy</Btn><Btn kind="primary" disabled={name.trim().length < 2} onClick={save}>Lưu</Btn></>}>
      <Field label="Họ và tên"><input className="input" value={name} onChange={e => setName(e.target.value)} autoFocus
        onKeyDown={e => { if (e.key === 'Enter' && name.trim().length >= 2) void save(); }} /></Field>
    </Modal>
  );
}

function AddStaffModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Credential) => void }) {
  const { run } = useFeedback();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('dispatcher');
  const [busy, setBusy] = useState(false);
  const valid = name.trim().length > 1 && /\S+@\S+\.\S+/.test(email);
  const submit = async () => {
    setBusy(true);
    let c: Credential | null = null;
    await run(async () => { c = await accounts<Credential>({ action: 'create', kind: 'staff', email, full_name: name, role }); });
    setBusy(false);
    if (c) onCreated(c);
  };
  return (
    <Modal title="Thêm nhân viên" sub="Hệ thống tạo tài khoản và sinh mật khẩu, không cần xác nhận email." onClose={onClose}
      footer={<><Btn onClick={onClose}>Hủy</Btn><Btn kind="primary" disabled={!valid || busy} onClick={submit}>{busy ? 'Đang tạo…' : 'Tạo tài khoản'}</Btn></>}>
      <div className="form">
        <Field label="Họ và tên" full><input className="input" value={name} onChange={e => setName(e.target.value)} autoFocus /></Field>
        <Field label="Email đăng nhập"><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} /></Field>
        <Field label="Vai trò">
          <select className="select" value={role} onChange={e => setRole(e.target.value as Role)}>
            {(Object.keys(ROLES) as Role[]).map(r => <option key={r} value={r}>{ROLES[r].label} — {ROLES[r].desc}</option>)}
          </select>
        </Field>
      </div>
    </Modal>
  );
}
