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
import { InvimaPage } from "./pages/InvimaPage";
import { NotificationCenter } from "./components/Notifications";
import { EmailTemplateEditor } from "./components/Notifications/EmailTemplateEditor";
import { SmsTemplateEditor } from "./components/Notifications/SmsTemplateEditor";
import { PushTemplateEditor } from "./components/Notifications/PushTemplateEditor";
import { MultiChannelPreferences } from "./components/Notifications/MultiChannelPreferences";
import { NotificationAnalyticsDashboard } from "./components/Notifications/NotificationAnalyticsDashboard";
import { DeliveryStatusTracker } from "./components/Notifications/DeliveryStatusTracker";
import { Sidebar, TopBar } from "./components/Layout";
import { SuperAdminDashboard } from "./pages/dashboards/SuperAdminDashboard";
import { AuditorDashboard } from "./pages/dashboards/AuditorDashboard";
import { ProviderDashboard } from "./pages/dashboards/ProviderDashboard";
import { ViewerDashboard } from "./pages/dashboards/ViewerDashboard";
import "./App.css";

function DashboardRouter(): JSX.Element {
  const { user } = useAuth();
  const role = user?.role || "provider_admin";
  switch (role) {
    case "super_admin":
      return <SuperAdminDashboard />;
    case "auditor":
      return <AuditorDashboard />;
    case "viewer":
      return <ViewerDashboard />;
    case "provider_admin":
    default:
      return <ProviderDashboard />;
  }
}

function AppContent(): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isAuthenticated } = useAuth();
  const { selectedProvider, setSelectedProvider } = useProvider();
  const toggleSidebar = () => setSidebarOpen(prev => \!prev);
  if (\!isAuthenticated) {
    return <LoginPage />;
  }
  return (<Routes><Route path="/" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} /></Routes>);
}

function App(): JSX.Element {
  return (<ThemeProvider><AuthProvider><ProviderProvider><Router><AppContent /></Router></ProviderProvider></AuthProvider></ThemeProvider>);
}

export default App;
