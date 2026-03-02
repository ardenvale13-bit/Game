// Guess Who - Character Data and Types

export interface GWCharacter {
  id: string;
  name: string;
  imagePath: string; // e.g., /guesswho/char-1.png
  traits: {
    hairColor: string; // e.g., "brown", "blonde", "black", "red", "gray", "white"
    eyeColor: string;  // e.g., "blue", "brown", "green", "hazel", "gray"
    hasHat: boolean;
    hasGlasses: boolean;
    hasFacialHair: boolean; // beard, mustache
    gender: 'male' | 'female' | 'other';
  };
}

export const GUESSWHO_CHARACTERS: GWCharacter[] = [
  {
    id: 'char-1',
    name: 'Alex',
    imagePath: '/guesswho/char-1.png',
    traits: {
      hairColor: 'brown',
      eyeColor: 'blue',
      hasHat: false,
      hasGlasses: false,
      hasFacialHair: true,
      gender: 'male',
    },
  },
  {
    id: 'char-2',
    name: 'Bailey',
    imagePath: '/guesswho/char-2.png',
    traits: {
      hairColor: 'blonde',
      eyeColor: 'green',
      hasHat: true,
      hasGlasses: false,
      hasFacialHair: false,
      gender: 'female',
    },
  },
  {
    id: 'char-3',
    name: 'Casey',
    imagePath: '/guesswho/char-3.png',
    traits: {
      hairColor: 'black',
      eyeColor: 'brown',
      hasHat: false,
      hasGlasses: true,
      hasFacialHair: false,
      gender: 'other',
    },
  },
  {
    id: 'char-4',
    name: 'Dakota',
    imagePath: '/guesswho/char-4.png',
    traits: {
      hairColor: 'red',
      eyeColor: 'hazel',
      hasHat: true,
      hasGlasses: true,
      hasFacialHair: false,
      gender: 'female',
    },
  },
  {
    id: 'char-5',
    name: 'Evan',
    imagePath: '/guesswho/char-5.png',
    traits: {
      hairColor: 'brown',
      eyeColor: 'brown',
      hasHat: false,
      hasGlasses: false,
      hasFacialHair: true,
      gender: 'male',
    },
  },
  {
    id: 'char-6',
    name: 'Faye',
    imagePath: '/guesswho/char-6.png',
    traits: {
      hairColor: 'blonde',
      eyeColor: 'blue',
      hasHat: false,
      hasGlasses: true,
      hasFacialHair: false,
      gender: 'female',
    },
  },
  {
    id: 'char-7',
    name: 'Grace',
    imagePath: '/guesswho/char-7.png',
    traits: {
      hairColor: 'black',
      eyeColor: 'green',
      hasHat: true,
      hasGlasses: false,
      hasFacialHair: false,
      gender: 'female',
    },
  },
  {
    id: 'char-8',
    name: 'Hunter',
    imagePath: '/guesswho/char-8.png',
    traits: {
      hairColor: 'gray',
      eyeColor: 'blue',
      hasHat: true,
      hasGlasses: false,
      hasFacialHair: true,
      gender: 'male',
    },
  },
  {
    id: 'char-9',
    name: 'Iris',
    imagePath: '/guesswho/char-9.png',
    traits: {
      hairColor: 'red',
      eyeColor: 'green',
      hasHat: false,
      hasGlasses: false,
      hasFacialHair: false,
      gender: 'female',
    },
  },
  {
    id: 'char-10',
    name: 'Jordan',
    imagePath: '/guesswho/char-10.png',
    traits: {
      hairColor: 'blonde',
      eyeColor: 'brown',
      hasHat: false,
      hasGlasses: false,
      hasFacialHair: false,
      gender: 'other',
    },
  },
  {
    id: 'char-11',
    name: 'Kai',
    imagePath: '/guesswho/char-11.png',
    traits: {
      hairColor: 'black',
      eyeColor: 'brown',
      hasHat: false,
      hasGlasses: true,
      hasFacialHair: true,
      gender: 'male',
    },
  },
  {
    id: 'char-12',
    name: 'Lea',
    imagePath: '/guesswho/char-12.png',
    traits: {
      hairColor: 'brown',
      eyeColor: 'green',
      hasHat: true,
      hasGlasses: false,
      hasFacialHair: false,
      gender: 'female',
    },
  },
  {
    id: 'char-13',
    name: 'Morgan',
    imagePath: '/guesswho/char-13.png',
    traits: {
      hairColor: 'blonde',
      eyeColor: 'blue',
      hasHat: true,
      hasGlasses: true,
      hasFacialHair: false,
      gender: 'female',
    },
  },
  {
    id: 'char-14',
    name: 'Nolan',
    imagePath: '/guesswho/char-14.png',
    traits: {
      hairColor: 'gray',
      eyeColor: 'green',
      hasHat: false,
      hasGlasses: true,
      hasFacialHair: true,
      gender: 'male',
    },
  },
  {
    id: 'char-15',
    name: 'Olive',
    imagePath: '/guesswho/char-15.png',
    traits: {
      hairColor: 'black',
      eyeColor: 'brown',
      hasHat: true,
      hasGlasses: false,
      hasFacialHair: false,
      gender: 'female',
    },
  },
  {
    id: 'char-16',
    name: 'Parker',
    imagePath: '/guesswho/char-16.png',
    traits: {
      hairColor: 'red',
      eyeColor: 'blue',
      hasHat: false,
      hasGlasses: false,
      hasFacialHair: false,
      gender: 'other',
    },
  },
  {
    id: 'char-17',
    name: 'Quinn',
    imagePath: '/guesswho/char-17.png',
    traits: {
      hairColor: 'brown',
      eyeColor: 'hazel',
      hasHat: true,
      hasGlasses: true,
      hasFacialHair: false,
      gender: 'other',
    },
  },
  {
    id: 'char-18',
    name: 'Riley',
    imagePath: '/guesswho/char-18.png',
    traits: {
      hairColor: 'blonde',
      eyeColor: 'green',
      hasHat: false,
      hasGlasses: false,
      hasFacialHair: true,
      gender: 'male',
    },
  },
  {
    id: 'char-19',
    name: 'Sam',
    imagePath: '/guesswho/char-19.png',
    traits: {
      hairColor: 'white',
      eyeColor: 'brown',
      hasHat: false,
      hasGlasses: false,
      hasFacialHair: false,
      gender: 'other',
    },
  },
  {
    id: 'char-20',
    name: 'Taylor',
    imagePath: '/guesswho/char-20.png',
    traits: {
      hairColor: 'red',
      eyeColor: 'hazel',
      hasHat: true,
      hasGlasses: false,
      hasFacialHair: false,
      gender: 'female',
    },
  },
  {
    id: 'char-21',
    name: 'Umber',
    imagePath: '/guesswho/char-21.png',
    traits: {
      hairColor: 'black',
      eyeColor: 'green',
      hasHat: false,
      hasGlasses: true,
      hasFacialHair: true,
      gender: 'male',
    },
  },
  {
    id: 'char-22',
    name: 'Vale',
    imagePath: '/guesswho/char-22.png',
    traits: {
      hairColor: 'brown',
      eyeColor: 'blue',
      hasHat: false,
      hasGlasses: false,
      hasFacialHair: false,
      gender: 'female',
    },
  },
  {
    id: 'char-23',
    name: 'Wren',
    imagePath: '/guesswho/char-23.png',
    traits: {
      hairColor: 'gray',
      eyeColor: 'hazel',
      hasHat: true,
      hasGlasses: true,
      hasFacialHair: false,
      gender: 'other',
    },
  },
  {
    id: 'char-24',
    name: 'Zane',
    imagePath: '/guesswho/char-24.png',
    traits: {
      hairColor: 'blonde',
      eyeColor: 'hazel',
      hasHat: false,
      hasGlasses: true,
      hasFacialHair: true,
      gender: 'male',
    },
  },
];
