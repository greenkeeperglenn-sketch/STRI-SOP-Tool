"use client";

import Link from "next/link";
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
import { formatDate, isReviewDue } from "@/lib/utils";
import { ExternalLink, Eye } from "lucide-react";
import type { DocumentWithVersion } from "@/lib/types";

interface SOPTableProps {
  documents: DocumentWithVersion[];
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") return <Badge variant="success">Active</Badge>;
  if (status === "draft") return <Badge variant="warning">Draft</Badge>;
  if (status === "archived") return <Badge variant="secondary">Archived</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

function ReviewBadge({ reviewDate }: { reviewDate: Date | null | undefined }) {
  if (!reviewDate) return <span className="text-muted-foreground text-sm">—</span>;
  const due = isReviewDue(reviewDate);
  return (
    <span className={due ? "text-amber-600 font-medium" : "text-slate-600"}>
      {formatDate(reviewDate)}
      {due && " ⚠"}
    </span>
  );
}

export function SOPTable({ documents }: SOPTableProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No SOPs found</p>
        <p className="text-sm mt-1">Try adjusting your filters or upload a new SOP.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Version</TableHead>
          <TableHead>Review Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((doc) => (
          <TableRow key={doc.id}>
            <TableCell className="font-medium max-w-[240px] truncate">
              <Link
                href={`/sops/${doc.id}`}
                className="hover:text-blue-600 hover:underline"
              >
                {doc.title}
              </Link>
            </TableCell>
            <TableCell>
              <span className="text-sm text-slate-600">{doc.category}</span>
            </TableCell>
            <TableCell>
              <span className="text-sm text-slate-600">{doc.department ?? "—"}</span>
            </TableCell>
            <TableCell>
              <StatusBadge status={doc.status} />
            </TableCell>
            <TableCell>
              <span className="text-sm font-mono text-slate-600">
                {doc.currentVersion?.versionNumber ?? "—"}
              </span>
            </TableCell>
            <TableCell>
              <ReviewBadge reviewDate={doc.currentVersion?.reviewDate} />
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Link href={`/sops/${doc.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                {doc.currentVersion?.fileUrl && (
                  <a
                    href={doc.currentVersion.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
