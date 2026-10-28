"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_DOMAIN = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN ?? "hanyang.ac.kr";

// 메일 발송 실패 이유를 알려 줘야 관리자가 설정 문제인지 횟수 제한인지 구분할 수 있다.
function sendErrorMessage(error: { status?: number; code?: string; message: string }) {
  if (error.status === 429 || error.code?.startsWith("over_")) {
    return "짧은 시간에 너무 많이 요청했어요. 1분 뒤에 다시 시도해 주세요. 계속 안 되면 1시간 뒤에 시도해 주세요.";
  }
  if (error.message.toLowerCase().includes("sending")) {
    return `메일 서버 설정에 문제가 있어 메일을 보내지 못했어요. 관리자에게 알려 주세요. (${error.message})`;
  }
  return `메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요. (${error.message})`;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  // 메일 링크 로그인에 실패하면 /login?error=... 로 돌아온다.
  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get("error");
    if (error) {
      setStatus("error");
      setMessage(`로그인에 실패했어요 (${error}). 로그인 링크를 다시 받아 주세요.`);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();

    if (!trimmed.endsWith(`@${ALLOWED_DOMAIN}`)) {
      setStatus("error");
      setMessage(`학교 이메일(@${ALLOWED_DOMAIN})로만 로그인할 수 있어요.`);
      return;
    }

    setStatus("sending");
    // 메일 보내기에만 쓰는 클라이언트. implicit 방식이라 링크를 다른 기기에서 눌러도 된다 (/auth/finish 참고).
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
    );
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: `${window.location.origin}/auth/finish` },
    });

    if (error) {
      setStatus("error");
      setMessage(sendErrorMessage(error));
      return;
    }
    setStatus("sent");
    setMessage(`${trimmed} 으로 로그인 링크를 보냈어요. 메일함을 확인해 주세요.`);
  }

  return (
    <div className="mx-auto mt-12 max-w-sm rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <h1 className="text-xl font-bold text-navy">로그인</h1>
      <p className="mt-2 text-sm text-slate-600">
        학교 이메일을 입력하면 로그인 링크를 보내드려요. 비밀번호는 필요 없어요.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={`학번@${ALLOWED_DOMAIN}`}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-navy focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full rounded-md bg-navy px-3 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-60"
        >
          {status === "sending" ? "보내는 중..." : "로그인 링크 받기"}
        </button>
      </form>
      {message && (
        <p className={`mt-4 text-sm ${status === "error" ? "text-red-600" : "text-green-700"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
