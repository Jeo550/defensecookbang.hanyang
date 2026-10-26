"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { EXERCISES, type ExerciseKind } from "@/lib/records";

export async function addStudyLog(formData: FormData) {
  await requireProfile();
  const hours = Number(formData.get("hours") || 0);
  const mins = Number(formData.get("minutes") || 0);
  const minutes = Math.round(hours * 60 + mins);
  if (!(minutes >= 1 && minutes <= 1440)) throw new Error("공부 시간을 확인해 주세요");

  const supabase = await createClient();
  const { error } = await supabase.from("study_logs").insert({
    log_date: String(formData.get("log_date")),
    minutes,
    subject: String(formData.get("subject") ?? "").trim() || null,
    memo: String(formData.get("memo") ?? "").trim() || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/records");
}

export async function addExerciseLog(formData: FormData) {
  await requireProfile();
  const kind = String(formData.get("kind")) as ExerciseKind;
  if (!(kind in EXERCISES)) throw new Error("운동 종류를 골라 주세요");

  // 달리기는 분/초로 받아 초로 저장한다.
  const value =
    kind === "run_3km"
      ? Number(formData.get("run_min") || 0) * 60 + Number(formData.get("run_sec") || 0)
      : Number(formData.get("value") || 0);
  if (!(value > 0)) throw new Error("기록을 입력해 주세요");

  const supabase = await createClient();
  const { error } = await supabase.from("exercise_logs").insert({
    log_date: String(formData.get("log_date")),
    kind,
    value,
    memo: String(formData.get("memo") ?? "").trim() || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/records");
}

export async function deleteLog(formData: FormData) {
  await requireProfile();
  const table = formData.get("table") === "exercise_logs" ? "exercise_logs" : "study_logs";
  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq("id", Number(formData.get("id")));
  if (error) throw new Error(error.message);
  revalidatePath("/records");
}
