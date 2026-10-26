import Link from "next/link";
import { getCurrentProfile, ROLE_LABELS } from "@/lib/auth";
import { countUnreadNotices } from "@/lib/notices";

const NAV = [
  { href: "/board/school_notice", label: "학교 공지" },
  { href: "/board/dept_notice", label: "학과 공지" },
  { href: "/board/assignment", label: "과제" },
  { href: "/subjects", label: "자료실" },
  { href: "/board/free", label: "자유게시판" },
  { href: "/calendar", label: "캘린더" },
  { href: "/records", label: "내 기록" },
];

export async function Header() {
  const profile = await getCurrentProfile();
  const unread = profile ? await countUnreadNotices(profile) : 0;

  return (
    <header className="bg-navy text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-bold tracking-tight">
          국방전략기술공학과 <span className="text-accent">BlackBoard</span>
        </Link>
        {profile && (
          <div className="flex items-center gap-4 text-sm">
            <Link href="/notifications" className="relative hover:text-accent" aria-label="알림">
              알림
              {unread > 0 && (
                <span className="absolute -right-3 -top-2 rounded-full bg-red-600 px-1.5 text-[10px] font-bold">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>
            <Link href="/me" className="hidden text-slate-300 hover:text-white sm:inline">
              {profile.name ?? profile.email} · {ROLE_LABELS[profile.role]}
            </Link>
            <form action="/auth/signout" method="post">
              <button className="rounded border border-white/30 px-2 py-1 hover:bg-white/10">로그아웃</button>
            </form>
          </div>
        )}
      </div>
      {profile && (
        <nav className="border-t border-white/10">
          <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-2 text-sm">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="whitespace-nowrap px-3 py-2 hover:text-accent">
                {n.label}
              </Link>
            ))}
            {profile.role === "admin" && (
              <>
                <Link href="/admin/subjects" className="whitespace-nowrap px-3 py-2 text-accent/90 hover:text-accent">
                  과목 관리
                </Link>
                <Link href="/admin/members" className="whitespace-nowrap px-3 py-2 text-accent/90 hover:text-accent">
                  회원 관리
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
