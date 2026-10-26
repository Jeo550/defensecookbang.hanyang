import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

type Subject = {
  id: number;
  year: number;
  semester: number | null;
  name: string;
  professor: string | null;
  materials: { count: number }[];
};

export default async function SubjectsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("subjects")
    .select("id, year, semester, name, professor, materials(count)")
    .order("year")
    .order("semester", { nullsFirst: false })
    .order("name");
  const subjects = (data ?? []) as Subject[];

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">과목 자료실</h1>
          <p className="mt-1 text-sm text-slate-600">선배들이 남긴 자료를 학년과 과목별로 모아둬요.</p>
        </div>
        {profile.role === "admin" && (
          <Link href="/admin/subjects" className="text-sm text-navy-light hover:underline">
            과목 관리 →
          </Link>
        )}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((year) => {
          const list = subjects.filter((s) => s.year === year);
          return (
            <section key={year} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="font-semibold text-navy">{year}학년</h2>
              {list.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">등록된 과목이 없어요</p>
              ) : (
                <ul className="mt-3 space-y-1">
                  {list.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/subjects/${s.id}`}
                        className="flex justify-between rounded px-2 py-1.5 text-sm hover:bg-slate-50"
                      >
                        <span>
                          {s.semester && <span className="mr-1 text-xs text-slate-400">{s.semester}학기</span>}
                          {s.name}
                          {s.professor && <span className="ml-1 text-xs text-slate-400">{s.professor}</span>}
                        </span>
                        <span className="text-xs text-slate-500">자료 {s.materials[0]?.count ?? 0}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
