-- 2단계: 게시판(학교 공지, 학과 공지, 과제, 자유게시판), 댓글, 학년별 과목 자료실

-- 게시판 ------------------------------------------------------------------

create type public.board as enum ('school_notice', 'dept_notice', 'assignment', 'free');

create table public.subjects (
  id bigint generated always as identity primary key,
  year smallint not null check (year between 1 and 4),
  semester smallint check (semester in (1, 2)),
  name text not null,
  professor text,
  created_at timestamptz not null default now(),
  unique (year, name)
);

create table public.posts (
  id bigint generated always as identity primary key,
  board public.board not null,
  title text not null check (char_length(title) between 1 and 200),
  body text not null default '',
  -- 과제 게시판에서만 쓴다
  due_at timestamptz,
  subject_id bigint references public.subjects (id) on delete set null,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_board_created_idx on public.posts (board, created_at desc);

create table public.comments (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index comments_post_idx on public.comments (post_id, created_at);

alter table public.subjects enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;

-- 과목: 모두 읽고, 관리자만 추가·수정·삭제
create policy "subjects readable" on public.subjects for select to authenticated using (true);
create policy "admins manage subjects" on public.subjects for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 글: 모두 읽고, 자유게시판은 누구나, 나머지는 글쓰기 권한자만 쓴다
create policy "posts readable" on public.posts for select to authenticated using (true);
create policy "posts insert" on public.posts for insert to authenticated
  with check (author_id = auth.uid() and (board = 'free' or public.can_post()));
create policy "posts update own" on public.posts for update to authenticated
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());
create policy "posts delete own" on public.posts for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- 댓글: 모두 읽고 쓰며, 본인 또는 관리자가 지운다
create policy "comments readable" on public.comments for select to authenticated using (true);
create policy "comments insert" on public.comments for insert to authenticated
  with check (author_id = auth.uid());
create policy "comments delete own" on public.comments for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- 과목 자료실 -------------------------------------------------------------

create type public.material_kind as enum ('lecture', 'assignment', 'exam', 'etc');

create table public.materials (
  id bigint generated always as identity primary key,
  subject_id bigint not null references public.subjects (id) on delete cascade,
  kind public.material_kind not null,
  title text not null check (char_length(title) between 1 and 200),
  description text,
  -- 파일을 올리거나(storage) 구글 드라이브 같은 링크를 건다
  file_path text,
  file_name text,
  link_url text,
  -- 몇 학년도 자료인지 (후배들이 최신 자료를 고를 수 있게)
  school_year smallint,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (file_path is not null or link_url is not null)
);

create index materials_subject_idx on public.materials (subject_id, kind, created_at desc);

alter table public.materials enable row level security;

create policy "materials readable" on public.materials for select to authenticated using (true);
create policy "materials insert" on public.materials for insert to authenticated
  with check (author_id = auth.uid() and public.can_post());
create policy "materials delete own" on public.materials for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- 자료 파일 저장소 (비공개, 로그인한 학우만 내려받기)
insert into storage.buckets (id, name, public)
values ('materials', 'materials', false)
on conflict (id) do nothing;

create policy "materials files readable" on storage.objects for select to authenticated
  using (bucket_id = 'materials');
create policy "materials files upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'materials' and public.can_post());
create policy "materials files delete" on storage.objects for delete to authenticated
  using (bucket_id = 'materials' and (owner = auth.uid() or public.is_admin()));
