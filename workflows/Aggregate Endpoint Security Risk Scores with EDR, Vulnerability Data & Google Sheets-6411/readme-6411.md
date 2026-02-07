Aggregate Endpoint Security Risk Scores with EDR, Vulnerability Data & Google Sheets

https://n8nworkflows.xyz/workflows/aggregate-endpoint-security-risk-scores-with-edr--vulnerability-data---google-sheets-6411


# Aggregate Endpoint Security Risk Scores with EDR, Vulnerability Data & Google Sheets

### 1. Workflow Overview

This workflow, titled **"M3 - Endpoint Risk Aggregator"**, is designed to aggregate endpoint security risk scores by collecting and combining data from multiple sources: Endpoint Detection and Response (EDR) logs, vulnerability assessment data, and File Integrity Monitoring (FIM) logs. The resulting aggregated risk scores are then stored in Google Sheets for reporting or further analysis.

The workflow executes daily, triggered by a Cron node. It consists of four main logical blocks:

- **1.1 Scheduled Trigger:** Initiates the workflow on a daily basis.
- **1.2 Data Collection:** Retrieves data from three sources — EDR logs, vulnerability data, and FIM logs — via HTTP requests.
- **1.3 Data Merging:** Combines the endpoint signals (EDR and vulnerability data) and then merges these with FIM logs to create a unified dataset.
- **1.4 Risk Calculation and Storage:** Calculates a consolidated risk score using a custom function and writes the results into a Google Sheets spreadsheet.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger

- **Overview:**  
  This block triggers the entire workflow once daily without any input parameters, ensuring regular risk data aggregation.

- **Nodes Involved:**  
  - ⏰ Cron Trigger – Daily

- **Node Details:**  
  - **Node:** ⏰ Cron Trigger – Daily  
    - **Type:** Cron Trigger  
    - **Role:** Initiates workflow execution daily at a configured time (default unspecified, likely midnight or configurable).  
    - **Configuration:** Uses default daily schedule with no additional parameters set.  
    - **Inputs:** None (trigger node).  
    - **Outputs:** Single main output connection to "🛡 Get EDR Logs".  
    - **Version Requirements:** Standard node, compatible with n8n v1 and above.  
    - **Potential Failures:** Misconfiguration of schedule; workflow may not trigger if the cron expression is invalid or time zone issues occur.  
    - **Notes:** Acts as the sole entry point for the workflow.

---

#### 2.2 Data Collection

- **Overview:**  
  Fetches raw security data from three distinct sources: EDR logs, vulnerability data, and FIM logs. Each source is retrieved via HTTP requests.

- **Nodes Involved:**  
  - 🛡 Get EDR Logs  
  - 🧬 Get Vulnerability Data  
  - 🗃 Get File Integrity Logs

- **Node Details:**  
  - **Node:** 🛡 Get EDR Logs  
    - **Type:** HTTP Request  
    - **Role:** Queries the EDR system’s API to retrieve recent endpoint detection logs.  
    - **Configuration:** Parameters not explicitly provided; likely uses credentials or tokens configured externally.  
    - **Inputs:** Triggered from Cron node output.  
    - **Outputs:** Connects to "🔀 Merge Endpoint Signals" (first input).  
    - **Potential Failures:** Network errors, authentication failures, API rate limits, or malformed responses.

  - **Node:** 🧬 Get Vulnerability Data  
    - **Type:** HTTP Request  
    - **Role:** Retrieves vulnerability assessment data relevant to endpoints, possibly from a vulnerability management platform.  
    - **Configuration:** Parameters unspecified; expects an authenticated HTTP request configured with proper tokens or API keys.  
    - **Inputs:** Triggered independently, but logically concurrent with EDR logs fetching.  
    - **Outputs:** Connects to "🔀 Merge Endpoint Signals" (second input).  
    - **Potential Failures:** Similar to EDR node—authentication, network issues, or empty data responses.

  - **Node:** 🗃 Get File Integrity Logs  
    - **Type:** HTTP Request  
    - **Role:** Obtains File Integrity Monitoring logs to detect unauthorized changes on endpoint devices.  
    - **Configuration:** Parameters not detailed; requires proper endpoint and authentication setup.  
    - **Inputs:** Not directly triggered by the Cron node but downstream after merging endpoint signals.  
    - **Outputs:** Connects to "🔀 Merge + FIM Logs" (second input).  
    - **Potential Failures:** Same as other HTTP requests; potential for delayed responses or data format inconsistencies.

---

#### 2.3 Data Merging

- **Overview:**  
  Combines distinct data sets into unified structures suitable for risk calculation. First merges EDR logs with vulnerability data, then merges that result with FIM logs.

- **Nodes Involved:**  
  - 🔀 Merge Endpoint Signals  
  - 🔀 Merge + FIM Logs

- **Node Details:**  
  - **Node:** 🔀 Merge Endpoint Signals  
    - **Type:** Merge  
    - **Role:** Combines EDR logs and vulnerability data into a single dataset for comprehensive endpoint signal aggregation.  
    - **Configuration:** Standard merge node with default mode (likely “Merge By Index” or “Merge By Key” depending on setup).  
    - **Inputs:**  
      - Input 0: From "🛡 Get EDR Logs"  
      - Input 1: From "🧬 Get Vulnerability Data"  
    - **Outputs:** Connects to "🔀 Merge + FIM Logs".  
    - **Potential Failures:** If datasets have mismatched keys or formats, merging may produce incomplete or duplicated data.

  - **Node:** 🔀 Merge + FIM Logs  
    - **Type:** Merge (version 3.1)  
    - **Role:** Merges the combined endpoint signals with File Integrity Monitoring logs to form the final dataset for risk scoring.  
    - **Configuration:** Likely uses merge mode suitable for combining datasets with overlapping keys (e.g., “Merge By Key” or “Append”).  
    - **Inputs:**  
      - Input 0: From "🔀 Merge Endpoint Signals"  
      - Input 1: From "🗃 Get File Integrity Logs"  
    - **Outputs:** Connects to "🧠 Risk Score Calculator".  
    - **Potential Failures:** Data misalignment or empty inputs may cause faulty merges or loss of data integrity.

---

#### 2.4 Risk Calculation and Storage

- **Overview:**  
  Calculates consolidated endpoint risk scores using a custom function node and writes the results to a Google Sheets spreadsheet for tracking and reporting.

- **Nodes Involved:**  
  - 🧠 Risk Score Calculator  
  - Google Sheets

- **Node Details:**  
  - **Node:** 🧠 Risk Score Calculator  
    - **Type:** Function  
    - **Role:** Executes JavaScript code to compute risk scores based on the merged security data inputs.  
    - **Configuration:** Contains custom logic (not explicitly shown) to weigh and aggregate signals into a numeric risk score.  
    - **Inputs:** From "🔀 Merge + FIM Logs".  
    - **Outputs:** Connects to "Google Sheets".  
    - **Potential Failures:** Function errors if input data structure changes, runtime exceptions, or mathematical errors (e.g., divide by zero).  
    - **Version Requirements:** Standard function node, compatible with n8n v1+.  
    - **Notes:** Critical node for transforming raw data into actionable metrics.

  - **Node:** Google Sheets  
    - **Type:** Google Sheets  
    - **Role:** Writes the calculated risk scores into a specified Google Sheets document for persistent storage and access.  
    - **Configuration:** Requires configured Google OAuth2 credentials with permission to edit the target spreadsheet; parameters to specify spreadsheet ID, sheet name, and data range.  
    - **Inputs:** From "🧠 Risk Score Calculator".  
    - **Outputs:** None (terminal node).  
    - **Potential Failures:** Authentication errors, API quota limits, spreadsheet permissions, or data formatting issues.

---

### 3. Summary Table

| Node Name                  | Node Type         | Functional Role                           | Input Node(s)                | Output Node(s)              | Sticky Note |
|----------------------------|-------------------|-----------------------------------------|-----------------------------|-----------------------------|-------------|
| ⏰ Cron Trigger – Daily     | Cron Trigger      | Initiates workflow daily                 | None                        | 🛡 Get EDR Logs              |             |
| 🛡 Get EDR Logs             | HTTP Request      | Fetches EDR logs                        | ⏰ Cron Trigger – Daily      | 🔀 Merge Endpoint Signals    |             |
| 🧬 Get Vulnerability Data   | HTTP Request      | Fetches vulnerability data              | None (parallel)             | 🔀 Merge Endpoint Signals    |             |
| 🔀 Merge Endpoint Signals   | Merge             | Merges EDR logs and vulnerability data | 🛡 Get EDR Logs, 🧬 Get Vulnerability Data | 🔀 Merge + FIM Logs          |             |
| 🗃 Get File Integrity Logs  | HTTP Request      | Fetches File Integrity Monitoring logs  | None (parallel)             | 🔀 Merge + FIM Logs          |             |
| 🔀 Merge + FIM Logs         | Merge (v3.1)      | Merges endpoint signals with FIM logs   | 🔀 Merge Endpoint Signals, 🗃 Get File Integrity Logs | 🧠 Risk Score Calculator     |             |
| 🧠 Risk Score Calculator    | Function          | Calculates consolidated risk scores     | 🔀 Merge + FIM Logs          | Google Sheets               |             |
| Google Sheets              | Google Sheets     | Writes risk scores to a spreadsheet     | 🧠 Risk Score Calculator     | None                        |             |
| Sticky Note                | Sticky Note       | (Empty content)                          | None                        | None                        |             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Cron Trigger Node**  
   - Add a **Cron Trigger** node named "⏰ Cron Trigger – Daily".  
   - Configure to run once daily at the desired time (default: every 24 hours).  
   - No additional credentials required.

2. **Create HTTP Request Node for EDR Logs**  
   - Add an **HTTP Request** node named "🛡 Get EDR Logs".  
   - Configure the HTTP method, URL, headers, and authentication needed to call the EDR API.  
   - Connect output of "⏰ Cron Trigger – Daily" to this node’s input.

3. **Create HTTP Request Node for Vulnerability Data**  
   - Add an **HTTP Request** node named "🧬 Get Vulnerability Data".  
   - Configure similarly to connect to the vulnerability management API with proper credentials.  
   - This node runs independently, so no direct input connection necessary from the trigger.

4. **Create Merge Node for Endpoint Signals**  
   - Add a **Merge** node named "🔀 Merge Endpoint Signals".  
   - Connect "🛡 Get EDR Logs" to input 0, and "🧬 Get Vulnerability Data" to input 1.  
   - Use an appropriate merge mode (e.g., "Merge By Key") based on common identifiers in the data.

5. **Create HTTP Request Node for File Integrity Logs**  
   - Add an **HTTP Request** node named "🗃 Get File Integrity Logs".  
   - Configure to call the File Integrity Monitoring API with necessary credentials.  
   - Runs independently; no direct input from trigger.

6. **Create Merge Node to Combine with FIM Logs**  
   - Add a **Merge** node (version 3.1) named "🔀 Merge + FIM Logs".  
   - Connect "🔀 Merge Endpoint Signals" to input 0 and "🗃 Get File Integrity Logs" to input 1.  
   - Use an appropriate merge mode to combine datasets.

7. **Create Function Node for Risk Calculation**  
   - Add a **Function** node named "🧠 Risk Score Calculator".  
   - Implement JavaScript code that processes the merged dataset and computes a risk score per endpoint.  
   - Connect "🔀 Merge + FIM Logs" output to this node.

8. **Create Google Sheets Node for Output**  
   - Add a **Google Sheets** node named "Google Sheets".  
   - Configure with Google OAuth2 credentials allowing write access.  
   - Specify target spreadsheet ID, sheet name, and data range for inserting risk scores.  
   - Connect "🧠 Risk Score Calculator" output to this node.

9. **Verify All Connections and Parameters**  
   - Ensure all nodes are connected as per the dependencies:  
     - Cron Trigger → Get EDR Logs → Merge Endpoint Signals  
     - Merge Endpoint Signals → Merge + FIM Logs  
     - Get Vulnerability Data → Merge Endpoint Signals  
     - Get File Integrity Logs → Merge + FIM Logs  
     - Merge + FIM Logs → Risk Score Calculator → Google Sheets  

10. **Test Workflow**  
    - Run manually to verify data retrieval, merging, processing, and storage.  
    - Monitor for errors such as HTTP request failures or function exceptions and adjust configurations accordingly.

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                |
|----------------------------------------------------------------------------------------------------|-----------------------------------------------|
| The workflow requires properly configured API credentials for EDR, vulnerability management, FIM, and Google Sheets. | Credential setup in n8n for HTTP and Google Sheets nodes. |
| Ensure consistent data formats and keys across APIs to enable accurate merging of endpoint signals. | Important for merge nodes to function correctly. |
| Google Sheets node requires OAuth2 credentials with permission to edit the specified spreadsheet. | n8n Docs: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googlesheets/ |
| Testing with sample data before full deployment is recommended to verify the risk scoring logic.  | Custom function node is critical and should be validated. |

---

**Disclaimer:** This document is based exclusively on an automated n8n workflow export. All data manipulations comply with content policies and handle only legal and public information.