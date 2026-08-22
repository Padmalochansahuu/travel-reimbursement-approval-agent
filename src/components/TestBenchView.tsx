import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Play, 
  ShieldCheck, 
  Sparkles, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { GROUND_TRUTH_BENCHMARKS, APPENDIX_B_CLAIMS } from '../data/sampleClaims';
import { BatchEvaluationSummary } from '../types';
import { DecisionBadge } from './DashboardView';

interface TestBenchViewProps {
  summary: BatchEvaluationSummary | null;
  onRunBatch: () => void;
  isEvaluating: boolean;
  onSelectClaim: (id: string) => void;
}

export const TestBenchView: React.FC<TestBenchViewProps> = ({
  summary,
  onRunBatch,
  isEvaluating,
  onSelectClaim
}) => {
  const tests = APPENDIX_B_CLAIMS.map(claim => {
    const benchmark = GROUND_TRUTH_BENCHMARKS[claim.claim_id];
    const actual = summary?.results.find(r => r.claim_id === claim.claim_id);

    const decisionPass = actual ? actual.decision === benchmark.expected_decision : false;
    const approvedPass = actual ? Math.abs(actual.approved_amount - benchmark.expected_approved) < 0.01 : false;
    const deductedPass = actual ? Math.abs(actual.deducted_amount - benchmark.expected_deducted) < 0.01 : false;
    const allPass = actual ? (decisionPass && approvedPass && deductedPass) : false;

    return {
      claim_id: claim.claim_id,
      employee: claim.employee_name,
      purpose: claim.trip_purpose,
      benchmark,
      actual,
      decisionPass,
      approvedPass,
      deductedPass,
      allPass
    };
  });

  const totalTests = tests.length;
  const passedTests = tests.filter(t => t.allPass).length;
  const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Test Bench Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Automated Evaluation Test Suite
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Policy Ground Truth Verification Benchmark
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Asserts that the Agent&apos;s evaluations match 100% of expected Appendix A &amp; B policy decisions, approved amounts, and deduction calculations.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Test Score</span>
            <span className={`text-2xl font-bold font-mono ${passRate === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {passedTests}/{totalTests} ({passRate}%)
            </span>
          </div>
          <button
            onClick={onRunBatch}
            disabled={isEvaluating}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition shadow-sm"
          >
            <Play className={`w-4 h-4 ${isEvaluating ? 'animate-spin' : ''}`} />
            {isEvaluating ? 'Running...' : 'Run Test Suite'}
          </button>
        </div>
      </div>

      {/* Tests Table */}
      <div className="space-y-4">
        {tests.map((t, idx) => (
          <div 
            key={t.claim_id}
            className={`border rounded-2xl p-5 transition ${
              t.actual 
                ? t.allPass 
                  ? 'bg-slate-900/90 border-emerald-900/60 shadow-xs' 
                  : 'bg-slate-900/90 border-rose-900/60 shadow-xs'
                : 'bg-slate-900 border-slate-800 opacity-80'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                  t.actual 
                    ? t.allPass 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : 'bg-rose-500/10 text-rose-400'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {t.actual ? (t.allPass ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />) : (idx + 1)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{t.claim_id}</span>
                    <span className="text-xs text-slate-400">· {t.employee}</span>
                  </div>
                  <p className="text-xs text-slate-300">{t.purpose}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right text-xs">
                  <span className="text-[10px] text-slate-500 uppercase block font-medium">Expected Decision</span>
                  <DecisionBadge decision={t.benchmark.expected_decision} />
                </div>
                <div className="text-right text-xs">
                  <span className="text-[10px] text-slate-500 uppercase block font-medium">Actual Decision</span>
                  {t.actual ? <DecisionBadge decision={t.actual.decision} /> : <span className="text-slate-500">Pending</span>}
                </div>
                <button
                  onClick={() => onSelectClaim(t.claim_id)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
                >
                  View Trace
                </button>
              </div>
            </div>

            {/* Test Assertions Comparison Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span>Decision Match</span>
                  {t.actual && (t.decisionPass ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-rose-400" />)}
                </div>
                <div className="font-semibold text-white">
                  {t.actual?.decision || '---'} == {t.benchmark.expected_decision}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span>Approved Amount Match</span>
                  {t.actual && (t.approvedPass ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-rose-400" />)}
                </div>
                <div className="font-semibold text-emerald-400 font-mono">
                  ${t.actual ? t.actual.approved_amount.toFixed(2) : '0.00'} == ${t.benchmark.expected_approved.toFixed(2)}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span>Deducted Amount Match</span>
                  {t.actual && (t.deductedPass ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-rose-400" />)}
                </div>
                <div className="font-semibold text-rose-400 font-mono">
                  ${t.actual ? t.actual.deducted_amount.toFixed(2) : '0.00'} == ${t.benchmark.expected_deducted.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-slate-400 italic">
              <strong>Ground Truth Rationale:</strong> {t.benchmark.reason}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
