"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, canPost } from "@/lib/auth";

export async function addEvent(formData: FormData) {
  const profile = await requireProfile();
  if (!canPost(profile)) throw new Error("일정을 추가할 권한이 없습니다");

  const title = String(formData.get("title") ?? "").trim();
  const start = String(formData.get("start_date"));
  const end = String(formData.get("end_date") || start);
  if (!title || !start) throw new Error("제목과 날짜를 입력해 주세요");
  if (end < start) throw new Error("끝나는 날이 시작일보다 빨라요");

  const supabase = await createClient();
  const { error } = await supabase.from("events").insert({
    title,
    kind: String(formData.get("kind") || "academic"),
    start_date: start,
    end_date: end,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
}

export async function deleteEvent(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", Number(formData.get("id")));
  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
}
