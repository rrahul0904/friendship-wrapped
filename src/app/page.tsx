import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { HowItFeelsSection, LandingHero, PrivacyPromiseStrip, StoryPreviewSection } from "@/components/MemoryCinemaLanding";

export default function Home() {
  return <>
    <Header />
    <main>
      <LandingHero />
      <PrivacyPromiseStrip />
      <StoryPreviewSection />
      <HowItFeelsSection />
      <section className="shell section mc-privacy-feature">
        <div className="mc-section-heading"><span className="mc-eyebrow dark"><i /> Privacy is part of the interface</span><h2>Your group chat is not our training data.</h2><p>ThreadTales analyzes raw exports locally by default. Public links contain derived story facts, and cloud/AI features are explicit rather than hidden.</p></div>
        <div className="mc-privacy-receipt"><div><span>raw_chat.txt</span><b>→</b><span>browser memory</span><b>→</b><span>derived story</span><b>→</b><span>you choose what leaves</span></div><dl><div><dt>Raw chat server upload</dt><dd>None by default</dd></div><div><dt>Account required</dt><dd>No</dd></div><div><dt>Public link payload</dt><dd>Derived facts only</dd></div><div><dt>AI</dt><dd>Optional / bounded</dd></div></dl></div>
      </section>
    </main>
    <Footer />
  </>;
}
