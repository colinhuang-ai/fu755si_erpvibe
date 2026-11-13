import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { State } from './types';
import { loadState, resetDemo, syncDiff } from './lib/api';
import { applyTheme, loadSettings, saveSettings } from './lib/settings';
import { sb, viError } from './lib/supabase';
import { ErrorScreen, Splash } from './pages/Login';

interface StoreApi {
  s: State;
  /** Cập nhật lạc quan: sửa bản sao cục bộ rồi đồng bộ phần thay đổi lên Supabase */
  update: (fn: (d: State) => void) => void;
  reset: () => Promise<void>;
  reload: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Lỗi đồng bộ gần nhất (n tăng mỗi lần lỗi để UI hiện thông báo) */
  syncError: { msg: string; n: number } | null;
  syncing: boolean;
}
const Ctx = createContext<StoreApi | null>(null);

export function StoreProvider({ session, children }: { session: Session; children: ReactNode }) {
  const uid = session.user.id;
  const [s, setS] = useState<State | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<StoreApi['syncError']>(null);
  const [pending, setPending] = useState(0);
  const ref = useRef<State | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());

  const reload = useCallback(async () => {
    const st = await loadState(uid, ref.current?.settings ?? loadSettings());
    ref.current = st;
    setS(st);
  }, [uid]);

  const first = useCallback(() => {
    setFatal(null);
    reload().catch(e => setFatal(viError(e)));
  }, [reload]);
  useEffect(first, [first]);

  useEffect(() => { if (s) applyTheme(s.settings.theme); }, [s?.settings.theme]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = useCallback((fn: (d: State) => void) => {
    const prev = ref.current;
    if (!prev) return;
    const next = structuredClone(prev);
    fn(next);
    ref.current = next;
    setS(next);
    if (JSON.stringify(prev.settings) !== JSON.stringify(next.settings)) saveSettings(next.settings);
    setPending(n => n + 1);
    queue.current = queue.current
      .then(() => syncDiff(prev, next, next.driver.dbId))
      .catch(async e => {
        setSyncError(x => ({ msg: viError(e), n: (x?.n ?? 0) + 1 }));
        await reload().catch(() => undefined); // lấy lại dữ liệu chuẩn từ server
      })
      .finally(() => setPending(n => n - 1));
  }, [uid, reload]);

  const reset = useCallback(async () => {
    await queue.current;
    await resetDemo();
    await reload();
  }, [reload]);

  const signOut = useCallback(async () => {
    await queue.current;
    await sb.auth.signOut();
  }, []);

  const api = useMemo(() => (s ? { s, update, reset, reload, signOut, syncError, syncing: pending > 0 } : null),
    [s, update, reset, reload, signOut, syncError, pending]);

  if (fatal) return <ErrorScreen message={fatal} onRetry={first} onSignOut={() => void sb.auth.signOut()} />;
  if (!api) return <Splash text="Đang tải dữ liệu…" />;
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside StoreProvider');
  return v;
}

/** Theo dõi phiên đăng nhập Supabase */
export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb.auth.onAuthStateChange((_e, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);
  return session;
}
