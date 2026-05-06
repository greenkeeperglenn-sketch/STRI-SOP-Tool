"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { VersionHistory } from "@/components/sops/version-history";
import { getDocument } from "@/lib/actions/sop.actions";
import { approveVersion, updateDocument } from "@/lib/actions/sop.actions";
import { formatDate, formatDateTime, formatFileSize } from "@/lib/utils";
import {
  ArrowLeft,
  Download,
  Upload,
  FileText,
  Calendar,
  User,
  Building2,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import type { DocumentWithVersions } from "@/lib/types";

interface SOPDetailPageProps {
  params: Promise<{ id: string }>;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") return <Badge variant="success">Active</Badge>;
  if (status === "draft") return <Badge variant="warning">Draft</Badge>;
  if (status === "archived") return <Badge variant="secondary">Archived</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export default function SOPDetailPage({ params }: SOPDetailPageProps) {
  const { id } = use(params);
  const [doc, setDoc] = useState<DocumentWithVersions | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDoc = useCallback(async () => {
    const result = await getDocument(id);
    if (result.success && result.data) {
      setDoc(result.data);
    } else {
      toast.error(result.error ?? "Document not found");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchDoc();
  }, [fetchDoc]);

  async function handleApprove(versionId: string) {
    const result = await approveVersion(versionId);
    if (result.success) {
      toast.success("Version approved");
      fetchDoc();
    } else {
      toast.error(result.error ?? "Failed to approve version");
    }
  }

  async function handleStatusChange(newStatus: "draft" | "active" | "archived") {
    if (!doc) return;
    const result = await updateDocument(doc.id, { status: newStatus });
    if (result.success) {
      toast.success(`Status updated to ${newStatus}`);
      fetchDoc();
    } else {
      toast.error(result.error ?? "Failed to update status");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="text-center py-16">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-semibold">Document not found</h2>
        <Link href="/sops">
          <Button variant="outline" className="mt-4">
            Back to SOP Library
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/sops">
          <Button variant="ghost" size="icon" className="mt-0.5">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 truncate">
              {doc.title}
            </h1>
            <StatusBadge status={doc.status} />
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {doc.category}
            {doc.department && ` · ${doc.department}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {doc.currentVersion?.fileUrl && (
            <a
              href={doc.currentVersion.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={doc.currentVersion.fileName}
            >
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </a>
          )}
          <Link href={`/sops/upload?documentId=${doc.id}&mode=version`}>
            <Button size="sm">
              <Upload className="w-4 h-4 mr-2" />
              New Version
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="versions">
            Version History ({doc.versions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4 mt-4">
          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Document Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Category</p>
                    <p className="text-sm font-medium">{doc.category}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="text-sm font-medium">{doc.department ?? "All departments"}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Created by</p>
                    <p className="text-sm font-medium">
                      {doc.createdByUser?.name ?? "Unknown"}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm font-medium">{formatDate(doc.createdAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {doc.currentVersion && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Current Version
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Version</p>
                    <p className="text-sm font-mono font-bold text-blue-700">
                      v{doc.currentVersion.versionNumber}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground">File</p>
                    <p className="text-sm font-medium truncate">
                      {doc.currentVersion.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(doc.currentVersion.fileSize)}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground">Uploaded</p>
                    <p className="text-sm font-medium">
                      {formatDateTime(doc.currentVersion.uploadedAt)}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground">Next Review</p>
                    <p className="text-sm font-medium">
                      {formatDate(doc.currentVersion.reviewDate)}
                    </p>
                  </div>
                  {doc.currentVersion.changeSummary && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs text-muted-foreground">Description</p>
                        <p className="text-sm">{doc.currentVersion.changeSummary}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Status management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Status Management
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {doc.status !== "draft" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange("draft")}
                >
                  Set as Draft
                </Button>
              )}
              {doc.status !== "active" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-700 hover:text-green-800 hover:bg-green-50"
                  onClick={() => handleStatusChange("active")}
                >
                  Set as Active
                </Button>
              )}
              {doc.status !== "archived" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleStatusChange("archived")}
                >
                  Archive
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <VersionHistory
                versions={doc.versions}
                currentVersionId={doc.currentVersionId}
                onApprove={handleApprove}
                canApprove={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
