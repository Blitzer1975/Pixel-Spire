import { PlayerPose, SkinId, TILE } from './types';

export type SpriteName =
  | 'wall_brick'
  | 'ledge_brick'
  | 'pillar_brick'
  | 'crumble_0'
  | 'crumble_1'
  | 'crumble_2'
  | 'spike_up'
  | 'spike_down'
  | 'spike_left'
  | 'spike_right'
  | 'saw_0'
  | 'saw_1'
  | 'laser_idle'
  | 'laser_warn'
  | 'laser_fire'
  | 'fire_pivot'
  | 'fireball_0'
  | 'fireball_1'
  | 'turret_right'
  | 'turret_down'
  | 'turret_left'
  | 'turret_up'
  | 'turret_warn_right'
  | 'turret_warn_down'
  | 'turret_warn_left'
  | 'turret_warn_up'
  | 'dart_right'
  | 'dart_down'
  | 'dart_left'
  | 'dart_up'
  | 'bat_perch'
  | 'bat_fly_0'
  | 'bat_fly_1'
  | 'bat_dive'
  | 'bounce_idle'
  | 'bounce_active'
  | 'moving_plat'
  | 'sign_right'
  | 'sign_left'
  | 'sign_up'
  | 'grapple_ring'
  | 'grapple_ring_active'
  | 'gem_0'
  | 'gem_1'
  | 'player_idle'
  | 'player_run_0'
  | 'player_run_1'
  | 'player_jump'
  | 'player_wall'
  | 'player_flip'
  | 'player_grapple';

const PALETTE: Record<string, string> = {
  '.': 'transparent',
  'k': '#0f131c',
  'd': '#1e2636',
  's': '#334155',
  'l': '#475569',
  'h': '#64748b',
  'c': '#451a03',
  'u': '#78350f',
  'o': '#b45309',
  'y': '#d97706',
  'm': '#94a3b8',
  'w': '#e2e8f0',
  'r': '#ef4444',
  'R': '#991b1b',
  'p': '#fca5a5',
  'f': '#f97316',
  'F': '#fbbf24',
  'W': '#fef3c7',
  'g': '#0284c7',
  'G': '#38bdf8',
  'C': '#bae6fd',
  'a': '#f59e0b',
  'A': '#fde68a',
  'b': '#1d4ed8',
  'B': '#3b82f6',
  'S': '#fed7aa',
  'v': '#0f172a',
  't': '#f43f5e',
  'T': '#fb7185',
  'P': '#581c87', // bat wing purple dark
  'V': '#7e22ce', // bat wing purple mid
  'e': '#65a30d', // cyclops olive
  'E': '#84cc16', // cyclops highlight
};

function makeCanvas(rows: string[], customPalette?: Record<string, string>): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = TILE;
  c.height = TILE;
  const ctx = c.getContext('2d')!;
  const pal = customPalette ? { ...PALETTE, ...customPalette } : PALETTE;
  for (let y = 0; y < TILE; y++) {
    const row = rows[y] || '';
    for (let x = 0; x < TILE; x++) {
      const ch = row[x] || '.';
      const color = pal[ch];
      if (color && color !== 'transparent') {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  return c;
}

function rotateRows90(rows: string[]): string[] {
  const out: string[] = [];
  for (let x = 0; x < TILE; x++) {
    let row = '';
    for (let y = TILE - 1; y >= 0; y--) {
      row += rows[y][x] || '.';
    }
    out.push(row);
  }
  return out;
}

function rotateRows180(rows: string[]): string[] {
  return rows
    .slice()
    .reverse()
    .map((r) => r.split('').reverse().join(''));
}

function rotateRows270(rows: string[]): string[] {
  return rotateRows90(rotateRows180(rows));
}

const WALL_BRICK = [
  'kkkkkkkkkkkkkkkk',
  'kllssslklllssslk',
  'klsssssklsssssdk',
  'kssdddskssdddddk',
  'kdddddkkdddddddk',
  'kkkkkkkkkkkkkkkk',
  'ksssklllssskllsk',
  'ksssklsssssklsdk',
  'kdddkssdddskdddk',
  'kdddkddddddkdddk',
  'kkkkkkkkkkkkkkkk',
  'kllssslklllssslk',
  'klsssssklsssssdk',
  'kssdddskssdddddk',
  'kdddddkkdddddddk',
  'kkkkkkkkkkkkkkkk',
];

const LEDGE_BRICK = [
  'kkkkkkkkkkkkkkkk',
  'khhhhllhhllhhhhk',
  'kllssllssllssllk',
  'kssddssddssddssk',
  'kkkkkkkkkkkkkkkk',
  'kdskdsddskdsddsk',
  'kddkdddddkdddddk',
  'kddkdddddkdddddk',
  'kdddddkddddkdddk',
  'kdddddkddddkdddk',
  'kkkkkkkkkkkkkkkk',
  'kddddddddddddddk',
  'kdkdddkdddkddkdk',
  'kddddddddddddddk',
  'kkkkkkkkkkkkkkkk',
  '................',
];

const PILLAR_BRICK = [
  'kkkkkkkkkkkkkkkk',
  'kllssskkkllssslk',
  'klsssdkkklssssdk',
  'kssdddkkkssddddk',
  'kkkkkkkkkkkkkkkk',
  'kssskllssskllssk',
  'ksssklssssklsddk',
  'kdddkssdddkddddk',
  'kkkkkkkkkkkkkkkk',
  'kllssskkkllssslk',
  'klsssdkkklssssdk',
  'kssdddkkkssddddk',
  'kkkkkkkkkkkkkkkk',
  'kssskllssskllssk',
  'kdddkssdddkddddk',
  'kkkkkkkkkkkkkkkk',
];

const CRUMBLE_0 = [
  'kkkkkkkkkkkkkkkk',
  'kyyoooyyoooyyook',
  'koyuuuoouuuoouuk',
  'kouuuuuuuuuuuuuk',
  'kuuccccuuuccccuk',
  'kkkkkkkkkkkkkkkk',
  'kuuyouuuckuuoyuk',
  'kuuukccuckcckuuk',
  'kccckuuuukcccuuk',
  'kcccuuuuuukccuck',
  'kkkkkkkkkkkkkkkk',
  'kouuuckouuuckouk',
  'kcccckcccccckcck',
  'kkkkkkkkkkkkkkkk',
  '................',
  '................',
];

const CRUMBLE_1 = [
  'kkkkkkkkkkkkkkkk',
  'kyyokoyyo.oyyook',
  'koyukukou.uoouuk',
  'kouukuuuk.kuuuuk',
  'kuuckccuk.kcccuk',
  'kkk.kkkk..kkkkkk',
  'kuu.ouuck.uuoyuk',
  'kuu.kccuk.cckuuk',
  'kcc.kuuu..cccuuk',
  'kcc.uuuu..kccuck',
  'kkk.kkkk..kkkkkk',
  'kou.ucko..uckouk',
  'kcc.ckcc..cckcck',
  'kkk.kkkk..kkkkkk',
  '................',
  '................',
];

const CRUMBLE_2 = [
  '.kkkkk....kkkkk.',
  'kyyo.ok..koyyo.k',
  'koyu..k..kouu..k',
  'kouu.....kuuk...',
  '.kcc..k..kcc..k.',
  '......k..kk.....',
  '.kuy..k...uoy.k.',
  '.kuu......cck.k.',
  '..cc..k...ccc...',
  '..cc..u...kcc.k.',
  '......k...kkk...',
  '.kou..k....cko..',
  '..cc..k....ckc..',
  '......k....kkk..',
  '................',
  '................',
];

const SPIKE_UP = [
  '................',
  '................',
  '................',
  '................',
  '...r........r...',
  '..prk......prk..',
  '..wrk......wrk..',
  '.pwmk.....pwmk..',
  '.mwmk....pmwmk..',
  '.mmdk....mmmdk..',
  'pmmdmk..pmmdmmk.',
  'wmddmk..wmdddmk.',
  'mmdddkk.mmddddkk',
  'mdddddkkmddddddk',
  'kkkkkkkkkkkkkkkk',
  'kkkkkkkkkkkkkkkk',
];

const SAW_0 = [
  '......krrk......',
  '.....kpwwrk.....',
  '..kk.kmmmmk.kk..',
  '.kprkksssskkrpk.',
  '.kpwmssllssmwmk.',
  '..kpsllkkllsrk..',
  'kkmslkrrrrklsrkk',
  'rpwmkrWWWWkrmwpr',
  'rksmkrWWWWkrmskr',
  'kkrslkrrrrklsmkk',
  '..krslkkkkllspk.',
  '.kmwmssllssmwmk.',
  '.kprkksssskkrpk.',
  '..kk.kmmmmk.kk..',
  '.....krwwpk.....',
  '......krrk......',
];

const SAW_1 = [
  '....kk....kk....',
  '...kprk..krpk...',
  '...kpwmkkmmrk...',
  '.kkkssllllsskkk.',
  'kprmsllkkllsmrpk',
  'kpwmslkrrklsmwmk',
  '.ksslkWWWWklssk.',
  '..klkrWWWWkrsk..',
  '..kskrWWWWkrlk..',
  '.ksslkWWWWklssk.',
  'kmwmslkrpklsmwmk',
  'kprmsllkkllsmrpk',
  '.kkkssllllsskkk.',
  '...krmmkkwmpk...',
  '...kpRk..krpk...',
  '....kk....kk....',
];

const LASER_IDLE = [
  'kkkkkkkkkkkkkkkk',
  'khhhhhhllhhhhhhk',
  'kllssssssssssllk',
  'kssddddddddddssk',
  'ksddkkkkkkkkddsk',
  'ksdkddddddddkdsk',
  'ksdkddssssddkdsk',
  'ksdkdsGGGGsdkdsk',
  'ksdkdsGGGGsdkdsk',
  'ksdkddssssddkdsk',
  'ksdkddddddddkdsk',
  'ksddkkkkkkkkddsk',
  'kssddddddddddssk',
  'kddddddddddddddk',
  'khhhhhhhhhhhhhhk',
  'kkkkkkkkkkkkkkkk',
];

const LASER_WARN = [
  'kkkkkkkkkkkkkkkk',
  'khhhhhhllhhhhhhk',
  'kllssssssssssllk',
  'kssddddddddddssk',
  'ksddkkkkkkkkddsk',
  'ksdkddddddddkdsk',
  'ksdkddfFFfddkdsk',
  'ksdkdfWWWWfdkdsk',
  'ksdkdfWWWWfdkdsk',
  'ksdkddfFFfddkdsk',
  'ksdkddddddddkdsk',
  'ksddkkkkkkkkddsk',
  'kssddddddddddssk',
  'kddddddddddddddk',
  'khhhhhhhhhhhhhhk',
  'kkkkkkkkkkkkkkkk',
];

const LASER_FIRE = [
  'kkkkkkkkkkkkkkkk',
  'khhhhhhllhhhhhhk',
  'kllssssssssssllk',
  'kssddddddddddssk',
  'ksddkkkkkkkkddsk',
  'ksdkrrrrrrrrkdsk',
  'ksdkrfFFFFfrkdsk',
  'ksdkrFWWWWFrkdsk',
  'ksdkrFWWWWFrkdsk',
  'ksdkrfFFFFfrkdsk',
  'ksdkrrrrrrrrkdsk',
  'ksddkkkkkkkkddsk',
  'kssddddddddddssk',
  'kddddddddddddddk',
  'khhhhhhhhhhhhhhk',
  'kkkkkkkkkkkkkkkk',
];

const FIRE_PIVOT = [
  '....kkkkkkkk....',
  '..kkllllllllkk..',
  '.klsssssssssslk.',
  '.klsddddddddslk.',
  'klsddkkkkkkddslk',
  'klsdkrrrrrrkdslk',
  'klsdkrfFFfrkdslk',
  'klsdkrFWWFrkdslk',
  'klsdkrFWWFrkdslk',
  'klsdkrfFFfrkdslk',
  'klsdkrrrrrrkdslk',
  'klsddkkkkkkddslk',
  '.klsddddddddslk.',
  '.klsssssssssslk.',
  '..kkddddddddkk..',
  '....kkkkkkkk....',
];

const FIREBALL_0 = [
  '....kkkkkkkk....',
  '..kkrrrrrrrrkk..',
  '.krrffffffffrrk.',
  '.krffFFFFFFffrk.',
  'krfFFWWWWWWFFfrk',
  'krfFWWWWWWWWFfrk',
  'krfFWWWWWWWWFfrk',
  'krfFWWWWWWWWFfrk',
  'krfFWWWWWWWWFfrk',
  'krfFFWWWWWWFFfrk',
  '.krffFFFFFFffrk.',
  '.krrffffffffrrk.',
  '..kkrrrrrrrrkk..',
  '....kkkkkkkk....',
  '................',
  '................',
];

const FIREBALL_1 = [
  '...kk......kk...',
  '..krrkkkkkkrrk..',
  '.krffffffffffrk.',
  '.krfFFFFFFFFfrk.',
  'krfFFWWWWWWFFfrk',
  'krfFWWWWWWWWFfrk',
  'krfFWWWWWWWWFfrk',
  'krfFWWWWWWWWFfrk',
  'krfFFWWWWWWFFfrk',
  'krffFFFFFFFFffrk',
  '.krffffffffffrk.',
  '.kkrrrrrrrrrrkk.',
  '..krrkkkkkkrrk..',
  '...kk......kk...',
  '................',
  '................',
];

const TURRET_RIGHT = [
  'kkkkkkkkkkkkkkkk',
  'khhhhllhhhhllhhk',
  'kllssssssssssllk',
  'kssddddddddddssk',
  'ksddkkkkkkkkkssk',
  'ksdkmmmmmmmmkkkk',
  'ksdkmwwwwwwmmmkk',
  'ksdkmddrrdddddok',
  'ksdkmddrrdddddok',
  'ksdkmssssssmmmkk',
  'ksdkddddddddkkkk',
  'ksddkkkkkkkkkssk',
  'kssddddddddddssk',
  'kddddddddddddddk',
  'khhhhhhhhhhhhhhk',
  'kkkkkkkkkkkkkkkk',
];

const TURRET_WARN_RIGHT = [
  'kkkkkkkkkkkkkkkk',
  'khhhhllhhhhllhhk',
  'kllssssssssssllk',
  'kssddddddddddssk',
  'ksddkkkkkkkkkssk',
  'ksdkmmmmmmmmkkkk',
  'ksdkmwwwwwwmmmkk',
  'ksdkmddFFddFFWWk',
  'ksdkmddFFddFFWWk',
  'ksdkmssssssmmmkk',
  'ksdkddddddddkkkk',
  'ksddkkkkkkkkkssk',
  'kssddddddddddssk',
  'kddddddddddddddk',
  'khhhhhhhhhhhhhhk',
  'kkkkkkkkkkkkkkkk',
];

const DART_RIGHT = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '..kk.......kk...',
  '.krrk.....kmmk..',
  'krrwmmmmmmmwwpk.',
  'krrwmmmmmmmwwpk.',
  '.krrk.....kmmk..',
  '..kk.......kk...',
  '................',
  '................',
  '................',
  '................',
  '................',
];

// Cave Bat 16x16 sprites
const BAT_PERCH = [
  '................',
  '......k..k......',
  '.....kPkkPk.....',
  '.....kPPPPk.....',
  '....kPPVVPPk....',
  '....kPVPPVPk....',
  '...kPPVkPVPPk...',
  '...kPPVFFVPPk...',
  '...kPPVVVVPPk...',
  '....kPVWWVPk....',
  '....kPPPPPPk....',
  '.....kPkkPk.....',
  '.....k....k.....',
  '................',
  '................',
  '................',
];

const BAT_FLY_0 = [
  '................',
  '.kk..........kk.',
  'kPPkk..kk..kkPPk',
  'kPVPPkkPPkkPPVpk',
  'kPPVVPPPPPPVVPPk',
  '.kPPVVVFFVVVPPk.',
  '.kPPPVVWWVVPPPk.',
  '..kkPPVVVVPPkk..',
  '....kkPPPPkk....',
  '......kPPk......',
  '.....kW..Wk.....',
  '................',
  '................',
  '................',
  '................',
  '................',
];

const BAT_FLY_1 = [
  '................',
  '................',
  '......k..k......',
  '.....kPkkPk.....',
  '....kPPVVPPk....',
  '...kPPVFFVPPk...',
  '..kPPVVWWVVPPk..',
  '.kPPkPPVVPPkPPk.',
  'kPPk.kPPPPk.kPPk',
  'kPk..kW..Wk..kPk',
  'kk............kk',
  '................',
  '................',
  '................',
  '................',
  '................',
];

const BAT_DIVE = [
  '................',
  '.kk..........kk.',
  'kRRkk.k..k.kkRRk',
  'kRrRPkPPPPkPRrRk',
  'kPPVVPPVVPPVVPPk',
  '.kPPVrWWWWrvPPk.',
  '.kPPPrWWWWrPPPk.',
  '..kkPPVVVVPPkk..',
  '....kkPPPPkk....',
  '.....kW..Wk.....',
  '......k..k......',
  '................',
  '................',
  '................',
  '................',
  '................',
];

// Bounce Pad 16x16 sprites (emerald/lime spring pad on iron base)
const BOUNCE_IDLE = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '..kkkkkkkkkkkk..',
  '.kEEEEEEEEEEEEk.',
  '.kEEWWWWWWWWEEk.',
  '.keeeeeeeeeeeek.',
  '..kkkkkkkkkkkk..',
  '...kmmk..kmmk...',
  '....kmmkkmmk....',
  '...kmmk..kmmk...',
  '..kkkkkkkkkkkk..',
  '.kllssssssssllk.',
  'kkkkkkkkkkkkkkkk',
];

const BOUNCE_ACTIVE = [
  '..kkkkkkkkkkkk..',
  '.kEWWWWWWWWWWEk.',
  '.kEEEEEEEEEEEEk.',
  '.keeeeeeeeeeeek.',
  '..kkkkkkkkkkkk..',
  '....kmmkkmmk....',
  '...kmmk..kmmk...',
  '....kmmkkmmk....',
  '...kmmk..kmmk...',
  '....kmmkkmmk....',
  '...kmmk..kmmk...',
  '....kmmkkmmk....',
  '...kmmk..kmmk...',
  '..kkkkkkkkkkkk..',
  '.kllssssssssllk.',
  'kkkkkkkkkkkkkkkk',
];

// Moving Platform 16x16 tile (steel chassis with cyan hover-rail thrusters)
const MOVING_PLAT = [
  'kkkkkkkkkkkkkkkk',
  'kCCGGGGGGGGGGCCk',
  'kGGmmmmmmmmmmGGk',
  'kllllllllllllllk',
  'kkkkkkkkkkkkkkkk',
  'kssddGGddGGddssk',
  'ksdddCCddCCdddsk',
  'kddddGGddGGddddk',
  'kssddddddddddssk',
  'kkkkkkkkkkkkkkkk',
  '.ksssk....ksssk.',
  '..kGk......kGk..',
  '..kCk......kCk..',
  '................',
  '................',
  '................',
];

const SIGN_RIGHT = [
  '................',
  '..kkkkkkkkkkkk..',
  '.kddllllllllldk.',
  '.kdssssssssssdk.',
  '.kdsAAAkkssssdk.',
  '.kdsAAAAkksssdk.',
  '.kdsAAAAAAkksdk.',
  '.kdsAAAAAAAAAdk.',
  '.kdsAAAAAAAAAdk.',
  '.kdsAAAAAAkksdk.',
  '.kdsAAAAkksssdk.',
  '.kdsAAAkkssssdk.',
  '.kdssssssssssdk.',
  '.kddddddddddddk.',
  '..kkkkkkkkkkkk..',
  '................',
];

const GRAPPLE_RING = [
  '....kkkkkkkk....',
  '..kkAAAAAAAAkk..',
  '.kAAaaaaaaaaAAk.',
  '.kAakkkkkkkkaAk.',
  'kAak........kaAk',
  'kAak..kGGk..kaAk',
  'kAak.kGCCGk.kaAk',
  'kAak.kCWWCk.kaAk',
  'kAak.kCWWCk.kaAk',
  'kAak.kGCCGk.kaAk',
  'kAak..kGGk..kaAk',
  'kAak........kaAk',
  '.kAakkkkkkkkaAk.',
  '.kAAaaaaaaaaAAk.',
  '..kkAAAAAAAAkk..',
  '....kkkkkkkk....',
];

const GRAPPLE_RING_ACTIVE = [
  '..kkkkkkkkkkkk..',
  '.kCCGGGGGGGGCCk.',
  'kCGCCCCCCCCCCGCk',
  'kCGkkkkkkkkkkGCk',
  'kCk..........kCk',
  'kCk..kWWWWk..kCk',
  'kCk.kWCCCCWk.kCk',
  'kCk.kCCCCCCk.kCk',
  'kCk.kCCCCCCk.kCk',
  'kCk.kWCCCCWk.kCk',
  'kCk..kWWWWk..kCk',
  'kCk..........kCk',
  'kCGkkkkkkkkkkGCk',
  'kCGCCCCCCCCCCGCk',
  '.kCCGGGGGGGGCCk.',
  '..kkkkkkkkkkkk..',
];

const GEM_0 = [
  '.......kk.......',
  '......kCCk......',
  '.....kCWWCk.....',
  '....kCGWWGCk....',
  '...kCGGWWGGCk...',
  '..kCGGGWWGGGCk..',
  '.kCGGGGWWGGGGC..',
  '.kGGGGGggGGGGGCk',
  '.kGGGGggggGGGGk.',
  '..kGGGggggGGGk..',
  '...kGGggggGGk...',
  '....kGggggGk....',
  '.....kggggk.....',
  '......kggk......',
  '.......kk.......',
  '................',
];

const GEM_1 = [
  '................',
  '.......kk.......',
  '......kWWk......',
  '.....kCWWCk.....',
  '....kCGWWGCk....',
  '...kCGGWWGGCk...',
  '..kCGGGWWGGGCk..',
  '..kGGGGggGGGGk..',
  '..kGGGggggGGGk..',
  '...kGGggggGGk...',
  '....kGggggGk....',
  '.....kggggk.....',
  '......kggk......',
  '.......kk.......',
  '................',
  '................',
];

// Base Climber Poses (Strider)
const STRIDER_POSES: Record<PlayerPose, string[]> = {
  idle: [
    '....kkkkkkkk....',
    '...kttttttttk...',
    '..kTTttttttttk..',
    '..kttvvvvvvttk..',
    '..kvvSSSSSSvvk..',
    '..kvvSSvkSvSSk..',
    '..kvvSSvkSvSSk..',
    '...kkSSSSSSkk...',
    '...kkBBBBBBkk...',
    '..kSSBBBBBBSSk..',
    '..kSSbbAAbbSSk..',
    '...kkbbbbbbkk...',
    '....kddkkddk....',
    '....kddkkddk....',
    '...kmmk..kmmk...',
    '...kkkk..kkkk...',
  ],
  run_0: [
    '....kkkkkkkk....',
    '...kttttttttk...',
    '.kkTTttttttttk..',
    'ktttvvvvvvvttk..',
    '..kvvSSSSSSvvk..',
    '..kvvSSvkSvSSk..',
    '..kvvSSvkSvSSk..',
    '...kkSSSSSSkk...',
    '...kkBBBBBBkk...',
    '..kSSBBBBBBSSk..',
    '..kSSbbAAbbSSk..',
    '...kkbbbbbbkk...',
    '...kddk..kddk...',
    '..kddk....kddk..',
    '..kmmk....kmmk..',
    '..kkkk....kkkk..',
  ],
  run_1: [
    '....kkkkkkkk....',
    '...kttttttttk...',
    '.kkTTttttttttk..',
    'ktttvvvvvvvttk..',
    '..kvvSSSSSSvvk..',
    '..kvvSSvkSvSSk..',
    '..kvvSSvkSvSSk..',
    '...kkSSSSSSkk...',
    '...kkBBBBBBkk...',
    '...kkBBBBBBkk...',
    '...kSbbAAbbSk...',
    '...kkbbbbbbkk...',
    '....kddkkddk....',
    '....kddkkddk....',
    '....kmmkkmmk....',
    '....kkkkkkkk....',
  ],
  jump: [
    '...kkkkkkkkkk...',
    '..kTTttttttttk..',
    'ktttvvvvvvvttk..',
    '..kvvSSSSSSvvk..',
    '..kvvSSvkSvSSk..',
    '..kvvSSvkSvSSk..',
    '...kkSSSSSSkk...',
    '..kSSBBBBBBSSk..',
    '.kSSkBBBBBBkSSk.',
    '.kkk.bbAAbb.kkk.',
    '.....kbbbbk.....',
    '....kddkkddk....',
    '...kddk..kddk...',
    '...kmmk..kmmk...',
    '...kkkk..kkkk...',
    '................',
  ],
  wall: [
    '....kkkkkkkk....',
    '...kttttttttk...',
    '..kTTttttttttk..',
    '..kttvvvvvvttk..',
    '..kvvSSSSSSvvk..',
    '..kvvSSvkSvSSk..',
    '...kkSSSSSSkk...',
    '..kSSBBBBBBkk...',
    '..kSSBBBBBBSSk..',
    '...kkbbAAbbSSk..',
    '....kbbbbbbkk...',
    '...kddk.kddk....',
    '...kddk..kddk...',
    '...kmmk..kmmk...',
    '...kkkk..kkkk...',
    '................',
  ],
  flip: [
    '................',
    '....kkkkkkkk....',
    '...kTTttttttk...',
    '..kttvvvvvvttk..',
    '..kvvSSSSSSvvk..',
    '..kvvSSvSvSvvk..',
    '..kSSBBBBBBSSk..',
    '..kSSbbAAbbSSk..',
    '...kkbbbbbbkk...',
    '...kddk..kddk...',
    '...kmmk..kmmk...',
    '....kkkkkkkk....',
    '................',
    '................',
    '................',
    '................',
  ],
  grapple: [
    '....kkkkkkkk....',
    '...kttttttttk...',
    '..kTTttttttttk..',
    '..kttvvvvvvttk..',
    '..kvvSSSSSSvvk..',
    '..kvvSSvkSvSSk..',
    '...kkSSSSSSkk...',
    '..kSSBBBBBBSSk..',
    '..kkkBBBBBBkGGk.',
    '.....bbAAbbkCCk.',
    '....kbbbbbbkkk..',
    '...kddk..kddk...',
    '...kmmk..kmmk...',
    '...kkkk..kkkk...',
    '................',
    '................',
  ],
};

// Skin 2: Cyclops (horned brow, single glowing amber eye, olive/bronze armor)
const CYCLOPS_HEAD_IDLE = [
  '...k........k...',
  '..kAk.kkkk.kAk..',
  '..kykEEEEEEkyk..',
  '..kkEEEEEEEEkk..',
  '..kEEkWWWWkEEk..',
  '..kEEkWFFrkEEk..',
  '..kEEkWWWWkEEk..',
  '...kkEEEEEEkk...',
];

// Skin 3: Robot (antenna, square steel chassis, cyan CRT screen)
const ROBOT_HEAD_IDLE = [
  '.......kk.......',
  '......kGGk......',
  '..kkkkkkkkkkkk..',
  '..kmmmmmmmmmmk..',
  '..kmvvvvvvvvmk..',
  '..kmvGGGGGGvmk..',
  '..kmvGCWWCGvmk..',
  '..kmvvvvvvvvmk..',
];

// Skin 4: Gargoyle (carved horns, glowing ruby eyes, stone wings on torso)
const GARGOYLE_HEAD_IDLE = [
  '..kk........kk..',
  '.khlk.kkkk.klhk.',
  '..khlsssssslhk..',
  '..kssllllllssk..',
  '..klsrrssrrslk..',
  '..klsppssppslk..',
  '..kssssssssssk..',
  '...kksssssskk...',
];

// Skin 5: Vampire (swept dark hair, pale face, crimson eyes, fangs, high collar)
const VAMPIRE_HEAD_IDLE = [
  '...kkkkkkkkkk...',
  '..kvvvvvvvvvvk..',
  '..kvvwwwwwwvvk..',
  '..kvwrrrrrrwvk..',
  '..kvwwwwwwwwvk..',
  '..kRwwWwwWwwRk..',
  '..kRRwwwwwwRRk..',
  '..kRRkkkkkkRRk..',
];

// Skin 6: Ninja (dark shinobi hood, trailing crimson headband, sharp eyes)
const NINJA_HEAD_IDLE = [
  '....kkkkkkkk....',
  '...kvvvvvvvvk...',
  'kkkttttttttttk..',
  'kTTkvvvvvvvvk...',
  '...kvSSSSSSvk...',
  '...kvSWvkWSvk...',
  '...kvvvvvvvvk...',
  '....kkkkkkkk....',
];

// Skin 7: Knight (plumed silver greathelm with glowing gold visor eyes)
const KNIGHT_HEAD_IDLE = [
  '.....krrrrk.....',
  '....kRRrrRRk....',
  '...kmmmmmmmmk...',
  '..kmwwwwwwwwmk..',
  '..kmvvvvvvvvmk..',
  '..kmvFFvvFFvmk..',
  '..kmmmssssmmmk..',
  '...kkmmmmmmkk...',
];

// Skin 8: Ghost (spectral cyan hood with dark hollow eyes)
const GHOST_HEAD_IDLE = [
  '....kkkkkkkk....',
  '...kCCCCCCCCk...',
  '..kCCGGGGGGCCk..',
  '..kCGWWWWWWGCk..',
  '..kCGvvGGvvGCk..',
  '..kCGvvGGvvGCk..',
  '..kCCGGGGGGCCk..',
  '..kCGGCCCCGGCk..',
];

// Skin 9: Astronaut (white EVA helmet with gold-tinted reflective visor)
const ASTRONAUT_HEAD_IDLE = [
  '...kkkkkkkkkk...',
  '..kwwwwwwwwwwk..',
  '.kwmmFFFFFFmmwk.',
  '.kwmFFWWWWFFmwk.',
  '.kwmFFFFFFFFmwk.',
  '.kwmmaaaaaaamwk.',
  '..kwwwwwwwwwwk..',
  '...kkmmmmmmkk...',
];

// Skin 10: Demon (curved gold-ivory horns, crimson skull, ember eyes)
const DEMON_HEAD_IDLE = [
  '..kk........kk..',
  '.kAAk.kkkk.kAAk.',
  '.kFFkkRRRRkkFFk.',
  '..kRRRRrrRRRRk..',
  '..kRrWWrrWWrRk..',
  '..kRrFFrrFFrRk..',
  '..kRRvvvvvvRRk..',
  '...kkRRRRRRkk...',
];

const SKIN_HEADS: Record<Exclude<SkinId, 'strider'>, string[]> = {
  cyclops: CYCLOPS_HEAD_IDLE,
  robot: ROBOT_HEAD_IDLE,
  gargoyle: GARGOYLE_HEAD_IDLE,
  vampire: VAMPIRE_HEAD_IDLE,
  ninja: NINJA_HEAD_IDLE,
  knight: KNIGHT_HEAD_IDLE,
  ghost: GHOST_HEAD_IDLE,
  astronaut: ASTRONAUT_HEAD_IDLE,
  demon: DEMON_HEAD_IDLE,
};

function buildSkinRows(skin: SkinId, pose: PlayerPose): string[] {
  const base = STRIDER_POSES[pose].slice();
  if (skin === 'strider') return base;

  const head = SKIN_HEADS[skin];

  if (pose === 'flip') {
    const flipped = base.slice();
    for (let i = 1; i <= 5; i++) {
      flipped[i] = head[i + 1] || flipped[i];
    }
    return flipped;
  }

  for (let i = 0; i < 8; i++) {
    base[i] = head[i];
  }

  // Distinct torso silhouettes & accents per skin
  if (skin === 'gargoyle') {
    base[8] = '.kkssllllllsskk.';
    base[9] = 'kllkssllllsskllk';
    base[10] = 'ksk.kssddssk.ksk';
  } else if (skin === 'vampire') {
    base[8] = '..kRRddddddRRk..';
    base[9] = '.kRddrrrrrrddRk.';
    base[10] = '.kddrrrrrrrrddk.';
  } else if (skin === 'robot') {
    base[8] = '..kkmmmmmmmmkk..';
    base[9] = '..kmmsGGGGsmmk..';
    base[10] = '..kmmsGAAAsmmk..';
  } else if (skin === 'cyclops') {
    base[8] = '..kkouuuuuuokk..';
    base[9] = '.kEEouuyyuuoEEk.';
    base[10] = '.kEEouuuuuuoEEk.';
  } else if (skin === 'ninja') {
    base[8] = '..kkvvvvvvvvkk..';
    base[9] = '..kdvvttttvvdk..';
    base[10] = '..kdvAAttAAvdk..';
  } else if (skin === 'knight') {
    base[8] = '.kmmwwwwwwwwmmk.';
    base[9] = '.kmwmmFFFFmmwmk.';
    base[10] = '..kmmmmFFmmmmk..';
  } else if (skin === 'ghost') {
    base[8] = '.kCCGGGGGGGGCCk.';
    base[9] = 'kCGgGGGGGGGGgGCk';
    base[10] = 'kCk.kCCGGCCk.kCk';
  } else if (skin === 'astronaut') {
    base[8] = '.kffwwwwwwwwffk.';
    base[9] = '.kffwmmGGmmwffk.';
    base[10] = '..kkwwffffwwkk..';
  } else if (skin === 'demon') {
    base[8] = '.kRRvvvvvvvvRRk.';
    base[9] = 'kRkRvvfFFfvvRkRk';
    base[10] = '..kRvvrrrrvvRk..';
  }

  return base;
}

const SKIN_PALETTE_OVERRIDES: Record<SkinId, Record<string, string>> = {
  strider: {},
  cyclops: { b: '#78350f', B: '#b45309', S: '#84cc16', m: '#78350f', d: '#451a03' },
  robot: { b: '#475569', B: '#64748b', S: '#94a3b8', d: '#334155', m: '#38bdf8' },
  gargoyle: { b: '#334155', B: '#475569', S: '#64748b', d: '#1e293b', m: '#94a3b8' },
  vampire: { b: '#1e293b', B: '#334155', S: '#e2e8f0', d: '#0f172a', m: '#ef4444' },
  ninja: { b: '#1e1b4b', B: '#312e81', d: '#1e1b4b', m: '#f43f5e' },
  knight: { b: '#64748b', B: '#94a3b8', S: '#e2e8f0', d: '#475569', m: '#e2e8f0' },
  ghost: { b: '#0284c7', B: '#38bdf8', S: '#bae6fd', d: '#0369a1', m: '#67e8f9' },
  astronaut: { b: '#cbd5e1', B: '#e2e8f0', S: '#f8fafc', d: '#475569', m: '#f97316' },
  demon: { b: '#7f1d1d', B: '#991b1b', S: '#fca5a5', d: '#450a0a', m: '#fbbf24' },
};

let atlasCache: Record<SpriteName, HTMLCanvasElement> | null = null;
const skinAtlasCache: Partial<Record<SkinId, Record<PlayerPose, HTMLCanvasElement>>> = {};

export function getSkinSprite(skin: SkinId, pose: PlayerPose): HTMLCanvasElement {
  if (!skinAtlasCache[skin]) {
    const poses: PlayerPose[] = ['idle', 'run_0', 'run_1', 'jump', 'wall', 'flip', 'grapple'];
    const map = {} as Record<PlayerPose, HTMLCanvasElement>;
    for (const p of poses) {
      map[p] = makeCanvas(buildSkinRows(skin, p), SKIN_PALETTE_OVERRIDES[skin]);
    }
    skinAtlasCache[skin] = map;
  }
  return skinAtlasCache[skin]![pose];
}

export function getSpriteAtlas(): Record<SpriteName, HTMLCanvasElement> {
  if (atlasCache) return atlasCache;
  atlasCache = {
    wall_brick: makeCanvas(WALL_BRICK),
    ledge_brick: makeCanvas(LEDGE_BRICK),
    pillar_brick: makeCanvas(PILLAR_BRICK),
    crumble_0: makeCanvas(CRUMBLE_0),
    crumble_1: makeCanvas(CRUMBLE_1),
    crumble_2: makeCanvas(CRUMBLE_2),
    spike_up: makeCanvas(SPIKE_UP),
    spike_right: makeCanvas(rotateRows90(SPIKE_UP)),
    spike_down: makeCanvas(rotateRows180(SPIKE_UP)),
    spike_left: makeCanvas(rotateRows270(SPIKE_UP)),
    saw_0: makeCanvas(SAW_0),
    saw_1: makeCanvas(SAW_1),
    laser_idle: makeCanvas(LASER_IDLE),
    laser_warn: makeCanvas(LASER_WARN),
    laser_fire: makeCanvas(LASER_FIRE),
    fire_pivot: makeCanvas(FIRE_PIVOT),
    fireball_0: makeCanvas(FIREBALL_0),
    fireball_1: makeCanvas(FIREBALL_1),
    turret_right: makeCanvas(TURRET_RIGHT),
    turret_down: makeCanvas(rotateRows90(TURRET_RIGHT)),
    turret_left: makeCanvas(rotateRows180(TURRET_RIGHT)),
    turret_up: makeCanvas(rotateRows270(TURRET_RIGHT)),
    turret_warn_right: makeCanvas(TURRET_WARN_RIGHT),
    turret_warn_down: makeCanvas(rotateRows90(TURRET_WARN_RIGHT)),
    turret_warn_left: makeCanvas(rotateRows180(TURRET_WARN_RIGHT)),
    turret_warn_up: makeCanvas(rotateRows270(TURRET_WARN_RIGHT)),
    dart_right: makeCanvas(DART_RIGHT),
    dart_down: makeCanvas(rotateRows90(DART_RIGHT)),
    dart_left: makeCanvas(rotateRows180(DART_RIGHT)),
    dart_up: makeCanvas(rotateRows270(DART_RIGHT)),
    bat_perch: makeCanvas(BAT_PERCH),
    bat_fly_0: makeCanvas(BAT_FLY_0),
    bat_fly_1: makeCanvas(BAT_FLY_1),
    bat_dive: makeCanvas(BAT_DIVE),
    bounce_idle: makeCanvas(BOUNCE_IDLE),
    bounce_active: makeCanvas(BOUNCE_ACTIVE),
    moving_plat: makeCanvas(MOVING_PLAT),
    sign_right: makeCanvas(SIGN_RIGHT),
    sign_left: makeCanvas(rotateRows180(SIGN_RIGHT)),
    sign_up: makeCanvas(rotateRows270(SIGN_RIGHT)),
    grapple_ring: makeCanvas(GRAPPLE_RING),
    grapple_ring_active: makeCanvas(GRAPPLE_RING_ACTIVE),
    gem_0: makeCanvas(GEM_0),
    gem_1: makeCanvas(GEM_1),
    player_idle: getSkinSprite('strider', 'idle'),
    player_run_0: getSkinSprite('strider', 'run_0'),
    player_run_1: getSkinSprite('strider', 'run_1'),
    player_jump: getSkinSprite('strider', 'jump'),
    player_wall: getSkinSprite('strider', 'wall'),
    player_flip: getSkinSprite('strider', 'flip'),
    player_grapple: getSkinSprite('strider', 'grapple'),
  };
  return atlasCache;
}
