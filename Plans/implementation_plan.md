# Enterprise Task & Lead Auto Assignment Engine

This plan details the design and implementation for upgrading the Lead Growth SaaS platform with a fully automated, workload-balanced Task and Lead Assignment Engine, User Availability Tracking, Team Productivity tracking, real-time WebSocket notifications, and role-based performance dashboards.

## User Review Required

> [!IMPORTANT]
> **Database Changes & Compatibility:**
> 1. We are adding columns `availability_status`, `skills`, and `last_assigned_at` to the `users` table.
> 2. We are introducing new tables: `task_assignments`, `lead_assignments`, `user_productivity`, and `assignment_logs`.
> 3. Standard Spring Boot local run with `spring.jpa.hibernate.ddl-auto=update` will auto-generate these schema elements.
>
> **Business Logic Configurations:**
> * **BUSY threshold:** Users with status `BUSY` will only receive tasks if they have fewer than **5 active tasks**.
> * **Auto-Reassignment threshold:** If a user becomes `OFFLINE` or `ON_LEAVE`, their active tasks are auto-reassigned. We will run a background scheduler every **1 minute** to check for users whose status has been offline/on_leave for more than **5 minutes** or who logged off, auto-requeuing their blocked tasks.

## Open Questions

> [!NOTE]
> * **Skill Matching:** We propose storing skills as a comma-separated string on the user (e.g. `SEO, Meta Ads, Google Ads`) and adding a `required_skill` field to tasks. The assignment engine will perform case-insensitive substring matching. Please let us know if you prefer a separate tag/relation table instead.
> * **Round Robin Fallback:** We will track `last_assigned_at` on the `User` record to decide the round-robin order when workloads are equal.

---

## Proposed Changes

### Database Layer

#### [MODIFY] [User.java](file:///e:/WEB/LeadGrowth/backend/src/main/java/com/leadgrowth/entity/User.java)
- Add field `availabilityStatus` (default: `"AVAILABLE"`, enum/string: `AVAILABLE`, `BUSY`, `ON_BREAK`, `OFFLINE`, `ON_LEAVE`).
- Add field `skills` (String, comma-separated user skills).
- Add field `lastAssignedAt` (LocalDateTime).

#### [MODIFY] [Task.java](file:///e:/WEB/LeadGrowth/backend/src/main/java/com/leadgrowth/entity/Task.java)
- Support new priority levels: `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
- Add field `requiredSkill` (String).
- Add field `assignedAt` (LocalDateTime).

#### [NEW] [TaskAssignment.java](file:///e:/WEB/LeadGrowth/backend/src/main/java/com/leadgrowth/entity/TaskAssignment.java)
- Track user task assignments historically: task, user, assignedAt, assignedBy.

#### [NEW] [LeadAssignment.java](file:///e:/WEB/LeadGrowth/backend/src/main/java/com/leadgrowth/entity/LeadAssignment.java)
- Track user lead assignments historically: lead, user, assignedAt.

#### [NEW] [UserProductivity.java](file:///e:/WEB/LeadGrowth/backend/src/main/java/com/leadgrowth/entity/UserProductivity.java)
- Track daily productivity scores: workspace, user, completedTasksCount, completedLeadsCount, conversionRate, averageResponseTime, productivityScore, date.

#### [NEW] [AssignmentLog.java](file:///e:/WEB/LeadGrowth/backend/src/main/java/com/leadgrowth/entity/AssignmentLog.java)
- Audit log of automated assignments: workspace, entityType ("TASK"/"LEAD"), entityId, assignedTo, algorithmDetails, assignedAt.

---

### Backend Repositories & Services

#### [NEW] New Repository interfaces
- Create repositories for `TaskAssignment`, `LeadAssignment`, `UserProductivity`, `AssignmentLog`.

#### [MODIFY] [TaskService.java](file:///e:/WEB/LeadGrowth/backend/src/main/java/com/leadgrowth/service/TaskService.java)
- Implement **Hybrid Assignment Algorithm** for tasks.
- Implement task lifecycle transitions: `PENDING` -> `IN_PROGRESS` -> `PENDING_REVIEW` -> `APPROVED`/`REJECTED`.
- Automate "User Idle Prevention": when a user completes a task, check queue for the next highest priority task matching their skills and assign it.
- Implement random task assignment helper.

#### [MODIFY] [LeadService.java](file:///e:/WEB/LeadGrowth/backend/src/main/java/com/leadgrowth/service/LeadService.java)
- Implement **Hybrid Assignment Algorithm** for incoming leads.
- Route leads through lead queue to available users.

#### [MODIFY] [UserService.java](file:///e:/WEB/LeadGrowth/backend/src/main/java/com/leadgrowth/service/UserService.java)
- Implement `updateAvailabilityStatus(String status, String email)`.
- Reassign user's open tasks immediately if they change status to `OFFLINE` or `ON_LEAVE`.

#### [NEW] [ProductivityService.java](file:///e:/WEB/LeadGrowth/backend/src/main/java/com/leadgrowth/service/ProductivityService.java)
- Calculate daily, weekly, and monthly productivity scores.
- Classify users as `Top Performer`, `Average Performer`, or `Needs Improvement`.

#### [MODIFY] [WebSocketManager.java](file:///e:/WEB/LeadGrowth/backend/src/main/java/com/leadgrowth/websocket/WebSocketManager.java)
- Broaden real-time broadcasts to send instant STOMP updates for new tasks, new leads, status updates, and user alerts.

#### [NEW] [AutoReassignmentScheduler.java](file:///e:/WEB/LeadGrowth/backend/src/main/java/com/leadgrowth/scheduler/AutoReassignmentScheduler.java)
- Periodic schedule (every 1 minute) checking for users who are `OFFLINE` or `ON_LEAVE` and auto-reassigning/re-queuing their active tasks.

---

### Frontend Web UI

#### [MODIFY] [Navbar.tsx](file:///e:/WEB/LeadGrowth/frontend/src/components/Navbar.tsx)
- Integrate user status selector dropdown directly in the user profile menu.
- Connect to the real WebSocket/STOMP endpoints (`/topic/user/{id}/notifications` and `/topic/workspace/{wsId}/notifications`) to display real-time toast alerts and increment/update badge counts.

#### [MODIFY] [Dashboard.tsx](file:///e:/WEB/LeadGrowth/frontend/src/pages/Dashboard.tsx)
- Create three distinct visual dashboards:
  1. **Admin Dashboard:** Total Active Users, Total Assigned Tasks, Completed vs Pending, Team Productivity, Lead Conversions.
  2. **Manager Dashboard:** Team Capacity vs Workload, Pending Reviews queue, Auto-Assign controls.
  3. **User Dashboard:** Assigned Tasks & Leads list, Personal Productivity Score meter, "Waiting For Assignment" idle indicator.

#### [MODIFY] [Tasks.tsx](file:///e:/WEB/LeadGrowth/frontend/src/pages/Tasks.tsx)
- Add priority levels (LOW, MEDIUM, HIGH, URGENT) and required skills when creating a task.
- Display the central **Task Queue** for unassigned tasks.
- For Admins/Managers, add an "Auto Assign" button for any queued task.
- For users, add "Mark Completed" (which moves to `PENDING_REVIEW`). For Managers/Admins, add "Approve" / "Reject" controls.

#### [MODIFY] [Leads.tsx](file:///e:/WEB/LeadGrowth/frontend/src/pages/Leads.tsx)
- Add a **Lead Queue** panel displaying unassigned leads by source.
- Add an "Auto Assign Lead" trigger.

#### [MODIFY] [UserManagement.tsx](file:///e:/WEB/LeadGrowth/frontend/src/pages/UserManagement.tsx)
- Render user skills tags, real-time availability status, and current task workloads directly inside the workspace team grid.

---

## Verification Plan

### Automated Verification
- We will run `./mvnw.cmd clean test` or compile `./mvnw.cmd clean compile` to ensure there are no compilation or unit test failures.

### Manual Verification
- Deploy local Spring Boot backend.
- Spin up React frontend development server.
- Test task queue and automatic matching by changing user availability and required skills.
- Verify WebSocket alerts fire instantly when actions occur.
