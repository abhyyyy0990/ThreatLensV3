import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { CaseRecord } from '../types';
import { VerdictBadge } from '../components/VerdictBadge';
import { Briefcase, FileText, Printer, CheckCircle2, ShieldAlert } from 'lucide-react';

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
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16">
      <div className="border-b border-white/[0.06] pb-4">
        <h2 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-cyan-400" />
          <span>Incident Triage & Forensic Case Management</span>
        </h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Track security triage investigations, log findings, update lifecycle status, and generate audit-ready forensic reports.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Cases List */}
        <div className="bg-surface border border-white/[0.08] rounded-xl shadow-card overflow-hidden">
          <div className="p-4 border-b border-white/[0.06] bg-surface-elevated/40 flex justify-between items-center">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">
              Active Incident Queue ({cases.length})
            </h3>
            <span className="text-[10px] font-mono text-cyan-400">SQLite Active</span>
          </div>

          <div className="divide-y divide-white/[0.04] max-h-[600px] overflow-y-auto">
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
                    isSelected ? 'bg-cyan-500/[0.08] border-l-2 border-l-cyan-400' : 'hover:bg-surface-elevated/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5 font-mono">
                    <span className="text-xs font-bold text-cyan-400">{c.case_id}</span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase border ${
                        c.status === 'Open'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : c.status === 'Resolved'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-white/5 text-text-muted border-white/10'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-text-primary line-clamp-1">{c.title}</h4>
                  <p className="text-[11px] text-text-muted font-mono truncate mt-0.5">{c.target_value}</p>

                  <div className="flex items-center justify-between mt-3 text-[11px] font-mono">
                    <VerdictBadge verdict={c.verdict} size="sm" />
                    <span className="text-text-muted">Risk {c.risk_score}/100</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Case Details & Report */}
        <div className="lg:col-span-2 space-y-4">
          {selectedCase ? (
            <div className="bg-surface border border-white/[0.08] rounded-xl p-5 shadow-card space-y-4">
              <div className="flex flex-wrap justify-between items-start gap-3 border-b border-white/[0.06] pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1 font-mono">
                    <span className="text-xs font-bold text-cyan-400">{selectedCase.case_id}</span>
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] uppercase font-bold text-text-secondary">
                      Priority: {selectedCase.priority}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-text-primary">{selectedCase.title}</h3>
                  <div className="text-xs font-mono text-text-muted mt-0.5">Target: {selectedCase.target_value}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateReport}
                    disabled={generatingReport}
                    className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-background text-xs font-mono font-bold rounded-lg shadow-[0_0_20px_rgba(0,166,198,0.3)] transition-all flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{generatingReport ? 'Building...' : 'Generate Forensic Report'}</span>
                  </button>
                </div>
              </div>

              {/* Status Triage Controls */}
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-text-muted">Lifecycle Status:</span>
                {['Open', 'Investigating', 'Resolved', 'Archived'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(st)}
                    className={`px-2.5 py-1 rounded text-xs font-bold uppercase transition-colors ${
                      selectedCase.status === st
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,166,198,0.2)]'
                        : 'bg-surface-elevated text-text-muted hover:text-text-primary border border-white/[0.06]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Notes Feed */}
              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted">
                  Analyst Investigation Notes
                </h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedCase.notes && selectedCase.notes.length > 0 ? (
                    selectedCase.notes.map((n, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-background font-mono text-xs text-text-primary border border-white/[0.06]">
                        {n}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-text-muted font-mono italic">No investigation notes logged yet.</div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add an investigation finding or evidence note..."
                    className="flex-1 px-3 py-1.5 bg-background border border-white/[0.08] rounded-lg text-xs font-mono text-text-primary focus:outline-none focus:border-cyan-500/60"
                  />
                  <button
                    onClick={() => handleUpdateStatus(selectedCase.status)}
                    className="px-3 py-1.5 bg-surface-elevated hover:bg-surface-hover text-xs font-mono font-bold text-text-primary rounded-lg border border-white/[0.08]"
                  >
                    Add Note
                  </button>
                </div>
              </div>

              {/* Forensic Report Output */}
              {reportData && (
                <div className="mt-6 pt-4 border-t border-white/[0.08] space-y-3 bg-surface-elevated/40 p-4 rounded-xl border border-white/[0.08] animate-in fade-in">
                  <div className="flex justify-between items-center border-b border-white/[0.06] pb-2">
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">{reportData.title}</h4>
                      <div className="text-[10px] text-text-muted font-mono">Report Ref: {reportData.report_id} · {reportData.generated_at}</div>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="px-2.5 py-1 bg-surface border border-white/[0.08] text-xs font-mono font-semibold rounded text-cyan-400 flex items-center gap-1 hover:bg-white/5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print / PDF</span>
                    </button>
                  </div>

                  <div className="text-xs text-text-primary space-y-2">
                    <div>
                      <span className="font-mono font-bold text-cyan-400 uppercase text-[10px] block">Executive Summary</span>
                      <p className="mt-0.5 leading-relaxed text-text-secondary">{reportData.executive_summary}</p>
                    </div>

                    <div>
                      <span className="font-mono font-bold text-cyan-400 uppercase text-[10px] block">Remediation Recommendations</span>
                      <ul className="list-disc list-inside space-y-0.5 mt-1 text-text-secondary">
                        {reportData.recommendations.map((rec: string, idx: number) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-2.5 rounded bg-background border border-white/[0.06] text-[10px] font-mono text-text-muted italic">
                      {reportData.attribution_disclaimer}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-text-muted bg-surface border border-white/[0.08] rounded-xl font-mono text-xs">
              Select a case from the incident queue to inspect details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
