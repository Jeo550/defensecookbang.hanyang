export type Board = "school_notice" | "dept_notice" | "assignment" | "free";
export type MaterialKind = "lecture" | "assignment" | "exam" | "etc";

export const BOARDS: Record<Board, { label: string; desc: string; editorsOnly: boolean }> = {
  school_notice: { label: "학교 공지", desc: "한양대 ERICA 공지사항", editorsOnly: true },
  dept_notice: { label: "학과 공지", desc: "국방전략기술공학과 공지사항", editorsOnly: true },
  assignment: { label: "과제", desc: "과목별 과제와 마감일", editorsOnly: true },
  free: { label: "자유게시판", desc: "질문과 이야기", editorsOnly: false },
};

export const MATERIAL_KINDS: Record<MaterialKind, string> = {
  lecture: "강의자료",
  assignment: "과제",
  exam: "시험 대비",
  etc: "기타",
};

export function isBoard(value: string): value is Board {
  return value in BOARDS;
}

export function formatDate(iso: string, withTime = false) {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}
