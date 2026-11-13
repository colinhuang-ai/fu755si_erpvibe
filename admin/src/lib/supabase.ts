import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && key);

/** Phiên đăng nhập quản trị tách riêng với app lái xe (storageKey khác) */
export const sb = createClient(url ?? 'http://localhost', key ?? 'missing-key', {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'driveros.admin.auth' }
});

/** Ném lỗi nếu truy vấn Supabase thất bại, trả về data */
export function must<T>(r: { data: T | null; error: unknown }): T {
  if (r.error) throw r.error;
  return r.data as T;
}

export function viError(e: unknown): string {
  const m = (e as { message?: string })?.message ?? String(e);
  if (/Invalid login credentials/i.test(m)) return 'Email hoặc mật khẩu không đúng.';
  if (/Email not confirmed/i.test(m)) return 'Email chưa được xác nhận.';
  if (/User already registered/i.test(m)) return 'Email này đã có tài khoản. Hãy đăng nhập.';
  if (/Password should be at least/i.test(m)) return 'Mật khẩu cần ít nhất 6 ký tự.';
  if (/row-level security|permission denied/i.test(m)) return 'Tài khoản của bạn không có quyền thực hiện thao tác này.';
  if (/Failed to fetch|NetworkError/i.test(m)) return 'Không kết nối được máy chủ.';
  if (/schema cache|Could not find the function/i.test(m)) return 'Cơ sở dữ liệu chưa được nâng cấp. Hãy chạy driveos/supabase/setup.sql trong Supabase SQL Editor.';
  return m;
}
