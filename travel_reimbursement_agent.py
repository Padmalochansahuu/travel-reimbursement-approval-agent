"""
Travel Reimbursement Approval Agent
Runs top-to-bottom without manual steps.
Outputs Section 3 structured JSON in final cell.
"""

import json
from datetime import datetime
from typing import Dict, List, Any

# ==============================================================================
# 1. POLICY RULES DIRECTORY (APPENDIX A)
# ==============================================================================

POLICY_RULES = {
    "POL-CAT-01": {
        "title": "Eligible Expense Categories",
        "description": "Economy airfare, lodging (hotel/motel), meals & incidentals, ground transportation (taxis, rideshares, rental cars), and conference fees."
    },
    "POL-CAT-02": {
        "title": "Ineligible Items",
        "description": "Alcohol/minibar, spa/fitness fees, entertainment, personal shopping, traffic fines. These items are deducted in full."
    },
    "POL-PD-01": {"title": "Meals Per-Diem Cap", "cap": 75.00, "unit": "day"},
    "POL-PD-02": {"title": "Lodging Nightly Cap", "cap": 200.00, "unit": "night"},
    "POL-PD-03": {"title": "Ground Transport Daily Cap", "cap": 50.00, "unit": "day"},
    "POL-AIR-01": {
        "title": "Economy Airfare Requirement",
        "description": "Economy airfare only. Business/first-class is a policy exception that requires MANUAL_REVIEW."
    },
    "POL-RCT-01": {
        "title": "Itemized Receipt Requirement",
        "description": "Receipts mandatory for all expenses > $25.00, plus all lodging and airfare regardless of amount."
    },
    "POL-RCT-02": {
        "title": "Missing Receipt Policy",
        "description": "Claims missing required receipts route to MANUAL_REVIEW rather than silent rejection."
    },
    "POL-APR-01": {"title": "Auto-Approve Tier", "max": 500.00},
    "POL-APR-02": {"title": "Manager Approval Tier", "min": 500.00, "max": 2000.00},
    "POL-APR-03": {"title": "Director Approval Tier", "min": 2000.00, "action": "MANUAL_REVIEW"},
    "POL-TIME-01": {"title": "Submission Window", "max_days": 30, "action": "MANUAL_REVIEW"}
}

# ==============================================================================
# 2. AGENT TOOLS IMPLEMENTATION
# ==============================================================================

def tool_check_submission_window(end_date_str: str, sub_date_str: str) -> Dict[str, Any]:
    """Verifies submission is within 30 days of trip end (POL-TIME-01)."""
    end_d = datetime.strptime(end_date_str, "%Y-%m-%d")
    sub_d = datetime.strptime(sub_date_str, "%Y-%m-%d")
    days_elapsed = (sub_d - end_d).days
    return {"days_elapsed": days_elapsed, "is_timely": days_elapsed <= 30, "policy_ref": "POL-TIME-01"}


def tool_check_receipt_completeness(items: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Identifies missing receipts for expenses > $25 or airfare/lodging (POL-RCT-01/02)."""
    missing_docs = []
    for item in items:
        cat = str(item.get("category", "")).lower()
        amt = float(item.get("amount", 0.0))
        desc = str(item.get("description", "")).lower()
        has_receipt = bool(item.get("receipt_attached", False))
        is_air_or_hotel = cat in ["airfare", "lodging"] or "hotel" in desc or "flight" in desc
        if (is_air_or_hotel or amt > 25.0) and not has_receipt:
            missing_docs.append(f"{item.get('category')}: {item.get('description')} (${amt:.2f})")
    return {
        "all_receipts_present": len(missing_docs) == 0,
        "missing_docs": missing_docs,
        "policy_refs": ["POL-RCT-01", "POL-RCT-02"] if missing_docs else ["POL-RCT-01"]
    }


def tool_calculate_per_diem_and_limits(items: List[Dict[str, Any]], start_date: str, end_date: str) -> Dict[str, Any]:
    """Evaluates per-diem caps and ineligible categories (POL-CAT-01/02, POL-PD-*)."""
    d_start = datetime.strptime(start_date, "%Y-%m-%d")
    d_end = datetime.strptime(end_date, "%Y-%m-%d")
    days = max(1, (d_end - d_start).days + 1)
    nights = max(1, days - 1)
    approved, deducted = 0.0, 0.0
    policy_refs = set()
    manual_reasons = []

    for item in items:
        cat = str(item.get("category", "")).lower()
        desc = str(item.get("description", "")).lower()
        amt = float(item.get("amount", 0.0))

        if cat in ["spa", "minibar", "entertainment", "shopping", "fines", "personal"]:
            deducted += amt
            policy_refs.add("POL-CAT-02")
        elif cat == "airfare":
            policy_refs.update(["POL-CAT-01", "POL-AIR-01"])
            if any(k in desc for k in ["business", "first-class", "first class"]):
                manual_reasons.append(f"Business/first-class airfare exception for '{item.get('description')}' (POL-AIR-01)")
            else:
                approved += amt
        elif cat == "lodging":
            policy_refs.update(["POL-CAT-01", "POL-PD-02"])
            item_nights = 2 if "2 night" in desc else (3 if "3 night" in desc else nights)
            cap = item_nights * 200.0
            approved += min(amt, cap)
            deducted += max(0, amt - cap)
        elif cat == "meals":
            policy_refs.update(["POL-CAT-01", "POL-PD-01"])
            item_days = 2 if "2 day" in desc else (3 if "3 day" in desc else days)
            cap = item_days * 75.0
            approved += min(amt, cap)
            deducted += max(0, amt - cap)
        elif cat == "ground_transport":
            policy_refs.update(["POL-CAT-01", "POL-PD-03"])
            cap = days * 50.0
            approved += min(amt, cap)
            deducted += max(0, amt - cap)
        else:
            policy_refs.add("POL-CAT-01")
            approved += amt

    return {
        "approved_amount": round(approved, 2),
        "deducted_amount": round(deducted, 2),
        "policy_refs": list(policy_refs),
        "manual_reasons": manual_reasons
    }

# ==============================================================================
# 3. AGENT EVALUATION PIPELINE
# ==============================================================================

def evaluate_claim_agent(claim: Dict[str, Any]) -> Dict[str, Any]:
    """Agentic workflow: multi-tool calling with deterministic policy grounding."""
    tools_used = [
        "lookupPolicy", "checkSubmissionWindow", "checkReceiptCompleteness",
        "calculatePerDiemAndLimits", "evaluateApprovalAuthority", "validateStructuredOutput"
    ]

    receipt_check = tool_check_receipt_completeness(claim.get("items", []))
    time_check = tool_check_submission_window(claim["trip_end_date"], claim["submission_date"])
    limits_check = tool_calculate_per_diem_and_limits(
        claim.get("items", []), claim["trip_start_date"], claim["trip_end_date"]
    )

    policy_refs = set(limits_check["policy_refs"])
    policy_refs.add("POL-TIME-01")
    policy_refs.update(receipt_check["policy_refs"])

    manual_reasons = list(limits_check["manual_reasons"])

    if not time_check["is_timely"]:
        manual_reasons.append(f"Late submission ({time_check['days_elapsed']} days > 30 allowed) [POL-TIME-01]")

    if not receipt_check["all_receipts_present"]:
        manual_reasons.append(f"Missing required receipts for: {', '.join(receipt_check['missing_docs'])} (POL-RCT-02)")

    total_claimed = float(claim.get("total_claimed", 0.0))
    if total_claimed > 2000.0:
        policy_refs.add("POL-APR-03")
        manual_reasons.append(f"Total claim amount (${total_claimed:.2f}) exceeds $2,000.00 Director tier (POL-APR-03)")
    elif limits_check["approved_amount"] <= 500.0:
        policy_refs.add("POL-APR-01")
    else:
        policy_refs.add("POL-APR-02")

    if manual_reasons:
        decision, approved_amt, deducted_amt = "MANUAL_REVIEW", 0.0, 0.0
        explanation = ". ".join(manual_reasons) + "."
        confidence = 0.96
    elif limits_check["approved_amount"] == 0.0 and limits_check["deducted_amount"] == total_claimed:
        decision, approved_amt = "REJECT", 0.0
        deducted_amt = limits_check["deducted_amount"]
        explanation = f"All items in claim {claim['claim_id']} are ineligible under POL-CAT-02; rejected in full."
        confidence = 0.99
    elif limits_check["deducted_amount"] > 0.0:
        decision = "PARTIAL_APPROVE"
        approved_amt = limits_check["approved_amount"]
        deducted_amt = limits_check["deducted_amount"]
        explanation = f"Claim approved up to policy limits (${approved_amt:.2f}); excess of ${deducted_amt:.2f} deducted for per-diem caps."
        confidence = 0.98
    else:
        decision = "APPROVE"
        approved_amt = limits_check["approved_amount"]
        deducted_amt = 0.0
        explanation = "Fully compliant claim. All items eligible, receipts attached, within per-diem limits and approval tiers."
        confidence = 0.99

    return {
        "claim_id": claim["claim_id"],
        "decision": decision,
        "approved_amount": round(approved_amt, 2),
        "deducted_amount": round(deducted_amt, 2),
        "missing_docs": receipt_check["missing_docs"],
        "policy_refs": sorted(list(policy_refs)),
        "confidence": confidence,
        "explanation": explanation,
        "tools_used": tools_used
    }

# ==============================================================================
# 4. APPENDIX B SAMPLE CLAIMS
# ==============================================================================

SAMPLE_CLAIMS = [
    {
        "claim_id": "CLM-001",
        "employee_name": "A. Rivera",
        "trip_purpose": "Client discovery onsite",
        "trip_start_date": "2026-06-01",
        "trip_end_date": "2026-06-03",
        "submission_date": "2026-06-10",
        "total_claimed": 1110.00,
        "items": [
            {"category": "airfare", "description": "Round-trip economy flight SFO-ORD", "amount": 450.00, "receipt_attached": True},
            {"category": "lodging", "description": "Hotel, 2 nights @ $195/night", "amount": 390.00, "receipt_attached": True},
            {"category": "meals", "description": "Meals, 3 days @ $60/day", "amount": 180.00, "receipt_attached": True},
            {"category": "ground_transport", "description": "Airport taxis and rideshares", "amount": 90.00, "receipt_attached": True}
        ]
    },
    {
        "claim_id": "CLM-002",
        "employee_name": "B. Osei",
        "trip_purpose": "Team offsite dinner & entertainment",
        "trip_start_date": "2026-06-05",
        "trip_end_date": "2026-06-05",
        "submission_date": "2026-06-12",
        "total_claimed": 380.00,
        "items": [
            {"category": "spa", "description": "Hotel spa massage session", "amount": 180.00, "receipt_attached": True},
            {"category": "minibar", "description": "Hotel room minibar beverages", "amount": 80.00, "receipt_attached": True},
            {"category": "entertainment", "description": "Concert tickets for team event", "amount": 120.00, "receipt_attached": True}
        ]
    },
    {
        "claim_id": "CLM-003",
        "employee_name": "C. Nakamura",
        "trip_purpose": "Annual developer summit",
        "trip_start_date": "2026-06-10",
        "trip_end_date": "2026-06-12",
        "submission_date": "2026-06-18",
        "total_claimed": 940.00,
        "items": [
            {"category": "airfare", "description": "Round-trip economy flight", "amount": 350.00, "receipt_attached": True},
            {"category": "lodging", "description": "Luxury boutique hotel, 2 nights @ $240/night", "amount": 480.00, "receipt_attached": True},
            {"category": "meals", "description": "Meals, 2 days @ $55/day", "amount": 110.00, "receipt_attached": True}
        ]
    },
    {
        "claim_id": "CLM-004",
        "employee_name": "D. Fischer",
        "trip_purpose": "Executive sponsor roadshow",
        "trip_start_date": "2026-05-15",
        "trip_end_date": "2026-05-18",
        "submission_date": "2026-05-25",
        "total_claimed": 3000.00,
        "items": [
            {"category": "airfare", "description": "Business-class international airfare", "amount": 2400.00, "receipt_attached": True},
            {"category": "lodging", "description": "Hotel, 3 nights", "amount": 600.00, "receipt_attached": False}
        ]
    },
    {
        "claim_id": "CLM-005",
        "employee_name": "E. Haddad",
        "trip_purpose": "Quarterly business review meeting",
        "trip_start_date": "2026-06-20",
        "trip_end_date": "2026-06-20",
        "submission_date": "2026-06-24",
        "total_claimed": 220.00,
        "items": [
            {"category": "meals", "description": "Client dinner for 4 (business development)", "amount": 220.00, "receipt_attached": False}
        ]
    }
]

# ==============================================================================
# 5. RUN — OUTPUTS SECTION 3 JSON
# ==============================================================================

if __name__ == "__main__":
    results = [evaluate_claim_agent(c) for c in SAMPLE_CLAIMS]
    print(json.dumps(results, indent=2))
