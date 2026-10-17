import { BaseModel } from "@/lib/db/baseModel";
import type { Row } from "@/lib/db/baseRepo";
import type { auditEvents } from "@/lib/db/schema";

export type AuditEventProps = Row<typeof auditEvents>;

export interface AuditEvent extends Readonly<AuditEventProps> {}
export class AuditEvent extends BaseModel<typeof auditEvents> {
  constructor(row: AuditEventProps) {
    super(row);
  }
}
