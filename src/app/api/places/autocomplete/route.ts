import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side proxy for Google Places Autocomplete.
 *
 * Why a proxy:
 * - Keeps the API key on the server (env var GOOGLE_MAPS_API_KEY, NOT NEXT_PUBLIC_*),
 *   so it never ships in the client bundle.
 * - Avoids the CSP issue of calling maps.googleapis.com from the browser.
 * - Requires an authenticated session before spending Places quota, so
 *   anonymous traffic can't burn the key.
 */
const RATE_LIMIT_PER_MIN = 60;

export async function GET(request: NextRequest) {
  // Auth gate — only logged-in users hit Google
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { status: "UNAUTHORIZED", predictions: [] },
      { status: 401 }
    );
  }

  // Rate limit — 60 autocomplete lookups per minute per user. Protects the
  // Google Maps key quota from a runaway client (e.g. stuck keydown handler).
  // Reuses the shared `check_rate_limit` RPC so all rate state is in Postgres.
  const windowStart = new Date(
    Math.floor(Date.now() / 60000) * 60000
  ).toISOString();
  const { data: allowed, error: rlError } = await supabase.rpc(
    "check_rate_limit",
    {
      p_user_id: user.id,
      p_bucket: "places_autocomplete",
      p_window: windowStart,
      p_max: RATE_LIMIT_PER_MIN,
    }
  );
  if (rlError) {
    console.error("[places/autocomplete] rate_limit rpc error:", rlError);
    // Fail open so a DB blip doesn't break address search.
  } else if (allowed === false) {
    return NextResponse.json(
      { status: "RATE_LIMITED", predictions: [] },
      { status: 429 }
    );
  }

  // Server-only env var (note: no NEXT_PUBLIC_ prefix). Falls back to the
  // legacy NEXT_PUBLIC_ name for one release so deploys don't break.
  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { status: "DISABLED", predictions: [] },
      { status: 200 }
    );
  }

  const { searchParams } = request.nextUrl;
  const input = searchParams.get("input")?.trim();
  if (!input) {
    return NextResponse.json(
      { status: "INVALID_REQUEST", predictions: [] },
      { status: 400 }
    );
  }
  if (input.length > 200) {
    return NextResponse.json(
      { status: "INVALID_REQUEST", predictions: [] },
      { status: 400 }
    );
  }

  // Whitelist the parameters we forward
  const types = searchParams.get("types") ?? "geocode";
  const components = searchParams.get("components") ?? "country:za";
  const allowedTypes = new Set([
    "geocode",
    "address",
    "establishment",
    "(cities)",
    "(regions)",
  ]);
  if (!allowedTypes.has(types)) {
    return NextResponse.json(
      { status: "INVALID_REQUEST", predictions: [] },
      { status: 400 }
    );
  }
  // Components must look like "country:xx" — reject anything else
  if (!/^country:[a-z]{2}$/i.test(components)) {
    return NextResponse.json(
      { status: "INVALID_REQUEST", predictions: [] },
      { status: 400 }
    );
  }

  const upstream = new URL(
    "https://maps.googleapis.com/maps/api/place/autocomplete/json"
  );
  upstream.searchParams.set("input", input);
  upstream.searchParams.set("types", types);
  upstream.searchParams.set("components", components);
  upstream.searchParams.set("key", apiKey);

  try {
    const res = await fetch(upstream.toString(), { cache: "no-store" });
    if (!res.ok) {
      console.error(`[places/autocomplete] upstream ${res.status}`);
      return NextResponse.json(
        { status: "ERROR", predictions: [] },
        { status: 502 }
      );
    }
    const body = await res.json();
    // Sanitize what we forward back — strip upstream error fields and trim shape
    const predictions = Array.isArray(body.predictions)
      ? body.predictions
          .slice(0, 6)
          .map((p: { place_id?: string; description?: string }) => ({
            place_id: String(p.place_id ?? ""),
            description: String(p.description ?? ""),
          }))
      : [];
    return NextResponse.json(
      { status: body.status ?? "OK", predictions },
      {
        status: 200,
        headers: { "Cache-Control": "private, max-age=60" },
      }
    );
  } catch (err) {
    console.error("[places/autocomplete] fetch error:", err);
    return NextResponse.json(
      { status: "ERROR", predictions: [] },
      { status: 502 }
    );
  }
}
