const MOOD_NORMALIZATION_MAP = {
  triste: 'Triste',
  nostalgico: 'Nostalgico',
  relajado: 'Relajado',
  ansioso: 'Ansioso',
  feliz: 'Feliz',
  motivado: 'Motivado',
  enojado: 'Enojado',
  emocionado: 'Emocionado',
};

const MOOD_DISPLAY_NAMES = {
  Enojado: 'Enfadado',
  Nostalgico: 'Nostálgico',
};

export function normalizeMoodName(mood) {
  if (!mood) return null;
  const normalized = String(mood)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();

  return MOOD_NORMALIZATION_MAP[normalized] || null;
}

export function getMoodDisplayName(mood) {
  return MOOD_DISPLAY_NAMES[mood] || mood;
}

export function getUniqueMoods(moods) {
  return Array.from(new Set((Array.isArray(moods) ? moods : []).filter(Boolean)));
}

export function getQuestionnaireMoods(questionnaire) {
  return getUniqueMoods(questionnaire?.moods)
    .map(normalizeMoodName)
    .filter(Boolean);
}

export default {
  normalizeMoodName,
  getMoodDisplayName,
  getUniqueMoods,
  getQuestionnaireMoods,
};
