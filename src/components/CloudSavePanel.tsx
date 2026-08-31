"use client";

import { useMemo } from "react";
import type { ChatStats, StoryMode } from "@/lib/types";
import { getStoryModeConfig } from "@/platform/story/modes";
import { toThreadTaleResultV2 } from "@/platform/threadtales/result-v2";
import { ProductCloudSavePanel } from "./ProductCloudSavePanel";

export function CloudSavePanel({ stats, mode }: { stats: ChatStats; mode: StoryMode }) {
  const result = useMemo(() => toThreadTaleResultV2(stats), [stats]);
  const config = getStoryModeConfig(mode);
  return <ProductCloudSavePanel
    product="threadtales"
    mode={mode}
    title={config.eyebrow}
    result={result}
    description="ThreadTales cloud save is opt-in and stores the versioned derived result only. The imported WhatsApp text is never part of this request."
  />;
}
