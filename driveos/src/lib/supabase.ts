import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && key);

/** Client Supabase dùng publishable key — quyền truy cập được giới hạn bởi RLS theo từng lái xe */
export const sb = createClient(url ?? 'http://localhost', key ?? 'missing-key', {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'driveros.auth' }
});

/** Thông báo lỗi tiếng Việt cho các lỗi thường gặp */
export function viError(e: unknown): string {
  const m = (e as { message?: string })?.message ?? String(e);
  if (/Invalid login credentials/i.test(m)) return 'Email hoặc mật khẩu không đúng.';
  if (/Email not confirmed/i.test(m)) return 'Email chưa được xác nhận. Hãy mở email kích hoạt rồi đăng nhập lại.';
  if (/User already registered/i.test(m)) return 'Email này đã có tài khoản. Hãy đăng nhập.';
  if (/Password should be at least/i.test(m)) return 'Mật khẩu cần ít nhất 6 ký tự.';
  if (/rate limit/i.test(m)) return 'Thao tác quá nhiều lần, vui lòng thử lại sau ít phút.';
  if (/Failed to fetch|NetworkError/i.test(m)) return 'Không kết nối được máy chủ. Kiểm tra mạng và thử lại.';
  if (/schema cache|does not exist|Could not find the function/i.test(m)) return 'Cơ sở dữ liệu chưa được khởi tạo. Hãy chạy supabase/setup.sql trong Supabase SQL Editor.';
  return m;
}
