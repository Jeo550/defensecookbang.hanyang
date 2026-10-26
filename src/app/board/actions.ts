"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, canPost } from "@/lib/auth";
import { BOARDS, isBoard } from "@/lib/boards";

export async function createPost(formData: FormData) {
  const profile = await requireProfile();
  const board = String(formData.get("board"));
  if (!isBoard(board)) throw new Error("잘못된 게시판입니다");
  if (BOARDS[board].editorsOnly && !canPost(profile)) throw new Error("글쓰기 권한이 없습니다");

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title) throw new Error("제목을 입력해 주세요");

  const due = String(formData.get("due_at") ?? "");
  const subjectId = String(formData.get("subject_id") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .insert({
      board,
      title,
      body,
      // datetime-local 값은 한국 시간으로 본다
      due_at: board === "assignment" && due ? new Date(`${due}:00+09:00`).toISOString() : null,
      subject_id: subjectId ? Number(subjectId) : null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath(`/board/${board}`);
  redirect(`/posts/${data.id}`);
}

export async function deletePost(formData: FormData) {
  await requireProfile();
  const id = Number(formData.get("id"));
  const board = String(formData.get("board"));

  const supabase = await createClient();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/board/${board}`);
  redirect(`/board/${board}`);
}

export async function addComment(formData: FormData) {
  await requireProfile();
  const postId = Number(formData.get("post_id"));
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({ post_id: postId, body });
  if (error) throw new Error(error.message);

  revalidatePath(`/posts/${postId}`);
}

export async function deleteComment(formData: FormData) {
  await requireProfile();
  const id = Number(formData.get("id"));
  const postId = Number(formData.get("post_id"));

  const supabase = await createClient();
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/posts/${postId}`);
}
