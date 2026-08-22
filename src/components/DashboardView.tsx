import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  TrendingUp,
  ArrowRight,
  Sparkles,
  FileText
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { BatchEvaluationSummary, StructuredClaimResult, ReimbursementClaim } from '../types';

interface DashboardViewProps {
  summary: BatchEvaluationSummary | null;
  claims: ReimbursementClaim[];
  onSelectClaim: (claimId: string) => void;
  onRunBatch: () => void;
  isEvaluating: boolean;
}

const DECISION_COLORS = {
  APPROVE: '#10B981',        // Emerald
  PARTIAL_APPROVE: '#3B82F6',// Blue
  REJECT: '#EF4444',         // Red
  MANUAL_REVIEW: '#F59E0B'   // Amber
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  claims,
  onSelectClaim,
  onRunBatch,
  isEvaluating
}) => {
  if (!summary || summary.results.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl mx-auto my-12">
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No Claim Evaluation Results Yet</h2>
        <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
          Execute the agent evaluation on the 5 Appendix B sample claims to populate the live data dashboard and inspect decisions.
        </p>
        <button
          onClick={onRunBatch}
          disabled={isEvaluating}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition"
        >
          {isEvaluating ? 'Evaluating Claims...' : 'Run Batch Evaluation Now'}
        </button>
      </div>
    );
  }

  // Prepare chart data
  const pieData = [
    { name: 'Approve', value: summary.approved_count, color: DECISION_COLORS.APPROVE },
    { name: 'Partial Approve', value: summary.partial_approved_count, color: DECISION_COLORS.PARTIAL_APPROVE },
    { name: 'Reject', value: summary.rejected_count, color: DECISION_COLORS.REJECT },
    { name: 'Manual Review', value: summary.manual_review_count, color: DECISION_COLORS.MANUAL_REVIEW },
  ].filter(d => d.value > 0);

  const barData = summary.results.map(r => {
    const claim = claims.find(c => c.claim_id === r.claim_id);
    return {
      claim_id: r.claim_id,
      claimed: claim?.total_claimed || (r.approved_amount + r.deducted_amount),
      approved: r.approved_amount,
      deducted: r.deducted_amount,
      decision: r.decision
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Executive Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Evaluation Batch Summary
              </span>
              <span className="text-xs text-slate-400">· {summary.total_claims} claims processed</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Audit & Approval Intelligence Overview
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Claims evaluated strictly under <strong>Appendix A Travel Policy</strong> with multi-tool grounding.
              Accurately routes ambiguous exceptions (business class, missing receipts, &gt;$2k) to Manual Review.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onRunBatch}
              disabled={isEvaluating}
              className="px-3.5 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
            >
              Re-run Batch
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Approved Amount */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Approved</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              ${summary.total_approved_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[11px] text-emerald-400 mt-1 block">
            {summary.approved_count + summary.partial_approved_count} claims approved / partial
          </span>
        </div>

        {/* Deducted Amount */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Deducted</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              ${summary.total_deducted_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Per-diem caps & ineligible items
          </span>
        </div>

        {/* Manual Review Queue */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Manual Review Queue</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400 tracking-tight">
              {summary.manual_review_count}
            </span>
            <span className="text-xs text-slate-400">/ {summary.total_claims} claims</span>
          </div>
          <span className="text-[11px] text-amber-400/80 mt-1 block">
            Exceptions, missing receipts, &gt;$2k
          </span>
        </div>

        {/* Total Claimed */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Volume Claimed</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              ${summary.total_claimed_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[11px] text-blue-400 mt-1 block">
            Across {summary.total_claims} employee submissions
          </span>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Decision Breakdown Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Decision Breakdown</h3>
            <span className="text-[11px] text-slate-400">Count by status</span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: any, name: any) => [`${value} claim(s)`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300">{item.name}:</span>
                <span className="font-bold text-white ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Claim Financial Breakdown (Bar Chart) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Financial Breakdown per Claim (USD)</h3>
              <p className="text-[11px] text-slate-400">Comparison of Claimed vs Approved vs Deducted amounts</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="claim_id" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={v => `$${v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="claimed" name="Claimed Total" fill="#64748b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="approved" name="Approved" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="deducted" name="Deducted" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Evaluated Claims Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Claim Evaluation Table</h3>
            <p className="text-[11px] text-slate-400">Click on any claim to open the detailed Agent Audit Inspector</p>
          </div>
          <span className="text-xs text-slate-400">{summary.results.length} claims</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Claim ID</th>
                <th className="px-4 py-3">Employee & Purpose</th>
                <th className="px-4 py-3">Claimed</th>
                <th className="px-4 py-3">Approved</th>
                <th className="px-4 py-3">Deducted</th>
                <th className="px-4 py-3">Decision</th>
                <th className="px-4 py-3">Policy Citations</th>
                <th className="px-4 py-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {summary.results.map(r => {
                const claim = claims.find(c => c.claim_id === r.claim_id);
                return (
                  <tr 
                    key={r.claim_id}
                    onClick={() => onSelectClaim(r.claim_id)}
                    className="hover:bg-slate-800/50 cursor-pointer transition"
                  >
                    <td className="px-4 py-3 font-semibold text-white">
                      {r.claim_id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-200">{claim?.employee_name || 'Employee'}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{claim?.trip_purpose || 'Business Trip'}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-200">
                      ${(claim?.total_claimed || (r.approved_amount + r.deducted_amount)).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-medium text-emerald-400">
                      ${r.approved_amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-medium text-rose-400">
                      ${r.deducted_amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <DecisionBadge decision={r.decision} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {r.policy_refs.slice(0, 3).map(p => (
                          <span key={p} className="px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono">
                            {p}
                          </span>
                        ))}
                        {r.policy_refs.length > 3 && (
                          <span className="text-[10px] text-slate-400">+{r.policy_refs.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium text-xs">
                        Details <ArrowRight className="w-3 h-3" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const DecisionBadge: React.FC<{ decision: string }> = ({ decision }) => {
  switch (decision) {
    case 'APPROVE':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          APPROVE
        </span>
      );
    case 'PARTIAL_APPROVE':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/80">
          <ShieldCheck className="w-3 h-3 text-blue-400" />
          PARTIAL APPROVE
        </span>
      );
    case 'REJECT':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/80">
          <XCircle className="w-3 h-3 text-rose-400" />
          REJECT
        </span>
      );
    case 'MANUAL_REVIEW':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/80">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          MANUAL REVIEW
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
          {decision}
        </span>
      );
  }
};
