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
            "script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' 'unsafe-inline' blob: https://maps.googleapis.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            `img-src 'self' data: blob: ${supabaseHttpHost} https://maps.googleapis.com https://maps.gstatic.com`.trim(),
            // data: + blob: needed for @react-pdf/renderer internal font/WASM fetch
            `connect-src 'self' data: blob: ${supabaseHttpHost} ${supabaseWsHost} https://maps.googleapis.com`.trim(),
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
