"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, type Role } from "@/lib/auth";

const ROLES: Role[] = ["admin", "editor", "member"];

export async function changeRole(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId"));
  const role = String(formData.get("role")) as Role;

  if (!ROLES.includes(role)) throw new Error("잘못된 역할입니다");
  // 관리자가 실수로 자기 권한을 없애 아무도 관리할 수 없게 되는 것을 막는다.
  if (userId === admin.id && role !== "admin") throw new Error("본인의 관리자 권한은 내릴 수 없습니다");

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/members");
}
