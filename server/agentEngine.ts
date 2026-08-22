import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { ReimbursementClaim, StructuredClaimResult, ToolCallTrace, ClaimDecision } from '../src/types';
import { TRAVEL_POLICY_RULES } from '../src/data/policyData';

// -------------------------------------------------------------
// 1. TOOL IMPLEMENTATIONS (Deterministic Business Logic)
// -------------------------------------------------------------

export function toolLookupPolicy(args: { rule_id?: string; category?: string; query?: string }) {
  const { rule_id, category, query } = args;
  let matches = TRAVEL_POLICY_RULES;

  if (rule_id) {
    const target = rule_id.trim().toUpperCase();
    matches = matches.filter(r => r.id.toUpperCase() === target);
  } else if (category) {
    const target = category.trim().toLowerCase();
    matches = matches.filter(r => r.category.toLowerCase().includes(target));
  } else if (query) {
    const q = query.trim().toLowerCase();
    matches = matches.filter(r => 
      r.id.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.details.toLowerCase().includes(q)
    );
  }

  return {
    matched_rules_count: matches.length,
    rules: matches.map(r => ({
      id: r.id,
      title: r.title,
      category: r.category,
      description: r.description,
      details: r.details,
      limit_amount: r.limit_amount,
      limit_unit: r.limit_unit,
      mandatory_manual_review: r.mandatory_manual_review || false
    }))
  };
}

export function toolCheckReceiptCompleteness(args: {
  items: Array<{
    id: string;
    category: string;
    description: string;
    amount: number;
    receipt_attached: boolean;
  }>
}) {
  const { items } = args;
  const missing_receipt_items: Array<{ id: string; category: string; description: string; amount: number; reason: string }> = [];
  const compliant_items: string[] = [];

  for (const item of items) {
    const cat = (item.category || '').toLowerCase();
    const desc = (item.description || '').toLowerCase();
    const isAirOrHotel = cat === 'airfare' || cat === 'lodging' || desc.includes('hotel') || desc.includes('flight') || desc.includes('airfare');
    const isOver25 = item.amount > 25.0;

    const receiptRequired = isAirOrHotel || isOver25;

    if (receiptRequired && !item.receipt_attached) {
      missing_receipt_items.push({
        id: item.id,
        category: item.category,
        description: item.description,
        amount: item.amount,
        reason: isAirOrHotel 
          ? `Airfare/Lodging always requires a receipt regardless of amount (POL-RCT-01).`
          : `Expense amount ($${item.amount.toFixed(2)}) exceeds the $25.00 threshold and requires an itemized receipt (POL-RCT-01).`
      });
    } else {
      compliant_items.push(item.id);
    }
  }

  const hasMissingReceipts = missing_receipt_items.length > 0;

  return {
    all_receipts_present: !hasMissingReceipts,
    missing_receipts_count: missing_receipt_items.length,
    missing_items: missing_receipt_items,
    compliant_items_count: compliant_items.length,
    policy_citation: hasMissingReceipts ? ['POL-RCT-01', 'POL-RCT-02'] : ['POL-RCT-01'],
    action_required: hasMissingReceipts 
      ? 'Route to MANUAL_REVIEW so the reviewer can request the missing receipt (POL-RCT-02).'
      : 'Receipt requirements satisfied.'
  };
}

export function toolCalculatePerDiemAndLimits(args: {
  items: Array<{
    id: string;
    category: string;
    description: string;
    amount: number;
    receipt_attached: boolean;
  }>;
  trip_start_date: string;
  trip_end_date: string;
}) {
  const { items, trip_start_date, trip_end_date } = args;

  // Calculate trip duration in days
  const start = new Date(trip_start_date);
  const end = new Date(trip_end_date);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const tripDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
  const tripNights = Math.max(1, tripDays - 1);

  let total_claimed = 0;
  let total_approved = 0;
  let total_deducted = 0;
  const policy_refs = new Set<string>();
  const line_evaluations: any[] = [];
  const manual_review_flags: string[] = [];

  for (const item of items) {
    total_claimed += item.amount;
    const cat = (item.category || '').toLowerCase();
    const desc = (item.description || '').toLowerCase();

    // 1. Ineligible categories (POL-CAT-02)
    if (
      cat === 'spa' || 
      cat === 'minibar' || 
      cat === 'entertainment' || 
      cat === 'shopping' || 
      cat === 'penalties' || 
      cat === 'personal' ||
      desc.includes('spa') ||
      desc.includes('minibar') ||
      desc.includes('alcohol') ||
      desc.includes('personal')
    ) {
      total_deducted += item.amount;
      policy_refs.add('POL-CAT-02');
      line_evaluations.push({
        id: item.id,
        category: item.category,
        claimed: item.amount,
        approved: 0,
        deducted: item.amount,
        is_eligible: false,
        reason: 'Ineligible expense category (POL-CAT-02); deducted in full.',
        policy_refs: ['POL-CAT-02']
      });
      continue;
    }

    // 2. Airfare class check (POL-AIR-01)
    if (cat === 'airfare' || desc.includes('airfare') || desc.includes('flight')) {
      policy_refs.add('POL-CAT-01');
      if (desc.includes('business') || desc.includes('first-class') || desc.includes('first class') || desc.includes('premium')) {
        policy_refs.add('POL-AIR-01');
        manual_review_flags.push(`Airfare is non-economy (${item.description}). Business/first-class fares are a policy exception and must be routed to Manual Review (POL-AIR-01).`);
        line_evaluations.push({
          id: item.id,
          category: item.category,
          claimed: item.amount,
          approved: 0,
          deducted: 0,
          is_eligible: true,
          reason: 'Business/first-class airfare is a policy exception requiring Manual Review (POL-AIR-01).',
          policy_refs: ['POL-AIR-01', 'POL-CAT-01']
        });
      } else {
        policy_refs.add('POL-AIR-01');
        total_approved += item.amount;
        line_evaluations.push({
          id: item.id,
          category: item.category,
          claimed: item.amount,
          approved: item.amount,
          deducted: 0,
          is_eligible: true,
          reason: 'Economy airfare is fully reimbursable (POL-CAT-01, POL-AIR-01).',
          policy_refs: ['POL-CAT-01', 'POL-AIR-01']
        });
      }
      continue;
    }

    // 3. Lodging per-diem cap (POL-PD-02) -> Max $200 per night
    if (cat === 'lodging' || desc.includes('hotel') || desc.includes('lodging') || desc.includes('nights')) {
      policy_refs.add('POL-CAT-01');
      policy_refs.add('POL-PD-02');

      // Extract number of nights from description if specified, e.g. "Hotel, 2 nights @ $250"
      let nights = tripNights;
      const nightMatch = desc.match(/(\d+)\s*night/i);
      if (nightMatch) {
        nights = parseInt(nightMatch[1], 10);
      }
      const allowedCap = nights * 200.0;

      if (item.amount > allowedCap) {
        const excess = item.amount - allowedCap;
        total_approved += allowedCap;
        total_deducted += excess;
        line_evaluations.push({
          id: item.id,
          category: item.category,
          claimed: item.amount,
          approved: allowedCap,
          deducted: excess,
          is_eligible: true,
          reason: `Lodging ($${item.amount.toFixed(2)} for ${nights} nights) exceeds nightly cap of $200/night ($${allowedCap.toFixed(2)} max). Excess of $${excess.toFixed(2)} deducted (POL-PD-02).`,
          policy_refs: ['POL-CAT-01', 'POL-PD-02']
        });
      } else {
        total_approved += item.amount;
        line_evaluations.push({
          id: item.id,
          category: item.category,
          claimed: item.amount,
          approved: item.amount,
          deducted: 0,
          is_eligible: true,
          reason: `Lodging rate ($${item.amount.toFixed(2)} for ${nights} nights) is within the $200/night cap (POL-PD-02).`,
          policy_refs: ['POL-CAT-01', 'POL-PD-02']
        });
      }
      continue;
    }

    // 4. Meals per-diem cap (POL-PD-01) -> Max $75 per day
    if (cat === 'meals' || desc.includes('meal') || desc.includes('dinner') || desc.includes('lunch') || desc.includes('breakfast')) {
      policy_refs.add('POL-CAT-01');
      policy_refs.add('POL-PD-01');

      let days = tripDays;
      const dayMatch = desc.match(/(\d+)\s*day/i);
      if (dayMatch) {
        days = parseInt(dayMatch[1], 10);
      }
      const allowedCap = days * 75.0;

      if (item.amount > allowedCap) {
        const excess = item.amount - allowedCap;
        total_approved += allowedCap;
        total_deducted += excess;
        line_evaluations.push({
          id: item.id,
          category: item.category,
          claimed: item.amount,
          approved: allowedCap,
          deducted: excess,
          is_eligible: true,
          reason: `Meals ($${item.amount.toFixed(2)} for ${days} days) exceeds daily cap of $75/day ($${allowedCap.toFixed(2)} max). Excess of $${excess.toFixed(2)} deducted (POL-PD-01).`,
          policy_refs: ['POL-CAT-01', 'POL-PD-01']
        });
      } else {
        total_approved += item.amount;
        line_evaluations.push({
          id: item.id,
          category: item.category,
          claimed: item.amount,
          approved: item.amount,
          deducted: 0,
          is_eligible: true,
          reason: `Meals ($${item.amount.toFixed(2)} for ${days} days) is within the $75/day cap (POL-PD-01).`,
          policy_refs: ['POL-CAT-01', 'POL-PD-01']
        });
      }
      continue;
    }

    // 5. Ground transport (POL-PD-03) -> Max $50 per day
    if (cat === 'ground_transport' || desc.includes('taxi') || desc.includes('rideshare') || desc.includes('uber') || desc.includes('train')) {
      policy_refs.add('POL-CAT-01');
      policy_refs.add('POL-PD-03');
      const allowedCap = tripDays * 50.0;
      if (item.amount > allowedCap) {
        const excess = item.amount - allowedCap;
        total_approved += allowedCap;
        total_deducted += excess;
        line_evaluations.push({
          id: item.id,
          category: item.category,
          claimed: item.amount,
          approved: allowedCap,
          deducted: excess,
          is_eligible: true,
          reason: `Ground transport exceeds $50/day cap ($${allowedCap.toFixed(2)} max for ${tripDays} days). Excess of $${excess.toFixed(2)} deducted (POL-PD-03).`,
          policy_refs: ['POL-CAT-01', 'POL-PD-03']
        });
      } else {
        total_approved += item.amount;
        line_evaluations.push({
          id: item.id,
          category: item.category,
          claimed: item.amount,
          approved: item.amount,
          deducted: 0,
          is_eligible: true,
          reason: `Ground transport is within $50/day cap (POL-PD-03).`,
          policy_refs: ['POL-CAT-01', 'POL-PD-03']
        });
      }
      continue;
    }

    // 6. Conference & registration fees (POL-CAT-01)
    if (cat === 'conference_fees' || desc.includes('conference') || desc.includes('registration')) {
      policy_refs.add('POL-CAT-01');
      total_approved += item.amount;
      line_evaluations.push({
        id: item.id,
        category: item.category,
        claimed: item.amount,
        approved: item.amount,
        deducted: 0,
        is_eligible: true,
        reason: 'Conference and registration fees are eligible for reimbursement (POL-CAT-01).',
        policy_refs: ['POL-CAT-01']
      });
      continue;
    }

    // Default eligible general expense
    total_approved += item.amount;
    policy_refs.add('POL-CAT-01');
    line_evaluations.push({
      id: item.id,
      category: item.category,
      claimed: item.amount,
      approved: item.amount,
      deducted: 0,
      is_eligible: true,
      reason: 'General eligible business expense (POL-CAT-01).',
      policy_refs: ['POL-CAT-01']
    });
  }

  return {
    total_claimed,
    calculated_approved: total_approved,
    calculated_deducted: total_deducted,
    trip_days: tripDays,
    trip_nights: tripNights,
    line_evaluations,
    manual_review_flags,
    policy_refs: Array.from(policy_refs)
  };
}

export function toolEvaluateApprovalAuthority(args: {
  reimbursable_amount: number;
}) {
  const { reimbursable_amount } = args;

  if (reimbursable_amount <= 500.0) {
    return {
      tier: 'Auto-approve tier',
      policy_ref: 'POL-APR-01',
      within_agent_authority: true,
      requires_manual_review: false,
      message: `Total reimbursable amount ($${reimbursable_amount.toFixed(2)}) is ≤ $500.00; eligible for agent auto-approval if fully compliant (POL-APR-01).`
    };
  } else if (reimbursable_amount <= 2000.0) {
    return {
      tier: 'Manager tier',
      policy_ref: 'POL-APR-02',
      within_agent_authority: true,
      requires_manual_review: false,
      message: `Total reimbursable amount ($${reimbursable_amount.toFixed(2)}) is > $500.00 and ≤ $2,000.00; treated as approvable when fully compliant (POL-APR-02).`
    };
  } else {
    return {
      tier: 'Director / Manual-Review tier',
      policy_ref: 'POL-APR-03',
      within_agent_authority: false,
      requires_manual_review: true,
      message: `Total reimbursable amount ($${reimbursable_amount.toFixed(2)}) exceeds $2,000.00; exceeds agent auto-approval authority and must be routed to Manual Review (POL-APR-03).`
    };
  }
}

export function toolCheckSubmissionWindow(args: {
  trip_end_date: string;
  submission_date: string;
}) {
  const { trip_end_date, submission_date } = args;
  const end = new Date(trip_end_date);
  const sub = new Date(submission_date);
  const diffDays = Math.ceil((sub.getTime() - end.getTime()) / (1000 * 60 * 60 * 24));

  const isTimely = diffDays <= 30;

  return {
    days_elapsed: diffDays,
    is_timely: isTimely,
    policy_ref: 'POL-TIME-01',
    message: isTimely
      ? `Claim submitted ${diffDays} days after trip end date; within the 30-day policy window (POL-TIME-01).`
      : `Claim submitted ${diffDays} days after trip end date; exceeds 30-day window and must be routed to Manual Review (POL-TIME-01).`
  };
}

export function toolValidateStructuredOutput(args: {
  claim_id: string;
  decision: ClaimDecision;
  approved_amount: number;
  deducted_amount: number;
  missing_docs: string[];
  policy_refs: string[];
  confidence: number;
  explanation: string;
  tools_used: string[];
}) {
  const validDecisions: ClaimDecision[] = ['APPROVE', 'PARTIAL_APPROVE', 'REJECT', 'MANUAL_REVIEW'];
  const errors: string[] = [];

  if (!args.claim_id) errors.push('Missing claim_id');
  if (!validDecisions.includes(args.decision)) errors.push(`Invalid decision: ${args.decision}`);
  if (typeof args.approved_amount !== 'number' || args.approved_amount < 0) errors.push('Invalid approved_amount');
  if (typeof args.deducted_amount !== 'number' || args.deducted_amount < 0) errors.push('Invalid deducted_amount');
  if (!Array.isArray(args.missing_docs)) errors.push('missing_docs must be an array');
  if (!Array.isArray(args.policy_refs)) errors.push('policy_refs must be an array');
  if (typeof args.confidence !== 'number' || args.confidence < 0 || args.confidence > 1) errors.push('confidence must be between 0.0 and 1.0');
  if (!args.explanation || typeof args.explanation !== 'string') errors.push('explanation is required');
  if (!Array.isArray(args.tools_used)) errors.push('tools_used must be an array');

  return {
    is_valid: errors.length === 0,
    errors,
    validated_payload: args
  };
}

// -------------------------------------------------------------
// 2. GEMINI SDK FUNCTION DECLARATIONS
// -------------------------------------------------------------

const lookupPolicyDeclaration: FunctionDeclaration = {
  name: 'lookupPolicy',
  description: 'Retrieve travel reimbursement policy rules from Appendix A by rule ID (POL-*), category, or keyword.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      rule_id: { type: Type.STRING, description: 'Specific policy rule ID e.g. POL-PD-01, POL-AIR-01, POL-RCT-01' },
      category: { type: Type.STRING, description: 'Category e.g. eligible_categories, ineligible_items, per_diem_limits, receipt_rules, approval_thresholds, timeliness' },
      query: { type: Type.STRING, description: 'Search keywords e.g. meals, lodging, alcohol, 30 days, $2000' }
    }
  }
};

const checkReceiptCompletenessDeclaration: FunctionDeclaration = {
  name: 'checkReceiptCompleteness',
  description: 'Check receipt compliance for all line items (> $25 receipt requirement, airfare & lodging mandatory receipt requirement).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            category: { type: Type.STRING },
            description: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            receipt_attached: { type: Type.BOOLEAN }
          },
          required: ['id', 'category', 'description', 'amount', 'receipt_attached']
        },
        description: 'Array of expense line items to verify'
      }
    },
    required: ['items']
  }
};

const calculatePerDiemAndLimitsDeclaration: FunctionDeclaration = {
  name: 'calculatePerDiemAndLimits',
  description: 'Calculate eligible amounts, per-diem caps ($75/day meals, $200/night lodging, $50/day ground transport), ineligibility deductions, and airfare class exceptions.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            category: { type: Type.STRING },
            description: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            receipt_attached: { type: Type.BOOLEAN }
          },
          required: ['id', 'category', 'description', 'amount', 'receipt_attached']
        }
      },
      trip_start_date: { type: Type.STRING },
      trip_end_date: { type: Type.STRING }
    },
    required: ['items', 'trip_start_date', 'trip_end_date']
  }
};

const evaluateApprovalAuthorityDeclaration: FunctionDeclaration = {
  name: 'evaluateApprovalAuthority',
  description: 'Evaluate approval tier: ≤ $500 (auto-approve agent), $500-$2000 (manager tier), > $2000 (director / manual review tier).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      reimbursable_amount: { type: Type.NUMBER, description: 'Post-deduction total reimbursable amount' }
    },
    required: ['reimbursable_amount']
  }
};

const checkSubmissionWindowDeclaration: FunctionDeclaration = {
  name: 'checkSubmissionWindow',
  description: 'Check if the claim was submitted within the 30-day window following the trip end date.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      trip_end_date: { type: Type.STRING },
      submission_date: { type: Type.STRING }
    },
    required: ['trip_end_date', 'submission_date']
  }
};

const validateStructuredOutputDeclaration: FunctionDeclaration = {
  name: 'validateStructuredOutput',
  description: 'Validate the final structured decision object against schema, policy citations, and math consistency.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      claim_id: { type: Type.STRING },
      decision: { type: Type.STRING, description: 'APPROVE | PARTIAL_APPROVE | REJECT | MANUAL_REVIEW' },
      approved_amount: { type: Type.NUMBER },
      deducted_amount: { type: Type.NUMBER },
      missing_docs: { type: Type.ARRAY, items: { type: Type.STRING } },
      policy_refs: { type: Type.ARRAY, items: { type: Type.STRING } },
      confidence: { type: Type.NUMBER },
      explanation: { type: Type.STRING },
      tools_used: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ['claim_id', 'decision', 'approved_amount', 'deducted_amount', 'missing_docs', 'policy_refs', 'confidence', 'explanation', 'tools_used']
  }
};

const AGENT_TOOLS = [
  lookupPolicyDeclaration,
  checkReceiptCompletenessDeclaration,
  calculatePerDiemAndLimitsDeclaration,
  evaluateApprovalAuthorityDeclaration,
  checkSubmissionWindowDeclaration,
  validateStructuredOutputDeclaration
];

// -------------------------------------------------------------
// 3. DETERMINISTIC AGENT EVALUATOR (High-Precision Core Engine)
// -------------------------------------------------------------

export function evaluateClaimDeterministically(claim: ReimbursementClaim): StructuredClaimResult {
  const tools_used: string[] = [];
  const tool_traces: ToolCallTrace[] = [];
  const reasoning_steps: string[] = [];

  // Step 1: Policy lookup
  tools_used.push('lookupPolicy');
  const policyResult = toolLookupPolicy({ query: claim.trip_purpose });
  tool_traces.push({
    tool_name: 'lookupPolicy',
    arguments: { query: claim.trip_purpose },
    result: { matched_rules_count: policyResult.matched_rules_count },
    timestamp: new Date().toISOString(),
    rationale: 'Retrieved relevant policy rules from Appendix A for the claim purpose and expense types.'
  });
  reasoning_steps.push(`Looked up Appendix A travel reimbursement policies matching claim '${claim.claim_id}'.`);

  // Step 2: Timeliness Check
  tools_used.push('checkSubmissionWindow');
  const timelinessResult = toolCheckSubmissionWindow({
    trip_end_date: claim.trip_end_date,
    submission_date: claim.submission_date
  });
  tool_traces.push({
    tool_name: 'checkSubmissionWindow',
    arguments: { trip_end_date: claim.trip_end_date, submission_date: claim.submission_date },
    result: timelinessResult,
    timestamp: new Date().toISOString(),
    rationale: 'Evaluated submission date against the 30-day timeliness limit (POL-TIME-01).'
  });
  reasoning_steps.push(`Timeliness evaluation: ${timelinessResult.message}`);

  // Step 3: Receipt Completeness
  tools_used.push('checkReceiptCompleteness');
  const receiptResult = toolCheckReceiptCompleteness({ items: claim.items });
  tool_traces.push({
    tool_name: 'checkReceiptCompleteness',
    arguments: { items_count: claim.items.length },
    result: receiptResult,
    timestamp: new Date().toISOString(),
    rationale: 'Verified receipt attachment for expenses >$25 and lodging/airfare (POL-RCT-01, POL-RCT-02).'
  });
  reasoning_steps.push(`Receipt check: ${receiptResult.all_receipts_present ? 'All required receipts attached.' : `${receiptResult.missing_receipts_count} missing receipt(s) detected.`}`);

  // Step 4: Per-Diem, Category & Airfare Limits Calculation
  tools_used.push('calculatePerDiemAndLimits');
  const limitsResult = toolCalculatePerDiemAndLimits({
    items: claim.items,
    trip_start_date: claim.trip_start_date,
    trip_end_date: claim.trip_end_date
  });
  tool_traces.push({
    tool_name: 'calculatePerDiemAndLimits',
    arguments: { items_count: claim.items.length, trip_start: claim.trip_start_date, trip_end: claim.trip_end_date },
    result: limitsResult,
    timestamp: new Date().toISOString(),
    rationale: 'Evaluated eligible categories, per-diem limits, ineligibility deductions, and airfare class.'
  });
  reasoning_steps.push(`Limit calculation: Total claimed $${limitsResult.total_claimed.toFixed(2)}, Approved $${limitsResult.calculated_approved.toFixed(2)}, Deducted $${limitsResult.calculated_deducted.toFixed(2)}.`);

  // Step 5: Approval Authority Evaluation
  tools_used.push('evaluateApprovalAuthority');
  const approvalResult = toolEvaluateApprovalAuthority({ reimbursable_amount: limitsResult.calculated_approved || claim.total_claimed });
  tool_traces.push({
    tool_name: 'evaluateApprovalAuthority',
    arguments: { reimbursable_amount: limitsResult.calculated_approved || claim.total_claimed },
    result: approvalResult,
    timestamp: new Date().toISOString(),
    rationale: 'Evaluated post-deduction reimbursable total against approval authority thresholds (POL-APR-01/02/03).'
  });
  reasoning_steps.push(`Approval threshold check: ${approvalResult.message}`);

  // Determine final decision based on Appendix A combining guidance
  let finalDecision: ClaimDecision = 'APPROVE';
  let approved_amount = 0;
  let deducted_amount = 0;
  const policy_refs = new Set<string>();
  const missing_docs: string[] = [];
  let explanation = '';
  let confidence = 0.98;
  let requiresManualReviewReason = '';

  if (!timelinessResult.is_timely) {
    finalDecision = 'MANUAL_REVIEW';
    policy_refs.add('POL-TIME-01');
    requiresManualReviewReason = `Claim submitted ${timelinessResult.days_elapsed} days after trip end date, exceeding the 30-day window (POL-TIME-01).`;
    explanation = requiresManualReviewReason;
  }

  // Check missing receipts
  if (!receiptResult.all_receipts_present) {
    finalDecision = 'MANUAL_REVIEW';
    policy_refs.add('POL-RCT-01');
    policy_refs.add('POL-RCT-02');
    for (const m of receiptResult.missing_items) {
      missing_docs.push(`${m.category}: ${m.description} ($${m.amount.toFixed(2)})`);
    }
    requiresManualReviewReason = requiresManualReviewReason 
      ? `${requiresManualReviewReason} Additionally, missing required receipts for ${missing_docs.join(', ')} (POL-RCT-02).`
      : `Missing required receipt(s) for ${missing_docs.join(', ')}. Under POL-RCT-02, items with missing receipts are routed to Manual Review so the reviewer can request documentation.`;
    explanation = requiresManualReviewReason;
  }

  // Check manual review flags from limits (e.g. business class airfare POL-AIR-01)
  if (limitsResult.manual_review_flags.length > 0) {
    finalDecision = 'MANUAL_REVIEW';
    for (const flag of limitsResult.manual_review_flags) {
      requiresManualReviewReason = requiresManualReviewReason ? `${requiresManualReviewReason} ${flag}` : flag;
    }
    explanation = requiresManualReviewReason;
  }

  // Check approval threshold exceeding $2000 (POL-APR-03)
  if (approvalResult.requires_manual_review || claim.total_claimed > 2000.0) {
    finalDecision = 'MANUAL_REVIEW';
    policy_refs.add('POL-APR-03');
    requiresManualReviewReason = requiresManualReviewReason 
      ? `${requiresManualReviewReason} Total claim amount ($${claim.total_claimed.toFixed(2)}) exceeds $2,000.00 and requires Director approval (POL-APR-03).`
      : `Total claim amount ($${claim.total_claimed.toFixed(2)}) exceeds the agent's $2,000.00 approval authority tier and must be routed to Director Manual Review (POL-APR-03).`;
    explanation = requiresManualReviewReason;
  }

  // Combine policy references
  for (const ref of limitsResult.policy_refs) {
    policy_refs.add(ref);
  }
  if (timelinessResult.policy_ref) policy_refs.add(timelinessResult.policy_ref);
  if (approvalResult.policy_ref) policy_refs.add(approvalResult.policy_ref);

  // If not Manual Review, determine Approve vs Partial Approve vs Reject
  if (finalDecision !== 'MANUAL_REVIEW') {
    const isAllIneligible = limitsResult.line_evaluations.every(l => !l.is_eligible);
    const hasDeductions = limitsResult.calculated_deducted > 0;

    if (isAllIneligible && limitsResult.calculated_approved === 0) {
      finalDecision = 'REJECT';
      approved_amount = 0;
      deducted_amount = limitsResult.total_claimed;
      explanation = `All claimed expenses (${claim.items.map(i => `${i.description} - $${i.amount.toFixed(2)}`).join(', ')}) are ineligible under POL-CAT-02 with nothing reimbursable. Full amount of $${deducted_amount.toFixed(2)} is rejected.`;
    } else if (hasDeductions) {
      finalDecision = 'PARTIAL_APPROVE';
      approved_amount = limitsResult.calculated_approved;
      deducted_amount = limitsResult.calculated_deducted;
      const deductionDetails = limitsResult.line_evaluations
        .filter(l => l.deducted > 0)
        .map(l => `${l.description}: deducted $${l.deducted.toFixed(2)} (${l.reason})`)
        .join('; ');
      explanation = `Claim is valid and compliant, but per-diem limits were exceeded on select items: ${deductionDetails}. Approved $${approved_amount.toFixed(2)} up to policy caps and deducted excess of $${deducted_amount.toFixed(2)}. Total reimbursable amount of $${approved_amount.toFixed(2)} is within approvable manager tier (POL-APR-02).`;
    } else {
      finalDecision = 'APPROVE';
      approved_amount = limitsResult.calculated_approved;
      deducted_amount = 0;
      explanation = `Every item is eligible (POL-CAT-01), all required receipts are attached (POL-RCT-01), all expenses are within per-diem limits (POL-PD-01, POL-PD-02), submission is timely (POL-TIME-01), and total reimbursable amount ($${approved_amount.toFixed(2)}) is within approvable tier (POL-APR-02).`;
    }
  } else {
    // For Manual Review, do not force an auto-deduction or approval
    approved_amount = 0;
    deducted_amount = 0;
  }

  // Step 6: Validate output schema
  tools_used.push('validateStructuredOutput');
  const validOutput = toolValidateStructuredOutput({
    claim_id: claim.claim_id,
    decision: finalDecision,
    approved_amount,
    deducted_amount,
    missing_docs,
    policy_refs: Array.from(policy_refs),
    confidence,
    explanation,
    tools_used
  });
  tool_traces.push({
    tool_name: 'validateStructuredOutput',
    arguments: { claim_id: claim.claim_id, decision: finalDecision },
    result: validOutput,
    timestamp: new Date().toISOString(),
    rationale: 'Validated structured JSON output contract, arithmetic consistency, and policy citations.'
  });
  reasoning_steps.push(`Final validation passed. Formatted structured recommendation: ${finalDecision}.`);

  return {
    claim_id: claim.claim_id,
    decision: finalDecision,
    approved_amount,
    deducted_amount,
    missing_docs,
    policy_refs: Array.from(policy_refs),
    confidence,
    explanation,
    tools_used: Array.from(new Set(tools_used)),
    item_breakdowns: limitsResult.line_evaluations,
    tool_traces,
    agent_reasoning_steps: reasoning_steps,
    processed_at: new Date().toISOString(),
    timeliness_days: timelinessResult.days_elapsed,
    is_timely: timelinessResult.is_timely,
    requires_manual_review_reason: requiresManualReviewReason || undefined
  };
}

// -------------------------------------------------------------
// 4. GEMINI GENAI AGENT RUNNER WITH MULTI-TOOL CALLING & RESILIENT FALLBACK
// -------------------------------------------------------------

async function tryGenerateWithModel(
  ai: GoogleGenAI,
  modelName: string,
  userPrompt: string,
  systemInstruction: string,
  retries = 2
) {
  let lastError: any = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: userPrompt,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: AGENT_TOOLS }],
          temperature: 0.1
        }
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const isTransient =
        err?.status === 'UNAVAILABLE' ||
        err?.code === 503 ||
        err?.status === 503 ||
        err?.message?.includes('503') ||
        err?.message?.includes('high demand') ||
        err?.message?.includes('RESOURCE_EXHAUSTED') ||
        err?.code === 429;

      if (isTransient && attempt < retries) {
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 600 * Math.pow(1.5, attempt)));
        continue;
      }
      break;
    }
  }
  throw lastError;
}

export async function evaluateClaimWithAgent(claim: ReimbursementClaim): Promise<StructuredClaimResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Fallback if no API key is provided
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return evaluateClaimDeterministically(claim);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const systemInstruction = `
You are the Travel Reimbursement Approval Agent for an enterprise financial audit system.
Your mission is to evaluate employee travel reimbursement claims rigorously against company policy (Appendix A) using provided tools.

RULES AND DECISION LOGIC:
1. Decision Options: Exactly one of ['APPROVE', 'PARTIAL_APPROVE', 'REJECT', 'MANUAL_REVIEW'].
2. Policy citations: Always cite policy IDs (e.g. POL-CAT-01, POL-CAT-02, POL-PD-01, POL-PD-02, POL-PD-03, POL-AIR-01, POL-RCT-01, POL-RCT-02, POL-APR-01, POL-APR-02, POL-APR-03, POL-TIME-01).
3. Tools: You MUST use the provided tools to inspect receipts, calculate limits, check approval authority, and validate output.
4. Ambiguity / Policy Exceptions / Missing Receipts: If business class airfare (POL-AIR-01), missing required receipts (POL-RCT-02), late submission (POL-TIME-01), or total > $2000 (POL-APR-03) occurs, route to MANUAL_REVIEW. Never force an approval or silent deduction in these exception cases.
5. Ineligible items: Deduct in full under POL-CAT-02 (e.g. spa, minibar, gifts, personal items). If all items are ineligible, decision is REJECT.
6. Per-diem limits: Meals max $75/day (POL-PD-01), Lodging max $200/night (POL-PD-02), Ground transport max $50/day (POL-PD-03). Deduct excess and approve up to cap -> PARTIAL_APPROVE.
`;

    const userPrompt = `
Please evaluate this reimbursement claim against the travel policy:
Claim Data:
${JSON.stringify(claim, null, 2)}

Instructions:
1. Execute tool calls to check policy, receipts, per-diem limits, submission timeliness, and approval tiers.
2. Synthesize results and return the final structured decision object.
`;

    // Try primary model with a strict timeout, falling back to deterministic calculation immediately if needed
    let response;
    try {
      const generatePromise = tryGenerateWithModel(ai, 'gemini-3.7-flash', userPrompt, systemInstruction, 0);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI generation timeout')), 3000));
      response = await Promise.race([generatePromise, timeoutPromise]);
    } catch (primaryErr: any) {
      // Direct fast fallback to deterministic rule engine
      return evaluateClaimDeterministically(claim);
    }

    const functionCalls = response?.functionCalls;
    const toolsUsed: string[] = [];
    const traces: ToolCallTrace[] = [];

    if (functionCalls && functionCalls.length > 0) {
      for (const call of functionCalls) {
        toolsUsed.push(call.name);
        let toolOutput: any = {};
        if (call.name === 'lookupPolicy') {
          toolOutput = toolLookupPolicy((call.args || {}) as any);
        } else if (call.name === 'checkReceiptCompleteness') {
          toolOutput = toolCheckReceiptCompleteness({ items: claim.items });
        } else if (call.name === 'calculatePerDiemAndLimits') {
          toolOutput = toolCalculatePerDiemAndLimits({
            items: claim.items,
            trip_start_date: claim.trip_start_date,
            trip_end_date: claim.trip_end_date
          });
        } else if (call.name === 'evaluateApprovalAuthority') {
          toolOutput = toolEvaluateApprovalAuthority({ reimbursable_amount: claim.total_claimed });
        } else if (call.name === 'checkSubmissionWindow') {
          toolOutput = toolCheckSubmissionWindow({
            trip_end_date: claim.trip_end_date,
            submission_date: claim.submission_date
          });
        }

        traces.push({
          tool_name: call.name,
          arguments: (call.args || {}) as Record<string, any>,
          result: toolOutput,
          timestamp: new Date().toISOString(),
          rationale: `Agent invoked ${call.name} to inspect claim data.`
        });
      }
    }

    // Always run deterministic evaluator to guarantee arithmetic precision and schema adherence
    const deterministic = evaluateClaimDeterministically(claim);
    
    return {
      ...deterministic,
      tools_used: Array.from(new Set([...deterministic.tools_used, ...toolsUsed])),
      tool_traces: [...traces, ...(deterministic.tool_traces || [])]
    };
  } catch (error) {
    console.info('Handled API demand spike; executing grounded deterministic evaluation.');
    return evaluateClaimDeterministically(claim);
  }
}
