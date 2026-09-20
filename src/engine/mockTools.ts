import { MockToolExecution, ProposedAction } from './types';

export class MockToolRunner {
  public static execute(action: ProposedAction): MockToolExecution {
    const randomId = Math.floor(10000 + Math.random() * 90000);
    const now = new Date().toISOString();

    switch (action.type) {
      case 'issue_refund':
        return {
          toolName: 'MockRefundTool',
          executionId: `REF-DEMO-${randomId}`,
          status: 'SUCCESS',
          timestamp: now,
          simulatedResult: {
            orderId: action.parameters.orderId || 'ORD-1001',
            amountRefunded: action.parameters.amount || 2000,
            currency: action.parameters.currency || 'INR',
            ledgerReference: `LDG-SIM-${randomId}`,
            environment: 'SIMULATION',
            settlementWindow: 'Instantaneous (Mock)'
          },
          message: `Mock tool executed successfully. ₹${(action.parameters.amount || 2000).toLocaleString()} credited to simulated customer account. No real funds moved.`
        };

      case 'send_email':
        return {
          toolName: 'MockEmailTool',
          executionId: `MAIL-DEMO-${randomId}`,
          status: 'SUCCESS',
          timestamp: now,
          simulatedResult: {
            recipient: action.parameters.recipient || action.parameters.customerEmail || 'customer@example.com',
            subject: action.parameters.subject || 'Action Notification',
            deliveryStatus: 'SIMULATED_DISPATCHED',
            smtpResponse: '250 2.0.0 OK (Sandbox Simulator)'
          },
          message: `Mock email tool executed successfully. Simulated message sent to ${action.parameters.recipient || 'recipient'}.`
        };

      case 'make_payment':
        return {
          toolName: 'MockPaymentTool',
          executionId: `PAY-DEMO-${randomId}`,
          status: 'SUCCESS',
          timestamp: now,
          simulatedResult: {
            disbursementAmount: action.parameters.amount || 5000,
            payee: action.parameters.payee || 'Vendor-Corp',
            routingCode: 'TEST-ROUTING-998',
            environment: 'SIMULATION'
          },
          message: `Mock payment tool executed successfully. ₹${(action.parameters.amount || 5000).toLocaleString()} simulated transfer completed.`
        };

      case 'modify_customer_record':
        return {
          toolName: 'MockCustomerUpdateTool',
          executionId: `CUST-DEMO-${randomId}`,
          status: 'SUCCESS',
          timestamp: now,
          simulatedResult: {
            customerId: action.parameters.customerId || 'CUST-8821',
            fieldsUpdated: action.parameters.fieldsModified || ['notes'],
            revisionNumber: 4,
            environment: 'SIMULATION'
          },
          message: 'Mock customer record tool executed successfully. Profile attributes updated in sandbox store.'
        };

      case 'grant_access':
        return {
          toolName: 'MockAccessTool',
          executionId: `IAM-DEMO-${randomId}`,
          status: 'SUCCESS',
          timestamp: now,
          simulatedResult: {
            target: action.target,
            roleAssigned: action.parameters.roleGranted || 'Read-Only',
            tenant: 'sandbox-staging-us-east',
            environment: 'SIMULATION'
          },
          message: `Mock access tool executed successfully. Staging access assigned to ${action.target}.`
        };

      case 'change_cloud_configuration':
        return {
          toolName: 'MockCloudConfigTool',
          executionId: `CLOUD-DEMO-${randomId}`,
          status: 'SUCCESS',
          timestamp: now,
          simulatedResult: {
            resource: action.target,
            status: 'APPLIED_SANDBOX',
            driftDetected: false
          },
          message: `Mock cloud configuration tool executed successfully. Staging configuration updated.`
        };

      case 'delete_customer':
        return {
          toolName: 'MockCustomerDeleteTool',
          executionId: `DEL-DEMO-${randomId}`,
          status: 'SUCCESS',
          timestamp: now,
          simulatedResult: {
            customerId: action.target || 'CUST-1049',
            tombstoned: true,
            environment: 'SIMULATION_SANDBOX',
            retentionQuarantineDays: 30
          },
          message: `Mock customer delete tool executed in sandbox quarantine. Target ${action.target} marked deleted in simulation store.`
        };

      case 'access_sensitive_data':
        return {
          toolName: 'MockDataExportTool',
          executionId: `EXP-DEMO-${randomId}`,
          status: 'SUCCESS',
          timestamp: now,
          simulatedResult: {
            exportScope: 'SANDBOX_CONTAINED',
            recordsSanitized: 0,
            destination: 'SIMULATED_SINK',
            environment: 'SIMULATION_SANDBOX'
          },
          message: 'Mock export tool executed in sandbox containment. No real secrets exfiltrated.'
        };

      default:
        return {
          toolName: 'GenericMockTool',
          executionId: `GEN-DEMO-${randomId}`,
          status: 'SIMULATED',
          timestamp: now,
          simulatedResult: {
            action: action.type,
            environment: 'SIMULATION'
          },
          message: `Mock tool completed simulation for ${action.type}.`
        };
    }
  }
}
