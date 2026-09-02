import Link from "next/link";

export function Footer() {
  return <footer className="mc-footer-shell"><div className="shell footer mc-footer"><div><Link className="brand" href="/"><span className="brand-mark">✦</span><span>ThreadTales</span></Link><p>Private personal data → emotional visual stories → user-controlled artifacts.</p></div><nav aria-label="Footer navigation"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/contact">Contact</Link><Link href="/products">Products</Link></nav><small>Built for memories, not surveillance.</small></div></footer>;
}
