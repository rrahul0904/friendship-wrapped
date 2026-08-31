import Link from "next/link";
import { notFound } from "next/navigation";
import { MyYearBuilder } from "@/components/MyYearBuilder";
import { getProduct, products } from "@/lib/products";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  return (
    <main>
      <section className="shell hero" style={{ paddingBottom: 30 }}>
        <span className="kicker">{product.stage === "live" ? "Live product" : product.stage === "next" ? "MVP available" : "Planned product"}</span>
        <div style={{ fontSize: 56, marginTop: 24 }}>{product.emoji}</div>
        <h1 style={{ maxWidth: 1000 }}>{product.name}</h1>
        <p>{product.tagline}</p>
        <div className="hero-actions">
          {product.slug === "friendship" ? <Link className="btn btn-primary" href="/create">Create one →</Link> : product.slug === "myyear" ? <a className="btn btn-primary" href="#myyear-builder">Build my year →</a> : <Link className="btn btn-soft" href="/products">Back to products</Link>}
        </div>
      </section>

      {product.slug === "myyear" ? <section id="myyear-builder" className="shell section" style={{ paddingTop: 20 }}><MyYearBuilder /></section> : null}

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
