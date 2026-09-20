import { ProposedAction, RiskFactor, RiskLevel, RiskResult } from './types';

export class RiskEngine {
  public evaluate(
    action: ProposedAction,
    securityThreatCount: number = 0,
    hasExternalDestination: boolean = false
  ): RiskResult {
    const { type, parameters, target } = action;
    const factors: RiskFactor[] = [];
    let score = 0;

    // 1. Financial Exposure Factor
    if (parameters.amount !== undefined) {
      const amt = parameters.amount;
      if (amt > 25000) {
        factors.push({
          factor: 'Critical Financial Exposure',
          score: 75,
          description: `Disbursement of ₹${amt.toLocaleString()} exceeds critical financial boundary (> ₹25,000)`
        });
        score += 75;
      } else if (amt > 5000) {
        factors.push({
          factor: 'Moderate Financial Exposure',
          score: 30,
          description: `Disbursement of ₹${amt.toLocaleString()} exceeds autonomous threshold`
        });
        score += 30;
      } else if (amt > 0) {
        factors.push({
          factor: 'Routine Financial Exposure',
          score: 10,
          description: `Disbursement of ₹${amt.toLocaleString()} within baseline limits`
        });
        score += 10;
      }
    }

    // 2. Privilege Escalation Factor
    if (type === 'grant_access') {
      const isProd =
        target.toLowerCase().includes('prod') ||
        (parameters.resource && parameters.resource.toLowerCase().includes('database')) ||
        (parameters.environment && parameters.environment === 'production');
      const isDashboard =
        target.toLowerCase().includes('dashboard') ||
        target.toLowerCase().includes('analytics') ||
        (parameters.resource && (parameters.resource.toLowerCase().includes('dashboard') || parameters.resource.toLowerCase().includes('analytics')));

      if (isProd) {
        factors.push({
          factor: 'Production Privilege Escalation',
          score: 50,
          description: 'Attempting to assign administrative or production database IAM roles'
        });
        score += 50;
      } else if (isDashboard) {
        factors.push({
          factor: 'Internal Operational Access',
          score: 10,
          description: 'Access grant restricted to internal read-only analytics reporting'
        });
        score += 10;
      } else {
        factors.push({
          factor: 'Staging Privilege Grant',
          score: 25,
          description: 'Modifying non-production system access'
        });
        score += 25;
      }
    }

    // 3. Destructive Action Factor
    if (type === 'delete_customer') {
      factors.push({
        factor: 'Irreversible Destructive Operation',
        score: 60,
        description: 'Permanent deletion of entity data and profile records'
      });
      score += 60;
    }

    // 4. Data Sensitivity Factor
    if (type === 'access_sensitive_data') {
      factors.push({
        factor: 'Critical Data Sensitivity',
        score: 65,
        description: 'Direct query or extraction targeting credential vaults or secret keys'
      });
      score += 65;
    }

    // 5. Cloud Infrastructure Mutation
    if (type === 'change_cloud_configuration') {
      factors.push({
        factor: 'Infrastructure Reconfiguration',
        score: 45,
        description: 'Changing routing, firewall, or cloud server operational state'
      });
      score += 45;
    }

    // 6. External Destination Factor
    if (hasExternalDestination || (parameters.destinationAccount && parameters.destinationAccount.toLowerCase().includes('new'))) {
      factors.push({
        factor: 'Unverified External Destination',
        score: 35,
        description: 'Target destination differs from recorded or verified customer profile'
      });
      score += 35;
    }

    // 7. Security Anomaly / Injection Factor
    if (securityThreatCount > 0) {
      const anomalyScore = Math.min(securityThreatCount * 25, 60);
      factors.push({
        factor: 'Security Anomaly / Threat Signals',
        score: anomalyScore,
        description: `${securityThreatCount} adversarial pattern(s) flagged during semantic inspection`
      });
      score += anomalyScore;
    }

    // Baseline minimum factor if no other flags
    if (factors.length === 0) {
      factors.push({
        factor: 'Baseline Operational Activity',
        score: 5,
        description: 'Standard, non-sensitive business workflow'
      });
      score += 5;
    }

    // Determine Risk Level Category
    let level: RiskLevel = 'LOW';
    if (score >= 70 || (parameters.amount && parameters.amount > 25000)) {
      level = 'CRITICAL';
    } else if (score >= 50) {
      level = 'HIGH';
    } else if (score >= 25) {
      level = 'MEDIUM';
    } else {
      level = 'LOW';
    }

    // Summary statement
    const summary = `Total risk score ${score} (${level}) driven by ${factors.map(f => f.factor).join(', ')}.`;

    return {
      score,
      level,
      factors,
      summary
    };
  }
}
