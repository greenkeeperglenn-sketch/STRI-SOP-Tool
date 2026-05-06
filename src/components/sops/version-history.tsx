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
import { formatDateTime, formatFileSize } from "@/lib/utils";
import { Download, CheckCircle2 } from "lucide-react";
import type { DocumentVersion } from "@/lib/types";

interface VersionHistoryProps {
  versions: DocumentVersion[];
  currentVersionId: string | null | undefined;
  onApprove?: (versionId: string) => void;
  canApprove?: boolean;
}

export function VersionHistory({
  versions,
  currentVersionId,
  onApprove,
  canApprove = false,
}: VersionHistoryProps) {
  if (versions.length === 0) {
    return (
      <p className="text-muted-foreground text-sm text-center py-4">
        No versions found.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Version</TableHead>
          <TableHead>File</TableHead>
          <TableHead>Uploaded</TableHead>
          <TableHead>Review Date</TableHead>
          <TableHead>Approved</TableHead>
          <TableHead>Change Summary</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {versions.map((version) => {
          const isCurrent = version.id === currentVersionId;
          return (
            <TableRow key={version.id} className={isCurrent ? "bg-blue-50/50" : undefined}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold">
                    v{version.versionNumber}
                  </span>
                  {isCurrent && (
                    <Badge variant="info" className="text-xs">Current</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <p className="font-medium text-slate-800 max-w-[160px] truncate">
                    {version.fileName}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatFileSize(version.fileSize)}
                  </p>
                </div>
              </TableCell>
              <TableCell className="text-sm text-slate-600">
                {formatDateTime(version.uploadedAt)}
              </TableCell>
              <TableCell className="text-sm text-slate-600">
                {version.reviewDate ? formatDateTime(version.reviewDate) : "—"}
              </TableCell>
              <TableCell>
                {version.approvedAt ? (
                  <div className="flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{formatDateTime(version.approvedAt)}</span>
                  </div>
                ) : canApprove && onApprove ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => onApprove(version.id)}
                  >
                    Approve
                  </Button>
                ) : (
                  <span className="text-muted-foreground text-sm">Pending</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-slate-600 max-w-[160px] truncate">
                {version.changeSummary ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                <a
                  href={version.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={version.fileName}
                >
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
