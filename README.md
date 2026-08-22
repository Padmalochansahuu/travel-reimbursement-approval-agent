# Travel Reimbursement Approval Agent

An agentic system that evaluates employee travel expense claims against corporate policy (Appendix A) using deterministic tool-calling and structured JSON output.

---

## 🌐 Live Demo

**[https://travel-claim-agent.web.app](https://travel-claim-agent.web.app)**

---

## 📥 Quick Downloads

| File | Description |
|---|---|
| [travel_reimbursement_agent.ipynb](./travel_reimbursement_agent.ipynb) | Jupyter Notebook — run top-to-bottom, outputs Section 3 JSON |
| [travel_reimbursement_agent.py](./travel_reimbursement_agent.py) | Standalone Python script — same logic, no dependencies |

> Or download directly from the live app → **Jupyter Notebook tab** → `Download .ipynb` / `Download .py`

---

## 🚀 Run the Notebook

> ✅ **No setup needed. No pip install. No API keys. Just Python 3.8+**

**Option A — Python script (fastest, zero setup):**
```bash
python travel_reimbursement_agent.py
```
Download [`travel_reimbursement_agent.py`](./travel_reimbursement_agent.py) → run it → get the JSON output instantly.

**Option B — Jupyter Notebook:**
```bash
jupyter lab travel_reimbursement_agent.ipynb
```
Download [`travel_reimbursement_agent.ipynb`](./travel_reimbursement_agent.ipynb) → open in Jupyter Lab / VS Code → click **Restart Kernel & Run All Cells** → final cell prints the Section 3 JSON.

Uses only Python standard library: `json`, `datetime`, `typing` — nothing to install.

---

## 🖥️ Run the Web App Locally

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # production build
npm start          # serve production
```

---

## Policy Rules (Appendix A)

| Rule | Description |
|---|---|
| `POL-CAT-01` | Eligible: airfare (economy), lodging, meals, ground transport, conference fees |
| `POL-CAT-02` | Ineligible: spa, minibar, entertainment, personal items — deducted in full |
| `POL-PD-01` | Meals cap: $75/day |
| `POL-PD-02` | Lodging cap: $200/night |
| `POL-PD-03` | Ground transport cap: $50/day |
| `POL-AIR-01` | Business/first-class airfare → `MANUAL_REVIEW` |
| `POL-RCT-01/02` | Missing receipts for expenses > $25 or airfare/lodging → `MANUAL_REVIEW` |
| `POL-APR-01/02/03` | ≤$500 auto-approve · $500–$2000 manager · >$2000 director review |
| `POL-TIME-01` | Must submit within 30 days of trip end |

---

## Benchmark Results (Appendix B)

| Claim | Employee | Claimed | Decision | Approved | Deducted |
|---|---|---|---|---|---|
| CLM-001 | A. Rivera | $1,110 | **APPROVE** | $1,110 | $0 |
| CLM-002 | B. Osei | $380 | **REJECT** | $0 | $380 |
| CLM-003 | C. Nakamura | $940 | **PARTIAL_APPROVE** | $840 | $100 |
| CLM-004 | D. Fischer | $3,000 | **MANUAL_REVIEW** | $0 | $0 |
| CLM-005 | E. Haddad | $220 | **MANUAL_REVIEW** | $0 | $0 |

---

## Project Structure

```
├── src/
│   ├── components/        # UI views (Dashboard, Inspector, Batch, Policy, Notebook)
│   ├── data/              # Policy rules & sample claims
│   └── utils/             # Client-side evaluator
├── server/
│   ├── agentEngine.ts     # Tool implementations & deterministic engine
│   └── notebookGenerator.ts  # .ipynb / .py exporter
├── travel_reimbursement_agent.ipynb
├── travel_reimbursement_agent.py
└── index.html
```
