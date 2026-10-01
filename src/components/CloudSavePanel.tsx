"use client";

import { useMemo } from "react";
import type { ChatStats, StoryMode } from "@/lib/types";
import { getStoryModeConfig } from "@/platform/story/modes";
import { toThreadTaleResultV2 } from "@/platform/threadtales/result-v2";
import { sanitizeThreadTaleCloudResult } from "@/platform/threadtales/cloud-result";
import { ProductCloudSavePanel } from "./ProductCloudSavePanel";

export function CloudSavePanel({ stats, mode }: { stats: ChatStats; mode: StoryMode }) {
  const result = useMemo(() => sanitizeThreadTaleCloudResult(toThreadTaleResultV2(stats)), [stats]);
  const config = getStoryModeConfig(mode);
  return <ProductCloudSavePanel
    product="threadtales"
    mode={mode}
    title={config.eyebrow}
    result={result}
    description="Cloud save stores aggregate counts and anonymous participant labels. Names, top words and imported conversation text stay in this browser."
  />;
}
