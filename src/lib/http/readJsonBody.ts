import { InputParseError } from "@/lib/errors/domain.errors";
import { HttpError } from "@/lib/errors/http.errors";

const JSON_CONTENT_TYPE = "application/json";

/**
 * Requiring a JSON content type also blocks cross-site HTML form posts
 * (they can't send it without a CORS preflight), which matters with cookie auth.
 */
async function readJsonBody(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith(JSON_CONTENT_TYPE)) {
    throw new HttpError("The body must be JSON (Content-Type: application/json).", 415);
  }
  const text = await request.text();
  if (!text.trim()) throw new InputParseError("The request body is empty.");
  try {
    return JSON.parse(text);
  } catch {
    throw new InputParseError("The request body is not valid JSON.");
  }
}

export const RequestBody = { readJson: readJsonBody };
