-- =====================================================================
-- DriverOS · Supabase schema (v2: app lái xe + app quản trị)
-- Chạy file setup.sql (= schema.sql + seed.sql) trong Supabase → SQL Editor.
-- Chạy lại được nhiều lần; nâng cấp tại chỗ từ v1, giữ nguyên dữ liệu đang có.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Nhân viên back-office và vai trò
--   admin: toàn quyền · dispatcher: điều phối chuyến · accountant: duyệt chi phí · hr: hồ sơ, chấm công, đào tạo
-- ---------------------------------------------------------------------
create table if not exists public.staff (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  role        text not null check (role in ('admin', 'dispatcher', 'accountant', 'hr')),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Danh mục khóa học dùng chung
-- ---------------------------------------------------------------------
create table if not exists public.courses (
  id          text primary key,
  title       text not null,
  required    boolean not null default false,
  due         date,
  color       text not null default 'var(--blue)',
  icon        text not null default 'book',
  sort        int  not null default 0
);

create table if not exists public.lessons (
  course_id   text not null references public.courses(id) on delete cascade,
  idx         smallint not null,
  title       text not null,
  type        text not null check (type in ('video', 'read', 'quiz')),
  minutes     int  not null default 0,
  primary key (course_id, idx)
);

create table if not exists public.quiz_questions (
  course_id   text not null references public.courses(id) on delete cascade,
  idx         smallint not null,
  question    text not null,
  options     text[] not null,
  answer      smallint not null,
  primary key (course_id, idx)
);

-- ---------------------------------------------------------------------
-- Lái xe: hồ sơ do nhân sự quản lý, liên kết với tài khoản đăng nhập qua user_id
-- ---------------------------------------------------------------------
create table if not exists public.drivers (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid unique references auth.users(id) on delete set null,
  email               text,
  code                text not null,
  full_name           text not null,
  phone               text,
  team                text,
  since               text,
  dob                 date,
  rating              numeric(2, 1) not null default 5,
  trips_year          int not null default 0,
  km_safe             int not null default 0,
  incidents           int not null default 0,
  leave_left          int not null default 0,
  company             text,
  dispatcher_name     text,
  dispatcher_phone    text,
  hse_name            text,
  hse_phone           text,
  learn_minutes_month int not null default 0,
  active              boolean not null default true,
  created_at          timestamptz not null default now()
);
-- nâng cấp từ v1 (khi đó drivers.id = auth.users.id)
alter table public.drivers add column if not exists user_id uuid;
alter table public.drivers add column if not exists active boolean not null default true;
alter table public.drivers drop constraint if exists drivers_id_fkey;
alter table public.drivers alter column id set default gen_random_uuid();
update public.drivers d set user_id = d.id
  where d.user_id is null and exists (select 1 from auth.users u where u.id = d.id)
    and not exists (select 1 from public.drivers x where x.user_id = d.id);
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'drivers_user_id_fkey') then
    alter table public.drivers add constraint drivers_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'drivers_user_id_key') then
    alter table public.drivers add constraint drivers_user_id_key unique (user_id);
  end if;
end $$;

create table if not exists public.vehicles (
  id                uuid primary key default gen_random_uuid(),
  driver_id         uuid not null references public.drivers(id) on delete cascade,
  plate             text not null,
  model             text,
  compartments      int[] not null default '{}',
  registry_exp      date,
  tank_inspect_exp  date,
  odo               int not null default 0,
  next_service_km   int not null default 0
);

create table if not exists public.jobs (
  id              uuid primary key default gen_random_uuid(),
  driver_id       uuid not null references public.drivers(id) on delete cascade,
  code            text not null,
  job_date        date not null,
  status          smallint not null default 0 check (status between 0 and 5),
  vehicle         text,
  kind            text not null default 'bulk' check (kind in ('bulk', 'drum')),
  from_name       text not null,
  from_addr       text,
  from_time       time,
  to_name         text not null,
  to_addr         text,
  to_eta          time,
  to_who          text,
  to_phone        text,
  km              int not null default 0,
  fee             int not null default 0,
  seal            text,
  note            text,
  late_min        int not null default 0,
  rejected_reason text,
  rejected_note   text,
  confirm_by      text,
  deviation_note  text,
  created_by      uuid,
  created_at      timestamptz not null default now(),
  unique (driver_id, code)
);
alter table public.jobs add column if not exists created_by uuid;
alter table public.jobs add column if not exists created_at timestamptz not null default now();

create table if not exists public.job_cargo (
  job_id     uuid not null references public.jobs(id) on delete cascade,
  idx        smallint not null,
  label      text not null,
  item       text not null,
  qty        int not null check (qty >= 0),
  unit       text not null check (unit in ('L', 'thùng')),
  loaded     int,
  delivered  int,
  primary key (job_id, idx)
);

create table if not exists public.job_checks (
  job_id  uuid not null references public.jobs(id) on delete cascade,
  idx     smallint not null,
  title   text not null,
  phase   text not null check (phase in ('pickup', 'deliver')),
  done    boolean not null default false,
  sign    boolean not null default false,
  primary key (job_id, idx)
);

create table if not exists public.attendance (
  driver_id     uuid not null references public.drivers(id) on delete cascade,
  work_date     date not null,
  check_in      time,
  check_out     time,
  note          text,
  explain       text,
  explain_text  text,
  reviewed_by   uuid,
  primary key (driver_id, work_date)
);
alter table public.attendance add column if not exists reviewed_by uuid;
alter table public.attendance drop constraint if exists attendance_explain_check;
alter table public.attendance add constraint attendance_explain_check check (explain in ('pending', 'approved', 'rejected'));

create table if not exists public.expenses (
  id             uuid primary key default gen_random_uuid(),
  driver_id      uuid not null references public.drivers(id) on delete cascade,
  spent_on       date not null,
  spent_time     time,
  category       text not null check (category in ('fuel', 'food', 'toll', 'parking', 'repair', 'other')),
  title          text not null,
  place          text,
  amount         bigint not null check (amount > 0),
  status         text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  receipt        boolean not null default false,
  vat            boolean not null default false,
  reject_reason  text,
  liters         numeric(8, 2),
  odo            int,
  job_code       text,
  over_note      text,
  reviewed_by    uuid,
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now()
);
alter table public.expenses add column if not exists reviewed_by uuid;
alter table public.expenses add column if not exists reviewed_at timestamptz;

create table if not exists public.advances (
  id            uuid primary key default gen_random_uuid(),
  driver_id     uuid not null references public.drivers(id) on delete cascade,
  requested_on  date not null,
  amount        bigint not null check (amount > 0),
  reason        text,
  status        text not null default 'pending' check (status in ('pending', 'paid')),
  reviewed_by   uuid,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now()
);
alter table public.advances add column if not exists reviewed_by uuid;
alter table public.advances add column if not exists reviewed_at timestamptz;

create table if not exists public.lesson_progress (
  driver_id     uuid not null references public.drivers(id) on delete cascade,
  course_id     text not null,
  lesson_idx    smallint not null,
  completed_at  timestamptz not null default now(),
  primary key (driver_id, course_id, lesson_idx),
  foreign key (course_id, lesson_idx) references public.lessons(course_id, idx) on delete cascade
);

create table if not exists public.certificates (
  id          uuid primary key default gen_random_uuid(),
  driver_id   uuid not null references public.drivers(id) on delete cascade,
  name        text not null,
  number      text,
  expires_on  date not null,
  icon        text not null default 'id',
  color       text not null default 'var(--blue)',
  renewable   boolean not null default false,
  sort        int not null default 0
);

create table if not exists public.requests (
  id          uuid primary key default gen_random_uuid(),
  driver_id   uuid not null references public.drivers(id) on delete cascade,
  kind        text not null check (kind in ('incident', 'leave', 'complaint', 'renew', 'sos')),
  title       text not null,
  detail      text,
  status      text not null default 'new',
  response    text,
  handled_by  uuid,
  handled_at  timestamptz,
  created_at  timestamptz not null default now()
);
alter table public.requests add column if not exists status text not null default 'new';
alter table public.requests add column if not exists response text;
alter table public.requests add column if not exists handled_by uuid;
alter table public.requests add column if not exists handled_at timestamptz;
alter table public.requests drop constraint if exists requests_status_check;
alter table public.requests add constraint requests_status_check check (status in ('new', 'processing', 'done', 'rejected'));

create table if not exists public.tasks (
  id         uuid primary key default gen_random_uuid(),
  driver_id  uuid not null references public.drivers(id) on delete cascade,
  title      text not null,
  due        date,
  done       boolean not null default false,
  sort       int not null default 0
);

create table if not exists public.vehicle_checks (
  driver_id   uuid not null references public.drivers(id) on delete cascade,
  check_date  date not null,
  items       boolean[] not null default '{}',
  updated_at  timestamptz not null default now(),
  primary key (driver_id, check_date)
);

create index if not exists jobs_driver_date_idx on public.jobs (driver_id, job_date);
create index if not exists jobs_date_idx on public.jobs (job_date);
create index if not exists expenses_driver_idx on public.expenses (driver_id, spent_on);
create index if not exists expenses_status_idx on public.expenses (status);
create index if not exists requests_status_idx on public.requests (status, created_at);
create index if not exists certificates_exp_idx on public.certificates (expires_on);

-- ---------------------------------------------------------------------
-- Hàm phân quyền (security definer để dùng được trong policy mà không đệ quy RLS)
-- ---------------------------------------------------------------------
create or replace function public.current_driver_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.drivers where user_id = auth.uid() limit 1
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff where user_id = auth.uid())
$$;

-- Có một trong các vai trò được liệt kê; admin luôn đúng
create or replace function public.has_role(variadic roles text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff s where s.user_id = auth.uid() and (s.role = 'admin' or s.role = any(roles)))
$$;

revoke all on function public.current_driver_id(), public.is_staff(), public.has_role(text[]) from public, anon;
grant execute on function public.current_driver_id(), public.is_staff(), public.has_role(text[]) to authenticated;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
do $$
declare r record; t text;
begin
  -- xóa toàn bộ policy cũ (v1/v2) rồi tạo lại
  for r in select tablename, policyname from pg_policies where schemaname = 'public' and tablename = any (array[
    'staff', 'courses', 'lessons', 'quiz_questions', 'drivers', 'vehicles', 'jobs', 'job_cargo', 'job_checks', 'attendance',
    'expenses', 'advances', 'lesson_progress', 'certificates', 'requests', 'tasks', 'vehicle_checks']) loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
  foreach t in array array[
    'staff', 'courses', 'lessons', 'quiz_questions', 'drivers', 'vehicles', 'jobs', 'job_cargo', 'job_checks', 'attendance',
    'expenses', 'advances', 'lesson_progress', 'certificates', 'requests', 'tasks', 'vehicle_checks'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- staff
create policy staff_read on public.staff for select to authenticated using (user_id = (select auth.uid()) or (select public.is_staff()));
create policy staff_write on public.staff for all to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));

-- danh mục đào tạo: ai đăng nhập cũng đọc, nhân sự sửa
create policy catalog_read on public.courses for select to authenticated using (true);
create policy catalog_read on public.lessons for select to authenticated using (true);
create policy catalog_read on public.quiz_questions for select to authenticated using (true);
create policy catalog_write on public.courses for all to authenticated using ((select public.has_role('hr'))) with check ((select public.has_role('hr')));
create policy catalog_write on public.lessons for all to authenticated using ((select public.has_role('hr'))) with check ((select public.has_role('hr')));
create policy catalog_write on public.quiz_questions for all to authenticated using ((select public.has_role('hr'))) with check ((select public.has_role('hr')));

-- drivers
create policy drivers_read on public.drivers for select to authenticated using (user_id = (select auth.uid()) or (select public.is_staff()));
create policy drivers_update on public.drivers for update to authenticated
  using (user_id = (select auth.uid()) or (select public.has_role('hr'))) with check (user_id = (select auth.uid()) or (select public.has_role('hr')));
create policy drivers_insert on public.drivers for insert to authenticated with check ((select public.has_role('hr')));
create policy drivers_delete on public.drivers for delete to authenticated using ((select public.has_role('hr')));

-- bảng có driver_id: lái xe thấy dữ liệu của mình, nhân viên thấy tất cả; quyền ghi theo vai trò
do $$
declare
  own constant text := 'driver_id = (select public.current_driver_id())';
  staff constant text := '(select public.is_staff())';
  spec text[] := array[
    -- bảng            | lái xe được (insert/update/delete) | vai trò back-office được ghi
    'vehicles|-|hr',
    'jobs|update|dispatcher',
    'attendance|insert,update|hr',
    'expenses|insert,update|accountant',
    'advances|insert|accountant',
    'lesson_progress|insert,update,delete|hr',
    'certificates|-|hr',
    'requests|insert|dispatcher,accountant,hr',
    'tasks|update|hr,dispatcher',
    'vehicle_checks|insert,update|hr'
  ];
  s text; p text[]; t text; cmd text; roles text; cond text;
begin
  foreach s in array spec loop
    p := string_to_array(s, '|');
    t := p[1];
    roles := (select string_agg(quote_literal(x), ', ') from unnest(string_to_array(p[3], ',')) x);
    execute format('create policy %I on public.%I for select to authenticated using (%s or %s)', t || '_read', t, own, staff);
    foreach cmd in array array['insert', 'update', 'delete'] loop
      cond := case when cmd = any (string_to_array(p[2], ',')) then own || ' or ' else '' end
              || format('(select public.has_role(%s))', roles);
      execute format('create policy %I on public.%I for %s to authenticated %s', t || '_' || cmd, t, cmd,
        case cmd when 'insert' then format('with check (%s)', cond)
                 when 'update' then format('using (%1$s) with check (%1$s)', cond)
                 else format('using (%s)', cond) end);
    end loop;
  end loop;
end $$;

-- lái xe chỉ được xóa khoản chi đang chờ duyệt của mình
drop policy if exists expenses_delete on public.expenses;
create policy expenses_delete on public.expenses for delete to authenticated
  using ((driver_id = (select public.current_driver_id()) and status = 'pending') or (select public.has_role('accountant')));

-- bảng con của jobs: theo quyền của chuyến cha
do $$
declare t text;
begin
  foreach t in array array['job_cargo', 'job_checks'] loop
    execute format($p$create policy %1$I on public.%2$I for select to authenticated using (
      (select public.is_staff()) or exists (select 1 from public.jobs j where j.id = job_id and j.driver_id = (select public.current_driver_id())))$p$, t || '_read', t);
    execute format($p$create policy %1$I on public.%2$I for insert to authenticated with check (
      (select public.has_role('dispatcher')) or exists (select 1 from public.jobs j where j.id = job_id and j.driver_id = (select public.current_driver_id())))$p$, t || '_insert', t);
    execute format($p$create policy %1$I on public.%2$I for update to authenticated using (
      (select public.has_role('dispatcher')) or exists (select 1 from public.jobs j where j.id = job_id and j.driver_id = (select public.current_driver_id())))$p$, t || '_update', t);
    execute format($p$create policy %1$I on public.%2$I for delete to authenticated using ((select public.has_role('dispatcher')))$p$, t || '_delete', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Trigger bảo vệ: lái xe chỉ sửa được những cột thuộc phần việc của mình
-- (hàm seed chạy với quyền chủ sở hữu nên current_user <> 'authenticated')
-- ---------------------------------------------------------------------
create or replace function public.guard_approval() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user = 'authenticated' then
    if public.has_role('accountant') then
      if tg_op = 'UPDATE' and new.status is distinct from old.status then
        new.reviewed_by := auth.uid(); new.reviewed_at := now();
      end if;
    else
      if tg_op = 'INSERT' and new.status <> 'pending' then raise exception 'Khoản mới phải ở trạng thái chờ duyệt'; end if;
      if tg_op = 'UPDATE' and (new.status is distinct from old.status or new.reviewed_by is distinct from old.reviewed_by) then
        raise exception 'Lái xe không được đổi trạng thái duyệt';
      end if;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists guard_expense_status on public.expenses;
create trigger guard_expense_status before insert or update on public.expenses for each row execute function public.guard_approval();
drop trigger if exists guard_advance_status on public.advances;
create trigger guard_advance_status before insert or update on public.advances for each row execute function public.guard_approval();

create or replace function public.guard_driver_row() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user = 'authenticated' and not public.has_role('hr')
     and (to_jsonb(new) - 'phone' - 'learn_minutes_month') <> (to_jsonb(old) - 'phone' - 'learn_minutes_month') then
    raise exception 'Lái xe chỉ được sửa số điện thoại';
  end if;
  return new;
end $$;
drop trigger if exists guard_driver_row on public.drivers;
create trigger guard_driver_row before update on public.drivers for each row execute function public.guard_driver_row();

create or replace function public.guard_job_row() returns trigger
language plpgsql set search_path = public as $$
declare keep text[] := array['status', 'seal', 'rejected_reason', 'rejected_note', 'confirm_by', 'deviation_note'];
begin
  if current_user = 'authenticated' and not public.has_role('dispatcher')
     and (to_jsonb(new) - keep) <> (to_jsonb(old) - keep) then
    raise exception 'Lái xe không được sửa thông tin lệnh chuyến';
  end if;
  return new;
end $$;
drop trigger if exists guard_job_row on public.jobs;
create trigger guard_job_row before update on public.jobs for each row execute function public.guard_job_row();

create or replace function public.guard_attendance() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user = 'authenticated' then
    if public.has_role('hr') then
      if tg_op = 'INSERT' or new.explain is distinct from old.explain then new.reviewed_by := auth.uid(); end if;
    elsif new.explain in ('approved', 'rejected')
          and (tg_op = 'INSERT' or new.explain is distinct from old.explain) then
      raise exception 'Lái xe không tự duyệt giải trình';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists guard_attendance on public.attendance;
create trigger guard_attendance before insert or update on public.attendance for each row execute function public.guard_attendance();

create or replace function public.stamp_request() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.status is distinct from old.status then new.handled_by := auth.uid(); new.handled_at := now(); end if;
  return new;
end $$;
drop trigger if exists stamp_request on public.requests;
create trigger stamp_request before update on public.requests for each row execute function public.stamp_request();

-- ---------------------------------------------------------------------
-- RPC cho app quản trị (chạy với quyền người gọi → RLS vẫn áp dụng)
-- ---------------------------------------------------------------------
-- Tạo lệnh chuyến kèm hàng hóa và checklist trong một giao dịch; chặn nếu lái xe có giấy tờ hết hạn
create or replace function public.create_job(payload jsonb) returns jsonb
language plpgsql set search_path = public as $$
declare
  jid uuid; d date := (payload->>'job_date')::date; did uuid := (payload->>'driver_id')::uuid;
  expired text; prefix text; n int; new_code text;
begin
  if not public.has_role('dispatcher') then raise exception 'Chỉ điều phối viên được tạo lệnh chuyến'; end if;
  select string_agg(name || ' (' || to_char(expires_on, 'DD/MM/YYYY') || ')', ', ') into expired
    from public.certificates where driver_id = did and expires_on < d;
  if expired is not null then raise exception 'Lái xe có giấy tờ hết hạn vào ngày chạy: %', expired; end if;

  prefix := 'CH-' || to_char(d, 'YYMM') || '-';
  select coalesce(max(substring(code from '(\d+)$')::int), 0) + 1 into n from public.jobs where code like prefix || '%';
  new_code := prefix || lpad(n::text, 4, '0');

  insert into public.jobs (driver_id, code, job_date, status, vehicle, kind, from_name, from_addr, from_time, to_name, to_addr, to_eta,
                           to_who, to_phone, km, fee, note, created_by)
  values (did, new_code, d, 0, payload->>'vehicle', coalesce(payload->>'kind', 'bulk'), payload->>'from_name', payload->>'from_addr',
          (payload->>'from_time')::time, payload->>'to_name', payload->>'to_addr', (payload->>'to_eta')::time,
          payload->>'to_who', payload->>'to_phone', coalesce((payload->>'km')::int, 0), coalesce((payload->>'fee')::int, 0),
          nullif(payload->>'note', ''), auth.uid())
  returning id into jid;

  insert into public.job_cargo (job_id, idx, label, item, qty, unit)
  select jid, (t.o - 1)::smallint, t.c->>'label', t.c->>'item', (t.c->>'qty')::int, t.c->>'unit'
  from jsonb_array_elements(payload->'cargo') with ordinality as t(c, o);

  insert into public.job_checks (job_id, idx, title, phase, sign)
  select jid, (t.o - 1)::smallint, t.c->>'title', t.c->>'phase', coalesce((t.c->>'sign')::boolean, false)
  from jsonb_array_elements(payload->'checks') with ordinality as t(c, o);

  return jsonb_build_object('id', jid, 'code', new_code);
end $$;

-- Phân công lại chuyến chưa bắt đầu (vd sau khi lái xe từ chối)
create or replace function public.reassign_job(p_job uuid, p_driver uuid) returns void
language plpgsql set search_path = public as $$
declare d date; expired text;
begin
  if not public.has_role('dispatcher') then raise exception 'Chỉ điều phối viên được phân công'; end if;
  select job_date into d from public.jobs where id = p_job;
  select string_agg(name, ', ') into expired from public.certificates where driver_id = p_driver and expires_on < d;
  if expired is not null then raise exception 'Lái xe có giấy tờ hết hạn: %', expired; end if;
  update public.jobs set driver_id = p_driver, status = 0, rejected_reason = null, rejected_note = null,
         vehicle = coalesce((select plate from public.vehicles where driver_id = p_driver limit 1), vehicle)
  where id = p_job and status <= 1;
  if not found then raise exception 'Chỉ phân công lại được chuyến chưa bắt đầu'; end if;
end $$;

-- Nhân sự tạo hồ sơ lái xe + xe; khi lái xe đăng ký đúng email sẽ tự liên kết
create or replace function public.create_driver(payload jsonb) returns uuid
language plpgsql set search_path = public as $$
declare did uuid;
begin
  if not public.has_role('hr') then raise exception 'Chỉ nhân sự được tạo hồ sơ lái xe'; end if;
  insert into public.drivers (email, code, full_name, phone, team, since, company, dispatcher_name, dispatcher_phone,
                              hse_name, hse_phone, leave_left)
  values (lower(nullif(trim(payload->>'email'), '')), payload->>'code', payload->>'full_name', payload->>'phone', payload->>'team',
          payload->>'since', payload->>'company', payload->>'dispatcher_name', payload->>'dispatcher_phone',
          'Phòng An toàn HSE', payload->>'hse_phone', coalesce((payload->>'leave_left')::int, 12))
  returning id into did;
  if coalesce(payload->>'plate', '') <> '' then
    insert into public.vehicles (driver_id, plate, model, compartments, odo, next_service_km)
    values (did, payload->>'plate', payload->>'model',
            coalesce(array(select x::int from jsonb_array_elements_text(payload->'compartments') x), '{}'),
            coalesce((payload->>'odo')::int, 0), coalesce((payload->>'next_service_km')::int, 0));
  end if;
  return did;
end $$;

-- Quản trị viên cấp / đổi / gỡ vai trò cho một tài khoản đã đăng ký
create or replace function public.set_staff_role(p_email text, p_role text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid; nm text;
begin
  if not public.has_role('admin') then raise exception 'Chỉ quản trị viên được phân quyền'; end if;
  select id, coalesce(raw_user_meta_data->>'full_name', email) into uid, nm from auth.users where lower(email) = lower(trim(p_email));
  if uid is null then raise exception 'Chưa có tài khoản với email %. Người đó cần đăng ký trước.', p_email; end if;
  if p_role is null then
    if uid = auth.uid() then raise exception 'Không thể tự gỡ quyền của mình'; end if;
    delete from public.staff where user_id = uid;
  else
    insert into public.staff (user_id, full_name, email, role) values (uid, nm, lower(trim(p_email)), p_role)
    on conflict (user_id) do update set role = excluded.role;
  end if;
end $$;

revoke all on function public.create_job(jsonb), public.reassign_job(uuid, uuid), public.create_driver(jsonb), public.set_staff_role(text, text) from public, anon;
grant execute on function public.create_job(jsonb), public.reassign_job(uuid, uuid), public.create_driver(jsonb), public.set_staff_role(text, text) to authenticated;

-- ---------------------------------------------------------------------
-- Realtime cho bảng điều hành (bỏ qua nếu publication không tồn tại)
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['jobs', 'requests', 'expenses', 'attendance'] loop
      begin
        execute format('alter publication supabase_realtime add table public.%I', t);
      exception when duplicate_object then null;
      end;
    end loop;
  end if;
end $$;
