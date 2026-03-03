// Uno Game Data & Deck Generation
export type UnoColor = 'pink' | 'blue' | 'green' | 'purple';
export type UnoValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'skip' | 'reverse' | 'draw2';
export type UnoSpecial = 'wild' | 'wild4';

export interface UnoCard {
  id: string;
  color: UnoColor | null;
  value: string;
  points: number;
}

const COLORS: UnoColor[] = ['pink', 'blue', 'green', 'purple'];

// Map card value to filename word
const VALUE_TO_WORD: Record<string, string> = {
  '0': 'zero',
  '1': 'one',
  '2': 'two',
  '3': 'three',
  '4': 'four',
  '5': 'five',
  '6': 'six',
  '7': 'seven',
  '8': 'eight',
  '9': 'nine',
  skip: 'skip',
  reverse: 'reverse',
  draw2: 'plus2',
};

// Map color to folder name
const COLOR_TO_FOLDER: Record<UnoColor, string> = {
  pink: 'Pink',
  blue: 'Blue',
  green: 'Green',
  purple: 'Purple',
};

/** Get the image path for a card */
export function getCardImagePath(card: UnoCard): string {
  if (card.value === 'wild') {
    return '/uno/change-color.png';
  }
  if (card.value === 'wild4') {
    return '/uno/plus four.png';
  }
  if (!card.color) return '';
  const folder = COLOR_TO_FOLDER[card.color];
  const word = VALUE_TO_WORD[card.value] || card.value;
  return `/uno/${folder}/${card.color}-${word}.png`;
}

export function generateUnoDeck(): UnoCard[] {
  const cards: UnoCard[] = [];
  let cardId = 0;

  // Colored cards (0-9, skip, reverse, draw2)
  COLORS.forEach(color => {
    // 0 appears once per color
    cards.push({
      id: `card-${cardId++}`,
      color,
      value: '0',
      points: 0,
    });

    // 1-9 appear twice per color
    for (let num = 1; num <= 9; num++) {
      for (let i = 0; i < 2; i++) {
        cards.push({
          id: `card-${cardId++}`,
          color,
          value: num.toString(),
          points: num,
        });
      }
    }

    // Skip, Reverse, Draw Two (twice each)
    for (let i = 0; i < 2; i++) {
      cards.push({
        id: `card-${cardId++}`,
        color,
        value: 'skip',
        points: 20,
      });
      cards.push({
        id: `card-${cardId++}`,
        color,
        value: 'reverse',
        points: 20,
      });
      cards.push({
        id: `card-${cardId++}`,
        color,
        value: 'draw2',
        points: 20,
      });
    }
  });

  // Wild cards (4 total)
  for (let i = 0; i < 4; i++) {
    cards.push({
      id: `card-${cardId++}`,
      color: null,
      value: 'wild',
      points: 50,
    });
  }

  // Wild Draw Four (4 total)
  for (let i = 0; i < 4; i++) {
    cards.push({
      id: `card-${cardId++}`,
      color: null,
      value: 'wild4',
      points: 50,
    });
  }

  // Shuffle the deck
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return cards;
}

export function getCardDisplayValue(value: string): string {
  switch (value) {
    case 'skip':
      return 'SKIP';
    case 'reverse':
      return 'REV';
    case 'draw2':
      return '+2';
    case 'wild':
      return 'W';
    case 'wild4':
      return 'W4';
    default:
      return value;
  }
}

export function isSpecialCard(value: string): boolean {
  return ['skip', 'reverse', 'draw2', 'wild', 'wild4'].includes(value);
}

export function canPlayCard(
  card: UnoCard,
  topCard: UnoCard,
  currentColor: UnoColor | null
): boolean {
  // Wild and Wild Draw Four can always be played
  if (card.value === 'wild' || card.value === 'wild4') {
    return true;
  }

  // If there's an active color (set by a wild), match that
  if (currentColor) {
    return card.color === currentColor;
  }

  // Otherwise, match color or value with top card
  if (card.color === topCard.color) {
    return true;
  }
  if (card.value === topCard.value) {
    return true;
  }

  return false;
}

export function cardEquals(a: UnoCard, b: UnoCard): boolean {
  return a.color === b.color && a.value === b.value;
}
