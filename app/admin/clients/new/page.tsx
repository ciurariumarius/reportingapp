import { AdminShell } from "@/components/AdminShell";
import { ClientForm } from "@/components/ClientForm";
import { requireAdminPage } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NewClientPage() {
  await requireAdminPage();

  return (
    <AdminShell
      description="Adauga un client nou si configureaza sursele folosite de raport."
      title="Client nou"
    >
      <ClientForm mode="create" />
    </AdminShell>
  );
}
