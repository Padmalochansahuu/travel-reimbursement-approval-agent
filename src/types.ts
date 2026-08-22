export type ClaimDecision = 'APPROVE' | 'PARTIAL_APPROVE' | 'REJECT' | 'MANUAL_REVIEW';

export type ExpenseCategory = 
  | 'airfare'
  | 'lodging'
  | 'meals'
  | 'ground_transport'
  | 'conference_fees'
  | 'spa'
  | 'minibar'
  | 'entertainment'
  | 'shopping'
  | 'penalties'
  | 'personal'
  | 'other';

export interface ExpenseItem {
  id: string;
  category: ExpenseCategory | string;
  description: string;
  amount: number;
  receipt_attached: boolean;
  date?: string;
  // Computed details from analysis
  is_eligible?: boolean;
  approved_amount?: number;
  deducted_amount?: number;
  deduction_reason?: string;
  policy_refs?: string[];
}

export interface ReimbursementClaim {
  claim_id: string;
  employee_name: string;
  trip_purpose: string;
  trip_start_date: string;
  trip_end_date: string;
  submission_date: string;
  items: ExpenseItem[];
  total_claimed: number;
  notes?: string;
}

export interface ToolCallTrace {
  tool_name: string;
  arguments: Record<string, any>;
  result: Record<string, any>;
  timestamp: string;
  rationale?: string;
}

export interface StructuredClaimResult {
  claim_id: string;
  decision: ClaimDecision;
  approved_amount: number;
  deducted_amount: number;
  missing_docs: string[];
  policy_refs: string[];
  confidence: number;
  explanation: string;
  tools_used: string[];
  // Extended audit information
  item_breakdowns?: {
    description: string;
    category: string;
    claimed: number;
    approved: number;
    deducted: number;
    notes: string;
    policy_refs: string[];
  }[];
  tool_traces?: ToolCallTrace[];
  agent_reasoning_steps?: string[];
  processed_at?: string;
  timeliness_days?: number;
  is_timely?: boolean;
  requires_manual_review_reason?: string;
}

export interface PolicyRule {
  id: string;
  title: string;
  category: 'eligible_categories' | 'ineligible_items' | 'per_diem_limits' | 'receipt_rules' | 'approval_thresholds' | 'timeliness';
  description: string;
  details: string;
  limit_amount?: number;
  limit_unit?: 'day' | 'night' | 'total' | 'item';
  mandatory_manual_review?: boolean;
}

export interface BatchEvaluationSummary {
  total_claims: number;
  approved_count: number;
  partial_approved_count: number;
  rejected_count: number;
  manual_review_count: number;
  total_claimed_amount: number;
  total_approved_amount: number;
  total_deducted_amount: number;
  auto_approved_rate: number;
  results: StructuredClaimResult[];
}
