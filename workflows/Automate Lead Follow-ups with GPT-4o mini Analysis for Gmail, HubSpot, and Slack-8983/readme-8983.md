Automate Lead Follow-ups with GPT-4o mini Analysis for Gmail, HubSpot, and Slack

https://n8nworkflows.xyz/workflows/automate-lead-follow-ups-with-gpt-4o-mini-analysis-for-gmail--hubspot--and-slack-8983


# Automate Lead Follow-ups with GPT-4o mini Analysis for Gmail, HubSpot, and Slack

### 1. Workflow Overview

This workflow automates lead follow-ups by integrating Gmail, AI analysis with GPT-4o mini, HubSpot task creation, Slack notifications, and Google Sheets logging. It is designed to monitor new lead responses in Gmail, analyze the content using AI to determine sentiment, intent, urgency, priority, and next action, and then trigger appropriate sales follow-up actions. The workflow is structured into four main logical blocks:

- **1.1 Intake (Gmail Monitoring and Validation):** Watches Gmail for new lead responses labeled specifically, and verifies data presence before further processing.
- **1.2 Normalize & Analyze (AI Processing):** Normalizes raw Gmail data into a structured format and uses OpenAI GPT-4o mini powered agent to analyze the lead response, returning key analytical attributes.
- **1.3 Parse & Decide:** Parses the AI JSON response safely, enriches the data with flags for follow-up necessity and priority, then branches based on whether follow-up is required.
- **1.4 Actions (CRM, Communication & Logging):** Performs follow-up actions by creating HubSpot tasks, notifying the sales team via Slack, and logging all analyses into Google Sheets for record-keeping.

---

### 2. Block-by-Block Analysis

#### 2.1 Intake (Gmail Monitoring and Validation)

**Overview:**  
This block triggers on new Gmail messages labeled as lead responses, checks if the message data exists, and passes the data forward for normalization.

**Nodes Involved:**  
- Gmail: New Lead Response  
- Check if Data Exists  
- Sticky Note (step description)

**Node Details:**  

- **Gmail: New Lead Response**  
  - *Type & Role:* Gmail Trigger node; listens for new emails with a specific label (lead responses).  
  - *Configuration:* Polls every minute, filters by user-specified Gmail label ID.  
  - *Credentials:* OAuth2 Gmail account.  
  - *Inputs/Outputs:* No input; outputs raw Gmail message JSON.  
  - *Failures:* Auth errors, label misconfiguration, rate limits, network issues.

- **Check if Data Exists**  
  - *Type & Role:* If node; verifies that incoming Gmail data is present before proceeding.  
  - *Configuration:* Checks existence of Gmail JSON data using an expression.  
  - *Inputs:* Gmail node output.  
  - *Outputs:* Routes only if data exists.  
  - *Failures:* Expression errors if input structure changes.

- **Sticky Note**  
  - *Role:* Documentation for this block describing the polling and fields captured (From, Subject, snippet, internalDate).

---

#### 2.2 Normalize & Analyze (AI Processing)

**Overview:**  
Transforms Gmail data into a normalized format, then uses an AI agent powered by OpenAI GPT-4o mini to analyze the lead response text for sentiment, intent, urgency, next action, summary, and priority.

**Nodes Involved:**  
- Normalize Gmail Data  
- OpenAI Chat Model  
- Analyze Lead Response (AI)  
- Sticky Note1

**Node Details:**  

- **Normalize Gmail Data**  
  - *Type & Role:* Set node; extracts and renames key Gmail fields to normalized ones: leadEmail, subject, message, source (Gmail), and receivedAt (timestamp).  
  - *Configuration:* Assigns fields from incoming Gmail JSON to a simplified structure for AI input.  
  - *Inputs:* Output from Check if Data Exists.  
  - *Outputs:* Normalized data JSON for AI analysis.  
  - *Failures:* Misnamed or missing Gmail fields may cause empty values.

- **OpenAI Chat Model**  
  - *Type & Role:* Language model node (Langchain); wraps OpenAI GPT-4o mini model for conversational AI tasks.  
  - *Configuration:* Uses GPT-4o mini model with default options; linked to OpenAI credentials.  
  - *Inputs:* None directly; used as a language model resource for the Agent node.  
  - *Outputs:* Model inference results.  
  - *Failures:* API key errors, rate limits, timeouts, invalid prompt.

- **Analyze Lead Response (AI)**  
  - *Type & Role:* Langchain Agent node; constructs prompt with normalized lead data and requests JSON response for six analytical keys.  
  - *Configuration:* Prompt explicitly requests sentiment, intent, urgency, nextAction, summary, and priority with clear instructions to respond in JSON format.  
  - *Inputs:* Normalized Gmail data.  
  - *Outputs:* Raw AI JSON string in output field.  
  - *Failures:* Incorrect prompt formatting, malformed AI response, API errors.

- **Sticky Note1**  
  - *Role:* Describes normalization and AI analysis steps including fields captured and AI output keys.

---

#### 2.3 Parse & Decide

**Overview:**  
This block parses the AI JSON response robustly with fallback defaults, enriches lead data with analysis date and flags, and conditionally routes further processing only if follow-up is needed.

**Nodes Involved:**  
- Parse AI Analysis Results  
- Needs Follow-Up?  
- Sticky Note2

**Node Details:**  

- **Parse AI Analysis Results**  
  - *Type & Role:* Code node (JavaScript); removes markdown code fences from AI response, attempts JSON parsing, and applies fallback values if parsing fails. Combines parsed AI data with normalized lead data.  
  - *Configuration:* Custom JS code to sanitize and parse AI output, adds flags: needsFollowUp (true if nextAction ≠ 'No Action'), isHighPriority (true if priority is Hot or urgency High), and analysisDate (ISO timestamp).  
  - *Inputs:* Raw AI JSON string from Analyze Lead Response (AI).  
  - *Outputs:* Parsed and enriched JSON object for downstream nodes.  
  - *Failures:* Parsing errors handled by fallback; expression failures if node names change.

- **Needs Follow-Up?**  
  - *Type & Role:* If node; checks boolean field needsFollowUp to determine if follow-up actions should be triggered.  
  - *Configuration:* Condition where needsFollowUp == true (boolean strict check).  
  - *Inputs:* Parsed AI JSON from Parse AI Analysis Results.  
  - *Outputs:* Routes to action nodes if true, otherwise workflow ends.  
  - *Failures:* Expression errors if needsFollowUp missing or malformed.

- **Sticky Note2**  
  - *Role:* Explains parsing logic, fallback defaults, and routing condition.

---

#### 2.4 Actions (CRM, Communication & Logging)

**Overview:**  
Executes follow-up workflows: creates a task in HubSpot CRM, sends a notification to a Slack sales channel, and logs the analysis result into Google Sheets for auditing and reporting.

**Nodes Involved:**  
- HubSpot: Create Follow-up Task  
- Slack: Notify Sales Team  
- Log to Google Sheets  
- Sticky Note3

**Node Details:**  

- **HubSpot: Create Follow-up Task**  
  - *Type & Role:* HubSpot node; creates a new task engagement linked to a contact with message and subject from analysis.  
  - *Configuration:* Task type; metadata includes message body, subject, and object type CONTACT; uses app token authentication.  
  - *Inputs:* Parsed AI JSON from Needs Follow-Up? node.  
  - *Outputs:* None (end node).  
  - *Failures:* API token expiration, invalid contact references, network errors.

- **Slack: Notify Sales Team**  
  - *Type & Role:* Slack node; posts a message summarizing the analysis to a specified Slack channel.  
  - *Configuration:* Uses channel ID and webhook ID; message includes summary, lead email, priority, urgency, and analysis date; markdown disabled.  
  - *Inputs:* Parsed AI JSON from Needs Follow-Up? node.  
  - *Outputs:* None (end node).  
  - *Failures:* Webhook misconfiguration, permission errors.

- **Log to Google Sheets**  
  - *Type & Role:* Google Sheets node; appends a new row with detailed analysis data into a Google Sheet for record keeping.  
  - *Configuration:* Maps columns explicitly including Date, Email, Intent, Message, Subject, Summary, Urgency, Priority, Sentiment, nextAction; appends to specified sheet and document ID.  
  - *Inputs:* Parsed AI JSON from Needs Follow-Up? node.  
  - *Outputs:* None (end node).  
  - *Failures:* OAuth token expiry, sheet ID or name errors, column mapping mismatches.

- **Sticky Note3**  
  - *Role:* Summarizes action nodes and notes best practice for column/type mapping in Google Sheets.

---

### 3. Summary Table

| Node Name                    | Node Type                      | Functional Role                    | Input Node(s)                 | Output Node(s)                             | Sticky Note                                                                                       |
|------------------------------|--------------------------------|----------------------------------|------------------------------|-------------------------------------------|-------------------------------------------------------------------------------------------------|
| Gmail: New Lead Response      | Gmail Trigger                  | Intake trigger for new lead email | None                         | Check if Data Exists                       | ## STEP 1 · Intake (Gmail) Polls Gmail for new lead replies (by label). Fields captured: From, Subject, snippet, internalDate. |
| Check if Data Exists          | If                            | Validates Gmail data presence     | Gmail: New Lead Response      | Normalize Gmail Data                       | ## STEP 1 · Intake (Gmail) Polls Gmail for new lead replies (by label). Fields captured: From, Subject, snippet, internalDate. |
| Normalize Gmail Data          | Set                           | Normalizes Gmail fields for AI    | Check if Data Exists          | Analyze Lead Response (AI)                 | ## STEP 2 · Normalize & Analyze (AI) Normalize Gmail → {leadEmail, subject, message, receivedAt}. AI returns JSON with analysis keys. |
| OpenAI Chat Model             | Langchain Language Model       | Provides GPT-4o mini model        | None (used by Agent)          | Analyze Lead Response (AI)                 | ## STEP 2 · Normalize & Analyze (AI) Normalize Gmail → {leadEmail, subject, message, receivedAt}. AI returns JSON with analysis keys. |
| Analyze Lead Response (AI)    | Langchain Agent                | Analyzes lead response via AI     | Normalize Gmail Data          | Parse AI Analysis Results                  | ## STEP 2 · Normalize & Analyze (AI) Normalize Gmail → {leadEmail, subject, message, receivedAt}. AI returns JSON with analysis keys. |
| Parse AI Analysis Results     | Code                          | Parses AI JSON, adds flags        | Analyze Lead Response (AI)    | Needs Follow-Up?                           | ## STEP 3 · Parse & Decide Code node parses LLM JSON (with fallback). Adds flags and analysisDate. |
| Needs Follow-Up?              | If                            | Routes workflow if follow-up needed | Parse AI Analysis Results     | HubSpot: Create Follow-up Task, Slack: Notify Sales Team, Log to Google Sheets | ## STEP 3 · Parse & Decide Code node parses LLM JSON (with fallback). Adds flags and analysisDate. |
| HubSpot: Create Follow-up Task| HubSpot                       | Creates follow-up task in CRM     | Needs Follow-Up?              | None                                      | ## STEP 4 · Actions HubSpot task creation, Slack notification, Google Sheets logging.             |
| Slack: Notify Sales Team      | Slack                         | Notifies sales team via Slack     | Needs Follow-Up?              | None                                      | ## STEP 4 · Actions HubSpot task creation, Slack notification, Google Sheets logging.             |
| Log to Google Sheets          | Google Sheets                 | Logs analysis data in spreadsheet | Needs Follow-Up?              | None                                      | ## STEP 4 · Actions HubSpot task creation, Slack notification, Google Sheets logging.             |
| Sticky Note                  | Sticky Note                   | Documentation                    | None                         | None                                      | Various notes as detailed above.                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger Node:**  
   - Type: Gmail Trigger  
   - Poll every minute for new emails with a specific label (set `labelIds` to your Gmail lead response label).  
   - Connect your Gmail OAuth2 credentials.

2. **Add If Node to Check Data Exists:**  
   - Type: If  
   - Condition: Check if the output JSON from Gmail node exists (`{{$node["Gmail: New Lead Response"].json}} exists`).  
   - Connect input from Gmail node.

3. **Add Set Node to Normalize Gmail Data:**  
   - Type: Set  
   - Create fields:  
     - leadEmail = `{{$json.From}}`  
     - subject = `{{$json.Subject}}`  
     - message = `{{$json.snippet}}`  
     - source = `"Gmail"` (string)  
     - receivedAt = `{{$json.internalDate}}`  
   - Input from Check if Data Exists node.

4. **Add OpenAI Chat Model Node:**  
   - Type: Langchain Language Model (OpenAI)  
   - Model: `gpt-4o-mini`  
   - Provide OpenAI API credentials.  
   - This node is used as a resource by the Agent node, no direct input/output connections needed.

5. **Add Langchain Agent Node to Analyze Lead Response:**  
   - Type: Langchain Agent  
   - Prompt text:  
     ```
     Analyze this lead response and provide:

     1. Sentiment: (Positive/Neutral/Negative)
     2. Intent: (Interested/Not Interested/Needs Info/Ready to Buy/Objection)
     3. Urgency: (High/Medium/Low)
     4. Next Action: (Call/Email/Demo/Quote/No Action)
     5. Summary: Brief 1-2 sentence summary
     6. Priority: (Hot/Warm/Cold)

     Lead Email: {{ $json.leadEmail }}
     Subject: {{ $json.subject }}
     Message: {{ $json.message }}

     Respond in JSON format with keys: sentiment, intent, urgency, nextAction, summary, priority
     ```
   - Connect input from Normalize Gmail Data node.  
   - Use the OpenAI Chat Model node as the language model resource.

6. **Add Code Node to Parse AI Analysis Results:**  
   - Type: Code  
   - JavaScript code (adapted from workflow):  
     ```js
     let aiResponse = $json.output;
     aiResponse = aiResponse.replace(/```json|```/g, '').trim();
     let analysis;
     try {
       analysis = JSON.parse(aiResponse);
     } catch (error) {
       analysis = {
         sentiment: 'Neutral',
         intent: 'Needs Info',
         urgency: 'Medium',
         nextAction: 'Email',
         summary: 'Could not parse AI response',
         priority: 'Warm'
       };
     }
     const leadData = $node['Normalize Gmail Data'].json;
     const result = {
       ...leadData,
       ...analysis,
       analysisDate: new Date().toISOString(),
       needsFollowUp: analysis.nextAction !== 'No Action',
       isHighPriority: analysis.priority === 'Hot' || analysis.urgency === 'High'
     };
     return [{ json: result }];
     ```
   - Connect input from Analyze Lead Response (AI) node.

7. **Add If Node to Check Needs Follow-Up:**  
   - Type: If  
   - Condition: Check if `needsFollowUp` is true (boolean strict).  
   - Input from Parse AI Analysis Results node.

8. **Add HubSpot Node to Create Follow-up Task:**  
   - Type: HubSpot  
   - Operation: Create engagement task  
   - Metadata:  
     - body = `{{$json.message}}`  
     - subject = `{{$json.subject}}`  
     - forObjectType = `CONTACT`  
   - Authenticate with HubSpot App Token.  
   - Connect input from Needs Follow-Up? node (true branch).

9. **Add Slack Node to Notify Sales Team:**  
   - Type: Slack  
   - Action: Post message to channel  
   - Channel ID: your Slack channel ID (e.g., `general`)  
   - Message text:  
     ```
     Summary: {{ $json.summary }}
     Email: {{ $json.leadEmail }}
     Priority: {{ $json.priority }}
     Urgency: {{ $json.urgency }}
     Date: {{ $json.analysisDate }}
     ```  
   - Disable markdown formatting if preferred.  
   - Connect input from Needs Follow-Up? node (true branch).  
   - Use Slack API credentials.

10. **Add Google Sheets Node to Log Analysis Data:**  
    - Type: Google Sheets  
    - Operation: Append  
    - Document ID: your Google Sheet ID  
    - Sheet Name: specify the sheet or gid (e.g., `gid=0`)  
    - Map columns explicitly: Date, Email, Intent, Message, Subject, Summary, Urgency, Priority, Sentiment, nextAction  
    - Use Google Sheets OAuth2 credentials.  
    - Connect input from Needs Follow-Up? node (true branch).

---

### 5. General Notes & Resources

| Note Content                                                                                                         | Context or Link                                                                                 |
|----------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Workflow uses GPT-4o mini via Langchain integration for cost-effective AI analysis.                                   | n8n Langchain nodes documentation: https://docs.n8n.io/integrations/builtin/nodes/langchain/    |
| Google Sheets column mapping is critical to avoid schema mismatches and data errors.                                  | Google Sheets API best practices for data mapping                                               |
| HubSpot tasks are created only if the AI determines follow-up is needed (nextAction not "No Action").                  | HubSpot Engagements API: https://developers.hubspot.com/docs/api/crm/engagements                |
| Slack notifications post summary to sales channel to keep team informed in real-time.                                 | Slack Incoming Webhooks: https://api.slack.com/messaging/webhooks                               |
| The JavaScript parsing node provides fault tolerance against malformed AI JSON responses to ensure workflow stability.| n8n Code node documentation: https://docs.n8n.io/nodes/n8n-nodes-base.code/                     |
| Gmail trigger requires correct label ID setup; ensure label exists and is applied to relevant lead responses.         | Gmail API Labels: https://developers.google.com/gmail/api/guides/labels                         |

---

This document fully describes the structure, logic, and configuration of the "Automate Lead Follow-ups with GPT-4o mini Analysis for Gmail, HubSpot, and Slack" workflow, enabling replication, modification, and troubleshooting.