import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, canPost } from "@/lib/auth";
import { BOARDS, isBoard } from "@/lib/boards";
import { createPost } from "../../actions";

export default async function NewPostPage({ params }: { params: Promise<{ board: string }> }) {
  const { board } = await params;
  if (!isBoard(board)) notFound();
  const profile = await requireProfile();
  const info = BOARDS[board];
  if (info.editorsOnly && !canPost(profile)) redirect(`/board/${board}`);

  let subjects: { id: number; year: number; name: string }[] = [];
  if (board === "assignment") {
    const supabase = await createClient();
    const { data } = await supabase.from("subjects").select("id, year, name").order("year").order("name");
    subjects = data ?? [];
  }

  const input = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-navy focus:outline-none";

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-navy">{info.label} 글쓰기</h1>
      <form action={createPost} className="mt-6 space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <input type="hidden" name="board" value={board} />
        {board === "assignment" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              과목
              <select name="subject_id" className={`mt-1 ${input}`}>
                <option value="">선택 안 함</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.year}학년 · {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              마감일시
              <input type="datetime-local" name="due_at" className={`mt-1 ${input}`} />
            </label>
          </div>
        )}
        <label className="block text-sm">
          제목
          <input name="title" required maxLength={200} className={`mt-1 ${input}`} />
        </label>
        <label className="block text-sm">
          내용
          <textarea name="body" rows={12} className={`mt-1 ${input}`} />
        </label>
        <button className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
          올리기
        </button>
      </form>
    </div>
  );
}
