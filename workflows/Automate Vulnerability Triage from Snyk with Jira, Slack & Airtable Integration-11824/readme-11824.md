Automate Vulnerability Triage from Snyk with Jira, Slack & Airtable Integration

https://n8nworkflows.xyz/workflows/automate-vulnerability-triage-from-snyk-with-jira--slack---airtable-integration-11824


# Automate Vulnerability Triage from Snyk with Jira, Slack & Airtable Integration

### 1. Workflow Overview

This workflow automates the triage and tracking of software vulnerabilities discovered by Snyk, integrating with Jira for issue management, Slack for team notifications, and Airtable for record keeping. It is designed to streamline vulnerability handling by normalizing incoming data, validating required fields, classifying severity, deduplicating issues against Jira, and managing issue creation or updates accordingly.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Receives incoming vulnerability payloads via webhook from Snyk or similar sources.
- **1.2 Data Normalization & Validation:** Normalizes diverse payload formats into a consistent structure and validates essential fields.
- **1.3 Payload Verification & Alerting:** Routes valid vulnerabilities forward; sends Slack alerts for malformed payloads requiring manual review.
- **1.4 Vulnerability Classification & Key Generation:** Assigns severity labels based on CVSS scores and generates unique vulnerability keys.
- **1.5 Jira Issue Deduplication & Handling:** Checks Jira for existing issues with matching vulnerability keys, marks duplicates, and branches logic.
- **1.6 Jira Issue Update & Notification for Duplicates:** Updates existing Jira issues and notifies the team via Slack.
- **1.7 Jira Issue Creation, Notification & Airtable Logging for New Vulnerabilities:** Creates new Jira tickets, notifies the team on Slack, and logs the vulnerability in Airtable for tracking.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  Entry point of the workflow; exposes a webhook endpoint to receive vulnerability data POSTed by Snyk or other security tools.

- **Nodes Involved:**  
  - Receive Vulnerability Data

- **Node Details:**

  - **Receive Vulnerability Data**  
    - Type: Webhook  
    - Role: Receives HTTP POST requests containing vulnerability payloads.  
    - Configuration:  
      - HTTP Method: POST  
      - Path: `/snyk-vuln`  
      - Response Mode: Last node (responds after processing)  
    - Inputs: External HTTP request  
    - Outputs: Passes raw payload to next node  
    - Edge Cases: Incoming requests with unexpected or empty body; large payloads causing timeouts; malformed JSON triggering failures.  
    - Notes: This node is the workflow's trigger.

---

#### 1.2 Data Normalization & Validation

- **Overview:**  
  Converts incoming payloads from various possible schemas into a normalized array of vulnerability objects. Validates required fields (ID, title, CVSS score, package name, URL) to determine downstream processing eligibility.

- **Nodes Involved:**  
  - Normalize Vulnerability Data  
  - Validate Vulnerability Fields

- **Node Details:**

  - **Normalize Vulnerability Data**  
    - Type: Function  
    - Role: Parses incoming payload body and extracts vulnerabilities into a uniform array structure regardless of input shape.  
    - Configuration:  
      - Checks properties such as `vulnerabilities`, `issues`, `vulns`, or direct arrays.  
      - If none found, attempts to wrap single issue into array or returns empty object array.  
    - Inputs: Raw webhook body  
    - Outputs: Array of normalized vulnerability JSON objects  
    - Edge Cases: Payload missing expected arrays may produce empty or default objects; unexpected schema changes may break normalization.

  - **Validate Vulnerability Fields**  
    - Type: Code (JavaScript)  
    - Role: Extracts and validates essential vulnerability fields, enforcing data completeness and type correctness.  
    - Configuration:  
      - Extracts fields like `id`, `title`, `cvss`, `packageName`, `vulnUrl` from multiple possible keys.  
      - Converts CVSS to float, checks for non-empty strings, and boolean validity flag `isValid`.  
    - Inputs: Normalized array of vulnerabilities  
    - Outputs: Each vulnerability augmented with validation status and raw data included  
    - Edge Cases: Missing or malformed fields result in `isValid` false; numeric conversion failures for CVSS.

---

#### 1.3 Payload Verification & Alerting

- **Overview:**  
  Routes vulnerabilities based on validation status. Valid vulnerabilities proceed to classification; invalid ones trigger Slack alerts for manual intervention.

- **Nodes Involved:**  
  - Check if Vulnerability is Valid  
  - Notify Malformed Payload

- **Node Details:**

  - **Check if Vulnerability is Valid**  
    - Type: If  
    - Role: Conditional routing based on `isValid` boolean from validation.  
    - Configuration: Checks if `isValid` is true.  
    - Inputs: Validated vulnerabilities  
    - Outputs: Two branches: true (valid), false (invalid)  

  - **Notify Malformed Payload**  
    - Type: Slack  
    - Role: Sends alert message to Slack channel if payload is malformed or missing fields.  
    - Configuration:  
      - Channel: Slack channel ID `C09S57E2JQ2`  
      - Message includes raw JSON payload formatted for review.  
    - Inputs: Invalid vulnerability items  
    - Credentials: Slack API with appropriate permissions  
    - Edge Cases: Slack API errors (auth, rate limits); message formatting issues.

---

#### 1.4 Vulnerability Classification & Key Generation

- **Overview:**  
  Assigns severity labels based on CVSS scores and generates a unique key identifier for each vulnerability to support deduplication.

- **Nodes Involved:**  
  - Classify Vulnerability Severity  
  - Generate Vulnerability Key

- **Node Details:**

  - **Classify Vulnerability Severity**  
    - Type: Function  
    - Role: Maps CVSS numeric score to categorical severity labels and human-readable text.  
    - Configuration:  
      - CVSS >= 9.0 → 'CVSS-HIGHEST'/'Highest'  
      - CVSS >= 7.0 → 'CVSS-HIGH'/'High'  
      - CVSS >= 4.0 → 'CVSS-MEDIUM'/'Medium'  
      - Else → 'CVSS-LOW'/'Low'  
    - Inputs: Valid vulnerabilities  
    - Outputs: Vulnerabilities augmented with `severityLabel` and `severityText` fields  

  - **Generate Vulnerability Key**  
    - Type: Function  
    - Role: Creates a unique string key prefixed with "vuln-" based on vulnerability ID for deduplication.  
    - Configuration: Extracts ID from JSON, falls back to raw ID if needed.  
    - Inputs: Vulnerabilities with severity  
    - Outputs: Vulnerabilities augmented with `vulnKey` field  

---

#### 1.5 Jira Issue Deduplication & Handling

- **Overview:**  
  Searches Jira using JQL for existing issues matching the vulnerability key label to identify duplicates. Marks duplicates and routes accordingly.

- **Nodes Involved:**  
  - Check Existing Jira Issue  
  - Determine if Duplicate  
  - Duplicate Found?

- **Node Details:**

  - **Check Existing Jira Issue**  
    - Type: Jira  
    - Role: Queries Jira issues in project "KAN" with label matching `vulnKey` and not closed.  
    - Configuration:  
      - JQL: `project = KAN AND labels IN ("{{ $json.vulnKey }}") AND statusCategory != Done`  
      - Fields: `*all` (fetch all fields)  
      - Return All: true (fetch all matching issues)  
    - Inputs: Vulnerabilities with vulnKey  
    - Outputs: Array of Jira issues matching the vulnKey  
    - Credentials: Jira Cloud API credentials  
    - Edge Cases: Jira API errors, rate limits, or malformed JQL

  - **Determine if Duplicate**  
    - Type: Code (JavaScript)  
    - Role: Inspects Jira search output; sets `isDuplicate` flag if issue found. Embeds Jira issue data in output.  
    - Configuration:  
      - Filters out empty objects, picks first issue if multiple found.  
    - Inputs: Jira search results  
    - Outputs: Augmented vulnerability with `isDuplicate` boolean and `jira` object  

  - **Duplicate Found?**  
    - Type: If  
    - Role: Routes downstream logic based on `isDuplicate`.  
    - Configuration: Checks if `isDuplicate` is true.  
    - Inputs: Vulnerabilities with duplicate flag  
    - Outputs: Two branches: true (duplicate), false (new issue)

---

#### 1.6 Jira Issue Update & Notification for Duplicates

- **Overview:**  
  For vulnerabilities marked as duplicates, updates corresponding Jira issue with existing summary and labels, then notifies the team via Slack.

- **Nodes Involved:**  
  - Update Existing Jira Issue  
  - Notify Duplicate Update

- **Node Details:**

  - **Update Existing Jira Issue**  
    - Type: Jira  
    - Role: Updates the existing Jira issue identified by issue key with the current labels and summary to keep it fresh.  
    - Configuration:  
      - Issue Key: extracted from `$json.jira.key`  
      - Operation: Update  
      - Fields Updated: `labels` and `summary` copied from Jira issue fields to refresh data  
    - Inputs: Duplicate vulnerability items  
    - Outputs: Updated Jira issue data  
    - Credentials: Jira Cloud API credentials  
    - Edge Cases: Jira update failures, permission issues, network errors

  - **Notify Duplicate Update**  
    - Type: Slack  
    - Role: Sends Slack notification to channel with link to updated Jira issue.  
    - Configuration:  
      - Channel: Slack channel ID `C09S57E2JQ2`  
      - Message: Includes Jira issue URL dynamically constructed with issue key  
    - Inputs: Updated Jira issue data  
    - Credentials: Slack API credentials  
    - Edge Cases: Slack API errors or message formatting issues

---

#### 1.7 Jira Issue Creation, Notification & Airtable Logging for New Vulnerabilities

- **Overview:**  
  For new vulnerabilities (not duplicates), creates a new Jira ticket with detailed info, sends Slack notification, and creates a record in Airtable for further tracking.

- **Nodes Involved:**  
  - Create New Jira Vulnerability  
  - Notify New Vulnerability  
  - Create a record (Airtable)

- **Node Details:**

  - **Create New Jira Vulnerability**  
    - Type: Jira  
    - Role: Creates a new Jira issue in project "KAN" with the vulnerability details.  
    - Configuration:  
      - Project: ID `10000` (KAN)  
      - Issue Type: ID `10003` (likely Bug or Vulnerability)  
      - Summary: Includes vulnerability title and CVSS score  
      - Labels: Array containing the generated `vulnKey`  
      - Description: Multi-line text with key data fields and URL  
      - Custom Fields: Sets custom field `customfield_10035` to vulnerability ID  
    - Inputs: New vulnerability data  
    - Outputs: Created Jira issue data  
    - Credentials: Jira Cloud API credentials  
    - Edge Cases: Jira create failures due to permissions or invalid data

  - **Notify New Vulnerability**  
    - Type: Slack  
    - Role: Sends Slack alert announcing new vulnerability with details and Jira ticket link.  
    - Configuration:  
      - Channel: Slack channel ID `C09S57E2JQ2`  
      - Message: Includes title, CVSS, severity, package, Jira URL, and vulnerability URL  
    - Inputs: Created Jira issue data  
    - Credentials: Slack API credentials  
    - Edge Cases: Slack API failures

  - **Create a record (Airtable)**  
    - Type: Airtable  
    - Role: Logs vulnerability details into Airtable base and table for record keeping.  
    - Configuration:  
      - Base: `appF2iYPgVqqyXDC1` (named "n8n Demo")  
      - Table: `tblzOTBGc2PYkSM28` ("Vulnerability")  
      - Columns mapped: CVSS, Title, VulnURL, Severity, PackageName, Vulnerability key  
    - Inputs: Created Jira issue data with vulnerability fields  
    - Outputs: Airtable record creation confirmation  
    - Credentials: Airtable Personal Access Token  
    - Edge Cases: Airtable API rate limits, invalid mapping, connection errors

---

### 3. Summary Table

| Node Name                      | Node Type           | Functional Role                                  | Input Node(s)                  | Output Node(s)                    | Sticky Note                                                                                      |
|--------------------------------|---------------------|-------------------------------------------------|--------------------------------|----------------------------------|------------------------------------------------------------------------------------------------|
| Receive Vulnerability Data      | Webhook             | Entry point webhook receiving vulnerability data | -                              | Normalize Vulnerability Data      | Entry point webhook that receives vulnerability payload from Snyk or other source              |
| Normalize Vulnerability Data    | Function            | Normalizes various payload formats into array    | Receive Vulnerability Data      | Validate Vulnerability Fields     | ## Normalize & Validate Vulnerability Data Ensures all incoming vulnerability data is converted into a consistent format and checks that required fields like ID, title, CVSS, package, and URL are present and valid. |
| Validate Vulnerability Fields   | Code                | Validates essential vulnerability fields         | Normalize Vulnerability Data    | Check if Vulnerability is Valid   | (Same as above)                                                                                |
| Check if Vulnerability is Valid | If                  | Routes based on validation status                 | Validate Vulnerability Fields   | Classify Vulnerability Severity (true branch) / Notify Malformed Payload (false branch) | Valid vulnerabilities continue automatically; invalid ones require manual review.              |
| Notify Malformed Payload        | Slack               | Alerts Slack on malformed payload                  | Check if Vulnerability is Valid | -                                | Sends Slack alert if payload is missing required fields                                         |
| Classify Vulnerability Severity | Function            | Classifies CVSS score into severity categories    | Check if Vulnerability is Valid | Generate Vulnerability Key        |                                                                                               |
| Generate Vulnerability Key      | Function            | Generates unique vulnerability identifier         | Classify Vulnerability Severity | Check Existing Jira Issue         |                                                                                               |
| Check Existing Jira Issue       | Jira                | Searches Jira for existing issues with matching key | Generate Vulnerability Key      | Determine if Duplicate            |                                                                                               |
| Determine if Duplicate          | Code                | Detects if vulnerability is duplicate in Jira    | Check Existing Jira Issue       | Duplicate Found?                  |                                                                                               |
| Duplicate Found?                | If                  | Branches logic based on duplicate detection       | Determine if Duplicate          | Update Existing Jira Issue / Create New Jira Vulnerability | ## Vulnerability Deduplication & Tracking This process assigns severity labels to vulnerabilities, creates a unique key for each, checks Jira for duplicates, marks duplicates if found, and either updates existing issues or creates new ones. |
| Update Existing Jira Issue      | Jira                | Updates existing Jira ticket with current info    | Duplicate Found? (true branch) | Notify Duplicate Update           | ## Handling New Vulnerabilities When a vulnerability already exists in Jira, the system updates the existing Jira ticket with the latest details and sends a Slack message to let the team know about the update. |
| Notify Duplicate Update         | Slack               | Sends Slack message about updated duplicate issue | Update Existing Jira Issue      | -                                | (Same as above)                                                                                |
| Create New Jira Vulnerability   | Jira                | Creates new Jira issue for new vulnerability      | Duplicate Found? (false branch) | Notify New Vulnerability          | ## Handling New Vulnerabilities When a vulnerability is new, the system creates a fresh Jira ticket for it, sends a Slack message to notify the team, and saves the details in Airtable for tracking. |
| Notify New Vulnerability        | Slack               | Sends Slack notification of new vulnerability     | Create New Jira Vulnerability   | Create a record                  | (Same as above)                                                                                |
| Create a record                 | Airtable            | Logs new vulnerability data in Airtable           | Notify New Vulnerability        | -                                | (Same as above)                                                                                |
| Sticky Note                    | Sticky Note         | Informational sticky notes                          | -                              | -                                | Various detailed notes explaining workflow blocks and setup steps                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Name: `Receive Vulnerability Data`  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `snyk-vuln`  
   - Response Mode: Last node  

2. **Add Function Node to Normalize Payload**  
   - Name: `Normalize Vulnerability Data`  
   - Function Code:  
     ```javascript
     const body = $json.body || {};
     let vulns = [];
     if (Array.isArray(body.vulnerabilities)) vulns = body.vulnerabilities;
     else if (Array.isArray(body.issues)) vulns = body.issues;
     else if (Array.isArray(body.vulns)) vulns = body.vulns;
     else if (Array.isArray(body)) vulns = body;
     else if (body.issue) vulns = [body.issue];
     return (vulns.length ? vulns : [{}]).map(v => ({ json: v }));
     ```  
   - Connect output of webhook node here

3. **Add Code Node to Validate Fields**  
   - Name: `Validate Vulnerability Fields`  
   - Code (JavaScript):  
     ```javascript
     const results = [];
     for (const item of $input.all()) {
       const raw = item.json;
       const id = raw.id || raw.issueId || raw.name || '';
       const title = raw.title || raw.description || id;
       const cvssRaw = raw.cvssScore || raw.cvss || raw.cvss_score;
       const cvss = parseFloat(cvssRaw);
       const packageName = raw.package || raw.packageName || (raw.pkg && raw.pkg.name) || '';
       const vulnUrl = raw.url || raw.reference || raw.issueUrl || '';
       const isValid =
         id !== '' &&
         title !== '' &&
         !isNaN(cvss) &&
         packageName !== '' &&
         vulnUrl !== '';
       results.push({ json: { id, title, cvss, packageName, vulnUrl, raw, isValid } });
     }
     return results;
     ```  
   - Connect output of Normalize node here

4. **Add If Node to Check Validation**  
   - Name: `Check if Vulnerability is Valid`  
   - Condition: Boolean - Check if `{{$json.isValid}}` equals `true`  
   - Connect output of Validation node here

5. **Add Slack Node to Notify Malformed Payload**  
   - Name: `Notify Malformed Payload`  
   - Slack Channel: Use intended channel ID (e.g., `C09S57E2JQ2`)  
   - Message Text:  
     ```
     =*Malformed Payload Detected*
     Some required fields are missing. Manual review Required.
     ```{{$json.raw ? JSON.stringify($json.raw,null,2) : 'N/A'}}```
     ```  
   - Connect "false" branch of If node here  
   - Configure Slack credentials with valid Slack API token

6. **Add Function Node to Classify Severity**  
   - Name: `Classify Vulnerability Severity`  
   - Code:  
     ```javascript
     const cvss = Number($json.cvss);
     let severityLabel, severityText;
     if (cvss >= 9.0) { severityLabel = 'CVSS-HIGHEST'; severityText = 'Highest'; }
     else if (cvss >= 7.0) { severityLabel = 'CVSS-HIGH'; severityText = 'High'; }
     else if (cvss >= 4.0) { severityLabel = 'CVSS-MEDIUM'; severityText = 'Medium'; }
     else { severityLabel = 'CVSS-LOW'; severityText = 'Low'; }
     return [{ json: { ...$json, severityLabel, severityText } }];
     ```  
   - Connect "true" branch of validation If node here

7. **Add Function Node to Generate Vulnerability Key**  
   - Name: `Generate Vulnerability Key`  
   - Code:  
     ```javascript
     const id = $json.id || ($json.raw && $json.raw.id) || '';
     const vulnKey = id ? `vuln-${id}` : '';
     return [{ json: { ...$json, vulnKey } }];
     ```  
   - Connect output of severity classification node here

8. **Add Jira Node to Check Existing Issue**  
   - Name: `Check Existing Jira Issue`  
   - Operation: Get All Issues  
   - JQL Query:  
     ```
     project = KAN AND labels IN ("{{ $json.vulnKey }}") AND statusCategory != Done
     ```  
   - Fields: `*all`  
   - Return All: true  
   - Connect output of vulnerability key generation node here  
   - Configure Jira credentials (Jira Software Cloud API)

9. **Add Code Node to Determine Duplicate**  
   - Name: `Determine if Duplicate`  
   - Code:  
     ```javascript
     const original = $items("Generate Vulnerability Key", 0, 0).json;
     const jiraArray = Array.isArray($input.all()) ? $input.all() : [];
     const issues = jiraArray.filter(item => Object.keys(item.json).length > 0);
     const issue = issues.length > 0 ? issues[0].json : null;
     return [{
       json: {
         ...original,
         isDuplicate: issue !== null,
         jira: issue
       }
     }];
     ```  
   - Connect output of Jira search node here

10. **Add If Node to Branch on Duplicate**  
    - Name: `Duplicate Found?`  
    - Condition: Boolean - Check if `{{$json.isDuplicate}}` equals `true`  
    - Connect output of Determine if Duplicate node here

11. **Add Jira Node to Update Existing Issue**  
    - Name: `Update Existing Jira Issue`  
    - Operation: Update Issue  
    - Issue Key: `{{$json.jira.key}}`  
    - Fields to update:  
      - Labels: `{{$json.jira.fields.labels}}`  
      - Summary: `{{$json.jira.fields.summary}}`  
    - Connect "true" branch of Duplicate Found? node here  
    - Configure Jira credentials

12. **Add Slack Node to Notify Duplicate Update**  
    - Name: `Notify Duplicate Update`  
    - Channel: Slack channel ID `C09S57E2JQ2`  
    - Message:  
      ```
      =*Vulnerability Already Exists (Updated)*
      *Jira:* https://yourcompany.atlassian.net/browse/{{ $json.jira.key }}
      ```  
    - Connect output of Update Existing Jira Issue node here  
    - Configure Slack credentials

13. **Add Jira Node to Create New Vulnerability Issue**  
    - Name: `Create New Jira Vulnerability`  
    - Operation: Create Issue  
    - Project: `KAN` (ID `10000`)  
    - Issue Type: Vulnerability or Bug (ID `10003`)  
    - Summary:  
      ```
      =[VULN] {{ $('Generate Vulnerability Key').item.json.title }} (CVSS: {{ $('Generate Vulnerability Key').item.json.cvss }})
      ```  
    - Labels: Array containing `{{ $('Generate Vulnerability Key').item.json.vulnKey }}`  
    - Description:  
      ```
      Vulnerability Key: {{ $('Generate Vulnerability Key').item.json.vulnKey }}
      Vulnerability Issue: {{ $('Generate Vulnerability Key').item.json.title }}
      Severity: {{ $('Generate Vulnerability Key').item.json.severityText }}
      CVSS:{{ $('Generate Vulnerability Key').item.json.cvss }}
      URL: {{ $('Generate Vulnerability Key').item.json.raw.url }}
      ```  
    - Custom Fields: Set custom field `customfield_10035` to vulnerability ID  
    - Connect "false" branch of Duplicate Found? node here  
    - Configure Jira credentials

14. **Add Slack Node to Notify New Vulnerability**  
    - Name: `Notify New Vulnerability`  
    - Channel: Slack channel ID `C09S57E2JQ2`  
    - Message:  
      ```
      =*New Vulnerability Created*
      *Title:* {{ $('Classify Vulnerability Severity').item.json.title }}
      *CVSS:* {{ $('Classify Vulnerability Severity').item.json.cvss }}
      *Severity:* {{ $('Classify Vulnerability Severity').item.json.severityText }}
      *Package:* {{ $('Classify Vulnerability Severity').item.json.packageName }}
      *Jira:* https://mycompany.atlassian.net/browse/{{$node["Create New Jira Vulnerability"].json.key}}
      *Details:* {{ $('Classify Vulnerability Severity').item.json.vulnUrl }}
      ```  
    - Connect output of Jira issue creation node here  
    - Configure Slack credentials

15. **Add Airtable Node to Create Record**  
    - Name: `Create a record`  
    - Operation: Create  
    - Base: `appF2iYPgVqqyXDC1` (n8n Demo)  
    - Table: `tblzOTBGc2PYkSM28` (Vulnerability)  
    - Columns Map:  
      - CVSS: `{{ $('Generate Vulnerability Key').item.json.cvss }}`  
      - Title: `{{ $('Generate Vulnerability Key').item.json.title }}`  
      - VulnURL: `{{ $('Generate Vulnerability Key').item.json.vulnUrl }}`  
      - Severity: `{{ $('Generate Vulnerability Key').item.json.severityText }}`  
      - PackageName: `{{ $('Generate Vulnerability Key').item.json.packageName }}`  
      - Vulnerability key: `{{ $('Generate Vulnerability Key').item.json.vulnKey }}`  
    - Connect output of Slack notification for new vulnerability here  
    - Configure Airtable Personal Access Token credentials

16. **Activate Workflow**  
    - Test with sample payloads for both valid and invalid cases  
    - Verify Jira issues created or updated accordingly, Slack notifications sent, and Airtable records created  
    - Enable webhook URL in Snyk or source system

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                 | Context or Link                                                                                       |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| This workflow fully automates vulnerability triage by integrating Snyk findings with Jira issue tracking, Slack alerting, and Airtable logging. It reduces manual effort and improves visibility into security issues.                                                                                                                                                                        | Workflow purpose and integration summary                                                            |
| Setup requires configuring Jira project and issue type IDs, Slack channel IDs, and Airtable base/table IDs with appropriate API tokens and permissions.                                                                                                                                                                                                                                      | Setup instructions                                                                                   |
| Slack alert channels used: `C09S57E2JQ2`. Jira project key used: `KAN`. Modify as needed for your environment.                                                                                                                                                                                                                                                                                 | Configuration context                                                                                |
| Custom Jira field `customfield_10035` is used to store vulnerability ID; adjust to your Jira instance custom field IDs as needed.                                                                                                                                                                                                                                                             | Jira customization                                                                                   |
| Severity classification is based on CVSS v3 scores; adjust thresholds in the `Classify Vulnerability Severity` function if different criteria are required.                                                                                                                                                                                                                                    | Severity logic                                                                                      |
| Slack messages include formatted JSON snippets and direct links to Jira tickets for effective team communication.                                                                                                                                                                                                                                                                              | Slack alert formatting                                                                               |
| Airtable is used as a supplementary tracking database; ensure Airtable API token has write access to the configured base and table.                                                                                                                                                                                                                                                           | Airtable integration                                                                                |
| Test the workflow with both new and duplicate payloads to verify correct branching and error handling.                                                                                                                                                                                                                                                                                         | Testing advice                                                                                      |
| Sticky notes embedded in the workflow provide detailed explanations and setup steps to assist maintainers.                                                                                                                                                                                                                                                                                      | Documentation embedded in workflow                                                                  |

---

**Disclaimer:** The text provided is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This process strictly complies with all applicable content policies and contains no illegal, offensive, or protected material. All data processed is legal and public.