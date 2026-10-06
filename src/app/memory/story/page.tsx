import { isMemoryIntentKind } from "@/lib/memory-space";
import { MemoryStoryPreview } from "@/components/MemoryStoryPreview";

export default async function MemoryStoryPage({
  searchParams,
}: {
  searchParams: Promise<{ memorySpaceId?: string | string[]; intent?: string | string[] }>;
}) {
  const params = await searchParams;
  const memorySpaceId = typeof params.memorySpaceId === "string" ? params.memorySpaceId.trim() : "";
  const requestedIntent = typeof params.intent === "string" ? params.intent : null;
  const intent = isMemoryIntentKind(requestedIntent) ? requestedIntent : "MEMORY_LANE";

  return <MemoryStoryPreview memorySpaceId={memorySpaceId} intent={intent} />;
}
