"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Car, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      console.error(updateError);
      setError(updateError.message);
      setLoading(false);
      return;
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
            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && (
              <p className="text-sm text-green-600">
                Password set — redirecting...
              </p>
            )}
            <Button
              type="submit"
              className="w-full bg-[#3B82F6] hover:bg-[#2563EB] cursor-pointer"
              disabled={loading || success}
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
