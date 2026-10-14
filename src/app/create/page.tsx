import type { Metadata } from "next";
import { Suspense } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProductFlowStepper } from "@/components/MemoryCinemaLanding";
import { SourceFirstThreadTales } from "@/components/SourceFirstThreadTales";
import { UploadAnalyzer } from "@/components/UploadAnalyzer";

export const metadata: Metadata = {
  title: "ThreadTales — your chats, turned into a story",
  description: "Turn one private conversation into a local-first, swipeable keepsake story."
};

type CreatePageProps = {
  searchParams: Promise<{ memorySpaceId?: string | string[] }>;
};

function MemorySpaceConversationIntake() {
  return <>
    <Header />
    <main className="create-wrap mc-create-page">
      <section className="shell create-head mc-create-head">
        <span className="mc-eyebrow"><i /> Private analysis · in your browser</span>
        <h1>Add a conversation to your <em>memory home.</em></h1>
        <p>ThreadTales reads this export on your device and suggests moments to review. Nothing enters your MemorySpace until you choose Keep.</p>
        <ProductFlowStepper compact />
      </section>
      <div className="shell">
        <Suspense fallback={<div className="uploader mc-uploader">Preparing your private workspace…</div>}>
          <UploadAnalyzer />
        </Suspense>
      </div>
    </main>
    <Footer />
  </>;
}

export default async function CreatePage({ searchParams }: CreatePageProps) {
  const params = await searchParams;
  const memorySpaceId = Array.isArray(params.memorySpaceId) ? params.memorySpaceId[0] : params.memorySpaceId;

  if (memorySpaceId?.trim() && memorySpaceId.length <= 128) {
    return <MemorySpaceConversationIntake />;
  }

  return <SourceFirstThreadTales />;
}
