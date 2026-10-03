import { Suspense } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { UploadAnalyzer } from "@/components/UploadAnalyzer";

export default function CreatePage() {
  return <><Header/><main className="create-wrap mc-create-page mc-create-story-first"><section className="shell create-head mc-create-head"><span className="mc-eyebrow"><i /> Private by default</span><h1>Drop a chat. <em>Open your story.</em></h1><p>Import a WhatsApp or Telegram chat, or try the demo. ThreadTales turns the local analysis straight into a chapter-by-chapter reveal.</p></section><div className="shell mc-create-stage"><Suspense fallback={<div className="uploader mc-uploader">Preparing your private story…</div>}><UploadAnalyzer/></Suspense></div></main><Footer/></>;
}
