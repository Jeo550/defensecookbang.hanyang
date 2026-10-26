import { createClient } from "@/lib/supabase/server";
import { requireAdmin, ROLE_LABELS, type Profile, type Role } from "@/lib/auth";
import { changeRole } from "./actions";

export default async function MembersPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").order("created_at");
  const members = (data ?? []) as Profile[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">회원 관리</h1>
      <p className="mt-1 text-sm text-slate-600">
        글쓰기 권한자로 임명하면 공지와 과제를 올릴 수 있어요. 총 {members.length}명
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2">이름</th>
              <th className="px-4 py-2">이메일</th>
              <th className="px-4 py-2">역할</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{m.name ?? "-"}</td>
                <td className="px-4 py-2 text-slate-600">{m.email}</td>
                <td className="px-4 py-2">
                  {m.id === admin.id ? (
                    ROLE_LABELS[m.role]
                  ) : (
                    <form action={changeRole} className="flex gap-2">
                      <input type="hidden" name="userId" value={m.id} />
                      <select
                        name="role"
                        defaultValue={m.role}
                        className="rounded border border-slate-300 px-2 py-1"
                      >
                        {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                      <button className="rounded bg-navy px-2 py-1 text-white hover:bg-navy-light">
                        저장
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
