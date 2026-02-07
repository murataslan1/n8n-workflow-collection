AI Email Triage & Alert System with GPT-4 and Telegram Notifications

https://n8nworkflows.xyz/workflows/ai-email-triage---alert-system-with-gpt-4-and-telegram-notifications-3968


# AI Email Triage & Alert System with GPT-4 and Telegram Notifications

---

## 1. Workflow Overview

This workflow is a comprehensive, fully automated AI Email Triage & Alert System built in n8n to streamline email inbox management using advanced AI models (GPT-4, Google Gemini) and Telegram notifications. It aims to eliminate inbox noise, prioritize and label incoming emails intelligently, summarize newsletters, generate AI-assisted replies, and escalate critical emails with real-time alerts, thereby reclaiming hours of manual email handling weekly.

**Target Use Cases:**

- Startup founders, CEOs, and busy professionals seeking to automate email prioritization and reduce manual triage time.
- Agencies and consultants needing to flag client emails and critical operational messages instantly.
- No-code builders and AI engineers wanting a ready-to-deploy, customizable email automation engine.
- Remote operators and virtual assistants requiring autonomous inbox management support.

**Logical Blocks:**

- **1.1 Email Ingestion & Initial Labeling:** Triggered by new email reception, applies a "Processing" label, classifies emails into categories (Noise/Spam, Promotions, Social, Newsletter, Clients, etc.) using AI, and assigns corresponding Gmail labels.
- **1.2 Priority Classification:** Determines email priority level (High, Medium, Low) with AI and applies priority labels accordingly.
- **1.3 Escalation & Alerting:** For high-priority emails, checks if human intervention is needed, generates summaries, and sends Telegram alerts.
- **1.4 Newsletter Summarization:** Summarizes newsletter content into actionable insights and logs summaries to Airtable and Telegram.
- **1.5 Autonomous AI Email Agent:** An AI agent capable of replying, marking read/unread, labeling, deleting, and managing emails autonomously.
- **1.6 Telegram & Webhook Integration:** Handles Telegram-triggered events and webhook inputs for external integrations or manual commands.
- **1.7 Error Handling & Workflow Control:** Manages workflow errors, agent errors, and controls response formatting for Telegram and webhook outputs.

---

## 2. Block-by-Block Analysis

### 1.1 Email Ingestion & Initial Labeling

**Overview:**  
This block triggers when a new email is received via Gmail. It assigns a temporary "Processing" label to the email while AI classifies it into categories such as Noise/Spam, Promotions, Social, Newsletter, Clients, etc. Based on classification, the corresponding Gmail label is applied, and the "Processing" label is removed.

**Nodes Involved:**  
- New Email (Gmail Trigger)  
- Set Email Details  
- Add Processing Label  
- OmniClassifier (Google Gemini AI model)  
- Multiple Label Nodes (Add Noise/Spam Label, Add Promotional Label, Add Social Label, Add Newsletter Label, Add Operations Admin Label, Add Opportunity Label, Add Client Label, Add Action Required Label, Add Uncategorized Label)  
- Remove Processing Label (category-specific)  
- Merge After category nodes  

**Node Details:**

- **New Email (Gmail Trigger):**  
  - Type: Trigger node for new Gmail emails.  
  - Configured to listen for new incoming emails.  
  - Output: Email metadata and content.  
  - Failure Modes: Gmail connectivity issues, API quota limits.

- **Set Email Details:**  
  - Type: Set node to prepare email data and enrich context.  
  - Sets variables needed downstream, such as message ID, sender, subject.  
  - Input: Email data from Gmail trigger.  
  - Output: Structured email details.  

- **Add Processing Label:**  
  - Type: Gmail node to apply a temporary "Processing" label (requires pre-created Gmail label "Label_6").  
  - Input: Email message ID.  
  - Output: Email with processing label.  
  - Edge Cases: Label ID mismatch or missing label in Gmail.

- **OmniClassifier:**  
  - Type: AI language model node using Google Gemini for text classification.  
  - Classifies email into predefined categories.  
  - Input: Email content.  
  - Output: Classification result.  
  - Failure: AI API errors, timeouts.

- **Category Label Nodes (e.g., Add Noise/Spam Label):**  
  - Type: Gmail nodes applying specific labels based on AI classification.  
  - Each expects a Gmail label ID (requires pre-creation).  
  - Input: Email message ID.  
  - Output: Email labeled accordingly.  
  - Edge Cases: Missing label ID or API errors.

- **Remove Processing Label (category-specific):**  
  - Type: Gmail nodes to remove the temporary "Processing" label after classification.  
  - Input: Email message ID and processing label ID.  
  - Output: Updated email labels.  

- **Merge After category nodes:**  
  - Type: NoOp nodes to synchronize parallel flows after processing each category.  

---

### 1.2 Priority Classification

**Overview:**  
Assigns priority levels to emails (High, Medium, Low) using AI. Based on priority, appropriate labels are applied, and further processing is triggered, such as escalation or summary generation.

**Nodes Involved:**  
- Add Client Label (entry point)  
- Priority Check (AI chain using Google Gemini)  
- Priority Output Parser  
- Priority Autofixing Parser  
- Priority Switch  
- Add High Priority Label  
- Add Medium Priority Label  
- Add Low Priority Label  
- Add Processed Label (Medium/Low)  
- Remove Processing Label (Medium/Low)  
- Add Processed Label (High)  
- Remove Processing Label (High)  
- Merge After Medium/Low Priority  
- Merge After High Priority  

**Node Details:**

- **Add Client Label:**  
  - Applies "Clients" Gmail label to the email (triggers priority check).  
  - Input: Email message ID.  

- **Priority Check:**  
  - AI chain node using Google Gemini to evaluate email priority.  
  - Input: Email content and metadata.  
  - Output: Priority classification.  

- **Priority Output Parser & Priority Autofixing Parser:**  
  - Parses AI output, correcting errors and ensuring structured data.  

- **Priority Switch:**  
  - Routes emails to High, Medium, or Low priority label nodes based on classification.  

- **Add Priority Labels:**  
  - Gmail nodes applying corresponding priority labels (requires label creation).  
  - Each node applies one priority label.  

- **Add Processed Label (Medium/Low) & Remove Processing Label (Medium/Low):**  
  - Marks email as processed for Medium/Low priority and removes temporary processing label.  

- **Add Processed Label (High) & Remove Processing Label (High):**  
  - Marks email as processed for High priority and removes temporary processing label.  

- **Merge Nodes:**  
  - Synchronize flow after priority label assignment.  

- **Edge Cases:** Missing labels, AI misclassification, API limits.  

---

### 1.3 Escalation & Alerting

**Overview:**  
For high-priority emails, AI decides if human intervention is required. If yes, it summarizes the email content and sends an alert via Telegram with contextual information.

**Nodes Involved:**  
- Add High Priority Label  
- Human Intervention Check (AI chain)  
- Google Gemini (Escalation)  
- Escalation Output Parser  
- Escalate Autofixing Parser  
- Alert Required? (If node)  
- Context & Summary Agent (OpenAI Chat)  
- Summary Output Parser  
- Summary Autofixing Parser  
- Send Priority Alert (Telegram)  
- Add Processed Label (High)  
- Remove Processing Label (High)  
- Merge After High Priority  

**Node Details:**

- **Human Intervention Check:**  
  - AI chain node using Google Gemini to determine if escalation is necessary.  
  - Parses AI output to structured decision.  

- **Context & Summary Agent:**  
  - OpenAI model generates a concise summary and context for the alert.  

- **Send Priority Alert:**  
  - Telegram node sending formatted alert messages to configured Telegram chat.  
  - Input: Summary and email metadata.  
  - Output: Telegram notification.  
  - Failures: Telegram API errors, network issues.  

- **Label Management:**  
  - Processed label applied and processing label removed for high priority emails.  

---

### 1.4 Newsletter Summarization

**Overview:**  
Summarizes newsletter emails into actionable insights using AI and logs these summaries to Airtable and Telegram for quick consumption.

**Nodes Involved:**  
- Add Newsletter Label  
- Basic LLM Chain (AI chain for summarization)  
- Newsletter Summarizer (AI chain)  
- Google Gemini (Newsletter)  
- Newsletter Output Parser  
- Auto-fixing Newsletter Parser  
- Add Processed Label (Newsletter)  
- Remove Processing (Newsletter)  
- Add Summary to Airtable  
- Send Summary to Telegram  
- Merge After Newsletters  

**Node Details:**

- **Newsletter Summarizer:**  
  - AI chain node that processes newsletter content to generate concise summaries.  

- **Newsletter Output Parser & Auto-fixing Newsletter Parser:**  
  - Parse and correct AI output for accuracy and structure.  

- **Add Summary to Airtable:**  
  - Logs the structured newsletter summary to a configured Airtable base and table.  
  - Inputs: Structured summary, newsletter metadata.  
  - Requires Airtable credentials configured.  

- **Send Summary to Telegram:**  
  - Sends the summary as a message to Telegram chat.  

- **Label Management:**  
  - Newsletter label applied and "Processing" label removed.  

---

### 1.5 Autonomous AI Email Agent

**Overview:**  
A powerful AI agent node orchestrates autonomous inbox management tasks including replying to emails, creating drafts, marking read/unread, labeling, deleting, and calling sub-workflows for complex operations.

**Nodes Involved:**  
- Master Email Coordinator (AI agent)  
- OpenAI Chat Model (Agent)  
- Postgres Memory (context memory storage)  
- Add Label (Tool)  
- Remove Label (Tool)  
- Mark Read (Tool)  
- Mark Unread (Tool)  
- Create Draft (Tool)  
- Send Email (Tool)  
- Delete Email (Tool)  
- Email Reply (Tool)  
- Get Emails (Tool)  
- Get Labels (Tool)  
- Call Sub-Workflow  

**Node Details:**

- **Master Email Coordinator:**  
  - AI agent node using OpenAI Chat Model as the primary AI.  
  - Uses Postgres Memory node for persistent chat history and context awareness.  
  - Controls email actions via Gmail Tool nodes (add/remove labels, send, reply, delete).  
  - Can invoke sub-workflows for external tasks or integrations.  
  - Receives input from Set Agent Input node, processes commands, and outputs responses.  
  - Handles errors via Agent Error Handler and fallback nodes.  

- **Gmail Tool Nodes:**  
  - Each node performs specific Gmail API tasks (label management, message sending, fetching).  
  - Require Gmail OAuth2 credentials with appropriate scopes.  
  - Failure modes: API rate limits, auth errors, invalid message IDs.  

- **Postgres Memory:**  
  - Stores and retrieves chat history to maintain conversational context for the AI agent.  
  - Requires PostgreSQL credentials and schema setup.  

---

### 1.6 Telegram & Webhook Integration

**Overview:**  
Handles external inputs via Telegram messages or webhook requests, enabling external control or query of the AI system. Formats and sends responses back to Telegram users or webhook callers.

**Nodes Involved:**  
- Telegram Trigger  
- Webhook Trigger  
- Set Telegram Request  
- Set Webhook Request  
- Aggregate Input  
- Set Agent Input  
- Master Email Coordinator  
- IsTelegram? (If node to route response)  
- Set Telegram Response  
- Set Webhook Response  
- Respond on Telegram  
- Respond with Error  

**Node Details:**

- **Telegram Trigger:**  
  - Listens for incoming Telegram bot messages.  
  - Requires Telegram Bot API credentials.  

- **Webhook Trigger:**  
  - Exposes a webhook URL for HTTP requests to start the workflow.  

- **Set Telegram/Webhook Request:**  
  - Prepares incoming data for AI processing.  

- **Aggregate Input:**  
  - Aggregates data from triggers before passing to AI agent.  

- **IsTelegram?:**  
  - Branches workflow to format response specifically for Telegram or webhook callers.  

- **Respond on Telegram:**  
  - Sends AI-generated responses back to Telegram users.  

- **Respond with Error:**  
  - Sends error messages to Telegram in case of failures.  

---

### 1.7 Error Handling & Workflow Control

**Overview:**  
Manages workflow errors gracefully, ensuring error messages are communicated back to users via Telegram, and stops workflow execution on fatal errors.

**Nodes Involved:**  
- Workflow Error (Stop and Error node)  
- Agent Error Handler (Stop and Error node)  
- Respond with Error  
- Request Complete (NoOp node)  

**Node Details:**

- **Workflow Error & Agent Error Handler:**  
  - Stops workflow execution and surfaces errors.  

- **Respond with Error:**  
  - Sends error details to Telegram chat.  

- **Request Complete:**  
  - Marks successful completion of a request.  

---

## 3. Summary Table

| Node Name                      | Node Type                          | Functional Role                          | Input Node(s)                   | Output Node(s)                  | Sticky Note                                                                                                                                                        |
|--------------------------------|----------------------------------|----------------------------------------|--------------------------------|--------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| New Email                      | Gmail Trigger                    | Trigger on new email                    | -                              | Set Email Details              | Triggers the workflow when a new email is received.                                                                                                              |
| Set Email Details              | Set                             | Prepare email data                      | New Email                     | Add Processing Label           |                                                                                                                                                                  |
| Add Processing Label           | Gmail                           | Apply "Processing" label                | Set Email Details             | OmniClassifier                | Temporary label to mark email is being processed. Requires Gmail label "Label_6".                                                                                |
| OmniClassifier                | Langchain LM Chat Google Gemini | AI email category classification       | Add Processing Label          | Multiple Label Nodes           | Classifies emails into categories like Noise/Spam, Promotions, etc.                                                                                            |
| Add Noise/Spam Label           | Gmail                           | Label email as Noise/Spam               | OmniClassifier               | Remove Processing (Noise/Spam) | Requires Gmail label "Label_FOR_NOISESPAM".                                                                                                                     |
| Add Promotional Label          | Gmail                           | Label email as Promotions               | OmniClassifier               | Remove Processing (Promotional)| Requires Gmail label "Label_1".                                                                                                                                 |
| Add Social Label               | Gmail                           | Label email as Social                   | OmniClassifier               | Remove Processing (Social)     | Requires Gmail label "Social".                                                                                                                                  |
| Add Newsletter Label           | Gmail                           | Label email as Newsletter               | OmniClassifier               | Basic LLM Chain               | Requires Gmail label "Label_2".                                                                                                                                 |
| Add Operations Admin Label     | Gmail                           | Label email for Operations Admin       | OmniClassifier               | Remove Processing (Operations) | Requires Gmail label "Label_FOR_OPERATIONSADMIN".                                                                                                               |
| Add Opportunity Label          | Gmail                           | Label email as Opportunity              | OmniClassifier               | Priority Check                | Requires Gmail label "Label_1".                                                                                                                                 |
| Add Client Label               | Gmail                           | Label email as Client                   | OmniClassifier               | Priority Check                | Requires Gmail label "Label_FOR_CLIENTS".                                                                                                                       |
| Add Action Required Label      | Gmail                           | Label email as Action Required          | OmniClassifier               | Priority Check                | Requires Gmail label "Label_FOR_ACTIONREQUIRED".                                                                                                               |
| Add Uncategorized Label        | Gmail                           | Label email as Uncategorized            | OmniClassifier               | Priority Check                | Requires Gmail label "Label_FOR_UNCATEGORIZED".                                                                                                               |
| Remove Processing (Noise/Spam) | Gmail                           | Remove processing label after Noise/Spam| Add Noise/Spam Label         | Add Processed Label (Noise/Spam)|                                                                                                                                                                  |
| Remove Processing (Promotional)| Gmail                           | Remove processing label after Promotions| Add Promotional Label        | Add Processed Label (Promotional)|                                                                                                                                                                  |
| Remove Processing (Social)     | Gmail                           | Remove processing label after Social   | Add Social Label             | Add Processed Label (Social)  |                                                                                                                                                                  |
| Remove Processing (Newsletter) | Gmail                           | Remove processing label after Newsletter| Newsletter Summarizer        | Add Processed Label (Newsletter)|                                                                                                                                                                  |
| Add Processed Label (Noise/Spam)| Gmail                          | Mark Noise/Spam email as processed     | Remove Processing (Noise/Spam)| Unsubscribe                  |                                                                                                                                                                  |
| Add Processed Label (Promotional)| Gmail                        | Mark Promotional email as processed    | Remove Processing (Promotional)| Merge After Promotions        |                                                                                                                                                                  |
| Add Processed Label (Social)   | Gmail                           | Mark Social email as processed          | Remove Processing (Social)   | Merge After Social            |                                                                                                                                                                  |
| Add Processed Label (Newsletter)| Gmail                         | Mark Newsletter email as processed      | Remove Processing (Newsletter)| Add Summary to Airtable       |                                                                                                                                                                  |
| Unsubscribe                   | HTTP Request                    | Unsubscribe API call for Noise/Spam    | Add Processed Label (Noise/Spam)| Delete Noise/Spam Email      |                                                                                                                                                                  |
| Delete Noise/Spam Email        | Gmail                           | Permanently delete Noise/Spam emails    | Unsubscribe                 | Merge After Noise/Spam        |                                                                                                                                                                  |
| Add Summary to Airtable        | Airtable                       | Log newsletter summaries                 | Add Processed Label (Newsletter)| Send Summary to Telegram      |                                                                                                                                                                  |
| Send Summary to Telegram       | Telegram                       | Send newsletter summary to Telegram     | Add Summary to Airtable      | Merge After Newsletters       |                                                                                                                                                                  |
| Basic LLM Chain               | Langchain Chain LLM            | Newsletter summarization AI chain       | Add Newsletter Label         | Newsletter Summarizer         |                                                                                                                                                                  |
| Newsletter Summarizer          | Langchain Chain LLM            | Summarize newsletter content            | Basic LLM Chain              | Remove Processing (Newsletter)|                                                                                                                                                                  |
| Google Gemini (Newsletter)     | Langchain LM Chat Google Gemini| AI model for newsletter summarization  | Newsletter Summarizer        | Newsletter Output Parser      |                                                                                                                                                                  |
| Newsletter Output Parser       | Langchain Output Parser Structured| Parse newsletter summary output       | Google Gemini (Newsletter)   | Auto-fixing Newsletter Parser |                                                                                                                                                                  |
| Auto-fixing Newsletter Parser  | Langchain Output Parser Autofixing| Auto-correct newsletter summary output| Newsletter Output Parser     | Newsletter Summarizer         |                                                                                                                                                                  |
| Add Client Label               | Gmail                           | Label as Client and trigger priority    | OmniClassifier               | Priority Check                |                                                                                                                                                                  |
| Priority Check                | Langchain Chain LLM            | AI priority classification               | Add Client Label             | Priority Switch              |                                                                                                                                                                  |
| Priority Output Parser         | Langchain Output Parser Structured| Parse priority AI output                | Google Gemini (Priority)     | Priority Autofixing Parser    |                                                                                                                                                                  |
| Priority Autofixing Parser     | Langchain Output Parser Autofixing| Auto-correct priority classification   | Priority Output Parser       | Priority Check                |                                                                                                                                                                  |
| Priority Switch               | Switch                         | Route email by priority level            | Priority Check              | Add High/Medium/Low Priority Labels|                                                                                                                                                                  |
| Add High Priority Label        | Gmail                           | Label email as High Priority             | Priority Switch             | Human Intervention Check      | Requires Gmail label "Label_3".                                                                                                                                |
| Add Medium Priority Label      | Gmail                           | Label email as Medium Priority           | Priority Switch             | Add Processed Label (Medium/Low)| Requires Gmail label "Label_4".                                                                                                                                |
| Add Low Priority Label         | Gmail                           | Label email as Low Priority              | Priority Switch             | Add Processed Label (Medium/Low)| Requires Gmail label "Label_5".                                                                                                                                |
| Add Processed Label (Medium/Low)| Gmail                         | Mark medium/low priority email processed | Add Medium/Low Priority Label| Remove Processing Label (Medium/Low)|                                                                                                                                                                  |
| Remove Processing Label (Medium/Low)| Gmail                     | Remove processing label for medium/low  | Add Processed Label (Medium/Low)| Merge After Medium/Low Priority|                                                                                                                                                                  |
| Human Intervention Check       | Langchain Chain LLM            | AI to check if escalation needed         | Add High Priority Label     | Alert Required?              |                                                                                                                                                                  |
| Google Gemini (Escalation)     | Langchain LM Chat Google Gemini| AI model for escalation decision          | Human Intervention Check    | Escalation Output Parser     |                                                                                                                                                                  |
| Escalation Output Parser       | Langchain Output Parser Structured| Parse escalation AI output                | Google Gemini (Escalation)  | Escalate Autofixing Parser   |                                                                                                                                                                  |
| Escalate Autofixing Parser     | Langchain Output Parser Autofixing| Auto-correct escalation output           | Escalation Output Parser    | Human Intervention Check      |                                                                                                                                                                  |
| Alert Required?                | If                             | Branch if alert needed                     | Human Intervention Check    | Context & Summary Agent / Add Processed Label (High) |                                                                                                                                                                  |
| Context & Summary Agent        | Langchain Chain LLM            | Generate context and summary for alerts   | Alert Required?             | Send Priority Alert          | Uses OpenAI Chat model for summarization.                                                                                                                      |
| Summary Output Parser          | Langchain Output Parser Structured| Parse summary output                        | OpenAI Chat Model (Summary) | Summary Autofixing Parser    |                                                                                                                                                                  |
| Summary Autofixing Parser      | Langchain Output Parser Autofixing| Auto-fix summary output                     | Summary Output Parser       | Context & Summary Agent       |                                                                                                                                                                  |
| Send Priority Alert            | Telegram                       | Send alert message to Telegram chat        | Context & Summary Agent     | Add Processed Label (High)    |                                                                                                                                                                  |
| Add Processed Label (High)     | Gmail                           | Mark high priority email processed          | Send Priority Alert         | Remove Processing Label (High)|                                                                                                                                                                  |
| Remove Processing Label (High) | Gmail                           | Remove processing label for high priority   | Add Processed Label (High)  | Merge After High Priority     |                                                                                                                                                                  |
| Master Email Coordinator       | Langchain Agent                | Autonomous AI email agent                    | Set Agent Input             | IsTelegram? / Agent Error Handler | Orchestrates email actions (reply, label, delete). Uses OpenAI Chat Model and Postgres Memory.                                                                  |
| OpenAI Chat Model (Agent)      | Langchain LM Chat OpenAI       | AI model for the autonomous agent           | Master Email Coordinator    | Master Email Coordinator      |                                                                                                                                                                  |
| Postgres Memory                | Langchain Memory Postgres      | Stores AI chat history for context           | -                          | Master Email Coordinator      | Requires PostgreSQL setup.                                                                                                                                      |
| Add Label (Tool)               | Gmail Tool                    | Tool for AI agent to add Gmail labels          | Master Email Coordinator (ai_tool)| Master Email Coordinator      | Requires label IDs.                                                                                                                                              |
| Remove Label (Tool)            | Gmail Tool                    | Tool for AI agent to remove Gmail labels       | Master Email Coordinator (ai_tool)| Master Email Coordinator      |                                                                                                                                                                  |
| Mark Read (Tool)               | Gmail Tool                    | Tool for AI agent to mark emails as read       | Master Email Coordinator (ai_tool)| Master Email Coordinator      |                                                                                                                                                                  |
| Mark Unread (Tool)             | Gmail Tool                    | Tool for AI agent to mark emails as unread     | Master Email Coordinator (ai_tool)| Master Email Coordinator      |                                                                                                                                                                  |
| Create Draft (Tool)            | Gmail Tool                    | Tool for AI agent to create email drafts        | Master Email Coordinator (ai_tool)| Master Email Coordinator      |                                                                                                                                                                  |
| Send Email (Tool)              | Gmail Tool                    | Tool for AI agent to send emails                 | Master Email Coordinator (ai_tool)| Master Email Coordinator      |                                                                                                                                                                  |
| Delete Email (Tool)            | Gmail Tool                    | Tool for AI agent to delete emails               | Master Email Coordinator (ai_tool)| Master Email Coordinator      |                                                                                                                                                                  |
| Email Reply (Tool)             | Gmail Tool                    | Tool for AI agent to reply to emails             | Master Email Coordinator (ai_tool)| Master Email Coordinator      |                                                                                                                                                                  |
| Get Emails (Tool)              | Gmail Tool                    | Tool for AI agent to fetch emails                 | Master Email Coordinator (ai_tool)| Master Email Coordinator      |                                                                                                                                                                  |
| Get Labels (Tool)              | Gmail Tool                    | Tool for AI agent to fetch Gmail labels          | Master Email Coordinator (ai_tool)| Master Email Coordinator      |                                                                                                                                                                  |
| Call Sub-Workflow              | Langchain Tool Workflow        | Allows AI agent to invoke other workflows         | Master Email Coordinator (ai_tool)| Master Email Coordinator      | Useful for modular expansion or external tasks.                                                                                                                |
| Telegram Trigger               | Telegram Trigger              | Trigger workflow on Telegram messages              | -                          | Set Telegram Request          | Requires Telegram Bot API credentials.                                                                                                                         |
| Set Telegram Request           | Set                             | Prepare Telegram input for processing             | Telegram Trigger            | Aggregate Input               |                                                                                                                                                                  |
| Telegram Response Nodes        | Set, Telegram                  | Format and send responses back on Telegram        | IsTelegram?                 | Respond on Telegram           |                                                                                                                                                                  |
| Webhook Trigger               | Webhook Trigger               | HTTP webhook trigger for external inputs           | -                          | Set Webhook Request           |                                                                                                                                                                  |
| Set Webhook Request            | Set                             | Prepare webhook input for processing               | Webhook Trigger             | Aggregate Input               |                                                                                                                                                                  |
| Aggregate Input                | Aggregate                      | Aggregates data for AI agent input                  | Set Telegram Request, Set Webhook Request, Set Workflow Request | Set Agent Input |                                                                                                                                                                  |
| Set Agent Input               | Set                             | Prepare AI agent input structure                     | Aggregate Input             | Master Email Coordinator      |                                                                                                                                                                  |
| IsTelegram?                   | If                             | Branch response formatting based on source          | Master Email Coordinator    | Set Telegram Response / Set Webhook Response |                                                                                                                                                                  |
| Respond on Telegram           | Telegram                       | Send final response to Telegram user                 | Set Telegram Response       | Request Complete             |                                                                                                                                                                  |
| Respond with Error            | Telegram                       | Send error messages to Telegram                       | Respond on Telegram         | Workflow Error              |                                                                                                                                                                  |
| Workflow Error                | StopAndError                   | Stop workflow on critical errors                      | Respond with Error          | -                            |                                                                                                                                                                  |
| Agent Error Handler           | StopAndError                   | Stop workflow on AI agent errors                      | Master Email Coordinator    | -                            |                                                                                                                                                                  |
| Request Complete              | NoOp                           | Marks completion of successful request                | Respond on Telegram         | -                            |                                                                                                                                                                  |

---

## 4. Reproducing the Workflow from Scratch

1. **Create Gmail Labels:**  
   - Create Gmail labels with the following names or IDs as referenced:  
     - Label_1 (Opportunity, Promotions)  
     - Label_2 (Newsletter)  
     - Label_3 (High Priority)  
     - Label_4 (Medium Priority)  
     - Label_5 (Low Priority)  
     - Label_6 (Processing)  
     - Label_FOR_NOISESPAM (Noise/Spam)  
     - Label_FOR_CLIENTS (Clients)  
     - Label_FOR_ACTIONREQUIRED (Action Required)  
     - Label_FOR_OPERATIONSADMIN (Operations Admin)  
     - Label_FOR_UNCATEGORIZED (Uncategorized)  
     Note down their Gmail label IDs for configuration.

2. **Set Up Credentials:**  
   - Configure Gmail OAuth2 credentials with full mailbox access.  
   - Configure Telegram Bot API credentials.  
   - Configure OpenAI API credentials (GPT-4).  
   - Configure Google Gemini API credentials (if applicable).  
   - Configure PostgreSQL credentials for memory node.  
   - Configure Airtable API credentials and base/table for summaries.

3. **Build Email Ingestion Block:**  
   - Add **Gmail Trigger** node: "New Email".  
   - Connect to **Set Email Details** node: configure to extract message ID, sender, subject.  
   - Connect to **Add Processing Label** node: apply temporary "Processing" label using Gmail node and label ID.  
   - Connect to **OmniClassifier**: configure Google Gemini model to classify email content.  
   - Branch outputs from **OmniClassifier** to Gmail nodes to apply corresponding category labels.  
   - For each category label node, connect to a respective "Remove Processing Label" node to remove the temporary label.  
   - Connect each remove-processing node to a **NoOp Merge** node to synchronize.

4. **Build Priority Classification Block:**  
   - From category nodes like "Add Client Label", connect to **Priority Check** node (Google Gemini AI chain).  
   - Connect to **Priority Output Parser** and **Priority Autofixing Parser** nodes sequentially.  
   - Connect to **Priority Switch** node to route High, Medium, Low priority.  
   - Add Gmail nodes for "Add High Priority Label", "Add Medium Priority Label", "Add Low Priority Label" with appropriate label IDs.  
   - Connect Medium/Low priority nodes to "Add Processed Label (Medium/Low)" and then to "Remove Processing Label (Medium/Low)".  
   - Connect High priority node to "Human Intervention Check" (AI chain).  
   - Connect Medium/Low flows to a merge node.

5. **Build Escalation & Alerting Block:**  
   - From "Human Intervention Check", connect to AI nodes "Google Gemini (Escalation)", then to "Escalation Output Parser" and "Escalate Autofixing Parser".  
   - Connect to **Alert Required?** If node: if true, route to **Context & Summary Agent** (OpenAI Chat Model).  
   - Connect summary node outputs through **Summary Output Parser** and **Summary Autofixing Parser** back to context agent.  
   - Connect to **Send Priority Alert** Telegram node to notify high-priority email details.  
   - Connect to "Add Processed Label (High)" and "Remove Processing Label (High)" nodes, then merge.

6. **Build Newsletter Summarization Block:**  
   - From "Add Newsletter Label", connect to **Basic LLM Chain** AI summarization node.  
   - Chain to **Newsletter Summarizer** and **Google Gemini (Newsletter)**.  
   - Connect to **Newsletter Output Parser** and **Auto-fixing Newsletter Parser** nodes.  
   - Connect to "Remove Processing (Newsletter)", then "Add Processed Label (Newsletter)".  
   - Connect to **Add Summary to Airtable** node to log summaries.  
   - Connect to **Send Summary to Telegram** node.  
   - Connect to merge node.

7. **Build Autonomous AI Email Agent Block:**  
   - Add **Master Email Coordinator** node (Langchain Agent).  
   - Configure with **OpenAI Chat Model (Agent)**.  
   - Connect **Postgres Memory** node for chat history.  
   - Connect Gmail Tool nodes for label add/remove, mark read/unread, reply, send email, create draft, delete email, get emails, get labels.  
   - Connect **Call Sub-Workflow** node for external workflow calls.  
   - Connect agent input from **Set Agent Input** node.  
   - Connect agent output to **IsTelegram?** node for routing.  
   - Add **Agent Error Handler** and connect error outputs.

8. **Build Telegram & Webhook Integration Block:**  
   - Add **Telegram Trigger** and **Webhook Trigger** nodes.  
   - Connect each to respective **Set Telegram Request** and **Set Webhook Request** nodes.  
   - Connect both to **Aggregate Input** node.  
   - Connect to **Set Agent Input** node, which feeds the AI agent.  
   - From agent, connect to **IsTelegram?** If node.  
   - Connect to **Set Telegram Response** and **Set Webhook Response** nodes accordingly.  
   - Connect **Set Telegram Response** to **Respond on Telegram** node.  
   - Connect **Respond on Telegram** to **Request Complete** and **Respond with Error** nodes for normal and error flows.

9. **Add Error Handling Nodes:**  
   - Add **Workflow Error** and **Agent Error Handler** (Stop and Error nodes) for critical error stopping.  
   - Connect error outputs from agent and response nodes to these.

10. **Finalize Connections and Test:**  
    - Ensure all nodes are connected as per logical flow.  
    - Test with sample emails to verify classification, labeling, priority assignment, summarization, alert dispatch, and AI agent functionality.  
    - Validate Telegram responses and webhook integrations.

---

## 5. General Notes & Resources

| Note Content                                                                                                                                                                 | Context or Link                                                  |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------|
| Fully self-hosted workflow ensuring data privacy and control.                                                                                                                | Security consideration                                           |
| Requires pre-created Gmail labels; adjust label IDs in nodes to match your Gmail labels.                                                                                      | Gmail label setup                                                |
| Telegram Bot API credentials needed for Telegram integration and alerts.                                                                                                     | Telegram integration setup                                       |
| PostgreSQL used for persistent AI context memory; setup required for Postgres Memory node.                                                                                   | AI context persistence                                          |
| Airtable integration logs newsletter summaries for record-keeping and analytics.                                                                                             | Airtable configuration                                           |
| AI models used: GPT-4 via OpenAI and Google Gemini via Langchain nodes.                                                                                                     | AI model configuration                                          |
| Comprehensive error handling ensures reliable operation and user notification in case of failures.                                                                           | Reliability and error management                                 |
| Workflow modularity allows easy duplication and extension for multi-inbox or team scaling.                                                                                   | Scalability                                                     |
| Telegram integration supports real-time alerts and interactive responses for better inbox management.                                                                       | Real-time alerting                                              |
| Workflow designed and tested by Bluegrass Digital Advantage.                                                                                                                | Project credit                                                  |
| For detailed setup instructions and label taxonomy, see included documentation and Gmail label taxonomy files.                                                              | Setup resources                                                 |

---

This document provides a detailed, structured understanding of the "AI Email Triage & Alert System with GPT-4 and Telegram Notifications" n8n workflow, enabling advanced users and automation agents to comprehend, reproduce, and extend its functionality confidently.