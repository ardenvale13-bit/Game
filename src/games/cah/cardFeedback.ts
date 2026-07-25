export type CardRating = 'favorite' | 'veto';

interface FeedbackCounts {
  favorites: number;
  vetoes: number;
}

type PersonalFeedback = Record<string, CardRating>;
type AggregateFeedback = Record<string, FeedbackCounts>;

const PERSONAL_KEY = 'party_cah_feedback_personal_v1';
const AGGREGATE_KEY = 'party_cah_feedback_aggregate_v1';
const VETO_THRESHOLD = 2;

function readJson<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback;

  try {
    return JSON.parse(localStorage.getItem(key) || '') as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getPersonalCardRating(cardId: string): CardRating | null {
  return readJson<PersonalFeedback>(PERSONAL_KEY, {})[cardId] ?? null;
}

export function setPersonalCardRating(
  cardId: string,
  rating: CardRating | null,
): CardRating | null {
  const feedback = readJson<PersonalFeedback>(PERSONAL_KEY, {});
  const previous = feedback[cardId] ?? null;

  if (rating) feedback[cardId] = rating;
  else delete feedback[cardId];

  writeJson(PERSONAL_KEY, feedback);
  return previous;
}

export function recordAggregateCardRating(
  cardId: string,
  previous: CardRating | null,
  next: CardRating | null,
): void {
  const feedback = readJson<AggregateFeedback>(AGGREGATE_KEY, {});
  const counts = feedback[cardId] ?? { favorites: 0, vetoes: 0 };

  if (previous === 'favorite') counts.favorites = Math.max(0, counts.favorites - 1);
  if (previous === 'veto') counts.vetoes = Math.max(0, counts.vetoes - 1);
  if (next === 'favorite') counts.favorites += 1;
  if (next === 'veto') counts.vetoes += 1;

  feedback[cardId] = counts;
  writeJson(AGGREGATE_KEY, feedback);
}

export function getVetoedBlackCardIds(): string[] {
  const feedback = readJson<AggregateFeedback>(AGGREGATE_KEY, {});
  return Object.entries(feedback)
    .filter(([, counts]) => counts.vetoes >= VETO_THRESHOLD)
    .map(([cardId]) => cardId);
}

export function getFavoriteBlackCardIds(): string[] {
  const feedback = readJson<PersonalFeedback>(PERSONAL_KEY, {});
  return Object.entries(feedback)
    .filter(([, rating]) => rating === 'favorite')
    .map(([cardId]) => cardId);
}
