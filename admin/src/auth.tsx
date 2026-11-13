import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { LogOut, RefreshCw, ShieldAlert, Truck } from 'lucide-react';
import { ROLES } from './lib/config';
import { sb, supabaseConfigured, viError } from './lib/supabase';
import type { Role, Staff } from './types';
import { Btn, Loading } from './ui/kit';

interface AuthApi {
  session: Session;
  staff: Staff;
  /** true nếu nhân viên có một trong các vai trò (admin luôn true) */
  can: (...roles: Role[]) => boolean;
  signOut: () => Promise<void>;
}
const Ctx = createContext<AuthApi | null>(null);
export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside AuthGate');
  return v;
};

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [staff, setStaff] = useState<Staff | null | undefined>(undefined);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const uid = session?.user.id;
  const loadStaff = useCallback(async () => {
    if (!uid) return;
    setStaff(undefined); setErr(null);
    const { data, error } = await sb.from('staff').select('*').eq('user_id', uid).maybeSingle();
    if (error) { setErr(viError(error)); setStaff(null); } else setStaff(data as Staff | null);
  }, [uid]);
  useEffect(() => { void loadStaff(); }, [loadStaff]);

  const signOut = useCallback(async () => { await sb.auth.signOut(); }, []);

  if (session === undefined) return <Loading />;
  if (!session) return <Login />;
  if (staff === undefined) return <Loading />;
  if (!staff) return <NoAccess email={session.user.email ?? ''} error={err} onRetry={loadStaff} onSignOut={signOut} />;

  const can = (...roles: Role[]) => staff.role === 'admin' || roles.includes(staff.role);
  return <Ctx.Provider value={{ session, staff, can, signOut }}>{children}</Ctx.Provider>;
}

function Login() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const valid = /\S+@\S+\.\S+/.test(email) && pw.length >= 6;

  const submit = async () => {
    setBusy(true); setErr(null);
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: pw });
    if (error) setErr(viError(error));
    setBusy(false);
  };

  return (
    <div className="login">
      <form className="card" onSubmit={e => { e.preventDefault(); if (valid && !busy) void submit(); }}>
        <div className="brand-icon"><Truck size={32} strokeWidth={2.2} /></div>
        <h1>DriverOS · Điều hành</h1>
        <div className="muted small" style={{ textAlign: 'center', marginTop: -6 }}>Dành cho điều phối, kế toán, nhân sự</div>
        {!supabaseConfigured && <div className="error-box">Thiếu cấu hình Supabase trong admin/.env.local</div>}
        <div className="field"><label>Email</label><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" autoFocus /></div>
        <div className="field"><label>Mật khẩu</label><input className="input" type="password" value={pw} onChange={e => setPw(e.target.value)} autoComplete="current-password" /></div>
        {err && <div className="error-box" style={{ margin: 0 }}>{err}</div>}
        <Btn kind="primary" type="submit" disabled={!valid || busy} style={{ height: 34 }}>{busy ? <span className="spinner sm" /> : 'Đăng nhập'}</Btn>
        <div className="muted small" style={{ textAlign: 'center' }}>Tài khoản do quản trị viên cấp. Quên mật khẩu? Liên hệ quản trị viên để đặt lại.</div>
      </form>
    </div>
  );
}

function NoAccess({ email, error, onRetry, onSignOut }: { email: string; error: string | null; onRetry: () => void; onSignOut: () => void }) {
  const sql = `insert into public.staff (user_id, full_name, email, role)\nselect id, coalesce(raw_user_meta_data->>'full_name', email), email, 'admin'\nfrom auth.users where email = '${email.replace(/'/g, "''")}'\non conflict (user_id) do update set role = 'admin';`;
  return (
    <div className="login">
      <div className="card" style={{ width: 'min(560px, 100%)' }}>
        <div className="row"><ShieldAlert size={22} color="var(--orange)" /><h1 style={{ fontSize: 19, textAlign: 'left' }}>Chưa có quyền quản trị</h1></div>
        {error && <div className="error-box">{error}</div>}
        <div>Tài khoản <b>{email}</b> đã đăng nhập nhưng chưa được cấp vai trò ({Object.values(ROLES).map(r => r.label).join(', ')}).</div>
        <div className="muted small">Nhờ quản trị viên cấp quyền ở mục “Nhân viên & phân quyền”. Nếu đây là quản trị viên đầu tiên, chạy lệnh sau trong Supabase → SQL Editor (gặp cảnh báo thì chọn “Run without RLS”):</div>
        <div className="code">{sql}</div>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <Btn icon={LogOut} onClick={onSignOut}>Đăng xuất</Btn>
          <Btn icon={RefreshCw} onClick={() => void navigator.clipboard?.writeText(sql)}>Sao chép SQL</Btn>
          <Btn kind="primary" onClick={onRetry}>Kiểm tra lại</Btn>
        </div>
      </div>
    </div>
  );
}
