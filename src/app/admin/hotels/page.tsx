// ============================================================
// Admin: Hotels Table Page
// ============================================================
// Shows all registered hotels with search, edit, delete,
// and approve/reject functionality.
// ============================================================

import UsersTable from "@/components/UsersTable";

export default function HotelsPage() {
  return <UsersTable role="HOTEL" title="Hotels" icon="🏨" />;
}