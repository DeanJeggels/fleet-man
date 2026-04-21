import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Public paths that should pass through the middleware without redirecting
// to /login. Anything not matched here AND with no session is bounced.
const PUBLIC_PATHS = [
  "/login",
  "/auth/", // /auth/set-password and any future auth pages
  "/privacy", // POPI privacy notice — must be publicly readable
  "/terms", // Terms of Service — must be publicly readable
  "/robots.txt",
  "/sitemap.xml",
  "/.well-known/", // security.txt and any future well-known files
  "/api/csp-report", // browser posts CSP violations here without auth
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) =>
    p.endsWith("/") ? pathname.startsWith(p) : pathname === p || pathname.startsWith(p + "/")
  );
}

export async function updateSession(
  request: NextRequest,
  extraRequestHeaders?: Headers,
) {
  // Merge any caller-provided headers (e.g. x-nonce, CSP) onto a fresh clone
  // of the current request headers. Must be rebuilt after each cookie
  // mutation so Supabase's refreshed Cookie header propagates downstream.
  const buildHeaders = () => {
    const h = new Headers(request.headers);
    if (extraRequestHeaders) {
      for (const [k, v] of extraRequestHeaders.entries()) h.set(k, v);
    }
    return h;
  };

  let supabaseResponse = NextResponse.next({
    request: { headers: buildHeaders() },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request: { headers: buildHeaders() },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    // /api/* should respond with structured JSON 401, not an HTML redirect —
    // the client expects to parse the response body.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    // For everything else, redirect to /login WITHOUT preserving query
    // params from the original URL. This avoids reflecting attacker-controlled
    // values into the login page URL bar.
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
