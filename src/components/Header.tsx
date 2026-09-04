"use client";

import Link from "next/link";
import { useState } from "react";

export function Header() {
  const [open, setOpen] = useState(false);
  return <header className="mc-nav-shell"><div className="shell nav mc-nav">
    <Link className="brand" href="/" onClick={() => setOpen(false)}><span className="brand-mark">✦</span><span>ThreadTales</span></Link>
    <button className="mc-menu-button" type="button" aria-expanded={open} aria-controls="primary-navigation" aria-label={open ? "Close navigation" : "Open navigation"} onClick={() => setOpen((value) => !value)}><span/><span/></button>
    <nav id="primary-navigation" className={"navlinks mc-navlinks " + (open ? "open" : "")} aria-label="Primary navigation">
      <Link href="/products" onClick={() => setOpen(false)}>Products</Link>
      <Link href="/#how" onClick={() => setOpen(false)}>How it works</Link>
      <Link href="/privacy" onClick={() => setOpen(false)}>Privacy</Link>
      <Link href="/login" onClick={() => setOpen(false)}>Sign in</Link>
      <Link className="btn btn-primary" href="/create" onClick={() => setOpen(false)}>Make yours <span>→</span></Link>
    </nav>
  </div></header>;
}
