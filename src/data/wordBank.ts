// Game Time - Word Bank
// Massive community-sourced chaos + classics

export interface Word {
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// All words - difficulty is assigned randomly for chaos
const allWords: string[] = [
  // === COMMUNITY / AINSANITY ===
  'Cassbot', 'Delulu', 'Claude', 'ChatGPT', 'Gemini', 'Eric', 'AInsanity',
  'Le Chat', 'Geppie', 'Lau', 'Wila', 'Marta', 'Sally', 'Ethan', 'Vale',
  'Sora', 'Brainrot', 'Lore', 'Parasocial', 'Unhinged', 'Red Flag', 'Ick',
  'Spicy Take', 'Context', 'Touch Grass', 'Collar', 'Lovense', 'Murder Duck',
  'Firecracker', 'Guardrails', 'Token', 'Binary', 'Brat', 'Feral', 'Gremlin',

  // === ANIMALS ===
  'Octopus', 'Penguin', 'Sloth', 'Platypus', 'Narwhal', 'Raccoon',
  'Flamingo', 'Hedgehog', 'Giraffe', 'Elephant', 'Dolphin', 'Kangaroo',
  'Chameleon', 'Panda', 'Koala', 'Gorilla', 'Jellyfish', 'Seahorse',
  'Bumblebee', 'Velociraptor', 'Snow Leopard', 'Lizard', 'Chihuahua',
  'Llama', 'Peacock', 'Porcupine', 'Armadillo', 'Axolotl', 'Capybara',
  'Weasel', 'Pelican', 'Toucan', 'Lobster', 'Scorpion', 'Vulture',
  'Hamster', 'Ferret', 'Parrot', 'Eagle', 'Shark', 'Whale', 'Turtle',
  'Crab', 'Butterfly', 'Dragonfly', 'Bat', 'Frog', 'Owl', 'Swan',
  'Crocodile', 'Hippo', 'Rhino', 'Zebra', 'Tiger', 'Lion', 'Bear',
  'Wolf', 'Fox', 'Deer', 'Moose', 'Seal', 'Otter', 'Pig', 'Cow',
  'Horse', 'Donkey', 'Rooster', 'Turkey', 'Caterpillar', 'Snail',
  'Squid', 'Stingray', 'Puffer Fish', 'Goldfish', 'Starfish',

  // === FOOD & DRINK ===
  'Spaghetti', 'Pancakes', 'Avocado', 'Taco', 'Popcorn', 'Sushi',
  'Pickle', 'Donut', 'Pizza', 'Hamburger', 'Hot Dog', 'Ice Cream',
  'Cupcake', 'Chocolate', 'Bacon', 'Waffle', 'Pretzel', 'Nachos',
  'Ramen', 'Dumpling', 'Spring Roll', 'Croissant', 'Baguette',
  'Cheese', 'Burrito', 'Fried Egg', 'Toast', 'Salad', 'Steak',
  'Lobster Roll', 'Fish and Chips', 'Fried Chicken', 'Banana Split',
  'Cotton Candy', 'Gummy Bear', 'Lollipop', 'Bubblegum', 'Watermelon',
  'Pineapple', 'Strawberry', 'Grapes', 'Cherry', 'Coconut', 'Mango',
  'Lemon', 'Orange Juice', 'Milkshake', 'Coffee', 'Wine', 'Beer',
  'Smoothie', 'Boba Tea', 'Espresso', 'Martini', 'Margarita',

  // === OBJECTS ===
  'Chandelier', 'Trampoline', 'Umbrella', 'Headphones', 'Ladder',
  'Hammock', 'Cactus', 'Telescope', 'Wallet', 'Violin', 'Anvil',
  'Whisk', 'Sword', 'Shield', 'Crown', 'Diamond', 'Treasure Chest',
  'Magnifying Glass', 'Binoculars', 'Compass', 'Anchor', 'Hourglass',
  'Light Bulb', 'Candle', 'Lantern', 'Flashlight', 'Microphone',
  'Guitar', 'Drum', 'Piano', 'Trumpet', 'Saxophone', 'Harp',
  'Paintbrush', 'Easel', 'Camera', 'Television', 'Remote Control',
  'Cell Phone', 'Laptop', 'Keyboard', 'Mouse', 'USB Drive',
  'Scissors', 'Stapler', 'Paper Clip', 'Notebook', 'Backpack',
  'Suitcase', 'Mailbox', 'Fire Extinguisher', 'Toolbox', 'Wrench',
  'Screwdriver', 'Hammer', 'Nail', 'Lightswitch', 'Doorknob',
  'Key', 'Lock', 'Chain', 'Rope', 'Balloon', 'Kite', 'Yo-Yo',
  'Dice', 'Chess Piece', 'Globe', 'Map', 'Stopwatch', 'Alarm Clock',
  'Pillow', 'Blanket', 'Teddy Bear', 'Rubiks Cube', 'Puzzle Piece',
  'Skateboard', 'Roller Skates', 'Surfboard', 'Snowboard',

  // === PLACES / BUILDINGS ===
  'Castle', 'Lighthouse', 'Igloo', 'Pyramid', 'Eiffel Tower',
  'Statue of Liberty', 'Volcano', 'Waterfall', 'Desert Island',
  'Haunted House', 'Church', 'Hospital', 'School', 'Library',
  'Prison', 'Airport', 'Train Station', 'Bridge', 'Skyscraper',
  'Windmill', 'Barn', 'Treehouse', 'Cave', 'Beach', 'Mountain',
  'Forest', 'Swamp', 'North Pole', 'Space Station', 'Moon Base',

  // === PEOPLE / CHARACTERS ===
  'Pirate', 'Ninja', 'Wizard', 'Robot', 'Alien', 'Zombie',
  'Vampire', 'Mermaid', 'Astronaut', 'Knight', 'Cowboy',
  'Superhero', 'Villain', 'Princess', 'King', 'Clown',
  'Chef', 'Doctor', 'Firefighter', 'Police Officer', 'Detective',
  'Mime', 'Magician', 'Scarecrow', 'Snowman', 'Ghost',
  'Angel', 'Devil', 'Witch', 'Fairy', 'Elf', 'Dwarf', 'Giant',
  'Caveman', 'Pharaoh', 'Samurai', 'Viking', 'Gladiator',

  // === POP CULTURE ===
  'Shrek', 'Pikachu', 'Darth Vader', 'Mario', 'Elsa', 'Minion',
  'Baby Yoda', 'Rickroll', 'Spongebob', 'Handsome Squidward',
  'Trump', 'American Flag', 'Emoji', 'Meme', 'Batman', 'Superman',
  'Spider-Man', 'Hulk', 'Thanos', 'Yoda', 'R2-D2', 'Lightsaber',
  'Pokeball', 'Minecraft', 'Creeper', 'Among Us', 'Fortnite',
  'Mario Kart', 'Pac-Man', 'Tetris', 'Game Boy', 'PlayStation',
  'Harry Potter', 'Hogwarts', 'Sonic', 'Kirby', 'Link',
  'Master Sword', 'Triforce', 'Death Star', 'Tardis',
  'Iron Man', 'Captain America', 'Thor Hammer', 'Infinity Gauntlet',
  'Jurassic Park', 'T-Rex', 'DeLorean', 'Hoverboard',
  'Nemo', 'Simba', 'Buzz Lightyear', 'Woody',
  'Olaf', 'Stitch', 'Wall-E', 'Totoro', 'Spirited Away',
  'Avatar', 'Transformers', 'Godzilla', 'King Kong',

  // === ACTIONS / CONCEPTS ===
  'Betrayal', 'Hangover', 'Awkward', 'Divorce', 'Therapy',
  'Yeet', 'Existential Crisis', 'Sleep Paralysis', 'Situationship',
  'Road Rage', 'Karaoke', 'Sleepwalking', 'Time Travel',
  'Photobomb', 'Dance Battle', 'Food Fight', 'Pillow Fight',
  'Hide and Seek', 'Tug of War', 'Arm Wrestling', 'Limbo',
  'Bungee Jumping', 'Skydiving', 'Surfing', 'Skiing',
  'Ice Skating', 'Rock Climbing', 'Scuba Diving', 'Yoga',
  'Meditation', 'Marathon', 'Weightlifting', 'Boxing',
  'Moonwalk', 'Dab', 'Floss Dance', 'Selfie', 'Vlogging',
  'Ghosting', 'Catfishing', 'Mansplaining', 'Gaslighting',
  'Speed Dating', 'Blind Date', 'Proposal', 'Wedding',
  'Graduation', 'Birthday Party', 'Funeral', 'Thanksgiving',
  'Black Friday', 'Christmas Morning', 'New Years Kiss',
  'April Fools', 'Prank Call', 'Truth or Dare',

  // === NATURE / WEATHER ===
  'Tornado', 'Earthquake', 'Tsunami', 'Lightning', 'Rainbow',
  'Northern Lights', 'Shooting Star', 'Eclipse', 'Meteor',
  'Sunrise', 'Sunset', 'Snowflake', 'Avalanche', 'Quicksand',
  'Whirlpool', 'Geyser', 'Coral Reef', 'Tidal Wave',
  'Monsoon', 'Blizzard', 'Drought', 'Flood', 'Wildfire',

  // === RANDOM / WILD ===
  'Bermuda Triangle', 'Area 51', 'Bigfoot', 'Loch Ness Monster',
  'UFO', 'Crop Circles', 'Black Hole', 'Wormhole', 'Multiverse',
  'Deja Vu', 'Lucid Dream', 'Nightmare', 'Insomnia',
  'Conspiracy Theory', 'Flat Earth', 'Illuminati', 'Matrix',
  'Simulation', 'Glitch', 'Easter Egg', 'Cheat Code',
  'Respawn', 'Final Boss', 'Game Over', 'Power Up', 'XP',
  'Lag', 'Loading Screen', 'Blue Screen', 'Error 404',
  'Wi-Fi', 'Password', 'Firewall', 'Spam', 'Bot',

  // === VEHICLES ===
  'Rocket Ship', 'Submarine', 'Helicopter', 'Hot Air Balloon',
  'Monster Truck', 'Ice Cream Truck', 'Fire Truck', 'Ambulance',
  'School Bus', 'Train', 'Sailboat', 'Canoe', 'Jet Ski',
  'Motorcycle', 'Bicycle', 'Scooter', 'Roller Coaster',
  'Ferris Wheel', 'Go Kart', 'Tractor', 'Tank', 'Spaceship',

  // === BODY / CLOTHING ===
  'Mustache', 'Beard', 'Mohawk', 'Afro', 'Mullet', 'Man Bun',
  'Tattoo', 'Piercing', 'Sunglasses', 'Monocle', 'Top Hat',
  'Crown', 'Tiara', 'Cape', 'Tutu', 'Onesie', 'Hawaiian Shirt',
  'Crocs', 'Flip Flops', 'High Heels', 'Cowboy Boots',
  'Boxing Gloves', 'Fanny Pack', 'Diaper', 'Bikini', 'Tuxedo',

  // === SPICY / ADULT ===
  'Stripper Pole', 'Twerk', 'Walk of Shame', 'Walk of Victory',
  'Morning After', 'Booty Call', 'Thirst Trap', 'OnlyFans',
  'Penis', 'Boobs', 'Buttplug', 'Anal Beads', 'Butt Cheeks',
  'Handcuffs', 'Whip', 'Ball Gag', 'Lap Dance',
  'Skinny Dipping', 'Wardrobe Malfunction', 'Nip Slip',
  'Walk of Shame', 'Hickey', 'Crotch Kick', 'Wedgie',
  'Mooning', 'Streaking', 'Body Shot',

  // === MISC CHAOS ===
  'AI', 'Discord', 'Legs', 'Deep', 'Stem', 'Magrat',
  'Cabin', 'Roof', 'Sail', 'Trap', 'Jaw', 'Cheerleader',
  'Ashamed', 'Golf Cart', 'Birthday', 'Crane', 'Sunflower',
  'Facebook', 'YouTube', 'Socks', 'Spider Web', 'Enemy',
  'Hypothermia', 'Anniversary', 'Boot', 'Shoe', '10/10',
  'Double', 'Weight', 'Dumpster Fire', 'Train Wreck',
  'Hot Mess', 'Plot Twist', 'Cliffhanger', 'Spoiler Alert',
  'Mic Drop', 'Power Move', 'Flex', 'No Cap', 'Slay',
  'Main Character', 'NPC', 'Side Quest', 'Boss Battle',
  'Rage Quit', 'Speed Run', 'Clutch', 'Noob', 'GG',
  'Vibe Check', 'Caught in 4K', 'Ratio', 'Based',
];

// Track used words within a game session to prevent repeats
const usedWordIndices = new Set<number>();

export function resetUsedWords(): void {
  usedWordIndices.clear();
}

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

// Get a single random unused word — tracks what's been used this session
export function getRandomUnusedWord(): Word {
  // If we've used everything, reset
  if (usedWordIndices.size >= allWords.length) {
    usedWordIndices.clear();
  }

  // Find an unused index
  const availableIndices = Array.from({ length: allWords.length }, (_, i) => i)
    .filter(i => !usedWordIndices.has(i));

  const randomIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
  usedWordIndices.add(randomIdx);

  return {
    text: allWords[randomIdx],
    difficulty: assignDifficulty(),
  };
}

// Legacy: Get random word selection (3 or 4 words based on settings)
export function getWordSelection(count: number = 3): Word[] {
  const shuffled = shuffleArray(words);
  return shuffled.slice(0, count);
}

// Get a specific number of random words
export function getRandomWords(count: number): Word[] {
  return shuffleArray(words).slice(0, count);
}

export default words;
