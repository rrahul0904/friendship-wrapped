import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MyYearBuilder } from "@/components/MyYearBuilder";
import { PetLifeBuilder } from "@/components/PetLifeBuilder";
import { PetLifeSharedMemoryPanel } from "@/components/PetLifeSharedMemoryPanel";
import { getProduct, products } from "@/lib/products";

export function generateStaticParams() { return products.map((product) => ({ slug: product.slug })); }

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  const hasMvp = product.slug === "myyear" || product.slug === "petlife";
  const stageLabel = product.stage === "live" ? "Live product" : product.stage === "mvp" ? "MVP available" : "Future product";
  return <><Header/><main className="mc-product-page"><section className="shell hero mc-product-hero"><span className="mc-eyebrow dark"><i /> {stageLabel}</span><div className="mc-product-emoji">{product.emoji}</div><h1>{product.name}</h1><p>{product.tagline}</p><div className="hero-actions">{product.slug === "friendship" ? <Link className="btn btn-primary" href="/create">Create one →</Link> : hasMvp ? <a className="btn btn-primary" href={`#${product.slug}-builder`}>Open the {product.stage.toUpperCase()} →</a> : <Link className="btn btn-soft" href="/products">Explore the platform</Link>}</div>{product.stage === "planned" ? <div className="mc-future-note">Future concept · shown for platform direction only. No unfinished workflow is presented as live.</div> : null}</section>{product.slug === "myyear" ? <section id="myyear-builder" className="shell section" style={{paddingTop:20}}><MyYearBuilder/></section> : null}{product.slug === "petlife" ? <section id="petlife-builder" className="shell section" style={{paddingTop:20}}><PetLifeBuilder/><PetLifeSharedMemoryPanel/></section> : null}<section className="shell section" style={{paddingTop:20}}><div className="mc-product-facts"><article><small>Who it is for</small><strong>{product.audience}</strong></article><article><small>Input</small><strong>{product.input}</strong></article><article><small>Output</small><strong>{product.output}</strong></article><article><small>Business model</small><strong>{product.businessModel}</strong></article><article><small>Persistence</small><strong>{product.needsPersistence ? "Optional persistent account/cloud layer" : "Local-first; persistence only when useful"}</strong></article><article><small>Shared foundation</small><strong>Story composition, privacy controls, exports, identity and entitlements</strong></article></div></section></main><Footer/></>;
}
