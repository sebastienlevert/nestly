/** A predefined or custom game template */
export interface GameTemplate {
  id: string;
  name: string;
  /** Minimum number of players */
  minPlayers: number;
  /** Maximum number of players */
  maxPlayers: number;
  /** Whether scoring is per-round (true) or single total (false) */
  hasRounds: boolean;
  /** Label for each round (e.g., "Round" for generic, "Ward" for Dice Hospital) */
  roundLabel?: string;
  /** Icon name from lucide-react (optional) */
  icon?: string;
  /** Whether this is a built-in game or user-created */
  isBuiltIn: boolean;
}

/** A player in a game session */
export interface PlayerScore {
  name: string;
  /** Scores per round (index = round number) */
  roundScores: number[];
  /** Final total score */
  totalScore: number;
}

/** A single played game session */
export interface GameSession {
  id: string;
  /** Reference to the game template id */
  gameId: string;
  /** Game name (denormalized for history display) */
  gameName: string;
  /** When the game was played */
  playedAt: string;
  /** Players and their scores */
  players: PlayerScore[];
  /** Number of rounds played */
  rounds: number;
  /** Optional notes about this session */
  notes?: string;
  /** Whether the session is still in progress */
  isActive: boolean;
}

/** All game data stored in OneDrive */
export interface GamesData {
  /** Custom game templates created by the user */
  customTemplates: GameTemplate[];
  /** All game sessions (history) */
  sessions: GameSession[];
}

/** Built-in game templates */
export const BUILT_IN_GAMES: GameTemplate[] = [
  {
    id: 'dice-hospital',
    name: 'Dice Hospital',
    minPlayers: 1,
    maxPlayers: 4,
    hasRounds: true,
    roundLabel: 'Round',
    isBuiltIn: true,
  },
  {
    id: 'parks',
    name: 'Parks',
    minPlayers: 1,
    maxPlayers: 5,
    hasRounds: false,
    isBuiltIn: true,
  },
  {
    id: 'wingspan',
    name: 'Wingspan',
    minPlayers: 1,
    maxPlayers: 5,
    hasRounds: true,
    roundLabel: 'Round',
    isBuiltIn: true,
  },
];
