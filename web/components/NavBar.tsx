"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearSession, getStoredUser, type User } from "@/lib/api";

export default function NavBar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  function handleLogout() {
    clearSession();
    setUser(null);
    window.location.href = "/";
  }

  const isStaff = user?.role === "Librarian" || user?.role === "Administrator";

  return (
    <header className="bg-brand-800 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          MAU Library
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/catalog" className="hover:text-brand-100">
            Catalog
          </Link>
          {user && (
            <Link href="/dashboard" className="hover:text-brand-100">
              My Library
            </Link>
          )}
          {isStaff && (
            <Link href="/admin" className="hover:text-brand-100">
              Admin
            </Link>
          )}
          {user ? (
            <button
              onClick={handleLogout}
              className="rounded-md bg-brand-600 px-3 py-1.5 hover:bg-brand-700"
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-brand-600 px-3 py-1.5 hover:bg-brand-700"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
