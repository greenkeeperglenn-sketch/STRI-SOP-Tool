"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, getInitials } from "@/lib/utils";
import { MoreHorizontal, Eye, UserX, KeyRound } from "lucide-react";
import type { User } from "@/lib/types";

interface StaffTableProps {
  staff: User[];
  onDeactivate?: (id: string) => void;
  onResetPassword?: (id: string) => void;
}

function RoleBadge({ role }: { role: string }) {
  if (role === "admin") return <Badge variant="danger">Admin</Badge>;
  if (role === "manager") return <Badge variant="info">Manager</Badge>;
  return <Badge variant="secondary">Staff</Badge>;
}

export function StaffTable({ staff, onDeactivate, onResetPassword }: StaffTableProps) {
  if (staff.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No staff members found</p>
        <p className="text-sm mt-1">Try adjusting your search.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {staff.map((member) => (
          <TableRow key={member.id} className={!member.active ? "opacity-60" : undefined}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-slate-900">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <RoleBadge role={member.role} />
            </TableCell>
            <TableCell className="text-sm text-slate-600">
              {member.department ?? "—"}
            </TableCell>
            <TableCell className="text-sm text-slate-600">
              {formatDate(member.startDate)}
            </TableCell>
            <TableCell>
              <Badge variant={member.active ? "success" : "secondary"}>
                {member.active ? "Active" : "Inactive"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/staff/${member.id}`} className="cursor-pointer">
                      <Eye className="w-4 h-4 mr-2" />
                      View details
                    </Link>
                  </DropdownMenuItem>
                  {onResetPassword && (
                    <DropdownMenuItem
                      onClick={() => onResetPassword(member.id)}
                      className="cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4 mr-2" />
                      Reset password
                    </DropdownMenuItem>
                  )}
                  {member.active && onDeactivate && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDeactivate(member.id)}
                        className="text-red-600 cursor-pointer"
                      >
                        <UserX className="w-4 h-4 mr-2" />
                        Deactivate
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
