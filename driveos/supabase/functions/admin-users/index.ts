/**
 * Supabase Edge Function: admin-users
 * Quản lý tài khoản đăng nhập thay cho tự đăng ký. Chỉ quản trị viên / nhân sự gọi được.
 *
 *   create          { kind: 'staff', email, full_name, role }        → tạo tài khoản nhân viên + cấp vai trò (chỉ admin)
 *                   { kind: 'driver', driver_id, email? }            → tạo tài khoản cho hồ sơ lái xe (admin, hr)
 *   reset_password  { user_id }                                      → sinh mật khẩu mới
 *   set_banned      { user_id, banned }                              → khóa / mở khóa đăng nhập
 *   list            {}                                               → trạng thái các tài khoản
 *   bootstrap       { email, full_name } + header x-bootstrap-token  → tạo quản trị viên đầu tiên; chỉ chạy khi
 *                   secret BOOTSTRAP_TOKEN đang được đặt (đặt tạm, xóa ngay sau khi dùng)
 *
 * Khóa service role chỉ nằm ở đây (biến môi trường của Supabase), không bao giờ gửi xuống trình duyệt.
 * Triển khai: Dashboard → Edge Functions → Deploy a new function → Via editor → tên "admin-users" → dán file này.
 */
import { createClient, type User } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
/** Tên miền dành riêng (RFC 2606) cho lái xe không có email: đăng nhập bằng mã nhân viên */
const DRIVER_DOMAIN = 'driveros.invalid';
const STAFF_ROLES = ['admin', 'dispatcher', 'accountant', 'hr'];

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-bootstrap-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** Mật khẩu dễ đọc, không có ký tự dễ nhầm (0/O, 1/l/I): Kmtz-4829-pqrW */
function genPassword() {
  const pick = (set: string, n: number) => Array.from(crypto.getRandomValues(new Uint32Array(n)), x => set[x % set.length]).join('');
  const UP = 'ABCDEFGHJKLMNPQRSTUVWXYZ', LOW = 'abcdefghijkmnpqrstuvwxyz', DIG = '23456789';
  return `${pick(UP, 1)}${pick(LOW, 3)}-${pick(DIG, 4)}-${pick(LOW, 3)}${pick(UP, 1)}`;
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

async function findUserByEmail(email: string): Promise<User | null> {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const u = data.users.find(x => x.email?.toLowerCase() === email);
    if (u) return u;
    if (data.users.length < 1000) return null;
  }
  return null;
}

/** Nhân sự chỉ thao tác trên tài khoản lái xe; tài khoản nhân viên chỉ quản trị viên được động vào */
async function assertCanManage(callerRole: string, targetId: string) {
  const { data } = await admin.from('staff').select('role').eq('user_id', targetId).maybeSingle();
  if (data && callerRole !== 'admin') throw new HttpError(403, 'Chỉ quản trị viên được quản lý tài khoản nhân viên');
}

/** Tạo tài khoản mới, hoặc dùng lại tài khoản đã có cùng email (đặt mật khẩu mới, xác nhận email) */
async function upsertAccount(email: string, password: string, fullName?: string) {
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName } });
  if (!error) return { user: data.user, reused: false };
  if (!/already|registered|exists/i.test(error.message)) {
    if (/invalid/i.test(error.message)) throw new HttpError(400, `Email không hợp lệ: ${email}`);
    throw error;
  }
  const existing = await findUserByEmail(email);
  if (!existing) throw error;
  const upd = await admin.auth.admin.updateUserById(existing.id, { password, email_confirm: true, ban_duration: 'none' });
  if (upd.error) throw upd.error;
  return { user: upd.data.user, reused: true };
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const body = await req.json().catch(() => ({}));

    if (body.action === 'bootstrap') {
      const expected = Deno.env.get('BOOTSTRAP_TOKEN');
      if (!expected || expected.length < 32 || req.headers.get('x-bootstrap-token') !== expected) throw new HttpError(403, 'Không được phép');
      const email = String(body.email ?? '').trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, 'Email không hợp lệ');
      const password = genPassword();
      const { user, reused } = await upsertAccount(email, password, body.full_name);
      const { error } = await admin.from('staff').upsert({ user_id: user.id, full_name: body.full_name || email, email, role: 'admin' });
      if (error) throw error;
      return json({ user_id: user.id, login: email, password, reused });
    }

    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const { data: auth, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !auth.user) throw new HttpError(401, 'Phiên đăng nhập không hợp lệ, hãy đăng nhập lại');
    const caller = auth.user;
    const { data: me } = await admin.from('staff').select('role').eq('user_id', caller.id).maybeSingle();
    const role: string | undefined = me?.role;
    if (role !== 'admin' && role !== 'hr') throw new HttpError(403, 'Chỉ quản trị viên hoặc nhân sự được quản lý tài khoản');

    switch (body.action) {
      case 'create': {
        const password = genPassword();
        if (body.kind === 'staff') {
          if (role !== 'admin') throw new HttpError(403, 'Chỉ quản trị viên được tạo tài khoản nhân viên');
          const email = String(body.email ?? '').trim().toLowerCase();
          const fullName = String(body.full_name ?? '').trim();
          if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, 'Email không hợp lệ');
          if (!STAFF_ROLES.includes(body.role)) throw new HttpError(400, 'Vai trò không hợp lệ');
          const { user, reused } = await upsertAccount(email, password, fullName);
          const { error } = await admin.from('staff').upsert({ user_id: user.id, full_name: fullName || email, email, role: body.role });
          if (error) { if (!reused) await admin.auth.admin.deleteUser(user.id); throw error; }
          return json({ user_id: user.id, login: email, password, reused });
        }
        if (body.kind === 'driver') {
          const { data: d, error: dErr } = await admin.from('drivers').select('id, code, full_name, email, user_id').eq('id', body.driver_id).maybeSingle();
          if (dErr) throw dErr;
          if (!d) throw new HttpError(404, 'Không tìm thấy hồ sơ lái xe');
          if (d.user_id) throw new HttpError(409, 'Lái xe đã có tài khoản — dùng “Đặt lại mật khẩu”');
          const email = String(body.email || d.email || `${d.code}@${DRIVER_DOMAIN}`).trim().toLowerCase();
          const { user, reused } = await upsertAccount(email, password, d.full_name);
          const { data: other } = await admin.from('drivers').select('code').eq('user_id', user.id).maybeSingle();
          if (other) throw new HttpError(409, `Email này đã gắn với lái xe ${other.code}`);
          const { error } = await admin.from('drivers').update({ user_id: user.id, email }).eq('id', d.id);
          if (error) { if (!reused) await admin.auth.admin.deleteUser(user.id); throw error; }
          return json({ user_id: user.id, login: email.endsWith(`@${DRIVER_DOMAIN}`) ? d.code : email, password, reused });
        }
        throw new HttpError(400, 'kind phải là staff hoặc driver');
      }
      case 'reset_password': {
        await assertCanManage(role, body.user_id);
        const password = genPassword();
        const { data, error } = await admin.auth.admin.updateUserById(body.user_id, { password, email_confirm: true });
        if (error) throw error;
        const email = data.user.email ?? '';
        return json({ user_id: body.user_id, login: email.endsWith(`@${DRIVER_DOMAIN}`) ? email.split('@')[0].toUpperCase() : email, password });
      }
      case 'set_banned': {
        if (body.user_id === caller.id) throw new HttpError(400, 'Không thể tự khóa tài khoản của mình');
        await assertCanManage(role, body.user_id);
        const { error } = await admin.auth.admin.updateUserById(body.user_id, { ban_duration: body.banned ? '876000h' : 'none' });
        if (error) throw error;
        return json({ ok: true });
      }
      case 'list': {
        const users: Record<string, unknown>[] = [];
        for (let page = 1; page <= 20; page++) {
          const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
          if (error) throw error;
          users.push(...data.users.map(u => ({
            id: u.id, email: u.email, last_sign_in_at: u.last_sign_in_at ?? null,
            banned: !!u.banned_until && new Date(u.banned_until) > new Date(), confirmed: !!u.email_confirmed_at
          })));
          if (data.users.length < 1000) break;
        }
        return json({ users });
      }
      default:
        throw new HttpError(400, 'action không hợp lệ');
    }
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 400;
    return json({ error: (e as Error).message ?? String(e) }, status);
  }
});
