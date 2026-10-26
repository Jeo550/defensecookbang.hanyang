-- 1단계: 회원 정보와 역할(관리자 / 글쓰기 권한자 / 학우)

create type public.user_role as enum ('admin', 'editor', 'member');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text,
  student_year smallint check (student_year between 1 and 4),
  role public.user_role not null default 'member',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 현재 로그인한 사람의 역할. RLS 정책에서 재귀 없이 쓰려고 security definer로 둔다.
create or replace function public.my_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(public.my_role() = 'admin', false)
$$;

create or replace function public.can_post()
returns boolean
language sql
stable
as $$
  select coalesce(public.my_role() in ('admin', 'editor'), false)
$$;

-- 로그인한 학우는 서로의 이름과 역할을 볼 수 있다.
create policy "profiles are readable by members"
  on public.profiles for select
  to authenticated
  using (true);

-- 본인은 이름과 학년만 바꿀 수 있다 (역할은 아래 트리거가 막는다).
create policy "users update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- 관리자는 누구의 프로필이든 바꿀 수 있다 (역할 임명 포함).
create policy "admins update any profile"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 관리자가 아니면 역할을 바꿀 수 없다.
create or replace function public.guard_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid()가 없으면 SQL 편집기 같은 직접 접속이다 (첫 관리자 지정용).
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception '역할은 관리자만 바꿀 수 있습니다';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_role_change();

-- 가입하면 프로필을 만든다. 학교 메일(@hanyang.ac.kr)이 아니면 가입을 막는다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null or lower(new.email) not like '%@hanyang.ac.kr' then
    raise exception '한양대학교 이메일(@hanyang.ac.kr)로만 가입할 수 있습니다';
  end if;

  insert into public.profiles (id, email, name)
  values (new.id, lower(new.email), new.raw_user_meta_data ->> 'name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
