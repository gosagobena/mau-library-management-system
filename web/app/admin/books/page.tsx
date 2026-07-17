"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getStoredUser,
  searchBooks,
  createBook,
  updateBook,
  deleteBook,
  getAuthors,
  getCategories,
  createAuthor,
  createCategory,
  type Book,
} from "@/lib/api";

interface Author {
  id: string;
  name: string;
  biography?: string;
}

interface Category {
  id: string;
  name: string;
}

export default function ManageBooksPage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showAuthorForm, setShowAuthorForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    isbn: "",
    authorId: "",
    categoryId: "",
    copiesTotal: 1,
    copiesAvailable: 1,
    outOfCirculation: false,
  });

  const [newAuthor, setNewAuthor] = useState({ name: "", biography: "" });
  const [newCategory, setNewCategory] = useState({ name: "" });

  useEffect(() => {
    const user = getStoredUser();
    if (!user || (user.role !== "Administrator" && user.role !== "Librarian")) {
      router.push("/login");
      return;
    }
    loadData();
  }, [router]);

  async function loadData() {
    try {
      setLoading(true);
      const [booksData, authorsData, categoriesData] = await Promise.all([
        searchBooks({ pageSize: 100 }),
        getAuthors(),
        getCategories(),
      ]);
      setBooks(booksData.items);
      setAuthors(authorsData);
      setCategories(categoriesData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveBook() {
    try {
      if (
        !formData.title ||
        !formData.isbn ||
        !formData.authorId ||
        !formData.categoryId
      ) {
        setError("Please fill in all required fields");
        return;
      }

      if (editingBook) {
        await updateBook(editingBook.id, {
          ...formData,
          copiesAvailable: Math.min(
            formData.copiesAvailable,
            formData.copiesTotal,
          ),
        });
      } else {
        await createBook({
          title: formData.title,
          isbn: formData.isbn,
          authorId: formData.authorId,
          categoryId: formData.categoryId,
          copiesTotal: formData.copiesTotal,
        });
      }

      await loadData();
      setShowForm(false);
      setFormData({
        title: "",
        isbn: "",
        authorId: "",
        categoryId: "",
        copiesTotal: 1,
        copiesAvailable: 1,
        outOfCirculation: false,
      });
      setEditingBook(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save book");
    }
  }

  async function handleDeleteBook(bookId: string) {
    if (!confirm("Are you sure you want to delete this book?")) return;
    try {
      await deleteBook(bookId);
      await loadData();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete book");
    }
  }

  async function handleAddAuthor() {
    try {
      if (!newAuthor.name) {
        setError("Author name is required");
        return;
      }
      await createAuthor(newAuthor);
      await loadData();
      setNewAuthor({ name: "", biography: "" });
      setShowAuthorForm(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add author");
    }
  }

  async function handleAddCategory() {
    try {
      if (!newCategory.name) {
        setError("Category name is required");
        return;
      }
      await createCategory(newCategory);
      await loadData();
      setNewCategory({ name: "" });
      setShowCategoryForm(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add category");
    }
  }

  function handleEditBook(book: Book) {
    setEditingBook(book);
    setFormData({
      title: book.title,
      isbn: book.isbn,
      authorId: book.authorId,
      categoryId: book.categoryId,
      copiesTotal: book.copiesTotal,
      copiesAvailable: book.copiesAvailable,
      outOfCirculation: book.outOfCirculation,
    });
    setShowForm(true);
  }

  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.isbn.includes(searchTerm),
  );

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-light px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              📚 Manage Books
            </h1>
            <p className="text-slate-600 mt-2">
              Add, edit, and manage your library catalog
            </p>
          </div>
          <button
            onClick={() => {
              setEditingBook(null);
              setFormData({
                title: "",
                isbn: "",
                authorId: "",
                categoryId: "",
                copiesTotal: 1,
                copiesAvailable: 1,
                outOfCirculation: false,
              });
              setShowForm(!showForm);
            }}
            className="btn-primary"
          >
            ➕ Add New Book
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Quick Action Buttons */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setShowAuthorForm(!showAuthorForm)}
            className="btn-secondary text-sm"
          >
            ✍️ Add Author
          </button>
          <button
            onClick={() => setShowCategoryForm(!showCategoryForm)}
            className="btn-secondary text-sm"
          >
            📑 Add Category
          </button>
        </div>

        {/* Add Book Form */}
        {showForm && (
          <div className="mb-8 card">
            <h2 className="text-2xl font-bold mb-6">
              {editingBook ? "Edit Book" : "Add New Book"}
            </h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Book Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Enter book title"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    ISBN *
                  </label>
                  <input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) =>
                      setFormData({ ...formData, isbn: e.target.value })
                    }
                    placeholder="Enter 13-digit ISBN"
                    className="input-base"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Author *
                  </label>
                  <select
                    value={formData.authorId}
                    onChange={(e) =>
                      setFormData({ ...formData, authorId: e.target.value })
                    }
                    className="input-base"
                  >
                    <option value="">Select an author</option>
                    {authors.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                    className="input-base"
                  >
                    <option value="">Select a category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Total Copies
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.copiesTotal}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        copiesTotal: parseInt(e.target.value) || 1,
                      })
                    }
                    className="input-base"
                  />
                </div>
                {editingBook && (
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Available Copies
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={formData.copiesTotal}
                      value={formData.copiesAvailable}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          copiesAvailable: parseInt(e.target.value) || 0,
                        })
                      }
                      className="input-base"
                    />
                  </div>
                )}
              </div>

              {editingBook && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="outOfCirculation"
                    checked={formData.outOfCirculation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        outOfCirculation: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <label
                    htmlFor="outOfCirculation"
                    className="text-sm font-medium"
                  >
                    Mark as out of circulation
                  </label>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button onClick={handleSaveBook} className="btn-primary">
                  {editingBook ? "Update Book" : "Add Book"}
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

        {/* Add Author Form */}
        {showAuthorForm && (
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
                  rows={3}
                  className="input-base"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddAuthor} className="btn-primary">
                  Add Author
                </button>
                <button
                  onClick={() => setShowAuthorForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Category Form */}
        {showCategoryForm && (
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
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, name: e.target.value })
                  }
                  placeholder="Enter category name"
                  className="input-base"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddCategory} className="btn-primary">
                  Add Category
                </button>
                <button
                  onClick={() => setShowCategoryForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search Books */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="🔍 Search books by title or ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-base w-full"
          />
        </div>

        {/* Books Table */}
        <div className="overflow-x-auto card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Title
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  ISBN
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Author
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Category
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold">
                  Copies
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold">
                  Available
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.map((book) => (
                <tr
                  key={book.id}
                  className="border-b border-slate-200 hover:bg-slate-50"
                >
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {book.title}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{book.isbn}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {book.authorName}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {book.categoryName}
                  </td>
                  <td className="px-6 py-4 text-center font-medium">
                    {book.copiesTotal}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`badge ${book.copiesAvailable > 0 ? "badge-emerald" : "badge-rose"}`}
                    >
                      {book.copiesAvailable}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {book.outOfCirculation ? (
                      <span className="badge badge-amber">
                        Out of Circulation
                      </span>
                    ) : (
                      <span className="badge badge-emerald">Active</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center space-x-2 flex justify-center">
                    <button
                      onClick={() => handleEditBook(book)}
                      className="btn-ghost text-sm"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBook(book.id)}
                      className="btn-ghost text-sm text-red-600"
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBooks.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-slate-600 text-lg">No books found</p>
          </div>
        )}
      </div>
    </div>
  );
}
