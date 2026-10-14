import { MemoryHomeClient } from "@/components/MemoryHomeClient";

export default async function MemoryHomePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="mc-product-page">
      <section className="shell hero mc-product-hero">
        <span className="mc-eyebrow dark"><i /> ThreadTales MemorySpace</span>
        <h1>Your memories, one living graph.</h1>
        <p>Add approved moments from conversations, media, and your own words, then compose them differently for anniversaries, Memory Lane, proud-of-you stories, gifts, and more.</p>
      </section>
      <section className="shell section" style={{ paddingTop: 20 }}>
        <MemoryHomeClient memorySpaceId={id} />
      </section>
    </main>
  );
}
