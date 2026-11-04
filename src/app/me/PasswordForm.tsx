"use client";

import { useActionState } from "react";
import { changePassword, type PasswordState } from "./actions";

export function PasswordForm({ input }: { input: string }) {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePassword, null);

  return (
    <form action={action} className="mt-6 space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="font-semibold text-navy">비밀번호 바꾸기</h2>
      <label className="block text-sm">
        새 비밀번호
        <input name="password" type="password" required autoComplete="new-password" placeholder="8글자 이상" className={input} />
      </label>
      <label className="block text-sm">
        새 비밀번호 확인
        <input name="confirm" type="password" required autoComplete="new-password" className={input} />
      </label>
      <button
        disabled={pending}
        className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-60"
      >
        비밀번호 저장
      </button>
      {state && <p className={`text-sm ${state.ok ? "text-green-700" : "text-red-600"}`}>{state.message}</p>}
    </form>
  );
}
