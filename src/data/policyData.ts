import { PolicyRule } from '../types';

export const TRAVEL_POLICY_RULES: PolicyRule[] = [
  {
    id: 'POL-CAT-01',
    title: 'Eligible Categories',
    category: 'eligible_categories',
    description: 'Reimbursable when incurred for a documented business purpose.',
    details: 'Covers: Airfare (economy class only — see POL-AIR-01), Lodging (hotel room charges), Meals (subject to per-diem limits — see POL-PD-01), Ground transport (taxi, rideshare, train, rental car, parking), Conference / registration fees.'
  },
  {
    id: 'POL-CAT-02',
    title: 'Ineligible Items',
    category: 'ineligible_items',
    description: 'Never reimbursable; rejected (deducted in full).',
    details: 'Includes: Alcohol and minibar charges, Spa, gym, and personal entertainment, In-room movies, personal shopping, gifts, Traffic fines, penalties, and late fees, Any personal (non-business) expense.'
  },
  {
    id: 'POL-PD-01',
    title: 'Meals Per-Diem Cap',
    category: 'per_diem_limits',
    description: 'Maximum $75 per day. Amounts above the daily cap are deducted; the rest is reimbursed.',
    details: 'Daily meal cap is $75.00. Applies across all meals in a single day.',
    limit_amount: 75,
    limit_unit: 'day'
  },
  {
    id: 'POL-PD-02',
    title: 'Lodging Nightly Cap',
    category: 'per_diem_limits',
    description: 'Maximum $200 per night. Amounts above the nightly cap are deducted; the rest is reimbursed.',
    details: 'Nightly hotel rate cap is $200.00. For multi-night stays, cap is $200 * number of nights.',
    limit_amount: 200,
    limit_unit: 'night'
  },
  {
    id: 'POL-PD-03',
    title: 'Ground Transport Daily Cap',
    category: 'per_diem_limits',
    description: 'Maximum $50 per day. Amounts above the cap are deducted.',
    details: 'Ground transport cap is $50.00 per travel day (taxis, rideshares, parking).',
    limit_amount: 50,
    limit_unit: 'day'
  },
  {
    id: 'POL-AIR-01',
    title: 'Airfare Class Rule',
    category: 'eligible_categories',
    description: 'Only economy class airfare is reimbursable. Business/first-class fares are a policy exception and must be routed to Manual Review.',
    details: 'Economy class airfare is auto-reimbursable. Premium/Business/First class are policy exceptions and MUST NOT be auto-deducted, but routed to Manual Review because pre-approval may exist.',
    mandatory_manual_review: true
  },
  {
    id: 'POL-RCT-01',
    title: 'Receipt Required Above $25',
    category: 'receipt_rules',
    description: 'Any single line item greater than $25 requires an attached, itemized receipt. Airfare and lodging always require a receipt regardless of amount.',
    details: 'Receipt threshold is >$25.00 for general expenses. Airfare and lodging ALWAYS require a receipt regardless of amount.'
  },
  {
    id: 'POL-RCT-02',
    title: 'Missing Receipt Handling',
    category: 'receipt_rules',
    description: 'If a receipt is missing for an item that requires one, the item is not silently rejected — the claim is routed to Manual Review so the reviewer can request the receipt.',
    details: 'Missing receipt for items requiring one must trigger Manual Review rather than forced deduction or silent rejection.',
    mandatory_manual_review: true
  },
  {
    id: 'POL-APR-01',
    title: 'Auto-Approve Tier (≤ $500)',
    category: 'approval_thresholds',
    description: 'Total reimbursable amount ≤ $500: may be auto-approved by the agent if fully compliant.',
    details: 'Agent has full authority to auto-approve fully compliant claims up to $500.00.',
    limit_amount: 500,
    limit_unit: 'total'
  },
  {
    id: 'POL-APR-02',
    title: 'Manager Approval Tier ($500 - $2,000)',
    category: 'approval_thresholds',
    description: 'Total reimbursable amount > $500 and ≤ $2,000: eligible for approval, treated as approvable when fully compliant.',
    details: 'Manager tier claims between $500.01 and $2,000.00 are approvable/partially approvable when compliant.',
    limit_amount: 2000,
    limit_unit: 'total'
  },
  {
    id: 'POL-APR-03',
    title: 'Director / Manual-Review Tier (> $2,000)',
    category: 'approval_thresholds',
    description: 'Total reimbursable amount > $2,000: exceeds the agent\'s auto-approval authority and must be routed to Manual Review.',
    details: 'Any claim whose post-deduction total exceeds $2,000.00 requires Director level approval and MUST be routed to Manual Review, even if otherwise compliant.',
    limit_amount: 2000,
    limit_unit: 'total',
    mandatory_manual_review: true
  },
  {
    id: 'POL-TIME-01',
    title: 'Submission Timeliness Window (30 Days)',
    category: 'timeliness',
    description: 'Claims must be submitted within 30 days of the expense date. Late claims are routed to Manual Review.',
    details: 'Submission window is 30 calendar days from trip end date. Claims submitted >30 days after trip must be routed to Manual Review.',
    limit_amount: 30,
    limit_unit: 'day',
    mandatory_manual_review: true
  }
];

export const POLICY_SUMMARY_MARKDOWN = `
# Appendix A — Travel Reimbursement Policy Summary
- **POL-CAT-01**: Eligible categories (Airfare economy only, Lodging hotel room, Meals with cap, Ground transport, Conference fees).
- **POL-CAT-02**: Ineligible items (Alcohol/minibar, Spa/gym, Movies/shopping, Fines/penalties, Personal expenses) - Deducted in full.
- **POL-PD-01**: Meals Cap: $75/day max. Excess deducted.
- **POL-PD-02**: Lodging Cap: $200/night max. Excess deducted.
- **POL-PD-03**: Ground Transport Cap: $50/day max. Excess deducted.
- **POL-AIR-01**: Airfare Class: Economy only. Business/First class is a policy exception -> Route to **MANUAL_REVIEW**.
- **POL-RCT-01**: Receipt Threshold: Required for any item > $25. Airfare and lodging ALWAYS require receipt.
- **POL-RCT-02**: Missing Receipt: Routes claim to **MANUAL_REVIEW** (do not silently reject).
- **POL-APR-01**: Auto-Approve Tier: Total ≤ $500.
- **POL-APR-02**: Manager Tier: Total > $500 and ≤ $2,000.
- **POL-APR-03**: Director Tier: Total > $2,000 -> Route to **MANUAL_REVIEW**.
- **POL-TIME-01**: Timeliness: Submission within 30 days. Late claims -> Route to **MANUAL_REVIEW**.
`;
