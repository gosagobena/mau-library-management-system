// Typed API client — every request/response shape is checked at compile time (Section 5.1.1).

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

// ── Types (mirror the API DTOs) ──────────────────────────

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: "Member" | "Librarian" | "Administrator";
  isActive: boolean;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface Book {
  id: string;
  title: string;
  isbn: string;
  authorId: string;
  authorName: string;
  categoryId: string;
  categoryName: string;
  copiesTotal: number;
  copiesAvailable: number;
  outOfCirculation: boolean;
}

export interface Category {
  id: string;
  name: string;
}

export interface Loan {
  id: string;
  bookId: string;
  bookTitle: string;
  userId: string;
  memberName: string;
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  status: "Active" | "Returned" | "Overdue";
  fineAmount: number | null;
  finePaid: boolean | null;
}

export interface Reservation {
  id: string;
  bookId: string;
  bookTitle: string;
  userId: string;
  reservedAt: string;
  expiresAt: string | null;
  status: "Pending" | "Fulfilled" | "Cancelled" | "Expired";
}

export interface AppNotification {
  id: string;
  message: string;
  type: string;
  sentAt: string;
  read: boolean;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Token storage ────────────────────────────────────────

const TOKEN_KEY = "mau_lms_token";
const USER_KEY = "mau_lms_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
}

export function storeSession(auth: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, auth.token);
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ── Core fetch wrapper ───────────────────────────────────

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ── Auth ─────────────────────────────────────────────────

export function register(fullName: string, email: string, password: string) {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ fullName, email, password }),
  });
}

export function login(email: string, password: string) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// ── Catalog ──────────────────────────────────────────────

export function searchBooks(params: {
  search?: string;
  categoryId?: string;
  page?: number;
  pageSize?: number;
}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  return request<PagedResult<Book>>(`/books?${query.toString()}`);
}

export function getBook(id: string) {
  return request<Book>(`/books/${id}`);
}

export function createBook(data: {
  title: string;
  isbn: string;
  authorId: string;
  categoryId: string;
  copiesTotal: number;
}) {
  return request<Book>("/books", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateBook(
  id: string,
  data: {
    title: string;
    isbn: string;
    authorId: string;
    categoryId: string;
    copiesTotal: number;
    copiesAvailable: number;
    outOfCirculation: boolean;
  },
) {
  return request<Book>(`/books/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteBook(id: string) {
  return request<void>(`/books/${id}`, { method: "DELETE" });
}

export function getAuthors() {
  return request<any[]>("/authors");
}

export function createAuthor(data: { name: string; biography?: string }) {
  return request<any>("/authors", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getCategories() {
  return request<Category[]>("/categories");
}

export function createCategory(data: { name: string }) {
  return request<Category>("/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Circulation ──────────────────────────────────────────

export function borrowBook(bookId: string) {
  return request<Loan>("/loans", {
    method: "POST",
    body: JSON.stringify({ bookId }),
  });
}

export function returnLoan(loanId: string) {
  return request<Loan>(`/loans/${loanId}/return`, { method: "PUT" });
}

export function renewLoan(loanId: string) {
  return request<Loan>(`/loans/${loanId}/renew`, { method: "PUT" });
}

export function getMyLoans() {
  return request<Loan[]>("/loans/mine");
}

export function reserveBook(bookId: string) {
  return request<Reservation>("/reservations", {
    method: "POST",
    body: JSON.stringify({ bookId }),
  });
}

export function getMyReservations() {
  return request<Reservation[]>("/reservations/mine");
}

export function cancelReservation(id: string) {
  return request<Reservation>(`/reservations/${id}`, { method: "DELETE" });
}

// ── Notifications ────────────────────────────────────────

export function getMyNotifications() {
  return request<AppNotification[]>("/notifications/mine");
}

// ── Reports (staff) ──────────────────────────────────────

export function getOverdueReport() {
  return request<Loan[]>("/reports/overdue");
}

export interface InventoryReport {
  totalTitles: number;
  totalCopies: number;
  availableCopies: number;
  outOfCirculation: number;
  activeLoans: number;
  overdueLoans: number;
  pendingReservations: number;
  unpaidFines: number;
}

export function getInventoryReport() {
  return request<InventoryReport>("/reports/inventory");
}
