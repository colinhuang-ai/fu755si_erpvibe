import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { State } from './types';
import { initialState, STATE_VERSION } from './data/mock';

const KEY = 'driveros.react';

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as State;
      if (s && s.v === STATE_VERSION && Array.isArray(s.jobs)) return s;
    }
  } catch { /* bộ nhớ trình duyệt không khả dụng */ }
  return initialState();
}

interface StoreApi {
  s: State;
  /** Cập nhật bất biến: hàm nhận bản sao để chỉnh sửa trực tiếp */
  update: (fn: (d: State) => void) => void;
  reset: () => void;
}
const Ctx = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
  }, [s]);

  useEffect(() => {
    const el = document.documentElement;
    if (s.settings.theme === 'auto') el.removeAttribute('data-theme');
    else el.setAttribute('data-theme', s.settings.theme);
  }, [s.settings.theme]);

  const update = useCallback((fn: (d: State) => void) => {
    setS(prev => { const d = structuredClone(prev); fn(d); return d; });
  }, []);
  const reset = useCallback(() => setS(initialState()), []);
  const api = useMemo(() => ({ s, update, reset }), [s, update, reset]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside StoreProvider');
  return v;
}
