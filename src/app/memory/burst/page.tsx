import type { Metadata } from "next";
import { MemoryBurst } from "@/components/MemoryBurst";
import { isMemoryIntentKind } from "@/lib/memory-space";

export const metadata: Metadata = {
  title: "Memory Burst | ThreadTales",
  description: "Play a private interactive Memory Burst from memories already in your browser.",
  robots: { index: false, follow: false },
};

export default async function MemoryBurstPage({
  searchParams,
}: {
  searchParams: Promise<{ memorySpaceId?: string | string[]; intent?: string | string[] }>;
}) {
  const params = await searchParams;
  const memorySpaceId = typeof params.memorySpaceId === "string" ? params.memorySpaceId.trim() : "";
  const requestedIntent = typeof params.intent === "string" ? params.intent : null;
  const intent = isMemoryIntentKind(requestedIntent) ? requestedIntent : "MEMORY_LANE";
  return <MemoryBurst memorySpaceId={memorySpaceId} intent={intent} />;
}
