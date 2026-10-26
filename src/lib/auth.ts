import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "admin" | "editor" | "member";

export type Profile = {
  id: string;
  email: string;
  name: string | null;
  student_year: number | null;
  role: Role;
  created_at: string;
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: "관리자",
  editor: "글쓰기 권한자",
  member: "학우",
};

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profile) ?? null;
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/");
  return profile;
}

export function canPost(profile: Pick<Profile, "role"> | null) {
  return profile?.role === "admin" || profile?.role === "editor";
}
