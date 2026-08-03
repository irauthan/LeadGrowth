# Lead Growth — Enterprise Marketing Analytics & Lead Management SaaS Platform

> **Tagline:** "One Dashboard. Every Lead. Complete Growth."

**Lead Growth** is an enterprise-grade SaaS dashboard built for performance marketing teams, digital agencies, and growth operations teams. The platform centralizes campaign analytics, lead intake, agency workflows, and real-time alerting into a modern single-pane view.

Key capabilities:
- Multi-tenant workspace management
- WebSocket live lead alerts and activity feed
- Role-based access control (RBAC)
- Simulated Meta/Google campaign sync and spend tracking
- Lead lifecycle automation and task management
- Exportable reporting (CSV, Excel, PDF)
- Admin integrations, audit logs, and custom dashboards

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Option 1: Docker Compose](#option-1-docker-compose-recommended)
  - [Option 2: Local Development](#option-2-local-development)
- [Configuration](#configuration)
- [Seed Accounts](#seed-accounts)
- [Project Structure](#project-structure)
- [Common Workflows](#common-workflows)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- User authentication with JWT and secure role-based access control
- Multi-tenant agency workspace model with invite codes
- Campaign dashboard showing spend, leads, conversions, and ROI estimates
- Live lead stream using STOMP over WebSocket
- Lead management: assign owners, change status, add notes, create follow-up tasks
- Simulated integration sync for Meta and Google Marketing APIs
- Scheduled hourly sync engine with manual sync override
- Export reporting to CSV, XLSX, and PDF with Apache POI / iText
- Responsive admin portal including billing, API keys, and workspace settings
- Audit trail and operational logs for lead actions
- Rich visualizations with area, bar, pie, and funnel charts

---

## Tech Stack

### Frontend
- React.js + TypeScript
- Vite build tooling
- Tailwind CSS with custom glassmorphism styling
- React Router DOM for client routing
- Zustand for persisted state management
- Recharts for analytics visualizations
- Lucide Icons for UI clarity
- Framer Motion for UI animations

### Backend
- Java Spring Boot 3.3.x with Maven
- Spring Security with JWT authentication
- Spring Data JPA + Hibernate ORM
- MySQL database
- Spring WebSocket + STOMP broker for event streaming
- Scheduled tasks using Spring Scheduler / cron expressions
- Apache POI for Excel and CSV exports
- iText for PDF rendering

---

## Architecture

Lead Growth is designed as a decoupled multi-tier application:

- Frontend: SPA client delivering dashboards, lead boards, and admin panels.
- Backend: REST API and WebSocket server handling business logic, security, sync tasks, and reports.
- Database: persistent MySQL storage for users, leads, workspaces, campaigns, and activity logs.
- Realtime Layer: WebSocket STOMP endpoint exposes live lead feed and notification events.

The backend seeds initial demo data on startup, including users and a workspace, so the system is ready to test immediately.

---

## Getting Started

### Prerequisites

- Docker & Docker Compose (recommended)
- Java 17+ (if running backend locally)
- Node.js 18+ / npm 9+ (if running frontend locally)
- MySQL 8+ (local development mode)

---

### Option 1: Docker Compose (Recommended)

From the repository root, run:

```bash
docker-compose up --build
```

Services:
- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- MySQL: localhost:3306

Stop the stack with:

```bash
docker-compose down
```

---

### Option 2: Local Development

#### 1. Configure MySQL
Create the database and user if needed:

```sql
CREATE DATABASE leadgrowth;
```

Update backend database settings in `backend/src/main/resources/application.properties` or set environment variables used by the Spring Boot app.

#### 2. Start Backend

```bash
cd backend
mvn clean package
mvn spring-boot:run
```

Default backend URL: http://localhost:8080

#### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Default frontend URL: http://localhost:5173

---

## Configuration

### Backend Environment Variables

- `SERVER_PORT` - Backend HTTP port (default: 8080)
- `DATABASE_HOST` - MySQL host
- `DATABASE_PORT` - MySQL port
- `DATABASE_NAME` - MySQL database name
- `DATABASE_USER` - MySQL username
- `DATABASE_PASSWORD` - MySQL password
- `JWT_SECRET` - Secret key for JWT signing
- `JWT_EXPIRATION_MS` - Token expiration time in milliseconds

### Frontend Environment Variables

- `VITE_API_BASE_URL` - Backend API URL
- `VITE_WS_BASE_URL` - WebSocket URL if separate from API host

If using Docker Compose, these values are managed in `docker-compose.yml`.

---

## Seed Accounts

The application ships with demo accounts and a default workspace:

| Role | Email | Password | Permissions |
|---|---|---|---|
| Admin | `admin@leadgrowth.com` | `Admin@123` | Full access, billing, API keys, manual sync |
| Manager | `manager@leadgrowth.com` | `Manager@123` | Leads, tasks, campaign views |
| User | `user@leadgrowth.com` | `User@123` | Assigned leads, status updates, notes, tasks |

Demo workspace invite code: `LEAD-GROWTH-2026`

---

## Project Structure

- `backend/`
  - Spring Boot API and services
  - `src/main/java` - application code
  - `src/main/resources/application.properties` - backend config
- `frontend/`
  - React TypeScript SPA
  - `src/` - UI components, stores, routes
  - `vite.config.ts` - Vite configuration
- `docker-compose.yml`
  - orchestrates frontend, backend, and database
- `README.md`
  - project documentation

---

## Common Workflows

- Login as Admin and verify workspace settings
- Create or import campaigns and assign team members
- Watch live leads arrive on the feed via WebSocket
- Open the Integrations page to manually run a sync
- Export lead and campaign reports to CSV, XLSX, or PDF
- Use manager and user accounts to validate RBAC workflows

---

## Troubleshooting

- Backend fails to start:
  - Confirm MySQL is running and credentials match
  - Check `application.properties` for correct datasource settings
  - Inspect Spring boot logs for port or dependency errors
- Frontend does not connect:
  - Ensure `VITE_API_BASE_URL` points to the backend URL
  - Check browser console for WebSocket or CORS issues
- Seed data missing:
  - Verify backend started with an empty database
  - Restart backend after clearing the database

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes with clear messages
4. Open a pull request and describe the behavior

Please keep changes scoped to a single feature or fix, and include any frontend/backend testing notes.

---

## License

This project is provided for demonstration and internal use. Update the license section to match your licensing requirements.
