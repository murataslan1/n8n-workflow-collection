Automate Incident Response with Jira, Slack, Google Sheets & Drive

https://n8nworkflows.xyz/workflows/automate-incident-response-with-jira--slack--google-sheets---drive-9826


# Automate Incident Response with Jira, Slack, Google Sheets & Drive

### 1. Workflow Overview

This Incident Management Workflow automates the creation, notification, tracking, and archival of IT incidents using Jira, Slack, Google Sheets, and Google Drive. It is designed to streamline incident response by automatically creating Jira tickets, notifying on-call teams via Slack, logging incident status for monitoring, and archiving incident timelines for compliance and postmortem analysis.

The workflow’s logic is grouped into the following functional blocks:

- **1.1 Input Reception & Metadata Definition:** Manually triggered start that sets standard incident metadata.
- **1.2 Jira Ticket Creation & Validation:** Creates a Jira incident ticket and validates successful creation.
- **1.3 Data Merging & Slack Message Formatting:** Combines incident and Jira data to build a rich Slack alert.
- **1.4 Slack Notification:** Sends formatted incident alerts to the on-call Slack channel.
- **1.5 Incident Timeline Generation & Archival:** Parses Slack messages to generate a timeline report, converts it to text, archives it to Google Drive, and logs the incident in Google Sheets.
- **1.6 Error Handling:** Logs Jira ticket creation failures to a Google Sheets error log.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Metadata Definition

- **Overview:** This block initiates the workflow manually and defines the core incident metadata (service, severity, description) with static values for demonstration.
- **Nodes Involved:**  
  - `When clicking ‘Execute workflow’` (Manual Trigger)  
  - `Define Incident Metadata` (Set node)  
- **Node Details:**

  - **When clicking ‘Execute workflow’**  
    - *Type:* Manual Trigger  
    - *Role:* Starts the workflow on user command.  
    - *Config:* No parameters; simple manual activation.  
    - *Inputs:* None (trigger node).  
    - *Outputs:* Connects to `Define Incident Metadata`.  
    - *Edge Cases:* None; manual start.  
  - **Define Incident Metadata**  
    - *Type:* Set  
    - *Role:* Defines incident attributes for subsequent nodes.  
    - *Config:* Sets static values: `service` = "API", `severity` = "High", `description` = "Response time above 3s".  
    - *Inputs:* From Manual Trigger.  
    - *Outputs:* Connects to `Create Jira Incident Ticket` and `Combine Incident & Jira Data`.  
    - *Edge Cases:* In production, this node should be replaced by dynamic webhook inputs from monitoring tools. Static values may cause data inaccuracies if not updated.

---

#### 2.2 Jira Ticket Creation & Validation

- **Overview:** Creates a Jira issue for the incident and verifies successful creation to ensure reliable downstream processing.
- **Nodes Involved:**  
  - `Create Jira Incident Ticket` (Jira node)  
  - `Validate Jira Ticket Creation Success` (If node)  
  - `Log Jira Creation Failures to Error Sheet` (Google Sheets) [Error path]  
- **Node Details:**

  - **Create Jira Incident Ticket**  
    - *Type:* Jira  
    - *Role:* Creates a Jira task with incident metadata.  
    - *Config:*  
      - Project: "Resource Capacity Demo" (Project ID 10000)  
      - Issue type: Task (ID 10004)  
      - Summary formatted as `[Severity] Service - Description` using incident data  
      - Detailed description includes service, severity, description, automation timestamp  
    - *Inputs:* From `Define Incident Metadata`.  
    - *Outputs:* Connects to `Validate Jira Ticket Creation Success`.  
    - *Credentials:* Uses Jira Software Cloud API credentials.  
    - *Edge Cases:* Jira API failures due to auth errors, rate limits, invalid permissions.  
  - **Validate Jira Ticket Creation Success**  
    - *Type:* If  
    - *Role:* Checks if Jira ticket key exists to confirm ticket creation.  
    - *Config:* Condition checks if `key` field in Jira response is non-empty.  
    - *Inputs:* From `Create Jira Incident Ticket`.  
    - *Outputs:*  
      - True branch to `Combine Incident & Jira Data` (continue workflow)  
      - False branch to `Log Jira Creation Failures to Error Sheet` (error handling)  
    - *Edge Cases:* Missing or malformed Jira response, false negatives on ticket creation.  
  - **Log Jira Creation Failures to Error Sheet**  
    - *Type:* Google Sheets  
    - *Role:* Appends Jira creation failure details to an error tracking sheet.  
    - *Config:* Appends error ID and message to `error log sheet` in a Google Sheet.  
    - *Inputs:* From false branch of `Validate Jira Ticket Creation Success`.  
    - *Credentials:* Google Sheets OAuth2 credentials.  
    - *Edge Cases:* Google Sheets API errors or credential issues.

---

#### 2.3 Data Merging & Slack Message Formatting

- **Overview:** Merges incident metadata and Jira ticket data to prepare a rich, formatted Slack notification message.
- **Nodes Involved:**  
  - `Combine Incident & Jira Data` (Merge node)  
  - `Format Incident Alert for Slack` (Code node)  
- **Node Details:**

  - **Combine Incident & Jira Data**  
    - *Type:* Merge  
    - *Role:* Combines two data streams: incident metadata and Jira ticket details.  
    - *Config:* Default merge mode preserving all fields from both inputs.  
    - *Inputs:*  
      - Incident metadata from `Define Incident Metadata`.  
      - Jira ticket response from `Validate Jira Ticket Creation Success` (true branch).  
    - *Outputs:* Connects to `Format Incident Alert for Slack`.  
    - *Edge Cases:* Data conflicts or mismatches in keys.  
  - **Format Incident Alert for Slack**  
    - *Type:* Code (JavaScript)  
    - *Role:* Builds a Slack message string with incident and Jira details.  
    - *Config:*  
      - Extracts Jira key, Jira URL, service, severity, and description with fallbacks.  
      - Constructs a formatted message with emoji, bold text, clickable Jira link, and automation footer.  
    - *Inputs:* From `Combine Incident & Jira Data`.  
    - *Outputs:* Connects to `Alert On-Call Team in Slack`.  
    - *Edge Cases:* Missing or incomplete data fields, expression failures.

---

#### 2.4 Slack Notification

- **Overview:** Sends the formatted incident alert message to the designated Slack channel for on-call team notification.
- **Nodes Involved:**  
  - `Alert On-Call Team in Slack` (Slack node)  
- **Node Details:**

  - **Alert On-Call Team in Slack**  
    - *Type:* Slack  
    - *Role:* Posts incident alert message to `#oncall` Slack channel.  
    - *Config:*  
      - Uses formatted text from previous node.  
      - Channel ID set to on-call channel.  
      - Sends message via Slack API using webhook credentials.  
    - *Inputs:* From `Format Incident Alert for Slack`.  
    - *Outputs:* Connects to `Generate Incident Timeline Report`.  
    - *Credentials:* Slack API credentials.  
    - *Edge Cases:* Slack API rate limits, invalid channel ID, credential expiration.

---

#### 2.5 Incident Timeline Generation & Archival

- **Overview:** Builds a detailed timeline report from Slack message data, converts it to a text file, archives it to Google Drive, and logs the incident details in Google Sheets for tracking.
- **Nodes Involved:**  
  - `Generate Incident Timeline Report` (Code node)  
  - `Convert Timeline to Text File` (ConvertToFile node)  
  - `Archive Incident Timeline to Drive` (Google Drive node)  
  - `Log Incident to Status Tracking Sheet` (Google Sheets node)  
- **Node Details:**

  - **Generate Incident Timeline Report**  
    - *Type:* Code (JavaScript)  
    - *Role:* Parses Slack message blocks to extract incident details and constructs a formatted timeline report.  
    - *Config:*  
      - Extracts Jira key, service, severity, description, Jira link from Slack message blocks.  
      - Builds a multiline string report with header, timeline events, placeholders for postmortem checkboxes, Jira and Slack references.  
    - *Inputs:* From `Alert On-Call Team in Slack` (Slack message metadata).  
    - *Outputs:* Connects to both `Convert Timeline to Text File` and `Log Incident to Status Tracking Sheet`.  
    - *Edge Cases:* Missing or malformed Slack message blocks; parsing errors.  
  - **Convert Timeline to Text File**  
    - *Type:* ConvertToFile  
    - *Role:* Converts the timeline report string into a downloadable `.txt` file.  
    - *Config:*  
      - Source property: `report` string from previous node.  
      - Filename dynamically includes Jira key, e.g., `Incident-SCRUM-123.txt`.  
    - *Inputs:* From `Generate Incident Timeline Report`.  
    - *Outputs:* Connects to `Archive Incident Timeline to Drive`.  
    - *Edge Cases:* File conversion failures, encoding issues.  
  - **Archive Incident Timeline to Drive**  
    - *Type:* Google Drive  
    - *Role:* Uploads the incident timeline text file to a designated Google Drive folder for archival.  
    - *Config:*  
      - Filename includes ISO timestamp with colons replaced for compatibility.  
      - Uploads to folder ID representing "Incident Reports" (production folder rename recommended).  
    - *Inputs:* From `Convert Timeline to Text File`.  
    - *Outputs:* None (end of archival chain).  
    - *Credentials:* Google Drive OAuth2 credentials.  
    - *Edge Cases:* Drive API quota or permission errors.  
  - **Log Incident to Status Tracking Sheet**  
    - *Type:* Google Sheets  
    - *Role:* Appends incident metadata to a Google Sheets dashboard for status monitoring.  
    - *Config:*  
      - Appends fields: Jira Key, Service, Severity, Status ("Investigating"), Timestamp.  
      - Targets sheet named "status update" in a specific spreadsheet.  
    - *Inputs:* From `Generate Incident Timeline Report`.  
    - *Credentials:* Google Sheets OAuth2 credentials.  
    - *Edge Cases:* Sheet access errors, credential expiration.

---

#### 2.6 Error Handling

- **Overview:** Captures and logs any Jira ticket creation failures for troubleshooting and SLA maintenance.
- **Nodes Involved:**  
  - `Log Jira Creation Failures to Error Sheet` (Google Sheets node)  
- **Node Details:**  
  - *See details in section 2.2.*

---

### 3. Summary Table

| Node Name                          | Node Type          | Functional Role                                  | Input Node(s)                    | Output Node(s)                              | Sticky Note                                                                                             |
|-----------------------------------|--------------------|------------------------------------------------|---------------------------------|---------------------------------------------|-------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’  | Manual Trigger     | Starts the workflow manually                    | -                               | Define Incident Metadata                     |                                                                                                       |
| Define Incident Metadata           | Set                | Defines incident metadata                        | When clicking ‘Execute workflow’| Create Jira Incident Ticket, Combine Incident & Jira Data | ## 🏷️ Define Incident Metadata: Structures incident data with service, severity, and description.       |
| Create Jira Incident Ticket        | Jira               | Creates Jira ticket for incident                 | Define Incident Metadata         | Validate Jira Ticket Creation Success        | ## 🎫 Create Jira Incident Ticket: Automatically creates Jira task with detailed summary and description. |
| Validate Jira Ticket Creation Success | If               | Checks Jira ticket creation success              | Create Jira Incident Ticket      | Combine Incident & Jira Data (true), Log Jira Creation Failures to Error Sheet (false) | ## ✅ Validate Jira Ticket Creation Success: Verifies Jira ticket creation before proceeding.             |
| Log Jira Creation Failures to Error Sheet | Google Sheets  | Logs Jira creation failures                       | Validate Jira Ticket Creation Success (false) | -                                           | ## 📊 Log Jira Creation Failures to Error Sheet: Records Jira ticket creation failures to error tracking. |
| Combine Incident & Jira Data       | Merge              | Merges incident and Jira data                     | Define Incident Metadata, Validate Jira Ticket Creation Success (true) | Format Incident Alert for Slack            | ## 🔗 Combine Incident & Jira Data: Merges incident metadata with Jira ticket info for Slack messages.   |
| Format Incident Alert for Slack    | Code               | Builds formatted Slack alert message              | Combine Incident & Jira Data     | Alert On-Call Team in Slack                  | ## 💬 Format Incident Alert for Slack: Generates rich Slack message with incident details.                |
| Alert On-Call Team in Slack        | Slack              | Sends alert message to on-call Slack channel     | Format Incident Alert for Slack  | Generate Incident Timeline Report            | ## 📢 Alert On-Call Team in Slack: Posts incident notification to #oncall Slack channel.                  |
| Generate Incident Timeline Report  | Code               | Parses Slack message to create timeline report    | Alert On-Call Team in Slack      | Convert Timeline to Text File, Log Incident to Status Tracking Sheet | ## 📋 Generate Incident Timeline Report: Creates comprehensive incident timeline from Slack messages.     |
| Convert Timeline to Text File      | ConvertToFile       | Converts timeline report string to text file     | Generate Incident Timeline Report| Archive Incident Timeline to Drive          | ## 📄 Convert Timeline to Text File: Transforms incident timeline into downloadable .txt file.           |
| Archive Incident Timeline to Drive| Google Drive       | Archives timeline text file to Google Drive       | Convert Timeline to Text File    | -                                           | ## ☁️ Archive Incident Timeline to Drive: Saves incident timeline report to Google Drive.                |
| Log Incident to Status Tracking Sheet | Google Sheets   | Logs incident details for status tracking         | Generate Incident Timeline Report| -                                           | ## 📊 Log Incident to Status Tracking Sheet: Records incident details to centralized Google Sheets.       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger:**  
   - Add a `Manual Trigger` node named `When clicking ‘Execute workflow’`. No parameters needed.

2. **Define Incident Metadata:**  
   - Add a `Set` node named `Define Incident Metadata`.  
   - Assign three string fields:  
     - `service` = `"API"`  
     - `severity` = `"High"`  
     - `description` = `"Response time above 3s"`  
   - Connect `When clicking ‘Execute workflow’` to this node.

3. **Create Jira Incident Ticket:**  
   - Add a `Jira` node named `Create Jira Incident Ticket`.  
   - Set project to the appropriate Jira project (e.g., "Resource Capacity Demo" with ID 10000).  
   - Issue type: Task (ID 10004).  
   - Summary: `=[{{ $json["severity"] }}] {{ $json["service"] }} - {{ $json["description"] }}`  
   - Description: `=Service: {{ $json["service"] }} Severity: {{ $json["severity"] }} Description: {{ $json["description"] }} Created by: n8n Automation Time: {{ $now }}`  
   - Set Jira credentials.  
   - Connect `Define Incident Metadata` to this node.

4. **Validate Jira Ticket Creation Success:**  
   - Add an `If` node named `Validate Jira Ticket Creation Success`.  
   - Set condition: check if `key` field in input JSON is not empty (`notEmpty`).  
   - Connect `Create Jira Incident Ticket` to this node.

5. **Log Jira Creation Failures:**  
   - Add a `Google Sheets` node named `Log Jira Creation Failures to Error Sheet`.  
   - Configure to append to `error log sheet` in your Google Sheets document.  
   - Map columns: `error_id`, `error` (populate with error information from Jira response).  
   - Set Google Sheets OAuth2 credentials.  
   - Connect the false output of `Validate Jira Ticket Creation Success` to this node.

6. **Combine Incident & Jira Data:**  
   - Add a `Merge` node named `Combine Incident & Jira Data`.  
   - Connect true output of `Validate Jira Ticket Creation Success` to one input.  
   - Connect `Define Incident Metadata` to the other input.  
   - Use default merge mode.

7. **Format Incident Alert for Slack:**  
   - Add a `Code` node named `Format Incident Alert for Slack`.  
   - Paste the JavaScript code that merges data and constructs a Slack message with emoji, bold fields, Jira link, and footer.  
   - Connect `Combine Incident & Jira Data` to this node.

8. **Alert On-Call Team in Slack:**  
   - Add a `Slack` node named `Alert On-Call Team in Slack`.  
   - Set to send message text from `Format Incident Alert for Slack`.  
   - Select the `#oncall` Slack channel by channel ID.  
   - Provide Slack API credentials.  
   - Connect `Format Incident Alert for Slack` to this node.

9. **Generate Incident Timeline Report:**  
   - Add a `Code` node named `Generate Incident Timeline Report`.  
   - Paste JavaScript that parses Slack message blocks to extract incident details and creates a formatted timeline report string.  
   - Connect `Alert On-Call Team in Slack` to this node.

10. **Convert Timeline to Text File:**  
    - Add a `ConvertToFile` node named `Convert Timeline to Text File`.  
    - Set operation to `toText`.  
    - Source property: `report`.  
    - Filename: `=Incident-{{$json["jiraKey"]}}.txt`.  
    - Connect `Generate Incident Timeline Report` to this node.

11. **Archive Incident Timeline to Drive:**  
    - Add a `Google Drive` node named `Archive Incident Timeline to Drive`.  
    - Set upload name to `=Incident-Report-{{ $now.toISOString().replace(/[:]/g, "-") }}.txt`.  
    - Select appropriate Google Drive folder ID for archival.  
    - Provide Google Drive OAuth2 credentials.  
    - Connect `Convert Timeline to Text File` to this node.

12. **Log Incident to Status Tracking Sheet:**  
    - Add a `Google Sheets` node named `Log Incident to Status Tracking Sheet`.  
    - Configure to append to sheet named `status update` in your Google Sheets document.  
    - Map columns: `Jira Key`, `Service`, `Severity`, `Status` (default `"Investigating"`), `Timestamp` (current time).  
    - Provide Google Sheets OAuth2 credentials.  
    - Connect `Generate Incident Timeline Report` to this node.

Make sure all credentials (Jira, Slack, Google Sheets, Google Drive) are properly configured and tested.

---

### 5. General Notes & Resources

| Note Content                                                                                       | Context or Link                                                                                     |
|--------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Rename Google Drive folder to "Incident Reports" in production for clarity and organization.     | Archival folder for incident timeline text files.                                                 |
| Replace static `Define Incident Metadata` node with webhook input from monitoring tools such as Datadog, New Relic, PagerDuty in production. | For real-time incident data ingestion.                                                            |
| Slack channel ID `C09LGDSC6GM` corresponds to `#oncall` channel for alerting the on-call team.    | Modify if your incident response uses a different channel or direct messaging.                     |
| Jira project used is "Resource Capacity Demo" with ID 10000; adjust project and issue types per your Jira setup. | Credential and project-specific configurations must match your environment.                        |
| Workflow supports compliance requirements by creating audit trails via Google Drive archival and Google Sheets logging. | Compliance and postmortem review facilitation.                                                    |
| Error handling critical to capture Jira ticket creation failures for SLA and troubleshooting.     | Prevents silent failures and supports operational reliability.                                    |

---

**Disclaimer:**  
The text provided is exclusively derived from an automated n8n workflow designed for legal and public data integrations. It contains no illegal, offensive, or protected content. All data handled is lawful and publicly accessible.