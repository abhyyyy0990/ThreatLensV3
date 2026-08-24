import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { CaseRecord } from '../types';
import { VerdictBadge } from '../components/VerdictBadge';
import { Briefcase, Plus, FileText, CheckCircle2, Clock, ShieldAlert, ArrowRight, Printer } from 'lucide-react';

export const CaseManager: React.FC = () => {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [newNote, setNewNote] = useState('');
  const [reportData, setReportData] = useState<any | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  const loadCases = async () => {
    try {
      const data = await apiClient.getCases();
      setCases(data);
      if (data.length > 0 && !selectedCase) {
        setSelectedCase(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const handleUpdateStatus = async (status: string) => {
    if (!selectedCase) return;
    try {
      await apiClient.updateCaseStatus(selectedCase.case_id, status, newNote.trim() || undefined);
      setNewNote('');
      await loadCases();
      const updated = cases.find((c) => c.case_id === selectedCase.case_id);
      if (updated) setSelectedCase({ ...updated, status: status as any });
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedCase) return;
    setGeneratingReport(true);
    try {
      const rep = await apiClient.generateReport(
        selectedCase.target_value,
        selectedCase.target_type,
        selectedCase.case_id
      );
      setReportData(rep);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto pb-16">
      <div className="border-b border-outline-variant pb-4">
        <h2 className="text-xl font-bold text-on-surface tracking-tight flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary" />
          <span>Incident Triage & Forensic Case Management</span>
        </h2>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Track security triage investigations, log findings, update lifecycle status, and generate audit-ready forensic reports.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Cases List */}
        <div className="bg-white border border-outline-variant rounded-xl shadow-feather overflow-hidden">
          <div className="p-4 border-b border-outline-variant bg-surface-container-low/40 flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">Active Incident Cases ({cases.length})</h3>
            <span className="text-[10px] font-mono text-outline">SQLite Persistence</span>
          </div>

          <div className="divide-y divide-outline-variant/40 max-h-[600px] overflow-y-auto">
            {cases.map((c) => {
              const isSelected = selectedCase?.case_id === c.case_id;
              return (
                <div
                  key={c.case_id}
                  onClick={() => {
                    setSelectedCase(c);
                    setReportData(null);
                  }}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-surface-container-low/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-xs font-bold text-primary">{c.case_id}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        c.status === 'Open'
                          ? 'bg-amber-100 text-amber-800'
                          : c.status === 'Resolved'
                          ? 'bg-secondary-container text-secondary'
                          : 'bg-surface-container-highest text-on-surface-variant'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-on-surface line-clamp-1">{c.title}</h4>
                  <p className="text-[11px] text-outline font-mono truncate mt-0.5">{c.target_value}</p>

                  <div className="flex items-center justify-between mt-3 text-[11px]">
                    <VerdictBadge verdict={c.verdict} size="sm" />
                    <span className="font-mono text-outline">Risk {c.risk_score}/100</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Case Details & Report */}
        <div className="lg:col-span-2 space-y-4">
          {selectedCase ? (
            <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-feather space-y-4">
              <div className="flex flex-wrap justify-between items-start gap-3 border-b border-outline-variant/60 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-primary">{selectedCase.case_id}</span>
                    <span className="px-2 py-0.5 rounded bg-surface-container-highest text-[10px] uppercase font-bold text-on-surface-variant">
                      Priority: {selectedCase.priority}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-on-surface">{selectedCase.title}</h3>
                  <div className="text-xs font-mono text-outline mt-0.5">Target: {selectedCase.target_value}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateReport}
                    disabled={generatingReport}
                    className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{generatingReport ? 'Building Report...' : 'Generate Forensic Report'}</span>
                  </button>
                </div>
              </div>

              {/* Status Triage Controls */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-outline font-semibold">Change Lifecycle Status:</span>
                {['Open', 'Investigating', 'Resolved', 'Archived'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(st)}
                    className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors ${
                      selectedCase.status === st
                        ? 'bg-primary text-white'
                        : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Notes Feed */}
              <div className="space-y-2 pt-2 border-t border-outline-variant/40">
                <h4 className="text-xs font-bold uppercase tracking-wider text-outline">Analyst Investigation Notes</h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedCase.notes && selectedCase.notes.length > 0 ? (
                    selectedCase.notes.map((n, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface">
                        {n}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-outline italic">No investigation notes logged yet.</div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add an investigation finding or evidence note..."
                    className="flex-1 px-3 py-1.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs"
                  />
                  <button
                    onClick={() => handleUpdateStatus(selectedCase.status)}
                    className="px-3 py-1.5 bg-surface-container-highest hover:bg-surface-container-high text-xs font-semibold rounded-lg border border-outline-variant"
                  >
                    Add Note
                  </button>
                </div>
              </div>

              {/* Forensic Report Output */}
              {reportData && (
                <div className="mt-6 pt-4 border-t-2 border-outline-variant space-y-3 bg-surface-container-low/30 p-4 rounded-xl border border-outline-variant animate-in fade-in">
                  <div className="flex justify-between items-center border-b border-outline-variant pb-2">
                    <div>
                      <h4 className="text-sm font-bold text-on-surface">{reportData.title}</h4>
                      <div className="text-[10px] text-outline font-mono">Report Ref: {reportData.report_id} · {reportData.generated_at}</div>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="px-2.5 py-1 bg-white border border-outline-variant text-xs font-semibold rounded-md flex items-center gap-1 hover:bg-surface-container-highest"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print / PDF</span>
                    </button>
                  </div>

                  <div className="text-xs text-on-surface space-y-2">
                    <div>
                      <span className="font-bold text-outline uppercase text-[10px] block">Executive Summary</span>
                      <p className="mt-0.5 leading-relaxed">{reportData.executive_summary}</p>
                    </div>

                    <div>
                      <span className="font-bold text-outline uppercase text-[10px] block">Remediation Recommendations</span>
                      <ul className="list-disc list-inside space-y-0.5 mt-1 text-on-surface-variant">
                        {reportData.recommendations.map((rec: string, idx: number) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-2.5 rounded bg-surface-container-highest/60 text-[10px] text-outline italic">
                      {reportData.attribution_disclaimer}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-outline bg-white border border-outline-variant rounded-xl">
              Select a case from the triage list to inspect details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
