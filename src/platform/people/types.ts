export interface Person {
  id: string;
  worldId: string;
  displayName: string;
  relationshipLabel?: string;
  avatarMediaId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
