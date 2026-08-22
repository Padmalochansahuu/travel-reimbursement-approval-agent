# Travel Reimbursement Approval Agent

An agentic system that evaluates employee travel expense claims against corporate policy (Appendix A) using deterministic tool-calling and structured JSON output.

**Candidate**: Padmalochan Sahu — sahupadmalochan209@gmail.com  
**Assignment**: AI Developer Candidate Assignment — Travel Reimbursement Approval Agent  
**Submission file**: `padmalochansahu.ipynb` (namesurname.ipynb)

---

## 🌐 Live Demo

**[https://travel-claim-agent.web.app](https://travel-claim-agent.web.app)**

---

## ⭐ Main Deliverable

> The single assessed deliverable is **`padmalochansahu.ipynb`** — per assignment NOTE: *"Single Notebook uploaded on github with working repo (Shareable link) is the only deliverable"*

| File | Purpose |
|---|---|
| [`padmalochansahu.ipynb`](./padmalochansahu.ipynb) | ⭐ Main submission — runs top-to-bottom, outputs Section 3 JSON |
| [`travel_reimbursement_agent.py`](./travel_reimbursement_agent.py) | Same logic as a standalone Python script |

---

## 🚀 Setup & Run

> ✅ **No pip install. No API keys. No environment variables. Just Python 3.8+**

**Option A — Jupyter Notebook (recommended):**
```bash
jupyter lab padmalochansahu.ipynb
# Click: Kernel → Restart & Run All Cells
# Final cell prints the Section 3 JSON array
```

**Option B — Python script (fastest):**
```bash
python travel_reimbursement_agent.py
# Prints dashboard + all 5 claim decisions + Section 3 JSON instantly
```

**Option C — Web app (live UI):**
```
https://travel-claim-agent.web.app
```

**Run web app locally:**
```bash
npm install
npm run dev   # http://localhost:3000
```

---

## 🔑 Required Environment Variables

**None.** The pipeline is fully self-contained and runs offline.

- No OpenAI / Gemini / Anthropic API key needed
- No database or network connection required
- Uses only Python stdlib: `json`, `datetime`, `typing`

*(Optional future extension: set `OPENAI_API_KEY` to swap in a live LLM orchestrator — tool interfaces are designed to be LLM-callable without code changes)*

---

## 🏗️ Design Approach

This solution implements the agentic pattern **deterministically** rather than via a live LLM API call. Here is why and how:

**Why deterministic tool-calling:**
- Travel reimbursement evaluation is a fixed, dependency-ordered sequence of checks — there is no ambiguity about which tools to call or in what order
- Deterministic orchestration produces identical decisions to a well-prompted LLM, with zero hallucination risk on dollar amounts
- Every tool has a clean JSON-in / JSON-out signature — can be registered with OpenAI function-calling or LangChain without modification

**Tool execution order (mirrors what an LLM agent would do):**
1. `lookupPolicy` — retrieve rule definitions (max_days, thresholds, titles) before any evaluation
2. `checkSubmissionWindow` — verify claim submitted within 30 days (POL-TIME-01)
3. `checkReceiptCompleteness` — identify missing receipts (POL-RCT-01/02)
4. `calculatePerDiemAndLimits` — apply per-diem caps, flag ineligible items (POL-PD-*, POL-CAT-*)
5. `evaluateApprovalAuthority` — determine approval tier (POL-APR-01/02/03)
6. `validateStructuredOutput` — confirm all 9 required fields present before returning

**Conflict handling:** When multiple flags trigger simultaneously (e.g. CLM-004: business-class + missing receipt + $3,000 total), all reasons are collected and the claim routes to `MANUAL_REVIEW` — no flag is silently dropped.

---

## 📋 What's Inside the Notebook

| Section | Content |
|---|---|
| README | Setup, env vars, run instructions, design choices |
| 1. Policy Rules | All 12 Appendix A rules loaded as `POLICY_RULES` dict |
| 2. Agent Tools | 6 tool functions — all genuinely invoked in pipeline |
| 3. Agentic Pipeline | `evaluate_claim_agent()` — calls all 6 tools in order |
| Claim Intake | 5 Appendix B claims parsed from JSON string via `json.loads()` |
| 4. Evaluation | All 5 claims evaluated through pipeline |
| 5. Sample Outputs | Inline decision traces for all 5 claims |
| Dashboard | ASCII summary table — decision breakdown, totals |
| 6. Final JSON | Section 3 output — JSON array, 9 fields per claim |
| Design Notes | Agentic approach, trade-offs, why MANUAL_REVIEW, what to improve |
| Assumptions | Known gaps, simplifications, next steps |

---

## ✅ Benchmark Results (Appendix B)

| Claim | Employee | Claimed | Decision | Approved | Deducted |
|---|---|---|---|---|---|
| CLM-001 | A. Rivera | $1,110 | **APPROVE** | $1,110 | $0 |
| CLM-002 | B. Osei | $380 | **REJECT** | $0 | $380 |
| CLM-003 | C. Nakamura | $940 | **PARTIAL_APPROVE** | $840 | $100 |
| CLM-004 | D. Fischer | $3,000 | **MANUAL_REVIEW** | $0 | $0 |
| CLM-005 | E. Haddad | $220 | **MANUAL_REVIEW** | $0 | $0 |

---

## 📜 Policy Rules (Appendix A)

| Rule | Description |
|---|---|
| `POL-CAT-01` | Eligible: airfare (economy), lodging, meals, ground transport, conference fees |
| `POL-CAT-02` | Ineligible: spa, minibar, entertainment, personal items — deducted in full |
| `POL-PD-01` | Meals cap: $75/day |
| `POL-PD-02` | Lodging cap: $200/night |
| `POL-PD-03` | Ground transport cap: $50/day |
| `POL-AIR-01` | Business/first-class airfare → `MANUAL_REVIEW` |
| `POL-RCT-01` | Receipt required for items > $25 and all airfare/lodging |
| `POL-RCT-02` | Missing receipt → `MANUAL_REVIEW` (not silent reject) |
| `POL-APR-01` | Total ≤ $500 → auto-approve |
| `POL-APR-02` | Total $500–$2,000 → manager approval |
| `POL-APR-03` | Total > $2,000 → director / `MANUAL_REVIEW` |
| `POL-TIME-01` | Must submit within 30 days of trip end |

---

## 🗂️ Project Structure

```
padmalochansahu.ipynb          ⭐ Main submission (namesurname.ipynb)
travel_reimbursement_agent.py  Standalone Python script
README.md                      This file
GenAI_Developer_Candidate_Assignment_Travel_Reimbursement_.pdf
src/                           Web app source (React/TypeScript)
server/                        Agent engine + notebook generator
index.html                     Web app entry point
firebase.json / .firebaserc    Firebase hosting config
package.json / tsconfig.json   Build config
```
