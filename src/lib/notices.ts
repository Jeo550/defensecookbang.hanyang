import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/auth";

export const NOTICE_BOARDS = ["school_notice", "dept_notice", "assignment"] as const;

/** 마지막으로 알림을 확인한 뒤 다른 사람이 올린 공지·과제 수 */
export async function countUnreadNotices(profile: Profile) {
  if (!profile.notices_seen_at) return 0;
  const supabase = await createClient();
  const { count } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .in("board", NOTICE_BOARDS)
    .neq("author_id", profile.id)
    .gt("created_at", profile.notices_seen_at);
  return count ?? 0;
}
