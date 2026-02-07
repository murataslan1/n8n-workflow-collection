Automate GoHighLevel Client Onboarding with Google Drive, Gmail, Calendar & Slack

https://n8nworkflows.xyz/workflows/automate-gohighlevel-client-onboarding-with-google-drive--gmail--calendar---slack-9138


# Automate GoHighLevel Client Onboarding with Google Drive, Gmail, Calendar & Slack

---

### 1. Workflow Overview

This workflow automates the client onboarding process in GoHighLevel (GHL) by integrating with Google Drive, Gmail, Google Calendar, and Slack. It triggers automatically when a deal is marked as "Won" in GHL and streamlines multiple onboarding tasks such as folder creation, document templating, email notification, task creation, calendar scheduling, and team notifications.

**Target Use Cases:**  
- Agencies or service providers using GoHighLevel for CRM and sales pipelines  
- Teams seeking to reduce manual onboarding overhead and errors  
- Businesses that require consistent onboarding experiences with automated document generation and communication

**Logical Blocks:**  
- **1.1 Input Reception and Validation:** Trigger on deal status change and validate incoming data  
- **1.2 Client Data Formatting:** Standardizes and prepares client info for downstream nodes  
- **1.3 Google Drive Operations:** Creates client folders and copies contract/kickoff templates  
- **1.4 Notifications and Communication:** Sends welcome emails and Slack notifications  
- **1.5 Scheduling and Task Management:** Creates Google Calendar events and GHL onboarding tasks  
- **1.6 Error Handling:** Captures validation errors and sends alerts to Slack

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Validation

- **Overview:**  
  This block receives webhook events from GoHighLevel when a deal is marked as "Won," fetches relevant opportunity data using the GHL API, and validates that required client information is present before continuing.

- **Nodes Involved:**  
  - GHL Webhook - Deal Won  
  - Fetch Won Deals from GHL  
  - Validate Client Data  
  - Error Notification

- **Node Details:**

  - **GHL Webhook - Deal Won**  
    - Type: Webhook  
    - Role: Entry trigger for the workflow, receives HTTP POST requests from GHL automation when a deal status changes to "Won"  
    - Configuration: Path set to `/ghl-deal-won`, responds with data acknowledgment  
    - Inputs: None  
    - Outputs: Passes webhook payload downstream  
    - Edge Cases: Webhook misconfiguration or network issues could prevent triggering  

  - **Fetch Won Deals from GHL**  
    - Type: GoHighLevel API (HighLevel node)  
    - Role: Retrieves all opportunities with status "won" from GHL to confirm and enrich webhook data  
    - Configuration: Filters to status = "won", fetches all matching opportunities  
    - Inputs: Webhook output  
    - Outputs: Sends filtered opportunity data downstream  
    - Edge Cases: API auth failures, API rate limits, empty results if no matching deals  

  - **Validate Client Data**  
    - Type: If node  
    - Role: Checks that essential fields (`id`, `name`) are present in opportunity data before processing  
    - Configuration: Condition checks non-empty `id` and `name` fields  
    - Inputs: Opportunity data from API fetch  
    - Outputs:  
      - True branch: Valid data proceeds to formatting  
      - False branch: Invalid data triggers error notification  
    - Edge Cases: Missing or malformed data leading to false branch  

  - **Error Notification**  
    - Type: Slack  
    - Role: Sends alerts to a designated Slack channel if validation fails or errors occur  
    - Configuration: Sends formatted error message including node and error details to error channel  
    - Inputs: Triggered from false branch of validation  
    - Outputs: None (terminal node)  
    - Edge Cases: Slack API failures or misconfigured credentials  

---

#### 1.2 Client Data Formatting

- **Overview:**  
  This block extracts, sanitizes, and standardizes client and deal data into consistent formats for use by subsequent nodes.

- **Nodes Involved:**  
  - Format Client Data

- **Node Details:**

  - **Format Client Data**  
    - Type: Code (JavaScript)  
    - Role: Parses raw GHL opportunity JSON, extracts client info (name, email, phone), deal details, and formats folder/document names safely  
    - Configuration: Custom JavaScript with fallback logic for missing fields, creates safe folder names by removing special characters, sets timestamps  
    - Key Expressions: Uses input JSON fields like `contact`, `relations`, `pipelineId`, `monetaryValue`, etc.  
    - Inputs: Validated opportunity data  
    - Outputs: JSON with structured client and deal metadata, including:  
      - `clientName`, `clientEmail`, `clientPhone`  
      - `dealId`, `dealName`, `dealValue`, `dealStatus`  
      - `folderName`, `contractName`, `kickoffDeckName` (template names)  
    - Edge Cases: Unknown or missing client name defaults to `"Unknown Client"`; missing emails or phones flagged for validation  

---

#### 1.3 Google Drive Operations

- **Overview:**  
  Creates a new client folder in Google Drive with a specific naming convention and copies predefined contract and kickoff deck templates into this folder.

- **Nodes Involved:**  
  - Create Client Folder  
  - Copy Contract Template  
  - Copy Kickoff Deck Template

- **Node Details:**

  - **Create Client Folder**  
    - Type: Google Drive (createFromText operation)  
    - Role: Creates a new text file in Google Drive as a client info summary inside a designated parent folder  
    - Configuration:  
      - Folder name format: `ClientName_YYYY-MM-DD` (dynamically from formatted data)  
      - Text content includes client and deal information using templated fields  
      - Uses OAuth2 credential for Google Drive  
      - Parent folder ID is configurable by user  
    - Inputs: Formatted client data  
    - Outputs: JSON metadata of created file, including folder ID for linking  
    - Edge Cases: Google Drive API permission errors, invalid folder ID, quota limits  

  - **Copy Contract Template**  
    - Type: Google Drive (copy operation)  
    - Role: Duplicates a contract template file into the newly created client folder, renaming it per client  
    - Configuration:  
      - Uses a pre-configured template file ID for the contract  
      - Renames copy with client-specific name from formatted data  
    - Inputs: Client folder metadata from Create Client Folder node  
    - Outputs: Metadata of copied contract file  
    - Edge Cases: Template file not found, insufficient permissions  

  - **Copy Kickoff Deck Template**  
    - Type: Google Drive (copy operation)  
    - Role: Duplicates the kickoff presentation template similarly to the contract template  
    - Configuration: Analogous to Copy Contract Template with a different template file ID  
    - Inputs: Client folder metadata  
    - Outputs: Metadata of copied kickoff deck file  
    - Edge Cases: Same as Copy Contract Template  

---

#### 1.4 Notifications and Communication

- **Overview:**  
  Sends a welcome email to the client with onboarding details and posts a notification message to a Slack channel informing the team of the new client onboarding.

- **Nodes Involved:**  
  - Send Welcome Email  
  - Send Slack Welcome

- **Node Details:**

  - **Send Welcome Email**  
    - Type: Gmail  
    - Role: Sends a branded HTML welcome email to the client including next steps, calendar link, and Drive folder link  
    - Configuration:  
      - Recipient email dynamically set from formatted client data  
      - Email subject and HTML body contain placeholders replaced at runtime  
      - Uses Gmail OAuth2 credentials  
    - Inputs: Calendar event metadata (for booking link) and client data  
    - Outputs: Email sent confirmation  
    - Edge Cases: Gmail API quota, invalid email address, OAuth token expiry  

  - **Send Slack Welcome**  
    - Type: Slack  
    - Role: Posts a formatted message in a team Slack channel to announce the new client onboarding  
    - Configuration:  
      - Channel selectable by user  
      - Message includes client name, phone, deal value, email, link to Drive folder, and confirmation of completed steps  
      - Uses Slack API OAuth2 credentials  
    - Inputs: Client data and Drive folder metadata  
    - Outputs: Message posted confirmation  
    - Edge Cases: Slack API rate limits, incorrect channel ID, permissions  

---

#### 1.5 Scheduling and Task Management

- **Overview:**  
  Automatically schedules a kickoff call in Google Calendar and creates a follow-up task in GoHighLevel for the account manager.

- **Nodes Involved:**  
  - Schedule Kickoff Call  
  - Create GHL Onboarding Task

- **Node Details:**

  - **Schedule Kickoff Call**  
    - Type: Google Calendar  
    - Role: Creates a calendar event for the client kickoff meeting with customizable details  
    - Configuration:  
      - Uses Google Calendar OAuth2 credential  
      - Calendar selection is user-configured  
      - Event description uses dynamic text from Slack welcome message blocks for consistency  
    - Inputs: Slack welcome message output (for description), client data  
    - Outputs: Event metadata including booking link used in emails  
    - Edge Cases: Calendar API errors, incorrect calendar ID, overlapping events  

  - **Create GHL Onboarding Task**  
    - Type: GoHighLevel API (HighLevel node)  
    - Role: Creates a new onboarding task assigned to the client’s account manager in GHL  
    - Configuration:  
      - Task title includes client name dynamically  
      - Due date set 7 days in the future by default  
      - Contact ID dynamically linked from formatted client data  
      - Status defaults to incomplete (can be customized)  
    - Inputs: Formatted client data  
    - Outputs: Task creation confirmation  
    - Edge Cases: API permission issues, invalid contact ID, rate limits  

---

#### 1.6 Error Handling

- **Overview:**  
  Captures failures in validation or other critical steps and notifies the team via Slack.

- **Nodes Involved:**  
  - Error Notification (already described in 1.1)

- **Node Details:**  
  See above in 1.1

---

### 3. Summary Table

| Node Name                | Node Type            | Functional Role                                   | Input Node(s)               | Output Node(s)                                 | Sticky Note                                                                                                    |
|--------------------------|----------------------|-------------------------------------------------|-----------------------------|-----------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| GHL Webhook - Deal Won    | Webhook              | Trigger on deal status change to "Won"           | None                        | Fetch Won Deals from GHL                       | Webhook trigger for GHL when deal moves to Won or Completed. Configure in GHL: Automation > Workflows > Add Webhook |
| Fetch Won Deals from GHL  | HighLevel API        | Retrieve won opportunities from GHL               | GHL Webhook - Deal Won       | Validate Client Data                           | Retrieves all opportunities marked as Won from GoHighLevel                                                   |
| Validate Client Data      | If                   | Validate required fields (id, name)                | Fetch Won Deals from GHL     | Format Client Data (true branch), Error Notification (false branch) | Ensures required fields are present before processing                                                        |
| Error Notification        | Slack                | Send error alert if validation or failures occur  | Validate Client Data (false) | None                                          | Sends alert if workflow fails                                                                                  |
| Format Client Data        | Code (JavaScript)     | Standardize and format client and deal data        | Validate Client Data (true)  | Create Client Folder                           | Standardizes data format for use across workflow                                                               |
| Create Client Folder      | Google Drive          | Create client folder with onboarding info          | Format Client Data           | Copy Contract Template, Copy Kickoff Deck Template | Creates client folder with format: ClientName_YYYY-MM-DD                                                      |
| Copy Contract Template    | Google Drive          | Copy contract template into client folder          | Create Client Folder         | Send Slack Welcome                             | Duplicates contract template into client folder                                                               |
| Copy Kickoff Deck Template| Google Drive          | Copy kickoff deck template into client folder      | Create Client Folder         | Create GHL Onboarding Task                     | Duplicates kickoff deck template into client folder                                                           |
| Send Slack Welcome        | Slack                 | Notify team of new client onboarding                | Copy Contract Template       | Schedule Kickoff Call                          | Posts welcome message to team Slack channel                                                                    |
| Schedule Kickoff Call     | Google Calendar       | Schedule kickoff meeting event                       | Send Slack Welcome           | Send Welcome Email                            | Creates calendar event for client kickoff meeting                                                              |
| Send Welcome Email        | Gmail                 | Send branded welcome email to new client            | Schedule Kickoff Call, Create GHL Onboarding Task | None                                          | Sends branded welcome email with onboarding details                                                            |
| Create GHL Onboarding Task| HighLevel API         | Create follow-up task in GHL for account manager   | Copy Kickoff Deck Template   | Send Welcome Email                            | Creates follow-up task in GHL for account manager                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node:**  
   - Type: Webhook  
   - Name: `GHL Webhook - Deal Won`  
   - Path: `ghl-deal-won`  
   - Purpose: Receive webhook POST from GHL when opportunity status changes to "Won"  

2. **Add GoHighLevel API Node:**  
   - Type: HighLevel (GoHighLevel API)  
   - Name: `Fetch Won Deals from GHL`  
   - Operation: Get all opportunities with filter `status = won`  
   - Credentials: Configure HighLevel OAuth2 or API Key credentials  
   - Connect output of webhook node to this node  

3. **Add If Node for Validation:**  
   - Name: `Validate Client Data`  
   - Condition: Check that `id` and `name` fields in input JSON are not empty  
   - Connect output of Fetch Won Deals node to this node  

4. **Add Slack Node for Error Alerts:**  
   - Type: Slack  
   - Name: `Error Notification`  
   - Message Template: Include node name and error details  
   - Channel: Select or input error alert Slack channel  
   - Connect false output (validation failed) of If node here  

5. **Add Code Node for Data Formatting:**  
   - Type: Code (JavaScript)  
   - Name: `Format Client Data`  
   - Paste provided JS code to extract and format client & deal info  
   - Connect true output (validation passed) of If node here  

6. **Create Google Drive Folder and File Node:**  
   - Type: Google Drive (createFromText)  
   - Name: `Create Client Folder`  
   - Use OAuth2 credentials for Google Drive  
   - Parent Folder: Set your main onboarding folder ID  
   - Content: Use templated text with client and deal info  
   - Connect output of Format Client Data node here  

7. **Add Google Drive Copy Nodes for Templates:**  
   - Two nodes:  
     - `Copy Contract Template` (copy operation)  
     - `Copy Kickoff Deck Template` (copy operation)  
   - Both use OAuth2 credentials  
   - File ID: Paste your contract and kickoff deck template file IDs  
   - Name copies dynamically using formatted client data  
   - Connect output of Create Client Folder node to both  

8. **Add Slack Notification Node:**  
   - Type: Slack  
   - Name: `Send Slack Welcome`  
   - Channel: Select team notification channel (e.g., #client-onboarding)  
   - Message: Compose with client details and Drive folder link  
   - Connect output of Copy Contract Template node here  

9. **Add Google Calendar Node:**  
   - Type: Google Calendar  
   - Name: `Schedule Kickoff Call`  
   - Calendar: Select your calendar for kickoff meetings  
   - Event details: Use dynamic description referencing Slack message content  
   - Connect output of Send Slack Welcome node here  

10. **Add Gmail Node:**  
    - Type: Gmail  
    - Name: `Send Welcome Email`  
    - Recipient: Use expression to get client email from formatted data  
    - Subject and HTML body: Customize with client name, booking link, folder link  
    - Connect output of Schedule Kickoff Call node here  

11. **Add HighLevel Task Creation Node:**  
    - Type: HighLevel (GoHighLevel API)  
    - Name: `Create GHL Onboarding Task`  
    - Task title: Include client name dynamically  
    - Due date: Set 7 days from now dynamically  
    - Contact ID: Use client contact ID from formatted data  
    - Connect output of Copy Kickoff Deck Template node here  

12. **Connect Create GHL Onboarding Task Node Output to Send Welcome Email**  
    - This ensures task creation and welcome email sending occur concurrently after templates are copied.  

13. **Credential Setup:**  
    - Configure OAuth2 credentials for Google Drive, Gmail, Google Calendar, Slack, and GoHighLevel API  
    - Ensure all API permissions allow read/write as required  

14. **Configure Webhook in GoHighLevel:**  
    - Navigate to Automation > Workflows  
    - Set trigger: Opportunity Status Changed → Status = "Won"  
    - Add webhook action with URL pointing to n8n webhook node `/ghl-deal-won`  

15. **Replace Placeholder IDs:**  
    - Parent folder ID in Google Drive nodes  
    - Template file IDs for contract and kickoff deck  
    - Slack channel IDs for notifications and error alerts  
    - Calendar ID for scheduling  

16. **Test Workflow:**  
    - Trigger a test deal marked as "Won" in GHL  
    - Confirm folder creation, document copies, email sent, Slack notifications, calendar event, and task creation  

---

### 5. General Notes & Resources

| Note Content                                                                                                          | Context or Link                                                                                          |
|-----------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| Workflow reduces 30-45 minutes of manual onboarding time per client and minimizes data entry errors.                   | Workflow Overview sticky note                                                                             |
| Setup requires Google Workspace account (Drive, Gmail, Calendar), Slack workspace, and GHL API access.                 | Workflow Overview sticky note                                                                             |
| Webhook path used: `/ghl-deal-won`.                                                                                   | Webhook Setup Instructions sticky note                                                                   |
| Google Drive: Replace hardcoded folder and template file IDs with your own.                                           | Google Drive Configuration sticky note                                                                   |
| Slack Channel for notifications recommended: `#client-onboarding` or `#sales`.                                        | Slack Notifications sticky note                                                                           |
| Gmail email must use dynamic expression to send to client email: `={{ $('Format Client Data').item.json.clientEmail }}` | Calendar & Email Setup sticky note                                                                        |
| Error alerts best sent to dedicated Slack channel such as `#n8n-errors`.                                              | Error Handling sticky note                                                                                 |
| Use placeholders like `{{CLIENT_NAME}}` in Google Docs/Slides templates for auto-replacement.                         | Template Setup sticky note                                                                                 |
| Credentials need OAuth2 authorization for Google services, Slack, and GoHighLevel.                                    | Multiple sticky notes (Google Drive, Slack, GHL API Configuration)                                       |
| For detailed step-by-step webhook setup in GHL, see: GoHighLevel Automation > Workflows > Add Webhook                  | Webhook Setup Instructions sticky note                                                                   |

---

**Disclaimer:** The provided text is extracted exclusively from an automated n8n workflow designed for legal and public data processing. It contains no illegal or offensive content and complies fully with platform policies.

---