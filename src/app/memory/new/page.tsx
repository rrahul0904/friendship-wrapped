import { Suspense } from "react";
import { NewMemoryClient } from "@/components/NewMemoryClient";

export default function NewMemoryPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0f0f12", color: "#f7f3ee" }}>Opening your memory home…</main>}>
      <NewMemoryClient />
    </Suspense>
  );
}
