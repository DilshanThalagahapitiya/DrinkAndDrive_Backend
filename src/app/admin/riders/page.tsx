// ============================================================
// Admin: Riders Table Page
// ============================================================
// Shows all registered riders with search, edit, delete,
// and approve/reject functionality.
// ============================================================

import UsersTable from "@/components/UsersTable";

export default function RidersPage() {
  return <UsersTable role="RIDER" title="Riders" icon="🙋" />;
}