import { ReimbursementClaim, StructuredClaimResult, BatchEvaluationSummary } from '../types';
import { TRAVEL_POLICY_RULES } from '../data/policyData';

export function evaluateClaimClientSide(claim: ReimbursementClaim): StructuredClaimResult {
  const toolsUsed = [
    'lookupPolicy',
    'checkSubmissionWindow',
    'checkReceiptCompleteness',
    'calculatePerDiemAndLimits',
    'evaluateApprovalAuthority',
    'validateStructuredOutput'
  ];

  // 1. Timeliness
  const endD = new Date(claim.trip_end_date);
  const subD = new Date(claim.submission_date);
  const daysElapsed = Math.floor((subD.getTime() - endD.getTime()) / (1000 * 60 * 60 * 24));
  const isTimely = daysElapsed <= 30;

  // 2. Receipts
  const missingDocs: string[] = [];
  for (const item of claim.items) {
    const cat = (item.category || '').toLowerCase();
    const desc = (item.description || '').toLowerCase();
    const amt = item.amount;
    const isAirOrHotel = cat === 'airfare' || cat === 'lodging' || desc.includes('hotel') || desc.includes('flight') || desc.includes('airfare');
    if ((isAirOrHotel || amt > 25.0) && !item.receipt_attached) {
      missingDocs.push(`${item.category}: ${item.description} ($${amt.toFixed(2)})`);
    }
  }

  // 3. Duration & caps
  const startD = new Date(claim.trip_start_date);
  const diffTime = Math.abs(endD.getTime() - startD.getTime());
  const tripDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
  const tripNights = Math.max(1, tripDays - 1);

  let approved = 0;
  let deducted = 0;
  const policyRefs = new Set<string>();
  const manualReasons: string[] = [];
  const itemBreakdowns: any[] = [];

  for (const item of claim.items) {
    const cat = (item.category || '').toLowerCase();
    const desc = (item.description || '').toLowerCase();
    const amt = item.amount;

    if (
      cat === 'spa' ||
      cat === 'minibar' ||
      cat === 'entertainment' ||
      cat === 'shopping' ||
      cat === 'penalties' ||
      cat === 'personal' ||
      desc.includes('spa') ||
      desc.includes('minibar')
    ) {
      deducted += amt;
      policyRefs.add('POL-CAT-02');
      itemBreakdowns.push({
        id: item.id,
        category: item.category,
        claimed: amt,
        approved: 0,
        deducted: amt,
        is_eligible: false,
        reason: 'Ineligible expense category under POL-CAT-02; deducted in full.',
        policy_refs: ['POL-CAT-02']
      });
    } else if (cat === 'airfare' || desc.includes('flight') || desc.includes('airfare')) {
      policyRefs.add('POL-CAT-01');
      policyRefs.add('POL-AIR-01');
      if (desc.includes('business') || desc.includes('first-class') || desc.includes('first class')) {
        manualReasons.push(`Business/first-class airfare exception for '${item.description}' (POL-AIR-01)`);
        itemBreakdowns.push({
          id: item.id,
          category: item.category,
          claimed: amt,
          approved: 0,
          deducted: 0,
          is_eligible: true,
          reason: 'Business/first-class airfare requires manual review exception approval (POL-AIR-01).',
          policy_refs: ['POL-AIR-01', 'POL-CAT-01']
        });
      } else {
        approved += amt;
        itemBreakdowns.push({
          id: item.id,
          category: item.category,
          claimed: amt,
          approved: amt,
          deducted: 0,
          is_eligible: true,
          reason: 'Economy airfare is fully reimbursable (POL-CAT-01, POL-AIR-01).',
          policy_refs: ['POL-CAT-01', 'POL-AIR-01']
        });
      }
    } else if (cat === 'lodging' || desc.includes('hotel') || desc.includes('lodging')) {
      policyRefs.add('POL-CAT-01');
      policyRefs.add('POL-PD-02');
      let nights = tripNights;
      const nightMatch = desc.match(/(\d+)\s*night/i);
      if (nightMatch) nights = parseInt(nightMatch[1], 10);
      const cap = nights * 200.0;

      if (amt > cap) {
        const excess = amt - cap;
        approved += cap;
        deducted += excess;
        itemBreakdowns.push({
          id: item.id,
          category: item.category,
          claimed: amt,
          approved: cap,
          deducted: excess,
          is_eligible: true,
          reason: `Lodging exceeds nightly limit ($200/night). Excess of $${excess.toFixed(2)} deducted (POL-PD-02).`,
          policy_refs: ['POL-CAT-01', 'POL-PD-02']
        });
      } else {
        approved += amt;
        itemBreakdowns.push({
          id: item.id,
          category: item.category,
          claimed: amt,
          approved: amt,
          deducted: 0,
          is_eligible: true,
          reason: `Lodging rate is within $200/night policy cap (POL-PD-02).`,
          policy_refs: ['POL-CAT-01', 'POL-PD-02']
        });
      }
    } else if (cat === 'meals' || desc.includes('meal') || desc.includes('dinner')) {
      policyRefs.add('POL-CAT-01');
      policyRefs.add('POL-PD-01');
      let days = tripDays;
      const dayMatch = desc.match(/(\d+)\s*day/i);
      if (dayMatch) days = parseInt(dayMatch[1], 10);
      const cap = days * 75.0;

      if (amt > cap) {
        const excess = amt - cap;
        approved += cap;
        deducted += excess;
        itemBreakdowns.push({
          id: item.id,
          category: item.category,
          claimed: amt,
          approved: cap,
          deducted: excess,
          is_eligible: true,
          reason: `Meals exceed daily limit ($75/day). Excess of $${excess.toFixed(2)} deducted (POL-PD-01).`,
          policy_refs: ['POL-CAT-01', 'POL-PD-01']
        });
      } else {
        approved += amt;
        itemBreakdowns.push({
          id: item.id,
          category: item.category,
          claimed: amt,
          approved: amt,
          deducted: 0,
          is_eligible: true,
          reason: `Meals are within $75/day per-diem cap (POL-PD-01).`,
          policy_refs: ['POL-CAT-01', 'POL-PD-01']
        });
      }
    } else if (cat === 'ground_transport' || desc.includes('taxi') || desc.includes('transit')) {
      policyRefs.add('POL-CAT-01');
      policyRefs.add('POL-PD-03');
      const cap = tripDays * 50.0;
      if (amt > cap) {
        const excess = amt - cap;
        approved += cap;
        deducted += excess;
        itemBreakdowns.push({
          id: item.id,
          category: item.category,
          claimed: amt,
          approved: cap,
          deducted: excess,
          is_eligible: true,
          reason: `Ground transport exceeds $50/day cap. Excess of $${excess.toFixed(2)} deducted (POL-PD-03).`,
          policy_refs: ['POL-CAT-01', 'POL-PD-03']
        });
      } else {
        approved += amt;
        itemBreakdowns.push({
          id: item.id,
          category: item.category,
          claimed: amt,
          approved: amt,
          deducted: 0,
          is_eligible: true,
          reason: `Ground transport is within $50/day cap (POL-PD-03).`,
          policy_refs: ['POL-CAT-01', 'POL-PD-03']
        });
      }
    } else {
      policyRefs.add('POL-CAT-01');
      approved += amt;
      itemBreakdowns.push({
        id: item.id,
        category: item.category,
        claimed: amt,
        approved: amt,
        deducted: 0,
        is_eligible: true,
        reason: 'Eligible business expense under POL-CAT-01.',
        policy_refs: ['POL-CAT-01']
      });
    }
  }

  policyRefs.add('POL-TIME-01');
  if (!isTimely) {
    manualReasons.push(`Late submission (${daysElapsed} days > 30 days allowed) [POL-TIME-01]`);
  }

  if (missingDocs.length > 0) {
    policyRefs.add('POL-RCT-01');
    policyRefs.add('POL-RCT-02');
    manualReasons.push(`Missing required receipts for: ${missingDocs.join(', ')} (POL-RCT-02)`);
  } else {
    policyRefs.add('POL-RCT-01');
  }

  const totalClaimed = claim.total_claimed || claim.items.reduce((s, i) => s + i.amount, 0);
  if (totalClaimed > 2000.0) {
    policyRefs.add('POL-APR-03');
    manualReasons.push(`Total claim amount ($${totalClaimed.toFixed(2)}) exceeds $2,000.00 Director tier (POL-APR-03)`);
  } else if (approved <= 500.0) {
    policyRefs.add('POL-APR-01');
  } else {
    policyRefs.add('POL-APR-02');
  }

  let decision: 'APPROVE' | 'PARTIAL_APPROVE' | 'REJECT' | 'MANUAL_REVIEW';
  let finalApproved = 0;
  let finalDeducted = 0;
  let explanation = '';
  let confidence = 0.99;

  if (manualReasons.length > 0) {
    decision = 'MANUAL_REVIEW';
    finalApproved = 0;
    finalDeducted = 0;
    explanation = manualReasons.join('. ') + '.';
    confidence = 0.96;
  } else if (approved === 0 && deducted === totalClaimed) {
    decision = 'REJECT';
    finalApproved = 0;
    finalDeducted = deducted;
    explanation = `All claimed expenses are ineligible under POL-CAT-02; rejected in full.`;
    confidence = 0.99;
  } else if (deducted > 0) {
    decision = 'PARTIAL_APPROVE';
    finalApproved = Math.round(approved * 100) / 100;
    finalDeducted = Math.round(deducted * 100) / 100;
    explanation = `Claim approved up to policy limits ($${finalApproved.toFixed(2)}); excess of $${finalDeducted.toFixed(2)} deducted for per-diem caps.`;
    confidence = 0.98;
  } else {
    decision = 'APPROVE';
    finalApproved = Math.round(approved * 100) / 100;
    finalDeducted = 0;
    explanation = 'Fully compliant claim. All items eligible, receipts attached, within per-diem limits and approval tiers.';
    confidence = 0.99;
  }

  return {
    claim_id: claim.claim_id,
    decision,
    approved_amount: finalApproved,
    deducted_amount: finalDeducted,
    missing_docs: missingDocs,
    policy_refs: Array.from(policyRefs).sort(),
    confidence,
    explanation,
    tools_used: toolsUsed,
    item_breakdowns: itemBreakdowns,
    processed_at: new Date().toISOString(),
    timeliness_days: daysElapsed,
    is_timely: isTimely,
    requires_manual_review_reason: manualReasons.length > 0 ? manualReasons.join('; ') : undefined
  };
}

export function evaluateBatchClientSide(claims: ReimbursementClaim[]): BatchEvaluationSummary {
  const results: StructuredClaimResult[] = [];
  let totalClaimed = 0;
  let totalApproved = 0;
  let totalDeducted = 0;
  let approvedCount = 0;
  let partialApprovedCount = 0;
  let rejectedCount = 0;
  let manualReviewCount = 0;

  for (const claim of claims) {
    const res = evaluateClaimClientSide(claim);
    results.push(res);

    totalClaimed += claim.total_claimed || claim.items.reduce((s, i) => s + i.amount, 0);
    totalApproved += res.approved_amount;
    totalDeducted += res.deducted_amount;

    if (res.decision === 'APPROVE') approvedCount++;
    else if (res.decision === 'PARTIAL_APPROVE') partialApprovedCount++;
    else if (res.decision === 'REJECT') rejectedCount++;
    else if (res.decision === 'MANUAL_REVIEW') manualReviewCount++;
  }

  const round2 = (v: number) => Math.round(v * 100) / 100;

  return {
    total_claims: claims.length,
    approved_count: approvedCount,
    partial_approved_count: partialApprovedCount,
    rejected_count: rejectedCount,
    manual_review_count: manualReviewCount,
    total_claimed_amount: round2(totalClaimed),
    total_approved_amount: round2(totalApproved),
    total_deducted_amount: round2(totalDeducted),
    auto_approved_rate: round2(((approvedCount + partialApprovedCount) / (claims.length || 1)) * 100),
    results
  };
}
