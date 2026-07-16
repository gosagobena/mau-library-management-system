# MAU Library Management System

Modern library management system for **Mattu University Main Campus**, built with an **ASP.NET Core (C#) REST API**, **PostgreSQL**, and a **Next.js** frontend.

The system replaces the university's manual, paper-based circulation process with a secure, self-service web application — giving members instant catalog search and borrowing, and giving librarians and administrators real-time inventory, circulation, and reporting tools.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Quick Start with Docker](#quick-start-with-docker)
  - [Manual Setup](#manual-setup)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Default Admin Account](#default-admin-account)
- [Testing](#testing)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Features

- 🔍 **Catalog search** — find books by title, author, ISBN, or category
- 📚 **Circulation** — borrow, return, renew, and reserve books with automatic due-date tracking
- 💰 **Automatic fine calculation** for overdue items (configurable daily rate)
- 🔐 **Role-based access control** for Members, Librarians, and Administrators
- 🔔 **Notifications** for due dates, overdue items, and reservation availability
- 📊 **Admin dashboards** for inventory management and usage reporting
- 🔒 **JWT-based authentication** with BCrypt-hashed passwords and HTTPS everywhere
- 🐳 **Containerized deployment** via Docker Compose for consistent, repeatable installs

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (React, TypeScript), Tailwind CSS |
| Backend / API | ASP.NET Core 8 (C#) |
| ORM | Entity Framework Core (Npgsql provider) |
| Database | PostgreSQL 16 |
| Authentication | JWT Bearer Tokens |
| API Documentation | Swagger / OpenAPI |
| Containerization | Docker & Docker Compose |
| Reverse Proxy | Nginx |

## Architecture

The system follows a layered, three-tier architecture. The Next.js frontend never talks to the database directly — it only calls the ASP.NET Core REST API over HTTPS. The API enforces authentication, authorization, and business rules, and delegates all data access to Entity Framework Core.

```
┌──────────────────────┐      HTTPS       ┌──────────────────────────┐    SQL (Npgsql)    ┌────────────────┐
│   Next.js Frontend   │ ───────────────▶ │  ASP.NET Core Web API    │ ─────────────────▶ │  PostgreSQL 16 │
│  (React, TypeScript) │ ◀─────────────── │  (Controllers, Services, │ ◀───────────────── │    Database    │
│                      │   REST / JSON    │   EF Core, JWT Auth)     │                    │                │
└──────────────────────┘                  └──────────────────────────┘                    └────────────────┘
```

Full UML diagrams (use case, class, sequence, deployment) are available in [docs/](docs/).

## Getting Started

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org/)
- [PostgreSQL 16](https://www.postgresql.org/download/) (or use the Docker setup below)
- [Docker & Docker Compose](https://docs.docker.com/compose/) (recommended)

### Quick Start with Docker

The fastest way to run the full stack locally:

```bash
# 1. Clone the repository
git clone https://github.com/gosagobena/mau-library-management-system.git
cd mau-library-management-system

# 2. Configure environment variables
cp .env.example .env
# Edit .env: set DB_PASSWORD and generate a JWT_KEY (e.g. openssl rand -base64 48)

# 3. Build and start all services (frontend, API, database, reverse proxy)
docker compose up -d --build
```

Database migrations and seed data are applied automatically when the API starts.

The app will be available at **http://localhost**, and the API docs at **http://localhost/api/swagger**.

### Manual Setup

<details>
<summary>Click to expand backend and frontend setup without Docker</summary>

**Backend (API):**

```bash
cd api

# Point at your local PostgreSQL in appsettings.Development.json, then:
dotnet restore

# Create the initial EF Core migration (first time only)
dotnet tool install --global dotnet-ef
dotnet ef migrations add InitialCreate

# Run — migrations apply automatically at startup
dotnet run
```

The API listens on `http://localhost:5000` (or as configured) with Swagger at `/swagger`.

**Frontend (Web):**

```bash
cd web
npm install

# Point the frontend at the API
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local

npm run dev
```

The frontend runs at `http://localhost:3000`.

</details>

## Project Structure

```
mau-library-management-system/
├── api/                        # ASP.NET Core Web API (C#)
│   ├── Controllers/            # REST endpoints
│   ├── Services/               # Business logic (loans, reservations, fines, auth)
│   ├── Models/                 # Domain entities
│   ├── Data/                   # EF Core DbContext, seeding & migrations
│   ├── DTOs/                   # Request/response contracts
│   └── Extensions/             # Shared helpers
├── web/                        # Next.js frontend (React, TypeScript)
│   ├── app/                    # App Router pages (catalog, dashboard, admin, auth)
│   ├── components/             # Shared React components
│   └── lib/                    # Typed API client
├── tests/
│   └── LibrarySystem.Api.Tests/  # xUnit unit tests
├── nginx/                      # Reverse proxy configuration
├── docs/                       # Project documentation & UML diagrams
├── docker-compose.yml          # Multi-container orchestration
├── .env.example                # Environment variable template
└── README.md
```

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DB_PASSWORD` | PostgreSQL password (used by Docker Compose) | `changeme` |
| `JWT_KEY` | Signing key for JWT access tokens (≥ 32 chars) | `a-long-random-secret` |
| `JWT_ISSUER` / `JWT_AUDIENCE` | JWT issuer/audience claims | `https://library.mau.edu.et` |
| `FINE_RATE_PER_DAY` | Overdue fine rate in ETB per day | `5` |
| `WEB_ORIGIN` | Allowed CORS origin for the API | `http://localhost` |
| `NEXT_PUBLIC_API_URL` | Base URL the frontend uses to call the API | `http://localhost/api` |

See [.env.example](.env.example) for the full list.

## API Overview

The API is documented via Swagger/OpenAPI at `/swagger`. Core endpoints include:

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/auth/register` | Register a new member | Public |
| POST | `/api/auth/login` | Authenticate and receive a JWT | Public |
| GET | `/api/books` | Search / list the catalog | Public |
| POST | `/api/books` | Add a book to inventory | Librarian/Admin |
| POST | `/api/loans` | Borrow a book | Member |
| GET | `/api/loans/mine` | My loans & borrowing history | Member |
| PUT | `/api/loans/{id}/return` | Return a borrowed book | Member/Staff |
| PUT | `/api/loans/{id}/renew` | Renew an active loan | Member/Staff |
| POST | `/api/reservations` | Reserve a book | Member |
| GET | `/api/reports/overdue` | Overdue loans report | Librarian/Admin |
| GET | `/api/reports/inventory` | Inventory status report | Librarian/Admin |
| PUT | `/api/users/{id}/role` | Change a user's role | Admin |

**Business rules enforced by the API** (from the project documentation):

- Members may hold at most **5 active loans**; the loan period is **14 days**
- A book with no available copies can be **reserved**; reservations expire **3 days** after the book becomes available
- Overdue fines accrue at a **configurable daily rate** (default 5 ETB/day)
- Damaged/missing books can be marked **out of circulation**
- Auth endpoints are **rate-limited** to reduce brute-force risk

## Default Admin Account

On first startup the API seeds an administrator account:

- **Email:** `admin@mau.edu.et`
- **Password:** `ChangeMe123!`

> ⚠️ Change these immediately via the `Seed:AdminEmail` / `Seed:AdminPassword` configuration keys before deploying, and rotate the password after first login.

## Testing

```bash
# Backend unit tests (xUnit)
cd tests/LibrarySystem.Api.Tests
dotnet test

# Frontend unit tests (Jest + React Testing Library)
cd web
npm test

# End-to-end tests (Playwright)
npm run test:e2e
```

## Roadmap

- [ ] Mobile app (reusing the existing REST API)
- [ ] QR/barcode scanning for check-in/check-out
- [ ] SMS notification support
- [ ] Accessibility (WCAG) improvements
- [ ] CI/CD pipeline for automated testing & deployment

## Contributing

Contributions are welcome. Please open an issue to discuss significant changes before submitting a pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a pull request

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgments

Developed for the **Mattu University Main Campus Library and Information Center**, as part of an effort to modernize library operations through a secure, scalable, and maintainable digital solution.
#   m a u - l i b r a r y - m a n a g e m e n t - s y s t e m  
 