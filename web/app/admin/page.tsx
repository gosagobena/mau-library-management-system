"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getInventoryReport,
  getOverdueReport,
  getStoredUser,
  type InventoryReport,
  type Loan,
} from "@/lib/api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString();
}

export default function AdminPage() {
  const router = useRouter();
  const [inventory, setInventory] = useState<InventoryReport | null>(null);
  const [overdue, setOverdue] = useState<Loan[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!user || (user.role !== "Librarian" && user.role !== "Administrator")) {
      router.push("/login");
      return;
    }
    Promise.all([getInventoryReport(), getOverdueReport()])
      .then(([inv, od]) => {
        setInventory(inv);
        setOverdue(od);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load reports.")
      );
  }, [router]);

  const stats = inventory
    ? [
        { label: "Titles", value: inventory.totalTitles },
        { label: "Total copies", value: inventory.totalCopies },
        { label: "Available copies", value: inventory.availableCopies },
        { label: "Active loans", value: inventory.activeLoans },
        { label: "Overdue loans", value: inventory.overdueLoans },
        { label: "Pending reservations", value: inventory.pendingReservations },
        { label: "Out of circulation", value: inventory.outOfCirculation },
        { label: "Unpaid fines (ETB)", value: inventory.unpaidFines },
      ]
    : [];

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold text-brand-800">Library Administration</h1>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <section>
        <h2 className="text-lg font-semibold">Inventory Overview</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-slate-200 bg-white p-4 text-center"
            >
              <p className="text-2xl font-bold text-brand-800">{s.value}</p>
              <p className="mt-1 text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Overdue Loans</h2>
        {overdue.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No overdue loans. 🎉</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-3">Book</th>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Borrowed</th>
                  <th className="px-4 py-3">Due</th>
                </tr>
              </thead>
              <tbody>
                {overdue.map((loan) => (
                  <tr key={loan.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium">{loan.bookTitle}</td>
                    <td className="px-4 py-3">{loan.memberName}</td>
                    <td className="px-4 py-3">{formatDate(loan.borrowDate)}</td>
                    <td className="px-4 py-3 text-red-600">{formatDate(loan.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-sm text-slate-500">
        Full inventory CRUD, member management, and role administration are available via
        the REST API (see <code>/api/swagger</code>). The corresponding admin UI screens
        are the next milestone on the roadmap.
      </p>
    </div>
  );
}
