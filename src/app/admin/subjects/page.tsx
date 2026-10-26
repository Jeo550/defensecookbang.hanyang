import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { createSubject, deleteSubject } from "@/app/subjects/actions";
import { ConfirmButton } from "@/components/ConfirmButton";

export default async function AdminSubjectsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("subjects")
    .select("id, year, semester, name, professor, materials(count)")
    .order("year")
    .order("semester", { nullsFirst: false })
    .order("name");
  const subjects = (data ?? []) as {
    id: number;
    year: number;
    semester: number | null;
    name: string;
    professor: string | null;
    materials: { count: number }[];
  }[];

  const input = "rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-navy focus:outline-none";

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">과목 관리</h1>
      <p className="mt-1 text-sm text-slate-600">과목을 지우면 그 과목의 자료도 모두 지워져요.</p>

      <form action={createSubject} className="mt-6 flex flex-wrap items-end gap-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <label className="text-sm">
          학년
          <select name="year" className={`mt-1 block ${input}`}>
            {[1, 2, 3, 4].map((y) => (
              <option key={y} value={y}>
                {y}학년
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          학기
          <select name="semester" className={`mt-1 block ${input}`}>
            <option value="">-</option>
            <option value="1">1학기</option>
            <option value="2">2학기</option>
          </select>
        </label>
        <label className="flex-1 text-sm">
          과목명
          <input name="name" required className={`mt-1 block w-full ${input}`} />
        </label>
        <label className="text-sm">
          교수님 (선택)
          <input name="professor" className={`mt-1 block ${input}`} />
        </label>
        <button className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
          추가
        </button>
      </form>

      <ul className="mt-6 divide-y divide-slate-100 rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        {subjects.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-400">과목을 추가해 주세요</li>}
        {subjects.map((s) => (
          <li key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>
              <span className="mr-2 text-slate-500">
                {s.year}학년{s.semester ? ` ${s.semester}학기` : ""}
              </span>
              {s.name}
              {s.professor && <span className="ml-1 text-slate-400">{s.professor}</span>}
              <span className="ml-2 text-xs text-slate-400">자료 {s.materials[0]?.count ?? 0}개</span>
            </span>
            <form action={deleteSubject}>
              <input type="hidden" name="id" value={s.id} />
              <ConfirmButton
                message={`'${s.name}' 과목과 자료 ${s.materials[0]?.count ?? 0}개를 모두 지울까요?`}
                className="text-xs text-red-600 hover:underline"
              >
                삭제
              </ConfirmButton>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
