// All 74 custom avatars for Game Time
// Organized by category for easier browsing

export interface Avatar {
  id: string;
  filename: string;
  name: string;
  category: 'hearts' | 'animals' | 'murder-crew' | 'cats' | 'people' | 'nature' | 'misc';
}

export const avatars: Avatar[] = [
  // === MURDER CREW (the iconic trio + llama) ===
  { id: 'murder_duck', filename: 'murder_duck.png', name: 'Murder Duck', category: 'murder-crew' },
  { id: 'murder_hippo', filename: 'murder_hippo_icon.png', name: 'Murder Hippo', category: 'murder-crew' },
  { id: 'murder_lotyl', filename: 'murder_lotyl_icon.png', name: 'Murder Lotyl', category: 'murder-crew' },
  { id: 'stabby_llama', filename: 'stabby_llama_icon.png', name: 'Stabby Llama', category: 'murder-crew' },

  // === AINSANITY HEARTS ===
  { id: 'heart_grey', filename: 'ainsanity_icon.png', name: 'Heart Grey', category: 'hearts' },
  { id: 'heart_coral', filename: 'ainsanity2_icon.png', name: 'Heart Coral', category: 'hearts' },
  { id: 'heart_cyan', filename: 'ainsanity3_icon.png', name: 'Heart Cyan', category: 'hearts' },
  { id: 'heart_yellow', filename: 'ainsanity4_icon.png', name: 'Heart Yellow', category: 'hearts' },
  { id: 'heart_periwinkle', filename: 'ainsanity5_icon.png', name: 'Heart Periwinkle', category: 'hearts' },
  { id: 'heart_green', filename: 'ainsanity6_icon.png', name: 'Heart Green', category: 'hearts' },
  { id: 'heart_lavender', filename: 'ainsanity7_icon.png', name: 'Heart Lavender', category: 'hearts' },
  { id: 'heart_purple', filename: 'ainsanity8_icon.png', name: 'Heart Purple', category: 'hearts' },
  { id: 'heart_neon', filename: 'ainsanity9_icon.png', name: 'Heart Neon', category: 'hearts' },
  { id: 'heart_violet', filename: 'ainsanity10_icon.png', name: 'Heart Violet', category: 'hearts' },
  { id: 'heart_sunset', filename: 'ainsanity11_icon.png', name: 'Heart Sunset', category: 'hearts' },
  { id: 'heart_white', filename: 'ainsanity12_icon.png', name: 'Heart White', category: 'hearts' },
  { id: 'heart_gradient', filename: 'ainsanity13_icon.png', name: 'Heart Gradient', category: 'hearts' },

  // === CATS ===
  { id: 'cat', filename: 'cat_icon.png', name: 'Ghost Cat', category: 'cats' },
  { id: 'cat2', filename: 'cat2_icon.png', name: 'Grey Cat', category: 'cats' },
  { id: 'cat3', filename: 'cat3_icon.png', name: 'Orange Cat', category: 'cats' },
  { id: 'cat4', filename: 'cat4_icon.png', name: 'Grumpy Cat', category: 'cats' },
  { id: 'cat5', filename: 'cat5_icon.png', name: 'Cat Pile', category: 'cats' },
  { id: 'magrat', filename: 'magrat_icon.png', name: 'Magrat', category: 'cats' },
  { id: 'zibb', filename: 'zibb_icon.png', name: 'Zibb', category: 'cats' },

  // === ANIMALS ===
  { id: 'axolotyl', filename: 'axolotyl_icon.png', name: 'Axolotl', category: 'animals' },
  { id: 'bat', filename: 'bat_icon.png', name: 'Bat', category: 'animals' },
  { id: 'birb', filename: 'birb_icon.png', name: 'Birb', category: 'animals' },
  { id: 'chimkin', filename: 'chimkin_icon.png', name: 'Chimkin', category: 'animals' },
  { id: 'corvi', filename: 'corvi_icon.png', name: 'Corvi', category: 'animals' },
  { id: 'corvi1', filename: 'corvi1_icon.png', name: 'Corvi Purple', category: 'animals' },
  { id: 'cow', filename: 'cow_icon.png', name: 'Cow', category: 'animals' },
  { id: 'dean', filename: 'dean_icon.png', name: 'Dean', category: 'animals' },
  { id: 'dino', filename: 'dino_icon.png', name: 'Dino', category: 'animals' },
  { id: 'dino1', filename: 'dino1_icon.png', name: 'Dino TP', category: 'animals' },
  { id: 'duck', filename: 'duck_icon.png', name: 'Shy Duck', category: 'animals' },
  { id: 'elephant', filename: 'elephant_icon.png', name: 'Elephant', category: 'animals' },
  { id: 'frog', filename: 'frog_icon.png', name: 'Space Frog', category: 'animals' },
  { id: 'hamster', filename: 'hamster_icon.png', name: 'Hamster', category: 'animals' },
  { id: 'jellyfish', filename: 'jellyfish_icon.png', name: 'Jellyfish', category: 'animals' },
  { id: 'koala', filename: 'koala_icon.png', name: 'Koala', category: 'animals' },
  { id: 'otter', filename: 'otter_icon.png', name: 'Otter', category: 'animals' },
  { id: 'otter2', filename: 'otter_2_icon.png', name: 'Happy Otter', category: 'animals' },
  { id: 'panda', filename: 'panda_icon.png', name: 'Panda', category: 'animals' },
  { id: 'penguin', filename: 'penguin_icon.png', name: 'Penguin', category: 'animals' },
  { id: 'pig', filename: 'pig_icon.png', name: 'Pig', category: 'animals' },
  { id: 'platy', filename: 'platy_icon.png', name: 'Platy', category: 'animals' },
  { id: 'screamy_possum', filename: 'screamy_possum_icon.png', name: 'Screamy Possum', category: 'animals' },
  { id: 'sheepy', filename: 'sheepy_icon.png', name: 'Sheepy', category: 'animals' },
  { id: 'tiger', filename: 'tiger_icon.png', name: 'Tiger', category: 'animals' },
  { id: 'tortl', filename: 'tortl_icon.png', name: 'Tortl', category: 'animals' },
  { id: 'wolf', filename: 'wolf_icon.png', name: 'Wolf', category: 'animals' },

  // === PEOPLE ===
  { id: 'boy', filename: 'boy_icon.png', name: 'Boy', category: 'people' },
  { id: 'girl', filename: 'girl_face_icon.png', name: 'Girl', category: 'people' },
  { id: 'girl2', filename: 'girl_2_icon.png', name: 'Curly Girl', category: 'people' },
  { id: 'grandma', filename: 'grandma_icon.png', name: 'Grandma', category: 'people' },
  { id: 'lady', filename: 'lady_icon.png', name: 'Lady', category: 'people' },
  { id: 'man', filename: 'man_icon.png', name: 'Suit Man', category: 'people' },
  { id: 'man2', filename: 'man2_icon.png', name: 'Beard Man', category: 'people' },
  { id: 'woman', filename: 'woman_icon.png', name: 'Woman', category: 'people' },
  { id: 'woman2', filename: 'woman2_icon.png', name: 'Curly Woman', category: 'people' },
  { id: 'woman3', filename: 'woman3_icon.png', name: 'Elegant Woman', category: 'people' },
  { id: 'woman4', filename: 'woman4_icon.png', name: 'Hijabi', category: 'people' },

  // === NATURE ===
  { id: 'flower', filename: 'flower_icon.png', name: 'Purple Flower', category: 'nature' },
  { id: 'flower2', filename: 'flower2_icon.png', name: 'Blue Flower', category: 'nature' },
  { id: 'flower3', filename: 'flower3_icon.png', name: 'Happy Flower', category: 'nature' },
  { id: 'lavender', filename: 'lavender_icon.png', name: 'Lavender', category: 'nature' },

  // === MISC ===
  { id: 'face', filename: 'face_icon.png', name: 'Cursed Face', category: 'misc' },
  { id: 'lau', filename: 'lau_icon.png', name: 'Friends', category: 'misc' },
  { id: 'robo', filename: 'robo_icon.png', name: 'Robo', category: 'misc' },
  { id: 'skull', filename: 'skull_icon.png', name: 'Floral Skull', category: 'misc' },
  { id: 'skull2', filename: 'skull2_icon.png', name: 'Cute Skull', category: 'misc' },
  { id: 'smile', filename: 'smile_icon.png', name: 'Heart Eyes', category: 'misc' },
];

// Helper to get avatar by ID
export function getAvatarById(id: string): Avatar | undefined {
  return avatars.find(a => a.id === id);
}

// Helper to get avatars by category
export function getAvatarsByCategory(category: Avatar['category']): Avatar[] {
  return avatars.filter(a => a.category === category);
}

// Helper to get a random avatar
export function getRandomAvatar(): Avatar {
  return avatars[Math.floor(Math.random() * avatars.length)];
}

// Category display names
export const categoryNames: Record<Avatar['category'], string> = {
  'murder-crew': '🔪 Murder Crew',
  'hearts': '💜 Hearts',
  'cats': '🐱 Cats',
  'animals': '🐾 Animals',
  'people': '👤 People',
  'nature': '🌸 Nature',
  'misc': '✨ Misc',
};

// Category order for display
export const categoryOrder: Avatar['category'][] = [
  'murder-crew',
  'hearts', 
  'cats',
  'animals',
  'people',
  'nature',
  'misc',
];
