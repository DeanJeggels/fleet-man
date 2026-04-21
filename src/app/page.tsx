import { redirect } from "next/navigation";
import { getSuperAdminContext } from "@/lib/auth/super-admin";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { user, isSuperAdmin } = await getSuperAdminContext();
  if (!user) redirect("/login");
  if (isSuperAdmin) redirect("/admin");
  redirect("/dashboard");
}
