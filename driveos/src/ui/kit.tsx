import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';

/* ---------------- Screen: navigation bar with collapsing large title ---------------- */
interface ScreenProps {
  title: string;
  eyebrow?: ReactNode;
  large?: boolean;
  back?: { label: string; to: string };
  trailing?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}
export function Screen({ title, eyebrow, large = true, back, trailing, action, children }: ScreenProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [st, setSt] = useState({ title: !large, bar: false });
  const onScroll = () => {
    const y = ref.current?.scrollTop ?? 0;
    const next = { title: !large || y > 40, bar: y > 2 };
    if (next.title !== st.title || next.bar !== st.bar) setSt(next);
  };
  return (
    <div className={`screen ${back ? 'push-in' : ''}`}>
      <div className={`scroller ${action ? 'has-action' : ''}`} ref={ref} onScroll={onScroll}>
        <header className={`navbar ${st.bar ? 'scrolled' : ''}`}>
          <div className="nav-row">
            <div className="nav-left">{back && <BackButton {...back} />}</div>
            <div className={`nav-title ${st.title ? 'show' : ''}`}>{title}</div>
            <div className="nav-right">{trailing}</div>
          </div>
        </header>
        {large && (
          <div className="large">
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            <h1>{title}</h1>
          </div>
        )}
        {children}
      </div>
      {action && <div className="actionbar">{action}</div>}
    </div>
  );
}

export function BackButton({ label, to }: { label: string; to: string }) {
  const nav = useNavigate();
  const go = () => ((window.history.state?.idx ?? 0) > 0 ? nav(-1) : nav(to));
  return (
    <button className="nav-btn back" onClick={go}>
      <ChevronLeft size={30} strokeWidth={2.3} />
      <span>{label}</span>
    </button>
  );
}

export function NavIcon({ icon: I, onClick, label, color }: { icon: LucideIcon; onClick: () => void; label: string; color?: string }) {
  return (
    <button className="nav-btn" onClick={onClick} aria-label={label} style={color ? { color } : undefined}>
      <I size={24} strokeWidth={2} />
    </button>
  );
}

/* ---------------- Grouped list ---------------- */
export function Group({ header, footer, footerTone, plain, children, style }: {
  header?: ReactNode; footer?: ReactNode; footerTone?: 'red'; plain?: boolean; children: ReactNode; style?: CSSProperties;
}) {
  return (
    <section className="group" style={style}>
      {header && <div className={`group-h ${plain ? 'plain' : ''}`}>{header}</div>}
      <div className="cells">{children}</div>
      {footer && <div className={`group-f ${footerTone ?? ''}`}>{footer}</div>}
    </section>
  );
}

interface CellProps {
  icon?: LucideIcon;
  tint?: string;
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  detail?: ReactNode;
  trailing?: ReactNode;
  chevron?: boolean;
  onClick?: () => void;
  href?: string;
  tone?: 'blue' | 'red';
  sepLeft?: number;
  className?: string;
}
export function Cell(p: CellProps) {
  const lead = p.icon ? <Tile icon={p.icon} color={p.tint ?? 'var(--gray)'} /> : p.leading;
  const inner = (
    <>
      {lead}
      <div className="cell-main">
        <div className={`cell-title ${p.tone ?? ''}`}>{p.title}</div>
        {p.subtitle != null && p.subtitle !== '' && <div className="cell-sub">{p.subtitle}</div>}
      </div>
      {p.detail != null && <div className="cell-detail">{p.detail}</div>}
      {p.trailing}
      {p.chevron && <ChevronRight className="chev" size={20} strokeWidth={2.4} />}
    </>
  );
  const cls = `cell ${lead ? 'has-lead' : ''} ${p.onClick || p.href ? 'tap' : ''} ${p.className ?? ''}`;
  const style = p.sepLeft ? ({ '--sep-left': p.sepLeft + 'px' } as CSSProperties) : undefined;
  if (p.href) {
    const ext = p.href.startsWith('http');
    return <a className={cls} style={style} href={p.href} target={ext ? '_blank' : undefined} rel={ext ? 'noopener noreferrer' : undefined}>{inner}</a>;
  }
  if (p.onClick) return <button type="button" className={cls} style={style} onClick={p.onClick}>{inner}</button>;
  return <div className={cls} style={style}>{inner}</div>;
}

export function Tile({ icon: I, color, size = 'sm' }: { icon: LucideIcon; color: string; size?: 'sm' | 'lg' | 'xl' }) {
  const px = size === 'xl' ? 34 : size === 'lg' ? 24 : 18;
  return (
    <span className={`tile ${size === 'sm' ? '' : size}`} style={{ background: color }}>
      <I size={px} strokeWidth={2.2} />
    </span>
  );
}

/* ---------------- Controls ---------------- */
type BtnKind = 'filled' | 'tinted' | 'gray' | 'red' | 'red-tinted' | 'green' | 'plain';
export function Btn({ kind = 'filled', size, block, icon: I, children, onClick, disabled, style }: {
  kind?: BtnKind; size?: 'sm' | 'md'; block?: boolean; icon?: LucideIcon; children?: ReactNode;
  onClick?: () => void; disabled?: boolean; style?: CSSProperties;
}) {
  return (
    <button type="button" className={`btn ${kind} ${size ?? ''} ${block ? 'block' : ''}`} onClick={onClick} disabled={disabled} style={style}>
      {I && <I size={size ? 17 : 20} strokeWidth={2.3} />}
      {children}
    </button>
  );
}

export function Segmented<T extends string>({ value, options, onChange, small }: {
  value: T; options: [T, string][]; onChange: (v: T) => void; small?: boolean;
}) {
  const i = Math.max(0, options.findIndex(o => o[0] === value));
  return (
    <div className={`seg ${small ? 'sm' : ''}`} style={{ '--n': options.length } as CSSProperties} role="tablist">
      <span className="seg-thumb" style={{ transform: `translateX(${i * 100}%)` }} />
      {options.map(([k, l]) => (
        <button key={k} role="tab" aria-selected={k === value} className={k === value ? 'on' : ''} onClick={() => onChange(k)}>{l}</button>
      ))}
    </div>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className={`switch ${on ? 'on' : ''}`} onClick={() => onChange(!on)} />;
}

export function RCheck({ on, green }: { on: boolean; green?: boolean }) {
  return <span className={`rcheck ${on ? 'on' : ''} ${green ? 'green' : ''}`}>{on && <Check size={15} strokeWidth={3.2} />}</span>;
}

export type Tone = 'green' | 'red' | 'orange' | 'blue' | 'gray' | 'indigo' | 'purple' | 'teal' | 'yellow';
export function Pill({ tone = 'gray', children, icon: I }: { tone?: Tone; children: ReactNode; icon?: LucideIcon }) {
  return <span className={`pill t-${tone}`}>{I && <I size={12} strokeWidth={2.8} />}{children}</span>;
}

export function ProgressBar({ value, color, height }: { value: number; color?: string; height?: number }) {
  return (
    <div className="pbar" style={height ? { height, borderRadius: height / 2 } : undefined}>
      <i style={{ width: `${Math.max(0, Math.min(100, value * 100))}%`, background: color }} />
    </div>
  );
}

export function Ring({ value, size = 120, stroke = 14, color = 'var(--blue)', children }: {
  value: number; size?: number; stroke?: number; color?: string; children?: ReactNode;
}) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeOpacity={0.18} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${(Math.min(1, value) * c).toFixed(1)} ${c.toFixed(1)}`} style={{ transition: 'stroke-dasharray .6s' }} />
      </svg>
      <div className="ring-c">{children}</div>
    </div>
  );
}

/** Thẻ tóm tắt kiểu ứng dụng Sức khỏe (Health) */
export function SumCard({ icon: I, color, title, meta, children, onClick }: {
  icon: LucideIcon; color: string; title: string; meta?: ReactNode; children: ReactNode; onClick?: () => void;
}) {
  return (
    <div className={`card sum ${onClick ? 'tap' : ''}`} onClick={onClick} role={onClick ? 'button' : undefined}>
      <div className="sum-h" style={{ color }}>
        <I size={17} strokeWidth={2.5} />
        <span>{title}</span>
        {(meta || onClick) && (
          <span className="sum-meta">{meta}{onClick && <ChevronRight size={16} strokeWidth={2.6} />}</span>
        )}
      </div>
      {children}
    </div>
  );
}

export function Empty({ icon: I, title, text }: { icon: LucideIcon; title: string; text?: string }) {
  return (
    <div className="empty">
      <I size={44} strokeWidth={1.6} />
      <div className="empty-t">{title}</div>
      {text && <div className="empty-s">{text}</div>}
    </div>
  );
}
