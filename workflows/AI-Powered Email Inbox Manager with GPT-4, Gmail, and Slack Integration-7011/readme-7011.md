AI-Powered Email Inbox Manager with GPT-4, Gmail, and Slack Integration

https://n8nworkflows.xyz/workflows/ai-powered-email-inbox-manager-with-gpt-4--gmail--and-slack-integration-7011


# AI-Powered Email Inbox Manager with GPT-4, Gmail, and Slack Integration

### 1. Workflow Overview

This workflow is an AI-powered email inbox manager designed to automate the processing of incoming Gmail messages using GPT-4 via OpenAI, combined with Slack for team notifications. It targets users who want to streamline email classification, labeling, reply drafting, and team alerts without manual inbox management.

The workflow logically divides into the following blocks:

- **1.1 Input Reception**: Gmail Trigger node monitors the inbox for unread emails every minute, capturing fresh messages to process.

- **1.2 Email Classification**: A GPT-4-powered Text Classifier categorizes emails into five defined groups: Internal, Customer Support, Promotions, Admin/Finance, and Sales Opportunities.

- **1.3 Label Application**: Depending on the classification result, Gmail nodes apply corresponding labels to emails for organization.

- **1.4 AI-Generated Responses**: For each category, a dedicated OpenAI Chat Model node creates context-aware draft replies or summaries tailored to the email content.

- **1.5 Draft Creation**: The generated AI responses are saved as draft emails in Gmail, ready for review or sending.

- **1.6 Conditional Actions & Notifications**: Additional logic filters promotional emails for relevance and marks irrelevant ones as read, while Sales Opportunity emails trigger Slack notifications to alert the team.

- **1.7 Slack Notifications**: Slack nodes notify the team about new drafts and important sales opportunities, boosting real-time collaboration.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  Captures new unread Gmail messages, triggering the workflow every minute to process incoming emails continuously.

- **Nodes Involved:**  
  - Gmail Trigger

- **Node Details:**

  - **Gmail Trigger**  
    - Type: Trigger node for Gmail  
    - Configuration: Polls every 1 minute, filters only UNREAD emails  
    - Inputs: None (trigger)  
    - Outputs: Emits new unread emails with full message data  
    - Credentials: OAuth2 Gmail account  
    - Edge Cases: Potential auth token expiration; Gmail API rate limits; network timeouts  
    - Notes: Ensures only fresh emails are processed to avoid duplicates

#### 2.2 Email Classification

- **Overview:**  
  Uses GPT-4 to classify email text into one of five categories with contextual understanding beyond keywords.

- **Nodes Involved:**  
  - Text Classifier  
  - OpenAI Chat Model (linked as AI language model for Text Classifier)

- **Node Details:**

  - **Text Classifier**  
    - Type: Langchain text classifier node using GPT-4  
    - Configuration: Input text from the email body; categories defined with descriptions and keywords  
    - Categories:
      - Internal (company domain emails)  
      - Customer Support  
      - Promotions  
      - Admin/Finance  
      - Sales Opportunities  
    - Inputs: Email text from Gmail Trigger  
    - Outputs: Classification result with category label  
    - Edge Cases: Misclassification due to ambiguous text; API quota limits; empty or malformed emails  
    - Version: 1.1

  - **OpenAI Chat Model**  
    - Type: Langchain chat model node using GPT-4  
    - Role: Supports Text Classifier with enhanced classification logic  
    - Inputs: Text Classifier calls this model internally  
    - Outputs: Classification results passed back  
    - Credentials: OpenAI API  
    - Version: 1.2

#### 2.3 Label Application

- **Overview:**  
  Applies Gmail labels corresponding to the classification category to organize the inbox automatically.

- **Nodes Involved:**  
  - Internal  
  - Customer Support  
  - Promotion  
  - Admin/Finance  
  - Sales Opportunity

- **Node Details:**

  Each node is a Gmail node configured to add a specific label to the email message ID.

  - **Internal, Customer Support, Promotion, Admin/Finance, Sales Opportunity**  
    - Type: Gmail node, operation “addLabels”  
    - Configuration: Each node applies one unique Gmail label ID relevant to its category  
    - Inputs: Message ID from Text Classifier output  
    - Outputs: Forward email data to AI response nodes  
    - Credentials: OAuth2 Gmail  
    - Edge Cases: Label ID incorrect or deleted; Gmail API errors; message ID missing  
    - Version: 2.1

#### 2.4 AI-Generated Responses

- **Overview:**  
  For each email category, a dedicated GPT-4 prompt generates a draft reply or summary tailored to the context and role.

- **Nodes Involved:**  
  - Message a model (Promotions)  
  - Message a model1 (Internal)  
  - Message a model2 (Customer Support)  
  - Message a model3 (Admin/Finance)  
  - Message a model4 (Sales Opportunity)

- **Node Details:**

  Each node uses the OpenAI node (Langchain) with category-specific system prompt instructions:

  - **Message a model (Promotions)**  
    - Task: Summarize promotional offer and recommend if worth pursuing  
    - Inputs: Email text from Gmail Trigger  
    - Outputs: JSON containing summary and recommendation  
    - Credentials: OpenAI API  
    - Edge Cases: Ambiguous promotional content; model API errors

  - **Message a model1 (Internal)**  
    - Task: Executive assistant style response for internal team emails  
    - Outputs: Subject and message draft

  - **Message a model2 (Customer Support)**  
    - Task: Customer service response; redirect out-of-scope queries to support email

  - **Message a model3 (Admin/Finance)**  
    - Task: Summarize invoices, payments, or account charges clearly

  - **Message a model4 (Sales Opportunity)**  
    - Task: Draft professional reply including contact details and questions; create Slack notification text

  - Common details:  
    - Model: GPT-4 (gpt-4o-mini variant)  
    - Inputs: Email text  
    - Outputs: JSON with structured content (subject, message, notification)  
    - Edge Cases: API rate limits; incomplete input text; unexpected prompt results  
    - Version: 1.8  

#### 2.5 Draft Creation

- **Overview:**  
  Saves AI-generated responses as draft emails in Gmail for user review or sending.

- **Nodes Involved:**  
  - Create a draft (Internal)  
  - Create a draft2 (Customer Support)  
  - Create a draft1 (Admin/Finance)  
  - Create a draft3 (Sales Opportunity)

- **Node Details:**

  Each node creates a draft using the OpenAI-generated subject and message content:

  - Type: Gmail node, resource “draft”, operation create  
  - Inputs: Subject and message from corresponding AI node output  
  - Credentials: OAuth2 Gmail  
  - Edge Cases: Draft creation failure; invalid message content; Gmail API errors  
  - Version: 2.1

#### 2.6 Conditional Actions & Notifications

- **Overview:**  
  Handles conditional logic for promotional emails and marks irrelevant promotions as read; also triggers Slack notifications for sales opportunities.

- **Nodes Involved:**  
  - If (checks promotion recommendation)  
  - Mark a message as read1 (marks unworthy promotions as read)

- **Node Details:**

  - **If**  
    - Type: Conditional node  
    - Condition: Checks if the promotion recommendation contains “yes” (case sensitive)  
    - Inputs: Output from Message a model (Promotions)  
    - Outputs: If true, continue; if false, mark message as read  
    - Edge Cases: Missing or malformed recommendation field

  - **Mark a message as read1**  
    - Type: Gmail node  
    - Operation: Mark message as read  
    - Inputs: Message ID from Text Classifier node  
    - Credentials: OAuth2 Gmail  
    - Edge Cases: Message already read; Gmail API errors

#### 2.7 Slack Notifications

- **Overview:**  
  Notifies team members via Slack about new drafts for internal emails and sales opportunities to improve real-time awareness.

- **Nodes Involved:**  
  - Slack (notification for Internal category drafts)  
  - Slack1 (notification for Sales Opportunity notifications)

- **Node Details:**

  - **Slack**  
    - Type: Slack node  
    - Configuration: Sends text “Internal: New Draft Created” to a specific Slack channel (ID: C08KU6HK28H)  
    - Authentication: OAuth2 Slack  
    - Triggered after draft creation for Internal emails  
    - Edge Cases: Slack API rate limits; invalid channel ID; OAuth token expiration

  - **Slack1**  
    - Type: Slack node  
    - Configuration: Sends notification text generated by Message a model4 (Sales Opportunity) to the same Slack channel  
    - Inputs: Notification message from AI output  
    - Authentication: OAuth2 Slack  
    - Edge Cases: Same as above

---

### 3. Summary Table

| Node Name           | Node Type                                | Functional Role                            | Input Node(s)           | Output Node(s)                      | Sticky Note                                                         |
|---------------------|-----------------------------------------|--------------------------------------------|------------------------|------------------------------------|--------------------------------------------------------------------|
| Gmail Trigger       | Gmail Trigger                           | Input reception of unread emails            | None                   | Text Classifier                    | Checks Gmail every 1 minute; filters UNREAD emails; triggers workflow |
| Text Classifier     | Langchain Text Classifier               | Classify email text into 5 categories       | Gmail Trigger          | Internal, Customer Support, Promotion, Admin/Finance, Sales Opportunity | AI-powered classification with GPT-4; context-aware categories     |
| OpenAI Chat Model   | Langchain Chat Model                    | Support for classification logic            | Text Classifier (AI)   | Text Classifier                    | Enhances classifier accuracy with GPT-4                            |
| Internal            | Gmail Node (Add Labels)                 | Apply “Internal” label                       | Text Classifier        | Message a model1                   | Labels emails from company domain                                  |
| Customer Support    | Gmail Node (Add Labels)                 | Apply “Customer Support” label               | Text Classifier        | Message a model2                   | Labels client/customer related emails                              |
| Promotion           | Gmail Node (Add Labels)                 | Apply “Promotions” label                      | Text Classifier        | Message a model                   | Labels promotional emails                                          |
| Admin/Finance       | Gmail Node (Add Labels)                 | Apply “Admin/Finance” label                   | Text Classifier        | Message a model3                   | Labels invoices, payments, finance emails                         |
| Sales Opportunity   | Gmail Node (Add Labels)                 | Apply “Sales Opportunity” label               | Text Classifier        | Message a model4                   | Labels sales-related emails                                        |
| Message a model     | OpenAI Node (Langchain)                 | Generate response for Promotions             | Promotion              | If                               | Summarizes promotions and recommends action                       |
| Message a model1    | OpenAI Node (Langchain)                 | Generate executive assistant reply           | Internal               | Create a draft                    | Drafts replies for internal emails                                |
| Message a model2    | OpenAI Node (Langchain)                 | Generate customer support reply               | Customer Support       | Create a draft2                   | Drafts client service responses                                   |
| Message a model3    | OpenAI Node (Langchain)                 | Generate finance-related summary/reply       | Admin/Finance          | Create a draft1                   | Drafts payment and invoice summaries                             |
| Message a model4    | OpenAI Node (Langchain)                 | Generate sales opportunity response + Slack notification | Sales Opportunity      | Create a draft3, Slack1           | Drafts sales replies; prepares Slack notification                |
| If                  | Conditional Node                       | Check if promotion should be pursued         | Message a model        | Mark a message as read1           | Filters promotions based on AI recommendation                    |
| Mark a message as read1 | Gmail Node (Mark as Read)            | Mark email as read if promotion not recommended | If (false branch)      | None                            | Ignores unworthy promotions by marking them read                 |
| Create a draft       | Gmail Node (Create Draft)              | Save internal email reply draft               | Message a model1       | Slack                            | Saves AI-generated drafts for internal emails                    |
| Create a draft2      | Gmail Node (Create Draft)              | Save customer support reply draft             | Message a model2       | None                            | Saves AI-generated drafts for customer support                   |
| Create a draft1      | Gmail Node (Create Draft)              | Save finance reply draft                       | Message a model3       | None                            | Saves AI-generated drafts for finance emails                     |
| Create a draft3      | Gmail Node (Create Draft)              | Save sales opportunity reply draft            | Message a model4       | Slack1                          | Saves draft and triggers Slack alert                             |
| Slack               | Slack Node                            | Notify team of new internal draft             | Create a draft         | None                            | Sends notification to Slack channel                              |
| Slack1              | Slack Node                            | Notify team of sales opportunity               | Message a model4       | None                            | Sends sales opportunity notification to Slack                   |
| Sticky Note         | Sticky Note                           | Documentation and workflow explanation        | None                   | None                            | Workflow overview and detailed explanation                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger Node**  
   - Type: Gmail Trigger  
   - Poll every 1 minute  
   - Filter: Label IDs include “UNREAD”  
   - Connect OAuth2 credentials for Gmail  
   - Position: Start node  

2. **Add Text Classifier Node**  
   - Type: Langchain Text Classifier (GPT-4)  
   - Input: Email text from Gmail Trigger (expression: `={{ $json.text }}`)  
   - Define categories with descriptions: Internal, Customer Support, Promotions, Admin/Finance, Sales Opportunity  
   - Connect OpenAI Chat Model for classification support  
   - Credentials: OpenAI API (GPT-4)  

3. **Create OpenAI Chat Model Node**  
   - Type: Langchain Chat Model (GPT-4)  
   - Model: gpt-4.1-mini  
   - No extra options needed  
   - Connect as AI language model for Text Classifier  

4. **Create Gmail Label Nodes (5 total)**  
   For each category (Internal, Customer Support, Promotions, Admin/Finance, Sales Opportunity):  
   - Type: Gmail node  
   - Operation: addLabels  
   - Label ID: specific to category (must be created in Gmail beforehand)  
   - Input: Message ID from Text Classifier output (`={{ $json.id }}`)  
   - Connect outputs appropriately:  

    - Internal → Message a model1  
    - Customer Support → Message a model2  
    - Promotions → Message a model  
    - Admin/Finance → Message a model3  
    - Sales Opportunity → Message a model4  

5. **Create OpenAI Response Nodes (5 total)**  
   For each category, create an OpenAI Langchain node with GPT-4:  

   - **Internal (Message a model1):**  
     Prompt as executive assistant, input from Gmail Trigger email text, output subject + message  
   - **Customer Support (Message a model2):**  
     Prompt as customer service rep, redirect out-of-scope to support@prvndigital.com  
   - **Promotions (Message a model):**  
     Summarize offer and recommend action (Yes/No)  
   - **Admin/Finance (Message a model3):**  
     Summarize payment and invoice details clearly  
   - **Sales Opportunity (Message a model4):**  
     Draft professional reply including contact info; create Slack notification text  

   - Model ID: gpt-4o-mini for all  
   - Connect outputs to corresponding draft creation nodes  

6. **Add Conditional Node “If” for Promotions**  
   - Condition: Check if `Recommendation` field in AI output contains “yes” (case sensitive)  
   - True: Continue workflow  
   - False: Connect to Mark message as read node  

7. **Add Gmail Node to Mark Message as Read for Promotions**  
   - Operation: markAsRead  
   - Message ID from Text Classifier output  
   - Connect as false branch from “If” node  

8. **Create Gmail Draft Nodes (4 total)**  
   - Create draft emails for Internal, Customer Support, Admin/Finance, Sales Opportunity based on AI outputs  
   - Use subject and message fields from AI outputs  
   - Connect from respective AI nodes  

9. **Add Slack Notification Nodes (2 total)**  
   - Slack node to notify on new Internal draft creation  
     - Text: “Internal: New Draft Created”  
     - Channel ID: specify Slack channel (example C08KU6HK28H)  
     - OAuth2 Slack credentials  
     - Connect from Internal draft node  

   - Slack node to notify Sales Opportunity alerts  
     - Text: Notification text from Message a model4 output  
     - Same Slack channel and credentials  
     - Connect from Sales Opportunity draft node  

10. **Connect all nodes as per logic:**  
    - Gmail Trigger → Text Classifier  
    - Text Classifier → 5 label nodes  
    - Each label node → corresponding AI node  
    - Promotions AI → If node → mark as read if false  
    - AI nodes → draft nodes  
    - Draft nodes → Slack notifications (where applicable)  

11. **Credentials Setup:**  
    - Gmail OAuth2 account with full Gmail API access  
    - OpenAI API key with GPT-4 access  
    - Slack OAuth2 with chat:write permissions for target channel  

12. **Validation:**  
    - Test with sample unread emails of each category  
    - Verify labels applied correctly  
    - Confirm draft emails created with appropriate content  
    - Confirm Slack notifications sent for internal and sales categories  
    - Monitor logs for any API errors or timeouts  

---

### 5. General Notes & Resources

| Note Content                                                                                                                        | Context or Link                                                                 |
|------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------|
| This workflow is a comprehensive AI-based email management system leveraging GPT-4 for semantic classification and drafting.     | Workflow overview sticky note in the original workflow                        |
| Slack notifications use OAuth2 and require appropriate permissions on the Slack app to post messages in the designated channel.  | Slack node configuration details                                              |
| Gmail labels referenced must be pre-created in the Gmail account to match label IDs used in the workflow.                         | Gmail Label nodes setup                                                        |
| GPT-4 model variants like "gpt-4o-mini" or "gpt-4.1-mini" are used; ensure your OpenAI API subscription supports these models.    | Node model version configuration                                              |
| For best reliability, monitor API quotas and handle token refresh for Gmail and Slack OAuth2 credentials regularly.               | General maintenance and error prevention                                      |

---

This structured documentation enables developers and automation agents to fully understand, replicate, and maintain the AI-Powered Email Inbox Manager workflow with detailed insight into each step and node.