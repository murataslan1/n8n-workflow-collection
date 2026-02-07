Automate client onboarding across Google Drive, Slack, Notion & Gmail with GPT-4o-mini

https://n8nworkflows.xyz/workflows/automate-client-onboarding-across-google-drive--slack--notion---gmail-with-gpt-4o-mini-11429


# Automate client onboarding across Google Drive, Slack, Notion & Gmail with GPT-4o-mini

### 1. Workflow Overview

This workflow automates the client onboarding process triggered by the upload or update of a contract PDF in a specific Google Drive folder. It is designed for project managers and teams who want to streamline the setup of project infrastructure and communication channels, reducing manual effort and improving consistency.

**Target Use Cases:**
- Automating project folder creation and file organization on Google Drive.
- Creating dedicated Slack channels for project communication.
- Setting up project pages and tasks in Notion.
- Logging project details in a master Google Sheet for tracking.
- Generating a personalized welcome email draft via AI (OpenAI GPT-4o-mini).
- Notifying the internal team on Slack upon successful setup.

**Logical Blocks:**

- **1.1 Trigger & Parse:** Watches a Google Drive folder for new/updated contract PDFs and extracts client/project info from the filename.
- **1.2 Configuration:** Centralized node storing essential IDs and configuration values.
- **1.3 Create Project Infrastructure:** Creates project folders in Drive, deliverables subfolder, and Slack channel.
- **1.4 Project Management Setup:** Adds a Notion project page with kickoff task and logs details to Google Sheet.
- **1.5 AI Email Draft & Notification:** Uses OpenAI to draft a welcome email, creates a Gmail draft, and notifies the team on Slack.


---

### 2. Block-by-Block Analysis

#### 1.1 Trigger & Parse

**Overview:**  
Monitors a specified Google Drive folder for new or updated PDF files. Upon detecting a file, it parses the filename using a strict naming convention to extract the client name, project name, and contact email, generating sanitized identifiers for Slack and project codes.

**Nodes Involved:**  
- Watch Contract Folder  
- Parse Filename  

**Node Details:**

- **Watch Contract Folder**  
  - Type: Google Drive Trigger  
  - Role: Triggers workflow when a file is updated in a specific folder.  
  - Configuration: Watches a folder by its ID (`YOUR_FOLDER_ID_HERE` placeholder). Polls every minute. Filters for PDF files expected by file naming convention.  
  - Inputs: None (trigger)  
  - Outputs: File metadata including filename and webViewLink  
  - Edge cases:  
    - Folder ID misconfiguration causes no triggers.  
    - Non-PDF or incorrectly named files may cause parsing errors downstream.  
    - API rate limits or downtime could delay triggers.

- **Parse Filename**  
  - Type: Code (JavaScript)  
  - Role: Parses filename with convention `ClientName_ProjectName_email@example.com.pdf` to extract variables: clientName, projectName, contactEmail, startDate, slackChannelName, projectCode.  
  - Configuration: Uses string manipulation and regex to sanitize Slack channel name (alphanumeric and hyphens only), fallback if invalid. Creates a project code combining client initials and timestamp suffix.  
  - Expressions: Accesses filename from trigger, builds dynamic variables used downstream.  
  - Inputs: File metadata from trigger  
  - Outputs: JSON with parsed fields and URLs  
  - Edge cases:  
    - Filename missing parts defaults to 'UnknownClient', 'NewProject', 'admin@example.com'.  
    - Non-ASCII or short client names trigger fallback Slack channel naming.  
    - Files not following naming convention may yield inaccurate or fallback values.  
  - Version: Uses n8n code node v2 syntax

---

#### 1.2 Configuration

**Overview:**  
Central node holding essential configuration values such as IDs for Google Drive parent folder, Notion database, Google Sheet, and Slack notification channel.

**Nodes Involved:**  
- Set Config Variables

**Node Details:**

- **Set Config Variables**  
  - Type: Set  
  - Role: Stores static IDs used by other nodes for folder creation, Notion page creation, logging, and Slack notifications.  
  - Configuration: Assigns string values for:  
    - `googleDriveParentFolderId`  
    - `notionDatabaseId`  
    - `googleSheetId`  
    - `slackNotificationChannel`  
  - Inputs: Parsed filename data  
  - Outputs: Same data with appended configuration keys  
  - Edge cases:  
    - Missing or incorrect IDs will cause failures downstream (e.g., folder not created, Notion page not added).  
    - Needs manual update before running workflow.

---

#### 1.3 Create Project Infrastructure

**Overview:**  
Automates creation of the project folder hierarchy in Google Drive and a dedicated Slack communication channel.

**Nodes Involved:**  
- Create Project Folder  
- Create Deliverables Subfolder  
- Create Slack Channel

**Node Details:**

- **Create Project Folder**  
  - Type: Google Drive (Create Folder)  
  - Role: Creates root project folder named "`ClientName - ProjectName`" inside configured parent folder.  
  - Configuration: Uses `googleDriveParentFolderId` from config node, and dynamic name from Parse Filename node.  
  - Inputs: Config variables  
  - Outputs: Folder metadata including ID and webViewLink  
  - Edge cases:  
    - Permission issues or invalid parent folder ID cause failure.  
    - Folder name conflicts are not explicitly handled.

- **Create Deliverables Subfolder**  
  - Type: Google Drive (Create Folder)  
  - Role: Creates a subfolder `01_Deliverables` inside the project folder created above.  
  - Configuration: Uses parent folder ID from previous node output.  
  - Inputs: Project folder metadata  
  - Outputs: Subfolder metadata  
  - Edge cases: Same as above regarding permissions and conflicts.

- **Create Slack Channel**  
  - Type: Slack (Channel Create)  
  - Role: Creates a Slack channel named after sanitized client/project info (`slackChannelName`).  
  - Configuration: Uses OAuth2 credentials with permission to create channels.  
  - Inputs: Slack channel name from Parse Filename node  
  - Outputs: Slack channel creation confirmation  
  - Edge cases:  
    - Channel name conflicts or permissions errors.  
    - Slack API rate limits.  
  - Version: Slack node v2.3

---

#### 1.4 Project Management Setup

**Overview:**  
Creates a Notion page to track the project with initial kickoff task and logs the project details to a master Google Sheet.

**Nodes Involved:**  
- Create Notion Project Page  
- Add Kickoff Task  
- Log to Master Sheet

**Node Details:**

- **Create Notion Project Page**  
  - Type: Notion (Database Page Create)  
  - Role: Adds a new Notion page in configured database with title "`ClientName - ProjectName`" and status "Not Started".  
  - Configuration: Uses Notion database ID from config node.  
  - Inputs: Project info from Parse Filename  
  - Outputs: New Notion page metadata including ID and URL  
  - Edge cases:  
    - Notion API rate limits or invalid credentials.  
    - Invalid database ID causes failure.

- **Add Kickoff Task**  
  - Type: Notion (Block Create)  
  - Role: Adds a "to do" block with text "Schedule kickoff meeting" inside the newly created Notion page.  
  - Configuration: Uses block ID from previous node output.  
  - Inputs: Notion page ID  
  - Outputs: Block creation confirmation  
  - Edge cases: API issues or invalid block ID.

- **Log to Master Sheet**  
  - Type: Google Sheets (Append Row)  
  - Role: Appends a row to a master sheet with client, project code, Notion link, Drive folder link, and Slack channel name.  
  - Configuration: Uses Google Sheet ID from config node, appends to default sheet (gid=0).  
  - Inputs: Data aggregated from previous nodes  
  - Outputs: Operation result confirmation  
  - Edge cases:  
    - Incorrect sheet ID or permission errors.  
    - Schema mismatch if sheet columns change.

---

#### 1.5 AI Email Draft & Notification

**Overview:**  
Generates a personalized project kickoff welcome email using OpenAI GPT-4o-mini, saves it as a Gmail draft for review, then notifies the team on Slack.

**Nodes Involved:**  
- AI Draft Welcome Email  
- Create Gmail Draft  
- Notify Team on Slack  
- OpenAI Chat Model (support node for AI)

**Node Details:**

- **OpenAI Chat Model**  
  - Type: LangChain OpenAI Chat Model  
  - Role: Executes GPT-4o-mini model for AI completion.  
  - Configuration: Model set to `gpt-4o-mini`, no special options or tools enabled.  
  - Inputs: Prompt from AI Draft node  
  - Outputs: AI-generated text  
  - Edge cases:  
    - API key invalid or rate limits.  
    - Network errors.

- **AI Draft Welcome Email**  
  - Type: LangChain Agent  
  - Role: Defines prompt and instruction for drafting a professional kickoff email using project info.  
  - Configuration: Prompt includes Client Name, Project Name, Slack Channel, instructions to write a friendly business email, no subject line, ends with a closing signature.  
  - Inputs: Parsed project data, AI model node  
  - Outputs: Email body text  
  - Edge cases: Prompt failure or invalid data could produce irrelevant emails.

- **Create Gmail Draft**  
  - Type: Gmail (Create Draft)  
  - Role: Saves AI-generated email text as a draft in Gmail with dynamic subject referencing project name.  
  - Configuration: Gmail OAuth2 credentials required, subject line uses project name.  
  - Inputs: AI-generated email text  
  - Outputs: Draft creation confirmation  
  - Edge cases: Auth errors, quota limits.

- **Notify Team on Slack**  
  - Type: Slack (Message Post)  
  - Role: Posts a formatted Slack message to a configured notification channel summarizing project creation, with links and email draft notice.  
  - Configuration: Uses Slack channel ID from config node, OAuth2 credentials.  
  - Inputs: Aggregated project info and URLs  
  - Outputs: Message post confirmation  
  - Edge cases: Slack API errors or permissions.


---

### 3. Summary Table

| Node Name               | Node Type                     | Functional Role                               | Input Node(s)                  | Output Node(s)                  | Sticky Note                                                                                                   |
|-------------------------|-------------------------------|-----------------------------------------------|--------------------------------|--------------------------------|---------------------------------------------------------------------------------------------------------------|
| Sticky Note             | Sticky Note                   | Describes overall workflow purpose and setup | None                           | None                           | ## 🎯 Project Onboarding Automation ... (full project intro and setup instructions)                           |
| Sticky Note1            | Sticky Note                   | Describes Trigger & Parse block               | None                           | None                           | ### 1️⃣ Trigger & Parse ...                                                                                   |
| Sticky Note2            | Sticky Note                   | Describes Configuration block                 | None                           | None                           | ### 2️⃣ Configuration ...                                                                                      |
| Sticky Note3            | Sticky Note                   | Describes Create Project Infrastructure block | None                           | None                           | ### 3️⃣ Create Project Infrastructure ...                                                                      |
| Sticky Note4            | Sticky Note                   | Describes Project Management Setup block      | None                           | None                           | ### 4️⃣ Project Management ...                                                                                  |
| Sticky Note5            | Sticky Note                   | Describes AI Email Draft & Notification block | None                           | None                           | ### 5️⃣ AI Email Draft & Notification ...                                                                       |
| Watch Contract Folder   | Google Drive Trigger          | Trigger on new/updated PDF in Drive folder    | None                           | Parse Filename                 |                                                                                                               |
| Parse Filename          | Code                         | Extracts Client, Project info from filename   | Watch Contract Folder          | Set Config Variables           |                                                                                                               |
| Set Config Variables    | Set                          | Holds config IDs for Drive, Notion, Sheet, Slack | Parse Filename               | Create Project Folder           | Update these values: Google Drive parent folder ID, Notion database ID, Google Sheet ID                        |
| Create Project Folder   | Google Drive (Folder Create) | Creates root project folder in Drive          | Set Config Variables           | Create Deliverables Subfolder   | Automatically creates root project folder                                                                     |
| Create Deliverables Subfolder | Google Drive (Folder Create) | Creates subfolder "01_Deliverables"            | Create Project Folder          | Create Slack Channel            | Automatically creates deliverables subfolder                                                                   |
| Create Slack Channel    | Slack (Channel Create)        | Creates dedicated Slack channel                | Create Deliverables Subfolder  | Create Notion Project Page      | Creates Slack channel for communication                                                                        |
| Create Notion Project Page | Notion (Database Page Create) | Creates project page in Notion database        | Create Slack Channel           | Add Kickoff Task                | Creates Notion project page with tasks                                                                          |
| Add Kickoff Task        | Notion (Block Create)         | Adds kickoff task block to Notion page        | Create Notion Project Page     | Log to Master Sheet             | Adds initial kickoff task                                                                                       |
| Log to Master Sheet     | Google Sheets (Append Row)    | Logs project data to master sheet              | Add Kickoff Task               | AI Draft Welcome Email          | Logs everything to master Google Sheet                                                                         |
| OpenAI Chat Model       | LangChain OpenAI Chat Model   | Runs GPT-4o-mini AI model                       | None (used by AI Draft node)   | AI Draft Welcome Email          |                                                                                                               |
| AI Draft Welcome Email  | LangChain Agent               | Drafts personalized welcome email              | Log to Master Sheet, OpenAI Chat Model | Create Gmail Draft        | Writes professional kickoff email body using AI                                                               |
| Create Gmail Draft      | Gmail (Create Draft)          | Saves AI email as draft for review             | AI Draft Welcome Email         | Notify Team on Slack            | Saves email draft in Gmail                                                                                      |
| Notify Team on Slack    | Slack (Message Post)          | Posts onboarding notification to Slack channel | Create Gmail Draft             | None                           | Notifies team on Slack when onboarding is complete                                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Drive Trigger**  
   - Node Type: Google Drive Trigger  
   - Parameters:  
     - Event: `fileUpdated`  
     - Poll frequency: every minute  
     - Folder to watch: set to your onboarding contracts folder ID  
   - Credentials: Google Drive OAuth2 with access to the folder

2. **Add Code Node "Parse Filename"**  
   - Type: Code (JavaScript) Node  
   - Purpose: Parse filename in format `ClientName_ProjectName_email@example.com.pdf`  
   - Key code logic:  
     - Extract filename, remove `.pdf` suffix  
     - Split by underscore into clientName, projectName, contactEmail  
     - Sanitize client name to generate Slack channel name  
     - Generate a unique project code  
     - Extract `webViewLink` from trigger output  
   - Input: Output of Google Drive Trigger  
   - Output: JSON with parsed project info

3. **Add Set Node "Set Config Variables"**  
   - Type: Set  
   - Parameters: Define static string variables:  
     - `googleDriveParentFolderId` (your root folder for projects)  
     - `notionDatabaseId` (your Notion project database)  
     - `googleSheetId` (master tracking sheet ID)  
     - `slackNotificationChannel` (channel ID for team notifications)  
   - Input: Output of Parse Filename node

4. **Add Google Drive Node "Create Project Folder"**  
   - Type: Google Drive (Create Folder)  
   - Parameters:  
     - Name: `{{ $json["Client Name"] }} - {{ $json["Project Name"] }}` (from Parse Filename)  
     - Parent folder ID: from `googleDriveParentFolderId` variable  
   - Credentials: Google Drive OAuth2  
   - Input: Set Config Variables output

5. **Add Google Drive Node "Create Deliverables Subfolder"**  
   - Type: Google Drive (Create Folder)  
   - Parameters:  
     - Name: `01_Deliverables`  
     - Parent folder ID: ID of project folder created above  
   - Credentials: Google Drive OAuth2  
   - Input: Output of Create Project Folder

6. **Add Slack Node "Create Slack Channel"**  
   - Type: Slack (Channel Create)  
   - Parameters:  
     - Channel Name: from `slackChannelName` in Parse Filename  
   - Credentials: Slack OAuth2 with channel creation permissions  
   - Input: Output of Create Deliverables Subfolder

7. **Add Notion Node "Create Notion Project Page"**  
   - Type: Notion (Database Page Create)  
   - Parameters:  
     - Database ID: from config variable  
     - Title Property: `{{ $json["Client Name"] }} - {{ $json["Project Name"] }}`  
     - Status Property: "Not Started"  
   - Credentials: Notion API integration  
   - Input: Output of Create Slack Channel

8. **Add Notion Node "Add Kickoff Task"**  
   - Type: Notion (Block Create)  
   - Parameters:  
     - Block Type: to_do  
     - Text: "Schedule kickoff meeting"  
     - Parent Block ID: ID of newly created Notion page  
   - Credentials: Notion API  
   - Input: Output of Create Notion Project Page

9. **Add Google Sheets Node "Log to Master Sheet"**  
   - Type: Google Sheets (Append Row)  
   - Parameters:  
     - Sheet ID: from config variable  
     - Sheet name: default or `gid=0`  
     - Columns: Client, Project Code, Notion Link, Drive Folder, Slack Channel, mapped from previous nodes outputs  
   - Credentials: Google Sheets OAuth2  
   - Input: Output of Add Kickoff Task

10. **Add LangChain OpenAI Chat Model Node**  
    - Type: LangChain OpenAI Chat Model  
    - Parameters:  
      - Model: `gpt-4o-mini`  
    - Credentials: OpenAI API key  
    - Input: none (used indirectly by AI Draft node)

11. **Add LangChain Agent Node "AI Draft Welcome Email"**  
    - Type: LangChain Agent  
    - Parameters:  
      - Prompt includes Client Name, Project Name, Slack channel info  
      - Instructions to write professional, friendly kickoff email body only, ending with signature  
    - Input: Output of Log to Master Sheet and OpenAI Chat Model

12. **Add Gmail Node "Create Gmail Draft"**  
    - Type: Gmail (Create Draft)  
    - Parameters:  
      - Message: AI draft email body  
      - Subject: `Welcome to {{ Client Name }} - Project Kickoff`  
    - Credentials: Gmail OAuth2  
    - Input: Output of AI Draft Welcome Email

13. **Add Slack Node "Notify Team on Slack"**  
    - Type: Slack (Message Post)  
    - Parameters:  
      - Channel: from config variable `slackNotificationChannel`  
      - Message text: formatted summary with project info, links, and AI draft notice  
    - Credentials: Slack OAuth2  
    - Input: Output of Create Gmail Draft

14. **Connect all nodes in the order described above**, ensuring data flows logically and references dynamic expressions properly.

15. **Test the workflow** by uploading a sample PDF named according to the convention to the trigger folder.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                        | Context or Link                                                                                          |
|-----------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| Workflow requires setup of OAuth2 credentials for Google Drive, Gmail, Sheets, Slack, and API keys for Notion and OpenAI.                         | Refer to n8n credential setup documentation for each service.                                          |
| File naming convention is strict: `ClientName_ProjectName_email@example.com.pdf`                                                                    | Critical for correct parsing and automation to work.                                                   |
| Slack OAuth credential must have channel creation permissions.                                                                                      | Slack Admin consent may be required.                                                                    |
| The AI model used is `gpt-4o-mini` via LangChain integration for generating personalized emails.                                                  | Ensure OpenAI API key has access to this model.                                                        |
| Gmail drafts are saved but not sent automatically, allowing manual review.                                                                          | This ensures human oversight on communications.                                                        |
| The workflow posts onboarding notifications to a dedicated Slack channel for team visibility.                                                      | Slack notification channel ID is configurable in the Set Config Variables node.                         |
| For troubleshooting, check API limits, invalid IDs, and permission scopes across all services.                                                     | Each external service can fail silently if credentials or permissions are incorrect.                    |
| Project folder creation does not handle duplicate folder names explicitly; consider manual cleanup or additional logic if needed for conflicts.    |                                                                                                         |
| Notion integration expects a database with at least title and status properties matching those used in the node configuration.                     |                                                                                                         |

---

**Disclaimer:** The provided text is derived exclusively from an automated workflow created with n8n, an integration and automation tool. This processing fully respects current content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.