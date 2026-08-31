import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PremiumRecovery } from "@/components/PremiumRecovery";

export const metadata = {
  title: "ThreadTales Premium — Purchase verification",
  description: "Verify a ThreadTales Premium purchase and recover the signed export entitlement.",
};

export default async function PremiumSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams;
  return <><Header/><main className="shell hero">{sessionId ? <PremiumRecovery sessionId={sessionId}/> : <div className="premium-recovery"><span className="kicker">Purchase verification</span><h1>Missing Checkout Session.</h1><p>Return to ThreadTales and start checkout again. Premium is never unlocked from an unverified success flag.</p></div>}</main><Footer/></>;
}
