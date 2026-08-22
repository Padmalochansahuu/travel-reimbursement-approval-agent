import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  ShieldCheck, 
  AlertOctagon, 
  DollarSign, 
  Receipt, 
  Clock, 
  Scale
} from 'lucide-react';
import { TRAVEL_POLICY_RULES } from '../data/policyData';

export const PolicyExplorer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredRules = TRAVEL_POLICY_RULES.filter(rule => {
    const matchesSearch = 
      rule.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.details.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat = selectedCategory === 'all' || rule.category === selectedCategory;

    return matchesSearch && matchesCat;
  });

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'eligible_categories':
        return <span className="px-2 py-0.5 text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 rounded">Eligible</span>;
      case 'ineligible_items':
        return <span className="px-2 py-0.5 text-[10px] bg-rose-950 text-rose-300 border border-rose-800 rounded">Ineligible</span>;
      case 'per_diem_limits':
        return <span className="px-2 py-0.5 text-[10px] bg-blue-950 text-blue-300 border border-blue-800 rounded">Per-Diem Limit</span>;
      case 'receipt_rules':
        return <span className="px-2 py-0.5 text-[10px] bg-purple-950 text-purple-300 border border-purple-800 rounded">Receipt Rule</span>;
      case 'approval_thresholds':
        return <span className="px-2 py-0.5 text-[10px] bg-amber-950 text-amber-300 border border-amber-800 rounded">Approval Tier</span>;
      case 'timeliness':
        return <span className="px-2 py-0.5 text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 rounded">Timeliness</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded">{cat}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Appendix A — Travel Reimbursement Policy Directory
            </h2>
            <p className="text-xs text-slate-400">
              Corporate policy baseline used for agent context retrieval and citation grounding.
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search policy rule ID (e.g. POL-PD-01), keyword, or amount..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Policy Categories</option>
              <option value="eligible_categories">Eligible Categories (POL-CAT-01)</option>
              <option value="ineligible_items">Ineligible Items (POL-CAT-02)</option>
              <option value="per_diem_limits">Per-Diem Limits (POL-PD-*)</option>
              <option value="receipt_rules">Receipt Rules (POL-RCT-*)</option>
              <option value="approval_thresholds">Approval Thresholds (POL-APR-*)</option>
              <option value="timeliness">Timeliness (POL-TIME-*)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Decision Combination Guidance Callout */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <Scale className="w-4 h-4 text-blue-400" />
          Decision Guidance Matrix (How Rules Combine)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl">
            <span className="font-bold text-emerald-400 block mb-1">APPROVE</span>
            <p className="text-slate-300 text-[11px]">
              Every item eligible, all receipts present, all within per-diem caps, total within approvable tier (≤ $2,000).
            </p>
          </div>

          <div className="p-3 bg-blue-950/20 border border-blue-800/40 rounded-xl">
            <span className="font-bold text-blue-400 block mb-1">PARTIAL APPROVE</span>
            <p className="text-slate-300 text-[11px]">
              Claim is valid but some amounts exceed per-diem caps; reimburse up to cap and deduct the excess.
            </p>
          </div>

          <div className="p-3 bg-rose-950/20 border border-rose-800/40 rounded-xl">
            <span className="font-bold text-rose-400 block mb-1">REJECT</span>
            <p className="text-slate-300 text-[11px]">
              The claimed items are ineligible (POL-CAT-02) with nothing reimbursable. Deducted in full.
            </p>
          </div>

          <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl">
            <span className="font-bold text-amber-400 block mb-1">MANUAL REVIEW</span>
            <p className="text-slate-300 text-[11px]">
              Any ambiguity, policy exception (business class), high value (&gt;$2k), missing required receipt, or late submission.
            </p>
          </div>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRules.map(rule => (
          <div key={rule.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 font-mono text-xs font-bold bg-blue-950 text-blue-300 border border-blue-800 rounded">
                  {rule.id}
                </span>
                <h4 className="text-sm font-bold text-white">{rule.title}</h4>
              </div>
              {getCategoryBadge(rule.category)}
            </div>

            <p className="text-xs font-medium text-slate-200">
              {rule.description}
            </p>

            <p className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              {rule.details}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
              {rule.limit_amount !== undefined && (
                <span className="text-emerald-400 font-semibold">
                  Cap: ${rule.limit_amount} / {rule.limit_unit}
                </span>
              )}
              {rule.mandatory_manual_review && (
                <span className="text-amber-400 font-semibold ml-auto">
                  Triggers Manual Review
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
