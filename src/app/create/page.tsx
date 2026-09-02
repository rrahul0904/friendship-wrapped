import { Suspense } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProductFlowStepper } from "@/components/MemoryCinemaLanding";
import { UploadAnalyzer } from "@/components/UploadAnalyzer";

export default function CreatePage() {
  return <><Header/><main className="create-wrap mc-create-page"><section className="shell create-head mc-create-head"><span className="mc-eyebrow"><i /> Private analysis · in your browser</span><h1>Open the <em>time capsule.</em></h1><p>Drop in a WhatsApp text export or a single-chat Telegram JSON export. ThreadTales reads it locally, finds the patterns, and reveals the story one layer at a time.</p><ProductFlowStepper compact/></section><div className="shell"><Suspense fallback={<div className="uploader mc-uploader">Preparing your private workspace…</div>}><UploadAnalyzer/></Suspense></div></main><Footer/></>;
}
