# 국방전략기술공학과 BlackBoard

한양대학교 ERICA 국방전략기술공학과 학우들을 위한 공지·과제·과목 자료실·공부/운동 기록 사이트입니다.

## 진행 상황

1. **로그인과 역할** ✅
   - 학교 이메일(@hanyang.ac.kr)로만 로그인 (메일로 받은 링크를 누르는 방식, 비밀번호 없음)
   - 역할 3단계: 관리자 / 글쓰기 권한자 / 학우
   - 관리자는 `회원 관리` 화면에서 글쓰기 권한자를 임명
2. **게시판과 과목 자료실** ✅
   - 학교 공지, 학과 공지, 과제(과목·마감일): 글쓰기 권한자만 작성
   - 자유게시판: 누구나 작성
   - 모든 글에 댓글
   - 과목 자료실: 1~4학년 → 과목 → 강의자료 / 과제 / 시험 대비 / 기타. 파일(20MB까지) 또는 구글 드라이브 링크
   - 관리자는 `과목 관리`에서 과목 추가·삭제
   - `내 정보`에서 이름과 학년 입력
3. **공부·운동 기록, 캘린더, 새 공지 알림** ← 지금 단계
   - `내 기록`: 공부 시간과 운동(3km 달리기, 팔굽혀펴기, 윗몸일으키기, 턱걸이, 수영) 기록. 본인만 볼 수 있음
   - `캘린더`: 학사일정·학과행사(글쓰기 권한자가 등록)와 과제 마감일을 한 달 달력으로
   - `알림`: 마지막으로 확인한 뒤 올라온 공지·과제 수를 상단에 표시
   - 홈에 7일 안에 마감되는 과제 목록
4. 배포와 시범 운영

## 기술 구성

- [Next.js](https://nextjs.org) (화면과 서버)
- [Supabase](https://supabase.com) (로그인, 데이터베이스, 파일 저장). 무료 요금제로 200명 규모까지 운영할 수 있어요.

## 처음 설정하기

### 1. Supabase 프로젝트 만들기

1. https://supabase.com 에 가입하고 **New project** 를 만듭니다. 지역은 `Northeast Asia (Seoul)` 을 고릅니다.
2. 왼쪽 메뉴 **SQL Editor** 에서 `supabase/migrations/` 폴더의 파일을 번호 순서대로(0001, 0002, ...) 하나씩 붙여넣고 **Run** 합니다.
3. **Authentication → URL Configuration** 에서
   - Site URL: 사이트 주소 (개발 중에는 `http://localhost:3000`)
   - Redirect URLs: `http://localhost:3000/auth/callback` 와 배포 주소의 `/auth/callback`
4. **Authentication → Emails** 에서 **Confirm signup** 과 **Magic Link** 두 템플릿의 링크를 아래처럼 바꿉니다. 휴대폰 메일 앱처럼 다른 기기에서 링크를 눌러도 로그인됩니다.
   ```html
   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">로그인하기</a>
   ```
5. **Project Settings → API** 에서 `Project URL` 과 `anon public` 키를 복사합니다.

### 2. 내 컴퓨터에서 실행하기

```bash
cp .env.example .env.local   # 복사한 URL과 키를 채워 넣기
npm install
npm run dev                  # http://localhost:3000
```

### 3. 첫 관리자 지정하기

본인 학교 메일로 한 번 로그인한 뒤, Supabase **SQL Editor** 에서 실행합니다.

```sql
update public.profiles set role = 'admin' where email = '본인메일@hanyang.ac.kr';
```

그다음부터는 사이트의 `회원 관리` 화면에서 다른 학우를 임명할 수 있어요.

## 알아둘 점

- Supabase 기본 메일 발송은 시간당 몇 통으로 제한돼 있어요. 학우들이 실제로 쓰기 전(4단계)에 Gmail 같은 SMTP를 연결해야 합니다.
- Supabase 무료 요금제의 파일 저장 공간은 1GB예요. 큰 자료는 구글 드라이브에 올리고 링크로 거는 걸 추천해요.
- 학교 메일만 가입되도록 데이터베이스에서도 한 번 더 막고 있어요 (`handle_new_user` 함수).
