import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { products } from "@/lib/products";

function stageLabel(stage: "live" | "mvp" | "planned") { return stage === "live" ? "Live" : stage === "mvp" ? "MVP" : "Future"; }

export default function ProductsPage() {
  return <><Header/><main className="mc-product-page"><section className="shell mc-products-hero"><span className="mc-eyebrow dark"><i /> Personal Story Platform</span><h1>Your memories have more than one shape.</h1><p className="section-copy">ThreadTales is the live flagship. MyYear and PetLife are working MVPs. Future products stay clearly labeled until their experiences are actually built.</p></section><section className="shell section" style={{paddingTop:30}}><div className="mc-products-grid">{products.map((product) => <Link className="mc-product-card" href={`/products/${product.slug}`} key={product.slug}><span className={`mc-product-stage ${product.stage === "planned" ? "future" : product.stage}`}>{stageLabel(product.stage)}</span><div className="feature-icon">{product.emoji}</div><h3>{product.name}</h3><p>{product.tagline}</p><div className="mc-product-meta"><strong>For:</strong> {product.audience}<br/><strong>Input:</strong> {product.input}<br/><strong>Output:</strong> {product.output}<br/><strong>Model:</strong> {product.businessModel}<br/><strong>Persistence:</strong> {product.needsPersistence ? "Optional account/cloud layer" : "Local-first"}<br/><strong>Foundation:</strong> shared story, privacy, export and entitlement primitives</div></Link>)}</div></section></main><Footer/></>;
}
