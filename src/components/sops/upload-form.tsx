"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createDocument, uploadNewVersion } from "@/lib/actions/sop.actions";
import { DEPARTMENTS, SOP_CATEGORIES, formatFileSize } from "@/lib/utils";
import { toast } from "sonner";
import { Upload, FileText, X, Loader2 } from "lucide-react";

interface UploadFormProps {
  mode: "new" | "version";
  documentId?: string;
  documentTitle?: string;
}

export function UploadForm({ mode, documentId, documentTitle }: UploadFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    url: string;
    fileName: string;
    fileSize: number;
  } | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState<"draft" | "active">("draft");
  const [reviewDate, setReviewDate] = useState("");
  const [changeSummary, setChangeSummary] = useState("");

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowed.includes(file.type)) {
      toast.error("Only PDF and Word (.docx) files are allowed");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be less than 10MB");
      return;
    }

    setSelectedFile(file);
    setUploadedFile(null);
  }

  async function handleUploadFile() {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Upload failed");
      }

      setUploadedFile({
        url: data.url,
        fileName: data.fileName,
        fileSize: data.fileSize,
      });

      toast.success("File uploaded successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "File upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!uploadedFile) {
      toast.error("Please upload a file first");
      return;
    }

    setLoading(true);
    try {
      let result;

      if (mode === "new") {
        if (!title || !category) {
          toast.error("Title and category are required");
          setLoading(false);
          return;
        }

        result = await createDocument({
          title,
          category,
          department: department || undefined,
          status,
          fileUrl: uploadedFile.url,
          fileName: uploadedFile.fileName,
          fileSize: uploadedFile.fileSize,
          reviewDate: reviewDate || undefined,
          changeSummary: changeSummary || undefined,
        });

        if (result.success && result.data) {
          toast.success("SOP created successfully");
          router.push(`/sops/${result.data.documentId}`);
        }
      } else {
        if (!documentId) {
          toast.error("Document ID is required");
          setLoading(false);
          return;
        }

        result = await uploadNewVersion({
          documentId,
          fileUrl: uploadedFile.url,
          fileName: uploadedFile.fileName,
          fileSize: uploadedFile.fileSize,
          reviewDate: reviewDate || undefined,
          changeSummary: changeSummary || undefined,
        });

        if (result.success) {
          toast.success("New version uploaded successfully");
          router.push(`/sops/${documentId}`);
          router.refresh();
        }
      }

      if (!result?.success) {
        toast.error(result?.error ?? "Operation failed");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File upload section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Document File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedFile ? (
            <div
              className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, DOC, DOCX up to 10MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border">
              <FileText className="w-8 h-8 text-blue-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!uploadedFile ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleUploadFile}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Uploading…
                      </>
                    ) : (
                      "Upload"
                    )}
                  </Button>
                ) : (
                  <span className="text-xs text-green-600 font-medium">
                    ✓ Uploaded
                  </span>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setSelectedFile(null);
                    setUploadedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document metadata */}
      {mode === "new" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Document Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Field Safety Protocol - Canopy Research"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOP_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger id="department">
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All departments</SelectItem>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as "draft" | "active")}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Version details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Version Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "version" && documentTitle && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                Uploading new version for: <strong>{documentTitle}</strong>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reviewDate">Next Review Date</Label>
            <Input
              id="reviewDate"
              type="date"
              value={reviewDate}
              onChange={(e) => setReviewDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              When this document should next be reviewed for accuracy
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="changeSummary">
              {mode === "new" ? "Initial Description" : "Change Summary"}
            </Label>
            <Textarea
              id="changeSummary"
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              placeholder={
                mode === "new"
                  ? "Brief description of this document"
                  : "What changed in this version?"
              }
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !uploadedFile}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : mode === "new" ? (
            "Create SOP"
          ) : (
            "Upload New Version"
          )}
        </Button>
      </div>
    </form>
  );
}
