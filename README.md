# Lead Growth — Enterprise Marketing Analytics & Lead Management SaaS Platform

> **Tagline:** "One Dashboard. Every Lead. Complete Growth."

**Lead Growth** is an enterprise-grade SaaS dashboard built specifically for performance marketing teams and digital marketing agencies. It delivers multi-tenant campaign management, WebSocket-based live lead alerts, role-based access control (RBAC), simulated Meta/Google Marketing API sync runs, and interactive reports (CSV, Excel, PDF).

---

## Technical Stack

### Frontend
- **Framework:** React.js, TypeScript, Vite
- **Styling:** Tailwind CSS (Vanilla CSS & custom glassmorphism effects)
- **Routing:** React Router DOM
- **State Management:** Zustand (Persisted)
- **Charts:** Recharts (Area, Bar, Pie, Funnel visualizations)
- **Icons:** Lucide Icons
- **Animations:** Framer Motion

### Backend
- **Framework:** Java Spring Boot 3.3.x (Maven)
- **Security:** Spring Security & JWT Token Authentication
- **ORM:** Spring Data JPA & Hibernate
- **Database:** MySQL
- **Real-Time Feed:** Spring WebSocket Simple Broker (STOMP protocol)
- **Scheduler:** JSR-380 Cron Sync Scheduler
- **Reporting:** Apache POI (Excel, CSV) & iText (PDF)

---

## Getting Started

### 💡 Sample Login Credentials
The system initializes with preset seed accounts sharing a default workspace (**Demo Agency Workspace**, invite code: `LEAD-GROWTH-2026`).

| Role | Email | Password | Allowed Access |
|---|---|---|---|
| **ROLE_ADMIN** | `admin@leadgrowth.com` | `Admin@123` | Full Access, Billings, API Keys, Manual Sync |
| **ROLE_MANAGER** | `manager@leadgrowth.com` | `Manager@123` | Leads management, Task assignment, View Campaigns |
| **ROLE_USER** | `user@leadgrowth.com` | `User@123` | View Assigned Leads, Update Status, Add Notes, Tasks |

---

## How to Run

### Option 1: Running with Docker Compose (Recommended)
Make sure you have Docker installed. From the root directory:

```bash
docker-compose up --build
```

- **Frontend Application:** Access at [http://localhost:3000](http://localhost:3000)
- **Backend API:** Connects at [http://localhost:8080](http://localhost:8080)
- **Database:** Hosted on port 3306

---

### Option 2: Running Locally (Development Mode)

#### 1. Setup MySQL Database
Create a database named `leadgrowth` in your local MySQL instance:
```sql
CREATE DATABASE leadgrowth;
```
Configure database credentials inside `backend/src/main/resources/application.properties` (or set env variables `DATABASE_USER` and `DATABASE_PASSWORD`).

#### 2. Start Java Spring Boot Backend
Navigate into the `backend/` directory and compile:
```bash
cd backend
mvn spring-boot:run
```
The server starts at [http://localhost:8080](http://localhost:8080). Tables and seed credentials will be auto-generated.

#### 3. Start React Frontend
Navigate into the `frontend/` directory and spin up the Vite development server:
```bash
cd frontend
npm install
npm run dev
```
Access the application at [http://localhost:5173](http://localhost:5173).

---

## Platform Highlights

1. **WebSocket Live Feed:** Connects via a lightweight STOMP interface over raw browser WebSockets to `/ws-leads`. Automatically triggers notification alerts and timeline updates upon sync intake.
2. **Cron Sync Scheduler:** Automatically fetches simulated campaign spends, clicks, impressions, and conversions every hour. Admins can manually trigger this in the **Integrations** tab.
3. **Flexible Exporters:** Report generator supports on-the-fly CSV printing, Apache POI xlsx rendering, and iText horizontal PDF page matrices.
