import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { CaseRecord } from '../types';
import { VerdictBadge } from '../components/VerdictBadge';
export const CaseManager: React.FC = () => {
  const [cases, setCases] = useState<CaseRecord[]>([]);
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
    <div className="flex flex-col gap-space-lg pb-16">
      <div className="pb-space-md">
        <h2 className="text-2xl font-bold text-on-surface tracking-tight flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[24px]">folder_managed</span>
          <span>Incident Triage & Forensic Case Management</span>
        </h2>
        <p className="text-sm text-on-surface-variant mt-1 max-w-3xl leading-relaxed">
          Track security triage investigations, log findings, update lifecycle status, and generate audit-ready forensic reports.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Cases List */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-outline-variant/20 bg-surface-container-low flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">
              Active Incident Queue ({cases.length})
            </h3>
            <span className="text-[11px] font-mono text-secondary font-semibold">SQLite Active</span>
          </div>

          <div className="divide-y divide-outline-variant/10 max-h-[600px] overflow-y-auto">
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
                    isSelected ? 'bg-secondary-fixed/60 border-l-4 border-l-primary' : 'hover:bg-surface-container-low/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5 font-mono">
                    <span className="text-xs font-bold text-secondary">{c.case_id}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${
                        c.status === 'Open'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : c.status === 'Resolved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-on-surface line-clamp-1">{c.title}</h4>
                  <p className="text-[11px] text-on-surface-variant font-mono truncate mt-0.5">{c.target_value}</p>

                  <div className="flex items-center justify-between mt-3 text-[11px] font-mono">
                    <VerdictBadge verdict={c.verdict} size="sm" />
                    <span className="text-on-surface-variant">Risk {c.risk_score}/100</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Case Details & Report */}
        <div className="lg:col-span-2 space-y-4">
          {selectedCase ? (
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20 space-y-5">
              <div className="flex flex-wrap justify-between items-start gap-3 border-b border-outline-variant/20 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1 font-mono">
                    <span className="text-xs font-bold text-secondary">{selectedCase.case_id}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] uppercase font-bold text-on-surface-variant">
                      Priority: {selectedCase.priority}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-on-surface">{selectedCase.title}</h3>
                  <div className="text-xs font-mono text-on-surface-variant mt-0.5">Target: {selectedCase.target_value}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateReport}
                    disabled={generatingReport}
                    className="px-4 py-2 bg-primary hover:opacity-90 text-on-primary text-xs font-semibold rounded-lg shadow-button transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">description</span>
                    <span>{generatingReport ? 'Building...' : 'Generate Forensic Report'}</span>
                  </button>
                </div>
              </div>

              {/* Status Triage Controls */}
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-on-surface-variant font-sans font-medium">Lifecycle Status:</span>
                {['Open', 'Investigating', 'Resolved', 'Archived'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-colors ${
                      selectedCase.status === st
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface border border-outline-variant/20'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Notes Feed */}
              <div className="space-y-2 pt-2 border-t border-outline-variant/20">
                <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Analyst Investigation Notes
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedCase.notes && selectedCase.notes.length > 0 ? (
                    selectedCase.notes.map((n, i) => (
                      <div key={i} className="p-3 rounded-lg bg-surface-container-low font-mono text-xs text-on-surface border border-outline-variant/20">
                        {n}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-on-surface-variant font-sans italic">No investigation notes logged yet.</div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add an investigation finding or evidence note..."
                    className="flex-1 px-3.5 py-2 bg-surface border border-outline-variant/20 rounded-lg text-xs font-mono text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary shadow-xs"
                  />
                  <button
                    onClick={() => handleUpdateStatus(selectedCase.status)}
                    className="px-4 py-2 bg-surface-container-low hover:bg-slate-200 text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/20 transition-colors"
                  >
                    Add Note
                  </button>
                </div>
              </div>

              {/* Forensic Report Output */}
              {reportData && (
                <div className="mt-6 pt-4 border-t border-outline-variant/20 space-y-3.5 bg-surface-container-low p-5 rounded-xl border border-outline-variant/20 animate-in fade-in">
                  <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-on-surface">{reportData.title}</h4>
                      <div className="text-[11px] text-on-surface-variant font-mono">Report Ref: {reportData.report_id} · {reportData.generated_at}</div>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 bg-surface border border-outline-variant/20 text-xs font-semibold rounded-lg text-secondary flex items-center gap-1.5 hover:bg-slate-50 shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">print</span>
                      <span>Print / PDF</span>
                    </button>
                  </div>

                  <div className="text-xs text-on-surface space-y-3 leading-relaxed">
                    <div>
                      <span className="font-bold text-secondary uppercase text-[11px] block">Executive Summary</span>
                      <p className="mt-0.5 text-on-surface-variant">{reportData.executive_summary}</p>
                    </div>

                    <div>
                      <span className="font-bold text-secondary uppercase text-[11px] block">Remediation Recommendations</span>
                      <ul className="list-disc list-inside space-y-1 mt-1 text-on-surface-variant">
                        {reportData.recommendations.map((rec: string, idx: number) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-lg bg-surface border border-outline-variant/20 text-[11px] font-mono text-on-surface-variant italic">
                      {reportData.attribution_disclaimer}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-on-surface-variant bg-surface-container-lowest rounded-xl font-mono text-xs">
              Select a case from the incident queue to inspect details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
