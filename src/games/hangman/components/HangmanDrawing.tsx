// Hangman Drawing - SVG Gallows with Progressive Figure Reveal
interface HangmanDrawingProps {
  wrongGuesses: number;
}

export default function HangmanDrawing({ wrongGuesses }: HangmanDrawingProps) {
  const strokeColor = '#00f0ff';
  const bodyColor = '#ff6b6b';

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

      {/* Head - 1 */}
      {wrongGuesses >= 1 && (
        <circle cx="300" cy="120" r="40" fill="none" stroke={bodyColor} strokeWidth="6" />
      )}

      {/* Body - 2 */}
      {wrongGuesses >= 2 && (
        <line x1="300" y1="160" x2="300" y2="260" stroke={bodyColor} strokeWidth="6" />
      )}

      {/* Left Arm - 3 */}
      {wrongGuesses >= 3 && (
        <line x1="300" y1="190" x2="230" y2="160" stroke={bodyColor} strokeWidth="6" />
      )}

      {/* Right Arm - 4 */}
      {wrongGuesses >= 4 && (
        <line x1="300" y1="190" x2="370" y2="160" stroke={bodyColor} strokeWidth="6" />
      )}

      {/* Left Leg - 5 */}
      {wrongGuesses >= 5 && (
        <line x1="300" y1="260" x2="240" y2="330" stroke={bodyColor} strokeWidth="6" />
      )}

      {/* Right Leg - 6 */}
      {wrongGuesses >= 6 && (
        <line x1="300" y1="260" x2="360" y2="330" stroke={bodyColor} strokeWidth="6" />
      )}
    </svg>
  );
}
