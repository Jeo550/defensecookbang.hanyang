import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { BOARDS, formatDate, type Board } from "@/lib/boards";
import { NOTICE_BOARDS } from "@/lib/notices";

type Row = { id: number; board: Board; title: string; created_at: string; due_at: string | null };

export default async function NotificationsPage() {
  const profile = await requireProfile();
  const seenAt = profile.notices_seen_at;
  const supabase = await createClient();

  const { data } = await supabase
    .from("posts")
    .select("id, board, title, created_at, due_at")
    .in("board", NOTICE_BOARDS)
    .neq("author_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(30);
  const posts = (data ?? []) as Row[];

  // 이 화면을 열면 모두 읽은 것으로 본다.
  await supabase.from("profiles").update({ notices_seen_at: new Date().toISOString() }).eq("id", profile.id);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-navy">알림</h1>
      <p className="mt-1 text-sm text-slate-600">새로 올라온 공지와 과제예요.</p>
      <ul className="mt-6 divide-y divide-slate-100 rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        {posts.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-400">알림이 없어요</li>}
        {posts.map((p) => {
          const isNew = !!seenAt && new Date(p.created_at) > new Date(seenAt);
          return (
            <li key={p.id}>
              <Link href={`/posts/${p.id}`} className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-slate-50">
                {isNew && <span className="rounded bg-red-600 px-1.5 text-xs text-white">새 글</span>}
                <span className="text-slate-500">{BOARDS[p.board].label}</span>
                <span className={isNew ? "font-semibold" : ""}>{p.title}</span>
                <span className="ml-auto text-xs text-slate-400">
                  {p.due_at ? `마감 ${formatDate(p.due_at, true)}` : formatDate(p.created_at)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
