"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  const [user, setUser] = useState<any | null>(null);
  const [inventory, setInventory] = useState<InventoryReport | null>(null);
  const [overdue, setOverdue] = useState<Loan[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = getStoredUser();
    if (
      !currentUser ||
      (currentUser.role !== "Librarian" && currentUser.role !== "Administrator")
    ) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
    Promise.all([getInventoryReport(), getOverdueReport()])
      .then(([inv, od]) => {
        setInventory(inv);
        setOverdue(od);
      })
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Failed to load reports.",
        ),
      );
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-light px-6 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900">
            ⚙️ Library Administration
          </h1>
          <p className="text-slate-600 mt-2">Welcome back, {user?.fullName}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-10">
          {[
            {
              label: "Total Books",
              value: inventory?.totalTitles,
              icon: "📚",
              color: "brand",
            },
            {
              label: "Total Copies",
              value: inventory?.totalCopies,
              icon: "📖",
              color: "brand",
            },
            {
              label: "Available",
              value: inventory?.availableCopies,
              icon: "✅",
              color: "emerald",
            },
            {
              label: "Active Loans",
              value: inventory?.activeLoans,
              icon: "🔄",
              color: "brand",
            },
          ].map((stat, i) => (
            <div key={i} className="card">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-3xl font-bold text-brand-600">
                {stat.value || 0}
              </div>
              <p className="text-sm text-slate-600 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Management Sections */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <Link
            href="/admin/books"
            className="card group hover:shadow-lg transition-shadow"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
              📚
            </div>
            <h3 className="text-xl font-bold text-slate-900">Manage Books</h3>
            <p className="text-slate-600 text-sm mt-2">
              Add, edit, and organize your library catalog. Create new book
              records with ISBN scanning and metadata.
            </p>
            <div className="mt-4 text-sm font-medium text-brand-600">
              Manage Books →
            </div>
          </Link>

          <Link
            href="/admin/authors"
            className="card group hover:shadow-lg transition-shadow"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
              ✍️
            </div>
            <h3 className="text-xl font-bold text-slate-900">Manage Authors</h3>
            <p className="text-slate-600 text-sm mt-2">
              Create and manage author profiles with biographical information.
            </p>
            <div className="mt-4 text-sm font-medium text-brand-600">
              Manage Authors →
            </div>
          </Link>

          <Link
            href="/admin/categories"
            className="card group hover:shadow-lg transition-shadow"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
              📑
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Manage Categories
            </h3>
            <p className="text-slate-600 text-sm mt-2">
              Organize and manage book categories for better discoverability
              using Dewey/LCC classification.
            </p>
            <div className="mt-4 text-sm font-medium text-brand-600">
              Manage Categories →
            </div>
          </Link>
        </div>

        {/* Alerts */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {inventory && inventory.overdueLoans > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-900 font-semibold text-lg">
                ⚠️ {inventory.overdueLoans} Overdue Loans
              </p>
              <p className="text-amber-800 text-sm mt-1">
                Books need to be returned or renewed immediately
              </p>
            </div>
          )}

          {inventory && inventory.unpaidFines > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg">
              <p className="text-rose-900 font-semibold text-lg">
                💰 {inventory.unpaidFines.toFixed(2)} ETB Unpaid Fines
              </p>
              <p className="text-rose-800 text-sm mt-1">
                Members need to settle their fine balances
              </p>
            </div>
          )}

          {inventory && inventory.pendingReservations > 0 && (
            <div className="p-4 bg-violet-50 border border-violet-200 rounded-lg">
              <p className="text-violet-900 font-semibold text-lg">
                📋 {inventory.pendingReservations} Pending Reservations
              </p>
              <p className="text-violet-800 text-sm mt-1">
                Books ready to be fulfilled for members
              </p>
            </div>
          )}

          {inventory && inventory.outOfCirculation > 0 && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-slate-900 font-semibold text-lg">
                🚫 {inventory.outOfCirculation} Out of Circulation
              </p>
              <p className="text-slate-800 text-sm mt-1">
                Books currently unavailable for borrowing
              </p>
            </div>
          )}
        </div>

        {/* Overdue Loans Table */}
        {overdue.length > 0 && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-6">🔴 Overdue Loans Alert</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Book Title
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Member
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Borrowed
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Due Date
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">
                      Days Overdue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {overdue.map((loan) => {
                    const daysOverdue = Math.floor(
                      (Date.now() - new Date(loan.dueDate).getTime()) /
                        (1000 * 60 * 60 * 24),
                    );
                    return (
                      <tr
                        key={loan.id}
                        className="border-b border-slate-200 hover:bg-slate-50"
                      >
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {loan.bookTitle}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {loan.memberName}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {formatDate(loan.borrowDate)}
                        </td>
                        <td className="px-6 py-4 text-red-600 font-medium">
                          {formatDate(loan.dueDate)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="badge badge-rose">
                            {daysOverdue} days
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {overdue.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-2xl mb-2">✨</p>
            <p className="text-slate-600 text-lg">
              No overdue loans! Great job managing the library.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
