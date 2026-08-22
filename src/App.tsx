import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ClaimInspector } from './components/ClaimInspector';
import { BatchEvaluationView } from './components/BatchEvaluationView';
import { PolicyExplorer } from './components/PolicyExplorer';
import { NotebookView } from './components/NotebookView';
import { TestBenchView } from './components/TestBenchView';
import { ClaimIntakeModal } from './components/ClaimIntakeModal';
import { AssignmentGuideView } from './components/AssignmentGuideView';
import { ReimbursementClaim, BatchEvaluationSummary, StructuredClaimResult } from './types';
import { APPENDIX_B_CLAIMS } from './data/sampleClaims';
import { evaluateBatchClientSide, evaluateClaimClientSide } from './utils/clientEvaluator';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [claims, setClaims] = useState<ReimbursementClaim[]>(APPENDIX_B_CLAIMS);
  const [selectedClaimId, setSelectedClaimId] = useState<string>('CLM-001');
  const [summary, setSummary] = useState<BatchEvaluationSummary | null>(() => evaluateBatchClientSide(APPENDIX_B_CLAIMS));
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isIntakeOpen, setIsIntakeOpen] = useState<boolean>(false);

  // Auto-run evaluation on first load to populate all data views from server if possible
  useEffect(() => {
    runBatchEvaluation(claims);
  }, []);

  const runBatchEvaluation = async (claimList: ReimbursementClaim[]) => {
    setIsEvaluating(true);
    try {
      const response = await fetch('/api/evaluate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claims: claimList })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data: BatchEvaluationSummary = await response.json();
      setSummary(data);
    } catch (err) {
      console.info('Using instant deterministic batch calculation fallback:', err);
      const fallbackSummary = evaluateBatchClientSide(claimList);
      setSummary(fallbackSummary);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleEvaluateSingleClaim = async (claimToEvaluate: ReimbursementClaim) => {
    setIsEvaluating(true);
    try {
      const response = await fetch('/api/evaluate-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(claimToEvaluate)
      });

      let result: StructuredClaimResult;
      if (!response.ok) {
        result = evaluateClaimClientSide(claimToEvaluate);
      } else {
        result = await response.json();
      }

      // Update or insert result into batch summary
      if (summary) {
        const updatedResults = summary.results.filter(r => r.claim_id !== result.claim_id);
        updatedResults.push(result);

        setSummary({
          ...summary,
          results: updatedResults
        });
      }
    } catch (err) {
      console.info('Using instant single-claim evaluation fallback:', err);
      const result = evaluateClaimClientSide(claimToEvaluate);
      if (summary) {
        const updatedResults = summary.results.filter(r => r.claim_id !== result.claim_id);
        updatedResults.push(result);
        setSummary({
          ...summary,
          results: updatedResults
        });
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleAddCustomClaim = async (newClaim: ReimbursementClaim) => {
    const updatedClaims = [newClaim, ...claims.filter(c => c.claim_id !== newClaim.claim_id)];
    setClaims(updatedClaims);
    setSelectedClaimId(newClaim.claim_id);
    setActiveTab('inspector');
    await handleEvaluateSingleClaim(newClaim);
  };

  const handleSelectClaim = (claimId: string) => {
    setSelectedClaimId(claimId);
    setActiveTab('inspector');
  };

  const handleExportJson = () => {
    if (!summary) return;
    const cleanStructured = summary.results.map(r => ({
      claim_id: r.claim_id,
      decision: r.decision,
      approved_amount: r.approved_amount,
      deducted_amount: r.deducted_amount,
      missing_docs: r.missing_docs,
      policy_refs: r.policy_refs,
      confidence: r.confidence,
      explanation: r.explanation,
      tools_used: r.tools_used
    }));

    const blob = new Blob([JSON.stringify(cleanStructured, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'section3_travel_claim_results.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeClaim = claims.find(c => c.claim_id === selectedClaimId) || claims[0];
  const activeResult = summary?.results.find(r => r.claim_id === activeClaim?.claim_id);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Navigation & Controls */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRunBatch={() => runBatchEvaluation(claims)}
        isEvaluating={isEvaluating}
        onOpenIntakeModal={() => setIsIntakeOpen(true)}
        onExportJson={handleExportJson}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'guide' && (
          <AssignmentGuideView onNavigateTab={setActiveTab} />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            summary={summary}
            claims={claims}
            onSelectClaim={handleSelectClaim}
            onRunBatch={() => runBatchEvaluation(claims)}
            isEvaluating={isEvaluating}
          />
        )}

        {activeTab === 'inspector' && activeClaim && (
          <ClaimInspector
            claim={activeClaim}
            result={activeResult}
            allClaims={claims}
            onSelectClaim={setSelectedClaimId}
            onEvaluateClaim={handleEvaluateSingleClaim}
            isEvaluating={isEvaluating}
          />
        )}

        {activeTab === 'batch' && (
          <BatchEvaluationView
            summary={summary}
            claims={claims}
            onRunBatch={() => runBatchEvaluation(claims)}
            isEvaluating={isEvaluating}
            onSelectClaim={handleSelectClaim}
          />
        )}

        {activeTab === 'policy' && (
          <PolicyExplorer />
        )}

        {activeTab === 'notebook' && (
          <NotebookView />
        )}

        {activeTab === 'testbench' && (
          <TestBenchView
            summary={summary}
            onRunBatch={() => runBatchEvaluation(claims)}
            isEvaluating={isEvaluating}
            onSelectClaim={handleSelectClaim}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Travel Reimbursement Approval Agent · Grounded on Appendix A &amp; B</span>
          <span>Section 3 Standardized JSON Schema · 100% Deterministic Arithmetic</span>
        </div>
      </footer>

      {/* Custom Claim Intake Modal */}
      <ClaimIntakeModal
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        onSubmitClaim={handleAddCustomClaim}
      />
    </div>
  );
}
