# Canton Audit & Compliance Platform

[![CI](https://github.com/digital-asset/canton-audit-compliance/actions/workflows/ci.yml/badge.svg)](https://github.com/digital-asset/canton-audit-compliance/actions/workflows/ci.yml)

An immutable, privacy-preserving audit trail and compliance reporting solution built on the Canton Network. This platform allows regulated entities to record business events securely, provides compliance officers with powerful querying tools, and offers regulators a verifiable, scoped view of data without compromising commercial confidentiality.

---

## Table of Contents

-   [Overview](#overview)
-   [Key Concepts](#key-concepts)
-   [User Guides](#user-guides)
    -   [For Compliance Officers](#for-compliance-officers)
    -   [For Regulators](#for-regulators)
-   [Developer Quickstart](#developer-quickstart)
    -   [Prerequisites](#prerequisites)
    -   [Run the Application](#run-the-application)
-   [Project Structure](#project-structure)

## Overview

In regulated industries, maintaining a complete, tamper-proof audit log is critical. Traditional systems often rely on centralized databases that are vulnerable to manipulation and provide coarse-grained access controls, forcing a trade-off between transparency and confidentiality.

This platform leverages the unique architecture of the Canton Network and Daml smart contracts to solve these challenges:

-   **Immutability**: Every audit entry is recorded on a distributed ledger, creating a verifiable and permanent record of events.
-   **Privacy-by-Design**: Canton's privacy model ensures that audit data is only visible to the parties explicitly involved in a contract. Regulators can be granted access to specific data subsets without exposing the entity's entire transaction history.
-   **Verifiability**: Both the entity and the regulator can independently verify the integrity of the audit trail they have access to.
-   **Real-time Monitoring**: The platform provides a live stream of auditable events, enabling proactive compliance management.

## Key Concepts

The system is built around a few core Daml templates and party roles.

### Roles (Parties)

-   **Entity**: The regulated organization (e.g., a bank, investment firm) responsible for creating audit entries. This party is the signatory on all `AuditEntry` contracts.
-   **Compliance Officer**: An internal party at the Entity who is responsible for monitoring the audit log, managing regulator access, and generating reports. They are observers on all `AuditEntry` contracts.
-   **Regulator**: An external party (e.g., SEC, FINRA) who is granted permission to view a specific, filtered set of audit entries relevant to their jurisdiction.

### Daml Contracts

-   **`AuditEntry`**: The core data contract. It represents a single, signed auditable event. It contains the event details, a timestamp, and the signatory (the Entity). The Compliance Officer is an observer, giving them full visibility.
-   **`RegulatorAgreement`**: A bilateral agreement between the Entity and a Regulator. This contract acts as a permission gateway. When active, it delegates the Regulator the right to view `AuditEntry` contracts, typically filtered by specific criteria (e.g., event type, region) defined within the agreement. This is the mechanism that enforces Canton's "need-to-know" data access model.

## User Guides

### For Compliance Officers

As a Compliance Officer, you have a complete, real-time view of your organization's auditable activities.

**1. Viewing the Audit Log:**
Log in to the web interface with your party credentials. The main dashboard displays a live, streaming list of all `AuditEntry` contracts created by your Entity.

**2. Querying and Filtering:**
Use the search and filter controls to narrow down the audit log by date range, event type, or keywords within the event payload. This is essential for internal investigations and preparing for regulatory reviews.

**3. Onboarding a Regulator:**
To grant a regulator access:
-   Navigate to the "Regulator Management" section.
-   Initiate a new `RegulatorAgreement` proposal, specifying the Regulator's party ID and the scope of data they are permitted to see (e.g., all events tagged "TRADE_SETTLEMENT").
-   The Regulator must accept this proposal on-ledger to activate the data sharing agreement. Once accepted, their view will be automatically populated with the relevant historical and future audit entries.

### For Regulators

As a Regulator, you receive a verifiable, immutable data feed directly from the regulated entity without needing to trust intermediaries.

**1. Gaining Access:**
Your access begins when a regulated entity sends you a `RegulatorAgreement` proposal. You will review the terms of this proposal (data scope, duration) and accept it using your Canton-enabled wallet or application.

**2. Viewing Scoped Data:**
Once the agreement is active, your dashboard will display only the `AuditEntry` contracts that match the scope defined in the agreement. You have a direct, read-only view of the same contracts the entity sees, ensuring data consistency and integrity.

**3. Privacy Guarantees:**
You cannot see any audit entries or other business activities that fall outside the scope of your active `RegulatorAgreement`. This protects the entity's commercial confidentiality while providing you with the specific data required for your supervisory function.

## Developer Quickstart

Follow these steps to build the Daml model and run the full application stack locally.

### Prerequisites

1.  **DPM (Daml Package Manager)**: Canton SDK version 3.4.0 or higher.
    ```bash
    curl https://get.digitalasset.com/install/install.sh | sh
    ```
2.  **Node.js**: v18.x or later.
3.  **Java**: JDK 11.

### Run the Application

**1. Build the Daml Model**

Compile the Daml code into a DAR (Daml Archive).

```bash
dpm build
```
This command reads the `daml.yaml` file and creates the distributable artifact in `.daml/dist/canton-audit-compliance-0.1.0.dar`.

**2. Start the Local Canton Ledger (Sandbox)**

This command starts a local Canton ledger, exposes the JSON API on port 7575, and automatically uploads the project's DAR file.

```bash
dpm sandbox
```
The sandbox will remain running. Keep this terminal window open.

**3. Run the Frontend Application**

In a **new terminal window**, navigate to the `frontend` directory, install dependencies, and start the React development server.

```bash
cd frontend
npm install
npm start
```
The application will be available at `http://localhost:3000`. The frontend is pre-configured to connect to the local JSON API on port 7575.

**4. Run Daml Tests (Optional)**

To run the Daml Script tests defined in the `daml/Test` folder:

```bash
dpm test
```

## Project Structure

```
.
├── .github/workflows/      # GitHub Actions CI configuration
├── daml/                   # Daml source code
│   ├── Audit/              # Core Daml templates (AuditEntry, RegulatorAgreement)
│   └── Test/               # Daml Script tests
├── docs/                   # Extended documentation
│   └── COMPLIANCE_FRAMEWORK.md
├── frontend/               # React/TypeScript web application
│   ├── public/
│   └── src/
├── .gitignore
├── daml.yaml               # Daml project configuration
└── README.md
```