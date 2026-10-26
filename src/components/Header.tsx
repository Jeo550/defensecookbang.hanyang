import Link from "next/link";
import { getCurrentProfile, ROLE_LABELS } from "@/lib/auth";

export async function Header() {
  const profile = await getCurrentProfile();

  return (
    <header className="bg-navy text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-bold tracking-tight">
          국방전략기술공학과 <span className="text-accent">BlackBoard</span>
        </Link>
        {profile && (
          <nav className="flex items-center gap-4 text-sm">
            {profile.role === "admin" && (
              <Link href="/admin/members" className="hover:text-accent">
                회원 관리
              </Link>
            )}
            <span className="hidden text-slate-300 sm:inline">
              {profile.name ?? profile.email} · {ROLE_LABELS[profile.role]}
            </span>
            <form action="/auth/signout" method="post">
              <button className="rounded border border-white/30 px-2 py-1 hover:bg-white/10">
                로그아웃
              </button>
            </form>
          </nav>
        )}
      </div>
    </header>
  );
}
