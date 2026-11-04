"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export async function updateMyProfile(formData: FormData) {
  const profile = await requireProfile();
  const name = String(formData.get("name") ?? "").trim();
  const year = String(formData.get("student_year") ?? "");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ name: name || null, student_year: year ? Number(year) : null })
    .eq("id", profile.id);
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
}

export type PasswordState = { ok: boolean; message: string } | null;

export async function changePassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  await requireProfile();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) return { ok: false, message: "비밀번호는 8글자 이상이어야 해요." };
  if (password !== confirm) return { ok: false, message: "비밀번호 확인이 서로 달라요." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, message: `바꾸지 못했어요. (${error.message})` };
  return { ok: true, message: "비밀번호를 바꿨어요. 다음 로그인부터 새 비밀번호를 쓰세요." };
}
