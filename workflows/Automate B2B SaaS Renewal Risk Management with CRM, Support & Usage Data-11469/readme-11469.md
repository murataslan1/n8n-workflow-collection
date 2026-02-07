Automate B2B SaaS Renewal Risk Management with CRM, Support & Usage Data

https://n8nworkflows.xyz/workflows/automate-b2b-saas-renewal-risk-management-with-crm--support---usage-data-11469


# Automate B2B SaaS Renewal Risk Management with CRM, Support & Usage Data

### 1. Workflow Overview

This workflow automates B2B SaaS renewal risk management by integrating CRM, support, and product usage data to identify accounts at risk of churn 30 days before their subscription renewal. It enriches subscription data with various external sources, computes a churn risk score, and routes accounts through tailored escalation playbooks (Low, Medium, High risk) involving email notifications, task creation in Trello and Jira, and Slack alerts. Additionally, it logs all activities in a Postgres database and sends a daily summary email to the customer success team.

The workflow is logically divided into these blocks:

- **1.1 Scheduled Trigger & Configuration:** Initiates workflow daily, sets thresholds.
- **1.2 Data Retrieval & Enrichment:** Fetches expiring subscriptions and enriches with CRM, support, and product usage data.
- **1.3 Scoring & Risk Computation:** Calls scoring APIs, normalizes data, computes churn risk level.
- **1.4 Routing & Playbook Execution:** Routes accounts by risk level and triggers appropriate notifications and task creations.
- **1.5 Logging & Reporting:** Logs processed accounts in Postgres and sends daily summary emails.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger & Configuration

- **Overview:**  
  This block triggers the workflow daily at 08:00 AM and initializes configuration parameters such as renewal threshold days and churn risk thresholds.

- **Nodes Involved:**  
  - `daily trigger`  
  - `Init config & thresholds`

- **Node Details:**

  - **daily trigger**  
    - Type: Schedule Trigger  
    - Role: Starts the workflow daily at 8 AM.  
    - Configuration: Interval trigger set to trigger at hour 8.  
    - Input: None  
    - Output: Triggers `Init config & thresholds`  
    - Edge cases: Workflow downtime at trigger time may delay execution.

  - **Init config & thresholds**  
    - Type: Set  
    - Role: Defines key parameters such as days before renewal (30), high churn threshold (0.7), and medium churn threshold (0.4).  
    - Configuration: Sets static number values for `days_before_renewal`, `churn_threshold_high`, and `churn_threshold_medium`.  
    - Input: Trigger from `daily trigger`  
    - Output: Connects to `Fetch subscriptions expiring in J+30`  
    - Edge cases: Misconfiguration of thresholds could lead to incorrect risk levels.

#### 2.2 Data Retrieval & Enrichment

- **Overview:**  
  Retrieves subscriptions expiring in exactly 30 days from Postgres, processes them in batches, and enriches each account with data from multiple CRM systems and analytics APIs.

- **Nodes Involved:**  
  - `Fetch subscriptions expiring in J+30`  
  - `Process subscriptions in batches`  
  - `Data personalisation`  
  - `HubSpot – Get engagement history`  
  - `Salesforce – Get account details`  
  - `Pipedrive – Get deal activities`  
  - `Pipedrive – Get deal products`  
  - `Analytics API – Feature usage`  
  - `analytivcs` (HTTP Request for additional analytics)  
  - `Get data related to an organization` (Zendesk)  
  - `Data merge`

- **Node Details:**

  - **Fetch subscriptions expiring in J+30**  
    - Type: Postgres  
    - Role: Retrieves active subscriptions with end date 30 days from current date.  
    - Configuration: SQL query joining subscriptions and accounts filtering by active status and end date = today + 30 days.  
    - Input: `Init config & thresholds`  
    - Output: `Process subscriptions in batches`  
    - Edge cases: Database connection issues, empty results if no subscriptions expire.

  - **Process subscriptions in batches**  
    - Type: Split In Batches  
    - Role: Processes subscription records in batches of 50 to avoid API rate limits or timeouts.  
    - Input: Output from Postgres query  
    - Output: `Data personalisation`  
    - Edge cases: Batch size too large may cause API throttling.

  - **Data personalisation**  
    - Type: NoOp  
    - Role: Placeholder node, logically separates data enrichment from batch processing.  
    - Input: Batches from previous node  
    - Output: Fan-out to multiple CRM and analytics data fetch nodes.  
    - Edge cases: None.

  - **HubSpot – Get engagement history**  
    - Type: HubSpot Node  
    - Role: Retrieves engagement data related to the account via OAuth2 authentication.  
    - Configuration: Resource `engagement`, operation `getAll`.  
    - Input: From `Data personalisation`  
    - Output: To `Data merge` (input index 6)  
    - Edge cases: OAuth token expiry, API rate limits.

  - **Salesforce – Get account details**  
    - Type: Salesforce Node  
    - Role: Fetches detailed account information.  
    - Configuration: Resource `account`, operation `getAll`, using Salesforce OAuth2.  
    - Input: From `Data personalisation`  
    - Output: To `Data merge` (input index 5)  
    - Edge cases: Authentication errors, API limits.

  - **Pipedrive – Get deal activities**  
    - Type: Pipedrive Node  
    - Role: Retrieves activities tied to deals for the account.  
    - Configuration: Resource `dealActivity`.  
    - Input: From `Data personalisation`  
    - Output: To `Data merge` (input index 4)  
    - Edge cases: API limits, missing deal IDs.

  - **Pipedrive – Get deal products**  
    - Type: Pipedrive Node  
    - Role: Fetches products associated with deals.  
    - Configuration: Resource `dealProduct`, operation `getAll`.  
    - Input: From `Data personalisation`  
    - Output: To `Data merge` (input index 3)  
    - Edge cases: API limits.

  - **Analytics API – Feature usage**  
    - Type: HTTP Request  
    - Role: Calls external analytics API to get feature usage data.  
    - Configuration: Custom URL, no additional options.  
    - Input: From `Data personalisation`  
    - Output: To `Data merge` (input index 2)  
    - Edge cases: Endpoint availability, response timeouts.

  - **analytivcs**  
    - Type: HTTP Request  
    - Role: Additional analytics data retrieval.  
    - Configuration: Custom URL, no options.  
    - Input: From `Data personalisation`  
    - Output: To `Data merge` (input index 1)  
    - Edge cases: API downtime.

  - **Get data related to an organization**  
    - Type: Zendesk  
    - Role: Gets Zendesk organization-related data (e.g., support tickets).  
    - Configuration: Resource `organization`, operation `getRelatedData`, authenticated via Zendesk API credentials.  
    - Input: From `Data personalisation`  
    - Output: To `Data merge` (input index 0)  
    - Edge cases: API call limits, auth errors.

  - **Data merge**  
    - Type: Merge  
    - Role: Combines seven data streams into a single enriched record per subscription.  
    - Input: From all data enrichment nodes (indexed inputs)  
    - Output: `Scoring API – Call`  
    - Edge cases: Merging mismatched data, missing fields.

#### 2.3 Scoring & Risk Computation

- **Overview:**  
  Calls scoring API with enriched data, normalizes response, computes final churn risk score and risk level (High, Medium, Low) based on configured thresholds.

- **Nodes Involved:**  
  - `Scoring API – Call`  
  - `Engagement call`  
  - `Normalize scoring response`  
  - `Compute churn score & level`

- **Node Details:**

  - **Scoring API – Call**  
    - Type: HTTP Request  
    - Role: Sends churn-related parameters (score, label, reasons) to an external scoring API.  
    - Configuration: URL with query parameters for churn_score (0-1), churn_label (Low/Medium/High), top_reasons (explanation).  
    - Input: From `Data merge`  
    - Output: `Engagement call`  
    - Edge cases: API downtime, malformed response.

  - **Engagement call**  
    - Type: HTTP Request  
    - Role: Calls engagement API with parameters like engagement, number of users, active users, days since last activity.  
    - Configuration: Query parameters dynamically set from incoming JSON fields.  
    - Input: From `Scoring API – Call`  
    - Output: `Normalize scoring response`  
    - Edge cases: Missing parameters, API errors.

  - **Normalize scoring response**  
    - Type: Set  
    - Role: Extracts and normalizes key scoring data fields (`engagementScore`, `productUsage`, `nbSupportTicketsLast30d`, `daysSinceLastActivity`) with fallback defaults.  
    - Configuration: Sets numeric fields with defaults 0 when missing.  
    - Input: From `Engagement call`  
    - Output: `Compute churn score & level`  
    - Edge cases: Missing or malformed input values.

  - **Compute churn score & level**  
    - Type: Set  
    - Role: Calculates a weighted risk score from normalized metrics and assigns a risk level string using thresholds from config.  
    - Configuration:  
      - RiskScore formula:  
        40% engagementScore + 30% productUsage + 20% if support tickets in last 30 days > 5 + 10% if days since last activity > 14; rounded to two decimals.  
      - RiskLevel assigned as HIGH if riskScore >= high threshold (0.7), MEDIUM if >= medium threshold (0.4), else LOW.  
    - Input: From `Normalize scoring response` + config variables (churn thresholds)  
    - Output: `Route by churn risk (HIGH / MEDIUM / LOW)`  
    - Edge cases: Division by zero or missing data could skew score.

#### 2.4 Routing & Playbook Execution

- **Overview:**  
  Routes each account by churn risk level and triggers corresponding communication actions, task creations, and alerts.

- **Nodes Involved:**  
  - `Route by churn risk (HIGH / MEDIUM / LOW)`  
  - `Trello Create HIGH risk card`  
  - `jira ticket`  
  - `Slack notification`  
  - `Email – CSM/AM HIGH`  
  - `Trello Create MEDIUM risk card1`  
  - `Email – CSM/ AM MEDIUM`  
  - `Email – LOW info`  
  - `Prepare log payload`

- **Node Details:**

  - **Route by churn risk (HIGH / MEDIUM / LOW)**  
    - Type: Switch  
    - Role: Routes workflow based on riskLevel field: High, Medium, Low (case sensitive strict equality).  
    - Input: From `Compute churn score & level`  
    - Output:  
      - High → `Trello Create HIGH risk card`  
      - Medium → `Trello Create MEDIUM risk card1`  
      - Low → `Email – LOW info`  
    - Edge cases: Unexpected or missing riskLevel values could cause dead-ends.

  - **Trello Create HIGH risk card**  
    - Type: Trello  
    - Role: Creates a Trello card in the High-Risk list for follow-up.  
    - Configuration: Card name from input, list ID specified, using Trello credentials.  
    - Input: From switch (High risk)  
    - Output: `jira ticket`  
    - Edge cases: Trello API rate limits or invalid credentials.

  - **jira ticket**  
    - Type: Jira  
    - Role: Creates a Jira ticket for high-risk account follow-up.  
    - Configuration: Project 10002, issue type "Story" (10014), priority "High" (2). Summary empty but configurable.  
    - Input: From Trello card creation (High risk)  
    - Output: `Slack notification`  
    - Edge cases: Jira auth failures, invalid project or issue type IDs.

  - **Slack notification**  
    - Type: Slack  
    - Role: Sends a Slack message to a designated channel announcing high churn risk alert.  
    - Configuration: OAuth2 authentication, fixed channel ID, text "Alert: risk of churn".  
    - Input: From Jira ticket creation  
    - Output: `Email – CSM/AM HIGH`  
    - Edge cases: Slack API errors, permission issues.

  - **Email – CSM/AM HIGH**  
    - Type: Gmail  
    - Role: Sends detailed email alerting CSM/Account Manager of high-risk account with actionable recommendations.  
    - Configuration: OAuth2 Gmail, recipient email, subject and message body using templated expressions with account and risk data.  
    - Input: From Slack notification (High risk chain)  
    - Output: `Prepare log payload`  
    - Edge cases: Email sending failure, template evaluation errors.

  - **Trello Create MEDIUM risk card1**  
    - Type: Trello  
    - Role: Creates a Trello card in the Medium Priority list for moderate risk accounts.  
    - Configuration: Card name from input, list ID specified.  
    - Input: From switch (Medium risk)  
    - Output: `Email – CSM/ AM MEDIUM`  
    - Edge cases: Trello API limits.

  - **Email – CSM/ AM MEDIUM**  
    - Type: Gmail  
    - Role: Sends email notification for medium risk accounts with moderate risk indicators and next steps.  
    - Configuration: OAuth2 Gmail, templated message and subject.  
    - Input: From Trello card creation (Medium risk)  
    - Output: `Prepare log payload`  
    - Edge cases: Email failures.

  - **Email – LOW info**  
    - Type: Gmail  
    - Role: Sends soft renewal reminder email for low risk accounts summarizing stability and recommended gentle follow-up.  
    - Configuration: OAuth2 Gmail, templated message and subject.  
    - Input: From switch (Low risk)  
    - Output: `Prepare log payload`  
    - Edge cases: Email failures.

  - **Prepare log payload**  
    - Type: Set  
    - Role: Formats log data including account info, risk scores, playbook chosen, Trello/Jira URLs, timestamp for database insertion.  
    - Configuration: Sets string fields for logging, some with fallback to empty strings. Uses `$now` for timestamp.  
    - Input: From all playbook completion nodes (emails sent or tickets created)  
    - Output: `prepare daily summary`  
    - Edge cases: Missing input fields could cause incomplete logs.

#### 2.5 Logging & Reporting

- **Overview:**  
  Stores log entries of processed accounts in Postgres, aggregates daily summary lines, and sends a reporting email to the success team.

- **Nodes Involved:**  
  - `prepare daily summary`  
  - `Build summary line`  
  - `Build daily summary`  
  - `Reporting email`

- **Node Details:**

  - **prepare daily summary**  
    - Type: Postgres  
    - Role: Inserts the structured log payload into the `churn_logs` table in the Postgres database.  
    - Configuration: Table: `churn_logs`, schema: `public`, auto maps input fields to columns.  
    - Input: From `Prepare log payload`  
    - Output: `Build summary line`  
    - Edge cases: DB connection or constraint errors.

  - **Build summary line**  
    - Type: Set  
    - Role: Creates a concise string summarizing account name, risk level, and risk score for daily digest.  
    - Configuration: Concatenates `$json.account_name + ' – ' + $json.riskLevel + ' – ' + $json.riskScore`.  
    - Input: From `prepare daily summary`  
    - Output: `Build daily summary`  
    - Edge cases: Missing data fields.

  - **Build daily summary**  
    - Type: Aggregate  
    - Role: Aggregates all summary lines into a single concatenated text field `summaryText` for the daily email.  
    - Input: From `Build summary line`  
    - Output: `Reporting email`  
    - Edge cases: Large volume may affect performance.

  - **Reporting email**  
    - Type: Gmail  
    - Role: Sends daily email containing the summary of all accounts processed that day to the success team.  
    - Configuration: OAuth2 Gmail, recipient email, subject and message with templated insertion of summary text.  
    - Input: From `Build daily summary`  
    - Output: None (end of workflow)  
    - Edge cases: Email sending failure.

---

### 3. Summary Table

| Node Name                       | Node Type            | Functional Role                                   | Input Node(s)                          | Output Node(s)                     | Sticky Note                                                                                                                  |
|--------------------------------|----------------------|-------------------------------------------------|--------------------------------------|----------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| daily trigger                  | Schedule Trigger     | Starts workflow daily at 08:00 AM                | None                                 | Init config & thresholds          |                                                                                                                              |
| Init config & thresholds       | Set                  | Sets renewal and churn thresholds                 | daily trigger                        | Fetch subscriptions expiring in J+30 |                                                                                                                              |
| Fetch subscriptions expiring in J+30 | Postgres             | Queries subscriptions ending in 30 days          | Init config & thresholds             | Process subscriptions in batches  |                                                                                                                              |
| Process subscriptions in batches | Split In Batches     | Processes subscriptions in batches of 50          | Fetch subscriptions expiring in J+30 | Data personalisation              |                                                                                                                              |
| Data personalisation           | NoOp                  | Placeholder, fans out to enrichment nodes         | Process subscriptions in batches    | HubSpot, Salesforce, Pipedrive, Analytics, Zendesk |                                                                                                                              |
| HubSpot – Get engagement history | HubSpot              | Retrieves engagement data                          | Data personalisation                 | Data merge (input 6)             |                                                                                                                              |
| Salesforce – Get account details | Salesforce            | Fetches account profile data                       | Data personalisation                 | Data merge (input 5)             |                                                                                                                              |
| Pipedrive – Get deal activities | Pipedrive             | Retrieves deal activities                          | Data personalisation                 | Data merge (input 4)             |                                                                                                                              |
| Pipedrive – Get deal products  | Pipedrive             | Retrieves deal products                             | Data personalisation                 | Data merge (input 3)             |                                                                                                                              |
| Analytics API – Feature usage  | HTTP Request          | Gets product usage analytics                        | Data personalisation                 | Data merge (input 2)             |                                                                                                                              |
| analytivcs                    | HTTP Request          | Additional analytics data retrieval                 | Data personalisation                 | Data merge (input 1)             |                                                                                                                              |
| Get data related to an organization | Zendesk              | Retrieves Zendesk org support data                 | Data personalisation                 | Data merge (input 0)             |                                                                                                                              |
| Data merge                   | Merge                 | Combines all enriched data streams                  | HubSpot, Salesforce, Pipedrive, Analytics, Zendesk | Scoring API – Call              |                                                                                                                              |
| Scoring API – Call             | HTTP Request          | Calls external churn scoring API                    | Data merge                         | Engagement call                 |                                                                                                                              |
| Engagement call               | HTTP Request          | Calls engagement API with detailed parameters       | Scoring API – Call                 | Normalize scoring response       |                                                                                                                              |
| Normalize scoring response    | Set                   | Normalizes scoring API response                      | Engagement call                   | Compute churn score & level       |                                                                                                                              |
| Compute churn score & level   | Set                   | Calculates churn risk score and assigns risk level  | Normalize scoring response          | Route by churn risk             |                                                                                                                              |
| Route by churn risk (HIGH / MEDIUM / LOW) | Switch               | Routes workflow by churn risk level                 | Compute churn score & level         | Trello HIGH, Trello MEDIUM, Email LOW |                                                                                                                              |
| Trello Create HIGH risk card  | Trello                | Creates Trello card for high risk accounts          | Route by churn risk (HIGH)          | jira ticket                    |                                                                                                                              |
| jira ticket                  | Jira                  | Creates Jira issue for high risk follow-up           | Trello Create HIGH risk card        | Slack notification             |                                                                                                                              |
| Slack notification           | Slack                 | Sends Slack alert on high churn risk                 | jira ticket                       | Email – CSM/AM HIGH            |                                                                                                                              |
| Email – CSM/AM HIGH          | Gmail                 | Sends detailed email for high risk accounts          | Slack notification                | Prepare log payload            |                                                                                                                              |
| Trello Create MEDIUM risk card1 | Trello                | Creates Trello card for medium risk accounts         | Route by churn risk (MEDIUM)        | Email – CSM/ AM MEDIUM         |                                                                                                                              |
| Email – CSM/ AM MEDIUM       | Gmail                 | Sends email notification for medium risk             | Trello Create MEDIUM risk card1    | Prepare log payload            |                                                                                                                              |
| Email – LOW info             | Gmail                 | Sends soft renewal reminder for low risk accounts    | Route by churn risk (LOW)           | Prepare log payload            |                                                                                                                              |
| Prepare log payload          | Set                   | Prepares structured log entry for DB insertion       | Email nodes (all risk levels)      | prepare daily summary          |                                                                                                                              |
| prepare daily summary        | Postgres              | Inserts log entries into Postgres table               | Prepare log payload               | Build summary line            |                                                                                                                              |
| Build summary line           | Set                   | Builds concise summary line string for daily report  | prepare daily summary             | Build daily summary           |                                                                                                                              |
| Build daily summary          | Aggregate             | Aggregates all summary lines into one text            | Build summary line                | Reporting email              |                                                                                                                              |
| Reporting email              | Gmail                 | Sends daily summary email to success team             | Build daily summary              | None                         |                                                                                                                              |

### Sticky Notes Covering Multiple Nodes:

- Sticky Note4 (positioned near the start):  
  Explains workflow purpose and logic, including key integrated systems and playbook details.

- Sticky Note1 (on data flow):  
  Describes the flow of data retrieval from Postgres, CRM, analytics, and support tools.

- Sticky Note2 (on logging and extensibility):  
  Details logging structure and how it enables extensibility such as dashboards or AI analysis.

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node:**  
   - Name: `daily trigger`  
   - Type: Schedule Trigger  
   - Configure to run daily at 08:00 AM (triggerAtHour=8).

2. **Add a Set node:**  
   - Name: `Init config & thresholds`  
   - Assign numbers: `days_before_renewal`=30, `churn_threshold_high`=0.7, `churn_threshold_medium`=0.4.  
   - Connect output from `daily trigger`.

3. **Add Postgres node:**  
   - Name: `Fetch subscriptions expiring in J+30`  
   - Connect from `Init config & thresholds`.  
   - Configure with SQL query selecting active subscriptions ending in 30 days, joining accounts table.  
   - Use valid Postgres credentials.

4. **Add SplitInBatches node:**  
   - Name: `Process subscriptions in batches`  
   - Connect from Postgres node.  
   - Set batch size to 50.

5. **Add NoOp node:**  
   - Name: `Data personalisation`  
   - Connect from SplitInBatches.

6. **Add CRM and analytics data retrieval nodes, all connected from `Data personalisation`:**

   - HubSpot node:  
     - Name: `HubSpot – Get engagement history`  
     - Resource: engagement, operation: getAll  
     - Use HubSpot OAuth2 credentials.

   - Salesforce node:  
     - Name: `Salesforce – Get account details`  
     - Resource: account, operation: getAll  
     - Use Salesforce OAuth2 credentials.

   - Pipedrive node (deal activities):  
     - Name: `Pipedrive – Get deal activities`  
     - Resource: dealActivity  
     - Use Pipedrive API credentials.

   - Pipedrive node (deal products):  
     - Name: `Pipedrive – Get deal products`  
     - Resource: dealProduct, operation: getAll

   - HTTP Request node:  
     - Name: `Analytics API – Feature usage`  
     - URL: your analytics endpoint.

   - HTTP Request node:  
     - Name: `analytivcs`  
     - URL: your additional analytics endpoint.

   - Zendesk node:  
     - Name: `Get data related to an organization`  
     - Resource: organization, operation: getRelatedData  
     - Use Zendesk API credentials.

7. **Add Merge node:**  
   - Name: `Data merge`  
   - Number of inputs: 7  
   - Connect outputs of all enrichment nodes to the merge inputs accordingly.

8. **Add HTTP Request node:**  
   - Name: `Scoring API – Call`  
   - URL: your scoring API endpoint.  
   - Configure query parameters with churn_score, churn_label, and top_reasons.  
   - Connect from `Data merge`.

9. **Add HTTP Request node:**  
   - Name: `Engagement call`  
   - URL: your engagement API endpoint.  
   - Pass JSON parameters (`engagement`, `nb_users`, `active_users`, `days_since_last_activity`) from previous node output.  
   - Connect from `Scoring API – Call`.

10. **Add Set node:**  
    - Name: `Normalize scoring response`  
    - Extract fields: `engagementScore`, `productUsage`, `nbSupportTicketsLast30d`, `daysSinceLastActivity` with default 0.  
    - Connect from `Engagement call`.

11. **Add Set node:**  
    - Name: `Compute churn score & level`  
    - Calculate riskScore:  
      ```js
      (
        ($json.engagementScore ?? 0) * 0.4 +
        ($json.productUsage ?? 0) * 0.3 +
        ($json.nbSupportTicketsLast30d > 5 ? 0.2 : 0) +
        ($json.daysSinceLastActivity > 14 ? 0.1 : 0)
      ).toFixed(2)
      ```  
    - Assign riskLevel based on thresholds initialized earlier: HIGH if >= 0.7, MEDIUM if >= 0.4, else LOW.  
    - Connect from `Normalize scoring response`.

12. **Add Switch node:**  
    - Name: `Route by churn risk (HIGH / MEDIUM / LOW)`  
    - Conditions: string equals riskLevel to "High", "Medium", "Low" (case sensitive).  
    - Connect from `Compute churn score & level`.

13. **High risk branch:**

    - Trello node:  
      - Name: `Trello Create HIGH risk card`  
      - Configure with card name and list ID for high risk.  
      - Use Trello credentials.  
      - Connect from switch node High output.

    - Jira node:  
      - Name: `jira ticket`  
      - Configure project, issue type, priority (High).  
      - Connect from Trello card creation.

    - Slack node:  
      - Name: `Slack notification`  
      - Configure channel ID and OAuth2 credentials.  
      - Connect from Jira node.

    - Gmail node:  
      - Name: `Email – CSM/AM HIGH`  
      - Configure recipient, subject, and templated message.  
      - Use Gmail OAuth2 credentials.  
      - Connect from Slack node.

14. **Medium risk branch:**

    - Trello node:  
      - Name: `Trello Create MEDIUM risk card1`  
      - Configure with card name and list ID for medium risk.  
      - Use Trello credentials.  
      - Connect from switch node Medium output.

    - Gmail node:  
      - Name: `Email – CSM/ AM MEDIUM`  
      - Configure recipient, subject, and message template.  
      - Use Gmail OAuth2 credentials.  
      - Connect from Trello node.

15. **Low risk branch:**

    - Gmail node:  
      - Name: `Email – LOW info`  
      - Configure recipient, subject, and message template for low risk.  
      - Use Gmail OAuth2 credentials.  
      - Connect from switch node Low output.

16. **All branches connect to:**

    - Set node:  
      - Name: `Prepare log payload`  
      - Compose structured fields for logging (account IDs, risk scores, playbook, Trello and Jira URLs, timestamp).  
      - Connect from email nodes of all branches.

17. **Insert logs into Postgres:**

    - Postgres node:  
      - Name: `prepare daily summary`  
      - Configure table `churn_logs` in public schema.  
      - Connect from `Prepare log payload`.

18. **Build daily summary:**

    - Set node:  
      - Name: `Build summary line`  
      - Create string combining account name, risk level, and score.  
      - Connect from `prepare daily summary`.

    - Aggregate node:  
      - Name: `Build daily summary`  
      - Aggregate all summary lines into one text field `summaryText`.  
      - Connect from `Build summary line`.

19. **Send daily report email:**

    - Gmail node:  
      - Name: `Reporting email`  
      - Configure recipient, subject, and message with the aggregated `summaryText`.  
      - Use Gmail OAuth2 credentials.  
      - Connect from `Build daily summary`.

20. **Credentials required:**  
    - Postgres database credentials with access to subscriptions and churn_logs tables.  
    - OAuth2 credentials for HubSpot, Salesforce, Gmail, Slack, Trello, Jira.  
    - API keys or tokens for Pipedrive, Zendesk, analytics, and scoring APIs.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                 | Context or Link                                                                                                      |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| This workflow automates churn risk detection by integrating multiple data sources and triggering tailored playbooks with communication tools (Gmail, Slack) and project management (Trello, Jira).                             | Workflow overview in Sticky Note4.                                                                                   |
| Data flow involves daily querying of subscriptions expiring in 30 days, enrichment with CRM and usage data, scoring, routing, and logging for extensibility and reporting.                                                     | Sticky Note1                                                                                                         |
| Logs stored in Postgres enable dashboarding, reporting, AI analysis, and future automation extensions.                                                                                                                      | Sticky Note2                                                                                                         |
| Requires robust API credentials management and handling potential rate limits and auth token refreshes for Salesforce, HubSpot, Pipedrive, Zendesk, Gmail, Slack, Trello, and Jira.                                        | General best practices.                                                                                              |
| For risk scoring, the thresholds and weighting formula can be adjusted in the `Init config & thresholds` and `Compute churn score & level` nodes respectively to reflect business priorities.                               | Configuration flexibility note.                                                                                      |
| Email templates use n8n expressions to personalize messages with account and risk data; ensure all referenced JSON fields exist to avoid template errors.                                                                   | Email nodes configuration.                                                                                           |
| Jira and Trello nodes require valid project, issue type, list IDs; these must be configured according to your organization's setup.                                                                                        | Jira and Trello setup.                                                                                               |
| Slack notifications use OAuth2 with a fixed channel; ensure the bot has posting permissions for the selected channel.                                                                                                        | Slack node configuration.                                                                                            |

---

**Disclaimer:** The provided analysis and documentation are based exclusively on the provided n8n workflow JSON data. All data manipulations comply with applicable content policies and involve only legal and public information.