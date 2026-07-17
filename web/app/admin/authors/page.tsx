"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, getAuthors, createAuthor } from "@/lib/api";

interface Author {
  id: string;
  name: string;
  biography?: string;
}

export default function ManageAuthorsPage() {
  const router = useRouter();
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newAuthor, setNewAuthor] = useState({ name: "", biography: "" });

  useEffect(() => {
    const user = getStoredUser();
    if (!user || (user.role !== "Administrator" && user.role !== "Librarian")) {
      router.push("/login");
      return;
    }
    loadAuthors();
  }, [router]);

  async function loadAuthors() {
    try {
      const data = await getAuthors();
      setAuthors(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load authors");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddAuthor() {
    try {
      if (!newAuthor.name.trim()) {
        setError("Author name is required");
        return;
      }
      await createAuthor(newAuthor);
      await loadAuthors();
      setNewAuthor({ name: "", biography: "" });
      setShowForm(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add author");
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-light px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              ✍️ Manage Authors
            </h1>
            <p className="text-slate-600 mt-2">
              Create and manage author profiles
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
          >
            ➕ Add New Author
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {showForm && (
          <div className="mb-8 card">
            <h2 className="text-2xl font-bold mb-6">Add New Author</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Author Name *
                </label>
                <input
                  type="text"
                  value={newAuthor.name}
                  onChange={(e) =>
                    setNewAuthor({ ...newAuthor, name: e.target.value })
                  }
                  placeholder="Enter author name"
                  className="input-base"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Biography
                </label>
                <textarea
                  value={newAuthor.biography}
                  onChange={(e) =>
                    setNewAuthor({ ...newAuthor, biography: e.target.value })
                  }
                  placeholder="Enter author biography"
                  rows={4}
                  className="input-base"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddAuthor} className="btn-primary">
                  Add Author
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {authors.map((author) => (
            <div key={author.id} className="card">
              <div className="text-3xl mb-3">✍️</div>
              <h3 className="text-lg font-bold text-slate-900">
                {author.name}
              </h3>
              {author.biography && (
                <p className="text-slate-600 text-sm mt-2 line-clamp-3">
                  {author.biography}
                </p>
              )}
            </div>
          ))}
        </div>

        {authors.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-slate-600 text-lg">No authors yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
