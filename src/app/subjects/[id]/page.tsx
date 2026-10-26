import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, canPost } from "@/lib/auth";
import { MATERIAL_KINDS, formatDate, type MaterialKind } from "@/lib/boards";
import { deleteMaterial, uploadMaterial } from "../actions";

type Material = {
  id: number;
  kind: MaterialKind;
  title: string;
  description: string | null;
  file_path: string | null;
  file_name: string | null;
  link_url: string | null;
  school_year: number | null;
  created_at: string;
  author_id: string;
  author: { name: string | null; email: string } | null;
};

export default async function SubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: subject } = await supabase.from("subjects").select("*").eq("id", Number(id)).single();
  if (!subject) notFound();

  const { data } = await supabase
    .from("materials")
    .select("*, author:profiles(name, email)")
    .eq("subject_id", subject.id)
    .order("created_at", { ascending: false });
  const materials = (data ?? []) as Material[];

  // 비공개 저장소라 내려받기 링크는 1시간짜리 서명 URL로 만든다.
  const paths = materials.map((m) => m.file_path).filter((p): p is string => !!p);
  const signed = new Map<string, string>();
  if (paths.length) {
    const { data: urls } = await supabase.storage.from("materials").createSignedUrls(paths, 3600);
    urls?.forEach((u) => u.path && u.signedUrl && signed.set(u.path, u.signedUrl));
  }

  const input = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-navy focus:outline-none";
  const thisYear = new Date().getFullYear();

  return (
    <div>
      <Link href="/subjects" className="text-sm text-navy-light hover:underline">
        ← 과목 자료실
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-navy">
        {subject.name}
        <span className="ml-2 text-base font-normal text-slate-500">
          {subject.year}학년{subject.semester ? ` ${subject.semester}학기` : ""}
          {subject.professor ? ` · ${subject.professor}` : ""}
        </span>
      </h1>

      <div className="mt-6 space-y-6">
        {(Object.keys(MATERIAL_KINDS) as MaterialKind[]).map((kind) => {
          const list = materials.filter((m) => m.kind === kind);
          return (
            <section key={kind}>
              <h2 className="text-sm font-semibold text-slate-700">
                {MATERIAL_KINDS[kind]} <span className="text-slate-400">{list.length}</span>
              </h2>
              <ul className="mt-2 divide-y divide-slate-100 rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                {list.length === 0 && <li className="px-4 py-4 text-sm text-slate-400">아직 자료가 없어요</li>}
                {list.map((m) => (
                  <li key={m.id} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                    <div>
                      <div className="font-medium">
                        {m.school_year && <span className="mr-1 text-xs text-slate-400">{m.school_year}년</span>}
                        {m.title}
                      </div>
                      {m.description && <p className="mt-0.5 text-slate-600">{m.description}</p>}
                      <div className="mt-1 text-xs text-slate-500">
                        {m.author?.name ?? m.author?.email} · {formatDate(m.created_at)}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {m.file_path && signed.get(m.file_path) && (
                        <a href={signed.get(m.file_path)} className="text-navy-light hover:underline">
                          {m.file_name ?? "파일"} 받기
                        </a>
                      )}
                      {m.link_url && (
                        <a href={m.link_url} target="_blank" rel="noreferrer" className="text-navy-light hover:underline">
                          링크 열기
                        </a>
                      )}
                      {(m.author_id === profile.id || profile.role === "admin") && (
                        <form action={deleteMaterial}>
                          <input type="hidden" name="id" value={m.id} />
                          <input type="hidden" name="subject_id" value={subject.id} />
                          <button className="text-xs text-red-600 hover:underline">삭제</button>
                        </form>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {canPost(profile) && (
        <form
          action={uploadMaterial}
          className="mt-8 space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
        >
          <h2 className="font-semibold text-navy">자료 올리기</h2>
          <input type="hidden" name="subject_id" value={subject.id} />
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm">
              종류
              <select name="kind" className={`mt-1 ${input}`}>
                {(Object.keys(MATERIAL_KINDS) as MaterialKind[]).map((k) => (
                  <option key={k} value={k}>
                    {MATERIAL_KINDS[k]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm sm:col-span-2">
              제목
              <input name="title" required maxLength={200} className={`mt-1 ${input}`} />
            </label>
          </div>
          <label className="block text-sm">
            설명 (선택)
            <input name="description" className={`mt-1 ${input}`} />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm">
              파일 (20MB까지)
              <input type="file" name="file" className="mt-1 block w-full text-sm" />
            </label>
            <label className="block text-sm">
              또는 링크 (구글 드라이브 등)
              <input name="link_url" type="url" placeholder="https://" className={`mt-1 ${input}`} />
            </label>
            <label className="block text-sm">
              자료 연도
              <input name="school_year" type="number" defaultValue={thisYear} className={`mt-1 ${input}`} />
            </label>
          </div>
          <button className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
            올리기
          </button>
        </form>
      )}
    </div>
  );
}
