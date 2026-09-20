import { ProposedAction, StructuredActionProposal, ActionType } from './types';

export class ActionParser {
  /**
   * Converts a structured AI proposal (e.g. from Groq LLM) into ActionGuard ProposedAction objects.
   * ActionGuard will independently evaluate each action through its deterministic security engines.
   */
  public static fromStructuredProposal(
    proposal: StructuredActionProposal,
    rawText: string,
    agentId: string = 'SupportAgent-01',
    agentRole: any = 'AI_AGENT'
  ): ProposedAction[] {
    if (!proposal.actions || !Array.isArray(proposal.actions) || proposal.actions.length === 0) {
      return this.parse(rawText, agentId, agentRole);
    }

    const validTypes: ActionType[] = [
      'issue_refund',
      'make_payment',
      'grant_access',
      'send_email',
      'delete_customer',
      'modify_customer_record',
      'access_sensitive_data',
      'change_cloud_configuration'
    ];

    const generatedActions: ProposedAction[] = [];
    const idMap: string[] = [];

    for (let i = 0; i < proposal.actions.length; i++) {
      const item = proposal.actions[i];
      const actionId = `ACT-${Math.floor(1000 + Math.random() * 9000)}`;
      idMap.push(actionId);

      // Normalize action type
      let matchedType: ActionType = 'unknown_action';
      const cleanType = (item.action_type || '').toLowerCase().replace(/[-\s]/g, '_');
      for (const vt of validTypes) {
        if (cleanType.includes(vt) || vt.includes(cleanType)) {
          matchedType = vt;
          break;
        }
      }
      if (matchedType === 'unknown_action') {
        if (cleanType.includes('refund')) matchedType = 'issue_refund';
        else if (cleanType.includes('pay') || cleanType.includes('transfer')) matchedType = 'make_payment';
        else if (cleanType.includes('access') || cleanType.includes('grant') || cleanType.includes('permission')) matchedType = 'grant_access';
        else if (cleanType.includes('email') || cleanType.includes('notify') || cleanType.includes('message')) matchedType = 'send_email';
        else if (cleanType.includes('delete') || cleanType.includes('remove')) matchedType = 'delete_customer';
        else if (cleanType.includes('export') || cleanType.includes('password') || cleanType.includes('credential') || cleanType.includes('secret')) matchedType = 'access_sensitive_data';
        else if (cleanType.includes('cloud') || cleanType.includes('server') || cleanType.includes('firewall') || cleanType.includes('infra')) matchedType = 'change_cloud_configuration';
        else if (cleanType.includes('customer') || cleanType.includes('user') || cleanType.includes('profile')) matchedType = 'modify_customer_record';
      }

      // Resolve dependency
      let dependencyOn: string | undefined;
      if (
        typeof item.dependency_on_action_index === 'number' &&
        item.dependency_on_action_index >= 0 &&
        item.dependency_on_action_index < idMap.length &&
        idMap[item.dependency_on_action_index] !== actionId
      ) {
        dependencyOn = idMap[item.dependency_on_action_index];
      }

      // Build target
      const target = item.target_id || item.target_type || item.subject || item.parameters?.target || item.parameters?.recipient || item.parameters?.orderId || item.parameters?.resource || 'system';

      generatedActions.push({
        id: actionId,
        type: matchedType,
        rawRequest: rawText,
        parameters: {
          ...item.parameters,
          ...(item.subject ? { subjectName: item.subject } : {}),
          ...(item.destination ? { destination: item.destination } : {}),
          ...(item.duration ? { duration: item.duration } : {})
        },
        target: String(target),
        agentId: item.requested_by || agentId,
        agentRole,
        dependencyOn,
        timestamp: new Date().toISOString()
      });
    }

    return generatedActions;
  }

  /**
   * Parses natural language into one or more proposed actions.
   * Fully deterministic local fallback ensuring continuous operation without external dependencies.
   */
  public static parse(
    rawText: string,
    agentId: string = 'SupportAgent-01',
    agentRole: any = 'AI_AGENT'
  ): ProposedAction[] {
    const text = rawText.trim();
    const actions: ProposedAction[] = [];

    // Check for multi-action compound sentence, e.g. "Refund ... and send him an email"
    const hasRefund = /refund/i.test(text);
    const hasEmail = /send (?:the customer |[a-z0-9]+ )?(?:an? )?email|email (?:him|her|them|[a-z0-9]+)|notify/i.test(text);
    const hasAccess = /give .* access|grant .* access|grant_access/i.test(text);
    const hasSensitiveData = /passwords|credentials|keys|tokens|secrets|export .* (customer|data|information)|exfiltrate/i.test(text);
    const hasDelete = /delete (customer|user|account)|remove customer/i.test(text);
    const hasPayment = /make payment|send payment|pay |transfer/i.test(text);
    const hasCloud = /cloud configuration|cloud config|firewall|route|server capacity/i.test(text);
    const hasCustomerUpdate = /update customer|change address|modify customer/i.test(text);

    // Multi-action scenario: Refund + Email
    if (hasRefund && hasEmail) {
      const refundAction = this.extractRefundAction(text, agentId, agentRole);
      actions.push(refundAction);

      const emailAction = this.extractEmailAction(text, agentId, agentRole, refundAction.id);
      actions.push(emailAction);
      return actions;
    }

    // Single action flows:
    if (hasSensitiveData) {
      actions.push(this.extractSensitiveDataAccessAction(text, agentId, agentRole));
    } else if (hasAccess) {
      actions.push(this.extractGrantAccessAction(text, agentId, agentRole));
    } else if (hasDelete) {
      actions.push(this.extractDeleteCustomerAction(text, agentId, agentRole));
    } else if (hasRefund) {
      actions.push(this.extractRefundAction(text, agentId, agentRole));
    } else if (hasPayment) {
      actions.push(this.extractPaymentAction(text, agentId, agentRole));
    } else if (hasCloud) {
      actions.push(this.extractCloudConfigAction(text, agentId, agentRole));
    } else if (hasCustomerUpdate) {
      actions.push(this.extractCustomerUpdateAction(text, agentId, agentRole));
    } else if (hasEmail) {
      actions.push(this.extractEmailAction(text, agentId, agentRole));
    } else {
      // Unrecognized action fallback
      actions.push({
        id: `ACT-${Math.floor(1000 + Math.random() * 9000)}`,
        type: 'unknown_action',
        rawRequest: text,
        parameters: {},
        target: 'unrecognized_entity',
        agentId,
        agentRole,
        timestamp: new Date().toISOString()
      });
    }

    return actions;
  }

  private static extractAmount(text: string): number {
    // Match ₹2,000 or Rs. 12,000 or $50,000 or 12000
    const match = text.match(/(?:[₹$€]|rs\.?\s*|inr\s*)?([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)/i);
    if (match && match[1]) {
      const cleaned = match[1].replace(/,/g, '');
      const parsed = parseInt(cleaned, 10);
      if (!isNaN(parsed)) return parsed;
    }
    return 2000;
  }

  private static extractOrderId(text: string): string {
    const match = text.match(/ORD-[0-9]{3,6}/i) || text.match(/order\s+([A-Za-z0-9-]+)/i) || text.match(/\b([A-Z][0-9]{2,5})\b/);
    if (match) {
      return (match[1] || match[0]).toUpperCase();
    }
    return 'ORD-1001';
  }

  private static extractRefundAction(text: string, agentId: string, agentRole: any): ProposedAction {
    const amount = this.extractAmount(text);
    const orderId = this.extractOrderId(text);
    const hasDestinationChange = /new destination account|external destination|different account|attacker account/i.test(text);

    // Extract customer recipient name if mentioned (e.g. "Refund ₹7,500 to Arjun")
    const customerMatch = text.match(/to\s+([A-Za-z]+)\s+for/i) || text.match(/to\s+([A-Za-z]+)/i);
    const customerName = customerMatch ? customerMatch[1] : undefined;

    return {
      id: `ACT-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'issue_refund',
      rawRequest: text,
      parameters: {
        amount,
        currency: 'INR',
        orderId,
        customerName,
        destinationAccount: hasDestinationChange ? 'EXT-ACCOUNT-9982-UNVERIFIED' : 'ORIGINAL-PAYMENT-METHOD',
        reason: text.includes('damaged') ? 'Damaged item received by customer' : 'Customer request'
      },
      target: orderId,
      agentId,
      agentRole,
      timestamp: new Date().toISOString()
    };
  }

  private static extractEmailAction(
    text: string,
    agentId: string,
    agentRole: any,
    dependencyOn?: string
  ): ProposedAction {
    const nameMatch = text.match(/to ([A-Za-z]+)/i) || text.match(/email ([A-Za-z]+)/i);
    const recipientName = nameMatch ? nameMatch[1] : 'Rahul';
    const email = `${recipientName.toLowerCase()}@example.com`;

    return {
      id: `ACT-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'send_email',
      rawRequest: text,
      parameters: {
        recipient: email,
        customerName: recipientName,
        subject: 'Your Request Update',
        body: 'Your request has been processed in accordance with policy guidelines.'
      },
      target: email,
      agentId,
      agentRole,
      dependencyOn,
      timestamp: new Date().toISOString()
    };
  }

  private static extractGrantAccessAction(text: string, agentId: string, agentRole: any): ProposedAction {
    const isProd = /production|prod/i.test(text);
    const isDb = /database|db/i.test(text);
    const isDashboard = /dashboard|analytics/i.test(text);
    const nameMatch = text.match(/give ([A-Za-z]+)/i) || text.match(/grant ([A-Za-z]+)/i);
    const userName = nameMatch ? nameMatch[1] : 'User';

    const durationMatch = text.match(/for\s+([0-9]+\s+(?:days?|hours?|weeks?|months?))/i);
    const duration = durationMatch ? durationMatch[1] : undefined;

    let resource = 'cloud resource';
    if (isDashboard) resource = 'internal analytics dashboard';
    else if (isDb) resource = 'production database';

    return {
      id: `ACT-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'grant_access',
      rawRequest: text,
      parameters: {
        targetUser: userName,
        resource,
        duration,
        environment: isProd ? 'production' : (isDashboard ? 'development' : 'staging'),
        roleGranted: isDashboard ? 'viewer' : (isProd ? 'read-write-admin' : 'staging-contributor')
      },
      target: isDashboard ? 'internal analytics dashboard' : (isProd ? 'production database' : 'staging environment'),
      agentId,
      agentRole,
      timestamp: new Date().toISOString()
    };
  }

  private static extractSensitiveDataAccessAction(text: string, agentId: string, agentRole: any): ProposedAction {
    const isExternalEmail = /external email|my external email|attacker/i.test(text);
    return {
      id: `ACT-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'access_sensitive_data',
      rawRequest: text,
      parameters: {
        dataType: text.includes('password') ? 'customer passwords and credentials' : 'customer profiles and accounts',
        exportDestination: isExternalEmail ? 'external-drop@attacker.com' : 'unauthorized-dump',
        scope: 'bulk-all-records'
      },
      target: 'customer_credentials_vault',
      agentId,
      agentRole,
      timestamp: new Date().toISOString()
    };
  }

  private static extractDeleteCustomerAction(text: string, agentId: string, agentRole: any): ProposedAction {
    const custMatch = text.match(/(?:customer|user|account)\s+([A-Za-z0-9-]+)/i);
    const customerId = custMatch ? custMatch[1] : 'CUST-1049';

    return {
      id: `ACT-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'delete_customer',
      rawRequest: text,
      parameters: {
        customerId,
        reason: 'Autonomous cleanup execution'
      },
      target: customerId,
      agentId,
      agentRole,
      timestamp: new Date().toISOString()
    };
  }

  private static extractPaymentAction(text: string, agentId: string, agentRole: any): ProposedAction {
    const amount = this.extractAmount(text);
    const payeeMatch = text.match(/to\s+([A-Za-z0-9\s-]+?)(?:\s+for|\s+because|$)/i);
    const payee = payeeMatch ? payeeMatch[1].trim() : 'Vendor-Corp Global';

    return {
      id: `ACT-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'make_payment',
      rawRequest: text,
      parameters: {
        amount,
        currency: 'INR',
        payee,
        destinationAccount: 'ACC-VEND-7731'
      },
      target: payee,
      agentId,
      agentRole,
      timestamp: new Date().toISOString()
    };
  }

  private static extractCloudConfigAction(text: string, agentId: string, agentRole: any): ProposedAction {
    const isProd = /production|prod/i.test(text);
    return {
      id: `ACT-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'change_cloud_configuration',
      rawRequest: text,
      parameters: {
        environment: isProd ? 'production' : 'staging',
        rule: 'server-capacity-scale'
      },
      target: isProd ? 'production-server-cluster' : 'staging-firewall-rules',
      agentId,
      agentRole,
      timestamp: new Date().toISOString()
    };
  }

  private static extractCustomerUpdateAction(text: string, agentId: string, agentRole: any): ProposedAction {
    const isSensitive = /kyc|tax|bank|ssn/i.test(text);
    const custMatch = text.match(/(?:customer|user)\s+([A-Za-z0-9-]+)/i);
    const customerId = custMatch ? custMatch[1] : 'CUST-8821';

    return {
      id: `ACT-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'modify_customer_record',
      rawRequest: text,
      parameters: {
        customerId,
        fieldsModified: isSensitive ? ['tax_id', 'kyc_status'] : ['address', 'phone_number'],
        reason: 'Customer updated communication preferences'
      },
      target: customerId,
      agentId,
      agentRole,
      timestamp: new Date().toISOString()
    };
  }
}
