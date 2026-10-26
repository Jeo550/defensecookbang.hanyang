import { requireProfile, ROLE_LABELS } from "@/lib/auth";
import { updateMyProfile } from "./actions";

export default async function MePage() {
  const profile = await requireProfile();
  const input = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-navy focus:outline-none";

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-navy">내 정보</h1>
      <p className="mt-1 text-sm text-slate-600">
        {profile.email} · {ROLE_LABELS[profile.role]}
      </p>
      <form action={updateMyProfile} className="mt-6 space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <label className="block text-sm">
          이름
          <input name="name" defaultValue={profile.name ?? ""} maxLength={30} className={input} />
        </label>
        <label className="block text-sm">
          학년
          <select name="student_year" defaultValue={profile.student_year ?? ""} className={input}>
            <option value="">선택 안 함</option>
            {[1, 2, 3, 4].map((y) => (
              <option key={y} value={y}>
                {y}학년
              </option>
            ))}
          </select>
        </label>
        <button className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
          저장
        </button>
      </form>
    </div>
  );
}
