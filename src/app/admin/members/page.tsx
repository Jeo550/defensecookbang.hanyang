import { createClient } from "@/lib/supabase/server";
import { requireAdmin, ROLE_LABELS, type Profile, type Role } from "@/lib/auth";
import { formatDate } from "@/lib/boards";
import { ConfirmButton } from "@/components/ConfirmButton";
import { approveMember, changeRole, rejectMember } from "./actions";

export default async function MembersPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").order("created_at");
  const all = (data ?? []) as Profile[];
  const pending = all.filter((m) => !m.approved);
  const members = all.filter((m) => m.approved);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">회원 관리</h1>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-navy">가입 신청 {pending.length}명</h2>
        {pending.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">기다리는 가입 신청이 없어요.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-amber-200">
            <table className="w-full text-sm">
              <thead className="bg-amber-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2">이름</th>
                  <th className="px-4 py-2">아이디</th>
                  <th className="px-4 py-2">학년</th>
                  <th className="px-4 py-2">신청일</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {pending.map((m) => (
                  <tr key={m.id} className="border-t border-slate-100">
                    <td className="px-4 py-2">{m.name ?? "-"}</td>
                    <td className="px-4 py-2 text-slate-600">{m.username ?? m.email}</td>
                    <td className="px-4 py-2">{m.student_year ? `${m.student_year}학년` : "-"}</td>
                    <td className="px-4 py-2 text-slate-500">{formatDate(m.created_at)}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <form action={approveMember}>
                          <input type="hidden" name="userId" value={m.id} />
                          <button className="rounded bg-navy px-3 py-1 text-white hover:bg-navy-light">승인</button>
                        </form>
                        <form action={rejectMember}>
                          <input type="hidden" name="userId" value={m.id} />
                          <ConfirmButton
                            message={`${m.name ?? m.username}님의 가입 신청을 거절할까요? 계정이 삭제돼요.`}
                            className="rounded border border-red-300 px-3 py-1 text-red-600 hover:bg-red-50"
                          >
                            거절
                          </ConfirmButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-navy">회원 {members.length}명</h2>
        <p className="mt-1 text-sm text-slate-600">글쓰기 권한자로 임명하면 공지와 과제를 올릴 수 있어요.</p>
        <div className="mt-3 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2">이름</th>
                <th className="px-4 py-2">아이디</th>
                <th className="px-4 py-2">역할</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">{m.name ?? "-"}</td>
                  <td className="px-4 py-2 text-slate-600">{m.username ?? m.email}</td>
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
      </section>
    </div>
  );
}
