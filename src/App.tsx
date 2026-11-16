import { useCallback, useEffect, useRef, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  Award,
  Cloud,
  Flag,
  Heart,
  Home,
  LogOut,
  Palette,
  Pause,
  Play,
  RotateCcw,
  Shirt,
  Trophy,
  User,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { PixelSpritePreview } from './components/PixelSpritePreview';
import {
  claimUsername,
  fetchTopRaceWinners,
  getWeeklyRaceStatus,
  loadOrCreateUserSave,
  RaceEntry,
  signInWithGoogle,
  signOutAccount,
  submitRaceProgress,
  subscribeRaceLeaderboard,
  subscribeToAuth,
  syncCloudSave,
  validateUsernameFormat,
  WeeklyRaceStatus,
} from './firebase';
import { retroAudio } from './game/audio';
import {
  GameEngine,
  InputState,
  REVIVE_COST_GEMS,
} from './game/engine';
import {
  GameMode,
  HudSnapshot,
  SkinId,
  SKINS,
  ThemeId,
  THEMES,
  VIRTUAL_H,
  VIRTUAL_W,
} from './game/types';

const INITIAL_HUD: HudSnapshot = {
  gameState: 'TITLE_MENU',
  gameMode: 'endless',
  score: 0,
  bestScore: 0,
  altitudeMeters: 0,
  bestAltitudeMeters: 0,
  wingsCleared: 0,
  gemsCollected: 0,
  totalGems: 0,
  revivedThisRun: false,
  canRevive: false,
  selectedSkin: 'strider',
  unlockedSkins: ['strider'],
  selectedTheme: 'dynamic',
  unlockedThemes: ['dynamic', 'obsidian'],
  activeBiomeName: 'Obsidian Depths',
  secretUnlocked: false,
  comboCount: 0,
  deathReason: '',
  canDoubleJump: true,
  canBackflip: false,
  grappleReady: false,
  wallContact: false,
  risingHazardDistance: 99,
};

const THEME_SWATCH_CLASS: Record<ThemeId, string> = {
  dynamic: 'bg-gradient-to-br from-amber-400 via-emerald-400 to-purple-500',
  obsidian: 'bg-slate-600',
  emerald: 'bg-emerald-500',
  crimson: 'bg-red-500',
  frost: 'bg-sky-400',
  astral: 'bg-purple-500',
  toxic: 'bg-green-500',
  suntemple: 'bg-amber-500',
  neoncore: 'bg-cyan-500',
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
  const [rightTab, setRightTab] = useState<'hazards' | 'race' | 'skins' | 'themes'>('hazards');
  const [wardrobeTab, setWardrobeTab] = useState<'skins' | 'themes'>('skins');
  const [skinsModalOpen, setSkinsModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  const [selectedMode, setSelectedMode] = useState<GameMode>('endless');
  const [raceStatus, setRaceStatus] = useState<WeeklyRaceStatus>(() => getWeeklyRaceStatus());
  const [raceLeaderboard, setRaceLeaderboard] = useState<RaceEntry[]>([]);
  const [claimableReward, setClaimableReward] = useState<{ weekId: string; rank: 1 | 2 | 3 } | null>(null);
  const [rewardBannerMsg, setRewardBannerMsg] = useState<string | null>(null);

  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [username, setUsername] = useState('');
  const [draftUsername, setDraftUsername] = useState('');
  const [accountBusy, setAccountBusy] = useState(false);
  const [accountMessage, setAccountMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [fatalError, setFatalError] = useState<Error | null>(null);

  if (fatalError) {
    throw fatalError;
  }

  const modalOpenRef = useRef(false);
  const authUserRef = useRef<FirebaseUser | null>(null);
  const usernameRef = useRef('');
  const raceStatusRef = useRef<WeeklyRaceStatus>(raceStatus);
  const syncTimerRef = useRef<number | null>(null);
  const lastRaceSyncMsRef = useRef(0);
  const lastRaceSyncAltRef = useRef(0);
  const raceRunSubmittedRef = useRef(false);

  useEffect(() => {
    modalOpenRef.current = skinsModalOpen || accountModalOpen;
  }, [skinsModalOpen, accountModalOpen]);

  useEffect(() => {
    authUserRef.current = authUser;
  }, [authUser]);

  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  useEffect(() => {
    raceStatusRef.current = raceStatus;
  }, [raceStatus]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setRaceStatus(getWeeklyRaceStatus());
    }, 30000);
    return () => window.clearInterval(id);
  }, []);

  const focusCanvas = useCallback(() => {
    const active = document.activeElement as HTMLElement | null;
    if (active && active !== canvasRef.current && typeof active.blur === 'function') {
      active.blur();
    }
    canvasRef.current?.focus({ preventScroll: true });
  }, []);

  const triggerStart = useCallback(
    (opts?: { mode?: GameMode }) => {
      const targetMode = opts?.mode ?? selectedMode;
      const effectiveMode: GameMode =
        targetMode === 'race' && raceStatusRef.current.isActive ? 'race' : 'endless';
      setSelectedMode(effectiveMode);
      setSkinsModalOpen(false);
      setAccountModalOpen(false);
      raceRunSubmittedRef.current = false;
      lastRaceSyncAltRef.current = 0;
      lastRaceSyncMsRef.current = 0;

      const started = engineRef.current?.startNewRun({
        mode: effectiveMode,
        raceSeed: effectiveMode === 'race' ? raceStatusRef.current.seed : undefined,
      });
      if (started !== false) {
        focusCanvas();
      }
    },
    [focusCanvas, selectedMode]
  );

  const triggerRevive = useCallback(() => {
    setSkinsModalOpen(false);
    setAccountModalOpen(false);
    const ok = engineRef.current?.reviveRun();
    if (ok) {
      raceRunSubmittedRef.current = false;
      focusCanvas();
    }
  }, [focusCanvas]);

  const triggerPause = useCallback(() => {
    setSkinsModalOpen(false);
    setAccountModalOpen(false);
    engineRef.current?.togglePause();
    focusCanvas();
  }, [focusCanvas]);

  const triggerMainMenu = useCallback(() => {
    setSkinsModalOpen(false);
    setAccountModalOpen(false);
    inputRef.current.left = false;
    inputRef.current.right = false;
    inputRef.current.jumpHeld = false;
    inputRef.current.jumpPressed = false;
    inputRef.current.jumpReleased = false;
    inputRef.current.grapplePressed = false;
    engineRef.current?.goToMainMenu();
  }, []);

  const openWardrobeModal = useCallback((initialTab: 'skins' | 'themes' = 'skins') => {
    setAccountModalOpen(false);
    if (engineRef.current?.state === 'PLAYING') {
      engineRef.current.togglePause();
    }
    setWardrobeTab(initialTab);
    setRightTab(initialTab);
    setSkinsModalOpen(true);
  }, []);

  const closeWardrobeModal = useCallback(() => {
    setSkinsModalOpen(false);
    focusCanvas();
  }, [focusCanvas]);

  const openAccountModal = useCallback(() => {
    setSkinsModalOpen(false);
    if (engineRef.current?.state === 'PLAYING') {
      engineRef.current.togglePause();
    }
    setAccountMessage(null);
    setDraftUsername(username);
    setAccountModalOpen(true);
  }, [username]);

  const closeAccountModal = useCallback(() => {
    setAccountModalOpen(false);
    focusCanvas();
  }, [focusCanvas]);

  const handleSkinAction = useCallback((skinId: SkinId) => {
    engineRef.current?.unlockOrEquipSkin(skinId);
  }, []);

  const handleThemeAction = useCallback((themeId: ThemeId) => {
    engineRef.current?.unlockOrEquipTheme(themeId);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      retroAudio.setMuted(next);
      return next;
    });
  }, []);

  const scheduleCloudSync = useCallback((immediate = false) => {
    const user = authUserRef.current;
    const engine = engineRef.current;
    if (!user || !engine) return;

    if (syncTimerRef.current !== null) {
      window.clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }

    const runSync = () => {
      const currentUser = authUserRef.current;
      const currentEngine = engineRef.current;
      if (!currentUser || !currentEngine) return;
      void syncCloudSave(currentUser.uid, currentEngine.getCloudSyncPayload()).catch((err) => {
        setFatalError(err instanceof Error ? err : new Error(String(err)));
      });
    };

    if (immediate) {
      runSync();
    } else {
      syncTimerRef.current = window.setTimeout(runSync, 900);
    }
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
    engine.setProgressChangeHandler(() => {
      scheduleCloudSync(false);
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
    return () => {
      cancelAnimationFrame(rafId);
      if (syncTimerRef.current !== null) {
        window.clearTimeout(syncTimerRef.current);
      }
    };
  }, [scheduleCloudSync]);

  const checkEndedRaceReward = useCallback(
    async (user: FirebaseUser, claimedWeeks: string[]) => {
      const completedWeekId = raceStatusRef.current.isActive
        ? raceStatusRef.current.previousWeekId
        : raceStatusRef.current.weekId;
      if (claimedWeeks.includes(completedWeekId)) {
        setClaimableReward(null);
        return;
      }
      try {
        const winners = await fetchTopRaceWinners(completedWeekId);
        const idx = winners.findIndex((entry) => entry.uid === user.uid);
        if (idx >= 0 && idx < 3) {
          setClaimableReward({ weekId: completedWeekId, rank: (idx + 1) as 1 | 2 | 3 });
        } else {
          setClaimableReward(null);
        }
      } catch (err) {
        setFatalError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    []
  );

  const handleClaimRaceReward = useCallback(() => {
    if (!claimableReward || !engineRef.current) return;
    const reward = engineRef.current.applyRaceRewards(claimableReward.weekId, claimableReward.rank);
    if (!reward) return;
    const parts = [`+${reward.gems} Gems`];
    if (reward.skinUnlocked) parts.push('Unlocked Trailrunner Skin');
    setRewardBannerMsg(`Week ${claimableReward.weekId} #${claimableReward.rank} Reward: ${parts.join(', ')}!`);
    setClaimableReward(null);
    scheduleCloudSync(true);
  }, [claimableReward, scheduleCloudSync]);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setAuthUser(user);
      setAuthReady(true);
      if (!user) {
        setUsername('');
        setRaceLeaderboard([]);
        setClaimableReward(null);
        engineRef.current?.setRaceRivals([]);
        return;
      }
      const engine = engineRef.current;
      if (!engine) return;
      void loadOrCreateUserSave(user.uid, engine.getCloudSyncPayload())
        .then((cloudDoc) => {
          engine.applyCloudMerge(cloudDoc);
          setUsername(cloudDoc.username);
          setDraftUsername(cloudDoc.username);
          void checkEndedRaceReward(user, cloudDoc.claimedRaceWeeks);
        })
        .catch((err) => {
          setFatalError(err instanceof Error ? err : new Error(String(err)));
        });
    });
    return () => unsubscribe();
  }, [checkEndedRaceReward]);

  useEffect(() => {
    if (!authReady || !authUser) return;
    const unsub = subscribeRaceLeaderboard(
      raceStatus.weekId,
      (entries) => {
        setRaceLeaderboard(entries);
        engineRef.current?.setRaceRivals(
          entries
            .filter((e) => e.uid !== authUser.uid && e.bestAltitudeMeters > 0)
            .slice(0, 6)
            .map((e) => ({
              uid: e.uid,
              displayName: e.displayName,
              altitudeMeters: e.bestAltitudeMeters,
            }))
        );
      },
      (err) => {
        setFatalError(err);
      }
    );
    return () => unsub();
  }, [authReady, authUser, raceStatus.weekId]);

  useEffect(() => {
    if (hud.gameState === 'GAME_OVER') {
      scheduleCloudSync(true);
    }

    const user = authUserRef.current;
    const engine = engineRef.current;
    if (!user || !engine || hud.gameMode !== 'race' || !raceStatus.isActive) return;

    const displayName = usernameRef.current
      ? `@${usernameRef.current}`
      : (user.displayName || 'Climber').slice(0, 20);

    if (hud.gameState === 'PLAYING') {
      const now = performance.now();
      const shouldPulse =
        hud.altitudeMeters >= lastRaceSyncAltRef.current + 15 ||
        (hud.altitudeMeters > 0 && now - lastRaceSyncMsRef.current >= 5000);
      if (shouldPulse) {
        lastRaceSyncMsRef.current = now;
        lastRaceSyncAltRef.current = Math.max(lastRaceSyncAltRef.current, hud.altitudeMeters);
        void submitRaceProgress(
          raceStatus.weekId,
          user.uid,
          {
            displayName,
            skinId: hud.selectedSkin,
            altitudeMeters: hud.altitudeMeters,
            score: hud.score,
            timeSec: engine.runElapsedSec,
          },
          false
        ).catch((err) => {
          setFatalError(err instanceof Error ? err : new Error(String(err)));
        });
      }
    } else if (hud.gameState === 'GAME_OVER' && !raceRunSubmittedRef.current) {
      raceRunSubmittedRef.current = true;
      void submitRaceProgress(
        raceStatus.weekId,
        user.uid,
        {
          displayName,
          skinId: hud.selectedSkin,
          altitudeMeters: hud.altitudeMeters,
          score: hud.score,
          timeSec: engine.runElapsedSec,
        },
        true
      ).catch((err) => {
        setFatalError(err instanceof Error ? err : new Error(String(err)));
      });
    }
  }, [
    hud.gameState,
    hud.gameMode,
    hud.altitudeMeters,
    hud.score,
    hud.selectedSkin,
    raceStatus.isActive,
    raceStatus.weekId,
    scheduleCloudSync,
  ]);

  const handleGoogleSignIn = useCallback(async () => {
    setAccountBusy(true);
    setAccountMessage(null);
    try {
      await signInWithGoogle();
      setAccountMessage({ type: 'ok', text: 'Cloud Save synced.' });
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setAccountMessage({ type: 'err', text: 'Sign-in cancelled.' });
      } else {
        const message = err instanceof Error ? err.message : 'Unable to sign in right now.';
        setAccountMessage({ type: 'err', text: message });
      }
    } finally {
      setAccountBusy(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setAccountBusy(true);
    setAccountMessage(null);
    try {
      await signOutAccount();
      setUsername('');
      setDraftUsername('');
      setAccountMessage({ type: 'ok', text: 'Signed out.' });
    } catch (err) {
      setAccountMessage({
        type: 'err',
        text: err instanceof Error ? err.message : 'Sign-out failed.',
      });
    } finally {
      setAccountBusy(false);
    }
  }, []);

  const handleManualSync = useCallback(async () => {
    if (!authUser || !engineRef.current) return;
    setAccountBusy(true);
    setAccountMessage(null);
    try {
      await syncCloudSave(authUser.uid, engineRef.current.getCloudSyncPayload());
      setAccountMessage({ type: 'ok', text: 'Cloud Save updated.' });
    } catch (err) {
      setFatalError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setAccountBusy(false);
    }
  }, [authUser]);

  const handleClaimUsername = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!authUser) return;
      const formatError = validateUsernameFormat(draftUsername);
      if (formatError) {
        setAccountMessage({ type: 'err', text: formatError });
        return;
      }
      setAccountBusy(true);
      setAccountMessage(null);
      try {
        const res = await claimUsername(authUser.uid, draftUsername, username);
        if (res.ok) {
          setUsername(res.username);
          setDraftUsername(res.username);
          setAccountMessage({ type: 'ok', text: `Claimed @${res.username}` });
        } else {
          setAccountMessage({ type: 'err', text: res.message });
        }
      } catch (err) {
        setFatalError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setAccountBusy(false);
      }
    },
    [authUser, draftUsername, username]
  );

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
        if (e.code === 'Escape' || normKey(e) === 'escape') {
          setAccountModalOpen(false);
          setSkinsModalOpen(false);
          focusCanvas();
        }
        return;
      }

      const engine = engineRef.current;
      if (!engine) return;

      if (modalOpenRef.current) {
        if ((e.code === 'Escape' || normKey(e) === 'escape') && !e.repeat) {
          setSkinsModalOpen(false);
          setAccountModalOpen(false);
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
          triggerStart({ mode: engine.gameMode });
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
        triggerStart();
        return;
      }

      if (engine.state === 'GAME_OVER' && (isJumpKey(e) || isEnterKey(e)) && !e.repeat) {
        e.preventDefault();
        if (performance.now() - deathTimestampRef.current > 350) {
          triggerStart({ mode: engine.gameMode });
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
  }, [focusCanvas, triggerMainMenu, triggerStart]);

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

  const accountButtonLabel = !authReady
    ? 'Cloud Save'
    : !authUser
      ? 'Cloud Save'
      : username
        ? `@${username}`
        : 'Set Username';

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col">
      {/* Top Bar Contract: 3 zones */}
      <header className="border-b border-slate-800/90 bg-[#0e131c]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <span className="font-pixel text-lg tracking-tight text-amber-400 whitespace-nowrap shrink-0">
            Pixel Spire
          </span>

          <div className="hidden xl:flex items-center gap-5 text-sm text-slate-400 whitespace-nowrap shrink-0">
            <span>{hud.activeBiomeName}</span>
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

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={openAccountModal}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-medium text-emerald-300 bg-[#151c28] border border-slate-800 rounded-md hover:text-white hover:border-emerald-500/60 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              {authUser ? <User className="w-3.5 h-3.5" /> : <Cloud className="w-3.5 h-3.5" />}
              <span>{accountButtonLabel}</span>
            </button>

            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? 'Unmute audio' : 'Mute audio'}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-slate-300 bg-[#151c28] border border-slate-800 rounded-md hover:text-white hover:border-slate-700 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="hidden md:inline">{muted ? 'Muted' : 'Audio'}</span>
            </button>

            <button
              type="button"
              onClick={() => openWardrobeModal('skins')}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-medium text-sky-300 bg-[#151c28] border border-slate-800 rounded-md hover:text-white hover:border-sky-500/60 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              <Shirt className="w-3.5 h-3.5" />
              <span>Wardrobe</span>
            </button>

            {hud.gameState !== 'TITLE_MENU' && (
              <button
                type="button"
                onClick={triggerMainMenu}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-medium text-slate-200 bg-[#151c28] border border-slate-800 rounded-md hover:text-white hover:border-slate-700 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-400"
              >
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Menu</span>
              </button>
            )}

            {hud.gameState === 'PLAYING' || hud.gameState === 'PAUSED' ? (
              <button
                type="button"
                onClick={triggerPause}
                className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 rounded-md hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-200"
              >
                {hud.gameState === 'PAUSED' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                <span>{hud.gameState === 'PAUSED' ? 'Resume' : 'Pause'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => triggerStart()}
                className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 rounded-md hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-200"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start Climb</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main 3-Column Desktop Layout */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-[270px_minmax(0,1fr)_300px] gap-6 items-start">
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
                <span className="text-xs text-slate-400">Mode</span>
                <span
                  className={`text-xs font-semibold ${
                    hud.gameMode === 'race' ? 'text-emerald-300' : 'text-slate-200'
                  }`}
                >
                  {hud.gameMode === 'race' ? `Mon–Fri Race (${raceStatus.weekId})` : 'Endless Climb'}
                </span>
              </div>
              <div className="col-span-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">Active Biome</span>
                <span className="text-xs font-semibold text-amber-300">{hud.activeBiomeName}</span>
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
                <span>
                  {hud.altitudeMeters}m · {hud.activeBiomeName}
                </span>
                <span>{hud.score} pts</span>
              </div>
            )}

            {/* Title Menu Overlay */}
            {hud.gameState === 'TITLE_MENU' && !skinsModalOpen && !accountModalOpen && (
              <div className="absolute inset-0 bg-[#0b0e14]/88 flex flex-col items-center justify-center p-5 text-center overflow-y-auto">
                <div className="mb-3">
                  <PixelSpritePreview skin={hud.selectedSkin} pose="jump" size={44} label="Climber character" />
                </div>
                <h1 className="font-pixel text-2xl sm:text-3xl text-amber-400 mb-2">
                  Pixel Spire
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xs mb-4 leading-relaxed">
                  Procedural shafts & wings shifting biomes every 100m. {SKINS.length} skins, {THEMES.length} themes, & Mon–Fri Online Races.
                </p>

                {claimableReward && (
                  <button
                    type="button"
                    onClick={handleClaimRaceReward}
                    className="mb-3 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-md hover:bg-emerald-300 transition-colors"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Claim #{claimableReward.rank} Race Prize ({claimableReward.weekId})</span>
                  </button>
                )}

                {rewardBannerMsg && (
                  <div className="mb-3 px-3 py-1.5 text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-700/60 rounded">
                    {rewardBannerMsg}
                  </div>
                )}

                {/* Mode Switcher: Endless vs Mon–Fri Online Race */}
                <div className="grid grid-cols-2 gap-1 p-1 mb-4 w-full max-w-[290px] bg-[#111621] border border-slate-800 rounded-md">
                  <button
                    type="button"
                    onClick={() => setSelectedMode('endless')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                      selectedMode === 'endless'
                        ? 'bg-[#1f293d] text-amber-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Endless Climb
                  </button>
                  <button
                    type="button"
                    disabled={!raceStatus.isActive}
                    onClick={() => setSelectedMode('race')}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                      selectedMode === 'race' && raceStatus.isActive
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                        : raceStatus.isActive
                          ? 'text-slate-300 hover:text-white'
                          : 'text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <Flag className="w-3 h-3" />
                    <span>{raceStatus.isActive ? 'Mon–Fri Race' : 'Race (Mon–Fri)'}</span>
                  </button>
                </div>

                {selectedMode === 'race' && raceStatus.isActive && (
                  <div className="text-xs text-emerald-300/90 mb-3 max-w-xs">
                    Shared Spire {raceStatus.weekId} · Ends in {raceStatus.countdownText}
                    {!authUser && ' · Sign in for leaderboard'}
                  </div>
                )}

                <div className="text-xs text-slate-400 space-y-1 mb-4 max-w-xs">
                  <div>Move: A / D · Jump / Wall Hop: Space or W</div>
                  <div>Backflip: Tap Jump 3rd time · Grapple: E or Click</div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => triggerStart()}
                    className="px-5 py-2.5 text-sm font-semibold text-slate-950 bg-amber-400 rounded-md hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-200"
                  >
                    {selectedMode === 'race' && raceStatus.isActive ? 'Start Race' : 'Start Game'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openWardrobeModal('skins')}
                    className="px-3.5 py-2.5 text-xs font-medium text-slate-200 bg-[#151c28] border border-slate-700 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    Wardrobe ({hud.unlockedSkins.length}/{SKINS.length})
                  </button>
                  <button
                    type="button"
                    onClick={openAccountModal}
                    className="px-3.5 py-2.5 text-xs font-medium text-emerald-300 bg-[#151c28] border border-slate-700 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    {username ? `@${username}` : 'Cloud Save'}
                  </button>
                </div>
              </div>
            )}

            {/* Pause Overlay */}
            {hud.gameState === 'PAUSED' && !skinsModalOpen && !accountModalOpen && (
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
                    onClick={() => triggerStart({ mode: hud.gameMode })}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-200 bg-[#1a2232] border border-slate-700 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Restart</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openWardrobeModal('skins')}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-sky-300 bg-[#151c28] border border-slate-700 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Shirt className="w-4 h-4" />
                    <span>Wardrobe</span>
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
            {hud.gameState === 'GAME_OVER' && !skinsModalOpen && !accountModalOpen && (
              <div className="absolute inset-0 bg-[#0b0e14]/88 flex flex-col items-center justify-center p-5 text-center overflow-y-auto">
                <div className="text-xs font-medium text-rose-400 mb-1">
                  {hud.deathReason || 'Climb Ended'}
                </div>
                <h2 className="font-pixel text-2xl text-slate-100 mb-4">Run Complete</h2>

                <div className="w-full max-w-[260px] border-y border-slate-800 py-3.5 mb-5 grid grid-cols-2 gap-3.5">
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
                    <div className="text-xs text-slate-400">Gems Banked</div>
                    <div className="font-mono-tabular text-sm font-semibold text-sky-400">
                      +{hud.gemsCollected} ({hud.totalGems})
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={!hud.canRevive}
                    onClick={triggerRevive}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-md border whitespace-nowrap shrink-0 transition-colors ${
                      hud.canRevive
                        ? 'bg-emerald-400 text-slate-950 border-emerald-300 hover:bg-emerald-300'
                        : 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>
                      {hud.revivedThisRun
                        ? 'Revive Used (1/Run)'
                        : `Revive · ${REVIVE_COST_GEMS} Gems`}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerStart({ mode: hud.gameMode })}
                    className="px-5 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 rounded-md hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-200"
                  >
                    Play Again
                  </button>
                  <button
                    type="button"
                    onClick={() => openWardrobeModal('skins')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-sky-300 bg-[#151c28] border border-slate-700 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Shirt className="w-3.5 h-3.5" />
                    <span>Wardrobe</span>
                  </button>
                  <button
                    type="button"
                    onClick={triggerMainMenu}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-slate-200 bg-[#151c28] border border-slate-700 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Main Menu</span>
                  </button>
                </div>
              </div>
            )}

            {/* In-Viewport Wardrobe Overlay (Skins & Dungeon Themes) */}
            {skinsModalOpen && (
              <div className="absolute inset-0 z-20 bg-[#0b0e14]/96 flex flex-col p-4 sm:p-5 text-left">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="font-pixel text-base sm:text-lg text-amber-400">
                      {wardrobeTab === 'skins' ? 'Climber Skins' : 'Dungeon Themes'}
                    </h2>
                    <div className="inline-flex items-center gap-1.5 text-xs font-mono-tabular text-sky-400 mt-1">
                      <PixelSpritePreview sprite="gem_0" size={14} label="Gem bank" />
                      <span>{hud.totalGems} Gems Available</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeWardrobeModal}
                    aria-label="Close wardrobe"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-[#151c28] border border-slate-700 rounded-md hover:bg-slate-800 transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Done</span>
                  </button>
                </div>

                <div className="flex items-center gap-1 p-1 mt-3 bg-[#111621] border border-slate-800 rounded-md">
                  <button
                    type="button"
                    onClick={() => setWardrobeTab('skins')}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                      wardrobeTab === 'skins'
                        ? 'bg-[#1a2232] text-amber-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Shirt className="w-3.5 h-3.5" />
                    <span>Skins ({hud.unlockedSkins.length}/{SKINS.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWardrobeTab('themes')}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                      wardrobeTab === 'themes'
                        ? 'bg-[#1a2232] text-emerald-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>Themes ({hud.unlockedThemes.length}/{THEMES.length})</span>
                  </button>
                </div>

                {wardrobeTab === 'skins' ? (
                  <ul className="flex-1 overflow-y-auto space-y-2.5 py-3 pr-1">
                    {SKINS.map((skin) => {
                      const unlocked = hud.unlockedSkins.includes(skin.id);
                      const equipped = hud.selectedSkin === skin.id;
                      const isLockedSecret = Boolean(skin.secret && !unlocked);
                      const isLockedRace = Boolean(skin.raceReward && !unlocked);
                      const canAfford = !skin.secret && !skin.raceReward && hud.totalGems >= skin.cost;

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
                            <PixelSpritePreview
                              skin={skin.id}
                              pose="idle"
                              size={38}
                              mystery={isLockedSecret}
                              label={isLockedSecret ? 'Secret locked skin' : `${skin.name} skin`}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-slate-100 truncate">
                                  {isLockedSecret ? '??? (Secret Skin)' : skin.name}
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
                                ) : isLockedSecret ? (
                                  <span className="text-xs font-medium text-purple-300 whitespace-nowrap">
                                    Secret
                                  </span>
                                ) : isLockedRace ? (
                                  <span className="text-xs font-medium text-emerald-300 whitespace-nowrap">
                                    1st in Mon–Fri Race
                                  </span>
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
                                {isLockedSecret
                                  ? 'Unlock condition hidden until discovered.'
                                  : skin.description}
                              </p>
                              {skin.secret && unlocked && skin.secretMethod && (
                                <p className="text-xs text-purple-300 leading-snug mt-1">
                                  Unlocked via: {skin.secretMethod}
                                </p>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <ul className="flex-1 overflow-y-auto space-y-2.5 py-3 pr-1">
                    {THEMES.map((theme) => {
                      const unlocked = hud.unlockedThemes.includes(theme.id);
                      const equipped = hud.selectedTheme === theme.id;
                      const canAfford = hud.totalGems >= theme.cost;

                      return (
                        <li
                          key={theme.id}
                          className={`p-3 rounded-md border transition-colors ${
                            equipped
                              ? 'bg-[#172030] border-emerald-400/60'
                              : 'bg-[#111621] border-slate-800/90'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              aria-hidden="true"
                              className={`w-9 h-9 rounded border border-slate-700 shrink-0 ${THEME_SWATCH_CLASS[theme.id]}`}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-slate-100 truncate">
                                  {theme.name}
                                </span>
                                {equipped ? (
                                  <span className="text-xs font-semibold text-emerald-400 whitespace-nowrap">
                                    Active
                                  </span>
                                ) : unlocked ? (
                                  <button
                                    type="button"
                                    onClick={() => handleThemeAction(theme.id)}
                                    className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-slate-200 rounded hover:bg-white transition-colors whitespace-nowrap shrink-0"
                                  >
                                    Equip
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={!canAfford}
                                    onClick={() => handleThemeAction(theme.id)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded whitespace-nowrap shrink-0 transition-colors ${
                                      canAfford
                                        ? 'bg-sky-400 text-slate-950 hover:bg-sky-300'
                                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    }`}
                                  >
                                    Buy · {theme.cost} Gems
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 leading-snug mt-0.5">
                                {theme.description}
                              </p>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {/* In-Viewport Cloud Save & Unique Username Modal */}
            {accountModalOpen && (
              <div className="absolute inset-0 z-20 bg-[#0b0e14]/96 flex flex-col p-5 text-left overflow-y-auto">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="font-pixel text-base sm:text-lg text-emerald-400">
                      Cloud Save & Profile
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sync high scores, gems, skins, themes, and claim a unique username.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeAccountModal}
                    aria-label="Close account modal"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-[#151c28] border border-slate-700 rounded-md hover:bg-slate-800 transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Close</span>
                  </button>
                </div>

                {!authUser ? (
                  <div className="flex-1 flex flex-col justify-center space-y-5 py-6">
                    <div className="bg-[#111621] border border-slate-800 rounded-md p-4 space-y-2">
                      <div className="text-sm font-semibold text-slate-100">
                        Sign in to enable Cloud Save
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Your local best score, gems, unlocked skins, and dungeon themes will merge automatically into your cloud save. Once signed in, you can also claim a unique climber username.
                      </p>
                    </div>

                    {accountMessage && (
                      <div
                        className={`text-xs px-3 py-2 rounded border ${
                          accountMessage.type === 'ok'
                            ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300'
                            : 'bg-rose-950/50 border-rose-700/60 text-rose-300'
                        }`}
                      >
                        {accountMessage.text}
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={accountBusy}
                      onClick={handleGoogleSignIn}
                      className="w-full py-3 px-4 text-sm font-semibold text-slate-950 bg-emerald-400 rounded-md hover:bg-emerald-300 disabled:opacity-60 transition-colors"
                    >
                      {accountBusy ? 'Connecting...' : 'Sign in with Google'}
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 space-y-5 py-4">
                    <div className="bg-[#111621] border border-slate-800 rounded-md p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-400">Climber Handle</span>
                        <span className="font-mono-tabular text-sm font-semibold text-emerald-300">
                          {username ? `@${username}` : 'Not claimed yet'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-400">Cloud Best</span>
                        <span className="font-mono-tabular text-xs text-slate-200">
                          {hud.bestAltitudeMeters}m · {hud.bestScore} pts · {hud.totalGems} Gems
                        </span>
                      </div>
                    </div>

                    <form onSubmit={handleClaimUsername} className="space-y-3">
                      <label
                        htmlFor="spire-username-input"
                        className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                      >
                        Unique Username
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id="spire-username-input"
                          type="text"
                          value={draftUsername}
                          onChange={(e) => setDraftUsername(e.target.value)}
                          maxLength={20}
                          placeholder="Spire_Runner"
                          className="flex-1 min-w-0 px-3 py-2 text-sm bg-[#111621] border border-slate-700 rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                        />
                        <button
                          type="submit"
                          disabled={accountBusy}
                          className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 rounded-md hover:bg-amber-300 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
                        >
                          {username ? 'Update' : 'Claim'}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500">
                        3–20 characters: letters, numbers, and underscores (_). Guaranteed unique.
                      </p>
                    </form>

                    {accountMessage && (
                      <div
                        className={`text-xs px-3 py-2 rounded border ${
                          accountMessage.type === 'ok'
                            ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300'
                            : 'bg-rose-950/50 border-rose-700/60 text-rose-300'
                        }`}
                      >
                        {accountMessage.text}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        disabled={accountBusy}
                        onClick={handleManualSync}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-sky-300 bg-[#151c28] border border-slate-700 rounded-md hover:bg-slate-800 disabled:opacity-60 transition-colors"
                      >
                        <Cloud className="w-3.5 h-3.5" />
                        <span>Sync Cloud Save</span>
                      </button>

                      <button
                        type="button"
                        disabled={accountBusy}
                        onClick={handleSignOut}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-rose-300 bg-[#151c28] border border-slate-800 rounded-md hover:bg-slate-800 disabled:opacity-60 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
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

        {/* Right Column: Segmented Hazards Guide, Weekly Race, Skins Shop, & Dungeon Themes */}
        <section className="order-3 bg-[#111621] border border-slate-800/90 rounded-lg p-5 space-y-5">
          <div className="grid grid-cols-4 gap-1 p-1 bg-[#0b0e14] border border-slate-800 rounded-md">
            <button
              type="button"
              onClick={() => setRightTab('hazards')}
              className={`px-1.5 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
                rightTab === 'hazards'
                  ? 'bg-[#1a2232] text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hazards
            </button>
            <button
              type="button"
              onClick={() => setRightTab('race')}
              className={`px-1.5 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
                rightTab === 'race'
                  ? 'bg-[#1a2232] text-emerald-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Race
            </button>
            <button
              type="button"
              onClick={() => setRightTab('skins')}
              className={`px-1.5 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
                rightTab === 'skins'
                  ? 'bg-[#1a2232] text-amber-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Skins
            </button>
            <button
              type="button"
              onClick={() => setRightTab('themes')}
              className={`px-1.5 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
                rightTab === 'themes'
                  ? 'bg-[#1a2232] text-sky-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Themes
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
                    <PixelSpritePreview sprite="crusher_idle" size={28} label="Spike Crusher sprite" />
                    <div>
                      <div className="text-sm font-medium text-slate-100">Spike Crushers</div>
                      <p className="text-xs text-slate-400 leading-snug">
                        Overhead spiked iron blocks that flash amber and slam down when you pass beneath.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <PixelSpritePreview sprite="flame_vent_right" size={28} label="Flame Jet sprite" />
                    <div>
                      <div className="text-sm font-medium text-slate-100">Flame Jets</div>
                      <p className="text-xs text-slate-400 leading-snug">
                        Armored fire vents that spark amber before blasting a 3-tile searing plume.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <PixelSpritePreview sprite="coil_fire" size={28} label="Shock Coil sprite" />
                    <div>
                      <div className="text-sm font-medium text-slate-100">Shock Coils</div>
                      <p className="text-xs text-slate-400 leading-snug">
                        Paired Tesla pylons that warn before arcing high-voltage lightning across gaps.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <PixelSpritePreview sprite="acid_vent_drip" size={28} label="Acid Drip sprite" />
                    <div>
                      <div className="text-sm font-medium text-slate-100">Acid Drips</div>
                      <p className="text-xs text-slate-400 leading-snug">
                        Ceiling conduits dripping corrosive acid globules down the shaft.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <PixelSpritePreview sprite="pendulum_mace" size={28} label="Pendulum Mace sprite" />
                    <div>
                      <div className="text-sm font-medium text-slate-100">Pendulum Maces</div>
                      <p className="text-xs text-slate-400 leading-snug">
                        Heavy spiked iron balls swinging on ceiling chains across wide chambers.
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
                        Spring-loaded pads launch you skyward and refresh air jumps.
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
                  Climb +10 pts/m and collect Gems to unlock skins & themes. Dungeons shift color every 100m.
                </p>
              </div>
            </>
          ) : rightTab === 'race' ? (
            <div className="space-y-4">
              <div className="bg-[#0d121b] border border-slate-800 rounded-md p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300">
                    <Flag className="w-3.5 h-3.5" />
                    <span>Mon–Fri Online Race</span>
                  </span>
                  <span className="font-mono-tabular text-xs text-slate-400">
                    {raceStatus.weekId}
                  </span>
                </div>
                <div className="text-xs text-slate-300">
                  {raceStatus.isActive ? (
                    <span>
                      Live ({raceStatus.dayLabel}) · Closes in{' '}
                      <strong className="font-mono-tabular text-amber-300">
                        {raceStatus.countdownText}
                      </strong>
                    </span>
                  ) : (
                    <span>
                      Weekend Intermission ({raceStatus.dayLabel}) · Opens in{' '}
                      <strong className="font-mono-tabular text-sky-300">
                        {raceStatus.countdownText}
                      </strong>
                    </span>
                  )}
                </div>
                <div className="font-mono-tabular text-[11px] text-slate-500">
                  Shared Seed #{raceStatus.seed} · Identical spire layout for all racers
                </div>
              </div>

              {claimableReward && (
                <button
                  type="button"
                  onClick={handleClaimRaceReward}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-md hover:bg-emerald-300 transition-colors"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Claim #{claimableReward.rank} Weekly Prize ({claimableReward.weekId})</span>
                </button>
              )}

              {rewardBannerMsg && (
                <div className="px-3 py-2 text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-700/60 rounded">
                  {rewardBannerMsg}
                </div>
              )}

              <div className="bg-[#0d121b] border border-slate-800 rounded-md p-3.5 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Weekly Podium Rewards</span>
                </div>
                <div className="flex justify-between text-amber-300">
                  <span>1st Place</span>
                  <span className="font-mono-tabular">150 Gems + Trailrunner</span>
                </div>
                <div className="flex justify-between text-slate-200">
                  <span>2nd Place</span>
                  <span className="font-mono-tabular">90 Gems</span>
                </div>
                <div className="flex justify-between text-amber-500/90">
                  <span>3rd Place</span>
                  <span className="font-mono-tabular">50 Gems</span>
                </div>
              </div>

              {raceStatus.isActive && (
                <button
                  type="button"
                  onClick={() => triggerStart({ mode: 'race' })}
                  className="w-full py-2 px-3 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-md hover:bg-emerald-300 transition-colors"
                >
                  Climb Race
                </button>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Weekly Standings
                  </h2>
                  <span className="font-mono-tabular text-[11px] text-slate-500">
                    Top {Math.max(raceLeaderboard.length, 0)}
                  </span>
                </div>

                {!authUser ? (
                  <div className="bg-[#0d121b] border border-slate-800 rounded-md p-3.5 space-y-2.5">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Sign in with Google via Cloud Save to post your altitude to the live Mon–Fri standings and claim podium prizes.
                    </p>
                    <button
                      type="button"
                      onClick={openAccountModal}
                      className="w-full py-2 px-3 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-md hover:bg-emerald-300 transition-colors"
                    >
                      Sign In to Compete
                    </button>
                  </div>
                ) : raceLeaderboard.length === 0 ? (
                  <div className="bg-[#0d121b] border border-slate-800 rounded-md p-3.5 text-xs text-slate-400">
                    No racers recorded yet for {raceStatus.weekId}. Start a Mon–Fri Race run to set the pace!
                  </div>
                ) : (
                  <ul className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                    {raceLeaderboard.map((entry, idx) => {
                      const isMe = authUser.uid === entry.uid;
                      return (
                        <li
                          key={entry.uid}
                          className={`px-2.5 py-2 rounded border flex items-center justify-between gap-2 text-xs ${
                            isMe
                              ? 'bg-[#172030] border-emerald-400/60'
                              : 'bg-[#0d121b] border-slate-800/90'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`font-mono-tabular w-5 text-right font-bold shrink-0 ${
                                idx === 0
                                  ? 'text-amber-400'
                                  : idx === 1
                                    ? 'text-slate-200'
                                    : idx === 2
                                      ? 'text-amber-600'
                                      : 'text-slate-500'
                              }`}
                            >
                              #{idx + 1}
                            </span>
                            <PixelSpritePreview
                              skin={entry.skinId}
                              pose="idle"
                              size={20}
                              label={`${entry.displayName} icon`}
                            />
                            <span className="truncate text-slate-100 font-medium">
                              {entry.displayName}
                            </span>
                          </div>
                          <div className="font-mono-tabular text-right shrink-0">
                            <span className="font-semibold text-emerald-300">
                              {entry.bestAltitudeMeters}m
                            </span>
                            <span className="text-slate-500 ml-1.5">{entry.bestScore}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          ) : rightTab === 'skins' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Climber Skins ({hud.unlockedSkins.length}/{SKINS.length})
                </h2>
                <span className="inline-flex items-center gap-1.5 text-xs font-mono-tabular text-sky-400">
                  <PixelSpritePreview sprite="gem_0" size={14} label="Gem currency" />
                  <span>{hud.totalGems} Gems</span>
                </span>
              </div>

              <ul className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
                {SKINS.map((skin) => {
                  const unlocked = hud.unlockedSkins.includes(skin.id);
                  const equipped = hud.selectedSkin === skin.id;
                  const isLockedSecret = Boolean(skin.secret && !unlocked);
                  const isLockedRace = Boolean(skin.raceReward && !unlocked);
                  const canAfford = !skin.secret && !skin.raceReward && hud.totalGems >= skin.cost;

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
                        <PixelSpritePreview
                          skin={skin.id}
                          pose="idle"
                          size={34}
                          mystery={isLockedSecret}
                          label={isLockedSecret ? 'Secret locked skin' : `${skin.name} skin`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-slate-100 truncate">
                              {isLockedSecret ? '??? (Secret)' : skin.name}
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
                            ) : isLockedSecret ? (
                              <span className="text-xs font-medium text-purple-300 whitespace-nowrap">
                                Secret
                              </span>
                            ) : isLockedRace ? (
                              <span className="text-xs font-medium text-emerald-300 whitespace-nowrap">
                                1st in Race
                              </span>
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
                            {isLockedSecret
                              ? 'Unlock condition hidden until discovered.'
                              : skin.description}
                          </p>
                          {skin.secret && unlocked && skin.secretMethod && (
                            <p className="text-xs text-purple-300 leading-snug mt-1">
                              Unlocked via: {skin.secretMethod}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Dungeon Themes
                </h2>
                <span className="inline-flex items-center gap-1.5 text-xs font-mono-tabular text-sky-400">
                  <PixelSpritePreview sprite="gem_0" size={14} label="Gem currency" />
                  <span>{hud.totalGems} Gems</span>
                </span>
              </div>

              <ul className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
                {THEMES.map((theme) => {
                  const unlocked = hud.unlockedThemes.includes(theme.id);
                  const equipped = hud.selectedTheme === theme.id;
                  const canAfford = hud.totalGems >= theme.cost;

                  return (
                    <li
                      key={theme.id}
                      className={`p-3 rounded-md border transition-colors ${
                        equipped
                          ? 'bg-[#172030] border-emerald-400/60'
                          : 'bg-[#0d121b] border-slate-800/90'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className={`w-8 h-8 rounded border border-slate-700 shrink-0 ${THEME_SWATCH_CLASS[theme.id]}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-slate-100 truncate">
                              {theme.name}
                            </span>
                            {equipped ? (
                              <span className="text-xs font-medium text-emerald-400 whitespace-nowrap">
                                Active
                              </span>
                            ) : unlocked ? (
                              <button
                                type="button"
                                onClick={() => handleThemeAction(theme.id)}
                                className="px-2.5 py-1 text-xs font-semibold text-slate-950 bg-slate-200 rounded hover:bg-white transition-colors whitespace-nowrap shrink-0"
                              >
                                Equip
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={!canAfford}
                                onClick={() => handleThemeAction(theme.id)}
                                className={`px-2.5 py-1 text-xs font-semibold rounded whitespace-nowrap shrink-0 transition-colors ${
                                  canAfford
                                    ? 'bg-sky-400 text-slate-950 hover:bg-sky-300'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                }`}
                              >
                                {theme.cost} Gems
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 leading-snug mt-0.5">
                            {theme.description}
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
