export const TILE = 16;
export const SHAFT_COLS = 16;
export const VIRTUAL_W = TILE * SHAFT_COLS; // 256px
export const VIRTUAL_H = 384; // 24 tiles tall

export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type CardinalDir = 'up' | 'down' | 'left' | 'right';
export type SpikeDir = CardinalDir;

export type SkinId =
  | 'strider'
  | 'cyclops'
  | 'robot'
  | 'gargoyle'
  | 'vampire'
  | 'ninja'
  | 'knight'
  | 'ghost'
  | 'astronaut'
  | 'demon';
export type PlayerPose = 'idle' | 'run_0' | 'run_1' | 'jump' | 'wall' | 'flip' | 'grapple';

export interface SkinDef {
  id: SkinId;
  name: string;
  cost: number;
  description: string;
  trailColor: string;
}

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
  homeX: number; // center x
  homeY: number; // center y
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: 'perched' | 'telegraph' | 'diving' | 'returning' | 'cooldown';
  timer: number;
  cooldown: number; // 15s between dives while player remains in 4x4 radius
  spotted: boolean;
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
  score: number;
  bestScore: number;
  altitudeMeters: number;
  bestAltitudeMeters: number;
  wingsCleared: number;
  gemsCollected: number;
  totalGems: number;
  selectedSkin: SkinId;
  unlockedSkins: SkinId[];
  comboCount: number;
  deathReason: string;
  canDoubleJump: boolean;
  canBackflip: boolean;
  grappleReady: boolean;
  wallContact: boolean;
  risingHazardDistance: number;
}
