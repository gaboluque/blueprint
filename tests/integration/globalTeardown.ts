import { Database } from "@/lib/db/client";

export default async function globalTeardown(): Promise<void> {
  await Database.close();
}
