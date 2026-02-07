Automate Email Management with OpenAI Classification, Gmail Drafts & Slack Alerts

https://n8nworkflows.xyz/workflows/automate-email-management-with-openai-classification--gmail-drafts---slack-alerts-5475


# Automate Email Management with OpenAI Classification, Gmail Drafts & Slack Alerts

---

### 1. Workflow Overview

This workflow, titled **"Intelligent Email Assistant with AI Classification, Gmail Drafts, and Slack Notifications"**, automates email management by leveraging AI-based classification, Gmail draft creation, and Slack alerts. It is designed for users who want to streamline handling incoming emails by automatically categorizing them, applying appropriate Gmail labels, generating draft replies, and sending Slack notifications based on email content.

**Target Use Cases:**  
- Customer support teams automating response prioritization  
- Sales or partnership teams managing inquiries efficiently  
- Marketing teams summarizing newsletters automatically  
- Teams needing immediate alerts on action-required emails  

**Logical Blocks:**  
- **1.1 Input Reception:** Gmail Trigger node monitors incoming emails with a specific label.  
- **1.2 Email Data Extraction:** Extracts relevant email attributes for processing.  
- **1.3 AI Processing:** Uses an AI agent to classify the email content into categories with reasoning and suggested responses.  
- **1.4 AI Output Parsing & Labeling:** Parses AI output, maps categories to Gmail label IDs, and applies labels to emails.  
- **1.5 Routing by Category:** Routes emails based on classification to trigger specific actions.  
- **1.6 Action Execution:**  
  - Draft creation for Inquiry and Support emails  
  - Slack notifications for Action Items and Newsletter summaries  
- **1.7 Setup & Documentation:** Multiple sticky notes provide setup instructions and explanations for Gmail, Slack, classification logic, and error handling.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  Listens for new incoming Gmail messages that have the "AI-Agent" label, triggering the workflow on relevant emails only.

- **Nodes Involved:**  
  - Gmail Trigger - AI Agent Label

- **Node Details:**

  - **Gmail Trigger - AI Agent Label**  
    - Type: Gmail Trigger  
    - Role: Watches Gmail inbox for new emails with the "AI-Agent" label.  
    - Configuration:  
      - Polls every minute to detect new emails.  
      - Filters emails by label IDs – initially empty, requires user update with actual Gmail label ID for "AI-Agent".  
    - Input: None (trigger node)  
    - Output: Emits email metadata and content for further processing.  
    - Edge Cases:  
      - Missing or incorrect label ID will cause no triggers.  
      - Gmail OAuth2 authentication failures or token expiry.  
      - Rate limiting or API quota issues.  

#### 1.2 Email Data Extraction

- **Overview:**  
  Extracts key email fields (ID, subject, sender, content, timestamp) into structured variables for AI processing.

- **Nodes Involved:**  
  - Extract Email Data

- **Node Details:**

  - **Extract Email Data**  
    - Type: Set node  
    - Role: Restructures email input JSON into explicit variables for clarity and usage downstream.  
    - Configuration: Assigns:  
      - `emailId` ← message ID  
      - `subject` ← email subject  
      - `sender` ← email sender address  
      - `content` ← prefers text body; fallback to HTML if text missing  
      - `receivedAt` ← email timestamp  
    - Input: From Gmail Trigger  
    - Output: JSON with extracted fields  
    - Edge Cases:  
      - Emails without plain text or HTML body content (empty content).  
      - Missing or malformed date field.  

#### 1.3 AI Processing

- **Overview:**  
  Runs an AI agent to classify the email into one of four categories, providing confidence, reasoning, and additional context such as draft responses or newsletter summaries.

- **Nodes Involved:**  
  - AI Agent - Email Classifier  
  - OpenAI Chat Model (used internally by AI Agent node)

- **Node Details:**

  - **AI Agent - Email Classifier**  
    - Type: LangChain AI Agent (OpenAI backend)  
    - Role: Classifies email content into categories: Inquiry, Support, Newsletter, Actionpoint.  
    - Configuration:  
      - Input prompt includes sender, subject, and content.  
      - System message instructs the AI on classification categories and output JSON format.  
      - Output expected as JSON object with fields: category, confidence, reasoning, suggestedResponse, summary.  
    - Input: Extracted email data  
    - Output: AI response JSON string  
    - Edge Cases:  
      - AI may produce malformed or unparsable output.  
      - OpenAI API rate limits or connectivity issues.  
      - Model updates may affect response format or accuracy.  
    - Version: Uses LangChain agent with OpenAI chat model "o3"

  - **OpenAI Chat Model**  
    - Type: LangChain OpenAI Chat  
    - Role: Executes GPT-based chat completion for AI Agent node.  
    - Configuration: Model "o3", JSON response format.  
    - Input/Output: Linked internally by AI Agent node; no external connections.  
    - Edge Cases: OpenAI service availability, credential issues.  

#### 1.4 AI Output Parsing & Labeling

- **Overview:**  
  Parses the AI agent’s JSON output, maps the predicted category to the corresponding Gmail label ID, and prepares data for labeling and routing.

- **Nodes Involved:**  
  - Parse AI Classification  
  - Add Classification Label

- **Node Details:**

  - **Parse AI Classification**  
    - Type: Code node (JavaScript)  
    - Role: Parses AI output JSON string, applies fallback defaults on error, maps category to Gmail label IDs.  
    - Configuration:  
      - Parses AI output JSON.  
      - On parsing failure, defaults classification to "Support".  
      - Label mapping object must be updated by user with actual Gmail label IDs for each category.  
      - Merges original email data with classification and labelId.  
    - Input: AI Agent output  
    - Output: JSON with classification fields plus Gmail label ID and email metadata.  
    - Edge Cases:  
      - Unparsable AI output handled gracefully.  
      - Missing label IDs require user update; otherwise fallback used.

  - **Add Classification Label**  
    - Type: Gmail node (modify message)  
    - Role: Adds the classification label to the original email message.  
    - Configuration:  
      - Adds label using labelId from parsed classification.  
      - Uses messageId from Gmail Trigger.  
    - Input: Parsed classification data.  
    - Output: Passes email forward for routing.  
    - Credentials: Gmail OAuth2  
    - Edge Cases:  
      - Gmail API errors or authentication failure.  
      - Invalid label IDs causing Gmail API errors.  

#### 1.5 Routing by Category

- **Overview:**  
  Routes emails based on the classified category to trigger different actions: draft creation or Slack notifications.

- **Nodes Involved:**  
  - Route by Category

- **Node Details:**

  - **Route by Category**  
    - Type: Switch node  
    - Role: Checks the classification category string from parsed data and directs workflow along one of four outputs:  
      - Draft (for Support and Inquiry)  
      - Newsletter  
      - Actionpoint  
    - Configuration:  
      - Exact string matches for categories "Support", "Inquiry", "Newsletter", "Actionpoint"  
      - Fallback output is none (drops unclassified)  
    - Input: From Add Classification Label  
    - Output: Routes to appropriate action nodes  
    - Edge Cases:  
      - Case sensitivity requires exact category strings.  
      - Categories outside defined set are ignored.  

#### 1.6 Action Execution

- **Overview:**  
  Performs specific actions based on email classification: creates draft replies or sends Slack notifications.

- **Nodes Involved:**  
  - Create Draft Response  
  - Send Newsletter Summary to Slack  
  - Send Action Item Slack Alert

- **Node Details:**

  - **Create Draft Response**  
    - Type: Gmail node (create draft)  
    - Role: Creates a draft reply in Gmail for Inquiry and Support emails.  
    - Configuration:  
      - Draft message content from AI suggestedResponse field.  
      - Draft subject prepended with "Re: " + original subject.  
      - Draft associated with original email thread (threadId).  
      - Resource set to "draft" for draft creation.  
    - Input: Routed from Switch node (Draft output)  
    - Credentials: Gmail OAuth2  
    - Edge Cases:  
      - Empty suggestedResponse will create empty drafts.  
      - Gmail API errors or authentication issues.  

  - **Send Newsletter Summary to Slack**  
    - Type: Slack node (post message)  
    - Role: Sends AI-generated newsletter summary to configured Slack channel.  
    - Configuration:  
      - Message text should be customized (default is AI summary).  
      - Requires Slack OAuth2 credentials.  
    - Input: Routed from Switch node (Newsletter output)  
    - Edge Cases:  
      - Slack API rate limits or authentication failures.  
      - Missing or misconfigured Slack channel.  

  - **Send Action Item Slack Alert**  
    - Type: Slack node (post message)  
    - Role: Posts alert message to Slack channel for urgent Actionpoint emails.  
    - Configuration:  
      - Message text customizable, typically contains urgent task info.  
      - Requires Slack OAuth2 credentials.  
    - Input: Routed from Switch node (Actionpoint output)  
    - Edge Cases:  
      - Slack API errors.  
      - Channel or token misconfiguration.  

#### 1.7 Setup & Documentation

- **Overview:**  
  Provides essential instructions, explanations, and notes on configuration and workflow logic via sticky notes.

- **Nodes Involved (Sticky Notes):**  
  - Workflow Description  
  - Gmail Setup Instructions  
  - AI Classification Info  
  - Slack Setup Instructions  
  - Success Actions Info  
  - Error Handling Info

- **Node Details:**

  - **Workflow Description**  
    - Purpose and overall explanation, including setup requirements and customization hints.  
    - Contains branding with ZenAgent Labs logo and links.  

  - **Gmail Setup Instructions**  
    - Details Gmail label creation and how to find label IDs.  
    - Essential to update labelMapping in code node with real Gmail label IDs.  

  - **AI Classification Info**  
    - Explains AI classification criteria and categories.  
    - Describes confidence usage and classification logic.  

  - **Slack Setup Instructions**  
    - Step-by-step Slack app creation and scope setup.  
    - Channel recommendations and message customization guidance.  

  - **Success Actions Info**  
    - Summarizes what happens after classification: drafts, labels, Slack messages.  
    - Suggests extensions like logging, ticketing, webhooks, CRM integration.  

  - **Error Handling Info**  
    - Notes current fallback and error handling features.  
    - Recommends enhancements like notifications, retries, manual review.  

---

### 3. Summary Table

| Node Name                     | Node Type                      | Functional Role                      | Input Node(s)                      | Output Node(s)                                  | Sticky Note                                                                                                         |
|-------------------------------|--------------------------------|------------------------------------|----------------------------------|------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| Workflow Description           | Sticky Note                    | Overall workflow documentation     | None                             | None                                           | Describes workflow purpose, setup, and customization. Branding and ZenAgent Labs link included.                      |
| Gmail Setup Instructions       | Sticky Note                    | Gmail label setup instructions     | None                             | None                                           | Explains Gmail label creation and label ID retrieval; critical for proper label mapping.                            |
| Gmail Trigger - AI Agent Label | Gmail Trigger                 | Triggers workflow on labeled email| None                             | Extract Email Data                              | Requires Gmail OAuth2; monitored label IDs must be configured for "AI-Agent".                                       |
| Extract Email Data             | Set                            | Extracts key email fields           | Gmail Trigger                   | AI Agent - Email Classifier                      |                                                                                                                     |
| AI Agent - Email Classifier    | LangChain AI Agent             | Classifies email content            | Extract Email Data              | Parse AI Classification                         | Uses OpenAI chat model; outputs classification JSON.                                                                |
| OpenAI Chat Model             | LangChain OpenAI Chat          | AI model backend for classification| AI Agent - Email Classifier (internal) | AI Agent - Email Classifier (internal)       |                                                                                                                     |
| AI Classification Info         | Sticky Note                    | Explains AI classification logic   | None                             | None                                           | Details classification categories and criteria.                                                                      |
| Parse AI Classification        | Code (JavaScript)              | Parses AI output and maps labels    | AI Agent - Email Classifier     | Add Classification Label                        | Important to update labelMapping with real Gmail label IDs.                                                          |
| Add Classification Label       | Gmail                         | Adds Gmail label to email           | Parse AI Classification         | Route by Category                               | Gmail OAuth2 required; adds classification label to email message.                                                  |
| Route by Category              | Switch                        | Routes emails by classification     | Add Classification Label        | Create Draft Response, Send Newsletter Summary to Slack, Send Action Item Slack Alert |                                                                                                                     |
| Create Draft Response          | Gmail (draft creation)         | Creates draft reply for emails      | Route by Category               | None                                           | Drafts created for Inquiry and Support emails; requires Gmail OAuth2.                                               |
| Send Newsletter Summary to Slack | Slack (post message)          | Sends newsletter summary to Slack  | Route by Category               | None                                           | Uses Slack OAuth2; posts newsletter summaries to Slack channels.                                                    |
| Send Action Item Slack Alert   | Slack (post message)            | Sends Slack alert for action items  | Route by Category               | None                                           | Uses Slack OAuth2; posts alerts for urgent emails.                                                                  |
| Slack Setup Instructions       | Sticky Note                    | Slack integration setup instructions| None                             | None                                           | Details Slack app creation, OAuth scope setup, channel creation, and message customization.                          |
| Success Actions Info           | Sticky Note                    | Summarizes workflow actions         | None                             | None                                           | Lists workflow outcome for each email category and suggests extensions.                                             |
| Error Handling Info            | Sticky Note                    | Error handling and monitoring info  | None                             | None                                           | Describes current fallback logic and potential improvements like notifications and retries.                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Sticky Note:**  
   - Name: "Workflow Description"  
   - Content: Provide overview, branding, and setup instructions as per the original content.  
   - Position: Top-left area for documentation.

2. **Create Sticky Note:**  
   - Name: "Gmail Setup Instructions"  
   - Content: Instructions for Gmail label creation and label ID retrieval.  
   - Position: Near Gmail Trigger node area.

3. **Create Gmail Trigger Node:**  
   - Name: "Gmail Trigger - AI Agent Label"  
   - Type: Gmail Trigger  
   - Credentials: Configure Gmail OAuth2 credentials.  
   - Parameters:  
     - Set filter label IDs with the Gmail label ID for "AI-Agent" (update after first run).  
     - Poll every minute.  
   - Position: Input block.

4. **Create Set Node:**  
   - Name: "Extract Email Data"  
   - Assign variables:  
     - emailId ← `{{$json["id"]}}`  
     - subject ← `{{$json["subject"]}}`  
     - sender ← `{{$json["from"]}}`  
     - content ← `{{$json["text"] || $json["html"]}}`  
     - receivedAt ← `{{$json["date"]}}`  
   - Position: After Gmail Trigger.

5. **Create AI Agent Node (LangChain Agent):**  
   - Name: "AI Agent - Email Classifier"  
   - Parameters:  
     - Text input with email data fields (sender, subject, content).  
     - System message instructing classification into Inquiry, Support, Newsletter, Actionpoint.  
     - Output format JSON with fields: category, confidence, reasoning, suggestedResponse, summary.  
   - Connect OpenAI Chat Model as language model backend.  
   - Position: After Extract Email Data.

6. **Create OpenAI Chat Model Node:**  
   - Name: "OpenAI Chat Model"  
   - Model: "o3" (or preferred GPT model)  
   - Response format: JSON object  
   - Position: Connected internally to AI Agent node.

7. **Create Sticky Note:**  
   - Name: "AI Classification Info"  
   - Content: Explain AI classification logic and categories.  
   - Position: Near AI Agent node.

8. **Create Code Node:**  
   - Name: "Parse AI Classification"  
   - JavaScript code to:  
     - Parse AI output JSON.  
     - Fallback to Support if parsing fails.  
     - Map classification categories to Gmail label IDs (update label IDs after Gmail trigger first run).  
     - Merge classification and email data into output JSON.  
   - Position: After AI Agent node.

9. **Create Gmail Node for Labeling:**  
   - Name: "Add Classification Label"  
   - Operation: Add labels to message.  
   - Parameters:  
     - labelIds: `{{$json.labelId}}`  
     - messageId: `{{$node["Gmail Trigger - AI Agent Label"].json["id"]}}`  
   - Credentials: Gmail OAuth2.  
   - Position: After Parse AI Classification.

10. **Create Switch Node:**  
    - Name: "Route by Category"  
    - Rules:  
      - Output "Draft" if category is "Support" or "Inquiry" (case-sensitive).  
      - Output "Newsletter" if category is "Newsletter".  
      - Output "Actionpoint" if category is "Actionpoint".  
    - Fallback: None (drop unmatched).  
    - Position: After Add Classification Label.

11. **Create Gmail Node for Drafts:**  
    - Name: "Create Draft Response"  
    - Operation: Create draft message.  
    - Parameters:  
      - Message: `{{$json.suggestedResponse}}`  
      - Subject: `"Re: " + $json.subject`  
      - Thread ID: `{{$node["Gmail Trigger - AI Agent Label"].json.threadId}}`  
      - Resource: draft  
    - Credentials: Gmail OAuth2.  
    - Connect to "Draft" output of Switch.  
    - Position: Draft action block.

12. **Create Slack Node for Newsletter:**  
    - Name: "Send Newsletter Summary to Slack"  
    - Operation: Post message.  
    - Parameters: Customize message text with AI summary.  
    - Credentials: Slack OAuth2.  
    - Connect to "Newsletter" output of Switch.  
    - Position: Newsletter action block.

13. **Create Slack Node for Action Items:**  
    - Name: "Send Action Item Slack Alert"  
    - Operation: Post message.  
    - Parameters: Customize message text with action item details.  
    - Credentials: Slack OAuth2.  
    - Connect to "Actionpoint" output of Switch.  
    - Position: Action item notification block.

14. **Create Sticky Notes for Slack Setup, Success Actions Summary, and Error Handling:**  
    - Add detailed instructions for Slack OAuth2 app creation, channel setup, scopes, and message customization.  
    - Summarize workflow outcomes and suggest extensions.  
    - Document current error handling and possible improvements.  
    - Position these near corresponding functional nodes.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                             | Context or Link                                                      |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------|
| Created by [ZenAgent Labs](https://zenagentlabs.com) with branding assets and workflow design guidance.                                                                                                                                                                                                                                                                 | Workflow branding and creator website                              |
| Gmail label setup requires manual creation of labels: "AI-Agent", "Inquiry", "Support", "Newsletter", "Action-Item". Label IDs must be retrieved post-trigger run and updated in the workflow code.                                                                                                                                                                        | Gmail Setup Instructions sticky note                              |
| Slack integration requires creating a Slack App with OAuth scopes `chat:write`, `channels:read`, and `users:read`. Channels `#action-items` and `#newsletters` recommended. Message formats can be customized for mentions and emojis.                                                                                                                                     | Slack Setup Instructions sticky note                              |
| AI classification logic uses sender domain, keywords, tone, and urgency to assign emails into four categories with confidence scoring. This supports filtering and prioritization.                                                                                                                                                                                           | AI Classification Info sticky note                                |
| Error handling includes fallback to Support category on AI parsing failure and confidence scoring. Future improvements may add retry, notification, logging, and manual review queues.                                                                                                                                                                                     | Error Handling Info sticky note                                   |
| Workflow extensions suggested include logging to database/spreadsheet, ticket creation, webhook triggers, CRM integration, and custom notification channels.                                                                                                                                                                                                              | Success Actions Info sticky note                                  |
| Helpful links:  
- ZenAgent Labs: https://zenagentlabs.com  
- Slack API: https://api.slack.com  
- Gmail API documentation: https://developers.google.com/gmail/api  
- OpenAI API: https://platform.openai.com/docs                                                                                                                                                                                                | Various external resources for setup and API references          |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, adhering strictly to applicable content policies and containing no illegal or offensive materials. All data handled is legal and publicly available.