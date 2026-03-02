// Would You Rather - Prompt Data
// Mix of funny, absurd, thought-provoking, gross, spicy, and pop culture prompts

export interface WYRPrompt {
  optionA: string;
  optionB: string;
}

export const wyrPrompts: WYRPrompt[] = [
  // ===== FUNNY / ABSURD =====
  { optionA: "have spaghetti for hair", optionB: "have maple syrup for sweat" },
  { optionA: "only walk backwards", optionB: "only speak in song lyrics" },
  { optionA: "honk like a goose when you laugh", optionB: "cluck like a chicken when you're nervous" },
  { optionA: "have tiny hands", optionB: "have giant feet" },
  { optionA: "speak only in rhymes", optionB: "speak only in questions" },
  { optionA: "wear wet socks forever", optionB: "always have an itchy nose" },
  { optionA: "trip over nothing daily", optionB: "accidentally say everything twice" },
  { optionA: "sneeze glitter everywhere", optionB: "fart every time you laugh" },
  { optionA: "have a permanent googly eyes stare", optionB: "walk like a penguin always" },
  { optionA: "burp out the alphabet", optionB: "hiccup in morse code" },

  // ===== GROSS / UNCOMFORTABLE =====
  { optionA: "eat a whole lemon daily", optionB: "drink warm milk that's slightly expired" },
  { optionA: "never brush your teeth again", optionB: "never take another shower" },
  { optionA: "only drink pickle juice", optionB: "only eat mayonnaise sandwiches" },
  { optionA: "have a permanent bad breath", optionB: "always have visible nose hairs" },
  { optionA: "touch every door handle with your tongue", optionB: "lick every piece of food before eating" },
  { optionA: "eat bugs for every meal", optionB: "drink sweat as your only beverage" },
  { optionA: "have slugs as hair", optionB: "have tarantulas as eyebrows" },
  { optionA: "smell like rotting fish always", optionB: "taste everything as vomit" },
  { optionA: "have a live cockroach in your mouth", optionB: "have maggots in your food only" },
  { optionA: "eat dirt daily", optionB: "sleep in a garbage can" },

  // ===== THOUGHT-PROVOKING / CHOICES =====
  { optionA: "never use the internet again", optionB: "never use social media again" },
  { optionA: "have true love but be broke", optionB: "be rich but lonely forever" },
  { optionA: "lose all your memories", optionB: "never make new memories again" },
  { optionA: "always tell the truth", optionB: "always be able to lie convincingly" },
  { optionA: "know when you'll die", optionB: "know what happens after death" },
  { optionA: "travel to the past", optionB: "see into the future" },
  { optionA: "live 200 years alone", optionB: "live 40 years surrounded by loved ones" },
  { optionA: "be invisible to others", optionB: "hear everyone's thoughts about you" },
  { optionA: "always arrive 30 min early", optionB: "always arrive 30 min late" },
  { optionA: "lose the ability to read", optionB: "lose the ability to hear music" },

  // ===== SPICY / RELATIONSHIP =====
  { optionA: "never have sex again", optionB: "never fall in love again" },
  { optionA: "have an ex following you around", optionB: "see what your partner texts about you" },
  { optionA: "date your crush's sibling", optionB: "date your sibling's best friend" },
  { optionA: "always know when your partner lies", optionB: "never know their passwords" },
  { optionA: "your parents follow your dating", optionB: "your best friend dates your ex" },
  { optionA: "have to share all passwords", optionB: "have to share all dating history" },
  { optionA: "kiss everyone you meet", optionB: "be physically repulsive to everyone" },
  { optionA: "be stuck with your toxic ex", optionB: "never be able to leave a bad relationship" },
  { optionA: "can't have privacy from partner", optionB: "can't have any alone time ever" },
  { optionA: "always be caught texting exes", optionB: "have your nudes leaked yearly" },

  // ===== POP CULTURE / MODERN =====
  { optionA: "be permanently stuck as you are now", optionB: "age backwards until you disappear" },
  { optionA: "only watch content from the 1980s", optionB: "only listen to music from the 1990s" },
  { optionA: "live in a Netflix show", optionB: "live in a TikTok video" },
  { optionA: "have celebrity status with no privacy", optionB: "be invisible to the world always" },
  { optionA: "be famous for something embarrassing", optionB: "never be famous at all" },
  { optionA: "become a meme forever", optionB: "be forgotten immediately after death" },
  { optionA: "live in an anime world", optionB: "live in a video game world" },
  { optionA: "befriend a celebrity", optionB: "become a celebrity yourself" },
  { optionA: "star in a reality TV show", optionB: "be a minor character in a movie" },
  { optionA: "be obsessed with your own content", optionB: "never create content again" },

  // ===== IMPOSSIBLE / SUPERPOWERS =====
  { optionA: "be invisible but frozen", optionB: "be able to fly but super slowly" },
  { optionA: "super strength but always clumsy", optionB: "super speed but always dizzy" },
  { optionA: "read minds but can't unhear thoughts", optionB: "predict the future but be wrong half the time" },
  { optionA: "teleport but only backwards", optionB: "time travel but only seconds" },
  { optionA: "be immortal but feel all pain", optionB: "mortal but numb to everything" },
  { optionA: "have laser eyes but terrible aim", optionB: "have super hearing but painful" },
  { optionA: "control weather but it's random", optionB: "control animals but they hate you" },
  { optionA: "telekinesis but very weak", optionB: "mind control but only animals" },
  { optionA: "shape shift but keep same size", optionB: "change size but stay human" },
  { optionA: "speak all languages but stutter", optionB: "understand all languages but can't speak" },

  // ===== SOCIAL / FRIENDSHIP =====
  { optionA: "have 100 acquaintances, 0 best friends", optionB: "have 1 best friend, no others" },
  { optionA: "be awkward in every social situation", optionB: "be too blunt about everything" },
  { optionA: "always say the wrong thing", optionB: "always stay silent at parties" },
  { optionA: "be the center of attention always", optionB: "never be noticed at all" },
  { optionA: "always offend people unintentionally", optionB: "always be misunderstood" },
  { optionA: "be stuck with someone 24/7", optionB: "never talk to anyone again" },
  { optionA: "have to group chat your secrets", optionB: "have no secrets but all private" },
  { optionA: "your embarrassing moments are known", optionB: "everyone forgets you exist" },
  { optionA: "be unable to say no to anyone", optionB: "be unable to ask for help" },
  { optionA: "be the friend everyone vents to", optionB: "be the friend nobody invites" },

  // ===== WORK / MONEY =====
  { optionA: "be broke but loved at work", optionB: "be rich but hated at work" },
  { optionA: "have a job you hate but high pay", optionB: "have a job you love but no money" },
  { optionA: "boss hates you but you're competent", optionB: "boss loves you but you're terrible" },
  { optionA: "always have to work on weekends", optionB: "always have days off but no income" },
  { optionA: "be stuck in current job forever", optionB: "change jobs weekly for life" },
  { optionA: "have zero work-life balance", optionB: "have zero work motivation" },
  { optionA: "accidentally email boss a meme", optionB: "present to company while drunk" },
  { optionA: "get paid in Monopoly money", optionB: "get paid in Bitcoin only" },
  { optionA: "work with your ex always", optionB: "work with your worst enemy" },
  { optionA: "be your boss's favorite target", optionB: "be completely invisible at work" },

  // ===== BODY / HEALTH =====
  { optionA: "lose your sense of smell", optionB: "lose your sense of taste" },
  { optionA: "always be cold", optionB: "always be hot" },
  { optionA: "have permanent hiccups", optionB: "have constant sneezing" },
  { optionA: "be unable to sleep", optionB: "sleep 20 hours daily" },
  { optionA: "age 5x faster", optionB: "age 5x slower" },
  { optionA: "always have a headache", optionB: "always feel nauseous" },
  { optionA: "have one eye that sees the future", optionB: "one eye that sees the past" },
  { optionA: "walk with a permanent limp", optionB: "permanently have the hiccups" },
  { optionA: "be allergic to your favorite food", optionB: "only be able to eat your least favorite food" },
  { optionA: "have extremely weak bones", optionB: "be unable to move normally" },

  // ===== NATURE / ANIMALS =====
  { optionA: "understand animals but they ignore you", optionB: "animals love you but attack on command" },
  { optionA: "live with 10 spiders always", optionB: "live with 100 cockroaches always" },
  { optionA: "be hunted by one dangerous animal", optionB: "be chased by 100 harmless squirrels" },
  { optionA: "only eat what you hunt", optionB: "only eat what you grow" },
  { optionA: "live in the woods forever", optionB: "live on the ocean forever" },
  { optionA: "be attacked by wildlife regularly", optionB: "be ignored by all wildlife" },
  { optionA: "have a pet that never listens", optionB: "have a pet that's too dependent" },
  { optionA: "be a bear", optionB: "be a shark" },
  { optionA: "become best friends with a wolf", optionB: "become best friends with a vulture" },
  { optionA: "have to fight a goose daily", optionB: "have to outwit a squirrel daily" },

  // ===== RANDOM WILD ONES =====
  { optionA: "talk to plants all day", optionB: "hear voices from inanimate objects" },
  { optionA: "have a pet rock that talks", optionB: "have a invisible person following you" },
  { optionA: "wear your clothes backwards always", optionB: "walk backwards everywhere" },
  { optionA: "laugh at inappropriate moments", optionB: "cry at funny moments" },
  { optionA: "sneeze and fall to the ground", optionB: "hiccup and levitate" },
  { optionA: "only communicate through dance", optionB: "only communicate through interpretive paintings" },
  { optionA: "be able to smell colors", optionB: "be able to taste emotions" },
  { optionA: "have permanent bed hair", optionB: "have permanent crazy eyes" },
  { optionA: "age 10 years when you lie", optionB: "rejuvenate 1 year when you lie" },
  { optionA: "turn invisible when angry", optionB: "glow neon when happy" },

  // ===== MORE THOUGHT-PROVOKING =====
  { optionA: "have one perfect day repeat forever", optionB: "never have a good day again" },
  { optionA: "know everyone's true feelings about you", optionB: "never know what anyone truly thinks" },
  { optionA: "be stuck as you are physically", optionB: "be stuck as you are mentally" },
  { optionA: "give up your phone forever", optionB: "give up real-world socializing forever" },
  { optionA: "lose your sense of humor", optionB: "lose your ability to feel empathy" },
  { optionA: "never experience surprise again", optionB: "never experience comfort again" },
  { optionA: "have a photographic memory", optionB: "forget everything each night" },
  { optionA: "be able to pause time but not move", optionB: "move but experience everything in slow motion" },
  { optionA: "always arrive early to everything", optionB: "always arrive late to everything" },
  { optionA: "be everyone's first choice", optionB: "be someone's only choice" },

  // ===== EXTRA WILD ONES =====
  { optionA: "drink liquid that tastes like feet", optionB: "drink liquid that smells like garbage" },
  { optionA: "have a hand that smells like tuna", optionB: "have a foot that glows in the dark" },
  { optionA: "be haunted by a ghost", optionB: "be followed by a demon" },
  { optionA: "have to apologize to everyone you meet", optionB: "have to thank everyone you meet" },
  { optionA: "speak only the truth loudly", optionB: "can only speak lies in whispers" },
  { optionA: "sneeze uncontrollably when lying", optionB: "faint when someone lies to you" },
  { optionA: "be a cat person cursed to love dogs", optionB: "be a dog person cursed to love cats" },
  { optionA: "live in a house made of pasta", optionB: "live in a house made of ice cream" },
  { optionA: "wear a costume of your worst enemy", optionB: "be stuck looking like your biggest fear" },
  { optionA: "always have wet hair", optionB: "always have sand in your shoes" },

  // ===== BONUS FUNNY =====
  { optionA: "laugh at your own jokes first", optionB: "never laugh at any jokes" },
  { optionA: "have a laugh like a hyena", optionB: "have a laugh like a dolphin" },
  { optionA: "speak all words backwards", optionB: "hear all words backwards" },
  { optionA: "be able to float 1 inch high", optionB: "be glued to the ground always" },
  { optionA: "change colors like a mood ring", optionB: "glow brighter when you're sad" },
  { optionA: "have tentacles instead of arms", optionB: "have wheels instead of legs" },
  { optionA: "have a built-in microphone", optionB: "have a built-in speaker system" },
  { optionA: "be allergic to water", optionB: "be allergic to air" },
  { optionA: "only eat foods that are purple", optionB: "only eat foods that are triangular" },
  { optionA: "have a permanent ice cream headache", optionB: "have a permanent brain freeze" },
];

// Get N random unique prompts
export function getRandomPrompts(count: number, usedIndices: Set<number> = new Set()): { prompts: WYRPrompt[]; indices: number[] } {
  const available = wyrPrompts
    .map((p, i) => ({ prompt: p, index: i }))
    .filter(({ index }) => !usedIndices.has(index));

  // If we've used most prompts, reset
  const pool = available.length >= count ? available : wyrPrompts.map((p, i) => ({ prompt: p, index: i }));

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  return {
    prompts: selected.map(s => s.prompt),
    indices: selected.map(s => s.index),
  };
}
