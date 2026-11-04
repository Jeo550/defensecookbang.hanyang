// Supabase는 이메일이나 전화번호로만 비밀번호 로그인을 지원한다.
// 그래서 아이디를 실제로는 존재하지 않는 주소(.invalid)의 이메일로 바꿔 저장한다. 메일은 보내지 않는다.
export const ID_EMAIL_DOMAIN = "users.defensecookbang.invalid";

export const ID_PATTERN = /^[a-z0-9_]{4,20}$/;

// 예전에 학교 메일로 가입한 사람은 이메일 전체를 아이디처럼 입력한다.
export function loginIdToEmail(id: string) {
  const trimmed = id.trim().toLowerCase();
  return trimmed.includes("@") ? trimmed : `${trimmed}@${ID_EMAIL_DOMAIN}`;
}
