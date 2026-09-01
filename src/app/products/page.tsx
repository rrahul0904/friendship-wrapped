import Link from "next/link";
import { products } from "@/lib/products";

function stageLabel(stage: "live" | "mvp" | "planned") {
  if (stage === "live") return "Live";
  if (stage === "mvp") return "MVP";
  return "Planned";
}

export default function ProductsPage() {
  return (
    <main>
      <section className="shell section">
        <span className="kicker">One platform · many emotional products</span>
        <h2>Different products. Shared story engine.</h2>
        <p className="section-copy">Each product has its own experience and business model, while reusing the same privacy, timeline, media, sharing, billing and world-building foundations.</p>
        <div className="grid3">
          {products.map((product) => (
            <Link className="feature" href={`/products/${product.slug}`} key={product.slug}>
              <div className="feature-icon">{product.emoji}</div><h3>{product.name}</h3><p>{product.tagline}</p><p style={{ marginTop: 14 }}><strong>{stageLabel(product.stage)}</strong> · {product.businessModel}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
