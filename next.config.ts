import type { NextConfig } from "next";

// Derive the Supabase host from the public env var so the CSP always
// matches whichever project the app is wired to. Falls back to a safe
// empty allowlist if the var is missing at build time.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseHttpHost = supabaseUrl || "";
const supabaseWsHost = supabaseUrl ? supabaseUrl.replace(/^https:\/\//, "wss://") : "";

const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : "";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Strip the X-Powered-By header to remove the Next.js fingerprint
  poweredByHeader: false,
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/**",
          },
        ]
      : [],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            // unsafe-eval + wasm-unsafe-eval needed by @react-pdf/renderer; blob: for dynamic chunks
            "script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' 'unsafe-inline' blob:",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            `img-src 'self' data: blob: ${supabaseHttpHost}`.trim(),
            // data: + blob: needed for @react-pdf/renderer internal font/WASM fetch.
            // Google Maps is reached via the server-side /api/places/autocomplete proxy,
            // never directly from the browser, so it doesn't need a CSP allowance.
            `connect-src 'self' data: blob: ${supabaseHttpHost} ${supabaseWsHost}`.trim(),
            // data: needed for @react-pdf/renderer embedded Helvetica font
            "font-src 'self' data: https://fonts.gstatic.com",
            // @react-pdf/renderer spawns an internal worker from a blob URL on some paths
            "worker-src 'self' blob:",
            "frame-ancestors 'none'",
          ].join("; "),
        },
      ],
    },
  ],
};

export default nextConfig;
