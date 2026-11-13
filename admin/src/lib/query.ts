import { useCallback, useEffect, useRef, useState } from 'react';
import { sb, viError } from './supabase';

/** Tải dữ liệu bất đồng bộ, có reload. Giữ dữ liệu cũ khi đang tải lại để giao diện không nháy. */
export function useQuery<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data?: T; error?: string; loading: boolean }>({ loading: true });
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick(t => t + 1), []);
  useEffect(() => {
    let alive = true;
    setState(s => ({ ...s, loading: true }));
    fn().then(data => { if (alive) setState({ data, loading: false }); })
      .catch(e => { if (alive) setState(s => ({ ...s, error: viError(e), loading: false })); });
    return () => { alive = false; };
  }, [...deps, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  return { ...state, reload };
}

let channelSeq = 0;
/** Gọi lại khi các bảng thay đổi (Supabase Realtime, tôn trọng RLS); gộp nhiều sự kiện trong 400 ms */
export function useRealtime(tables: string[], onChange: () => void) {
  const cb = useRef(onChange);
  cb.current = onChange;
  const key = tables.join(',');
  useEffect(() => {
    let t: number | undefined;
    const ch = sb.channel(`admin-${++channelSeq}`);
    key.split(',').forEach(table =>
      ch.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        window.clearTimeout(t);
        t = window.setTimeout(() => cb.current(), 400);
      }));
    ch.subscribe();
    return () => { window.clearTimeout(t); void sb.removeChannel(ch); };
  }, [key]);
}
