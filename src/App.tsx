import { useCallback, useEffect, useRef, useState } from 'react';
import { Home, Pause, Play, RotateCcw, Shirt, Volume2, VolumeX, X } from 'lucide-react';
import { PixelSpritePreview } from './components/PixelSpritePreview';
import { retroAudio } from './game/audio';
import { GameEngine, InputState } from './game/engine';
import { HudSnapshot, SkinId, SKINS, VIRTUAL_H, VIRTUAL_W } from './game/types';

const INITIAL_HUD: HudSnapshot = {
  gameState: 'TITLE_MENU',
  score: 0,
  bestScore: 0,
  altitudeMeters: 0,
  bestAltitudeMeters: 0,
  wingsCleared: 0,
  gemsCollected: 0,
  totalGems: 0,
  selectedSkin: 'strider',
  unlockedSkins: ['strider'],
  comboCount: 0,
  deathReason: '',
  canDoubleJump: true,
  canBackflip: false,
  grappleReady: false,
  wallContact: false,
  risingHazardDistance: 99,
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const deathTimestampRef = useRef<number>(0);

  const inputRef = useRef<InputState>({
    left: false,
    right: false,
    jumpHeld: false,
    jumpPressed: false,
    jumpReleased: false,
    grapplePressed: false,
    pointerWorldX: null,
    pointerWorldY: null,
  });

  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [muted, setMuted] = useState(false);
  const [rightTab, setRightTab] = useState<'hazards' | 'skins'>('hazards');
  const [skinsModalOpen, setSkinsModalOpen] = useState(false);
  const skinsOpenRef = useRef(false);

  useEffect(() => {
    skinsOpenRef.current = skinsModalOpen;
  }, [skinsModalOpen]);

  const focusCanvas = useCallback(() => {
    const active = document.activeElement as HTMLElement | null;
    if (active && active !== canvasRef.current && typeof active.blur === 'function') {
      active.blur();
    }
    canvasRef.current?.focus({ preventScroll: true });
  }, []);

  const triggerStart = useCallback(() => {
    setSkinsModalOpen(false);
    engineRef.current?.startNewRun();
    focusCanvas();
  }, [focusCanvas]);

  const triggerPause = useCallback(() => {
    setSkinsModalOpen(false);
    engineRef.current?.togglePause();
    focusCanvas();
  }, [focusCanvas]);

  const triggerMainMenu = useCallback(() => {
    setSkinsModalOpen(false);
    inputRef.current.left = false;
    inputRef.current.right = false;
    inputRef.current.jumpHeld = false;
    inputRef.current.jumpPressed = false;
    inputRef.current.jumpReleased = false;
    inputRef.current.grapplePressed = false;
    engineRef.current?.goToMainMenu();
  }, []);

  const openSkinsModal = useCallback(() => {
    if (engineRef.current?.state === 'PLAYING') {
      engineRef.current.togglePause();
    }
    setRightTab('skins');
    setSkinsModalOpen(true);
  }, []);

  const closeSkinsModal = useCallback(() => {
    setSkinsModalOpen(false);
    focusCanvas();
  }, [focusCanvas]);

  const handleSkinAction = useCallback((skinId: SkinId) => {
    engineRef.current?.unlockOrEquipSkin(skinId);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      retroAudio.setMuted(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const engine = new GameEngine((snapshot) => {
      setHud((prev) => {
        if (prev.gameState !== 'GAME_OVER' && snapshot.gameState === 'GAME_OVER') {
          deathTimestampRef.current = performance.now();
        }
        return snapshot;
      });
    });
    engineRef.current = engine;

    let rafId = 0;
    let lastTime = performance.now();
    let accumulator = 0;
    const FIXED_DT = 1 / 60;

    const frame = (now: number) => {
      const elapsed = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      accumulator += elapsed;

      while (accumulator >= FIXED_DT) {
        engine.step(FIXED_DT, inputRef.current);
        inputRef.current.jumpPressed = false;
        inputRef.current.jumpReleased = false;
        inputRef.current.grapplePressed = false;
        accumulator -= FIXED_DT;
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          engine.render(ctx);
        }
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    const normKey = (e: KeyboardEvent) => (e.key || '').toLowerCase();
    const isJumpKey = (e: KeyboardEvent) => {
      const k = normKey(e);
      return (
        e.code === 'Space' ||
        e.code === 'KeyW' ||
        e.code === 'ArrowUp' ||
        e.code === 'KeyZ' ||
        e.code === 'KeyK' ||
        e.code === 'KeyI' ||
        k === ' ' ||
        k === 'spacebar' ||
        k === 'w' ||
        k === 'arrowup' ||
        k === 'z' ||
        k === 'k' ||
        k === 'i'
      );
    };
    const isLeftKey = (e: KeyboardEvent) => {
      const k = normKey(e);
      return e.code === 'KeyA' || e.code === 'ArrowLeft' || k === 'a' || k === 'arrowleft';
    };
    const isRightKey = (e: KeyboardEvent) => {
      const k = normKey(e);
      return e.code === 'KeyD' || e.code === 'ArrowRight' || k === 'd' || k === 'arrowright';
    };
    const isGrappleKey = (e: KeyboardEvent) => {
      const k = normKey(e);
      return (
        e.code === 'KeyE' ||
        e.code === 'KeyQ' ||
        e.code === 'ShiftLeft' ||
        e.code === 'ShiftRight' ||
        e.code === 'KeyX' ||
        e.code === 'KeyJ' ||
        e.code === 'KeyC' ||
        e.code === 'KeyF' ||
        k === 'e' ||
        k === 'q' ||
        k === 'shift' ||
        k === 'x' ||
        k === 'j' ||
        k === 'c' ||
        k === 'f'
      );
    };
    const isPauseKey = (e: KeyboardEvent) => {
      const k = normKey(e);
      return e.code === 'Escape' || e.code === 'KeyP' || k === 'escape' || k === 'esc' || k === 'p';
    };
    const isRestartKey = (e: KeyboardEvent) => e.code === 'KeyR' || normKey(e) === 'r';
    const isMenuKey = (e: KeyboardEvent) => e.code === 'KeyM' || normKey(e) === 'm';
    const isEnterKey = (e: KeyboardEvent) => e.code === 'Enter' || normKey(e) === 'enter';

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }

      const engine = engineRef.current;
      if (!engine) return;

      if (skinsOpenRef.current) {
        if ((e.code === 'Escape' || normKey(e) === 'escape') && !e.repeat) {
          setSkinsModalOpen(false);
          focusCanvas();
        }
        return;
      }

      if (isJumpKey(e) || isLeftKey(e) || isRightKey(e) || normKey(e) === 'arrowdown' || e.code === 'ArrowDown') {
        e.preventDefault();
      }

      if (isPauseKey(e)) {
        if (!e.repeat && (engine.state === 'PLAYING' || engine.state === 'PAUSED')) {
          engine.togglePause();
        }
        return;
      }

      if (isRestartKey(e) && !e.repeat) {
        if (engine.state === 'PLAYING' || engine.state === 'PAUSED' || engine.state === 'GAME_OVER') {
          engine.startNewRun();
          focusCanvas();
        }
        return;
      }

      if (isMenuKey(e) && !e.repeat) {
        if (engine.state !== 'TITLE_MENU') {
          triggerMainMenu();
        }
        return;
      }

      if (engine.state === 'TITLE_MENU' && (isJumpKey(e) || isEnterKey(e)) && !e.repeat) {
        e.preventDefault();
        engine.startNewRun();
        focusCanvas();
        return;
      }

      if (engine.state === 'GAME_OVER' && (isJumpKey(e) || isEnterKey(e)) && !e.repeat) {
        e.preventDefault();
        if (performance.now() - deathTimestampRef.current > 350) {
          engine.startNewRun();
          focusCanvas();
        }
        return;
      }

      if (isLeftKey(e)) inputRef.current.left = true;
      if (isRightKey(e)) inputRef.current.right = true;
      if (isJumpKey(e)) {
        if (!inputRef.current.jumpHeld && !e.repeat) {
          inputRef.current.jumpPressed = true;
        }
        inputRef.current.jumpHeld = true;
      }
      if ((isGrappleKey(e) || (engine.state === 'PLAYING' && isEnterKey(e))) && !e.repeat) {
        inputRef.current.grapplePressed = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (isLeftKey(e)) inputRef.current.left = false;
      if (isRightKey(e)) inputRef.current.right = false;
      if (isJumpKey(e)) {
        if (inputRef.current.jumpHeld) {
          inputRef.current.jumpReleased = true;
        }
        inputRef.current.jumpHeld = false;
      }
    };

    const resetKeys = () => {
      inputRef.current.left = false;
      inputRef.current.right = false;
      inputRef.current.jumpHeld = false;
    };

    const onVisibilityChange = () => {
      if (document.hidden) resetKeys();
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', resetKeys);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', resetKeys);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [focusCanvas, triggerMainMenu]);

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;
    const rect = canvas.getBoundingClientRect();
    const vx = ((e.clientX - rect.left) / rect.width) * VIRTUAL_W + engine.cameraX;
    const vy = ((e.clientY - rect.top) / rect.height) * VIRTUAL_H + engine.cameraY;
    inputRef.current.pointerWorldX = vx;
    inputRef.current.pointerWorldY = vy;
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    handleCanvasPointerMove(e);
    if (engineRef.current?.state === 'PLAYING') {
      inputRef.current.grapplePressed = true;
    }
  };

  const handleCanvasPointerLeave = () => {
    inputRef.current.pointerWorldX = null;
    inputRef.current.pointerWorldY = null;
  };

  const jumpStatusLabel = hud.canDoubleJump
    ? 'Double Jump Ready'
    : hud.canBackflip
      ? 'Tap Jump: Backflip Ready'
      : 'Air Charges Used';

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col">
      {/* Top Bar Contract: 3 zones */}
      <header className="border-b border-slate-800/90 bg-[#0e131c]">
        <div className="max-w-[1280px] mx-auto px-6 py-3.5 flex items-center justify-between gap-8">
          <span className="font-pixel text-lg tracking-tight text-amber-400 whitespace-nowrap shrink-0">
            Pixel Spire
          </span>

          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400 whitespace-nowrap shrink-0">
            <span>Endless 16x16 Climber</span>
            <span aria-hidden="true">·</span>
            <span>
              Best{' '}
              <strong className="font-mono-tabular text-slate-100">{hud.bestAltitudeMeters}m</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              High Score{' '}
              <strong className="font-mono-tabular text-amber-400">{hud.bestScore}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5">
              <PixelSpritePreview sprite="gem_0" size={16} label="Gem icon" />
              <strong className="font-mono-tabular text-sky-400">{hud.totalGems}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? 'Unmute audio' : 'Mute audio'}
              className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-2 text-xs font-medium text-slate-300 bg-[#151c28] border border-slate-800 rounded-md hover:text-white hover:border-slate-700 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{muted ? 'Muted' : 'Audio On'}</span>
            </button>

            <button
              type="button"
              onClick={openSkinsModal}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-medium text-sky-300 bg-[#151c28] border border-slate-800 rounded-md hover:text-white hover:border-sky-500/60 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              <Shirt className="w-3.5 h-3.5" />
              <span>Skins</span>
            </button>

            {hud.gameState !== 'TITLE_MENU' && (
              <button
                type="button"
                onClick={triggerMainMenu}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-medium text-slate-200 bg-[#151c28] border border-slate-800 rounded-md hover:text-white hover:border-slate-700 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-400"
              >
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Main Menu</span>
              </button>
            )}

            {hud.gameState === 'PLAYING' || hud.gameState === 'PAUSED' ? (
              <button
                type="button"
                onClick={triggerPause}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 rounded-md hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-200"
              >
                {hud.gameState === 'PAUSED' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                <span>{hud.gameState === 'PAUSED' ? 'Resume' : 'Pause'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={triggerStart}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 rounded-md hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-200"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start Climb</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main 3-Column Desktop Layout */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-[270px_minmax(0,1fr)_290px] gap-6 items-start">
        {/* Left Column: Live Run Telemetry & Movement Kit */}
        <section className="order-2 lg:order-1 bg-[#111621] border border-slate-800/90 rounded-lg p-5 space-y-6">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Run Telemetry
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <div>
                <div className="text-xs text-slate-400">Score</div>
                <div className="font-mono-tabular text-2xl font-bold text-amber-400">
                  {hud.score}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Altitude</div>
                <div className="font-mono-tabular text-2xl font-bold text-slate-100">
                  {hud.altitudeMeters}m
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Wings</div>
                <div className="font-mono-tabular text-lg font-semibold text-emerald-400">
                  {hud.wingsCleared}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Run Gems</div>
                <div className="font-mono-tabular text-lg font-semibold text-sky-400">
                  +{hud.gemsCollected}
                </div>
              </div>
              <div className="col-span-2 flex items-center justify-between pt-1">
                <span className="text-xs text-slate-400">Gem Bank</span>
                <span className="font-mono-tabular text-sm font-semibold text-sky-300">
                  {hud.totalGems} Gems
                </span>
              </div>
              <div className="col-span-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">Style Streak</span>
                <span className="font-mono-tabular text-sm font-semibold text-rose-400">
                  {hud.comboCount > 0 ? `${hud.comboCount}x` : '0x'}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-5 space-y-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Air & Grapple Status
            </h2>
            <div className="text-sm text-slate-200 flex items-center justify-between">
              <span>Air Action</span>
              <span className="font-mono-tabular text-xs text-sky-300">{jumpStatusLabel}</span>
            </div>
            <div className="text-sm text-slate-200 flex items-center justify-between">
              <span>Grapple Hook</span>
              <span
                className={`font-mono-tabular text-xs ${
                  hud.grappleReady ? 'text-amber-300' : 'text-slate-500'
                }`}
              >
                {hud.grappleReady ? 'Target Locked' : 'Out of Range'}
              </span>
            </div>
            <div className="text-sm text-slate-200 flex items-center justify-between">
              <span>Wall Grip</span>
              <span className="font-mono-tabular text-xs text-slate-300">
                {hud.wallContact ? 'Sliding / Ready' : 'Mid-Air'}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-5 space-y-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Controls
            </h2>
            <dl className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Move Left / Right</dt>
                <dd className="font-mono-tabular text-slate-100">A / D or Arrows</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Jump & Wall Hop</dt>
                <dd className="font-mono-tabular text-slate-100">Space / W / Up / K</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Higher Jump</dt>
                <dd className="font-mono-tabular text-slate-100">Hold Jump</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Double Jump</dt>
                <dd className="font-mono-tabular text-slate-100">Tap in Air</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Backflip</dt>
                <dd className="font-mono-tabular text-rose-300">Tap Again After 2x</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Grapple Hook</dt>
                <dd className="font-mono-tabular text-sky-300">E / Q / Shift / Click</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Restart / Menu / Pause</dt>
                <dd className="font-mono-tabular text-slate-100">R / M / Esc</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Center Column: Primary 16x16 Pixel Game Canvas */}
        <section className="order-1 lg:order-2 flex flex-col items-center">
          <div className="relative w-full max-w-[496px] aspect-[2/3] max-h-[calc(100vh-148px)] bg-[#0d111a] border border-slate-700/90 rounded-lg overflow-hidden shadow-2xl">
            <canvas
              ref={canvasRef}
              tabIndex={0}
              width={VIRTUAL_W}
              height={VIRTUAL_H}
              onPointerMove={handleCanvasPointerMove}
              onPointerDown={(e) => {
                focusCanvas();
                handleCanvasPointerDown(e);
              }}
              onPointerLeave={handleCanvasPointerLeave}
              className="w-full h-full block pixelated cursor-crosshair touch-none focus:outline-none"
            />

            {/* Compact Unobtrusive Top-Right In-Shaft Score Strip during Active Play */}
            {hud.gameState === 'PLAYING' && (
              <div className="pointer-events-none absolute top-2.5 left-6 right-6 flex items-center justify-between text-xs font-mono-tabular text-slate-200/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                <span>{hud.altitudeMeters}m</span>
                <span>{hud.score} pts</span>
              </div>
            )}

            {/* Title Menu Overlay */}
            {hud.gameState === 'TITLE_MENU' && (
              <div className="absolute inset-0 bg-[#0b0e14]/86 flex flex-col items-center justify-center p-6 text-center">
                <div className="mb-4">
                  <PixelSpritePreview skin={hud.selectedSkin} pose="jump" size={48} label="Climber character" />
                </div>
                <h1 className="font-pixel text-2xl sm:text-3xl text-amber-400 mb-2">
                  Pixel Spire
                </h1>
                <p className="text-sm text-slate-300 max-w-xs mb-6 leading-relaxed">
                  Climb endless vertical shafts and horizontal wings. Wall hop, grapple rings, hold to jump higher, double jump, and tap again to backflip past spire traps.
                </p>

                <div className="text-xs text-slate-400 space-y-1.5 mb-7 max-w-xs">
                  <div>Move: A / D · Jump / Wall Hop: Space or W</div>
                  <div>Backflip: Tap Jump 3rd time in air · Grapple: E or Click</div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={triggerStart}
                    className="px-6 py-3 text-sm font-semibold text-slate-950 bg-amber-400 rounded-md hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-200"
                  >
                    Start Game
                  </button>
                  <button
                    type="button"
                    onClick={openSkinsModal}
                    className="px-4 py-3 text-sm font-medium text-slate-200 bg-[#151c28] border border-slate-700 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    Skins ({hud.unlockedSkins.length}/{SKINS.length})
                  </button>
                </div>
              </div>
            )}

            {/* Pause Overlay */}
            {hud.gameState === 'PAUSED' && !skinsModalOpen && (
              <div className="absolute inset-0 bg-[#0b0e14]/82 flex flex-col items-center justify-center p-6 text-center">
                <h2 className="font-pixel text-2xl text-slate-100 mb-2">Paused</h2>
                <p className="text-sm text-slate-400 mb-6">
                  Current Height: {hud.altitudeMeters}m · Score: {hud.score}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={triggerPause}
                    className="px-5 py-2.5 text-sm font-semibold text-slate-950 bg-amber-400 rounded-md hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0"
                  >
                    Resume
                  </button>
                  <button
                    type="button"
                    onClick={triggerStart}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-200 bg-[#1a2232] border border-slate-700 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Restart</span>
                  </button>
                  <button
                    type="button"
                    onClick={openSkinsModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-sky-300 bg-[#151c28] border border-slate-700 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Shirt className="w-4 h-4" />
                    <span>Skins</span>
                  </button>
                  <button
                    type="button"
                    onClick={triggerMainMenu}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-200 bg-[#151c28] border border-slate-700 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Home className="w-4 h-4" />
                    <span>Main Menu</span>
                  </button>
                </div>
              </div>
            )}

            {/* Game Over Overlay */}
            {hud.gameState === 'GAME_OVER' && !skinsModalOpen && (
              <div className="absolute inset-0 bg-[#0b0e14]/88 flex flex-col items-center justify-center p-6 text-center">
                <div className="text-xs font-medium text-rose-400 mb-1">
                  {hud.deathReason || 'Climb Ended'}
                </div>
                <h2 className="font-pixel text-2xl text-slate-100 mb-5">Run Complete</h2>

                <div className="w-full max-w-[260px] border-y border-slate-800 py-4 mb-6 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-400">Final Score</div>
                    <div className="font-mono-tabular text-xl font-bold text-amber-400">
                      {hud.score}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Max Height</div>
                    <div className="font-mono-tabular text-xl font-bold text-slate-100">
                      {hud.altitudeMeters}m
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Best Score</div>
                    <div className="font-mono-tabular text-sm font-semibold text-slate-300">
                      {hud.bestScore}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Gems</div>
                    <div className="font-mono-tabular text-sm font-semibold text-sky-400">
                      {hud.gemsCollected}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={triggerStart}
                    className="px-5 py-3 text-sm font-semibold text-slate-950 bg-amber-400 rounded-md hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-200"
                  >
                    Play Again
                  </button>
                  <button
                    type="button"
                    onClick={openSkinsModal}
                    className="inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium text-sky-300 bg-[#151c28] border border-slate-700 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Shirt className="w-4 h-4" />
                    <span>Skins</span>
                  </button>
                  <button
                    type="button"
                    onClick={triggerMainMenu}
                    className="inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium text-slate-200 bg-[#151c28] border border-slate-700 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Home className="w-4 h-4" />
                    <span>Main Menu</span>
                  </button>
                </div>
              </div>
            )}

            {/* In-Viewport Skins Wardrobe Overlay (accessible on every screen size) */}
            {skinsModalOpen && (
              <div className="absolute inset-0 z-20 bg-[#0b0e14]/96 flex flex-col p-4 sm:p-5 text-left">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="font-pixel text-base sm:text-lg text-amber-400">
                      Climber Skins
                    </h2>
                    <div className="inline-flex items-center gap-1.5 text-xs font-mono-tabular text-sky-400 mt-1">
                      <PixelSpritePreview sprite="gem_0" size={14} label="Gem bank" />
                      <span>{hud.totalGems} Gems Available</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeSkinsModal}
                    aria-label="Close skins wardrobe"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-[#151c28] border border-slate-700 rounded-md hover:bg-slate-800 transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Done</span>
                  </button>
                </div>

                <ul className="flex-1 overflow-y-auto space-y-2.5 py-3 pr-1">
                  {SKINS.map((skin) => {
                    const unlocked = hud.unlockedSkins.includes(skin.id);
                    const equipped = hud.selectedSkin === skin.id;
                    const canAfford = hud.totalGems >= skin.cost;

                    return (
                      <li
                        key={skin.id}
                        className={`p-3 rounded-md border transition-colors ${
                          equipped
                            ? 'bg-[#172030] border-amber-400/60'
                            : 'bg-[#111621] border-slate-800/90'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <PixelSpritePreview skin={skin.id} pose="idle" size={38} label={`${skin.name} skin`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-slate-100 truncate">
                                {skin.name}
                              </span>
                              {equipped ? (
                                <span className="text-xs font-semibold text-amber-400 whitespace-nowrap">
                                  Equipped
                                </span>
                              ) : unlocked ? (
                                <button
                                  type="button"
                                  onClick={() => handleSkinAction(skin.id)}
                                  className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-slate-200 rounded hover:bg-white transition-colors whitespace-nowrap shrink-0"
                                >
                                  Equip
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={!canAfford}
                                  onClick={() => handleSkinAction(skin.id)}
                                  className={`px-3 py-1.5 text-xs font-semibold rounded whitespace-nowrap shrink-0 transition-colors ${
                                    canAfford
                                      ? 'bg-sky-400 text-slate-950 hover:bg-sky-300'
                                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                  }`}
                                >
                                  Buy · {skin.cost} Gems
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 leading-snug mt-0.5">
                              {skin.description}
                            </p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* Touch Controls for Mobile / Tablet */}
          <div className="mt-3 w-full max-w-[496px] flex lg:hidden items-center justify-between gap-2 select-none">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onPointerDown={() => {
                  inputRef.current.left = true;
                }}
                onPointerUp={() => {
                  inputRef.current.left = false;
                }}
                onPointerCancel={() => {
                  inputRef.current.left = false;
                }}
                onPointerLeave={() => {
                  inputRef.current.left = false;
                }}
                className="min-w-[60px] min-h-[48px] px-4 py-3 text-sm font-semibold bg-[#151c28] border border-slate-700 rounded-md active:bg-slate-700 text-slate-100"
              >
                Left
              </button>
              <button
                type="button"
                onPointerDown={() => {
                  inputRef.current.right = true;
                }}
                onPointerUp={() => {
                  inputRef.current.right = false;
                }}
                onPointerCancel={() => {
                  inputRef.current.right = false;
                }}
                onPointerLeave={() => {
                  inputRef.current.right = false;
                }}
                className="min-w-[60px] min-h-[48px] px-4 py-3 text-sm font-semibold bg-[#151c28] border border-slate-700 rounded-md active:bg-slate-700 text-slate-100"
              >
                Right
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onPointerDown={() => {
                  inputRef.current.grapplePressed = true;
                }}
                className="min-w-[82px] min-h-[48px] px-4 py-3 text-sm font-semibold bg-sky-500/20 border border-sky-500/50 text-sky-200 rounded-md active:bg-sky-500/40"
              >
                Grapple
              </button>
              <button
                type="button"
                onPointerDown={() => {
                  inputRef.current.jumpPressed = true;
                  inputRef.current.jumpHeld = true;
                }}
                onPointerUp={() => {
                  inputRef.current.jumpHeld = false;
                  inputRef.current.jumpReleased = true;
                }}
                onPointerCancel={() => {
                  inputRef.current.jumpHeld = false;
                  inputRef.current.jumpReleased = true;
                }}
                onPointerLeave={() => {
                  if (inputRef.current.jumpHeld) {
                    inputRef.current.jumpHeld = false;
                    inputRef.current.jumpReleased = true;
                  }
                }}
                className="min-w-[82px] min-h-[48px] px-4 py-3 text-sm font-semibold bg-amber-400 text-slate-950 rounded-md active:bg-amber-300"
              >
                Jump
              </button>
            </div>
          </div>
        </section>

        {/* Right Column: Segmented Hazards Guide & 5-Skin Gem Shop */}
        <section className="order-3 bg-[#111621] border border-slate-800/90 rounded-lg p-5 space-y-5">
          <div className="flex items-center gap-1 p-1 bg-[#0b0e14] border border-slate-800 rounded-md">
            <button
              type="button"
              onClick={() => setRightTab('hazards')}
              className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
                rightTab === 'hazards'
                  ? 'bg-[#1a2232] text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hazards & Gear
            </button>
            <button
              type="button"
              onClick={() => setRightTab('skins')}
              className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
                rightTab === 'skins'
                  ? 'bg-[#1a2232] text-amber-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Skins ({hud.unlockedSkins.length}/{SKINS.length})
            </button>
          </div>

          {rightTab === 'hazards' ? (
            <>
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Spire Hazards & Gear
                </h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <PixelSpritePreview sprite="spike_up" size={28} label="Spikes sprite" />
                    <div>
                      <div className="text-sm font-medium text-slate-100">Spikes</div>
                      <p className="text-xs text-slate-400 leading-snug">
                        Static wall and pillar teeth. Hop clean over or grapple past.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <PixelSpritePreview sprite="saw_0" size={28} label="Sawblade sprite" />
                    <div>
                      <div className="text-sm font-medium text-slate-100">Sawblades</div>
                      <p className="text-xs text-slate-400 leading-snug">
                        Spinning blades patrolling horizontal or vertical rails.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <PixelSpritePreview sprite="laser_fire" size={28} label="Laser emitter sprite" />
                    <div>
                      <div className="text-sm font-medium text-slate-100">Lasers</div>
                      <p className="text-xs text-slate-400 leading-snug">
                        Flickering yellow warning beam fires a lethal crimson pulse.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <PixelSpritePreview sprite="fireball_0" size={28} label="Firebar sprite" />
                    <div>
                      <div className="text-sm font-medium text-slate-100">Firebars</div>
                      <p className="text-xs text-slate-400 leading-snug">
                        Sweeping fireball chains rotating around iron pivots.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <PixelSpritePreview sprite="crumble_1" size={28} label="Crumble platform sprite" />
                    <div>
                      <div className="text-sm font-medium text-slate-100">Crumble Platforms</div>
                      <p className="text-xs text-slate-400 leading-snug">
                        Fracture quickly underfoot, then reform a few seconds later.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <PixelSpritePreview sprite="turret_right" size={28} label="Dart turret sprite" />
                    <div>
                      <div className="text-sm font-medium text-slate-100">Dart Turrets</div>
                      <p className="text-xs text-slate-400 leading-snug">
                        Wall and ceiling turrets flash amber before firing steel darts.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <PixelSpritePreview sprite="bat_fly_0" size={28} label="Cave Bat sprite" />
                    <div>
                      <div className="text-sm font-medium text-slate-100">Cave Bats</div>
                      <p className="text-xs text-slate-400 leading-snug">
                        Spot you in a 4-tile radius and dive every 15s until you exit range.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <PixelSpritePreview sprite="bounce_idle" size={28} label="Bounce Pad sprite" />
                    <div>
                      <div className="text-sm font-medium text-slate-100">Bounce Pads</div>
                      <p className="text-xs text-slate-400 leading-snug">
                        Spring-loaded pads launch you skyward and refresh air jumps. Steer clear of overhead traps.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <PixelSpritePreview sprite="moving_plat" size={28} label="Moving Platform sprite" />
                    <div>
                      <div className="text-sm font-medium text-slate-100">Moving Platforms</div>
                      <p className="text-xs text-slate-400 leading-snug">
                        Hovering steel ferries gliding along horizontal and vertical tracks.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <PixelSpritePreview sprite="grapple_ring" size={28} label="Grapple ring sprite" />
                    <div>
                      <div className="text-sm font-medium text-slate-100">Grapple Rings</div>
                      <p className="text-xs text-slate-400 leading-snug">
                        Reel in when targeted and tap Jump to slingshot & refresh air jumps.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="border-t border-slate-800/80 pt-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Trick Scoring
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Climb +10 pts/m and collect Gems to spend on new climber skins. Chain Gems, Backflips, and Grapple Slingshots up to 4x.
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Climber Skins
                </h2>
                <span className="inline-flex items-center gap-1.5 text-xs font-mono-tabular text-sky-400">
                  <PixelSpritePreview sprite="gem_0" size={14} label="Gem currency" />
                  <span>{hud.totalGems} Gems</span>
                </span>
              </div>

              <ul className="space-y-2.5">
                {SKINS.map((skin) => {
                  const unlocked = hud.unlockedSkins.includes(skin.id);
                  const equipped = hud.selectedSkin === skin.id;
                  const canAfford = hud.totalGems >= skin.cost;

                  return (
                    <li
                      key={skin.id}
                      className={`p-3 rounded-md border transition-colors ${
                        equipped
                          ? 'bg-[#172030] border-amber-400/60'
                          : 'bg-[#0d121b] border-slate-800/90'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <PixelSpritePreview skin={skin.id} pose="idle" size={34} label={`${skin.name} skin`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-slate-100 truncate">
                              {skin.name}
                            </span>
                            {equipped ? (
                              <span className="text-xs font-medium text-amber-400 whitespace-nowrap">
                                Equipped
                              </span>
                            ) : unlocked ? (
                              <button
                                type="button"
                                onClick={() => handleSkinAction(skin.id)}
                                className="px-2.5 py-1 text-xs font-semibold text-slate-950 bg-slate-200 rounded hover:bg-white transition-colors whitespace-nowrap shrink-0"
                              >
                                Equip
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={!canAfford}
                                onClick={() => handleSkinAction(skin.id)}
                                className={`px-2.5 py-1 text-xs font-semibold rounded whitespace-nowrap shrink-0 transition-colors ${
                                  canAfford
                                    ? 'bg-sky-400 text-slate-950 hover:bg-sky-300'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                }`}
                              >
                                {skin.cost} Gems
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 leading-snug mt-0.5">
                            {skin.description}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
