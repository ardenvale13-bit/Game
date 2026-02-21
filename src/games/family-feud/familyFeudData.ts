// Family Feud - Question Bank & Matching Utilities

// ── Types ──────────────────────────────────────────────────────────────
export interface FFAnswer {
  text: string;
  points: number;
  synonyms?: string[];
}

export interface FFQuestion {
  id: string;
  category: FFCategory;
  question: string;
  answers: FFAnswer[];
}

export type FFCategory =
  | 'animals'
  | 'food'
  | 'entertainment'
  | 'everyday'
  | 'people'
  | 'holidays'
  | 'sports'
  | 'technology'
  | 'school'
  | 'travel';

export const CATEGORY_NAMES: Record<FFCategory, string> = {
  animals: 'Animals',
  food: 'Food & Drink',
  entertainment: 'Entertainment',
  everyday: 'Everyday Life',
  people: 'People & Relationships',
  holidays: 'Holidays & Celebrations',
  sports: 'Sports & Games',
  technology: 'Technology',
  school: 'School & Work',
  travel: 'Travel & Places',
};

// ── Matching Utilities ─────────────────────────────────────────────────

/** Normalize input for fuzzy matching */
export function normalizeInput(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Check if a guess matches a single answer.
 * Uses normalized exact match, substring match, and synonym matching.
 */
export function matchAnswer(
  guess: string,
  answer: { text: string; points: number; synonyms?: string[] }
): boolean {
  const normGuess = normalizeInput(guess);
  if (!normGuess) return false;

  const normAnswer = normalizeInput(answer.text);

  // Exact match
  if (normGuess === normAnswer) return true;

  // Guess contains the answer or vice versa
  if (normGuess.includes(normAnswer) || normAnswer.includes(normGuess)) return true;

  // Check synonyms
  if (answer.synonyms) {
    for (const syn of answer.synonyms) {
      const normSyn = normalizeInput(syn);
      if (normGuess === normSyn) return true;
      if (normGuess.includes(normSyn) || normSyn.includes(normGuess)) return true;
    }
  }

  return false;
}

/**
 * Find the index of the first matching answer in a list.
 * Handles both full FFAnswer objects (with synonyms) and stripped {text, points} objects.
 * When synonyms are stripped, falls back to looking up the original question for synonym data.
 */
export function findMatchingAnswer(
  guess: string,
  answers: { text: string; points: number; synonyms?: string[] }[]
): number {
  // First try matching with whatever data we have (including synonyms if present)
  for (let i = 0; i < answers.length; i++) {
    if (matchAnswer(guess, answers[i])) return i;
  }

  // If no synonyms were present on any answer, try looking up originals from QUESTIONS
  const hasSynonyms = answers.some((a) => a.synonyms && a.synonyms.length > 0);
  if (!hasSynonyms && answers.length > 0) {
    // Find the original question by matching answer texts
    const originalQ = QUESTIONS.find((q) =>
      q.answers.some((qa) => answers.some((a) => normalizeInput(a.text) === normalizeInput(qa.text)))
    );
    if (originalQ) {
      for (let i = 0; i < answers.length; i++) {
        const original = originalQ.answers.find(
          (qa) => normalizeInput(qa.text) === normalizeInput(answers[i].text)
        );
        if (original && matchAnswer(guess, original)) return i;
      }
    }
  }

  return -1;
}

// ── Question tracking ──────────────────────────────────────────────────
let _usedIds = new Set<string>();

export function getRandomQuestion(usedQuestionIds: string[]): FFQuestion | null {
  const used = new Set(usedQuestionIds);
  const available = QUESTIONS.filter((q) => !used.has(q.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

export function resetUsedQuestions(): void {
  _usedIds.clear();
}

// ── Question Bank ──────────────────────────────────────────────────────
export const QUESTIONS: FFQuestion[] = [
  // ═══════════════════════════════════════════════════════════════════
  // ANIMALS (20+ questions)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'ani-01',
    category: 'animals',
    question: 'Name an animal you might see at the zoo.',
    answers: [
      { text: 'Lion', points: 25, synonyms: ['lions', 'mountain lion'] },
      { text: 'Elephant', points: 20, synonyms: ['elephants'] },
      { text: 'Monkey', points: 18, synonyms: ['monkeys', 'ape', 'chimp', 'chimpanzee', 'gorilla'] },
      { text: 'Giraffe', points: 15, synonyms: ['giraffes'] },
      { text: 'Tiger', points: 12, synonyms: ['tigers'] },
      { text: 'Bear', points: 10, synonyms: ['bears', 'polar bear', 'grizzly'] },
    ],
  },
  {
    id: 'ani-02',
    category: 'animals',
    question: 'Name a pet people keep in their house.',
    answers: [
      { text: 'Dog', points: 30, synonyms: ['dogs', 'puppy', 'puppies', 'doggy'] },
      { text: 'Cat', points: 28, synonyms: ['cats', 'kitten', 'kittens', 'kitty'] },
      { text: 'Fish', points: 18, synonyms: ['goldfish', 'betta', 'tropical fish'] },
      { text: 'Hamster', points: 12, synonyms: ['hamsters', 'gerbil'] },
      { text: 'Bird', points: 8, synonyms: ['birds', 'parrot', 'parakeet', 'budgie'] },
      { text: 'Rabbit', points: 4, synonyms: ['rabbits', 'bunny', 'bunnies'] },
    ],
  },
  {
    id: 'ani-03',
    category: 'animals',
    question: 'Name an animal that scares people.',
    answers: [
      { text: 'Snake', points: 30, synonyms: ['snakes', 'serpent'] },
      { text: 'Spider', points: 25, synonyms: ['spiders', 'tarantula'] },
      { text: 'Shark', points: 18, synonyms: ['sharks', 'great white'] },
      { text: 'Bear', points: 12, synonyms: ['bears', 'grizzly'] },
      { text: 'Rat', points: 10, synonyms: ['rats', 'mouse', 'mice'] },
      { text: 'Bee', points: 5, synonyms: ['bees', 'wasp', 'hornet'] },
    ],
  },
  {
    id: 'ani-04',
    category: 'animals',
    question: 'Name an animal that makes a lot of noise.',
    answers: [
      { text: 'Dog', points: 28, synonyms: ['dogs', 'puppy'] },
      { text: 'Rooster', points: 22, synonyms: ['chicken', 'chickens', 'hen'] },
      { text: 'Cat', points: 16, synonyms: ['cats'] },
      { text: 'Parrot', points: 14, synonyms: ['parrots', 'bird', 'birds'] },
      { text: 'Monkey', points: 12, synonyms: ['monkeys', 'ape'] },
      { text: 'Donkey', points: 8, synonyms: ['donkeys', 'mule'] },
    ],
  },
  {
    id: 'ani-05',
    category: 'animals',
    question: 'Name an animal with stripes.',
    answers: [
      { text: 'Zebra', points: 35, synonyms: ['zebras'] },
      { text: 'Tiger', points: 30, synonyms: ['tigers'] },
      { text: 'Bee', points: 15, synonyms: ['bees', 'bumblebee'] },
      { text: 'Skunk', points: 10, synonyms: ['skunks'] },
      { text: 'Snake', points: 10, synonyms: ['snakes', 'coral snake'] },
    ],
  },
  {
    id: 'ani-06',
    category: 'animals',
    question: 'Name an animal that lives in the ocean.',
    answers: [
      { text: 'Shark', points: 25, synonyms: ['sharks'] },
      { text: 'Dolphin', points: 22, synonyms: ['dolphins'] },
      { text: 'Whale', points: 18, synonyms: ['whales', 'blue whale', 'orca'] },
      { text: 'Fish', points: 15, synonyms: ['fishes', 'clownfish', 'tuna'] },
      { text: 'Octopus', points: 10, synonyms: ['squid'] },
      { text: 'Sea Turtle', points: 10, synonyms: ['turtle', 'turtles'] },
    ],
  },
  {
    id: 'ani-07',
    category: 'animals',
    question: 'Name an animal you would NOT want in your bed.',
    answers: [
      { text: 'Snake', points: 30, synonyms: ['snakes'] },
      { text: 'Spider', points: 22, synonyms: ['spiders'] },
      { text: 'Bear', points: 18, synonyms: ['bears', 'grizzly'] },
      { text: 'Rat', points: 15, synonyms: ['rats', 'mouse'] },
      { text: 'Skunk', points: 10, synonyms: ['skunks'] },
      { text: 'Alligator', points: 5, synonyms: ['crocodile', 'croc', 'gator'] },
    ],
  },
  {
    id: 'ani-08',
    category: 'animals',
    question: 'Name a baby animal that people think is cute.',
    answers: [
      { text: 'Puppy', points: 28, synonyms: ['puppies', 'baby dog'] },
      { text: 'Kitten', points: 25, synonyms: ['kittens', 'baby cat'] },
      { text: 'Bunny', points: 18, synonyms: ['baby rabbit', 'baby bunny'] },
      { text: 'Duckling', points: 12, synonyms: ['baby duck', 'ducklings'] },
      { text: 'Lamb', points: 10, synonyms: ['baby sheep', 'lambs'] },
      { text: 'Panda Cub', points: 7, synonyms: ['baby panda', 'panda'] },
    ],
  },
  {
    id: 'ani-09',
    category: 'animals',
    question: 'Name an animal that runs fast.',
    answers: [
      { text: 'Cheetah', points: 35, synonyms: ['cheetahs'] },
      { text: 'Horse', points: 25, synonyms: ['horses', 'stallion'] },
      { text: 'Dog', points: 15, synonyms: ['dogs', 'greyhound'] },
      { text: 'Deer', points: 12, synonyms: ['deers', 'gazelle'] },
      { text: 'Rabbit', points: 8, synonyms: ['rabbits', 'bunny', 'hare'] },
      { text: 'Ostrich', points: 5, synonyms: [] },
    ],
  },
  {
    id: 'ani-10',
    category: 'animals',
    question: 'Name an animal that starts with the letter B.',
    answers: [
      { text: 'Bear', points: 28, synonyms: ['bears'] },
      { text: 'Bird', points: 22, synonyms: ['birds'] },
      { text: 'Butterfly', points: 18, synonyms: ['butterflies'] },
      { text: 'Bat', points: 15, synonyms: ['bats'] },
      { text: 'Bee', points: 10, synonyms: ['bees'] },
      { text: 'Buffalo', points: 7, synonyms: ['bison', 'bull'] },
    ],
  },
  {
    id: 'ani-11',
    category: 'animals',
    question: 'Name an animal people are allergic to.',
    answers: [
      { text: 'Cat', points: 35, synonyms: ['cats'] },
      { text: 'Dog', points: 28, synonyms: ['dogs'] },
      { text: 'Bee', points: 15, synonyms: ['bees', 'wasp'] },
      { text: 'Horse', points: 12, synonyms: ['horses'] },
      { text: 'Rabbit', points: 10, synonyms: ['rabbits', 'bunny'] },
    ],
  },
  {
    id: 'ani-12',
    category: 'animals',
    question: 'Name an animal you might find on a farm.',
    answers: [
      { text: 'Cow', points: 25, synonyms: ['cows', 'cattle', 'bull'] },
      { text: 'Chicken', points: 22, synonyms: ['chickens', 'hen', 'rooster'] },
      { text: 'Horse', points: 18, synonyms: ['horses', 'pony'] },
      { text: 'Pig', points: 15, synonyms: ['pigs', 'hog'] },
      { text: 'Sheep', points: 12, synonyms: ['lamb', 'ram'] },
      { text: 'Goat', points: 8, synonyms: ['goats'] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // FOOD & DRINK (20+ questions)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'food-01',
    category: 'food',
    question: 'Name a topping people put on pizza.',
    answers: [
      { text: 'Pepperoni', points: 30, synonyms: ['pepperonis'] },
      { text: 'Cheese', points: 22, synonyms: ['extra cheese', 'mozzarella'] },
      { text: 'Mushrooms', points: 16, synonyms: ['mushroom'] },
      { text: 'Sausage', points: 14, synonyms: ['italian sausage'] },
      { text: 'Olives', points: 10, synonyms: ['olive', 'black olives'] },
      { text: 'Pineapple', points: 8, synonyms: ['ham and pineapple', 'hawaiian'] },
    ],
  },
  {
    id: 'food-02',
    category: 'food',
    question: 'Name something people eat for breakfast.',
    answers: [
      { text: 'Eggs', points: 25, synonyms: ['egg', 'scrambled eggs', 'fried eggs'] },
      { text: 'Cereal', points: 22, synonyms: ['cereals'] },
      { text: 'Toast', points: 18, synonyms: ['bread', 'toasted bread'] },
      { text: 'Pancakes', points: 15, synonyms: ['pancake', 'flapjacks', 'hotcakes'] },
      { text: 'Bacon', points: 12, synonyms: [] },
      { text: 'Oatmeal', points: 8, synonyms: ['porridge', 'oats'] },
    ],
  },
  {
    id: 'food-03',
    category: 'food',
    question: 'Name a flavor of ice cream.',
    answers: [
      { text: 'Chocolate', points: 28, synonyms: ['choc', 'chocolate chip'] },
      { text: 'Vanilla', points: 25, synonyms: ['french vanilla'] },
      { text: 'Strawberry', points: 20, synonyms: [] },
      { text: 'Mint Chocolate Chip', points: 12, synonyms: ['mint', 'mint choc chip'] },
      { text: 'Cookie Dough', points: 10, synonyms: ['cookies and cream', 'cookies n cream'] },
      { text: 'Rocky Road', points: 5, synonyms: [] },
    ],
  },
  {
    id: 'food-04',
    category: 'food',
    question: 'Name a fast food restaurant.',
    answers: [
      { text: "McDonald's", points: 30, synonyms: ['mcdonalds', 'maccas', 'mcd'] },
      { text: 'Chick-fil-A', points: 20, synonyms: ['chickfila', 'chick fil a'] },
      { text: "Wendy's", points: 16, synonyms: ['wendys'] },
      { text: 'Taco Bell', points: 14, synonyms: ['tacobell'] },
      { text: 'Burger King', points: 12, synonyms: ['bk'] },
      { text: 'KFC', points: 8, synonyms: ['kentucky fried chicken'] },
    ],
  },
  {
    id: 'food-05',
    category: 'food',
    question: 'Name a fruit that is red.',
    answers: [
      { text: 'Apple', points: 28, synonyms: ['apples', 'red apple'] },
      { text: 'Strawberry', points: 25, synonyms: ['strawberries'] },
      { text: 'Cherry', points: 18, synonyms: ['cherries'] },
      { text: 'Raspberry', points: 14, synonyms: ['raspberries'] },
      { text: 'Watermelon', points: 10, synonyms: ['water melon'] },
      { text: 'Tomato', points: 5, synonyms: ['tomatoes'] },
    ],
  },
  {
    id: 'food-06',
    category: 'food',
    question: 'Name a condiment people put on a hot dog.',
    answers: [
      { text: 'Ketchup', points: 30, synonyms: ['catsup'] },
      { text: 'Mustard', points: 28, synonyms: ['yellow mustard'] },
      { text: 'Relish', points: 18, synonyms: [] },
      { text: 'Onions', points: 12, synonyms: ['onion', 'diced onions'] },
      { text: 'Chili', points: 8, synonyms: ['chilli'] },
      { text: 'Mayo', points: 4, synonyms: ['mayonnaise'] },
    ],
  },
  {
    id: 'food-07',
    category: 'food',
    question: 'Name something you drink in the morning.',
    answers: [
      { text: 'Coffee', points: 35, synonyms: ['espresso', 'latte', 'cappuccino'] },
      { text: 'Orange Juice', points: 25, synonyms: ['oj', 'juice'] },
      { text: 'Water', points: 18, synonyms: [] },
      { text: 'Tea', points: 12, synonyms: [] },
      { text: 'Milk', points: 10, synonyms: [] },
    ],
  },
  {
    id: 'food-08',
    category: 'food',
    question: 'Name a food you eat at a barbecue.',
    answers: [
      { text: 'Hamburger', points: 28, synonyms: ['burger', 'burgers', 'hamburgers'] },
      { text: 'Hot Dog', points: 22, synonyms: ['hot dogs', 'hotdog', 'sausage'] },
      { text: 'Ribs', points: 18, synonyms: ['bbq ribs', 'spare ribs'] },
      { text: 'Corn on the Cob', points: 14, synonyms: ['corn', 'corn cob'] },
      { text: 'Chicken', points: 12, synonyms: ['grilled chicken', 'bbq chicken'] },
      { text: 'Potato Salad', points: 6, synonyms: ['coleslaw', 'cole slaw'] },
    ],
  },
  {
    id: 'food-09',
    category: 'food',
    question: 'Name a food people eat when they are sick.',
    answers: [
      { text: 'Chicken Soup', points: 35, synonyms: ['soup', 'chicken noodle soup'] },
      { text: 'Crackers', points: 22, synonyms: ['saltines'] },
      { text: 'Toast', points: 18, synonyms: ['dry toast', 'bread'] },
      { text: 'Popsicle', points: 12, synonyms: ['popsicles', 'ice pop'] },
      { text: 'Ginger Ale', points: 8, synonyms: ['sprite', '7up', 'soda'] },
      { text: 'Rice', points: 5, synonyms: ['plain rice', 'white rice'] },
    ],
  },
  {
    id: 'food-10',
    category: 'food',
    question: 'Name a popular candy.',
    answers: [
      { text: 'Snickers', points: 22, synonyms: [] },
      { text: "Reese's", points: 20, synonyms: ['reeses', 'reese cups', 'peanut butter cups'] },
      { text: 'M&Ms', points: 18, synonyms: ['m and ms', 'mnms'] },
      { text: 'Skittles', points: 16, synonyms: [] },
      { text: 'Kit Kat', points: 14, synonyms: ['kitkat'] },
      { text: 'Twix', points: 10, synonyms: [] },
    ],
  },
  {
    id: 'food-11',
    category: 'food',
    question: 'Name something people add to their coffee.',
    answers: [
      { text: 'Sugar', points: 28, synonyms: ['sweetener'] },
      { text: 'Cream', points: 25, synonyms: ['creamer', 'half and half', 'milk'] },
      { text: 'Flavored Syrup', points: 18, synonyms: ['syrup', 'vanilla syrup', 'caramel'] },
      { text: 'Whipped Cream', points: 14, synonyms: ['whip cream'] },
      { text: 'Ice', points: 10, synonyms: ['iced'] },
      { text: 'Cinnamon', points: 5, synonyms: [] },
    ],
  },
  {
    id: 'food-12',
    category: 'food',
    question: 'Name a food that is messy to eat.',
    answers: [
      { text: 'Ribs', points: 25, synonyms: ['bbq ribs', 'spare ribs'] },
      { text: 'Spaghetti', points: 22, synonyms: ['pasta', 'noodles'] },
      { text: 'Tacos', points: 18, synonyms: ['taco'] },
      { text: 'Wings', points: 15, synonyms: ['chicken wings', 'buffalo wings'] },
      { text: 'Ice Cream', points: 12, synonyms: ['ice cream cone'] },
      { text: 'Watermelon', points: 8, synonyms: ['water melon'] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // ENTERTAINMENT (20+ questions)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'ent-01',
    category: 'entertainment',
    question: 'Name something people do at a party.',
    answers: [
      { text: 'Dance', points: 28, synonyms: ['dancing'] },
      { text: 'Drink', points: 22, synonyms: ['drinking', 'drink alcohol'] },
      { text: 'Eat', points: 18, synonyms: ['eating', 'eat food'] },
      { text: 'Play Games', points: 14, synonyms: ['games', 'party games'] },
      { text: 'Talk', points: 10, synonyms: ['socialize', 'chat', 'mingle'] },
      { text: 'Karaoke', points: 8, synonyms: ['sing', 'singing'] },
    ],
  },
  {
    id: 'ent-02',
    category: 'entertainment',
    question: 'Name a type of movie.',
    answers: [
      { text: 'Comedy', points: 25, synonyms: ['funny', 'comedies'] },
      { text: 'Horror', points: 22, synonyms: ['scary', 'horror movie'] },
      { text: 'Action', points: 20, synonyms: ['action movie'] },
      { text: 'Romance', points: 15, synonyms: ['romantic', 'rom com', 'love story'] },
      { text: 'Sci-Fi', points: 10, synonyms: ['science fiction', 'scifi'] },
      { text: 'Drama', points: 8, synonyms: ['dramas'] },
    ],
  },
  {
    id: 'ent-03',
    category: 'entertainment',
    question: 'Name a popular board game.',
    answers: [
      { text: 'Monopoly', points: 30, synonyms: [] },
      { text: 'Scrabble', points: 20, synonyms: [] },
      { text: 'Chess', points: 16, synonyms: [] },
      { text: 'Clue', points: 14, synonyms: ['cluedo'] },
      { text: 'Sorry', points: 10, synonyms: [] },
      { text: 'Risk', points: 10, synonyms: [] },
    ],
  },
  {
    id: 'ent-04',
    category: 'entertainment',
    question: 'Name something people binge-watch on TV.',
    answers: [
      { text: 'Reality Shows', points: 22, synonyms: ['reality tv', 'reality', 'love island', 'survivor'] },
      { text: 'Crime Shows', points: 20, synonyms: ['crime', 'true crime', 'criminal minds'] },
      { text: 'Sitcoms', points: 18, synonyms: ['comedies', 'the office', 'friends'] },
      { text: 'Drama Series', points: 16, synonyms: ['drama', 'dramas'] },
      { text: 'Anime', points: 14, synonyms: ['cartoons'] },
      { text: 'Documentaries', points: 10, synonyms: ['documentary', 'docs'] },
    ],
  },
  {
    id: 'ent-05',
    category: 'entertainment',
    question: 'Name a musical instrument.',
    answers: [
      { text: 'Guitar', points: 28, synonyms: ['guitars', 'acoustic guitar', 'electric guitar'] },
      { text: 'Piano', points: 25, synonyms: ['keyboard'] },
      { text: 'Drums', points: 20, synonyms: ['drum', 'drum set', 'drumkit'] },
      { text: 'Violin', points: 12, synonyms: ['fiddle'] },
      { text: 'Trumpet', points: 8, synonyms: [] },
      { text: 'Flute', points: 7, synonyms: [] },
    ],
  },
  {
    id: 'ent-06',
    category: 'entertainment',
    question: 'Name a popular video game.',
    answers: [
      { text: 'Fortnite', points: 22, synonyms: ['fort nite'] },
      { text: 'Minecraft', points: 20, synonyms: ['mine craft'] },
      { text: 'Call of Duty', points: 18, synonyms: ['cod', 'call of duty warzone'] },
      { text: 'Mario', points: 16, synonyms: ['super mario', 'mario bros', 'mario kart'] },
      { text: 'GTA', points: 14, synonyms: ['grand theft auto', 'gta 5', 'gta 6'] },
      { text: 'Roblox', points: 10, synonyms: [] },
    ],
  },
  {
    id: 'ent-07',
    category: 'entertainment',
    question: 'Name something people do on their phone.',
    answers: [
      { text: 'Text', points: 25, synonyms: ['texting', 'message', 'messaging'] },
      { text: 'Social Media', points: 22, synonyms: ['scroll', 'tiktok', 'instagram', 'facebook'] },
      { text: 'Play Games', points: 18, synonyms: ['gaming', 'games'] },
      { text: 'Call', points: 15, synonyms: ['phone call', 'calling'] },
      { text: 'Watch Videos', points: 12, synonyms: ['youtube', 'watch youtube', 'videos'] },
      { text: 'Take Photos', points: 8, synonyms: ['pictures', 'selfies', 'camera'] },
    ],
  },
  {
    id: 'ent-08',
    category: 'entertainment',
    question: 'Name a streaming service.',
    answers: [
      { text: 'Netflix', points: 30, synonyms: [] },
      { text: 'Disney+', points: 22, synonyms: ['disney plus', 'disney'] },
      { text: 'Hulu', points: 16, synonyms: [] },
      { text: 'Amazon Prime', points: 14, synonyms: ['prime video', 'amazon'] },
      { text: 'YouTube', points: 10, synonyms: ['youtube tv'] },
      { text: 'HBO Max', points: 8, synonyms: ['hbo', 'max'] },
    ],
  },
  {
    id: 'ent-09',
    category: 'entertainment',
    question: 'Name something people sing at karaoke.',
    answers: [
      { text: "Don't Stop Believin'", points: 22, synonyms: ['dont stop believin', 'journey'] },
      { text: 'Bohemian Rhapsody', points: 20, synonyms: ['queen', 'bohemian'] },
      { text: 'Sweet Caroline', points: 18, synonyms: ['neil diamond'] },
      { text: 'I Will Always Love You', points: 16, synonyms: ['whitney houston'] },
      { text: 'Livin on a Prayer', points: 14, synonyms: ['bon jovi', 'living on a prayer'] },
      { text: 'Baby One More Time', points: 10, synonyms: ['britney', 'hit me baby'] },
    ],
  },
  {
    id: 'ent-10',
    category: 'entertainment',
    question: 'Name a genre of music.',
    answers: [
      { text: 'Pop', points: 25, synonyms: [] },
      { text: 'Hip Hop', points: 22, synonyms: ['rap', 'hip-hop'] },
      { text: 'Rock', points: 18, synonyms: ['rock and roll'] },
      { text: 'Country', points: 15, synonyms: [] },
      { text: 'R&B', points: 12, synonyms: ['rnb', 'rhythm and blues'] },
      { text: 'Jazz', points: 8, synonyms: [] },
    ],
  },
  {
    id: 'ent-11',
    category: 'entertainment',
    question: 'Name a social media platform.',
    answers: [
      { text: 'TikTok', points: 25, synonyms: ['tik tok'] },
      { text: 'Instagram', points: 22, synonyms: ['insta', 'ig'] },
      { text: 'Facebook', points: 18, synonyms: ['fb', 'meta'] },
      { text: 'Twitter', points: 14, synonyms: ['x', 'x.com'] },
      { text: 'Snapchat', points: 12, synonyms: ['snap'] },
      { text: 'YouTube', points: 9, synonyms: ['yt'] },
    ],
  },
  {
    id: 'ent-12',
    category: 'entertainment',
    question: 'Name a Disney movie.',
    answers: [
      { text: 'The Lion King', points: 22, synonyms: ['lion king'] },
      { text: 'Frozen', points: 20, synonyms: ['frozen 2'] },
      { text: 'Aladdin', points: 18, synonyms: [] },
      { text: 'The Little Mermaid', points: 16, synonyms: ['little mermaid'] },
      { text: 'Moana', points: 14, synonyms: [] },
      { text: 'Cinderella', points: 10, synonyms: [] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // EVERYDAY LIFE (20+ questions)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'ev-01',
    category: 'everyday',
    question: 'Name something people do first thing in the morning.',
    answers: [
      { text: 'Brush Teeth', points: 25, synonyms: ['brush my teeth', 'brushing teeth'] },
      { text: 'Check Phone', points: 22, synonyms: ['look at phone', 'phone'] },
      { text: 'Shower', points: 18, synonyms: ['take a shower', 'bath'] },
      { text: 'Coffee', points: 15, synonyms: ['make coffee', 'drink coffee'] },
      { text: 'Use the Bathroom', points: 12, synonyms: ['pee', 'go to the bathroom', 'toilet'] },
      { text: 'Get Dressed', points: 8, synonyms: ['get ready', 'put on clothes'] },
    ],
  },
  {
    id: 'ev-02',
    category: 'everyday',
    question: 'Name something people always lose.',
    answers: [
      { text: 'Keys', points: 28, synonyms: ['car keys', 'house keys'] },
      { text: 'Phone', points: 22, synonyms: ['cell phone', 'mobile'] },
      { text: 'Wallet', points: 18, synonyms: ['purse'] },
      { text: 'Remote', points: 15, synonyms: ['tv remote', 'remote control'] },
      { text: 'Socks', points: 10, synonyms: ['a sock'] },
      { text: 'Glasses', points: 7, synonyms: ['sunglasses', 'reading glasses'] },
    ],
  },
  {
    id: 'ev-03',
    category: 'everyday',
    question: 'Name something people do while waiting in line.',
    answers: [
      { text: 'Look at Phone', points: 30, synonyms: ['phone', 'scroll', 'check phone'] },
      { text: 'Talk', points: 20, synonyms: ['chat', 'conversation'] },
      { text: 'People Watch', points: 16, synonyms: ['look around', 'people watching'] },
      { text: 'Complain', points: 14, synonyms: ['get impatient', 'sigh'] },
      { text: 'Read', points: 12, synonyms: ['reading'] },
      { text: 'Listen to Music', points: 8, synonyms: ['music', 'earbuds', 'headphones'] },
    ],
  },
  {
    id: 'ev-04',
    category: 'everyday',
    question: 'Name something in your bathroom.',
    answers: [
      { text: 'Toothbrush', points: 22, synonyms: ['tooth brush', 'toothpaste'] },
      { text: 'Toilet', points: 20, synonyms: [] },
      { text: 'Towel', points: 18, synonyms: ['towels'] },
      { text: 'Soap', points: 16, synonyms: ['body wash', 'hand soap'] },
      { text: 'Shampoo', points: 14, synonyms: ['conditioner'] },
      { text: 'Mirror', points: 10, synonyms: [] },
    ],
  },
  {
    id: 'ev-05',
    category: 'everyday',
    question: 'Name something you take to the beach.',
    answers: [
      { text: 'Towel', points: 25, synonyms: ['beach towel', 'towels'] },
      { text: 'Sunscreen', points: 22, synonyms: ['sunblock', 'spf'] },
      { text: 'Umbrella', points: 16, synonyms: ['beach umbrella', 'shade'] },
      { text: 'Cooler', points: 14, synonyms: ['drinks', 'ice chest'] },
      { text: 'Chair', points: 12, synonyms: ['beach chair', 'lawn chair'] },
      { text: 'Sunglasses', points: 11, synonyms: ['shades', 'sunnies'] },
    ],
  },
  {
    id: 'ev-06',
    category: 'everyday',
    question: 'Name a reason someone might be late to work.',
    answers: [
      { text: 'Traffic', points: 30, synonyms: ['stuck in traffic'] },
      { text: 'Overslept', points: 25, synonyms: ['slept in', 'alarm didnt go off'] },
      { text: 'Car Trouble', points: 16, synonyms: ['car broke down', 'flat tire'] },
      { text: 'Kids', points: 12, synonyms: ['dropping kids off', 'children'] },
      { text: 'Weather', points: 10, synonyms: ['bad weather', 'snow', 'rain'] },
      { text: 'Lost Keys', points: 7, synonyms: ['couldnt find keys'] },
    ],
  },
  {
    id: 'ev-07',
    category: 'everyday',
    question: 'Name something people collect.',
    answers: [
      { text: 'Stamps', points: 22, synonyms: ['stamp'] },
      { text: 'Coins', points: 20, synonyms: ['coin', 'currency'] },
      { text: 'Cards', points: 18, synonyms: ['trading cards', 'baseball cards', 'pokemon cards'] },
      { text: 'Shoes', points: 16, synonyms: ['sneakers'] },
      { text: 'Figurines', points: 14, synonyms: ['action figures', 'funko pops', 'figures'] },
      { text: 'Vinyl Records', points: 10, synonyms: ['records', 'vinyl', 'albums'] },
    ],
  },
  {
    id: 'ev-08',
    category: 'everyday',
    question: 'Name something that makes you sneeze.',
    answers: [
      { text: 'Dust', points: 25, synonyms: ['dusty'] },
      { text: 'Pollen', points: 22, synonyms: ['flowers', 'allergies', 'hay fever'] },
      { text: 'Pepper', points: 18, synonyms: ['black pepper'] },
      { text: 'Cats', points: 15, synonyms: ['cat hair', 'cat dander'] },
      { text: 'Cold', points: 12, synonyms: ['being sick', 'flu'] },
      { text: 'Sun', points: 8, synonyms: ['bright light', 'sunlight'] },
    ],
  },
  {
    id: 'ev-09',
    category: 'everyday',
    question: 'Name something you keep in your car.',
    answers: [
      { text: 'Phone Charger', points: 22, synonyms: ['charger', 'car charger'] },
      { text: 'Sunglasses', points: 20, synonyms: ['shades'] },
      { text: 'Water Bottle', points: 16, synonyms: ['water', 'drinks'] },
      { text: 'Registration', points: 14, synonyms: ['insurance', 'documents', 'papers'] },
      { text: 'Spare Tire', points: 12, synonyms: ['jack', 'tire'] },
      { text: 'Snacks', points: 10, synonyms: ['food', 'gum'] },
    ],
  },
  {
    id: 'ev-10',
    category: 'everyday',
    question: 'Name something you do before bed.',
    answers: [
      { text: 'Brush Teeth', points: 25, synonyms: ['brush my teeth'] },
      { text: 'Watch TV', points: 22, synonyms: ['watch a show', 'netflix'] },
      { text: 'Check Phone', points: 18, synonyms: ['scroll phone', 'look at phone'] },
      { text: 'Read', points: 15, synonyms: ['reading', 'read a book'] },
      { text: 'Shower', points: 12, synonyms: ['bath', 'take a shower'] },
      { text: 'Pray', points: 8, synonyms: ['meditate', 'meditation'] },
    ],
  },
  {
    id: 'ev-11',
    category: 'everyday',
    question: 'Name something that uses batteries.',
    answers: [
      { text: 'Remote', points: 25, synonyms: ['tv remote', 'remote control'] },
      { text: 'Flashlight', points: 22, synonyms: ['torch'] },
      { text: 'Toy', points: 18, synonyms: ['toys', 'kids toys'] },
      { text: 'Clock', points: 14, synonyms: ['wall clock', 'alarm clock'] },
      { text: 'Game Controller', points: 12, synonyms: ['controller', 'xbox controller'] },
      { text: 'Smoke Detector', points: 9, synonyms: ['smoke alarm'] },
    ],
  },
  {
    id: 'ev-12',
    category: 'everyday',
    question: 'Name something you might forget to bring on vacation.',
    answers: [
      { text: 'Toothbrush', points: 22, synonyms: ['toothpaste'] },
      { text: 'Phone Charger', points: 20, synonyms: ['charger'] },
      { text: 'Underwear', points: 18, synonyms: ['socks'] },
      { text: 'Sunscreen', points: 16, synonyms: ['sunblock'] },
      { text: 'Medication', points: 14, synonyms: ['medicine', 'pills', 'meds'] },
      { text: 'ID', points: 10, synonyms: ['passport', 'license', 'drivers license'] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // PEOPLE & RELATIONSHIPS (20+ questions)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'ppl-01',
    category: 'people',
    question: 'Name something couples argue about.',
    answers: [
      { text: 'Money', points: 30, synonyms: ['finances', 'bills', 'spending'] },
      { text: 'Chores', points: 22, synonyms: ['cleaning', 'housework'] },
      { text: 'Kids', points: 16, synonyms: ['children', 'parenting'] },
      { text: 'Food', points: 14, synonyms: ['what to eat', 'dinner', 'where to eat'] },
      { text: 'In-Laws', points: 10, synonyms: ['family', 'mother in law'] },
      { text: 'TV', points: 8, synonyms: ['what to watch', 'remote'] },
    ],
  },
  {
    id: 'ppl-02',
    category: 'people',
    question: 'Name a quality people look for in a partner.',
    answers: [
      { text: 'Humor', points: 28, synonyms: ['funny', 'sense of humor', 'makes me laugh'] },
      { text: 'Looks', points: 22, synonyms: ['attractive', 'handsome', 'pretty', 'hot'] },
      { text: 'Kindness', points: 18, synonyms: ['kind', 'nice', 'caring'] },
      { text: 'Honesty', points: 14, synonyms: ['honest', 'trustworthy', 'loyal'] },
      { text: 'Intelligence', points: 10, synonyms: ['smart', 'intelligent'] },
      { text: 'Money', points: 8, synonyms: ['rich', 'wealthy', 'financially stable'] },
    ],
  },
  {
    id: 'ppl-03',
    category: 'people',
    question: 'Name a job kids say they want when they grow up.',
    answers: [
      { text: 'Doctor', points: 22, synonyms: ['dr'] },
      { text: 'Firefighter', points: 20, synonyms: ['fireman', 'fire fighter'] },
      { text: 'Astronaut', points: 18, synonyms: [] },
      { text: 'Teacher', points: 16, synonyms: [] },
      { text: 'Athlete', points: 14, synonyms: ['sports player', 'football player', 'basketball player'] },
      { text: 'Youtuber', points: 10, synonyms: ['influencer', 'tiktoker', 'streamer'] },
    ],
  },
  {
    id: 'ppl-04',
    category: 'people',
    question: 'Name someone people call when they have a problem.',
    answers: [
      { text: 'Mom', points: 30, synonyms: ['mother', 'mum', 'mama'] },
      { text: 'Best Friend', points: 22, synonyms: ['friend', 'bff'] },
      { text: 'Spouse', points: 16, synonyms: ['husband', 'wife', 'partner'] },
      { text: 'Lawyer', points: 12, synonyms: ['attorney'] },
      { text: 'Police', points: 10, synonyms: ['cops', '911'] },
      { text: 'Dad', points: 10, synonyms: ['father'] },
    ],
  },
  {
    id: 'ppl-05',
    category: 'people',
    question: 'Name something that makes a good neighbor.',
    answers: [
      { text: 'Quiet', points: 28, synonyms: ['not loud', 'keeps to themselves'] },
      { text: 'Friendly', points: 22, synonyms: ['nice', 'waves'] },
      { text: 'Helpful', points: 18, synonyms: ['helps out', 'lends things'] },
      { text: 'Keeps Yard Nice', points: 14, synonyms: ['mows lawn', 'clean yard'] },
      { text: 'Watches Your House', points: 10, synonyms: ['looks out for you'] },
      { text: 'Brings Food', points: 8, synonyms: ['shares food', 'cookies'] },
    ],
  },
  {
    id: 'ppl-06',
    category: 'people',
    question: 'Name something you might lie about on a first date.',
    answers: [
      { text: 'Age', points: 28, synonyms: ['how old you are'] },
      { text: 'Job', points: 22, synonyms: ['career', 'what you do'] },
      { text: 'Hobbies', points: 16, synonyms: ['interests'] },
      { text: 'Relationship History', points: 14, synonyms: ['exes', 'past relationships'] },
      { text: 'Weight', points: 12, synonyms: ['appearance', 'height'] },
      { text: 'Income', points: 8, synonyms: ['salary', 'how much you make'] },
    ],
  },
  {
    id: 'ppl-07',
    category: 'people',
    question: 'Name a reason people cry.',
    answers: [
      { text: 'Sadness', points: 28, synonyms: ['sad', 'heartbreak', 'loss'] },
      { text: 'Happiness', points: 22, synonyms: ['happy tears', 'joy'] },
      { text: 'Pain', points: 18, synonyms: ['hurt', 'injury'] },
      { text: 'Movie', points: 14, synonyms: ['sad movie', 'tv show'] },
      { text: 'Onions', points: 10, synonyms: ['cutting onions'] },
      { text: 'Stress', points: 8, synonyms: ['overwhelmed', 'frustration'] },
    ],
  },
  {
    id: 'ppl-08',
    category: 'people',
    question: 'Name a famous person named John.',
    answers: [
      { text: 'John Cena', points: 22, synonyms: ['cena'] },
      { text: 'John Legend', points: 20, synonyms: ['legend'] },
      { text: 'John F. Kennedy', points: 18, synonyms: ['jfk', 'kennedy'] },
      { text: 'John Lennon', points: 16, synonyms: ['lennon'] },
      { text: 'John Wayne', points: 12, synonyms: ['wayne'] },
      { text: 'John Wick', points: 12, synonyms: ['keanu'] },
    ],
  },
  {
    id: 'ppl-09',
    category: 'people',
    question: 'Name something a parent says every day.',
    answers: [
      { text: 'I Love You', points: 25, synonyms: ['love you'] },
      { text: 'Clean Your Room', points: 22, synonyms: ['clean up', 'pick up your stuff'] },
      { text: 'Do Your Homework', points: 18, synonyms: ['homework'] },
      { text: 'Hurry Up', points: 14, synonyms: ['lets go', 'come on'] },
      { text: 'No', points: 12, synonyms: ['stop', 'dont'] },
      { text: 'Go to Bed', points: 9, synonyms: ['bedtime', 'go to sleep'] },
    ],
  },
  {
    id: 'ppl-10',
    category: 'people',
    question: 'Name something people do to relax.',
    answers: [
      { text: 'Watch TV', points: 25, synonyms: ['tv', 'netflix', 'watch a show'] },
      { text: 'Sleep', points: 22, synonyms: ['nap', 'rest'] },
      { text: 'Take a Bath', points: 16, synonyms: ['bath', 'bubble bath', 'hot tub'] },
      { text: 'Read', points: 14, synonyms: ['reading', 'read a book'] },
      { text: 'Listen to Music', points: 12, synonyms: ['music'] },
      { text: 'Meditate', points: 11, synonyms: ['yoga', 'meditation'] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // HOLIDAYS & CELEBRATIONS (20+ questions)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'hol-01',
    category: 'holidays',
    question: 'Name something associated with Christmas.',
    answers: [
      { text: 'Presents', points: 25, synonyms: ['gifts', 'gift'] },
      { text: 'Christmas Tree', points: 22, synonyms: ['tree', 'xmas tree'] },
      { text: 'Santa', points: 18, synonyms: ['santa claus', 'father christmas'] },
      { text: 'Snow', points: 14, synonyms: ['snowman'] },
      { text: 'Cookies', points: 12, synonyms: ['baking cookies', 'milk and cookies'] },
      { text: 'Lights', points: 9, synonyms: ['christmas lights', 'decorations'] },
    ],
  },
  {
    id: 'hol-02',
    category: 'holidays',
    question: 'Name something you do on the 4th of July.',
    answers: [
      { text: 'Watch Fireworks', points: 30, synonyms: ['fireworks'] },
      { text: 'BBQ', points: 25, synonyms: ['barbecue', 'grill', 'cook out', 'cookout'] },
      { text: 'Swim', points: 16, synonyms: ['swimming', 'pool', 'go to the lake'] },
      { text: 'Drink', points: 14, synonyms: ['drink beer', 'drinking'] },
      { text: 'Parade', points: 10, synonyms: ['watch a parade'] },
      { text: 'Family Gathering', points: 5, synonyms: ['family', 'get together'] },
    ],
  },
  {
    id: 'hol-03',
    category: 'holidays',
    question: 'Name a popular Halloween costume.',
    answers: [
      { text: 'Witch', points: 22, synonyms: ['witches'] },
      { text: 'Vampire', points: 20, synonyms: ['dracula'] },
      { text: 'Ghost', points: 18, synonyms: ['ghosts'] },
      { text: 'Superhero', points: 16, synonyms: ['batman', 'spiderman', 'superman'] },
      { text: 'Zombie', points: 14, synonyms: ['zombies'] },
      { text: 'Cat', points: 10, synonyms: ['black cat'] },
    ],
  },
  {
    id: 'hol-04',
    category: 'holidays',
    question: 'Name something people do on New Years Eve.',
    answers: [
      { text: 'Countdown', points: 25, synonyms: ['count down', 'ball drop'] },
      { text: 'Drink Champagne', points: 22, synonyms: ['champagne', 'drink', 'toast'] },
      { text: 'Kiss Someone', points: 18, synonyms: ['kiss', 'midnight kiss'] },
      { text: 'Party', points: 15, synonyms: ['go to a party', 'celebrate'] },
      { text: 'Watch TV', points: 12, synonyms: ['watch the ball drop'] },
      { text: 'Make Resolutions', points: 8, synonyms: ['resolutions', 'new years resolution'] },
    ],
  },
  {
    id: 'hol-05',
    category: 'holidays',
    question: 'Name a Thanksgiving food.',
    answers: [
      { text: 'Turkey', points: 30, synonyms: [] },
      { text: 'Mashed Potatoes', points: 20, synonyms: ['potatoes'] },
      { text: 'Stuffing', points: 16, synonyms: ['dressing'] },
      { text: 'Cranberry Sauce', points: 14, synonyms: ['cranberries', 'cranberry'] },
      { text: 'Pumpkin Pie', points: 12, synonyms: ['pie', 'pecan pie'] },
      { text: 'Mac and Cheese', points: 8, synonyms: ['mac n cheese', 'macaroni'] },
    ],
  },
  {
    id: 'hol-06',
    category: 'holidays',
    question: 'Name something people give as a gift.',
    answers: [
      { text: 'Gift Card', points: 25, synonyms: ['gift cards', 'money'] },
      { text: 'Clothes', points: 20, synonyms: ['clothing', 'shirt'] },
      { text: 'Flowers', points: 18, synonyms: ['roses', 'bouquet'] },
      { text: 'Jewelry', points: 14, synonyms: ['necklace', 'ring', 'bracelet'] },
      { text: 'Candy', points: 12, synonyms: ['chocolate', 'chocolates'] },
      { text: 'Perfume', points: 11, synonyms: ['cologne', 'fragrance'] },
    ],
  },
  {
    id: 'hol-07',
    category: 'holidays',
    question: 'Name something you do at a wedding.',
    answers: [
      { text: 'Dance', points: 25, synonyms: ['dancing'] },
      { text: 'Eat', points: 20, synonyms: ['eat cake', 'dinner'] },
      { text: 'Drink', points: 18, synonyms: ['toast', 'champagne'] },
      { text: 'Cry', points: 14, synonyms: ['happy cry'] },
      { text: 'Take Photos', points: 12, synonyms: ['pictures', 'photos'] },
      { text: 'Throw Bouquet', points: 11, synonyms: ['catch bouquet', 'bouquet toss'] },
    ],
  },
  {
    id: 'hol-08',
    category: 'holidays',
    question: 'Name something associated with Valentines Day.',
    answers: [
      { text: 'Chocolate', points: 25, synonyms: ['chocolates', 'candy'] },
      { text: 'Flowers', points: 22, synonyms: ['roses', 'red roses'] },
      { text: 'Cards', points: 18, synonyms: ['valentine card', 'valentines'] },
      { text: 'Dinner', points: 15, synonyms: ['date night', 'romantic dinner'] },
      { text: 'Hearts', points: 12, synonyms: ['heart'] },
      { text: 'Teddy Bear', points: 8, synonyms: ['stuffed animal'] },
    ],
  },
  {
    id: 'hol-09',
    category: 'holidays',
    question: 'Name something at a birthday party.',
    answers: [
      { text: 'Cake', points: 28, synonyms: ['birthday cake'] },
      { text: 'Presents', points: 22, synonyms: ['gifts'] },
      { text: 'Balloons', points: 18, synonyms: ['balloon'] },
      { text: 'Candles', points: 14, synonyms: ['birthday candles'] },
      { text: 'Games', points: 10, synonyms: ['party games'] },
      { text: 'Music', points: 8, synonyms: ['dj', 'dancing'] },
    ],
  },
  {
    id: 'hol-10',
    category: 'holidays',
    question: 'Name a holiday where you get a day off work.',
    answers: [
      { text: 'Christmas', points: 28, synonyms: ['xmas'] },
      { text: 'Thanksgiving', points: 22, synonyms: [] },
      { text: 'Independence Day', points: 16, synonyms: ['4th of july', 'july 4th'] },
      { text: 'Labor Day', points: 14, synonyms: ['labour day'] },
      { text: 'New Years', points: 12, synonyms: ['new years day'] },
      { text: 'Memorial Day', points: 8, synonyms: [] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // SPORTS & GAMES (20+ questions)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'spt-01',
    category: 'sports',
    question: 'Name a sport people play in school.',
    answers: [
      { text: 'Basketball', points: 25, synonyms: ['bball'] },
      { text: 'Football', points: 22, synonyms: ['american football'] },
      { text: 'Soccer', points: 18, synonyms: ['futbol'] },
      { text: 'Baseball', points: 14, synonyms: ['softball'] },
      { text: 'Track', points: 12, synonyms: ['track and field', 'running'] },
      { text: 'Volleyball', points: 9, synonyms: ['volley ball'] },
    ],
  },
  {
    id: 'spt-02',
    category: 'sports',
    question: 'Name something you need to play baseball.',
    answers: [
      { text: 'Bat', points: 28, synonyms: ['baseball bat'] },
      { text: 'Ball', points: 22, synonyms: ['baseball'] },
      { text: 'Glove', points: 20, synonyms: ['mitt', 'baseball glove'] },
      { text: 'Helmet', points: 14, synonyms: ['batting helmet'] },
      { text: 'Bases', points: 10, synonyms: ['base'] },
      { text: 'Uniform', points: 6, synonyms: ['jersey'] },
    ],
  },
  {
    id: 'spt-03',
    category: 'sports',
    question: 'Name something people bet on.',
    answers: [
      { text: 'Horse Racing', points: 25, synonyms: ['horses', 'horse races'] },
      { text: 'Football', points: 22, synonyms: ['nfl', 'super bowl'] },
      { text: 'Boxing', points: 16, synonyms: ['mma', 'ufc', 'fighting'] },
      { text: 'Basketball', points: 14, synonyms: ['nba'] },
      { text: 'Poker', points: 12, synonyms: ['card games', 'cards'] },
      { text: 'Elections', points: 11, synonyms: ['politics'] },
    ],
  },
  {
    id: 'spt-04',
    category: 'sports',
    question: 'Name a sport you can play alone.',
    answers: [
      { text: 'Golf', points: 25, synonyms: [] },
      { text: 'Swimming', points: 22, synonyms: ['swim'] },
      { text: 'Running', points: 18, synonyms: ['jogging'] },
      { text: 'Bowling', points: 14, synonyms: [] },
      { text: 'Tennis', points: 12, synonyms: ['hitting against a wall'] },
      { text: 'Cycling', points: 9, synonyms: ['biking', 'bike riding'] },
    ],
  },
  {
    id: 'spt-05',
    category: 'sports',
    question: 'Name something you find at a gym.',
    answers: [
      { text: 'Treadmill', points: 25, synonyms: ['treadmills'] },
      { text: 'Weights', points: 22, synonyms: ['dumbbells', 'barbells', 'free weights'] },
      { text: 'Mirror', points: 16, synonyms: ['mirrors'] },
      { text: 'Bench', points: 14, synonyms: ['bench press'] },
      { text: 'Water Fountain', points: 12, synonyms: ['water'] },
      { text: 'Towels', points: 11, synonyms: ['towel'] },
    ],
  },
  {
    id: 'spt-06',
    category: 'sports',
    question: 'Name a sport played on ice.',
    answers: [
      { text: 'Hockey', points: 35, synonyms: ['ice hockey'] },
      { text: 'Figure Skating', points: 25, synonyms: ['ice skating', 'skating'] },
      { text: 'Curling', points: 20, synonyms: [] },
      { text: 'Speed Skating', points: 12, synonyms: [] },
      { text: 'Bobsled', points: 8, synonyms: ['bobsleigh'] },
    ],
  },
  {
    id: 'spt-07',
    category: 'sports',
    question: 'Name something a football player wears.',
    answers: [
      { text: 'Helmet', points: 28, synonyms: [] },
      { text: 'Pads', points: 22, synonyms: ['shoulder pads'] },
      { text: 'Jersey', points: 18, synonyms: ['uniform'] },
      { text: 'Cleats', points: 14, synonyms: ['shoes'] },
      { text: 'Mouthguard', points: 10, synonyms: ['mouth guard'] },
      { text: 'Gloves', points: 8, synonyms: ['football gloves'] },
    ],
  },
  {
    id: 'spt-08',
    category: 'sports',
    question: 'Name something associated with the Olympics.',
    answers: [
      { text: 'Gold Medal', points: 25, synonyms: ['medals', 'medal'] },
      { text: 'Torch', points: 22, synonyms: ['olympic torch', 'flame'] },
      { text: 'Rings', points: 18, synonyms: ['olympic rings', '5 rings'] },
      { text: 'Swimming', points: 14, synonyms: [] },
      { text: 'Gymnastics', points: 12, synonyms: [] },
      { text: 'Opening Ceremony', points: 9, synonyms: ['ceremony'] },
    ],
  },
  {
    id: 'spt-09',
    category: 'sports',
    question: 'Name a card game.',
    answers: [
      { text: 'Poker', points: 28, synonyms: ['texas holdem'] },
      { text: 'UNO', points: 22, synonyms: [] },
      { text: 'Go Fish', points: 16, synonyms: ['goldfish'] },
      { text: 'Blackjack', points: 14, synonyms: ['21'] },
      { text: 'Solitaire', points: 12, synonyms: [] },
      { text: 'War', points: 8, synonyms: [] },
    ],
  },
  {
    id: 'spt-10',
    category: 'sports',
    question: 'Name something you shout at a sporting event.',
    answers: [
      { text: 'Go!', points: 22, synonyms: ['go team', 'lets go'] },
      { text: 'Boo!', points: 20, synonyms: ['boo'] },
      { text: 'Defense!', points: 18, synonyms: ['defence'] },
      { text: 'Ref!', points: 16, synonyms: ['bad call', 'are you blind'] },
      { text: 'Score!', points: 14, synonyms: ['goal', 'touchdown'] },
      { text: 'MVP!', points: 10, synonyms: [] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // TECHNOLOGY (20+ questions)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'tech-01',
    category: 'technology',
    question: 'Name a brand of phone.',
    answers: [
      { text: 'Apple', points: 30, synonyms: ['iphone'] },
      { text: 'Samsung', points: 25, synonyms: ['galaxy'] },
      { text: 'Google', points: 16, synonyms: ['pixel'] },
      { text: 'OnePlus', points: 12, synonyms: ['one plus'] },
      { text: 'Motorola', points: 10, synonyms: ['moto'] },
      { text: 'Nokia', points: 7, synonyms: [] },
    ],
  },
  {
    id: 'tech-02',
    category: 'technology',
    question: 'Name something that annoys you about the internet.',
    answers: [
      { text: 'Slow Speed', points: 25, synonyms: ['lag', 'buffering', 'slow wifi', 'slow'] },
      { text: 'Ads', points: 22, synonyms: ['pop ups', 'advertisements', 'pop up ads'] },
      { text: 'Trolls', points: 16, synonyms: ['mean people', 'haters', 'toxic people'] },
      { text: 'Scams', points: 14, synonyms: ['spam', 'phishing'] },
      { text: 'Misinformation', points: 12, synonyms: ['fake news', 'lies'] },
      { text: 'Outages', points: 11, synonyms: ['going down', 'crashes', 'not working'] },
    ],
  },
  {
    id: 'tech-03',
    category: 'technology',
    question: 'Name an app everyone has on their phone.',
    answers: [
      { text: 'Instagram', points: 22, synonyms: ['insta', 'ig'] },
      { text: 'TikTok', points: 20, synonyms: ['tik tok'] },
      { text: 'YouTube', points: 18, synonyms: ['yt'] },
      { text: 'Facebook', points: 16, synonyms: ['fb'] },
      { text: 'Snapchat', points: 14, synonyms: ['snap'] },
      { text: 'Messages', points: 10, synonyms: ['text', 'imessage', 'whatsapp'] },
    ],
  },
  {
    id: 'tech-04',
    category: 'technology',
    question: 'Name something people use a computer for.',
    answers: [
      { text: 'Work', points: 25, synonyms: ['email', 'office work'] },
      { text: 'Social Media', points: 20, synonyms: ['browsing', 'surfing the web'] },
      { text: 'Gaming', points: 18, synonyms: ['games', 'video games'] },
      { text: 'Shopping', points: 14, synonyms: ['online shopping'] },
      { text: 'Watching Videos', points: 12, synonyms: ['youtube', 'streaming', 'netflix'] },
      { text: 'School', points: 11, synonyms: ['homework', 'research'] },
    ],
  },
  {
    id: 'tech-05',
    category: 'technology',
    question: 'Name a password people commonly use.',
    answers: [
      { text: '123456', points: 28, synonyms: ['12345', '1234', '123'] },
      { text: 'Password', points: 25, synonyms: ['password1', 'passw0rd'] },
      { text: "Pet's Name", points: 16, synonyms: ['dog name', 'cat name'] },
      { text: 'Birthday', points: 14, synonyms: ['date of birth', 'dob'] },
      { text: 'Qwerty', points: 10, synonyms: [] },
      { text: 'Abc123', points: 7, synonyms: ['abcdef'] },
    ],
  },
  {
    id: 'tech-06',
    category: 'technology',
    question: 'Name something that uses a touchscreen.',
    answers: [
      { text: 'Phone', points: 30, synonyms: ['smartphone', 'cell phone'] },
      { text: 'Tablet', points: 22, synonyms: ['ipad'] },
      { text: 'ATM', points: 16, synonyms: ['cash machine'] },
      { text: 'Car Dashboard', points: 12, synonyms: ['car', 'tesla'] },
      { text: 'Laptop', points: 10, synonyms: ['computer'] },
      { text: 'Kiosk', points: 10, synonyms: ['self checkout', 'ordering screen'] },
    ],
  },
  {
    id: 'tech-07',
    category: 'technology',
    question: 'Name something you charge every day.',
    answers: [
      { text: 'Phone', points: 35, synonyms: ['cell phone', 'smartphone'] },
      { text: 'Laptop', points: 22, synonyms: ['computer'] },
      { text: 'Watch', points: 16, synonyms: ['smartwatch', 'apple watch'] },
      { text: 'Earbuds', points: 14, synonyms: ['airpods', 'headphones'] },
      { text: 'Tablet', points: 8, synonyms: ['ipad'] },
      { text: 'E-Reader', points: 5, synonyms: ['kindle'] },
    ],
  },
  {
    id: 'tech-08',
    category: 'technology',
    question: 'Name a website people visit every day.',
    answers: [
      { text: 'Google', points: 28, synonyms: ['google.com'] },
      { text: 'YouTube', points: 22, synonyms: ['youtube.com'] },
      { text: 'Facebook', points: 16, synonyms: ['facebook.com'] },
      { text: 'Amazon', points: 14, synonyms: ['amazon.com'] },
      { text: 'Reddit', points: 12, synonyms: ['reddit.com'] },
      { text: 'Twitter', points: 8, synonyms: ['x.com', 'twitter.com'] },
    ],
  },
  {
    id: 'tech-09',
    category: 'technology',
    question: 'Name something annoying about video calls.',
    answers: [
      { text: 'Bad Connection', points: 25, synonyms: ['lag', 'freezing', 'frozen', 'buffering'] },
      { text: "Mute Yourself", points: 22, synonyms: ['forgot to mute', 'youre on mute', 'muted'] },
      { text: 'Background Noise', points: 18, synonyms: ['noise', 'echo'] },
      { text: 'Camera Angle', points: 14, synonyms: ['bad angle', 'up the nose'] },
      { text: 'People Talking Over Each Other', points: 12, synonyms: ['interrupting'] },
      { text: 'Looking at Yourself', points: 9, synonyms: ['staring at self'] },
    ],
  },
  {
    id: 'tech-10',
    category: 'technology',
    question: 'Name a piece of technology from the 90s.',
    answers: [
      { text: 'VCR', points: 22, synonyms: ['vhs', 'video cassette'] },
      { text: 'Walkman', points: 20, synonyms: ['discman', 'portable cd player'] },
      { text: 'Pager', points: 18, synonyms: ['beeper'] },
      { text: 'Game Boy', points: 16, synonyms: ['gameboy'] },
      { text: 'Dial-Up Internet', points: 14, synonyms: ['dial up', 'aol'] },
      { text: 'Floppy Disk', points: 10, synonyms: ['floppy'] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // SCHOOL & WORK (20+ questions)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'sch-01',
    category: 'school',
    question: 'Name a subject people hated in school.',
    answers: [
      { text: 'Math', points: 30, synonyms: ['maths', 'algebra', 'calculus'] },
      { text: 'History', points: 20, synonyms: [] },
      { text: 'Science', points: 16, synonyms: ['chemistry', 'physics'] },
      { text: 'English', points: 14, synonyms: ['writing', 'literature'] },
      { text: 'Gym', points: 12, synonyms: ['pe', 'physical education'] },
      { text: 'Foreign Language', points: 8, synonyms: ['spanish', 'french'] },
    ],
  },
  {
    id: 'sch-02',
    category: 'school',
    question: 'Name something you find in a classroom.',
    answers: [
      { text: 'Desk', points: 25, synonyms: ['desks', 'tables'] },
      { text: 'Whiteboard', points: 22, synonyms: ['blackboard', 'chalkboard', 'board'] },
      { text: 'Chair', points: 16, synonyms: ['chairs', 'seat'] },
      { text: 'Computer', points: 14, synonyms: ['laptop', 'chromebook'] },
      { text: 'Clock', points: 12, synonyms: [] },
      { text: 'Books', points: 11, synonyms: ['textbook', 'textbooks'] },
    ],
  },
  {
    id: 'sch-03',
    category: 'school',
    question: 'Name a reason someone calls in sick to work.',
    answers: [
      { text: "They're Not Actually Sick", points: 25, synonyms: ['faking', 'mental health day', 'playing hooky'] },
      { text: 'Cold/Flu', points: 22, synonyms: ['cold', 'flu', 'sick'] },
      { text: 'Stomach Bug', points: 18, synonyms: ['throwing up', 'vomiting', 'food poisoning'] },
      { text: 'Headache', points: 14, synonyms: ['migraine'] },
      { text: 'Kid Is Sick', points: 12, synonyms: ['child is sick', 'kids'] },
      { text: 'Covid', points: 9, synonyms: ['coronavirus'] },
    ],
  },
  {
    id: 'sch-04',
    category: 'school',
    question: 'Name a job that requires a uniform.',
    answers: [
      { text: 'Police', points: 25, synonyms: ['cop', 'police officer'] },
      { text: 'Nurse', points: 20, synonyms: ['doctor', 'nurse scrubs'] },
      { text: 'Military', points: 18, synonyms: ['soldier', 'army'] },
      { text: 'Firefighter', points: 14, synonyms: ['fireman'] },
      { text: 'Fast Food Worker', points: 12, synonyms: ['mcdonalds', 'waiter', 'waitress'] },
      { text: 'Chef', points: 11, synonyms: ['cook'] },
    ],
  },
  {
    id: 'sch-05',
    category: 'school',
    question: 'Name something students bring to school.',
    answers: [
      { text: 'Backpack', points: 25, synonyms: ['bag', 'bookbag'] },
      { text: 'Pencil', points: 22, synonyms: ['pencils', 'pen', 'pens'] },
      { text: 'Laptop', points: 18, synonyms: ['computer', 'chromebook', 'tablet'] },
      { text: 'Lunch', points: 14, synonyms: ['lunch box', 'lunchbox'] },
      { text: 'Phone', points: 12, synonyms: ['cell phone'] },
      { text: 'Books', points: 9, synonyms: ['textbook', 'notebook'] },
    ],
  },
  {
    id: 'sch-06',
    category: 'school',
    question: 'Name something that makes a job interview stressful.',
    answers: [
      { text: 'Tough Questions', points: 25, synonyms: ['hard questions', 'questions'] },
      { text: 'Being Judged', points: 20, synonyms: ['first impression', 'nervousness'] },
      { text: 'What to Wear', points: 18, synonyms: ['outfit', 'clothes', 'dressing up'] },
      { text: 'Being Late', points: 14, synonyms: ['running late', 'traffic'] },
      { text: 'Not Qualified', points: 12, synonyms: ['imposter syndrome', 'underqualified'] },
      { text: 'Salary Discussion', points: 11, synonyms: ['money', 'pay', 'negotiation'] },
    ],
  },
  {
    id: 'sch-07',
    category: 'school',
    question: 'Name an excuse for not doing homework.',
    answers: [
      { text: 'Dog Ate It', points: 25, synonyms: ['my dog ate it', 'pet ate it'] },
      { text: 'Forgot', points: 22, synonyms: ['forgot about it', 'didnt remember'] },
      { text: 'Was Sick', points: 16, synonyms: ['sick', 'illness'] },
      { text: 'Left It at Home', points: 14, synonyms: ['at home', 'forgot it'] },
      { text: "Didn't Know About It", points: 12, synonyms: ['didnt know', 'wasnt assigned'] },
      { text: 'No Internet', points: 11, synonyms: ['wifi down', 'computer broke'] },
    ],
  },
  {
    id: 'sch-08',
    category: 'school',
    question: 'Name a job people work in high school.',
    answers: [
      { text: 'Fast Food', points: 25, synonyms: ['mcdonalds', 'burger place'] },
      { text: 'Retail', points: 22, synonyms: ['store', 'clothing store', 'mall'] },
      { text: 'Grocery Store', points: 18, synonyms: ['bagger', 'cashier'] },
      { text: 'Babysitter', points: 14, synonyms: ['babysitting', 'nanny'] },
      { text: 'Lifeguard', points: 12, synonyms: ['pool'] },
      { text: 'Movie Theater', points: 9, synonyms: ['cinema'] },
    ],
  },
  {
    id: 'sch-09',
    category: 'school',
    question: 'Name something annoying about meetings.',
    answers: [
      { text: 'Too Long', points: 28, synonyms: ['goes on forever', 'long'] },
      { text: 'Boring', points: 22, synonyms: ['pointless', 'could be an email'] },
      { text: 'One Person Talks Too Much', points: 16, synonyms: ['someone wont shut up'] },
      { text: 'No Agenda', points: 14, synonyms: ['off topic', 'tangents'] },
      { text: 'Tech Issues', points: 12, synonyms: ['zoom problems', 'connection'] },
      { text: 'Early Morning', points: 8, synonyms: ['too early'] },
    ],
  },
  {
    id: 'sch-10',
    category: 'school',
    question: 'Name something a teacher writes on your report card.',
    answers: [
      { text: 'Needs Improvement', points: 22, synonyms: ['could do better', 'needs work'] },
      { text: 'Good Student', points: 20, synonyms: ['excellent', 'great work'] },
      { text: 'Talks Too Much', points: 18, synonyms: ['talkative', 'disruptive'] },
      { text: 'Grades', points: 16, synonyms: ['a', 'b', 'c', 'f'] },
      { text: 'Not Paying Attention', points: 14, synonyms: ['doesnt focus', 'distracted'] },
      { text: 'Pleasure to Have in Class', points: 10, synonyms: ['great student', 'well behaved'] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // TRAVEL & PLACES (20+ questions)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'trvl-01',
    category: 'travel',
    question: 'Name a country people dream of visiting.',
    answers: [
      { text: 'Italy', points: 25, synonyms: ['rome', 'venice'] },
      { text: 'France', points: 22, synonyms: ['paris'] },
      { text: 'Japan', points: 18, synonyms: ['tokyo'] },
      { text: 'Australia', points: 14, synonyms: ['sydney'] },
      { text: 'Greece', points: 12, synonyms: ['santorini'] },
      { text: 'Hawaii', points: 9, synonyms: ['maui'] },
    ],
  },
  {
    id: 'trvl-02',
    category: 'travel',
    question: 'Name something annoying about flying.',
    answers: [
      { text: 'Delays', points: 25, synonyms: ['delayed', 'cancelled', 'late'] },
      { text: 'Small Seats', points: 22, synonyms: ['cramped', 'no leg room', 'legroom'] },
      { text: 'Crying Babies', points: 18, synonyms: ['kids', 'babies', 'screaming'] },
      { text: 'Security', points: 14, synonyms: ['tsa', 'security line'] },
      { text: 'Turbulence', points: 12, synonyms: ['bumps'] },
      { text: 'Lost Luggage', points: 9, synonyms: ['baggage', 'lost bag'] },
    ],
  },
  {
    id: 'trvl-03',
    category: 'travel',
    question: 'Name a famous landmark.',
    answers: [
      { text: 'Eiffel Tower', points: 25, synonyms: ['eiffel'] },
      { text: 'Statue of Liberty', points: 22, synonyms: ['lady liberty'] },
      { text: 'Great Wall of China', points: 18, synonyms: ['great wall'] },
      { text: 'Big Ben', points: 14, synonyms: [] },
      { text: 'Pyramids', points: 12, synonyms: ['pyramids of giza', 'egypt pyramids'] },
      { text: 'Grand Canyon', points: 9, synonyms: [] },
    ],
  },
  {
    id: 'trvl-04',
    category: 'travel',
    question: 'Name something you do on a road trip.',
    answers: [
      { text: 'Listen to Music', points: 25, synonyms: ['music', 'playlist'] },
      { text: 'Eat Snacks', points: 22, synonyms: ['snacks', 'eat', 'fast food'] },
      { text: 'Sleep', points: 16, synonyms: ['nap'] },
      { text: 'Play Games', points: 14, synonyms: ['car games', 'i spy'] },
      { text: 'Stop for Gas', points: 12, synonyms: ['gas', 'fill up'] },
      { text: 'Take Pictures', points: 11, synonyms: ['photos', 'pictures'] },
    ],
  },
  {
    id: 'trvl-05',
    category: 'travel',
    question: 'Name something you pack for vacation.',
    answers: [
      { text: 'Clothes', points: 25, synonyms: ['clothing', 'outfits'] },
      { text: 'Toiletries', points: 20, synonyms: ['toothbrush', 'shampoo'] },
      { text: 'Phone Charger', points: 18, synonyms: ['charger'] },
      { text: 'Swimsuit', points: 14, synonyms: ['bathing suit', 'bikini', 'trunks'] },
      { text: 'Sunscreen', points: 12, synonyms: ['sunblock'] },
      { text: 'Camera', points: 11, synonyms: [] },
    ],
  },
  {
    id: 'trvl-06',
    category: 'travel',
    question: 'Name a US state everyone knows.',
    answers: [
      { text: 'California', points: 25, synonyms: ['cali', 'ca'] },
      { text: 'Texas', points: 22, synonyms: ['tx'] },
      { text: 'New York', points: 20, synonyms: ['ny'] },
      { text: 'Florida', points: 14, synonyms: ['fl'] },
      { text: 'Hawaii', points: 10, synonyms: ['hi'] },
      { text: 'Alaska', points: 9, synonyms: ['ak'] },
    ],
  },
  {
    id: 'trvl-07',
    category: 'travel',
    question: 'Name something you see on a highway.',
    answers: [
      { text: 'Cars', points: 25, synonyms: ['traffic', 'vehicles'] },
      { text: 'Trucks', points: 20, synonyms: ['semi trucks', 'big rigs', '18 wheelers'] },
      { text: 'Signs', points: 18, synonyms: ['road signs', 'exit signs'] },
      { text: 'Billboards', points: 14, synonyms: ['billboard', 'ads'] },
      { text: 'Police', points: 12, synonyms: ['cops', 'speed trap'] },
      { text: 'Roadkill', points: 11, synonyms: ['dead animals'] },
    ],
  },
  {
    id: 'trvl-08',
    category: 'travel',
    question: 'Name a type of transportation.',
    answers: [
      { text: 'Car', points: 25, synonyms: ['automobile'] },
      { text: 'Bus', points: 20, synonyms: ['buses'] },
      { text: 'Train', points: 18, synonyms: ['subway', 'metro'] },
      { text: 'Airplane', points: 16, synonyms: ['plane', 'flight'] },
      { text: 'Bicycle', points: 12, synonyms: ['bike'] },
      { text: 'Taxi', points: 9, synonyms: ['cab', 'uber', 'lyft'] },
    ],
  },
  {
    id: 'trvl-09',
    category: 'travel',
    question: 'Name a city known for its food.',
    answers: [
      { text: 'New York', points: 22, synonyms: ['nyc', 'new york city'] },
      { text: 'New Orleans', points: 20, synonyms: ['nola'] },
      { text: 'Paris', points: 18, synonyms: [] },
      { text: 'Tokyo', points: 16, synonyms: [] },
      { text: 'Chicago', points: 14, synonyms: [] },
      { text: 'Mexico City', points: 10, synonyms: ['mexico'] },
    ],
  },
  {
    id: 'trvl-10',
    category: 'travel',
    question: 'Name something people buy at the airport.',
    answers: [
      { text: 'Food', points: 25, synonyms: ['snacks', 'meal'] },
      { text: 'Water', points: 20, synonyms: ['drinks', 'bottle of water'] },
      { text: 'Magazine', points: 16, synonyms: ['book', 'reading material'] },
      { text: 'Neck Pillow', points: 14, synonyms: ['travel pillow', 'pillow'] },
      { text: 'Headphones', points: 12, synonyms: ['earbuds'] },
      { text: 'Souvenirs', points: 8, synonyms: ['gifts', 'gift shop'] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // BONUS / MIXED (extra questions to hit 200+)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'mix-01',
    category: 'everyday',
    question: 'Name something that comes in pairs.',
    answers: [
      { text: 'Shoes', points: 28, synonyms: ['shoe'] },
      { text: 'Socks', points: 22, synonyms: ['sock'] },
      { text: 'Eyes', points: 18, synonyms: ['eye'] },
      { text: 'Earrings', points: 14, synonyms: ['earring'] },
      { text: 'Gloves', points: 10, synonyms: ['mittens'] },
      { text: 'Twins', points: 8, synonyms: [] },
    ],
  },
  {
    id: 'mix-02',
    category: 'food',
    question: 'Name a food you eat with your hands.',
    answers: [
      { text: 'Pizza', points: 28, synonyms: [] },
      { text: 'Chicken', points: 22, synonyms: ['fried chicken', 'chicken wings'] },
      { text: 'Burger', points: 18, synonyms: ['hamburger'] },
      { text: 'Tacos', points: 14, synonyms: ['taco'] },
      { text: 'Sandwich', points: 10, synonyms: ['sub', 'hoagie'] },
      { text: 'Fries', points: 8, synonyms: ['french fries', 'chips'] },
    ],
  },
  {
    id: 'mix-03',
    category: 'people',
    question: 'Name a reason people get fired.',
    answers: [
      { text: 'Being Late', points: 25, synonyms: ['tardiness', 'always late'] },
      { text: 'Stealing', points: 22, synonyms: ['theft'] },
      { text: 'Not Doing Work', points: 18, synonyms: ['lazy', 'not working', 'slacking'] },
      { text: 'Bad Attitude', points: 14, synonyms: ['attitude', 'rude'] },
      { text: 'Fighting', points: 12, synonyms: ['argument', 'conflict'] },
      { text: 'Social Media', points: 9, synonyms: ['inappropriate post', 'online behavior'] },
    ],
  },
  {
    id: 'mix-04',
    category: 'entertainment',
    question: 'Name something people do at the movies.',
    answers: [
      { text: 'Eat Popcorn', points: 28, synonyms: ['popcorn'] },
      { text: 'Talk', points: 18, synonyms: ['whisper', 'chat'] },
      { text: 'Check Phone', points: 16, synonyms: ['phone', 'text'] },
      { text: 'Fall Asleep', points: 14, synonyms: ['sleep', 'nap'] },
      { text: 'Drink Soda', points: 12, synonyms: ['drink', 'soda'] },
      { text: 'Make Out', points: 12, synonyms: ['kiss'] },
    ],
  },
  {
    id: 'mix-05',
    category: 'holidays',
    question: 'Name something red.',
    answers: [
      { text: 'Fire Truck', points: 22, synonyms: ['fire engine'] },
      { text: 'Blood', points: 20, synonyms: [] },
      { text: 'Rose', points: 18, synonyms: ['roses'] },
      { text: 'Stop Sign', points: 16, synonyms: [] },
      { text: 'Apple', points: 14, synonyms: ['red apple'] },
      { text: 'Lips', points: 10, synonyms: ['lipstick'] },
    ],
  },
  {
    id: 'mix-06',
    category: 'everyday',
    question: 'Name something that makes a noise at night.',
    answers: [
      { text: 'Dog', points: 22, synonyms: ['dogs barking', 'barking'] },
      { text: 'Crickets', points: 20, synonyms: ['cricket', 'insects'] },
      { text: 'Car Alarm', points: 16, synonyms: ['alarm'] },
      { text: 'Snoring', points: 15, synonyms: ['snore'] },
      { text: 'Owl', points: 14, synonyms: ['owls', 'hoot'] },
      { text: 'Thunder', points: 8, synonyms: ['storm', 'rain'] },
    ],
  },
  {
    id: 'mix-07',
    category: 'sports',
    question: 'Name something people do to stay fit.',
    answers: [
      { text: 'Running', points: 25, synonyms: ['run', 'jogging', 'jog'] },
      { text: 'Gym', points: 22, synonyms: ['lift weights', 'workout', 'work out'] },
      { text: 'Yoga', points: 16, synonyms: ['stretching'] },
      { text: 'Walking', points: 14, synonyms: ['walk', 'hiking'] },
      { text: 'Swimming', points: 12, synonyms: ['swim'] },
      { text: 'Diet', points: 11, synonyms: ['eating healthy', 'eat healthy'] },
    ],
  },
  {
    id: 'mix-08',
    category: 'technology',
    question: 'Name something robots might replace.',
    answers: [
      { text: 'Cashiers', points: 22, synonyms: ['checkout', 'self checkout'] },
      { text: 'Factory Workers', points: 20, synonyms: ['manufacturing', 'assembly line'] },
      { text: 'Drivers', points: 18, synonyms: ['taxi drivers', 'truck drivers', 'driving'] },
      { text: 'Fast Food Workers', points: 14, synonyms: ['cooks', 'food service'] },
      { text: 'Customer Service', points: 14, synonyms: ['call center', 'support'] },
      { text: 'Doctors', points: 12, synonyms: ['surgeons'] },
    ],
  },
  {
    id: 'mix-09',
    category: 'travel',
    question: 'Name something you see in a hotel room.',
    answers: [
      { text: 'Bed', points: 28, synonyms: ['beds'] },
      { text: 'TV', points: 22, synonyms: ['television'] },
      { text: 'Bible', points: 16, synonyms: ['book'] },
      { text: 'Mini Fridge', points: 12, synonyms: ['minibar', 'fridge'] },
      { text: 'Safe', points: 10, synonyms: [] },
      { text: 'Towels', points: 8, synonyms: ['towel'] },
    ],
  },
  {
    id: 'mix-10',
    category: 'animals',
    question: 'Name an animal that can fly.',
    answers: [
      { text: 'Bird', points: 28, synonyms: ['birds', 'eagle', 'hawk'] },
      { text: 'Bat', points: 22, synonyms: ['bats'] },
      { text: 'Butterfly', points: 18, synonyms: ['butterflies'] },
      { text: 'Bee', points: 14, synonyms: ['bees'] },
      { text: 'Parrot', points: 10, synonyms: ['parrots'] },
      { text: 'Fly', points: 8, synonyms: ['flies', 'insect'] },
    ],
  },
  {
    id: 'mix-11',
    category: 'food',
    question: 'Name a food people eat on a diet.',
    answers: [
      { text: 'Salad', points: 30, synonyms: ['salads'] },
      { text: 'Chicken Breast', points: 20, synonyms: ['chicken', 'grilled chicken'] },
      { text: 'Rice', points: 16, synonyms: ['brown rice'] },
      { text: 'Vegetables', points: 14, synonyms: ['veggies', 'broccoli'] },
      { text: 'Fruit', points: 12, synonyms: ['fruits', 'berries'] },
      { text: 'Yogurt', points: 8, synonyms: ['greek yogurt'] },
    ],
  },
  {
    id: 'mix-12',
    category: 'people',
    question: 'Name something people are afraid of.',
    answers: [
      { text: 'Heights', points: 25, synonyms: ['falling'] },
      { text: 'Spiders', points: 22, synonyms: ['bugs', 'insects'] },
      { text: 'Death', points: 18, synonyms: ['dying'] },
      { text: 'Snakes', points: 14, synonyms: ['snake'] },
      { text: 'Public Speaking', points: 12, synonyms: ['speaking', 'presentations'] },
      { text: 'The Dark', points: 9, synonyms: ['darkness'] },
    ],
  },
  {
    id: 'mix-13',
    category: 'entertainment',
    question: 'Name a superhero.',
    answers: [
      { text: 'Spider-Man', points: 25, synonyms: ['spiderman', 'spider man'] },
      { text: 'Batman', points: 22, synonyms: ['bat man'] },
      { text: 'Superman', points: 18, synonyms: ['super man'] },
      { text: 'Iron Man', points: 14, synonyms: ['ironman', 'tony stark'] },
      { text: 'Wonder Woman', points: 12, synonyms: [] },
      { text: 'Captain America', points: 9, synonyms: ['cap'] },
    ],
  },
  {
    id: 'mix-14',
    category: 'everyday',
    question: 'Name something people do when they are bored.',
    answers: [
      { text: 'Watch TV', points: 25, synonyms: ['tv', 'netflix'] },
      { text: 'Scroll Phone', points: 22, synonyms: ['phone', 'social media'] },
      { text: 'Eat', points: 18, synonyms: ['snack', 'eating'] },
      { text: 'Sleep', points: 14, synonyms: ['nap'] },
      { text: 'Play Games', points: 12, synonyms: ['video games', 'gaming'] },
      { text: 'Clean', points: 9, synonyms: ['cleaning', 'organize'] },
    ],
  },
  {
    id: 'mix-15',
    category: 'holidays',
    question: 'Name something people eat at a carnival or fair.',
    answers: [
      { text: 'Funnel Cake', points: 25, synonyms: ['funnel cakes'] },
      { text: 'Cotton Candy', points: 22, synonyms: ['candy floss'] },
      { text: 'Corn Dog', points: 18, synonyms: ['corn dogs'] },
      { text: 'Popcorn', points: 14, synonyms: [] },
      { text: 'Candy Apple', points: 12, synonyms: ['caramel apple'] },
      { text: 'Turkey Leg', points: 9, synonyms: [] },
    ],
  },
  {
    id: 'mix-16',
    category: 'sports',
    question: 'Name something associated with bowling.',
    answers: [
      { text: 'Ball', points: 25, synonyms: ['bowling ball'] },
      { text: 'Pins', points: 22, synonyms: ['pin'] },
      { text: 'Shoes', points: 18, synonyms: ['bowling shoes', 'rental shoes'] },
      { text: 'Lane', points: 14, synonyms: ['lanes', 'bowling lane'] },
      { text: 'Strike', points: 12, synonyms: ['strikes'] },
      { text: 'Gutter', points: 9, synonyms: ['gutter ball'] },
    ],
  },
  {
    id: 'mix-17',
    category: 'technology',
    question: 'Name a reason your phone dies fast.',
    answers: [
      { text: 'Social Media', points: 25, synonyms: ['tiktok', 'instagram', 'scrolling'] },
      { text: 'Old Battery', points: 20, synonyms: ['bad battery', 'old phone'] },
      { text: 'Gaming', points: 18, synonyms: ['games', 'playing games'] },
      { text: 'Screen Brightness', points: 14, synonyms: ['bright screen', 'brightness'] },
      { text: 'Streaming', points: 12, synonyms: ['watching videos', 'youtube', 'netflix'] },
      { text: 'GPS', points: 11, synonyms: ['maps', 'navigation', 'google maps'] },
    ],
  },
  {
    id: 'mix-18',
    category: 'school',
    question: 'Name something you need for a presentation.',
    answers: [
      { text: 'Slides', points: 25, synonyms: ['powerpoint', 'slideshow', 'ppt'] },
      { text: 'Laptop', points: 20, synonyms: ['computer'] },
      { text: 'Projector', points: 18, synonyms: ['screen'] },
      { text: 'Notes', points: 14, synonyms: ['cue cards', 'note cards'] },
      { text: 'Confidence', points: 12, synonyms: ['courage', 'practice'] },
      { text: 'Pointer', points: 11, synonyms: ['laser pointer', 'clicker'] },
    ],
  },
  {
    id: 'mix-19',
    category: 'travel',
    question: 'Name something you do at the beach.',
    answers: [
      { text: 'Swim', points: 28, synonyms: ['swimming', 'go in the water'] },
      { text: 'Sunbathe', points: 22, synonyms: ['tan', 'lay out', 'suntan'] },
      { text: 'Build Sandcastle', points: 16, synonyms: ['sandcastle', 'sand castle', 'play in sand'] },
      { text: 'Surf', points: 12, synonyms: ['surfing', 'boogie board'] },
      { text: 'Walk', points: 12, synonyms: ['walk on beach', 'stroll'] },
      { text: 'Read', points: 10, synonyms: ['read a book'] },
    ],
  },
  {
    id: 'mix-20',
    category: 'animals',
    question: 'Name an animal with a long neck.',
    answers: [
      { text: 'Giraffe', points: 40, synonyms: ['giraffes'] },
      { text: 'Flamingo', points: 20, synonyms: ['flamingos'] },
      { text: 'Swan', points: 15, synonyms: ['swans'] },
      { text: 'Ostrich', points: 12, synonyms: ['ostriches'] },
      { text: 'Llama', points: 8, synonyms: ['alpaca'] },
      { text: 'Dinosaur', points: 5, synonyms: ['brontosaurus', 'diplodocus'] },
    ],
  },
];
