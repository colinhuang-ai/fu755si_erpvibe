import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { ClipboardList, Clock, GaugeCircle, GraduationCap, KeyRound, LogOut, Truck, Users, UserCog, Wallet, type LucideIcon } from 'lucide-react';
import { useAuth } from '../auth';
import { ROLES } from '../lib/config';
import { useQuery, useRealtime } from '../lib/query';
import { sb, viError } from '../lib/supabase';
import { Avatar, Btn, Field, Modal } from './kit';
import { useFeedback } from './feedback';

/** Số việc đang chờ cho từng mục menu */
function useBadges() {
  const q = useQuery(async () => {
    const head = { count: 'exact' as const, head: true };
    const [exp, adv, req, sos, rej, expl] = await Promise.all([
      sb.from('expenses').select('id', head).eq('status', 'pending'),
      sb.from('advances').select('id', head).eq('status', 'pending'),
      sb.from('requests').select('id', head).eq('status', 'new'),
      sb.from('requests').select('id', head).eq('status', 'new').eq('kind', 'sos'),
      sb.from('jobs').select('id', head).not('rejected_reason', 'is', null),
      sb.from('attendance').select('driver_id', head).eq('explain', 'pending')
    ]);
    [exp, adv, req, sos, rej, expl].forEach(r => { if (r.error) throw r.error; });
    return { finance: (exp.count ?? 0) + (adv.count ?? 0), requests: req.count ?? 0, sos: sos.count ?? 0, jobs: rej.count ?? 0, attendance: expl.count ?? 0 };
  }, []);
  useRealtime(['expenses', 'requests', 'jobs', 'attendance'], q.reload);
  return q.data;
}

const NAV: { to: string; label: string; icon: LucideIcon; badge?: 'finance' | 'requests' | 'jobs' | 'attendance' }[] = [
  { to: '/', label: 'Tổng quan', icon: GaugeCircle },
  { to: '/jobs', label: 'Chuyến & phân công', icon: Truck, badge: 'jobs' },
  { to: '/drivers', label: 'Lái xe', icon: Users },
  { to: '/attendance', label: 'Chấm công', icon: Clock, badge: 'attendance' },
  { to: '/finance', label: 'Chi phí & tạm ứng', icon: Wallet, badge: 'finance' },
  { to: '/training', label: 'Đào tạo', icon: GraduationCap },
  { to: '/requests', label: 'Yêu cầu & sự cố', icon: ClipboardList, badge: 'requests' }
];

export function Shell({ children }: { children: ReactNode }) {
  const { staff, signOut } = useAuth();
  const b = useBadges();
  const name = staff.full_name || staff.email || 'Nhân viên';
  const [pwOpen, setPwOpen] = useState(false);
  return (
    <div className="app">
      <nav className="sidebar" aria-label="Điều hướng">
        <div className="brand">
          <span className="brand-icon"><Truck size={19} strokeWidth={2.3} /></span>
          <div><b>DriverOS</b><span>Điều hành đội xe bồn</span></div>
        </div>
        <div className="nav-sec">Vận hành</div>
        {NAV.map(n => {
          const count = n.badge && b ? b[n.badge] : 0;
          return (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'on' : ''}`}>
              <n.icon size={16} strokeWidth={2.2} />{n.label}
              {count > 0 && <span className={`count ${n.badge === 'requests' && b?.sos ? 'hot' : ''}`}>{count}</span>}
            </NavLink>
          );
        })}
        <div className="nav-sec">Hệ thống</div>
        <NavLink to="/staff" className={({ isActive }) => `nav-item ${isActive ? 'on' : ''}`}><UserCog size={16} strokeWidth={2.2} />Nhân viên & phân quyền</NavLink>
        <div className="me">
          <Avatar name={name} />
          <div className="who"><b>{name}</b><span>{ROLES[staff.role].label}</span></div>
          <button className="btn icon" title="Đổi mật khẩu" onClick={() => setPwOpen(true)}><KeyRound size={15} /></button>
          <button className="btn icon" title="Đăng xuất" onClick={() => void signOut()}><LogOut size={15} /></button>
        </div>
      </nav>
      <main className="main">{children}</main>
      {pwOpen && <PasswordModal onClose={() => setPwOpen(false)} />}
    </div>
  );
}

function PasswordModal({ onClose }: { onClose: () => void }) {
  const { toast } = useFeedback();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const valid = pw.length >= 8 && pw === pw2;
  const save = async () => {
    setBusy(true); setErr(null);
    const { error } = await sb.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setErr(viError(error));
    toast('Đã đổi mật khẩu');
    onClose();
  };
  return (
    <Modal title="Đổi mật khẩu" onClose={onClose}
      footer={<><Btn onClick={onClose}>Hủy</Btn><Btn kind="primary" disabled={!valid || busy} onClick={save}>Lưu</Btn></>}>
      <div className="form">
        <Field label="Mật khẩu mới" hint="Tối thiểu 8 ký tự"><input className="input" type="password" autoComplete="new-password" value={pw} onChange={e => setPw(e.target.value)} autoFocus /></Field>
        <Field label="Nhập lại" error={pw2 && pw !== pw2 ? 'Chưa khớp' : undefined}><input className="input" type="password" autoComplete="new-password" value={pw2} onChange={e => setPw2(e.target.value)} /></Field>
      </div>
      {err && <div className="error-box" style={{ marginTop: 12 }}>{err}</div>}
    </Modal>
  );
}
