"use client";

import { useCallback, useEffect, useState } from "react";
import {
  borrowBook,
  getCategories,
  getStoredUser,
  reserveBook,
  searchBooks,
  type Book,
  type Category,
} from "@/lib/api";

export default function CatalogPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const pageSize = 12;
  const signedIn = typeof window !== "undefined" && !!getStoredUser();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await searchBooks({ search, categoryId, page, pageSize });
      setBooks(result.items);
      setTotal(result.total);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to load catalog.");
    } finally {
      setLoading(false);
    }
  }, [search, categoryId, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  async function handleBorrow(bookId: string) {
    try {
      await borrowBook(bookId);
      setMessage("Book borrowed successfully. Check My Library for the due date.");
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not borrow this book.");
    }
  }

  async function handleReserve(bookId: string) {
    try {
      await reserveBook(bookId);
      setMessage("Reservation placed. You'll be notified when the book is available.");
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not reserve this book.");
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-800">Book Catalog</h1>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          placeholder="Search by title, author, or ISBN…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2"
        />
        <select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-slate-300 px-3 py-2"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {message && (
        <p className="mt-4 rounded-md bg-brand-50 px-4 py-3 text-sm text-brand-800">
          {message}
        </p>
      )}

      {loading ? (
        <p className="mt-8 text-slate-500">Loading catalog…</p>
      ) : books.length === 0 ? (
        <p className="mt-8 text-slate-500">No books match your search.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <div
              key={book.id}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-5"
            >
              <h2 className="font-semibold text-slate-900">{book.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{book.authorName}</p>
              <p className="mt-1 text-xs text-slate-400">
                {book.categoryName} · ISBN {book.isbn}
              </p>
              <p
                className={`mt-3 text-sm font-medium ${
                  book.copiesAvailable > 0 ? "text-green-700" : "text-red-600"
                }`}
              >
                {book.copiesAvailable > 0
                  ? `${book.copiesAvailable} of ${book.copiesTotal} available`
                  : "All copies on loan"}
              </p>
              {signedIn && (
                <div className="mt-4">
                  {book.copiesAvailable > 0 ? (
                    <button
                      onClick={() => handleBorrow(book.id)}
                      className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                    >
                      Borrow
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReserve(book.id)}
                      className="w-full rounded-lg border border-brand-600 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
                    >
                      Reserve
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4 text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-md border px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md border px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
