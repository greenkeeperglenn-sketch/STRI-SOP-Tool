"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrainingTable } from "@/components/training/training-table";
import {
  getTrainingAssignments,
  assignTraining,
  removeTrainingAssignment,
} from "@/lib/actions/training.actions";
import { getDocuments } from "@/lib/actions/sop.actions";
import { getStaffList } from "@/lib/actions/staff.actions";
import { toast } from "sonner";
import { Plus, Loader2, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { TrainingAssignmentWithDetails, DocumentWithVersion, User, SessionUser } from "@/lib/types";

interface TrainingPageClientProps {
  user: SessionUser;
}

export function TrainingPageClient({ user }: TrainingPageClientProps) {
  const isManager = user.role === "admin" || user.role === "manager";

  const [assignments, setAssignments] = useState<TrainingAssignmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [documents, setDocuments] = useState<DocumentWithVersion[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [selectedDocId, setSelectedDocId] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    const result = await getTrainingAssignments(
      isManager ? undefined : { userId: user.id }
    );
    if (result.success) setAssignments(result.data ?? []);
    setLoading(false);
  }, [isManager, user.id]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  async function loadDialogData() {
    const [docsResult, staffResult] = await Promise.all([
      getDocuments({ status: "active" }),
      getStaffList(),
    ]);
    if (docsResult.success) setDocuments(docsResult.data ?? []);
    if (staffResult.success) setStaff(staffResult.data ?? []);
    setShowAssignDialog(true);
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDocId || selectedUserIds.length === 0) {
      toast.error("Please select a document and at least one staff member");
      return;
    }
    setAssigning(true);
    const result = await assignTraining({
      documentId: selectedDocId,
      userIds: selectedUserIds,
      dueDate: dueDate || undefined,
    });
    if (result.success) {
      toast.success(`Training assigned to ${result.data?.assigned} staff member(s)`);
      setShowAssignDialog(false);
      setSelectedDocId("");
      setSelectedUserIds([]);
      setDueDate("");
      fetchAssignments();
    } else {
      toast.error(result.error ?? "Failed to assign training");
    }
    setAssigning(false);
  }

  async function handleRemove(id: string) {
    if (!confirm("Remove this training assignment?")) return;
    const result = await removeTrainingAssignment(id);
    if (result.success) {
      toast.success("Assignment removed");
      fetchAssignments();
    } else {
      toast.error(result.error ?? "Failed to remove assignment");
    }
  }

  function toggleUser(userId: string) {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  const pendingAssignments = assignments.filter((a) => !a.acknowledgement);
  const completedAssignments = assignments.filter((a) => a.acknowledgement);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Training</h1>
          <p className="text-muted-foreground mt-1">
            {isManager
              ? "Manage training assignments and track completion"
              : "Your training assignments and acknowledgements"}
          </p>
        </div>
        {isManager && (
          <Button onClick={loadDialogData}>
            <Plus className="w-4 h-4 mr-2" />
            Assign Training
          </Button>
        )}
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedAssignments.length})
          </TabsTrigger>
          {isManager && (
            <TabsTrigger value="all">All ({assignments.length})</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : (
                <TrainingTable
                  assignments={pendingAssignments}
                  showUser={isManager}
                  canAcknowledge={!isManager}
                  canManage={isManager}
                  onRemove={isManager ? handleRemove : undefined}
                  onAcknowledged={fetchAssignments}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <TrainingTable
                assignments={completedAssignments}
                showUser={isManager}
                canManage={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {isManager && (
          <TabsContent value="all" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <TrainingTable
                  assignments={assignments}
                  showUser={true}
                  canManage={true}
                  onRemove={handleRemove}
                  onAcknowledged={fetchAssignments}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Assign Training Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Training</DialogTitle>
            <DialogDescription>
              Select a document and staff members to assign training.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssign} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assign-doc">Document *</Label>
              <select
                id="assign-doc"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                required
              >
                <option value="">Select a document</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title} (v{doc.currentVersion?.versionNumber ?? "?"})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Staff Members * ({selectedUserIds.length} selected)</Label>
              <div className="border rounded-md max-h-48 overflow-y-auto divide-y">
                {staff.filter((s) => s.active).map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(s.id)}
                      onChange={() => toggleUser(s.id)}
                      className="rounded"
                    />
                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                    </div>
                    {s.department && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {s.department}
                      </span>
                    )}
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setSelectedUserIds(staff.filter((s) => s.active).map((s) => s.id))
                  }
                >
                  <Users className="w-3 h-3 mr-1" />
                  Select all
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUserIds([])}
                >
                  Clear
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assign-due">Due Date (optional)</Label>
              <Input
                id="assign-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAssignDialog(false)}
                disabled={assigning}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={assigning}>
                {assigning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Assigning…
                  </>
                ) : (
                  "Assign Training"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
