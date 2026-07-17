# MAU Library Management System

> A modern, secure, and scalable library platform for Mattu University
> Main Campus.

[![.NET 8](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=nextdotjs)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com/)

This system modernizes the university's manual library workflow by
replacing paper-based circulation with a self-service web application.
Members can search the catalog and borrow books easily, while
librarians and administrators gain real-time tools for inventory,
circulation, and reporting.

## ✨ Highlights

- 🔍 Search books by title, author, ISBN, or category
- 📚 Borrow, return, renew, and reserve books with automated due-date
  tracking
- 💰 Automatically calculate overdue fines based on a configurable daily
  rate
- 🔐 Support role-based access for members, librarians, and
  administrators
- 🔔 Send notifications for due dates, overdue items, and reservation
  availability
- 📊 Provide dashboards for inventory management and reporting
- 🐳 Deploy the full stack consistently with Docker Compose

## 🧰 Tech Stack

| Layer            | Technology                           |
| ---------------- | ------------------------------------ |
| Frontend         | Next.js, React, TypeScript, Tailwind |
| Backend          | ASP.NET Core 8 (C#)                  |
| ORM              | Entity Framework Core with Npgsql    |
| Database         | PostgreSQL 16                        |
| Authentication   | JWT Bearer Tokens                    |
| API Docs         | Swagger / OpenAPI                    |
| Containerization | Docker & Docker Compose              |
| Reverse Proxy    | Nginx                                |

## 🏗️ Architecture

The system follows a layered, three-tier architecture. The frontend
communicates with the ASP.NET Core API over HTTPS, while the API
enforces authentication, authorization, and business rules before
interacting with PostgreSQL through Entity Framework Core.

```text
┌──────────────────────┐      HTTPS       ┌──────────────────────────┐
│   Next.js Frontend   │ ───────────────▶ │  ASP.NET Core Web API    │
│  (React, TypeScript) │ ◀─────────────── │  (Controllers, Services, │
│                      │   REST / JSON    │   EF Core, JWT Auth)     │
└──────────────────────┘                  └──────────────────────────┘
```

Full UML diagrams and additional documentation are available in the
[docs](docs) folder.

## 🚀 Getting Started

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org/)
- [PostgreSQL 16](https://www.postgresql.org/download/)
- [Docker & Docker Compose](https://docs.docker.com/compose/)
  (recommended)

### Quick Start with Docker

```bash
git clone https://github.com/gosagobena/mau-library-management-system.git
cd mau-library-management-system
cp .env.example .env
# Edit .env and set DB_PASSWORD and a secure JWT_KEY
docker compose up -d --build
```

The app will be available at
[http://localhost](http://localhost), and the API documentation at
[http://localhost/api/swagger](http://localhost/api/swagger).

### Manual Setup

#### Backend (API)

```bash
cd api
dotnet restore
dotnet run
```

The API listens on [http://localhost:5000](http://localhost:5000) and
exposes Swagger at [/swagger](/swagger).

#### Frontend (Web)

```bash
cd web
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
npm run dev
```

The frontend runs at [http://localhost:3000](http://localhost:3000).

## 📁 Project Structure

```text
mau-library-management-system/
├── api/                        # ASP.NET Core Web API
├── web/                        # Next.js frontend
├── tests/                      # Backend unit tests
├── nginx/                      # Reverse proxy config
├── docs/                       # Documentation and UML diagrams
├── docker-compose.yml          # Multi-container orchestration
├── .env.example                # Environment variable template
└── README.md
```

## ⚙️ Environment Variables

| Variable                  | Description                    | Example                                                  |
| ------------------------- | ------------------------------ | -------------------------------------------------------- |
| DB_PASSWORD               | PostgreSQL password            | changeme                                                 |
| JWT_KEY                   | JWT signing key                | a-long-random-secret                                     |
| JWT_ISSUER / JWT_AUDIENCE | JWT issuer and audience claims | [https://library.mau.edu.et](https://library.mau.edu.et) |
| FINE_RATE_PER_DAY         | Overdue fine rate (ETB/day)    | 5                                                        |
| WEB_ORIGIN                | Allowed CORS origin            | [http://localhost](http://localhost)                     |
| NEXT_PUBLIC_API_URL       | Frontend API base URL          | [http://localhost/api](http://localhost/api)             |

## 🔌 API Overview

The API is documented with Swagger/OpenAPI at /swagger. Core endpoints
include:

| Method | Endpoint               | Description                    | Access          |
| ------ | ---------------------- | ------------------------------ | --------------- |
| POST   | /api/auth/register     | Register a new member          | Public          |
| POST   | /api/auth/login        | Authenticate and receive a JWT | Public          |
| GET    | /api/books             | Search or list the catalog     | Public          |
| POST   | /api/books             | Add a book to inventory        | Librarian/Admin |
| POST   | /api/loans             | Borrow a book                  | Member          |
| GET    | /api/loans/mine        | View my loans and history      | Member          |
| PUT    | /api/loans/{id}/return | Return a borrowed book         | Member/Staff    |
| PUT    | /api/loans/{id}/renew  | Renew an active loan           | Member/Staff    |
| POST   | /api/reservations      | Reserve a book                 | Member          |
| GET    | /api/reports/overdue   | Retrieve overdue reports       | Librarian/Admin |
| GET    | /api/reports/inventory | Retrieve inventory reports     | Librarian/Admin |
| PUT    | /api/users/{id}/role   | Change a user's role           | Admin           |

### Business Rules

- Members may hold at most 5 active loans, with a loan period of 14 days
- Books with no available copies can be reserved, and reservations expire
  after 3 days
- Overdue fines accrue at a configurable daily rate (default: 5 ETB/day)
- Damaged or missing books can be marked out of circulation

## 👤 Default Admin Account

On first startup, the API seeds an administrator account:

- Email: [admin@mau.edu.et](mailto:admin@mau.edu.et)
- Password: ChangeMe123!

> Change these credentials immediately before deployment and rotate the
> password after first login.

## 🧪 Testing

```bash
cd tests/LibrarySystem.Api.Tests
dotnet test
```

## 🗺️ Roadmap

- Mobile app support using the existing REST API
- QR/barcode scanning for check-in and check-out
- SMS notification support
- Accessibility improvements
- CI/CD automation for testing and deployment

## 🤝 Contributing

Contributions are welcome. Please open an issue to discuss significant
changes before submitting a pull request.

1. Fork the repository
2. Create a feature branch
   (`git checkout -b feature/your-feature`)
3. Commit your changes
   (`git commit -m "Add your feature"`)
4. Push to the branch
   (`git push origin feature/your-feature`)
5. Open a pull request

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 🙏 Acknowledgments

Developed for the Mattu University Main Campus Library and Information
Center as part of an effort to modernize library operations through a
secure, scalable, and maintainable digital solution.
