"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// 메일 링크를 누르면 Supabase가 이 주소#access_token=... 으로 보낸다 (implicit 방식).
// 토큰이 주소의 # 뒤에 있어 서버는 못 보므로, 브라우저에서 꺼내 로그인 쿠키로 저장한다.
// 링크를 요청한 브라우저와 다른 기기(휴대폰 메일 앱 등)에서 눌러도 로그인된다.
export default function AuthFinishPage() {
  const [message, setMessage] = useState("로그인하는 중이에요...");

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    const error = hash.get("error_description") ?? query.get("error_description");

    if (!accessToken || !refreshToken) {
      window.location.replace(`/login?error=${encodeURIComponent(error ?? "로그인 링크가 올바르지 않아요")}`);
      return;
    }

    createClient()
      .auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error: sessionError }) => {
        if (sessionError) {
          window.location.replace(`/login?error=${encodeURIComponent(sessionError.message)}`);
        } else {
          setMessage("로그인됐어요!");
          window.location.replace("/");
        }
      });
  }, []);

  return <p className="mt-16 text-center text-sm text-slate-600">{message}</p>;
}
