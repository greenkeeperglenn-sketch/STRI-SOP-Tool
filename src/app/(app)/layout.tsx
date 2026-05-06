import { requireAuth } from "@/lib/auth/utils";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-white lg:flex lg:flex-col">
        <Sidebar user={user} />
      </aside>

      {/* Mobile header */}
      <Header user={user} />

      {/* Main content */}
      <main className="lg:pl-64 min-h-screen">
        <div className="container mx-auto max-w-7xl px-4 py-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
