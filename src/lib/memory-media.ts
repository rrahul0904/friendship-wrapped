import type { MemoryIntentKind } from "./memory-space";

export type MemoryMediaKind = "IMAGE" | "VIDEO";

export interface MemoryMediaAsset {
  schemaVersion: 1;
  id: string;
  memorySpaceId: string;
  kind: MemoryMediaKind;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface MemoryMediaRecord extends MemoryMediaAsset {
  blob: Blob;
}

export interface SoundtrackReference {
  mode: "REFERENCE";
  title: string;
  artist: string;
  url: string;
}

export interface MemoryStudioDraft {
  schemaVersion: 1;
  memorySpaceId: string;
  intent: MemoryIntentKind;
  dedication: string;
  soundtrack: SoundtrackReference;
  updatedAt: string;
}

export interface MediaValidationInput {
  name: string;
  type: string;
  size: number;
}

export const MAX_LOCAL_MEDIA_BYTES = 100 * 1024 * 1024;
const DB_NAME = "threadtales-memory-v1";
const DB_VERSION = 1;
const MEDIA_STORE = "media";

export function validateMemoryMediaFile(file: MediaValidationInput): string | null {
  const type = file.type.toLowerCase();
  if (!type.startsWith("image/") && !type.startsWith("video/")) {
    return `${file.name || "This file"} is not a supported photo or video.`;
  }
  if (file.size <= 0) return `${file.name || "This file"} is empty.`;
  if (file.size > MAX_LOCAL_MEDIA_BYTES) {
    return `${file.name || "This file"} is larger than the 100 MB local-media limit for this prototype.`;
  }
  return null;
}

export function mediaKindForType(type: string): MemoryMediaKind {
  return type.toLowerCase().startsWith("video/") ? "VIDEO" : "IMAGE";
}

export function studioDraftStorageKey(memorySpaceId: string, intent: MemoryIntentKind) {
  return `threadtales:memory-studio:v1:${memorySpaceId}:${intent}`;
}

export function newMemoryStudioDraft(
  memorySpaceId: string,
  intent: MemoryIntentKind,
  now = new Date(),
): MemoryStudioDraft {
  return {
    schemaVersion: 1,
    memorySpaceId,
    intent,
    dedication: "",
    soundtrack: { mode: "REFERENCE", title: "", artist: "", url: "" },
    updatedAt: now.toISOString(),
  };
}

export function isMemoryStudioDraft(value: unknown): value is MemoryStudioDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<MemoryStudioDraft>;
  return (
    draft.schemaVersion === 1 &&
    typeof draft.memorySpaceId === "string" &&
    typeof draft.intent === "string" &&
    typeof draft.dedication === "string" &&
    Boolean(draft.soundtrack) &&
    draft.soundtrack?.mode === "REFERENCE" &&
    typeof draft.soundtrack.title === "string" &&
    typeof draft.soundtrack.artist === "string" &&
    typeof draft.soundtrack.url === "string" &&
    typeof draft.updatedAt === "string"
  );
}

function openMemoryDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("Could not open the local Memory Vault."));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MEDIA_STORE)) {
        const store = db.createObjectStore(MEDIA_STORE, { keyPath: "id" });
        store.createIndex("memorySpaceId", "memorySpaceId", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Local Memory Vault operation failed."));
  });
}

export async function saveMemoryMediaFiles(memorySpaceId: string, files: File[]): Promise<MemoryMediaAsset[]> {
  const db = await openMemoryDb();
  try {
    const saved: MemoryMediaAsset[] = [];
    for (const file of files) {
      const validationError = validateMemoryMediaFile(file);
      if (validationError) throw new Error(validationError);
      const createdAt = new Date().toISOString();
      const asset: MemoryMediaRecord = {
        schemaVersion: 1,
        id: `${memorySpaceId}:${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`,
        memorySpaceId,
        kind: mediaKindForType(file.type),
        name: file.name,
        mimeType: file.type,
        size: file.size,
        createdAt,
        blob: file,
      };
      const transaction = db.transaction(MEDIA_STORE, "readwrite");
      await requestResult(transaction.objectStore(MEDIA_STORE).put(asset));
      const { blob: _blob, ...metadata } = asset;
      void _blob;
      saved.push(metadata);
    }
    return saved;
  } finally {
    db.close();
  }
}

export async function listMemoryMedia(memorySpaceId: string): Promise<MemoryMediaRecord[]> {
  const db = await openMemoryDb();
  try {
    const transaction = db.transaction(MEDIA_STORE, "readonly");
    const index = transaction.objectStore(MEDIA_STORE).index("memorySpaceId");
    const records = await requestResult(index.getAll(IDBKeyRange.only(memorySpaceId)) as IDBRequest<MemoryMediaRecord[]>);
    return records.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  } finally {
    db.close();
  }
}

export async function deleteMemoryMedia(assetId: string): Promise<void> {
  const db = await openMemoryDb();
  try {
    const transaction = db.transaction(MEDIA_STORE, "readwrite");
    await requestResult(transaction.objectStore(MEDIA_STORE).delete(assetId));
  } finally {
    db.close();
  }
}
