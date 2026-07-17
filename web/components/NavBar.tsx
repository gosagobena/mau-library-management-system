"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearSession, getStoredUser, type User } from "@/lib/api";

export default function NavBar() {
  const [user, setUser] = useState<User | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
        >
          <svg
            className="w-7 h-7 text-brand-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zm11-4a1 1 0 10-2 0v5a1 1 0 102 0V6z" />
          </svg>
          MAU Library
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/catalog"
            className="btn-ghost text-sm gap-1 flex items-center"
          >
            📚 Catalog
          </Link>
          {user && (
            <Link
              href="/dashboard"
              className="btn-ghost text-sm gap-1 flex items-center"
            >
              📖 My Library
            </Link>
          )}
          {isStaff && (
            <Link
              href="/admin"
              className="btn-ghost text-sm gap-1 flex items-center"
            >
              ⚙️ Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 hover:bg-brand-100 transition-colors"
              >
                <span className="text-sm font-medium text-brand-900">
                  {user.fullName}
                </span>
                <span className="text-xs font-semibold text-brand-600 bg-white rounded-full px-2 py-1">
                  {user.role}
                </span>
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1">
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    My Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <Link href="/login" className="btn-secondary text-sm">
                Sign In
              </Link>
              <Link href="/register" className="btn-primary text-sm">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
