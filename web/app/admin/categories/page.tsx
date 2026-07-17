"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, getCategories, createCategory } from "@/lib/api";

interface Category {
  id: string;
  name: string;
}

export default function ManageCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "" });

  useEffect(() => {
    const user = getStoredUser();
    if (!user || (user.role !== "Administrator" && user.role !== "Librarian")) {
      router.push("/login");
      return;
    }
    loadCategories();
  }, [router]);

  async function loadCategories() {
    try {
      const data = await getCategories();
      setCategories(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load categories",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCategory() {
    try {
      if (!newCategory.name.trim()) {
        setError("Category name is required");
        return;
      }
      await createCategory(newCategory);
      await loadCategories();
      setNewCategory({ name: "" });
      setShowForm(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add category");
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-light px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              📑 Manage Categories
            </h1>
            <p className="text-slate-600 mt-2">
              Organize books by subject and category
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
          >
            ➕ Add New Category
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {showForm && (
          <div className="mb-8 card">
            <h2 className="text-2xl font-bold mb-6">Add New Category</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ name: e.target.value })}
                  placeholder="e.g., Science Fiction, History, Technology"
                  className="input-base"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddCategory} className="btn-primary">
                  Add Category
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

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="card">
              <div className="text-4xl mb-3">📑</div>
              <h3 className="text-lg font-bold text-slate-900">
                {category.name}
              </h3>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-slate-600 text-lg">No categories yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
