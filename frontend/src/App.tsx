import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { EmailAnalyzer } from './pages/EmailAnalyzer';
import { UrlScanner } from './pages/UrlScanner';
import { QrScanner } from './pages/QrScanner';
import { ScreenshotScanner } from './pages/ScreenshotScanner';
import { BatchScanner } from './pages/BatchScanner';
import { GraphView } from './pages/GraphView';
import { CaseManager } from './pages/CaseManager';
import { ModelInfo } from './pages/ModelInfo';
import { SettingsPage } from './pages/Settings';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Command Center';
      case 'email':
        return 'Email Forensics Workspace';
      case 'url':
        return 'URL Security Scanner';
      case 'qr':
        return 'QR Code & Quishing Analyzer';
      case 'screenshot':
        return 'Screenshot & Message OCR Scanner';
      case 'batch':
        return 'Batch Threat Vector Scanner';
      case 'graph':
        return 'Infrastructure Correlation Graph';
      case 'cases':
        return 'Incident Case Management';
      case 'model':
        return 'Active AI Model Performance';
      case 'settings':
        return 'System Configuration';
      default:
        return 'Command Center';
    }
  };

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} />;
      case 'email':
        return <EmailAnalyzer />;
      case 'url':
        return <UrlScanner />;
      case 'qr':
        return <QrScanner />;
      case 'screenshot':
        return <ScreenshotScanner />;
      case 'batch':
        return <BatchScanner />;
      case 'graph':
        return <GraphView />;
      case 'cases':
        return <CaseManager />;
      case 'model':
        return <ModelInfo />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary flex selection:bg-primary-subtle selection:text-primary">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 ml-[260px] flex flex-col min-h-screen">
        <Header title={getPageTitle()} />
        <main className="flex-1 mt-14 p-8 bg-background">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
};

export default App;
