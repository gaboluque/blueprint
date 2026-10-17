import { execSync } from "node:child_process";

const name = process.argv[2];

if (!name) {
  console.error("Migration name is required.");
  console.error("");
  console.error("  make db-generate NAME=add_audit_events");
  console.error("  npm run db:generate -- add_audit_events");
  console.error("");
  console.error("Use snake_case that describes the schema change (verb + subject).");
  process.exit(1);
}

if (!/^[a-z][a-z0-9]*(_[a-z0-9]+)*$/.test(name)) {
  console.error(`Invalid migration name "${name}". Use snake_case (e.g. add_audit_events).`);
  process.exit(1);
}

execSync(`drizzle-kit generate --name ${name}`, { stdio: "inherit" });
