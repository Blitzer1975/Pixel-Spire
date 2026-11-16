import { BiomeThemeId, PlayerPose, SkinId, THEMES, TILE } from './types';

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
  | 'crusher_idle'
  | 'crusher_warn'
  | 'flame_vent_right'
  | 'flame_vent_down'
  | 'flame_vent_left'
  | 'flame_vent_up'
  | 'flame_jet_0'
  | 'flame_jet_1'
  | 'coil_idle'
  | 'coil_warn'
  | 'coil_fire'
  | 'acid_vent_idle'
  | 'acid_vent_drip'
  | 'acid_drop'
  | 'pendulum_pivot'
  | 'pendulum_mace'
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

// Spike Crusher 16x16 block (armored iron chassis with spiked underside teeth)
const CRUSHER_IDLE = [
  'kkkkkkkkkkkkkkkk',
  'khhmmmmmmmmmmhhk',
  'khmssddddddssmmk',
  'kmsddddddddddsmk',
  'kmsdkllssllkdsmk',
  'kmsdklrrrrlkdsmk',
  'kmsdklrWWrlkdsmk',
  'kmsdkllssllkdsmk',
  'kmsddddddddddsmk',
  'kmmssssssssssmmk',
  'kkkkkkkkkkkkkkkk',
  '.kprk.kprk.kprk.',
  '.kwmk.kwmk.kwmk.',
  '..kmk..kmk..kmk.',
  '...k....k....k..',
  '................',
];

const CRUSHER_WARN = [
  'kkkkkkkkkkkkkkkk',
  'kAAFFFFFFFFFFAAk',
  'kAFssddddddssFAk',
  'kFsddddddddddsfk',
  'kFsdkFFWWFFkdsfk',
  'kFsdkFWWWWFkdsfk',
  'kFsdkFWWWWFkdsfk',
  'kFsdkFFWWFFkdsfk',
  'kFsddddddddddsfk',
  'kFFrrrrrrrrrrFFk',
  'kkkkkkkkkkkkkkkk',
  '.kprk.kprk.kprk.',
  '.kwmk.kwmk.kwmk.',
  '..krk..krk..krk.',
  '...k....k....k..',
  '................',
];

// Flame Vent (pointing right, rotated for down/left/up) & Flame Jet Plumes
const FLAME_VENT_RIGHT = [
  'kkkkkkkkkkkkkkkk',
  'khhllllllllllhhk',
  'klssssssssssslfk',
  'ksddddddddddkffk',
  'ksddkkkkkkkkkFfk',
  'ksdkrrrrffffkWFk',
  'ksdkrFFWWWWFkWWk',
  'ksdkrFWWWWWFkWWk',
  'ksdkrFWWWWWFkWWk',
  'ksdkrFFWWWWFkWFk',
  'ksdkrrrrffffkffk',
  'ksddkkkkkkkkkffk',
  'ksddddddddddslfk',
  'kllllllllllllhhk',
  'kddddddddddddddk',
  'kkkkkkkkkkkkkkkk',
];

const FLAME_JET_0 = [
  '................',
  '...rr......rr...',
  '..rffrrrrrffr...',
  '.rffFFFFFFFFfr..',
  'rfFFWWWWWWWWFFr.',
  'rfFWWWWWWWWWWFfr',
  'rFFWWWWWWWWWWFFr',
  'rFFWWWWWWWWWWFFr',
  'rfFWWWWWWWWWWFfr',
  'rfFFWWWWWWWWFFr.',
  '.rffFFFFFFFFfr..',
  '..rffrrrrrffr...',
  '...rr......rr...',
  '................',
  '................',
  '................',
];

const FLAME_JET_1 = [
  '..r........r....',
  '.rffr....rffr...',
  '.rfFFrrrrFFffr..',
  'rfFFWWWWWWFFFfr.',
  'rFFWWWWWWWWWWFfr',
  'rFWWWWWWWWWWWWFr',
  'rFWWWWWWWWWWWWFr',
  'rFFWWWWWWWWWWFfr',
  'rfFFWWWWWWFFFfr.',
  '.rfFFrrrrFFffr..',
  '.rffr....rffr...',
  '..r........r....',
  '................',
  '................',
  '................',
  '................',
];

// Shock Coil Pylons (Tesla towers discharging arcs)
const COIL_IDLE = [
  '....kkkkkkkk....',
  '...kCCCCCCCCk...',
  '...kCGGGGGGCk...',
  '....kkGGGGkk....',
  '..kkkkkkkkkkkk..',
  '.kmmmmmmmmmmmmk.',
  '..kksssssssskk..',
  '...kllGGGGllk...',
  '..kksssssssskk..',
  '...kllGGGGllk...',
  '..kksssssssskk..',
  '...kssddddssk...',
  '..kssddddddssk..',
  '.kllssssssssllk.',
  'khhhhhhhhhhhhhhk',
  'kkkkkkkkkkkkkkkk',
];

const COIL_WARN = [
  '....kkkkkkkk....',
  '...kAAFFFFAAk...',
  '...kAFWWWWFAk...',
  '....kkFFFFkk....',
  '..kkkkkkkkkkkk..',
  '.kmmmmmmmmmmmmk.',
  '..kksssssssskk..',
  '...kllFFFFllk...',
  '..kksssssssskk..',
  '...kllFFFFllk...',
  '..kksssssssskk..',
  '...kssddddssk...',
  '..kssddddddssk..',
  '.kllssssssssllk.',
  'khhhhhhhhhhhhhhk',
  'kkkkkkkkkkkkkkkk',
];

const COIL_FIRE = [
  '....kkkkkkkk....',
  '...kWWWWWWWWk...',
  '...kWCGGGGCWk...',
  '....kkCCCCkk....',
  '..kkkkkkkkkkkk..',
  '.kCCCCCCCCCCCCk.',
  '..kksssssssskk..',
  '...kllWWWWllk...',
  '..kksssssssskk..',
  '...kllCCCCllk...',
  '..kksssssssskk..',
  '...kssGGGGssk...',
  '..kssddddddssk..',
  '.kllssssssssllk.',
  'khhhhhhhhhhhhhhk',
  'kkkkkkkkkkkkkkkk',
];

// Acid Drip Ceiling Vent & Falling Acid Globules
const ACID_VENT_IDLE = [
  'kkkkkkkkkkkkkkkk',
  'khhhhllhhllhhhhk',
  'kllssssssssssllk',
  'kssddddddddddssk',
  'kssddkkkkkkddssk',
  'ksddkeeeeeekddsk',
  'ksddkeEEEEekddsk',
  'ksddkeeeeeekddsk',
  'kssddkkkkkkddssk',
  '.kssddddddddssk.',
  '..kssddddddssk..',
  '..kdkeeeeeekdk..',
  '...kkEEEEEEkk...',
  '.....keeeek.....',
  '......kkkk......',
  '................',
];

const ACID_VENT_DRIP = [
  'kkkkkkkkkkkkkkkk',
  'khhhhllhhllhhhhk',
  'kllssssssssssllk',
  'kssddddddddddssk',
  'kssddkkkkkkddssk',
  'ksddkEEEEEEkddsk',
  'ksddkeWWWWekddsk',
  'ksddkEEEEEEkddsk',
  'kssddkkkkkkddssk',
  '.kssddddddddssk.',
  '..kssddddddssk..',
  '..kdkEEEEEEkdk..',
  '...kkEWWWWekk...',
  '.....kEWWEk.....',
  '......kEEk......',
  '.......kk.......',
];

const ACID_DROP = [
  '................',
  '.......kk.......',
  '......kEEk......',
  '......kEEk......',
  '.....kEWWek.....',
  '.....kEWWek.....',
  '....kEEWWEEk....',
  '....kEEWWEEk....',
  '....keeeeeek....',
  '....keeeeeek....',
  '.....keeeek.....',
  '......kEEk......',
  '.......kk.......',
  '................',
  '................',
  '................',
];

// Pendulum Mace Pivot & Spiked Iron Ball
const PENDULUM_PIVOT = [
  '....kkkkkkkk....',
  '..kkhhhhhhhhkk..',
  '.khhllllllllhhk.',
  '.khlsssssssslhk.',
  'khlsskkkkkksslhk',
  'khlsdkddddkdslhk',
  'khlskdFFFFdkslhk',
  'khlskdFWWFdkslhk',
  'khlskdFWWFdkslhk',
  'khlskdFFFFdkslhk',
  'khlsdkddddkdslhk',
  'khlsskkkkkksslhk',
  '.khlsssssssslhk.',
  '.khhllllllllhhk.',
  '..kkddddddddkk..',
  '....kkkkkkkk....',
];

const PENDULUM_MACE = [
  '.......kk.......',
  '......kmmk......',
  '..kk..kssk..kk..',
  '.kmwksssssskwmk.',
  '..kssllllllssk..',
  '..ksllmmmmllsk..',
  'kkslmddrrddmlskk',
  'mwslmdrFFrdmlswm',
  'mwslmdrFFrdmlswm',
  'kkslmddrrddmlskk',
  '..ksllmmmmllsk..',
  '..kssllllllssk..',
  '.kmwksssssskwmk.',
  '..kk..kssk..kk..',
  '......kmmk......',
  '.......kk.......',
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

// Skin 11: Paladin (gilded solar crest, gleaming white-steel helm, azure cloak)
const PALADIN_HEAD_IDLE = [
  '.....kkAAkk.....',
  '....kAAWWAAk....',
  '...kkmmmmmmkk...',
  '..kmwwwwwwwwmk..',
  '..kmwvvvvvvwmk..',
  '..kmwvGGGGvwmk..',
  '..kmwwwwwwwwmk..',
  '...kkAAmmAAkk...',
];

// Skin 12: Cyber-Samurai (gold-horned kabuto, dark carbon helm, neon cyan visor)
const SAMURAI_HEAD_IDLE = [
  '.kk..........kk.',
  'kAAk.kkkkkk.kAAk',
  '.kAFkddddddkFAk.',
  '..kddddddddddk..',
  '..kdGGGGGGGGdk..',
  '..kdGCCCCCCGDk..',
  '..kdrrddddrrdk..',
  '...kkddddddkk...',
];

// Skin 13: Ascendant (Secret Skin — star-crowned void hood with cosmic starlight eyes)
const ASCENDANT_HEAD_IDLE = [
  '......kAAk......',
  '....kkWWWWkk....',
  '...kPPVVVVPPk...',
  '..kPVvvvvvvVPk..',
  '..kPvWWvvWWvPk..',
  '..kPvFFvvFFvPk..',
  '..kPVvvvvvvVPk..',
  '...kkPPVVPPkk...',
];

// Skin 14: Plague Doctor (brimmed hat, emerald optics, pale beak)
const PLAGUE_HEAD_IDLE = [
  '....kkkkkkkk....',
  '..kkddddddddkk..',
  'kddddddddddddddk',
  'kkkkkkkkkkkkkkkk',
  '..kvvvvEEEEvvvk.',
  '..kvvvvEWWEvvvk.',
  '..kvvvvvwwwwwkkk',
  '...kkvvvwwwwkkk.',
];

// Skin 15: Mecha-Phoenix (fiery solar crest, gold armor, cyan visor)
const PHOENIX_HEAD_IDLE = [
  '.....kkrrkk.....',
  '...kkffFFffkk...',
  '..kffFWWWWFffk..',
  '..kFFaaaaaaFFk..',
  '..kaavvvvvvaak..',
  '..kavCCCCCCvak..',
  '..kaavvvvvvaak..',
  '...kkAAAAAAkk...',
];

// Skin 16: Void Stalker (horned shadow hood, twin magenta eyes)
const STALKER_HEAD_IDLE = [
  '..kk........kk..',
  '.kPPk.kkkk.kPPk.',
  '..kPPVVVVVVPPk..',
  '..kPVvvvvvvVPk..',
  '..kPvTTvvTTvPk..',
  '..kPvWWvvWWvPk..',
  '..kPVvvvvvvVPk..',
  '...kkPPVVPPkk...',
];

// Skin 17: Chrono-King (Secret Skin — gilded clockwork crown, cyan temporal visor)
const CHRONO_HEAD_IDLE = [
  '..kk..kAAk..kk..',
  '.kAAkkAWWAkkAAk.',
  '..kAAAAAAAAAAk..',
  '..kAAvvvvvvAAk..',
  '..kAvCCCCCCvAk..',
  '..kAvCWWWWCvAk..',
  '..kAAvvvvvvAAk..',
  '...kkAAAAAAkk...',
];

// Skin 18: Werewolf (wolf ears, silver-gray fur, glowing ember eyes, fangs)
const WEREWOLF_HEAD_IDLE = [
  '..kk........kk..',
  '.khhk.kkkk.khhk.',
  '.khmkkkkkkkkmhk.',
  '..kmmmmmmmmmmk..',
  '..kmrrrmmrrrmk..',
  '..kmmmkkkkmmmk..',
  '..kmWmkWWkmWmk..',
  '...kkmmmmmmkk...',
];

// Skin 19: Trailrunner (aerodynamic emerald-gold champion helm & lightning visor)
const TRAILRUNNER_HEAD_IDLE = [
  '....kkkkkkkk....',
  '...kEEEEEEEEk...',
  '..kEEWWWWWWEEk..',
  '..kEkkkkkkkkEk..',
  '..kEkAAWWAAkEk..',
  '..kEkAAAAAAkEk..',
  '...kkeEEEEekk...',
  '....kkkkkkkk....',
];

// Skin 20: Skeleton (ivory skull, deep hollow sockets with cyan soul pinpoints, jaw)
const SKELETON_HEAD_IDLE = [
  '....kkkkkkkk....',
  '...kwwwwwwwwk...',
  '..kwwwwwwwwwwk..',
  '..kwwvvwwvvwwk..',
  '..kwwvGwwGvwwk..',
  '...kwwwvvwwwk...',
  '...kkwkwkwkpk...',
  '....kkkkkkkk....',
];

// Skin 21: Banshee (flowing spectral silver-cyan locks, hollow glowing spirit eyes)
const BANSHEE_HEAD_IDLE = [
  '...kkkkkkkkkk...',
  '..kCCCCCCCCCCk..',
  '.kCCGGGGGGGGCCk.',
  '.kCGvvGGGGvvGCk.',
  '.kCGWWGGGGWWGCk.',
  '.kCGGvvGGvvGGC.',
  '.kCCGGGGGGGGCCk.',
  '..kCkkkkkkkkCk..',
];

// Skin 22: Possessed Armor (horned cursed iron greathelm with blazing soul-fire visor)
const POSSESSED_ARMOR_HEAD_IDLE = [
  '..kk........kk..',
  '.krrk.kkkk.krrk.',
  '..ksmmmmmmmmsk..',
  '..kmddddddddmk..',
  '..kmvrrVVrrvmk..',
  '..kmvrWWWWvrkm..',
  '..kmddddddddmk..',
  '...kkmmmmmmkk...',
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
  paladin: PALADIN_HEAD_IDLE,
  samurai: SAMURAI_HEAD_IDLE,
  ascendant: ASCENDANT_HEAD_IDLE,
  plague: PLAGUE_HEAD_IDLE,
  phoenix: PHOENIX_HEAD_IDLE,
  stalker: STALKER_HEAD_IDLE,
  chrono: CHRONO_HEAD_IDLE,
  werewolf: WEREWOLF_HEAD_IDLE,
  trailrunner: TRAILRUNNER_HEAD_IDLE,
  skeleton: SKELETON_HEAD_IDLE,
  banshee: BANSHEE_HEAD_IDLE,
  possessed_armor: POSSESSED_ARMOR_HEAD_IDLE,
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
  } else if (skin === 'paladin') {
    base[8] = '.kAAwwwwwwwwAAk.';
    base[9] = '.kBwwBBAAbbwwBk.';
    base[10] = '..kBBwwAAwwBBk..';
  } else if (skin === 'samurai') {
    base[8] = '.krrddddddddrrk.';
    base[9] = '.kdGGddddddGGdk.';
    base[10] = '..kddAArrAAddk..';
  } else if (skin === 'ascendant') {
    base[8] = '.kPPVVWWWWVVPPk.';
    base[9] = 'kPVkVVAAAAVVkVPk';
    base[10] = '.kPk.kVVVVk.kPk.';
  } else if (skin === 'plague') {
    base[8] = '.kddssEEEEssddk.';
    base[9] = '.kddssWWWWssddk.';
    base[10] = '..kddddEEddddk..';
  } else if (skin === 'phoenix') {
    base[8] = 'kffkAAWWWWAAkffk';
    base[9] = 'kFFkAACCCCAAkFFk';
    base[10] = '.kk.kAAAAAAk.kk.';
  } else if (skin === 'stalker') {
    base[8] = '.kPPvvvvvvvvPPk.';
    base[9] = '.kPvvTTTTTTvvPk.';
    base[10] = '..kPPvvvvvvPPk..';
  } else if (skin === 'chrono') {
    base[8] = '.kAAoCCCCCCoAAk.';
    base[9] = 'kAAooCWWWWCooAAk';
    base[10] = '.kk.kAAAAAAk.kk.';
  } else if (skin === 'werewolf') {
    base[8] = '.khhmmmmmmmmhhk.';
    base[9] = 'khmkmmsWWsmmkmhk';
    base[10] = 'kdk.kmssddmk.kdk';
  } else if (skin === 'trailrunner') {
    base[8] = '.kEEddddddddEEk.';
    base[9] = '.kEdAAWWWWAAdEk.';
    base[10] = '..kddAAAAAAddk..';
  } else if (skin === 'skeleton') {
    base[8] = '..kkvvvvvvvvkk..';
    base[9] = '.kwkvwvwwvwvkwk.';
    base[10] = '..kkvwwvvwwvkk..';
  } else if (skin === 'banshee') {
    base[8] = '.kCCGGGGGGGGCCk.';
    base[9] = 'kCGkCCWWWWCCkGCk';
    base[10] = 'kCk.kCCGGCCk.kCk';
  } else if (skin === 'possessed_armor') {
    base[8] = '.kmmddddddddmmk.';
    base[9] = 'kmkmdVVrrVVdmkdk';
    base[10] = '.kk.kmdrrdmkk.kk';
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
  paladin: { b: '#0284c7', B: '#38bdf8', S: '#f8fafc', d: '#1e3a8a', m: '#fde047' },
  samurai: { b: '#1e293b', B: '#0f172a', S: '#22d3ee', d: '#1e293b', m: '#22d3ee' },
  ascendant: { b: '#581c87', B: '#9333ea', S: '#f3e8ff', d: '#3b0764', m: '#fde047' },
  plague: { b: '#064e3b', B: '#047857', S: '#d1fae5', d: '#0f172a', m: '#34d399', e: '#059669', E: '#34d399' },
  phoenix: { b: '#c2410c', B: '#f97316', S: '#fef3c7', d: '#7c2d12', m: '#fbbf24' },
  stalker: { b: '#3b0764', B: '#581c87', S: '#f5d0fe', d: '#0f0720', m: '#e879f9', t: '#c026d3', T: '#f0abfc' },
  chrono: { b: '#92400e', B: '#d97706', S: '#fef3c7', d: '#451a03', m: '#38bdf8', a: '#d97706', A: '#fde047' },
  werewolf: { b: '#475569', B: '#64748b', S: '#cbd5e1', d: '#1e293b', m: '#94a3b8', r: '#ef4444' },
  trailrunner: { b: '#059669', B: '#10b981', S: '#ecfdf5', d: '#064e3b', m: '#fde047', e: '#059669', E: '#34d399' },
  skeleton: { b: '#cbd5e1', B: '#f1f5f9', S: '#f8fafc', d: '#1e293b', m: '#e2e8f0', G: '#38bdf8' },
  banshee: { b: '#0891b2', B: '#22d3ee', S: '#ecfeff', d: '#164e63', m: '#a5f3fc', g: '#06b6d4', G: '#67e8f9', C: '#cffafe' },
  possessed_armor: { b: '#4c1d95', B: '#6d28d9', S: '#fca5a5', d: '#1e293b', m: '#64748b', r: '#ef4444', V: '#a855f7' },
};

let atlasCache: Record<SpriteName, HTMLCanvasElement> | null = null;
const skinAtlasCache: Partial<Record<SkinId, Record<PlayerPose, HTMLCanvasElement>>> = {};
const themeBrickCache: Partial<
  Record<BiomeThemeId, { wall: HTMLCanvasElement; ledge: HTMLCanvasElement; pillar: HTMLCanvasElement }>
> = {};

export function getThemeBrickSprites(themeId: BiomeThemeId): {
  wall: HTMLCanvasElement;
  ledge: HTMLCanvasElement;
  pillar: HTMLCanvasElement;
} {
  if (!themeBrickCache[themeId]) {
    const def = THEMES.find((t) => t.id === themeId);
    const pal = def?.brickPalette;
    themeBrickCache[themeId] = {
      wall: makeCanvas(WALL_BRICK, pal),
      ledge: makeCanvas(LEDGE_BRICK, pal),
      pillar: makeCanvas(PILLAR_BRICK, pal),
    };
  }
  return themeBrickCache[themeId]!;
}

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
    crusher_idle: makeCanvas(CRUSHER_IDLE),
    crusher_warn: makeCanvas(CRUSHER_WARN),
    flame_vent_right: makeCanvas(FLAME_VENT_RIGHT),
    flame_vent_down: makeCanvas(rotateRows90(FLAME_VENT_RIGHT)),
    flame_vent_left: makeCanvas(rotateRows180(FLAME_VENT_RIGHT)),
    flame_vent_up: makeCanvas(rotateRows270(FLAME_VENT_RIGHT)),
    flame_jet_0: makeCanvas(FLAME_JET_0),
    flame_jet_1: makeCanvas(FLAME_JET_1),
    coil_idle: makeCanvas(COIL_IDLE),
    coil_warn: makeCanvas(COIL_WARN),
    coil_fire: makeCanvas(COIL_FIRE),
    acid_vent_idle: makeCanvas(ACID_VENT_IDLE),
    acid_vent_drip: makeCanvas(ACID_VENT_DRIP),
    acid_drop: makeCanvas(ACID_DROP),
    pendulum_pivot: makeCanvas(PENDULUM_PIVOT),
    pendulum_mace: makeCanvas(PENDULUM_MACE),
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
