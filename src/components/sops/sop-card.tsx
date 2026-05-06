import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, isReviewDue } from "@/lib/utils";
import { Download, Eye, Clock } from "lucide-react";
import type { DocumentWithVersion } from "@/lib/types";

interface SOPCardProps {
  document: DocumentWithVersion;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") return <Badge variant="success">Active</Badge>;
  if (status === "draft") return <Badge variant="warning">Draft</Badge>;
  if (status === "archived") return <Badge variant="secondary">Archived</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export function SOPCard({ document: doc }: SOPCardProps) {
  const reviewDue = isReviewDue(doc.currentVersion?.reviewDate);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{doc.title}</CardTitle>
            <CardDescription className="mt-1">{doc.category}</CardDescription>
          </div>
          <StatusBadge status={doc.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm text-slate-600">
          {doc.department && (
            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">
              {doc.department}
            </span>
          )}
          {doc.currentVersion?.versionNumber && (
            <span className="font-mono text-xs">
              v{doc.currentVersion.versionNumber}
            </span>
          )}
        </div>

        {doc.currentVersion?.reviewDate && (
          <div
            className={`flex items-center gap-1 text-xs ${
              reviewDue ? "text-amber-600" : "text-slate-500"
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Review: {formatDate(doc.currentVersion.reviewDate)}</span>
            {reviewDue && <span className="font-medium">(due)</span>}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Link href={`/sops/${doc.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              View
            </Button>
          </Link>
          {doc.currentVersion?.fileUrl && (
            <a
              href={doc.currentVersion.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm" className="px-3">
                <Download className="w-3.5 h-3.5" />
              </Button>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
