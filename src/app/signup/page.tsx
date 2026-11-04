"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ID_PATTERN, loginIdToEmail } from "@/lib/login-id";

const input =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-navy focus:outline-none";

export default function SignupPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const id = String(form.get("id") ?? "").trim().toLowerCase();
    const name = String(form.get("name") ?? "").trim();
    const year = String(form.get("student_year") ?? "");
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    if (!ID_PATTERN.test(id)) {
      setError("아이디는 영어 소문자, 숫자, _ 로 4~20글자여야 해요.");
      return;
    }
    if (password.length < 8) {
      setError("비밀번호는 8글자 이상이어야 해요.");
      return;
    }
    if (password !== confirm) {
      setError("비밀번호 확인이 서로 달라요.");
      return;
    }

    setBusy(true);
    setError("");
    const { data, error } = await createClient().auth.signUp({
      email: loginIdToEmail(id),
      password,
      options: { data: { username: id, name, student_year: year } },
    });

    if (error) {
      setBusy(false);
      setError(
        error.code === "user_already_exists"
          ? "이미 있는 아이디예요. 다른 아이디를 써 주세요."
          : `가입하지 못했어요. (${error.message})`,
      );
      return;
    }
    if (!data.session) {
      // Supabase의 "Confirm email"이 켜져 있으면 세션 없이 확인 메일을 기다린다. 아이디 가입에서는 꺼야 한다.
      setBusy(false);
      setError("가입 설정에 문제가 있어요. 관리자에게 알려 주세요. (Confirm email 설정)");
      return;
    }
    window.location.replace("/pending");
  }

  return (
    <div className="mx-auto mt-12 max-w-sm rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <h1 className="text-xl font-bold text-navy">회원가입</h1>
      <p className="mt-2 text-sm text-slate-600">가입하면 관리자가 승인한 뒤에 사이트를 쓸 수 있어요.</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm">
          아이디
          <input name="id" required autoComplete="username" autoCapitalize="none" placeholder="영어 소문자·숫자 4~20글자" className={input} />
        </label>
        <label className="block text-sm">
          이름
          <input name="name" required maxLength={30} placeholder="관리자가 누군지 알아볼 수 있게 실명으로" className={input} />
        </label>
        <label className="block text-sm">
          학년
          <select name="student_year" defaultValue="" className={input}>
            <option value="">선택 안 함</option>
            {[1, 2, 3, 4].map((y) => (
              <option key={y} value={y}>
                {y}학년
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          비밀번호
          <input name="password" type="password" required autoComplete="new-password" placeholder="8글자 이상" className={input} />
        </label>
        <label className="block text-sm">
          비밀번호 확인
          <input name="confirm" type="password" required autoComplete="new-password" className={input} />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-navy px-3 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-60"
        >
          {busy ? "가입하는 중..." : "가입 신청"}
        </button>
      </form>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <p className="mt-6 text-center text-sm text-slate-600">
        이미 계정이 있나요?{" "}
        <Link href="/login" className="font-semibold text-navy underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
