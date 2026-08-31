import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getStoryModeConfig, isStoryMode, OCCASION_MODES } from "@/platform/story/modes";

export function generateStaticParams() {
  return OCCASION_MODES.map((mode) => ({ mode }));
}

export async function generateMetadata({ params }: { params: Promise<{ mode: string }> }): Promise<Metadata> {
  const { mode } = await params;
  if (!isStoryMode(mode) || !OCCASION_MODES.includes(mode)) return {};
  const config = getStoryModeConfig(mode);
  return { title: config.seoTitle, description: config.seoDescription };
}

export default async function OccasionPage({ params }: { params: Promise<{ mode: string }> }) {
  const { mode } = await params;
  if (!isStoryMode(mode) || !OCCASION_MODES.includes(mode)) notFound();
  const config = getStoryModeConfig(mode);

  return <><Header/><main><section className={`shell hero occasion-hero theme-${config.theme}`}><span className="kicker">{config.label} ThreadTale</span><h1>{config.eyebrow}</h1><p>{config.seoDescription} Raw messages stay on your device in the free flow.</p><div className="hero-actions"><Link className="btn btn-primary" href={`/create?mode=${mode}`}>Create this story →</Link><Link className="btn btn-soft" href={`/create?mode=${mode}&demo=1`}>Try with demo data</Link></div></section><section className="shell section"><div className="grid3"><article className="feature"><div className="feature-icon">1</div><h3>Import privately</h3><p>Use a WhatsApp text export. The browser analyzes it locally, with a Web Worker when supported.</p></article><article className="feature"><div className="feature-icon">2</div><h3>Compose for the moment</h3><p>The same facts become a {config.label.toLowerCase()} chapter sequence instead of a generic statistics page.</p></article><article className="feature"><div className="feature-icon">3</div><h3>Export and share</h3><p>Download vertical or square story cards and decide exactly what derived information appears publicly.</p></article></div></section></main><Footer/></>;
}
