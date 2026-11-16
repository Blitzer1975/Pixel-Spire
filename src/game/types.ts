export const TILE = 16;
export const SHAFT_COLS = 16;
export const VIRTUAL_W = TILE * SHAFT_COLS; // 256px
export const VIRTUAL_H = 384; // 24 tiles tall

export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type CardinalDir = 'up' | 'down' | 'left' | 'right';
export type SpikeDir = CardinalDir;

export type GameMode = 'endless' | 'race';

export type SkinId =
  | 'strider'
  | 'cyclops'
  | 'ninja'
  | 'robot'
  | 'knight'
  | 'gargoyle'
  | 'ghost'
  | 'vampire'
  | 'astronaut'
  | 'demon'
  | 'paladin'
  | 'samurai'
  | 'ascendant'
  | 'plague'
  | 'phoenix'
  | 'stalker'
  | 'chrono'
  | 'werewolf'
  | 'trailrunner'
  | 'banshee'
  | 'possessed_armor'
  | 'skeleton';

export type PlayerPose = 'idle' | 'run_0' | 'run_1' | 'jump' | 'wall' | 'flip' | 'grapple';

export interface SkinDef {
  id: SkinId;
  name: string;
  cost: number;
  description: string;
  trailColor: string;
  secret?: boolean;
  secretMethod?: string;
  raceReward?: boolean;
}

export const SECRET_SKIN_UNLOCK_METHOD =
  'Ascend to 100m altitude and land a Backflip in the same run!';

export const SECRET_CHRONO_UNLOCK_METHOD =
  'Clear 3 Horizontal Wings and reach 150m altitude in a single run!';

export const SKINS: SkinDef[] = [
  {
    id: 'strider',
    name: 'Strider',
    cost: 0,
    description: 'Agile spire climber with crimson scarf and cobalt tunic.',
    trailColor: '#fb7185',
  },
  {
    id: 'cyclops',
    name: 'Cyclops',
    cost: 10,
    description: 'One-eyed bronze brute with a glowing amber gaze.',
    trailColor: '#fbbf24',
  },
  {
    id: 'ninja',
    name: 'Ninja',
    cost: 15,
    description: 'Shadow shinobi with crimson headband and swift indigo garb.',
    trailColor: '#6366f1',
  },
  {
    id: 'robot',
    name: 'Robot',
    cost: 20,
    description: 'Chassis climber with cyan CRT visor and steel plating.',
    trailColor: '#38bdf8',
  },
  {
    id: 'knight',
    name: 'Knight',
    cost: 25,
    description: 'Plumed silver vanguard clad in heavy spire plate armor.',
    trailColor: '#e2e8f0',
  },
  {
    id: 'gargoyle',
    name: 'Gargoyle',
    cost: 35,
    description: 'Winged granite sentinel awakened from the spire.',
    trailColor: '#94a3b8',
  },
  {
    id: 'ghost',
    name: 'Ghost',
    cost: 40,
    description: 'Spectral phantom shrouded in glowing cyan ectoplasm.',
    trailColor: '#67e8f9',
  },
  {
    id: 'vampire',
    name: 'Vampire',
    cost: 50,
    description: 'Midnight count in a high crimson-lined cape.',
    trailColor: '#ef4444',
  },
  {
    id: 'astronaut',
    name: 'Astronaut',
    cost: 60,
    description: 'Starfarer in a gold-visored EVA suit and thruster pack.',
    trailColor: '#f97316',
  },
  {
    id: 'demon',
    name: 'Demon',
    cost: 75,
    description: 'Horned abyssal warlord forged in molten spire fire.',
    trailColor: '#f43f5e',
  },
  {
    id: 'paladin',
    name: 'Paladin',
    cost: 90,
    description: 'Radiant solar crusader with gilded crest and azure cloak.',
    trailColor: '#fde047',
  },
  {
    id: 'samurai',
    name: 'Cyber-Samurai',
    cost: 110,
    description: 'Oni-masked kabuto ronin forged from carbon & neon steel.',
    trailColor: '#22d3ee',
  },
  {
    id: 'ascendant',
    name: 'Ascendant',
    cost: 0,
    description: 'Star-crowned spire legend cloaked in cosmic void light.',
    trailColor: '#c084fc',
    secret: true,
    secretMethod: SECRET_SKIN_UNLOCK_METHOD,
  },
  {
    id: 'plague',
    name: 'Plague Doctor',
    cost: 125,
    description: 'Beaked alchemist with emerald optics and a midnight trench coat.',
    trailColor: '#10b981',
  },
  {
    id: 'phoenix',
    name: 'Mecha-Phoenix',
    cost: 145,
    description: 'Solar-plumed flight frame forged in ember-gold titanium.',
    trailColor: '#f97316',
  },
  {
    id: 'stalker',
    name: 'Void Stalker',
    cost: 165,
    description: 'Abyssal shadow assassin with twin glowing magenta eyes.',
    trailColor: '#e879f9',
  },
  {
    id: 'chrono',
    name: 'Chrono-King',
    cost: 0,
    description: 'Gilded clockwork sovereign bending spire time with cyan lightning.',
    trailColor: '#38bdf8',
    secret: true,
    secretMethod: SECRET_CHRONO_UNLOCK_METHOD,
  },
  {
    id: 'werewolf',
    name: 'Werewolf',
    cost: 135,
    description: 'Lunar-cursed lycan climber with silver fangs and ember claws.',
    trailColor: '#a3a3a3',
  },
  {
    id: 'trailrunner',
    name: 'Trailrunner',
    cost: 0,
    description: 'Champion sprint suit awarded for 1st Place in the Mon–Fri Online Race.',
    trailColor: '#10b981',
    raceReward: true,
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    cost: 65,
    description: 'Rattling ivory-boned climber with dark ribcage armor and glowing sockets.',
    trailColor: '#e2e8f0',
  },
  {
    id: 'banshee',
    name: 'Banshee',
    cost: 85,
    description: 'Wailing spirit draped in silver-cyan wisps and spectral mist.',
    trailColor: '#22d3ee',
  },
  {
    id: 'possessed_armor',
    name: 'Possessed Armor',
    cost: 115,
    description: 'Cursed iron plate animated by blazing crimson-violet soul fire.',
    trailColor: '#f43f5e',
  },
];

export type ThemeId =
  | 'dynamic'
  | 'obsidian'
  | 'emerald'
  | 'crimson'
  | 'frost'
  | 'astral'
  | 'toxic'
  | 'suntemple'
  | 'neoncore';
export type BiomeThemeId = Exclude<ThemeId, 'dynamic'>;

export interface ThemeDef {
  id: ThemeId;
  name: string;
  cost: number;
  unlockAltitude: number;
  description: string;
  swatch: string;
  bgColor: string;
  parallaxColor: string;
  lineColor: string;
  labelColor: string;
  brickPalette?: {
    k: string;
    d: string;
    s: string;
    l: string;
    h: string;
  };
}

export const THEMES: ThemeDef[] = [
  {
    id: 'dynamic',
    name: 'Spire Shift (100m)',
    cost: 0,
    unlockAltitude: 0,
    description: 'Dungeon stone & atmosphere shift automatically every 100m climbed.',
    swatch: '#fbbf24',
    bgColor: '#0d111a',
    parallaxColor: '#131926',
    lineColor: '#1b2434',
    labelColor: '#475569',
  },
  {
    id: 'obsidian',
    name: 'Obsidian Depths',
    cost: 0,
    unlockAltitude: 0,
    description: 'Classic slate-black cavern masonry of the lower spire (0m).',
    swatch: '#475569',
    bgColor: '#0d111a',
    parallaxColor: '#131926',
    lineColor: '#1b2434',
    labelColor: '#475569',
    brickPalette: {
      k: '#0f131c',
      d: '#1e2636',
      s: '#334155',
      l: '#475569',
      h: '#64748b',
    },
  },
  {
    id: 'emerald',
    name: 'Mossy Crypt',
    cost: 15,
    unlockAltitude: 100,
    description: 'Overgrown jade stonework unlocked at 100m (or 15 Gems).',
    swatch: '#10b981',
    bgColor: '#091512',
    parallaxColor: '#0f221c',
    lineColor: '#17342a',
    labelColor: '#34d399',
    brickPalette: {
      k: '#08120e',
      d: '#122921',
      s: '#1f4436',
      l: '#2e664f',
      h: '#4ade80',
    },
  },
  {
    id: 'crimson',
    name: 'Crimson Forge',
    cost: 30,
    unlockAltitude: 200,
    description: 'Volcanic basalt & ember mortar unlocked at 200m (or 30 Gems).',
    swatch: '#ef4444',
    bgColor: '#170c0e',
    parallaxColor: '#251216',
    lineColor: '#381a1f',
    labelColor: '#f87171',
    brickPalette: {
      k: '#16090b',
      d: '#2c1317',
      s: '#4c1d24',
      l: '#7f1d1d',
      h: '#f97316',
    },
  },
  {
    id: 'frost',
    name: 'Frost Citadel',
    cost: 45,
    unlockAltitude: 300,
    description: 'Glacial sapphire & ice brick unlocked at 300m (or 45 Gems).',
    swatch: '#38bdf8',
    bgColor: '#09131e',
    parallaxColor: '#102033',
    lineColor: '#18314c',
    labelColor: '#7dd3fc',
    brickPalette: {
      k: '#081321',
      d: '#122742',
      s: '#1e426b',
      l: '#2b6cb0',
      h: '#7dd3fc',
    },
  },
  {
    id: 'astral',
    name: 'Astral Sanctum',
    cost: 60,
    unlockAltitude: 400,
    description: 'Royal void violet & gilded stone unlocked at 400m (or 60 Gems).',
    swatch: '#a855f7',
    bgColor: '#130c1f',
    parallaxColor: '#1e1331',
    lineColor: '#2e1d4a',
    labelColor: '#c084fc',
    brickPalette: {
      k: '#110a1c',
      d: '#231538',
      s: '#3b225c',
      l: '#5b348a',
      h: '#fbbf24',
    },
  },
  {
    id: 'toxic',
    name: 'Toxic Sewer',
    cost: 75,
    unlockAltitude: 500,
    description: 'Corroded ironworks & chartreuse acid mortar unlocked at 500m (or 75 Gems).',
    swatch: '#22c55e',
    bgColor: '#09140c',
    parallaxColor: '#102315',
    lineColor: '#1a3822',
    labelColor: '#4ade80',
    brickPalette: {
      k: '#071209',
      d: '#132617',
      s: '#1f3f26',
      l: '#2f5e38',
      h: '#84cc16',
    },
  },
  {
    id: 'suntemple',
    name: 'Sun Temple',
    cost: 90,
    unlockAltitude: 600,
    description: 'Ancient sandstone & burnished gold ruins unlocked at 600m (or 90 Gems).',
    swatch: '#f59e0b',
    bgColor: '#191209',
    parallaxColor: '#291d0e',
    lineColor: '#3d2b15',
    labelColor: '#fbbf24',
    brickPalette: {
      k: '#1a1106',
      d: '#38240c',
      s: '#5c3c16',
      l: '#85581f',
      h: '#fde047',
    },
  },
  {
    id: 'neoncore',
    name: 'Clockwork Core',
    cost: 110,
    unlockAltitude: 700,
    description: 'Electric cobalt plating & cyan conduits unlocked at 700m (or 110 Gems).',
    swatch: '#06b6d4',
    bgColor: '#07111c',
    parallaxColor: '#0d1e30',
    lineColor: '#14304d',
    labelColor: '#22d3ee',
    brickPalette: {
      k: '#050e17',
      d: '#0e2238',
      s: '#183a5e',
      l: '#255587',
      h: '#22d3ee',
    },
  },
];

export const BIOME_ORDER: BiomeThemeId[] = [
  'obsidian',
  'emerald',
  'crimson',
  'frost',
  'astral',
  'toxic',
  'suntemple',
  'neoncore',
];

export interface SolidTile {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'wall' | 'ledge' | 'pillar';
}

export interface CrumblePlatform {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  state: 'idle' | 'shaking' | 'broken';
  timer: number;
  respawnTimer: number;
}

export interface Spike {
  id: number;
  x: number;
  y: number;
  dir: SpikeDir;
}

export interface Sawblade {
  id: number;
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  moveX: number;
  moveY: number;
  speed: number;
  phase: number;
  radius: number;
}

export interface Laser {
  id: number;
  orientation: 'horizontal' | 'vertical';
  x: number;
  y: number;
  xStart: number;
  xEnd: number;
  yStart: number;
  yEnd: number;
  cycleDuration: number;
  offset: number;
  state: 'idle' | 'warning' | 'firing';
  stateProgress: number;
}

export interface Firebar {
  id: number;
  pivotX: number;
  pivotY: number;
  length: number;
  spacing: number;
  angle: number;
  angularSpeed: number;
}

export interface DartTurret {
  id: number;
  x: number;
  y: number;
  dir: CardinalDir;
  interval: number;
  timer: number;
  dartSpeed: number;
}

export interface Dart {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  dir: CardinalDir;
  life: number;
}

export interface Bat {
  id: number;
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: 'perched' | 'telegraph' | 'diving' | 'returning' | 'cooldown';
  timer: number;
  cooldown: number;
  spotted: boolean;
}

export interface Crusher {
  id: number;
  x: number;
  homeY: number;
  y: number;
  w: number;
  h: number;
  dropDist: number;
  state: 'idle' | 'telegraph' | 'dropping' | 'paused' | 'rising';
  timer: number;
  dropSpeed: number;
}

export interface FlameJet {
  id: number;
  x: number;
  y: number;
  dir: CardinalDir;
  reach: number;
  cycleDuration: number;
  offset: number;
  state: 'idle' | 'warning' | 'firing';
}

export interface ShockCoil {
  id: number;
  ax: number;
  ay: number;
  bx: number;
  by: number;
  cycleDuration: number;
  offset: number;
  state: 'idle' | 'warning' | 'firing';
}

export interface AcidDrip {
  id: number;
  x: number;
  y: number;
  interval: number;
  timer: number;
}

export interface AcidDrop {
  id: number;
  x: number;
  y: number;
  vy: number;
  life: number;
}

export interface Pendulum {
  id: number;
  pivotX: number;
  pivotY: number;
  length: number;
  maxAngle: number;
  speed: number;
  phase: number;
  angle: number;
  bobX: number;
  bobY: number;
  radius: number;
}

export interface BouncePad {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  power: number;
  compressTimer: number;
}

export interface MovingPlatform {
  id: number;
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  w: number;
  h: number;
  moveX: number;
  moveY: number;
  speed: number;
  phase: number;
}

export interface GrappleRing {
  id: number;
  x: number;
  y: number;
}

export interface Gem {
  id: number;
  x: number;
  y: number;
  collected: boolean;
  bobOffset: number;
}

export interface DirectionSign {
  id: number;
  x: number;
  y: number;
  dir: 'left' | 'right' | 'up';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Afterimage {
  x: number;
  y: number;
  angle: number;
  facing: 1 | -1;
  life: number;
  maxLife: number;
  color: string;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface Player {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  onGround: boolean;
  onWall: -1 | 0 | 1;
  ridingPlatformId: number | null;
  coyoteTimer: number;
  wallCoyoteTimer: number;
  lastWallDir: -1 | 0 | 1;
  jumpBufferTimer: number;
  jumpHeld: boolean;
  holdJumpTimer: number;
  canDoubleJump: boolean;
  canBackflip: boolean;
  isBackflipping: boolean;
  backflipTimer: number;
  backflipAngle: number;
  grappleTarget: GrappleRing | null;
  grappleTimer: number;
  grappleCooldown: number;
  animTimer: number;
  invulnTimer: number;
  dead: boolean;
}

export interface HudSnapshot {
  gameState: GameState;
  gameMode: GameMode;
  score: number;
  bestScore: number;
  altitudeMeters: number;
  bestAltitudeMeters: number;
  wingsCleared: number;
  gemsCollected: number;
  totalGems: number;
  revivedThisRun: boolean;
  canRevive: boolean;
  selectedSkin: SkinId;
  unlockedSkins: SkinId[];
  selectedTheme: ThemeId;
  unlockedThemes: ThemeId[];
  activeBiomeName: string;
  secretUnlocked: boolean;
  comboCount: number;
  deathReason: string;
  canDoubleJump: boolean;
  canBackflip: boolean;
  grappleReady: boolean;
  wallContact: boolean;
  risingHazardDistance: number;
}
