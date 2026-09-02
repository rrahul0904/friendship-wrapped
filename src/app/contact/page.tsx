import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export const metadata = { title: "Contact | ThreadTales" };
export default function ContactPage(){return <><Header/><main className="shell section mc-legal-page"><span className="mc-eyebrow dark"><i/> Contact</span><h1>Questions, feedback, or something that felt off?</h1><p>ThreadTales is still being actively refined. For product feedback or repository issues, use the project’s GitHub issue tracker so reports are visible and actionable.</p><div className="hero-actions" style={{justifyContent:"flex-start"}}><a className="btn btn-primary" href="https://github.com/rrahul0904/friendship-wrapped/issues">Open GitHub issues</a><Link className="btn btn-soft" href="/privacy">Read the privacy model</Link></div></main><Footer/></>}
