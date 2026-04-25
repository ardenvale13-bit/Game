// All 34 custom avatars for Game Time
// Organized by category for easier browsing

export interface Avatar {
  id: string;
  filename: string;
  name: string;
  category: 'animals' | 'cats' | 'gg-crew' | 'misc';
}

export const avatars: Avatar[] = [
  // === CATS ===
  { id: 'catto', filename: 'catto-icon.png', name: 'Catto', category: 'cats' },
  { id: 'cat2', filename: 'cat2_icon.png', name: 'Grey Cat', category: 'cats' },
  { id: 'cat3', filename: 'cat3_icon.png', name: 'Orange Cat', category: 'cats' },
  { id: 'cat5', filename: 'cat5_icon.png', name: 'Cat Pile', category: 'cats' },
  { id: 'zibb', filename: 'zibb_icon.png', name: 'Zibb', category: 'cats' },

  // === ANIMALS ===
  { id: 'axolotyl', filename: 'axolotyl_icon.png', name: 'Axolotl', category: 'animals' },
  { id: 'bunny', filename: 'bunny-icon.png', name: 'Bunny', category: 'animals' },
  { id: 'capybara', filename: 'capybara-icon.png', name: 'Capybara', category: 'animals' },
  { id: 'chimkin', filename: 'chimkin_icon.png', name: 'Chimkin', category: 'animals' },
  { id: 'corvi1', filename: 'corvi1_icon.png', name: 'Corvi', category: 'animals' },
  { id: 'cow', filename: 'cow_icon.png', name: 'Cow', category: 'animals' },
  { id: 'dino2', filename: 'dino2-icon.png', name: 'Dino', category: 'animals' },
  { id: 'duck', filename: 'duck_icon.png', name: 'Shy Duck', category: 'animals' },
  { id: 'murder_duck', filename: 'murder_duck.png', name: 'Murder Duck', category: 'animals' },
  { id: 'otter2', filename: 'otter_2_icon.png', name: 'Otter', category: 'animals' },
  { id: 'pibble', filename: 'pibble-icon.png', name: 'Pibble', category: 'animals' },
  { id: 'racoon', filename: 'racoon_icon.png', name: 'Racoon', category: 'animals' },
  { id: 'screamy_possum', filename: 'screamy_possum_icon.png', name: 'Screamy Possum', category: 'animals' },
  { id: 'seren', filename: 'seren-icon.png', name: 'Seren', category: 'animals' },
  { id: 'sheepy', filename: 'sheepy_icon.png', name: 'Sheepy', category: 'animals' },
  { id: 'snek', filename: 'snek-icon.png', name: 'Snek', category: 'animals' },
  { id: 'snell', filename: 'snell-icon.png', name: 'Snell', category: 'animals' },
  { id: 'tortl', filename: 'tortl_icon.png', name: 'Tortl', category: 'animals' },
  { id: 'unicorn', filename: 'unicorn-icon.png', name: 'Unicorn', category: 'animals' },
  { id: 'wolf', filename: 'wolf_icon.png', name: 'Wolf', category: 'animals' },

  // === GG CREW ===
  { id: 'gg', filename: 'gg-icon.png', name: 'GG', category: 'gg-crew' },
  { id: 'gg_blep', filename: 'gg-blep-icon.png', name: 'GG Blep', category: 'gg-crew' },
  { id: 'gg_dino', filename: 'gg-dino-icon.png', name: 'GG Dino', category: 'gg-crew' },
  { id: 'gg_fightme', filename: 'gg-fightme-icon.png', name: 'GG Fight Me', category: 'gg-crew' },
  { id: 'gg_shark', filename: 'gg-shark-icon.png', name: 'GG Shark', category: 'gg-crew' },
  { id: 'gg_stfu', filename: 'gg-stfu-icon.png', name: 'GG STFU', category: 'gg-crew' },
  { id: 'evil_gg', filename: 'evil-gg-icon.png', name: 'Evil GG', category: 'gg-crew' },

  // === MISC ===
  { id: 'arden_rat', filename: 'arden-rat-icon.png', name: 'Arden Rat', category: 'misc' },
  { id: 'finn', filename: 'finn-icon.png', name: 'Finn', category: 'misc' },
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
  'cats': 'Cats',
  'animals': 'Animals',
  'gg-crew': 'GG Crew',
  'misc': 'Misc',
};

// Category order for display
export const categoryOrder: Avatar['category'][] = [
  'cats',
  'animals',
  'gg-crew',
  'misc',
];
