import { useState, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ProviderProvider, useProvider } from "./context/ProviderContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Sidebar, TopBar } from "./components/Layout";
import "./App.css";

// Siempre cargados (parte del shell de la app)
// Sidebar y TopBar se renderizan en cada página autenticada

// Lazy-loaded — solo se descargan cuando el usuario navega a esa ruta
const LoginPage = lazy(() => import("./pages/LoginPage").then(m => ({ default: m.LoginPage })));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage").then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage").then(m => ({ default: m.ResetPasswordPage })));
const ChangePasswordPage = lazy(() => import("./pages/ChangePasswordPage").then(m => ({ default: m.ChangePasswordPage })));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage").then(m => ({ default: m.PrivacyPolicyPage })));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage").then(m => ({ default: m.TermsOfServicePage })));

const SuperAdminDashboard = lazy(() => import("./pages/dashboards/SuperAdminDashboard").then(m => ({ default: m.SuperAdminDashboard })));
const AuditorDashboard = lazy(() => import("./pages/dashboards/AuditorDashboard").then(m => ({ default: m.AuditorDashboard })));
const ProviderDashboard = lazy(() => import("./pages/dashboards/ProviderDashboard").then(m => ({ default: m.ProviderDashboard })));

const AssessmentsPage = lazy(() => import("./pages/AssessmentsPage").then(m => ({ default: m.AssessmentsPage })));
const AssessmentExecutionPage = lazy(() => import("./pages/AssessmentExecutionPage").then(m => ({ default: m.AssessmentExecutionPage })));
const AssessmentGeneratorPage = lazy(() => import("./pages/AssessmentGeneratorPage").then(m => ({ default: m.AssessmentGeneratorPage })));
const AssessmentResultPage = lazy(() => import("./pages/AssessmentResultPage").then(m => ({ default: m.AssessmentResultPage })));

const FindingsPage = lazy(() => import("./pages/FindingsPage").then(m => ({ default: m.FindingsPage })));
const ProvidersPage = lazy(() => import("./pages/ProvidersPage").then(m => ({ default: m.ProvidersPage })));
const UsersPage = lazy(() => import("./pages/UsersPage").then(m => ({ default: m.UsersPage })));
const QuestionnairesPage = lazy(() => import("./pages/QuestionnairesPage").then(m => ({ default: m.QuestionnairesPage })));

const DocumentsPage = lazy(() => import("./components/Documents").then(m => ({ default: m.DocumentsPage })));
const ReportsPage = lazy(() => import("./components/Reports").then(m => ({ default: m.ReportsPage })));

const NotificationCenter = lazy(() => import("./components/Notifications").then(m => ({ default: m.NotificationCenter })));
const EmailTemplateEditor = lazy(() => import("./components/Notifications/EmailTemplateEditor").then(m => ({ default: m.EmailTemplateEditor })));
const MultiChannelPreferences = lazy(() => import("./components/Notifications/MultiChannelPreferences").then(m => ({ default: m.MultiChannelPreferences })));
const NotificationAnalyticsDashboard = lazy(() => import("./components/Notifications/NotificationAnalyticsDashboard").then(m => ({ default: m.NotificationAnalyticsDashboard })));
const DeliveryStatusTracker = lazy(() => import("./components/Notifications/DeliveryStatusTracker").then(m => ({ default: m.DeliveryStatusTracker })));
const AuditorNotificationsPage = lazy(() => import("./pages/notifications/AuditorNotificationsPage").then(m => ({ default: m.AuditorNotificationsPage })));

const AuditorClientsPage = lazy(() => import("./pages/AuditorClientsPage").then(m => ({ default: m.AuditorClientsPage })));
const InvimaPage = lazy(() => import("./pages/InvimaPage").then(m => ({ default: m.InvimaPage })));
const RepsPage = lazy(() => import("./pages/RepsPage").then(m => ({ default: m.RepsPage })));
const AnexoCuatroPage = lazy(() => import("./pages/AnexoCuatroPage").then(m => ({ default: m.AnexoCuatroPage })));

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center', color: '#6b7280' }}>
        <div style={{
          width: '36px', height: '36px',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #6366f1',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
          margin: '0 auto 10px',
        }} />
        Cargando...
      </div>
    </div>
  );
}

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
  const { selectedProvider, availableProviders, setSelectedProvider, isLoading } = useProvider();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#666', fontSize: '16px' }}>
        Cargando prestador...
      </div>
    );
  }

  if (!selectedProvider) {
    if (availableProviders.length === 0) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#888', fontSize: '15px', flexDirection: 'column', gap: '8px' }}>
          <span>⚠️ No tienes prestadores asignados.</span>
          <span style={{ fontSize: '13px' }}>Contacta al administrador para que te asigne un prestador.</span>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', flexDirection: 'column', gap: '16px' }}>
        <span style={{ color: '#666', fontSize: '15px' }}>⚠️ Selecciona un prestador para continuar</span>
        <select
          onChange={(e) => {
            const p = availableProviders.find(p => p.id === e.target.value);
            if (p) setSelectedProvider(p);
          }}
          style={{ padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #c7d2fe', fontSize: '14px', color: '#374151', cursor: 'pointer' }}
        >
          <option value="">— Seleccionar prestador —</option>
          {availableProviders.map(p => (
            <option key={p.id} value={p.id}>{p.legalName}</option>
          ))}
        </select>
      </div>
    );
  }

  return <InvimaPage providerId={selectedProvider.id} />;
};

const RepsWrapper = () => {
  const { selectedProvider, availableProviders, setSelectedProvider, isLoading } = useProvider();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#666', fontSize: '16px' }}>
        Cargando prestador...
      </div>
    );
  }

  if (!selectedProvider) {
    if (availableProviders.length === 0) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#888', fontSize: '15px', flexDirection: 'column', gap: '8px' }}>
          <span>⚠️ No tienes prestadores asignados.</span>
          <span style={{ fontSize: '13px' }}>Contacta al administrador para que te asigne un prestador.</span>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', flexDirection: 'column', gap: '16px' }}>
        <span style={{ color: '#666', fontSize: '15px' }}>⚠️ Selecciona un prestador para continuar</span>
        <select
          onChange={(e) => {
            const p = availableProviders.find(p => p.id === e.target.value);
            if (p) setSelectedProvider(p);
          }}
          style={{ padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #c7d2fe', fontSize: '14px', color: '#374151', cursor: 'pointer' }}
        >
          <option value="">— Seleccionar prestador —</option>
          {availableProviders.map(p => (
            <option key={p.id} value={p.id}>{p.legalName}</option>
          ))}
        </select>
      </div>
    );
  }

  return <RepsPage providerId={selectedProvider.id} />;
};

function AppContent(): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const { isAuthenticated, user } = useAuth();
  const { selectedProvider, availableProviders, setSelectedProvider } = useProvider();

  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(prev => !prev)} onClose={closeSidebarOnMobile} />
      <div className="app-main">
        <TopBar onMenuToggle={() => setSidebarOpen(prev => !prev)} providers={availableProviders} selectedProvider={selectedProvider} onSelectProvider={setSelectedProvider} userRole={user?.role} />
        <main className="app-content">
          <Suspense fallback={<PageLoader />}>
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
                element={<ProtectedRoute requiredRoles={["auditor", "super_admin"]}><ProvidersPage /></ProtectedRoute>}
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

              {/* Notifications — subrutas específicas primero */}
              <Route
                path="/notifications/email-templates"
                element={<ProtectedRoute requiredRoles={["super_admin", "auditor"]}><EmailTemplateEditorWrapper /></ProtectedRoute>}
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

              {/* Auditor clients */}
              <Route
                path="/auditor/clients"
                element={<ProtectedRoute requiredRoles={["auditor", "super_admin"]}><AuditorClientsPage /></ProtectedRoute>}
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

              {/* Anexo 4 */}
              <Route
                path="/anexo4"
                element={<ProtectedRoute requiredRoles={["auditor", "super_admin"]}><AnexoCuatroPage /></ProtectedRoute>}
              />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function App(): JSX.Element {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProviderProvider>
          <Router>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/privacidad" element={<PrivacyPolicyPage />} />
                <Route path="/terminos" element={<TermsOfServicePage />} />
                <Route path="*" element={<AppContent />} />
              </Routes>
            </Suspense>
          </Router>
        </ProviderProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
