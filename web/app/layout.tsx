import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "MAU Library — Mattu University",
  description:
    "Library Management System for Mattu University Main Campus: search the catalog, borrow, return, and reserve books online.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        <main className="min-h-screen">{children}</main>
        <footer className="mt-20 border-t border-slate-200 bg-slate-900 text-white py-12">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="font-bold text-lg mb-4">MAU Library</h3>
                <p className="text-slate-400 text-sm">
                  Your gateway to knowledge and learning at Mattu University.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <ul className="text-slate-400 text-sm space-y-2">
                  <li>
                    <a href="/catalog" className="hover:text-white transition">
                      Browse Catalog
                    </a>
                  </li>
                  <li>
                    <a
                      href="/dashboard"
                      className="hover:text-white transition"
                    >
                      My Library
                    </a>
                  </li>
                  <li>
                    <a href="/about" className="hover:text-white transition">
                      About Us
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <ul className="text-slate-400 text-sm space-y-2">
                  <li>
                    <a href="#" className="hover:text-white transition">
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition">
                      Contact Us
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition">
                      FAQs
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Hours</h4>
                <ul className="text-slate-400 text-sm space-y-1">
                  <li>Mon - Fri: 8AM - 8PM</li>
                  <li>Saturday: 9AM - 5PM</li>
                  <li>Sunday: Closed</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-700 pt-8 text-center text-slate-400 text-sm">
              <p>
                &copy; 2026 Mattu University Main Campus — Library and
                Information Center. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
