export type ExerciseKind = "run_3km" | "pushup" | "situp" | "pullup" | "swim" | "etc";

export const EXERCISES: Record<ExerciseKind, { label: string; unit: string; lowerIsBetter: boolean }> = {
  run_3km: { label: "3km 달리기", unit: "분:초", lowerIsBetter: true },
  pushup: { label: "팔굽혀펴기", unit: "회", lowerIsBetter: false },
  situp: { label: "윗몸일으키기", unit: "회", lowerIsBetter: false },
  pullup: { label: "턱걸이", unit: "회", lowerIsBetter: false },
  swim: { label: "수영", unit: "m", lowerIsBetter: false },
  etc: { label: "기타", unit: "", lowerIsBetter: false },
};

export function formatExercise(kind: ExerciseKind, value: number) {
  if (kind === "run_3km") {
    const m = Math.floor(value / 60);
    const s = Math.round(value % 60);
    return `${m}분 ${String(s).padStart(2, "0")}초`;
  }
  return `${value}${EXERCISES[kind].unit}`;
}

export function formatMinutes(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h ? `${h}시간 ${m}분` : `${m}분`;
}
