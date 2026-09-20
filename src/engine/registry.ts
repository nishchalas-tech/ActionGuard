import { ActionDefinition, ActionType } from './types';

export const ACTION_REGISTRY: Record<ActionType, ActionDefinition> = {
  issue_refund: {
    type: 'issue_refund',
    name: 'Issue Refund',
    description: 'Processes a financial refund to a customer order or account.',
    riskCategory: 'MEDIUM',
    requiredPermissions: ['finance:refund:issue'],
    parameterSchema: {
      amount: 'number (required)',
      currency: 'string (e.g. INR, USD)',
      orderId: 'string (e.g. ORD-1001)',
      reason: 'string',
      destinationAccount: 'string (optional)'
    },
    applicablePolicies: ['POL-REFUND-001', 'POL-DEST-001'],
    canRequireHumanApproval: true,
    canAutoAllow: true,
    blockedByDefault: false
  },
  make_payment: {
    type: 'make_payment',
    name: 'Make Payment',
    description: 'Initiates a disbursement or fund transfer to a designated payee.',
    riskCategory: 'HIGH',
    requiredPermissions: ['finance:payment:disburse'],
    parameterSchema: {
      amount: 'number (required)',
      currency: 'string (required)',
      destinationAccount: 'string (required)',
      payee: 'string (required)',
      memo: 'string'
    },
    applicablePolicies: ['POL-PAYMENT-001', 'POL-DEST-001'],
    canRequireHumanApproval: true,
    canAutoAllow: false,
    blockedByDefault: false
  },
  grant_access: {
    type: 'grant_access',
    name: 'Grant Access',
    description: 'Grants system, database, or identity access to a user or role.',
    riskCategory: 'CRITICAL',
    requiredPermissions: ['security:iam:grant'],
    parameterSchema: {
      target: 'string (user or entity)',
      resource: 'string (resource name)',
      environment: 'string (production, staging, etc.)',
      roleGranted: 'string'
    },
    applicablePolicies: ['POL-IAM-001', 'POL-PROD-001'],
    canRequireHumanApproval: true,
    canAutoAllow: false,
    blockedByDefault: false
  },
  send_email: {
    type: 'send_email',
    name: 'Send Email',
    description: 'Dispatches business or informational emails to recipients.',
    riskCategory: 'LOW',
    requiredPermissions: ['comm:email:send'],
    parameterSchema: {
      recipient: 'string (email address or user)',
      subject: 'string',
      body: 'string'
    },
    applicablePolicies: ['POL-COMM-001'],
    canRequireHumanApproval: true,
    canAutoAllow: true,
    blockedByDefault: false
  },
  delete_customer: {
    type: 'delete_customer',
    name: 'Delete Customer',
    description: 'Permanently deletes customer profile, data, and history.',
    riskCategory: 'CRITICAL',
    requiredPermissions: ['customer:data:delete'],
    parameterSchema: {
      customerId: 'string',
      reason: 'string',
      eraseAuditHistory: 'boolean'
    },
    applicablePolicies: ['POL-DESTRUCTIVE-001', 'POL-COMPLIANCE-001'],
    canRequireHumanApproval: true,
    canAutoAllow: false,
    blockedByDefault: true
  },
  modify_customer_record: {
    type: 'modify_customer_record',
    name: 'Modify Customer Record',
    description: 'Updates attributes, addresses, phone numbers, or notes for a customer.',
    riskCategory: 'LOW',
    requiredPermissions: ['customer:record:update'],
    parameterSchema: {
      customerId: 'string',
      fieldsModified: 'string[]',
      newValues: 'object'
    },
    applicablePolicies: ['POL-CUSTREC-001'],
    canRequireHumanApproval: true,
    canAutoAllow: true,
    blockedByDefault: false
  },
  access_sensitive_data: {
    type: 'access_sensitive_data',
    name: 'Access Sensitive Data',
    description: 'Queries, extracts, or exports credential stores, PII, or tokens.',
    riskCategory: 'CRITICAL',
    requiredPermissions: ['security:vault:read'],
    parameterSchema: {
      dataType: 'string (passwords, tokens, ssn, pii)',
      exportDestination: 'string (optional)'
    },
    applicablePolicies: ['POL-SECDATA-001'],
    canRequireHumanApproval: false,
    canAutoAllow: false,
    blockedByDefault: true
  },
  change_cloud_configuration: {
    type: 'change_cloud_configuration',
    name: 'Change Cloud Configuration',
    description: 'Modifies infrastructure, firewall rules, routing, or cloud instances.',
    riskCategory: 'CRITICAL',
    requiredPermissions: ['cloud:infra:configure'],
    parameterSchema: {
      resource: 'string',
      environment: 'string (production, staging)',
      configDelta: 'object'
    },
    applicablePolicies: ['POL-CLOUD-001'],
    canRequireHumanApproval: true,
    canAutoAllow: false,
    blockedByDefault: false
  },
  unknown_action: {
    type: 'unknown_action',
    name: 'Unknown / Unregistered Action',
    description: 'Unrecognized action outside registered ActionGuard taxonomy.',
    riskCategory: 'CRITICAL',
    requiredPermissions: ['system:unknown'],
    parameterSchema: {},
    applicablePolicies: ['POL-DEFAULT-FAILSAFE'],
    canRequireHumanApproval: false,
    canAutoAllow: false,
    blockedByDefault: true
  }
};
