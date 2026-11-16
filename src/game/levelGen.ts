import {
  AcidDrip,
  AcidDrop,
  Bat,
  BouncePad,
  CrumblePlatform,
  Crusher,
  Dart,
  DartTurret,
  DirectionSign,
  Firebar,
  FlameJet,
  Gem,
  GrappleRing,
  Laser,
  MovingPlatform,
  Pendulum,
  Sawblade,
  ShockCoil,
  SolidTile,
  Spike,
  TILE,
  VIRTUAL_W,
} from './types';

export interface CameraBoundsSlice {
  yTop: number;
  yBottom: number;
  xMin: number;
  xMax: number;
}

export interface WorldEntities {
  solids: SolidTile[];
  crumbles: CrumblePlatform[];
  movingPlatforms: MovingPlatform[];
  bouncePads: BouncePad[];
  spikes: Spike[];
  saws: Sawblade[];
  lasers: Laser[];
  firebars: Firebar[];
  turrets: DartTurret[];
  darts: Dart[];
  bats: Bat[];
  crushers: Crusher[];
  flameJets: FlameJet[];
  shockCoils: ShockCoil[];
  acidDrips: AcidDrip[];
  acidDrops: AcidDrop[];
  pendulums: Pendulum[];
  rings: GrappleRing[];
  gems: Gem[];
  signs: DirectionSign[];
  cameraSlices: CameraBoundsSlice[];
}

export type VerticalArchetype =
  | 'zig_zag'
  | 'split_chimney'
  | 'gauntlet_pit'
  | 'spring_tower'
  | 'hybrid_ledge'
  | 'wall_hop_narrow'
  | 'staggered_alcoves'
  | 'twin_elevator_atrium';

export type WingArchetype =
  | 'bridge_run'
  | 'ferry_crossing'
  | 'bounce_ceiling_sprint'
  | 'stepped_terrace'
  | 'split_deck_corridor';

function createMulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export class LevelGenerator {
  private nextId = 1;
  private chunkIndex = 0;
  private chunksSinceWing = 0;
  private nextWingInterval = 2;
  private lastWingDir: -1 | 1 = 1;
  private lastExitCol = 8;
  private recentArchetypes: VerticalArchetype[] = [];
  private lastWingArchetype: WingArchetype | null = null;
  private rng: () => number = Math.random;
  public shaftX = 0;
  public topGeneratedY = 0;
  public totalWingsSpawned = 0;

  public uid(): number {
    return this.nextId++;
  }

  public setSeed(seed?: number) {
    if (typeof seed === 'number' && Number.isFinite(seed)) {
      this.rng = createMulberry32(Math.floor(seed));
    } else {
      this.rng = Math.random;
    }
  }

  private rand(): number {
    return this.rng();
  }

  private randInt(min: number, max: number): number {
    return Math.floor(this.rand() * (max - min + 1)) + min;
  }

  private pick<T>(arr: T[]): T {
    return arr[Math.floor(this.rand() * arr.length)];
  }

  public reset(world: WorldEntities, startBottomY: number) {
    this.nextId = 1;
    this.chunkIndex = 0;
    this.chunksSinceWing = 0;
    this.nextWingInterval = this.randInt(2, 3);
    this.lastWingDir = this.rand() < 0.5 ? 1 : -1;
    this.lastExitCol = 8;
    this.recentArchetypes = [];
    this.lastWingArchetype = null;
    this.shaftX = 0;
    this.totalWingsSpawned = 0;

    world.solids.push({
      id: this.uid(),
      x: 0,
      y: startBottomY - TILE,
      w: VIRTUAL_W,
      h: TILE,
      kind: 'wall',
    });

    const starterRows = this.randInt(11, 13);
    for (let y = startBottomY - TILE * 2; y >= startBottomY - TILE * starterRows; y -= TILE) {
      this.addOuterWalls(world, this.shaftX, y);
    }

    world.cameraSlices.push({
      yTop: startBottomY - TILE * starterRows,
      yBottom: startBottomY + 120,
      xMin: 0,
      xMax: VIRTUAL_W,
    });

    // 4 structurally distinct starter chambers so every new climb opens differently
    const starterVariant = this.randInt(0, 3);
    const flipStart = this.rand() < 0.5;

    if (starterVariant === 0) {
      // Variant 0: Courtyard Bounce Vault
      const lowCol = flipStart ? this.randInt(9, 11) : this.randInt(2, 4);
      const highCol = flipStart ? this.randInt(2, 4) : this.randInt(9, 11);
      const topCol = this.randInt(5, 8);
      const padCol = flipStart ? this.randInt(2, 4) : this.randInt(11, 13);

      world.solids.push(
        { id: this.uid(), x: TILE * lowCol, y: startBottomY - TILE * 4, w: TILE * 3, h: TILE, kind: 'ledge' },
        { id: this.uid(), x: TILE * highCol, y: startBottomY - TILE * 7, w: TILE * 3, h: TILE, kind: 'ledge' }
      );
      world.crumbles.push({
        id: this.uid(),
        x: TILE * topCol,
        y: startBottomY - TILE * 10,
        w: TILE * 3,
        h: TILE,
        state: 'idle',
        timer: 0,
        respawnTimer: 0,
      });
      world.rings.push({
        id: this.uid(),
        x: TILE * this.randInt(6, 10),
        y: startBottomY - TILE * (7 + this.rand() * 1.2),
      });
      world.bouncePads.push({
        id: this.uid(),
        x: TILE * padCol,
        y: startBottomY - TILE * 2,
        w: TILE,
        h: TILE,
        power: 345,
        compressTimer: 0,
      });
      world.gems.push(
        { id: this.uid(), x: TILE * (lowCol + 1.5), y: startBottomY - TILE * 5.2, collected: false, bobOffset: 0 },
        { id: this.uid(), x: TILE * (padCol + 0.5), y: startBottomY - TILE * 5.2, collected: false, bobOffset: 1.4 },
        { id: this.uid(), x: TILE * (topCol + 1.5), y: startBottomY - TILE * 11.2, collected: false, bobOffset: 2.8 }
      );
      this.lastExitCol = topCol + 1;
    } else if (starterVariant === 1) {
      // Variant 1: Wall-Hop Chimney Entry with inward stone buttresses
      const leftInward = flipStart ? 2 : 1;
      const rightInward = flipStart ? 1 : 2;
      for (let r = 3; r <= 7; r++) {
        world.solids.push({
          id: this.uid(),
          x: TILE * leftInward,
          y: startBottomY - TILE * r,
          w: TILE,
          h: TILE,
          kind: 'pillar',
        });
        world.solids.push({
          id: this.uid(),
          x: VIRTUAL_W - TILE * (rightInward + 1),
          y: startBottomY - TILE * (r + 1),
          w: TILE,
          h: TILE,
          kind: 'pillar',
        });
      }
      const midCol = this.randInt(5, 8);
      world.solids.push(
        { id: this.uid(), x: TILE * (flipStart ? 3 : 10), y: startBottomY - TILE * 3, w: TILE * 3, h: TILE, kind: 'ledge' },
        { id: this.uid(), x: TILE * midCol, y: startBottomY - TILE * 9, w: TILE * 3, h: TILE, kind: 'ledge' }
      );
      world.rings.push(
        { id: this.uid(), x: VIRTUAL_W / 2, y: startBottomY - TILE * 6 },
        { id: this.uid(), x: TILE * (flipStart ? 11 : 5), y: startBottomY - TILE * 9.5 }
      );
      world.gems.push(
        { id: this.uid(), x: VIRTUAL_W / 2, y: startBottomY - TILE * 4.5, collected: false, bobOffset: 0.3 },
        { id: this.uid(), x: VIRTUAL_W / 2, y: startBottomY - TILE * 7.5, collected: false, bobOffset: 1.4 },
        { id: this.uid(), x: TILE * (midCol + 1.5), y: startBottomY - TILE * 10.5, collected: false, bobOffset: 2.5 }
      );
      this.lastExitCol = midCol + 1;
    } else if (starterVariant === 2) {
      // Variant 2: Pillar & Moving Ferry Atrium
      const pillarCol = flipStart ? 7 : 8;
      for (let r = 4; r <= 8; r++) {
        world.solids.push({
          id: this.uid(),
          x: TILE * pillarCol,
          y: startBottomY - TILE * r,
          w: TILE,
          h: TILE,
          kind: 'pillar',
        });
      }
      world.solids.push(
        { id: this.uid(), x: TILE * 2, y: startBottomY - TILE * 4, w: TILE * 3, h: TILE, kind: 'ledge' },
        { id: this.uid(), x: VIRTUAL_W - TILE * 5, y: startBottomY - TILE * 4, w: TILE * 3, h: TILE, kind: 'ledge' }
      );
      const ferryBaseX = VIRTUAL_W / 2 - TILE * 1.5;
      world.movingPlatforms.push({
        id: this.uid(),
        baseX: ferryBaseX,
        baseY: startBottomY - TILE * 8.5,
        x: ferryBaseX,
        y: startBottomY - TILE * 8.5,
        prevX: ferryBaseX,
        prevY: startBottomY - TILE * 8.5,
        w: TILE * 3,
        h: TILE,
        moveX: 38,
        moveY: 0,
        speed: 1.35,
        phase: flipStart ? 0 : Math.PI,
      });
      world.rings.push(
        { id: this.uid(), x: TILE * 4.5, y: startBottomY - TILE * 7 },
        { id: this.uid(), x: VIRTUAL_W - TILE * 4.5, y: startBottomY - TILE * 7 }
      );
      world.gems.push(
        { id: this.uid(), x: TILE * 3.5, y: startBottomY - TILE * 5.2, collected: false, bobOffset: 0.2 },
        { id: this.uid(), x: VIRTUAL_W - TILE * 3.5, y: startBottomY - TILE * 5.2, collected: false, bobOffset: 1.5 },
        { id: this.uid(), x: VIRTUAL_W / 2, y: startBottomY - TILE * 10.2, collected: false, bobOffset: 2.6 }
      );
      this.lastExitCol = 8;
    } else {
      // Variant 3: Split Crumble Terraces with Dual Bounce Launchers
      world.solids.push(
        { id: this.uid(), x: TILE * 2, y: startBottomY - TILE * 3, w: TILE * 2, h: TILE, kind: 'ledge' },
        { id: this.uid(), x: VIRTUAL_W - TILE * 4, y: startBottomY - TILE * 3, w: TILE * 2, h: TILE, kind: 'ledge' }
      );
      world.bouncePads.push(
        { id: this.uid(), x: TILE * 2.5, y: startBottomY - TILE * 4, w: TILE, h: TILE, power: 340, compressTimer: 0 },
        { id: this.uid(), x: VIRTUAL_W - TILE * 3.5, y: startBottomY - TILE * 4, w: TILE, h: TILE, power: 340, compressTimer: 0 }
      );
      const midTopCol = this.randInt(5, 8);
      world.crumbles.push(
        {
          id: this.uid(),
          x: TILE * (flipStart ? 3 : 10),
          y: startBottomY - TILE * 7,
          w: TILE * 3,
          h: TILE,
          state: 'idle',
          timer: 0,
          respawnTimer: 0,
        },
        {
          id: this.uid(),
          x: TILE * midTopCol,
          y: startBottomY - TILE * 10,
          w: TILE * 3,
          h: TILE,
          state: 'idle',
          timer: 0,
          respawnTimer: 0,
        }
      );
      world.rings.push({ id: this.uid(), x: VIRTUAL_W / 2, y: startBottomY - TILE * 7.5 });
      world.gems.push(
        { id: this.uid(), x: TILE * 3, y: startBottomY - TILE * 6, collected: false, bobOffset: 0.4 },
        { id: this.uid(), x: VIRTUAL_W - TILE * 3, y: startBottomY - TILE * 6, collected: false, bobOffset: 1.6 },
        { id: this.uid(), x: TILE * (midTopCol + 1.5), y: startBottomY - TILE * 11.2, collected: false, bobOffset: 2.9 }
      );
      this.lastExitCol = midTopCol + 1;
    }

    this.topGeneratedY = startBottomY - TILE * starterRows;
  }

  private addOuterWalls(world: WorldEntities, leftX: number, y: number) {
    world.solids.push(
      { id: this.uid(), x: leftX, y, w: TILE, h: TILE, kind: 'wall' },
      { id: this.uid(), x: leftX + VIRTUAL_W - TILE, y, w: TILE, h: TILE, kind: 'wall' }
    );
  }

  public ensureGeneratedUpTo(world: WorldEntities, targetTopY: number) {
    while (this.topGeneratedY > targetTopY) {
      if (this.chunksSinceWing >= this.nextWingInterval) {
        this.generateHorizontalWing(world);
        this.chunksSinceWing = 0;
        this.nextWingInterval = this.randInt(2, 4);
      } else {
        this.generateVerticalChunk(world);
        this.chunksSinceWing++;
      }
    }
  }

  public pruneBelow(world: WorldEntities, cutoffY: number) {
    world.solids = world.solids.filter((s) => s.y < cutoffY);
    world.crumbles = world.crumbles.filter((c) => c.y < cutoffY);
    world.movingPlatforms = world.movingPlatforms.filter((m) => m.baseY < cutoffY + 80);
    world.bouncePads = world.bouncePads.filter((bp) => bp.y < cutoffY);
    world.spikes = world.spikes.filter((s) => s.y < cutoffY);
    world.saws = world.saws.filter((s) => s.baseY < cutoffY + 64);
    world.lasers = world.lasers.filter((l) => l.y < cutoffY + 120);
    world.firebars = world.firebars.filter((f) => f.pivotY < cutoffY + 96);
    world.turrets = world.turrets.filter((t) => t.y < cutoffY + 64);
    world.bats = world.bats.filter((b) => b.homeY < cutoffY + 96);
    world.crushers = world.crushers.filter((cr) => cr.homeY < cutoffY + 96);
    world.flameJets = world.flameJets.filter((fj) => fj.y < cutoffY + 64);
    world.shockCoils = world.shockCoils.filter((sc) => Math.max(sc.ay, sc.by) < cutoffY + 96);
    world.acidDrips = world.acidDrips.filter((ad) => ad.y < cutoffY + 64);
    world.acidDrops = world.acidDrops.filter((drop) => drop.y < cutoffY + 64);
    world.pendulums = world.pendulums.filter((pm) => pm.pivotY < cutoffY + 110);
    world.rings = world.rings.filter((r) => r.y < cutoffY);
    world.gems = world.gems.filter((g) => g.y < cutoffY && !g.collected);
    world.signs = world.signs.filter((s) => s.y < cutoffY);
    world.cameraSlices = world.cameraSlices.filter((sl) => sl.yBottom > cutoffY - 600 || sl.yTop < cutoffY);
  }

  private generateVerticalChunk(world: WorldEntities) {
    const idx = this.chunkIndex++;
    const difficulty = Math.min(1, idx / 20);
    const rows = idx < 2 ? this.randInt(8, 11) : this.randInt(7, 15);
    const bottomY = this.topGeneratedY;
    const sx = this.shaftX;

    for (let r = 1; r <= rows; r++) {
      this.addOuterWalls(world, sx, bottomY - r * TILE);
    }

    world.cameraSlices.push({
      yTop: bottomY - rows * TILE,
      yBottom: bottomY,
      xMin: sx,
      xMax: sx + VIRTUAL_W,
    });

    // 100% deep procedural generation across 8 distinct shaft architectures
    this.generateProceduralVerticalChunk(world, sx, bottomY, rows, difficulty, idx);
    this.topGeneratedY = bottomY - rows * TILE;
  }

  private generateProceduralVerticalChunk(
    world: WorldEntities,
    sx: number,
    bottomY: number,
    rows: number,
    difficulty: number,
    idx: number
  ) {
    const midX = sx + VIRTUAL_W / 2;
    const allArchetypes: VerticalArchetype[] = [
      'zig_zag',
      'split_chimney',
      'gauntlet_pit',
      'spring_tower',
      'hybrid_ledge',
      'wall_hop_narrow',
      'staggered_alcoves',
      'twin_elevator_atrium',
    ];
    const eligible = allArchetypes.filter((a) => !this.recentArchetypes.includes(a));
    const archetype = this.pick(eligible.length > 0 ? eligible : allArchetypes);
    this.recentArchetypes = [archetype, ...this.recentArchetypes].slice(0, 2);

    const waypoints: Array<{ col: number; wCols: number; row: number; kind: string }> = [];
    let curCol = Math.max(2, Math.min(11, this.lastExitCol - 1));
    let curRow = 2;

    // Optional architectural outer-wall buttresses for visual & wall-hop variety
    if (rows >= 10 && archetype !== 'wall_hop_narrow' && this.rand() < 0.55) {
      const bSideLeft = this.rand() < 0.5;
      const bRow = this.randInt(3, rows - 4);
      const bHeight = this.randInt(2, 3);
      for (let br = 0; br < bHeight; br++) {
        world.solids.push({
          id: this.uid(),
          x: bSideLeft ? sx + TILE : sx + VIRTUAL_W - TILE * 2,
          y: bottomY - (bRow + br) * TILE,
          w: TILE,
          h: TILE,
          kind: 'wall',
        });
      }
    }

    if (archetype === 'split_chimney') {
      // Build a central vertical stone spine dividing the shaft into dual left/right climbing lanes
      const spineCol = this.randInt(7, 8);
      const spineStart = 2;
      const spineEnd = Math.max(5, rows - 3);
      for (let sr = spineStart; sr <= spineEnd; sr++) {
        world.solids.push({
          id: this.uid(),
          x: sx + spineCol * TILE,
          y: bottomY - sr * TILE,
          w: TILE,
          h: TILE,
          kind: 'pillar',
        });
      }
      if (this.rand() < 0.6) {
        world.spikes.push({
          id: this.uid(),
          x: sx + spineCol * TILE,
          y: bottomY - (spineEnd + 1) * TILE,
          dir: 'up',
        });
      }

      // Left lane ledges/crumbles + Right lane bounce/ferry route
      for (let r = 2; r <= rows - 2; r += this.randInt(2, 3)) {
        const leftW = this.randInt(2, 3);
        const leftCol = this.randInt(2, Math.max(2, spineCol - leftW));
        if (this.rand() < 0.4) {
          world.crumbles.push({
            id: this.uid(),
            x: sx + leftCol * TILE,
            y: bottomY - r * TILE,
            w: leftW * TILE,
            h: TILE,
            state: 'idle',
            timer: 0,
            respawnTimer: 0,
          });
        } else {
          world.solids.push({
            id: this.uid(),
            x: sx + leftCol * TILE,
            y: bottomY - r * TILE,
            w: leftW * TILE,
            h: TILE,
            kind: 'ledge',
          });
        }

        const rightMin = spineCol + 2;
        const rightW = this.randInt(2, 3);
        const rightCol = this.randInt(rightMin, Math.max(rightMin, 14 - rightW));
        world.solids.push({
          id: this.uid(),
          x: sx + rightCol * TILE,
          y: bottomY - Math.min(rows - 2, r + 1) * TILE,
          w: rightW * TILE,
          h: TILE,
          kind: 'ledge',
        });
        if (r === 2 && this.rand() < 0.65) {
          world.bouncePads.push({
            id: this.uid(),
            x: sx + rightCol * TILE,
            y: bottomY - (r + 2) * TILE,
            w: TILE,
            h: TILE,
            power: 340,
            compressTimer: 0,
          });
        }
        if (this.rand() < 0.65) {
          world.gems.push({
            id: this.uid(),
            x: sx + (this.rand() < 0.5 ? leftCol + 1 : rightCol + 1) * TILE,
            y: bottomY - (r + 1.5) * TILE,
            collected: false,
            bobOffset: r * 0.6,
          });
        }
        this.lastExitCol = this.rand() < 0.5 ? leftCol + 1 : rightCol + 1;
      }
    } else if (archetype === 'gauntlet_pit') {
      // Entry side ledges + elevated exit + wide central arena for pendulum/firebar/saw
      const entrySide = this.rand() < 0.5 ? 2 : 10;
      world.solids.push(
        { id: this.uid(), x: sx + entrySide * TILE, y: bottomY - TILE * 2, w: TILE * 3, h: TILE, kind: 'ledge' },
        {
          id: this.uid(),
          x: sx + (entrySide === 2 ? 10 : 2) * TILE,
          y: bottomY - TILE * Math.max(4, rows - 3),
          w: TILE * 3,
          h: TILE,
          kind: 'ledge',
        }
      );
      const midStepCol = this.randInt(5, 9);
      world.crumbles.push({
        id: this.uid(),
        x: sx + midStepCol * TILE,
        y: bottomY - TILE * Math.floor(rows * 0.5),
        w: TILE * this.randInt(2, 4),
        h: TILE,
        state: 'idle',
        timer: 0,
        respawnTimer: 0,
      });
      if (this.rand() < 0.7) {
        world.bouncePads.push({
          id: this.uid(),
          x: sx + (entrySide + 1) * TILE,
          y: bottomY - TILE * 3,
          w: TILE,
          h: TILE,
          power: 350,
          compressTimer: 0,
        });
      }
      world.gems.push(
        { id: this.uid(), x: midX, y: bottomY - TILE * Math.floor(rows * 0.55), collected: false, bobOffset: 0.4 },
        { id: this.uid(), x: sx + (entrySide === 2 ? 11.5 : 3.5) * TILE, y: bottomY - TILE * (rows - 2), collected: false, bobOffset: 1.5 }
      );
      this.lastExitCol = entrySide === 2 ? 11 : 3;
    } else if (archetype === 'spring_tower') {
      // Bounce pad vertical relay alternating across left/center/right ledges
      let side: 'left' | 'right' = this.rand() < 0.5 ? 'left' : 'right';
      for (let r = 2; r <= rows - 3; r += 4) {
        const wCols = this.randInt(2, 3);
        const col = side === 'left' ? this.randInt(2, 5) : this.randInt(10, 14 - wCols);
        world.solids.push({
          id: this.uid(),
          x: sx + col * TILE,
          y: bottomY - r * TILE,
          w: wCols * TILE,
          h: TILE,
          kind: 'ledge',
        });
        const padX = sx + (col + Math.floor(wCols / 2)) * TILE;
        world.bouncePads.push({
          id: this.uid(),
          x: padX,
          y: bottomY - (r + 1) * TILE,
          w: TILE,
          h: TILE,
          power: 350,
          compressTimer: 0,
        });
        world.gems.push({
          id: this.uid(),
          x: padX + 8,
          y: bottomY - (r + 2.5) * TILE,
          collected: false,
          bobOffset: r * 0.5,
        });
        this.lastExitCol = col + 1;
        side = side === 'left' ? 'right' : 'left';
      }
    } else if (archetype === 'wall_hop_narrow') {
      // Narrow inward stone buttresses creating an asymmetric 6-8 tile chimney with wall-hop pockets
      const leftPad = this.randInt(2, 4);
      const rightPad = this.randInt(2, 4);
      const narrowStart = 2;
      const narrowEnd = Math.max(5, rows - 2);
      for (let nr = narrowStart; nr <= narrowEnd; nr++) {
        for (let c = 1; c <= leftPad; c++) {
          world.solids.push({
            id: this.uid(),
            x: sx + c * TILE,
            y: bottomY - nr * TILE,
            w: TILE,
            h: TILE,
            kind: 'wall',
          });
        }
        for (let c = 1; c <= rightPad; c++) {
          world.solids.push({
            id: this.uid(),
            x: sx + VIRTUAL_W - (c + 1) * TILE,
            y: bottomY - nr * TILE,
            w: TILE,
            h: TILE,
            kind: 'wall',
          });
        }
      }
      const innerMinCol = leftPad + 1;
      const innerMaxCol = 14 - rightPad;
      let sideLeft = this.rand() < 0.5;
      for (let r = 2; r <= rows - 2; r += this.randInt(2, 3)) {
        const wCols = Math.min(2, Math.max(1, innerMaxCol - innerMinCol - 2));
        const col = sideLeft ? innerMinCol : Math.max(innerMinCol, innerMaxCol - wCols + 1);
        if (this.rand() < 0.45) {
          world.crumbles.push({
            id: this.uid(),
            x: sx + col * TILE,
            y: bottomY - r * TILE,
            w: wCols * TILE,
            h: TILE,
            state: 'idle',
            timer: 0,
            respawnTimer: 0,
          });
        } else {
          world.solids.push({
            id: this.uid(),
            x: sx + col * TILE,
            y: bottomY - r * TILE,
            w: wCols * TILE,
            h: TILE,
            kind: 'ledge',
          });
        }
        if (r >= 4 && r <= narrowEnd - 1 && this.rand() < 0.45) {
          world.spikes.push({
            id: this.uid(),
            x: sx + (sideLeft ? innerMaxCol : innerMinCol) * TILE,
            y: bottomY - r * TILE,
            dir: sideLeft ? 'left' : 'right',
          });
        }
        world.gems.push({
          id: this.uid(),
          x: sx + ((innerMinCol + innerMaxCol + 1) / 2) * TILE,
          y: bottomY - (r + 1) * TILE,
          collected: false,
          bobOffset: r * 0.5,
        });
        this.lastExitCol = Math.round((innerMinCol + innerMaxCol) / 2);
        sideLeft = !sideLeft;
      }
    } else if (archetype === 'staggered_alcoves') {
      // Side pocket ledges + overhanging stone ceiling lintels forcing horizontal weave-and-climb
      let leftFocus = this.rand() < 0.5;
      for (let r = 2; r <= rows - 2; r += 3) {
        const pocketCols = this.randInt(2, 3);
        const pocketCol = leftFocus ? this.randInt(2, 4) : this.randInt(11 - pocketCols, 14 - pocketCols);
        world.solids.push({
          id: this.uid(),
          x: sx + pocketCol * TILE,
          y: bottomY - r * TILE,
          w: pocketCols * TILE,
          h: TILE,
          kind: 'ledge',
        });
        if (r + 2 <= rows - 2) {
          // Staggered stone overhang on opposite center side
          const lintelCols = this.randInt(3, 4);
          const lintelCol = leftFocus ? this.randInt(6, 9) : this.randInt(4, 7);
          world.solids.push({
            id: this.uid(),
            x: sx + lintelCol * TILE,
            y: bottomY - (r + 2) * TILE,
            w: lintelCols * TILE,
            h: TILE,
            kind: 'pillar',
          });
          if (this.rand() < 0.5) {
            world.crumbles.push({
              id: this.uid(),
              x: sx + (leftFocus ? 11 : 2) * TILE,
              y: bottomY - (r + 1) * TILE,
              w: TILE * 3,
              h: TILE,
              state: 'idle',
              timer: 0,
              respawnTimer: 0,
            });
          }
        }
        world.gems.push({
          id: this.uid(),
          x: sx + (pocketCol + pocketCols * 0.5) * TILE,
          y: bottomY - (r + 1.4) * TILE,
          collected: false,
          bobOffset: r * 0.6,
        });
        this.lastExitCol = pocketCol + 1;
        leftFocus = !leftFocus;
      }
    } else if (archetype === 'twin_elevator_atrium') {
      // Dual counter-phased vertical + horizontal moving lifts flanking a central pillar core
      const coreCol = this.randInt(7, 8);
      for (let r = 3; r <= Math.max(5, rows - 3); r++) {
        world.solids.push({
          id: this.uid(),
          x: sx + coreCol * TILE,
          y: bottomY - r * TILE,
          w: TILE,
          h: TILE,
          kind: 'pillar',
        });
      }
      const leftLiftX = sx + TILE * 2;
      const rightLiftX = sx + VIRTUAL_W - TILE * 5;
      const midLiftY = bottomY - Math.floor(rows * 0.52) * TILE;
      world.movingPlatforms.push(
        {
          id: this.uid(),
          baseX: leftLiftX,
          baseY: midLiftY,
          x: leftLiftX,
          y: midLiftY,
          prevX: leftLiftX,
          prevY: midLiftY,
          w: TILE * 3,
          h: TILE,
          moveX: 0,
          moveY: Math.min(36, Math.floor((rows - 4) * TILE * 0.4)),
          speed: 1.45 + difficulty * 0.45,
          phase: 0,
        },
        {
          id: this.uid(),
          baseX: rightLiftX,
          baseY: midLiftY,
          x: rightLiftX,
          y: midLiftY,
          prevX: rightLiftX,
          prevY: midLiftY,
          w: TILE * 3,
          h: TILE,
          moveX: 0,
          moveY: Math.min(36, Math.floor((rows - 4) * TILE * 0.4)),
          speed: 1.45 + difficulty * 0.45,
          phase: Math.PI,
        }
      );
      world.solids.push(
        { id: this.uid(), x: sx + this.randInt(4, 9) * TILE, y: bottomY - TILE * 2, w: TILE * 3, h: TILE, kind: 'ledge' },
        { id: this.uid(), x: sx + this.randInt(4, 9) * TILE, y: bottomY - TILE * (rows - 2), w: TILE * 3, h: TILE, kind: 'ledge' }
      );
      world.gems.push(
        { id: this.uid(), x: leftLiftX + TILE * 1.5, y: midLiftY - TILE * 1.6, collected: false, bobOffset: 0.3 },
        { id: this.uid(), x: rightLiftX + TILE * 1.5, y: midLiftY - TILE * 1.6, collected: false, bobOffset: 1.7 }
      );
      this.lastExitCol = coreCol;
    } else {
      // 'zig_zag' and 'hybrid_ledge': organic 1-5 tile pockets, moving ferries, crumbles, and pillars
      while (curRow <= rows - 2) {
        const wCols = archetype === 'hybrid_ledge' ? this.randInt(1, 5) : this.randInt(2, 4);
        const maxCol = Math.max(2, 14 - wCols);
        const sideJump = archetype === 'zig_zag' ? this.rand() < 0.8 : this.rand() < 0.58;
        if (sideJump) {
          curCol = curCol < 7 ? this.randInt(Math.min(maxCol, 8), maxCol) : this.randInt(2, Math.min(6, maxCol));
        } else {
          curCol = Math.max(2, Math.min(maxCol, curCol + this.randInt(-4, 4)));
        }

        const roll = this.rand();
        let kind = 'ledge';
        if (roll < 0.24) kind = 'crumble';
        else if (roll < 0.42) kind = 'moving_h';
        else if (roll < 0.54) kind = 'moving_v';
        else if (roll < 0.64 && curRow <= rows - 4) kind = 'bounce_ledge';
        else if (roll < 0.72 && curRow <= rows - 5) kind = 'pillar';

        waypoints.push({ col: curCol, wCols, row: curRow, kind });

        const platX = sx + curCol * TILE;
        const platY = bottomY - curRow * TILE;

        if (kind === 'ledge' || kind === 'bounce_ledge') {
          world.solids.push({
            id: this.uid(),
            x: platX,
            y: platY,
            w: wCols * TILE,
            h: TILE,
            kind: 'ledge',
          });
          if (kind === 'bounce_ledge') {
            const padX = platX + Math.floor(wCols / 2) * TILE;
            world.bouncePads.push({
              id: this.uid(),
              x: padX,
              y: platY - TILE,
              w: TILE,
              h: TILE,
              power: 350,
              compressTimer: 0,
            });
          }
        } else if (kind === 'crumble') {
          world.crumbles.push({
            id: this.uid(),
            x: platX,
            y: platY,
            w: Math.max(2, wCols) * TILE,
            h: TILE,
            state: 'idle',
            timer: 0,
            respawnTimer: 0,
          });
        } else if (kind === 'moving_h') {
          const spanPx = 26 + this.randInt(0, 20);
          const centerX = Math.max(sx + TILE * 2 + spanPx, Math.min(sx + VIRTUAL_W - TILE * 5 - spanPx, platX));
          world.movingPlatforms.push({
            id: this.uid(),
            baseX: centerX,
            baseY: platY,
            x: centerX,
            y: platY,
            prevX: centerX,
            prevY: platY,
            w: TILE * 3,
            h: TILE,
            moveX: spanPx,
            moveY: 0,
            speed: 1.35 + difficulty * 0.55 + this.rand() * 0.25,
            phase: this.rand() * Math.PI * 2,
          });
        } else if (kind === 'moving_v') {
          world.movingPlatforms.push({
            id: this.uid(),
            baseX: platX,
            baseY: platY - 10,
            x: platX,
            y: platY - 10,
            prevX: platX,
            prevY: platY - 10,
            w: TILE * 3,
            h: TILE,
            moveX: 0,
            moveY: 20 + this.randInt(0, 12),
            speed: 1.45 + difficulty * 0.45,
            phase: this.rand() * Math.PI * 2,
          });
        } else if (kind === 'pillar') {
          const pCol = Math.max(4, Math.min(11, curCol + 1));
          const pHeight = this.randInt(3, 4);
          for (let pr = 0; pr < pHeight; pr++) {
            world.solids.push({
              id: this.uid(),
              x: sx + pCol * TILE,
              y: platY - pr * TILE,
              w: TILE,
              h: TILE,
              kind: 'pillar',
            });
          }
          if (this.rand() < 0.45) {
            world.spikes.push({
              id: this.uid(),
              x: sx + pCol * TILE,
              y: platY - pHeight * TILE,
              dir: 'up',
            });
          }
        }

        if (this.rand() < 0.72) {
          world.gems.push({
            id: this.uid(),
            x: platX + (wCols * TILE) / 2,
            y: platY - TILE * (kind === 'bounce_ledge' ? 2.5 : 1.4),
            collected: false,
            bobOffset: curRow * 0.7,
          });
        }

        curRow += kind === 'bounce_ledge' ? 4 : this.randInt(2, 3);
      }

      if (waypoints.length > 0) {
        const last = waypoints[waypoints.length - 1];
        this.lastExitCol = last.col + Math.floor(last.wCols / 2);
      }
    }

    // Add 1-2 grapple rings in wide mid-shaft zones for kinetic routing
    const ringCount = this.rand() < 0.55 ? 2 : 1;
    for (let ri = 0; ri < ringCount; ri++) {
      const rRow = Math.min(rows - 2, 3 + ri * 4 + this.randInt(0, 1));
      const rX = sx + this.randInt(3, 12) * TILE + 8;
      world.rings.push({ id: this.uid(), x: rX, y: bottomY - rRow * TILE });
    }

    // Layer 2-3 varied hazard archetypes (keep idx === 0 slightly gentler so start is fair)
    const hazardPool = [
      'shock_coil',
      'acid_drip',
      'pendulum',
      'saw',
      'laser',
      'firebar',
      'turret',
      'bat',
      'crusher',
      'flame_jet',
      'wall_spikes',
    ];
    for (let i = hazardPool.length - 1; i > 0; i--) {
      const j = Math.floor(this.rand() * (i + 1));
      const tmp = hazardPool[i];
      hazardPool[i] = hazardPool[j];
      hazardPool[j] = tmp;
    }

    const hazardCount = idx === 0 ? this.randInt(1, 2) : difficulty < 0.25 ? 2 : difficulty < 0.65 ? this.randInt(2, 3) : 3;
    const usedRows = new Set<number>();

    const pickFreeRow = (minR: number, maxR: number): number => {
      for (let attempt = 0; attempt < 6; attempt++) {
        const candidate = this.randInt(minR, maxR);
        if (!usedRows.has(candidate)) {
          usedRows.add(candidate);
          return candidate;
        }
      }
      return this.randInt(minR, maxR);
    };

    for (let h = 0; h < hazardCount; h++) {
      const hazardType = hazardPool[h];
      const hRow = pickFreeRow(3, rows - 2);
      const hY = bottomY - hRow * TILE;

      if (hazardType === 'shock_coil') {
        const cycle = Math.max(2.2, 3.1 - difficulty * 0.6);
        const spanHalf = this.rand() < 0.45;
        const ax = sx + TILE;
        const bx = spanHalf ? sx + TILE * this.randInt(7, 10) : sx + VIRTUAL_W - TILE * 2;
        world.shockCoils.push({
          id: this.uid(),
          ax,
          ay: hY,
          bx,
          by: hY,
          cycleDuration: cycle,
          offset: (idx * 0.4 + h * 1.1) % cycle,
          state: 'idle',
        });
      } else if (hazardType === 'acid_drip') {
        const ventCol = this.randInt(3, 12);
        const ventRow = Math.min(rows - 1, Math.max(6, hRow + 2));
        world.acidDrips.push({
          id: this.uid(),
          x: sx + ventCol * TILE,
          y: bottomY - ventRow * TILE,
          interval: Math.max(1.3, 2.2 - difficulty * 0.6),
          timer: 0.3 + h * 0.6,
        });
      } else if (hazardType === 'pendulum') {
        const pX = sx + this.randInt(5, 10) * TILE + 8;
        const pY = bottomY - Math.min(rows - 1, Math.max(6, hRow + 2)) * TILE;
        world.pendulums.push({
          id: this.uid(),
          pivotX: pX,
          pivotY: pY,
          length: this.randInt(40, 56),
          maxAngle: 0.72 + this.rand() * 0.22,
          speed: 1.9 + difficulty * 0.65 + this.rand() * 0.3,
          phase: this.rand() * Math.PI * 2,
          angle: 0,
          bobX: pX,
          bobY: pY + 46,
          radius: 7,
        });
      } else if (hazardType === 'saw') {
        const vertical = this.rand() < 0.4;
        world.saws.push({
          id: this.uid(),
          baseX: vertical ? sx + this.randInt(3, 12) * TILE : midX,
          baseY: hY,
          x: midX,
          y: hY,
          moveX: vertical ? 0 : 46 + this.randInt(0, 22),
          moveY: vertical ? 24 + this.randInt(0, 12) : 0,
          speed: 1.7 + difficulty * 0.8,
          phase: this.rand() * Math.PI * 2,
          radius: 6.5,
        });
      } else if (hazardType === 'laser') {
        const cycle = Math.max(2.3, 3.2 - difficulty * 0.65);
        world.lasers.push({
          id: this.uid(),
          orientation: 'horizontal',
          x: sx + TILE,
          y: hY,
          xStart: sx + TILE,
          xEnd: sx + VIRTUAL_W - TILE,
          yStart: hY,
          yEnd: hY,
          cycleDuration: cycle,
          offset: (h * 0.8 + this.rand()) % cycle,
          state: 'idle',
          stateProgress: 0,
        });
      } else if (hazardType === 'firebar') {
        world.firebars.push({
          id: this.uid(),
          pivotX: sx + this.randInt(5, 10) * TILE + 8,
          pivotY: hY,
          length: difficulty > 0.55 ? 5 : 4,
          spacing: 11,
          angle: this.rand() * Math.PI * 2,
          angularSpeed: (this.rand() < 0.5 ? 1 : -1) * (1.8 + difficulty * 0.75),
        });
      } else if (hazardType === 'turret') {
        const onLeft = this.rand() < 0.5;
        world.turrets.push({
          id: this.uid(),
          x: onLeft ? sx : sx + VIRTUAL_W - TILE,
          y: hY,
          dir: onLeft ? 'right' : 'left',
          interval: Math.max(1.35, 2.1 - difficulty * 0.55),
          timer: 0.4 + this.rand() * 0.9,
          dartSpeed: 135 + difficulty * 40,
        });
      } else if (hazardType === 'bat') {
        const bx = sx + this.randInt(3, 12) * TILE;
        world.bats.push({
          id: this.uid(),
          homeX: bx,
          homeY: hY,
          x: bx,
          y: hY,
          vx: 0,
          vy: 0,
          state: 'perched',
          timer: 0,
          cooldown: 0,
          spotted: false,
        });
      } else if (hazardType === 'crusher') {
        const cx = sx + this.randInt(3, 11) * TILE;
        const topRow = Math.min(rows - 1, Math.max(6, hRow + 2));
        const homeY = bottomY - topRow * TILE;
        world.crushers.push({
          id: this.uid(),
          x: cx,
          homeY,
          y: homeY,
          w: TILE,
          h: TILE,
          dropDist: TILE * this.randInt(3, 4),
          state: 'idle',
          timer: 0,
          dropSpeed: 235 + difficulty * 45,
        });
      } else if (hazardType === 'flame_jet') {
        const onLeft = this.rand() < 0.5;
        const cycle = Math.max(2.3, 3.1 - difficulty * 0.6);
        world.flameJets.push({
          id: this.uid(),
          x: onLeft ? sx : sx + VIRTUAL_W - TILE,
          y: hY,
          dir: onLeft ? 'right' : 'left',
          reach: 3,
          cycleDuration: cycle,
          offset: this.rand() * cycle,
          state: 'idle',
        });
      } else if (hazardType === 'wall_spikes') {
        const onLeft = this.rand() < 0.5;
        for (let sr = 0; sr < 2; sr++) {
          world.spikes.push({
            id: this.uid(),
            x: onLeft ? sx + TILE : sx + VIRTUAL_W - TILE * 2,
            y: hY - sr * TILE,
            dir: onLeft ? 'right' : 'left',
          });
        }
      }
    }
  }

  private generateHorizontalWing(world: WorldEntities) {
    this.totalWingsSpawned++;
    const idx = this.chunkIndex++;
    const difficulty = Math.min(1, idx / 20);
    const dir: -1 | 1 = this.totalWingsSpawned === 1 ? (this.rand() < 0.5 ? 1 : -1) : (-this.lastWingDir as -1 | 1);
    this.lastWingDir = dir;

    const wingRows = this.randInt(8, 13);
    const lenCols = this.randInt(14, 30);
    const bottomY = this.topGeneratedY;
    const wingFloorY = bottomY - TILE;
    const wingTopY = bottomY - wingRows * TILE;
    const oldShaftX = this.shaftX;

    const newShaftX =
      dir === 1
        ? oldShaftX + VIRTUAL_W - TILE + lenCols * TILE
        : oldShaftX - lenCols * TILE - (VIRTUAL_W - TILE);

    const sliceXMin = Math.min(oldShaftX, newShaftX);
    const sliceXMax = Math.max(oldShaftX + VIRTUAL_W, newShaftX + VIRTUAL_W);
    world.cameraSlices.push({
      yTop: wingTopY,
      yBottom: bottomY,
      xMin: sliceXMin,
      xMax: sliceXMax,
    });

    for (let r = 1; r <= wingRows; r++) {
      const y = bottomY - r * TILE;
      if (dir === 1) {
        world.solids.push({ id: this.uid(), x: oldShaftX, y, w: TILE, h: TILE, kind: 'wall' });
        if (r === 1 || r === wingRows) {
          world.solids.push({ id: this.uid(), x: oldShaftX + VIRTUAL_W - TILE, y, w: TILE, h: TILE, kind: 'wall' });
        }
      } else {
        world.solids.push({ id: this.uid(), x: oldShaftX + VIRTUAL_W - TILE, y, w: TILE, h: TILE, kind: 'wall' });
        if (r === 1 || r === wingRows) {
          world.solids.push({ id: this.uid(), x: oldShaftX, y, w: TILE, h: TILE, kind: 'wall' });
        }
      }
    }

    world.solids.push({
      id: this.uid(),
      x: oldShaftX + TILE,
      y: wingTopY,
      w: VIRTUAL_W - TILE * 2,
      h: TILE,
      kind: 'wall',
    });

    world.solids.push({
      id: this.uid(),
      x: dir === 1 ? oldShaftX + TILE * 6 : oldShaftX + TILE,
      y: wingFloorY,
      w: TILE * 9,
      h: TILE,
      kind: 'ledge',
    });
    world.solids.push({
      id: this.uid(),
      x: dir === 1 ? oldShaftX + TILE * 2 : oldShaftX + TILE * 11,
      y: bottomY - TILE * 3,
      w: TILE * 3,
      h: TILE,
      kind: 'ledge',
    });

    world.signs.push({
      id: this.uid(),
      x: dir === 1 ? oldShaftX + TILE * 13 : oldShaftX + TILE * 2,
      y: wingFloorY - TILE * 2,
      dir: dir === 1 ? 'right' : 'left',
    });

    const corrLeftX = dir === 1 ? oldShaftX + VIRTUAL_W : newShaftX + VIRTUAL_W;
    const corrWidth = lenCols * TILE - TILE;

    for (let x = corrLeftX - TILE; x < corrLeftX + corrWidth + TILE; x += TILE) {
      world.solids.push({
        id: this.uid(),
        x,
        y: wingTopY,
        w: TILE,
        h: TILE,
        kind: 'wall',
      });
    }

    for (let r = 1; r <= wingRows; r++) {
      const y = bottomY - r * TILE;
      if (dir === 1) {
        world.solids.push({ id: this.uid(), x: newShaftX + VIRTUAL_W - TILE, y, w: TILE, h: TILE, kind: 'wall' });
        if (r === 1 || r === wingRows) {
          world.solids.push({ id: this.uid(), x: newShaftX, y, w: TILE, h: TILE, kind: 'wall' });
        }
      } else {
        world.solids.push({ id: this.uid(), x: newShaftX, y, w: TILE, h: TILE, kind: 'wall' });
        if (r === 1 || r === wingRows) {
          world.solids.push({ id: this.uid(), x: newShaftX + VIRTUAL_W - TILE, y, w: TILE, h: TILE, kind: 'wall' });
        }
      }
    }

    world.solids.push({
      id: this.uid(),
      x: newShaftX + TILE,
      y: wingFloorY,
      w: VIRTUAL_W - TILE * 2,
      h: TILE,
      kind: 'wall',
    });
    world.signs.push({
      id: this.uid(),
      x: newShaftX + VIRTUAL_W / 2 - 8,
      y: wingFloorY - TILE * 2,
      dir: 'up',
    });
    world.rings.push({
      id: this.uid(),
      x: newShaftX + VIRTUAL_W / 2,
      y: bottomY - TILE * 6.5,
    });

    // 100% fully procedural wing generation across 5 wing archetypes
    const cStart = corrLeftX;
    this.generateProceduralWingContent(world, cStart, corrWidth, lenCols - 1, wingFloorY, wingTopY, difficulty, dir);

    this.lastExitCol = 8;
    this.shaftX = newShaftX;
    this.topGeneratedY = wingTopY;
  }

  private generateProceduralWingContent(
    world: WorldEntities,
    cStart: number,
    corrWidth: number,
    corrCols: number,
    wingFloorY: number,
    wingTopY: number,
    difficulty: number,
    dir: -1 | 1
  ) {
    const wingArchetypes: WingArchetype[] = [
      'bridge_run',
      'ferry_crossing',
      'bounce_ceiling_sprint',
      'stepped_terrace',
      'split_deck_corridor',
    ];
    const eligible = wingArchetypes.filter((a) => a !== this.lastWingArchetype);
    const wingArchetype = this.pick(eligible);
    this.lastWingArchetype = wingArchetype;

    // 1. Entry & exit anchors
    world.solids.push(
      { id: this.uid(), x: cStart, y: wingFloorY, w: TILE * 3, h: TILE, kind: 'ledge' },
      { id: this.uid(), x: cStart + corrWidth - TILE * 3, y: wingFloorY, w: TILE * 3, h: TILE, kind: 'ledge' }
    );

    let cursorCol = 3;
    const endCol = corrCols - 3;
    let terraceOffset = 0;

    while (cursorCol < endCol - 1) {
      const gap = wingArchetype === 'ferry_crossing' ? this.randInt(2, 3) : this.randInt(1, 2);
      cursorCol += gap;
      if (cursorCol >= endCol) break;

      const segCols = Math.min(this.randInt(2, 5), endCol - cursorCol);
      if (segCols < 2) break;

      const segX = cStart + cursorCol * TILE;
      let segYOffset = 0;
      let segType = 'ledge';

      if (wingArchetype === 'bridge_run') {
        segYOffset = this.pick([0, 0, -TILE]);
        segType = this.pick(['ledge', 'crumble', 'crumble']);
      } else if (wingArchetype === 'ferry_crossing') {
        segYOffset = this.pick([0, -TILE]);
        segType = this.pick(['moving_h', 'moving_v', 'ledge']);
      } else if (wingArchetype === 'bounce_ceiling_sprint') {
        segYOffset = this.pick([0, -TILE]);
        segType = this.pick(['bounce', 'ledge', 'crumble']);
      } else if (wingArchetype === 'split_deck_corridor') {
        // Dual-level corridor: lower bridge/ferry lane + upper catwalk ledges
        segYOffset = this.pick([0, -TILE]);
        segType = this.pick(['ledge', 'moving_h', 'crumble']);
        const upperY = wingFloorY - TILE * this.randInt(4, 5);
        if (this.rand() < 0.75) {
          world.solids.push({
            id: this.uid(),
            x: segX,
            y: upperY,
            w: segCols * TILE,
            h: TILE,
            kind: 'ledge',
          });
          if (this.rand() < 0.55) {
            world.gems.push({
              id: this.uid(),
              x: segX + (segCols * TILE) / 2,
              y: upperY - TILE * 1.4,
              collected: false,
              bobOffset: cursorCol * 0.5,
            });
          }
        }
      } else {
        // stepped_terrace
        terraceOffset = Math.max(-TILE * 3, Math.min(0, terraceOffset + this.pick([-TILE, -TILE, TILE, 0])));
        segYOffset = terraceOffset;
        segType = this.pick(['ledge', 'crumble', 'bounce']);
      }

      const segY = wingFloorY + segYOffset;

      if (segType === 'ledge') {
        world.solids.push({ id: this.uid(), x: segX, y: segY, w: segCols * TILE, h: TILE, kind: 'ledge' });
      } else if (segType === 'crumble') {
        world.crumbles.push({
          id: this.uid(),
          x: segX,
          y: segY,
          w: segCols * TILE,
          h: TILE,
          state: 'idle',
          timer: 0,
          respawnTimer: 0,
        });
      } else if (segType === 'moving_h') {
        world.movingPlatforms.push({
          id: this.uid(),
          baseX: segX,
          baseY: segY,
          x: segX,
          y: segY,
          prevX: segX,
          prevY: segY,
          w: TILE * 3,
          h: TILE,
          moveX: 20,
          moveY: 0,
          speed: 1.5 + difficulty * 0.5,
          phase: this.rand() * Math.PI * 2,
        });
      } else if (segType === 'moving_v') {
        world.movingPlatforms.push({
          id: this.uid(),
          baseX: segX,
          baseY: segY - TILE,
          x: segX,
          y: segY - TILE,
          prevX: segX,
          prevY: segY - TILE,
          w: TILE * 3,
          h: TILE,
          moveX: 0,
          moveY: 18,
          speed: 1.55 + difficulty * 0.45,
          phase: this.rand() * Math.PI * 2,
        });
      } else {
        world.solids.push({ id: this.uid(), x: segX, y: segY, w: segCols * TILE, h: TILE, kind: 'ledge' });
        world.bouncePads.push({
          id: this.uid(),
          x: segX + Math.floor(segCols / 2) * TILE,
          y: segY - TILE,
          w: TILE,
          h: TILE,
          power: 330,
          compressTimer: 0,
        });
      }

      const centerPx = segX + (segCols * TILE) / 2;
      if (this.rand() < 0.75) {
        world.gems.push({
          id: this.uid(),
          x: centerPx,
          y: segY - TILE * 2.5,
          collected: false,
          bobOffset: cursorCol * 0.4,
        });
      }

      cursorCol += segCols;
    }

    // Grapple rings along corridor ceiling
    const ringStep = Math.max(5, Math.floor(corrCols / 3));
    for (let rc = 5; rc <= corrCols - 5; rc += ringStep) {
      world.rings.push({
        id: this.uid(),
        x: cStart + rc * TILE,
        y: wingTopY + TILE * 2.75,
      });
    }

    // 2. Procedurally place 3 varied hazards across the corridor
    const wingHazards = ['shock_coil', 'acid_drip', 'pendulum', 'laser', 'crusher', 'flame_jet', 'turret', 'bat'];
    for (let i = wingHazards.length - 1; i > 0; i--) {
      const j = Math.floor(this.rand() * (i + 1));
      const tmp = wingHazards[i];
      wingHazards[i] = wingHazards[j];
      wingHazards[j] = tmp;
    }

    const slots = [
      cStart + Math.floor(corrWidth * 0.25),
      cStart + Math.floor(corrWidth * 0.5),
      cStart + Math.floor(corrWidth * 0.75),
    ];

    for (let sIdx = 0; sIdx < slots.length; sIdx++) {
      const hx = Math.round(slots[sIdx] / TILE) * TILE;
      const hz = wingHazards[sIdx];
      const cycle = Math.max(2.3, 3.1 - difficulty * 0.55);

      if (hz === 'shock_coil') {
        world.shockCoils.push({
          id: this.uid(),
          ax: hx,
          ay: wingTopY + TILE * 2,
          bx: hx,
          by: wingFloorY - TILE,
          cycleDuration: cycle,
          offset: sIdx * 0.8,
          state: 'idle',
        });
      } else if (hz === 'acid_drip') {
        world.acidDrips.push({
          id: this.uid(),
          x: hx,
          y: wingTopY + TILE,
          interval: Math.max(1.35, 2.05 - difficulty * 0.5),
          timer: 0.4 + sIdx * 0.5,
        });
      } else if (hz === 'pendulum') {
        world.pendulums.push({
          id: this.uid(),
          pivotX: hx + 8,
          pivotY: wingTopY + TILE * 2,
          length: 52,
          maxAngle: 0.85,
          speed: 2.0 + difficulty * 0.6,
          phase: sIdx * 1.3,
          angle: 0,
          bobX: hx + 8,
          bobY: wingTopY + TILE * 2 + 52,
          radius: 7,
        });
      } else if (hz === 'laser') {
        world.lasers.push({
          id: this.uid(),
          orientation: 'vertical',
          x: hx,
          y: wingTopY,
          xStart: hx,
          xEnd: hx,
          yStart: wingTopY + TILE,
          yEnd: wingFloorY,
          cycleDuration: cycle,
          offset: sIdx * 0.7,
          state: 'idle',
          stateProgress: 0,
        });
      } else if (hz === 'crusher') {
        world.crushers.push({
          id: this.uid(),
          x: hx,
          homeY: wingTopY + TILE,
          y: wingTopY + TILE,
          w: TILE,
          h: TILE,
          dropDist: Math.max(TILE * 4, wingFloorY - wingTopY - TILE * 2),
          state: 'idle',
          timer: 0,
          dropSpeed: 240 + difficulty * 45,
        });
      } else if (hz === 'flame_jet') {
        world.flameJets.push({
          id: this.uid(),
          x: hx,
          y: wingTopY,
          dir: 'down',
          reach: 3,
          cycleDuration: cycle,
          offset: sIdx * 0.75,
          state: 'idle',
        });
      } else if (hz === 'turret') {
        world.turrets.push({
          id: this.uid(),
          x: hx,
          y: wingTopY,
          dir: 'down',
          interval: Math.max(1.4, 2.1 - difficulty * 0.5),
          timer: 0.4 + sIdx * 0.4,
          dartSpeed: 135 + difficulty * 35,
        });
      } else if (hz === 'bat') {
        world.bats.push({
          id: this.uid(),
          homeX: hx + 8,
          homeY: wingTopY + TILE * 2,
          x: hx + 8,
          y: wingTopY + TILE * 2,
          vx: 0,
          vy: 0,
          state: 'perched',
          timer: 0,
          cooldown: 0,
          spotted: false,
        });
      }
    }

    if (difficulty > 0.3 && this.rand() < 0.5) {
      const tx = dir === 1 ? cStart + corrWidth - TILE * 2 : cStart + TILE;
      world.turrets.push({
        id: this.uid(),
        x: tx,
        y: wingFloorY - TILE * 2,
        dir: dir === 1 ? 'left' : 'right',
        interval: Math.max(1.45, 2.2 - difficulty * 0.5),
        timer: 0.7,
        dartSpeed: 145 + difficulty * 30,
      });
    }
  }
}
