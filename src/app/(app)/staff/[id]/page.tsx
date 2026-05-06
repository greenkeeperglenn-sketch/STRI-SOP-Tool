"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { getStaffMember } from "@/lib/actions/staff.actions";
import { getTrainingAssignments } from "@/lib/actions/training.actions";
import { formatDate } from "@/lib/utils";
import { getInitials, isOverdue } from "@/lib/utils";
import {
  ArrowLeft,
  Mail,
  Building2,
  Calendar,
  Shield,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import type { User, TrainingAssignmentWithDetails } from "@/lib/types";

interface StaffDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function StaffDetailPage({ params }: StaffDetailPageProps) {
  const { id } = use(params);
  const [member, setMember] = useState<User | null>(null);
  const [training, setTraining] = useState<TrainingAssignmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [memberResult, trainingResult] = await Promise.all([
      getStaffMember(id),
      getTrainingAssignments({ userId: id }),
    ]);

    if (memberResult.success && memberResult.data) {
      setMember(memberResult.data);
    } else {
      toast.error("Staff member not found");
    }

    if (trainingResult.success) {
      setTraining(trainingResult.data ?? []);
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-semibold">Staff member not found</h2>
        <Link href="/staff">
          <Button variant="outline" className="mt-4">
            Back to Staff
          </Button>
        </Link>
      </div>
    );
  }

  const acknowledged = training.filter((t) => t.acknowledgement);
  const pending = training.filter((t) => !t.acknowledgement);
  const overdue = pending.filter((t) => t.dueDate && isOverdue(t.dueDate));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/staff">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Staff Profile</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-3">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-xl bg-blue-100 text-blue-700">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-semibold">{member.name}</h2>
                <p className="text-muted-foreground text-sm capitalize">{member.role}</p>
              </div>
              <Badge variant={member.active ? "success" : "secondary"}>
                {member.active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <Separator className="my-4" />
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-4 h-4 shrink-0" />
                <span className="truncate">{member.email}</span>
              </div>
              {member.department && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>{member.department}</span>
                </div>
              )}
              {member.startDate && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>Since {formatDate(member.startDate)}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-600">
                <Shield className="w-4 h-4 shrink-0" />
                <span className="capitalize">{member.role}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Training summary */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Training Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-green-700">{acknowledged.length}</p>
                <p className="text-xs text-green-600">Completed</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-amber-700">{pending.length - overdue.length}</p>
                <p className="text-xs text-amber-600">Pending</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-red-700">{overdue.length}</p>
                <p className="text-xs text-red-600">Overdue</p>
              </div>
            </div>

            {training.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Recent Assignments</p>
                {training.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 py-2 border-b last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {item.document.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.document.category}
                        {item.dueDate && ` · Due ${formatDate(item.dueDate)}`}
                      </p>
                    </div>
                    <Badge
                      variant={
                        item.acknowledgement
                          ? "success"
                          : item.dueDate && isOverdue(item.dueDate)
                          ? "danger"
                          : "warning"
                      }
                    >
                      {item.acknowledgement
                        ? "Done"
                        : item.dueDate && isOverdue(item.dueDate)
                        ? "Overdue"
                        : "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
