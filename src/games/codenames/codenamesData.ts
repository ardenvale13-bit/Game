// Codenames — Word bank and board generation utilities

export type CardType = 'pink' | 'blue' | 'neutral' | 'assassin';
export type TeamColor = 'pink' | 'blue';
export type PlayerRole = 'spymaster' | 'operative';

export interface CodenamesCard {
  index: number;
  word: string;
  type: CardType; // only visible to spymasters until revealed
  isRevealed: boolean;
  votes: { playerId: string; avatarFilename: string }[]; // operatives considering this card
}

// 100 placeholder words — replace later with custom list
const WORD_BANK: string[] = [
  'APPLE', 'BANK', 'CASTLE', 'DIAMOND', 'ENGINE',
  'FIRE', 'GHOST', 'HAMMER', 'ICE', 'JUNGLE',
  'KNIGHT', 'LASER', 'MOON', 'NEEDLE', 'OCEAN',
  'PIANO', 'QUEEN', 'ROCKET', 'SHADOW', 'TOWER',
  'UNICORN', 'VOLCANO', 'WHALE', 'XRAY', 'YACHT',
  'ZOMBIE', 'ANCHOR', 'BRIDGE', 'CLOUD', 'DRAGON',
  'EAGLE', 'FLAME', 'GARDEN', 'HARBOR', 'ISLAND',
  'JESTER', 'KITE', 'LEMON', 'MIRROR', 'NINJA',
  'ORBIT', 'PARROT', 'RADAR', 'SPHINX', 'THRONE',
  'UMBRELLA', 'VIPER', 'WIZARD', 'ARROW', 'BUTTER',
  'CRYSTAL', 'DUNGEON', 'ECLIPSE', 'FALCON', 'GLACIER',
  'HELMET', 'IRON', 'JAGUAR', 'KERNEL', 'LANTERN',
  'MAGNET', 'NEBULA', 'OPAL', 'PHOENIX', 'QUARTZ',
  'RAVEN', 'SKULL', 'TIMBER', 'UNDEAD', 'VELVET',
  'WAFFLE', 'PYTHON', 'BLIZZARD', 'COMPASS', 'DAGGER',
  'EMBER', 'FOSSIL', 'GOBLIN', 'HYDRA', 'IVORY',
  'JOKER', 'KAYAK', 'LOTUS', 'MARBLE', 'NOVA',
  'OLIVE', 'PRISM', 'RIDDLE', 'STORM', 'TRIDENT',
  'VAPOR', 'WRAITH', 'CEDAR', 'BREEZE', 'SIREN',
  'TEMPLE', 'COMET', 'ATLAS', 'BEACON', 'CRYPT',
];

/** Shuffle an array (Fisher-Yates) */
export function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generate a 5×5 Codenames board.
 * Starting team gets 9 cards, other team gets 8, 7 neutral, 1 assassin.
 */
export function generateBoard(startingTeam: TeamColor): CodenamesCard[] {
  // Pick 25 random words
  const words = shuffleArray(WORD_BANK).slice(0, 25);

  // Assign card types: 9 starting, 8 other, 7 neutral, 1 assassin
  const otherTeam: TeamColor = startingTeam === 'pink' ? 'blue' : 'pink';
  const types: CardType[] = [
    ...Array(9).fill(startingTeam) as CardType[],
    ...Array(8).fill(otherTeam) as CardType[],
    ...Array(7).fill('neutral' as CardType),
    'assassin' as CardType,
  ];
  const shuffledTypes = shuffleArray(types);

  return words.map((word, index) => ({
    index,
    word,
    type: shuffledTypes[index],
    isRevealed: false,
    votes: [],
  }));
}

/** Count remaining unrevealed cards of a given type */
export function countRemaining(board: CodenamesCard[], type: CardType): number {
  return board.filter(c => c.type === type && !c.isRevealed).length;
}

/** Get the image path for a revealed card */
export function getCardRevealImage(type: CardType): string {
  switch (type) {
    case 'pink': return '/codenames/pink-team-icon.png';
    case 'blue': return '/codenames/blue-team-icon.png';
    case 'assassin': return '/codenames/bomb-card.png';
    case 'neutral': return '/codenames/no-team-icon.png';
  }
}

/** Pick a random starting team */
export function pickStartingTeam(): TeamColor {
  return Math.random() < 0.5 ? 'pink' : 'blue';
}
