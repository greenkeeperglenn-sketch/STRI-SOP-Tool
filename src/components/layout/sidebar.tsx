"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  LayoutDashboard,
  FileText,
  Users,
  GraduationCap,
  ClipboardList,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { SessionUser } from "@/lib/types";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/sops",
    label: "SOP Library",
    icon: FileText,
  },
  {
    href: "/training",
    label: "Training",
    icon: GraduationCap,
  },
  {
    href: "/staff",
    label: "Staff Directory",
    icon: Users,
    roles: ["admin", "manager"] as const,
  },
  {
    href: "/audit",
    label: "Audit Log",
    icon: ClipboardList,
    roles: ["admin"] as const,
  },
];

interface SidebarProps {
  user: SessionUser;
  onClose?: () => void;
}

export function Sidebar({ user, onClose }: SidebarProps) {
  const pathname = usePathname();

  const visibleItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return (item.roles as string[]).includes(user.role);
  });

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-900 truncate">STRI SOP Platform</p>
          <p className="text-xs text-muted-foreground truncate">Compliance & Knowledge</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-blue-600" : "text-slate-500")} />
              <span>{item.label}</span>
              {isActive && <ChevronRight className="w-3 h-3 ml-auto text-blue-500" />}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* User section */}
      <div className="px-3 py-4 space-y-2">
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 capitalize">
            {user.role}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
