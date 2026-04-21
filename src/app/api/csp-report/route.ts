import { NextResponse } from "next/server";

// Browsers POST a JSON body (application/csp-report or application/reports+json)
// describing violations. We log to stderr so Netlify surfaces it in function
// logs. Intentionally no DB write: this is an unauthenticated public endpoint
// and we don't want to give random visitors a write path into `audit_logs`.
// The route is listed in PUBLIC_PATHS so the auth gate in
// src/lib/supabase/middleware.ts lets it through.
export async function POST(request: Request) {
  try {
    const raw = await request.text();
    console.error("[csp-violation]", raw);
  } catch (err) {
    console.error("[csp-violation] failed to read report body", err);
  }
  return new NextResponse(null, { status: 204 });
}
