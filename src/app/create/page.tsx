import type { Metadata } from "next";
import { SourceFirstThreadTales } from "@/components/SourceFirstThreadTales";

export const metadata: Metadata = {
  title: "ThreadTales — your chats, turned into a story",
  description: "Turn one private conversation into a local-first, swipeable keepsake story."
};

export default function CreatePage() {
  return <SourceFirstThreadTales/>;
}
