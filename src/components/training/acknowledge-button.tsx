"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { acknowledgeTraining } from "@/lib/actions/training.actions";
import { toast } from "sonner";
import { CheckCircle2, Loader2, FileText } from "lucide-react";

interface AcknowledgeButtonProps {
  assignmentId: string;
  documentTitle: string;
  fileUrl?: string | null;
  onSuccess?: () => void;
}

export function AcknowledgeButton({
  assignmentId,
  documentTitle,
  fileUrl,
  onSuccess,
}: AcknowledgeButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAcknowledge() {
    setLoading(true);
    const result = await acknowledgeTraining(assignmentId);
    if (result.success) {
      toast.success("Training acknowledged successfully");
      setOpen(false);
      onSuccess?.();
    } else {
      toast.error(result.error ?? "Failed to acknowledge training");
    }
    setLoading(false);
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <CheckCircle2 className="w-4 h-4 mr-2" />
        Acknowledge
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Acknowledge Training</DialogTitle>
            <DialogDescription>
              By acknowledging, you confirm that you have read and understood the
              contents of this document.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-800">{documentTitle}</p>
                {fileUrl && (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                  >
                    Open document to review →
                  </a>
                )}
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            This acknowledgement will be recorded with your name, timestamp, and
            IP address as part of your compliance record.
          </p>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleAcknowledge} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Confirming…
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  I have read and understood this document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
