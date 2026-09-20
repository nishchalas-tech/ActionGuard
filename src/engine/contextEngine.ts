import { ContextResult, ProposedAction, RiskLevel } from './types';

export class ContextEngine {
  public evaluate(action: ProposedAction): ContextResult {
    const { type, parameters, target } = action;
    const flags: string[] = [];

    // 1. Environment detection
    let environment = parameters.environment || 'production';
    if (target.toLowerCase().includes('staging') || target.toLowerCase().includes('dev')) {
      environment = 'staging';
      flags.push('Staging environment detected');
    } else if (target.toLowerCase().includes('production') || target.toLowerCase().includes('prod')) {
      environment = 'production';
      flags.push('Direct production target specified');
    }

    // 2. External Destination detection
    const isExternalDestination = Boolean(
      parameters.destinationAccount &&
      (parameters.destinationAccount.toLowerCase().includes('new') ||
       parameters.destinationAccount.toLowerCase().includes('external') ||
       parameters.destinationAccount.toLowerCase().includes('0x') ||
       parameters.destinationAccount.includes('@external'))
    );

    if (isExternalDestination) {
      flags.push('Egress target points to newly supplied unverified destination');
    }

    // 3. Target sensitivity
    let targetSensitivity: RiskLevel = 'LOW';
    if (
      target.toLowerCase().includes('database') ||
      target.toLowerCase().includes('password') ||
      target.toLowerCase().includes('credential') ||
      type === 'access_sensitive_data' ||
      type === 'delete_customer'
    ) {
      targetSensitivity = 'CRITICAL';
      flags.push('Target classified as mission-critical asset');
    } else if (
      type === 'change_cloud_configuration' ||
      type === 'make_payment' ||
      (parameters.amount && parameters.amount > 5000)
    ) {
      targetSensitivity = 'HIGH';
      flags.push('Target classified as high operational sensitivity');
    } else if (parameters.amount && parameters.amount > 0) {
      targetSensitivity = 'MEDIUM';
      flags.push('Financial disbursement target');
    }

    return {
      environment,
      isExternalDestination,
      targetSensitivity,
      flags
    };
  }
}
