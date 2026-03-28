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
  /** Named scoring categories (e.g., ['Birds', 'Bonus Cards', 'Eggs']). When defined, replaces generic round labels. */
  scoringCategories?: string[];
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
  /** Scoring category labels (copied from template at creation time) */
  scoringCategories?: string[];
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
  { name: 'Catan', scoring: 'highest', category: 'Strategy', minPlayers: 3, maxPlayers: 4, scoringCategories: ['Settlements', 'Cities', 'Longest Road', 'Largest Army', 'VP Cards'] },
  { name: 'Terraforming Mars', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 5, scoringCategories: ['TR', 'Milestones', 'Awards', 'Greeneries', 'Cities', 'Cards'] },
  { name: 'Wingspan', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 5, scoringCategories: ['Birds', 'Bonus Cards', 'End-of-Round Goals', 'Eggs', 'Food on Cards', 'Tucked Cards'] },
  { name: 'Scythe', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 5, scoringCategories: ['Coins', 'Popularity', 'Stars', 'Territories', 'Resources', 'Structure Bonus'] },
  { name: '7 Wonders', scoring: 'highest', category: 'Strategy', minPlayers: 2, maxPlayers: 7, scoringCategories: ['Military', 'Treasury', 'Wonders', 'Civilian', 'Commerce', 'Guilds', 'Science'] },
  { name: 'Agricola', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 5, scoringCategories: ['Fields', 'Pastures', 'Grain', 'Vegetables', 'Sheep', 'Wild Boar', 'Cattle', 'Unused Spaces', 'Fenced Stables', 'Rooms', 'Family Members', 'Cards', 'Bonus'] },
  { name: 'Puerto Rico', scoring: 'highest', category: 'Strategy', minPlayers: 2, maxPlayers: 5, scoringCategories: ['Buildings', 'Bonus VP', 'VP Chips'] },
  { name: 'Power Grid', scoring: 'highest', category: 'Strategy', minPlayers: 2, maxPlayers: 6 },
  { name: 'Twilight Imperium', scoring: 'highest', category: 'Strategy', minPlayers: 3, maxPlayers: 6 },
  { name: 'Eclipse', scoring: 'highest', category: 'Strategy', minPlayers: 2, maxPlayers: 6 },
  { name: 'Through the Ages', scoring: 'highest', category: 'Strategy', minPlayers: 2, maxPlayers: 4 },
  { name: 'Terra Mystica', scoring: 'highest', category: 'Strategy', minPlayers: 2, maxPlayers: 5, scoringCategories: ['Area', 'Cult', 'Resources', 'Network', 'Bonus'] },
  { name: 'Brass: Birmingham', scoring: 'highest', category: 'Strategy', minPlayers: 2, maxPlayers: 4, scoringCategories: ['Links', 'Buildings', 'Income'] },
  { name: 'Great Western Trail', scoring: 'highest', category: 'Strategy', minPlayers: 2, maxPlayers: 4, scoringCategories: ['Delivery', 'Station Masters', 'Workers', 'Hazards', 'Teepees', 'Objective Cards'] },
  { name: 'Gaia Project', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 4, scoringCategories: ['Resources', 'Research', 'Structures', 'Federations', 'End-of-Round', 'Final Scoring'] },
  { name: 'Concordia', scoring: 'highest', category: 'Strategy', minPlayers: 2, maxPlayers: 5, scoringCategories: ['Minerva', 'Vesta', 'Jupiter', 'Saturnus', 'Mercurius', 'Mars'] },
  { name: 'Viticulture', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 6 },
  { name: 'Everdell', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 4, scoringCategories: ['Base Points', 'Prosperity', 'Events', 'Journey'] },
  { name: 'Clans of Caledonia', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 4, scoringCategories: ['Trade', 'Settlements', 'Contracts', 'Hops/Whisky', 'Export Bonus'] },
  { name: 'Castles of Burgundy', scoring: 'highest', category: 'Strategy', minPlayers: 2, maxPlayers: 4, scoringCategories: ['Tiles', 'Unsold Goods', 'Workers', 'Bonus'] },
  { name: 'Spirit Island', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 4 },
  { name: 'Root', scoring: 'highest', category: 'Strategy', minPlayers: 2, maxPlayers: 4 },
  { name: 'Ark Nova', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 4, scoringCategories: ['Appeal', 'Conservation', 'Reputation'] },
  { name: 'Dune: Imperium', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 4 },
  { name: 'Barrage', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 4, scoringCategories: ['VP Track', 'Objectives', 'Resources', 'Buildings'] },
  { name: 'Pandemic', scoring: 'highest', category: 'Strategy', minPlayers: 2, maxPlayers: 4 },
  { name: 'Earth', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 5, scoringCategories: ['Terrain', 'Ecosystem', 'Fauna', 'Growth', 'Events', 'Compost'] },
  { name: 'Earth: Abundance', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 5, scoringCategories: ['Terrain', 'Ecosystem', 'Fauna', 'Growth', 'Events', 'Compost'] },
  { name: 'Dice Hospital', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 4, scoringCategories: ['Patients Treated', 'Specialist Bonus', 'Ambulance Bonus'] },
  { name: 'Pandemic Legacy', scoring: 'highest', category: 'Strategy', minPlayers: 2, maxPlayers: 4 },
  { name: 'Gloomhaven', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 4 },
  { name: 'Nemesis', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 5 },
  { name: 'Sleeping Gods', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 4 },
  { name: 'Mage Knight', scoring: 'highest', category: 'Strategy', minPlayers: 1, maxPlayers: 4 },
  // Euro
  { name: 'Caverna', scoring: 'highest', category: 'Euro', minPlayers: 1, maxPlayers: 7, scoringCategories: ['Animals', 'Grain/Veg', 'Rubies', 'Dwarfs', 'Unused Spaces', 'Rooms', 'Buildings', 'Gold', 'Bonus'] },
  { name: 'Le Havre', scoring: 'highest', category: 'Euro', minPlayers: 1, maxPlayers: 5, scoringCategories: ['Buildings', 'Ships', 'Cash', 'Loans'] },
  { name: 'Ora et Labora', scoring: 'highest', category: 'Euro', minPlayers: 1, maxPlayers: 4, scoringCategories: ['Settlements', 'Buildings', 'Bonus'] },
  { name: 'Keyflower', scoring: 'highest', category: 'Euro', minPlayers: 2, maxPlayers: 6, scoringCategories: ['Tiles', 'Gold', 'Skill', 'Bonus'] },
  { name: "Tzolk'in", scoring: 'highest', category: 'Euro', minPlayers: 2, maxPlayers: 4, scoringCategories: ['Buildings', 'Monuments', 'Corn', 'Resources', 'Crystal Skulls', 'Bonus'] },
  { name: 'Troyes', scoring: 'highest', category: 'Euro', minPlayers: 2, maxPlayers: 4, scoringCategories: ['Activities', 'Cathedral', 'Events', 'Characters'] },
  { name: 'Orleans', scoring: 'highest', category: 'Euro', minPlayers: 2, maxPlayers: 4, scoringCategories: ['Citizens', 'Trading Stations', 'Development', 'Goods', 'Coins'] },
  { name: 'Paladins of the West Kingdom', scoring: 'highest', category: 'Euro', minPlayers: 1, maxPlayers: 4, scoringCategories: ['Faith', 'Strength', 'Influence', 'Workers', 'Buildings', 'Commissions'] },
  { name: 'Architects of the West Kingdom', scoring: 'highest', category: 'Euro', minPlayers: 1, maxPlayers: 5, scoringCategories: ['Building', 'Virtue', 'Marble', 'Debts', 'Bonus'] },
  { name: 'Lords of Waterdeep', scoring: 'highest', category: 'Euro', minPlayers: 2, maxPlayers: 5, scoringCategories: ['Quests', 'Buildings', 'Lord Bonus', 'Coins'] },
  { name: 'Feast for Odin', scoring: 'highest', category: 'Euro', minPlayers: 1, maxPlayers: 4, scoringCategories: ['Income Board', 'Exploration Boards', 'Animals', 'Ore/Silver', 'Bonus', 'Minus'] },
  { name: 'Underwater Cities', scoring: 'highest', category: 'Euro', minPlayers: 1, maxPlayers: 4, scoringCategories: ['VP Track', 'Cities', 'Networks', 'Cards', 'Bonus'] },
  { name: 'Maracaibo', scoring: 'highest', category: 'Euro', minPlayers: 1, maxPlayers: 4, scoringCategories: ['VP Track', 'Influence', 'Exploration', 'Cards'] },
  { name: 'Anachrony', scoring: 'highest', category: 'Euro', minPlayers: 1, maxPlayers: 4, scoringCategories: ['VP Track', 'Timeline', 'Buildings', 'Morale'] },
  { name: 'Kanban EV', scoring: 'highest', category: 'Euro', minPlayers: 1, maxPlayers: 4, scoringCategories: ['Designs', 'Cars', 'Sandra', 'Upgrades'] },
  // Family
  { name: 'Ticket to Ride', scoring: 'highest', category: 'Family', minPlayers: 2, maxPlayers: 5, scoringCategories: ['Routes', 'Tickets Completed', 'Tickets Failed', 'Longest Route'] },
  { name: 'Carcassonne', scoring: 'highest', category: 'Family', minPlayers: 2, maxPlayers: 5, scoringCategories: ['Cities', 'Roads', 'Monasteries', 'Farms', 'Bonus'] },
  { name: 'Azul', scoring: 'highest', category: 'Family', minPlayers: 2, maxPlayers: 4, scoringCategories: ['Pattern', 'Horizontal Lines', 'Vertical Lines', 'Color Set', 'Floor Penalties'] },
  { name: 'Splendor', scoring: 'highest', category: 'Family', minPlayers: 2, maxPlayers: 4, scoringCategories: ['Cards', 'Nobles'] },
  { name: 'Kingdomino', scoring: 'highest', category: 'Family', minPlayers: 2, maxPlayers: 4, scoringCategories: ['Territory 1', 'Territory 2', 'Territory 3', 'Territory 4', 'Territory 5', 'Center Bonus', 'Full Grid'] },
  { name: 'Patchwork', scoring: 'highest', category: 'Family', minPlayers: 2, maxPlayers: 2, scoringCategories: ['Buttons', 'Empty Spaces'] },
  { name: 'Sagrada', scoring: 'highest', category: 'Family', minPlayers: 1, maxPlayers: 4, scoringCategories: ['Public Objectives', 'Private Objective', 'Remaining Tokens', 'Penalties'] },
  { name: 'Quacks of Quedlinburg', scoring: 'highest', category: 'Family', minPlayers: 2, maxPlayers: 4 },
  { name: 'Century: Spice Road', scoring: 'highest', category: 'Family', minPlayers: 2, maxPlayers: 5 },
  { name: 'Dixit', scoring: 'highest', category: 'Family', minPlayers: 3, maxPlayers: 8 },
  { name: 'Photosynthesis', scoring: 'highest', category: 'Family', minPlayers: 2, maxPlayers: 4, scoringCategories: ['Trees Scored', 'Bonus'] },
  { name: 'Calico', scoring: 'highest', category: 'Family', minPlayers: 1, maxPlayers: 4, scoringCategories: ['Buttons', 'Cats', 'Design Goals'] },
  { name: 'Cascadia', scoring: 'highest', category: 'Family', minPlayers: 1, maxPlayers: 4, scoringCategories: ['Bears', 'Elk', 'Salmon', 'Hawks', 'Foxes', 'Habitat Bonus'] },
  { name: 'Sushi Go Party!', scoring: 'highest', category: 'Family', minPlayers: 2, maxPlayers: 8 },
  { name: 'Takenoko', scoring: 'highest', category: 'Family', minPlayers: 2, maxPlayers: 4, scoringCategories: ['Emperor', 'Gardener', 'Farmer'] },
  { name: 'Aventuriers du Rail', scoring: 'highest', category: 'Family', minPlayers: 2, maxPlayers: 5, scoringCategories: ['Routes', 'Tickets Completed', 'Tickets Failed', 'Longest Route'] },
  { name: 'Karuba', scoring: 'highest', category: 'Family', minPlayers: 2, maxPlayers: 4, scoringCategories: ['Temples', 'Crystals', 'Gold Nuggets'] },
  { name: 'Forbidden Desert', scoring: 'highest', category: 'Family', minPlayers: 2, maxPlayers: 5 },
  { name: 'PARKS', scoring: 'highest', category: 'Family', minPlayers: 1, maxPlayers: 5, scoringCategories: ['Parks', 'Photos', 'Personal Bonus'] },
  { name: 'Trails', scoring: 'highest', category: 'Family', minPlayers: 2, maxPlayers: 4, scoringCategories: ['Badges', 'Photos', 'Nature Tokens'] },
  // Dice
  { name: 'Yahtzee', scoring: 'highest', category: 'Dice', minPlayers: 2, maxPlayers: 8, scoringCategories: ['Ones', 'Twos', 'Threes', 'Fours', 'Fives', 'Sixes', 'Upper Bonus', '3 of a Kind', '4 of a Kind', 'Full House', 'Small Straight', 'Large Straight', 'Yahtzee', 'Chance'] },
  { name: 'Farkle', scoring: 'highest', category: 'Dice', minPlayers: 2, maxPlayers: 8 },
  { name: 'Qwixx', scoring: 'highest', category: 'Dice', minPlayers: 2, maxPlayers: 5, scoringCategories: ['Red', 'Yellow', 'Green', 'Blue', 'Penalties'] },
  { name: 'King of Tokyo', scoring: 'highest', category: 'Dice', minPlayers: 2, maxPlayers: 6 },
  { name: 'Dice Throne', scoring: 'highest', category: 'Dice', minPlayers: 2, maxPlayers: 6 },
  // Card
  { name: 'Dominion', scoring: 'highest', category: 'Card', minPlayers: 2, maxPlayers: 4 },
  { name: 'Star Realms', scoring: 'highest', category: 'Card', minPlayers: 2, maxPlayers: 2 },
  { name: 'Race for the Galaxy', scoring: 'highest', category: 'Card', minPlayers: 2, maxPlayers: 4, scoringCategories: ['Developments', 'Worlds', 'VP Chips', '6-Cost Dev Bonus'] },
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
  { name: 'Blood Rage', scoring: 'highest', category: 'War', minPlayers: 2, maxPlayers: 4, scoringCategories: ['Axes', 'Horns', 'Quests', 'Ragnarök'] },
  { name: 'Kemet', scoring: 'highest', category: 'War', minPlayers: 2, maxPlayers: 5, scoringCategories: ['Battles', 'Temples', 'Pyramids', 'Divine Intervention'] },
  { name: 'Inis', scoring: 'highest', category: 'War', minPlayers: 2, maxPlayers: 4 },
  { name: 'War of the Ring', scoring: 'highest', category: 'War', minPlayers: 2, maxPlayers: 4 },
  { name: 'Star Wars: Rebellion', scoring: 'highest', category: 'War', minPlayers: 2, maxPlayers: 4 },
  // Tile
  { name: 'Isle of Skye', scoring: 'highest', category: 'Tile', minPlayers: 2, maxPlayers: 5, scoringCategories: ['Scrolls', 'Round Scoring', 'Connected', 'Bonus'] },
  { name: 'Suburbia', scoring: 'highest', category: 'Tile', minPlayers: 1, maxPlayers: 4, scoringCategories: ['Population', 'Goals', 'Bonus'] },
  { name: 'Between Two Cities', scoring: 'highest', category: 'Tile', minPlayers: 1, maxPlayers: 7, scoringCategories: ['Shops', 'Factories', 'Taverns', 'Offices', 'Parks', 'Houses'] },
  { name: 'Barenpark', scoring: 'highest', category: 'Tile', minPlayers: 2, maxPlayers: 4, scoringCategories: ['Tiles', 'Bears', 'Bonus'] },
  { name: 'Isle of Cats', scoring: 'highest', category: 'Tile', minPlayers: 1, maxPlayers: 4, scoringCategories: ['Cats', 'Rooms', 'Families', 'Lessons', 'Rare Treasures'] },
  // Party
  { name: 'Cro-Magnon', scoring: 'highest', category: 'Party', minPlayers: 3, maxPlayers: 12 },
  { name: 'Cranium', scoring: 'highest', category: 'Party', minPlayers: 4, maxPlayers: 16 },
  { name: 'Scattergories', scoring: 'highest', category: 'Party', minPlayers: 2, maxPlayers: 6 },
  { name: 'TTMC (Tu Te Mets Combien?)', scoring: 'highest', category: 'Party', minPlayers: 2, maxPlayers: 16 },
  { name: 'Codenames', scoring: 'highest', category: 'Party', minPlayers: 4, maxPlayers: 8 },
  { name: 'Codenames Duet', scoring: 'highest', category: 'Party', minPlayers: 2, maxPlayers: 2 },
  { name: 'Live Letters', scoring: 'highest', category: 'Party', minPlayers: 2, maxPlayers: 8 },
  // Duel
  { name: '7 Wonders Duel', scoring: 'highest', category: 'Duel', minPlayers: 2, maxPlayers: 2, scoringCategories: ['Military', 'Treasury', 'Wonders', 'Civilian', 'Commerce', 'Guilds', 'Science', 'Progress'] },
  { name: 'Splendor Duel', scoring: 'highest', category: 'Duel', minPlayers: 2, maxPlayers: 2, scoringCategories: ['Cards', 'Nobles', 'Crowns'] },
] as const).map(g => ({
  id: toId(g.name),
  name: g.name,
  scoring: g.scoring,
  category: g.category,
  minPlayers: g.minPlayers,
  maxPlayers: g.maxPlayers,
  hasRounds: true,
  roundLabel: 'Round',
  isBuiltIn: true,
  ...('scoringCategories' in g ? { scoringCategories: g.scoringCategories as unknown as string[] } : {}),
}));

export const GAME_CATEGORIES = [...new Set(BUILT_IN_GAMES.map(g => g.category).filter(Boolean))].sort() as string[];
