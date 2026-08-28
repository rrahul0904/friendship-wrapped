import Link from "next/link";

export function Header() {
  return (
    <header className="shell nav">
      <Link className="brand" href="/">
        <span className="brand-mark">✦</span>
        <span>ThreadTales</span>
      </Link>
      <nav className="navlinks">
        <Link href="/#how">How it works</Link>
        <Link href="/privacy">Privacy</Link>
        <Link className="btn btn-primary" href="/create">Make yours →</Link>
      </nav>
    </header>
  );
}
