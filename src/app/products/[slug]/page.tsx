import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MyYearCalendarImport } from "@/components/MyYearCalendarImport";
import { MyYearBuilder } from "@/components/MyYearBuilder";
import { PetLifeBuilder } from "@/components/PetLifeBuilder";
import { PetLifeSharedMemoryPanel } from "@/components/PetLifeSharedMemoryPanel";
import { WorldBuilder } from "@/components/WorldBuilder";
import { getProduct, products } from "@/lib/products";
import { isWorldSlug } from "@/products/worlds/config";

export function generateStaticParams() { return products.map((product) => ({ slug: product.slug })); }

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  return <><Header/><main className="mc-product-page"><section className="shell hero mc-product-hero"><span className="mc-eyebrow dark"><i /> Live product</span><div className="mc-product-emoji">{product.emoji}</div><h1>{product.name}</h1><p>{product.tagline}</p><div className="hero-actions">{product.slug === "friendship" ? <Link className="btn btn-primary" href="/create">Create one →</Link> : <a className="btn btn-primary" href={`#${product.slug}-builder`}>Open your world →</a>}</div></section>{product.slug === "myyear" ? <section id="myyear-builder" className="shell section" style={{paddingTop:20}}><MyYearBuilder/><MyYearCalendarImport/></section> : null}{product.slug === "petlife" ? <section id="petlife-builder" className="shell section" style={{paddingTop:20}}><PetLifeBuilder/><PetLifeSharedMemoryPanel/></section> : null}{isWorldSlug(product.slug) ? <section className="shell section" style={{paddingTop:20}}><WorldBuilder slug={product.slug}/></section> : null}<section className="shell section" style={{paddingTop:20}}><div className="mc-product-facts"><article><small>Who it is for</small><strong>{product.audience}</strong></article><article><small>Input</small><strong>{product.input}</strong></article><article><small>Output</small><strong>{product.output}</strong></article><article><small>Business model</small><strong>{product.businessModel}</strong></article><article><small>Persistence</small><strong>{product.needsPersistence ? "Optional account/cloud layer; local product works first" : "Local-first"}</strong></article><article><small>Privacy</small><strong>Private by default; sharing is selected and derived-only</strong></article></div></section></main><Footer/></>;
}
