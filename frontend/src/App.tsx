import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Welcome from './pages/Welcome';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import Leads from './pages/Leads';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Integrations from './pages/Integrations';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ActivityLogs from './pages/ActivityLogs';
import NotificationsPage from './pages/NotificationsPage';
import UserManagement from './pages/UserManagement';
import WorkspaceManagement from './pages/WorkspaceManagement';
import ApiManagement from './pages/ApiManagement';
import SystemMonitoring from './pages/SystemMonitoring';
import Followups from './pages/Followups';
import AuditLogsView from './pages/AuditLogsView';
import AcceptInvite from './pages/AcceptInvite';
import Billing from './pages/Billing';
import SecurityCenter from './pages/SecurityCenter';
import MyWork from './pages/MyWork';
import Calendar from './pages/Calendar';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Guest access routes */}
        <Route path="/" element={<Welcome />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/invite/accept" element={<AcceptInvite />} />
        
        {/* Protected onboarding flow */}
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Workspace core application routes */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-work" element={<MyWork />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/followups" element={<Followups />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/tasks" element={<Navigate to="/my-work" replace />} />
          <Route path="/users" element={<Users />} />
          <Route path="/activity-logs" element={<ActivityLogs />} />
          <Route path="/notifications-page" element={<NotificationsPage />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/profile" element={<Profile />} />

          {/* Admin specific controls */}
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/workspace" element={<WorkspaceManagement />} />
          <Route path="/admin/api" element={<ApiManagement />} />
          <Route path="/admin/system" element={<SystemMonitoring />} />
          <Route path="/admin/security" element={<SecurityCenter />} />
          <Route path="/admin/audit-logs" element={<AuditLogsView />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
