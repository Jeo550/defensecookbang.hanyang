import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { addDays, startOfWeek, todayKST } from "@/lib/dates";
import { EXERCISES, formatExercise, formatMinutes, type ExerciseKind } from "@/lib/records";
import { addExerciseLog, addStudyLog, deleteLog } from "./actions";

type StudyLog = { id: number; log_date: string; minutes: number; subject: string | null; memo: string | null };
type ExerciseLog = { id: number; log_date: string; kind: ExerciseKind; value: number; memo: string | null };

export default async function RecordsPage() {
  await requireProfile();
  const supabase = await createClient();
  const today = todayKST();
  const weekStart = startOfWeek(today);
  const since = addDays(today, -29);

  const [{ data: studyData }, { data: exerciseData }, { data: allExercise }] = await Promise.all([
    supabase.from("study_logs").select("*").gte("log_date", since).order("log_date", { ascending: false }).order("id", { ascending: false }),
    supabase.from("exercise_logs").select("*").gte("log_date", since).order("log_date", { ascending: false }).order("id", { ascending: false }),
    supabase.from("exercise_logs").select("kind, value"),
  ]);
  const study = (studyData ?? []) as StudyLog[];
  const exercise = (exerciseData ?? []) as ExerciseLog[];

  const weekMinutes = study.filter((s) => s.log_date >= weekStart).reduce((sum, s) => sum + s.minutes, 0);
  const monthMinutes = study.reduce((sum, s) => sum + s.minutes, 0);

  const best = new Map<ExerciseKind, number>();
  for (const e of (allExercise ?? []) as { kind: ExerciseKind; value: number }[]) {
    const prev = best.get(e.kind);
    const better = EXERCISES[e.kind].lowerIsBetter ? e.value < (prev ?? Infinity) : e.value > (prev ?? -Infinity);
    if (better) best.set(e.kind, Number(e.value));
  }

  const input = "rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-navy focus:outline-none";
  const card = "rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200";

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">공부·운동 기록</h1>
      <p className="mt-1 text-sm text-slate-600">내 기록은 나만 볼 수 있어요.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className={card}>
          <div className="text-sm text-slate-500">이번 주 공부</div>
          <div className="mt-1 text-2xl font-bold text-navy">{formatMinutes(weekMinutes)}</div>
          <div className="mt-1 text-xs text-slate-500">최근 30일 {formatMinutes(monthMinutes)}</div>
        </div>
        <div className={card}>
          <div className="text-sm text-slate-500">내 최고 기록</div>
          {best.size === 0 ? (
            <div className="mt-2 text-sm text-slate-400">아직 운동 기록이 없어요</div>
          ) : (
            <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {[...best].map(([kind, value]) => (
                <li key={kind}>
                  <span className="text-slate-500">{EXERCISES[kind].label}</span>{" "}
                  <span className="font-semibold">{formatExercise(kind, value)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className={card}>
          <h2 className="font-semibold text-navy">공부 기록</h2>
          <form action={addStudyLog} className="mt-3 flex flex-wrap items-center gap-2">
            <input type="date" name="log_date" defaultValue={today} required className={input} />
            <input type="number" name="hours" min={0} max={24} placeholder="시간" className={`${input} w-16`} />
            <input type="number" name="minutes" min={0} max={59} placeholder="분" className={`${input} w-16`} />
            <input name="subject" placeholder="과목" maxLength={100} className={`${input} w-28`} />
            <input name="memo" placeholder="메모" maxLength={500} className={`${input} flex-1`} />
            <button className="rounded-md bg-navy px-3 py-1.5 text-sm text-white hover:bg-navy-light">추가</button>
          </form>
          <ul className="mt-4 divide-y divide-slate-100 text-sm">
            {study.length === 0 && <li className="py-3 text-slate-400">최근 30일 기록이 없어요</li>}
            {study.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2">
                <span>
                  <span className="mr-2 text-slate-500">{s.log_date.slice(5)}</span>
                  <span className="font-medium">{formatMinutes(s.minutes)}</span>
                  {s.subject && <span className="ml-2 text-slate-600">{s.subject}</span>}
                  {s.memo && <span className="ml-2 text-slate-400">{s.memo}</span>}
                </span>
                <form action={deleteLog}>
                  <input type="hidden" name="table" value="study_logs" />
                  <input type="hidden" name="id" value={s.id} />
                  <button className="text-xs text-red-600 hover:underline">삭제</button>
                </form>
              </li>
            ))}
          </ul>
        </section>

        <section className={card}>
          <h2 className="font-semibold text-navy">운동 기록</h2>
          <form action={addExerciseLog} className="mt-3 flex flex-wrap items-center gap-2">
            <input type="date" name="log_date" defaultValue={today} required className={input} />
            <select name="kind" className={input}>
              {(Object.keys(EXERCISES) as ExerciseKind[]).map((k) => (
                <option key={k} value={k}>
                  {EXERCISES[k].label}
                </option>
              ))}
            </select>
            <input type="number" name="value" min={0} step="any" placeholder="회 / m" className={`${input} w-20`} />
            <span className="text-xs text-slate-400">달리기는 →</span>
            <input type="number" name="run_min" min={0} placeholder="분" className={`${input} w-14`} />
            <input type="number" name="run_sec" min={0} max={59} placeholder="초" className={`${input} w-14`} />
            <input name="memo" placeholder="메모" maxLength={500} className={`${input} flex-1`} />
            <button className="rounded-md bg-navy px-3 py-1.5 text-sm text-white hover:bg-navy-light">추가</button>
          </form>
          <ul className="mt-4 divide-y divide-slate-100 text-sm">
            {exercise.length === 0 && <li className="py-3 text-slate-400">최근 30일 기록이 없어요</li>}
            {exercise.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2">
                <span>
                  <span className="mr-2 text-slate-500">{e.log_date.slice(5)}</span>
                  <span className="text-slate-600">{EXERCISES[e.kind].label}</span>{" "}
                  <span className="font-medium">{formatExercise(e.kind, Number(e.value))}</span>
                  {e.memo && <span className="ml-2 text-slate-400">{e.memo}</span>}
                </span>
                <form action={deleteLog}>
                  <input type="hidden" name="table" value="exercise_logs" />
                  <input type="hidden" name="id" value={e.id} />
                  <button className="text-xs text-red-600 hover:underline">삭제</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
