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
        return 'Cyber Operations Dashboard';
      case 'email':
        return 'Email Threat & Forensics Analyzer';
      case 'url':
        return 'URL & Domain ML Scanner';
      case 'qr':
        return 'QR Code & Quishing Scanner';
      case 'screenshot':
        return 'Screenshot & Message OCR Analyzer';
      case 'batch':
        return 'Batch Security Vector Scanner';
      case 'graph':
        return 'Infrastructure Correlation Graph';
      case 'cases':
        return 'Incident Triage & Case Management';
      case 'model':
        return 'Model Performance & Telemetry';
      case 'settings':
        return 'System Configuration';
      default:
        return 'ThreatLens';
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
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 ml-[260px] flex flex-col min-h-screen">
        <Header title={getPageTitle()} />
        <main className="flex-1 mt-14 p-8 bg-surface">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
};

export default App;
