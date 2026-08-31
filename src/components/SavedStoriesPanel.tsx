"use client";

import { useEffect, useState } from "react";

interface SavedStory {
  id: string;
  product: string;
  mode?: string;
  title: string;
  created_at: string;
}

export function SavedStoriesPanel() {
  const [stories, setStories] = useState<SavedStory[]>([]);
  const [state, setState] = useState<"loading" | "signed-out" | "disabled" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/stories", { cache: "no-store" })
      .then(async (response) => ({ response, data: await response.json() as { stories?: SavedStory[]; error?: string } }))
      .then(({ response, data }) => {
        if (cancelled) return;
        if (response.status === 503) { setState("disabled"); return; }
        if (response.status === 401) { setState("signed-out"); return; }
        if (!response.ok) throw new Error(data.error ?? "Could not load saved stories.");
        setStories(data.stories ?? []);
        setState("ready");
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setMessage(cause instanceof Error ? cause.message : "Could not load saved stories.");
        setState("error");
      });
    return () => { cancelled = true; };
  }, []);

  async function remove(id: string) {
    const response = await fetch(`/api/stories?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (response.ok) setStories((current) => current.filter((story) => story.id !== id));
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setStories([]);
    setState("signed-out");
  }

  if (state === "loading") return <p>Loading saved stories…</p>;
  if (state === "disabled") return <div className="notice">Cloud persistence is not configured. ThreadTales still works anonymously.</div>;
  if (state === "signed-out") return <div className="notice">You are not signed in. Open a ThreadTale and choose “Save it for later” to request a magic link.</div>;
  if (state === "error") return <div className="error" role="alert">{message}</div>;

  return <div className="saved-stories"><div className="account-actions"><span>{stories.length} saved {stories.length === 1 ? "story" : "stories"}</span><button className="btn btn-soft" onClick={() => void signOut()}>Sign out</button></div>{stories.length ? stories.map((story) => <article className="saved-story" key={story.id}><div><small>{story.product}{story.mode ? ` · ${story.mode}` : ""}</small><h3>{story.title}</h3><p>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(story.created_at))}</p></div><button className="btn btn-soft" onClick={() => void remove(story.id)}>Delete</button></article>) : <div className="notice">No saved stories yet. Your anonymous analyses remain local until you explicitly save one.</div>}</div>;
}
