import { useState } from 'react';
import { Truck, WifiOff } from 'lucide-react';
import { sb, supabaseConfigured, viError } from '../lib/supabase';
import { Btn, Cell, Group } from '../ui/kit';

/** Màn hình chờ kiểu iOS */
export function Splash({ text }: { text?: string }) {
  return (
    <div className="screen center-screen">
      <div className="app-icon"><Truck size={40} strokeWidth={2.2} /></div>
      <div className="spinner" aria-label="Đang tải" />
      {text && <div className="sum-sub">{text}</div>}
    </div>
  );
}

export function ErrorScreen({ message, onRetry, onSignOut }: { message: string; onRetry: () => void; onSignOut: () => void }) {
  return (
    <div className="screen center-screen">
      <WifiOff size={48} strokeWidth={1.6} color="var(--label3)" />
      <h2 className="login-t" style={{ fontSize: 22 }}>Không tải được dữ liệu</h2>
      <div className="sum-sub" style={{ maxWidth: 300, textAlign: 'center' }}>{message}</div>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <Btn kind="gray" size="md" onClick={onSignOut}>Đăng xuất</Btn>
        <Btn size="md" onClick={onRetry}>Thử lại</Btn>
      </div>
    </div>
  );
}

/** Lái xe không có email đăng nhập bằng mã nhân viên → tài khoản dạng tx-0127@driveros.invalid */
const toLogin = (v: string) => (v.includes('@') ? v.trim() : `${v.trim().toLowerCase()}@driveros.invalid`);

export default function Login() {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const valid = id.trim().length >= 3 && pw.length >= 6;

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true); setErr(null);
    const { error } = await sb.auth.signInWithPassword({ email: toLogin(id), password: pw });
    if (error) setErr(/Invalid login credentials/i.test(error.message) ? 'Mã nhân viên/email hoặc mật khẩu không đúng.' : viError(error));
    setBusy(false);
  };

  return (
    <div className="screen">
      <div className="scroller login">
        <div className="login-head">
          <div className="app-icon"><Truck size={40} strokeWidth={2.2} /></div>
          <h1 className="login-t">DriverOS</h1>
          <div className="sum-sub">Ứng dụng cho lái xe bồn chở xăng dầu</div>
        </div>
        {!supabaseConfigured && (
          <Group footerTone="red" footer="Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_PUBLISHABLE_KEY trong driveos/.env.local.">
            <Cell title="Chưa cấu hình Supabase" tone="red" />
          </Group>
        )}
        <form onSubmit={e => { e.preventDefault(); void submit(); }}>
          <Group footer={err ?? 'Tài khoản do bộ phận nhân sự cấp. Quên mật khẩu? Liên hệ nhân sự hoặc điều độ để được đặt lại.'}
            footerTone={err ? 'red' : undefined}>
            <Cell title="Mã NV / Email" trailing={<input className="cell-input" autoComplete="username" autoCapitalize="characters" placeholder="TX-0127" value={id} onChange={e => setId(e.target.value)} />} />
            <Cell title="Mật khẩu" trailing={<input className="cell-input" type="password" autoComplete="current-password" placeholder="Mật khẩu được cấp" value={pw} onChange={e => setPw(e.target.value)} />} />
          </Group>
          <div className="pad">
            <button type="submit" className="btn filled block" disabled={!valid || busy}>
              {busy ? <span className="spinner sm light" /> : 'Đăng nhập'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
