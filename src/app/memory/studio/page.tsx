import { MemoryStudio } from "@/components/MemoryStudio";
import { isMemoryIntentKind } from "@/lib/memory-space";

export default async function MemoryStudioPage({
  searchParams,
}: {
  searchParams: Promise<{ memorySpaceId?: string | string[]; intent?: string | string[] }>;
}) {
  const params = await searchParams;
  const memorySpaceId = typeof params.memorySpaceId === "string" ? params.memorySpaceId.trim() : "";
  const requestedIntent = typeof params.intent === "string" ? params.intent : null;
  const intent = isMemoryIntentKind(requestedIntent) ? requestedIntent : "MEMORY_LANE";

  return <MemoryStudio memorySpaceId={memorySpaceId} intent={intent} />;
}
