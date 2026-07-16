import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "MAU Library — Mattu University",
  description:
    "Library Management System for Mattu University Main Campus: search the catalog, borrow, return, and reserve books online.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mt-16 border-t border-slate-200 py-6 text-center text-sm text-slate-500">
          Mattu University Main Campus — Library and Information Center
        </footer>
      </body>
    </html>
  );
}
