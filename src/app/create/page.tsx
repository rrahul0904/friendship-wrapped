import { Suspense } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { UploadAnalyzer } from "@/components/UploadAnalyzer";

export default function CreatePage(){return <><Header/><main className="shell create-wrap"><div className="create-head"><span className="kicker">Private analysis · in your browser</span><h1>Open the time capsule.</h1><p>Export a WhatsApp chat as text, drop it here, and we’ll turn the metadata and patterns into a visual story. Nothing leaves your device unless you choose to create a derived-stat share link.</p></div><Suspense fallback={<div className="uploader">Loading…</div>}><UploadAnalyzer/></Suspense></main><Footer/></>}
