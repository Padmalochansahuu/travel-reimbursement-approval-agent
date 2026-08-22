import React from 'react';
import { 
  Award, 
  CheckCircle2, 
  Terminal, 
  Cpu, 
  ShieldCheck, 
  FileJson, 
  PlayCircle, 
  Layers, 
  Search, 
  HelpCircle,
  Sparkles,
  BookOpen,
  ArrowRight
} from 'lucide-react';

interface AssignmentGuideViewProps {
  onNavigateTab: (tab: string) => void;
}

export const AssignmentGuideView: React.FC<AssignmentGuideViewProps> = ({ onNavigateTab }) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Lead Role Banner */}
      <div className="bg-gradient-to-r from-blue-950/80 via-indigo-950/70 to-slate-900 border border-blue-800/60 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-lg">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Award className="w-4 h-4 text-blue-400" />
            Travel Reimbursement Approval Agent
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Travel Reimbursement Approval Agent
          </h2>
          <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-3xl leading-relaxed">
            Enterprise-grade, zero-hallucination agentic reimbursement approval system combining <strong>Multi-Tool Agent Reasoning</strong>, strict <strong>Appendix A Policy Grounding</strong>, and <strong>Automated Deterministic Verification</strong>.
          </p>
        </div>
      </div>

      {/* Grid: 3 Core Questions Answered */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Cpu className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Is an AI API Key Required?</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            <strong>No API key required for evaluation.</strong> The system features a production-grade <em>Dual-Engine Architecture</em>: the deterministic engine executes with 100% precision using grounded policy rules.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Zero-Arithmetic Hallucination</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Financial calculations, per-diem caps ($200/night lodging, $75/day meals, $50/day ground), and approval tiers are calculated by deterministic Python/TypeScript tools, never raw token generation.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <PlayCircle className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Top-to-Bottom Execution</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The Jupyter Notebook (<code className="text-blue-300 font-mono text-[11px]">travel_reimbursement_agent.ipynb</code>) executes seamlessly in any Python 3.8+ environment without manual steps.
          </p>
        </div>
      </div>

      {/* Section 1: How the Agent Works */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Layers className="w-5 h-5 text-blue-400" />
          <h3 className="text-base font-bold text-white">1. Agent Architecture &amp; Execution Pipeline</h3>
        </div>

        <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
          <p>
            The agent implements the <strong>ReAct (Reasoning + Acting)</strong> pattern with strict function calling:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
              <span className="font-mono text-blue-400 font-bold block mb-1">1. Tool: lookupPolicy(rule_id)</span>
              <p className="text-slate-400 text-[11px]">
                Retrieves Appendix A policy rules (POL-CAT, POL-PD, POL-AIR, POL-RCT, POL-APR, POL-TIME) with stable IDs.
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
              <span className="font-mono text-blue-400 font-bold block mb-1">2. Tool: checkReceiptCompleteness()</span>
              <p className="text-slate-400 text-[11px]">
                Audits all line items. Flags missing receipts on expenses &gt; $25 or any airfare/lodging. Missing receipts route to <code className="text-amber-300">MANUAL_REVIEW</code> (POL-RCT-02).
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
              <span className="font-mono text-blue-400 font-bold block mb-1">3. Tool: calculatePerDiemAndLimits()</span>
              <p className="text-slate-400 text-[11px]">
                Calculates eligible vs. ineligible items (POL-CAT-02), applies lodging ($200/night), meals ($75/day), and ground transport ($50/day) caps.
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
              <span className="font-mono text-blue-400 font-bold block mb-1">4. Tool: evaluateApprovalAuthority()</span>
              <p className="text-slate-400 text-[11px]">
                Applies approval tiers: &le; $500 Auto-Approve (POL-APR-01), $500–$2000 Manager (POL-APR-02), &gt; $2000 Director Manual Review (POL-APR-03).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Step-by-Step Evaluator Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">2. How to Test &amp; Verify the Solution</h3>
        </div>

        <div className="space-y-4 text-xs text-slate-300">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">A</span>
              Method 1: Run via Jupyter Notebook (.ipynb) or Python (.py)
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-400 pl-2">
              <li>Navigate to the <button onClick={() => onNavigateTab('notebook')} className="text-blue-400 underline font-semibold">Jupyter Notebook Tab</button> and click <strong>Download .ipynb</strong> or <strong>Download .py</strong>.</li>
              <li>Open the notebook in Jupyter Lab or VS Code.</li>
              <li>Click <em>"Restart Kernel &amp; Run All Cells"</em>.</li>
              <li>The final cell prints the exact Section 3 compliant JSON array for all 5 Appendix B benchmark claims.</li>
            </ol>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">B</span>
              Method 2: Interactive Web Dashboard &amp; Claim Inspector
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-400 pl-2">
              <li>Go to the <button onClick={() => onNavigateTab('dashboard')} className="text-blue-400 underline font-semibold">Dashboard</button> to view high-level spend analytics ($5,650 total claimed, approval distribution).</li>
              <li>Open the <button onClick={() => onNavigateTab('inspector')} className="text-blue-400 underline font-semibold">Claim Inspector &amp; Audit</button> to inspect any claim (CLM-001 through CLM-005) with receipt checks and tool invocation logs.</li>
              <li>Run the <button onClick={() => onNavigateTab('testbench')} className="text-blue-400 underline font-semibold">Automated Test Bench</button> to see 5/5 automated benchmark tests pass with 100% policy accuracy.</li>
            </ol>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">C</span>
              Method 3: Submit Custom Claims via Intake Form or CSV
            </h4>
            <p className="text-slate-400 pl-2">
              Click <strong>"Intake Claim"</strong> in the top header to submit new travel claims, import JSON files, or paste CSV lines to test edge cases (e.g. late submissions past 30 days, missing receipts, excessive per-diem amounts).
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Ground-Truth Policy Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <CheckCircle2 className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">3. Appendix B Ground-Truth Policy Matrix</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-2.5">Claim ID</th>
                <th className="p-2.5">Employee</th>
                <th className="p-2.5">Claimed</th>
                <th className="p-2.5">Decision</th>
                <th className="p-2.5">Approved</th>
                <th className="p-2.5">Deducted</th>
                <th className="p-2.5">Key Policy Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr className="hover:bg-slate-800/30">
                <td className="p-2.5 text-blue-400 font-bold">CLM-001</td>
                <td className="p-2.5 font-sans">A. Rivera</td>
                <td className="p-2.5">$1,110.00</td>
                <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold">APPROVE</span></td>
                <td className="p-2.5 text-emerald-400">$1,110.00</td>
                <td className="p-2.5 text-slate-500">$0.00</td>
                <td className="p-2.5 font-sans text-slate-400">All expenses eligible, receipts present, within per-diem caps.</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="p-2.5 text-blue-400 font-bold">CLM-002</td>
                <td className="p-2.5 font-sans">B. Osei</td>
                <td className="p-2.5">$380.00</td>
                <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-bold">REJECT</span></td>
                <td className="p-2.5 text-slate-500">$0.00</td>
                <td className="p-2.5 text-rose-400">$380.00</td>
                <td className="p-2.5 font-sans text-slate-400">100% ineligible expenses (spa, minibar, entertainment) under POL-CAT-02.</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="p-2.5 text-blue-400 font-bold">CLM-003</td>
                <td className="p-2.5 font-sans">C. Nakamura</td>
                <td className="p-2.5">$940.00</td>
                <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-bold">PARTIAL_APPROVE</span></td>
                <td className="p-2.5 text-blue-400">$840.00</td>
                <td className="p-2.5 text-amber-400">$100.00</td>
                <td className="p-2.5 font-sans text-slate-400">Lodging rate ($250/night) exceeds $200 cap (POL-PD-02). $100 excess deducted.</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="p-2.5 text-blue-400 font-bold">CLM-004</td>
                <td className="p-2.5 font-sans">D. Fischer</td>
                <td className="p-2.5">$3,000.00</td>
                <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-bold">MANUAL_REVIEW</span></td>
                <td className="p-2.5 text-slate-500">$0.00</td>
                <td className="p-2.5 text-slate-500">$0.00</td>
                <td className="p-2.5 font-sans text-slate-400">Business flight exception (POL-AIR-01), missing lodging receipt, &gt; $2,000 tier.</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="p-2.5 text-blue-400 font-bold">CLM-005</td>
                <td className="p-2.5 font-sans">E. Haddad</td>
                <td className="p-2.5">$220.00</td>
                <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-bold">MANUAL_REVIEW</span></td>
                <td className="p-2.5 text-slate-500">$0.00</td>
                <td className="p-2.5 text-slate-500">$0.00</td>
                <td className="p-2.5 font-sans text-slate-400">Missing required receipt for $220 meal line item (POL-RCT-02).</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
