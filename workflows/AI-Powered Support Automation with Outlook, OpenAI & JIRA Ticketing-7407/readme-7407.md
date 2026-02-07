AI-Powered Support Automation with Outlook, OpenAI & JIRA Ticketing

https://n8nworkflows.xyz/workflows/ai-powered-support-automation-with-outlook--openai---jira-ticketing-7407


# AI-Powered Support Automation with Outlook, OpenAI & JIRA Ticketing

### 1. Workflow Overview

This workflow automates support request handling by integrating Outlook email, web form submissions, OpenAI AI classification, and JIRA ticketing. It targets customer support teams managing multi-channel requests, aiming to streamline triage, automate simple resolutions, and assign tickets intelligently.

The workflow is logically grouped into the following blocks:

- **1.1 Input Reception:** Captures support requests both from an Outlook shared mailbox and a webhook endpoint for web form submissions.
- **1.2 Data Normalization & Deduplication:** Standardizes input fields to a unified format and removes duplicate requests to avoid redundant processing.
- **1.3 AI Classification:** Uses OpenAI GPT-4o-mini via LangChain to classify requests by category, urgency, required expertise, auto-resolution eligibility, and VIP status.
- **1.4 Routing Decision:** Routes requests based on AI classification to either auto-respond or escalate to human agents.
- **1.5 Agent Assignment & SLA Calculation:** Assigns requests to appropriate agents based on expertise and VIP status, and calculates SLA targets.
- **1.6 Ticket Creation & Confirmation:** Creates JIRA tickets with detailed metadata and sends confirmation emails to customers.
- **1.7 Webhook Response:** Sends back a JSON response confirming processing status to webhook callers.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** Captures incoming support requests from two sources: Outlook emails and webhook POST requests from web forms.
- **Nodes Involved:**  
  - Outlook Trigger1  
  - Webhook Trigger1

- **Node Details:**

  - **Outlook Trigger1**  
    - Type: Microsoft Outlook Trigger (Polling)  
    - Configuration: Retrieves all emails received in the last 30 minutes from a shared mailbox. Uses filter `receivedAfter` set dynamically to current time minus 30 minutes.  
    - Input: None (trigger node)  
    - Output: Email data objects containing sender, subject, and body.  
    - Edge cases: Failures due to Outlook API rate limits, authentication errors, or empty inbox.  
    - Version: v2

  - **Webhook Trigger1**  
    - Type: Webhook Trigger (HTTP POST)  
    - Configuration: Listens on path `/webhook/support` for incoming POST requests with JSON containing support request data.  
    - Input: HTTP POST JSON payload with fields like email, name, message, optional subject and priority.  
    - Output: Normalized JSON from incoming webhook requests.  
    - Edge cases: Invalid/missing required fields, malformed JSON, unauthorized requests.  
    - Version: v1.1

#### 2.2 Data Normalization & Deduplication

- **Overview:** Standardizes diverse input formats into a unified JSON schema and removes duplicate requests based on email and subject combinations.
- **Nodes Involved:**  
  - Normalize Data1  
  - Remove Duplicates1

- **Node Details:**

  - **Normalize Data1**  
    - Type: Function Node (JavaScript)  
    - Configuration: Extracts relevant fields from both Outlook email and webhook data, normalizes into fields: source, email, name, subject, message, timestamp.  
    - Key expressions: Uses conditional property access to support both email and webhook inputs.  
    - Input: Combined output from Outlook Trigger1 and Webhook Trigger1  
    - Output: Array of normalized JSON objects, each representing a support request.  
    - Edge cases: Missing fields (e.g., no subject), inconsistent data structures.

  - **Remove Duplicates1**  
    - Type: Remove Duplicates Node  
    - Configuration: Removes items already processed in previous executions based on concatenated key of email + subject to prevent duplicate handling.  
    - Input: Normalized requests  
    - Output: Deduplicated requests  
    - Edge cases: Possible false negatives if subjects or emails change slightly; relies on exact string match.  
    - Version: v2

#### 2.3 AI Classification

- **Overview:** Classifies each request into categories such as technical area, urgency, required expertise, auto-resolution eligibility, and VIP status using GPT-4o-mini model with LangChain integration.
- **Nodes Involved:**  
  - OpenAI Model1  
  - AI Classifier2  
  - JSON Parser1

- **Node Details:**

  - **OpenAI Model1**  
    - Type: LangChain Chat OpenAI Node  
    - Configuration: Uses GPT-4o-mini model for natural language understanding; no extra options set.  
    - Input: Normalized, deduplicated requests  
    - Output: Raw AI-generated classification responses  
    - Edge cases: API rate limits, response delays, unexpected model outputs.  
    - Version: v1.2

  - **AI Classifier2**  
    - Type: LangChain Chain LLM Node  
    - Configuration: Sends formatted prompt including subject, message, and sender details; instructs model to return a JSON classification with fields: category, urgency, expertise, canAutoResolve, isVIP.  
    - Key expressions: Prompt includes VIP indicators (enterprise domains, urgent language), auto-resolve criteria.  
    - Input: Output from OpenAI Model1  
    - Output: Parsed AI classification JSON  
    - Edge cases: Misclassification, ambiguous inputs, incomplete outputs.  
    - Version: v1.6  
    - Output parser linked to JSON Parser1

  - **JSON Parser1**  
    - Type: LangChain Output Parser Structured  
    - Configuration: Expects JSON with defined schema (category, urgency, expertise, canAutoResolve, isVIP)  
    - Input: AI Classifier2 output  
    - Output: Structured JSON object for downstream logic  
    - Edge cases: Parsing errors if AI output is malformed or incomplete.  
    - Version: v1.2

#### 2.4 Routing Decision

- **Overview:** Determines next steps based on AI classification, specifically whether the request can be auto-resolved or requires agent assignment.
- **Nodes Involved:**  
  - Route Decision1  
  - Auto Response1  
  - Assign Agent1

- **Node Details:**

  - **Route Decision1**  
    - Type: If Node (conditional branching)  
    - Configuration: Evaluates conditions on AI classification output (likely `canAutoResolve` boolean) to route requests.  
    - Input: Output from JSON Parser1  
    - Output: Two branches — one to Auto Response1 (auto-resolve) and another to Assign Agent1 (human escalation).  
    - Edge cases: Missing or invalid classification data; default routing fallback.

  - **Auto Response1**  
    - Type: Microsoft Outlook Node (Send Message)  
    - Configuration: Sends automatic email response via Outlook to customer for simple issues that can be auto-resolved.  
    - Input: Requests flagged for auto-resolution  
    - Output: Confirmation that auto-response was sent  
    - Edge cases: Email sending errors, invalid recipient address.  
    - Version: v2

  - **Assign Agent1**  
    - Type: Function Node  
    - Configuration: Applies business logic to assign agent email based on expertise, adjusts SLA hours depending on urgency and VIP status, defines priority levels for JIRA.  
    - Key expressions: Maps expertise to agent emails; SLA times differ for VIP vs non-VIP; priority numeric mapping.  
    - Input: Requests needing escalation  
    - Output: Enriched request JSON with assignedAgent, slaHours, and priority fields  
    - Edge cases: Missing expertise values, unrecognized urgency levels, fallback to default agents.

#### 2.5 Ticket Creation & Confirmation

- **Overview:** Creates a JIRA ticket for escalated support requests and sends confirmation emails to customers with ticket details.
- **Nodes Involved:**  
  - Create JIRA Ticket1  
  - Send Confirmation1

- **Node Details:**

  - **Create JIRA Ticket1**  
    - Type: JIRA Node  
    - Configuration: Creates an issue in JIRA project "SUP" with type "Task". Uses fields populated from enriched request JSON: summary, labels (category, source), assignee (agent email), priority, and detailed description including customer info, message, and VIP flags.  
    - Input: Output from Assign Agent1  
    - Output: JIRA ticket creation response including ticket key  
    - Edge cases: JIRA API errors, invalid assignee emails, permission issues.  
    - Version: v1

  - **Send Confirmation1**  
    - Type: Gmail Node (Send Email)  
    - Configuration: Sends confirmation email to customer with ticket number, priority, assigned agent, and SLA response time. Email subject references original request subject.  
    - Input: Created JIRA ticket details  
    - Output: Confirmation of email sent  
    - Edge cases: Email delivery issues, invalid email addresses.  
    - Version: v2.1

#### 2.6 Webhook Response

- **Overview:** Sends a JSON response back to the webhook caller confirming the request was processed and providing the ticket ID or auto-resolution status.
- **Nodes Involved:**  
  - Webhook Response1

- **Node Details:**

  - **Webhook Response1**  
    - Type: Respond to Webhook Node  
    - Configuration: Returns JSON object with status "success", a message, and ticketId field populated either with JIRA ticket key or "AUTO_RESOLVED" if auto-response was sent.  
    - Input: Final outputs from Auto Response1 or Send Confirmation1  
    - Output: HTTP JSON response to webhook client  
    - Edge cases: Failure if previous nodes fail or no ticket key is available.  
    - Version: v1.1

---

### 3. Summary Table

| Node Name           | Node Type                          | Functional Role                | Input Node(s)             | Output Node(s)            | Sticky Note                                                                                                         |
|---------------------|----------------------------------|-------------------------------|---------------------------|---------------------------|---------------------------------------------------------------------------------------------------------------------|
| Outlook Trigger1     | Microsoft Outlook Trigger (Polling) | Input Reception from Outlook   | None                      | Normalize Data1           |                                                                                                                     |
| Webhook Trigger1     | Webhook Trigger (HTTP POST)        | Input Reception from Webhook   | None                      | Normalize Data1           | "### WEBHOOK INTEGRATION\n\nENDPOINT: /webhook/support\nMETHOD: POST\n\nREQUIRED FIELDS:\n{...}"                     |
| Normalize Data1     | Function Node (JavaScript)          | Data Normalization             | Outlook Trigger1, Webhook Trigger1 | Remove Duplicates1        |                                                                                                                     |
| Remove Duplicates1  | Remove Duplicates Node              | Deduplicate Requests           | Normalize Data1           | AI Classifier2            |                                                                                                                     |
| OpenAI Model1       | LangChain Chat OpenAI Node          | AI Classification - raw model  | Remove Duplicates1        | AI Classifier2            | "### AI CLASSIFICATION TIPS\n\nThe AI determines:\n- Category (technical/billing/account/feature)... VIP DETECTION..."|
| AI Classifier2      | LangChain Chain LLM Node            | AI Classification - formatted  | OpenAI Model1             | Route Decision1           |                                                                                                                     |
| JSON Parser1        | LangChain Output Parser Structured  | Parse AI JSON output           | AI Classifier2            | Route Decision1           |                                                                                                                     |
| Route Decision1     | If Node                            | Routing Decision (Auto or Agent) | JSON Parser1              | Auto Response1, Assign Agent1 |                                                                                                                     |
| Auto Response1      | Microsoft Outlook Node (Send Email) | Auto-response for simple issues | Route Decision1           | Webhook Response1         | "### AUTO-RESOLUTION WORKS FOR:\n\n✅ Password reset requests\n✅ \"Where is my invoice?\" ..."                       |
| Assign Agent1       | Function Node                      | Agent Assignment & SLA         | Route Decision1           | Create JIRA Ticket1       | "### CUSTOMIZE FOR YOUR TEAM\n\nSTEP 1: Update \"Assign Agent\" node\n→ Edit function code..."                      |
| Create JIRA Ticket1 | JIRA Node                         | Ticket Creation                | Assign Agent1             | Send Confirmation1        |                                                                                                                     |
| Send Confirmation1  | Gmail Node (Send Email)             | Customer Confirmation Email    | Create JIRA Ticket1       | Webhook Response1         |                                                                                                                     |
| Webhook Response1   | Respond to Webhook Node             | Webhook Response               | Auto Response1, Send Confirmation1 | None                      |                                                                                                                     |
| Sticky Note         | Sticky Note                       | Documentation                  | None                      | None                      | "## SMART SUPPORT AGENT\n\nThis workflow handles support requests from:\n- Outlook emails (shared inbox)\n- Web forms..." |
| Sticky Note1        | Sticky Note                       | Documentation                  | None                      | None                      | "### CUSTOMIZE FOR YOUR TEAM\n\nSTEP 1: Update \"Assign Agent\" node\n→ Edit function code..."                       |
| Sticky Note2        | Sticky Note                       | Documentation                  | None                      | None                      | "### AI CLASSIFICATION TIPS\n\nThe AI determines:\n- Category (technical/billing/account/feature)..."                |
| Sticky Note3        | Sticky Note                       | Documentation                  | None                      | None                      | "### AUTO-RESOLUTION WORKS FOR:\n\n✅ Password reset requests\n✅ \"Where is my invoice?\" ..."                       |
| Sticky Note4        | Sticky Note                       | Documentation                  | None                      | None                      | "### WEBHOOK INTEGRATION\n\nENDPOINT: /webhook/support\nMETHOD: POST\n\nREQUIRED FIELDS: {...}"                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Outlook Trigger1 Node**  
   - Type: Microsoft Outlook Trigger  
   - Set operation to "getAll" with filter `receivedAfter` = `={{ $now.minus({ minutes: 30 }).toISO() }}`  
   - Use appropriate Outlook OAuth2 credentials for shared mailbox access.

2. **Create Webhook Trigger1 Node**  
   - Type: Webhook Trigger  
   - HTTP Method: POST  
   - Path: `support`  
   - No authentication by default; configure as needed.  

3. **Create Normalize Data1 Node**  
   - Type: Function  
   - Paste JavaScript code that normalizes input JSON from either Outlook or webhook to unified fields: source, email, name, subject, message, timestamp.  
   - Connect outputs of Outlook Trigger1 and Webhook Trigger1 to this node.

4. **Create Remove Duplicates1 Node**  
   - Type: Remove Duplicates  
   - Configure operation: Remove items seen in previous executions  
   - Set dedupe value to expression: `={{ $json.email + $json.subject }}`  
   - Connect Normalize Data1 output to this node.

5. **Create OpenAI Model1 Node**  
   - Type: LangChain Chat OpenAI  
   - Model: gpt-4o-mini  
   - No special options needed.  
   - Connect Remove Duplicates1 output to this node.

6. **Create AI Classifier2 Node**  
   - Type: LangChain Chain LLM  
   - Set prompt text with template including subject, message, name, email.  
   - Provide instructions to classify into JSON with fields: category, urgency, expertise, canAutoResolve, isVIP.  
   - Enable output parser.  
   - Connect OpenAI Model1 output to this node.

7. **Create JSON Parser1 Node**  
   - Type: LangChain Output Parser Structured  
   - Define manual JSON schema with properties: category (string), urgency (string), expertise (string), canAutoResolve (boolean), isVIP (boolean)  
   - Connect AI Classifier2 output parser to this node.

8. **Create Route Decision1 Node**  
   - Type: If Node  
   - Set condition to check if `canAutoResolve` is true (expression: `{{$json.output.canAutoResolve}} == true`)  
   - Connect JSON Parser1 output to this node.

9. **Create Auto Response1 Node**  
   - Type: Microsoft Outlook Node (Send Message)  
   - Configure to send auto-response emails for auto-resolvable requests.  
   - Connect Route Decision1 "true" branch to this node.

10. **Create Assign Agent1 Node**  
    - Type: Function  
    - Paste JavaScript code to assign agent email based on `expertise`, calculate SLA hours based on `urgency` and `isVIP`, and set priority numeric.  
    - Connect Route Decision1 "false" branch to this node.

11. **Create Create JIRA Ticket1 Node**  
    - Type: JIRA Node  
    - Configure project key (default "SUP"), issue type ("Task"), summary, labels, assignee, priority, and description using expressions referencing enriched JSON fields.  
    - Connect Assign Agent1 output to this node.  
    - Authenticate using JIRA credentials with appropriate permissions.

12. **Create Send Confirmation1 Node**  
    - Type: Gmail Node (Send Email)  
    - Configure email subject and body with ticket details such as ticket key, priority, assigned agent, and SLA hours.  
    - Connect Create JIRA Ticket1 output to this node.  
    - Authenticate with Gmail OAuth2 credentials.

13. **Create Webhook Response1 Node**  
    - Type: Respond to Webhook  
    - Configure to respond with JSON body containing status, message, and ticketId (either JIRA ticket key or "AUTO_RESOLVED")  
    - Connect Auto Response1 and Send Confirmation1 outputs to this node.

14. **Connect Nodes**  
    - Outlook Trigger1 and Webhook Trigger1 → Normalize Data1  
    - Normalize Data1 → Remove Duplicates1  
    - Remove Duplicates1 → OpenAI Model1  
    - OpenAI Model1 → AI Classifier2  
    - AI Classifier2 → JSON Parser1  
    - JSON Parser1 → Route Decision1  
    - Route Decision1 (true) → Auto Response1 → Webhook Response1  
    - Route Decision1 (false) → Assign Agent1 → Create JIRA Ticket1 → Send Confirmation1 → Webhook Response1

15. **Add Sticky Notes for Documentation (Optional)**  
    - Create notes explaining workflow overview, AI classification tips, auto-resolution rules, webhook integration, and customization steps.

---

### 5. General Notes & Resources

| Note Content                                                                                              | Context or Link                                                     |
|----------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------|
| SMART SUPPORT AGENT: Handles Outlook emails and web forms with AI-powered classification and SLA tracking. | Workflow overview sticky note.                                    |
| Customize agent emails, JIRA settings, and SLA times in "Assign Agent" and "Create JIRA Ticket" nodes.   | Customization instructions sticky note.                           |
| AI classification tips: include product-specific terms and examples in prompts to improve accuracy.      | AI prompt engineering sticky note.                                |
| Auto-resolution effective for password resets, basic billing, and FAQs; never auto-resolves complex or VIP issues. | Auto-resolution guidance sticky note.                             |
| Webhook endpoint `/webhook/support` accepts POST with fields email, name, message, optional subject.     | Webhook integration sticky note.                                  |
| Links: Test webhook endpoint at `https://your-n8n.com/webhook/support` (replace with actual URL).        | Included in customization sticky note.                            |

---

**Disclaimer:**  
The text presented here is derived exclusively from an automated n8n workflow. It strictly complies with content policies and contains no illegal, offensive, or protected material. All data processed is public and legal.