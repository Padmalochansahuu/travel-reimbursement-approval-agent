import { ReimbursementClaim } from '../types';

export const APPENDIX_B_CLAIMS: ReimbursementClaim[] = [
  {
    claim_id: 'CLM-001',
    employee_name: 'A. Rivera',
    trip_purpose: 'Attend 2-day industry conference (business)',
    trip_start_date: '2026-06-10',
    trip_end_date: '2026-06-12',
    submission_date: '2026-06-20',
    total_claimed: 1110.00,
    items: [
      {
        id: 'CLM-001-1',
        category: 'airfare',
        description: 'Round-trip economy airfare',
        amount: 420.00,
        receipt_attached: true
      },
      {
        id: 'CLM-001-2',
        category: 'lodging',
        description: 'Hotel, 2 nights @ $180',
        amount: 360.00,
        receipt_attached: true
      },
      {
        id: 'CLM-001-3',
        category: 'meals',
        description: 'Meals, 3 days @ ~$60/day',
        amount: 180.00,
        receipt_attached: true
      },
      {
        id: 'CLM-001-4',
        category: 'conference_fees',
        description: 'Conference registration',
        amount: 150.00,
        receipt_attached: true
      }
    ],
    notes: 'Standard conference trip. All receipts attached. All expenses within policy limits.'
  },
  {
    claim_id: 'CLM-002',
    employee_name: 'B. Osei',
    trip_purpose: 'Weekend hotel stay',
    trip_start_date: '2026-06-14',
    trip_end_date: '2026-06-15',
    submission_date: '2026-06-25',
    total_claimed: 380.00,
    items: [
      {
        id: 'CLM-002-1',
        category: 'spa',
        description: 'Hotel spa package',
        amount: 300.00,
        receipt_attached: true
      },
      {
        id: 'CLM-002-2',
        category: 'minibar',
        description: 'In-room minibar',
        amount: 80.00,
        receipt_attached: true
      }
    ],
    notes: 'Claim consists entirely of ineligible items (spa package and in-room minibar).'
  },
  {
    claim_id: 'CLM-003',
    employee_name: 'C. Nakamura',
    trip_purpose: 'Client site visit (business)',
    trip_start_date: '2026-06-08',
    trip_end_date: '2026-06-10',
    submission_date: '2026-06-22',
    total_claimed: 940.00,
    items: [
      {
        id: 'CLM-003-1',
        category: 'airfare',
        description: 'Round-trip economy airfare',
        amount: 300.00,
        receipt_attached: true
      },
      {
        id: 'CLM-003-2',
        category: 'lodging',
        description: 'Hotel, 2 nights @ $250',
        amount: 500.00,
        receipt_attached: true
      },
      {
        id: 'CLM-003-3',
        category: 'meals',
        description: 'Meals, 2 days @ $70/day',
        amount: 140.00,
        receipt_attached: true
      }
    ],
    notes: 'Lodging exceeds $200/night cap ($250 claimed vs $200 cap = $50 excess per night, $100 total deduction). Meals are $70/day <= $75 cap.'
  },
  {
    claim_id: 'CLM-004',
    employee_name: 'D. Fischer',
    trip_purpose: 'International vendor negotiation (business)',
    trip_start_date: '2026-06-16',
    trip_end_date: '2026-06-18',
    submission_date: '2026-06-28',
    total_claimed: 3000.00,
    items: [
      {
        id: 'CLM-004-1',
        category: 'airfare',
        description: 'Business-class international airfare',
        amount: 2400.00,
        receipt_attached: true
      },
      {
        id: 'CLM-004-2',
        category: 'lodging',
        description: 'Hotel, 3 nights',
        amount: 600.00,
        receipt_attached: false
      }
    ],
    notes: 'Multiple exceptions: Business-class airfare (POL-AIR-01), Missing hotel receipt (POL-RCT-02), Exceeds $2000 Director tier (POL-APR-03).'
  },
  {
    claim_id: 'CLM-005',
    employee_name: 'E. Haddad',
    trip_purpose: 'Client dinner / business development',
    trip_start_date: '2026-06-11',
    trip_end_date: '2026-06-11',
    submission_date: '2026-06-24',
    total_claimed: 220.00,
    items: [
      {
        id: 'CLM-005-1',
        category: 'meals',
        description: 'Client dinner for 4 (business development)',
        amount: 220.00,
        receipt_attached: false
      }
    ],
    notes: 'Single dinner claimed at $220 with no receipt. Exceeds $25 threshold (POL-RCT-01, POL-RCT-02) -> Manual Review.'
  }
];

export const GROUND_TRUTH_BENCHMARKS: Record<string, {
  expected_decision: string;
  expected_approved: number;
  expected_deducted: number;
  key_policies: string[];
  reason: string;
}> = {
  'CLM-001': {
    expected_decision: 'APPROVE',
    expected_approved: 1110.00,
    expected_deducted: 0.00,
    key_policies: ['POL-CAT-01', 'POL-AIR-01', 'POL-PD-01', 'POL-PD-02', 'POL-RCT-01', 'POL-APR-02', 'POL-TIME-01'],
    reason: 'Fully compliant claim with economy airfare, lodging under $200/night cap, meals under $75/day cap, all receipts present, and within manager approval threshold ($1110 <= $2000).'
  },
  'CLM-002': {
    expected_decision: 'REJECT',
    expected_approved: 0.00,
    expected_deducted: 380.00,
    key_policies: ['POL-CAT-02'],
    reason: 'All claimed expenses (Spa $300 and Minibar $80) are explicitly categorized as ineligible personal items under POL-CAT-02 with nothing reimbursable.'
  },
  'CLM-003': {
    expected_decision: 'PARTIAL_APPROVE',
    expected_approved: 840.00,
    expected_deducted: 100.00,
    key_policies: ['POL-CAT-01', 'POL-AIR-01', 'POL-PD-01', 'POL-PD-02', 'POL-RCT-01', 'POL-APR-02', 'POL-TIME-01'],
    reason: 'Lodging exceeds the $200/night nightly limit (2 nights @ $250 = $500 claimed vs $400 allowed). Deducts $100 excess and approves remaining $840.'
  },
  'CLM-004': {
    expected_decision: 'MANUAL_REVIEW',
    expected_approved: 0.00,
    expected_deducted: 0.00,
    key_policies: ['POL-AIR-01', 'POL-RCT-02', 'POL-APR-03'],
    reason: 'Routes to Manual Review due to: (1) Business-class airfare exception (POL-AIR-01), (2) Missing lodging receipt (POL-RCT-02), and (3) Total claim of $3,000 exceeds $2,000 agent threshold (POL-APR-03).'
  },
  'CLM-005': {
    expected_decision: 'MANUAL_REVIEW',
    expected_approved: 0.00,
    expected_deducted: 0.00,
    key_policies: ['POL-RCT-01', 'POL-RCT-02', 'POL-PD-01'],
    reason: 'Routes to Manual Review because single $220 meal expense exceeds the $25 receipt threshold and has no attached receipt (POL-RCT-02). Requires reviewer follow-up.'
  }
};
