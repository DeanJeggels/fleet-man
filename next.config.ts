import type { NextConfig } from "next";

// Derive the Supabase host from the public env var so the CSP always
// matches whichever project the app is wired to. Falls back to a safe
// empty allowlist if the var is missing at build time.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseHttpHost = supabaseUrl || "";
const supabaseWsHost = supabaseUrl ? supabaseUrl.replace(/^https:\/\//, "wss://") : "";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    unoptimized: true,
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
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            `img-src 'self' data: blob: ${supabaseHttpHost}`.trim(),
            `connect-src 'self' ${supabaseHttpHost} ${supabaseWsHost}`.trim(),
            "font-src 'self'",
            "frame-ancestors 'none'",
          ].join("; "),
        },
      ],
    },
  ],
};

export default nextConfig;
