import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { ComplianceDashboard } from './components/Compliance';
import { DocumentsPage } from './components/Documents';
import { ReportsPage } from './components/Reports';
import { FindingsPage } from './pages/FindingsPage';
import { AssessmentsPage } from './pages/AssessmentsPage';
import { ProvidersPage } from './pages/ProvidersPage';
import { NotificationCenter } from './components/Notifications';
import { EmailTemplateEditor } from './components/Notifications/EmailTemplateEditor';
import { SmsTemplateEditor } from './components/Notifications/SmsTemplateEditor';
import { PushTemplateEditor } from './components/Notifications/PushTemplateEditor';
import { MultiChannelPreferences } from './components/Notifications/MultiChannelPreferences';
import { NotificationAnalyticsDashboard } from './components/Notifications/NotificationAnalyticsDashboard';
import { DeliveryStatusTracker } from './components/Notifications/DeliveryStatusTracker';
import { Sidebar, TopBar } from './components/Layout';
import './App.css';

function AppContent(): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isAuthenticated } = useAuth();

  // Mock data para demostración
  const mockMetrics = {
    providerId: 'prov-001',
    providerName: 'Hospital Central de Bogotá',
    totalFindings: 50,
    openFindings: 10,
    inProgressFindings: 20,
    resolvedFindings: 15,
    closedFindings: 5,
    overdueFindingsCount: 3,
    averageRiskScore: 65,
    compliancePercentage: 70,
    trendDirection: 'improving' as const,
  };

  const mockRiskAlerts = [
    {
      id: 'alert-1',
      findingId: 'find-1',
      title: 'Sistema de backup no operacional',
      severity: 'critical' as const,
      riskScore: 92,
      daysOverdue: 5,
    },
    {
      id: 'alert-2',
      findingId: 'find-2',
      title: 'Certificaciones de personal vencidas',
      severity: 'high' as const,
      riskScore: 85,
      daysOverdue: 2,
    },
    {
      id: 'alert-3',
      findingId: 'find-3',
      title: 'Protocolos de seguridad desactualizados',
      severity: 'high' as const,
      riskScore: 78,
      daysOverdue: 0,
    },
  ];

  const handleRefresh = async () => {
    console.log('Refreshing compliance data...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Data refreshed');
  };

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="app-shell">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      <div className="app-content">
        <TopBar
          onMenuToggle={toggleSidebar}
          rightSlot={
            <NotificationCenter
              userId="user-1"
              providerId="prov-001"
              role="provider_admin"
              autoConnect={false}
            />
          }
        />

        <main className="app-main">
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <ComplianceDashboard
                    providerId="prov-001"
                    providerName="Hospital Central de Bogotá"
                    metrics={mockMetrics}
                    riskAlerts={mockRiskAlerts}
                    onRefresh={handleRefresh}
                    userRole="provider_admin"
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents"
              element={
                <ProtectedRoute requiredRoles={['super_admin', 'auditor', 'provider_admin']}>
                  <DocumentsPage
                    providerId="prov-001"
                    providerName="Hospital Central de Bogotá"
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute requiredRoles={['super_admin', 'auditor']}>
                  <ReportsPage
                    providerId="prov-001"
                    providerName="Hospital Central de Bogotá"
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/findings"
              element={
                <ProtectedRoute>
                  <FindingsPage providerId="prov-001" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessments"
              element={
                <ProtectedRoute requiredRoles={['super_admin', 'auditor', 'provider_admin']}>
                  <AssessmentsPage providerId="prov-001" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/providers"
              element={
                <ProtectedRoute requiredRoles={['super_admin', 'auditor']}>
                  <ProvidersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications/templates/email"
              element={
                <ProtectedRoute requiredRoles={['super_admin']}>
                  <EmailTemplateEditor userId="user-1" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications/templates/sms"
              element={
                <ProtectedRoute requiredRoles={['super_admin']}>
                  <SmsTemplateEditor userId="user-1" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications/templates/push"
              element={
                <ProtectedRoute requiredRoles={['super_admin']}>
                  <PushTemplateEditor userId="user-1" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications/preferences"
              element={
                <ProtectedRoute>
                  <MultiChannelPreferences userId="user-1" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications/analytics"
              element={
                <ProtectedRoute requiredRoles={['super_admin', 'auditor']}>
                  <NotificationAnalyticsDashboard userId="user-1" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications/delivery-status"
              element={
                <ProtectedRoute requiredRoles={['super_admin', 'auditor']}>
                  <DeliveryStatusTracker userId="user-1" />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App(): JSX.Element {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
