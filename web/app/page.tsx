import Link from "next/link";

export default function HomePage() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-transparent to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent">
                MAU Library
              </span>
            </h1>
            <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Discover thousands of books, manage your loans, and explore the
              world of knowledge at Mattu University's modern digital library
              platform.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/catalog" className="btn-primary text-lg">
                <span>🔍</span> Browse the Catalog
              </Link>
              <Link href="/register" className="btn-secondary text-lg">
                <span>📝</span> Create an Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gradient-brand">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center text-white">
              <div className="text-4xl font-bold">50K+</div>
              <p className="text-brand-100 mt-2">Books Available</p>
            </div>
            <div className="text-center text-white">
              <div className="text-4xl font-bold">10K+</div>
              <p className="text-brand-100 mt-2">Active Members</p>
            </div>
            <div className="text-center text-white">
              <div className="text-4xl font-bold">24/7</div>
              <p className="text-brand-100 mt-2">Online Access</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900">
              Powerful Features
            </h2>
            <p className="text-lg text-slate-600 mt-4">
              Everything you need for a seamless library experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🔍",
                title: "Smart Search",
                description:
                  "Find books instantly by title, author, ISBN, or subject category with advanced filtering.",
              },
              {
                icon: "📚",
                title: "Easy Borrowing",
                description:
                  "Borrow and return books with just a few clicks. Automatic due-date reminders keep you updated.",
              },
              {
                icon: "🔔",
                title: "Smart Notifications",
                description:
                  "Get real-time alerts for due dates, overdue items, and when reserved books arrive.",
              },
              {
                icon: "⏱️",
                title: "Renew Instantly",
                description:
                  "Extend your loan periods online without visiting the library desk.",
              },
              {
                icon: "📋",
                title: "Reservations",
                description:
                  "Reserve books in advance and get notified when they're ready for pickup.",
              },
              {
                icon: "💰",
                title: "Fine Tracking",
                description:
                  "Monitor your account balance and pay any fines directly through the platform.",
              },
            ].map((feature) => (
              <div key={feature.title} className="card group hover:shadow-lg">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-light">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-slate-900">
            Ready to Get Started?
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Join thousands of students and faculty members already using MAU
            Library to manage their reading and research.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary">
              Create Your Free Account
            </Link>
            <Link href="/catalog" className="btn-secondary">
              Explore the Catalog
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
