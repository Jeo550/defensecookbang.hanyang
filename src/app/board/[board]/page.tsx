import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, canPost } from "@/lib/auth";
import { BOARDS, isBoard, formatDate } from "@/lib/boards";

type Row = {
  id: number;
  title: string;
  due_at: string | null;
  created_at: string;
  author: { name: string | null; email: string } | null;
  subject: { name: string } | null;
  comments: { count: number }[];
};

export default async function BoardPage({ params }: { params: Promise<{ board: string }> }) {
  const { board } = await params;
  if (!isBoard(board)) notFound();
  const profile = await requireProfile();
  const info = BOARDS[board];

  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(
      "id, title, due_at, created_at, author:profiles(name, email), subject:subjects(name), comments(count)",
    )
    .eq("board", board)
    .order("created_at", { ascending: false })
    .limit(100);
  const posts = (data ?? []) as unknown as Row[];
  const writable = !info.editorsOnly || canPost(profile);

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">{info.label}</h1>
          <p className="mt-1 text-sm text-slate-600">{info.desc}</p>
        </div>
        {writable && (
          <Link
            href={`/board/${board}/new`}
            className="rounded-md bg-navy px-3 py-2 text-sm font-semibold text-white hover:bg-navy-light"
          >
            글쓰기
          </Link>
        )}
      </div>

      <ul className="mt-6 divide-y divide-slate-100 rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        {posts.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-400">아직 글이 없어요</li>}
        {posts.map((p) => (
          <li key={p.id}>
            <Link href={`/posts/${p.id}`} className="block px-4 py-3 hover:bg-slate-50">
              <div className="flex items-center gap-2">
                {p.subject && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{p.subject.name}</span>
                )}
                <span className="font-medium">{p.title}</span>
                {p.comments[0]?.count > 0 && (
                  <span className="text-xs text-navy-light">[{p.comments[0].count}]</span>
                )}
              </div>
              <div className="mt-1 flex gap-3 text-xs text-slate-500">
                <span>{p.author?.name ?? p.author?.email}</span>
                <span>{formatDate(p.created_at)}</span>
                {p.due_at && <span className="font-semibold text-red-600">마감 {formatDate(p.due_at, true)}</span>}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
