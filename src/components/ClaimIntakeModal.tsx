import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Upload, 
  FileText, 
  Sparkles, 
  AlertCircle,
  FileCode
} from 'lucide-react';
import { ReimbursementClaim, ExpenseItem } from '../types';

interface ClaimIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitClaim: (claim: ReimbursementClaim) => void;
}

export const ClaimIntakeModal: React.FC<ClaimIntakeModalProps> = ({
  isOpen,
  onClose,
  onSubmitClaim
}) => {
  const [activeMode, setActiveMode] = useState<'form' | 'json' | 'csv'>('form');

  // Form State
  const [claimId, setClaimId] = useState(`CLM-00${Math.floor(Math.random() * 900 + 100)}`);
  const [employeeName, setEmployeeName] = useState('');
  const [tripPurpose, setTripPurpose] = useState('');
  const [tripStartDate, setTripStartDate] = useState('2026-06-15');
  const [tripEndDate, setTripEndDate] = useState('2026-06-17');
  const [submissionDate, setSubmissionDate] = useState('2026-06-25');
  const [items, setItems] = useState<ExpenseItem[]>([
    { id: 'item-1', category: 'airfare', description: 'Economy flight to client office', amount: 350, receipt_attached: true },
    { id: 'item-2', category: 'lodging', description: 'Hotel, 2 nights @ $190', amount: 380, receipt_attached: true },
    { id: 'item-3', category: 'meals', description: 'Meals, 2 days @ $65/day', amount: 130, receipt_attached: true }
  ]);

  // Raw JSON State
  const [jsonInput, setJsonInput] = useState(`{
  "claim_id": "CLM-CUSTOM-01",
  "employee_name": "Sarah Connor",
  "trip_purpose": "Product launch summit (business)",
  "trip_start_date": "2026-06-12",
  "trip_end_date": "2026-06-14",
  "submission_date": "2026-06-22",
  "total_claimed": 850.00,
  "items": [
    {
      "id": "item-1",
      "category": "airfare",
      "description": "Round-trip economy airfare",
      "amount": 320.00,
      "receipt_attached": true
    },
    {
      "id": "item-2",
      "category": "lodging",
      "description": "Hotel, 2 nights @ $220/night",
      "amount": 440.00,
      "receipt_attached": true
    },
    {
      "id": "item-3",
      "category": "meals",
      "description": "Team lunch",
      "amount": 90.00,
      "receipt_attached": true
    }
  ]
}`);

  // CSV State
  const [csvInput, setCsvInput] = useState(`category,description,amount,receipt_attached
airfare,Round-trip economy airfare,450.00,true
lodging,Hotel 2 nights @ $250,500.00,true
meals,Meals 2 days @ $80/day,160.00,true
ground_transport,Airport taxi rides,65.00,true`);

  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        category: 'meals',
        description: 'Business expense',
        amount: 50,
        receipt_attached: true
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ExpenseItem, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  const handleSubmit = () => {
    setErrorMessage('');

    if (activeMode === 'form') {
      if (!employeeName.trim()) {
        setErrorMessage('Employee name is required.');
        return;
      }
      if (!tripPurpose.trim()) {
        setErrorMessage('Trip purpose is required.');
        return;
      }
      if (items.length === 0) {
        setErrorMessage('At least one expense line item is required.');
        return;
      }

      const totalClaimed = items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
      const newClaim: ReimbursementClaim = {
        claim_id: claimId.trim() || `CLM-${Date.now()}`,
        employee_name: employeeName.trim(),
        trip_purpose: tripPurpose.trim(),
        trip_start_date: tripStartDate,
        trip_end_date: tripEndDate,
        submission_date: submissionDate,
        total_claimed: totalClaimed,
        items
      };

      onSubmitClaim(newClaim);
      onClose();
    } else if (activeMode === 'json') {
      try {
        const parsed = JSON.parse(jsonInput);
        if (!parsed.claim_id || !Array.isArray(parsed.items)) {
          throw new Error('JSON must contain "claim_id" and an "items" array.');
        }
        const total = parsed.total_claimed || parsed.items.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
        onSubmitClaim({
          ...parsed,
          total_claimed: total
        });
        onClose();
      } catch (err: any) {
        setErrorMessage(`JSON Parse Error: ${err.message}`);
      }
    } else if (activeMode === 'csv') {
      try {
        const lines = csvInput.trim().split('\n');
        if (lines.length < 2) {
          throw new Error('CSV must have a header line and at least one data row.');
        }
        const parsedItems: ExpenseItem[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const [cat, desc, amtStr, receiptStr] = line.split(',').map(s => s.trim());
          const amt = parseFloat(amtStr) || 0;
          const receipt = receiptStr?.toLowerCase() === 'true' || receiptStr?.toLowerCase() === 'yes' || receiptStr === '1';
          parsedItems.push({
            id: `csv-item-${i}`,
            category: cat || 'meals',
            description: desc || 'Expense',
            amount: amt,
            receipt_attached: receipt
          });
        }

        const totalClaimed = parsedItems.reduce((sum, i) => sum + i.amount, 0);
        const newClaim: ReimbursementClaim = {
          claim_id: claimId || `CLM-CSV-${Date.now()}`,
          employee_name: employeeName || 'CSV Imported Employee',
          trip_purpose: tripPurpose || 'Business Travel',
          trip_start_date: tripStartDate,
          trip_end_date: tripEndDate,
          submission_date: submissionDate,
          total_claimed: totalClaimed,
          items: parsedItems
        };

        onSubmitClaim(newClaim);
        onClose();
      } catch (err: any) {
        setErrorMessage(`CSV Parse Error: ${err.message}`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Intake New Reimbursement Claim</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Intake Mode Switcher */}
        <div className="px-6 pt-4 pb-2 flex gap-2 border-b border-slate-800/80 bg-slate-950/40">
          <button
            onClick={() => setActiveMode('form')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeMode === 'form' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            Form Input
          </button>
          <button
            onClick={() => setActiveMode('json')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeMode === 'json' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            Raw JSON
          </button>
          <button
            onClick={() => setActiveMode('csv')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeMode === 'csv' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            CSV Format
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300">
          {errorMessage && (
            <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-300 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* FORM MODE */}
          {activeMode === 'form' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Claim ID</label>
                  <input
                    type="text"
                    value={claimId}
                    onChange={e => setClaimId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Employee Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Morgan"
                    value={employeeName}
                    onChange={e => setEmployeeName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Trip Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Client Onsite Architecture Review"
                  value={tripPurpose}
                  onChange={e => setTripPurpose(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Start Date</label>
                  <input
                    type="date"
                    value={tripStartDate}
                    onChange={e => setTripStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">End Date</label>
                  <input
                    type="date"
                    value={tripEndDate}
                    onChange={e => setTripEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Submission Date</label>
                  <input
                    type="date"
                    value={submissionDate}
                    onChange={e => setSubmissionDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Line Items List */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold">Expense Line Items ({items.length})</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-blue-400 hover:text-blue-300 text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div key={item.id || idx} className="grid grid-cols-12 gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 items-center">
                      <div className="col-span-3">
                        <select
                          value={item.category}
                          onChange={e => handleItemChange(idx, 'category', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                        >
                          <option value="airfare">Airfare</option>
                          <option value="lodging">Lodging</option>
                          <option value="meals">Meals</option>
                          <option value="ground_transport">Ground Transport</option>
                          <option value="conference_fees">Conference Fees</option>
                          <option value="spa">Spa</option>
                          <option value="minibar">Minibar</option>
                          <option value="personal">Personal / Other</option>
                        </select>
                      </div>

                      <div className="col-span-4">
                        <input
                          type="text"
                          placeholder="Description"
                          value={item.description}
                          onChange={e => handleItemChange(idx, 'description', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Amount"
                          value={item.amount}
                          onChange={e => handleItemChange(idx, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                        />
                      </div>

                      <div className="col-span-2 flex items-center gap-1">
                        <input
                          type="checkbox"
                          id={`receipt-${idx}`}
                          checked={item.receipt_attached}
                          onChange={e => handleItemChange(idx, 'receipt_attached', e.target.checked)}
                          className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                        />
                        <label htmlFor={`receipt-${idx}`} className="text-[11px] text-slate-400 cursor-pointer">
                          Receipt
                        </label>
                      </div>

                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* JSON MODE */}
          {activeMode === 'json' && (
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Paste JSON Claim Object</label>
              <textarea
                rows={12}
                value={jsonInput}
                onChange={e => setJsonInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-emerald-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* CSV MODE */}
          {activeMode === 'csv' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Claim ID</label>
                  <input
                    type="text"
                    value={claimId}
                    onChange={e => setClaimId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Employee Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Taylor Reed"
                    value={employeeName}
                    onChange={e => setEmployeeName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">CSV Expense Lines (category,description,amount,receipt_attached)</label>
                <textarea
                  rows={8}
                  value={csvInput}
                  onChange={e => setCsvInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition shadow-sm flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Evaluate Claim with Agent
          </button>
        </div>
      </div>
    </div>
  );
};
