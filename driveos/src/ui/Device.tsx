import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Clock, GraduationCap, House, Truck, Wallet, type LucideIcon } from 'lucide-react';
import { statusTime, useNow, MOCK_TODAY } from '../lib/clock';
import { useStore } from '../store';

/** Khung iPhone khi xem trên máy tính; trên điện thoại thật thì full màn hình */
export function Device({ children }: { children: ReactNode }) {
  useNow(15000);
  return (
    <div className="stage">
      <div className="device">
        <div className="statusbar" aria-hidden>
          <span>{statusTime()}</span>
          <span className="sb-r">
            <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
            <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.3c2.3 0 4.4.9 6 2.4l1.2-1.2A10.2 10.2 0 0 0 8 .6 10.2 10.2 0 0 0 .8 3.5L2 4.7a8.5 8.5 0 0 1 6-2.4Zm0 3.4c1.4 0 2.6.5 3.6 1.4l1.2-1.2A6.8 6.8 0 0 0 8 4 6.8 6.8 0 0 0 3.2 5.9l1.2 1.2c1-.9 2.2-1.4 3.6-1.4Zm0 3.4c-.6 0-1.1.2-1.4.6L8 11.1l1.4-1.4c-.3-.4-.8-.6-1.4-.6Z" /></svg>
            <svg width="27" height="13" viewBox="0 0 27 13" fill="none"><rect x=".5" y=".5" width="23" height="12" rx="3.8" stroke="currentColor" opacity=".4" /><rect x="2" y="2" width="17" height="9" rx="2.5" fill="currentColor" /><path d="M25 4.5v4a2.2 2.2 0 0 0 0-4Z" fill="currentColor" opacity=".45" /></svg>
          </span>
        </div>
        <div className="island" aria-hidden />
        {children}
        <div className="home-ind" aria-hidden />
      </div>
    </div>
  );
}

const TABS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/', label: 'Hôm nay', icon: House },
  { to: '/jobs', label: 'Công việc', icon: Truck },
  { to: '/att', label: 'Chấm công', icon: Clock },
  { to: '/fin', label: 'Tài chính', icon: Wallet },
  { to: '/learn', label: 'Học tập', icon: GraduationCap }
];

export function TabBar() {
  const { s } = useStore();
  const loc = useLocation();
  const nav = useNavigate();
  const pending = s.jobs.filter(j => j.date >= MOCK_TODAY && j.status === 0 && !j.rejected).length;
  const active = (to: string) => (to === '/' ? loc.pathname === '/' || loc.pathname === '/me' : loc.pathname.startsWith(to));
  return (
    <nav className="tabbar" aria-label="Thanh tab">
      {TABS.map(t => {
        const on = active(t.to);
        return (
          <button key={t.to} className={`tab ${on ? 'on' : ''}`} onClick={() => nav(t.to)} aria-current={on ? 'page' : undefined}>
            <t.icon size={25} strokeWidth={on ? 2.3 : 1.8} />
            <span>{t.label}</span>
            {t.to === '/jobs' && pending > 0 && <span className="badge">{pending}</span>}
          </button>
        );
      })}
    </nav>
  );
}
