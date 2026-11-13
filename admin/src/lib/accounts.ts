import { useQuery } from './query';
import { sb } from './supabase';

export interface Credential { user_id: string; login: string; password: string; reused?: boolean }
export interface Account { id: string; email: string; last_sign_in_at: string | null; banned: boolean; confirmed: boolean }

const NOT_DEPLOYED = 'Chưa triển khai Edge Function “admin-users” trên Supabase — xem hướng dẫn trong admin/README.md.';

/** Gọi Edge Function admin-users (tạo tài khoản, đặt lại mật khẩu, khóa…) */
export async function accounts<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await sb.functions.invoke('admin-users', { body });
  if (error) {
    let msg = error.message;
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === 'function') {
      if (ctx.status === 404) throw new Error(NOT_DEPLOYED);
      try { const j = await ctx.json(); if (j?.error) msg = j.error; else if (j?.message) msg = j.message; } catch { /* ignore */ }
    }
    if (/Failed to send a request|Failed to fetch/i.test(msg)) msg = NOT_DEPLOYED;
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
}

/** Trạng thái tài khoản (đăng nhập gần nhất, bị khóa) — trả về lỗi thay vì ném nếu chưa triển khai function */
export function useAccounts() {
  return useQuery(async () => {
    const r = await accounts<{ users: Account[] }>({ action: 'list' });
    return new Map(r.users.map(u => [u.id, u]));
  }, []);
}
