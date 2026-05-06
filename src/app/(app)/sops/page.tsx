"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SOPTable } from "@/components/sops/sop-table";
import { getDocuments } from "@/lib/actions/sop.actions";
import { SOP_CATEGORIES, DEPARTMENTS } from "@/lib/utils";
import { Plus, Search, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { DocumentWithVersion } from "@/lib/types";

export default function SOPsPage() {
  const [documents, setDocuments] = useState<DocumentWithVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [department, setDepartment] = useState("all");

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    const result = await getDocuments({
      search: search || undefined,
      category: category !== "all" ? category : undefined,
      status: status !== "all" ? status : undefined,
      department: department !== "all" ? department : undefined,
    });
    if (result.success) {
      setDocuments(result.data ?? []);
    }
    setLoading(false);
  }, [search, category, status, department]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDocs();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchDocs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">SOP Library</h1>
          <p className="text-muted-foreground mt-1">
            Browse and manage standard operating procedures
          </p>
        </div>
        <Link href="/sops/upload">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New SOP
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search SOPs…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {SOP_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
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
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <SOPTable documents={documents} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
