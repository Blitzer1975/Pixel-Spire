import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getDocFromServer,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  SECRET_SKIN_UNLOCK_METHOD,
  SkinId,
  SKINS,
  ThemeId,
  THEMES,
} from './game/types';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export interface CloudProgressPayload {
  bestScore: number;
  bestAltitudeMeters: number;
  totalGems: number;
  claimedRaceWeeks?: string[];
  selectedSkin: SkinId;
  unlockedSkins: SkinId[];
  selectedTheme: ThemeId;
  unlockedThemes: ThemeId[];
  secretUnlocked: boolean;
  secretRevealMethod: string;
}

export interface CloudUserDocument extends CloudProgressPayload {
  uid: string;
  username: string;
  claimedRaceWeeks: string[];
}

export interface RaceEntry {
  uid: string;
  displayName: string;
  skinId: SkinId;
  bestAltitudeMeters: number;
  bestScore: number;
  bestTimeSec: number;
  runsCount: number;
}

export interface WeeklyRaceStatus {
  weekId: string;
  previousWeekId: string;
  seed: number;
  isActive: boolean;
  dayLabel: string;
  countdownText: string;
}

const VALID_SKIN_IDS = new Set<SkinId>(SKINS.map((s) => s.id));
const VALID_THEME_IDS = new Set<ThemeId>(THEMES.map((t) => t.id));

function sanitizeProgress(payload: CloudProgressPayload): Required<CloudProgressPayload> {
  const baseSkins = Array.isArray(payload.unlockedSkins)
    ? payload.unlockedSkins.filter((id): id is SkinId => VALID_SKIN_IDS.has(id))
    : [];
  const secretUnlocked = Boolean(payload.secretUnlocked || baseSkins.includes('ascendant'));
  const unlockedSkins = Array.from(
    new Set<SkinId>([
      'strider',
      ...baseSkins,
      ...(secretUnlocked ? (['ascendant'] as SkinId[]) : []),
    ])
  ).slice(0, 22);

  const selectedSkin: SkinId =
    VALID_SKIN_IDS.has(payload.selectedSkin) && unlockedSkins.includes(payload.selectedSkin)
      ? payload.selectedSkin
      : 'strider';

  const unlockedThemes = Array.from(
    new Set<ThemeId>([
      'dynamic',
      'obsidian',
      ...(Array.isArray(payload.unlockedThemes)
        ? payload.unlockedThemes.filter((id): id is ThemeId => VALID_THEME_IDS.has(id))
        : []),
    ])
  ).slice(0, 9);

  const selectedTheme: ThemeId =
    VALID_THEME_IDS.has(payload.selectedTheme) && unlockedThemes.includes(payload.selectedTheme)
      ? payload.selectedTheme
      : 'dynamic';

  const claimedRaceWeeks = Array.from(
    new Set<string>(
      Array.isArray(payload.claimedRaceWeeks)
        ? payload.claimedRaceWeeks.filter((w): w is string => typeof w === 'string' && /^[0-9]{4}-W[0-9]{2}$/.test(w))
        : []
    )
  ).slice(0, 32);

  return {
    bestScore: Math.min(100000000, Math.max(0, Math.floor(Number(payload.bestScore) || 0))),
    bestAltitudeMeters: Math.min(10000000, Math.max(0, Math.floor(Number(payload.bestAltitudeMeters) || 0))),
    totalGems: Math.min(10000000, Math.max(0, Math.floor(Number(payload.totalGems) || 0))),
    claimedRaceWeeks,
    selectedSkin,
    unlockedSkins,
    selectedTheme,
    unlockedThemes,
    secretUnlocked,
    secretRevealMethod: secretUnlocked ? SECRET_SKIN_UNLOCK_METHOD : '',
  };
}

export function subscribeToAuth(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

export async function signInWithGoogle(): Promise<User> {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

export async function signOutAccount(): Promise<void> {
  await signOut(auth);
}

export async function loadOrCreateUserSave(
  uid: string,
  localProgress: CloudProgressPayload
): Promise<CloudUserDocument> {
  const path = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  let existingSnap;
  try {
    existingSnap = await getDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  const sanitizedLocal = sanitizeProgress(localProgress);

  if (existingSnap.exists()) {
    const raw = existingSnap.data();
    const cloudSanitized = sanitizeProgress({
      bestScore: Number(raw.bestScore) || 0,
      bestAltitudeMeters: Number(raw.bestAltitudeMeters) || 0,
      totalGems: Number(raw.totalGems) || 0,
      claimedRaceWeeks: (raw.claimedRaceWeeks as string[]) || [],
      selectedSkin: (raw.selectedSkin as SkinId) || 'strider',
      unlockedSkins: (raw.unlockedSkins as SkinId[]) || ['strider'],
      selectedTheme: (raw.selectedTheme as ThemeId) || 'dynamic',
      unlockedThemes: (raw.unlockedThemes as ThemeId[]) || ['dynamic', 'obsidian'],
      secretUnlocked: Boolean(raw.secretUnlocked),
      secretRevealMethod: String(raw.secretRevealMethod || ''),
    });

    const mergedSkins = Array.from(
      new Set<SkinId>(['strider', ...cloudSanitized.unlockedSkins, ...sanitizedLocal.unlockedSkins])
    ).slice(0, 22);
    const mergedThemes = Array.from(
      new Set<ThemeId>(['dynamic', 'obsidian', ...cloudSanitized.unlockedThemes, ...sanitizedLocal.unlockedThemes])
    ).slice(0, 9);
    const mergedClaimedWeeks = Array.from(
      new Set<string>([...cloudSanitized.claimedRaceWeeks, ...sanitizedLocal.claimedRaceWeeks])
    ).slice(0, 32);
    const mergedSecret =
      cloudSanitized.secretUnlocked ||
      sanitizedLocal.secretUnlocked ||
      mergedSkins.includes('ascendant');

    const merged = sanitizeProgress({
      bestScore: Math.max(cloudSanitized.bestScore, sanitizedLocal.bestScore),
      bestAltitudeMeters: Math.max(
        cloudSanitized.bestAltitudeMeters,
        sanitizedLocal.bestAltitudeMeters
      ),
      totalGems: Math.max(cloudSanitized.totalGems, sanitizedLocal.totalGems),
      claimedRaceWeeks: mergedClaimedWeeks,
      selectedSkin:
        sanitizedLocal.selectedSkin !== 'strider'
          ? sanitizedLocal.selectedSkin
          : cloudSanitized.selectedSkin,
      unlockedSkins: mergedSkins,
      selectedTheme:
        sanitizedLocal.selectedTheme !== 'dynamic'
          ? sanitizedLocal.selectedTheme
          : cloudSanitized.selectedTheme,
      unlockedThemes: mergedThemes,
      secretUnlocked: mergedSecret,
      secretRevealMethod: mergedSecret ? SECRET_SKIN_UNLOCK_METHOD : '',
    });

    try {
      await updateDoc(userRef, {
        ...merged,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }

    return {
      uid,
      username: typeof raw.username === 'string' ? raw.username : '',
      ...merged,
    };
  }

  try {
    await setDoc(userRef, {
      uid,
      username: '',
      ...sanitizedLocal,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  return {
    uid,
    username: '',
    ...sanitizedLocal,
  };
}

export async function syncCloudSave(uid: string, localProgress: CloudProgressPayload): Promise<void> {
  const path = `users/${uid}`;
  const userRef = doc(db, 'users', uid);
  const sanitized = sanitizeProgress(localProgress);

  try {
    await updateDoc(userRef, {
      ...sanitized,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

function computeIsoWeekId(utcDate: Date): string {
  const d = new Date(Date.UTC(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function hashWeekSeed(weekId: string): number {
  let h = 2166136261;
  for (let i = 0; i < weekId.length; i++) {
    h ^= weekId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) || 1;
}

function formatDurationShort(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${Math.max(1, mins)}m`;
}

const UTC_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function getWeeklyRaceStatus(now: Date = new Date()): WeeklyRaceStatus {
  const weekId = computeIsoWeekId(now);
  const prevDate = new Date(now.getTime() - 7 * 86400000);
  const previousWeekId = computeIsoWeekId(prevDate);
  const utcDay = now.getUTCDay(); // 0=Sun, 1=Mon .. 5=Fri, 6=Sat
  const isActive = utcDay >= 1 && utcDay <= 5;
  const seed = hashWeekSeed(weekId);

  const baseUtcMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const daysUntilTarget = isActive ? 6 - utcDay : utcDay === 0 ? 1 : 8 - utcDay;
  const targetMs = baseUtcMidnight + daysUntilTarget * 86400000;
  const countdownText = formatDurationShort(targetMs - now.getTime());

  return {
    weekId,
    previousWeekId,
    seed,
    isActive,
    dayLabel: `${UTC_DAY_NAMES[utcDay]} UTC`,
    countdownText,
  };
}

function sortRaceEntries(entries: RaceEntry[]): RaceEntry[] {
  return [...entries].sort((a, b) => {
    if (b.bestAltitudeMeters !== a.bestAltitudeMeters) {
      return b.bestAltitudeMeters - a.bestAltitudeMeters;
    }
    if (b.bestScore !== a.bestScore) {
      return b.bestScore - a.bestScore;
    }
    return a.bestTimeSec - b.bestTimeSec;
  });
}

function parseRaceEntryDoc(raw: Record<string, unknown>, fallbackId: string): RaceEntry {
  const rawSkin = String(raw.skinId || 'strider') as SkinId;
  return {
    uid: typeof raw.uid === 'string' && raw.uid ? raw.uid : fallbackId,
    displayName: typeof raw.displayName === 'string' && raw.displayName ? raw.displayName : 'Climber',
    skinId: VALID_SKIN_IDS.has(rawSkin) ? rawSkin : 'strider',
    bestAltitudeMeters: Math.max(0, Math.floor(Number(raw.bestAltitudeMeters) || 0)),
    bestScore: Math.max(0, Math.floor(Number(raw.bestScore) || 0)),
    bestTimeSec: Math.max(0, Number(raw.bestTimeSec) || 0),
    runsCount: Math.max(1, Math.floor(Number(raw.runsCount) || 1)),
  };
}

export function subscribeRaceLeaderboard(
  weekId: string,
  onEntries: (entries: RaceEntry[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = `weeklyRaces/${weekId}/entries`;
  const entriesRef = collection(db, 'weeklyRaces', weekId, 'entries');
  const q = query(
    entriesRef,
    where('bestAltitudeMeters', '>=', 0),
    orderBy('bestAltitudeMeters', 'desc'),
    limit(25)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: RaceEntry[] = snapshot.docs.map((d) =>
        parseRaceEntryDoc(d.data() as Record<string, unknown>, d.id)
      );
      onEntries(sortRaceEntries(list));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function fetchTopRaceWinners(weekId: string): Promise<RaceEntry[]> {
  const path = `weeklyRaces/${weekId}/entries`;
  const entriesRef = collection(db, 'weeklyRaces', weekId, 'entries');
  const q = query(
    entriesRef,
    where('bestAltitudeMeters', '>=', 0),
    orderBy('bestAltitudeMeters', 'desc'),
    limit(25)
  );

  try {
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => parseRaceEntryDoc(d.data() as Record<string, unknown>, d.id));
    return sortRaceEntries(list);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function submitRaceProgress(
  weekId: string,
  uid: string,
  entry: {
    displayName: string;
    skinId: SkinId;
    altitudeMeters: number;
    score: number;
    timeSec: number;
  },
  incrementRun: boolean
): Promise<void> {
  const path = `weeklyRaces/${weekId}/entries/${uid}`;
  const entryRef = doc(db, 'weeklyRaces', weekId, 'entries', uid);

  const cleanName = (entry.displayName || 'Climber').trim().slice(0, 24) || 'Climber';
  const cleanSkin: SkinId = VALID_SKIN_IDS.has(entry.skinId) ? entry.skinId : 'strider';
  const alt = Math.min(10000000, Math.max(0, Math.floor(entry.altitudeMeters || 0)));
  const score = Math.min(100000000, Math.max(0, Math.floor(entry.score || 0)));
  const timeSec = Math.min(864000, Math.max(0, Math.round((entry.timeSec || 0) * 10) / 10));

  let existingSnap;
  try {
    existingSnap = await getDoc(entryRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  if (!existingSnap.exists()) {
    try {
      await setDoc(entryRef, {
        uid,
        displayName: cleanName,
        skinId: cleanSkin,
        bestAltitudeMeters: alt,
        bestScore: score,
        bestTimeSec: timeSec,
        runsCount: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
    return;
  }

  const prev = existingSnap.data();
  const prevAlt = Math.max(0, Math.floor(Number(prev.bestAltitudeMeters) || 0));
  const prevScore = Math.max(0, Math.floor(Number(prev.bestScore) || 0));
  const prevTime = Math.max(0, Number(prev.bestTimeSec) || 0);
  const prevRuns = Math.max(1, Math.floor(Number(prev.runsCount) || 1));

  const nextAlt = Math.max(prevAlt, alt);
  const nextScore = Math.max(prevScore, score);
  let nextTime = prevTime;
  if (alt > prevAlt) {
    nextTime = timeSec;
  } else if (alt === prevAlt && timeSec > 0 && (prevTime <= 0 || timeSec < prevTime)) {
    nextTime = timeSec;
  }
  const nextRuns = Math.min(10000, incrementRun ? prevRuns + 1 : prevRuns);

  const changed =
    incrementRun ||
    nextAlt !== prevAlt ||
    nextScore !== prevScore ||
    nextTime !== prevTime ||
    cleanName !== prev.displayName ||
    cleanSkin !== prev.skinId;

  if (!changed) return;

  try {
    await updateDoc(entryRef, {
      displayName: cleanName,
      skinId: cleanSkin,
      bestAltitudeMeters: nextAlt,
      bestScore: nextScore,
      bestTimeSec: nextTime,
      runsCount: nextRuns,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function validateUsernameFormat(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length < 3 || trimmed.length > 20) {
    return 'Username must be 3 to 20 characters.';
  }
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmed)) {
    return 'Use only letters, numbers, and underscores (_).';
  }
  return null;
}

export async function claimUsername(
  uid: string,
  rawUsername: string,
  currentUsername: string
): Promise<{ ok: true; username: string } | { ok: false; message: string }> {
  const trimmed = rawUsername.trim();
  const validationError = validateUsernameFormat(trimmed);
  if (validationError) {
    return { ok: false, message: validationError };
  }

  const newLower = trimmed.toLowerCase();
  const oldLower = currentUsername ? currentUsername.toLowerCase() : '';

  if (oldLower === newLower) {
    return { ok: false, message: `You already own @${currentUsername}.` };
  }

  const claimPath = `usernames/${newLower}`;
  const claimRef = doc(db, 'usernames', newLower);
  let claimSnap;
  try {
    claimSnap = await getDoc(claimRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, claimPath);
  }

  if (claimSnap.exists() && claimSnap.data().uid !== uid) {
    return { ok: false, message: `@${trimmed} is already claimed by another climber.` };
  }

  const userRef = doc(db, 'users', uid);
  const batch = writeBatch(db);

  if (oldLower && oldLower !== newLower) {
    batch.delete(doc(db, 'usernames', oldLower));
  }

  batch.set(claimRef, {
    uid,
    username: trimmed,
    usernameLower: newLower,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.update(userRef, {
    username: trimmed,
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, claimPath);
  }

  return { ok: true, username: trimmed };
}
