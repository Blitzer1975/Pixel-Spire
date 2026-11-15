import {
  Bat,
  BouncePad,
  CrumblePlatform,
  Dart,
  DartTurret,
  DirectionSign,
  Firebar,
  Gem,
  GrappleRing,
  Laser,
  MovingPlatform,
  Sawblade,
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
  rings: GrappleRing[];
  gems: Gem[];
  signs: DirectionSign[];
  cameraSlices: CameraBoundsSlice[];
}

export class LevelGenerator {
  private nextId = 1;
  private chunkIndex = 0;
  private chunksSinceWing = 0;
  private nextWingInterval = 2;
  private lastWingDir: -1 | 1 = 1;
  public shaftX = 0;
  public topGeneratedY = 0;
  public totalWingsSpawned = 0;

  public uid(): number {
    return this.nextId++;
  }

  public reset(world: WorldEntities, startBottomY: number) {
    this.nextId = 1;
    this.chunkIndex = 0;
    this.chunksSinceWing = 0;
    this.nextWingInterval = 2;
    this.lastWingDir = Math.random() < 0.5 ? 1 : -1;
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

    for (let y = startBottomY - TILE * 2; y >= startBottomY - TILE * 12; y -= TILE) {
      this.addOuterWalls(world, this.shaftX, y);
    }

    world.cameraSlices.push({
      yTop: startBottomY - TILE * 12,
      yBottom: startBottomY + 120,
      xMin: 0,
      xMax: VIRTUAL_W,
    });

    world.solids.push(
      { id: this.uid(), x: TILE * 2, y: startBottomY - TILE * 4, w: TILE * 4, h: TILE, kind: 'ledge' },
      { id: this.uid(), x: TILE * 10, y: startBottomY - TILE * 7, w: TILE * 4, h: TILE, kind: 'ledge' }
    );
    world.crumbles.push({
      id: this.uid(),
      x: TILE * 6,
      y: startBottomY - TILE * 10,
      w: TILE * 3,
      h: TILE,
      state: 'idle',
      timer: 0,
      respawnTimer: 0,
    });
    world.rings.push({
      id: this.uid(),
      x: VIRTUAL_W / 2,
      y: startBottomY - TILE * 7.5,
    });
    world.bouncePads.push({
      id: this.uid(),
      x: TILE * 12,
      y: startBottomY - TILE * 2,
      w: TILE,
      h: TILE,
      power: 345,
      compressTimer: 0,
    });
    world.gems.push(
      { id: this.uid(), x: TILE * 4, y: startBottomY - TILE * 5.2, collected: false, bobOffset: 0 },
      { id: this.uid(), x: TILE * 12.5, y: startBottomY - TILE * 5.2, collected: false, bobOffset: 1.4 },
      { id: this.uid(), x: VIRTUAL_W / 2, y: startBottomY - TILE * 11.2, collected: false, bobOffset: 2.8 }
    );

    this.topGeneratedY = startBottomY - TILE * 12;
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
        this.nextWingInterval = 2 + (this.chunkIndex % 2);
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
    world.rings = world.rings.filter((r) => r.y < cutoffY);
    world.gems = world.gems.filter((g) => g.y < cutoffY && !g.collected);
    world.signs = world.signs.filter((s) => s.y < cutoffY);
    world.cameraSlices = world.cameraSlices.filter((sl) => sl.yBottom > cutoffY - 600 || sl.yTop < cutoffY);
  }

  private generateVerticalChunk(world: WorldEntities) {
    const idx = this.chunkIndex++;
    const difficulty = Math.min(1, idx / 20);
    const mirror = (idx + Math.floor(Math.random() * 2)) % 2 === 1;
    const rows = 9 + (idx % 3);
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

    const col = (c: number) => sx + (mirror ? 15 - c : c) * TILE;
    const midX = sx + VIRTUAL_W / 2;
    const midY = bottomY - Math.floor(rows / 2) * TILE;

    const patternCount = idx < 3 ? 4 : 12;
    const pattern =
      idx === 0 ? 0 : idx === 1 ? 9 : idx === 2 ? 8 : Math.floor(Math.random() * patternCount);

    switch (pattern) {
      case 0: {
        world.spikes.push({
          id: this.uid(),
          x: mirror ? sx + VIRTUAL_W - TILE * 2 : sx + TILE,
          y: bottomY - TILE * 3,
          dir: mirror ? 'left' : 'right',
        });
        if (idx >= 1) {
          world.spikes.push({
            id: this.uid(),
            x: mirror ? sx + TILE : sx + VIRTUAL_W - TILE * 2,
            y: bottomY - TILE * 7,
            dir: mirror ? 'right' : 'left',
          });
        }
        world.solids.push({
          id: this.uid(),
          x: col(mirror ? 9 : 4),
          y: bottomY - TILE * 2,
          w: TILE * 3,
          h: TILE,
          kind: 'ledge',
        });
        world.rings.push({ id: this.uid(), x: midX, y: midY - TILE * 0.5 });
        world.gems.push(
          { id: this.uid(), x: col(mirror ? 11 : 3) + 8, y: bottomY - TILE * 5, collected: false, bobOffset: 0.4 },
          { id: this.uid(), x: midX, y: bottomY - TILE * 8, collected: false, bobOffset: 1.6 }
        );
        break;
      }

      case 1: {
        world.crumbles.push(
          {
            id: this.uid(),
            x: col(mirror ? 8 : 4),
            y: bottomY - TILE * 3,
            w: TILE * 4,
            h: TILE,
            state: 'idle',
            timer: 0,
            respawnTimer: 0,
          },
          {
            id: this.uid(),
            x: col(mirror ? 3 : 9),
            y: bottomY - TILE * 6,
            w: TILE * 3,
            h: TILE,
            state: 'idle',
            timer: 0,
            respawnTimer: 0,
          },
          {
            id: this.uid(),
            x: sx + TILE * 6,
            y: bottomY - TILE * 8,
            w: TILE * 4,
            h: TILE,
            state: 'idle',
            timer: 0,
            respawnTimer: 0,
          }
        );
        const sawY = bottomY - TILE * 4.5;
        world.saws.push({
          id: this.uid(),
          baseX: midX,
          baseY: sawY,
          x: midX,
          y: sawY,
          moveX: 52 + difficulty * 22,
          moveY: 0,
          speed: 1.7 + difficulty * 0.85,
          phase: idx * 0.9,
          radius: 6.5,
        });
        world.gems.push({ id: this.uid(), x: midX, y: bottomY - TILE * 9.5, collected: false, bobOffset: 0.9 });
        break;
      }

      case 2: {
        const cycle = Math.max(2.3, 3.2 - difficulty * 0.7);
        world.solids.push(
          {
            id: this.uid(),
            x: mirror ? sx + VIRTUAL_W - TILE * 5 : sx + TILE * 2,
            y: bottomY - TILE * 2,
            w: TILE * 3,
            h: TILE,
            kind: 'ledge',
          },
          {
            id: this.uid(),
            x: mirror ? sx + TILE * 2 : sx + VIRTUAL_W - TILE * 5,
            y: bottomY - TILE * 6,
            w: TILE * 3,
            h: TILE,
            kind: 'ledge',
          }
        );
        world.lasers.push(
          {
            id: this.uid(),
            orientation: 'horizontal',
            x: sx + TILE,
            y: bottomY - TILE * 4,
            xStart: sx + TILE,
            xEnd: sx + VIRTUAL_W - TILE,
            yStart: bottomY - TILE * 4,
            yEnd: bottomY - TILE * 4,
            cycleDuration: cycle,
            offset: 0,
            state: 'idle',
            stateProgress: 0,
          },
          {
            id: this.uid(),
            orientation: 'horizontal',
            x: sx + TILE,
            y: bottomY - TILE * 8,
            xStart: sx + TILE,
            xEnd: sx + VIRTUAL_W - TILE,
            yStart: bottomY - TILE * 8,
            yEnd: bottomY - TILE * 8,
            cycleDuration: cycle,
            offset: cycle * 0.5,
            state: 'idle',
            stateProgress: 0,
          }
        );
        world.rings.push({ id: this.uid(), x: midX, y: bottomY - TILE * 6 });
        world.gems.push({ id: this.uid(), x: midX, y: bottomY - TILE * 4.7, collected: false, bobOffset: 2.1 });
        break;
      }

      case 3: {
        const pivotY = bottomY - TILE * 5;
        world.firebars.push({
          id: this.uid(),
          pivotX: midX,
          pivotY,
          length: difficulty > 0.5 ? 5 : 4,
          spacing: 12,
          angle: idx * 0.7,
          angularSpeed: (mirror ? -1 : 1) * (1.85 + difficulty * 0.85),
        });
        world.crumbles.push({
          id: this.uid(),
          x: mirror ? sx + TILE * 2 : sx + VIRTUAL_W - TILE * 5,
          y: bottomY - TILE * 2,
          w: TILE * 3,
          h: TILE,
          state: 'idle',
          timer: 0,
          respawnTimer: 0,
        });
        world.rings.push({
          id: this.uid(),
          x: mirror ? sx + VIRTUAL_W - TILE * 4 : sx + TILE * 4,
          y: bottomY - TILE * 8,
        });
        world.gems.push(
          { id: this.uid(), x: sx + TILE * 3, y: pivotY, collected: false, bobOffset: 0.2 },
          { id: this.uid(), x: sx + VIRTUAL_W - TILE * 3, y: pivotY, collected: false, bobOffset: 1.5 }
        );
        break;
      }

      case 4: {
        const pillarX = midX - TILE / 2;
        for (let r = 2; r <= 7; r++) {
          world.solids.push({
            id: this.uid(),
            x: pillarX,
            y: bottomY - r * TILE,
            w: TILE,
            h: TILE,
            kind: 'pillar',
          });
        }
        world.spikes.push({ id: this.uid(), x: pillarX, y: bottomY - TILE * 8, dir: 'up' });
        world.saws.push(
          {
            id: this.uid(),
            baseX: sx + TILE * 4,
            baseY: bottomY - TILE * 4.5,
            x: sx + TILE * 4,
            y: bottomY - TILE * 4.5,
            moveX: 0,
            moveY: 28,
            speed: 2.1 + difficulty * 0.8,
            phase: 0,
            radius: 6.5,
          },
          {
            id: this.uid(),
            baseX: sx + VIRTUAL_W - TILE * 4,
            baseY: bottomY - TILE * 5.5,
            x: sx + VIRTUAL_W - TILE * 4,
            y: bottomY - TILE * 5.5,
            moveX: 0,
            moveY: 28,
            speed: 2.1 + difficulty * 0.8,
            phase: Math.PI,
            radius: 6.5,
          }
        );
        world.gems.push(
          { id: this.uid(), x: sx + TILE * 4, y: bottomY - TILE * 8, collected: false, bobOffset: 0.7 },
          { id: this.uid(), x: sx + VIRTUAL_W - TILE * 4, y: bottomY - TILE * 8, collected: false, bobOffset: 2.2 }
        );
        break;
      }

      case 5: {
        for (let r = 3; r <= 6; r++) {
          world.spikes.push(
            { id: this.uid(), x: sx + TILE, y: bottomY - r * TILE, dir: 'right' },
            { id: this.uid(), x: sx + VIRTUAL_W - TILE * 2, y: bottomY - r * TILE, dir: 'left' }
          );
        }
        world.rings.push(
          { id: this.uid(), x: mirror ? sx + TILE * 5 : sx + VIRTUAL_W - TILE * 5, y: bottomY - TILE * 4.5 },
          { id: this.uid(), x: mirror ? sx + VIRTUAL_W - TILE * 5 : sx + TILE * 5, y: bottomY - TILE * 8 }
        );
        world.crumbles.push({
          id: this.uid(),
          x: sx + TILE * 6,
          y: bottomY - TILE * 2,
          w: TILE * 4,
          h: TILE,
          state: 'idle',
          timer: 0,
          respawnTimer: 0,
        });
        world.gems.push(
          { id: this.uid(), x: midX, y: bottomY - TILE * 6, collected: false, bobOffset: 0.5 },
          { id: this.uid(), x: midX, y: bottomY - TILE * 9, collected: false, bobOffset: 1.9 }
        );
        break;
      }

      case 6: {
        world.crumbles.push(
          {
            id: this.uid(),
            x: sx + TILE * 2,
            y: bottomY - TILE * 3,
            w: TILE * 3,
            h: TILE,
            state: 'idle',
            timer: 0,
            respawnTimer: 0,
          },
          {
            id: this.uid(),
            x: sx + VIRTUAL_W - TILE * 5,
            y: bottomY - TILE * 7,
            w: TILE * 3,
            h: TILE,
            state: 'idle',
            timer: 0,
            respawnTimer: 0,
          }
        );
        world.firebars.push({
          id: this.uid(),
          pivotX: mirror ? sx + TILE * 5.5 : sx + VIRTUAL_W - TILE * 5.5,
          pivotY: bottomY - TILE * 5,
          length: 4,
          spacing: 11,
          angle: 0.5,
          angularSpeed: (mirror ? 1 : -1) * (2.0 + difficulty * 0.7),
        });
        world.spikes.push({
          id: this.uid(),
          x: mirror ? sx + VIRTUAL_W - TILE * 2 : sx + TILE,
          y: bottomY - TILE * 6,
          dir: mirror ? 'left' : 'right',
        });
        world.rings.push({ id: this.uid(), x: midX, y: bottomY - TILE * 9 });
        break;
      }

      case 7: {
        const interval = Math.max(1.35, 2.0 - difficulty * 0.55);
        const speed = 135 + difficulty * 40;
        world.solids.push(
          {
            id: this.uid(),
            x: sx + TILE * 2,
            y: bottomY - TILE * 2,
            w: TILE * 3,
            h: TILE,
            kind: 'ledge',
          },
          {
            id: this.uid(),
            x: sx + VIRTUAL_W - TILE * 5,
            y: bottomY - TILE * 6,
            w: TILE * 3,
            h: TILE,
            kind: 'ledge',
          }
        );
        world.turrets.push(
          {
            id: this.uid(),
            x: sx,
            y: bottomY - TILE * 4,
            dir: 'right',
            interval,
            timer: 0.4,
            dartSpeed: speed,
          },
          {
            id: this.uid(),
            x: sx + VIRTUAL_W - TILE,
            y: bottomY - TILE * 7,
            dir: 'left',
            interval,
            timer: interval * 0.55,
            dartSpeed: speed,
          }
        );
        world.rings.push({ id: this.uid(), x: midX, y: bottomY - TILE * 5 });
        world.gems.push(
          { id: this.uid(), x: midX, y: bottomY - TILE * 3.5, collected: false, bobOffset: 0.3 },
          { id: this.uid(), x: midX, y: bottomY - TILE * 8.2, collected: false, bobOffset: 1.7 }
        );
        break;
      }

      case 8: {
        // Bat Roost Chamber with alternating ledges and a grapple ring
        world.solids.push(
          {
            id: this.uid(),
            x: sx + TILE * 2,
            y: bottomY - TILE * 3,
            w: TILE * 4,
            h: TILE,
            kind: 'ledge',
          },
          {
            id: this.uid(),
            x: sx + VIRTUAL_W - TILE * 6,
            y: bottomY - TILE * 6,
            w: TILE * 4,
            h: TILE,
            kind: 'ledge',
          }
        );
        world.crumbles.push({
          id: this.uid(),
          x: sx + TILE * 6,
          y: bottomY - TILE * 8,
          w: TILE * 4,
          h: TILE,
          state: 'idle',
          timer: 0,
          respawnTimer: 0,
        });
        const bat1X = mirror ? sx + TILE * 5 : sx + VIRTUAL_W - TILE * 5;
        const bat2X = mirror ? sx + VIRTUAL_W - TILE * 4 : sx + TILE * 4;
        world.bats.push(
          {
            id: this.uid(),
            homeX: bat1X,
            homeY: bottomY - TILE * 4.5,
            x: bat1X,
            y: bottomY - TILE * 4.5,
            vx: 0,
            vy: 0,
            state: 'perched',
            timer: 0,
            cooldown: 0,
            spotted: false,
          },
          {
            id: this.uid(),
            homeX: bat2X,
            homeY: bottomY - TILE * 8.5,
            x: bat2X,
            y: bottomY - TILE * 8.5,
            vx: 0,
            vy: 0,
            state: 'perched',
            timer: 0,
            cooldown: 0,
            spotted: false,
          }
        );
        world.rings.push({ id: this.uid(), x: midX, y: bottomY - TILE * 5 });
        world.gems.push(
          { id: this.uid(), x: sx + TILE * 4, y: bottomY - TILE * 4.5, collected: false, bobOffset: 0.4 },
          { id: this.uid(), x: midX, y: bottomY - TILE * 9.5, collected: false, bobOffset: 1.8 }
        );
        break;
      }

      case 9: {
        // Moving Platforms & Bounce Pad Vault
        const padSideX = mirror ? sx + VIRTUAL_W - TILE * 4 : sx + TILE * 3;
        const ledgeX = mirror ? sx + VIRTUAL_W - TILE * 5 : sx + TILE * 2;
        world.solids.push({
          id: this.uid(),
          x: ledgeX,
          y: bottomY - TILE * 2,
          w: TILE * 3,
          h: TILE,
          kind: 'ledge',
        });
        world.bouncePads.push({
          id: this.uid(),
          x: padSideX,
          y: bottomY - TILE * 3,
          w: TILE,
          h: TILE,
          power: 355,
          compressTimer: 0,
        });
        // Small overhead spike hazard to steer around during the bounce
        const hazardX = mirror ? sx + VIRTUAL_W - TILE * 4 : sx + TILE * 3;
        world.solids.push({
          id: this.uid(),
          x: hazardX,
          y: bottomY - TILE * 7,
          w: TILE,
          h: TILE,
          kind: 'pillar',
        });
        world.spikes.push({
          id: this.uid(),
          x: hazardX,
          y: bottomY - TILE * 6,
          dir: 'down',
        });
        // Horizontal patrolling moving platform + vertical lift
        world.movingPlatforms.push(
          {
            id: this.uid(),
            baseX: midX - TILE * 1.5,
            baseY: bottomY - TILE * 4.5,
            x: midX - TILE * 1.5,
            y: bottomY - TILE * 4.5,
            prevX: midX - TILE * 1.5,
            prevY: bottomY - TILE * 4.5,
            w: TILE * 3,
            h: TILE,
            moveX: 44,
            moveY: 0,
            speed: 1.45 + difficulty * 0.55,
            phase: idx * 0.6,
          },
          {
            id: this.uid(),
            baseX: mirror ? sx + TILE * 3 : sx + VIRTUAL_W - TILE * 6,
            baseY: bottomY - TILE * 7.5,
            x: mirror ? sx + TILE * 3 : sx + VIRTUAL_W - TILE * 6,
            y: bottomY - TILE * 7.5,
            prevX: mirror ? sx + TILE * 3 : sx + VIRTUAL_W - TILE * 6,
            prevY: bottomY - TILE * 7.5,
            w: TILE * 3,
            h: TILE,
            moveX: 0,
            moveY: 22,
            speed: 1.65 + difficulty * 0.5,
            phase: 1.1,
          }
        );
        world.rings.push({ id: this.uid(), x: midX, y: bottomY - TILE * 8.5 });
        world.gems.push(
          { id: this.uid(), x: padSideX + 8, y: bottomY - TILE * 4.5, collected: false, bobOffset: 0.3 },
          { id: this.uid(), x: midX, y: bottomY - TILE * 6, collected: false, bobOffset: 1.5 }
        );
        break;
      }

      case 10: {
        // Spring Trap Gauntlet: Bounce Pads + Saw + Moving Shuttle
        world.solids.push(
          {
            id: this.uid(),
            x: sx + TILE * 2,
            y: bottomY - TILE * 2,
            w: TILE * 3,
            h: TILE,
            kind: 'ledge',
          },
          {
            id: this.uid(),
            x: sx + VIRTUAL_W - TILE * 5,
            y: bottomY - TILE * 2,
            w: TILE * 3,
            h: TILE,
            kind: 'ledge',
          }
        );
        world.bouncePads.push(
          {
            id: this.uid(),
            x: sx + TILE * 3,
            y: bottomY - TILE * 3,
            w: TILE,
            h: TILE,
            power: 345,
            compressTimer: 0,
          },
          {
            id: this.uid(),
            x: sx + VIRTUAL_W - TILE * 4,
            y: bottomY - TILE * 3,
            w: TILE,
            h: TILE,
            power: 345,
            compressTimer: 0,
          }
        );
        world.movingPlatforms.push({
          id: this.uid(),
          baseX: midX - TILE * 1.5,
          baseY: bottomY - TILE * 6.5,
          x: midX - TILE * 1.5,
          y: bottomY - TILE * 6.5,
          prevX: midX - TILE * 1.5,
          prevY: bottomY - TILE * 6.5,
          w: TILE * 3,
          h: TILE,
          moveX: 52,
          moveY: 0,
          speed: 1.7 + difficulty * 0.65,
          phase: 0.3,
        });
        world.saws.push({
          id: this.uid(),
          baseX: midX,
          baseY: bottomY - TILE * 4.5,
          x: midX,
          y: bottomY - TILE * 4.5,
          moveX: 48,
          moveY: 0,
          speed: 1.85 + difficulty * 0.7,
          phase: Math.PI * 0.5,
          radius: 6.5,
        });
        world.gems.push(
          { id: this.uid(), x: sx + TILE * 3.5, y: bottomY - TILE * 5.2, collected: false, bobOffset: 0.4 },
          { id: this.uid(), x: sx + VIRTUAL_W - TILE * 3.5, y: bottomY - TILE * 5.2, collected: false, bobOffset: 1.7 }
        );
        break;
      }

      case 11: {
        // Vertical Moving Elevator + Pulsing Laser + High Bounce Pad
        const elevX = mirror ? sx + TILE * 3 : sx + VIRTUAL_W - TILE * 6;
        const farX = mirror ? sx + VIRTUAL_W - TILE * 6 : sx + TILE * 3;
        world.movingPlatforms.push({
          id: this.uid(),
          baseX: elevX,
          baseY: bottomY - TILE * 4,
          x: elevX,
          y: bottomY - TILE * 4,
          prevX: elevX,
          prevY: bottomY - TILE * 4,
          w: TILE * 3,
          h: TILE,
          moveX: 0,
          moveY: 32,
          speed: 1.5 + difficulty * 0.5,
          phase: 0,
        });
        world.solids.push({
          id: this.uid(),
          x: farX,
          y: bottomY - TILE * 6,
          w: TILE * 3,
          h: TILE,
          kind: 'ledge',
        });
        world.bouncePads.push({
          id: this.uid(),
          x: farX + TILE,
          y: bottomY - TILE * 7,
          w: TILE,
          h: TILE,
          power: 350,
          compressTimer: 0,
        });
        const cycle = Math.max(2.3, 3.1 - difficulty * 0.6);
        world.lasers.push({
          id: this.uid(),
          orientation: 'horizontal',
          x: sx + TILE,
          y: bottomY - TILE * 5,
          xStart: sx + TILE,
          xEnd: sx + VIRTUAL_W - TILE,
          yStart: bottomY - TILE * 5,
          yEnd: bottomY - TILE * 5,
          cycleDuration: cycle,
          offset: 0.2,
          state: 'idle',
          stateProgress: 0,
        });
        world.rings.push({ id: this.uid(), x: midX, y: bottomY - TILE * 8.5 });
        world.gems.push({ id: this.uid(), x: midX, y: bottomY - TILE * 6.5, collected: false, bobOffset: 1.0 });
        break;
      }

      default: {
        const cycle = Math.max(2.2, 3.0 - difficulty * 0.6);
        world.lasers.push({
          id: this.uid(),
          orientation: 'horizontal',
          x: sx + TILE,
          y: bottomY - TILE * 5,
          xStart: sx + TILE,
          xEnd: sx + VIRTUAL_W - TILE,
          yStart: bottomY - TILE * 5,
          yEnd: bottomY - TILE * 5,
          cycleDuration: cycle,
          offset: 0.4,
          state: 'idle',
          stateProgress: 0,
        });
        world.saws.push({
          id: this.uid(),
          baseX: midX,
          baseY: bottomY - TILE * 8,
          x: midX,
          y: bottomY - TILE * 8,
          moveX: 60,
          moveY: 0,
          speed: 2.0 + difficulty * 0.9,
          phase: 1.2,
          radius: 6.5,
        });
        world.turrets.push({
          id: this.uid(),
          x: mirror ? sx : sx + VIRTUAL_W - TILE,
          y: bottomY - TILE * 3,
          dir: mirror ? 'right' : 'left',
          interval: Math.max(1.5, 2.2 - difficulty * 0.5),
          timer: 0.8,
          dartSpeed: 140 + difficulty * 35,
        });
        world.crumbles.push({
          id: this.uid(),
          x: sx + TILE * 6,
          y: bottomY - TILE * 3,
          w: TILE * 4,
          h: TILE,
          state: 'idle',
          timer: 0,
          respawnTimer: 0,
        });
        world.rings.push({
          id: this.uid(),
          x: mirror ? sx + TILE * 4.5 : sx + VIRTUAL_W - TILE * 4.5,
          y: bottomY - TILE * 6.5,
        });
        world.gems.push({ id: this.uid(), x: midX, y: bottomY - TILE * 9.5, collected: false, bobOffset: 1.1 });
        break;
      }
    }

    this.topGeneratedY = bottomY - rows * TILE;
  }

  private generateHorizontalWing(world: WorldEntities) {
    this.totalWingsSpawned++;
    const idx = this.chunkIndex++;
    const difficulty = Math.min(1, idx / 20);
    const dir: -1 | 1 = this.totalWingsSpawned === 1 ? (Math.random() < 0.5 ? 1 : -1) : (-this.lastWingDir as -1 | 1);
    this.lastWingDir = dir;

    const wingRows = 10;
    const lenCols = 22;
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

    const wingStyle = (this.totalWingsSpawned - 1) % 4;
    const cStart = corrLeftX;
    const cMid = corrLeftX + Math.floor(corrWidth / 2);
    const turretInterval = Math.max(1.35, 2.1 - difficulty * 0.55);
    const dartSpeed = 145 + difficulty * 35;

    if (wingStyle === 0) {
      world.solids.push({ id: this.uid(), x: cStart, y: wingFloorY, w: TILE * 4, h: TILE, kind: 'ledge' });
      const midIslandX = cStart + TILE * 9;
      world.solids.push({ id: this.uid(), x: midIslandX, y: wingFloorY, w: TILE * 5, h: TILE, kind: 'ledge' });
      world.solids.push({ id: this.uid(), x: cStart + corrWidth - TILE * 4, y: wingFloorY, w: TILE * 4, h: TILE, kind: 'ledge' });

      world.crumbles.push(
        {
          id: this.uid(),
          x: cStart + TILE * 5,
          y: wingFloorY,
          w: TILE * 3,
          h: TILE,
          state: 'idle',
          timer: 0,
          respawnTimer: 0,
        },
        {
          id: this.uid(),
          x: cStart + TILE * 15,
          y: wingFloorY,
          w: TILE * 3,
          h: TILE,
          state: 'idle',
          timer: 0,
          respawnTimer: 0,
        }
      );

      world.spikes.push({ id: this.uid(), x: midIslandX + TILE * 2, y: wingFloorY - TILE, dir: 'up' });
      world.rings.push(
        { id: this.uid(), x: cStart + TILE * 6.5, y: wingTopY + TILE * 3 },
        { id: this.uid(), x: cStart + TILE * 16.5, y: wingTopY + TILE * 3 }
      );

      const turretX = dir === 1 ? cStart + corrWidth - TILE * 2 : cStart + TILE;
      world.solids.push({ id: this.uid(), x: turretX, y: wingFloorY - TILE, w: TILE, h: TILE, kind: 'pillar' });
      world.turrets.push({
        id: this.uid(),
        x: turretX,
        y: wingFloorY - TILE * 2,
        dir: dir === 1 ? 'left' : 'right',
        interval: turretInterval,
        timer: 0.5,
        dartSpeed,
      });

      world.gems.push(
        { id: this.uid(), x: cStart + TILE * 6.5, y: wingTopY + TILE * 4.5, collected: false, bobOffset: 0.2 },
        { id: this.uid(), x: midIslandX + TILE * 2.5, y: wingFloorY - TILE * 3, collected: false, bobOffset: 1.4 },
        { id: this.uid(), x: cStart + TILE * 16.5, y: wingTopY + TILE * 4.5, collected: false, bobOffset: 2.5 }
      );
    } else if (wingStyle === 1) {
      world.solids.push(
        { id: this.uid(), x: cStart, y: wingFloorY, w: TILE * 6, h: TILE, kind: 'ledge' },
        { id: this.uid(), x: cStart + TILE * 8, y: wingFloorY, w: TILE * 6, h: TILE, kind: 'ledge' },
        { id: this.uid(), x: cStart + TILE * 16, y: wingFloorY, w: corrWidth - TILE * 16, h: TILE, kind: 'ledge' }
      );
      world.crumbles.push(
        { id: this.uid(), x: cStart + TILE * 6, y: wingFloorY, w: TILE * 2, h: TILE, state: 'idle', timer: 0, respawnTimer: 0 },
        { id: this.uid(), x: cStart + TILE * 14, y: wingFloorY, w: TILE * 2, h: TILE, state: 'idle', timer: 0, respawnTimer: 0 }
      );

      const cycle = Math.max(2.3, 3.1 - difficulty * 0.6);
      world.lasers.push(
        {
          id: this.uid(),
          orientation: 'vertical',
          x: cStart + TILE * 5,
          y: wingTopY,
          xStart: cStart + TILE * 5,
          xEnd: cStart + TILE * 5,
          yStart: wingTopY + TILE,
          yEnd: wingFloorY,
          cycleDuration: cycle,
          offset: 0,
          state: 'idle',
          stateProgress: 0,
        },
        {
          id: this.uid(),
          orientation: 'vertical',
          x: cStart + TILE * 15,
          y: wingTopY,
          xStart: cStart + TILE * 15,
          xEnd: cStart + TILE * 15,
          yStart: wingTopY + TILE,
          yEnd: wingFloorY,
          cycleDuration: cycle,
          offset: cycle * 0.5,
          state: 'idle',
          stateProgress: 0,
        }
      );

      world.turrets.push(
        {
          id: this.uid(),
          x: cStart + TILE * 9,
          y: wingTopY,
          dir: 'down',
          interval: turretInterval,
          timer: 0.3,
          dartSpeed: dartSpeed - 10,
        },
        {
          id: this.uid(),
          x: cStart + TILE * 12,
          y: wingTopY,
          dir: 'down',
          interval: turretInterval,
          timer: turretInterval * 0.5,
          dartSpeed: dartSpeed - 10,
        }
      );

      world.saws.push({
        id: this.uid(),
        baseX: cMid,
        baseY: wingFloorY - TILE * 2.5,
        x: cMid,
        y: wingFloorY - TILE * 2.5,
        moveX: 0,
        moveY: 26,
        speed: 2.1 + difficulty * 0.7,
        phase: 0.4,
        radius: 6.5,
      });

      world.rings.push({ id: this.uid(), x: cMid, y: wingTopY + TILE * 2.5 });
      world.gems.push(
        { id: this.uid(), x: cStart + TILE * 7, y: wingFloorY - TILE * 2, collected: false, bobOffset: 0.5 },
        { id: this.uid(), x: cStart + TILE * 11, y: wingFloorY - TILE * 3.5, collected: false, bobOffset: 1.8 }
      );
    } else if (wingStyle === 2) {
      world.solids.push(
        { id: this.uid(), x: cStart, y: wingFloorY, w: TILE * 5, h: TILE, kind: 'ledge' },
        { id: this.uid(), x: cMid - TILE * 2, y: wingFloorY - TILE * 2, w: TILE * 4, h: TILE, kind: 'ledge' },
        { id: this.uid(), x: cStart + corrWidth - TILE * 5, y: wingFloorY, w: TILE * 5, h: TILE, kind: 'ledge' }
      );
      world.crumbles.push(
        { id: this.uid(), x: cStart + TILE * 6, y: wingFloorY - TILE, w: TILE * 3, h: TILE, state: 'idle', timer: 0, respawnTimer: 0 },
        { id: this.uid(), x: cStart + corrWidth - TILE * 9, y: wingFloorY - TILE, w: TILE * 3, h: TILE, state: 'idle', timer: 0, respawnTimer: 0 }
      );

      world.firebars.push({
        id: this.uid(),
        pivotX: cMid,
        pivotY: wingTopY + TILE * 4,
        length: 4,
        spacing: 11,
        angle: 0,
        angularSpeed: (dir === 1 ? 1 : -1) * (1.9 + difficulty * 0.7),
      });

      const turretX = dir === 1 ? cStart + corrWidth - TILE * 2 : cStart + TILE;
      world.turrets.push({
        id: this.uid(),
        x: turretX,
        y: wingFloorY - TILE * 3,
        dir: dir === 1 ? 'left' : 'right',
        interval: turretInterval,
        timer: 0.7,
        dartSpeed,
      });

      world.rings.push(
        { id: this.uid(), x: cStart + TILE * 6, y: wingTopY + TILE * 2.5 },
        { id: this.uid(), x: cStart + corrWidth - TILE * 6, y: wingTopY + TILE * 2.5 }
      );
      world.bats.push({
        id: this.uid(),
        homeX: cStart + TILE * 11,
        homeY: wingTopY + TILE * 1.5,
        x: cStart + TILE * 11,
        y: wingTopY + TILE * 1.5,
        vx: 0,
        vy: 0,
        state: 'perched',
        timer: 0,
        cooldown: 0,
        spotted: false,
      });
      world.gems.push(
        { id: this.uid(), x: cStart + TILE * 7.5, y: wingFloorY - TILE * 3, collected: false, bobOffset: 0.6 },
        { id: this.uid(), x: cMid, y: wingFloorY - TILE * 3.5, collected: false, bobOffset: 1.7 },
        { id: this.uid(), x: cStart + corrWidth - TILE * 7.5, y: wingFloorY - TILE * 3, collected: false, bobOffset: 2.9 }
      );
    } else {
      // wingStyle === 3: Moving Platform Ferries & Bounce Pad Vaults
      world.solids.push(
        { id: this.uid(), x: cStart, y: wingFloorY, w: TILE * 4, h: TILE, kind: 'ledge' },
        { id: this.uid(), x: cMid - TILE, y: wingFloorY, w: TILE * 2, h: TILE, kind: 'ledge' },
        { id: this.uid(), x: cStart + corrWidth - TILE * 4, y: wingFloorY, w: TILE * 4, h: TILE, kind: 'ledge' }
      );
      world.movingPlatforms.push(
        {
          id: this.uid(),
          baseX: cStart + TILE * 5.5,
          baseY: wingFloorY - TILE * 0.5,
          x: cStart + TILE * 5.5,
          y: wingFloorY - TILE * 0.5,
          prevX: cStart + TILE * 5.5,
          prevY: wingFloorY - TILE * 0.5,
          w: TILE * 3,
          h: TILE,
          moveX: 28,
          moveY: 0,
          speed: 1.65 + difficulty * 0.5,
          phase: 0,
        },
        {
          id: this.uid(),
          baseX: cStart + corrWidth - TILE * 8.5,
          baseY: wingFloorY - TILE * 0.5,
          x: cStart + corrWidth - TILE * 8.5,
          y: wingFloorY - TILE * 0.5,
          prevX: cStart + corrWidth - TILE * 8.5,
          prevY: wingFloorY - TILE * 0.5,
          w: TILE * 3,
          h: TILE,
          moveX: 28,
          moveY: 0,
          speed: 1.65 + difficulty * 0.5,
          phase: Math.PI,
        }
      );
      world.bouncePads.push({
        id: this.uid(),
        x: cMid - TILE * 0.5,
        y: wingFloorY - TILE,
        w: TILE,
        h: TILE,
        power: 335,
        compressTimer: 0,
      });
      world.spikes.push({
        id: this.uid(),
        x: cMid - TILE * 0.5,
        y: wingTopY + TILE,
        dir: 'down',
      });
      world.rings.push(
        { id: this.uid(), x: cStart + TILE * 7, y: wingTopY + TILE * 3 },
        { id: this.uid(), x: cStart + corrWidth - TILE * 7, y: wingTopY + TILE * 3 }
      );
      world.gems.push(
        { id: this.uid(), x: cStart + TILE * 7, y: wingFloorY - TILE * 2.5, collected: false, bobOffset: 0.4 },
        { id: this.uid(), x: cMid - TILE * 2, y: wingTopY + TILE * 3.5, collected: false, bobOffset: 1.5 },
        { id: this.uid(), x: cMid + TILE * 2, y: wingTopY + TILE * 3.5, collected: false, bobOffset: 2.6 }
      );
    }

    this.shaftX = newShaftX;
    this.topGeneratedY = wingTopY;
  }
}
