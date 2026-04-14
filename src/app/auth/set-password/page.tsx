"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Car, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Bumped whenever the privacy notice changes — stored on profiles_fleet so
// we can show a re-consent prompt to existing users on a major revision.
const POPI_CONSENT_VERSION = "2026-04-14";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [popiConsented, setPopiConsented] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const supabase = createClient();

    async function establishSession() {
      // Supabase's implicit-flow magic link arrives as
      //   /auth/set-password#access_token=...&refresh_token=...&type=invite
      // We MUST call setSession() with those tokens manually — relying on the
      // SSR client's auto-detection races against onAuthStateChange firing
      // INITIAL_SESSION with a null session, which used to bounce the user
      // straight to /login.
      const hash = window.location.hash;
      if (hash && hash.length > 1) {
        const params = new URLSearchParams(hash.slice(1));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        const error_description = params.get("error_description");

        if (error_description) {
          setError(decodeURIComponent(error_description));
          setCheckingSession(false);
          return;
        }

        if (access_token && refresh_token) {
          const { error: setErr } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (setErr) {
            console.error("[set-password] setSession error:", setErr);
            setError(setErr.message);
            setCheckingSession(false);
            return;
          }
          // Clean the hash off the URL so a refresh doesn't re-trigger the flow
          window.history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search
          );
          setCheckingSession(false);
          return;
        }
      }

      // No hash tokens — see if we already have a session (user came back later)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCheckingSession(false);
      } else {
        router.replace("/login");
      }
    }

    establishSession();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!popiConsented) {
      setError("Please confirm the POPI consent to continue.");
      return;
    }
    if (!ageConfirmed) {
      setError("You must confirm you are 18 or older.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      console.error(updateError);
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // Record data-subject-attested POPI consent against the user's profile row.
    // RLS allows a user to UPDATE their own profiles_fleet row (own_memberships_read
    // covers SELECT; the consolidated update policy lets the user update their
    // own row). Failing here is non-fatal — surface a warning but still continue
    // so the user isn't locked out at this final step.
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error: consentErr } = await supabase
        .from("profiles_fleet")
        .update({
          popi_consented_at: new Date().toISOString(),
          popi_consent_version: POPI_CONSENT_VERSION,
        })
        .eq("user_id", user.id);
      if (consentErr) {
        console.warn("[set-password] could not persist POPI consent:", consentErr);
      }
    }

    setSuccess(true);
    setTimeout(() => {
      router.replace("/dashboard");
      router.refresh();
    }, 1200);
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <Car className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Set Your Password</h1>
          <p className="text-sm text-muted-foreground">
            Choose a password to finish setting up your account.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  disabled={loading || success}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  disabled={loading || success}
                />
              </div>
            </div>
            {/* POPI Act consent — required by §11 (consent must be from the data subject) */}
            <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={popiConsented}
                onChange={(e) => setPopiConsented(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-primary"
                disabled={loading || success}
              />
              <span>
                I consent to Fleet Manager processing my personal information
                (name, contact details, license, vehicle, fuel and trip records)
                for the purpose of fleet management, in accordance with the{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#3B82F6] underline"
                >
                  Privacy Notice
                </Link>{" "}
                and{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#3B82F6] underline"
                >
                  Terms of Service
                </Link>
                , and the Protection of Personal Information Act (POPIA).
              </span>
            </label>

            {/* POPI §34 — processing of children's personal information is
                prohibited without parental consent. Confirming 18+ keeps us
                clear of the children's data regime entirely. */}
            <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-primary"
                disabled={loading || success}
              />
              <span>
                I confirm I am 18 years of age or older.
              </span>
            </label>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && (
              <p className="text-sm text-green-600">
                Password set — redirecting...
              </p>
            )}
            <Button
              type="submit"
              className="w-full bg-[#3B82F6] hover:bg-[#2563EB] cursor-pointer"
              disabled={loading || success || !popiConsented || !ageConfirmed}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Set Password & Continue"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
