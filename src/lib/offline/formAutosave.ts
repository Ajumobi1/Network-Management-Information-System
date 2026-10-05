export type FormAutosaveEnvelope<T> = {
  version: 1;
  savedAt: string;
  data: T;
};

const ACTIVE_FORM_KEY = 'nmis-active-form';

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readFormAutosave<T>(key: string): FormAutosaveEnvelope<T> | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FormAutosaveEnvelope<T>>;
    if (parsed.version === 1 && parsed.savedAt && parsed.data !== undefined) return parsed as FormAutosaveEnvelope<T>;
    // Migrate the earlier accreditation format, which stored the snapshot directly.
    if (parsed.data === undefined && typeof parsed === 'object') {
      return { version: 1, savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString(), data: parsed as T };
    }
    return null;
  } catch {
    return null;
  }
}

export function writeFormAutosave<T>(key: string, data: T): boolean {
  if (!canUseStorage()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify({ version: 1, savedAt: new Date().toISOString(), data } satisfies FormAutosaveEnvelope<T>));
    return true;
  } catch {
    return false;
  }
}

export function removeFormAutosave(key: string): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage can be unavailable in private/restricted browser contexts.
  }
}

export function setActiveForm(active: boolean): void {
  if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') return;
  try {
    if (active) window.sessionStorage.setItem(ACTIVE_FORM_KEY, 'true');
    else window.sessionStorage.removeItem(ACTIVE_FORM_KEY);
  } catch {
    // Session storage can be unavailable in private/restricted browser contexts.
  }
}

export function isFormActive(): boolean {
  if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(ACTIVE_FORM_KEY) === 'true';
  } catch {
    return false;
  }
}
