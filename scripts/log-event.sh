#!/bin/bash
#
# Description:
#   Logs a new audit event to the Canton ledger by creating an AuditEntry contract.
#   This script sends a request to the Canton participant's JSON API.
#
# Usage:
#   ./scripts/log-event.sh <ENTITY_PARTY_ID> <JWT_TOKEN> <EVENT_TYPE> '<EVENT_DETAILS_JSON>' <COMPLIANCE_OFFICER_PARTY_ID> <REGULATOR_PARTY_ID>
#
# Example:
#   ./scripts/log-event.sh "RegulatedEntity::1220..." \
#   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
#   "ClientOnboarding" \
#   '{"clientId": "CUST-9876", "riskScore": "MEDIUM", "approvedBy": "j.doe"}' \
#   "ComplianceOfficer::1220..." \
#   "Regulator::1220..."

set -euo pipefail

# --- Configuration ---
LEDGER_HOST=${LEDGER_HOST:-"localhost"}
LEDGER_PORT=${LEDGER_PORT:-"7575"}
LEDGER_URL="http://${LEDGER_HOST}:${LEDGER_PORT}/v1/create"
TEMPLATE_ID="AuditEntry:AuditEntry"

# --- Input Validation ---
if [ "$#" -ne 6 ]; then
    echo "Error: Invalid number of arguments."
    echo ""
    echo "Usage: $0 <ENTITY_PARTY_ID> <JWT_TOKEN> <EVENT_TYPE> '<EVENT_DETAILS_JSON>' <COMPLIANCE_OFFICER_PARTY_ID> <REGULATOR_PARTY_ID>"
    echo ""
    echo "Arguments:"
    echo "  1. ENTITY_PARTY_ID             - Party ID of the entity logging the event."
    echo "  2. JWT_TOKEN                   - Authentication token for the entity party."
    echo "  3. EVENT_TYPE                  - A string identifying the event type (e.g., 'TradeExecution')."
    echo "  4. EVENT_DETAILS_JSON          - A JSON string with event details (must be single-quoted)."
    echo "  5. COMPLIANCE_OFFICER_PARTY_ID - Party ID of the internal compliance officer."
    echo "  6. REGULATOR_PARTY_ID          - Party ID of the external regulator."
    exit 1
fi

# --- Assign Arguments to Variables ---
ENTITY_PARTY_ID="$1"
JWT_TOKEN="$2"
EVENT_TYPE="$3"
EVENT_DETAILS_JSON="$4"
COMPLIANCE_OFFICER_PARTY_ID="$5"
REGULATOR_PARTY_ID="$6"

# Generate a timestamp in ISO-8601 format with UTC timezone, which Daml expects.
# On macOS, use `gdate` or adjust the format string.
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.%6NZ")

# --- Construct JSON Payload ---
# Using a heredoc to build the JSON payload avoids complex quoting issues.
read -r -d '' JSON_PAYLOAD << EOM
{
  "templateId": "${TEMPLATE_ID}",
  "payload": {
    "entity": "${ENTITY_PARTY_ID}",
    "complianceOfficer": "${COMPLIANCE_OFFICER_PARTY_ID}",
    "regulator": "${REGULATOR_PARTY_ID}",
    "eventType": "${EVENT_TYPE}",
    "eventTimestamp": "${TIMESTAMP}",
    "eventDetails": "${EVENT_DETAILS_JSON}"
  }
}
EOM

# --- Log Event via JSON API ---
echo "Submitting Audit Entry to Canton ledger..."
echo "  URL: ${LEDGER_URL}"
echo "  Entity: ${ENTITY_PARTY_ID}"
echo "  EventType: ${EVENT_TYPE}"
echo ""

HTTP_RESPONSE=$(curl -s -w "%{http_code}" -X POST "${LEDGER_URL}" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${JSON_PAYLOAD}")

# Extract the HTTP status code from the end of the response
HTTP_STATUS=$(echo "${HTTP_RESPONSE}" | tail -n1)
# Extract the JSON body (everything except the last line)
RESPONSE_BODY=$(echo "${HTTP_RESPONSE}" | sed '$d')

# --- Handle Response ---
if [ "${HTTP_STATUS}" -eq 200 ]; then
    echo "✅ Successfully logged audit event."
    CONTRACT_ID=$(echo "${RESPONSE_BODY}" | sed -n 's/.*"contractId": *"\([^"]*\)".*/\1/p')
    echo "   Contract ID: ${CONTRACT_ID}"
else
    echo "❌ Failed to log audit event. HTTP Status: ${HTTP_STATUS}"
    echo "   Ledger Response:"
    # Pretty-print the JSON error if `jq` is available
    if command -v jq &> /dev/null; then
        echo "${RESPONSE_BODY}" | jq
    else
        echo "${RESPONSE_BODY}"
    fi
    exit 1
fi