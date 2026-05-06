"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UploadForm } from "@/components/sops/upload-form";
import { ArrowLeft } from "lucide-react";

export default function UploadSOPPage() {
  const searchParams = useSearchParams();
  const documentId = searchParams.get("documentId");
  const documentTitle = searchParams.get("title");
  const mode = (searchParams.get("mode") as "new" | "version") ?? (documentId ? "version" : "new");

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href={documentId ? `/sops/${documentId}` : "/sops"}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {mode === "new" ? "Upload New SOP" : "Upload New Version"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {mode === "new"
              ? "Create a new Standard Operating Procedure document"
              : "Upload a new version of an existing SOP"}
          </p>
        </div>
      </div>

      <UploadForm
        mode={mode}
        documentId={documentId ?? undefined}
        documentTitle={documentTitle ?? undefined}
      />
    </div>
  );
}
