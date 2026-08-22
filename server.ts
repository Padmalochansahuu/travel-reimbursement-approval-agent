import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { TRAVEL_POLICY_RULES } from './src/data/policyData';
import { APPENDIX_B_CLAIMS, GROUND_TRUTH_BENCHMARKS } from './src/data/sampleClaims';
import { evaluateClaimWithAgent, evaluateClaimDeterministically } from './server/agentEngine';
import { PYTHON_NOTEBOOK_CODE, generateJupyterNotebookJson } from './server/notebookGenerator';
import { ReimbursementClaim, BatchEvaluationSummary } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // -------------------------------------------------------------
  // API ROUTES
  // -------------------------------------------------------------

  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      agent: 'Travel Reimbursement Approval Agent',
      gemini_configured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
      time: new Date().toISOString()
    });
  });

  // Get policy rules from Appendix A
  app.get('/api/policy', (req: Request, res: Response) => {
    res.json({
      policy_name: 'Travel Reimbursement Policy',
      version: '1.0',
      rules: TRAVEL_POLICY_RULES
    });
  });

  // Get sample claims from Appendix B
  app.get('/api/claims/samples', (req: Request, res: Response) => {
    res.json({
      claims: APPENDIX_B_CLAIMS,
      benchmarks: GROUND_TRUTH_BENCHMARKS
    });
  });

  // Single claim evaluation
  app.post('/api/evaluate-claim', async (req: Request, res: Response) => {
    try {
      const claim = req.body as ReimbursementClaim;
      if (!claim || !claim.claim_id || !Array.isArray(claim.items)) {
        return res.status(400).json({ error: 'Invalid claim structure. Requires claim_id and items array.' });
      }

      const result = await evaluateClaimWithAgent(claim);
      res.json(result);
    } catch (error: any) {
      console.error('Error evaluating claim:', error);
      res.status(500).json({ error: error.message || 'Internal agent evaluation error' });
    }
  });

  // Batch evaluation for all provided claims
  app.post('/api/evaluate-batch', async (req: Request, res: Response) => {
    try {
      const claimsToEvaluate: ReimbursementClaim[] = (req.body?.claims && Array.isArray(req.body.claims) && req.body.claims.length > 0)
        ? req.body.claims
        : APPENDIX_B_CLAIMS;

      const results = [];
      let totalClaimed = 0;
      let totalApproved = 0;
      let totalDeducted = 0;
      let approvedCount = 0;
      let partialApprovedCount = 0;
      let rejectedCount = 0;
      let manualReviewCount = 0;

      for (const claim of claimsToEvaluate) {
        totalClaimed += claim.total_claimed || claim.items.reduce((sum, i) => sum + i.amount, 0);
        const result = await evaluateClaimWithAgent(claim);
        results.push(result);

        totalApproved += result.approved_amount;
        totalDeducted += result.deducted_amount;

        if (result.decision === 'APPROVE') approvedCount++;
        else if (result.decision === 'PARTIAL_APPROVE') partialApprovedCount++;
        else if (result.decision === 'REJECT') rejectedCount++;
        else if (result.decision === 'MANUAL_REVIEW') manualReviewCount++;
      }

      const summary: BatchEvaluationSummary = {
        total_claims: claimsToEvaluate.length,
        approved_count: approvedCount,
        partial_approved_count: partialApprovedCount,
        rejected_count: rejectedCount,
        manual_review_count: manualReviewCount,
        total_claimed_amount: round2(totalClaimed),
        total_approved_amount: round2(totalApproved),
        total_deducted_amount: round2(totalDeducted),
        auto_approved_rate: round2(((approvedCount + partialApprovedCount) / (claimsToEvaluate.length || 1)) * 100),
        results
      };

      res.json(summary);
    } catch (error: any) {
      console.error('Error during batch evaluation:', error);
      res.status(500).json({ error: error.message || 'Batch evaluation error' });
    }
  });

  // Downloadable & viewable notebook files
  app.get('/api/notebook-content', (req: Request, res: Response) => {
    const notebookJson = generateJupyterNotebookJson();
    res.json({
      python_code: PYTHON_NOTEBOOK_CODE,
      notebook_json: notebookJson,
      filename_ipynb: 'travel_reimbursement_agent.ipynb',
      filename_py: 'travel_reimbursement_agent.py'
    });
  });

  // -------------------------------------------------------------
  // VITE MIDDLEWARE / STATIC ASSETS
  // -------------------------------------------------------------

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Travel Reimbursement Agent server running at http://0.0.0.0:${PORT}`);
  });
}

function round2(val: number): number {
  return Math.round(val * 100) / 100;
}

startServer();
