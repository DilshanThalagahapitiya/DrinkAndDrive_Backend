// ============================================================
// Admin: Drivers Table Page
// ============================================================
// Shows all registered drivers with search, edit, delete,
// and approve/reject functionality.
// ============================================================

import UsersTable from "@/components/UsersTable";

export default function DriversPage() {
  return <UsersTable role="DRIVER" title="Drivers" icon="🚗" />;
}