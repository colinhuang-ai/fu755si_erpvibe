/**
 * Sinh supabase/seed.sql và supabase/setup.sql từ bộ dữ liệu mẫu src/data/demo.ts.
 * Chạy: npm run db:seed   (Node ≥ 22.6, tự bỏ kiểu TypeScript)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { demoDataset, fleetDatasets } from '../src/data/demo.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase');
const demo = demoDataset();
const fleet = fleetDatasets();

const lit = (v: unknown): string => {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (Array.isArray(v)) return `array[${v.map(lit).join(', ')}]::text[]`;
  return `'${String(v).replace(/'/g, "''")}'`;
};
const jsonLit = (v: unknown) => {
  const s = JSON.stringify(v);
  if (s.includes('$json$')) throw new Error('Dữ liệu chứa chuỗi $json$');
  return `$json$${s}$json$::jsonb`;
};

const catalog = demo.courses.map(c => [
  `insert into public.courses (id, title, required, due, color, icon, sort) values (${[c.id, c.title, c.required, c.due ?? null, c.color, c.icon, c.sort].map(lit).join(', ')})`,
  `  on conflict (id) do nothing;`,
  ...c.lessons.map((l, i) =>
    `insert into public.lessons (course_id, idx, title, type, minutes) values (${[c.id, i, l.t, l.type, l.min].map(lit).join(', ')}) on conflict do nothing;`),
  ...c.quiz.map((q, i) =>
    `insert into public.quiz_questions (course_id, idx, question, options, answer) values (${[c.id, i, q.q, q.o, q.a].map(lit).join(', ')}) on conflict do nothing;`)
].join('\n')).join('\n\n');

const strip = ({ courses: _c, ...rest }: ReturnType<typeof demoDataset>) => rest;

const seed = `-- =====================================================================
-- DriverOS · dữ liệu mẫu (FILE SINH TỰ ĐỘNG bởi scripts/gen-seed.ts — đừng sửa tay)
-- =====================================================================

-- Danh mục khóa học dùng chung (chỉ thêm nếu chưa có, không ghi đè bản nhân sự đã sửa)
${catalog}

-- Bộ dữ liệu mẫu cho một tài khoản lái xe mới
create or replace function public.demo_dataset() returns jsonb
language sql immutable set search_path = '' as $f$ select ${jsonLit(strip(demo))} $f$;

-- 7 lái xe khác của đội xe, chỉ để app quản trị có dữ liệu
create or replace function public.demo_fleet() returns jsonb
language sql immutable set search_path = '' as $f$ select ${jsonLit(fleet.map(strip))} $f$;

-- Tạo một lái xe từ bộ dữ liệu mẫu; p_user = null cho lái xe chưa có tài khoản
create or replace function public._seed_driver(p_user uuid, demo jsonb, p_email text, p_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  d jsonb := demo->'driver';
  v jsonb := demo->'vehicle';
  j jsonb;
  did uuid;
  jid uuid;
begin
  insert into drivers (user_id, email, code, full_name, phone, team, since, dob, rating, trips_year, km_safe, incidents, leave_left,
                       company, dispatcher_name, dispatcher_phone, hse_name, hse_phone, learn_minutes_month)
  values (p_user, p_email, d->>'id', coalesce(p_name, d->>'name'), d->>'phone', d->>'team', d->>'since', to_date(d->>'dob', 'DD/MM/YYYY'),
          (d->>'rating')::numeric, (d->>'trips')::int, (d->>'km')::int, (d->>'incidents')::int, (d->>'leaveLeft')::int,
          d->>'company', d#>>'{dispatcher,name}', d#>>'{dispatcher,phone}', d#>>'{hse,name}', d#>>'{hse,phone}', (d->>'learnMin')::int)
  returning id into did;

  insert into vehicles (driver_id, plate, model, compartments, registry_exp, tank_inspect_exp, odo, next_service_km)
  values (did, v->>'plate', v->>'model', array(select x::int from jsonb_array_elements_text(v->'compartments') x),
          (v->>'registry')::date, (v->>'tankInspect')::date, (v->>'odo')::int, (v->>'nextService')::int);

  for j in select value from jsonb_array_elements(demo->'jobs') loop
    insert into jobs (driver_id, code, job_date, status, vehicle, kind, from_name, from_addr, from_time, to_name, to_addr, to_eta,
                      to_who, to_phone, km, fee, seal, note, late_min, rejected_reason, rejected_note, confirm_by, deviation_note)
    values (did, j->>'id', (j->>'date')::date, (j->>'status')::smallint, j->>'vehicle', j->>'type',
            j#>>'{from,name}', j#>>'{from,addr}', (j#>>'{from,time}')::time, j#>>'{to,name}', j#>>'{to,addr}', (j#>>'{to,eta}')::time,
            j#>>'{to,who}', j#>>'{to,phone}', (j->>'km')::int, (j->>'fee')::int, j->>'seal', j->>'note',
            coalesce((j->>'lateMin')::int, 0), j#>>'{rejected,reason}', j#>>'{rejected,note}', j->>'confirmBy', j->>'deviationNote')
    returning id into jid;

    insert into job_cargo (job_id, idx, label, item, qty, unit, loaded, delivered)
    select jid, (t.o - 1)::smallint, t.c->>'label', t.c->>'item', (t.c->>'qty')::int, t.c->>'unit', (t.c->>'loaded')::int, (t.c->>'delivered')::int
    from jsonb_array_elements(j->'cargo') with ordinality as t(c, o);

    insert into job_checks (job_id, idx, title, phase, done, sign)
    select jid, (t.o - 1)::smallint, t.c->>'t', t.c->>'ph', (t.c->>'done')::boolean, coalesce((t.c->>'sign')::boolean, false)
    from jsonb_array_elements(j->'checks') with ordinality as t(c, o);
  end loop;

  insert into attendance (driver_id, work_date, check_in, check_out, note, explain, explain_text)
  select did, make_date(2026, 11, a.key::int), (a.value->>'in')::time, (a.value->>'out')::time,
         a.value->>'note', a.value->>'explain', a.value->>'explainText'
  from jsonb_each(demo->'att') a;

  insert into expenses (driver_id, spent_on, spent_time, category, title, place, amount, status, receipt, vat, reject_reason, liters, odo, job_code)
  select did, (e->>'date')::date, (e->>'time')::time, e->>'cat', e->>'title', e->>'place', (e->>'amount')::bigint, e->>'status',
         (e->>'receipt')::boolean, coalesce((e->>'vat')::boolean, false), e->>'reason', (e->>'liters')::numeric, (e->>'odo')::int, e->>'jobId'
  from jsonb_array_elements(demo->'expenses') e;

  insert into advances (driver_id, requested_on, amount, reason, status)
  select did, (a->>'date')::date, (a->>'amount')::bigint, a->>'reason', a->>'status'
  from jsonb_array_elements(demo->'advances') a;

  insert into certificates (driver_id, name, number, expires_on, icon, color, renewable, sort)
  select did, t.c->>'name', t.c->>'no', (t.c->>'exp')::date, t.c->>'icon', t.c->>'color', coalesce((t.c->>'renew')::boolean, false), t.o
  from jsonb_array_elements(demo->'certs') with ordinality as t(c, o);

  insert into tasks (driver_id, title, due, done, sort)
  select did, t.c->>'title', (t.c->>'due')::date, (t.c->>'done')::boolean, t.o
  from jsonb_array_elements(demo->'tasks') with ordinality as t(c, o);

  insert into lesson_progress (driver_id, course_id, lesson_idx, completed_at)
  select did, p->>'course', (p->>'idx')::smallint, timestamptz '2026-11-01 08:00+07'
  from jsonb_array_elements(demo->'progress') p
  where exists (select 1 from lessons l where l.course_id = p->>'course' and l.idx = (p->>'idx')::smallint);

  insert into requests (driver_id, kind, title, detail, status, created_at)
  select did, r->>'kind', r->>'title', r->>'detail', coalesce(r->>'status', 'new'), coalesce((r->>'created_at')::timestamptz, now())
  from jsonb_array_elements(coalesce(demo->'requests', '[]'::jsonb)) r;

  return did;
end $$;

-- Gọi khi lái xe đăng nhập app: liên kết hồ sơ nhân sự đã tạo (cùng email) hoặc tạo bộ dữ liệu mẫu.
-- force = true: xóa và tạo lại dữ liệu mẫu của chính người gọi.
create or replace function public.seed_demo_data(force boolean default false) returns void
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  did uuid;
  mail text;
  meta_name text;
begin
  if uid is null then raise exception 'Chưa đăng nhập'; end if;
  select u.email, nullif(trim(u.raw_user_meta_data->>'full_name'), '') into mail, meta_name from auth.users u where u.id = uid;
  select id into did from drivers where user_id = uid;
  if did is not null then
    if not force then return; end if;
    delete from drivers where id = did;
  else
    update drivers set user_id = uid
    where id = (select id from drivers where user_id is null and email is not null and lower(email) = lower(mail) order by created_at limit 1)
    returning id into did;
    if did is not null then return; end if;
  end if;
  perform public._seed_driver(uid, public.demo_dataset(), mail, meta_name);
end $$;

-- Tạo 7 lái xe mẫu của đội xe (bỏ qua người đã có)
create or replace function public.seed_fleet() returns int
language plpgsql security definer set search_path = public as $$
declare ds jsonb; n int := 0;
begin
  for ds in select value from jsonb_array_elements(public.demo_fleet()) loop
    if not exists (select 1 from drivers where code = ds#>>'{driver,id}' and user_id is null) then
      perform public._seed_driver(null, ds, null, null);
      n := n + 1;
    end if;
  end loop;
  return n;
end $$;

revoke all on function public.demo_dataset(), public.demo_fleet(), public._seed_driver(uuid, jsonb, text, text), public.seed_fleet()
  from public, anon, authenticated;
revoke all on function public.seed_demo_data(boolean) from public, anon;
grant execute on function public.seed_demo_data(boolean) to authenticated;

select public.seed_fleet();

-- Báo PostgREST nạp lại schema
notify pgrst, 'reload schema';
`;

writeFileSync(join(root, 'seed.sql'), seed);
const schema = readFileSync(join(root, 'schema.sql'), 'utf8');
writeFileSync(join(root, 'setup.sql'), `${schema}\n\n${seed}`);

// reset.sql: xóa sạch mọi đối tượng DriverOS rồi cài lại từ đầu (dùng khi lỡ chạy SQL sai thứ tự / sót bước)
const reset = `-- =====================================================================
-- DriverOS · CÀI LẠI TỪ ĐẦU — XÓA toàn bộ bảng, hàm và dữ liệu DriverOS rồi tạo lại kèm dữ liệu mẫu.
-- Tài khoản đăng nhập (auth.users) được giữ nguyên; lái xe đăng nhập lại sẽ được tạo dữ liệu mẫu mới.
-- Quyền quản trị (bảng staff) cũng bị xóa: cấp lại theo hướng dẫn trong README.
-- =====================================================================
drop table if exists public.vehicle_checks, public.tasks, public.requests, public.certificates, public.lesson_progress,
  public.advances, public.expenses, public.attendance, public.job_checks, public.job_cargo, public.jobs, public.vehicles,
  public.drivers, public.quiz_questions, public.lessons, public.courses, public.staff cascade;
do $$
declare r record;
begin
  for r in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = any (array['seed_demo_data', 'demo_dataset', 'demo_fleet', '_seed_driver', 'seed_fleet',
      'current_driver_id', 'is_staff', 'has_role', 'guard_approval', 'guard_driver_row', 'guard_job_row', 'guard_attendance',
      'stamp_request', 'create_job', 'reassign_job', 'create_driver', 'set_staff_role']) loop
    execute 'drop function if exists ' || r.sig || ' cascade';
  end loop;
end $$;

`;
writeFileSync(join(root, 'reset.sql'), `${reset}${schema}\n\n${seed}`);
console.log(`Đã sinh seed.sql (${demo.jobs.length} chuyến/lái xe, ${fleet.length + 1} bộ dữ liệu, ${demo.courses.length} khóa học) và setup.sql`);
