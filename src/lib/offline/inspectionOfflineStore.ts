import type { InspectionTemplate, InspectionTemplateOption } from '../../repositories/inspections/structuredInspectionRepository';
import type { InspectionRecord } from '../../repositories/inspections/inspectionsRepository';
import type { ProviderDirectoryItem } from '../../types/providers/providerTypes';

const DB_NAME = 'nmis-offline';
const DB_VERSION = 1;
const PACK_STORE = 'inspection-packs';
const DRAFT_STORE = 'inspection-drafts';

export type OfflineInspectionPack = {
  id: 'current';
  savedAt: string;
  inspections: InspectionRecord[];
  providers: ProviderDirectoryItem[];
  templateOptions: InspectionTemplateOption[];
  templates: Record<string, InspectionTemplate>;
};

export type OfflineInspectionDraft = {
  key: string;
  savedAt: string;
  status: 'pending-sync';
  inspectionId: string | null;
  payload: unknown;
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('Offline storage is unavailable in this browser.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PACK_STORE)) db.createObjectStore(PACK_STORE, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(DRAFT_STORE)) db.createObjectStore(DRAFT_STORE, { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Unable to open offline storage.'));
  });
}

async function put<T>(storeName: string, value: T): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    transaction.objectStore(storeName).put(value);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Unable to write offline data.'));
  });
  db.close();
}

async function get<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
  const db = await openDatabase();
  const value = await new Promise<T | null>((resolve, reject) => {
    const request = db.transaction(storeName, 'readonly').objectStore(storeName).get(key);
    request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
    request.onerror = () => reject(request.error || new Error('Unable to read offline data.'));
  });
  db.close();
  return value;
}

export async function saveOfflineInspectionPack(pack: Omit<OfflineInspectionPack, 'id' | 'savedAt'>): Promise<OfflineInspectionPack> {
  const stored: OfflineInspectionPack = { ...pack, id: 'current', savedAt: new Date().toISOString() };
  await put(PACK_STORE, stored);
  return stored;
}

export function loadOfflineInspectionPack(): Promise<OfflineInspectionPack | null> {
  return get<OfflineInspectionPack>(PACK_STORE, 'current');
}

export function saveOfflineInspectionDraft(draft: OfflineInspectionDraft): Promise<void> {
  return put(DRAFT_STORE, draft);
}

export function loadOfflineInspectionDraft(key: string): Promise<OfflineInspectionDraft | null> {
  return get<OfflineInspectionDraft>(DRAFT_STORE, key);
}

export async function removeOfflineInspectionDraft(key: string): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(DRAFT_STORE, 'readwrite');
    transaction.objectStore(DRAFT_STORE).delete(key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Unable to remove offline draft.'));
  });
  db.close();
}

export function offlinePackAgeLabel(savedAt: string): string {
  const ageHours = Math.max(0, (Date.now() - new Date(savedAt).getTime()) / 3_600_000);
  if (ageHours < 1) return 'less than one hour ago';
  if (ageHours < 24) return `${Math.floor(ageHours)} hours ago`;
  return `${Math.floor(ageHours / 24)} days ago`;
}

export type { InspectionTemplate, InspectionTemplateOption, InspectionRecord, ProviderDirectoryItem };
