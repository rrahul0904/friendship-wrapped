import type { Metadata } from "next";
import { SourceFirstThreadTales } from "@/components/SourceFirstThreadTales";

export const metadata: Metadata = {
  title: "ThreadTales — your chats, turned into a story",
  description: "A private, local-first conversation recap built as a swipeable keepsake."
};

export default function ThreadTalesRebuildPage() {
  return <SourceFirstThreadTales/>;
}
