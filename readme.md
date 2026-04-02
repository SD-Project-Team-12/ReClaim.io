<div align="center">

# ReClaim.io

### A comprehensive full-stack platform for waste management, recycling logistics, and marketplace interactions.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-re--claim--io.vercel.app-brightgreen?style=for-the-badge&logo=vercel)](https://re-claim-io.vercel.app)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-blue?style=for-the-badge&logo=react)](https://react.dev)
[![Backend](https://img.shields.io/badge/Backend-ASP.NET%20Core-purple?style=for-the-badge&logo=dotnet)](https://dotnet.microsoft.com)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

</div>

---

## Table of Contents

- [ReClaim.io](#reclaimio)
    - [A comprehensive full-stack platform for waste management, recycling logistics, and marketplace interactions.](#a-comprehensive-full-stack-platform-for-waste-management-recycling-logistics-and-marketplace-interactions)
  - [Table of Contents](#table-of-contents)
  - [About the Project](#about-the-project)
  - [Key Features](#key-features)
  - [Tech Stack](#tech-stack)
    - [Frontend](#frontend)
    - [Backend](#backend)
    - [Infrastructure \& Tools](#infrastructure--tools)
  - [Architecture](#architecture)
  - [Prerequisites](#prerequisites)
  - [Getting Started](#getting-started)
    - [1. Clone the Repository](#1-clone-the-repository)
    - [2. Start Infrastructure (Docker)](#2-start-infrastructure-docker)
    - [3. Backend Setup (`ReClaim.Api`)](#3-backend-setup-reclaimapi)
    - [4. Frontend Setup (`ReClaim.Web`)](#4-frontend-setup-reclaimweb)
  - [Environment Variables](#environment-variables)
    - [Backend — `ReClaim.Api`](#backend--reclaimapi)
    - [Frontend — `ReClaim.Web`](#frontend--reclaimweb)
  - [Project Structure](#project-structure)
  - [Contributing](#contributing)
  - [License](#license)

---

## About the Project

**ReClaim.io** is a modern, community-driven recycling and waste management platform. It bridges the gap between individual users and recycling fleet operators — enabling smooth pickup scheduling, real-time communication, heuristic material pricing, and a marketplace for recyclable goods.

The platform is built with a clean separation between a **React/Vite** frontend and an **ASP.NET Core** backend, containerized infrastructure via Docker, and real-time capabilities powered by **SignalR**.

---

## Key Features

- **Pickup Request Management** — Users can submit and track recycling pickup requests, including image uploads for material assessment.
- **Fleet & Logistics Dashboard** — Dedicated interfaces for logistics providers to view, claim, and manage pickup requests efficiently.
- **Marketplace Hub** — A centralized platform for the trading and exchange of recyclable goods between users.
- **Real-Time Communication** — Integrated live chat between users, support staff, and fleet operators powered by **SignalR (WebSockets)**.
- **Heuristic Price Estimation** — Automated service to estimate the value of recyclable materials based on user-provided data and images.
- **Gamification & Leaderboards** — Tracks and ranks user contributions to encourage consistent recycling habits.
- **Administrative Control** — Role-based access control, user verification workflows, and system-wide analytics.

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| React | UI component framework |
| TypeScript | Type-safe JavaScript |
| Vite | Fast development build tool |
| Vercel | Frontend deployment |

### Backend

| Technology | Purpose |
|---|---|
| ASP.NET Core (C#) | Web API framework |
| Entity Framework Core | ORM & database migrations |
| SignalR | Real-time WebSocket communication |
| RESTful Architecture | Standard API design |

### Infrastructure & Tools

| Technology | Purpose |
|---|---|
| Docker & Docker Compose | Containerized database & services |
| PostgreSQL + PostGIS | Primary database with geospatial support |
| Redis | Caching & session management |
| ngrok | Webhook testing in development |

---

## Architecture

```
ReClaim.io/
├── ReClaim.Api/        <- ASP.NET Core Web API (C# backend)
│   ├── Controllers/    <- API route handlers
│   ├── Hubs/           <- SignalR real-time hubs
│   ├── Services/       <- Business logic
│   ├── Models/         <- Domain models & DTOs
│   └── Migrations/     <- EF Core database migrations
│
├── ReClaim.Web/        <- React + Vite frontend (TypeScript)
│   ├── src/
│   │   ├── admin/      <- Admin dashboard features
│   │   ├── auth/       <- Authentication flows
│   │   ├── chat/       <- Real-time chat UI
│   │   ├── pickup/     <- Pickup request management
│   │   ├── components/ <- Shared UI components
│   │   ├── contexts/   <- React context providers
│   │   └── api/        <- API integration layer
│   └── ...
│
├── docker-compose.yml  <- PostgreSQL + Redis containers
└── ReClaim.slnx        <- Visual Studio solution file
```

**Data flow:**

```
Browser (React / Vite)
      |
      | HTTP REST / WebSocket (SignalR)
      |
ASP.NET Core API
      |
      | Entity Framework Core
      |
PostgreSQL + PostGIS  <-->  Redis (Cache)
```

---

## Prerequisites

Ensure you have the following installed before getting started:

| Tool | Version | Download |
|---|---|---|
| Node.js | v18 or higher | [nodejs.org](https://nodejs.org/) |
| .NET SDK | .NET 10 | [dotnet.microsoft.com](https://dotnet.microsoft.com/download) |
| Docker Desktop | Latest | [docker.com](https://www.docker.com/get-started) |
| Git | Latest | [git-scm.com](https://git-scm.com/) |

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/SD-Project-Team-12/ReClaim.io.git
cd ReClaim.io
```

---

### 2. Start Infrastructure (Docker)

From the **root** of the repository, spin up the PostgreSQL and Redis containers:

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL 16 + PostGIS** — accessible at `localhost:5433`
- **Redis** — accessible at `localhost:6380`

Verify the containers are running:

```bash
docker ps
```

To stop all services:

```bash
docker-compose down
```

---

### 3. Backend Setup (`ReClaim.Api`)

Open a terminal and navigate to the API directory:

```bash
cd ReClaim.Api
```

Restore NuGet packages:

```bash
dotnet restore
```

Install the EF Core CLI tool (if not already installed):

```bash
dotnet tool install --global dotnet-ef
```

Apply database migrations:

```bash
dotnet ef database update
```

Start the API server:

```bash
dotnet run
```

The API will be available at:
- `https://localhost:5001`
- `http://localhost:5000`

> Refer to `ReClaim.Api/Properties/launchSettings.json` for the exact port configuration.

---

### 4. Frontend Setup (`ReClaim.Web`)

Open a new terminal and navigate to the web directory:

```bash
cd ReClaim.Web
```

Install Node.js dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## Environment Variables

### Backend — `ReClaim.Api`

Create an `appsettings.Development.json` file inside `ReClaim.Api/`:

```json
ConnectionStrings:DefaultConnection = Host= ;Port= ;Database=ReClaimDb;Username= ;Password=
Clerk:WebhookSecret = 
Clerk:SecretKey = 
Clerk:Authority = 
Clerk:Audience = 
```

### Frontend — `ReClaim.Web`

Create a `.env.local` file inside `ReClaim.Web/`:

```env
VITE_CLERK_PUBLISHABLE_KEY=" "
VITE_API_BASE_URL=http://localhost:5150/api
VITE_CLOUDINARY_CLOUD_NAME=" "
VITE_CLOUDINARY_UPLOAD_PRESET=" "
VITE_GEMINI_API_KEY=" "
```

> **Note:** Never commit `.env.local` or `appsettings.Development.json` files containing real credentials to version control. Ensure both are listed in `.gitignore`.

---

## Project Structure

```
ReClaim.io/
│
├── ReClaim.Api/                        # ASP.NET Core Backend
│   ├── Controllers/                    # REST API endpoints
│   ├── Hubs/                           # SignalR WebSocket hubs (chat, notifications)
│   ├── Services/                       # Business logic & price estimation
│   ├── Models/                         # Domain models, DTOs, enums
│   ├── Data/                           # EF Core DbContext
│   ├── Migrations/                     # Database migration history
│   ├── appsettings.json                # Base configuration
│   ├── appsettings.Development.json    # Local dev secrets (gitignored)
│   └── ReClaim.Api.csproj              # .NET project file
│
├── ReClaim.Web/                        # React + Vite Frontend
│   ├── src/
│   │   ├── admin/                      # Admin dashboard & analytics
│   │   ├── auth/                       # Login, registration, verification
│   │   ├── chat/                       # Real-time chat (SignalR client)
│   │   ├── pickup/                     # Pickup request flows
│   │   ├── marketplace/                # Recyclables trading hub
│   │   ├── leaderboard/                # Gamification & rankings
│   │   ├── components/                 # Shared/global UI components
│   │   ├── contexts/                   # React context providers (auth, theme)
│   │   └── api/                        # Typed API client layer
│   ├── public/                         # Static assets
│   ├── .env.local                      # Local environment variables (gitignored)
│   ├── vite.config.ts                  # Vite build configuration
│   └── package.json                    # Node dependencies
│
├── docker-compose.yml                  # PostgreSQL + Redis services
├── ReClaim.slnx                        # Visual Studio solution
└── .gitignore
```

---

## Contributing

Contributions are welcome. Please follow the steps below:

1. Fork the repository.
2. Create a feature branch:
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. Commit your changes:
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. Push to your branch:
   ```bash
   git push origin feature/AmazingFeature
   ```
5. Open a Pull Request against the `main` branch.

Please ensure all services (API + Docker) are running and tested locally before submitting a Pull Request.

---

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">
 
Developed by 
 
| Student ID | Name |
|---|---|
| 20220204060 | Md. Sakibul Hassan |
| 20220204062 | Mohammad Rafid Ahad |
| 20220204067 | Md. Iftekhar Zawad |
| 20220204071 | Ariful Islam Nipun |
 
</div>
