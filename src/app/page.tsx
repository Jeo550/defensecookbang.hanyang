import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, ROLE_LABELS, canPost } from "@/lib/auth";
import { formatDate } from "@/lib/boards";

const SECTIONS = [
  { title: "학교 공지", desc: "한양대 ERICA 공지사항", href: "/board/school_notice" },
  { title: "학과 공지", desc: "국방전략기술공학과 공지사항", href: "/board/dept_notice" },
  { title: "과제", desc: "과목별 과제와 마감일", href: "/board/assignment" },
  { title: "과목 자료실", desc: "1~4학년 과목별 자료", href: "/subjects" },
  { title: "자유게시판", desc: "질문과 이야기", href: "/board/free" },
  { title: "캘린더", desc: "학사일정과 과제 마감", href: "/calendar" },
  { title: "공부·운동 기록", desc: "나의 학습과 체력 관리", href: "/records" },
];

export default async function Home() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const now = new Date();
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const { data } = await supabase
    .from("posts")
    .select("id, title, due_at, subject:subjects(name)")
    .eq("board", "assignment")
    .gte("due_at", now.toISOString())
    .lte("due_at", weekLater.toISOString())
    .order("due_at");
  const deadlines = (data ?? []) as unknown as {
    id: number;
    title: string;
    due_at: string;
    subject: { name: string } | null;
  }[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">{profile.name ?? "학우"}님, 오늘도 힘차게!</h1>
      <p className="mt-1 text-sm text-slate-600">
        내 역할: {ROLE_LABELS[profile.role]}
        {canPost(profile) && " · 공지와 과제를 올릴 수 있어요"}
        {!profile.name && (
          <>
            {" · "}
            <Link href="/me" className="text-navy-light underline">
              이름을 등록해 주세요
            </Link>
          </>
        )}
      </p>

      <section className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-semibold text-navy">7일 안에 마감되는 과제</h2>
        {deadlines.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">다가오는 마감이 없어요</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {deadlines.map((d) => (
              <li key={d.id}>
                <Link href={`/posts/${d.id}`} className="flex gap-2 hover:underline">
                  <span className="font-semibold text-red-600">{formatDate(d.due_at, true)}</span>
                  {d.subject && <span className="text-slate-500">{d.subject.name}</span>}
                  <span>{d.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link
            key={s.title}
            href={s.href}
            className="block rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 hover:ring-navy"
          >
            <h2 className="font-semibold text-navy">{s.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
