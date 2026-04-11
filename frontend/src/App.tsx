import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ComplianceDashboard } from './components/Compliance';
import { NotificationCenter } from './components/Notifications';
import './App.css';

function App(): JSX.Element {
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
    // Simular actualización de datos
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Data refreshed');
  };

  return (
    <Router>
      <div className='app'>
        {/* Header with Notification Center */}
        <header className='app-header'>
          <div className='header-content'>
            <h1 className='app-title'>Norma 3100 - Sistema de Cumplimiento</h1>
            <div className='header-right'>
              <span className='provider-badge'>Hospital Central de Bogotá</span>
              <NotificationCenter
                userId="user-1"
                providerId="prov-001"
                role="provider_admin"
                autoConnect={true}
              />
            </div>
          </div>
        </header>

        <main className='app-main'>
          <Routes>
            <Route
              path='/'
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
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
