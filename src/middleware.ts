import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Per-request CSP directive. `strict-dynamic` means browsers ignore the
// `'self'` / `'unsafe-inline'` fallbacks in script-src, so legacy inline
// scripts stop executing — only scripts with the matching nonce (and any
// scripts those load via `src=`) can run. `wasm-unsafe-eval` is retained
// for @react-pdf/renderer's WASM path. In dev, React needs `unsafe-eval`
// for its eval-based debug overlay.
function buildCsp(nonce: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseHttpHost = supabaseUrl;
  const supabaseWsHost = supabaseUrl
    ? supabaseUrl.replace(/^https:\/\//, "wss://")
    : "";
  const isDev = process.env.NODE_ENV === "development";

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval' blob:${
      isDev ? " 'unsafe-eval'" : ""
    }`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    `img-src 'self' data: blob: ${supabaseHttpHost}`.trim(),
    `connect-src 'self' data: blob: ${supabaseHttpHost} ${supabaseWsHost}`.trim(),
    "font-src 'self' data: https://fonts.gstatic.com",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "report-uri /api/csp-report",
  ].join("; ");
}

export async function middleware(request: NextRequest) {
  // Fresh nonce every request. base64 of a UUID is ~22 chars of entropy,
  // plenty for nonce purposes.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  // Forward x-nonce + CSP on the *request* headers so Next.js's RSC
  // renderer can extract the nonce pattern and auto-apply it to its own
  // streaming inline scripts (docs: 01-app/02-guides/content-security-policy).
  const extraRequestHeaders = new Headers();
  extraRequestHeaders.set("x-nonce", nonce);
  extraRequestHeaders.set("Content-Security-Policy", csp);

  const response = await updateSession(request, extraRequestHeaders);

  // Report-Only during rollout. The existing enforcing CSP from
  // next.config.ts stays in place until we've confirmed zero violations,
  // at which point we flip this header name to `Content-Security-Policy`
  // and drop the next.config.ts one.
  response.headers.set("Content-Security-Policy-Report-Only", csp);
  response.headers.set("x-nonce", nonce);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
