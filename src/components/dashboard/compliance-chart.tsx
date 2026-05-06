"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ComplianceChartProps {
  percentage: number;
  acknowledged: number;
  total: number;
}

export function ComplianceChart({ percentage, acknowledged, total }: ComplianceChartProps) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const color =
    percentage >= 80
      ? "#16a34a"
      : percentage >= 60
      ? "#d97706"
      : "#dc2626";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Overall Compliance
        </CardTitle>
        <CardDescription>Training acknowledgement rate</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="12"
            />
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-slate-900">{percentage}%</span>
          </div>
        </div>
        <div className="text-sm text-muted-foreground text-center">
          {acknowledged} of {total} assignments acknowledged
        </div>
      </CardContent>
    </Card>
  );
}
