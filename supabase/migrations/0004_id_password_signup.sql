-- 4단계: 아이디·비밀번호로 누구나 가입하고, 관리자가 승인해야 사이트를 쓸 수 있다.

alter table public.profiles
  add column username text unique,
  add column approved boolean not null default false;

-- 이미 가입한 사람(지금까지는 학교 메일 확인을 거쳤다)은 승인된 것으로 둔다.
update public.profiles set approved = true;

create or replace function public.is_approved()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select approved from public.profiles where id = auth.uid()), false)
$$;

-- 승인 전에는 역할이 없는 것처럼 다룬다. is_admin(), can_post()도 함께 막힌다.
create or replace function public.my_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and approved
$$;

-- 승인 전에는 본인 프로필만 볼 수 있다 (승인 대기 화면용).
drop policy "profiles are readable by members" on public.profiles;
create policy "profiles are readable by members"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_approved());

-- 승인 여부도 관리자만 바꿀 수 있다.
create or replace function public.guard_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid()가 없으면 SQL 편집기 같은 직접 접속이다 (첫 관리자 지정용).
  if auth.uid() is not null and not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception '역할은 관리자만 바꿀 수 있습니다';
    end if;
    if new.approved is distinct from old.approved then
      raise exception '가입 승인은 관리자만 할 수 있습니다';
    end if;
  end if;
  return new;
end;
$$;

-- 가입하면 승인 대기 상태의 프로필을 만든다. 학교 메일 제한은 없앴다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  year_text text := new.raw_user_meta_data ->> 'student_year';
begin
  insert into public.profiles (id, email, username, name, student_year)
  values (
    new.id,
    lower(new.email),
    nullif(lower(new.raw_user_meta_data ->> 'username'), ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    case when year_text ~ '^[1-4]$' then year_text::smallint end
  );
  return new;
end;
$$;

-- 관리자가 가입 신청을 거절하면 계정을 지운다 (프로필은 cascade로 함께 지워진다).
-- 승인된 회원은 글과 자료가 함께 지워질 수 있어 여기서는 지우지 않는다.
create or replace function public.reject_signup(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception '관리자만 회원을 삭제할 수 있습니다';
  end if;
  if not exists (select 1 from public.profiles where id = target and not approved) then
    raise exception '승인 대기 중인 가입 신청만 거절할 수 있습니다';
  end if;
  delete from auth.users where id = target;
end;
$$;

revoke execute on function public.reject_signup(uuid) from public, anon;
grant execute on function public.reject_signup(uuid) to authenticated;

-- 승인된 사람만 게시판·자료·일정을 보고 댓글을 달 수 있다.
drop policy "subjects readable" on public.subjects;
create policy "subjects readable" on public.subjects for select to authenticated using (public.is_approved());

drop policy "posts readable" on public.posts;
create policy "posts readable" on public.posts for select to authenticated using (public.is_approved());
drop policy "posts insert" on public.posts;
create policy "posts insert" on public.posts for insert to authenticated
  with check (author_id = auth.uid() and ((board = 'free' and public.is_approved()) or public.can_post()));

drop policy "comments readable" on public.comments;
create policy "comments readable" on public.comments for select to authenticated using (public.is_approved());
drop policy "comments insert" on public.comments;
create policy "comments insert" on public.comments for insert to authenticated
  with check (author_id = auth.uid() and public.is_approved());

drop policy "materials readable" on public.materials;
create policy "materials readable" on public.materials for select to authenticated using (public.is_approved());

drop policy "materials files readable" on storage.objects;
create policy "materials files readable" on storage.objects for select to authenticated
  using (bucket_id = 'materials' and public.is_approved());

drop policy "events readable" on public.events;
create policy "events readable" on public.events for select to authenticated using (public.is_approved());

drop policy "own study logs" on public.study_logs;
create policy "own study logs" on public.study_logs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_approved());
drop policy "own exercise logs" on public.exercise_logs;
create policy "own exercise logs" on public.exercise_logs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_approved());
