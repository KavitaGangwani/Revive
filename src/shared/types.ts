/**
 * Revive — Shared Type Definitions
 * Shared between Electron Main Process, Preload Scripts, and Renderer Process.
 */

export const REST_WARNING_SECONDS = 90;
export const TRANSITION_SECONDS = 5;

export interface AppSettings {
  nudges: {
    eyeBreak: { enabled: boolean; intervalMinutes: number }; // 5-120, step 5
    drinkWater: { enabled: boolean; intervalMinutes: number }; // 5-180, step 5
    standaloneInBackground?: boolean; // Run nudges even when no active focus session is running
  };
  takeover: {
    allDisplays: boolean; // true = every display, false = main display only
    allowSnooze: boolean;
    snoozeMinutes: number; // 1-15, step 1
    restWarning: boolean; // Rest in 1 minute warning toast (default: true)
    windowMode?: 'window' | 'fullscreen'; // 'window' = same size as app (900x720), 'fullscreen' = full screen overlay
  };
  sound: {
    chimeAtRestStart: boolean;
    chimeAtRestEnd: boolean;
    notificationSounds?: boolean; // Short notification chime on reminder/warning toasts (default: true)
  };
  autostart?: boolean; // Launch on Windows startup
  miniFocusWindow?: boolean; // Show mini floating timer during focus
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type ActivityType = 'breathing' | 'routine' | 'none'; // absent or 'none'

export type PhaseKind = 'in' | 'hold' | 'out' | 'inhale' | 'exhale';

export interface BreathingPhase {
  label?: string;
  seconds: number;
  kind?: PhaseKind;
  soundId?: string;
}

export interface RoutineStep {
  name?: string;
  title?: string;
  body?: string;
  seconds?: number;
}

export interface SoundPack {
  id: string;
  name: string;
  isBuiltIn: boolean;
  in?: string; // file paths (local) or bundled asset ids
  hold?: string;
  out?: string;
  stretchToPhase?: boolean; // playbackRate clamped 0.75-1.5
}

export interface BreathingScheduleItem {
  index: number;
  phaseIndex: number;
  kind: PhaseKind;
  label: string;
  startEpochMs: number;
  durationMs: number;
  soundId?: string;
}

export interface Activity {
  id: string;
  name: string; // 1-40 chars
  builtIn?: boolean;
  builtin?: boolean;
  note?: string; // max 120
  notes?: string;
  tagline?: string;
  recommendedFor?: string;
  type?: ActivityType;
  phases?: BreathingPhase[];
  steps?: RoutineStep[];
  media?: { kind: 'youtube' | 'spotify'; url: string; autoplay?: boolean; startMuted?: boolean };
  // Backwards compatibility helpers
  isBuiltIn?: boolean;
  title?: string;
  createdAt?: number;
}

export interface LibrarySettings {
  custom: Activity[]; // only user-made activities are stored
  defaults: {
    restActivityId?: string | null;
    breathingSoundPackId?: string | null;
    breathingSoundVolume?: number; // 0..1
    restWarning?: boolean;
  };
  // Runtime / backward compatibility aliases
  activities?: Activity[];
  soundPacks?: SoundPack[];
}

export interface LibraryPayload {
  activities: Activity[];
  defaultId?: string;
  defaults?: LibrarySettings['defaults'];
}

// Backwards compatibility alias
export type LibraryItem = Activity;

export type SessionPhase =
  | 'idle'
  | 'focus'
  | 'transition-to-rest'
  | 'rest'
  | 'transition-to-focus'
  | 'closing'
  | 'choose-activity'
  | 'session-complete';

export interface SessionConfig {
  focusMinutes: number;
  restMinutes: number;
  loopCount: number;
  restActivityIds: (string | null)[];
}

export interface SessionSnapshot {
  phase: SessionPhase;
  loopIndex: number;
  loopCount: number;
  remainingMs: number;
  totalMs: number;
  restActivityId: string | null;
  config: SessionConfig;
  breathingSchedule?: BreathingScheduleItem[];
  snoozeUsed?: boolean;
  isSnoozed?: boolean;
  leftOffNote?: string | null;
  isClosing?: boolean;
}

export interface PersistedSessionState {
  config: SessionConfig;
  loopIndex: number;
  phase: SessionPhase;
  phaseEndsAt: number;
  snoozeUsed?: boolean;
  savedAt?: number;
  leftOffNote?: string | null;
}

export interface DraftConfigState {
  config: SessionConfig;
  savedSlotChoices: (string | null)[];
}

export interface UserPrefs {
  focusMinutes: number;
  restMinutes: number;
  loopCount: number;
  restActivityIds: (string | null)[];
  sidebarCollapsed: boolean;
  miniFocusWindowEnabled?: boolean;
  miniWindowPositions?: { [displayId: string]: { x: number; y: number } };
  defaults: {
    restActivityId: string | null;
  };
}

export interface SessionResume {
  lastActiveTimestamp: number;
  activeSessionId: string | null;
  lastStage: string;
  completedDurationSeconds: number;
}

export type ToastType = 'eyeBreak' | 'drinkWater' | 'restWarning';

export interface ToastData {
  id: string;
  type: ToastType;
  label: string;
  text: string;
  durationMs: number;
}

export interface StoreSchema {
  settings: AppSettings;
  library: LibrarySettings;
  session: SessionResume;
  persistedSession: PersistedSessionState | null;
  draftConfig: (SessionConfig & { savedSlotChoices?: (string | null)[] }) | null;
  prefs: UserPrefs;
  lastBootTime: number;
}

export interface SplashBridge {
  onProgress: (callback: (progress: number) => void) => void;
  done: () => void;
  minimize: () => void;
  close: () => void;
  onStartAnimation?: (callback: () => void) => () => void;
}

export interface MainBridge {
  getSettings: () => Promise<AppSettings>;
  getSessionResume: () => Promise<SessionResume>;
}

export interface SettingsAPI {
  getSettings: () => Promise<AppSettings>;
  updateSettings: (patch: DeepPartial<AppSettings>) => Promise<AppSettings>;
  onSettingsChanged: (callback: (settings: AppSettings) => void) => () => void;
}

export interface WindowAPI {
  onCloseRequested: (callback: () => void) => () => void;
  closeChoice: (choice: 'hide' | 'quit') => void;
  minimize: () => void;
  close: () => void;
  showMainWindow: () => void;
}

export interface OverlayAPI {
  snooze: () => Promise<SessionSnapshot>;
  resumeFocus: () => Promise<SessionSnapshot>;
  selectRestActivity: (id: string) => Promise<SessionConfig>;
  getSoundPacks: () => Promise<SoundPack[]>;
  saveSoundFile: (fileBuffer: ArrayBuffer, fileName: string) => Promise<{ ok: boolean; path?: string; error?: string }>;
  onOverlayExit: (callback: () => void) => () => void;
}

export interface LibraryAPI {
  getLibrary: () => Promise<LibraryPayload>;
  addActivity: (input: Omit<Activity, 'id' | 'builtIn'>) => Promise<{ ok: true; activity: Activity } | { ok: false; error: string }>;
  updateActivity: (id: string, input: Omit<Activity, 'id' | 'builtIn'>) => Promise<{ ok: true; activity: Activity } | { ok: false; error: string }>;
  duplicateActivity?: (id: string) => Promise<{ ok: true; activity: Activity } | { ok: false; error: string }>;
  deleteActivity: (id: string) => Promise<void>;
  setDefault: (id: string | null) => Promise<void>;
  setSoundSettings?: (soundPackId: string | null, volume: number) => Promise<void>;
  onLibraryChanged: (callback: (lib: LibraryPayload) => void) => () => void;
}

export interface MiniWindowAPI {
  toggle: () => Promise<boolean>;
  getEnabled: () => Promise<boolean>;
  setEnabled: (enabled: boolean) => Promise<boolean>;
  savePosition: (displayId: string, x: number, y: number) => void;
}

export interface ToastAPI {
  dismiss: (id: string) => void;
  snooze?: (minutes?: number) => Promise<SessionSnapshot>;
  keepOpen?: (id: string) => void;
  resize?: (id: string, width: number, height: number) => void;
}

export interface ReviveAPI {
  session: {
    getSnapshot: () => Promise<SessionSnapshot>;
    start: (config: SessionConfig) => Promise<SessionSnapshot>;
    skipToRest: () => Promise<SessionSnapshot>;
    anotherOne: () => Promise<SessionSnapshot>;
    doneForNow: () => Promise<SessionSnapshot>;
    snooze: () => Promise<SessionSnapshot>;
    resumeFocus: () => Promise<SessionSnapshot>;
    onTick: (callback: (snapshot: SessionSnapshot) => void) => () => void;
    setRestActivity: (index: number, id: string | null) => Promise<SessionConfig>;
    getDraftConfig: () => Promise<DraftConfigState>;
    setDraftConfig: (draft: SessionConfig & { savedSlotChoices?: (string | null)[] }) => Promise<DraftConfigState>;
    checkPendingResume: () => Promise<PersistedSessionState | null>;
    confirmResume: (confirm: boolean) => Promise<boolean>;
    devResetToIdle: () => Promise<void>;
    setLeftOffNote: (note: string) => Promise<SessionSnapshot>;
    backToWork: () => Promise<SessionSnapshot>;
    beginRestNow?: () => Promise<SessionSnapshot>;
  };
  library: {
    getActivities: () => Promise<Activity[]>;
  };
  prefs: {
    get: () => Promise<UserPrefs>;
    set: (partial: Partial<UserPrefs>) => Promise<UserPrefs>;
  };
  settings?: SettingsAPI;
  windowControls?: {
    minimize: () => void;
    close: () => void;
    show?: () => void;
  };
  overlay?: OverlayAPI;
  miniWindow?: MiniWindowAPI;
  toast?: ToastAPI;
}

export type StillAPI = ReviveAPI;

export const IPC_CHANNELS = {
  SPLASH_PROGRESS: 'splash:progress',
  SPLASH_DONE: 'splash:done',
  SPLASH_MINIMIZE: 'splash:minimize',
  SPLASH_CLOSE: 'splash:close',
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_SHOW_MAIN: 'window:show-main',
  WINDOW_CLOSE_REQUESTED: 'window:close-requested',
  WINDOW_CLOSE_CHOICE: 'window:close-choice',
  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',
  SETTINGS_CHANGED: 'settings:changed',
  GET_SETTINGS: 'app:get-settings',
  GET_SESSION_RESUME: 'app:get-session-resume',
  // Session IPC
  SESSION_GET_SNAPSHOT: 'session:get-snapshot',
  SESSION_START: 'session:start',
  SESSION_SKIP_TO_REST: 'session:skip-to-rest',
  SESSION_ANOTHER_ONE: 'session:another-one',
  SESSION_DONE_FOR_NOW: 'session:done-for-now',
  SESSION_SNOOZE: 'session:snooze',
  SESSION_RESUME_FOCUS: 'session:resume-focus',
  SESSION_SET_REST_ACTIVITY: 'session:set-rest-activity',
  SESSION_GET_DRAFT_CONFIG: 'session:get-draft-config',
  SESSION_SET_DRAFT_CONFIG: 'session:set-draft-config',
  SESSION_CHECK_PENDING_RESUME: 'session:check-pending-resume',
  SESSION_CONFIRM_RESUME: 'session:confirm-resume',
  SESSION_TICK: 'session:tick',
  SESSION_SET_LEFT_OFF_NOTE: 'session:set-left-off-note',
  SESSION_BACK_TO_WORK: 'session:back-to-work',
  SESSION_BEGIN_REST_NOW: 'session:begin-rest-now',
  DEV_RESET_TO_IDLE: 'dev:reset-to-idle',
  TOAST_KEEP_OPEN: 'toast:keep-open',
  TOAST_RESIZE: 'toast:resize',
  // Overlay IPC
  OVERLAY_EXIT: 'overlay:exit',
  OVERLAY_EXIT_ANIMATE: 'overlay:exit-animate',
  // Sound / Audio IPC
  SOUND_SAVE_FILE: 'sound:save-file',
  SOUND_GET_PACKS: 'sound:get-packs',
  // Library IPC
  LIBRARY_GET: 'library:get',
  LIBRARY_ADD: 'library:add',
  LIBRARY_UPDATE: 'library:update',
  LIBRARY_DUPLICATE: 'library:duplicate',
  LIBRARY_DELETE: 'library:delete',
  LIBRARY_SET_DEFAULT: 'library:set-default',
  LIBRARY_SET_SOUND_SETTINGS: 'library:set-sound-settings',
  LIBRARY_CHANGED: 'library:changed',
  LIBRARY_GET_ACTIVITIES: 'library:get-activities',
  // Prefs IPC
  PREFS_GET: 'prefs:get',
  PREFS_SET: 'prefs:set',
  // Mini Window IPC
  MINI_WINDOW_TOGGLE: 'mini-window:toggle',
  MINI_WINDOW_GET_ENABLED: 'mini-window:get-enabled',
  MINI_WINDOW_SET_ENABLED: 'mini-window:set-enabled',
  MINI_WINDOW_SAVE_POSITION: 'mini-window:save-position',
  // Toast IPC
  TOAST_DISMISS: 'toast:dismiss'
} as const;

export type IpcChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];

export interface BootStageProgress {
  stage: string;
  realProgress: number;
}
