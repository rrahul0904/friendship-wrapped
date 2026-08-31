import type { StoryMode } from "@/lib/types";

export type FunnelEventName =
  | "landing_viewed"
  | "analyzer_started"
  | "analysis_completed"
  | "premium_preview_viewed"
  | "checkout_started"
  | "checkout_completed"
  | "share_link_created";

export interface FunnelEventProperties {
  product?: "friendship";
  storyMode?: StoryMode;
  messageCountBucket?: "under_100" | "100_999" | "1k_9k" | "10k_plus";
  yearCountBucket?: "1" | "2_3" | "4_6" | "7_plus";
}

export interface AnalyticsClient {
  track(event: FunnelEventName, properties?: FunnelEventProperties): void | Promise<void>;
}

export const noopAnalytics: AnalyticsClient = {
  track() {},
};
