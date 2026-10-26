import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { BOARDS, formatDate, type Board } from "@/lib/boards";
import { addComment, deleteComment, deletePost } from "@/app/board/actions";

type Author = { name: string | null; email: string } | null;

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("*, author:profiles(name, email), subject:subjects(name, year)")
    .eq("id", Number(id))
    .single();
  if (!post) notFound();

  const { data: commentRows } = await supabase
    .from("comments")
    .select("id, body, created_at, author_id, author:profiles(name, email)")
    .eq("post_id", post.id)
    .order("created_at");
  const comments = (commentRows ?? []) as unknown as {
    id: number;
    body: string;
    created_at: string;
    author_id: string;
    author: Author;
  }[];

  const board = post.board as Board;
  const author = post.author as Author;
  const canManage = post.author_id === profile.id || profile.role === "admin";

  return (
    <div className="max-w-3xl">
      <Link href={`/board/${board}`} className="text-sm text-navy-light hover:underline">
        ← {BOARDS[board].label}
      </Link>

      <article className="mt-3 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-bold">{post.title}</h1>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
          <span>{author?.name ?? author?.email}</span>
          <span>{formatDate(post.created_at, true)}</span>
          {post.subject && (
            <span>
              {post.subject.year}학년 · {post.subject.name}
            </span>
          )}
          {post.due_at && <span className="font-semibold text-red-600">마감 {formatDate(post.due_at, true)}</span>}
        </div>
        <div className="mt-6 whitespace-pre-wrap text-sm leading-7">{post.body}</div>
        {canManage && (
          <form action={deletePost} className="mt-6 text-right">
            <input type="hidden" name="id" value={post.id} />
            <input type="hidden" name="board" value={board} />
            <button className="text-xs text-red-600 hover:underline">글 삭제</button>
          </form>
        )}
      </article>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-slate-700">댓글 {comments.length}</h2>
        <ul className="mt-2 space-y-2">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg bg-white px-4 py-3 text-sm ring-1 ring-slate-200">
              <div className="flex justify-between text-xs text-slate-500">
                <span>
                  {c.author?.name ?? c.author?.email} · {formatDate(c.created_at, true)}
                </span>
                {(c.author_id === profile.id || profile.role === "admin") && (
                  <form action={deleteComment}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="post_id" value={post.id} />
                    <button className="text-red-600 hover:underline">삭제</button>
                  </form>
                )}
              </div>
              <p className="mt-1 whitespace-pre-wrap">{c.body}</p>
            </li>
          ))}
        </ul>
        <form action={addComment} className="mt-3 flex gap-2">
          <input type="hidden" name="post_id" value={post.id} />
          <input
            name="body"
            required
            maxLength={2000}
            placeholder="댓글을 남겨주세요"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-navy focus:outline-none"
          />
          <button className="rounded-md bg-navy px-3 py-2 text-sm text-white hover:bg-navy-light">등록</button>
        </form>
      </section>
    </div>
  );
}
