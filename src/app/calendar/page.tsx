import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, canPost } from "@/lib/auth";
import { addDays, startOfWeek, toKSTDate, todayKST } from "@/lib/dates";
import { addEvent, deleteEvent } from "./actions";

type EventKind = "academic" | "dept" | "etc";
const KINDS: Record<EventKind, { label: string; cls: string }> = {
  academic: { label: "학사일정", cls: "bg-blue-100 text-blue-800" },
  dept: { label: "학과행사", cls: "bg-amber-100 text-amber-800" },
  etc: { label: "기타", cls: "bg-slate-100 text-slate-700" },
};

type Item = { key: string; label: string; cls: string; href?: string };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const profile = await requireProfile();
  const { m } = await searchParams;
  const today = todayKST();
  const month = m && /^\d{4}-\d{2}$/.test(m) ? m : today.slice(0, 7);

  const first = `${month}-01`;
  const [y, mo] = month.split("-").map(Number);
  const nextMonth = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, "0")}`;
  const prevMonth = mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, "0")}`;
  const gridStart = startOfWeek(first);
  const gridEnd = addDays(startOfWeek(addDays(`${nextMonth}-01`, -1)), 6);

  const supabase = await createClient();
  const [{ data: events }, { data: due }] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, kind, start_date, end_date")
      .lte("start_date", gridEnd)
      .gte("end_date", gridStart)
      .order("start_date"),
    supabase
      .from("posts")
      .select("id, title, due_at, subject:subjects(name)")
      .eq("board", "assignment")
      .gte("due_at", `${gridStart}T00:00:00+09:00`)
      .lte("due_at", `${gridEnd}T23:59:59+09:00`),
  ]);

  const byDay = new Map<string, Item[]>();
  const push = (day: string, item: Item) => byDay.set(day, [...(byDay.get(day) ?? []), item]);
  for (const e of (events ?? []) as { id: number; title: string; kind: EventKind; start_date: string; end_date: string }[]) {
    for (let d = e.start_date < gridStart ? gridStart : e.start_date; d <= e.end_date && d <= gridEnd; d = addDays(d, 1)) {
      push(d, { key: `e${e.id}`, label: e.title, cls: KINDS[e.kind].cls });
    }
  }
  for (const p of (due ?? []) as unknown as { id: number; title: string; due_at: string; subject: { name: string } | null }[]) {
    push(toKSTDate(p.due_at), {
      key: `p${p.id}`,
      label: `마감 · ${p.subject ? `${p.subject.name} ` : ""}${p.title}`,
      cls: "bg-red-100 text-red-800",
      href: `/posts/${p.id}`,
    });
  }

  const days: string[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d);

  const input = "rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-navy focus:outline-none";

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">
          {y}년 {mo}월
        </h1>
        <div className="flex gap-2 text-sm">
          <Link href={`/calendar?m=${prevMonth}`} className="rounded border border-slate-300 px-2 py-1 hover:bg-white">
            ← 이전
          </Link>
          <Link href="/calendar" className="rounded border border-slate-300 px-2 py-1 hover:bg-white">
            오늘
          </Link>
          <Link href={`/calendar?m=${nextMonth}`} className="rounded border border-slate-300 px-2 py-1 hover:bg-white">
            다음 →
          </Link>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="grid min-w-[640px] grid-cols-7 overflow-hidden rounded-xl bg-white text-xs shadow-sm ring-1 ring-slate-200">
          {["월", "화", "수", "목", "금", "토", "일"].map((d) => (
            <div key={d} className="border-b border-slate-100 bg-slate-50 py-1.5 text-center font-semibold text-slate-500">
              {d}
            </div>
          ))}
          {days.map((d) => (
            <div
              key={d}
              className={`min-h-24 border-b border-r border-slate-100 p-1 ${d.slice(0, 7) !== month ? "bg-slate-50 text-slate-400" : ""}`}
            >
              <div className={`mb-1 ${d === today ? "inline-block rounded-full bg-navy px-1.5 text-white" : ""}`}>
                {Number(d.slice(8))}
              </div>
              <div className="space-y-0.5">
                {(byDay.get(d) ?? []).map((it) =>
                  it.href ? (
                    <Link key={it.key} href={it.href} className={`block truncate rounded px-1 ${it.cls}`}>
                      {it.label}
                    </Link>
                  ) : (
                    <div key={it.key} className={`truncate rounded px-1 ${it.cls}`}>
                      {it.label}
                    </div>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {canPost(profile) && (
        <section className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-semibold text-navy">일정 추가</h2>
          <form action={addEvent} className="mt-3 flex flex-wrap items-center gap-2">
            <select name="kind" className={input}>
              {(Object.keys(KINDS) as EventKind[]).map((k) => (
                <option key={k} value={k}>
                  {KINDS[k].label}
                </option>
              ))}
            </select>
            <input type="date" name="start_date" required className={input} />
            <span className="text-slate-400">~</span>
            <input type="date" name="end_date" className={input} />
            <input name="title" required maxLength={200} placeholder="일정 이름" className={`${input} flex-1`} />
            <button className="rounded-md bg-navy px-3 py-1.5 text-sm text-white hover:bg-navy-light">추가</button>
          </form>
          {(events ?? []).length > 0 && (
            <ul className="mt-4 divide-y divide-slate-100 text-sm">
              {(events as { id: number; title: string; start_date: string; end_date: string }[]).map((e) => (
                <li key={e.id} className="flex justify-between py-1.5">
                  <span>
                    <span className="mr-2 text-slate-500">
                      {e.start_date.slice(5)}
                      {e.end_date !== e.start_date && ` ~ ${e.end_date.slice(5)}`}
                    </span>
                    {e.title}
                  </span>
                  <form action={deleteEvent}>
                    <input type="hidden" name="id" value={e.id} />
                    <button className="text-xs text-red-600 hover:underline">삭제</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
