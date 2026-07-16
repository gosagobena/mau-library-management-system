import Link from "next/link";

export default function HomePage() {
  return (
    <div className="py-12 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-brand-800">
        Mattu University Library
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
        Search the catalog, borrow and reserve books, and track your loans —
        anytime, from any device.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Link
          href="/catalog"
          className="rounded-lg bg-brand-600 px-6 py-3 font-medium text-white hover:bg-brand-700"
        >
          Browse the Catalog
        </Link>
        <Link
          href="/register"
          className="rounded-lg border border-brand-600 px-6 py-3 font-medium text-brand-700 hover:bg-brand-50"
        >
          Create an Account
        </Link>
      </div>

      <div className="mx-auto mt-16 grid max-w-4xl gap-6 text-left sm:grid-cols-3">
        {[
          {
            title: "🔍 Instant Search",
            body: "Find books by title, author, ISBN, or category in seconds.",
          },
          {
            title: "📚 Self-Service Borrowing",
            body: "Borrow, renew, and reserve books with automatic due-date tracking.",
          },
          {
            title: "🔔 Smart Notifications",
            body: "Get notified about due dates, overdue items, and reservations.",
          },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-brand-800">{f.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
