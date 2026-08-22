import React from 'react';
import { 
  FileCheck2, 
  BarChart3, 
  Search, 
  Play, 
  PlusCircle, 
  BookOpen, 
  Code2, 
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Download
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRunBatch: () => void;
  isEvaluating: boolean;
  onOpenIntakeModal: () => void;
  onExportJson: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onRunBatch,
  isEvaluating,
  onOpenIntakeModal,
  onExportJson
}) => {
  const tabs = [
    { id: 'guide', label: 'Architecture & Guide', icon: Sparkles },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'inspector', label: 'Claim Inspector & Audit', icon: Search },
    { id: 'batch', label: 'Batch Evaluation', icon: Play },
    { id: 'policy', label: 'Policy Rules (App. A)', icon: BookOpen },
    { id: 'notebook', label: 'Jupyter Notebook', icon: Code2 },
    { id: 'testbench', label: 'Test Bench', icon: CheckCircle2 },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-inner text-white">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Travel Reimbursement Approval Agent
                </h1>

              </div>
              <p className="text-xs text-slate-400">
                Policy Grounding (Appendix A) · Multi-Tool Calling · Structured Decisions
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              id="header-btn-intake"
              onClick={onOpenIntakeModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
              title="Submit a custom claim for evaluation"
            >
              <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Intake Claim</span>
            </button>

            <button
              id="header-btn-export"
              onClick={onExportJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
              title="Export Section 3 Structured JSON"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden sm:inline">Export JSON</span>
            </button>

            <button
              id="header-btn-run-batch"
              onClick={onRunBatch}
              disabled={isEvaluating}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white shadow-sm transition ${
                isEvaluating
                  ? 'bg-blue-800 cursor-not-allowed opacity-80'
                  : 'bg-blue-600 hover:bg-blue-500 active:scale-95'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
              <span>{isEvaluating ? 'Evaluating...' : 'Evaluate All (5)'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 sm:space-x-4 overflow-x-auto scrollbar-none border-t border-slate-800/80 pt-1 pb-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
