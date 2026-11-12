import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Check, Info, TriangleAlert, X } from 'lucide-react';
import { useStore } from '../store';

export type AlertAction = { label: string; value: string; style?: 'default' | 'cancel' | 'destructive' };
export interface AlertOpts { title: string; message?: string; actions?: AlertAction[] }
export type ToastTone = 'success' | 'info' | 'warn' | 'error';

/** Các sheet có nhập liệu — bị khóa khi bật "Chế độ đang lái" */
const INPUT_SHEETS = new Set(['expense', 'advance', 'leave', 'explain', 'complaint', 'lesson', 'quiz', 'reject', 'load']);

interface SheetState { name: string; props: Record<string, unknown>; key: number }
interface UIApi {
  toast: (text: string, tone?: ToastTone) => void;
  confirm: (o: AlertOpts) => Promise<string | null>;
  openSheet: (name: string, props?: Record<string, unknown>) => void;
  closeSheet: () => void;
  sheet: SheetState | null;
  closing: boolean;
}
const Ctx = createContext<UIApi | null>(null);
export const useUI = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useUI must be used inside UIProvider');
  return v;
};

const TONE = {
  success: { bg: 'var(--green)', I: Check }, info: { bg: 'var(--blue)', I: Info },
  warn: { bg: 'var(--orange)', I: TriangleAlert }, error: { bg: 'var(--red)', I: X }
};

export function UIProvider({ children }: { children: ReactNode }) {
  const { s, update } = useStore();
  const [toastS, setToast] = useState<{ text: string; tone: ToastTone; show: boolean }>({ text: '', tone: 'success', show: false });
  const tRef = useRef<number | undefined>(undefined);
  const [alert, setAlert] = useState<(AlertOpts & { resolve: (v: string | null) => void }) | null>(null);
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [closing, setClosing] = useState(false);

  const toast = useCallback((text: string, tone: ToastTone = 'success') => {
    setToast({ text, tone, show: true });
    window.clearTimeout(tRef.current);
    tRef.current = window.setTimeout(() => setToast(t => ({ ...t, show: false })), 2600);
  }, []);

  const confirm = useCallback((o: AlertOpts) => new Promise<string | null>(resolve => setAlert({ ...o, resolve })), []);

  const closeSheet = useCallback(() => {
    setClosing(true);
    window.setTimeout(() => { setSheet(null); setClosing(false); }, 300);
  }, []);

  const driving = s.settings.driving;
  const openSheet = useCallback(async (name: string, props: Record<string, unknown> = {}) => {
    if (driving && INPUT_SHEETS.has(name)) {
      const r = await confirm({
        title: 'Đang ở chế độ lái xe',
        message: 'Để an toàn, hãy dừng xe trước khi nhập liệu.',
        actions: [{ label: 'Đóng', value: 'no', style: 'cancel' }, { label: 'Tôi đã dừng xe', value: 'off' }]
      });
      if (r !== 'off') return;
      update(d => { d.settings.driving = false; });
    }
    setClosing(false);
    setSheet({ name, props, key: Date.now() });
  }, [driving, confirm, update]);

  const api = useMemo(() => ({ toast, confirm, openSheet, closeSheet, sheet, closing }), [toast, confirm, openSheet, closeSheet, sheet, closing]);
  const T = TONE[toastS.tone];
  const acts = alert?.actions ?? [{ label: 'OK', value: 'ok', style: 'cancel' as const }];

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className={`toast ${toastS.show ? 'show' : ''}`} role="status" aria-live="polite">
        <span className="ti" style={{ background: T.bg }}><T.I size={16} strokeWidth={3} /></span>
        <span>{toastS.text}</span>
      </div>
      {alert && (
        <div className="alert-layer">
          <div className="alert" role="alertdialog" aria-label={alert.title}>
            <div className="alert-body">
              <div className="alert-title">{alert.title}</div>
              {alert.message && <div className="alert-msg">{alert.message}</div>}
            </div>
            <div className={`alert-actions ${acts.length > 2 ? 'stack' : ''}`}>
              {acts.map(a => (
                <button key={a.value} className={a.style ?? ''}
                  onClick={() => { alert.resolve(a.value); setAlert(null); }}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

/* -------- khung sheet dùng chung -------- */
export function SheetHeader({ title, left = 'Hủy', right, onRight, rightDisabled, onLeft }: {
  title: string; left?: string | null; right?: string; onRight?: () => void; rightDisabled?: boolean; onLeft?: () => void;
}) {
  const { closeSheet } = useUI();
  return (
    <div className="sheet-head">
      <div className="l">{left && <button className="nav-btn" onClick={onLeft ?? closeSheet}>{left}</button>}</div>
      <div className="sheet-title">{title}</div>
      <div className="r">{right && <button className="nav-btn bold" disabled={rightDisabled} onClick={onRight}>{right}</button>}</div>
    </div>
  );
}
