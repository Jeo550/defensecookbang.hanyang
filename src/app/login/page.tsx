"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ALLOWED_DOMAIN = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN ?? "hanyang.ac.kr";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();

    if (!trimmed.endsWith(`@${ALLOWED_DOMAIN}`)) {
      setStatus("error");
      setMessage(`학교 이메일(@${ALLOWED_DOMAIN})로만 로그인할 수 있어요.`);
      return;
    }

    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setStatus("error");
      setMessage("메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요.");
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
