import { retroAudio } from './audio';
import { LevelGenerator, WorldEntities } from './levelGen';
import { getSkinSprite, getSpriteAtlas, SpriteName } from './sprites';
import {
  Afterimage,
  FloatingText,
  GameState,
  GrappleRing,
  HudSnapshot,
  Particle,
  Player,
  PlayerPose,
  SkinId,
  SKINS,
  TILE,
  VIRTUAL_H,
  VIRTUAL_W,
} from './types';

const GRAVITY = 760;
const MAX_FALL_SPEED = 275;
const WALL_SLIDE_SPEED = 38;
const MOVE_ACCEL = 1220;
const AIR_ACCEL = 1120;
const MAX_RUN_SPEED = 132;
const GROUND_FRICTION = 1180;
const JUMP_VELOCITY = -228;
const WALL_JUMP_VX = 158;
const WALL_JUMP_VY = -236;
const DOUBLE_JUMP_VY = -222;
const BACKFLIP_VY = -188;
const BACKFLIP_VX = 94;
const GRAPPLE_RANGE = 164;
const GRAPPLE_REEL_SPEED = 395;
const GRAPPLE_BOOST_VY = -265;

const STORAGE_BEST_SCORE = 'pixel_spire_best_score_v1';
const STORAGE_BEST_ALT = 'pixel_spire_best_alt_v1';
const STORAGE_GEMS = 'pixel_spire_gems_v1';
const STORAGE_UNLOCKED_SKINS = 'pixel_spire_unlocked_skins_v1';
const STORAGE_SELECTED_SKIN = 'pixel_spire_selected_skin_v1';

export interface InputState {
  left: boolean;
  right: boolean;
  jumpHeld: boolean;
  jumpPressed: boolean;
  jumpReleased: boolean;
  grapplePressed: boolean;
  pointerWorldX: number | null;
  pointerWorldY: number | null;
}

export class GameEngine {
  public state: GameState = 'TITLE_MENU';
  public world: WorldEntities = {
    solids: [],
    crumbles: [],
    movingPlatforms: [],
    bouncePads: [],
    spikes: [],
    saws: [],
    lasers: [],
    firebars: [],
    turrets: [],
    darts: [],
    bats: [],
    rings: [],
    gems: [],
    signs: [],
    cameraSlices: [],
  };
  public player!: Player;
  public cameraX = 0;
  public cameraY = 0;
  public startY = VIRTUAL_H - TILE * 2;
  public minPlayerY = this.startY;
  public magmaY = VIRTUAL_H + 140;
  public magmaActive = false;
  public time = 0;
  public score = 0;
  public styleScore = 0;
  public gemsCollected = 0;
  public totalGems = 0;
  public selectedSkin: SkinId = 'strider';
  public unlockedSkins: SkinId[] = ['strider'];
  public wingsCleared = 0;
  public comboCount = 0;
  public comboTimer = 0;
  public bestScore = 0;
  public bestAltitudeMeters = 0;
  public deathReason = '';

  private shakeTimer = 0;
  private shakeIntensity = 0;
  private wallJumpLockTimer = 0;
  private visitedSlices = new Set<number>();
  private particles: Particle[] = [];
  private afterimages: Afterimage[] = [];
  private popups: FloatingText[] = [];
  private levelGen = new LevelGenerator();
  private nearestRing: GrappleRing | null = null;
  private onHudUpdate: (hud: HudSnapshot) => void;
  private hudSyncCounter = 0;

  constructor(onHudUpdate: (hud: HudSnapshot) => void) {
    this.onHudUpdate = onHudUpdate;
    try {
      this.bestScore = Number(localStorage.getItem(STORAGE_BEST_SCORE) || 0) || 0;
      this.bestAltitudeMeters = Number(localStorage.getItem(STORAGE_BEST_ALT) || 0) || 0;
      this.totalGems = Math.max(0, Number(localStorage.getItem(STORAGE_GEMS) || 0) || 0);
      const savedSkins = localStorage.getItem(STORAGE_UNLOCKED_SKINS);
      if (savedSkins) {
        const parsed = JSON.parse(savedSkins) as SkinId[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.unlockedSkins = Array.from(new Set<SkinId>(['strider', ...parsed]));
        }
      }
      const savedSelected = localStorage.getItem(STORAGE_SELECTED_SKIN) as SkinId | null;
      if (savedSelected && this.unlockedSkins.includes(savedSelected)) {
        this.selectedSkin = savedSelected;
      }
    } catch {
      // ignore storage failure
    }
    this.resetWorld('TITLE_MENU');
  }

  public unlockOrEquipSkin(skinId: SkinId): boolean {
    const def = SKINS.find((s) => s.id === skinId);
    if (!def) return false;

    if (this.unlockedSkins.includes(skinId)) {
      this.selectedSkin = skinId;
      try {
        localStorage.setItem(STORAGE_SELECTED_SKIN, skinId);
      } catch {
        // ignore
      }
      this.emitHud();
      return true;
    }

    if (this.totalGems >= def.cost) {
      this.totalGems -= def.cost;
      this.unlockedSkins = [...this.unlockedSkins, skinId];
      this.selectedSkin = skinId;
      retroAudio.unlockSkin();
      try {
        localStorage.setItem(STORAGE_GEMS, String(this.totalGems));
        localStorage.setItem(STORAGE_UNLOCKED_SKINS, JSON.stringify(this.unlockedSkins));
        localStorage.setItem(STORAGE_SELECTED_SKIN, skinId);
      } catch {
        // ignore
      }
      this.emitHud();
      return true;
    }

    return false;
  }

  public resetWorld(nextState: GameState) {
    this.state = nextState;
    this.world = {
      solids: [],
      crumbles: [],
      movingPlatforms: [],
      bouncePads: [],
      spikes: [],
      saws: [],
      lasers: [],
      firebars: [],
      turrets: [],
      darts: [],
      bats: [],
      rings: [],
      gems: [],
      signs: [],
      cameraSlices: [],
    };
    this.particles = [];
    this.afterimages = [];
    this.popups = [];
    this.visitedSlices.clear();
    this.cameraX = 0;
    this.cameraY = 0;
    this.startY = VIRTUAL_H - TILE * 2;
    this.minPlayerY = this.startY;
    this.magmaY = VIRTUAL_H + 96;
    this.magmaActive = false;
    this.score = 0;
    this.styleScore = 0;
    this.gemsCollected = 0;
    this.wingsCleared = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.deathReason = '';
    this.shakeTimer = 0;
    this.wallJumpLockTimer = 0;

    this.levelGen.reset(this.world, VIRTUAL_H);
    this.levelGen.ensureGeneratedUpTo(this.world, -VIRTUAL_H * 1.8);

    this.player = {
      x: VIRTUAL_W / 2 - 5,
      y: this.startY,
      w: 10,
      h: 14,
      vx: 0,
      vy: 0,
      facing: 1,
      onGround: true,
      onWall: 0,
      ridingPlatformId: null,
      coyoteTimer: 0,
      wallCoyoteTimer: 0,
      lastWallDir: 0,
      jumpBufferTimer: 0,
      jumpHeld: false,
      holdJumpTimer: 0,
      canDoubleJump: true,
      canBackflip: false,
      isBackflipping: false,
      backflipTimer: 0,
      backflipAngle: 0,
      grappleTarget: null,
      grappleTimer: 0,
      grappleCooldown: 0,
      animTimer: 0,
      invulnTimer: 0,
      dead: false,
    };

    this.nearestRing = this.findNearestRing(null, null);
    this.emitHud();
  }

  public startNewRun() {
    this.resetWorld('PLAYING');
  }

  public goToMainMenu() {
    this.resetWorld('TITLE_MENU');
  }

  public togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.emitHud();
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.emitHud();
    }
  }

  public getAltitudeMeters(): number {
    return Math.max(0, Math.floor((this.startY - this.minPlayerY) / TILE));
  }

  public step(dt: number, input: InputState) {
    if (this.state === 'TITLE_MENU') {
      this.time += dt;
      this.updateObstacles(dt);
      return;
    }
    if (this.state !== 'PLAYING') {
      return;
    }

    this.time += dt;
    if (this.shakeTimer > 0) this.shakeTimer = Math.max(0, this.shakeTimer - dt);
    if (this.wallJumpLockTimer > 0) this.wallJumpLockTimer = Math.max(0, this.wallJumpLockTimer - dt);
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.comboCount = 0;
    }

    this.updateObstacles(dt);
    this.updatePlayer(dt, input);
    this.updateParticles(dt);

    // 2D Camera Tracking: Y follows vertical climb, X clamps to local shaft/wing slice
    const targetCamY = Math.min(0, this.player.y - VIRTUAL_H * 0.52);
    if (targetCamY < this.cameraY) {
      this.cameraY += (targetCamY - this.cameraY) * Math.min(1, dt * 8.5);
    } else if (this.player.y - this.cameraY > VIRTUAL_H * 0.72) {
      const followDown = this.player.y - VIRTUAL_H * 0.72;
      this.cameraY += (followDown - this.cameraY) * Math.min(1, dt * 5);
    }

    const activeSlice = this.findActiveCameraSlice();
    let inHorizontalWing = false;
    if (activeSlice) {
      const span = activeSlice.xMax - activeSlice.xMin;
      inHorizontalWing = span > VIRTUAL_W + 4;
      const desiredX = this.player.x + this.player.w / 2 - VIRTUAL_W / 2;
      const clampedX = Math.max(activeSlice.xMin, Math.min(activeSlice.xMax - VIRTUAL_W, desiredX));
      this.cameraX += (clampedX - this.cameraX) * Math.min(1, dt * 9);

      if (!inHorizontalWing && activeSlice.xMin !== 0 && !this.visitedSlices.has(activeSlice.yTop)) {
        this.visitedSlices.add(activeSlice.yTop);
        this.wingsCleared++;
        this.addStylePoints(80, 'WING CLEARED!', this.player.x + this.player.w / 2, this.player.y - 8, '#fbbf24');
      }
    }

    // Track highest climb
    if (this.player.y < this.minPlayerY) {
      this.minPlayerY = this.player.y;
    }

    const altitude = this.getAltitudeMeters();
    this.score = altitude * 10 + this.styleScore;
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
    }
    if (altitude > this.bestAltitudeMeters) {
      this.bestAltitudeMeters = altitude;
    }

    // Rising magma tide activates once you climb past 16m, slows down during horizontal wings
    if (!this.magmaActive && altitude >= 16) {
      this.magmaActive = true;
      this.magmaY = this.cameraY + VIRTUAL_H + 56;
    }
    if (this.magmaActive) {
      const baseSpeed = (12 + Math.min(22, altitude * 0.14)) * (inHorizontalWing ? 0.25 : 1);
      const maxLagY = this.cameraY + VIRTUAL_H + 92;
      if (this.magmaY > maxLagY) {
        this.magmaY = maxLagY;
      }
      this.magmaY -= baseSpeed * dt;
    }

    // Endless procedural generation ahead & safe pruning far below
    this.levelGen.ensureGeneratedUpTo(this.world, this.cameraY - VIRTUAL_H * 1.8);
    this.levelGen.pruneBelow(this.world, this.cameraY + VIRTUAL_H + 220);

    // Check hazards & pickups
    if (!this.player.dead) {
      this.checkPickups();
      this.checkHazards();
    }

    this.nearestRing = this.findNearestRing(input.pointerWorldX, input.pointerWorldY);

    this.hudSyncCounter++;
    if (this.hudSyncCounter >= 4) {
      this.hudSyncCounter = 0;
      this.emitHud();
    }
  }

  private findActiveCameraSlice() {
    const py = this.player.y + this.player.h / 2;
    const px = this.player.x + this.player.w / 2;
    let best = null;
    for (const s of this.world.cameraSlices) {
      if (py >= s.yTop - 4 && py <= s.yBottom + 4 && px >= s.xMin && px <= s.xMax) {
        return s;
      }
      if (py >= s.yTop - 24 && py <= s.yBottom + 24) {
        best = s;
      }
    }
    return best;
  }

  private updateObstacles(dt: number) {
    // Crumble platforms
    for (const c of this.world.crumbles) {
      if (c.state === 'shaking') {
        c.timer -= dt;
        if (Math.random() < 0.35) {
          this.spawnDust(c.x + Math.random() * c.w, c.y + c.h, '#d97706', 1);
        }
        if (c.timer <= 0) {
          c.state = 'broken';
          c.respawnTimer = 3.2;
          retroAudio.crumble();
          this.spawnDust(c.x + c.w / 2, c.y + 8, '#b45309', 8);
        }
      } else if (c.state === 'broken') {
        c.respawnTimer -= dt;
        if (c.respawnTimer <= 0) {
          c.state = 'idle';
          c.timer = 0;
        }
      }
    }

    // Moving Platforms
    for (const m of this.world.movingPlatforms) {
      m.prevX = m.x;
      m.prevY = m.y;
      const t = this.time * m.speed + m.phase;
      m.x = m.baseX + Math.sin(t) * m.moveX;
      m.y = m.baseY + Math.cos(t) * m.moveY;
    }

    // Bounce Pads cooldown animation
    for (const bp of this.world.bouncePads) {
      if (bp.compressTimer > 0) {
        bp.compressTimer = Math.max(0, bp.compressTimer - dt);
      }
    }

    // Sawblades
    for (const s of this.world.saws) {
      const t = this.time * s.speed + s.phase;
      s.x = s.baseX + Math.sin(t) * s.moveX;
      s.y = s.baseY + Math.cos(t) * s.moveY;
    }

    // Lasers (horizontal & vertical)
    for (const l of this.world.lasers) {
      const cyclePos = ((this.time + l.offset) % l.cycleDuration) / l.cycleDuration;
      const prevState = l.state;
      if (cyclePos < 0.48) {
        l.state = 'idle';
        l.stateProgress = cyclePos / 0.48;
      } else if (cyclePos < 0.72) {
        l.state = 'warning';
        l.stateProgress = (cyclePos - 0.48) / 0.24;
        if (
          prevState === 'idle' &&
          Math.abs(l.y - this.player.y) < VIRTUAL_H &&
          Math.abs(l.x - this.player.x) < VIRTUAL_W * 1.4
        ) {
          retroAudio.laserWarn();
        }
      } else {
        l.state = 'firing';
        l.stateProgress = (cyclePos - 0.72) / 0.28;
      }
    }

    // Firebars
    for (const f of this.world.firebars) {
      f.angle += f.angularSpeed * dt;
    }

    // Dart Turrets
    for (const t of this.world.turrets) {
      if (Math.abs(t.y - this.cameraY - VIRTUAL_H / 2) > VIRTUAL_H) continue;
      t.timer -= dt;
      if (t.timer <= 0) {
        t.timer = t.interval;
        let vx = 0;
        let vy = 0;
        let sx = t.x + 8;
        let sy = t.y + 8;
        if (t.dir === 'right') {
          vx = t.dartSpeed;
          sx = t.x + 17;
        } else if (t.dir === 'left') {
          vx = -t.dartSpeed;
          sx = t.x - 1;
        } else if (t.dir === 'down') {
          vy = t.dartSpeed;
          sy = t.y + 17;
        } else {
          vy = -t.dartSpeed;
          sy = t.y - 1;
        }

        this.world.darts.push({
          id: this.levelGen.uid(),
          x: sx,
          y: sy,
          vx,
          vy,
          dir: t.dir,
          life: 4.5,
        });

        if (
          Math.abs(t.x - this.player.x) < VIRTUAL_W * 1.3 &&
          Math.abs(t.y - this.player.y) < VIRTUAL_H
        ) {
          retroAudio.dartFire();
        }
        this.spawnDust(sx, sy, '#fbbf24', 3);
      }
    }

    // Darts
    const aliveDarts = [];
    for (const d of this.world.darts) {
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.life -= dt;
      if (d.life <= 0) continue;

      let hitWall = false;
      for (const s of this.world.solids) {
        if (d.x >= s.x && d.x <= s.x + s.w && d.y >= s.y && d.y <= s.y + s.h) {
          hitWall = true;
          break;
        }
      }
      if (hitWall) {
        this.spawnDust(d.x, d.y, '#e2e8f0', 4);
        continue;
      }
      aliveDarts.push(d);
    }
    this.world.darts = aliveDarts;

    // Cave Bats (4x4 tile spotting radius, dives every 15s while inside radius)
    const playerCx = this.player ? this.player.x + this.player.w / 2 : -9999;
    const playerCy = this.player ? this.player.y + this.player.h / 2 : -9999;
    const spotRadius = 4 * TILE; // 64px (4-tile radius)

    for (const b of this.world.bats) {
      if (Math.abs(b.homeY - this.cameraY - VIRTUAL_H / 2) > VIRTUAL_H + 120) continue;

      const inRadius =
        this.state === 'PLAYING' &&
        Math.abs(playerCx - b.homeX) <= spotRadius &&
        Math.abs(playerCy - b.homeY) <= spotRadius;
      b.spotted = inRadius;

      if (b.cooldown > 0) {
        b.cooldown = Math.max(0, b.cooldown - dt);
      }

      if (b.state === 'perched') {
        b.x = b.homeX;
        b.y = b.homeY;
        if (inRadius) {
          b.state = 'telegraph';
          b.timer = 0.42;
          retroAudio.batScreech();
          this.spawnDust(b.x, b.y, '#ef4444', 4);
        }
      } else if (b.state === 'telegraph') {
        b.timer -= dt;
        b.x = b.homeX + Math.sin(this.time * 48) * 1.5;
        b.y = b.homeY;
        if (b.timer <= 0) {
          const dx = playerCx - b.x;
          const dy = playerCy - b.y;
          const dist = Math.max(1, Math.hypot(dx, dy));
          const diveSpeed = 185;
          b.vx = (dx / dist) * diveSpeed;
          b.vy = (dy / dist) * diveSpeed;
          b.state = 'diving';
          b.timer = 0.52;
          b.cooldown = 15.0; // Re-dives every 15s while player stays in radius
        }
      } else if (b.state === 'diving') {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.timer -= dt;
        if (b.timer <= 0) {
          b.state = 'returning';
        }
      } else if (b.state === 'returning') {
        const dx = b.homeX - b.x;
        const dy = b.homeY - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= 4) {
          b.x = b.homeX;
          b.y = b.homeY;
          if (inRadius) {
            b.state = 'cooldown';
          } else {
            b.state = 'perched';
            b.cooldown = 0;
          }
        } else {
          const returnSpeed = 105;
          b.x += (dx / dist) * returnSpeed * dt;
          b.y += (dy / dist) * returnSpeed * dt;
        }
      } else if (b.state === 'cooldown') {
        // Hover slightly on perch while 15s timer ticks down; reset if player leaves radius
        b.x = b.homeX + Math.sin(this.time * 3 + b.id) * 4;
        b.y = b.homeY + Math.cos(this.time * 4 + b.id) * 2;
        if (!inRadius) {
          b.state = 'perched';
          b.cooldown = 0;
          b.x = b.homeX;
          b.y = b.homeY;
        } else if (b.cooldown <= 0) {
          b.state = 'telegraph';
          b.timer = 0.42;
          retroAudio.batScreech();
          this.spawnDust(b.x, b.y, '#ef4444', 4);
        }
      }
    }
  }

  private updatePlayer(dt: number, input: InputState) {
    const p = this.player;
    p.animTimer += dt;
    if (p.coyoteTimer > 0) p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);
    if (p.wallCoyoteTimer > 0) p.wallCoyoteTimer = Math.max(0, p.wallCoyoteTimer - dt);
    if (p.jumpBufferTimer > 0) p.jumpBufferTimer = Math.max(0, p.jumpBufferTimer - dt);
    if (p.grappleCooldown > 0) p.grappleCooldown = Math.max(0, p.grappleCooldown - dt);

    // Carry player with active Moving Platform before stepping player motion
    if (p.ridingPlatformId !== null && !p.grappleTarget) {
      const plat = this.world.movingPlatforms.find((m) => m.id === p.ridingPlatformId);
      if (plat) {
        const dx = plat.x - plat.prevX;
        const dy = plat.y - plat.prevY;
        p.x += dx;
        for (const s of this.world.solids) {
          if (this.aabb(p.x, p.y, p.w, p.h, s.x, s.y, s.w, s.h)) {
            if (dx > 0) p.x = s.x - p.w;
            else if (dx < 0) p.x = s.x + s.w;
          }
        }
        p.y += dy;
      }
    }

    if (input.jumpPressed) {
      p.jumpBufferTimer = 0.18;
    }
    p.jumpHeld = input.jumpHeld;

    // Initiate Grapple
    if (input.grapplePressed && !p.grappleTarget && p.grappleCooldown <= 0) {
      const ring = this.findNearestRing(input.pointerWorldX, input.pointerWorldY);
      if (ring) {
        p.grappleTarget = ring;
        p.grappleTimer = 0.45;
        p.canDoubleJump = true;
        p.canBackflip = false;
        p.isBackflipping = false;
        p.holdJumpTimer = 0;
        retroAudio.grappleLatch();
        this.spawnDust(ring.x, ring.y, '#38bdf8', 6);
      }
    }

    // Active Grapple State
    if (p.grappleTarget) {
      const ring = p.grappleTarget;
      const cx = p.x + p.w / 2;
      const cy = p.y + p.h / 2;
      const dx = ring.x - cx;
      const dy = ring.y - cy;
      const dist = Math.hypot(dx, dy);

      p.grappleTimer -= dt;

      if (input.jumpPressed || dist < 13 || p.grappleTimer <= 0) {
        p.grappleTarget = null;
        p.grappleCooldown = 0.18;
        p.canDoubleJump = true;
        p.canBackflip = false;
        p.vy = GRAPPLE_BOOST_VY;
        p.vx = dist > 1 ? (dx / dist) * 145 : p.facing * 90;
        p.holdJumpTimer = 0.16;
        p.jumpBufferTimer = 0;
        retroAudio.grappleBoost();
        this.addStylePoints(20, 'GRAPPLE', cx, p.y - 4, '#38bdf8');
        this.spawnDust(cx, cy, '#38bdf8', 8);
      } else {
        p.vx = (dx / dist) * GRAPPLE_REEL_SPEED;
        p.vy = (dy / dist) * GRAPPLE_REEL_SPEED;
        p.facing = dx >= 0 ? 1 : -1;
        this.moveAndCollide(dt);
        return;
      }
    }

    // Horizontal Steering
    const dirInput = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (dirInput !== 0 && this.wallJumpLockTimer <= 0) {
      p.facing = dirInput as 1 | -1;
      const accel = p.onGround ? MOVE_ACCEL : AIR_ACCEL;
      p.vx += dirInput * accel * dt;
      if (Math.abs(p.vx) > MAX_RUN_SPEED) {
        p.vx = Math.sign(p.vx) * MAX_RUN_SPEED;
      }
    } else if (this.wallJumpLockTimer <= 0) {
      const friction = p.onGround ? GROUND_FRICTION : GROUND_FRICTION * 0.45;
      if (Math.abs(p.vx) <= friction * dt) {
        p.vx = 0;
      } else {
        p.vx -= Math.sign(p.vx) * friction * dt;
      }
    }

    // Variable jump height (Hold to jump higher!)
    if (p.holdJumpTimer > 0) {
      if (p.jumpHeld && p.vy < 0) {
        p.holdJumpTimer -= dt;
      } else {
        p.holdJumpTimer = 0;
      }
    }
    if (input.jumpReleased && p.vy < -45) {
      p.vy *= 0.5;
      p.holdJumpTimer = 0;
    }

    // Jump Execution: Ground/Coyote -> Wall Hop -> Double Jump -> Backflip!
    if (p.jumpBufferTimer > 0) {
      if (p.onGround || p.coyoteTimer > 0) {
        p.vy = JUMP_VELOCITY;
        p.onGround = false;
        p.coyoteTimer = 0;
        p.jumpBufferTimer = 0;
        p.holdJumpTimer = 0.19;
        p.canDoubleJump = true;
        p.canBackflip = false;
        p.isBackflipping = false;
        retroAudio.jump();
        this.spawnDust(p.x + p.w / 2, p.y + p.h, '#94a3b8', 5);
      } else if (p.onWall !== 0 || p.wallCoyoteTimer > 0) {
        const wDir = p.onWall !== 0 ? p.onWall : p.lastWallDir;
        p.vx = -wDir * WALL_JUMP_VX;
        p.vy = WALL_JUMP_VY;
        p.facing = (-wDir || 1) as 1 | -1;
        p.onWall = 0;
        p.wallCoyoteTimer = 0;
        p.jumpBufferTimer = 0;
        p.holdJumpTimer = 0.19;
        p.canDoubleJump = true;
        p.canBackflip = false;
        p.isBackflipping = false;
        this.wallJumpLockTimer = 0.05;
        retroAudio.wallHop();
        this.spawnDust(p.x + (wDir > 0 ? p.w : 0), p.y + p.h / 2, '#e2e8f0', 6);
      } else if (p.canDoubleJump) {
        p.vy = DOUBLE_JUMP_VY;
        p.canDoubleJump = false;
        p.canBackflip = true;
        p.isBackflipping = false;
        p.jumpBufferTimer = 0;
        p.holdJumpTimer = 0.16;
        retroAudio.doubleJump();
        this.spawnDust(p.x + p.w / 2, p.y + p.h, '#38bdf8', 7);
      } else if (p.canBackflip) {
        p.canBackflip = false;
        p.isBackflipping = true;
        p.backflipTimer = 0.34;
        p.backflipAngle = 0;
        p.vy = BACKFLIP_VY;
        p.vx = -p.facing * BACKFLIP_VX;
        p.jumpBufferTimer = 0;
        p.holdJumpTimer = 0.12;
        this.wallJumpLockTimer = 0.12;
        retroAudio.backflip();
        this.addStylePoints(25, 'BACKFLIP!', p.x + p.w / 2, p.y - 6, '#f43f5e');
        this.spawnDust(p.x + p.w / 2, p.y + p.h / 2, '#fb7185', 8);
      }
    }

    if (p.isBackflipping) {
      p.backflipTimer -= dt;
      p.backflipAngle -= p.facing * Math.PI * 2 * (dt / 0.32);
      if (Math.random() < 0.65) {
        const trailColor = SKINS.find((s) => s.id === this.selectedSkin)?.trailColor || '#fb7185';
        this.afterimages.push({
          x: p.x,
          y: p.y,
          angle: p.backflipAngle,
          facing: p.facing,
          life: 0.16,
          maxLife: 0.16,
          color: trailColor,
        });
      }
      if (p.backflipTimer <= 0) {
        p.isBackflipping = false;
        p.backflipAngle = 0;
      }
    }

    const gravScale = p.holdJumpTimer > 0 && p.vy < 0 ? 0.44 : 1;
    p.vy += GRAVITY * gravScale * dt;

    if (p.onWall !== 0 && p.vy > WALL_SLIDE_SPEED) {
      p.vy = WALL_SLIDE_SPEED;
      if (Math.random() < 0.25) {
        this.spawnDust(p.x + (p.onWall > 0 ? p.w : 0), p.y + p.h * 0.7, '#94a3b8', 1);
      }
    } else if (p.vy > MAX_FALL_SPEED) {
      p.vy = MAX_FALL_SPEED;
    }

    this.moveAndCollide(dt);
    this.checkBouncePads();
  }

  private checkBouncePads() {
    const p = this.player;
    if (p.dead || p.grappleTarget) return;
    for (const bp of this.world.bouncePads) {
      if (bp.compressTimer > 0.08) continue;
      if (this.aabb(p.x, p.y, p.w, p.h, bp.x + 1, bp.y + 4, bp.w - 2, bp.h - 4)) {
        p.y = bp.y + 4 - p.h;
        p.vy = -bp.power;
        p.onGround = false;
        p.ridingPlatformId = null;
        p.coyoteTimer = 0;
        p.holdJumpTimer = 0.09;
        p.canDoubleJump = true;
        p.canBackflip = false;
        p.isBackflipping = false;
        bp.compressTimer = 0.24;
        retroAudio.bouncePad();
        this.addStylePoints(15, 'BOUNCE!', bp.x + bp.w / 2, bp.y - 4, '#84cc16');
        this.spawnDust(bp.x + bp.w / 2, bp.y + 6, '#84cc16', 8);
        this.shake(0.08, 1.2);
        break;
      }
    }
  }

  private moveAndCollide(dt: number) {
    const p = this.player;
    const prevOnGround = p.onGround;
    const prevOnWall = p.onWall;

    p.x += p.vx * dt;
    p.onWall = 0;

    for (const s of this.world.solids) {
      if (this.aabb(p.x, p.y, p.w, p.h, s.x, s.y, s.w, s.h)) {
        if (p.vx > 0) {
          p.x = s.x - p.w;
          p.vx = 0;
          p.onWall = 1;
        } else if (p.vx < 0) {
          p.x = s.x + s.w;
          p.vx = 0;
          p.onWall = -1;
        }
      }
    }

    if (p.onWall === 0 && !p.onGround) {
      for (const s of this.world.solids) {
        if (p.y + p.h > s.y + 2 && p.y < s.y + s.h - 2) {
          if (Math.abs(p.x - (s.x + s.w)) <= 3.5) p.onWall = -1;
          else if (Math.abs(p.x + p.w - s.x) <= 3.5) p.onWall = 1;
        }
      }
    }

    if (p.onWall !== 0) {
      p.lastWallDir = p.onWall;
      p.wallCoyoteTimer = 0.18;
      p.canDoubleJump = true;
      p.canBackflip = false;
    } else if (prevOnWall !== 0) {
      p.wallCoyoteTimer = 0.18;
    }

    const oldBottom = p.y + p.h;
    p.y += p.vy * dt;
    p.onGround = false;
    p.ridingPlatformId = null;

    for (const s of this.world.solids) {
      if (this.aabb(p.x, p.y, p.w, p.h, s.x, s.y, s.w, s.h)) {
        if (p.vy > 0) {
          p.y = s.y - p.h;
          p.vy = 0;
          p.onGround = true;
        } else if (p.vy < 0) {
          p.y = s.y + s.h;
          p.vy = 0;
        }
      }
    }

    if (p.vy >= 0) {
      for (const c of this.world.crumbles) {
        if (c.state === 'broken') continue;
        const horizOverlap = p.x + p.w > c.x + 1 && p.x < c.x + c.w - 1;
        if (horizOverlap && oldBottom <= c.y + 4 && p.y + p.h >= c.y) {
          p.y = c.y - p.h;
          p.vy = 0;
          p.onGround = true;
          if (c.state === 'idle') {
            c.state = 'shaking';
            c.timer = 0.58;
            this.shake(0.1, 1.5);
          }
        }
      }

      for (const m of this.world.movingPlatforms) {
        const horizOverlap = p.x + p.w > m.x + 1 && p.x < m.x + m.w - 1;
        if (horizOverlap && oldBottom <= m.prevY + 6 && p.y + p.h >= m.y - 1) {
          p.y = m.y - p.h;
          p.vy = 0;
          p.onGround = true;
          p.ridingPlatformId = m.id;
        }
      }
    }

    if (p.onGround) {
      p.coyoteTimer = 0.16;
      p.canDoubleJump = true;
      p.canBackflip = false;
      p.isBackflipping = false;
    } else if (prevOnGround && p.vy >= 0) {
      p.coyoteTimer = 0.16;
    }
  }

  private checkPickups() {
    const p = this.player;
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;

    for (const g of this.world.gems) {
      if (g.collected) continue;
      if (Math.hypot(cx - g.x, cy - g.y) < 13) {
        g.collected = true;
        this.gemsCollected++;
        this.totalGems++;
        try {
          localStorage.setItem(STORAGE_GEMS, String(this.totalGems));
        } catch {
          // ignore
        }
        retroAudio.gem();
        this.addStylePoints(50, '+50 GEM', g.x, g.y - 6, '#38bdf8');
        this.spawnDust(g.x, g.y, '#bae6fd', 8);
      }
    }
  }

  private checkHazards() {
    const p = this.player;
    const hx = p.x + 2;
    const hy = p.y + 2;
    const hw = p.w - 4;
    const hh = p.h - 4;
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;

    // 1. Spikes
    for (const s of this.world.spikes) {
      let sx = s.x + 2;
      let sy = s.y + 2;
      let sw = TILE - 4;
      let sh = TILE - 4;
      if (s.dir === 'up') {
        sy = s.y + 7;
        sh = 9;
      } else if (s.dir === 'down') {
        sy = s.y;
        sh = 9;
      } else if (s.dir === 'left') {
        sx = s.x;
        sw = 9;
      } else if (s.dir === 'right') {
        sx = s.x + 7;
        sw = 9;
      }
      if (this.aabb(hx, hy, hw, hh, sx, sy, sw, sh)) {
        this.killPlayer('Impaled by Spikes');
        return;
      }
    }

    // 2. Sawblades
    for (const saw of this.world.saws) {
      if (Math.hypot(cx - saw.x, cy - saw.y) < saw.radius + 3.5) {
        this.killPlayer('Sliced by Sawblade');
        return;
      }
    }

    // 3. Lasers (Horizontal & Vertical)
    for (const l of this.world.lasers) {
      if (l.state === 'firing') {
        if (l.orientation === 'horizontal') {
          if (this.aabb(hx, hy, hw, hh, l.xStart, l.y + 5, l.xEnd - l.xStart, 6)) {
            this.killPlayer('Vaporized by Laser');
            return;
          }
        } else {
          if (this.aabb(hx, hy, hw, hh, l.x + 5, l.yStart, 6, l.yEnd - l.yStart)) {
            this.killPlayer('Vaporized by Laser');
            return;
          }
        }
      }
    }

    // 4. Firebars
    for (const f of this.world.firebars) {
      for (let i = 1; i <= f.length; i++) {
        const fx = f.pivotX + Math.cos(f.angle) * i * f.spacing;
        const fy = f.pivotY + Math.sin(f.angle) * i * f.spacing;
        if (Math.hypot(cx - fx, cy - fy) < 6.5) {
          this.killPlayer('Scorched by Firebar');
          return;
        }
      }
    }

    // 5. Darts from Dart Turrets
    for (const d of this.world.darts) {
      if (Math.hypot(cx - d.x, cy - d.y) < 5.2) {
        this.killPlayer('Struck by Dart');
        return;
      }
    }

    // 6. Cave Bats
    for (const b of this.world.bats) {
      if (Math.hypot(cx - b.x, cy - b.y) < 7.2) {
        this.killPlayer('Ambushed by Cave Bat');
        return;
      }
    }

    // 7. Rising Magma / Abyss Fall
    if (this.magmaActive && p.y + p.h > this.magmaY + 4) {
      this.killPlayer('Consumed by Rising Magma');
      return;
    }
    if (p.y > this.cameraY + VIRTUAL_H + 18) {
      this.killPlayer('Fell into the Abyss');
    }
  }

  private killPlayer(reason: string) {
    this.player.dead = true;
    this.deathReason = reason;
    this.state = 'GAME_OVER';
    retroAudio.death();
    this.shake(0.32, 4.5);
    this.spawnDust(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, '#ef4444', 18);
    this.spawnDust(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, '#fbbf24', 10);

    try {
      localStorage.setItem(STORAGE_BEST_SCORE, String(this.bestScore));
      localStorage.setItem(STORAGE_BEST_ALT, String(this.bestAltitudeMeters));
    } catch {
      // ignore
    }

    this.emitHud();
  }

  private addStylePoints(base: number, label: string, x: number, y: number, color: string) {
    this.comboCount++;
    this.comboTimer = 2.8;
    const mult = Math.min(4, 1 + Math.floor((this.comboCount - 1) / 2));
    const pts = base * mult;
    this.styleScore += pts;
    this.popups.push({
      x,
      y,
      text: mult > 1 ? `${label} x${mult}` : label,
      color,
      life: 0.75,
      maxLife: 0.75,
    });
  }

  private findNearestRing(pointerX: number | null, pointerY: number | null): GrappleRing | null {
    const p = this.player;
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    let best: GrappleRing | null = null;
    let bestScore = Infinity;

    for (const r of this.world.rings) {
      const distPlayer = Math.hypot(r.x - cx, r.y - cy);
      if (distPlayer > GRAPPLE_RANGE) continue;

      if (pointerX !== null && pointerY !== null) {
        const distPointer = Math.hypot(r.x - pointerX, r.y - pointerY);
        if (distPointer < bestScore) {
          bestScore = distPointer;
          best = r;
        }
      } else {
        const verticalBias = r.y <= cy + 16 ? 0 : 60;
        const score = distPlayer + verticalBias;
        if (score < bestScore) {
          bestScore = score;
          best = r;
        }
      }
    }
    return best;
  }

  private spawnDust(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 25 + Math.random() * 85;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 15,
        life: 0.22 + Math.random() * 0.25,
        maxLife: 0.45,
        color,
        size: Math.random() < 0.5 ? 2 : 1,
      });
    }
  }

  private updateParticles(dt: number) {
    for (const pt of this.particles) {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 180 * dt;
      pt.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    for (const a of this.afterimages) {
      a.life -= dt;
    }
    this.afterimages = this.afterimages.filter((a) => a.life > 0);

    for (const pop of this.popups) {
      pop.y -= 24 * dt;
      pop.life -= dt;
    }
    this.popups = this.popups.filter((p) => p.life > 0);
  }

  private shake(duration: number, intensity: number) {
    this.shakeTimer = Math.max(this.shakeTimer, duration);
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  private aabb(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  public emitHud() {
    const alt = this.getAltitudeMeters();
    const magmaDist = this.magmaActive
      ? Math.max(0, Math.round((this.magmaY - (this.player.y + this.player.h)) / TILE))
      : 99;
    this.onHudUpdate({
      gameState: this.state,
      score: this.score,
      bestScore: this.bestScore,
      altitudeMeters: alt,
      bestAltitudeMeters: this.bestAltitudeMeters,
      wingsCleared: this.wingsCleared,
      gemsCollected: this.gemsCollected,
      totalGems: this.totalGems,
      selectedSkin: this.selectedSkin,
      unlockedSkins: this.unlockedSkins,
      comboCount: this.comboCount,
      deathReason: this.deathReason,
      canDoubleJump: this.player.canDoubleJump,
      canBackflip: this.player.canBackflip,
      grappleReady: this.nearestRing !== null && !this.player.grappleTarget,
      wallContact: this.player.onWall !== 0,
      risingHazardDistance: magmaDist,
    });
  }

  public render(ctx: CanvasRenderingContext2D) {
    const atlas = getSpriteAtlas();
    ctx.imageSmoothingEnabled = false;

    // Deep obsidian pixel cavern background
    ctx.fillStyle = '#0d111a';
    ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);

    // Infinite 2D parallax pixel brick background grid
    const bgOffsetX = Math.floor(-this.cameraX * 0.35) % 32;
    const bgOffsetY = Math.floor(-this.cameraY * 0.35) % 32;
    ctx.fillStyle = '#131926';
    for (let y = bgOffsetY - 32; y < VIRTUAL_H + 32; y += 32) {
      for (let x = bgOffsetX - 32; x < VIRTUAL_W + 32; x += 32) {
        ctx.fillRect(x, y, 30, 14);
        ctx.fillRect(x + 16, y + 16, 14, 14);
        ctx.fillRect(x, y + 16, 14, 14);
      }
    }

    // Subtle altitude markers every 10m
    const minRow = Math.floor((this.cameraY - 32) / TILE);
    const maxRow = Math.ceil((this.cameraY + VIRTUAL_H + 32) / TILE);
    ctx.font = '8px monospace';
    for (let row = minRow; row <= maxRow; row++) {
      const worldY = row * TILE;
      const meters = Math.round((this.startY - worldY) / TILE);
      if (meters > 0 && meters % 10 === 0) {
        const sy = Math.round(worldY - this.cameraY);
        ctx.fillStyle = '#1b2434';
        ctx.fillRect(0, sy, VIRTUAL_W, 1);
        ctx.fillStyle = '#475569';
        ctx.fillText(`${meters}M`, 20, sy - 3);
      }
    }

    ctx.save();
    const sx = this.shakeTimer > 0 ? Math.round((Math.random() - 0.5) * this.shakeIntensity * 2) : 0;
    const sy = this.shakeTimer > 0 ? Math.round((Math.random() - 0.5) * this.shakeIntensity * 2) : 0;
    const camX = Math.round(this.cameraX) + sx;
    const camY = Math.round(this.cameraY) + sy;
    ctx.translate(-camX, -camY);

    const viewLeft = camX - 32;
    const viewRight = camX + VIRTUAL_W + 32;
    const viewTop = camY - 32;
    const viewBottom = camY + VIRTUAL_H + 32;

    // 0. Direction Signs on back wall
    for (const sign of this.world.signs) {
      if (sign.x + TILE < viewLeft || sign.x > viewRight || sign.y + TILE < viewTop || sign.y > viewBottom) continue;
      ctx.drawImage(atlas[`sign_${sign.dir}`], sign.x, sign.y);
    }

    // 1. Solid tiles (16x16 tiled)
    for (const s of this.world.solids) {
      if (s.x + s.w < viewLeft || s.x > viewRight || s.y + s.h < viewTop || s.y > viewBottom) continue;
      const sprite: SpriteName =
        s.kind === 'wall' ? 'wall_brick' : s.kind === 'pillar' ? 'pillar_brick' : 'ledge_brick';
      for (let tx = s.x; tx < s.x + s.w; tx += TILE) {
        for (let ty = s.y; ty < s.y + s.h; ty += TILE) {
          ctx.drawImage(atlas[sprite], tx, ty);
        }
      }
    }

    // 2. Crumble platforms
    for (const c of this.world.crumbles) {
      if (c.x + c.w < viewLeft || c.x > viewRight || c.y + c.h < viewTop || c.y > viewBottom) continue;
      if (c.state === 'broken') {
        ctx.strokeStyle = 'rgba(180, 83, 9, 0.25)';
        ctx.strokeRect(c.x + 0.5, c.y + 0.5, c.w - 1, TILE - 1);
        continue;
      }
      let sprite: SpriteName = 'crumble_0';
      let jitterX = 0;
      if (c.state === 'shaking') {
        sprite = c.timer < 0.25 ? 'crumble_2' : 'crumble_1';
        jitterX = Math.round(Math.sin(this.time * 65) * 1.5);
      }
      for (let tx = c.x; tx < c.x + c.w; tx += TILE) {
        ctx.drawImage(atlas[sprite], tx + jitterX, c.y);
      }
    }

    // 2b. Moving Platforms + Rail Tracks
    for (const m of this.world.movingPlatforms) {
      if (
        m.x + m.w < viewLeft - 64 ||
        m.x > viewRight + 64 ||
        m.y + m.h < viewTop - 64 ||
        m.y > viewBottom + 64
      ) {
        continue;
      }
      if (m.moveX > 0 || m.moveY > 0) {
        ctx.fillStyle = '#1e293b';
        const trackX = Math.round(m.baseX - m.moveX + m.w / 2);
        const trackY = Math.round(m.baseY - m.moveY + 5);
        ctx.fillRect(
          trackX,
          trackY,
          Math.max(2, Math.round(m.moveX * 2)),
          Math.max(2, Math.round(m.moveY * 2))
        );
      }
      const mx = Math.round(m.x);
      const my = Math.round(m.y);
      for (let tx = 0; tx < m.w; tx += TILE) {
        ctx.drawImage(atlas.moving_plat, mx + tx, my);
      }
    }

    // 2c. Bounce Pads
    for (const bp of this.world.bouncePads) {
      if (bp.x + bp.w < viewLeft || bp.x > viewRight || bp.y + bp.h < viewTop || bp.y > viewBottom) continue;
      const sprite: SpriteName = bp.compressTimer > 0.08 ? 'bounce_active' : 'bounce_idle';
      ctx.drawImage(atlas[sprite], Math.round(bp.x), Math.round(bp.y));
    }

    // 3. Spikes
    for (const sp of this.world.spikes) {
      if (sp.x + TILE < viewLeft || sp.x > viewRight || sp.y + TILE < viewTop || sp.y > viewBottom) continue;
      ctx.drawImage(atlas[`spike_${sp.dir}`], sp.x, sp.y);
    }

    // 4. Sawblade tracks + spinning saws
    const sawFrame: SpriteName = Math.floor(this.time * 18) % 2 === 0 ? 'saw_0' : 'saw_1';
    for (const saw of this.world.saws) {
      if (saw.x < viewLeft - 48 || saw.x > viewRight + 48 || saw.y < viewTop - 48 || saw.y > viewBottom + 48) continue;
      if (saw.moveX > 0 || saw.moveY > 0) {
        ctx.fillStyle = '#334155';
        ctx.fillRect(
          Math.round(saw.baseX - saw.moveX),
          Math.round(saw.baseY - saw.moveY) - 1,
          Math.max(2, Math.round(saw.moveX * 2)),
          Math.max(2, Math.round(saw.moveY * 2))
        );
      }
      ctx.drawImage(atlas[sawFrame], Math.round(saw.x - 8), Math.round(saw.y - 8));
    }

    // 5. Lasers (Horizontal & Vertical)
    for (const l of this.world.lasers) {
      if (l.xEnd < viewLeft || l.xStart > viewRight || l.yEnd < viewTop - 16 || l.yStart > viewBottom + 16) continue;
      const emitterSprite: SpriteName =
        l.state === 'firing' ? 'laser_fire' : l.state === 'warning' ? 'laser_warn' : 'laser_idle';

      if (l.orientation === 'horizontal') {
        ctx.drawImage(atlas[emitterSprite], l.xStart - TILE, l.y);
        ctx.drawImage(atlas[emitterSprite], l.xEnd, l.y);
        if (l.state === 'warning' && Math.floor(this.time * 24) % 2 === 0) {
          ctx.fillStyle = 'rgba(251, 191, 36, 0.75)';
          ctx.fillRect(l.xStart, l.y + 7, l.xEnd - l.xStart, 2);
        } else if (l.state === 'firing') {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
          ctx.fillRect(l.xStart, l.y + 3, l.xEnd - l.xStart, 10);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(l.xStart, l.y + 5, l.xEnd - l.xStart, 6);
          ctx.fillStyle = '#fef3c7';
          ctx.fillRect(l.xStart, l.y + 7, l.xEnd - l.xStart, 2);
        }
      } else {
        ctx.drawImage(atlas[emitterSprite], l.x, l.yStart - TILE);
        ctx.drawImage(atlas[emitterSprite], l.x, l.yEnd);
        if (l.state === 'warning' && Math.floor(this.time * 24) % 2 === 0) {
          ctx.fillStyle = 'rgba(251, 191, 36, 0.75)';
          ctx.fillRect(l.x + 7, l.yStart, 2, l.yEnd - l.yStart);
        } else if (l.state === 'firing') {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
          ctx.fillRect(l.x + 3, l.yStart, 10, l.yEnd - l.yStart);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(l.x + 5, l.yStart, 6, l.yEnd - l.yStart);
          ctx.fillStyle = '#fef3c7';
          ctx.fillRect(l.x + 7, l.yStart, 2, l.yEnd - l.yStart);
        }
      }
    }

    // 6. Firebars
    const fireFrame: SpriteName = Math.floor(this.time * 12) % 2 === 0 ? 'fireball_0' : 'fireball_1';
    for (const f of this.world.firebars) {
      if (f.pivotX < viewLeft - 64 || f.pivotX > viewRight + 64 || f.pivotY < viewTop - 64 || f.pivotY > viewBottom + 64) {
        continue;
      }
      ctx.drawImage(atlas.fire_pivot, Math.round(f.pivotX - 8), Math.round(f.pivotY - 8));
      for (let i = 1; i <= f.length; i++) {
        const fx = Math.round(f.pivotX + Math.cos(f.angle) * i * f.spacing - 8);
        const fy = Math.round(f.pivotY + Math.sin(f.angle) * i * f.spacing - 8);
        ctx.drawImage(atlas[fireFrame], fx, fy);
      }
    }

    // 7. Dart Turrets & Darts
    for (const t of this.world.turrets) {
      if (t.x + TILE < viewLeft || t.x > viewRight || t.y + TILE < viewTop || t.y > viewBottom) continue;
      const isWarning = t.timer <= 0.28;
      const sprite: SpriteName = isWarning ? `turret_warn_${t.dir}` : `turret_${t.dir}`;
      ctx.drawImage(atlas[sprite], t.x, t.y);
    }

    for (const d of this.world.darts) {
      if (d.x < viewLeft || d.x > viewRight || d.y < viewTop || d.y > viewBottom) continue;
      ctx.drawImage(atlas[`dart_${d.dir}`], Math.round(d.x - 8), Math.round(d.y - 8));
    }

    // 7b. Cave Bats & Subtle 4x4 Aggro Indicator
    for (const b of this.world.bats) {
      if (b.x < viewLeft - 24 || b.x > viewRight + 24 || b.y < viewTop - 24 || b.y > viewBottom + 24) continue;
      let sprite: SpriteName = 'bat_perch';
      if (b.state === 'telegraph' || b.state === 'diving') {
        sprite = 'bat_dive';
      } else if (b.state === 'returning' || b.state === 'cooldown') {
        sprite = Math.floor(this.time * 12) % 2 === 0 ? 'bat_fly_0' : 'bat_fly_1';
      }
      ctx.drawImage(atlas[sprite], Math.round(b.x - 8), Math.round(b.y - 8));

      if (b.state === 'telegraph') {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(Math.round(b.x - 1), Math.round(b.y - 12), 2, 3);
      }
    }

    // 8. Grapple Rings + Active Targeting Reticle
    for (const r of this.world.rings) {
      if (r.x < viewLeft || r.x > viewRight || r.y < viewTop || r.y > viewBottom) continue;
      const isTarget = this.nearestRing?.id === r.id || this.player.grappleTarget?.id === r.id;
      ctx.drawImage(atlas[isTarget ? 'grapple_ring_active' : 'grapple_ring'], Math.round(r.x - 8), Math.round(r.y - 8));
      if (isTarget && !this.player.grappleTarget) {
        const rx = Math.round(r.x - 10);
        const ry = Math.round(r.y - 10);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(rx, ry, 4, 1);
        ctx.fillRect(rx, ry, 1, 4);
        ctx.fillRect(rx + 16, ry, 4, 1);
        ctx.fillRect(rx + 19, ry, 1, 4);
        ctx.fillRect(rx, ry + 19, 4, 1);
        ctx.fillRect(rx, ry + 16, 1, 4);
        ctx.fillRect(rx + 16, ry + 19, 4, 1);
        ctx.fillRect(rx + 19, ry + 16, 1, 4);
      }
    }

    // 9. Gems
    const gemFrame: SpriteName = Math.floor(this.time * 6) % 2 === 0 ? 'gem_0' : 'gem_1';
    for (const g of this.world.gems) {
      if (g.collected || g.x < viewLeft || g.x > viewRight || g.y < viewTop || g.y > viewBottom) continue;
      const bob = Math.round(Math.sin(this.time * 4 + g.bobOffset) * 2);
      ctx.drawImage(atlas[gemFrame], Math.round(g.x - 8), Math.round(g.y - 8 + bob));
    }

    // 10. Grapple Chain Line
    if (this.player.grappleTarget) {
      const px = Math.round(this.player.x + this.player.w / 2);
      const py = Math.round(this.player.y + this.player.h / 2);
      const rx = Math.round(this.player.grappleTarget.x);
      const ry = Math.round(this.player.grappleTarget.y);
      const steps = Math.max(4, Math.floor(Math.hypot(rx - px, ry - py) / 3));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const lx = Math.round(px + (rx - px) * t);
        const ly = Math.round(py + (ry - py) * t);
        ctx.fillStyle = i % 2 === 0 ? '#bae6fd' : '#0284c7';
        ctx.fillRect(lx - 1, ly - 1, 2, 2);
      }
    }

    // 11. Backflip Afterimages
    const flipSprite = getSkinSprite(this.selectedSkin, 'flip');
    for (const a of this.afterimages) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, (a.life / a.maxLife) * 0.55);
      ctx.translate(Math.round(a.x + this.player.w / 2), Math.round(a.y + this.player.h / 2));
      ctx.rotate(a.angle);
      ctx.scale(a.facing, 1);
      ctx.drawImage(flipSprite, -8, -8);
      ctx.restore();
    }

    // 12. Player Sprite (using selected Skin)
    if (!this.player.dead) {
      const p = this.player;
      let pose: PlayerPose = 'idle';
      let drawFacing = p.facing;

      if (p.grappleTarget) {
        pose = 'grapple';
      } else if (p.isBackflipping) {
        pose = 'flip';
      } else if (p.onWall !== 0) {
        pose = 'wall';
        drawFacing = (-p.onWall) as 1 | -1;
      } else if (!p.onGround) {
        pose = 'jump';
      } else if (Math.abs(p.vx) > 14) {
        pose = Math.floor(p.animTimer * 10) % 2 === 0 ? 'run_0' : 'run_1';
      }

      const skinCanvas = getSkinSprite(this.selectedSkin, pose);
      ctx.save();
      ctx.translate(Math.round(p.x + p.w / 2), Math.round(p.y + p.h - 8));
      if (p.isBackflipping) {
        ctx.rotate(p.backflipAngle);
      }
      ctx.scale(drawFacing, 1);
      ctx.drawImage(skinCanvas, -8, -8);
      ctx.restore();
    }

    // 13. Particles & Popups
    for (const pt of this.particles) {
      ctx.fillStyle = pt.color;
      ctx.fillRect(Math.round(pt.x), Math.round(pt.y), pt.size, pt.size);
    }

    for (const pop of this.popups) {
      ctx.fillStyle = pop.color;
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(pop.text, Math.round(pop.x), Math.round(pop.y));
    }
    ctx.textAlign = 'left';

    // 14. Rising Magma Floor spanning active horizontal camera
    if (this.magmaActive && this.magmaY < camY + VIRTUAL_H + 32) {
      const my = Math.round(this.magmaY);
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(camX - 16, my + 4, VIRTUAL_W + 32, camY + VIRTUAL_H - my + 32);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(camX - 16, my + 2, VIRTUAL_W + 32, 4);
      for (let x = camX - 16; x < camX + VIRTUAL_W + 16; x += 8) {
        const wave = Math.round(Math.sin(this.time * 7 + x * 0.25) * 2);
        ctx.fillStyle = '#f97316';
        ctx.fillRect(x, my + wave, 6, 3);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(x + 2, my + wave, 2, 1);
      }
    }

    ctx.restore();

    // Bottom edge warning glow if magma is just below the screen
    if (this.magmaActive) {
      const distBelow = this.magmaY - (this.cameraY + VIRTUAL_H);
      if (distBelow > 0 && distBelow < 70) {
        const alpha = Math.max(0.1, (1 - distBelow / 70) * 0.4);
        ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
        ctx.fillRect(0, VIRTUAL_H - 6, VIRTUAL_W, 6);
      }
    }
  }
}
