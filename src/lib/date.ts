const DATE_FORMAT = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

export function formatDate(iso: string): string {
  return DATE_FORMAT.format(new Date(iso));
}
