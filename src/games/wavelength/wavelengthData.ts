// Wavelength — Spectrum data and utilities

export interface Spectrum {
  left: string;
  right: string;
}

export const SPECTRUMS: Spectrum[] = [
  // Temperature & Sensory
  { left: 'Hot', right: 'Cold' },
  { left: 'Spicy', right: 'Bland' },
  { left: 'Bitter', right: 'Sweet' },
  { left: 'Rough', right: 'Smooth' },
  { left: 'Soft', right: 'Hard' },

  // Entertainment
  { left: 'Good Movie', right: 'Bad Movie' },
  { left: 'Scary', right: 'Comforting' },
  { left: 'Funny', right: 'Serious' },
  { left: 'Boring', right: 'Exciting' },
  { left: 'Trashy Reality TV', right: 'Oscar Masterpiece' },

  // Evaluation
  { left: 'Overrated', right: 'Underrated' },
  { left: 'Easy to Spell', right: 'Hard to Spell' },
  { left: 'Looks Easy', right: 'Actually Hard' },
  { left: 'Looks Hard', right: 'Actually Easy' },
  { left: 'Useful Superpower', right: 'Useless Superpower' },

  // Food & Eating
  { left: 'Good Pizza Topping', right: 'Bad Pizza Topping' },
  { left: 'Tastes Good', right: 'Tastes Bad' },
  { left: 'Healthy Food', right: 'Junk Food' },
  { left: 'Fancy Restaurant', right: 'Drive-Thru' },
  { left: 'Breakfast Food', right: 'Dessert' },

  // Social & Behavior
  { left: 'Normal Hobby', right: 'Weird Hobby' },
  { left: 'Guilty Pleasure', right: 'Proudly Enjoy' },
  { left: 'Sociable', right: 'Introverted' },
  { left: 'Athletic', right: 'Couch Potato' },
  { left: 'Organized', right: 'Chaotic' },

  // Science & Nature
  { left: 'Alive', right: 'Not Alive' },
  { left: 'Round', right: 'Not Round' },
  { left: 'Heavy', right: 'Light' },
  { left: 'Natural', right: 'Artificial' },
  { left: 'Common', right: 'Rare' },

  // History & Culture
  { left: 'Ancient', right: 'Modern' },
  { left: 'Popular Music', right: 'Obscure Music' },
  { left: 'High-Brow', right: 'Low-Brow' },
  { left: 'Eastern', right: 'Western' },
  { left: 'Mainstream', right: 'Underground' },

  // Work & School
  { left: 'Office Job', right: 'Manual Labor' },
  { left: 'Stressful', right: 'Relaxing' },
  { left: 'High Paying', right: 'Low Paying' },
  { left: 'Prestigious Career', right: 'Humble Job' },
  { left: ' In-Person Work', right: 'Remote Work' },

  // Fashion & Style
  { left: 'Fashionable', right: 'Out of Fashion' },
  { left: 'Expensive Brand', right: 'Cheap Brand' },
  { left: 'Flashy', right: 'Subtle' },
  { left: 'Formal Attire', right: 'Casual Attire' },
  { left: 'Vintage', right: 'Brand New' },

  // Relationships & Emotions
  { left: 'Romantic', right: 'Unromantic' },
  { left: 'Loyal Friend', right: 'Fair-Weather Friend' },
  { left: 'Confident', right: 'Shy' },
  { left: 'Happy Ending', right: 'Tragic Ending' },
  { left: 'Love', right: 'Hate' },

  // Geography & Places
  { left: 'Urban', right: 'Rural' },
  { left: 'Beach Vacation', right: 'Mountain Vacation' },
  { left: 'Popular Tourist Spot', right: 'Hidden Gem' },
  { left: 'Tropical', right: 'Polar' },
  { left: 'Crowded', right: 'Secluded' },

  // Animals & Creatures
  { left: 'Cute Animal', right: 'Scary Animal' },
  { left: 'Fast', right: 'Slow' },
  { left: 'Pet Material', right: 'Wild Animal' },
  { left: 'Small', right: 'Large' },
  { left: 'Reptile', right: 'Mammal' },

  // Sports & Recreation
  { left: 'Team Sport', right: 'Individual Sport' },
  { left: 'Contact Sport', right: 'Non-Contact Sport' },
  { left: 'Olympic Sport', right: 'Niche Sport' },
  { left: 'Outdoor Activity', right: 'Indoor Activity' },
  { left: 'Extreme Sport', right: 'Casual Hobby' },

  // Technology
  { left: 'Latest Tech', right: 'Outdated Tech' },
  { left: 'User-Friendly', right: 'Confusing' },
  { left: 'Social Media App', right: 'Productivity App' },
  { left: 'Expensive Gadget', right: 'Cheap Gadget' },
  { left: 'Gaming Device', right: 'Work Device' },

  // Vehicles & Transportation
  { left: 'Fast Car', right: 'Slow Car' },
  { left: 'Luxury Vehicle', right: 'Budget Vehicle' },
  { left: 'Electric Vehicle', right: 'Gas-Powered' },
  { left: 'Reliable Transportation', right: 'Unreliable Clunker' },
  { left: 'Flashy Ride', right: 'Practical Ride' },

  // Numbers & Math
  { left: 'Exact Science', right: 'Subjective Opinion' },
  { left: 'Fact', right: 'Fiction' },
  { left: 'Proven', right: 'Theoretical' },
  { left: 'Statistical', right: 'Anecdotal' },
  { left: 'Quantifiable', right: 'Intangible' },

  // Random Mixed
  { left: 'Coffee', right: 'Tea' },
  { left: 'Morning Person', right: 'Night Owl' },
  { left: 'Dog Person', right: 'Cat Person' },
  { left: 'Dessert First', right: 'Veggies First' },
  { left: 'Plan Everything', right: 'Go With Flow' },
  { left: 'Think Outside Box', right: 'Follow Rules' },
  { left: 'Extroverted', right: 'Introverted' },
  { left: 'Risk Taker', right: 'Play it Safe' },
  { left: 'Spontaneous', right: 'Methodical' },
  { left: 'Daydreamer', right: 'Realist' },
];

/**
 * Get a random spectrum from the list
 */
export function getRandomSpectrum(): Spectrum {
  const idx = Math.floor(Math.random() * SPECTRUMS.length);
  return SPECTRUMS[idx];
}

/**
 * Generate a target position on the spectrum (0-100)
 * Avoids extremes (5-95) for more interesting clues
 */
export function generateTargetPosition(): number {
  return Math.floor(Math.random() * 90) + 5; // 5 to 95
}
