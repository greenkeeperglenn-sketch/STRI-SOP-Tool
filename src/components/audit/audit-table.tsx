"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import type { AuditLogWithUser } from "@/lib/types";

interface AuditTableProps {
  logs: AuditLogWithUser[];
}

function ActionBadge({ action }: { action: string }) {
  if (action.startsWith("user.")) {
    return <Badge variant="info">{action}</Badge>;
  }
  if (action.startsWith("document.")) {
    return <Badge variant="secondary">{action}</Badge>;
  }
  if (action.startsWith("training.")) {
    return <Badge variant="success">{action}</Badge>;
  }
  return <Badge variant="outline">{action}</Badge>;
}

function formatMetadata(metadata: unknown): string {
  if (!metadata) return "—";
  if (typeof metadata === "string") return metadata;
  try {
    const obj = metadata as Record<string, unknown>;
    const entries = Object.entries(obj)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([k, v]) => `${k}: ${v}`)
      .slice(0, 3);
    return entries.join(", ");
  } catch {
    return "—";
  }
}

export function AuditTable({ logs }: AuditTableProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No audit logs found</p>
        <p className="text-sm mt-1">Audit events will appear here as users interact with the system.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Timestamp</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Entity</TableHead>
          <TableHead>Details</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell className="text-sm text-slate-600 whitespace-nowrap">
              {formatDateTime(log.timestamp)}
            </TableCell>
            <TableCell>
              {log.user ? (
                <div>
                  <p className="text-sm font-medium">{log.user.name}</p>
                  <p className="text-xs text-muted-foreground">{log.user.email}</p>
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">System</span>
              )}
            </TableCell>
            <TableCell>
              <ActionBadge action={log.action} />
            </TableCell>
            <TableCell>
              <div>
                <p className="text-sm font-medium capitalize">{log.entityType.replace("_", " ")}</p>
                {log.entityId && (
                  <p className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
                    {log.entityId.slice(0, 8)}…
                  </p>
                )}
              </div>
            </TableCell>
            <TableCell className="text-sm text-slate-600 max-w-[240px] truncate">
              {formatMetadata(log.metadata)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
