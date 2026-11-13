import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { Inbox, Search as SearchIcon, X, type LucideIcon } from 'lucide-react';

export type Tone = 'green' | 'red' | 'orange' | 'blue' | 'gray' | 'purple' | 'indigo' | 'teal' | 'yellow';

export function Pill({ tone = 'gray', children, title }: { tone?: Tone; children: ReactNode; title?: string }) {
  return <span className={`pill t-${tone}`} title={title}>{children}</span>;
}

export function Btn({ kind, size, icon: I, children, onClick, disabled, title, type = 'button', style }: {
  kind?: 'primary' | 'danger' | 'success' | 'plain'; size?: 'sm'; icon?: LucideIcon; children?: ReactNode; onClick?: () => void;
  disabled?: boolean; title?: string; type?: 'button' | 'submit'; style?: CSSProperties;
}) {
  return (
    <button type={type} className={`btn ${kind ?? ''} ${size ?? ''} ${!children ? 'icon' : ''}`} onClick={onClick} disabled={disabled} title={title} style={style}>
      {I && <I size={size ? 14 : 15} strokeWidth={2.2} />}{children}
    </button>
  );
}

export function Tile({ icon: I, color, lg }: { icon: LucideIcon; color: string; lg?: boolean }) {
  return <span className={`tile ${lg ? 'lg' : ''}`} style={{ background: color }}><I size={lg ? 19 : 13} strokeWidth={2.4} /></span>;
}

export function Card({ title, actions, children, pad = true, style }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; pad?: boolean; style?: CSSProperties }) {
  return (
    <section className="card" style={style}>
      {(title || actions) && <div className="card-h"><h3>{title}</h3><div className="row">{actions}</div></div>}
      {pad ? <div className="card-b">{children}</div> : children}
    </section>
  );
}

export function Stat({ icon, color, label, value, sub, onClick }: { icon: LucideIcon; color: string; label: string; value: ReactNode; sub?: ReactNode; onClick?: () => void }) {
  return (
    <div className={`card stat ${onClick ? 'link' : ''}`} onClick={onClick} role={onClick ? 'button' : undefined}>
      <div className="h"><Tile icon={icon} color={color} />{label}</div>
      <div className="v">{value}</div>
      {sub && <div className="s">{sub}</div>}
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: [T, ReactNode, number?][]; onChange: (v: T) => void }) {
  return (
    <div className="seg" role="tablist">
      {options.map(([k, l, n]) => (
        <button key={k} role="tab" aria-selected={k === value} className={k === value ? 'on' : ''} onClick={() => onChange(k)}>
          {l}{n != null && <span className="n">{n}</span>}
        </button>
      ))}
    </div>
  );
}

export function Search({ value, onChange, placeholder = 'Tìm kiếm' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="search">
      <SearchIcon size={14} strokeWidth={2.4} />
      <input className="input" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

export function Field({ label, hint, error, full, children }: { label: string; hint?: ReactNode; error?: string; full?: boolean; children: ReactNode }) {
  return (
    <div className={`field ${full ? 'full' : ''}`}>
      <label>{label}</label>
      {children}
      {error ? <div className="err">{error}</div> : hint ? <div className="hint">{hint}</div> : null}
    </div>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className={`switch ${on ? 'on' : ''}`} onClick={() => onChange(!on)} />;
}

export function Bar({ value, color }: { value: number; color?: string }) {
  return <div className="bar"><i style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color }} /></div>;
}

export function Avatar({ name, lg }: { name: string; lg?: boolean }) {
  const w = name.trim().split(/\s+/);
  return <span className={`avatar ${lg ? 'lg' : ''}`}>{(w[0][0] + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase()}</span>;
}

export function Empty({ icon: I = Inbox, text }: { icon?: LucideIcon; text: string }) {
  return <div className="empty"><I size={34} strokeWidth={1.6} /><div>{text}</div></div>;
}

export function Loading() {
  return <div className="center"><div className="spinner" /></div>;
}

function useEsc(onClose: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
}

export function Modal({ title, sub, wide, onClose, footer, children }: {
  title: string; sub?: ReactNode; wide?: boolean; onClose: () => void; footer?: ReactNode; children: ReactNode;
}) {
  useEsc(onClose);
  return (
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-h"><h2>{title}</h2>{sub && <div className="sub">{sub}</div>}</div>
        <div className="modal-b">{children}</div>
        {footer && <div className="modal-f">{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({ onClose, header, footer, children }: { onClose: () => void; header: ReactNode; footer?: ReactNode; children: ReactNode }) {
  useEsc(onClose);
  return (
    <div className="drawer-wrap" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <aside className="drawer" role="dialog" aria-modal="true">
        <div className="drawer-h">
          <div style={{ flex: 1, minWidth: 0 }}>{header}</div>
          <Btn icon={X} onClick={onClose} title="Đóng" />
        </div>
        <div className="drawer-b">{children}</div>
        {footer && <div className="drawer-f">{footer}</div>}
      </aside>
    </div>
  );
}
