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
