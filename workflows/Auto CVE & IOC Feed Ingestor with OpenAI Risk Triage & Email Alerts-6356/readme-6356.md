Auto CVE & IOC Feed Ingestor with OpenAI Risk Triage & Email Alerts

https://n8nworkflows.xyz/workflows/auto-cve---ioc-feed-ingestor-with-openai-risk-triage---email-alerts-6356


# Auto CVE & IOC Feed Ingestor with OpenAI Risk Triage & Email Alerts

---

### 1. Workflow Overview

This workflow, titled **Auto CVE & IOC Feed Ingestor with OpenAI Risk Triage & Email Alerts**, automates the daily ingestion, enrichment, AI-driven risk evaluation, triage, and alerting of cybersecurity threat intelligence data. It targets security operations teams and SMEs needing automated threat feed processing aligned with compliance frameworks (ACSC Essential Eight, ISM 2024, NIST CSF, ISO/IEC 27001).

The workflow logically comprises:

- **1.1 Scheduled Threat Feed Ingestion**: Daily trigger to fetch CVE and IOC threat feeds from external sources.
- **1.2 Threat Data Merging and Structuring**: Combining CVE and IOC data into a unified format for processing.
- **1.3 AI Risk Evaluation & Triage**: Assessing risk scores and categorizing threats by severity using custom logic.
- **1.4 Alert Triggering & Notification**: Conditional triggering of alerts for critical threats, sending emails, and logging to Google Sheets.
- **1.5 Response Routing & Action Execution**: Selecting incident response playbooks based on risk, routing to notification, monitoring, or isolation actions.
- **1.6 Optional Isolation API Call**: Sending HTTP requests to isolate affected devices if critical.
- **1.7 Logging and Reporting**: Writing logs to Google Sheets and sending detailed HTML email alerts.
- **1.8 Documentation and Context**: Sticky notes providing glossary, framework integration, and workflow purpose for maintainers.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Threat Feed Ingestion

- **Overview:**  
  Triggers workflow execution at 7:00 AM daily to fetch the latest CVE and IOC feeds from specified URLs.

- **Nodes Involved:**  
  - ⏰ Cron – Daily Trigger  
  - 🌐 Get CVE Feed  
  - 🛡️ Get IOC Feed

- **Node Details:**  
  - **⏰ Cron – Daily Trigger**  
    - Type: Schedule Trigger  
    - Configured with a cron expression to run at 7:00 AM daily (Australia/Sydney timezone)  
    - Outputs trigger event to fetch feeds  
    - Failure modes: Cron misconfiguration, workflow disabled, timezone mismatch.

  - **🌐 Get CVE Feed**  
    - Type: HTTP Request  
    - Fetches CVE JSON feed from a GitHub Gist raw URL (CVE-2023-26479)  
    - Response parsed as JSON  
    - Input: Cron trigger  
    - Output: CVE feed JSON for merging  
    - Failures: Network errors, URL changes, JSON parse errors.

  - **🛡️ Get IOC Feed**  
    - Type: HTTP Request  
    - Fetches IOC feed JSON from another GitHub Gist raw URL  
    - Response parsed as JSON  
    - Input: Cron trigger  
    - Output: IOC feed JSON for merging  
    - Failures: Same as above.

---

#### 1.2 Threat Data Merging and Structuring

- **Overview:**  
  Combines CVE and IOC data streams into a single JSON object for unified risk evaluation.

- **Nodes Involved:**  
  - 🧠 Merge Threat Data  
  - 🧠Combine Threat Data

- **Node Details:**  
  - **🧠 Merge Threat Data**  
    - Type: Merge Node  
    - Merges the outputs of CVE Feed and IOC Feed nodes  
    - Inputs: CVE feed and IOC feed HTTP requests  
    - Output: Merged data streams, passed to code node  
    - Failures: Mismatch in input data, missing feeds.

  - **🧠Combine Threat Data**  
    - Type: Code Node (JavaScript)  
    - Consolidates merged data into a single JSON object with keys `cve` and `iocs`  
    - Uses `items[0]` as CVE data, `items[1].json.iocs` for IOC array (defaulting to empty array)  
    - Output: Single JSON with combined threat data  
    - Failures: Missing or malformed inputs, JS runtime errors.

---

#### 1.3 AI Risk Evaluation & Triage

- **Overview:**  
  Applies AI-driven risk scoring and triage logic to categorize vulnerabilities into criticality levels.

- **Nodes Involved:**  
  - 🧠 AI – Risk Evaluation  
  - 🧠 AI – Triage Vulnerabilities

- **Node Details:**  
  - **🧠 AI – Risk Evaluation**  
    - Type: Code Node  
    - For each input item, calculates:  
      - `aiRisk` score (hardcoded example values for demo)  
      - `path` (response path: self-healing, expert-review, monitoring)  
      - `lev` (Local Exploitability Value)  
    - Uses CVE base CVSS score if available  
    - Outputs enriched JSON with AI scores  
    - Failures: Missing CVE data, inconsistent indexing.

  - **🧠 AI – Triage Vulnerabilities**  
    - Type: Code Node  
    - Groups vulnerabilities into three triage buckets: `expert`, `self`, and `monitor`, based on LEV score thresholds:  
      - `lev > 0.9` → expert (Critical)  
      - `lev > 0.5` → self (High)  
      - else → monitor (Low)  
    - Outputs a single JSON object containing these arrays  
    - Failures: Missing LEV scores, empty inputs.

---

#### 1.4 Alert Triggering & Notification

- **Overview:**  
  Checks if critical vulnerabilities (`expert` bucket) exist and triggers alert emails and logs accordingly.

- **Nodes Involved:**  
  - 🚨 ALERT – LEV Trigger  
  - 📧 Send Alert Email  
  - Google Sheets (first instance)

- **Node Details:**  
  - **🚨 ALERT – LEV Trigger**  
    - Type: If Node  
    - Condition: Checks if `expert` array exists and has length > 0 (critical vulnerability present)  
    - Output true branch triggers email and Google Sheets logging  
    - Failures: Expression evaluation errors, missing `expert` data.

  - **📧 Send Alert Email**  
    - Type: Email Send  
    - Sends HTML email to security team with critical alert summary, including JSON formatted expert vulnerabilities  
    - SMTP credentials required  
    - Failures: SMTP auth errors, email delivery failures.

  - **Google Sheets (first instance)**  
    - Type: Google Sheets  
    - Appends critical alert info to a predefined Google Sheet (sheet id from environment variable)  
    - Writes fields like IOCs, CVE_ID, severity, LEV label, AI risk score, compliance tags  
    - OAuth2 credentials required  
    - Failures: Google API errors, auth failure, sheet access issues.

---

#### 1.5 Response Routing & Action Execution

- **Overview:**  
  Determines incident response playbook based on CVE severity and AI scores, routes to actions such as notification, monitoring, or isolation.

- **Nodes Involved:**  
  - 🧠 AI – Incident Playbook Selector  
  - Code (redundant similar logic)  
  - 🧭 Response Router  
  - Send Alert Email (second instance)  
  - Log to Google Sheet (second instance)  
  - HTTP Request (optional isolation)

- **Node Details:**  
  - **🧠 AI – Incident Playbook Selector**  
    - Type: Code Node  
    - Evaluates threat score and severity:  
      - CVSS score ≥ 9 or severity CRITICAL → playbook = "isolation"  
      - Score ≥ 6 or severity HIGH → playbook = "monitor"  
      - Else "notify" (default)  
    - Outputs JSON with response playbook and decision reason  
    - Failures: Missing scores, inconsistent severity strings.

  - **Code (redundant similar logic)**  
    - Duplicate or backup node with same logic as above  
    - Outputs same structure.

  - **🧭 Response Router**  
    - Type: Switch Node  
    - Routes based on `response.playbook`:  
      - "notify" → send alert email  
      - "monitor" → log to Google Sheets  
      - "isolation" → send HTTP request to isolate endpoint  
    - Case insensitive matching, but note a typo in "islolation" outputKey (likely a bug)  
    - Failures: Mismatched routing keys, typo causing misrouting.

  - **Send Alert Email (second instance)**  
    - Sends detailed HTML alert email with embedded CVE details, IOC table, AI risk scores, and next steps  
    - SMTP credentials required  
    - Failures: Same as above.

  - **Log to Google Sheet (second instance)**  
    - Appends logs to a Google Sheet (sheet ID from environment)  
    - No explicit sheet name provided (may default)  
    - OAuth2 credentials required  
    - Failures: Same as above.

  - **HTTP Request (optional isolation)**  
    - Sends POST request to EDR API endpoint to isolate affected device  
    - Includes device IP (first IOC value), CVE ID, severity in JSON body  
    - Headers include Authorization and Content-Type application/json (Authorization value from credentials)  
    - Failures: API auth errors, network issues, missing IOC data.

---

#### 1.6 Logging and Reporting

- **Overview:**  
  Maintains detailed logs of processed threats and sends comprehensive email alerts for daily situational awareness.

- **Nodes Involved:**  
  - Google Sheets (second instance)  
  - Send Alert Email (second instance)

- **Node Details:**  
  - Covered above; these nodes finalize logging and notification per routing decisions.

---

#### 1.7 Documentation and Context

- **Overview:**  
  Provides in-workflow documentation for maintainers, describing purpose, components, compliance, glossary, and operational notes.

- **Nodes Involved:**  
  - Sticky Note  
  - Sticky Note1  
  - Sticky Note2  
  - Sticky Note3

- **Node Details:**  
  - **Sticky Note**  
    - Content: Module purpose, version, data sources, AI components, compliance alignment, output summary, warnings about editing logic.  
    - No inputs/outputs; informational only.

  - **Sticky Note1**  
    - Content: Simplified explanation of module functions, Google Sheet roles, email alert types, optional HTTP request role.  
    - No inputs/outputs.

  - **Sticky Note2**  
    - Content: Glossary of key terms used throughout the workflow (aiRisk, LEV Score, IOC, CVE, response_action).  
    - No inputs/outputs.

  - **Sticky Note3**  
    - Content: Summary of framework integrations with ACSC Essential Eight, ISM 2024, NIST CSF, ISO/IEC 27001.  
    - No inputs/outputs.

---

### 3. Summary Table

| Node Name                 | Node Type              | Functional Role                             | Input Node(s)                         | Output Node(s)                                   | Sticky Note                                                                                     |
|---------------------------|------------------------|--------------------------------------------|-------------------------------------|-------------------------------------------------|------------------------------------------------------------------------------------------------|
| ⏰ Cron – Daily Trigger    | Schedule Trigger       | Daily workflow start trigger                | -                                   | 🌐 Get CVE Feed, 🛡️ Get IOC Feed                |                                                                                                |
| 🌐 Get CVE Feed           | HTTP Request           | Fetch CVE threat feed JSON                   | ⏰ Cron – Daily Trigger              | 🧠 Merge Threat Data                             |                                                                                                |
| 🛡️ Get IOC Feed           | HTTP Request           | Fetch IOC threat feed JSON                   | ⏰ Cron – Daily Trigger              | 🧠 Merge Threat Data                             |                                                                                                |
| 🧠 Merge Threat Data      | Merge                  | Combine CVE and IOC feeds                    | 🌐 Get CVE Feed, 🛡️ Get IOC Feed    | 🧠Combine Threat Data                            |                                                                                                |
| 🧠Combine Threat Data     | Code                   | Combine feeds into single JSON object       | 🧠 Merge Threat Data                 | 🧠 AI – Risk Evaluation                          |                                                                                                |
| 🧠 AI – Risk Evaluation   | Code                   | Compute AI risk scores and exploitability   | 🧠Combine Threat Data                | 🧠 AI – Triage Vulnerabilities, Split Out       |                                                                                                |
| 🧠 AI – Triage Vulnerabilities | Code             | Categorize vulnerabilities by LEV score     | 🧠 AI – Risk Evaluation              | 🚨 ALERT – LEV Trigger                           |                                                                                                |
| 🚨 ALERT – LEV Trigger    | If                     | Check for critical expert vulnerabilities   | 🧠 AI – Triage Vulnerabilities       | 📧 Send Alert Email, Google Sheets (first)      |                                                                                                |
| 📧 Send Alert Email       | Email Send             | Send critical alert email                     | 🚨 ALERT – LEV Trigger               | -                                               |                                                                                                |
| Google Sheets             | Google Sheets          | Log critical alerts to Google Sheets          | 🚨 ALERT – LEV Trigger               | -                                               |                                                                                                |
| Split Out                 | Split Out              | Split IOC array for individual processing    | 🧠 AI – Risk Evaluation              | 🧠 AI – Incident Playbook Selector               |                                                                                                |
| 🧠 AI – Incident Playbook Selector | Code           | Select incident response playbook based on risk | Split Out                         | Code                                            |                                                                                                |
| Code                      | Code                   | Duplicate playbook selection logic           | 🧠 AI – Incident Playbook Selector  | 🧭 Response Router                               |                                                                                                |
| 🧭 Response Router        | Switch                 | Route to notification, monitoring, or isolate | Code                              | Send Alert Email, Log to Google Sheet (second), HTTP Request |                                                                                                |
| Send Alert Email          | Email Send             | Send detailed alert email per routing         | 🧭 Response Router                  | -                                               |                                                                                                |
| Log to Google Sheet       | Google Sheets          | Log all processed threats                      | 🧭 Response Router                  | -                                               |                                                                                                |
| HTTP Request              | HTTP Request           | Optional isolation via EDR API                 | 🧭 Response Router                  | -                                               |                                                                                                |
| Sticky Note               | Sticky Note            | Workflow purpose, version, compliance notes   | -                                 | -                                               | 🛡️ CYBERPULSEBlueOps – Module 1: Threat Feed Ingestion ... Do not modify node structure without understanding data propagation and rule routing. All logic assumes LEV triage decision root. |
| Sticky Note1              | Sticky Note            | Simplified workflow explanation                | -                                 | -                                               | 🧠 What is Module 1? ... Two sheets, two emails, one optional panic button                       |
| Sticky Note2              | Sticky Note            | Glossary of key terms                           | -                                 | -                                               | 📘 Module 1 Glossary – What Each Term Means                                                    |
| Sticky Note3              | Sticky Note            | Framework integration summary                   | -                                 | -                                               | 🛡️ Framework Integration Summary – Module 1                                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create "⏰ Cron – Daily Trigger" node**  
   - Type: Schedule Trigger  
   - Set Cron expression: `0 0 7 * * *` (7 AM daily)  
   - Timezone: Australia/Sydney

2. **Create "🌐 Get CVE Feed" node**  
   - Type: HTTP Request  
   - Method: GET  
   - URL: `https://gist.githubusercontent.com/gitadta/bdcb18b2450c5561a4b69ae9327383a8/raw/d9637907229a0a7e2bd6f5a5b6b2f04e6248aac1/cve-2023-26479.json`  
   - Response format: JSON  
   - Connect from Cron Trigger output.

3. **Create "🛡️ Get IOC Feed" node**  
   - Type: HTTP Request  
   - Method: GET  
   - URL: `https://gist.githubusercontent.com/gitadta/fddb9eb942cd3494c2e187117976d430/raw/1873c10c1a375c94b8afe3eed2772045c0a66568/ioc-feed.json`  
   - Response format: JSON  
   - Connect from Cron Trigger output.

4. **Create "🧠 Merge Threat Data" node**  
   - Type: Merge  
   - Mode: Merge by position (default)  
   - Connect "🌐 Get CVE Feed" output to first input, "🛡️ Get IOC Feed" to second input.

5. **Create "🧠Combine Threat Data" node**  
   - Type: Code  
   - JavaScript code:
     ```javascript
     const cve = items[0].json;
     const iocs = items[1].json.iocs || [];
     return [{ json: { cve, iocs } }];
     ```
   - Connect output of Merge node to this node.

6. **Create "🧠 AI – Risk Evaluation" node**  
   - Type: Code  
   - JavaScript code:
     ```javascript
     const data = $input.all();
     return data.map((item, i) => {
       const baseScore = item.json.cve?.impact?.baseMetricV3?.cvssV3?.baseScore || 0;
       const aiRisk = [6.5, 9.1][i] || 5;
       const path = ["self-healing", "expert-review", "monitoring"][i % 3];
       const lev = [0.93, 0.72][i] || 0.45;
       return { json: { ...item.json, aiRisk, path, lev } };
     });
     ```
   - Connect from "🧠Combine Threat Data".

7. **Create "🧠 AI – Triage Vulnerabilities" node**  
   - Type: Code  
   - JavaScript code:
     ```javascript
     const triage = { self: [], expert: [], monitor: [] };
     const assessed = $input.all();
     for (const item of assessed) {
       const v = item.json;
       const levScore = v.lev || 0;
       if (levScore > 0.9) triage.expert.push({ ...v, levScore, levLabel: "Critical" });
       else if (levScore > 0.5) triage.self.push({ ...v, levScore, levLabel: "High" });
       else triage.monitor.push({ ...v, levScore, levLabel: "Low" });
     }
     return [{ json: triage }];
     ```
   - Connect from "🧠 AI – Risk Evaluation".

8. **Create "🚨 ALERT – LEV Trigger" node**  
   - Type: If  
   - Condition: Expression equals `true`  
   - Expression: `={{ $json.expert && $json.expert.length > 0 }}`  
   - Connect from "🧠 AI – Triage Vulnerabilities".

9. **Create "📧 Send Alert Email" node (Critical Alert)**  
   - Type: Email Send  
   - SMTP credentials configured (e.g., "SMTP account")  
   - To: `security-team@example.com`  
   - From: `security-team@example.com`  
   - Subject: "🚨 CyberPulse Alert – Critical Vulnerabilities Detected"  
   - HTML Body: Includes JSON stringified expert alerts  
   - Connect from TRUE output of "🚨 ALERT – LEV Trigger".

10. **Create first "Google Sheets" node (Critical Alerts Log)**  
    - Type: Google Sheets Append  
    - Document ID: Use environment variable `SHEET_ID`  
    - Sheet Name: "Sheet1" (`gid=0`)  
    - Map columns: CVE_ID, Severity, Score, IOCs, aiRisk_score, LEV_score, LEV_label, response_action, compliance_tags, timestamp  
    - OAuth2 credentials configured  
    - Connect from TRUE output of "🚨 ALERT – LEV Trigger" (parallel to email).

11. **Create "Split Out" node**  
    - Type: Split Out  
    - Field to split out: `iocs` (array)  
    - Connect from "🧠 AI – Risk Evaluation".

12. **Create "🧠 AI – Incident Playbook Selector" node**  
    - Type: Code  
    - JavaScript code:
      ```javascript
      const threat = $json;
      const score = threat.Score || 0;
      const severity = (threat.Severity || "").toUpperCase();

      let playbook = "notify";

      if (score >= 9 || severity === "CRITICAL") playbook = "isolation";
      else if (score >= 6 || severity === "HIGH") playbook = "monitor";

      return [{ json: { ...threat, response: { playbook, decisionReason: `Based on CVSS ${score} and severity ${severity}` } } }];
      ```
    - Connect from "Split Out".

13. **Create "Code" node (optional duplicate playbook selector)**  
    - Same code as above (can be skipped if redundancy is undesired)  
    - Connect from "🧠 AI – Incident Playbook Selector".

14. **Create "🧭 Response Router" node**  
    - Type: Switch  
    - Switch on `response.playbook` (case insensitive) with outputs:  
      - notify → Send Alert Email (second instance)  
      - monitor → Log to Google Sheet (second instance)  
      - isolation → HTTP Request (Isolation API)  
    - Connect from "Code" node.

15. **Create second "Send Alert Email" node (Detailed Alert)**  
    - SMTP credentials as above  
    - To/From: `security-team@example.com`  
    - Subject: `=🚨 Cyber Alert: {{ $json.response.playbook.toUpperCase() }} Required`  
    - Rich HTML body with CVE summary, IOC table, AI risk data, next steps, and compliance footer  
    - Connect from "notify" output of Response Router.

16. **Create second "Log to Google Sheet" node (Daily Log)**  
    - Append operation to Google Sheet with ID from environment variable  
    - No explicit sheet name set (defaults may apply)  
    - OAuth2 credentials configured  
    - Connect from "monitor" output of Response Router.

17. **Create "HTTP Request" node (EDR Isolation API call)**  
    - Method: POST  
    - URL: `https://edr-api.example.com/isolate`  
    - Headers: Authorization (from credentials), Content-Type: application/json  
    - JSON Body:  
      ```json
      {
        "device_ip": "{{ $json.iocs[0].value }}",
        "cve_id": "{{ $json.cve.cve.CVE_data_meta.ID }}",
        "severity": "{{ $json.cve.cve.impact.baseMetricV3.cvssV3.baseSeverity }}"
      }
      ```
    - Connect from "isolation" output of Response Router.

18. **Add Sticky Notes for Documentation**  
    - Add four sticky notes with provided textual content to explain module purpose, glossary, framework integration, and operational notes.

---

### 5. General Notes & Resources

| Note Content                                                                                                         | Context or Link                                                  |
|----------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------|
| 🛡️ CYBERPULSEBlueOps – Module 1: Threat Feed Ingestion. Version 1.0. Last Updated: 2025-06-04. Author: Adnan Tariq.  | Workflow purpose, compliance alignment, and operational summary |
| 🧠 Module 1 is like a security robot that wakes up every morning, reads danger news (CVEs and IOCs), evaluates risks | Simplified workflow explanation for non-technical context       |
| 📘 Module 1 Glossary explains aiRisk, LEV Score, LEV Label, response_action, IOC, CVE                               | Terminology for maintainers and operators                        |
| 🛡️ Framework Integration Summary: ACSC Essential Eight, ISM 2024, NIST CSF, ISO/IEC 27001 aligned                   | Compliance and security framework mapping                        |

---

This documentation fully describes the workflow’s structure, logic, nodes, and configurations to enable understanding, reproduction, and modification by advanced users and automation agents. The workflow is designed for daily automated threat feed ingestion, AI-based risk triage, actionable alerting, and logging with compliance alignment. Edge cases primarily involve external feed availability, API credential management, and expression correctness. The documented typo in response routing (“islolation”) should be corrected for production use.