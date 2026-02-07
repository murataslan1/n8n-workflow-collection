Add new incoming emails to a Google Sheets spreadsheet as a new row

https://n8nworkflows.xyz/workflows/add-new-incoming-emails-to-a-google-sheets-spreadsheet-as-a-new-row-3319


# Add new incoming emails to a Google Sheets spreadsheet as a new row

### 1. Workflow Overview

This workflow automates the process of capturing incoming emails from a Gmail inbox and logging key details into a Google Sheets spreadsheet as new rows. It is designed for users who want to maintain a structured, searchable record of emails without manual data entry.

**Target Use Cases:**  
- Automated email logging for customer support, sales leads, or internal tracking  
- Archiving email metadata for reporting or analysis  
- Customizable email data extraction and storage  

**Logical Blocks:**  
- **1.1 Input Reception:** Captures new incoming emails in Gmail using a trigger node.  
- **1.2 Data Storage:** Extracts relevant email details and appends them as a new row in a Google Sheets spreadsheet.  
- **1.3 Documentation:** Sticky notes provide descriptive context and instructions within the workflow.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block listens continuously for new incoming emails in the Gmail inbox and triggers the workflow when an email is received.

- **Nodes Involved:**  
  - Gmail Trigger

- **Node Details:**  

  **Gmail Trigger**  
  - Type: Trigger node for Gmail, listens for new messages.  
  - Configuration:  
    - Authentication: Uses OAuth2 credentials linked to a Google account.  
    - Trigger Event: "Message Received" (fires on new emails).  
    - Polling: Configured to poll every minute to check for new emails.  
    - Filters: No specific filters applied (listens to all incoming emails).  
  - Expressions/Variables: Outputs full email metadata including `From`, `Subject`, and `snippet` (email body preview).  
  - Input Connections: None (trigger node).  
  - Output Connections: Connects to the Google Sheets node.  
  - Version: 1.2  
  - Potential Failures:  
    - Authentication errors if OAuth2 token expires or is revoked.  
    - API rate limits or quota exceeded errors from Gmail API.  
    - Network timeouts or connectivity issues.  
  - Notes: Requires Gmail API enabled in Google Cloud Console and OAuth2 credentials properly set up.

#### 1.2 Data Storage

- **Overview:**  
  This block receives email data from the trigger and appends it as a new row in a specified Google Sheets spreadsheet, mapping key email fields to spreadsheet columns.

- **Nodes Involved:**  
  - Google Sheets

- **Node Details:**  

  **Google Sheets**  
  - Type: Google Sheets node for appending rows.  
  - Configuration:  
    - Authentication: Uses OAuth2 credentials linked to Google account.  
    - Operation: "Append Row" to add data at the end of the sheet.  
    - Document ID: Set to a specific Google Sheets document (`1o28BFBtzzsnwN01VTcfRp2BUyAFi9e-91H_b920_gJc`).  
    - Sheet Name: Uses the sheet with `gid=0` (typically the first/default sheet).  
    - Columns Mapped:  
      - "Sender Email" ← `From` field from Gmail trigger output  
      - "Subject" ← `Subject` field from Gmail trigger output  
      - "body" ← `snippet` (email body preview) from Gmail trigger output  
    - Mapping Mode: Explicitly defined columns with no type conversion.  
  - Expressions/Variables: Uses expressions like `={{ $json.From }}`, `={{ $json.Subject }}`, and `={{ $json.snippet }}` to map data.  
  - Input Connections: Receives data from Gmail Trigger node.  
  - Output Connections: None (end node).  
  - Version: 4.5  
  - Potential Failures:  
    - Authentication errors if Google Sheets OAuth2 token is invalid or expired.  
    - API quota limits or permission errors if Sheets API is not enabled or access is restricted.  
    - Data mapping errors if expected fields are missing or malformed.  
    - Spreadsheet ID or sheet name errors if the document or sheet does not exist or is renamed.  

#### 1.3 Documentation

- **Overview:**  
  Provides contextual information and instructions for users within the workflow editor.

- **Nodes Involved:**  
  - Sticky Note  
  - Sticky Note1

- **Node Details:**  

  **Sticky Note**  
  - Type: Visual note for workflow title.  
  - Content: "Add new incoming emails to a Google Sheets spreadsheet as a new row."  
  - Position: Top-left area for visibility.  

  **Sticky Note1**  
  - Type: Visual note for detailed description.  
  - Content: Describes workflow purpose, customization options, and usage scenarios.  
  - Position: Below the Gmail Trigger node for contextual relevance.  

- No inputs or outputs.  
- No version dependencies or failure modes.

---

### 3. Summary Table

| Node Name       | Node Type               | Functional Role                  | Input Node(s)   | Output Node(s) | Sticky Note                                                                                                  |
|-----------------|-------------------------|--------------------------------|-----------------|----------------|--------------------------------------------------------------------------------------------------------------|
| Gmail Trigger   | n8n-nodes-base.gmailTrigger | Listens for new incoming emails | None            | Google Sheets  | Gmail Trigger                                                                                               |
| Google Sheets   | n8n-nodes-base.googleSheets | Appends email data as new row   | Gmail Trigger   | None           |                                                                                                              |
| Sticky Note     | n8n-nodes-base.stickyNote | Workflow title note             | None            | None           | Add new incoming emails to a Google Sheets spreadsheet as a new row.                                        |
| Sticky Note1    | n8n-nodes-base.stickyNote | Workflow description note       | None            | None           | This n8n workflow automates the process of storing email details in a spreadsheet whenever a new email is received. It utilizes the Email Trigger node to detect incoming emails and then extracts the sender, subject, and email content, which are subsequently saved into a spreadsheet (e.g., Google Sheets or an Excel file). This ensures a structured record of emails for further processing, analysis, or reporting. You can customize this workflow as per your requirements, such as adding additional columns in the spreadsheet to store more details or modifying it for different use cases, like lead tracking, customer inquiries, or automated email logging. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger Node**  
   - Add a new node: Search for and select "Gmail Trigger".  
   - Under Authentication, create or select existing Google OAuth2 credentials with Gmail API enabled.  
   - Set Trigger Event to "Message Received".  
   - Leave Filters empty or configure as needed (e.g., label or sender filters).  
   - Set Polling to "Every Minute" to check for new emails regularly.  
   - Save and optionally execute to test connection.

2. **Create Google Sheets Node**  
   - Add a new node: Search for and select "Google Sheets".  
   - Under Authentication, create or select existing Google OAuth2 credentials with Sheets API enabled.  
   - Set Operation to "Append Row".  
   - Specify the Spreadsheet by entering the Document ID (e.g., `1o28BFBtzzsnwN01VTcfRp2BUyAFi9e-91H_b920_gJc`).  
   - Set Sheet Name to the target sheet (e.g., `gid=0` for the first sheet).  
   - Define Columns to map incoming data:  
     - "Sender Email" mapped to `={{ $json.From }}`  
     - "Subject" mapped to `={{ $json.Subject }}`  
     - "body" mapped to `={{ $json.snippet }}`  
   - Save and execute to verify data appends correctly.

3. **Connect Nodes**  
   - Connect the output of the Gmail Trigger node to the input of the Google Sheets node.

4. **Add Sticky Notes (Optional)**  
   - Add sticky notes for workflow title and description to improve readability and documentation inside n8n.

5. **Activate Workflow**  
   - Once tested, activate the workflow to run continuously.

---

### 5. General Notes & Resources

| Note Content                                                                                                                     | Context or Link                                                                                      |
|----------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Workflow created by WeblineIndia’s AI development team. Delivered 3500+ software projects across 25+ countries since 1999.      | https://www.weblineindia.com/ai-development.html                                                   |
| For hiring AI developers or custom automation solutions, contact WeblineIndia.                                                   | https://www.weblineindia.com/hire-ai-developers.html                                               |
| Ensure Gmail API and Google Sheets API are enabled in Google Cloud Console before authenticating OAuth2 credentials in n8n.     | Google Cloud Console API Library                                                                    |
| Customize the workflow by adding filters in Gmail Trigger or mapping additional email fields to Google Sheets columns.          | n8n Documentation on Gmail Trigger and Google Sheets nodes                                         |

---

This documentation provides a complete, structured reference for understanding, reproducing, and extending the "Add new incoming emails to a Google Sheets spreadsheet as a new row" workflow in n8n.