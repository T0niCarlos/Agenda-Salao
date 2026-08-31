import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getCurrentAdmin } from "@/lib/auth/get-current-admin";

import { logoutAction } from "../actions";

const NAV_LINKS = [
  { href: "/dashboard", label: "Início" },
  { href: "/dashboard/agenda", label: "Agenda" },
  { href: "/dashboard/services", label: "Serviços" },
  { href: "/dashboard/professionals", label: "Profissionais" },
  { href: "/dashboard/clients", label: "Clientes" },
] as const;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, admin } = await getCurrentAdmin();

  const { data: salon } = await supabase
    .from("salons")
    .select("name, slug")
    .eq("id", admin.salonId)
    .maybeSingle();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">{salon?.name ?? "Salão"}</p>
          <p className="text-sm text-muted-foreground">
            {admin.name} · {admin.role === "owner" ? "Proprietário" : "Administrador"}
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <nav className="flex gap-4 text-sm">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground hover:underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              Sair
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
