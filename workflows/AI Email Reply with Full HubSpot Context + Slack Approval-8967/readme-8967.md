AI Email Reply with Full HubSpot Context + Slack Approval

https://n8nworkflows.xyz/workflows/ai-email-reply-with-full-hubspot-context---slack-approval-8967


# AI Email Reply with Full HubSpot Context + Slack Approval

### 1. Workflow Overview

This workflow automates the process of replying to inbound Gmail messages with contextually rich, AI-generated email drafts that include relevant CRM data from HubSpot. It is designed for customer support or sales teams who want to enhance their email responses with personalized, up-to-date CRM information and maintain quality control through Slack approval before sending.

The workflow consists of the following logical blocks:

- **1.1 Input Reception:** Watches for new incoming Gmail messages that trigger the workflow.
- **1.2 Sender Filtering:** Filters out unwanted senders to avoid processing irrelevant or internal emails.
- **1.3 CRM Data Retrieval:** Searches for the sender's contact in HubSpot, fetches associated deals, companies, and tickets, and normalizes this data for AI consumption.
- **1.4 AI Draft Generation:** Uses Google Gemini Chat Model via LangChain to generate a concise, personalized email reply draft based on the incoming message and CRM context.
- **1.5 Slack Approval:** Sends the AI-generated draft to a specified Slack channel for human approval with a wait-for-response mechanism.
- **1.6 Conditional Reply Sending:** Upon Slack approval, automatically sends the reply email through Gmail.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** Detects new inbound Gmail messages to initiate the workflow.
- **Nodes Involved:** Watch Gmail (New Inbound)
- **Node Details:**
  - **Type:** Gmail Trigger
  - **Role:** Watches the Gmail inbox for new incoming messages every minute.
  - **Configuration:** Polling mode set to every minute; no additional filters applied at this stage.
  - **Inputs:** None (trigger node)
  - **Outputs:** Emits new email metadata including sender, subject, snippet, thread ID.
  - **Edge Cases:** Possible delays due to Gmail API quota limits or polling intervals.

#### 2.2 Sender Filtering

- **Overview:** Filters messages to exclude emails from specific senders (e.g., internal n8n.io domain).
- **Nodes Involved:** Filter: Allowed Sender
- **Node Details:**
  - **Type:** Filter Node
  - **Role:** Blocks further processing if the sender email contains "n8n.io".
  - **Configuration:** Condition set to NOT contain "n8n.io" in the From field (case sensitive).
  - **Inputs:** Output from Gmail trigger.
  - **Outputs:** Passes only allowed senders to the next block.
  - **Edge Cases:** Case sensitivity may cause unexpected filtering; no fallback path if filtered out.

#### 2.3 CRM Data Retrieval

- **Overview:** Looks up the sender in HubSpot to gather contact details and associated records (deals, companies, tickets).
- **Nodes Involved:** Find Contact by Email, Set Record Types, List Contact Associations, Build Batch Read Requests, Batch Read Objects, Normalize CRM Context for LLM
- **Node Details:**

  - **Find Contact by Email**
    - **Type:** HubSpot node (search)
    - **Role:** Searches HubSpot contacts by the sender’s email extracted from the inbound Gmail message.
    - **Configuration:** OAuth2 authenticated; searches by email regex matching to extract a valid email.
    - **Input:** Filtered Gmail message.
    - **Output:** Contact properties including email, name, job title, lifecycle stage, etc.
    - **Edge Cases:** No contact found returns empty results; API auth failures possible.

  - **Set Record Types**
    - **Type:** Code (JavaScript)
    - **Role:** Prepares a list of record types to query associations for: deals, companies, tickets.
    - **Configuration:** Hardcoded list ['deals', 'companies', 'tickets'].
    - **Input:** Contact search output.
    - **Output:** Array of record type objects for subsequent association queries.
  
  - **List Contact Associations**
    - **Type:** HTTP Request
    - **Role:** Queries HubSpot API for associations of the contact with deals, companies, and tickets.
    - **Configuration:** Uses HubSpot OAuth2 credentials; dynamically builds URL using contact ID and record type.
    - **Input:** Record types from previous node.
    - **Output:** Lists of associated record IDs.
    - **Edge Cases:** API limits or invalid contact IDs may cause failures.
  
  - **Build Batch Read Requests**
    - **Type:** Code (JavaScript)
    - **Role:** Constructs batch read requests for deals, companies, and tickets with specific properties to fetch.
    - **Configuration:** Defines properties of interest per object type; collects IDs from associations.
    - **Input:** Association lists.
    - **Output:** Request payloads for batch reads.
  
  - **Batch Read Objects**
    - **Type:** HTTP Request
    - **Role:** Executes batch read requests to fetch detailed properties of deals, companies, and tickets.
    - **Configuration:** HubSpot OAuth2 authentication; POST method with JSON body.
    - **Input:** Batch read requests.
    - **Output:** Detailed property data for each record type.
  
  - **Normalize CRM Context for LLM**
    - **Type:** Code (JavaScript)
    - **Role:** Cleans and consolidates fetched CRM data into a simplified, AI-friendly JSON structure.
    - **Configuration:** Maps each record type’s properties to human-readable fields; removes empty/null fields; summarizes counts.
    - **Input:** Batch read responses.
    - **Output:** Single JSON object with deals, companies, tickets, and summary.
    - **Edge Cases:** Missing or incomplete data handled gracefully; unknown record types ignored.

#### 2.4 AI Draft Generation

- **Overview:** Creates a customer support email reply draft using the Google Gemini Chat Model, incorporating CRM context.
- **Nodes Involved:** Google Gemini Chat Model, Draft Reply (AI Agent)
- **Node Details:**

  - **Google Gemini Chat Model**
    - **Type:** LangChain Google Gemini LM Chat node
    - **Role:** Provides AI language generation backend.
    - **Configuration:** Default options; credentials configured in environment.
    - **Input:** Prompt template and context from Draft Reply node.
    - **Output:** AI-generated text.
    - **Version Requirements:** Requires n8n version supporting LangChain nodes and Google Gemini API access.
    - **Edge Cases:** API throttling, model response delays, or failures.

  - **Draft Reply (AI Agent)**
    - **Type:** LangChain Agent node
    - **Role:** Defines prompt and handles AI interaction to generate the final email reply body.
    - **Configuration:** Detailed prompt instructing tone, structure, and content constraints; pulls dynamic inputs from Gmail and normalized CRM context.
    - **Input:** Output from Normalize CRM Context node and Gmail data.
    - **Output:** Raw text of the drafted email reply.
    - **Edge Cases:** Prompt misconfiguration or missing context may lead to generic or incomplete replies.

#### 2.5 Slack Approval

- **Overview:** Sends the AI-generated draft to Slack for human approval before sending.
- **Nodes Involved:** Wait for Response - Approve Auto-Reply, If Approved?
- **Node Details:**

  - **Wait for Response - Approve Auto-Reply**
    - **Type:** Slack node
    - **Role:** Posts a message to a configured Slack channel including the incoming email snippet and AI draft, then waits for an approval response.
    - **Configuration:** OAuth2 authentication; channel set to a specific Slack channel ID; message dynamically composed using Gmail and draft data; waits indefinitely or until timeout.
    - **Input:** Drafted email body from AI.
    - **Output:** JSON with approval status.
    - **Edge Cases:** Slack API rate limits, user non-response, or misconfiguration of channel.

  - **If Approved?**
    - **Type:** If node
    - **Role:** Checks if the Slack response contains an approval boolean true.
    - **Configuration:** Condition checks `$json.data.approved` equals true.
    - **Input:** Slack approval node output.
    - **Output:** Routes flow to sending email only if approved.
    - **Edge Cases:** Missing or malformed Slack response may cause false negatives.

#### 2.6 Conditional Reply Sending

- **Overview:** Sends the approved reply email back to the original sender via Gmail.
- **Nodes Involved:** Reply to a message
- **Node Details:**
  - **Type:** Gmail node (reply)
  - **Role:** Sends the drafted reply as a Gmail reply within the original email thread.
  - **Configuration:** Uses the threadId from the original inbound email; sends text message without attribution; uses OAuth credentials.
  - **Input:** Approved draft from Slack approval flow.
  - **Output:** Confirmation of sent email.
  - **Edge Cases:** Gmail API rate limiting, invalid thread IDs, or auth errors.

---

### 3. Summary Table

| Node Name                     | Node Type                            | Functional Role                     | Input Node(s)                      | Output Node(s)                       | Sticky Note                                                                                           |
|-------------------------------|------------------------------------|-----------------------------------|-----------------------------------|------------------------------------|-----------------------------------------------------------------------------------------------------|
| Watch Gmail (New Inbound)      | Gmail Trigger                      | Detect inbound email               | None                              | Filter: Allowed Sender              | ## Get incoming email                                                                               |
| Filter: Allowed Sender         | Filter                            | Filter allowed senders             | Watch Gmail (New Inbound)          | Find Contact by Email               |                                                                                                     |
| Find Contact by Email          | HubSpot Search                    | Search contact by sender email     | Filter: Allowed Sender             | Set Record Types                   | ## Get CRM information                                                                             |
| Set Record Types               | Code                             | Prepare record types to query      | Find Contact by Email              | List Contact Associations          |                                                                                                     |
| List Contact Associations      | HTTP Request (HubSpot API)        | Fetch associations for contact     | Set Record Types                  | Build Batch Read Requests          |                                                                                                     |
| Build Batch Read Requests      | Code                             | Build batch read requests          | List Contact Associations          | Batch Read Objects                 |                                                                                                     |
| Batch Read Objects             | HTTP Request (HubSpot API)        | Fetch detailed records             | Build Batch Read Requests          | Normalize CRM Context for LLM      |                                                                                                     |
| Normalize CRM Context for LLM  | Code                             | Clean and consolidate CRM data     | Batch Read Objects                | Draft Reply (AI Agent)             |                                                                                                     |
| Google Gemini Chat Model       | LangChain Google Gemini LM Chat   | AI language model backend          | Draft Reply (AI Agent) (ai_languageModel) | Draft Reply (AI Agent) (main)      | ## Write draft response                                                                            |
| Draft Reply (AI Agent)         | LangChain Agent                  | Generate AI draft reply            | Normalize CRM Context for LLM, Google Gemini Chat Model | Wait for Response - Approve Auto-Reply |                                                                                                     |
| Wait for Response - Approve Auto-Reply | Slack                          | Send draft to Slack and wait approval | Draft Reply (AI Agent)             | If Approved?                      | ## Approve and reply                                                                               |
| If Approved?                  | If                               | Check Slack approval               | Wait for Response - Approve Auto-Reply | Reply to a message                 |                                                                                                     |
| Reply to a message             | Gmail                            | Send reply email                  | If Approved?                      | None                             |                                                                                                     |
| Sticky Note                   | Sticky Note                      | Workflow overview & instructions   | None                             | None                             | ## AI email reply with HubSpot context + Slack approval (Overview and Setup instructions)           |
| Sticky Note1                  | Sticky Note                      | Get incoming email comment         | None                             | None                             | ## Get incoming email                                                                               |
| Sticky Note                   | Sticky Note                      | Get CRM information comment        | None                             | None                             | ## Get CRM information                                                                             |
| Sticky Note2                  | Sticky Note                      | Write draft response comment       | None                             | None                             | ## Write draft response                                                                            |
| Sticky Note3                  | Sticky Note                      | Approve and reply comment          | None                             | None                             | ## Approve and reply                                                                               |
| Sticky Note6                  | Sticky Note                      | Customizing workflow tips          | None                             | None                             | ### 💡 Customizing this workflow: Update sender name in prompt, add HubSpot form trigger, create drafts instead of auto-send |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add a Gmail Trigger node named "Watch Gmail (New Inbound)":**
   - Set to poll every minute.
   - Use Gmail OAuth2 credentials connected to the account receiving emails.
   - No filters configured initially.

3. **Add a Filter node named "Filter: Allowed Sender":**
   - Connect input from "Watch Gmail (New Inbound)".
   - Configure condition: `From` **does not contain** `n8n.io` (case sensitive).
   - Output passes only allowed senders.

4. **Add a HubSpot node named "Find Contact by Email":**
   - Connect input from the Filter node.
   - Operation: Search contacts.
   - Authentication: OAuth2 (HubSpot).
   - Filter: email equals regex-extracted email from `$json.From`.
   - Properties to retrieve: email, firstname, lastname, jobtitle, company, country, state, city, hs_language, phone, mobilephone, lifecycle stage, lead status, owner id, email last open/reply dates, meeting activity, sequences, created date, last modified date, timezone, notes last contacted, object id.

5. **Add a Code node named "Set Record Types":**
   - Connect input from "Find Contact by Email".
   - JavaScript code to output array of objects: `deals`, `companies`, `tickets`.

6. **Add an HTTP Request node named "List Contact Associations":**
   - Connect input from "Set Record Types".
   - Method: GET.
   - URL: `https://api.hubapi.com/crm/v4/objects/contacts/{{contact_id}}/associations/{{record_type}}`.
   - Use HubSpot OAuth2 credentials.
   - Replace `{{contact_id}}` with `$('Find Contact by Email').item.json.id`.
   - Replace `{{record_type}}` with each record type from the input.

7. **Add a Code node named "Build Batch Read Requests":**
   - Connect input from "List Contact Associations".
   - JavaScript code builds batch read POST requests containing properties to fetch for each record type (deals, companies, tickets).
   - Outputs multiple requests with body and headers prepared.

8. **Add an HTTP Request node named "Batch Read Objects":**
   - Connect input from "Build Batch Read Requests".
   - Method: POST.
   - URL: Taken dynamically from input JSON (`{{$json.url}}`).
   - Body: `{{$json.body}}`.
   - Content-Type: `application/json`.
   - Use HubSpot OAuth2 credentials.
   - Send body raw.

9. **Add a Code node named "Normalize CRM Context for LLM":**
   - Connect input from "Batch Read Objects".
   - JavaScript code consolidates and cleans the data to a simplified JSON structure suitable for AI prompt consumption.
   - Outputs one item containing deals, companies, tickets, and summary counts.

10. **Add a LangChain Google Gemini Chat Model node named "Google Gemini Chat Model":**
    - Connect as AI language model to "Draft Reply (AI Agent)" node.
    - Configure with your Google AI Studio API key (credentials).
    - Use default options.

11. **Add a LangChain Agent node named "Draft Reply (AI Agent)":**
    - Connect input from "Normalize CRM Context for LLM".
    - Configure prompt with detailed template:
      - Include inputs: sender name, subject, customer message from Gmail.
      - Include context: HubSpot contact, companies, deals, tickets JSON.
      - Specify tone: friendly, professional, concise.
      - Output format: only email body, no JSON or metadata.
      - Signature placeholder with your name (e.g., John Bolton).
    - Connect AI language model input to "Google Gemini Chat Model".

12. **Add a Slack node named "Wait for Response - Approve Auto-Reply":**
    - Connect input from "Draft Reply (AI Agent)".
    - Operation: Send message and wait for response.
    - Authentication: OAuth2 Slack credentials.
    - Channel: Select target Slack channel for approval (e.g., `C09H7HTHRMG`).
    - Message: Compose with dynamic content referencing original email sender, snippet, and AI draft.
    - Set appropriate wait time or leave indefinite.

13. **Add an If node named "If Approved?":**
    - Connect input from Slack approval node.
    - Condition: Check if `$json.data.approved` is `true`.
    - True output connects to next node, False stops.

14. **Add a Gmail node named "Reply to a message":**
    - Connect true output from "If Approved?".
    - Operation: Reply to message.
    - Message: Use AI draft from "Draft Reply (AI Agent)" output.
    - Message ID: Use thread ID from original Gmail message.
    - Email Type: Text.
    - OAuth2 Gmail credentials must be configured (same account as trigger).

15. **Connect nodes sequentially as described above to build the flow.**

16. **Add Sticky Note nodes as needed for documentation and overview within the n8n editor.**

---

### 5. General Notes & Resources

| Note Content                                                                                                   | Context or Link                                                                                  |
|---------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Workflow overview and setup instructions included as a sticky note for easy reference in the editor.           | Sticky Note named "Workflow Overview" at workflow start.                                        |
| Customization tips: Update sender name in AI prompt, optionally add HubSpot form trigger, create drafts instead of auto-send. | Sticky Note6 content; recommends adjusting the AI signature and workflow triggers.              |
| Google AI Studio API key required for the Gemini Chat Model node integration.                                  | https://aistudio.google.com/                                                                     |
| Slack channel must be pre-configured with OAuth2 credentials and app permissions to send messages and receive responses. | Slack app configuration and OAuth2 setup required.                                             |
| HubSpot OAuth2 credentials must have sufficient CRM API scopes for contact search and batch object reads.      | HubSpot developer portal and app setup required.                                               |
| Gmail OAuth2 credentials must allow read and send access on the monitored email address.                       | Google Cloud Console OAuth client with Gmail scopes.                                           |

---

This documentation provides a full technical reference to understand, reproduce, and maintain the “AI Email Reply with Full HubSpot Context + Slack Approval” workflow using n8n. It covers all nodes, configurations, logic flows, and integration points necessary for advanced usage and customization.