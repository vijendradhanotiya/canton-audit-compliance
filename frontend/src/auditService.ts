/**
 * @module auditService
 * @description This module provides a service class for interacting with the audit log
 * contracts on a Canton ledger via the JSON API. It encapsulates all ledger
 * communication for querying audit entries, regulator views, and retention policies,
 * as well as generating compliance reports.
 */

/**
 * Represents the structure of an AuditEntry contract as returned by the JSON API.
 */
export interface AuditEntry {
  contractId: string;
  templateId: string;
  payload: {
    operator: string;
    regulator: string;
    observers: string[];
    eventId: string;
    eventType: string;
    timestamp: string; // ISO 8601 format (e.g., "2023-10-27T10:00:00Z")
    payload: string;   // The raw event data, often a JSON string
    retentionPolicyId: string; // ContractId of the associated retention policy
  };
}

/**
 * Represents the privacy-preserving RegulatorEntry contract as returned by the JSON API.
 * This view omits the confidential `payload`.
 */
export interface RegulatorEntry {
  contractId: string;
  templateId: string;
  payload: {
    operator: string;
    regulator: string;
    eventId: string;
    eventType: string;
    timestamp: string; // ISO 8601 format
  };
}

/**
 * Represents a RetentionPolicy contract as returned by the JSON API.
 */
export interface RetentionPolicy {
  contractId: string;
  templateId: string;
  payload: {
    operator: string;
    policyId: string;
    retentionDays: string; // Daml Int is serialized as a string
    description: string;
  };
}

/**
 * Represents the successful response structure for a `/v1/query` request.
 */
interface QueryResponse<T> {
  result: T[];
  status: number;
  warnings?: unknown;
}

/**
 * Configuration for initializing the AuditService.
 */
export interface AuditServiceConfig {
  ledgerUrl: string;
  token: string;
  auditLogModuleId: string; // The Daml module ID for the main AuditEntry template, e.g., "AuditLog"
}

/**
 * A service class to handle all interactions with the audit and compliance
 * Daml contracts on the Canton ledger.
 */
export class AuditService {
  private readonly ledgerUrl: string;
  private readonly token: string;
  private readonly auditLogModuleId: string;

  constructor(config: AuditServiceConfig) {
    this.ledgerUrl = config.ledgerUrl.endsWith('/')
      ? config.ledgerUrl.slice(0, -1)
      : config.ledgerUrl;
    this.token = config.token;
    this.auditLogModuleId = config.auditLogModuleId;
  }

  /**
   * A generic helper to query for active contracts of a specific template.
   * @param templateId The full template identifier (e.g., "Module.Name:TemplateName").
   * @returns A promise that resolves to an array of contracts.
   * @throws Will throw an error if the network request or ledger API call fails.
   */
  private async queryContracts<T>(templateId: string): Promise<T[]> {
    const response = await fetch(`${this.ledgerUrl}/v1/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        templateIds: [templateId],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Failed to query contracts:", errorBody);
      throw new Error(`Ledger API request failed: ${response.status} ${response.statusText}`);
    }

    const data: QueryResponse<T> = await response.json();
    if (data.status !== 200) {
      throw new Error(`Ledger API returned non-200 status in response body: ${data.status}`);
    }

    return data.result;
  }

  /**
   * Fetches all `AuditEntry` contracts visible to the party associated with the token.
   */
  public async getAuditEntries(): Promise<AuditEntry[]> {
    const templateId = `${this.auditLogModuleId}:AuditEntry`;
    return this.queryContracts<AuditEntry>(templateId);
  }

  /**
   * Fetches all `RegulatorEntry` contracts visible to the party.
   * Module name is inferred from the corresponding Daml file name.
   */
  public async getRegulatorViews(): Promise<RegulatorEntry[]> {
    const templateId = `RegulatorView:RegulatorEntry`;
    return this.queryContracts<RegulatorEntry>(templateId);
  }

  /**
   * Fetches all `RetentionPolicy` contracts visible to the party.
   * Module name is inferred from the corresponding Daml file name.
   */
  public async getRetentionPolicies(): Promise<RetentionPolicy[]> {
    const templateId = `RetentionPolicy:Policy`;
    return this.queryContracts<RetentionPolicy>(templateId);
  }

  /**
   * Generates a CSV report from a list of audit entries.
   * Properly escapes quotes and commas within the payload.
   * @param entries An array of `AuditEntry` contracts.
   * @returns A string containing the data in CSV format.
   */
  public generateAuditReportCsv(entries: AuditEntry[]): string {
    const headers = "Event ID,Event Type,Timestamp,Operator,Payload";
    if (entries.length === 0) {
      return headers;
    }

    const rows = entries.map(entry => {
      const { eventId, eventType, timestamp, operator, payload } = entry.payload;
      // CSV spec: double up existing double quotes and wrap the whole field in double quotes.
      const escapedPayload = `"${payload.replace(/"/g, '""')}"`;
      return [eventId, eventType, timestamp, operator, escapedPayload].join(',');
    });

    return [headers, ...rows].join('\n');
  }

  /**
   * Generates a CSV report suitable for regulators from a list of regulator views.
   * @param entries An array of `RegulatorEntry` contracts.
   * @returns A string containing the data in CSV format.
   */
  public generateRegulatorReportCsv(entries: RegulatorEntry[]): string {
    const headers = "Event ID,Event Type,Timestamp,Operator";
    if (entries.length === 0) {
      return headers;
    }

    const rows = entries.map(entry => {
      const { eventId, eventType, timestamp, operator } = entry.payload;
      return [eventId, eventType, timestamp, operator].join(',');
    });

    return [headers, ...rows].join('\n');
  }
}