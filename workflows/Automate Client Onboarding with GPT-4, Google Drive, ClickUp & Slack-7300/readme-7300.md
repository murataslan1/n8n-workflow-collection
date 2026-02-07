Automate Client Onboarding with GPT-4, Google Drive, ClickUp & Slack

https://n8nworkflows.xyz/workflows/automate-client-onboarding-with-gpt-4--google-drive--clickup---slack-7300


# Automate Client Onboarding with GPT-4, Google Drive, ClickUp & Slack

### 1. Workflow Overview

This workflow automates the client onboarding process, leveraging GPT-4 AI to analyze client proposals and generate detailed onboarding tasks. It integrates multiple platforms—Google Drive, ClickUp, Slack, and Gmail—to create a seamless and fast onboarding experience. Triggered by a client onboarding form submission, it extracts project information from uploaded documents, creates structured folders and task lists, sets up communication channels, and sends welcome emails.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Document Extraction:** Captures client data from a form and extracts text from the submitted proposal/scoping document.
- **1.2 Folder Creation and Management:** Creates dedicated client folders on Google Drive and ClickUp to organize project files and tasks.
- **1.3 AI Task Segmentation and Processing:** Uses GPT-4 to analyze the scoping document and generate a detailed list of onboarding tasks formatted for ClickUp.
- **1.4 Task Creation Loop:** Iterates over the AI-generated tasks to create individual tasks in ClickUp.
- **1.5 Communication Setup:** Creates a Slack channel and posts a welcome message.
- **1.6 Notification Email:** Sends a personalized welcome email to the client confirming onboarding setup.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Document Extraction

**Overview:**  
This block captures client onboarding input from a custom form including personal/company info and a scoping document upload. It then extracts text content from the uploaded file for further AI processing.

**Nodes Involved:**  
- On form submission1  
- Extract from File1  
- Remane Doc

**Node Details:**  

- **On form submission1**  
  - Type: Form Trigger  
  - Role: Entry point; listens for submissions to the "Client Onboarding Form" containing fields for Name, Email, Company Name, Website, and a file upload for "Proposal_Scope_Document".  
  - Config: Requires all fields, accepts PDF/DOC/DOCX for file.  
  - Outputs client data and binary file data.  
  - Edge Cases: Missing required fields, unsupported file type uploads, webhook connectivity issues.

- **Extract from File1**  
  - Type: Extract from File  
  - Role: Extracts raw text from the uploaded PDF/DOC file under the binary property "Proposal_Scope_Document".  
  - Config: Operation set to "pdf" extraction mode.  
  - Input: Binary file from form trigger.  
  - Output: Extracted plain text content.  
  - Edge Cases: Extraction failures on corrupted or scanned PDFs, unsupported document structures.

- **Remane Doc**  
  - Type: Set  
  - Role: Saves extracted text into a JSON string property "projectInformation" for downstream processing.  
  - Config: Sets `projectInformation` to the text extracted from the file node.  
  - Input: Text from extract node.  
  - Output: JSON with projectInformation string.  
  - Edge Cases: Empty extraction results, data type mismatches.

---

#### 2.2 Folder Creation and Management

**Overview:**  
Creates client-specific organizational folders on Google Drive and ClickUp, storing IDs for later use in task and list creation.

**Nodes Involved:**  
- Create Main Client Folder  
- Remane Folder ID  
- Click Up~Create a folder  
- Click Up~Create a list

**Node Details:**  

- **Create Main Client Folder**  
  - Type: Google Drive  
  - Role: Creates a new folder named after the client’s company with suffix "~ Client Folder" inside a specified parent folder ("Onboardings" folder).  
  - Config: Uses OAuth2 credentials for Google Drive, target drive is "My Drive".  
  - Input: Company Name from form.  
  - Output: Folder metadata including ID.  
  - Edge Cases: Google Drive API quota limits, permission errors, name conflicts.

- **Remane Folder ID**  
  - Type: Set  
  - Role: Extracts and saves the Google Drive folder ID from the previous node into a variable "DriveFolderId" for reference.  
  - Input: Folder creation response.  
  - Output: JSON with DriveFolderId.  
  - Edge Cases: Missing ID if folder creation failed.

- **Click Up~Create a folder**  
  - Type: ClickUp node  
  - Role: Creates a folder inside ClickUp with the client company name and "~Client Folder" suffix.  
  - Config: Authenticated via OAuth2, uses fixed team and space IDs.  
  - Input: Folder ID from Google Drive node (via connection).  
  - Output: ClickUp folder metadata, including ID.  
  - Edge Cases: API limits, permission errors, invalid workspace/team IDs.

- **Click Up~Create a list**  
  - Type: ClickUp node  
  - Role: Creates a list titled "<Company Name> Onboarding" inside the newly created ClickUp folder.  
  - Config: Uses OAuth2, references folder ID from "Click Up~Create a folder" node, fixed team and space IDs.  
  - Output: List metadata including ID.  
  - Edge Cases: API errors, invalid folder ID.

---

#### 2.3 AI Task Segmentation and Processing

**Overview:**  
Utilizes GPT-4 to analyze the extracted project document and produce a structured, detailed list of onboarding tasks formatted for ClickUp import.

**Nodes Involved:**  
- Segment Task  
- OpenAI Chat Model  
- Structured Output Parser

**Node Details:**  

- **Segment Task**  
  - Type: LangChain Agent (AI agent node)  
  - Role: Sends the extracted scoping document text as input for analysis and task segmentation.  
  - Config: A detailed system prompt instructs the AI to generate 20-30 onboarding tasks with titles, descriptions, durations, and due dates in US Central Time, following strict formatting rules for ClickUp import.  
  - Input: `projectInformation` string from "Remane Doc".  
  - Output: Raw AI response with task breakdown.  
  - Edge Cases: AI output format variance, rate limits, prompt handling errors.

- **OpenAI Chat Model**  
  - Type: LangChain OpenAI Chat Model  
  - Role: Executes the GPT-4.1-mini model to process the prompt and generate the AI output.  
  - Config: Model specified as "gpt-4.1-mini", using linked OpenAI API credentials.  
  - Input: Prompt from "Segment Task" node.  
  - Output: AI-generated text response.  
  - Edge Cases: API quota exhaustion, network issues, model unavailability.

- **Structured Output Parser**  
  - Type: LangChain Structured Output Parser  
  - Role: Parses the AI text output into JSON according to a defined schema, extracting current datetime, timezone, and task list with fields (title, description, due_date).  
  - Config: Uses an example JSON schema to validate and parse AI output.  
  - Input: AI chat model output.  
  - Output: JSON object with structured tasks.  
  - Edge Cases: Parsing failures on malformed AI output.

---

#### 2.4 Task Creation Loop

**Overview:**  
Splits the parsed task list into individual tasks and iterates over them to create corresponding tasks inside the ClickUp onboarding list.

**Nodes Involved:**  
- Split Out1  
- Loop Over Items  
- Create a task

**Node Details:**  

- **Split Out1**  
  - Type: Split Out  
  - Role: Extracts the "tasks" array from the structured AI output to prepare for looping.  
  - Input: Parsed JSON from the output parser.  
  - Output: Array of task objects.  
  - Edge Cases: Empty task array, missing "tasks" field.

- **Loop Over Items**  
  - Type: Split In Batches (loop)  
  - Role: Iterates over each task item from the array, processing them one by one.  
  - Input: Task array from "Split Out1".  
  - Output: Single task JSON per iteration.  
  - Edge Cases: Large task lists impacting performance.

- **Create a task**  
  - Type: ClickUp node  
  - Role: Creates an individual task inside the ClickUp list created earlier.  
  - Config: Uses task title, description, and due_date from the current loop item; sets priority level 3 and assigns a fixed user ID (assignee).  
  - Inputs: Task JSON from loop, list ID from "Click Up~Create a list", folder ID from "Click Up~Create a folder".  
  - Output: Task creation response.  
  - Edge Cases: API limits, invalid due dates, assignee unavailability.

---

#### 2.5 Communication Setup

**Overview:**  
Sets up a dedicated Slack channel for the client and posts a welcome message to initiate communication.

**Nodes Involved:**  
- Slack | Create Channel  
- Slack | Post Message

**Node Details:**  

- **Slack | Create Channel**  
  - Type: Slack node  
  - Role: Creates a new public Slack channel named after the client’s company (spaces replaced with underscores, lowercased, appended with "_channel").  
  - Config: OAuth2 authentication with required bot permissions; channel visibility set to public.  
  - Input: Company Name from form submission.  
  - Output: Channel metadata including ID.  
  - Edge Cases: Channel name conflicts, permission errors.

- **Slack | Post Message**  
  - Type: Slack node  
  - Role: Posts a personalized welcome message to the newly created Slack channel, referencing the client’s name.  
  - Config: Uses the channel ID from the previous node to post the message.  
  - Input: Channel ID and client Name.  
  - Edge Cases: Message posting failures, rate limits.

---

#### 2.6 Notification Email

**Overview:**  
Sends a personalized welcome email to the client confirming onboarding setup with links and next steps.

**Nodes Involved:**  
- Send Welcome Email

**Node Details:**  

- **Send Welcome Email**  
  - Type: Gmail node  
  - Role: Sends a text email to the client’s email address with a welcome message, including a link to the Google Drive client folder and instructions for next steps.  
  - Config: Uses OAuth2 Gmail credentials, dynamic subject line includes client’s name, message body uses template with placeholders filled from form and folder creation nodes.  
  - Input: Client Email and Name from form, Google Drive folder ID for link.  
  - Edge Cases: Email sending failures, invalid email address, OAuth token expiry.

---

### 3. Summary Table

| Node Name               | Node Type                    | Functional Role                         | Input Node(s)                | Output Node(s)                  | Sticky Note                                                                                                  |
|-------------------------|------------------------------|---------------------------------------|-----------------------------|--------------------------------|--------------------------------------------------------------------------------------------------------------|
| On form submission1      | Form Trigger                 | Entry point, capture client data      |                             | Extract from File1             | See Sticky Note3 for workflow overview and configuration notes.                                             |
| Extract from File1       | Extract from File            | Extract text from client document     | On form submission1          | Remane Doc                    |                                                                                                              |
| Remane Doc              | Set                         | Store extracted text as project info  | Extract from File1           | Create Main Client Folder       |                                                                                                              |
| Create Main Client Folder | Google Drive                | Create client folder on Google Drive  | Remane Doc                  | Remane Folder ID               | See Sticky Note for Google Drive OAuth2 setup notes.                                                        |
| Remane Folder ID         | Set                         | Store Google Drive folder ID           | Create Main Client Folder    | Click Up~Create a folder        |                                                                                                              |
| Click Up~Create a folder | ClickUp                     | Create client folder in ClickUp       | Remane Folder ID             | Click Up~Create a list          | See Sticky Note for ClickUp API token and permissions setup.                                               |
| Click Up~Create a list   | ClickUp                     | Create onboarding list in ClickUp     | Click Up~Create a folder      | Segment Task                  |                                                                                                              |
| Segment Task             | LangChain Agent (AI)        | Analyze doc and generate task list    | Click Up~Create a list       | Split Out1                    |                                                                                                              |
| OpenAI Chat Model        | LangChain OpenAI Chat Model | Execute GPT-4 to process prompt       | Segment Task                 | Structured Output Parser        | Requires OpenAI API credentials.                                                                             |
| Structured Output Parser | LangChain Output Parser     | Parse AI output JSON                   | OpenAI Chat Model            | Segment Task                   |                                                                                                              |
| Split Out1               | Split Out                   | Extract tasks array from AI output    | Segment Task                 | Loop Over Items                |                                                                                                              |
| Loop Over Items          | Split In Batches (Loop)     | Iterate over tasks                     | Split Out1                  | Slack | Create Channel, Create a task |                                                                                                              |
| Create a task            | ClickUp                     | Create individual onboarding tasks    | Loop Over Items             | Loop Over Items                |                                                                                                              |
| Slack | Create Channel   | Slack                       | Create Slack channel for client       | Loop Over Items             | Slack | Post Message              | See Sticky Note for Slack app OAuth scopes and setup.                                                      |
| Slack | Post Message     | Slack                       | Post welcome message in Slack channel | Slack | Create Channel           | Send Welcome Email              |                                                                                                              |
| Send Welcome Email       | Gmail                       | Send onboarding welcome email         | Slack | Post Message             |                                | Requires Gmail OAuth2 credentials.                                                                            |
| Sticky Note              | Sticky Note                 | Configuration and setup instructions  |                             |                                | Contains critical setup instructions for Google Drive, ClickUp, Slack, and SMTP/email credentials.          |
| Sticky Note3             | Sticky Note                 | Workflow purpose and overview          |                             |                                | Details workflow purpose, trigger, and required form fields.                                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Form Trigger Node**  
   - Type: Form Trigger  
   - Name: "On form submission1"  
   - Configure with form title "Client Onboarding Form" and fields:  
     - Name (text, required)  
     - Email (email, required)  
     - Company Name (text, required)  
     - Website (text, required)  
     - Proposal_Scope_Document (file upload, required, accept .pdf, .doc, .docx)  
   - Save the webhook URL provided for external form submissions.

2. **Add Extract From File Node**  
   - Type: Extract From File  
   - Name: "Extract from File1"  
   - Set operation to "pdf" (for document text extraction)  
   - Binary Property Name: "Proposal_Scope_Document"  
   - Connect output of form trigger to this node.

3. **Add Set Node to Store Extracted Text**  
   - Type: Set  
   - Name: "Remane Doc"  
   - Add new string field "projectInformation" and assign it value from previous node’s extracted text (`{{$json.text}}`).  
   - Connect "Extract from File1" output to this node.

4. **Add Google Drive Node to Create Client Folder**  
   - Type: Google Drive  
   - Name: "Create Main Client Folder"  
   - Set resource to "folder" and operation to "create"  
   - Folder name: `={{ $('On form submission1').item.json['Company Name'] }} ~ Client Folder`  
   - Drive ID: "My Drive"  
   - Parent Folder ID: Use your "Onboardings" folder ID  
   - Authenticate with OAuth2 Google Drive credentials with create folder permissions.  
   - Connect "Remane Doc" output to this node.

5. **Add Set Node to Save Folder ID**  
   - Type: Set  
   - Name: "Remane Folder ID"  
   - Add string field "DriveFolderId" with value `={{ $json.id }}` from previous node’s output.  
   - Connect "Create Main Client Folder" to this node.

6. **Add ClickUp Node to Create Folder**  
   - Type: ClickUp  
   - Name: "Click Up~Create a folder"  
   - Configure to create folder with name: `={{ $('On form submission1').item.json['Company Name'] }}~Client Folder`  
   - Set fixed Team ID and Space ID as per your ClickUp workspace.  
   - Authenticate with OAuth2 ClickUp credentials.  
   - Connect "Remane Folder ID" output to this node.

7. **Add ClickUp Node to Create List**  
   - Type: ClickUp  
   - Name: "Click Up~Create a list"  
   - Configure to create list named: `={{ $('On form submission1').item.json['Company Name'] }} Onboarding`  
   - Use Team ID and Space ID consistent with previous node  
   - Use Folder ID from "Click Up~Create a folder" node (`{{$json.id}}`).  
   - Connect "Click Up~Create a folder" output to this node.

8. **Add LangChain Agent Node for Task Segmentation**  
   - Type: LangChain Agent (AI)  
   - Name: "Segment Task"  
   - Input text: `={{ $('Remane Doc').item.json.projectInformation }}`  
   - Paste the detailed system prompt provided in the original workflow to instruct GPT-4 on task extraction and formatting.  
   - Connect "Click Up~Create a list" output to this node.

9. **Add OpenAI Chat Model Node**  
   - Type: LangChain OpenAI Chat Model  
   - Name: "OpenAI Chat Model"  
   - Set model to "gpt-4.1-mini" or equivalent GPT-4 variant  
   - Connect "Segment Task" node as input.  
   - Authenticate with OpenAI API key.

10. **Add Structured Output Parser**  
    - Type: LangChain Structured Output Parser  
    - Name: "Structured Output Parser"  
    - Paste the JSON schema example defining "current_datetime", "timezone", and "tasks" array with title, description, and due_date fields.  
    - Connect "OpenAI Chat Model" output to this node.

11. **Connect Structured Output Parser back to Segment Task node**  
    - This completes the AI processing loop (ai_outputParser to ai_languageModel).

12. **Add Split Out Node**  
    - Type: Split Out  
    - Name: "Split Out1"  
    - Field to split out: "output.tasks" (the tasks array from parsed AI output)  
    - Connect "Segment Task" output to this node.

13. **Add Split In Batches Node**  
    - Type: Split In Batches  
    - Name: "Loop Over Items"  
    - Connect "Split Out1" output to this node.

14. **Add ClickUp Node to Create Task**  
    - Type: ClickUp  
    - Name: "Create a task"  
    - Configure:  
      - List: Use the list ID from "Click Up~Create a list" (`={{ $('Click Up~Create a list').item.json.id }}`)  
      - Folder: Use folder ID from "Click Up~Create a folder" (`={{ $('Click Up~Create a folder').item.json.id }}`)  
      - Team and Space IDs consistent with previous ClickUp nodes  
      - Name: `={{ $json.title }}` from current task item in loop  
      - Content: `={{ $json.description }}`  
      - Due Date: `={{ $json.due_date }}`  
      - Priority: 3  
      - Assignees: Fixed user ID `[144201222]` (replace with your team's assignee ID)  
    - Connect "Loop Over Items" output to this node.

15. **Add Slack Node to Create Channel**  
    - Type: Slack  
    - Name: "Slack | Create Channel"  
    - Channel ID: `={{ $('On form submission1').item.json['Company Name'].replace(/\\s+/g, '_').toLowerCase() + '_channel' }}`  
    - Channel visibility: public  
    - Authenticate using OAuth2 Slack credentials with bot scopes: `channels:write`, `chat:write`, `users:read.email`.  
    - Connect "Loop Over Items" output to this node (parallel to task creation).

16. **Add Slack Node to Post Message**  
    - Type: Slack  
    - Name: "Slack | Post Message"  
    - Text: Personalized welcome message including client’s name  
    - Channel ID: Use channel ID from "Slack | Create Channel" output  
    - Connect "Slack | Create Channel" output to this node.

17. **Add Gmail Node to Send Welcome Email**  
    - Type: Gmail  
    - Name: "Send Welcome Email"  
    - To: `={{ $('On form submission1').item.json.Email }}`  
    - Subject: `=Welcome to (YOUR COMPANY NAME) {{ $('On form submission1').item.json.Name }}-Your Onboarding is Complete!`  
    - Message body: Personalized message including client name, Google Drive folder link with `={{ $('Create Main Client Folder').item.json.id }}`, and next steps.  
    - Authenticate via Gmail OAuth2 credentials.  
    - Connect "Slack | Post Message" output to this node.

18. **Add Sticky Notes**  
    - Add at least two sticky notes:  
      - One for workflow overview and required form fields (similar to Sticky Note3).  
      - One for configuration notes covering Google Drive OAuth2, ClickUp API tokens, Slack OAuth scopes, and SMTP/email setup (similar to Sticky Note).

---

### 5. General Notes & Resources

| Note Content                                                                                                                                | Context or Link                                                                                      |
|---------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Before running, verify OAuth2 credentials and permissions for Google Drive, ClickUp, Slack, and Gmail are correctly configured.            | Sticky Note in workflow and official platform docs                                                  |
| Slack app requires bot token with scopes: `channels:write`, `chat:write`, `users:read.email`.                                               | Slack API documentation                                                                             |
| ClickUp API token must be generated from your ClickUp settings and configured with appropriate workspace permissions.                      | https://clickup.com/api                                                                             |
| Google Drive folder creation requires enabling Drive API and OAuth2 credentials with folder creation scope.                                 | https://developers.google.com/drive/api/v3/about-sdk                                               |
| OpenAI GPT-4 API quota and rate limits should be monitored to avoid workflow interruptions.                                                 | https://platform.openai.com/docs/rate-limits                                                       |
| Email sending uses Gmail OAuth2 for secure SMTP access; ensure the account allows API access and email sending.                             | https://developers.google.com/gmail/api/auth/scopes                                                |
| Suggested workflow triggers include form submissions tied to contract signing, payment receipt, or CRM status changes to automate onboarding. |                                                                                                    |

---

**Disclaimer:** The input text originates exclusively from an automated n8n workflow. All data processed is legal and publicly available. The workflow respects applicable content policies and contains no illegal or offensive content.