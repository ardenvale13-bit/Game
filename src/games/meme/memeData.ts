// Make It Meme - Meme Template Data
// Built from /public/wdym/ subfolders:
//   1 reply/ → single caption box
//   2 reply/ → two caption boxes (top + bottom)
//   gif/     → animated GIFs, single caption

export type MemeTemplateType = '1-reply' | '2-reply' | 'gif';

export interface MemeTemplate {
  id: string;
  src: string;
  name: string;
  type: MemeTemplateType;
  isGif: boolean;
  captionCount: 1 | 2;
}

// Helper: short hash from string for IDs
function shortHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36).slice(0, 8);
}

// ---- 1-REPLY TEMPLATES (single caption) ----
const ONE_REPLY_FILES = [
  '#meme #template #basememe #blankmeme #memetemplate….jfif',
  '#williamdafoe.jfif',
  '16 People Who Got Famously Meme\'d And What They Look Like Now.jfif',
  '200776.jpg',
  '8a42d20954675f8f5bcb931f2560d380.jpg',
  'BBE 💖🤟💅.jfif',
  'Baby Memes 101_ Hilarious Images For New Parents.jfif',
  'Dexter reaction face funny meme suspicious.jfif',
  'Elmo fire hell AI.png',
  'Flork.jfif',
  'Funny.jfif',
  'Gear-Make-Your-Own-Memes-459583554.webp',
  'Google Image Result for https___i_tribune.com.pk_media_images_james-doakes1753344838-0_james-doakes1753344838-0-436x333.webp',
  'Isagi Yoichi _ Harem.jfif',
  'LuCu KiUt😘😘.jfif',
  'MY BROTHER WITH HIS A2 MILK- BINGUSS.jfif',
  'Me after I fail my math quiz.jfif',
  'Me in math class.jfif',
  'Meme template _ Modelo de meme, Imagens memes….jfif',
  'Modern Problems Require Modern Solutions - Chappelles show.png',
  'Pin by baal haver (on break) on handmade memes….jfif',
  'Salt Bae Original 01.png',
  'Scientists Prove That Telepathic Communication Is Within Reach.jfif',
  'The most famous and amusing internet memes of all time.jfif',
  'ana folklore 💜 on X.jfif',
  'beluga cat.jfif',
  'cameron tuckeroo 😏.jfif',
  'dollars money bucks fat black sleep.png',
  'download (10).jfif',
  'download (11).jfif',
  'download (12).jfif',
  'download (13).jfif',
  'download (14).jfif',
  'images.jfif',
  'man sun fingers.jpg',
  'me when my friend says somebody finna fight.jfif',
  'meme fun new year 2026.jfif',
  'meme-1.jpg',
  'meme-2.jpg',
  'meme-3.jpg',
  'post-the-best-cat-memes-you-got-in-the-comments-please-v0-kg82lbnu0ste1.webp',
  'review!!.jfif',
  'robot tiktok.jfif',
  'zz.jfif',
];

// ---- 2-REPLY TEMPLATES (two caption boxes) ----
const TWO_REPLY_FILES = [
  'Kombucha Girl.jfif',
  'Meme Template #meme #memetemplate.jfif',
  'Screenshot 2026-02-21 075907.png',
  'download.png',
];

// ---- GIF TEMPLATES (animated, single caption) ----
const GIF_FILES = [
  '1 (1).gif',
  '1 (2).gif',
  'Alison Brie No GIF by Crave.gif',
  'Alison Brie What GIF.gif',
  'Angry Cat GIF by JPedicini.gif',
  'Angry Csi GIF.gif',
  'Angry Frustrated GIF.gif',
  'Angry Hate GIF.gif',
  'Angry Lilo And Stitch GIF.gif',
  'Angry Michael C Hall GIF.gif',
  'Angry Tyra Banks GIF.gif',
  'Angry Work GIF.gif',
  'Animated GIF (1).gif',
  'Animated GIF.gif',
  'Animation Pixar GIF.gif',
  'As You Wish Cary Elwes GIF by Disney+.gif',
  'Baby Dancing GIF (1).gif',
  'Baby Dancing GIF.gif',
  'Barbie Movie Love GIF by Warner Bros. Deutschland.gif',
  'Barbie Movie What GIF by MOODMAN.gif',
  'Best Friends Love GIF by TV Land.gif',
  'Bored Cabin Fever GIF.gif',
  'Britains Got Talent No GIF by Got Talent Global.gif',
  'Car Hello GIF by Warner Bros. Pictures.gif',
  'Cat GIF by 9CatNFT.gif',
  'Cat Love GIF.gif',
  'Comedian Pick Up Line GIF by Soul Train.gif',
  'Comedy Central Reaction GIF by Lights Out with David Spade.gif',
  'Confused Confusion GIF.gif',
  'Confused Dog GIF by MOODMAN.gif',
  'Confused Ginger GIF.gif',
  'Confused Little Girl GIF (1).gif',
  'Confused Little Girl GIF.gif',
  'Confused The Office GIF.gif',
  'Cracking Up Lol GIF by BoDoggos.gif',
  'Cracking Up Lol GIF by STRAPPED!.gif',
  'Cracking Up Lol GIF by Smurfcat.gif',
  'Dance Dancing GIF.gif',
  'Dance Fun GIF by Kokumi Burger.gif',
  'Dance Party Dancing GIF.gif',
  'Dance Reaction GIF.gif',
  'Delhi Belly Poop GIF.gif',
  'Disgusted Paris Hilton GIF.gif',
  'Dog Lol GIF.gif',
  'Dog Wtf GIF by truth.gif',
  'Encerio What GIF.gif',
  'Excited Lets Go GIF.gif',
  'Excuse Me Reaction GIF by One Chicago.gif',
  'Excuse Me What GIF (1).gif',
  'Excuse Me What GIF (2).gif',
  'Excuse Me What GIF.gif',
  'Excuse Me Wow GIF by hamlet (1).gif',
  'Excuse Me Wow GIF by hamlet.gif',
  'Eyes What GIF.gif',
  'Fail Diet Coke GIF by MOODMAN.gif',
  'Family Matters What GIF.gif',
  'Fangs Scary Halloween GIF by MOODMAN.gif',
  'Galentines Day Friends GIF by Spice Girls.gif',
  'Girl What GIF by MOODMAN.gif',
  'Glasses Join Us GIF by nounish ⌐◨-◨.gif',
  'Go Faster Wallace And Gromit GIF by Aardman Animations.gif',
  'Going Crazy GIF.gif',
  'Going Crazy Homer Simpson GIF.gif',
  'Happy Baby GIF.gif',
  'Happy Cracking Up GIF by MOODMAN.gif',
  'Happy Cracking Up GIF.gif',
  'Happy Donald Trump GIF by Team Trump (1).gif',
  'Happy Donald Trump GIF by Team Trump.gif',
  'Happy Shaquille O Neal GIF by Papa Johns.gif',
  'Harry Potter GIF by Box Office.gif',
  'Harry Potter GIF.gif',
  'Hip Hop Happy Dance GIF.gif',
  'Hold My Hand Otter GIF.gif',
  'Huffington Post Dancing GIF by HuffPost.gif',
  'Ice Cube Reaction GIF.gif',
  'In Love Cat GIF.gif',
  'James Franco Omg GIF.gif',
  'Joining Welcome Home GIF.gif',
  'Jurassic Park GIF by Vidiots.gif',
  'Justin Timberlake What GIF.gif',
  'Kid Fail GIF by MOODMAN.gif',
  'Kisses Love GIF.gif',
  'Lady Gaga Dancing GIF.gif',
  'Laughing And Crying Pedro Pascal GIF by Golden Globes.gif',
  'Laughing Out Loud Lol GIF by Teletubbies.gif',
  'Lil Wayne Fire GIF.gif',
  'Lil Wayne GIF by giphydiscovery.gif',
  'Lmao Lol GIF by Adult Swim.gif',
  'Look Whos Talking Now Omg GIF.gif',
  'Losing My Mind GIF.gif',
  'Makeup Ai GIF.gif',
  'Man GIF.gif',
  'Miss You Kiss GIF.gif',
  'Monty Python Reaction GIF.gif',
  'Mr Bean GIF.gif',
  'Mr Bean Waiting GIF by MOODMAN.gif',
  'Mr Mayor Waiting GIF by NBC.gif',
  'Nickcage What GIF by LIPPERT.gif',
  'No Thank You GIF by Karen Civil.gif',
  'No Way Cat GIF.gif',
  'No Way Reaction GIF.gif',
  'Oh My God Reaction GIF by Friends.gif',
  'Oh Yeah Smile GIF by BrownSugarApp.gif',
  'Omg Wtf GIF.gif',
  'On Fire GIF.gif',
  'On The Floor Omg GIF by Joel James.gif',
  'Otter GIF (1).gif',
  'Otter GIF.gif',
  'Parks And Recreation Wow GIF.gif',
  'Pedro Pascal Laughing GIF by Crafture.gif',
  'Penguin Side Eye GIF by Brookfield Zoo.gif',
  'Poop Pooping GIF (1).gif',
  'Pooping Fail GIF by raymond wong.gif',
  'Question Mark What GIF by MOODMAN.gif',
  'Raccoon Cheetos GIF.gif',
  'Rhyming Leonardo Dicaprio GIF.gif',
  'Ryan Gosling Sunglasses GIF by Warner Bros. Pictures.gif',
  'Sad Cry GIF by Piñata Farms The Meme App.gif',
  'Sad Season 2 GIF by Friends.gif',
  'Scared Kermit The Frog GIF.gif',
  'Scream GIF.gif',
  'Sean Flanagan Waiting GIF by FoilArmsandHog.gif',
  'Season 3 Horror GIF by Ash vs Evil Dead.gif',
  'Season 5 No GIF by The Office.gif',
  'Sesame Street Dancing GIF.gif',
  'Sesame Street Fire GIF by Bell Brothers.gif',
  'Sexy Look GIF.gif',
  'Sexy Stephen Colbert GIF.gif',
  'Shia Labeouf Applause GIF.gif',
  'Shock Omg GIF.gif',
  'Shocked Dog GIF.gif',
  'Shocked GIF.gif',
  'Shocked Maya Rudolph GIF.gif',
  'Skating Hey Girl GIF.gif',
  'Surprise Otter GIF by Nashville Tour Stop.gif',
  'The Good Doctor Look GIF by ABC Network.gif',
  'The Office No GIF.gif',
  'The Princess Bride Hello GIF by Disney+.gif',
  'The Princess Bride Hello GIF.gif',
  'Thinking Looking Around GIF by GritTV.gif',
  'Tired Baby GIF.gif',
  'Tired Good Night GIF by Pudgy Penguins.gif',
  'Trump Gop GIF by Luis Ricardo.gif',
  'Ugh Disgusted GIF.gif',
  'Us GIF.gif',
  'Video Game Blizzard GIF by Xbox.gif',
  'Wait Waiting GIF.gif',
  'Waiting Patiently GIF by Justin.gif',
  'Well Done Laughing GIF.gif',
  'Whaat GIF.gif',
  'What Is It Wow GIF.gif',
  'What The Hell Wtf GIF.gif',
  'Wide Eyed No GIF by Jukebox Saints.gif',
  'X Factor Reaction GIF by X Factor Global.gif',
  '_ (1).gif',
  '_.gif',
  'attempt GIF.gif',
  'baby what GIF.gif',
  'chris pratt dinosaurs GIF by Digg.gif',
  'chris pratt velociraptor GIF (1).gif',
  'chris pratt velociraptor GIF.gif',
  'congratulations slow clap GIF.gif',
  'cray GIF.gif',
  'gif.gif',
  'glee crying GIF.gif',
  'happy breaking bad GIF.gif',
  'harry potter GIF by Box Office (1).gif',
  'i love otter GIF.gif',
  'jurassic park film GIF.gif',
  'jurassic park raptor GIF.gif',
  'jurassic world film GIF.gif',
  'laughing GIF.gif',
  'laughs cage GIF.gif',
  'lewd stephen colbert GIF.gif',
  'lizard reptile GIF by Head Like an Orange.gif',
  'mind blow wow GIF.gif',
  'monty python GIF.gif',
  'monty python lol GIF.gif',
  'monty python wine GIF.gif',
  'nervous biting nails GIF.gif',
  'poop pooping GIF.gif',
  'python monty GIF.gif',
  'rage GIF (1).gif',
  'rage GIF.gif',
  'sad the basketball diaries GIF.gif',
  'sea otter GIF.gif',
  'season series GIF.gif',
  'sexy beast GIF.gif',
  'sexy make love GIF.gif',
  'taunt GIF.gif',
  'time GIF.gif',
  'train tunnel GIF.gif',
  'wow omg GIF.gif',
];

// Build the full template array
function buildTemplates(): MemeTemplate[] {
  const templates: MemeTemplate[] = [];

  for (const file of ONE_REPLY_FILES) {
    const name = file.replace(/\.[^.]+$/, '').slice(0, 30);
    templates.push({
      id: `1r-${shortHash(file)}`,
      src: `/wdym/1 reply/${encodeURIComponent(file)}`,
      name,
      type: '1-reply',
      isGif: false,
      captionCount: 1,
    });
  }

  for (const file of TWO_REPLY_FILES) {
    const name = file.replace(/\.[^.]+$/, '').slice(0, 30);
    templates.push({
      id: `2r-${shortHash(file)}`,
      src: `/wdym/2 reply/${encodeURIComponent(file)}`,
      name,
      type: '2-reply',
      isGif: false,
      captionCount: 2,
    });
  }

  for (const file of GIF_FILES) {
    const name = file.replace(/\.[^.]+$/, '').slice(0, 30);
    templates.push({
      id: `gif-${shortHash(file)}`,
      src: `/wdym/gif/${encodeURIComponent(file)}`,
      name,
      type: 'gif',
      isGif: true,
      captionCount: 1,
    });
  }

  return templates;
}

const MEME_TEMPLATES = buildTemplates();

// Track used templates per session
let usedTemplateIndices = new Set<number>();

export function resetUsedTemplates(): void {
  usedTemplateIndices = new Set();
}

export function getRandomTemplate(): MemeTemplate {
  if (usedTemplateIndices.size >= MEME_TEMPLATES.length) {
    usedTemplateIndices = new Set();
  }

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
