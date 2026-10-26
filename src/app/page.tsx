import { requireProfile, ROLE_LABELS, canPost } from "@/lib/auth";

const SECTIONS = [
  { title: "공지사항", desc: "학교·학과 공지" },
  { title: "과제", desc: "과목별 과제와 마감일" },
  { title: "과목 자료실", desc: "1~4학년 과목별 자료" },
  { title: "자유게시판", desc: "질문과 이야기" },
  { title: "공부·운동 기록", desc: "나의 학습과 체력 관리" },
  { title: "캘린더", desc: "학사일정과 과제 마감" },
];

export default async function Home() {
  const profile = await requireProfile();

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">
        {profile.name ?? "학우"}님, 오늘도 힘차게!
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        내 역할: {ROLE_LABELS[profile.role]}
        {canPost(profile) && " · 공지와 과제를 올릴 수 있어요"}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <div key={s.title} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="font-semibold text-navy">{s.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{s.desc}</p>
            <p className="mt-3 text-xs text-slate-400">준비 중</p>
          </div>
        ))}
      </div>
    </div>
  );
}
