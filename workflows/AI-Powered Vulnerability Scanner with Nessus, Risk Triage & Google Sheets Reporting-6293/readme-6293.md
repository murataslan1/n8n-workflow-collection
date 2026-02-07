AI-Powered Vulnerability Scanner with Nessus, Risk Triage & Google Sheets Reporting

https://n8nworkflows.xyz/workflows/ai-powered-vulnerability-scanner-with-nessus--risk-triage---google-sheets-reporting-6293


# AI-Powered Vulnerability Scanner with Nessus, Risk Triage & Google Sheets Reporting

### 1. Workflow Overview

This workflow, titled **AI-Powered Vulnerability Scanner with Nessus, Risk Triage & Google Sheets Reporting**, automates vulnerability scanning using the Nessus API, applies AI-driven risk evaluation and triage, generates alerts for critical vulnerabilities, and exports summarized results to Google Sheets with email reporting. It is designed for security teams to enhance their vulnerability management process with AI risk scoring, structured triage, and compliance-aligned reporting.

The workflow logically divides into these blocks:

- **1.1 Trigger & Authentication:** Scheduled trigger initiates the scan and authenticates to the Nessus API.
- **1.2 Discovery Phase:** Initializes network segments and discovers assets in scope.
- **1.3 AI Processing:** Processes asset data and prepares it for scanning.
- **1.4 Scanning Phase:** Splits assets, runs Nessus scans, and processes vulnerability findings.
- **1.5 AI Risk Evaluation & Triage:** Applies AI logic to evaluate risk scores and categorize vulnerabilities.
- **1.6 Alerting:** Triggers alerts for critical vulnerabilities based on risk evaluation.
- **1.7 Reporting & Export:** Generates summary reports, emails them, and saves data to Google Sheets.
- **1.8 Error Handling:** Captures errors, sanitizes messages, logs them to Google Sheets, and manages failure flow.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger & Authentication

- **Overview:** Initiates workflow on a scheduled basis and logs into Nessus to obtain an API session token.
- **Nodes Involved:**  
  - `⏱️ Trigger – Scheduled Scan`  
  - `🔐 AUTH – Login to Nessus`  
  - `🔐 AUTH – Set API Token`

- **Node Details:**

  - **⏱️ Trigger – Scheduled Scan**  
    - *Type:* Schedule Trigger  
    - *Role:* Triggers workflow daily at 07:00 AM (Australia/Sydney timezone) using a cron expression.  
    - *Input/Output:* No input; outputs trigger event to Login node.  
    - *Failures:* Cron misconfiguration or scheduler downtime.

  - **🔐 AUTH – Login to Nessus**  
    - *Type:* HTTP Request  
    - *Role:* Authenticates to Nessus API using username and password from environment variables.  
    - *Configuration:* POST request to `${NESSUS_API_URL}/session` with JSON body containing credentials.  
    - *Output:* Full HTTP response including headers used for session cookies.  
    - *Failures:* Auth failure, API unreachable, invalid credentials, or TLS issues (allowUnauthorizedCerts enabled).  

  - **🔐 AUTH – Set API Token**  
    - *Type:* Set Node  
    - *Role:* Extracts and stores the Nessus API session token ("X-Cookie") from the login response headers for subsequent requests.  
    - *Key Expression:* Parses `set-cookie` header to extract the token.  
    - *Failures:* Missing or malformed cookie header, parsing errors.

---

#### 1.2 Discovery Phase

- **Overview:** Prepares network segment data and discovers assets via Nessus API.
- **Nodes Involved:**  
  - `🌐 DISC – Initialize Network Segments`  
  - `🌐 DISC – Discover Assets`  
  - `🧠 AI – Process Assets`

- **Node Details:**

  - **🌐 DISC – Initialize Network Segments**  
    - *Type:* Function  
    - *Role:* Loads network segments/subnets from an environment variable `NETWORK_SEGMENTS` (JSON array) into workflow data for asset discovery.  
    - *Failures:* Invalid or empty environment variable causing empty segments.

  - **🌐 DISC – Discover Assets**  
    - *Type:* HTTP Request  
    - *Role:* Queries Nessus API endpoint `/scans` to retrieve scan and asset information.  
    - *Headers:* Uses `X-Cookie` token from previous step for authentication.  
    - *Failures:* API errors, token expiration, or network issues.

  - **🧠 AI – Process Assets**  
    - *Type:* Function  
    - *Role:* Converts raw asset data into a structured format for scanning. In this example, static asset data is returned for demonstration.  
    - *Output:* JSON array with assets including id, IP address, and hostname.  
    - *Failures:* Logic errors or empty asset arrays.

---

#### 1.3 AI Processing & Utilities

- **Overview:** Prepares the assets for scanning by splitting the asset list for iterative processing.
- **Nodes Involved:**  
  - `🔄 UTILS – Split Assets`

- **Node Details:**

  - **🔄 UTILS – Split Assets**  
    - *Type:* SplitOut  
    - *Role:* Splits the array of assets into individual items to allow per-asset scanning in parallel or sequence.  
    - *Input:* Asset list from AI processing.  
    - *Output:* Individual asset objects for scanning.  
    - *Failures:* Empty or malformed asset list.

---

#### 1.4 Scanning Phase

- **Overview:** Runs Nessus scans for each asset and processes the resulting vulnerability data.
- **Nodes Involved:**  
  - `🧪 SCAN – Run Nessus`  
  - `🔍 SCAN – Process Vulnerabilities`

- **Node Details:**

  - **🧪 SCAN – Run Nessus**  
    - *Type:* HTTP Request  
    - *Role:* Initiates a Nessus scan for each asset using its IP address or hostname.  
    - *Configuration:* POST to `/scans` with scan UUID, scan name including host info, target IP, and folder ID; launches scan immediately.  
    - *Authentication:* Uses `X-Cookie` token.  
    - *Failures:* API errors, invalid scan parameters, token issues, or API downtime.

  - **🔍 SCAN – Process Vulnerabilities**  
    - *Type:* Function  
    - *Role:* Parses scan results to extract vulnerability details. In the sample, static vulnerability data is returned.  
    - *Output:* Array of vulnerabilities with fields like ID, CVE, risk level, and associated IP.  
    - *Failures:* Parsing issues, empty or malformed scan results.

---

#### 1.5 AI Risk Evaluation & Triage

- **Overview:** Applies AI logic to assign risk scores and triage vulnerabilities into different handling groups.
- **Nodes Involved:**  
  - `🤖 AI – Risk Evaluation`  
  - `📊 AI – Triage Vulnerabilities`

- **Node Details:**

  - **🤖 AI – Risk Evaluation**  
    - *Type:* Function  
    - *Role:* Assigns AI-generated risk metrics (e.g., AI risk score, LEV score, remediation path) to vulnerabilities.  
    - *Logic:* Maps sample risk scores and paths with fallback defaults.  
    - *Output:* Enriched vulnerability objects with AI scores.  
    - *Failures:* Logic errors, empty input data.

  - **📊 AI – Triage Vulnerabilities**  
    - *Type:* Function  
    - *Role:* Categorizes vulnerabilities into three groups based on LEV score thresholds:  
      - LEV > 0.9: Expert group (Critical)  
      - LEV > 0.5: Self-managed group (High)  
      - Otherwise: Monitor group (Low)  
    - *Output:* Object containing arrays for each triage group.  
    - *Failures:* Missing LEV scores, improper input format.

---

#### 1.6 Alerting

- **Overview:** Checks if critical vulnerabilities exist and triggers alerts accordingly.
- **Nodes Involved:**  
  - `🚦 ALERT – LEV Trigger`  
  - `📧 Alert Security Team`

- **Node Details:**

  - **🚦 ALERT – LEV Trigger**  
    - *Type:* If Node  
    - *Role:* Evaluates if there are any vulnerabilities in the expert group (LEV > 0.9).  
    - *Condition:* Checks if `expert` array length is greater than zero.  
    - *Output:*  
      - True: Sends alert email.  
      - False: Proceeds to reporting.  
    - *Failures:* Expression evaluation errors or missing triage data.

  - **📧 Alert Security Team**  
    - *Type:* Email Send  
    - *Role:* Sends critical vulnerability alert email to the security team.  
    - *Configuration:* HTML email with embedded timestamp, workflow name, and alert details.  
    - *Failures:* SMTP connection issues, invalid email addresses.

---

#### 1.7 Reporting & Export

- **Overview:** Generates vulnerability assessment summary reports, emails them, and exports data to Google Sheets.
- **Nodes Involved:**  
  - `📝 REPORT – Generate Summary`  
  - `🛠️ UTILS – Field Editor`  
  - `Code`  
  - `📄 EXPORT – Save to Sheet`  
  - `Send Email`

- **Node Details:**

  - **📝 REPORT – Generate Summary**  
    - *Type:* Function  
    - *Role:* Aggregates triaged vulnerability data to compute counts per group, total findings, max LEV score, and identifies top CVE.  
    - *Output:* Summary object including email body HTML for reporting.  
    - *Failures:* Missing triage data or miscalculations.

  - **🛠️ UTILS – Field Editor**  
    - *Type:* Set Node  
    - *Role:* Formats grouped vulnerability data into an array for downstream processing/export.  
    - *Output:* Sets `groupData` field with timestamped counts for each triage group.  
    - *Failures:* Format errors or empty input.

  - **Code**  
    - *Type:* Code Node (JavaScript)  
    - *Role:* Maps `groupData` array elements into individual items for sheet appending.  
    - *Failures:* JS syntax or mapping errors.

  - **📄 EXPORT – Save to Sheet**  
    - *Type:* Google Sheets  
    - *Role:* Appends the summary report data to a Google Sheets document (sheet named "summary").  
    - *Credentials:* Uses configured Google Sheets OAuth2 credentials.  
    - *Failures:* API quota limits, credential expiration, or sheet access issues.

  - **Send Email**  
    - *Type:* Email Send  
    - *Role:* Sends the vulnerability assessment report email to the security team.  
    - *Failures:* SMTP issues as above.

---

#### 1.8 Error Handling

- **Overview:** Captures workflow errors, sanitizes sensitive information, logs errors to Google Sheets.
- **Nodes Involved:**  
  - ` ERROR – On Failure`  
  - `🛠️ UTILS – Set Grouped Data`  
  - `Code1`  
  - `📄 EXPORT – Sheet Append`

- **Node Details:**

  - ** ERROR – On Failure**  
    - *Type:* Error Trigger  
    - *Role:* Listens for workflow errors to start error processing.  
    - *Output:* Passes error info to Set Grouped Data node.  
    - *Failures:* None (this is the error handler itself).

  - **🛠️ UTILS – Set Grouped Data**  
    - *Type:* Set Node  
    - *Role:* Structures error details including timestamp, workflow name, node name, and error message.  
    - *Failures:* Missing error context.

  - **Code1**  
    - *Type:* Code Node (JavaScript)  
    - *Role:* Sanitizes error message by redacting IPs, emails, API keys, and URLs to prevent sensitive data leaks.  
    - *Failures:* Regex or string manipulation errors.

  - **📄 EXPORT – Sheet Append**  
    - *Type:* Google Sheets  
    - *Role:* Appends sanitized error log entry to an error log sheet in the same Google Sheets document.  
    - *Failures:* Same as Export node above.

---

### 3. Summary Table

| Node Name                      | Node Type            | Functional Role                         | Input Node(s)                    | Output Node(s)                      | Sticky Note                                                                                 |
|--------------------------------|----------------------|--------------------------------------|---------------------------------|-----------------------------------|---------------------------------------------------------------------------------------------|
| ⏱️ Trigger – Scheduled Scan     | Schedule Trigger     | Initiates workflow on schedule       | -                               | 🔐 AUTH – Login to Nessus          | ⏱️ Trigger – Scheduled Scan            Trigger scan daily/weekly                         |
| 🔐 AUTH – Login to Nessus        | HTTP Request        | Authenticates to Nessus API          | ⏱️ Trigger – Scheduled Scan       | 🔐 AUTH – Set API Token            | 🔐 AUTH – Login to Nessus        Login to scanner API                              |
| 🔐 AUTH – Set API Token          | Set                 | Extracts API token from login response| 🔐 AUTH – Login to Nessus         | 🌐 DISC – Initialize Network Segments | 🔐 AUTH – Set API Token                Store token securely for session                     |
| 🌐 DISC – Initialize Network Segments | Function            | Loads network segments from env var  | 🔐 AUTH – Set API Token           | 🌐 DISC – Discover Assets          | 🌐 Discovery Phase                                                                     |
| 🌐 DISC – Discover Assets        | HTTP Request        | Retrieves assets via Nessus API      | 🌐 DISC – Initialize Network Segments | 🧠 AI – Process Assets             | 🌐 Discovery Phase                                                                     |
| 🧠 AI – Process Assets           | Function            | Processes asset list for scanning    | 🌐 DISC – Discover Assets          | 🔄 UTILS – Split Assets            | 🌐 Discovery Phase                                                                     |
| 🔄 UTILS – Split Assets          | SplitOut            | Splits asset array into individual items | 🧠 AI – Process Assets             | 🧪 SCAN – Run Nessus              | 🧪 SCAN Phase                                                                         |
| 🧪 SCAN – Run Nessus             | HTTP Request        | Launches vulnerability scan          | 🔄 UTILS – Split Assets            | 🔍 SCAN – Process Vulnerabilities | 🧪 SCAN Phase                                                                         |
| 🔍 SCAN – Process Vulnerabilities| Function            | Parses vulnerability scan results    | 🧪 SCAN – Run Nessus               | 🤖 AI – Risk Evaluation           | 🧪 SCAN Phase                                                                         |
| 🤖 AI – Risk Evaluation          | Function            | Assigns AI risk scores to vulnerabilities | 🔍 SCAN – Process Vulnerabilities  | 📊 AI – Triage Vulnerabilities    | 🧠 AI Calculate Risk phase                                                             |
| 📊 AI – Triage Vulnerabilities   | Function            | Categorizes vulnerabilities by risk  | 🤖 AI – Risk Evaluation            | 🚦 ALERT – LEV Trigger, 🛠️ UTILS – Field Editor | ⚠️ RESPOND — Risk Intelligence & Alerts                                                 |
| 🚦 ALERT – LEV Trigger           | If                  | Checks for critical vulnerabilities  | 📊 AI – Triage Vulnerabilities     | 📧 Alert Security Team, 📝 REPORT – Generate Summary | ⚠️ RESPOND — Risk Intelligence & Alerts                                                 |
| 📧 Alert Security Team           | Email Send          | Sends alert email for critical issues| 🚦 ALERT – LEV Trigger (true path) | -                                 | 🚨 ALERT \n📊 REPORT phase                                                             |
| 📝 REPORT – Generate Summary     | Function            | Creates summary report and email body| 🚦 ALERT – LEV Trigger (false path) | Send Email, 📄 EXPORT – Save to Sheet | 🔁 RECOVER — Reporting & Remediation Support                                           |
| 🛠️ UTILS – Field Editor          | Set                 | Formats grouped triage data for export| 📊 AI – Triage Vulnerabilities    | Code                             | 🔁 RECOVER — Reporting & Remediation Support                                           |
| Code                           | Code                 | Splits group data array for export   | 🛠️ UTILS – Field Editor            | 📄 EXPORT – Save to Sheet         | 🔁 RECOVER — Reporting & Remediation Support                                           |
| 📄 EXPORT – Save to Sheet        | Google Sheets       | Appends summary data to Google Sheets| Code                            | -                               | 🔁 RECOVER — Reporting & Remediation Support                                           |
| Send Email                     | Email Send           | Sends vulnerability assessment email | 📝 REPORT – Generate Summary       | -                               | 🔁 RECOVER — Reporting & Remediation Support                                           |
| ERROR – On Failure               | Error Trigger       | Catches workflow errors              | -                               | 🛠️ UTILS – Set Grouped Data       | Error Handling                                                                         |
| 🛠️ UTILS – Set Grouped Data      | Set                 | Structures error information         | ERROR – On Failure                | Code1                           | Error Handling                                                                         |
| Code1                          | Code                 | Sanitizes error messages             | 🛠️ UTILS – Set Grouped Data       | 📄 EXPORT – Sheet Append          | Error Handling                                                                         |
| 📄 EXPORT – Sheet Append         | Google Sheets       | Logs sanitized error data to Sheets  | Code1                           | -                               | Error Handling                                                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Cron Expression: `0 0 7 * * *` (runs daily at 7 AM)  
   - Connect output to "Login to Nessus" node.

2. **Create HTTP Request Node: Login to Nessus**  
   - URL: `${NESSUS_API_URL}/session` (use environment variable)  
   - Method: POST  
   - Body Type: JSON  
   - Body: `{ "username": "{{ $env.NESSUS_USER }}", "password": "{{ $env.NESSUS_PASS }}" }`  
   - Enable `Allow Unauthorized Certs` if needed.  
   - Connect output to "Set API Token" node.

3. **Create Set Node: Set API Token**  
   - Create new field `X-Cookie`  
   - Value: Extract first cookie token from login response headers:  
     `={{ $('🔐 AUTH – Login to Nessus').item.headers['set-cookie'][0].split(';')[0] }}`  
   - Connect output to "Initialize Network Segments".

4. **Create Function Node: Initialize Network Segments**  
   - Code:  
     ```javascript
     const networkSegments = JSON.parse($env.NETWORK_SEGMENTS || '[]');
     return { json: { networkSegments } };
     ```  
   - Connect output to "Discover Assets".

5. **Create HTTP Request Node: Discover Assets**  
   - URL: `https://localhost:8834/scans` (adjust for your Nessus API endpoint)  
   - Method: GET (default)  
   - Headers: `X-Cookie` with value `={{ 'token=' + $('🔐 AUTH – Set API Token').item.json.body.token }}` (adjust if necessary)  
   - Enable `Allow Unauthorized Certs` if needed.  
   - Connect output to "Process Assets".

6. **Create Function Node: Process Assets**  
   - Code (example static data):  
     ```javascript
     return {
       json: {
         assets: [
           { id: "asset-001", ipAddress: "10.0.0.1", hostName: "host-a" },
           { id: "asset-002", ipAddress: "10.0.0.2", hostName: "host-b" }
         ]
       }
     };
     ```  
   - Connect output to "Split Assets".

7. **Create SplitOut Node: Split Assets**  
   - Field to split out: `assets`  
   - Connect output to "Run Nessus".

8. **Create HTTP Request Node: Run Nessus Scan**  
   - URL: `${NESSUS_API_URL}/scans`  
   - Method: POST  
   - Body Type: JSON  
   - Body:  
     ```json
     {
       "uuid": "{{ $env.NESSUS_SCAN_UUID }}",
       "settings": {
         "name": "Scan – {{ $json.hostName || $json.ipAddress }}",
         "text_targets": "{{ $json.ipAddress }}",
         "folder_id": 3,
         "launch_now": true
       }
     }
     ```  
   - Headers: `X-Cookie` from `{{ $('AUTH – Set API Token').json['X-Cookie'] }}`  
   - Enable `Allow Unauthorized Certs`.  
   - Connect output to "Process Vulnerabilities".

9. **Create Function Node: Process Vulnerabilities**  
   - Example static data:  
     ```javascript
     return {
       json: {
         vulnerabilities: [
           { id: "vuln-001", cve: "CVE-2023-1234", risk: "High", ip: "10.0.0.1" }
         ]
       }
     };
     ```  
   - Connect output to "Risk Evaluation".

10. **Create Function Node: Risk Evaluation**  
    - Code:  
      ```javascript
      const vulns = $json.vulnerabilities;
      return vulns.map((v, i) => ({
        json: {
          ...v,
          aiRisk: [6.5, 9.1][i] || 5,
          path: ["self-healing", "expert-review", "monitoring"][i % 3],
          lev: [0.93, 0.72][i] || 0.45
        }
      }));
      ```  
    - Connect output to "Triage Vulnerabilities".

11. **Create Function Node: Triage Vulnerabilities**  
    - Code:  
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
    - Connect output to "LEV Trigger" and "Field Editor".

12. **Create If Node: ALERT – LEV Trigger**  
    - Condition: Check if `{{ $json.expert && $json.expert.length > 0 }}` equals `"true"`  
    - True branch: Connect to "Alert Security Team" email node.  
    - False branch: Connect to "Generate Summary".

13. **Create Email Send Node: Alert Security Team**  
    - To: `security_team@example.com`  
    - From: `your_email@example.com`  
    - Subject: `Alert`  
    - HTML Body:  
      ```html
      <h2>🚨 Critical Vulnerability Alert!</h2>
      <p>One or more vulnerabilities with an <strong>AI Risk Score ≥ 8</strong> were detected in the latest scan.</p>
      <p>Please review them immediately in the <strong>CyberPulse</strong> report or dashboard.</p>
      <p>Triggered by: {{ $workflow.name }}<br>Timestamp: {{ new Date().toISOString() }}</p>
      <p>Stay secure,<br><em>n8n - CyberPulse Automation</em></p>
      ```  
    - Use SMTP credentials configured for your mail server.

14. **Create Function Node: Generate Summary**  
    - Code:  
      ```javascript
      const triage = $json;
      const all = [...triage.expert, ...triage.self, ...triage.monitor];
      const maxLEV = Math.max(...all.map(v => v.lev || 0));
      const topCVE = triage.expert[0]?.cve || triage.self[0]?.cve || triage.monitor[0]?.cve || "None";
      return {
        summary: {
          expert: triage.expert.length,
          self: triage.self.length,
          monitor: triage.monitor.length,
          total: all.length,
          timestamp: new Date().toISOString(),
          topCVE,
          maxLEV
        },
        emailBody: `
          <h2>🔍 Vulnerability Assessment Report</h2>
          <p><strong>📅 Timestamp:</strong> ${new Date().toISOString()}</p>
          <ul>
            <li><strong>👨‍💻 Expert Group:</strong> ${triage.expert.length}</li>
            <li><strong>🧪 Self Group:</strong> ${triage.self.length}</li>
            <li><strong>📊 Monitor Group:</strong> ${triage.monitor.length}</li>
            <li><strong>🚨 Max LEV Score:</strong> ${maxLEV}</li>
            <li><strong>💡 Top CVE:</strong> ${topCVE}</li>
          </ul>
        `
      };
      ```  
    - Connect output to "Send Email" and "Save to Sheet".

15. **Create Set Node: Field Editor**  
    - Assign field `groupData` as an array with objects containing `timestamp`, `group`, and `count` for each triage group, extracted from input JSON.  
    - Connect output to "Code".

16. **Create Code Node: Code**  
    - Code:  
      ```javascript
      return items[0].json.groupData.map(obj => ({ json: obj }));
      ```  
    - Connect output to "Save to Sheet".

17. **Create Google Sheets Node: Save to Sheet**  
    - Operation: Append  
    - Document ID and Sheet Name: Set per your Google Sheets document (e.g., summary sheet gid=0).  
    - Fields: Map `timestamp`, `self`, `expert`, `monitor`, `total`, `topCVE`, `maxLEV` from summary JSON.  
    - Credentials: Configure with Google Sheets OAuth2.  

18. **Create Email Send Node: Send Email**  
    - To: `security_team@example.com`  
    - From: `your_email@example.com`  
    - Subject: `🛡 Vulnerability Assessment report`  
    - HTML Body: `={{ $json.emailBody }}` (from summary node)  
    - Credentials: SMTP account.

19. **Create Error Trigger Node: ERROR – On Failure**  
    - Connect output to "Set Grouped Data".

20. **Create Set Node: UTILS – Set Grouped Data**  
    - Assign fields: timestamp (current ISO string), workflow name, error node name, error message.  
    - Connect output to "Code1".

21. **Create Code Node: Code1**  
    - Code:  
      ```javascript
      const msg = $json["error message"] || "";
      const sanitized = msg
        .replace(/\b\d{1,3}(\.\d{1,3}){3}\b/g, '***.***.***.***')
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]')
        .replace(/apikey=\w+/gi, 'apikey=[redacted]')
        .replace(/https:\/\/[^\s]+/g, 'https://[url]');
      return [{ json: {
        timestamp: $json["timestamp"],
        workflow: $json["workflow"],
        node: $json["node"],
        "error message": sanitized
      }}];
      ```  
    - Connect output to "Sheet Append".

22. **Create Google Sheets Node: Sheet Append**  
    - Operation: Append  
    - Document ID and Sheet Name: Point to error log sheet in same Google Sheets doc.  
    - Map fields: timestamp, workflow, node, error message.  
    - Credentials: Google Sheets OAuth2.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                  | Context or Link                                                                                              |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| Workflow structured and visually annotated to align with NIST Cybersecurity Framework (Identify, Protect, Detect, Respond, Recover) for compliance and audit readiness.                                                                                                                                                                        | Sticky notes inside workflow                                                                                 |
| LEV (Likely Exploited Vulnerabilities) metric is used to enhance risk prioritization beyond traditional EPSS, aligning with federal mandates such as BOD 22-01 and KEV compliance.                                                                                                                                                            | Sticky Note8 and Glossary (Sticky Note16)                                                                    |
| Workflow demonstrates integration with Nessus API, AI evaluation logic, automated alerting via email, and data export to Google Sheets for documentation and reporting.                                                                                                                                                                      | Overall workflow description                                                                                 |
| Error handling includes sanitization of sensitive data (IP addresses, emails, API keys, URLs) before logging to Google Sheets to comply with security best practices.                                                                                                                                                                       | Error Handling block                                                                                          |
| Google Sheets document IDs and sheet names are placeholders; replace with actual document IDs and sheet GIDs in your environment.                                                                                                                                                                                                           | Export nodes configuration                                                                                    |
| SMTP and Google Sheets credentials must be configured in n8n prior to workflow execution.                                                                                                                                                                                                                                                    | Credential references in email and Google Sheets nodes                                                       |
| For detailed NIST CSF and LEV information, review NIST CSWP 41 paper and CISA directives (BOD 22-01, KEV catalog).                                                                                                                                                                                                                           | Sticky Note14 and Sticky Note16 glossary terms                                                               |
| The workflow is designed for on-premises or secure network environments where Nessus API is accessible and environment variables for credentials and network segments are securely stored.                                                                                                                                                    | Best practices for environment variables and API security                                                   |

---

**Disclaimer:** This documentation is based exclusively on an n8n automated workflow. It complies strictly with content policies and contains no illegal or protected elements. All processed data is legal and publicly accessible.