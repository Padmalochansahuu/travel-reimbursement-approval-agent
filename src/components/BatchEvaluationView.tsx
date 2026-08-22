import React, { useState } from 'react';
import { 
  Play, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  FileCode, 
  CheckCircle2, 
  AlertTriangle,
  FileCheck,
  Eye
} from 'lucide-react';
import { BatchEvaluationSummary, StructuredClaimResult, ReimbursementClaim } from '../types';
import { DecisionBadge } from './DashboardView';

interface BatchEvaluationViewProps {
  summary: BatchEvaluationSummary | null;
  claims: ReimbursementClaim[];
  onRunBatch: () => void;
  isEvaluating: boolean;
  onSelectClaim: (id: string) => void;
}

export const BatchEvaluationView: React.FC<BatchEvaluationViewProps> = ({
  summary,
  claims,
  onRunBatch,
  isEvaluating,
  onSelectClaim
}) => {
  const [copied, setCopied] = useState(false);

  // Extract clean structured results matching Section 3 specification
  const cleanStructuredArray = summary?.results.map(r => ({
    claim_id: r.claim_id,
    decision: r.decision,
    approved_amount: r.approved_amount,
    deducted_amount: r.deducted_amount,
    missing_docs: r.missing_docs,
    policy_refs: r.policy_refs,
    confidence: r.confidence,
    explanation: r.explanation,
    tools_used: r.tools_used
  })) || [];

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(cleanStructuredArray, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(cleanStructuredArray, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'travel_claim_results.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Trigger */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Batch Agent Execution
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Evaluate All Appendix B Claims (CLM-001 to CLM-005)
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Executes the full agentic tool-calling loop across all sample claims and generates the standardized Section 3 output array.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRunBatch}
            disabled={isEvaluating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition shadow-sm"
          >
            <Play className={`w-4 h-4 ${isEvaluating ? 'animate-spin' : ''}`} />
            {isEvaluating ? 'Executing Agent Pipeline...' : 'Run All 5 Claims'}
          </button>
        </div>
      </div>

      {/* Structured JSON Array Deliverable Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                Section 3 Structured Results Cell Output
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              JSON array of evaluated claims containing required fields: claim_id, decision, approved_amount, deducted_amount, missing_docs, policy_refs, confidence, explanation, tools_used.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyJson}
              disabled={!summary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied to Clipboard' : 'Copy JSON Array'}
            </button>
            <button
              onClick={handleDownloadJson}
              disabled={!summary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Download .json
            </button>
          </div>
        </div>

        {summary ? (
          <div className="mt-4">
            <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 max-h-[500px] overflow-y-auto overflow-x-auto">
              {JSON.stringify(cleanStructuredArray, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="mt-4 p-8 text-center bg-slate-950/50 rounded-xl border border-slate-800/60">
            <p className="text-xs text-slate-400">Click &quot;Run All 5 Claims&quot; to generate Section 3 JSON array.</p>
          </div>
        )}
      </div>

      {/* Decision Summary Grid */}
      {summary && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Detailed Batch Decision Matrix</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.results.map(r => {
              const claim = claims.find(c => c.claim_id === r.claim_id);
              return (
                <div 
                  key={r.claim_id}
                  onClick={() => onSelectClaim(r.claim_id)}
                  className="bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 cursor-pointer transition space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{r.claim_id}</span>
                    <DecisionBadge decision={r.decision} />
                  </div>

                  <div>
                    <div className="text-xs font-medium text-slate-300">{claim?.employee_name}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{claim?.trip_purpose}</div>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-slate-900 px-3 py-2 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Approved</span>
                      <span className="font-bold text-emerald-400">${r.approved_amount.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Deducted</span>
                      <span className="font-bold text-rose-400">${r.deducted_amount.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Confidence</span>
                      <span className="font-bold text-slate-300">{Math.round(r.confidence * 100)}%</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 italic">
                    &quot;{r.explanation}&quot;
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                    <span className="text-slate-500 font-mono">
                      {r.policy_refs.slice(0, 2).join(', ')}{r.policy_refs.length > 2 ? '...' : ''}
                    </span>
                    <span className="text-blue-400 flex items-center gap-1 font-medium">
                      Inspect <Eye className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
