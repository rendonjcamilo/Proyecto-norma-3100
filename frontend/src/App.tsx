import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ComplianceDashboard } from './components/Compliance';
import { NotificationCenter } from './components/Notifications';
import { EmailTemplateEditor } from './components/Notifications/EmailTemplateEditor';
import { SmsTemplateEditor } from './components/Notifications/SmsTemplateEditor';
import { PushTemplateEditor } from './components/Notifications/PushTemplateEditor';
import { MultiChannelPreferences } from './components/Notifications/MultiChannelPreferences';
import { NotificationAnalyticsDashboard } from './components/Notifications/NotificationAnalyticsDashboard';
import { DeliveryStatusTracker } from './components/Notifications/DeliveryStatusTracker';
import { Sidebar, TopBar } from './components/Layout';
import './App.css';

function App(): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  return (
    <Router>
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
                autoConnect={true}
              />
            }
          />

          <main className="app-main">
            <Routes>
              <Route
                path="/"
                element={
                  <ComplianceDashboard
                    providerId="prov-001"
                    providerName="Hospital Central de Bogotá"
                    metrics={mockMetrics}
                    riskAlerts={mockRiskAlerts}
                    onRefresh={handleRefresh}
                    userRole="provider_admin"
                  />
                }
              />
              <Route
                path="/notifications/templates/email"
                element={<EmailTemplateEditor userId="user-1" />}
              />
              <Route
                path="/notifications/templates/sms"
                element={<SmsTemplateEditor userId="user-1" />}
              />
              <Route
                path="/notifications/templates/push"
                element={<PushTemplateEditor userId="user-1" />}
              />
              <Route
                path="/notifications/preferences"
                element={<MultiChannelPreferences userId="user-1" />}
              />
              <Route
                path="/notifications/analytics"
                element={<NotificationAnalyticsDashboard userId="user-1" />}
              />
              <Route
                path="/notifications/delivery-status"
                element={<DeliveryStatusTracker userId="user-1" />}
              />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
