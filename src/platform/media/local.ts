export interface LocalMediaAsset {
  id: string;
  name: string;
  type: string;
  size: number;
  lastModified: number;
  objectUrl: string;
}

export interface MediaStorageAdapter {
  upload(asset: File, context: { product: "myyear" | "petlife"; ownerId: string }): Promise<{ id: string; privateUrl?: string }>;
  remove(id: string): Promise<void>;
}

export function createLocalMediaAssets(files: FileList | File[] | null | undefined, limit = 12): LocalMediaAsset[] {
  if (!files) return [];
  return Array.from(files).slice(0, Math.max(0, limit)).filter((file) => file.type.startsWith("image/")).map((file, index) => ({
    id: `${file.name}-${file.lastModified}-${file.size}-${index}`,
    name: file.name,
    type: file.type || "image/*",
    size: file.size,
    lastModified: file.lastModified,
    objectUrl: URL.createObjectURL(file),
  }));
}

export function revokeLocalMediaAssets(assets: LocalMediaAsset[]) {
  for (const asset of assets) URL.revokeObjectURL(asset.objectUrl);
}

export function mediaMetadataOnly(assets: LocalMediaAsset[]) {
  return assets.map(({ name, type, size, lastModified }) => ({ name, type, size, lastModified }));
}
