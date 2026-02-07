AWS Azure GCP Multi-Cloud Cost Monitoring & Alerts for Budget Control

https://n8nworkflows.xyz/workflows/aws-azure-gcp-multi-cloud-cost-monitoring---alerts-for-budget-control-7374


# AWS Azure GCP Multi-Cloud Cost Monitoring & Alerts for Budget Control

### 1. Workflow Overview

This workflow is designed for multi-cloud cost monitoring and alerting, targeting AWS, Azure, and GCP environments. It aims to provide budget control by fetching billing data from each cloud provider hourly, parsing and unifying the data, detecting cost spikes or budget overruns, identifying resource owners, auto-tagging affected resources, and sending alerts through multiple communication channels including Email, WhatsApp, and Slack.

The workflow is logically divided into the following blocks:

- **1.1 Trigger and Data Collection:** Initiates periodic execution and collects cost data from AWS, Azure, and GCP billing APIs.
- **1.2 Data Parsing and Normalization:** Consolidates and cleans the heterogeneous billing data into a unified format.
- **1.3 Cost Spike Detection:** Analyzes normalized data to detect significant cost anomalies or threshold breaches.
- **1.4 Owner Identification and Resource Tagging:** Determines resource ownership and applies automated tagging on affected resources.
- **1.5 Alert Dispatch:** Sends detailed cost alert notifications via Email, WhatsApp, and Slack.

---

### 2. Block-by-Block Analysis

#### 2.1 Trigger and Data Collection

**Overview:**  
This block triggers the workflow every hour and fetches the latest billing information from AWS, Azure, and GCP using their respective APIs. It handles authentication and makes HTTP POST requests to gather cost data.

**Nodes Involved:**  
- Cron Trigger  
- AWS Billing Fetch  
- Azure Billing Fetch  
- GCP Billing Fetch  

**Node Details:**

- **Cron Trigger**  
  - Type: Cron Trigger  
  - Role: Initiates the workflow execution hourly.  
  - Configuration: Default cron settings; triggers once per hour.  
  - Inputs: None  
  - Outputs: Triggers all three billing fetch nodes simultaneously.  
  - Edge Cases: Cron misconfiguration could prevent workflow runs; no retry by default.

- **AWS Billing Fetch**  
  - Type: HTTP Request  
  - Role: Fetches AWS cost and usage data via AWS Cost Explorer API.  
  - Configuration:  
    - POST request to `https://ce.us-east-1.amazonaws.com/`  
    - Headers include `X-Amz-Target: AWSInsightsIndexService.GetCostAndUsage` and content type `application/x-amz-json-1.1`  
    - Uses HTTP Basic Authentication (configured credential named "test - auth").  
    - Sends an empty body parameter array (bodyParameters is empty).  
  - Inputs: Trigger from Cron  
  - Outputs: Raw AWS billing data to Data Parser node.  
  - Edge Cases: Authentication failures, API rate limits, malformed responses.

- **Azure Billing Fetch**  
  - Type: HTTP Request  
  - Role: Retrieves cost data from Azure Cost Management API for a subscription.  
  - Configuration:  
    - POST request to `https://management.azure.com/subscriptions/{{ $vars.AZURE_SUBSCRIPTION_ID }}/providers/Microsoft.CostManagement/query?api-version=2021-10-01`  
    - Header `Content-Type: application/json`  
    - Uses OAuth1 authentication (credential "test-auth").  
    - Body parameters are empty.  
  - Inputs: Trigger from Cron  
  - Outputs: Raw Azure billing data to Data Parser node.  
  - Edge Cases: OAuth token expiration, permission issues, API throttling.

- **GCP Billing Fetch**  
  - Type: HTTP Request  
  - Role: Calls GCP Cloud Billing API to get usage data for a billing account.  
  - Configuration:  
    - GET request to `https://cloudbilling.googleapis.com/v1/billingAccounts/{{ $vars.GCP_BILLING_ACCOUNT_ID }}/services`  
    - Query parameter filter uses dynamic expressions to fetch data within the last hour based on current time.  
    - Uses OAuth1 authentication (credential "test-auth").  
  - Inputs: Trigger from Cron  
  - Outputs: Raw GCP billing data to Data Parser node.  
  - Edge Cases: OAuth token issues, API permission errors, time zone handling in filter expression.

---

#### 2.2 Data Parsing and Normalization

**Overview:**  
This block consolidates billing data from all three cloud providers into a consistent and simplified JSON structure suitable for further analysis.

**Nodes Involved:**  
- Data Parser

**Node Details:**

- **Data Parser**  
  - Type: Code (JavaScript)  
  - Role: Parses incoming billing data items and extracts relevant fields such as platform, cost, resource ID, timestamp, and owner.  
  - Configuration:  
    - Iterates over all input items from different cloud sources.  
    - Sets default values when fields are missing (e.g., platform defaults to 'unknown').  
    - Extracts cost from fields `cost` or `totalCost`.  
    - Extracts resource identifier from `resourceId` or `service`.  
    - Owner is fetched from tags or owner fields, defaulting to 'untagged'.  
    - Adds current timestamp in ISO format.  
  - Inputs: Outputs from AWS, Azure, and GCP Billing Fetch nodes.  
  - Outputs: Array of normalized cost data objects.  
  - Edge Cases: Missing or inconsistent data fields; parsing errors if input format changes.

---

#### 2.3 Cost Spike Detection

**Overview:**  
Detects cost anomalies by comparing current costs against predefined thresholds and identifies severity levels.

**Nodes Involved:**  
- Cost Spike Detector

**Node Details:**

- **Cost Spike Detector**  
  - Type: Code (JavaScript)  
  - Role: Checks each cost item against a configurable threshold and flags alerts if costs are unusually high.  
  - Configuration:  
    - Reads environment variables `COST_THRESHOLD` (default 50) and `SPIKE_MULTIPLIER` (default 2.0).  
    - Flags an alert if the cost exceeds `COST_THRESHOLD`.  
    - Severity is 'HIGH' if cost exceeds twice the threshold, otherwise 'MEDIUM'.  
    - Constructs alert objects with platform, resource ID, current cost, threshold, owner, and severity.  
  - Inputs: Normalized cost data from Data Parser.  
  - Outputs: Alert objects for further processing.  
  - Edge Cases: Missing or zero cost values; environment variables not set; false positives if thresholds are too low.

---

#### 2.4 Owner Identification and Resource Tagging

**Overview:**  
Determines if the resource owner is known or untagged, then triggers an auto-tagging process to label resources for easier follow-up.

**Nodes Involved:**  
- Owner Identifier  
- Auto-Tag Resource  

**Node Details:**

- **Owner Identifier**  
  - Type: If Node  
  - Role: Checks if the owner field is 'untagged'.  
  - Configuration:  
    - Condition: `$json.owner == 'untagged'` (case-sensitive).  
  - Inputs: Alerts from Cost Spike Detector.  
  - Outputs: Both true and false branches connect to Auto-Tag Resource node (meaning all alerts proceed to tagging).  
  - Edge Cases: Owner field missing or malformed; logic currently treats all alerts equally by tagging.

- **Auto-Tag Resource**  
  - Type: Code (JavaScript)  
  - Role: Generates platform-specific commands to tag resources with alert metadata.  
  - Configuration:  
    - Switches based on platform:  
      - AWS: Constructs AWS CLI command to create tags `CostAlert=true` and `AlertTime=current ISO time`.  
      - Azure: Constructs Azure CLI command to tag resource with same keys.  
      - GCP: Constructs gcloud CLI command to add labels for cost alert and alert time (epoch milliseconds).  
    - Outputs enriched alert object including `tagCommand`.  
  - Inputs: Alerts from Owner Identifier node.  
  - Outputs: Enriched alerts to alert sender nodes.  
  - Edge Cases: Resource ID format mismatch; CLI commands may need contextual environment to execute; tagging failures not handled here.

---

#### 2.5 Alert Dispatch

**Overview:**  
Sends the generated alerts via three communication channels: Email, WhatsApp, and Slack, including detailed cost information and the auto-tagging command for operational follow-up.

**Nodes Involved:**  
- Alert Sender On Email  
- Alert Sender On WhatsApp  
- Alert Sender On Slack  

**Node Details:**

- **Alert Sender On Email**  
  - Type: Email Send  
  - Role: Sends cost alerts as plain text emails.  
  - Configuration:  
    - Subject and body include platform, resource, cost, threshold, owner, severity, timestamp, and the tagging command.  
    - Recipient emails: `abcdef@gmail.com, xyzabc@gmail.com`  
    - From email: `abc@gmail.com`  
    - SMTP credentials named "SMTP -test" used.  
  - Inputs: Enriched alert data from Auto-Tag Resource.  
  - Outputs: None (terminal node).  
  - Edge Cases: SMTP authentication errors, email delivery failures.

- **Alert Sender On WhatsApp**  
  - Type: WhatsApp node  
  - Role: Sends alerts via WhatsApp messages.  
  - Configuration:  
    - Message body mirrors email content.  
    - Phone number ID and recipient phone numbers provided.  
    - WhatsApp API credential named "WhatsApp-test" used.  
  - Inputs: Enriched alert data from Auto-Tag Resource.  
  - Outputs: None (terminal node).  
  - Edge Cases: API rate limits, invalid phone numbers, message formatting issues.

- **Alert Sender On Slack**  
  - Type: Slack node  
  - Role: Posts alert messages to a Slack channel.  
  - Configuration:  
    - Formatted message with alert details and tagging command.  
    - Channel selected dynamically using variable `SLACK_CHANNEL_ID`.  
    - Slack API credential named "Slack account - test" used.  
  - Inputs: Enriched alert data from Auto-Tag Resource.  
  - Outputs: None (terminal node).  
  - Edge Cases: Invalid channel ID, API rate limits, permission issues.

---

### 3. Summary Table

| Node Name             | Node Type           | Functional Role                       | Input Node(s)                  | Output Node(s)                                 | Sticky Note                                                                                  |
|-----------------------|---------------------|------------------------------------|-------------------------------|-----------------------------------------------|----------------------------------------------------------------------------------------------|
| Cron Trigger          | Cron Trigger        | Starts workflow hourly              | None                          | AWS Billing Fetch, Azure Billing Fetch, GCP Billing Fetch |                                                                                              |
| AWS Billing Fetch     | HTTP Request        | Fetches AWS billing data            | Cron Trigger                  | Data Parser                                   |                                                                                              |
| Azure Billing Fetch   | HTTP Request        | Fetches Azure billing data          | Cron Trigger                  | Data Parser                                   |                                                                                              |
| GCP Billing Fetch     | HTTP Request        | Fetches GCP billing data            | Cron Trigger                  | Data Parser                                   |                                                                                              |
| Data Parser           | Code (JavaScript)   | Normalizes and merges billing data  | AWS Billing Fetch, Azure Billing Fetch, GCP Billing Fetch | Cost Spike Detector                           |                                                                                              |
| Cost Spike Detector   | Code (JavaScript)   | Detects cost anomalies/spikes       | Data Parser                   | Owner Identifier                              |                                                                                              |
| Owner Identifier      | If Node             | Checks if resource owner is untagged| Cost Spike Detector           | Auto-Tag Resource                             |                                                                                              |
| Auto-Tag Resource     | Code (JavaScript)   | Generates tagging commands for resources | Owner Identifier             | Alert Sender On Slack, Alert Sender On WhatsApp, Alert Sender On Email |                                                                                              |
| Alert Sender On Email | Email Send          | Sends alert emails                  | Auto-Tag Resource             | None                                          |                                                                                              |
| Alert Sender On WhatsApp | WhatsApp           | Sends alert WhatsApp messages       | Auto-Tag Resource             | None                                          |                                                                                              |
| Alert Sender On Slack | Slack               | Sends alert messages to Slack       | Auto-Tag Resource             | None                                          |                                                                                              |
| Sticky Note           | Sticky Note         | Explains workflow steps             | None                          | None                                          | ## **How It Works** 1. Hourly Cron Trigger; 2. AWS Billing Fetch; 3. Azure Billing Fetch; 4. GCP Billing Fetch; 5. Data Parser; 6. Cost Spike Detector; 7. Owner Identifier; 8. Auto-Tag Resource; 9. Alert Sender (Email, WhatsApp, Slack) |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Cron Trigger Node:**  
   - Type: Cron Trigger  
   - Set to execute every hour (default hourly schedule).

2. **Create AWS Billing Fetch Node:**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://ce.us-east-1.amazonaws.com/`  
   - Headers:  
     - `X-Amz-Target`: `AWSInsightsIndexService.GetCostAndUsage`  
     - `Content-Type`: `application/x-amz-json-1.1`  
   - Body: Empty parameters array.  
   - Authentication: HTTP Basic Auth credentials (set up with AWS API keys).  
   - Connect input from Cron Trigger.

3. **Create Azure Billing Fetch Node:**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://management.azure.com/subscriptions/{{ $vars.AZURE_SUBSCRIPTION_ID }}/providers/Microsoft.CostManagement/query?api-version=2021-10-01`  
   - Header: `Content-Type: application/json`  
   - Body: Empty JSON object.  
   - Authentication: OAuth1 with Azure credentials.  
   - Connect input from Cron Trigger.

4. **Create GCP Billing Fetch Node:**  
   - Type: HTTP Request  
   - Method: GET  
   - URL: `https://cloudbilling.googleapis.com/v1/billingAccounts/{{ $vars.GCP_BILLING_ACCOUNT_ID }}/services`  
   - Query Parameter:  
     - `filter`: Usage time window from one hour ago to now using dynamic expressions.  
   - Authentication: OAuth1 with GCP credentials.  
   - Connect input from Cron Trigger.

5. **Create Data Parser Node:**  
   - Type: Code (JavaScript)  
   - Paste provided JS code to iterate inputs and unify fields (platform, cost, resourceId, timestamp, owner).  
   - Connect inputs from AWS, Azure, and GCP Billing Fetch nodes.

6. **Create Cost Spike Detector Node:**  
   - Type: Code (JavaScript)  
   - Use JS code that compares costs to a threshold variable `COST_THRESHOLD` and flags alerts with severity.  
   - Connect input from Data Parser.

7. **Create Owner Identifier Node:**  
   - Type: If Node  
   - Condition: Check if `$json.owner` equals `untagged` (case sensitive).  
   - Connect input from Cost Spike Detector.

8. **Create Auto-Tag Resource Node:**  
   - Type: Code (JavaScript)  
   - Use JS code that builds CLI tag commands based on platform (AWS, Azure, GCP) with current timestamp.  
   - Connect both true and false outputs from Owner Identifier here.

9. **Create Alert Sender On Slack Node:**  
   - Type: Slack  
   - Configure with Slack API credentials.  
   - Set message text with dynamic alert details and tag command.  
   - Channel ID set dynamically via variable `SLACK_CHANNEL_ID`.  
   - Connect input from Auto-Tag Resource.

10. **Create Alert Sender On WhatsApp Node:**  
    - Type: WhatsApp  
    - Set WhatsApp API credentials.  
    - Configure phone number ID and recipient phone numbers.  
    - Message mirrors Slack content.  
    - Connect input from Auto-Tag Resource.

11. **Create Alert Sender On Email Node:**  
    - Type: Email Send  
    - Configure SMTP credentials.  
    - Set from email and multiple recipients.  
    - Email subject and body with alert details and tag command.  
    - Connect input from Auto-Tag Resource.

12. **Add Sticky Note:**  
    - Add a Sticky Note node summarizing workflow steps for documentation clarity.

---

### 5. General Notes & Resources

| Note Content                                                                                                          | Context or Link                                      |
|-----------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| Workflow fetches billing data hourly from AWS, Azure, and GCP for budget monitoring and alerting.                    | Workflow purpose                                    |
| Requires setting environment variables: `AZURE_SUBSCRIPTION_ID`, `GCP_BILLING_ACCOUNT_ID`, `COST_THRESHOLD`, `SPIKE_MULTIPLIER`, `SLACK_CHANNEL_ID`. | Configuration variables                              |
| AWS CLI, Azure CLI, and gcloud commands for tagging are generated but not executed; manual execution or automation recommended separately. | Auto-tagging commands usage                          |
| Credentials must be configured properly for AWS (HTTP Basic Auth), Azure and GCP (OAuth1), SMTP, Slack API, and WhatsApp API. | Credential setup                                    |
| Slack channel ID and phone numbers must be valid and correspond to authorized recipients for alerting.                | Alert dispatch details                               |
| Potential failure points include API authentication errors, rate limits, malformed data, and message delivery failures. | Operational considerations                           |
| Sticky note in workflow provides a stepwise explanation: https://docs.n8n.io/nodes/n8n-nodes-base.cron/ (example link) | n8n node reference                                   |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated workflow created using n8n, a tool for integration and automation. This processing strictly adheres to applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.