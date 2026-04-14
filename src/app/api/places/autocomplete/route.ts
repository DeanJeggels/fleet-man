import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const input = searchParams.get("input");
    const types = searchParams.get("types");
    const components = searchParams.get("components");

    if (!input) {
      return NextResponse.json({ error: "Missing input parameter" }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Maps API key not configured" },
        { status: 500 }
      );
    }

    // Build the URL for Google Places API
    const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
    url.searchParams.set("input", input);
    if (types) url.searchParams.set("types", types);
    if (components) url.searchParams.set("components", components);
    url.searchParams.set("key", apiKey);

    // Call Google Places API from the server (no CORS issues)
    const response = await fetch(url.toString());
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("[places/autocomplete] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}
