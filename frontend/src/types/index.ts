export interface ThreatResult {
  scan_id?: string;
  scanner_type: string;
  url: string;
  verdict: 'Malicious' | 'Safe' | 'Suspicious' | 'Error';
  risk_score: number;
  confidence: 'High' | 'Medium' | 'Low';
  probability: number;
  threshold?: number;
  model_version?: string;
  algorithm?: string;
  feature_version?: string;
  features_by_family?: Record<string, Record<string, number | string | boolean>>;
  raw_features?: Record<string, number | string | boolean>;
  suspicious_flags?: string[];
  error?: string | null;
  timestamp?: string;
}

export interface NlpSignal {
  category: string;
  detected: boolean;
  confidence: string;
  details: string;
}

export interface AuthResult {
  protocol: 'SPF' | 'DKIM' | 'DMARC';
  status: 'PASS' | 'FAIL' | 'SOFTFAIL' | 'NEUTRAL' | 'NONE' | 'UNVERIFIED';
  details: string;
  explanation: string;
}

export interface SmtpHop {
  hop_index: number;
  from_host: string;
  by_host: string;
  ip?: string;
  country?: string;
  city?: string;
  asn?: string;
  timestamp?: string;
  delay_seconds: number;
  is_suspicious: boolean;
}

export interface EmailThreatResult {
  scan_id?: string;
  scanner_type: string;
  subject?: string;
  sender?: string;
  reply_to?: string;
  return_path?: string;
  headers?: Record<string, string>;
  verdict: 'Malicious' | 'Safe' | 'Suspicious' | 'Error';
  risk_score: number;
  confidence: 'High' | 'Medium' | 'Low';
  url_count: number;
  extracted_urls: string[];
  url_results: ThreatResult[];
  suspicious_flags: string[];
  nlp_signals: NlpSignal[];
  auth_results: AuthResult[];
  relay_path: SmtpHop[];
  attachments_metadata?: Array<{
    filename: string;
    content_type: string;
    size_bytes: number;
    is_executable: boolean;
  }>;
  error?: string | null;
  timestamp?: string;
}

export interface IpIntelResponse {
  ip: string;
  is_valid: boolean;
  is_private: boolean;
  country?: string;
  country_code?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  isp?: string;
  asn?: string;
  domain?: string;
  threat_score: number;
  threat_level: string;
  is_proxy_or_vpn?: boolean;  // Bug 13 fix: not guaranteed by all backend paths
  is_tor_node?: boolean;
  is_known_attacker?: boolean;
  attribution_note?: string;
}

export interface DomainIntelResponse {
  domain: string;
  is_valid: boolean;
  registrar?: string;
  creation_date?: string;
  age_days: number;
  is_newly_registered: boolean;
  mx_records: string[];
  nameservers: string[];
  ip_addresses: string[];
  has_spf: boolean;
  has_dmarc: boolean;
  risk_score: number;
  risk_verdict: string;
  reasons: string[];
}

export interface ThreatFeedResponse {
  indicator: string;
  indicator_type: string;
  provider: string;
  is_listed: boolean;
  reputation: string;
  confidence: number;
  category?: string;
  last_seen?: string;
  source_status: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'email' | 'sender' | 'domain' | 'ip' | 'asn' | 'url' | 'campaign';
  risk: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: string;
  label?: string;
}

export interface GraphCorrelationResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  summary: string;
}

export interface CaseRecord {
  case_id: string;
  title: string;
  target_type: string;
  target_value: string;
  verdict: string;
  risk_score: number;
  status: 'Open' | 'Investigating' | 'Resolved' | 'Archived';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  assigned_analyst: string;
  notes: string[];
  created_at: string;
  updated_at: string;
}

export interface ScanHistoryItem {
  id: number;
  scan_type: 'url' | 'email' | 'qr' | 'screenshot' | 'batch';
  input_repr: string;
  verdict: 'Malicious' | 'Safe' | 'Suspicious';
  risk_score: number;
  confidence: string;
  scanned_at: string;
  // Convenience aliases — Dashboard uses these
  target?: string;
  score?: number;
  timestamp?: string;
}

export interface SystemStats {
  total: number;
  malicious: number;
  safe: number;
  suspicious: number;
  url_scans: number;
  email_scans: number;
}

export interface ModelInfo {
  algorithm: string;
  version: string;
  calibration_method: string;
  selected_threshold: number;
  random_seed: number;
  dataset_version: string;
  feature_version: string;
  training_timestamp?: string;
  checksum_sha256: string;
  locked_test_metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    roc_auc: number;
    pr_auc: number;
    specificity: number;
    fpr: number;
    fnr: number;
    tp: number;
    tn: number;
    fp: number;
    fn: number;
    n_samples: number;
  };
  feature_count: number;
  features: string[];
}
