import React, { useState, useEffect, useCallback } from 'react';
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
import { LoginPage } from './pages/LoginPage';
import { apiClient } from './api/client';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authUser, setAuthUser] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // On mount: validate stored token with the server
  useEffect(() => {
    const token = localStorage.getItem('tl_token');
    const stored = localStorage.getItem('tl_user');
    if (!token) {
      setAuthChecking(false);
      return;
    }
    // Validate token is still accepted by the backend
    apiClient.getMe()
      .then((me) => setAuthUser(me.username))
      .catch(() => {
        localStorage.removeItem('tl_token');
        localStorage.removeItem('tl_user');
      })
      .finally(() => setAuthChecking(false));
    // Suppress unused var warning — stored is used as a fallback on the next render cycle
    void stored;
  }, []);

  // Listen for 401 events fired by the axios interceptor
  const handleLogout = useCallback(() => {
    setAuthUser(null);
  }, []);

  useEffect(() => {
    window.addEventListener('tl:logout', handleLogout);
    return () => window.removeEventListener('tl:logout', handleLogout);
  }, [handleLogout]);

  const logout = () => {
    localStorage.removeItem('tl_token');
    localStorage.removeItem('tl_user');
    setAuthUser(null);
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':    return 'Command Center';
      case 'email':        return 'Email Forensics Workspace';
      case 'url':          return 'URL Security Scanner';
      case 'qr':           return 'QR Code & Quishing Analyzer';
      case 'screenshot':   return 'Screenshot & Message OCR Scanner';
      case 'batch':        return 'Batch Threat Vector Scanner';
      case 'graph':        return 'Infrastructure Correlation Graph';
      case 'cases':        return 'Incident Case Management';
      case 'model':        return 'Active AI Model Performance';
      case 'settings':     return 'System Configuration';
      default:             return 'Command Center';
    }
  };

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':   return <Dashboard onNavigate={setActiveTab} />;
      case 'email':       return <EmailAnalyzer />;
      case 'url':         return <UrlScanner />;
      case 'qr':          return <QrScanner />;
      case 'screenshot':  return <ScreenshotScanner />;
      case 'batch':       return <BatchScanner />;
      case 'graph':       return <GraphView />;
      case 'cases':       return <CaseManager />;
      case 'model':       return <ModelInfo />;
      case 'settings':    return <SettingsPage />;
      default:            return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  // ── Loading splash while checking token ───────────────────────────────────
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#0d1b2e] flex items-center justify-center gap-3">
        <div className="w-5 h-5 border-2 border-[#1E7EF5]/30 border-t-[#1E7EF5] rounded-full animate-spin" />
        <span className="text-white/40 font-mono text-sm">Initializing...</span>
      </div>
    );
  }

  // ── Not authenticated → show Login ────────────────────────────────────────
  if (!authUser) {
    return <LoginPage onLoginSuccess={setAuthUser} />;
  }

  // ── Authenticated → show full app ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface text-on-surface flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        <Header title={getPageTitle()} username={authUser} onLogout={logout} />
        <main className="flex-1 pt-14 bg-surface min-h-screen">
          <div className="p-space-xl max-w-[1600px] mx-auto">
            {renderActivePage()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
