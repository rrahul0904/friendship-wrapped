import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SavedStoriesPanel } from "@/components/SavedStoriesPanel";

export const metadata = {
  title: "Saved Stories | ThreadTales",
  description: "Reopen or delete derived stories you explicitly chose to save.",
};

export default function AccountPage() {
  return <><Header/><main className="shell section account-page"><span className="kicker">Optional account</span><h1>Your saved stories.</h1><p className="section-copy">This area contains only stories you explicitly saved. ThreadTales does not silently upload or archive raw chat exports.</p><SavedStoriesPanel/></main><Footer/></>;
}
