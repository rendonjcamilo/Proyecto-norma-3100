import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ProviderProvider, useProvider } from "./context/ProviderContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { DocumentsPage } from "./components/Documents";
import { ReportsPage } from "./components/Reports";
import { FindingsPage } from "./pages/FindingsPage";
import { AssessmentsPage } from "./pages/AssessmentsPage";
import { AssessmentExecutionPage } from "./pages/AssessmentExecutionPage";
import { AssessmentGeneratorPage } from "./pages/AssessmentGeneratorPage";
import { AssessmentResultPage } from "./pages/AssessmentResultPage";
import { ProvidersPage } from "./pages/ProvidersPage";
import { AuditorsPage } from "./pages/AuditorsPage";
import { UsersPage } from "./pages/UsersPage";
import { QuestionnairesPage } from "./pages/QuestionnairesPage";
import { InvimaPage } from "./pages/InvimaPage";
import { RepsPage } from "./pages/RepsPage";
import { NotificationCenter } from "./components/Notifications";
import { EmailTemplateEditor } from "./components/Notifications/EmailTemplateEditor";
import { SmsTemplateEditor } from "./components/Notifications/SmsTemplateEditor";
import { PushTemplateEditor } from "./components/Notifications/PushTemplateEditor";
import { MultiChannelPreferences } from "./components/Notifications/MultiChannelPreferences";
import { NotificationAnalyticsDashboard } from "./components/Notifications/NotificationAnalyticsDashboard";
import { DeliveryStatusTracker } from "./components/Notifications/DeliveryStatusTracker";
import { AuditorNotificationsPage } from "./pages/notifications/AuditorNotificationsPage";
import { Sidebar, TopBar } from "./components/Layout";
import { SuperAdminDashboard } from "./pages/dashboards/SuperAdminDashboard";
import { AuditorDashboard } from "./pages/dashboards/AuditorDashboard";
import { ProviderDashboard } from "./pages/dashboards/ProviderDashboard";
import "./App.css";

function DashboardRouter(): JSX.Element {
  const { user } = useAuth();
  const role = user?.role || "provider_admin";
  switch (role) {
    case "super_admin":
      return <SuperAdminDashboard />;
    case "auditor":
      return <AuditorDashboard />;
    case "provider_admin":
    default:
      return <ProviderDashboard />;
  }
}

// Wrappers que extraen datos del contexto
const AssessmentsWrapper = () => {
  const { selectedProvider } = useProvider();
  return <AssessmentsPage providerId={selectedProvider?.id || ""} />;
};

const FindingsWrapper = () => {
  const { selectedProvider } = useProvider();
  return <FindingsPage providerId={selectedProvider?.id || ""} />;
};

const ReportsWrapper = () => {
  const { selectedProvider } = useProvider();
  return <ReportsPage providerId={selectedProvider?.id || ""} providerName={selectedProvider?.legalName || ""} />;
};

const DocumentsWrapper = () => {
  const { selectedProvider } = useProvider();
  return <DocumentsPage providerId={selectedProvider?.id || ""} providerName={selectedProvider?.legalName || ""} />;
};

const NotificationCenterWrapper = () => {
  const { user } = useAuth();
  const { selectedProvider } = useProvider();
  return <NotificationCenter userId={user?.id || ""} providerId={selectedProvider?.id || ""} role={user?.role as 'auditor' | 'provider_admin' | 'provider' || 'provider'} />;
};

const EmailTemplateEditorWrapper = () => {
  const { user } = useAuth();
  return <EmailTemplateEditor userId={user?.id || ""} />;
};

const SmsTemplateEditorWrapper = () => {
  const { user } = useAuth();
  return <SmsTemplateEditor userId={user?.id || ""} />;
};

const PushTemplateEditorWrapper = () => {
  const { user } = useAuth();
  return <PushTemplateEditor userId={user?.id || ""} />;
};

const MultiChannelPreferencesWrapper = () => {
  const { user } = useAuth();
  return <MultiChannelPreferences userId={user?.id || ""} />;
};

const NotificationAnalyticsDashboardWrapper = () => {
  const { user } = useAuth();
  return <NotificationAnalyticsDashboard userId={user?.id || ""} />;
};

const DeliveryStatusTrackerWrapper = () => {
  const { user } = useAuth();
  return <DeliveryStatusTracker userId={user?.id || ""} />;
};

const AuditorNotificationsWrapper = () => {
  return <AuditorNotificationsPage />;
};

const InvimaWrapper = () => {
  const { selectedProvider, isLoading } = useProvider();

  if (isLoading || !selectedProvider) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        color: '#666',
        fontSize: '16px',
      }}>
        {isLoading ? 'Cargando prestador...' : '⚠️ Por favor selecciona un prestador en el menú superior'}
      </div>
    );
  }

  return <InvimaPage providerId={selectedProvider.id} />;
};

const RepsWrapper = () => {
  const { selectedProvider, isLoading } = useProvider();

  if (isLoading || !selectedProvider) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        color: '#666',
        fontSize: '16px',
      }}>
        {isLoading ? 'Cargando prestador...' : '⚠️ Por favor selecciona un prestador en el menú superior'}
      </div>
    );
  }

  return <RepsPage providerId={selectedProvider.id} />;
};

function AppContent(): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isAuthenticated } = useAuth();
  const { selectedProvider, availableProviders, setSelectedProvider } = useProvider();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(prev => !prev)} />
      <div className="app-main">
        <TopBar onMenuToggle={() => setSidebarOpen(prev => !prev)} providers={availableProviders} selectedProvider={selectedProvider} onSelectProvider={setSelectedProvider} />
        <main className="app-content">
          <Routes>
            {/* Dashboard */}
            <Route path="/" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />

            {/* Assessments */}
            <Route
              path="/assessments"
              element={<ProtectedRoute requiredRoles={["super_admin", "auditor", "provider_admin"]}><AssessmentsWrapper /></ProtectedRoute>}
            />
            <Route
              path="/assessments/new"
              element={<ProtectedRoute requiredRoles={["super_admin", "auditor", "provider_admin"]}><AssessmentGeneratorPage /></ProtectedRoute>}
            />
            <Route
              path="/assessments/:id"
              element={<ProtectedRoute requiredRoles={["super_admin", "auditor", "provider_admin"]}><AssessmentExecutionPage /></ProtectedRoute>}
            />
            <Route
              path="/assessments/:id/results"
              element={<ProtectedRoute requiredRoles={["super_admin", "auditor", "provider_admin"]}><AssessmentResultPage /></ProtectedRoute>}
            />

            {/* Findings */}
            <Route
              path="/findings"
              element={<ProtectedRoute requiredRoles={["super_admin", "auditor", "provider_admin"]}><FindingsWrapper /></ProtectedRoute>}
            />

            {/* Providers */}
            <Route
              path="/providers"
              element={<ProtectedRoute requiredRoles={["auditor"]}><ProvidersPage /></ProtectedRoute>}
            />

            {/* Auditors */}
            <Route
              path="/auditors"
              element={<ProtectedRoute requiredRoles={["super_admin"]}><AuditorsPage /></ProtectedRoute>}
            />

            {/* Users */}
            <Route
              path="/users"
              element={<ProtectedRoute requiredRoles={["super_admin"]}><UsersPage /></ProtectedRoute>}
            />

            {/* Questionnaires */}
            <Route
              path="/questionnaires"
              element={<ProtectedRoute requiredRoles={["super_admin"]}><QuestionnairesPage /></ProtectedRoute>}
            />

            {/* Reports */}
            <Route
              path="/reports"
              element={<ProtectedRoute requiredRoles={["auditor", "provider_admin"]}><ReportsWrapper /></ProtectedRoute>}
            />

            {/* Documents */}
            <Route
              path="/documents"
              element={<ProtectedRoute requiredRoles={["super_admin", "auditor", "provider_admin"]}><DocumentsWrapper /></ProtectedRoute>}
            />

            {/* Notifications — Subrutas específicas PRIMERO */}
            <Route
              path="/notifications/email-templates"
              element={<ProtectedRoute requiredRoles={["super_admin"]}><EmailTemplateEditorWrapper /></ProtectedRoute>}
            />
            <Route
              path="/notifications/sms-templates"
              element={<ProtectedRoute requiredRoles={["super_admin"]}><SmsTemplateEditorWrapper /></ProtectedRoute>}
            />
            <Route
              path="/notifications/push-templates"
              element={<ProtectedRoute requiredRoles={["super_admin"]}><PushTemplateEditorWrapper /></ProtectedRoute>}
            />
            <Route
              path="/notifications/preferences"
              element={<ProtectedRoute requiredRoles={["super_admin", "auditor", "provider_admin"]}><MultiChannelPreferencesWrapper /></ProtectedRoute>}
            />
            <Route
              path="/notifications/analytics"
              element={<ProtectedRoute requiredRoles={["super_admin", "auditor"]}><NotificationAnalyticsDashboardWrapper /></ProtectedRoute>}
            />
            <Route
              path="/notifications/delivery-status"
              element={<ProtectedRoute requiredRoles={["super_admin", "auditor"]}><DeliveryStatusTrackerWrapper /></ProtectedRoute>}
            />
            <Route
              path="/notifications/auditor-send"
              element={<ProtectedRoute requiredRoles={["auditor", "super_admin"]}><AuditorNotificationsWrapper /></ProtectedRoute>}
            />
            <Route
              path="/notifications"
              element={<ProtectedRoute requiredRoles={["super_admin", "auditor", "provider_admin"]}><NotificationCenterWrapper /></ProtectedRoute>}
            />

            {/* INVIMA */}
            <Route
              path="/invima"
              element={<ProtectedRoute requiredRoles={["auditor", "provider_admin"]}><InvimaWrapper /></ProtectedRoute>}
            />

            {/* REPS */}
            <Route
              path="/reps"
              element={<ProtectedRoute requiredRoles={["auditor", "provider_admin"]}><RepsWrapper /></ProtectedRoute>}
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App(): JSX.Element {
  return (<ThemeProvider><AuthProvider><ProviderProvider><Router><AppContent /></Router></ProviderProvider></AuthProvider></ThemeProvider>);
}

export default App;
