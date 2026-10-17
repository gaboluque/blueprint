const DATE_FORMAT = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeZone: "America/Bogota" });

export function formatDate(iso: string): string {
  return DATE_FORMAT.format(new Date(iso));
}
