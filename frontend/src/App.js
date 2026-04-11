import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ComplianceDashboard } from './components/Compliance';
import { NotificationCenter } from './components/Notifications';
import { NotificationNav } from './components/NotificationNav';
import { EmailTemplateEditor } from './components/Notifications/EmailTemplateEditor';
import { SmsTemplateEditor } from './components/Notifications/SmsTemplateEditor';
import { PushTemplateEditor } from './components/Notifications/PushTemplateEditor';
import { MultiChannelPreferences } from './components/Notifications/MultiChannelPreferences';
import { NotificationAnalyticsDashboard } from './components/Notifications/NotificationAnalyticsDashboard';
import { DeliveryStatusTracker } from './components/Notifications/DeliveryStatusTracker';
import './App.css';
function App() {
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
        trendDirection: 'improving',
    };
    const mockRiskAlerts = [
        {
            id: 'alert-1',
            findingId: 'find-1',
            title: 'Sistema de backup no operacional',
            severity: 'critical',
            riskScore: 92,
            daysOverdue: 5,
        },
        {
            id: 'alert-2',
            findingId: 'find-2',
            title: 'Certificaciones de personal vencidas',
            severity: 'high',
            riskScore: 85,
            daysOverdue: 2,
        },
        {
            id: 'alert-3',
            findingId: 'find-3',
            title: 'Protocolos de seguridad desactualizados',
            severity: 'high',
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
    return (_jsx(Router, { children: _jsxs("div", { className: 'app', children: [_jsx("header", { className: 'app-header', children: _jsxs("div", { className: 'header-content', children: [_jsx("h1", { className: 'app-title', children: "Norma 3100 - Sistema de Cumplimiento" }), _jsxs("div", { className: 'header-right', children: [_jsx("span", { className: 'provider-badge', children: "Hospital Central de Bogot\u00E1" }), _jsx(NotificationNav, {}), _jsx(NotificationCenter, { userId: "user-1", providerId: "prov-001", role: "provider_admin", autoConnect: true })] })] }) }), _jsx("main", { className: 'app-main', children: _jsxs(Routes, { children: [_jsx(Route, { path: '/', element: _jsx(ComplianceDashboard, { providerId: "prov-001", providerName: "Hospital Central de Bogot\u00E1", metrics: mockMetrics, riskAlerts: mockRiskAlerts, onRefresh: handleRefresh, userRole: "provider_admin" }) }), _jsx(Route, { path: '/notifications/templates/email', element: _jsx(EmailTemplateEditor, { userId: "user-1" }) }), _jsx(Route, { path: '/notifications/templates/sms', element: _jsx(SmsTemplateEditor, { userId: "user-1" }) }), _jsx(Route, { path: '/notifications/templates/push', element: _jsx(PushTemplateEditor, { userId: "user-1" }) }), _jsx(Route, { path: '/notifications/preferences', element: _jsx(MultiChannelPreferences, { userId: "user-1" }) }), _jsx(Route, { path: '/notifications/analytics', element: _jsx(NotificationAnalyticsDashboard, { userId: "user-1" }) }), _jsx(Route, { path: '/notifications/delivery-status', element: _jsx(DeliveryStatusTracker, { userId: "user-1" }) })] }) })] }) }));
}
export default App;
//# sourceMappingURL=App.js.map