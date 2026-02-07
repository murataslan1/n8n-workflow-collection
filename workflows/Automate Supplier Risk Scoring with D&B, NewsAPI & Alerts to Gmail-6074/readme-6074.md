Automate Supplier Risk Scoring with D&B, NewsAPI & Alerts to Gmail

https://n8nworkflows.xyz/workflows/automate-supplier-risk-scoring-with-d-b--newsapi---alerts-to-gmail-6074


# Automate Supplier Risk Scoring with D&B, NewsAPI & Alerts to Gmail

---

## 1. Workflow Overview

This workflow automates the daily supplier risk scoring process by integrating financial data, news monitoring, and performance metrics to assess supplier risk levels and trigger alerts accordingly. Its primary use case is supply chain risk management, enabling procurement and risk teams to proactively identify and respond to supplier risks.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Trigger & Risk Parameter Setup**: Initiates the workflow daily and sets configurable risk thresholds and contact emails.
- **1.2 Supplier Data Retrieval**: Queries active suppliers and collects related financial, news, and operational data.
- **1.3 Risk Scoring Computation**: Calculates a comprehensive risk score for each supplier using weighted factors.
- **1.4 Risk Level Filtering and Alerting**: Routes suppliers based on risk level and sends customized email alerts.
- **1.5 Risk Tracking**: Logs the risk assessment results to a Google Sheet for record-keeping and monitoring.
- **1.6 Documentation and Notes**: Provides sticky notes with configuration guidance and risk response instructions.

---

## 2. Block-by-Block Analysis

### 2.1 Scheduled Trigger & Risk Parameter Setup

**Overview:**  
This block triggers the workflow once daily at 6 AM and initializes risk assessment parameters and recipient email addresses.

**Nodes Involved:**  
- Daily Risk Assessment  
- Risk Settings  
- Sticky Note (configuration guidance)

**Node Details:**

- **Daily Risk Assessment**  
  - Type: Schedule Trigger  
  - Role: Starts workflow every day at 06:00 (6 AM) server time using a cron expression `0 6 * * *`.  
  - Inputs: None (trigger node)  
  - Outputs: Connects to "Risk Settings"  
  - Edge cases: Cron misconfiguration or time zone mismatch could cause unexpected trigger times.

- **Risk Settings**  
  - Type: Set  
  - Role: Defines numeric risk thresholds for medium (31), high (61), and critical (81) risk levels, plus email addresses for procurement and risk management teams.  
  - Key Variables:  
    - `mediumRiskThreshold`: 31  
    - `highRiskThreshold`: 61  
    - `criticalRiskThreshold`: 81  
    - `procurementEmail`: procurement@company.com  
    - `riskManagerEmail`: risk@company.com  
  - Inputs: Output of "Daily Risk Assessment"  
  - Outputs: Connects to "Get Active Suppliers"  
  - Edge cases: Missing or incorrect email addresses would cause alert delivery failures.

- **Sticky Note**  
  - Type: Sticky Note  
  - Role: Provides configuration guidance on risk parameters, supplier criticality, alert escalation, and backup supplier priorities.  
  - Inputs/Outputs: None  
  - Content serves as internal documentation.

---

### 2.2 Supplier Data Retrieval

**Overview:**  
Retrieves active suppliers from the database and collects financial health data, recent news, and performance metrics needed for risk assessment.

**Nodes Involved:**  
- Get Active Suppliers  
- Get Financial Health  
- Monitor News & Events  
- Get Performance Data

**Node Details:**

- **Get Active Suppliers**  
  - Type: PostgreSQL  
  - Role: Queries the suppliers database for suppliers with status 'active', returning fields: `supplier_id`, `supplier_name`, `category`, `criticality_level`, `last_delivery_date`, `quality_score`, `payment_terms`, `country`.  
  - Inputs: Output of "Risk Settings"  
  - Outputs: Connects in parallel to "Get Financial Health", "Monitor News & Events", and "Get Performance Data" for each supplier.  
  - Edge cases: Database connectivity issues, query timeout, or empty result sets.

- **Get Financial Health**  
  - Type: HTTP Request  
  - Role: Calls D&B API to retrieve credit assessment data for each supplier using supplier ID.  
  - Configuration:  
    - URL template: `https://api.dnb.com/v1/companies/{{ $json.supplier_id }}/creditAssessment`  
    - Method: GET  
    - Header: Authorization Bearer token from D&B API credentials.  
  - Inputs: From "Get Active Suppliers"  
  - Outputs: To "Calculate Risk Score"  
  - Edge cases: API rate limits, invalid API keys, network errors, missing data fields.

- **Monitor News & Events**  
  - Type: HTTP Request  
  - Role: Queries NewsAPI for recent news articles mentioning the supplier name published in the last seven days, sorted by publication date, in English.  
  - Configuration:  
    - Query parameter `q`: supplier name  
    - Date filter: last 7 days  
    - Language: English  
    - API key from NewsAPI credentials  
  - Inputs: From "Get Active Suppliers"  
  - Outputs: To "Calculate Risk Score"  
  - Edge cases: API key issues, empty news results, rate limiting.

- **Get Performance Data**  
  - Type: PostgreSQL  
  - Role: Aggregates recent supplier performance metrics over the past 30 days including average delivery score, average quality score, and count of late deliveries.  
  - Query parameterized by supplier ID.  
  - Inputs: From "Get Active Suppliers"  
  - Outputs: To "Calculate Risk Score"  
  - Edge cases: Database errors, missing performance data.

---

### 2.3 Risk Scoring Computation

**Overview:**  
Combines all collected data to compute a composite supplier risk score with weighted factors, assigns risk levels, and recommends actions.

**Nodes Involved:**  
- Calculate Risk Score

**Node Details:**

- **Calculate Risk Score**  
  - Type: Code (JavaScript)  
  - Role: Implements a weighted scoring algorithm combining financial, operational, news sentiment, geopolitical, and supplier criticality risks.  
  - Weighting scheme:  
    - Financial Risk: 35%  
    - Operational Risk: 30%  
    - News Sentiment Risk: 15%  
    - Geopolitical Risk: 10%  
    - Criticality Multiplier: 10%  
  - Key Logic Highlights:  
    - Financial risk based on credit score and payment delays.  
    - Operational risk from delivery and quality performance metrics.  
    - News risk identifies negative news articles containing keywords like bankruptcy, fraud, etc.  
    - Geopolitical risk based on supplier country classification.  
    - Criticality risk based on supplier’s criticality level.  
    - Risk levels assigned: low, medium, high, critical based on thresholds.  
    - Recommended actions mapped accordingly.  
  - Inputs: JSON objects from "Get Financial Health", "Monitor News & Events", "Get Performance Data", and supplier info.  
  - Outputs: Detailed risk score object with factors, scores, risk level, color, and recommended actions.  
  - Edge cases: Missing or malformed data, unexpected null values, runtime exceptions in code, date/time parsing errors.

---

### 2.4 Risk Level Filtering and Alerting

**Overview:**  
Routes suppliers based on computed risk levels and sends customized email alerts to appropriate recipients.

**Nodes Involved:**  
- Filter Critical Risks  
- Send Critical Alert  
- Filter High Risks  
- Send High Risk Alert  
- Filter Medium Risks  
- Send Medium Risk Alert  
- Sticky Note1 (risk response summary)

**Node Details:**

- **Filter Critical Risks**  
  - Type: IF  
  - Role: Passes only suppliers with risk_level "critical".  
  - Inputs: From "Calculate Risk Score"  
  - Outputs: To "Send Critical Alert"  
  - Edge cases: Case sensitivity or missing risk_level field.

- **Send Critical Alert**  
  - Type: Gmail  
  - Role: Sends richly formatted HTML email alert to risk manager email for critical risks.  
  - Email includes supplier details, risk breakdown, impact analysis, and immediate action steps.  
  - Subject: "🚨 CRITICAL SUPPLIER RISK ALERT - [Supplier Name]"  
  - Inputs: From "Filter Critical Risks"  
  - Credentials: Gmail OAuth2 configured before use.  
  - Edge cases: Email sending errors, invalid recipient, large email content.

- **Filter High Risks**  
  - Type: IF  
  - Role: Passes only suppliers with risk_level "high".  
  - Inputs: From "Calculate Risk Score"  
  - Outputs: To "Send High Risk Alert"  
  - Edge cases: Same as Filter Critical Risks.

- **Send High Risk Alert**  
  - Type: Gmail  
  - Role: Sends HTML email to procurement email for high-risk suppliers with summary and recommended actions.  
  - Subject: "🟠 HIGH RISK SUPPLIER ALERT - [Supplier Name]"  
  - Inputs: From "Filter High Risks"  
  - Credentials: Gmail OAuth2  
  - Edge cases: Same as above.

- **Filter Medium Risks**  
  - Type: IF  
  - Role: Passes only suppliers with risk_level "medium".  
  - Inputs: From "Calculate Risk Score"  
  - Outputs: To "Send Medium Risk Alert"  
  - Edge cases: Same as above.

- **Send Medium Risk Alert**  
  - Type: Gmail  
  - Role: Sends medium priority HTML email to procurement email recommending enhanced monitoring.  
  - Subject: "🟡 Medium Risk Supplier Update - [Supplier Name]"  
  - Inputs: From "Filter Medium Risks"  
  - Credentials: Gmail OAuth2  
  - Edge cases: Same as above.

- **Sticky Note1**  
  - Type: Sticky Note  
  - Role: Summarizes automated responses and escalation protocols for different risk levels.  
  - Content used for internal reference.

---

### 2.5 Risk Tracking

**Overview:**  
Appends supplier risk assessment results to a Google Sheet for ongoing tracking and auditing.

**Nodes Involved:**  
- Track Risk Assessment

**Node Details:**

- **Track Risk Assessment**  
  - Type: Google Sheets  
  - Role: Appends a new row to the "Supplier Risk Tracking" sheet with supplier ID, name, category, country, risk score, risk level, recommended action, and timestamp.  
  - Configuration: Uses Google Sheets credentials and document ID must be set to an existing sheet.  
  - Inputs: From "Calculate Risk Score"  
  - Edge cases: Google Sheets API rate limits, invalid document ID, permission issues.

---

### 2.6 Workflow Notes

**Overview:**  
Two sticky notes provide documentation about configuration parameters and risk management protocols.

**Nodes Involved:**  
- Sticky Note (near start)  
- Sticky Note1 (near alert nodes)

**Node Details:**

- Both nodes are non-operational documentation aids for users configuring or maintaining the workflow.

---

## 3. Summary Table

| Node Name             | Node Type            | Functional Role                         | Input Node(s)           | Output Node(s)                             | Sticky Note                                                                                             |
|-----------------------|----------------------|---------------------------------------|-------------------------|--------------------------------------------|-------------------------------------------------------------------------------------------------------|
| Daily Risk Assessment  | Schedule Trigger     | Initiates daily workflow at 6 AM      | None                    | Risk Settings                              |                                                                                                       |
| Risk Settings         | Set                  | Defines risk thresholds and emails    | Daily Risk Assessment   | Get Active Suppliers                       |                                                                                                       |
| Sticky Note           | Sticky Note          | Configuration guidance on risk params | None                    | None                                       | **Supply Chain Monitor:** Configure risk thresholds, criticality, escalation, backup priorities        |
| Get Active Suppliers  | PostgreSQL           | Retrieves active suppliers             | Risk Settings           | Get Financial Health, Monitor News & Events, Get Performance Data |                                                                                                       |
| Get Financial Health  | HTTP Request         | Retrieves supplier financial data     | Get Active Suppliers    | Calculate Risk Score                       |                                                                                                       |
| Monitor News & Events | HTTP Request         | Retrieves recent news articles         | Get Active Suppliers    | Calculate Risk Score                       |                                                                                                       |
| Get Performance Data  | PostgreSQL           | Retrieves supplier performance metrics | Get Active Suppliers    | Calculate Risk Score                       |                                                                                                       |
| Calculate Risk Score  | Code (JavaScript)    | Calculates composite risk score        | Get Financial Health, Monitor News & Events, Get Performance Data | Filter Critical Risks, Filter High Risks, Filter Medium Risks, Track Risk Assessment |                                                                                                       |
| Filter Critical Risks | IF                   | Filters suppliers with critical risk   | Calculate Risk Score    | Send Critical Alert                        |                                                                                                       |
| Send Critical Alert   | Gmail                | Sends alert email for critical risks   | Filter Critical Risks   | None                                       |                                                                                                       |
| Filter High Risks     | IF                   | Filters suppliers with high risk       | Calculate Risk Score    | Send High Risk Alert                       |                                                                                                       |
| Send High Risk Alert  | Gmail                | Sends alert email for high risks       | Filter High Risks       | None                                       |                                                                                                       |
| Filter Medium Risks   | IF                   | Filters suppliers with medium risk     | Calculate Risk Score    | Send Medium Risk Alert                     |                                                                                                       |
| Send Medium Risk Alert| Gmail                | Sends alert email for medium risks     | Filter Medium Risks     | None                                       |                                                                                                       |
| Sticky Note1          | Sticky Note          | Summarizes automated responses         | None                    | None                                       | **Risk Management:** Automated responses by risk level: emergency, immediate contact, monitoring       |
| Track Risk Assessment | Google Sheets        | Logs risk assessment to tracking sheet | Calculate Risk Score    | None                                       |                                                                                                       |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node:**  
   - Name: "Daily Risk Assessment"  
   - Type: Schedule Trigger  
   - Set Cron Expression to "0 6 * * *" for daily 6 AM trigger.

2. **Create a Set node:**  
   - Name: "Risk Settings"  
   - Define number fields:  
     - `mediumRiskThreshold` = 31  
     - `highRiskThreshold` = 61  
     - `criticalRiskThreshold` = 81  
   - Define string fields:  
     - `procurementEmail` = procurement@company.com  
     - `riskManagerEmail` = risk@company.com  
   - Connect "Daily Risk Assessment" → "Risk Settings".

3. **Create a PostgreSQL node:**  
   - Name: "Get Active Suppliers"  
   - Configure credentials for your database.  
   - Query:  
     ```sql
     SELECT supplier_id, supplier_name, category, criticality_level, last_delivery_date, quality_score, payment_terms, country FROM suppliers WHERE status = 'active'
     ```  
   - Connect "Risk Settings" → "Get Active Suppliers".

4. **Create an HTTP Request node:**  
   - Name: "Get Financial Health"  
   - Method: GET  
   - URL: `https://api.dnb.com/v1/companies/{{ $json.supplier_id }}/creditAssessment`  
   - Headers:  
     - Content-Type: application/json  
     - Authorization: Bearer token from D&B API credentials (set in n8n credentials).  
   - Connect "Get Active Suppliers" → "Get Financial Health".

5. **Create an HTTP Request node:**  
   - Name: "Monitor News & Events"  
   - Method: GET  
   - URL: `https://api.newsapi.org/v2/everything`  
   - Query Parameters:  
     - q = `{{ $json.supplier_name }}`  
     - from = Date string for 7 days ago (use expression):  
       `{{ new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0] }}`  
     - sortBy = publishedAt  
     - language = en  
   - Headers:  
     - X-API-Key: NewsAPI key from credentials  
   - Connect "Get Active Suppliers" → "Monitor News & Events".

6. **Create a PostgreSQL node:**  
   - Name: "Get Performance Data"  
   - Configure credentials same as "Get Active Suppliers".  
   - Query:  
     ```sql
     SELECT AVG(delivery_score) as avg_delivery, AVG(quality_score) as avg_quality, COUNT(late_deliveries) as late_count FROM supplier_performance WHERE supplier_id = '{{ $json.supplier_id }}' AND date >= NOW() - INTERVAL '30 days'
     ```  
   - Connect "Get Active Suppliers" → "Get Performance Data".

7. **Create a Function (Code) node:**  
   - Name: "Calculate Risk Score"  
   - Language: JavaScript  
   - Paste the provided risk scoring algorithm code that calculates a composite risk score based on financial, operational, news, geopolitical, and criticality factors and determines risk level and recommended action.  
   - Connect "Get Financial Health", "Monitor News & Events", and "Get Performance Data" all → "Calculate Risk Score" (in parallel; n8n will merge context).

8. **Create three IF nodes:**  
   - Names:  
     - "Filter Critical Risks" with condition: `{{ $json.risk_level }} == 'critical'`  
     - "Filter High Risks" with condition: `{{ $json.risk_level }} == 'high'`  
     - "Filter Medium Risks" with condition: `{{ $json.risk_level }} == 'medium'`  
   - Connect "Calculate Risk Score" → each IF node.

9. **Create three Gmail nodes:**  
   - Names and configuration:  
     - "Send Critical Alert":  
       - To: `{{ $node["Risk Settings"].json.riskManagerEmail }}`  
       - Subject: "🚨 CRITICAL SUPPLIER RISK ALERT - {{ $json.supplier_name }}"  
       - Message: Use provided rich HTML template with supplier details and action steps.  
     - "Send High Risk Alert":  
       - To: `{{ $node["Risk Settings"].json.procurementEmail }}`  
       - Subject: "🟠 HIGH RISK SUPPLIER ALERT - {{ $json.supplier_name }}"  
       - Message: Provided HTML template for high risk.  
     - "Send Medium Risk Alert":  
       - To: `{{ $node["Risk Settings"].json.procurementEmail }}`  
       - Subject: "🟡 Medium Risk Supplier Update - {{ $json.supplier_name }}"  
       - Message: Provided HTML template for medium risk.  
   - Connect each IF node’s true output to the corresponding Gmail node.  
   - Configure Gmail OAuth2 credentials before use.

10. **Create a Google Sheets node:**  
    - Name: "Track Risk Assessment"  
    - Operation: Append Row  
    - Spreadsheet: Set your Google Sheet document ID.  
    - Sheet name: "Supplier Risk Tracking"  
    - Values:  
      - `{{ $json.supplier_id }}`  
      - `{{ $json.supplier_name }}`  
      - `{{ $json.category }}`  
      - `{{ $json.country }}`  
      - `{{ $json.risk_score }}`  
      - `{{ $json.risk_level }}`  
      - `{{ $json.recommended_action }}`  
      - `{{ $json.assessed_at }}`  
    - Connect "Calculate Risk Score" → "Track Risk Assessment".

11. **Add two Sticky Note nodes for documentation:**  
    - First sticky note near the start with content about configuring risk parameters and escalation rules.  
    - Second sticky note near alert nodes summarizing automated response protocols by risk level.

---

## 5. General Notes & Resources

| Note Content                                                                                                  | Context or Link                                             |
|---------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------|
| Workflow automates supplier risk scoring integrating D&B financial data, NewsAPI monitoring, and alerts.       | Workflow purpose                                            |
| Risk thresholds and emails are configurable via the "Risk Settings" node.                                     | Configuration flexibility                                   |
| Critical risk alerts notify risk managers; high and medium risk alerts notify procurement teams.               | Alert routing logic                                         |
| Gmail nodes require OAuth2 credentials configured with sending permissions.                                    | Email sending setup                                        |
| Google Sheets node requires a valid document ID and proper permissions for appending rows.                     | Risk tracking storage                                      |
| NewsAPI and D&B API keys must be securely stored in n8n credentials.                                          | API credential management                                  |
| Negative news keywords include bankruptcy, lawsuit, recall, investigation, fraud, scandal.                    | News sentiment analysis                                    |
| Risk score weighting: Financial (35%), Operational (30%), News (15%), Geopolitical (10%), Criticality (10%).   | Risk calculation methodology                               |
| Emergency contact and procurement emails included in alert templates for immediate action.                    | Alert email design                                        |
| Cron expression for daily 6 AM trigger: `0 6 * * *`                                                           | Scheduling details                                        |

---

**Disclaimer:** The provided content is sourced exclusively from a workflow automated with n8n, respecting all applicable content policies. It contains no illegal, offensive, or protected elements. All data processed is legal and publicly available.

---