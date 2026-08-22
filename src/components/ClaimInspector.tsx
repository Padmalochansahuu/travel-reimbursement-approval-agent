import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  FileText, 
  Calendar, 
  User, 
  Tag, 
  ShieldCheck, 
  Wrench, 
  ChevronRight, 
  FileWarning, 
  Receipt,
  Sparkles,
  ArrowLeft,
  Copy,
  Check
} from 'lucide-react';
import { ReimbursementClaim, StructuredClaimResult } from '../types';
import { DecisionBadge } from './DashboardView';

interface ClaimInspectorProps {
  claim: ReimbursementClaim;
  result?: StructuredClaimResult;
  allClaims: ReimbursementClaim[];
  onSelectClaim: (id: string) => void;
  onEvaluateClaim: (claim: ReimbursementClaim) => void;
  isEvaluating: boolean;
}

export const ClaimInspector: React.FC<ClaimInspectorProps> = ({
  claim,
  result,
  allClaims,
  onSelectClaim,
  onEvaluateClaim,
  isEvaluating
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'audit_trail' | 'json'>('overview');
  const [copied, setCopied] = useState(false);

  const handleCopyJson = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Claim Selector Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Select Claim:</span>
          {allClaims.map(c => {
            const isSelected = c.claim_id === claim.claim_id;
            return (
              <button
                key={c.claim_id}
                id={`inspector-select-${c.claim_id}`}
                onClick={() => onSelectClaim(c.claim_id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {c.claim_id} ({c.employee_name})
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onEvaluateClaim(claim)}
          disabled={isEvaluating}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {isEvaluating ? 'Evaluating...' : 'Re-Evaluate Claim'}
        </button>
      </div>

      {/* Main Claim Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl font-bold text-white">{claim.claim_id}</span>
              {result && <DecisionBadge decision={result.decision} />}
              {result?.confidence && (
                <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                  Confidence: {Math.round(result.confidence * 100)}%
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-slate-200">{claim.trip_purpose}</h2>
            
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <strong>Employee:</strong> {claim.employee_name}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <strong>Trip:</strong> {claim.trip_start_date} to {claim.trip_end_date}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <strong>Submitted:</strong> {claim.submission_date}
              </span>
            </div>
          </div>

          {/* Financial Summary Pill Box */}
          <div className="grid grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-center min-w-[280px]">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium">Claimed</span>
              <div className="text-base font-bold text-white">${claim.total_claimed.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 uppercase font-medium">Approved</span>
              <div className="text-base font-bold text-emerald-400">
                ${result ? result.approved_amount.toFixed(2) : '0.00'}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-rose-400 uppercase font-medium">Deducted</span>
              <div className="text-base font-bold text-rose-400">
                ${result ? result.deducted_amount.toFixed(2) : '0.00'}
              </div>
            </div>
          </div>
        </div>

        {/* Sub Navigation Tabs inside Claim Inspector */}
        <div className="flex items-center gap-4 mt-4 pt-2 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 text-xs font-semibold border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Line Items & Reasoning
          </button>
          <button
            onClick={() => setActiveTab('audit_trail')}
            className={`pb-2 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'audit_trail'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Agent Tool Trace ({result?.tool_traces?.length || result?.tools_used.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`pb-2 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'json'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Section 3 JSON Output
          </button>
        </div>

        {/* TAB 1: OVERVIEW & LINE ITEMS */}
        {activeTab === 'overview' && (
          <div className="mt-6 space-y-6">
            {/* Agent Explanation Callout */}
            {result && (
              <div className={`p-4 rounded-xl border text-xs ${
                result.decision === 'APPROVE' 
                  ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-200'
                  : result.decision === 'PARTIAL_APPROVE'
                  ? 'bg-blue-950/20 border-blue-800/60 text-blue-200'
                  : result.decision === 'REJECT'
                  ? 'bg-rose-950/20 border-rose-800/60 text-rose-200'
                  : 'bg-amber-950/20 border-amber-800/60 text-amber-200'
              }`}>
                <div className="flex items-center gap-2 font-bold mb-1.5">
                  <Sparkles className="w-4 h-4" />
                  Agent Decision Explanation:
                </div>
                <p className="leading-relaxed">{result.explanation}</p>
                
                {result.missing_docs && result.missing_docs.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-amber-800/40">
                    <span className="font-semibold flex items-center gap-1 text-amber-300">
                      <FileWarning className="w-3.5 h-3.5" /> Missing Documentation Required:
                    </span>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-200/90">
                      {result.missing_docs.map((doc, i) => (
                        <li key={i}>{doc}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Policy Citations Badge Bar */}
            {result?.policy_refs && result.policy_refs.length > 0 && (
              <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 mr-2">Grounded Policy References:</span>
                <div className="inline-flex flex-wrap gap-1.5 mt-1 sm:mt-0">
                  {result.policy_refs.map(p => (
                    <span 
                      key={p} 
                      className="px-2 py-0.5 text-xs font-mono font-medium bg-blue-950/80 text-blue-300 border border-blue-800/80 rounded"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Line Items Table */}
            <div>
              <h3 className="text-sm font-bold text-white mb-3">Claimed Line Items & Verification</h3>
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Receipt Attached</th>
                      <th className="px-4 py-3">Claimed</th>
                      <th className="px-4 py-3">Audit Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {claim.items.map((item, idx) => {
                      const breakdown = result?.item_breakdowns?.[idx];
                      return (
                        <tr key={item.id || idx} className="hover:bg-slate-800/30">
                          <td className="px-4 py-3 font-semibold text-slate-200 capitalize">
                            {item.category}
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            {item.description}
                          </td>
                          <td className="px-4 py-3">
                            {item.receipt_attached ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-medium bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-800/60">
                                <XCircle className="w-3.5 h-3.5" /> No (Missing)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-bold text-white">
                            ${item.amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            {breakdown ? (
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  {breakdown.approved > 0 && (
                                    <span className="text-emerald-400 font-semibold">
                                      +${breakdown.approved.toFixed(2)} approved
                                    </span>
                                  )}
                                  {breakdown.deducted > 0 && (
                                    <span className="text-rose-400 font-semibold">
                                      -${breakdown.deducted.toFixed(2)} deducted
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400">{breakdown.reason}</p>
                              </div>
                            ) : (
                              <span className="text-slate-400">Processed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AUDIT TRAIL */}
        {activeTab === 'audit_trail' && (
          <div className="mt-6 space-y-4">
            <div className="text-xs text-slate-400 mb-2">
              Step-by-step audit record of tool calls executed by the Travel Reimbursement Agent:
            </div>
            {result?.tool_traces && result.tool_traces.length > 0 ? (
              result.tool_traces.map((trace, idx) => (
                <div key={idx} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 font-mono text-xs flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-mono text-xs font-bold text-blue-300">
                        {trace.tool_name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">{trace.timestamp}</span>
                  </div>
                  {trace.rationale && (
                    <p className="text-xs text-slate-300 italic">{trace.rationale}</p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Input Arguments:</span>
                      <pre className="text-[11px] font-mono text-slate-300 mt-1 overflow-x-auto">
                        {JSON.stringify(trace.arguments, null, 2)}
                      </pre>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase">Output Result:</span>
                      <pre className="text-[11px] font-mono text-slate-300 mt-1 overflow-x-auto">
                        {JSON.stringify(trace.result, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 p-4 bg-slate-950 rounded-xl">
                No tool trace logs recorded yet. Run evaluation to view step-by-step agent tool executions.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STRUCTURED JSON OUTPUT */}
        {activeTab === 'json' && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Exact Section 3 structured JSON schema object for claim <strong>{claim.claim_id}</strong>:
              </span>
              <button
                onClick={handleCopyJson}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy JSON'}
              </button>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <pre className="text-xs font-mono text-emerald-400 overflow-x-auto">
                {JSON.stringify({
                  claim_id: result?.claim_id || claim.claim_id,
                  decision: result?.decision || 'MANUAL_REVIEW',
                  approved_amount: result?.approved_amount ?? 0,
                  deducted_amount: result?.deducted_amount ?? 0,
                  missing_docs: result?.missing_docs || [],
                  policy_refs: result?.policy_refs || [],
                  confidence: result?.confidence ?? 0.95,
                  explanation: result?.explanation || '',
                  tools_used: result?.tools_used || []
                }, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
