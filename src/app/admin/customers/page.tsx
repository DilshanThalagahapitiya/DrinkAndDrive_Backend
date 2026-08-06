// ============================================================
// Customers Page - Admin
// ============================================================
// Shows customer registration table with the ability to:
//   - Add new customers (with temp password generation)
//   - View customer details (click on row)
//   - Approve/un-approve customers
//   - Edit / Delete customers
// ============================================================

"use client";

import { Suspense } from "react";
import UsersTable from "@/components/UsersTable";

export default function CustomersPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <UsersTable role="CUSTOMER" title="Customer" icon="👤" />
    </Suspense>
  );
}