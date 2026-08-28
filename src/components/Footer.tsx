import Link from "next/link";
export function Footer(){return <footer className="shell footer"><span>© {new Date().getFullYear()} ThreadTales</span><span><Link href="/privacy">Privacy by design</Link> · Raw chats stay on your device</span></footer>}
