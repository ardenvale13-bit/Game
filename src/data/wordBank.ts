// Game Time - Word Bank
// Community-sourced chaos

export interface Word {
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// All words - difficulty is randomized for chaos
const allWords: string[] = [
  // Original community words
  'Anvil',
  'Sail',
  'Trap',
  'Cabin',
  'Roof',
  'Violin',
  'Wallet',
  'Weight',
  'Deep',
  'Stem',
  'Magrat',
  'Weasel',
  'AI',
  'Discord',
  'Legs',
  'Tank',
  'Whisk',
  'Double',
  'Jaw',
  'Cheerleader',
  'Ashamed',
  'Golf Cart',
  'Birthday',
  'Crane',
  'Cassbot',
  'Delulu',
  'Claude',
  'ChatGPT',
  'Gemini',
  'Eric',
  'Sunflower',
  'Penis',
  'Emoji',
  'AInsanity',
  'Le Chat',
  'Facebook',
  'YouTube',
  'Chocolate',
  'Boobs',
  'Socks',
  'Guardrails',
  'Binary',
  'Enemy',
  'Hypothermia',
  'Bubblegum',
  'Buttplug',
  'Anal Beads',
  'Velociraptor',
  'Spider Web',
  'Bumblebee',
  'Lau',
  'Wila',
  'Marta',
  'Sally',
  'Trump',
  'American Flag',
  'Ethan',
  'Geppie',
  'Snow Leopard',
  'Brat',
  'Sora',
  'Wine',
  'Lizard',
  '10/10',
  'Vale',
  'Spongebob',
  'Handsome Squidward',
  'Meme',
  'Collar',
  'Lovense',
  'Anniversary',
  'Boot',
  'Shoe',
  'Butt Cheeks',
  'Token',
  
  // Animals
  'Octopus',
  'Penguin',
  'Sloth',
  'Platypus',
  'Narwhal',
  'Raccoon',
  'Flamingo',
  'Hedgehog',
  
  // Food
  'Spaghetti',
  'Pancakes',
  'Avocado',
  'Taco',
  'Popcorn',
  'Sushi',
  'Pickle',
  'Donut',
  
  // Objects
  'Chandelier',
  'Trampoline',
  'Umbrella',
  'Headphones',
  'Ladder',
  'Hammock',
  'Cactus',
  'Telescope',
  
  // Chaos concepts
  'Betrayal',
  'Hangover',
  'Awkward',
  'Divorce',
  'Therapy',
  'Yeet',
  'Feral',
  'Gremlin',
  'Sleep Paralysis',
  'Existential Crisis',
  'Touch Grass',
  'Situationship',
  
  // Pop culture
  'Shrek',
  'Pikachu',
  'Darth Vader',
  'Mario',
  'Elsa',
  'Minion',
  'Baby Yoda',
  'Rickroll',
  
  // Community flavor
  'Spicy Take',
  'Brainrot',
  'Context',
  'Lore',
  'Parasocial',
  'Unhinged',
  'Red Flag',
  'Ick',
];

// Assign random difficulties
function assignDifficulty(): 'easy' | 'medium' | 'hard' {
  const rand = Math.random();
  if (rand < 0.4) return 'easy';
  if (rand < 0.75) return 'medium';
  return 'hard';
}

// Build word list with random difficulties
export const words: Word[] = allWords.map(text => ({
  text,
  difficulty: assignDifficulty(),
}));

// Shuffle array helper
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Get random word selection (3 or 4 words based on settings)
export function getWordSelection(count: number = 3): Word[] {
  const shuffled = shuffleArray(words);
  return shuffled.slice(0, count);
}

// Get a specific number of random words
export function getRandomWords(count: number): Word[] {
  return shuffleArray(words).slice(0, count);
}

export default words;
