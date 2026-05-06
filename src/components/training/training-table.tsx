"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AcknowledgeButton } from "./acknowledge-button";
import { formatDate, formatDateTime, isOverdue } from "@/lib/utils";
import { CheckCircle2, ExternalLink, Trash2 } from "lucide-react";
import type { TrainingAssignmentWithDetails } from "@/lib/types";

interface TrainingTableProps {
  assignments: TrainingAssignmentWithDetails[];
  showUser?: boolean;
  canAcknowledge?: boolean;
  canManage?: boolean;
  onRemove?: (id: string) => void;
  onAcknowledged?: () => void;
}

function TrainingStatusBadge({
  acknowledged,
  dueDate,
}: {
  acknowledged: boolean;
  dueDate: Date | string | null | undefined;
}) {
  if (acknowledged) return <Badge variant="success">Acknowledged</Badge>;
  if (dueDate && isOverdue(dueDate)) return <Badge variant="danger">Overdue</Badge>;
  return <Badge variant="warning">Pending</Badge>;
}

export function TrainingTable({
  assignments,
  showUser = false,
  canAcknowledge = false,
  canManage = false,
  onRemove,
  onAcknowledged,
}: TrainingTableProps) {
  if (assignments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No training assignments found</p>
        <p className="text-sm mt-1">
          {canManage
            ? "Assign SOPs to staff to track training completion."
            : "You have no training assignments."}
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showUser && <TableHead>Staff Member</TableHead>}
          <TableHead>Document</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Acknowledged</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assignments.map((item) => {
          const isAcknowledged = !!item.acknowledgement;
          return (
            <TableRow key={item.id}>
              {showUser && (
                <TableCell>
                  <div>
                    <p className="text-sm font-medium">{item.user.name}</p>
                    <p className="text-xs text-muted-foreground">{item.user.email}</p>
                  </div>
                </TableCell>
              )}
              <TableCell>
                <p className="text-sm font-medium text-slate-800 max-w-[200px] truncate">
                  {item.document.title}
                </p>
                {item.document.currentVersion && (
                  <p className="text-xs text-muted-foreground font-mono">
                    v{item.document.currentVersion.versionNumber}
                  </p>
                )}
              </TableCell>
              <TableCell className="text-sm text-slate-600">
                {item.document.category}
              </TableCell>
              <TableCell className="text-sm">
                {item.dueDate ? (
                  <span
                    className={
                      !isAcknowledged && isOverdue(item.dueDate)
                        ? "text-red-600 font-medium"
                        : "text-slate-600"
                    }
                  >
                    {formatDate(item.dueDate)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <TrainingStatusBadge
                  acknowledged={isAcknowledged}
                  dueDate={item.dueDate}
                />
              </TableCell>
              <TableCell className="text-sm text-slate-600">
                {item.acknowledgement ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="text-xs">
                      {formatDateTime(item.acknowledgement.acknowledgedAt)}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {item.document.currentVersion && (
                    <a
                      href={`/sops/${item.document.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                  {canAcknowledge && !isAcknowledged && (
                    <AcknowledgeButton
                      assignmentId={item.id}
                      documentTitle={item.document.title}
                      onSuccess={onAcknowledged}
                    />
                  )}
                  {canManage && onRemove && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => onRemove(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
