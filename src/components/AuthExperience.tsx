"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type Mode = "register" | "login" | "forgot" | "reset";

export function AuthExperience({ mode }: { mode: Mode }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    if ((mode === "register" || mode === "reset") && password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const endpoint = mode === "register" ? "/api/auth/register" : mode === "login" ? "/api/auth/login" : mode === "forgot" ? "/api/auth/recover" : "/api/auth/update-password";
      const payload = mode === "register"
        ? { email: form.get("email"), password, displayName: form.get("displayName"), termsAccepted: form.get("termsAccepted") === "on", privacyAccepted: form.get("privacyAccepted") === "on" }
        : mode === "login"
          ? { email: form.get("email"), password }
          : mode === "forgot"
            ? { email: form.get("email") }
            : { password };
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json() as { error?: string; message?: string; verificationRequired?: boolean };
      if (!response.ok) throw new Error(data.error ?? "That request could not be completed.");
      if (mode === "register") {
        if (data.verificationRequired) setMessage("Account created. Check your email to verify it, then sign in.");
        else window.location.assign("/onboarding");
      } else if (mode === "login") window.location.assign("/app");
      else if (mode === "forgot") setMessage(data.message ?? "Check your email for a recovery link.");
      else {
        setMessage("Password updated. Redirecting to your account…");
        window.setTimeout(() => window.location.assign("/app"), 700);
      }
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "That request could not be completed.");
    } finally {
      setLoading(false);
    }
  }

  const title = mode === "register" ? "Create your memory vault" : mode === "login" ? "Welcome back" : mode === "forgot" ? "Recover your account" : "Choose a new password";
  const copy = mode === "register" ? "Save worlds, albums, photos and soundtracks across devices." : mode === "login" ? "Your private worlds are waiting." : mode === "forgot" ? "We’ll send a secure recovery link if the address is registered." : "Use a strong password you have not used elsewhere.";

  return <main className="saas-auth-page"><section className="saas-auth-card">
    <Link href="/" className="saas-auth-brand">✦ ThreadTales</Link>
    <span className="saas-kicker">PRIVATE STORY PLATFORM</span>
    <h1>{title}</h1><p>{copy}</p>
    <form onSubmit={submit} className="saas-form">
      {mode === "register" ? <label>Display name<input name="displayName" autoComplete="name" minLength={2} maxLength={80} required /></label> : null}
      {mode !== "reset" ? <label>Email<input name="email" type="email" autoComplete="email" required /></label> : null}
      {mode === "register" || mode === "login" || mode === "reset" ? <label>Password<div className="saas-password-row"><input name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={10} maxLength={128} required /><button type="button" className="btn btn-soft" onClick={() => setShowPassword((value) => !value)}>{showPassword ? "Hide" : "Show"}</button></div>{mode !== "login" ? <small>10+ characters with at least one letter and one number.</small> : null}</label> : null}
      {mode === "register" || mode === "reset" ? <label>Confirm password<input name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={10} maxLength={128} required /></label> : null}
      {mode === "register" ? <div className="saas-checks"><label><input name="termsAccepted" type="checkbox" required /> I agree to the <Link href="/terms">Terms</Link>.</label><label><input name="privacyAccepted" type="checkbox" required /> I agree to the <Link href="/privacy">Privacy Policy</Link>.</label></div> : null}
      <button className="btn btn-primary saas-submit" disabled={loading}>{loading ? "Working…" : mode === "register" ? "Create account" : mode === "login" ? "Sign in" : mode === "forgot" ? "Send recovery link" : "Update password"}</button>
    </form>
    {message ? <div className="notice" role="status">{message}</div> : null}
    {mode === "login" ? <><form onSubmit={async (event) => { event.preventDefault(); const email = new FormData(event.currentTarget).get("magicEmail"); setLoading(true); setMessage(""); try { const response = await fetch("/api/auth/magic-link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }); const data = await response.json() as { error?: string }; if (!response.ok) throw new Error(data.error ?? "Could not send sign-in link."); setMessage("Check your email for a secure sign-in link."); } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Could not send sign-in link."); } finally { setLoading(false); } }} className="saas-magic"><span>or</span><label>Email me a secure sign-in link<input name="magicEmail" type="email" required /></label><button className="btn btn-soft" disabled={loading}>Send magic link</button></form><div className="saas-auth-links"><Link href="/forgot-password">Forgot password?</Link><Link href="/register">Create account</Link></div></> : null}
    {mode === "register" ? <div className="saas-auth-links"><span>Already have an account?</span><Link href="/login">Sign in</Link></div> : null}
    {mode === "forgot" || mode === "reset" ? <div className="saas-auth-links"><Link href="/login">Back to sign in</Link></div> : null}
  </section><aside className="saas-auth-visual"><div className="saas-memory-orbit"><div>PHOTO ALBUMS</div><div>YOUR WORLDS</div><div>SOUNDTRACKS</div><div>PRIVATE BY DEFAULT</div></div><h2>A home for the stories you actually want to keep.</h2><p>ThreadTales stays accountless for free local chat analysis. Registration unlocks persistent worlds, private media, albums, collaboration and subscriptions.</p></aside></main>;
}
