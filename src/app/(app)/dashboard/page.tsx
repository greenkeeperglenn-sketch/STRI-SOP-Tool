import { getDashboardStats } from "@/lib/actions/sop.actions";
import { getTrainingAssignments } from "@/lib/actions/training.actions";
import { requireAuth } from "@/lib/auth/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import { ComplianceChart } from "@/components/dashboard/compliance-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { formatDate, isOverdue } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireAuth();

  const [statsResult, trainingResult] = await Promise.all([
    getDashboardStats(),
    getTrainingAssignments({ userId: user.id, status: "pending" }),
  ]);

  const stats = statsResult.data ?? {
    totalActiveSOPs: 0,
    sopsDueForReview: 0,
    compliancePercentage: 100,
    overdueTraining: 0,
    totalStaff: 0,
    totalAssignments: 0,
    acknowledgedAssignments: 0,
  };

  const pendingTraining = trainingResult.data ?? [];
  const myOverdue = pendingTraining.filter(
    (t) => t.dueDate && isOverdue(t.dueDate)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user.name}. Here&apos;s your operational overview.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active SOPs"
          value={stats.totalActiveSOPs}
          description="Published and active documents"
          icon={FileText}
          variant="default"
        />
        <StatCard
          title="Due for Review"
          value={stats.sopsDueForReview}
          description="SOPs due within 30 days"
          icon={Clock}
          variant={stats.sopsDueForReview > 0 ? "warning" : "success"}
        />
        <StatCard
          title="Active Staff"
          value={stats.totalStaff}
          description="Registered staff members"
          icon={Users}
          variant="default"
        />
        <StatCard
          title="Overdue Training"
          value={stats.overdueTraining}
          description="Past-due training items"
          icon={AlertTriangle}
          variant={stats.overdueTraining > 0 ? "danger" : "success"}
        />
      </div>

      {/* Charts + actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ComplianceChart
          percentage={stats.compliancePercentage}
          acknowledged={stats.acknowledgedAssignments}
          total={stats.totalAssignments}
        />

        {/* My pending training */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              My Pending Training
            </CardTitle>
            <Link href="/training">
              <Button variant="ghost" size="sm" className="text-xs">
                View all <ArrowRight className="ml-1 w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {pendingTraining.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="w-10 h-10 text-green-500 mb-2" />
                <p className="text-sm font-medium text-slate-700">All caught up!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You have no pending training items.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTraining.slice(0, 5).map((item) => {
                  const overdue = item.dueDate && isOverdue(item.dueDate);
                  return (
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
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.dueDate && (
                          <span className="text-xs text-muted-foreground">
                            Due {formatDate(item.dueDate)}
                          </span>
                        )}
                        <Badge variant={overdue ? "danger" : "warning"}>
                          {overdue ? "Overdue" : "Pending"}
                        </Badge>
                        <Link href="/training">
                          <Button size="sm" variant="outline" className="h-7 text-xs">
                            Review
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
                {pendingTraining.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    +{pendingTraining.length - 5} more items
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      {(user.role === "admin" || user.role === "manager") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href="/sops/upload">
                <Button size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Upload New SOP
                </Button>
              </Link>
              <Link href="/staff">
                <Button size="sm" variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Staff
                </Button>
              </Link>
              <Link href="/training">
                <Button size="sm" variant="outline">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Assign Training
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
