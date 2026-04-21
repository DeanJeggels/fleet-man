import { redirect } from "next/navigation";
import Link from "next/link";
import { getSuperAdminContext } from "@/lib/auth/super-admin";
import { Toaster } from "@/components/ui/sonner";

// /admin must never be statically prerendered — it gates on auth + super-admin
// status, both of which are per-request.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isSuperAdmin } = await getSuperAdminContext();

  // Not signed in — bounce to /login (middleware also catches this, but the
  // middleware matcher does not run on every Netlify path in all conditions,
  // so double-gating here is belt + braces).
  if (!user) redirect("/login");

  // Signed in but not the super-admin — bounce to their normal dashboard.
  // Using /dashboard (not 404) so regular users who stumble on this URL get
  // landed somewhere useful.
  if (!isSuperAdmin) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white">
              FM
            </span>
            <span className="text-sm font-semibold">
              Fleet Manager · Super Admin
            </span>
          </Link>
          <span className="text-xs text-muted-foreground">{user.email}</span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      <Toaster />
    </div>
  );
}
