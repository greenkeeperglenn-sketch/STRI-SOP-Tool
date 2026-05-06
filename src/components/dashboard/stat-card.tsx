import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "success" | "warning" | "danger";
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  variant = "default",
}: StatCardProps) {
  const iconColors = {
    default: "bg-blue-50 text-blue-600",
    success: "bg-green-50 text-green-600",
    warning: "bg-amber-50 text-amber-600",
    danger: "bg-red-50 text-red-600",
  };

  const valueColors = {
    default: "text-slate-900",
    success: "text-green-700",
    warning: "text-amber-700",
    danger: "text-red-700",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-lg", iconColors[variant])}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", valueColors[variant])}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
