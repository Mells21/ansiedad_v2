export const recommendationMap = {
  bajo: [
    "Mantener una rutina de sueno estable y pausas de estudio saludables.",
    "Continuar con actividades recreativas que ayuden a regular el estres.",
    "Volver a responder el tamizaje si notas cambios emocionales importantes.",
  ],
  moderado: [
    "Coordinar seguimiento con el psicologo de la institucion esta semana.",
    "Reducir sobrecarga academica con bloques de estudio cortos y descansos.",
    "Conversar con un familiar o tutor sobre cambios de sueno o preocupaciones frecuentes.",
  ],
  alto: [
    "Priorizar una entrevista con el psicologo para evaluacion mas cercana.",
    "Avisar a la familia o tutor para reforzar acompanamiento inmediato.",
    "Reducir factores de estres y cuidar especialmente el descanso esta semana.",
  ],
} as const;

export function normalizeAnxietyScore(rawScore: number) {
  return Math.max(0, Math.min(25, Math.round((rawScore / 42) * 25)));
}

export function derivePreliminaryLabel(score: number) {
  if (score <= 7) {
    return "Normal";
  }
  if (score <= 9) {
    return "Leve";
  }
  if (score <= 14) {
    return "Moderada";
  }
  if (score <= 19) {
    return "Severa";
  }
  return "Extrema";
}

export function deriveRiskLevel(label: string): "bajo" | "moderado" | "alto" {
  if (label === "Moderada") {
    return "moderado";
  }
  if (label === "Severa" || label === "Extrema") {
    return "alto";
  }
  return "bajo";
}

export function mapSleepHours(hours: number) {
  if (hours >= 8 && hours <= 10) {
    return 3;
  }
  if (hours >= 6 && hours <= 7) {
    return 2;
  }
  if (hours < 5) {
    return 1;
  }
  return 0;
}

export function mapStudyHours(hours: number) {
  if (hours <= 1) {
    return 0;
  }
  if (hours <= 3) {
    return 1;
  }
  if (hours <= 5) {
    return 2;
  }
  return 3;
}
