import Link from "next/link";
import { notFound } from "next/navigation";
import { MyYearBuilder } from "@/components/MyYearBuilder";
import { PetLifeBuilder } from "@/components/PetLifeBuilder";
import { PetLifeSharedMemoryPanel } from "@/components/PetLifeSharedMemoryPanel";
import { getProduct, products } from "@/lib/products";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  const hasMvp = product.slug === "myyear" || product.slug === "petlife";

  return (
    <main>
      <section className="shell hero" style={{ paddingBottom: 30 }}>
        <span className="kicker">{product.stage === "live" ? "Live product" : hasMvp ? "MVP available" : product.stage === "next" ? "Next product" : "Planned product"}</span>
        <div style={{ fontSize: 56, marginTop: 24 }}>{product.emoji}</div>
        <h1 style={{ maxWidth: 1000 }}>{product.name}</h1>
        <p>{product.tagline}</p>
        <div className="hero-actions">
          {product.slug === "friendship" ? <Link className="btn btn-primary" href="/create">Create one →</Link> : hasMvp ? <a className="btn btn-primary" href={`#${product.slug}-builder`}>Open MVP →</a> : <Link className="btn btn-soft" href="/products">Back to products</Link>}
        </div>
      </section>

      {product.slug === "myyear" ? <section id="myyear-builder" className="shell section" style={{ paddingTop: 20 }}><MyYearBuilder /></section> : null}
      {product.slug === "petlife" ? <section id="petlife-builder" className="shell section" style={{ paddingTop: 20 }}><PetLifeBuilder /><PetLifeSharedMemoryPanel /></section> : null}

      <section className="shell section" style={{ paddingTop: 20 }}>
        <div className="grid3">
          <article className="feature"><div className="feature-icon">👥</div><h3>For</h3><p>{product.audience}</p></article>
          <article className="feature"><div className="feature-icon">📥</div><h3>Input</h3><p>{product.input}</p></article>
          <article className="feature"><div className="feature-icon">🌍</div><h3>Output</h3><p>{product.output}</p></article>
          <article className="feature"><div className="feature-icon">💳</div><h3>Business model</h3><p>{product.businessModel}</p></article>
          <article className="feature"><div className="feature-icon">🗄️</div><h3>Persistence</h3><p>{product.needsPersistence ? "Persistent accounts, database and media storage are optional capabilities for this product." : "Can work locally first, with persistence added only for premium features."}</p></article>
          <article className="feature"><div className="feature-icon">🧩</div><h3>Shared foundation</h3><p>Timeline events, story composition, privacy-safe sharing, exports and optional identity/billing are shared platform services.</p></article>
        </div>
      </section>
    </main>
  );
}
