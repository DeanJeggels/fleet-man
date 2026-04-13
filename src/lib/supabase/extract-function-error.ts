import type { FunctionsError } from "@supabase/supabase-js";

/**
 * Turns a Supabase edge-function error into a human-readable message.
 *
 * `supabase.functions.invoke()` returns errors like
 * `FunctionsHttpError: Edge Function returned a non-2xx status code`
 * regardless of what the function actually said in its body. The real
 * message lives in `error.context` as a Response object. This helper
 * pulls the JSON body out, grabs the `error` field our functions emit,
 * and falls back to the generic message if anything goes wrong.
 *
 * Also handles the case where the function returns 200 with
 * `{ data: { error: "…" } }` (soft error from the function body).
 */
export async function extractFunctionError(
  err: unknown,
  data?: unknown
): Promise<string> {
  // 1. Soft error: function returned 200 but with an `error` field in the body
  if (data && typeof data === "object" && data !== null && "error" in data) {
    const softError = (data as { error?: unknown }).error;
    if (typeof softError === "string" && softError.length > 0) return softError;
  }

  if (!err) return "Unknown error";

  // 2. Hard error: Supabase SDK wraps the response in `error.context`
  const fnErr = err as FunctionsError & { context?: Response };
  if (fnErr.context && typeof fnErr.context.json === "function") {
    try {
      const body = await fnErr.context.json();
      if (body && typeof body === "object" && "error" in body) {
        const bodyError = (body as { error?: unknown }).error;
        if (typeof bodyError === "string" && bodyError.length > 0) return bodyError;
      }
    } catch {
      // Body wasn't JSON — fall through to the generic message
    }
  }

  // 3. Plain Error instance
  if (err instanceof Error && err.message) return err.message;

  // 4. Last resort
  return "Something went wrong. Please try again.";
}
