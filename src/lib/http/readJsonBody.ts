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
    throw new HttpError("El cuerpo debe enviarse como JSON (Content-Type: application/json).", 415);
  }
  const text = await request.text();
  if (!text.trim()) throw new InputParseError("El cuerpo de la solicitud está vacío.");
  try {
    return JSON.parse(text);
  } catch {
    throw new InputParseError("El cuerpo de la solicitud no es JSON válido.");
  }
}

export const RequestBody = { readJson: readJsonBody };
