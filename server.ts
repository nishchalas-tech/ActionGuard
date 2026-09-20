import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { controlPlane } from './src/engine/decisionEngine';
import { ActionParser } from './src/engine/parser';
import { runActionGuardTests } from './src/engine/tests';
import { extractActionProposalWithGroq, getAIProviderStatus } from './src/engine/groqClient';
import { EvaluationResult } from './src/engine/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Health
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'active',
      name: 'ActionGuard Control Plane',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // API Route: AI Provider Status
  app.get('/api/provider-status', (req, res) => {
    res.json(getAIProviderStatus());
  });

  // API Route: Evaluate Action via Groq Runtime AI + Independent ActionGuard Evaluation
  app.post('/api/evaluate', async (req, res) => {
    try {
      const rawInput = req.body.requestText || req.body.prompt || req.body.text;
      const { agentId = 'SupportAgent-01', agentRole = 'AI_AGENT' } = req.body;
      if (!rawInput || typeof rawInput !== 'string' || !rawInput.trim()) {
        res.status(400).json({ error: 'Field `requestText` or `prompt` is required' });
        return;
      }

      const cleanText = rawInput.trim();

      // Step 1: Real Runtime AI Understanding via Groq (with graceful fallback)
      // The Groq LLM is ONLY responsible for extracting structured action proposals.
      // The LLM is NEVER trusted to authorize actions or determine safety.
      const { proposal, providerInfo } = await extractActionProposalWithGroq(cleanText);

      // Step 2: Convert AI Proposal to ActionGuard ProposedAction contracts
      const proposedActions = ActionParser.fromStructuredProposal(proposal, cleanText, agentId, agentRole);

      // Step 3: ActionGuard Independent Evaluation
      // Every single action is independently evaluated by the deterministic Policy, Permission, Risk, and Security engines
      const sharedTraceId = `AG-2026-${String(Math.floor(100000 + Math.random() * 900000)).padStart(6, '0')}`;
      const results: EvaluationResult[] = [];
      const evaluatedActionMap: Record<string, EvaluationResult> = {};

      for (const action of proposedActions) {
        const evaluation = controlPlane.evaluate_action(action);
        evaluation.traceId = sharedTraceId;
        evaluation.trace_id = sharedTraceId;
        evaluation.aiProvider = providerInfo;
        evaluation.aiProposal = proposal;
        evaluation.isDemo = false;

        // Multi-Action Dependency Resolution
        if (action.dependencyOn && evaluatedActionMap[action.dependencyOn]) {
          const parentEval = evaluatedActionMap[action.dependencyOn];
          evaluation.dependencyOnActionId = parentEval.actionId;

          if (parentEval.decision === 'BLOCK') {
            evaluation.dependencyStatus = 'CANCELLED';
            if (evaluation.toolExecution) {
              evaluation.toolExecution.status = 'SKIPPED';
              evaluation.toolExecution.message = `Held: Preceding dependent action [${parentEval.actionId}] was BLOCKED by ActionGuard.`;
            }
          } else if (parentEval.decision === 'REQUIRE_APPROVAL' && parentEval.approvalStatus !== 'APPROVED') {
            evaluation.dependencyStatus = 'WAITING_FOR_DEPENDENCY';
            if (evaluation.toolExecution) {
              evaluation.toolExecution.status = 'SKIPPED';
              evaluation.toolExecution.message = `Held: Preceding dependent action [${parentEval.actionId}] is pending human supervisor approval.`;
            }
          } else {
            evaluation.dependencyStatus = 'READY';
          }
        } else {
          evaluation.dependencyStatus = 'READY';
        }

        evaluatedActionMap[action.id] = evaluation;
        results.push(evaluation);
      }

      res.json({
        success: true,
        aiProvider: providerInfo,
        aiProposal: proposal,
        actionsCount: results.length,
        results
      });
    } catch (err: any) {
      console.error('[ActionGuard] Evaluation endpoint error:', err);
      res.status(500).json({ error: err.message || 'Evaluation pipeline encountered an unexpected error' });
    }
  });

  // API Route: Run automated verification tests
  app.get('/api/test-scenarios', (req, res) => {
    try {
      const testReport = runActionGuardTests();
      res.json(testReport);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Policies
  app.get('/api/policies', (req, res) => {
    res.json(controlPlane.getPolicyEngine().getPolicies());
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ActionGuard Control Plane running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
