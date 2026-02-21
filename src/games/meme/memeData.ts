// Make It Meme - Meme Template Data
// Supports both static images (.jpg/.png/.webp) and animated GIFs

export interface MemeTemplate {
  id: string;
  src: string;          // Path relative to /public
  name: string;         // Display name
  isGif: boolean;       // Whether this is an animated GIF
  captionPosition: 'top' | 'bottom' | 'both'; // Where caption text goes
}

// Meme templates pool — mix of static + GIF
const MEME_TEMPLATES: MemeTemplate[] = [
  // --- Static templates from /public/wdym/ ---
  { id: 'meme-1', src: '/wdym/meme-1.jpg', name: 'Meme 1', isGif: false, captionPosition: 'bottom' },
  { id: 'meme-2', src: '/wdym/meme-2.jpg', name: 'Meme 2', isGif: false, captionPosition: 'bottom' },
  { id: 'meme-3', src: '/wdym/meme-3.jpg', name: 'Meme 3', isGif: false, captionPosition: 'bottom' },
  { id: 'meme-4', src: '/wdym/meme-4', name: 'Meme 4', isGif: false, captionPosition: 'bottom' },
  { id: 'meme-5', src: '/wdym/meme-5', name: 'Meme 5', isGif: false, captionPosition: 'bottom' },
  { id: 'meme-6', src: '/wdym/meme-6', name: 'Meme 6', isGif: false, captionPosition: 'bottom' },
  { id: 'meme-cat', src: '/wdym/post-the-best-cat-memes-you-got-in-the-comments-please-v0-kg82lbnu0ste1.webp', name: 'Cat Meme', isGif: false, captionPosition: 'bottom' },
  { id: 'meme-diy', src: '/wdym/Gear-Make-Your-Own-Memes-459583554.webp', name: 'DIY Meme', isGif: false, captionPosition: 'bottom' },
  { id: 'meme-extra1', src: '/wdym/200776.jpg', name: 'Extra 1', isGif: false, captionPosition: 'bottom' },
  { id: 'meme-extra2', src: '/wdym/8a42d20954675f8f5bcb931f2560d380.jpg', name: 'Extra 2', isGif: false, captionPosition: 'bottom' },
  { id: 'meme-download', src: '/wdym/download.png', name: 'Download Meme', isGif: false, captionPosition: 'bottom' },
  { id: 'meme-jfif', src: '/wdym/images.jfif', name: 'Classic Meme', isGif: false, captionPosition: 'bottom' },

  // --- GIF templates from /public/wdym/gifs/ ---
  // (Add GIFs here as they're added to the folder)
  // { id: 'gif-1', src: '/wdym/gifs/example.gif', name: 'Funny GIF', isGif: true, captionPosition: 'bottom' },
];

// Track used templates per session
let usedTemplateIndices = new Set<number>();

export function resetUsedTemplates(): void {
  usedTemplateIndices = new Set();
}

export function getRandomTemplate(): MemeTemplate {
  // If all used, reset
  if (usedTemplateIndices.size >= MEME_TEMPLATES.length) {
    usedTemplateIndices = new Set();
  }

  // Pick from unused
  const available = MEME_TEMPLATES
    .map((t, i) => ({ template: t, index: i }))
    .filter(({ index }) => !usedTemplateIndices.has(index));

  const pick = available[Math.floor(Math.random() * available.length)];
  usedTemplateIndices.add(pick.index);
  return pick.template;
}

export function getTemplateById(id: string): MemeTemplate | undefined {
  return MEME_TEMPLATES.find(t => t.id === id);
}

export function getTemplateCount(): number {
  return MEME_TEMPLATES.length;
}
