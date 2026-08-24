import axios from 'axios';
import {
  ThreatResult,
  EmailThreatResult,
  IpIntelResponse,
  DomainIntelResponse,
  ThreatFeedResponse,
  GraphCorrelationResponse,
  CaseRecord,
  ScanHistoryItem,
  SystemStats,
  ModelInfo,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiClient = {
  // Scans
  scanUrl: async (url: string, saveHistory = true): Promise<ThreatResult> => {
    const res = await api.post('/scan/url', { url, save_history: saveHistory });
    return res.data;
  },

  scanEmail: async (raw_email: string, saveHistory = true): Promise<EmailThreatResult> => {
    const res = await api.post('/scan/email', { raw_email, save_history: saveHistory });
    return res.data;
  },

  scanEmlFile: async (file: File): Promise<EmailThreatResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/scan/eml', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  scanQr: async (payload?: string, file?: File): Promise<ThreatResult> => {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      if (payload) formData.append('payload', payload);
      const res = await api.post('/scan/qr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } else {
      const formData = new FormData();
      if (payload) formData.append('payload', payload);
      const res = await api.post('/scan/qr', formData);
      return res.data;
    }
  },

  scanScreenshot: async (ocr_text?: string, file?: File): Promise<any> => {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      if (ocr_text) formData.append('ocr_text', ocr_text);
      const res = await api.post('/scan/screenshot', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } else {
      const formData = new FormData();
      if (ocr_text) formData.append('ocr_text', ocr_text);
      const res = await api.post('/scan/screenshot', formData);
      return res.data;
    }
  },

  scanBatch: async (items: string[]): Promise<any> => {
    const res = await api.post('/scan/batch', { items });
    return res.data;
  },

  // Intelligence
  getIpIntel: async (ip: string): Promise<IpIntelResponse> => {
    const res = await api.get(`/intelligence/ip/${encodeURIComponent(ip)}`);
    return res.data;
  },

  getDomainIntel: async (domain: string): Promise<DomainIntelResponse> => {
    const res = await api.get(`/intelligence/domain/${encodeURIComponent(domain)}`);
    return res.data;
  },

  getThreatFeed: async (indicator: string, type = 'URL'): Promise<ThreatFeedResponse[]> => {
    const res = await api.get(`/intelligence/threat-feed`, {
      params: { indicator, indicator_type: type },
    });
    return res.data;
  },

  // Correlation & Graph
  getCorrelationGraph: async (email?: string, domain?: string): Promise<GraphCorrelationResponse> => {
    const res = await api.get('/correlation/graph', {
      params: { email, domain },
    });
    return res.data;
  },

  // Cases
  getCases: async (): Promise<CaseRecord[]> => {
    const res = await api.get('/cases');
    return res.data;
  },

  createCase: async (data: {
    title: string;
    target_type: string;
    target_value: string;
    verdict: string;
    risk_score: number;
    priority?: string;
    notes?: string;
  }): Promise<CaseRecord> => {
    const res = await api.post('/cases', data);
    return res.data;
  },

  updateCaseStatus: async (caseId: string, status: string, note?: string): Promise<any> => {
    const res = await api.post(`/cases/${caseId}/status`, { status, note });
    return res.data;
  },

  generateReport: async (target_value: string, target_type = 'email', case_id?: string, scan_data?: any): Promise<any> => {
    const res = await api.post('/cases/report', {
      target_value,
      target_type,
      case_id,
      scan_data,
    });
    return res.data;
  },

  // History & Stats
  getHistory: async (limit = 50): Promise<ScanHistoryItem[]> => {
    const res = await api.get('/history', { params: { limit } });
    return res.data;
  },

  getStats: async (): Promise<SystemStats> => {
    const res = await api.get('/stats');
    return res.data;
  },

  // Model Info
  getModelInfo: async (): Promise<ModelInfo> => {
    const res = await api.get('/model/info');
    return res.data;
  },

  getModelComparison: async (): Promise<any> => {
    const res = await api.get('/model/comparison');
    return res.data;
  },
};
