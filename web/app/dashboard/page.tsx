"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  cancelReservation,
  getMyLoans,
  getMyNotifications,
  getMyReservations,
  getStoredUser,
  renewLoan,
  returnLoan,
  type AppNotification,
  type Loan,
  type Reservation,
} from "@/lib/api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString();
}

export default function DashboardPage() {
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [l, r, n] = await Promise.all([
        getMyLoans(),
        getMyReservations(),
        getMyNotifications(),
      ]);
      setLoans(l);
      setReservations(r);
      setNotifications(n);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to load your account.");
    }
  }, []);

  useEffect(() => {
    if (!getStoredUser()) {
      router.push("/login");
      return;
    }
    load();
  }, [load, router]);

  async function act(fn: () => Promise<unknown>, success: string) {
    try {
      await fn();
      setMessage(success);
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Action failed.");
    }
  }

  const activeLoans = loans.filter((l) => l.status !== "Returned");
  const pastLoans = loans.filter((l) => l.status === "Returned");
  const unpaidFines = loans
    .filter((l) => l.fineAmount != null && l.finePaid === false)
    .reduce((sum, l) => sum + (l.fineAmount ?? 0), 0);

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold text-brand-800">My Library</h1>

      {message && (
        <p className="rounded-md bg-brand-50 px-4 py-3 text-sm text-brand-800">{message}</p>
      )}

      {unpaidFines > 0 && (
        <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You have <strong>{unpaidFines} ETB</strong> in unpaid fines. Please settle them at
          the circulation desk.
        </p>
      )}

      <section>
        <h2 className="text-lg font-semibold">Current Loans</h2>
        {activeLoans.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">You have no active loans.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-3">Book</th>
                  <th className="px-4 py-3">Borrowed</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {activeLoans.map((loan) => (
                  <tr key={loan.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium">{loan.bookTitle}</td>
                    <td className="px-4 py-3">{formatDate(loan.borrowDate)}</td>
                    <td className="px-4 py-3">{formatDate(loan.dueDate)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          loan.status === "Overdue"
                            ? "font-medium text-red-600"
                            : "text-green-700"
                        }
                      >
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() =>
                            act(() => renewLoan(loan.id), "Loan renewed for 14 more days.")
                          }
                          className="rounded-md border border-brand-600 px-3 py-1 text-brand-700 hover:bg-brand-50"
                        >
                          Renew
                        </button>
                        <button
                          onClick={() =>
                            act(() => returnLoan(loan.id), "Book returned. Thank you!")
                          }
                          className="rounded-md bg-brand-600 px-3 py-1 text-white hover:bg-brand-700"
                        >
                          Return
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Reservations</h2>
        {reservations.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">You have no reservations.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {reservations.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                <div>
                  <span className="font-medium">{r.bookTitle}</span>
                  <span className="ml-3 text-slate-500">
                    {r.status}
                    {r.expiresAt ? ` — collect by ${formatDate(r.expiresAt)}` : ""}
                  </span>
                </div>
                {r.status === "Pending" && (
                  <button
                    onClick={() =>
                      act(() => cancelReservation(r.id), "Reservation cancelled.")
                    }
                    className="rounded-md border px-3 py-1 text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Notifications</h2>
        {notifications.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No notifications.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`rounded-xl border px-4 py-3 text-sm ${
                  n.read
                    ? "border-slate-200 bg-white text-slate-500"
                    : "border-brand-100 bg-brand-50 text-slate-800"
                }`}
              >
                {n.message}
                <span className="ml-2 text-xs text-slate-400">
                  {formatDate(n.sentAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {pastLoans.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Borrowing History</h2>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            {pastLoans.map((loan) => (
              <li key={loan.id}>
                {loan.bookTitle} — returned {loan.returnDate ? formatDate(loan.returnDate) : ""}
                {loan.fineAmount ? ` (fine: ${loan.fineAmount} ETB)` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
