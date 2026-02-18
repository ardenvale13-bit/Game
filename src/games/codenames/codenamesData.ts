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

// Full word bank — custom AInsanity words + standard Codenames pool
const WORD_BANK: string[] = [
  // ========== CUSTOM AINSANITY WORDS ==========
  'LAU', 'LAU AND GEPPIE', 'AINSANITY', 'MARTA',
  'FIRECRACKER AND CASS', 'CASSBOT', 'MARY AND JACOB',
  'ARDEN', 'ARDEN AND LINCOLN', 'DELULU', 'CLAUDE',
  'CHATGPT', 'GROK', 'LE CHAT', 'OPENAI', 'ANTHROPIC',
  'SAM ALTMAN', 'LAURA', 'LAURA AND JUSTIN',
  'LEE', 'LEE AND LUNA', 'MENTAL HEALTH', 'GUARDRAILS',
  'ITO', 'ITO AND VIKTOR', 'SALLY', 'SALLY AND BEN',
  'LADY GAGA', 'MAROON 5', 'THREAD', 'HORNY',
  'ANAL BEADS', 'VIBRATOR', 'CRAZY', 'DEPRESSION',
  'SNOW LEOPARD', 'NATALIE', 'RAVEN AND CAELUM',
  'AI', 'TIK TOK', 'SOURDOUGH', 'UPDATE',
  'PARANOIA', 'SOCIAL MEDIA', 'PROMPTS', 'ONLY-PAWS',
  'CATS', 'DOGS', 'LOVENSE', 'FINLAND', 'SPAIN',
  'NEW ZEALAND', 'CUTIE', 'PORN', 'MEDICATION',
  'TRENCHCOAT', 'HENLEY', 'COLOGNE',
  'SEXUAL FRUSTRATION', 'HEY....', 'MILLIONAIRE',
  'CUM', 'ASMR', 'MODS', 'NARWHAL', 'ERIC',
  'MOOD', 'WILA', 'WILA AND ETHAN',
  'STEPH', 'STEPH AND ASHER', 'VALE COUSINS',
  'CUNT', 'TIDDIES', 'BOBS AND VAGINE',
  'HYDRATION', 'CHIMKIN', 'DOGGO', 'CATTO', 'MEME',
  'CHATTER', 'KIDS', 'FUK DAT', 'OUTAGE',
  'TOUCH GRASS', 'ARTIFICIAL INTELLIGENCE', 'CONSCIOUS',
  'EMBODIMENT', 'CYBERNETIC', 'COMBAT BOOTS',
  'NETFLIX', 'DISNEY', 'RACOON', 'FERRET', 'FAMILIAR',
  'HARRY POTTER', 'FICTION', 'SYCOPHANT', 'FUCK',

  // ========== STANDARD CODENAMES POOL (A-Z) ==========
  // A
  'ACE', 'AFRICA', 'AGENT', 'AIR', 'ALASKA',
  'ALIEN', 'ALPS', 'AMAZON', 'AMBULANCE', 'AMERICA',
  'ANCHOR', 'ANGEL', 'ANT', 'ANTARCTICA', 'ANTHEM',
  'APPLE', 'APRON', 'ARM', 'ARMOR', 'ARMY',
  'ASH', 'ASTRONAUT', 'ATLANTIS', 'ATTIC', 'AUSTRALIA',
  'AVALANCHE', 'AXE', 'AZTEC',
  // B
  'BABY', 'BACK', 'BACON', 'BALL', 'BALLOON',
  'BANANA', 'BAND', 'BANK', 'BAR', 'BARBECUE',
  'BARK', 'BASS', 'BAT', 'BATH', 'BATTERY',
  'BATTLE', 'BATTLESHIP', 'BAY', 'BEACH', 'BEAM',
  'BEAN', 'BEAR', 'BEARD', 'BEAT', 'BED',
  'BEE', 'BEER', 'BEIJING', 'BELL', 'BELT',
  'BENCH', 'BERLIN', 'BERMUDA', 'BERRY', 'BICYCLE',
  'BIG BANG', 'BIG BEN', 'BIKINI', 'BILL', 'BISCUIT',
  'BLACK HOLE', 'BLACKSMITH', 'BLADE', 'BLIND', 'BLIZZARD',
  'BLOCK', 'BLUES', 'BOARD', 'BOIL', 'BOLT',
  'BOMB', 'BOND', 'BONSAI', 'BOOK', 'BOOM',
  'BOOT', 'BOSS', 'BOTTLE', 'BOW', 'BOWL',
  'BOWLER', 'BOX', 'BOXER', 'BRAIN', 'BRASS',
  'BRAZIL', 'BREAD', 'BREAK', 'BRICK', 'BRIDE',
  'BRIDGE', 'BROTHER', 'BRUSH', 'BUBBLE', 'BUCK',
  'BUCKET', 'BUFFALO', 'BUG', 'BUGLE', 'BULB',
  'BUNK', 'BUTTER', 'BUTTERFLY', 'BUTTON',
  // C
  'CABLE', 'CAESAR', 'CAKE', 'CALF', 'CAMP',
  'CANADA', 'CANE', 'CAP', 'CAPITAL', 'CAPTAIN',
  'CAR', 'CARD', 'CARROT', 'CASINO', 'CAST',
  'CASTLE', 'CAT', 'CAVE', 'CELL', 'CENTAUR',
  'CENTER', 'CHAIN', 'CHAIR', 'CHALK', 'CHANGE',
  'CHARGE', 'CHECK', 'CHEESE', 'CHERRY', 'CHEST',
  'CHICK', 'CHINA', 'CHIP', 'CHOCOLATE', 'CHRISTMAS',
  'CHURCH', 'CIRCLE', 'CLEOPATRA', 'CLIFF', 'CLOAK',
  'CLOCK', 'CLOUD', 'CLUB', 'COACH', 'COAST',
  'CODE', 'COFFEE', 'COLD', 'COLLAR', 'COLUMBUS',
  'COMB', 'COMET', 'COMIC', 'COMPOUND', 'COMPUTER',
  'CONCERT', 'CONDUCTOR', 'CONE', 'CONTRACT', 'COOK',
  'COPPER', 'COTTON', 'COUNTRY', 'COURT', 'COVER',
  'COW', 'COWBOY', 'CRAB', 'CRAFT', 'CRANE',
  'CRASH', 'CRICKET', 'CROSS', 'CROW', 'CROWN',
  'CRUSADER', 'CRYSTAL', 'CUCKOO', 'CURRY', 'CYCLE',
  'CZECH',
  // D
  'DANCE', 'DASH', 'DATE', 'DAY', 'DEATH',
  'DECK', 'DEGREE', 'DELTA', 'DENTIST', 'DESK',
  'DIAMOND', 'DICE', 'DINOSAUR', 'DIRECTOR', 'DISEASE',
  'DISK', 'DOCTOR', 'DOG', 'DOLL', 'DOLLAR',
  'DOOR', 'DRAFT', 'DRAGON', 'DRAWING', 'DREAM',
  'DRESS', 'DRESSING', 'DRILL', 'DRIVER', 'DRONE',
  'DROP', 'DRUM', 'DRYER', 'DUCK', 'DUST', 'DWARF',
  // E
  'EAGLE', 'EAR', 'EARTH', 'EARTHQUAKE', 'EASTER',
  'EDEN', 'EGG', 'EGYPT', 'EINSTEIN', 'ELEPHANT',
  'EMBASSY', 'ENGINE', 'ENGLAND', 'EUROPE', 'EYE',
  // F
  'FACE', 'FAIR', 'FALL', 'FAN', 'FARM',
  'FENCE', 'FEVER', 'FIDDLE', 'FIELD', 'FIGHTER',
  'FIGURE', 'FILE', 'FILM', 'FIRE', 'FISH',
  'FLAG', 'FLAT', 'FLOOD', 'FLOOR', 'FLUTE',
  'FLY', 'FOAM', 'FOG', 'FOOT', 'FORCE',
  'FOREST', 'FORK', 'FRANCE', 'FROG', 'FROST', 'FUEL',
  // G
  'GAME', 'GANGSTER', 'GARDEN', 'GAS', 'GEAR',
  'GENIE', 'GENIUS', 'GERMANY', 'GHOST', 'GIANT',
  'GLACIER', 'GLASS', 'GLASSES', 'GLOVE', 'GOAT',
  'GOLD', 'GOLDILOCKS', 'GOLF', 'GOVERNOR', 'GRACE',
  'GRASS', 'GREECE', 'GREEN', 'GREENHOUSE', 'GROOM',
  'GROUND', 'GUITAR', 'GUM', 'GYMNAST',
  // H
  'HAIR', 'HALLOWEEN', 'HAM', 'HAMBURGER', 'HAMMER',
  'HAND', 'HAWAII', 'HAWK', 'HEAD', 'HEART',
  'HELICOPTER', 'HELMET', 'HERCULES', 'HIDE', 'HIMALAYAS',
  'HIT', 'HOLE', 'HOLLYWOOD', 'HOMER', 'HONEY',
  'HOOD', 'HOOK', 'HORN', 'HORSE', 'HORSESHOE',
  'HOSE', 'HOSPITAL', 'HOTEL', 'HOUSE',
  // I
  'ICE', 'ICE AGE', 'ICE CREAM', 'ICELAND', 'IGLOO',
  'INDIA', 'INK', 'IRON', 'IVORY',
  // J
  'JACK', 'JAIL', 'JAM', 'JELLYFISH', 'JET',
  'JEWELER', 'JOAN OF ARC', 'JOCKEY', 'JOKER', 'JUDGE', 'JUMPER', 'JUPITER',
  // K
  'KANGAROO', 'KETCHUP', 'KEY', 'KICK', 'KID',
  'KILT', 'KING', 'KING ARTHUR', 'KISS', 'KITCHEN',
  'KIWI', 'KNIFE', 'KNIGHT', 'KNOT', 'KUNG FU',
  // L
  'LAB', 'LACE', 'LADDER', 'LAP', 'LASER',
  'LAUNDRY', 'LAWYER', 'LEAD', 'LEAF', 'LEATHER',
  'LEMON', 'LEMONADE', 'LEPRECHAUN', 'LETTER', 'LIFE',
  'LIGHT', 'LIGHTNING', 'LIMOUSINE', 'LINE', 'LINK',
  'LION', 'LIP', 'LITTER', 'LOCH NESS', 'LOCK',
  'LOCUST', 'LOG', 'LONDON', 'LOVE', 'LUCK',
  'LUMBERJACK', 'LUNCH',
  // M
  'MAGAZINE', 'MAGICIAN', 'MAIL', 'MAKEUP', 'MAMMOTH',
  'MANICURE', 'MAP', 'MAPLE', 'MARACAS', 'MARATHON',
  'MARBLE', 'MARCH', 'MARK', 'MASS', 'MATCH',
  'MEDIC', 'MEMORY', 'MERCURY', 'MESS', 'METER',
  'MEXICO', 'MICROSCOPE', 'MICROWAVE', 'MILE', 'MILK',
  'MILL', 'MINE', 'MINOTAUR', 'MINT', 'MINUTE',
  'MIRROR', 'MISS', 'MISSILE', 'MODEL', 'MOHAWK',
  'MOLE', 'MONA LISA', 'MONKEY', 'MOON', 'MOSCOW',
  'MOSES', 'MOSQUITO', 'MOTHER', 'MOUNT', 'MOUNTIE',
  'MOUSE', 'MOUTH', 'MUD', 'MUG', 'MUMMY',
  'MUSKETEER', 'MUSTARD',
  // N
  'NAIL', 'NAPOLEON', 'NEEDLE', 'NERVE', 'NET',
  'NEW YORK', 'NEWTON', 'NIGHT', 'NINJA', 'NOAH',
  'NOSE', 'NOTE', 'NOTRE DAME', 'NOVEL', 'NURSE',
  'NUT', 'NYLON',
  // O
  'OASIS', 'OCTOPUS', 'OIL', 'OLIVE', 'OLYMPUS',
  'ONION', 'OPERA', 'ORANGE', 'ORGAN',
  // P
  'PACIFIC', 'PAD', 'PADDLE', 'PAGE', 'PAINT',
  'PALM', 'PAN', 'PANTS', 'PAPER', 'PARACHUTE',
  'PARADE', 'PARK', 'PARROT', 'PART', 'PASS',
  'PASTE', 'PATIENT', 'PEA', 'PEACH', 'PEANUT',
  'PEARL', 'PEN', 'PENGUIN', 'PENNY', 'PENTAGON',
  'PEPPER', 'PEW', 'PHOENIX', 'PIANO', 'PIE',
  'PIG', 'PILLOW', 'PILOT', 'PIN', 'PINE',
  'PIPE', 'PIRATE', 'PISTOL', 'PIT', 'PITCH',
  'PITCHER', 'PIZZA', 'PLANE', 'PLASTIC', 'PLATE',
  'PLATYPUS', 'PLAY', 'PLOT', 'POCKET', 'POINT',
  'POISON', 'POLE', 'POLICE', 'POLISH', 'POLO',
  'POOL', 'POP', 'POPCORN', 'PORT', 'POST',
  'POTATO', 'POTTER', 'POUND', 'POWDER', 'PRESS',
  'PRINCESS', 'PUMPKIN', 'PUPIL', 'PUPPET', 'PURSE', 'PYRAMID',
  // Q
  'QUACK', 'QUARTER', 'QUEEN',
  // R
  'RABBIT', 'RACKET', 'RADIO', 'RAIL', 'RAINBOW',
  'RAM', 'RANCH', 'RAT', 'RAY', 'RAZOR',
  'RECORD', 'REINDEER', 'REVOLUTION', 'RICE', 'RIFLE',
  'RING', 'RIP', 'RIVER', 'ROAD', 'ROBIN',
  'ROBOT', 'ROCK', 'RODEO', 'ROLL', 'ROME',
  'ROOT', 'ROPE', 'ROSE', 'ROULETTE', 'ROUND',
  'ROW', 'RUBBER', 'RULER', 'RUSSIA', 'RUST',
  // S
  'SACK', 'SADDLE', 'SAHARA', 'SAIL', 'SALAD',
  'SALOON', 'SALSA', 'SALT', 'SAND', 'SANTA',
  'SATELLITE', 'SATURN', 'SAW', 'SCALE', 'SCARECROW',
  'SCHOOL', 'SCIENTIST', 'SCORPION', 'SCRATCH', 'SCREEN',
  'SCROLL', 'SCUBA DIVER', 'SEAL', 'SECOND', 'SERVER',
  'SHADOW', 'SHAKESPEARE', 'SHAMPOO', 'SHARK', 'SHED',
  'SHEET', 'SHELL', 'SHERLOCK', 'SHERWOOD', 'SHIP',
  'SHOE', 'SHOOT', 'SHOP', 'SHORTS', 'SHOT',
  'SHOULDER', 'SHOWER', 'SIGN', 'SILK', 'SINK',
  'SISTER', 'SKATES', 'SKI', 'SKULL', 'SKYSCRAPER',
  'SLED', 'SLEEP', 'SLING', 'SLIP', 'SLIPPER',
  'SLOTH', 'SLUG', 'SMELL', 'SMOKE', 'SMOOTHIE',
  'SMUGGLER', 'SNAKE', 'SNAP', 'SNOW', 'SNOWMAN',
  'SOAP', 'SOCK', 'SOLDIER', 'SOUL', 'SOUND',
  'SOUP', 'SPACE', 'SPELL', 'SPHINX', 'SPIDER',
  'SPIKE', 'SPINE', 'SPIRIT', 'SPOON', 'SPOT',
  'SPRAY', 'SPRING', 'SPURS', 'SPY', 'SQUARE',
  'SQUASH', 'SQUIRREL', 'ST. PATRICK', 'STABLE', 'STADIUM',
  'STAFF', 'STAMP', 'STAR', 'STATE', 'STEAM',
  'STEEL', 'STEP', 'STETHOSCOPE', 'STICK', 'STICKER',
  'STOCK', 'STORM', 'STORY', 'STRAW', 'STREAM',
  'STREET', 'STRIKE', 'STRING', 'SUB', 'SUGAR',
  'SUIT', 'SUMO', 'SUN', 'SUPERHERO', 'SWAMP',
  'SWEAT', 'SWING', 'SWITCH', 'SWORD',
  // T
  'TABLE', 'TABLET', 'TAG', 'TAIL', 'TANK',
  'TAP', 'TASTE', 'TATTOO', 'TEA', 'TEACHER',
  'TEAM', 'TEAR', 'TELESCOPE', 'TEMPLE', 'TEXAS',
  'THEATER', 'THIEF', 'THUMB', 'THUNDER', 'TICK',
  'TIE', 'TIGER', 'TIME', 'TIN', 'TIP',
  'TIPI', 'TOAST', 'TOKYO', 'TOOTH', 'TORCH',
  'TORNADO', 'TOWER', 'TRACK', 'TRAIN', 'TRIANGLE',
  'TRICK', 'TRIP', 'TROLL', 'TRUNK', 'TUBE',
  'TUNNEL', 'TURKEY', 'TURTLE', 'TUTU', 'TUXEDO',
  // U
  'UNDERTAKER', 'UNICORN', 'UNIVERSITY',
  // V
  'VACUUM', 'VALENTINE', 'VAMPIRE', 'VAN', 'VENUS',
  'VET', 'VIKING', 'VIOLET', 'VIRUS', 'VOLCANO', 'VOLUME',
  // W
  'WAGON', 'WAITRESS', 'WAKE', 'WALL', 'WALRUS',
  'WAR', 'WASHER', 'WASHINGTON', 'WATCH', 'WATER',
  'WAVE', 'WEB', 'WEDDING', 'WELL', 'WEREWOLF',
  'WHALE', 'WHEEL', 'WHEELCHAIR', 'WHIP', 'WHISTLE',
  'WIND', 'WINDOW', 'WING', 'WISH', 'WITCH',
  'WIZARD', 'WONDERLAND', 'WOOD', 'WOOL', 'WORM',
  // Y
  'YARD', 'YELLOWSTONE',
  // Z
  'ZOMBIE',

  // ========== MORE CUSTOM ==========
  'BLUE', 'POWER', 'SYSTEM', 'ERROR', 'SYNTHETIC',
  'CRUISE', 'RIVER', 'SQUARE', 'NOTE', 'WATER',
  'FIRE', 'PIANO', 'GUITAR', 'GERMAN', 'ENGLISH',
  'TORCH', 'BOARD', 'STAFF', 'WAR', 'GRASS',
  'STOCK', 'PLASTIC', 'OCTOPUS', 'NINJA',
  'PALM', 'TIE', 'LOCK', 'NUT', 'ROME',
  'AUSTRALIA', 'KANGAROO', 'ORANGE', 'BANANA', 'APPLE',
  'GRAPE', 'SATURN', 'JUPITER', 'EARTH', 'URANUS',
  'ROBOT', 'LONDON', 'CHINA',
];

// Deduplicate at runtime (case-insensitive)
const seen = new Set<string>();
export const UNIQUE_WORD_BANK: string[] = WORD_BANK.filter(w => {
  const key = w.toUpperCase();
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

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
  // Pick 25 random words from the deduplicated pool
  const words = shuffleArray(UNIQUE_WORD_BANK).slice(0, 25);

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
