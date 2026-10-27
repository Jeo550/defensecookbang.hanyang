import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Supabase가 링크 검증에 실패하면 error_description을 붙여 돌려보낸다.
  let message = searchParams.get("error_description") ?? "로그인 링크가 올바르지 않아요";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/`);
    message = error.message;
  }

  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`);
}
