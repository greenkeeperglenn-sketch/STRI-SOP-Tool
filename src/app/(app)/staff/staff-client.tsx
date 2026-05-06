"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { StaffTable } from "@/components/staff/staff-table";
import {
  getStaffList,
  createStaffMember,
  deactivateStaffMember,
  resetPassword,
} from "@/lib/actions/staff.actions";
import { DEPARTMENTS } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, Search, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@/lib/types";

export function StaffPageClient() {
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    const result = await getStaffList(search || undefined);
    if (result.success) setStaff(result.data ?? []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => fetchStaff(), 300);
    return () => clearTimeout(timer);
  }, [fetchStaff]);

  async function handleDeactivate(id: string) {
    if (!confirm("Are you sure you want to deactivate this staff member?")) return;
    const result = await deactivateStaffMember(id);
    if (result.success) {
      toast.success("Staff member deactivated");
      fetchStaff();
    } else {
      toast.error(result.error ?? "Failed to deactivate");
    }
  }

  async function handleResetPassword(id: string) {
    const newPassword = prompt("Enter new password (min 8 characters):");
    if (!newPassword) return;
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    const result = await resetPassword(id, newPassword);
    if (result.success) {
      toast.success("Password reset successfully");
    } else {
      toast.error(result.error ?? "Failed to reset password");
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    const formData = new FormData(e.currentTarget);
    const result = await createStaffMember(formData);
    if (result.success) {
      toast.success("Staff member created");
      setShowCreateDialog(false);
      fetchStaff();
    } else {
      toast.error(result.error ?? "Failed to create staff member");
    }
    setCreating(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff Directory</h1>
          <p className="text-muted-foreground mt-1">
            Manage team members and their access
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, department…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <StaffTable
              staff={staff}
              onDeactivate={handleDeactivate}
              onResetPassword={handleResetPassword}
            />
          )}
        </CardContent>
      </Card>

      {/* Create staff dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
            <DialogDescription>
              Create a new account for a team member.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Full Name *</Label>
              <Input
                id="create-name"
                name="name"
                placeholder="Jane Smith"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email *</Label>
              <Input
                id="create-email"
                name="email"
                type="email"
                placeholder="jane@stri.si.edu"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Password *</Label>
              <Input
                id="create-password"
                name="password"
                type="password"
                placeholder="Min. 8 characters"
                minLength={8}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="create-role">Role *</Label>
                <select
                  id="create-role"
                  name="role"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-startDate">Start Date</Label>
                <Input
                  id="create-startDate"
                  name="startDate"
                  type="date"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-department">Department</Label>
              <select
                id="create-department"
                name="department"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
