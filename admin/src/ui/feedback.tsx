import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Check, Info, TriangleAlert, X } from 'lucide-react';
import { viError } from '../lib/supabase';
import { Btn, Modal } from './kit';

type Tone = 'success' | 'info' | 'error';
interface ConfirmOpts { title: string; message?: ReactNode; ok?: string; danger?: boolean; input?: { label: string; placeholder?: string; presets?: string[]; required?: boolean } }
interface Api {
  toast: (text: string, tone?: Tone) => void;
  /** Hộp thoại xác nhận; nếu có input thì trả về chuỗi người dùng nhập, hủy trả về null */
  confirm: (o: ConfirmOpts) => Promise<string | null>;
  /** Chạy thao tác ghi, báo thành công/thất bại bằng toast. Trả về true nếu thành công. */
  run: (fn: () => Promise<unknown>, success?: string) => Promise<boolean>;
}
const Ctx = createContext<Api | null>(null);
export const useFeedback = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useFeedback outside provider');
  return v;
};

const ICON = { success: { I: Check, bg: 'var(--green)' }, info: { I: Info, bg: 'var(--blue)' }, error: { I: X, bg: 'var(--red)' } };

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; text: string; tone: Tone }[]>([]);
  const [dlg, setDlg] = useState<(ConfirmOpts & { resolve: (v: string | null) => void }) | null>(null);
  const [text, setText] = useState('');

  const toast = useCallback((t: string, tone: Tone = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(x => [...x, { id, text: t, tone }]);
    window.setTimeout(() => setToasts(x => x.filter(y => y.id !== id)), tone === 'error' ? 6000 : 3200);
  }, []);
  const confirm = useCallback((o: ConfirmOpts) => new Promise<string | null>(resolve => { setText(''); setDlg({ ...o, resolve }); }), []);
  const run = useCallback(async (fn: () => Promise<unknown>, success?: string) => {
    try { await fn(); if (success) toast(success); return true; }
    catch (e) { toast(viError(e), 'error'); return false; }
  }, [toast]);
  const api = useMemo(() => ({ toast, confirm, run }), [toast, confirm, run]);

  const close = (v: string | null) => { dlg?.resolve(v); setDlg(null); };
  const needText = dlg?.input?.required && !text.trim();

  return (
    <Ctx.Provider value={api}>
      {children}
      {dlg && (
        <Modal title={dlg.title} onClose={() => close(null)}
          footer={<>
            <Btn onClick={() => close(null)}>Hủy</Btn>
            <Btn kind={dlg.danger ? 'danger' : 'primary'} disabled={!!needText} onClick={() => close(dlg.input ? text.trim() : 'ok')}>{dlg.ok ?? 'Đồng ý'}</Btn>
          </>}>
          {dlg.message && <div style={{ whiteSpace: 'pre-line', marginBottom: dlg.input ? 12 : 0 }}>{dlg.message}</div>}
          {dlg.input && (
            <div className="field">
              <label>{dlg.input.label}</label>
              {dlg.input.presets && (
                <div className="row" style={{ flexWrap: 'wrap', marginBottom: 4 }}>
                  {dlg.input.presets.map(p => <Btn key={p} size="sm" onClick={() => setText(p)}>{p}</Btn>)}
                </div>
              )}
              <textarea className="textarea" autoFocus value={text} placeholder={dlg.input.placeholder} onChange={e => setText(e.target.value)} />
            </div>
          )}
        </Modal>
      )}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map(t => {
          const { I, bg } = ICON[t.tone];
          return <div key={t.id} className="toast"><span className="ti" style={{ background: bg }}><I size={13} strokeWidth={3} /></span>{t.text}</div>;
        })}
      </div>
    </Ctx.Provider>
  );
}

export { TriangleAlert };
