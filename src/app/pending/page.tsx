import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";

export default async function PendingPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.approved) redirect("/");

  return (
    <div className="mx-auto mt-12 max-w-sm rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
      <h1 className="text-xl font-bold text-navy">승인을 기다리고 있어요</h1>
      <p className="mt-3 text-sm text-slate-600">
        {profile.name ?? profile.username} 님의 가입 신청이 접수됐어요. 관리자가 승인하면 바로 사이트를 쓸 수 있어요.
      </p>
      <p className="mt-2 text-xs text-slate-500">승인된 뒤에 이 화면을 새로고침해 주세요.</p>
      <form action="/auth/signout" method="post" className="mt-6">
        <button className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">로그아웃</button>
      </form>
    </div>
  );
}
