import { createClient } from "@/lib/supabase/server";

// Server-side super-admin check. Used by /admin page guards and by the
// post-login redirect path in middleware. Returns {user, isSuperAdmin};
// when user is null the second flag is always false.
export async function getSuperAdminContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, isSuperAdmin: false };

  const { data, error } = await supabase.rpc("is_super_admin", {
    p_user_id: user.id,
  });

  if (error) {
    console.error("[super-admin] is_super_admin rpc failed:", error);
    return { user, isSuperAdmin: false };
  }

  return { user, isSuperAdmin: data === true };
}
