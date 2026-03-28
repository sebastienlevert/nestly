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
  /** Game category for filtering */
  category?: string;
  /** Whether highest or lowest score wins */
  scoring?: 'highest' | 'lowest';
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

/** Helper to generate an ID from a game name */
function toId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Built-in game templates */
export const BUILT_IN_GAMES: GameTemplate[] = ([
  // Strategy
  { name: 'Catan', scoring: 'highest', category: 'Strategy', minPlayers: 3, maxPlayers: 4 },
  { name: 'Terraforming Mars', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 5 },
  { name: 'Wingspan', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 5 },
  { name: 'Scythe', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 5 },
  { name: '7 Wonders', scoring: 'highest', category: 'Strategy', minPlayers: 2, maxPlayers: 7 },
  { name: 'Agricola', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 5 },
  { name: 'Puerto Rico', scoring: 'highest', category: 'Strategy', minPlayers: 2, maxPlayers: 5 },
  { name: 'Power Grid', scoring: 'highest', category: 'Strategy', minPlayers: 2, maxPlayers: 6 },
  { name: 'Twilight Imperium', scoring: 'highest', category: 'Strategy', minPlayers: 3, maxPlayers: 6 },
  { name: 'Eclipse', scoring: 'highest', category: 'Strategy', minPlayers: 2, maxPlayers: 6 },
  { name: 'Through the Ages', scoring: 'highest', category: 'Strategy', minPlayers: 2, maxPlayers: 4 },
  { name: 'Terra Mystica', scoring: 'highest', category: 'Strategy', minPlayers: 2, maxPlayers: 5 },
  { name: 'Brass: Birmingham', scoring: 'highest', category: 'Strategy', minPlayers: 2, maxPlayers: 4 },
  { name: 'Great Western Trail', scoring: 'highest', category: 'Strategy', minPlayers: 2, maxPlayers: 4 },
  { name: 'Gaia Project', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 4 },
  { name: 'Concordia', scoring: 'highest', category: 'Strategy', minPlayers: 2, maxPlayers: 5 },
  { name: 'Viticulture', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 6 },
  { name: 'Everdell', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 4 },
  { name: 'Clans of Caledonia', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 4 },
  { name: 'Castles of Burgundy', scoring: 'highest', category: 'Strategy', minPlayers: 2, maxPlayers: 4 },
  { name: 'Spirit Island', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 4 },
  { name: 'Root', scoring: 'highest', category: 'Strategy', minPlayers: 2, maxPlayers: 4 },
  { name: 'Ark Nova', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 4 },
  { name: 'Dune: Imperium', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 4 },
  { name: 'Barrage', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 4 },
  { name: 'Pandemic', scoring: 'highest', category: 'Strategy', minPlayers: 2, maxPlayers: 4 },
  { name: 'Earth', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 5 },
  { name: 'Earth: Abundance', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 5 },
  { name: 'Dice Hospital', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 4 },
  { name: 'Pandemic Legacy', scoring: 'highest', category: 'Strategy', minPlayers: 2, maxPlayers: 4 },
  { name: 'Gloomhaven', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 4 },
  { name: 'Nemesis', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 5 },
  { name: 'Sleeping Gods', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 4 },
  { name: 'Mage Knight', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 4 },
  // Euro
  { name: 'Caverna', scoring: 'highest', category: 'Euro', minPlayers: 1, maxPlayers: 7 },
  { name: 'Le Havre', scoring: 'highest', category: 'Euro', minPlayers: 1, maxPlayers: 5 },
  { name: 'Ora et Labora', scoring: 'highest', category: 'Euro', minPlayers: 1, maxPlayers: 4 },
  { name: 'Keyflower', scoring: 'highest', category: 'Euro', minPlayers: 2, maxPlayers: 6 },
  { name: "Tzolk'in", scoring: 'highest', category: 'Euro', minPlayers: 2, maxPlayers: 4 },
  { name: 'Troyes', scoring: 'highest', category: 'Euro', minPlayers: 2, maxPlayers: 4 },
  { name: 'Orleans', scoring: 'highest', category: 'Euro', minPlayers: 2, maxPlayers: 4 },
  { name: 'Paladins of the West Kingdom', scoring: 'highest', category: 'Euro', minPlayers: 1, maxPlayers: 4 },
  { name: 'Architects of the West Kingdom', scoring: 'highest', category: 'Euro', minPlayers: 1, maxPlayers: 5 },
  { name: 'Lords of Waterdeep', scoring: 'highest', category: 'Euro', minPlayers: 2, maxPlayers: 5 },
  { name: 'Feast for Odin', scoring: 'highest', category: 'Euro', minPlayers: 1, maxPlayers: 4 },
  { name: 'Underwater Cities', scoring: 'highest', category: 'Euro', minPlayers: 1, maxPlayers: 4 },
  { name: 'Maracaibo', scoring: 'highest', category: 'Euro', minPlayers: 1, maxPlayers: 4 },
  { name: 'Anachrony', scoring: 'highest', category: 'Euro', minPlayers: 1, maxPlayers: 4 },
  { name: 'Kanban EV', scoring: 'highest', category: 'Euro', minPlayers: 1, maxPlayers: 4 },
  // Family
  { name: 'Ticket to Ride', scoring: 'highest', category: 'Family', minPlayers: 2, maxPlayers: 5 },
  { name: 'Carcassonne', scoring: 'highest', category: 'Family', minPlayers: 2, maxPlayers: 5 },
  { name: 'Azul', scoring: 'highest', category: 'Family', minPlayers: 2, maxPlayers: 4 },
  { name: 'Splendor', scoring: 'highest', category: 'Family', minPlayers: 2, maxPlayers: 4 },
  { name: 'Kingdomino', scoring: 'highest', category: 'Family', minPlayers: 2, maxPlayers: 4 },
  { name: 'Patchwork', scoring: 'highest', category: 'Family', minPlayers: 2, maxPlayers: 2 },
  { name: 'Sagrada', scoring: 'highest', category: 'Family', minPlayers: 1, maxPlayers: 4 },
  { name: 'Quacks of Quedlinburg', scoring: 'highest', category: 'Family', minPlayers: 2, maxPlayers: 4 },
  { name: 'Century: Spice Road', scoring: 'highest', category: 'Family', minPlayers: 2, maxPlayers: 5 },
  { name: 'Dixit', scoring: 'highest', category: 'Family', minPlayers: 3, maxPlayers: 8 },
  { name: 'Photosynthesis', scoring: 'highest', category: 'Family', minPlayers: 2, maxPlayers: 4 },
  { name: 'Calico', scoring: 'highest', category: 'Family', minPlayers: 1, maxPlayers: 4 },
  { name: 'Cascadia', scoring: 'highest', category: 'Family', minPlayers: 1, maxPlayers: 4 },
  { name: 'Sushi Go Party!', scoring: 'highest', category: 'Family', minPlayers: 2, maxPlayers: 8 },
  { name: 'Takenoko', scoring: 'highest', category: 'Family', minPlayers: 2, maxPlayers: 4 },
  { name: 'Aventuriers du Rail', scoring: 'highest', category: 'Family', minPlayers: 2, maxPlayers: 5 },
  { name: 'Karuba', scoring: 'highest', category: 'Family', minPlayers: 2, maxPlayers: 4 },
  { name: 'Forbidden Desert', scoring: 'highest', category: 'Family', minPlayers: 2, maxPlayers: 5 },
  { name: 'PARKS', scoring: 'highest', category: 'Family', minPlayers: 1, maxPlayers: 5 },
  { name: 'Trails', scoring: 'highest', category: 'Family', minPlayers: 2, maxPlayers: 4 },
  // Dice
  { name: 'Yahtzee', scoring: 'highest', category: 'Dice', minPlayers: 2, maxPlayers: 8 },
  { name: 'Farkle', scoring: 'highest', category: 'Dice', minPlayers: 2, maxPlayers: 8 },
  { name: 'Qwixx', scoring: 'highest', category: 'Dice', minPlayers: 2, maxPlayers: 5 },
  { name: 'King of Tokyo', scoring: 'highest', category: 'Dice', minPlayers: 2, maxPlayers: 6 },
  { name: 'Dice Throne', scoring: 'highest', category: 'Dice', minPlayers: 2, maxPlayers: 6 },
  // Card
  { name: 'Dominion', scoring: 'highest', category: 'Card', minPlayers: 2, maxPlayers: 4 },
  { name: 'Star Realms', scoring: 'highest', category: 'Card', minPlayers: 2, maxPlayers: 2 },
  { name: 'Race for the Galaxy', scoring: 'highest', category: 'Card', minPlayers: 2, maxPlayers: 4 },
  { name: 'Res Arcana', scoring: 'highest', category: 'Card', minPlayers: 2, maxPlayers: 4 },
  { name: 'Innovation', scoring: 'highest', category: 'Card', minPlayers: 2, maxPlayers: 4 },
  { name: 'Racko', scoring: 'highest', category: 'Card', minPlayers: 2, maxPlayers: 4 },
  { name: 'Vale of Eternity', scoring: 'highest', category: 'Card', minPlayers: 2, maxPlayers: 4 },
  { name: 'Skyjo', scoring: 'lowest', category: 'Card', minPlayers: 2, maxPlayers: 8 },
  { name: 'Golf (Card Game)', scoring: 'lowest', category: 'Card', minPlayers: 2, maxPlayers: 8 },
  { name: 'Hearts', scoring: 'lowest', category: 'Card', minPlayers: 4, maxPlayers: 4 },
  { name: 'Spades', scoring: 'highest', category: 'Card', minPlayers: 4, maxPlayers: 4 },
  { name: 'Euchre', scoring: 'highest', category: 'Card', minPlayers: 4, maxPlayers: 4 },
  { name: 'Pinochle', scoring: 'highest', category: 'Card', minPlayers: 2, maxPlayers: 4 },
  { name: 'Cribbage', scoring: 'highest', category: 'Card', minPlayers: 2, maxPlayers: 4 },
  { name: 'Canasta', scoring: 'highest', category: 'Card', minPlayers: 2, maxPlayers: 6 },
  // Classic
  { name: 'Scrabble', scoring: 'highest', category: 'Classic', minPlayers: 2, maxPlayers: 4 },
  { name: 'Monopoly', scoring: 'highest', category: 'Classic', minPlayers: 2, maxPlayers: 8 },
  { name: 'Risk', scoring: 'highest', category: 'Classic', minPlayers: 2, maxPlayers: 6 },
  { name: 'Trivial Pursuit', scoring: 'highest', category: 'Classic', minPlayers: 2, maxPlayers: 6 },
  { name: 'Boggle', scoring: 'highest', category: 'Classic', minPlayers: 2, maxPlayers: 8 },
  { name: 'Rummikub', scoring: 'lowest', category: 'Classic', minPlayers: 2, maxPlayers: 4 },
  { name: 'Sequence', scoring: 'highest', category: 'Classic', minPlayers: 2, maxPlayers: 6 },
  { name: 'Phase 10', scoring: 'lowest', category: 'Classic', minPlayers: 2, maxPlayers: 6 },
  { name: 'UNO', scoring: 'lowest', category: 'Classic', minPlayers: 2, maxPlayers: 10 },
  { name: 'Skip-Bo', scoring: 'highest', category: 'Classic', minPlayers: 2, maxPlayers: 6 },
  { name: 'Clue', scoring: 'highest', category: 'Classic', minPlayers: 2, maxPlayers: 6 },
  { name: 'Sorry!', scoring: 'highest', category: 'Classic', minPlayers: 2, maxPlayers: 4 },
  // War
  { name: 'Blood Rage', scoring: 'highest', category: 'War', minPlayers: 2, maxPlayers: 4 },
  { name: 'Kemet', scoring: 'highest', category: 'War', minPlayers: 2, maxPlayers: 5 },
  { name: 'Inis', scoring: 'highest', category: 'War', minPlayers: 2, maxPlayers: 4 },
  { name: 'War of the Ring', scoring: 'highest', category: 'War', minPlayers: 2, maxPlayers: 4 },
  { name: 'Star Wars: Rebellion', scoring: 'highest', category: 'War', minPlayers: 2, maxPlayers: 4 },
  // Tile
  { name: 'Isle of Skye', scoring: 'highest', category: 'Tile', minPlayers: 2, maxPlayers: 5 },
  { name: 'Suburbia', scoring: 'highest', category: 'Tile', minPlayers: 1, maxPlayers: 4 },
  { name: 'Between Two Cities', scoring: 'highest', category: 'Tile', minPlayers: 1, maxPlayers: 7 },
  { name: 'Barenpark', scoring: 'highest', category: 'Tile', minPlayers: 2, maxPlayers: 4 },
  { name: 'Isle of Cats', scoring: 'highest', category: 'Tile', minPlayers: 1, maxPlayers: 4 },
  // Party
  { name: 'Cro-Magnon', scoring: 'highest', category: 'Party', minPlayers: 3, maxPlayers: 12 },
  { name: 'Cranium', scoring: 'highest', category: 'Party', minPlayers: 4, maxPlayers: 16 },
  { name: 'Scattergories', scoring: 'highest', category: 'Party', minPlayers: 2, maxPlayers: 6 },
  { name: 'TTMC (Tu Te Mets Combien?)', scoring: 'highest', category: 'Party', minPlayers: 2, maxPlayers: 16 },
  { name: 'Codenames', scoring: 'highest', category: 'Party', minPlayers: 4, maxPlayers: 8 },
  { name: 'Codenames Duet', scoring: 'highest', category: 'Party', minPlayers: 2, maxPlayers: 2 },
  { name: 'Live Letters', scoring: 'highest', category: 'Party', minPlayers: 2, maxPlayers: 8 },
  // Duel
  { name: '7 Wonders Duel', scoring: 'highest', category: 'Duel', minPlayers: 2, maxPlayers: 2 },
  { name: 'Splendor Duel', scoring: 'highest', category: 'Duel', minPlayers: 2, maxPlayers: 2 },
] as const).map(g => ({
  ...g,
  id: toId(g.name),
  hasRounds: true as const,
  roundLabel: 'Round',
  isBuiltIn: true as const,
}));

export const GAME_CATEGORIES = [...new Set(BUILT_IN_GAMES.map(g => g.category).filter(Boolean))].sort() as string[];
