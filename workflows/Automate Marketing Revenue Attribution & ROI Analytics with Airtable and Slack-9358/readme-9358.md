Automate Marketing Revenue Attribution & ROI Analytics with Airtable and Slack

https://n8nworkflows.xyz/workflows/automate-marketing-revenue-attribution---roi-analytics-with-airtable-and-slack-9358


# Automate Marketing Revenue Attribution & ROI Analytics with Airtable and Slack

### 1. Workflow Overview

This n8n workflow automates marketing revenue attribution and ROI analytics by integrating Airtable data with Slack and Gmail notifications. Its primary goal is to calculate and update marketing lead sources with key financial metrics such as total revenue, ROI, conversion rates, and average deal size based on closed deals from the last 30 days.

**Target use cases:**
- Marketing and sales teams measuring the effectiveness of different lead sources.
- Automating ROI calculation for marketing campaigns.
- Sending scheduled performance reports to Slack channels and email recipients.

**Logical blocks:**

- **1.1 Input Data Retrieval:**  
  Fetches relevant deal and lead source data from Airtable tables with filtering on recent closed deals.

- **1.2 Data Processing & Metrics Calculation:**  
  Processes the fetched data via a JavaScript code node to compute revenue, costs, ROI, and conversion metrics per lead source.

- **1.3 Iterative Record Update:**  
  Loops over computed results to update corresponding Airtable lead source records with new analytics data.

- **1.4 Reporting & Notification:**  
  Sends a summary report message to a Slack channel and a notification email to a management address.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Input Data Retrieval

**Overview:**  
This block fetches the necessary input data from Airtable: closed deals from the last 30 days and all marketing lead sources with cost data.

**Nodes Involved:**  
- Schedule Trigger  
- Deals (Airtable)  
- Search Lead Source (Airtable)

**Node Details:**

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Starts the workflow automatically on a daily schedule (default daily at midnight).  
  - Configuration: Runs once every day (interval: daily).  
  - Connections: Output to "Deals" node.  
  - Potential Failures: Scheduling misconfigurations, workflow not enabled.

- **Deals**  
  - Type: Airtable  
  - Role: Searches "Deals" table for closed won deals closed within the last 30 days.  
  - Configuration:  
    - Base: Airtable base with ID "appeCsmVosYvWkVM3" (Contacts base).  
    - Table: "Deals" (tblJlUYIVVJrYrUZl).  
    - Operation: Search with filter formula `=AND({Stage} = "Closed Won", IS_AFTER({Actual Close Date}, DATEADD(NOW(), -30, 'days')))` ensuring deals are recent and won.  
  - Credentials: Airtable Personal Access Token.  
  - Output: Array of deal records with fields like Stage, Deal Value, Deal Source, Actual Close Date.  
  - Potential Failures: API authentication errors, no deals returned if date or stage filters mismatch, missing or malformed data fields.

- **Search Lead Source**  
  - Type: Airtable  
  - Role: Retrieves all lead source records with cost and lead generation data.  
  - Configuration:  
    - Base: Same Airtable base as above.  
    - Table: "Lead Sources" (tblPecJqyJn6lmSDj).  
    - Operation: Search (fetch all records).  
  - Credentials: Same Airtable token.  
  - Output: Lead source data including Source Name, Source Type, Cost per Lead, Total Leads Generated.  
  - Potential Failures: API errors, empty lead source table, data inconsistency (e.g., mismatched source names).

---

#### 1.2 Data Processing & Metrics Calculation

**Overview:**  
Processes the fetched deals and lead sources to calculate key metrics: total revenue, ROI, conversion rates, and average deal size per source.

**Nodes Involved:**  
- Code in JavaScript

**Node Details:**

- **Code in JavaScript**  
  - Type: Code (JavaScript)  
  - Role: Aggregates deals by lead source, maps lead source cost data, and computes metrics.  
  - Key logic:  
    - Maps lead sources by their "Source Name".  
    - Aggregates total revenue and deal count per source from deals data.  
    - Calculates total cost = cost per lead × total leads.  
    - Calculates ROI, conversion rate, average deal size.  
    - Returns sorted results by descending ROI.  
  - Inputs: Data from "Deals" and "Search Lead Source" nodes.  
  - Outputs: Array of JSON objects with calculated fields: source, totalRevenue, dealCount, avgDealSize, totalCost, roi, conversionRate, updated_at.  
  - Version Requirements: Supports n8n code node v2 syntax.  
  - Edge Cases:  
    - Missing or mismatched lead source names causing zeroed costs or skipped entries.  
    - Numeric parsing errors if fields contain non-numeric strings.  
    - Empty input arrays.  
  - Comments: Adding `// @ts-nocheck` recommended if TypeScript errors arise.

---

#### 1.3 Iterative Record Update

**Overview:**  
Loops over each calculated metric record to update corresponding Airtable lead source records and ensures data integrity by searching for the lead source before updating.

**Nodes Involved:**  
- Loop Over Items (SplitInBatches)  
- Search records (Airtable)  
- Update record (Airtable)

**Node Details:**

- **Loop Over Items**  
  - Type: SplitInBatches  
  - Role: Processes each lead source result individually to allow sequential updating.  
  - Configuration: Default batch options (batch size = 1).  
  - Inputs: Output from Code node.  
  - Outputs: Single item batches to "Search records".  
  - Edge Cases: Large datasets may increase execution time.

- **Search records**  
  - Type: Airtable  
  - Role: Verifies the existence of the lead source record in Airtable by filtering for `{Source Type} = "{{ $json.source }}"`.  
  - Configuration:  
    - Base and Table same as lead source table.  
    - Operation: Search with formula filter on "Source Type".  
  - Credentials: Airtable token.  
  - Outputs: Matching Airtable record(s) or empty if not found.  
  - Edge Cases: No matching record causes the update to be skipped. Case sensitivity is critical.

- **Update record**  
  - Type: Airtable  
  - Role: Updates the found lead source record with calculated metrics.  
  - Configuration:  
    - Base and Table same as above.  
    - Mapping fields include: Cost per Lead, Conversion rate, Total Leads Generated, Total Revenue Attributed.  
    - Matching by Airtable record ID (`id` mapped from searched record).  
  - Credentials: Airtable token.  
  - Edge Cases:  
    - Record ID must be correctly passed; otherwise, update fails.  
    - Field names must exactly match Airtable schema.  
    - API limits may affect batch updates.

---

#### 1.4 Reporting & Notification

**Overview:**  
Sends the weekly revenue attribution report to a Slack channel and emails management a notification about the update.

**Nodes Involved:**  
- Send a message (Slack)  
- Send a message1 (Gmail)

**Node Details:**

- **Send a message (Slack)**  
  - Type: Slack  
  - Role: Posts a formatted message summarizing the revenue attribution metrics to a specified Slack channel (#sales-analytics).  
  - Configuration:  
    - Channel ID: C09JRB0G41J (sales-analytics).  
    - Message template includes Source Type, Total Revenue Attributed, ROI, Conversion rate.  
    - Auth: OAuth2 credential for Slack workspace.  
  - Inputs: From "Update record".  
  - Edge Cases: Authentication token expiration, channel ID correctness, message formatting issues.

- **Send a message1 (Gmail)**  
  - Type: Gmail (OAuth2)  
  - Role: Sends an email to a management address notifying that the Slack report was sent.  
  - Configuration:  
    - Recipient: yourname@company.com (to be replaced).  
    - Subject: "Sales Analytics Update".  
    - HTML message body referencing Slack notification.  
    - Auth: OAuth2 Gmail credentials.  
  - Inputs: From Slack node.  
  - Edge Cases: Gmail OAuth token issues, invalid recipient email, network failures.

---

### 3. Summary Table

| Node Name          | Node Type          | Functional Role                                         | Input Node(s)       | Output Node(s)        | Sticky Note                                                                                         |
|--------------------|--------------------|---------------------------------------------------------|---------------------|-----------------------|---------------------------------------------------------------------------------------------------|
| Schedule Trigger    | Schedule Trigger   | Initiates workflow daily                                 | —                   | Deals                 |                                                                                                   |
| Deals              | Airtable           | Fetches closed won deals from last 30 days              | Schedule Trigger    | Search Lead Source     | ## 📥 STEP 1 & 2: COLLECT DATA FROM AIRTABLE - NODE 1: Fetch Closed Won Deals                      |
| Search Lead Source  | Airtable           | Fetches all lead sources with cost data                  | Deals               | Code in JavaScript     | ## 📥 STEP 1 & 2: COLLECT DATA FROM AIRTABLE - NODE 2: Fetch Lead Sources                         |
| Code in JavaScript  | Code               | Calculates revenue, ROI, conversion, average deal size  | Search Lead Source   | Loop Over Items        | ## 🧮 STEP 3 & 4: CALCULATE ROI & PROCESS - NODE 3: Calculate Metrics                             |
| Loop Over Items     | SplitInBatches     | Processes each source's metrics individually             | Code in JavaScript   | Search records         | ## 🧮 STEP 3 & 4: CALCULATE ROI & PROCESS - NODE 4: Loop Each Source                              |
| Search records      | Airtable           | Searches for lead source record before update            | Loop Over Items      | Update record          | ## UPDATE DATA & SEND REPORT - Ensures record exists before update                               |
| Update record       | Airtable           | Updates lead source with calculated metrics              | Search records       | Send a message         | ## UPDATE DATA & SEND REPORT - Updates fields with ROI, revenue, conversion                      |
| Send a message      | Slack              | Sends revenue attribution report to Slack channel       | Update record        | Send a message1        | ## UPDATE DATA & SEND REPORT - Slack notification to #sales-analytics                            |
| Send a message1     | Gmail              | Sends email notification to management                   | Send a message       | —                     | ## UPDATE DATA & SEND REPORT - Email to CEO about Slack update                                  |
| Sticky Note4        | Sticky Note        | Documentation overview and project description           | —                   | —                     | # 📊 REVENUE ATTRIBUTION & ROI CALCULATOR — Workflow purpose and requirements                    |
| Sticky Note5        | Sticky Note        | Details on data collection nodes                          | —                   | —                     | ## 📥 STEP 1 & 2: COLLECT DATA FROM AIRTABLE — Notes on Deals and Lead Sources                    |
| Sticky Note6        | Sticky Note        | Details on calculation and processing nodes              | —                   | —                     | ## 🧮 STEP 3 & 4: CALCULATE ROI & PROCESS — Explanation of Code and Loop nodes                   |
| Sticky Note7        | Sticky Note        | Details on update and notification nodes                  | —                   | —                     | ## UPDATE DATA & SEND REPORT — Notes on updating Airtable and sending Slack/email notifications  |
| Sticky Note9        | Sticky Note        | Troubleshooting guide                                    | —                   | —                     | ## ⚠️ TROUBLESHOOTING GUIDE — Common issues and fixes with link to documentation                 |
| Sticky Note         | Sticky Note        | Start point indicator                                    | —                   | —                     | ## Start Here                                                                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node:**  
   - Type: Schedule Trigger  
   - Set to run daily (interval: day) at midnight or desired time.

2. **Create an Airtable node named "Deals":**  
   - Credentials: Airtable Personal Access Token (API token with access to your base).  
   - Base ID: Your Airtable base ID (e.g., "appeCsmVosYvWkVM3").  
   - Table: Deals table (e.g., "tblJlUYIVVJrYrUZl").  
   - Operation: Search records.  
   - Filter formula: `=AND({Stage} = "Closed Won", IS_AFTER({Actual Close Date}, DATEADD(NOW(), -30, 'days')))`.  
   - Select fields: Stage, Deal Value, Deal Source, Actual Close Date.

3. **Connect Schedule Trigger → Deals.**

4. **Create an Airtable node named "Search Lead Source":**  
   - Use same Airtable credentials and base as above.  
   - Table: Lead Sources (e.g., "tblPecJqyJn6lmSDj").  
   - Operation: Search records (no filter to get all).  
   - Fields: Source Name, Source Type, Cost per Lead, Total Leads Generated.

5. **Connect Deals → Search Lead Source.**

6. **Create a Code node named "Code in JavaScript":**  
   - Paste the JavaScript code to:  
     - Collect deals and lead sources from previous nodes.  
     - Aggregate revenue, count, cost, ROI, conversion rate, and average deal size.  
     - Sort results by ROI descending.  
   - Add `// @ts-nocheck` at the top to avoid TypeScript errors.  
   - Connect Search Lead Source → Code in JavaScript.

7. **Create a SplitInBatches node named "Loop Over Items":**  
   - Default options (batch size = 1).  
   - Connect Code in JavaScript → Loop Over Items.

8. **Create an Airtable node named "Search records":**  
   - Same Airtable credentials and base.  
   - Table: Lead Sources.  
   - Operation: Search records.  
   - Filter formula: `={Source Type} = "{{ $json.source }}"` (dynamic source type from batch item).  
   - Connect Loop Over Items → Search records.

9. **Create an Airtable node named "Update record":**  
   - Same Airtable credentials and base.  
   - Table: Lead Sources.  
   - Operation: Update record.  
   - Mapping:  
     - Record ID: from `Search records` node output (e.g., `id`).  
     - Fields to update: Cost per Lead, Conversion rate, Total Leads Generated, Total Revenue Attributed, ROI (formatted as string if needed).  
   - Connect Search records → Update record.

10. **Create a Slack node named "Send a message":**  
    - Credential: Slack OAuth2 with permission to post messages.  
    - Channel: Select Target Slack channel (e.g., #sales-analytics).  
    - Message: Use template with variables from updated Airtable record (e.g., Source Type, Total Revenue Attributed, ROI, Conversion rate).  
    - Connect Update record → Send a message.

11. **Create a Gmail node named "Send a message1":**  
    - Credential: Gmail OAuth2 with send email permission.  
    - Recipient: Enter management email address.  
    - Subject: "Sales Analytics Update".  
    - HTML message body: Inform management about Slack update.  
    - Connect Send a message → Send a message1.

12. **Enable workflow and test.**

---

### 5. General Notes & Resources

| Note Content                                                                                          | Context or Link                                                                                              |
|-----------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| Workflow runs daily at midnight, taking ~2-3 minutes per execution.                                  | Sticky Note4                                                                                                 |
| Airtable base must have "Deals" and "Lead Sources" tables with exact field names as specified.      | Sticky Note5                                                                                                 |
| Deal Source values must exactly match Source Name in Airtable (case-sensitive, no extra spaces).    | Sticky Note5                                                                                                 |
| ROI formula customizable in Code node (lines 35-42), sorting logic on lines 50-55.                   | Sticky Note6                                                                                                 |
| Slack and Gmail nodes optional; remove if notifications not needed.                                  | Sticky Note7                                                                                                 |
| Troubleshooting guide for common errors included with fixes, e.g. no deals returned, code errors.    | Sticky Note9                                                                                                 |
| Full documentation link: https://www.notion.so/RevOps-Intelligence-Hub-Complete-Documentation-282ca81d5bda804a9ccdfc974b6f089d?source=copy_link | Sticky Note9                                                                                                 |
| Slack workspace and Gmail accounts require OAuth2 credentials configured in n8n.                     | General requirement for notification nodes.                                                                 |

---

**Disclaimer:**  
The text provided originates exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly respects current content policies and contains no illegal, offensive, or protected material. All data handled is legal and public.