"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { loginIdToEmail } from "@/lib/login-id";

const input =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-navy focus:outline-none";

export default function LoginPage() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // 예전 메일 링크 로그인에 실패하면 /login?error=... 로 돌아온다.
  useEffect(() => {
    const e = new URLSearchParams(window.location.search).get("error");
    if (e) setError(`로그인에 실패했어요 (${e}). 다시 시도해 주세요.`);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const { error } = await createClient().auth.signInWithPassword({
      email: loginIdToEmail(id),
      password,
    });

    if (error) {
      setBusy(false);
      setError(
        error.code === "invalid_credentials"
          ? "아이디 또는 비밀번호가 맞지 않아요."
          : `로그인하지 못했어요. 잠시 후 다시 시도해 주세요. (${error.message})`,
      );
      return;
    }
    window.location.replace("/");
  }

  return (
    <div className="mx-auto mt-12 max-w-sm rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <h1 className="text-xl font-bold text-navy">로그인</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <input
          required
          autoComplete="username"
          autoCapitalize="none"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="아이디"
          className={input}
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          className={input}
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-navy px-3 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-60"
        >
          {busy ? "로그인 중..." : "로그인"}
        </button>
      </form>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <p className="mt-6 text-center text-sm text-slate-600">
        처음이신가요?{" "}
        <Link href="/signup" className="font-semibold text-navy underline">
          회원가입
        </Link>
      </p>
    </div>
  );
}
