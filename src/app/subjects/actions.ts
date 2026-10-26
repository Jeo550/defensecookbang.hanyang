"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireProfile, canPost } from "@/lib/auth";
import { MATERIAL_KINDS, type MaterialKind } from "@/lib/boards";

export async function createSubject(formData: FormData) {
  await requireAdmin();
  const year = Number(formData.get("year"));
  const semester = String(formData.get("semester") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const professor = String(formData.get("professor") ?? "").trim();
  if (!name || year < 1 || year > 4) throw new Error("학년과 과목명을 확인해 주세요");

  const supabase = await createClient();
  const { error } = await supabase.from("subjects").insert({
    year,
    semester: semester ? Number(semester) : null,
    name,
    professor: professor || null,
  });
  if (error) throw new Error(error.code === "23505" ? "같은 학년에 같은 이름의 과목이 있어요" : error.message);

  revalidatePath("/admin/subjects");
  revalidatePath("/subjects");
}

export async function deleteSubject(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));

  const supabase = await createClient();
  // 과목을 지우면 자료 행도 함께 지워지므로, 저장소의 파일도 먼저 지운다.
  const { data: files } = await supabase.from("materials").select("file_path").eq("subject_id", id);
  const paths = (files ?? []).map((f) => f.file_path).filter((p): p is string => !!p);
  if (paths.length) await supabase.storage.from("materials").remove(paths);

  const { error } = await supabase.from("subjects").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/subjects");
  revalidatePath("/subjects");
}

export async function uploadMaterial(formData: FormData) {
  const profile = await requireProfile();
  if (!canPost(profile)) throw new Error("자료를 올릴 권한이 없습니다");

  const subjectId = Number(formData.get("subject_id"));
  const kind = String(formData.get("kind")) as MaterialKind;
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const linkUrl = String(formData.get("link_url") ?? "").trim();
  const schoolYear = String(formData.get("school_year") ?? "");
  const file = formData.get("file");

  if (!(kind in MATERIAL_KINDS)) throw new Error("자료 종류를 골라 주세요");
  if (!title) throw new Error("제목을 입력해 주세요");
  const hasFile = file instanceof File && file.size > 0;
  if (!hasFile && !linkUrl) throw new Error("파일을 올리거나 링크를 넣어 주세요");
  if (linkUrl && !/^https?:\/\//.test(linkUrl)) throw new Error("링크는 http:// 또는 https:// 로 시작해야 해요");

  const supabase = await createClient();
  let filePath: string | null = null;
  if (hasFile) {
    // 한글 파일명은 저장소 경로에 쓸 수 없어서, 경로는 임의 이름으로 두고 원래 이름은 따로 저장한다.
    const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "") : "";
    filePath = `${subjectId}/${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;
    const { error } = await supabase.storage
      .from("materials")
      .upload(filePath, file, { contentType: file.type || undefined });
    if (error) throw new Error(`파일 업로드 실패: ${error.message}`);
  }

  const { error } = await supabase.from("materials").insert({
    subject_id: subjectId,
    kind,
    title,
    description: description || null,
    file_path: filePath,
    file_name: hasFile ? file.name : null,
    link_url: linkUrl || null,
    school_year: schoolYear ? Number(schoolYear) : null,
  });
  if (error) {
    if (filePath) await supabase.storage.from("materials").remove([filePath]);
    throw new Error(error.message);
  }

  revalidatePath(`/subjects/${subjectId}`);
}

export async function deleteMaterial(formData: FormData) {
  await requireProfile();
  const id = Number(formData.get("id"));
  const subjectId = Number(formData.get("subject_id"));

  const supabase = await createClient();
  const { data: rows, error } = await supabase.from("materials").delete().eq("id", id).select("file_path");
  if (error) throw new Error(error.message);
  const path = rows?.[0]?.file_path;
  if (path) await supabase.storage.from("materials").remove([path]);

  revalidatePath(`/subjects/${subjectId}`);
}
