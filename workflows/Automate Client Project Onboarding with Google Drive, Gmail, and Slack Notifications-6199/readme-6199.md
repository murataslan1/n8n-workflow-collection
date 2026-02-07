Automate Client Project Onboarding with Google Drive, Gmail, and Slack Notifications

https://n8nworkflows.xyz/workflows/automate-client-project-onboarding-with-google-drive--gmail--and-slack-notifications-6199


# Automate Client Project Onboarding with Google Drive, Gmail, and Slack Notifications

### 1. Workflow Overview

This workflow automates client project onboarding for creative agencies or freelancers by integrating Google Sheets, Google Drive, Gmail, and Slack. It listens for updates in a Google Sheet containing project details, creates a dedicated Google Drive folder for each new client project, sends a personalized welcome email to the client with the folder link, and notifies the internal team on Slack.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Detects new or updated project rows in Google Sheets.
- **1.2 Data Preparation:** Extracts and organizes input fields from the sheet.
- **1.3 Google Drive Automation:** Creates a client-specific project folder in Google Drive.
- **1.4 Client Communication:** Sends a personalized Gmail message to the client.
- **1.5 Internal Notification:** Posts a summary message to a Slack channel.
- **1.6 Documentation & Notes:** Provides workflow context, setup instructions, and input format references using sticky notes.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:** Watches a Google Sheet for row updates to trigger the onboarding process.
- **Nodes Involved:** Google Sheets Trigger
- **Node Details:**
  - **Google Sheets Trigger**
    - Type: Trigger node for Google Sheets.
    - Configuration: Triggers on any row update every minute.
    - Key parameters: Sheet name and document ID are configured via list mode (likely set in environment or UI).
    - Input: None (trigger node).
    - Output: Emits updated row data as JSON.
    - Edge cases: Possible failures include authorization issues with Google Sheets OAuth2 or delays if polling interval is too long.
  
#### 1.2 Data Preparation

- **Overview:** Standardizes and prepares key project fields from the Google Sheets row for downstream use.
- **Nodes Involved:** Edit Fields
- **Node Details:**
  - **Edit Fields**
    - Type: Set node.
    - Configuration: Defines and initializes variables for `client_name`, `contact_email`, `project_type`, `deadline`, and `brand_drive_folder`.
    - Key expressions: Initially empty strings; fields populated from Google Sheets Trigger output.
    - Input: Receives row data JSON from Google Sheets Trigger.
    - Output: Passes structured JSON with the required fields.
    - Edge cases: Missing or malformed data in any of these fields could cause errors or incomplete downstream actions.

#### 1.3 Google Drive Automation

- **Overview:** Automatically creates a Google Drive folder named after the client.
- **Nodes Involved:** Create Project Folder
- **Node Details:**
  - **Create Project Folder**
    - Type: Google Drive node.
    - Configuration: Creates a folder at root or under a specified parent using OAuth2 authentication.
    - Name: Set dynamically from `client_name` field.
    - Input: Receives prepared JSON from Edit Fields.
    - Output: Returns metadata about the created folder, including a folder ID.
    - Edge cases: Folder creation can fail due to permission issues, quota limits, or if the `client_name` contains invalid characters.
    - Version-specific: Uses v1 of Google Drive node.
  
#### 1.4 Client Communication

- **Overview:** Sends a personalized welcome email to the client including the Google Drive folder link.
- **Nodes Involved:** Gmail
- **Node Details:**
  - **Gmail**
    - Type: Gmail node for sending emails.
    - Configuration: Sends an email to `contact_email` with subject and body dynamically assembled using client and project data.
    - Email Type: Plain text.
    - Credentials: Uses Gmail OAuth2 credentials.
    - Input: Receives JSON output from Create Project Folder with added folder link.
    - Output: Email sent confirmation.
    - Edge cases: Failure if Gmail OAuth2 token expires, invalid email addresses, or API limits.
    - Version: 2.1
  
#### 1.5 Internal Notification

- **Overview:** Sends a Slack message to notify the internal team about the new project onboarding.
- **Nodes Involved:** Notify Team Slack
- **Node Details:**
  - **Notify Team Slack**
    - Type: Slack node.
    - Configuration: Posts to `#ops` channel a formatted message with client name, project type, and deadline.
    - Input: Receives output from Gmail node.
    - Output: Slack message confirmation.
    - Edge cases: Slack authentication failures or channel misconfiguration.
    - Version: 1
  
#### 1.6 Documentation & Notes

- **Overview:** Provides workflow context, setup instructions, and Google Sheet format references.
- **Nodes Involved:** Sticky Note, Sticky Note1, Sticky Note2
- **Node Details:**
  - **Sticky Note (Flow)**
    - Type: Sticky Note (visual only).
    - Content: Title "Flow" to indicate workflow start.
  - **Sticky Note1 (Documentation)**
    - Type: Sticky Note.
    - Content: Detailed problem statement, solution overview, target audience, scope, and setup instructions.
  - **Sticky Note2 (Google Sheet Format)**
    - Type: Sticky Note.
    - Content: Lists required Google Sheet columns: `client_name`, `client_contact`, `project_type`, `deadline`, `brand_drive_folder`.
    - Positioned to guide proper input formatting.

---

### 3. Summary Table

| Node Name           | Node Type            | Functional Role                 | Input Node(s)          | Output Node(s)         | Sticky Note                                                                                          |
|---------------------|----------------------|--------------------------------|-----------------------|------------------------|----------------------------------------------------------------------------------------------------|
| Google Sheets Trigger| googleSheetsTrigger   | Detect new/updated project data| None                  | Edit Fields            | # Google Sheet Format: client_name, client_contact, project_type, deadline, brand_drive_folder      |
| Edit Fields         | set                  | Prepare project data fields     | Google Sheets Trigger | Create Project Folder  |                                                                                                    |
| Create Project Folder| googleDrive          | Create client project folder    | Edit Fields           | Gmail                  |                                                                                                    |
| Gmail               | gmail                | Send welcome email to client    | Create Project Folder | Notify Team Slack      |                                                                                                    |
| Notify Team Slack   | slack                | Notify internal team on Slack   | Gmail                 | None                   |                                                                                                    |
| Sticky Note         | stickyNote           | Workflow title label            | None                  | None                   | ## Flow                                                                                            |
| Sticky Note1        | stickyNote           | Workflow documentation          | None                  | None                   | # Brand Asset Folder Automation & Client Notification... Setup instructions included               |
| Sticky Note2        | stickyNote           | Google Sheet input format guide | None                  | None                   | # Google Sheet Format: client_name, client_contact, project_type, deadline, brand_drive_folder      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Sheets Trigger Node**
   - Type: `Google Sheets Trigger`
   - Trigger event: `rowUpdate`
   - Poll interval: Every 1 minute
   - Configure `Sheet Name` and `Document ID` to your project tracking sheet
   - Connect OAuth2 credentials with proper Google Sheets access

2. **Add Set Node for Edit Fields**
   - Type: `Set`
   - Define variables: `client_name`, `contact_email`, `project_type`, `deadline`, `brand_drive_folder` (all strings, initially empty)
   - Connect input from Google Sheets Trigger
   - Map each variable to the corresponding field from the Google Sheets output JSON (e.g., `{{$json.client_name}}`)

3. **Add Google Drive Node to Create Project Folder**
   - Type: `Google Drive`
   - Operation: `Create Folder`
   - Name: Set dynamically using expression `{{$json.client_name}}`
   - Authentication: OAuth2 Google Drive account with folder creation permissions
   - Connect input from Edit Fields output

4. **Add Gmail Node to Send Welcome Email**
   - Type: `Gmail`
   - Operation: Send Email
   - Recipient Email: `{{$json.contact_email}}`
   - Subject: `Welcome to Your Project: {{$json.project_type}}`
   - Email Body (plain text): Compose a message welcoming client, referencing project type, deadline, and providing the created Google Drive folder link (`{{$json.brand_drive_folder}}`)
   - Connect input from Google Drive node output
   - Use Gmail OAuth2 credentials

5. **Add Slack Node to Notify Team**
   - Type: `Slack`
   - Operation: Post message
   - Channel: `#ops`
   - Message: `🎉 New onboarding started: {{$json.client_name}} - {{$json.project_type}} (Due {{$json.deadline}})`
   - Connect input from Gmail node output
   - Configure Slack credentials with permission to post in the target channel

6. **Add Sticky Notes for Documentation**
   - Add three sticky notes:
     - One titled "Flow" near the start to label workflow start.
     - One with detailed workflow description, problem, solution, audience, and setup instructions.
     - One listing expected Google Sheet column headers to guide proper input data format.

7. **Connect Nodes**
   - Google Sheets Trigger → Edit Fields → Create Project Folder → Gmail → Notify Team Slack

8. **Activate the Workflow**
   - Test with sample data in Google Sheet.
   - Verify Google Drive folder creation.
   - Confirm email delivery to client.
   - Check Slack notification.

---

### 5. General Notes & Resources

| Note Content                                                                                                          | Context or Link                                                                                                  |
|-----------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| Creative and digital agencies often waste time manually creating folders; this automation streamlines onboarding.     | Workflow documentation sticky note                                                                               |
| Setup requires Google Drive OAuth2 with folder creation access, Gmail OAuth2 for sending emails, and Slack credentials.| Workflow documentation sticky note                                                                               |
| Google Sheet must have columns: `client_name`, `client_contact`, `project_type`, `deadline`, `brand_drive_folder`.    | Sticky Note2 content                                                                                              |
| Slack messages are posted to `#ops` channel; ensure channel exists and credentials have posting rights.               | Slack node configuration                                                                                          |
| Gmail emails are plain text and should be customized for branding and tone as needed.                                  | Gmail node configuration                                                                                          |

---

**Disclaimer:** The provided content originates exclusively from an n8n automated workflow and complies strictly with current content policies. It contains no illegal, offensive, or protected elements. All processed data is lawful and public.