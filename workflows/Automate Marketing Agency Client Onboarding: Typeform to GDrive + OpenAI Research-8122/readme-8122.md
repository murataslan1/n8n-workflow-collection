Automate Marketing Agency Client Onboarding: Typeform to GDrive + OpenAI Research

https://n8nworkflows.xyz/workflows/automate-marketing-agency-client-onboarding--typeform-to-gdrive---openai-research-8122


# Automate Marketing Agency Client Onboarding: Typeform to GDrive + OpenAI Research

### 1. Workflow Overview

This workflow automates the entire client onboarding process for a marketing agency, triggered by a new client submitting an intake form via Typeform. It streamlines folder creation in Google Drive, collects and posts detailed client information to Slack, generates AI-driven marketing research briefs using OpenAI, and manages an approval and revision cycle for the research documents. Furthermore, it sends a welcome email to the client and maintains a well-structured Google Drive folder hierarchy for all client assets.

**Target Use Cases:**  
- Marketing agencies onboarding new clients  
- Automating intake data collection, documentation, and collaboration  
- Generating customized marketing research briefs with AI  
- Integrating Slack notifications for team visibility and approval workflow  
- Organizing client files systematically on Google Drive  

**Logical Blocks:**  
- 1.1 Input Reception: Intake form submission trigger and initial notifications  
- 1.2 Google Drive Folder Structure Creation: Main client folder and subfolders  
- 1.3 Client Communication: Welcome email dispatch  
- 1.4 AI Research Brief Generation: OpenAI content creation and Slack notifications  
- 1.5 Approval Workflow: Slack-based approval with revision capability  
- 1.6 Document Finalization: Google Docs creation and updates  
- 1.7 Feedback and Revision Loop: Collect feedback, revise AI content, and notify team  

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block detects when a client submits the intake form via Typeform and posts the detailed answers in a dedicated Slack channel for team awareness.

- **Nodes Involved:**  
  - Typeform: Client submit Intake Form  
  - Slack: Post Answers from Intake Form in #new_clients channel  

- **Node Details:**  

  - **Typeform: Client submit Intake Form**  
    - Type: Typeform Trigger  
    - Role: Listens for new submissions on a configured Typeform intake form  
    - Configuration: Uses webhook ID for receiving form data, no extra parameters needed  
    - Inputs: None (trigger node)  
    - Outputs: JSON data representing form responses  
    - Potential Failures: Webhook misconfiguration, network errors, form ID mismatch  

  - **Slack: Post Answers from Intake Form in #new_clients channel**  
    - Type: Slack node (message post)  
    - Role: Posts formatted client intake responses as a Slack message block  
    - Configuration: Uses Slack webhook, posts to channel "new_clients"  
    - Key Expressions: Dynamically constructs message text from Typeform JSON fields, including brand info, product details, marketing strategy, metrics, and access data in rich Slack blocks  
    - Inputs: Output of Typeform node  
    - Outputs: Slack message post confirmation  
    - Potential Failures: Slack authentication, channel permissions, message formatting errors  

#### 1.2 Google Drive Folder Structure Creation

- **Overview:**  
  Creates a main client folder named after the brand in Google Drive, then creates a predefined set of subfolders to organize client assets systematically.

- **Nodes Involved:**  
  - Google Drive: Create Client Folder  
  - Google Drive: Subfolder 01. Finished Ads  
  - Google Drive: Subfolder 02. Raw Footage  
  - Google Drive: Subfolder 03. Product Images  
  - Google Drive: Subfolder 04. Ideas and Drafts  
  - Google Drive: Subfolder 05. Research Assets  
  - Google Drive: Subfolder 06. Archive  
  - Google Drive: Subfolder Customers Testimonials  
  - Google Drive: Subfolder UGC Creators  
  - Google Drive: Subfolder Founder Content  
  - Google Drive: Subfolder Broll Library  
  - Google Drive: Subfolder Current Products ONLY  
  - Google Drive: Subfolder Hero Shots  
  - Google Drive: Subfolder Detail Shots  
  - Google Drive: Lifestyle Images  
  - Google Drive: Before After  
  - Google Drive: Mockups Graphics  

- **Node Details:**  

  - **Google Drive: Create Client Folder**  
    - Type: Google Drive node (folder creation)  
    - Role: Creates main client folder named after `$json['Brand name']` in a specified Google Drive ("My Drive")  
    - Configuration: Folder name is dynamic from intake form; parent folder is configured (likely "Clients")  
    - Inputs: Output from Typeform node  
    - Outputs: Folder metadata including `id` used downstream  
    - Version: v3  
    - Edge Cases: Folder name conflicts, permission issues, API rate limits  

  - **Google Drive: Subfolder [Various]**  
    - Type: Google Drive node (folder creation)  
    - Role: Creates specific subfolders under the main client folder using folderId from previous node output  
    - Configuration: Each node creates one subfolder with a fixed name (e.g., "01. Finished Ads") linked to the main client folder's ID  
    - Inputs: Output from "Google Drive: Create Client Folder" or respective parent folder node  
    - Outputs: Metadata of created subfolder  
    - Version: v3  
    - Edge Cases: Parent folder ID missing or invalid, creation failure, naming conflicts  

#### 1.3 Client Communication

- **Overview:**  
  Sends a welcome email to the new client using the email address provided in the intake form.

- **Nodes Involved:**  
  - Gmail: Welcome Email  

- **Node Details:**  

  - **Gmail: Welcome Email**  
    - Type: Gmail node (email sending)  
    - Role: Sends a welcome email with a quick-start guide to the client’s email from form data  
    - Configuration: Recipient email is dynamic from `$json['Your email']`; subject is fixed; message body is a placeholder for customization ("WRITE EMAIL HERE")  
    - Inputs: Output from Typeform node  
    - Outputs: Email send status  
    - Version: v2.1  
    - Edge Cases: Email send failure, invalid email format, Gmail OAuth credential issues  

#### 1.4 AI Research Brief Generation

- **Overview:**  
  Generates a comprehensive marketing research brief using OpenAI’s language model based on client inputs from the intake form.

- **Nodes Involved:**  
  - OpenAI: Generate Research Brief  
  - Slack: Send Research Brief Draft for Review  

- **Node Details:**  

  - **OpenAI: Generate Research Brief**  
    - Type: OpenAI node (via LangChain)  
    - Role: Creates a detailed marketing research document using a prompt template including client answers  
    - Configuration: Model "o3" selected; prompt compiles multiple client responses for context; on error continues output  
    - Inputs: Output from Typeform node  
    - Outputs: Generated text in `.message.content`  
    - Version: v1.8  
    - Edge Cases: API quota exceeded, timeout, malformed prompt, partial responses  

  - **Slack: Send Research Brief Draft for Review**  
    - Type: Slack node (message post)  
    - Role: Posts the AI-generated draft research brief to a Slack channel ("n8n_notifs") for team review  
    - Configuration: Posts with message blocks containing the research brief content dynamically  
    - Inputs: Output from OpenAI node  
    - Outputs: Slack post confirmation  
    - Version: v2.3  
    - Edge Cases: Slack API errors, message size limits  

#### 1.5 Approval Workflow

- **Overview:**  
  Manages team approval of the research brief through Slack. If approved, proceeds to document creation; if declined, initiates feedback collection.

- **Nodes Involved:**  
  - Slack: Approval of Research Brief  
  - If: Slack Approval for Research Brief  
  - Slack: Ask for Feedback  

- **Node Details:**  

  - **Slack: Approval of Research Brief**  
    - Type: Slack node (send and wait for response)  
    - Role: Sends an approval request message and waits for double approval or decline  
    - Configuration: Uses "n8n_notifs" channel; message includes client brand name; operation is "sendAndWait" with double approval  
    - Inputs: Output from Slack: Send Research Brief Draft for Review  
    - Outputs: Approval status in `$json.data.approved`  
    - Version: v2.3  
    - Edge Cases: No response timeout, partial approval, Slack permission issues  

  - **If: Slack Approval for Research Brief**  
    - Type: If node  
    - Role: Branches workflow based on approval result: true (approved) or false (declined)  
    - Configuration: Checks if `$json.data.approved` is true; proceeds accordingly  
    - Inputs: Output from Slack: Approval of Research Brief  
    - Outputs: Two branches - approval (true) and feedback (false)  
    - Version: v2.2  
    - Edge Cases: Missing approval data, evaluation errors  

  - **Slack: Ask for Feedback**  
    - Type: Slack node (message post)  
    - Role: Requests team members to reply with feedback for revision in Slack thread  
    - Configuration: Posts in "n8n_notifs" channel  
    - Inputs: Output from If node (decline branch)  
    - Outputs: Confirmation of message post  
    - Version: v2.3  
    - Edge Cases: Slack API errors  

#### 1.6 Document Finalization

- **Overview:**  
  Creates and updates Google Docs with the approved research brief content, then notifies the team in Slack.

- **Nodes Involved:**  
  - Google Docs: Create a Document  
  - Google Docs: Update Document Research Brief  
  - Slack: Notify Research brief is in Google Drive  

- **Node Details:**  

  - **Google Docs: Create a Document**  
    - Type: Google Docs node (document creation)  
    - Role: Creates a new Google Doc titled with the client’s brand name for final research brief  
    - Configuration: Title is dynamic; driveId is set to "sharedWithMe"  
    - Inputs: Approval branch from If node  
    - Outputs: Document metadata including `id`  
    - Version: v2  
    - Edge Cases: Permission issues, drive access errors  

  - **Google Docs: Update Document Research Brief**  
    - Type: Google Docs node (document update)  
    - Role: Inserts the research brief content from OpenAI into the newly created document  
    - Configuration: Inserts text at document start; documentURL is the created document’s ID  
    - Inputs: Output from Google Docs: Create a Document  
    - Outputs: Update operation status  
    - Version: v2  
    - Edge Cases: Document locked, update conflicts  

  - **Slack: Notify Research brief is in Google Drive**  
    - Type: Slack node (message post)  
    - Role: Notifies the team that the research brief is available in Google Drive with a clickable link  
    - Configuration: Posts to "n8n_notifs" channel with document URL constructed dynamically  
    - Inputs: Output from Google Docs: Update Document Research Brief  
    - Outputs: Slack message post confirmation  
    - Version: v2.3  
    - Edge Cases: Slack API errors  

#### 1.7 Feedback and Revision Loop

- **Overview:**  
  If the research brief is declined, collects feedback from Slack replies, generates a revised brief using OpenAI, and repeats the notification and approval cycle.

- **Nodes Involved:**  
  - Slack: Capture Feedback  
  - OpenAI: Revise Research Brief  
  - Slack: Send Revised Research Brief  
  - Slack (final approval reminder)  
  - Google Docs: Create a Document - Revised  
  - Google Docs: Update Revised Document Research Brief  
  - Slack: Notify Revised Research brief is in Google Drive  

- **Node Details:**  

  - **Slack: Capture Feedback**  
    - Type: Slack node (retrieve replies)  
    - Role: Fetches all replies in the feedback thread where team members provided revision comments  
    - Configuration: Uses timestamp from original feedback message  
    - Inputs: Output from Slack: Ask for Feedback  
    - Outputs: Array of feedback messages  
    - Version: v2.3  
    - Edge Cases: Reply fetch failures, empty thread  

  - **OpenAI: Revise Research Brief**  
    - Type: OpenAI node (via LangChain)  
    - Role: Generates a revised research brief based on original brief and collected feedback  
    - Configuration: Model "o3"; prompt instructs to revise using feedback and original content dynamically  
    - Inputs: Feedback text from Slack: Capture Feedback  
    - Outputs: Revised research brief content  
    - Version: v1.8  
    - Edge Cases: API errors, prompt context size limits  

  - **Slack: Send Revised Research Brief**  
    - Type: Slack node (message post)  
    - Role: Posts revised research brief for team final review in Slack channel  
    - Configuration: Posts with message blocks and dynamic content  
    - Inputs: Output from OpenAI: Revise Research Brief  
    - Outputs: Slack post confirmation  
    - Version: v2.3  
    - Edge Cases: Slack message length, API errors  

  - **Slack (final approval reminder)**  
    - Type: Slack node (send and wait)  
    - Role: Sends final approval request message with instruction to work outside n8n if still unapproved  
    - Configuration: Sends to "n8n_notifs" channel  
    - Inputs: Output from Slack: Send Revised Research Brief  
    - Outputs: Approval interaction  
    - Version: v2.3  
    - Edge Cases: No response, permission issues  

  - **Google Docs: Create a Document - Revised**  
    - Type: Google Docs node (document creation)  
    - Role: Creates a new document for the revised research brief  
    - Configuration: Same title pattern as original  
    - Inputs: Output from Slack final approval reminder (implied)  
    - Outputs: Document metadata  
    - Version: v2  
    - Edge Cases: Drive permission errors  

  - **Google Docs: Update Revised Document Research Brief**  
    - Type: Google Docs node (document update)  
    - Role: Inserts revised brief content into the new document  
    - Configuration: Inserts text dynamically from OpenAI revised output  
    - Inputs: Output from Google Docs: Create a Document - Revised  
    - Outputs: Update confirmation  
    - Version: v2  
    - Edge Cases: Document locked, update conflicts  

  - **Slack: Notify Revised Research brief is in Google Drive**  
    - Type: Slack node (message post)  
    - Role: Notifies team about the availability of the revised research brief in Google Drive with a direct link  
    - Configuration: Posts in "n8n_notifs" channel with link to new document  
    - Inputs: Output from Google Docs: Update Revised Document Research Brief  
    - Outputs: Slack message confirmation  
    - Version: v2.3  
    - Edge Cases: Slack API errors  

---

### 3. Summary Table

| Node Name                                   | Node Type                | Functional Role                                     | Input Node(s)                                  | Output Node(s)                                               | Sticky Note                                                                                           |
|---------------------------------------------|--------------------------|----------------------------------------------------|-----------------------------------------------|--------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| Typeform: Client submit Intake Form          | Typeform Trigger         | Detect new client intake form submission           | None                                          | Slack: Post Answers..., Google Drive: Create Client Folder, OpenAI: Generate Research Brief, Gmail: Welcome Email | Step 1: Form Submission - Configure Typeform ID to trigger workflow                                  |
| Slack: Post Answers from Intake Form in #new_clients channel | Slack                    | Post client intake answers to Slack for team       | Typeform: Client submit Intake Form           | None                                                         | Step 3: Notify Team - Sends intake form responses to Slack                                          |
| Google Drive: Create Client Folder           | Google Drive (folder)    | Creates main client folder in Google Drive          | Typeform: Client submit Intake Form           | Google Drive: Subfolder 01. Finished Ads, Subfolder 02. Raw Footage, Subfolder 03. Product Images, Subfolder 04. Ideas and Drafts, Subfolder 05. Research Assets, Subfolder 06. Archive | Step 2: Create Folder Structure - Creates main client folder                                         |
| Google Drive: Subfolder 01. Finished Ads     | Google Drive (folder)    | Creates subfolder "01. Finished Ads"                 | Google Drive: Create Client Folder             | None                                                         | Subfolder Creation - Organized folder structure for client assets                                   |
| Google Drive: Subfolder 02. Raw Footage      | Google Drive (folder)    | Creates subfolder "02. Raw Footage"                   | Google Drive: Create Client Folder             | Google Drive: Subfolder Customers Testimonials, UGC Creators, Founder Content, Broll Library, Current Products ONLY | Subfolder Creation                                                                                   |
| Google Drive: Subfolder Customers Testimonials | Google Drive (folder)    | Creates subfolder "Customers Testimonials"           | Google Drive: Subfolder 02. Raw Footage        | None                                                         | Subfolder Creation                                                                                   |
| Google Drive: Subfolder UGC Creators         | Google Drive (folder)    | Creates subfolder "UGC Creators"                      | Google Drive: Subfolder 02. Raw Footage        | None                                                         | Subfolder Creation                                                                                   |
| Google Drive: Subfolder Founder Content      | Google Drive (folder)    | Creates subfolder "Founder Content"                   | Google Drive: Subfolder 02. Raw Footage        | None                                                         | Subfolder Creation                                                                                   |
| Google Drive: Subfolder Broll Library        | Google Drive (folder)    | Creates subfolder "Broll Library"                     | Google Drive: Subfolder 02. Raw Footage        | None                                                         | Subfolder Creation                                                                                   |
| Google Drive: Subfolder Current Products ONLY | Google Drive (folder)    | Creates subfolder "Current Products ONLY"             | Google Drive: Subfolder 02. Raw Footage        | None                                                         | Subfolder Creation                                                                                   |
| Google Drive: Subfolder 03. Product Images   | Google Drive (folder)    | Creates subfolder "03. Product Images"                | Google Drive: Create Client Folder             | Google Drive: Hero Shots, Detail Shots, Lifestyle Images, Before After, Mockups Graphics | Subfolder Creation                                                                                   |
| Google Drive: Subfolder Hero Shots           | Google Drive (folder)    | Creates subfolder "Hero Shots"                         | Google Drive: Subfolder 03. Product Images     | None                                                         | Subfolder Creation                                                                                   |
| Google Drive: Subfolder Detail Shots         | Google Drive (folder)    | Creates subfolder "Detail Shots"                       | Google Drive: Subfolder 03. Product Images     | None                                                         | Subfolder Creation                                                                                   |
| Google Drive: Lifestyle Images                | Google Drive (folder)    | Creates subfolder "Lifestyle Images"                   | Google Drive: Subfolder 03. Product Images     | None                                                         | Subfolder Creation                                                                                   |
| Google Drive: Before After                    | Google Drive (folder)    | Creates subfolder "Before After"                       | Google Drive: Subfolder 03. Product Images     | None                                                         | Subfolder Creation                                                                                   |
| Google Drive: Mockups Graphics                | Google Drive (folder)    | Creates subfolder "Mockups Graphics"                   | Google Drive: Subfolder 03. Product Images     | None                                                         | Subfolder Creation                                                                                   |
| Google Drive: Subfolder 04. Ideas and Drafts | Google Drive (folder)    | Creates subfolder "04. Ideas and Drafts"               | Google Drive: Create Client Folder             | None                                                         | Subfolder Creation                                                                                   |
| Google Drive: Subfolder 05. Research Assets  | Google Drive (folder)    | Creates subfolder "05. Research Assets"                | Google Drive: Create Client Folder             | None                                                         | Subfolder Creation                                                                                   |
| Google Drive: Subfolder 06. Archive           | Google Drive (folder)    | Creates subfolder "06. Archive"                         | Google Drive: Create Client Folder             | None                                                         | Subfolder Creation                                                                                   |
| Gmail: Welcome Email                          | Gmail                    | Sends a welcome email to the client                     | Typeform: Client submit Intake Form            | None                                                         | Step 4: Welcome Email - Sends automated welcome email                                               |
| OpenAI: Generate Research Brief              | OpenAI                   | Generates marketing research brief from client inputs | Typeform: Client submit Intake Form            | Slack: Send Research Brief Draft for Review                   | Step 5: AI Research Brief - Generates marketing research document                                   |
| Slack: Send Research Brief Draft for Review  | Slack                    | Posts AI-generated research brief for team review      | OpenAI: Generate Research Brief                | Slack: Approval of Research Brief                              | Step 6: Approval Workflow - Sends research brief for review                                        |
| Slack: Approval of Research Brief            | Slack                    | Collects approval/decline from team                      | Slack: Send Research Brief Draft for Review    | If: Slack Approval for Research Brief                          | Step 6: Approval Workflow                                                                          |
| If: Slack Approval for Research Brief        | If                       | Branches workflow on approval status                     | Slack: Approval of Research Brief              | Google Docs: Create a Document (if approved), Slack: Ask for Feedback (if declined) | Step 6: Approval Workflow                                                                          |
| Google Docs: Create a Document                | Google Docs              | Creates Google Doc for approved research brief           | If: Slack Approval for Research Brief          | Google Docs: Update Document Research Brief                    | Step 7: Create Document - Creates doc if approved                                                  |
| Google Docs: Update Document Research Brief  | Google Docs              | Inserts research brief content into Google Doc           | Google Docs: Create a Document                  | Slack: Notify Research brief is in Google Drive                | Step 7: Create Document                                                                          |
| Slack: Notify Research brief is in Google Drive | Slack                    | Notifies team of research brief document availability    | Google Docs: Update Document Research Brief    | Slack: Approval of Research Brief (loop)                       | Step 7: Create Document                                                                          |
| Slack: Ask for Feedback                        | Slack                    | Requests revision feedback on research brief              | If: Slack Approval for Research Brief (decline branch) | Slack: Capture Feedback                                         | Revision Process - Collects feedback for revision                                                 |
| Slack: Capture Feedback                        | Slack                    | Captures replies with feedback for revision               | Slack: Ask for Feedback                         | OpenAI: Revise Research Brief                                  | Revision Process                                                                                   |
| OpenAI: Revise Research Brief                  | OpenAI                   | Revises research brief based on feedback                    | Slack: Capture Feedback                         | Slack: Send Revised Research Brief                             | Revision Process                                                                                   |
| Slack: Send Revised Research Brief             | Slack                    | Sends revised research brief for final review               | OpenAI: Revise Research Brief                   | Slack (final approval reminder)                                | Revision Process                                                                                   |
| Slack (final approval reminder)                 | Slack                    | Sends final approval request with instructions              | Slack: Send Revised Research Brief              | Google Docs: Create a Document - Revised, or external          | Revision Process                                                                                   |
| Google Docs: Create a Document - Revised        | Google Docs              | Creates new Google Doc for revised research brief            | Slack (final approval reminder)                  | Google Docs: Update Revised Document Research Brief           | Revision Process                                                                                   |
| Google Docs: Update Revised Document Research Brief | Google Docs              | Inserts revised content into new Google Doc                   | Google Docs: Create a Document - Revised         | Slack: Notify Revised Research brief is in Google Drive       | Revision Process                                                                                   |
| Slack: Notify Revised Research brief is in Google Drive | Slack                    | Notifies team about revised research brief availability      | Google Docs: Update Revised Document Research Brief | None                                                         | Revision Process                                                                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Typeform Trigger Node**  
   - Type: Typeform Trigger  
   - Configure webhook with your Typeform intake form ID that collects client onboarding data  

2. **Create Slack Node to Post Intake Answers**  
   - Type: Slack node (send message)  
   - Configure with Slack credentials and webhook targeting "#new_clients" channel  
   - Construct message text using expressions to format all intake form fields into Slack blocks for readability  

3. **Create Google Drive Node to Create Client Folder**  
   - Type: Google Drive node (create folder)  
   - Set folder name dynamically to `{{$json["Brand name"]}}` from Typeform data  
   - Set parent folder to your designated "Clients" folder in Google Drive  

4. **Create Google Drive Nodes for Subfolders**  
   - For each subfolder (e.g., "01. Finished Ads", "02. Raw Footage", etc.), create a Google Drive folder node  
   - Set each subfolder’s parent folder ID to the output `id` of the main client folder node  
   - Maintain consistent naming as per workflow  

5. **Create Gmail Node for Welcome Email**  
   - Type: Gmail node (send email)  
   - Set recipient to `{{$json["Your email"]}}` from form data  
   - Compose welcome message and subject (e.g., "Welcome to Marketing Agency!")  
   - Configure Gmail OAuth2 credentials  

6. **Create OpenAI Node to Generate Research Brief**  
   - Type: OpenAI node (using LangChain integration)  
   - Use "o3" model (or preferred model)  
   - Build prompt by injecting multiple intake form answers to form a comprehensive marketing research brief prompt  
   - Set "onError" to continue regular output to handle partial failures  

7. **Create Slack Node to Send Research Brief Draft**  
   - Type: Slack node (send message with blocks)  
   - Post content from OpenAI output `.message.content` to a notification channel (e.g., "n8n_notifs")  
   - Use message blocks for formatting  

8. **Create Slack Node for Approval Request**  
   - Type: Slack node (sendAndWait)  
   - Ask team to approve or decline the research brief  
   - Configure double approval mode in Slack  

9. **Create If Node to Branch on Approval**  
   - Condition: Check if `$json.data.approved` is true  
   - True branch proceeds to Google Docs document creation  
   - False branch proceeds to request feedback  

10. **Create Slack Node to Ask for Feedback**  
    - Posts message in Slack requesting feedback replies in thread  

11. **Create Slack Node to Capture Feedback Replies**  
    - Retrieves all replies in the feedback thread for processing  

12. **Create OpenAI Node to Revise Research Brief**  
    - Uses collected feedback and original research brief content to generate a revised version  

13. **Create Slack Node to Send Revised Research Brief**  
    - Posts the revised document for final review in Slack  

14. **Create Slack Node for Final Approval Reminder**  
    - Sends a final approval message with instructions to handle outside automation if declined again  

15. **Create Google Docs Node to Create Document (Original and Revised)**  
    - Create new Google Docs documents titled with the client’s brand name for research briefs  

16. **Create Google Docs Nodes to Update Document Content**  
    - Inserts AI-generated brief content into the created Google Docs  

17. **Create Slack Nodes to Notify Team of Document Availability**  
    - Posts links to the Google Docs in Slack notification channel for visibility  

18. **Connect Nodes According to Workflow Logic**  
    - Trigger → Slack post answers + Google Drive folder creation + OpenAI generate brief + Gmail welcome email  
    - Google Drive folder creation → create all subfolders  
    - OpenAI generate brief → Slack send draft → Slack approval → If node  
    - If approved → Google Docs create → Google Docs update → Slack notify  
    - If declined → Slack ask feedback → Slack capture feedback → OpenAI revise → Slack send revised → Slack final approval → Google Docs create revised → update revised → Slack notify revised  

19. **Configure Credentials**  
    - Typeform: API key & form webhook setup  
    - Slack: OAuth2 with appropriate scopes (chat:write, channels:read, chat:write.public, reactions:read)  
    - Google Drive & Docs: OAuth2 with Drive and Docs scopes  
    - Gmail: OAuth2 for sending emails  
    - OpenAI: API key with access to GPT models  

20. **Test the Workflow**  
    - Submit a sample intake form and verify each step: folder creation, Slack notifications, AI brief generation, approval cycle, document creation, and email sending  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Context or Link                                                                                              |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| This workflow automates the complete client onboarding for marketing agencies, saving 2-3 hours per client by creating folders, posting Slack notifications, generating AI research briefs, and managing approvals. Requires accounts and API keys for Typeform, Slack, Google Drive/Docs/Gmail, and OpenAI. Setup includes configuring webhooks, Slack channels, Google Drive folder structure, and email templates.                                                                                                                                                                                                                                                                                                                                                                   | Summary and setup instructions from the main sticky note at start of workflow                                |
| Step 1: Form Submission - Configure your Typeform ID in the Configuration node to activate the trigger on client form submission.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Sticky Note1                                                                                                |
| Step 2: Create Folder Structure - Automatically creates main client folder and subfolders in Google Drive for organized assets.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Sticky Note2                                                                                                |
| Subfolder Creation - Creates organized, named subfolders for various asset types under the client folder.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Sticky Note3                                                                                                |
| Step 3: Notify Team - Sends detailed intake responses to Slack "#new_clients" channel for immediate visibility.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Sticky Note4                                                                                                |
| Step 4: Welcome Email - Sends an automated welcome email to the client’s provided email address.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Sticky Note5                                                                                                |
| Step 5: AI Research Brief - Uses OpenAI to generate a comprehensive marketing research document based on intake answers.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Sticky Note6                                                                                                |
| Step 6: Approval Workflow - Sends research brief draft to Slack for team approval with options to approve or send back for revision.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Sticky Note7                                                                                                |
| Step 7: Create Document - If approved, creates a Google Doc with the research brief text and notifies the team.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Sticky Note8                                                                                                |
| Revision Process - If declined, collects feedback from Slack replies, generates revised brief with OpenAI, and repeats notification and approval steps.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Sticky Note9                                                                                                |

---

**Disclaimer:** The content above is generated from an automated n8n workflow and complies with all content policies. It contains no illegal or protected information. All data processed are legal and publicly accessible.