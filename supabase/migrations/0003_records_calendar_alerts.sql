-- 3단계: 공부·운동 기록, 캘린더, 새 공지 알림

-- 공부 기록 (본인만 볼 수 있음) --------------------------------------------

create table public.study_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  log_date date not null default (now() at time zone 'Asia/Seoul')::date,
  minutes integer not null check (minutes between 1 and 1440),
  subject text check (char_length(subject) <= 100),
  memo text check (char_length(memo) <= 500),
  created_at timestamptz not null default now()
);

create index study_logs_user_date_idx on public.study_logs (user_id, log_date desc);

-- 운동 기록 (본인만 볼 수 있음) --------------------------------------------

create type public.exercise_kind as enum ('run_3km', 'pushup', 'situp', 'pullup', 'swim', 'etc');

create table public.exercise_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  log_date date not null default (now() at time zone 'Asia/Seoul')::date,
  kind public.exercise_kind not null,
  -- 달리기는 초, 수영은 m, 나머지는 회
  value numeric not null check (value > 0),
  memo text check (char_length(memo) <= 500),
  created_at timestamptz not null default now()
);

create index exercise_logs_user_date_idx on public.exercise_logs (user_id, log_date desc);

alter table public.study_logs enable row level security;
alter table public.exercise_logs enable row level security;

create policy "own study logs" on public.study_logs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own exercise logs" on public.exercise_logs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 캘린더 일정 ---------------------------------------------------------------

create type public.event_kind as enum ('academic', 'dept', 'etc');

create table public.events (
  id bigint generated always as identity primary key,
  title text not null check (char_length(title) between 1 and 200),
  kind public.event_kind not null default 'academic',
  start_date date not null,
  end_date date not null,
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index events_dates_idx on public.events (start_date, end_date);

alter table public.events enable row level security;

create policy "events readable" on public.events for select to authenticated using (true);
create policy "editors manage events" on public.events for all to authenticated
  using (public.can_post()) with check (public.can_post());

-- 새 공지 알림: 마지막으로 알림을 확인한 시각 이후의 공지·과제를 새 글로 본다 ----

alter table public.profiles
  add column notices_seen_at timestamptz not null default now();
