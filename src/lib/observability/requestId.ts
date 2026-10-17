const HEADER_NAME = "x-request-id";

/** Always mint server-side so the correlation key can't be forged or collided by a client. */
function mint(): string {
  return crypto.randomUUID();
}

export const RequestId = { mint, headerName: HEADER_NAME };
