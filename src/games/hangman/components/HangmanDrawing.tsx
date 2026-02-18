// Hangman Drawing - SVG Gallows with Progressive Figure Reveal (10 stages)
interface HangmanDrawingProps {
  wrongGuesses: number;
}

export default function HangmanDrawing({ wrongGuesses }: HangmanDrawingProps) {
  const strokeColor = '#00f0ff';
  const bodyColor = '#ff6b6b';
  const faceColor = '#ffffff';

  return (
    <svg
      viewBox="0 0 400 500"
      className="hangman-drawing"
      style={{
        width: '300px',
        height: '400px',
        margin: '0 auto',
      }}
    >
      {/* Gallows */}
      <line x1="50" y1="450" x2="150" y2="450" stroke={strokeColor} strokeWidth="8" />
      <line x1="100" y1="450" x2="100" y2="30" stroke={strokeColor} strokeWidth="8" />
      <line x1="100" y1="30" x2="300" y2="30" stroke={strokeColor} strokeWidth="8" />
      <line x1="300" y1="30" x2="300" y2="80" stroke={strokeColor} strokeWidth="6" />

      {/* 1 - Head */}
      {wrongGuesses >= 1 && (
        <circle cx="300" cy="120" r="40" fill="none" stroke={bodyColor} strokeWidth="6" />
      )}

      {/* 2 - Body */}
      {wrongGuesses >= 2 && (
        <line x1="300" y1="160" x2="300" y2="260" stroke={bodyColor} strokeWidth="6" />
      )}

      {/* 3 - Left Arm */}
      {wrongGuesses >= 3 && (
        <line x1="300" y1="190" x2="230" y2="160" stroke={bodyColor} strokeWidth="6" />
      )}

      {/* 4 - Right Arm */}
      {wrongGuesses >= 4 && (
        <line x1="300" y1="190" x2="370" y2="160" stroke={bodyColor} strokeWidth="6" />
      )}

      {/* 5 - Left Leg */}
      {wrongGuesses >= 5 && (
        <line x1="300" y1="260" x2="240" y2="330" stroke={bodyColor} strokeWidth="6" />
      )}

      {/* 6 - Right Leg */}
      {wrongGuesses >= 6 && (
        <line x1="300" y1="260" x2="360" y2="330" stroke={bodyColor} strokeWidth="6" />
      )}

      {/* 7 - Left Eye */}
      {wrongGuesses >= 7 && (
        <g>
          <line x1="282" y1="108" x2="292" y2="118" stroke={faceColor} strokeWidth="3" strokeLinecap="round" />
          <line x1="292" y1="108" x2="282" y2="118" stroke={faceColor} strokeWidth="3" strokeLinecap="round" />
        </g>
      )}

      {/* 8 - Right Eye */}
      {wrongGuesses >= 8 && (
        <g>
          <line x1="308" y1="108" x2="318" y2="118" stroke={faceColor} strokeWidth="3" strokeLinecap="round" />
          <line x1="318" y1="108" x2="308" y2="118" stroke={faceColor} strokeWidth="3" strokeLinecap="round" />
        </g>
      )}

      {/* 9 - Nose */}
      {wrongGuesses >= 9 && (
        <line x1="300" y1="118" x2="300" y2="130" stroke={faceColor} strokeWidth="3" strokeLinecap="round" />
      )}

      {/* 10 - Mouth (frown) */}
      {wrongGuesses >= 10 && (
        <path
          d="M 286 140 Q 300 132 314 140"
          fill="none"
          stroke={faceColor}
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
