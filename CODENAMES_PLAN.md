# Codenames Implementation Plan

## Overview
Full multiplayer Codenames game with team-based mechanics, spymaster/operative roles, 5×5 card grid with flip animations, and real-time sync via Supabase Realtime. Follows existing CAH/Pictionary architecture patterns.

---

## Game Rules (Classic Distribution)
- **25 cards** in a 5×5 grid, each with a random word
- **9 cards** for starting team (pink or blue, randomly chosen)
- **8 cards** for the other team
- **7 neutral** cards (beige)
- **1 assassin** (bomb card)
- Starting team gets first turn
- Spymaster gives a **word + number** clue
- Any operative can lock in a guess (first to lock flips the card)
- Team keeps guessing up to (clue number + 1) or until they hit a wrong card
- Hitting the assassin = instant loss
- First team to find all their cards wins
- **Optional timer** (host toggle)

---

## File Structure

```
src/games/codenames/
├── codenamesStore.ts          # Zustand store (teams, board, roles, turns)
├── codenamesData.ts           # 100 placeholder words + board generation utilities
├── codenames.css              # All styling (card flip animations, team colors, board grid)
├── CodenamesGameWrapper.tsx   # Main orchestrator (sync, lifecycle, host logic)
└── components/
    ├── CodenamesTeamSetup.tsx  # Pre-game team/role selection screen
    ├── CodenamesBoard.tsx     # 5×5 card grid (main gameplay)
    ├── CodenamesCard.tsx      # Individual card with flip animation + avatar bubbles
    ├── CodenamesClueBar.tsx   # Spymaster clue input / operative clue display
    ├── CodenamesTeamPanel.tsx # Team roster sidebar (shows who's on each team + roles)
    └── CodenamesGameOver.tsx  # Win/loss screen

src/hooks/useCodenamesSync.ts  # Multiplayer sync hook (Supabase Realtime)
```

---

## Step-by-Step Implementation

### Step 1: Data Layer (`codenamesData.ts`)
- 100 placeholder words (nouns, easy to visualize)
- `generateBoard()`: picks 25 random words, assigns card types (9 starting team, 8 other team, 7 neutral, 1 assassin), returns shuffled board
- Types: `CodenamesCard`, `CardType` ('pink' | 'blue' | 'neutral' | 'assassin'), `TeamColor` ('pink' | 'blue')

### Step 2: Store (`codenamesStore.ts`)
**State:**
- `phase`: 'lobby' | 'team-setup' | 'playing' | 'game-over'
- `board`: 25 `CodenamesCard` objects (word, type, isRevealed, votes: {playerId, avatarFilename}[])
- `teams`: { pink: { spymasters: string[], operatives: string[] }, blue: { ... } }
- `currentTeam`: 'pink' | 'blue' (whose turn it is)
- `startingTeam`: 'pink' | 'blue' (team with 9 cards, goes first)
- `currentClue`: { word: string, number: number } | null
- `guessesRemaining`: number (clue number + 1, or null if no clue yet)
- `players`: CodenamesPlayer[] (id, name, avatar, team, role)
- `pinkCardsRemaining` / `blueCardsRemaining`: count
- `winner`: 'pink' | 'blue' | null
- `timerEnabled`: boolean
- `timeRemaining`: number

**Actions:**
- `setTeam(playerId, team, role)` — assign player to team/role
- `submitClue(word, number)` — spymaster submits clue
- `voteCard(playerId, cardIndex)` — operative clicks a card (shows avatar bubble)
- `lockCard(playerId, cardIndex)` — operative locks in guess (flips card)
- `endTurn()` — team ends their turn early
- `checkWinCondition()` — after each flip

### Step 3: Team Setup Component (`CodenamesTeamSetup.tsx`)
- Two team columns (Pink / Blue) with their detective icons
- Each column has "Spymaster" and "Operative" sections
- Players click to join a team+role
- Validation: min 1 spymaster + 1 operative per team, min 4 total
- Max 2 spymasters per team, max 7 operatives per team
- Host sees "Start Game" button (enabled when teams valid)
- Shows player avatars in their chosen slots

### Step 4: Board Component (`CodenamesBoard.tsx`)
- 5×5 CSS grid
- **Operative view**: All cards start beige (#fbebd7), revealed cards show their team icon with flip animation
- **Spymaster view**: Cards are color-coded — blue (#57abfd), pink (#ff95da), beige (#fbebd7 for neutral), dark gray (#5a5d68 for assassin) — revealed cards show the icon image
- Top bar: current team indicator, clue display, guesses remaining, optional timer
- Team panels on sides showing rosters

### Step 5: Card Component (`CodenamesCard.tsx`)
- **Unrevealed (operative)**: Beige background (#fbebd7), word text in dark color, rounded corners
- **Unrevealed (spymaster)**: Color-coded background based on card type, word text
- **Avatar bubbles**: When an operative clicks (but hasn't locked), their avatar appears in a small bubble at top-left corner of the card
- **Lock-in button**: Small green circle checkmark at top-right corner to confirm guess
- **Flip animation**: CSS 3D transform (rotateY 180deg), card front = word on beige, card back = team icon image (pink-team-icon, blue-team-icon, bomb-card, or no-team-icon for neutral)
- Uses `transform-style: preserve-3d`, `backface-visibility: hidden`

### Step 6: Clue Bar (`CodenamesClueBar.tsx`)
- **Spymaster's turn (is spymaster)**: Text input for word + number selector (1-9 or "Unlimited"), submit button
- **Spymaster's turn (is operative)**: "Waiting for spymaster..." with spinner
- **Operative's turn**: Shows the clue word + number prominently, "End Turn" button, guesses remaining counter

### Step 7: Sync Hook (`useCodenamesSync.ts`)
Events (following CAH pattern):
- `codenames_team_setup` — team assignment changes
- `codenames_game_start` — board + starting team broadcast
- `codenames_clue` — spymaster submits clue
- `codenames_vote` — operative clicks a card (avatar bubble appears)
- `codenames_lock` — operative locks in guess (card flips)
- `codenames_end_turn` — team ends turn
- `codenames_timer_sync` — timer sync from host
- `codenames_game_over` — winner announcement
- `codenames_full_state` — full state for reconnects
- `codenames_request_state` — late joiner requests state

Host-authoritative: host validates all card reveals, checks win conditions, manages turn flow.

### Step 8: Game Wrapper (`CodenamesGameWrapper.tsx`)
Following CAH pattern:
- Init: sync lobby players → codenames store
- Host waits for `isReady` before allowing team setup
- Phase rendering: team-setup → playing → game-over
- Host manages optional timer
- Broadcasts state changes on phase transitions
- Handlers for clue submission, card voting/locking, turn ending

### Step 9: Integration
- `lobbyStore.ts`: Add `'codenames'` to `GameType`, min 4 players for codenames
- `GameRouter.tsx`: Add `case 'codenames': return <CodenamesGameWrapper />`
- `LobbyNew.tsx`: Add codenames game selection button with the icon

### Step 10: CSS (`codenames.css`)
- Card flip animation with 3D transforms
- Team color variables
- Board grid (5×5, responsive)
- Avatar bubble positioning
- Lock-in checkmark styling
- Spymaster vs operative view differences
- Mobile responsive (cards shrink, maintain grid)

---

## Asset Mapping
| Purpose | File | Usage |
|---------|------|-------|
| Blue team reveal | blue-team-icon.png / blue-team-icon2.png | Card back when blue card flipped |
| Pink team reveal | pink-team-icon.png / pink-team-icon2.png | Card back when pink card flipped |
| Assassin reveal | bomb-card.png | Card back when assassin flipped |
| Neutral reveal | no-team-icon.png | Card back when neutral flipped |
| Game icon | codenames-icon.png | Lobby game selection |

## Color Palette
| Element | Color |
|---------|-------|
| Unrevealed cards (operative) | #fbebd7 (beige) |
| Blue team (spymaster view) | #57abfd |
| Pink team (spymaster view) | #ff95da |
| Neutral (spymaster view) | #fbebd7 (same beige) |
| Assassin (spymaster view) | #5a5d68 |
| Card text | #2a2a2a (dark) |
