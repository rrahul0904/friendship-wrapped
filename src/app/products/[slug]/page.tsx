import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MemoryLensPanel } from "@/components/MemoryLensPanel";
import { MyYearCalendarImport } from "@/components/MyYearCalendarImport";
import { MyYearBuilder } from "@/components/MyYearBuilder";
import { PetLifeBuilder } from "@/components/PetLifeBuilder";
import { PetLifeMemoryGraphBridge } from "@/components/PetLifeMemoryGraphBridge";
import { PetLifeSharedMemoryPanel } from "@/components/PetLifeSharedMemoryPanel";
import { WorldBuilder } from "@/components/WorldBuilder";
import { memoryProfileForSlug, newMemoryHrefForProduct } from "@/lib/memory-platform";
import { getProduct, products } from "@/lib/products";
import { isWorldSlug } from "@/products/worlds/config";

export function generateStaticParams() { return products.map((product) => ({ slug: product.slug })); }

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const profile = memoryProfileForSlug(product.slug);
  const memoryHref = newMemoryHrefForProduct(product.slug);
  const builderHref = product.slug === "friendship" ? "/create" : `#${product.slug}-builder`;
  const builderLabel = product.slug === "friendship" ? "Use chat-only reveal" : "Open current builder";

  return <>
    <Header/>
    <main className="mc-product-page">
      <section className="shell hero mc-product-hero">
        <span className="mc-eyebrow dark"><i /> Live product · {profile?.family === "MEMORY" ? "Memory Graph enabled" : profile?.family === "LENS" ? "Memory lens" : "Progress world"}</span>
        <div className="mc-product-emoji">{product.emoji}</div>
        <h1>{product.name}</h1>
        <p>{product.tagline}</p>
        <div className="hero-actions">
          {memoryHref ? <Link className="btn btn-primary" href={memoryHref}>Create a MemorySpace →</Link> : <a className="btn btn-primary" href={builderHref}>Open product →</a>}
          {memoryHref ? (builderHref.startsWith("/") ? <Link className="btn btn-soft" href={builderHref}>{builderLabel}</Link> : <a className="btn btn-soft" href={builderHref}>{builderLabel}</a>) : null}
        </div>
        {profile?.family === "MEMORY" ? <p className="notice">This product now has a shared MemorySpace path. Existing local builders remain available during migration; approved memories can move onto the reusable Memory Graph without deleting the current product experience.</p> : null}
        {profile?.family === "LENS" ? <p className="notice">This product is retained as a lens/composer over approved memories rather than creating another isolated copy of them.</p> : null}
      </section>

      {profile?.family === "LENS" && profile.lens ? <section className="shell section" style={{paddingTop:20}}><MemoryLensPanel lens={profile.lens}/></section> : null}
      {product.slug === "myyear" ? <section id="myyear-builder" className="shell section" style={{paddingTop:20}}><MyYearBuilder/><MyYearCalendarImport/></section> : null}
      {product.slug === "petlife" ? <section id="petlife-builder" className="shell section" style={{paddingTop:20}}><PetLifeMemoryGraphBridge/><PetLifeBuilder/><PetLifeSharedMemoryPanel/></section> : null}
      {isWorldSlug(product.slug) ? <section className="shell section" style={{paddingTop:20}}><WorldBuilder slug={product.slug}/></section> : null}

      <section className="shell section" style={{paddingTop:20}}>
        <div className="mc-product-facts">
          <article><small>Who it is for</small><strong>{product.audience}</strong></article>
          <article><small>Input</small><strong>{product.input}</strong></article>
          <article><small>Output</small><strong>{product.output}</strong></article>
          <article><small>Business model</small><strong>{product.businessModel}</strong></article>
          <article><small>Persistence</small><strong>{product.needsPersistence ? "Local first; reusable Memory Graph path available" : "Local-first"}</strong></article>
          <article><small>Privacy</small><strong>Private by default; sharing is selected and derived-only</strong></article>
        </div>
      </section>
    </main>
    <Footer/>
  </>;
}
