import Link from "next/link";
import { AdminCsrfBootstrap } from "./AdminCsrfBootstrap";
import { LogoutButton } from "./LogoutButton";

type AdminShellProps = {
  activeNav?: "clients" | "settings";
  title: string;
  description?: string;
  children: React.ReactNode;
};

const navItems = [
  { href: "/admin/clients", label: "Clienti", key: "clients" },
  { href: "/admin/settings", label: "Settings", key: "settings" }
] as const;

export function AdminShell({
  activeNav = "clients",
  title,
  description,
  children
}: AdminShellProps) {
  return (
    <main className="min-h-screen bg-slate-50">
      <AdminCsrfBootstrap />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link className="font-semibold tracking-wide text-digital" href="/admin/clients">
            DigitalDot Reports
          </Link>
          <nav className="flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                className={[
                  "focus-ring rounded-md px-3 py-2 text-sm font-medium",
                  item.key === activeNav
                    ? "bg-digital-mist text-digital"
                    : "text-slate-700 hover:bg-slate-100"
                ].join(" ")}
                href={item.href}
                key={item.key}
              >
                {item.label}
              </Link>
            ))}
            <LogoutButton />
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
            {description ? (
              <p className="mt-1 max-w-3xl text-sm text-slate-600">{description}</p>
            ) : null}
          </div>
        </div>
        {children}
      </section>
    </main>
  );
}
