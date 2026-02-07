Analyze high-priority tenders from Airtable to Slack for Go/No-Go approval

https://n8nworkflows.xyz/workflows/analyze-high-priority-tenders-from-airtable-to-slack-for-go-no-go-approval-11526


# Analyze high-priority tenders from Airtable to Slack for Go/No-Go approval

### 1. Workflow Overview

This workflow automates the evaluation and approval process of high-priority tenders stored in Airtable. It is designed for procurement and bid management teams who need to systematically review tenders based on urgency, opportunity, and risk, then route them for management approval via Slack. The workflow includes the following logical blocks:

- **1.1 Trigger & Data Fetch:** Automatically triggers daily to fetch high-priority, pending tenders from Airtable.
- **1.2 AI Analysis & Summary:** Uses OpenAI GPT-4 via LangChain nodes to analyze tender details, producing a structured JSON summary and a Go/No-Go recommendation.
- **1.3 Approval Workflow:** Sends the summarized tender details to Slack with interactive approval buttons; captures decision responses.
- **1.4 Status Update & Notifications:** Updates tender status in Airtable based on approval and sends confirmation emails or fallback messages.
- **1.5 Error Handling:** Captures and reports workflow errors to a designated Slack channel for quick response.

---

### 2. Block-by-Block Analysis

#### 2.1 Trigger & Data Fetch

- **Overview:**  
  This block initiates the workflow daily at 9 AM and fetches tenders marked as "High" priority and "Pending" status from Airtable.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Fetch Pending Record From Airtable

- **Node Details:**

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Starts workflow once daily at 9:00 AM.  
    - Configuration: Set to trigger exactly at 9 AM every day.  
    - Input: None (start node)  
    - Output: Triggers "Fetch Pending Record From Airtable"  
    - Edge cases: Missed trigger if n8n instance is down; time zone discrepancies.

  - **Fetch Pending Record From Airtable**  
    - Type: Airtable node  
    - Role: Retrieves tenders with Priority = "High" and Status = "Pending"  
    - Configuration: Uses Airtable Personal Access Token credential; queries specific base and table; filter formula `AND({Priority} = "High", {Status} = "Pending")`.  
    - Input: Trigger from Schedule Trigger  
    - Output: Passes tender records to AI Agent node  
    - Edge cases: Airtable API limit reached, invalid credentials, no records found.

---

#### 2.2 AI Analysis & Summary

- **Overview:**  
  This block processes each tender through OpenAI GPT-4 to analyze urgency, opportunity, and risk, then generates a structured JSON output with a recommendation.

- **Nodes Involved:**  
  - AI Model: GPT-4 Priority Engine  
  - AI Memory: Priority Context  
  - AI Agent OpenAI — RFP Summary + Scoring with JSON output  
  - Parse AI Output (Structured JSON)  
  - Format Data From AI Agent

- **Node Details:**

  - **AI Model: GPT-4 Priority Engine**  
    - Type: LangChain OpenAI Chat Model  
    - Role: Provides GPT-4 language model for AI Agent  
    - Configuration: Model set to "gpt-4o-mini" with temperature 0.7 for balanced creativity.  
    - Credentials: OpenAI API token configured.  
    - Input: Receives tender data from Airtable node.  
    - Output: Feeds language model to AI Agent node.  
    - Edge cases: API rate limits, network errors, invalid API key.

  - **AI Memory: Priority Context**  
    - Type: LangChain Memory Buffer Window  
    - Role: Maintains session context with key "AI Agenda" to help AI provide coherent analysis across multiple tenders.  
    - Input: Connected internally to AI Agent node.  
    - Output: Provides memory context to AI Agent.  
    - Edge cases: Memory overflow or session state loss.

  - **AI Agent OpenAI — RFP Summary + Scoring with JSON output**  
    - Type: LangChain AI Agent node  
    - Role: Core node that sends tender details and evaluation rules as prompt; expects strictly formatted JSON output.  
    - Configuration:  
      - Text prompt includes tender fields (reference, company, location, brief, dates, link, source, status).  
      - System message instructs AI to analyze tenders with specific evaluation rules, respond only in JSON with keys: urgency, priorityScore, summary, goNoGo, reason.  
      - Output parser enabled.  
    - Input: Tender JSON + AI Model + AI Memory  
    - Output: JSON summary and decision.  
    - Edge cases: AI may return invalid JSON if prompt misunderstood; missing tender fields can lead to "Review Required" urgency.

  - **Parse AI Output (Structured JSON)**  
    - Type: LangChain Output Parser Structured JSON  
    - Role: Validates and parses AI Agent JSON output to ensure it matches expected schema.  
    - Configuration: JSON schema example includes urgency, priorityScore, summary, goNoGo, reason.  
    - Input: AI Agent JSON response  
    - Output: Parsed structured data for downstream use.  
    - Edge cases: Parsing errors if AI output is malformed.

  - **Format Data From AI Agent**  
    - Type: Set node  
    - Role: Extracts relevant fields from AI output and enriches data with Airtable URL and tender reference for Slack message.  
    - Configuration: Sets variables Urgency, PriorityScore, Summary, goNoGo, Reason, AirtableURL (constructed with Airtable record ID), TenderRefNo.  
    - Input: Parsed AI output  
    - Output: Formatted data for priority checking and Slack notification.  
    - Edge cases: Missing Airtable record ID could break URL; expression errors if nodes upstream fail.

---

#### 2.3 Approval Workflow

- **Overview:**  
  This block decides if a tender qualifies for approval routing, sends a detailed Slack message with approve/reject buttons, and checks the manager's response.

- **Nodes Involved:**  
  - Check Priority  
  - Send Tender Details and wait for response (Slack)  
  - Check Approved

- **Node Details:**

  - **Check Priority**  
    - Type: If node  
    - Role: Filters tenders for those with Urgency = "High", PriorityScore > 70, and goNoGo = "Go"  
    - Configuration: Three conditions combined with AND.  
    - Input: Formatted AI data  
    - Output:  
      - True: To Slack approval node  
      - False: To fallback Slack message node ("No Priority Tender Available")  
    - Edge cases: Case sensitivity or type mismatches could misroute data.

  - **Send Tender Details and wait for response**  
    - Type: Slack node (sendAndWait)  
    - Role: Sends tender summary to Slack channel with interactive approval buttons (Accept/Reject).  
    - Configuration:  
      - Channel: "general-information" Slack channel ID  
      - Message includes tender ref no, summary, Go/No-Go recommendation, reason, priority score, and Airtable review link.  
      - Approval type: double (approve and disapprove labels)  
    - Credentials: Slack API token configured.  
    - Input: True branch from Check Priority  
    - Output: Passes approval response to Check Approved node  
    - Edge cases: Slack API rate limits, invalid channel ID, user ignores request.

  - **Check Approved**  
    - Type: If node  
    - Role: Checks Slack response for approval boolean true.  
    - Configuration: Condition checks `data.approved` boolean true.  
    - Input: Slack approval response  
    - Output:  
      - True: To send confirmation email and update Airtable status as Approved  
      - False: To update Pending Status with "Approved" (Note: this appears contradictory; see below)  
    - Edge cases: Slack message response format changes; user rejects or no response.

---

#### 2.4 Status Update & Notifications

- **Overview:**  
  Updates tender status in Airtable based on approval outcome and sends confirmation email to bid team or fallback Slack message if no tenders found.

- **Nodes Involved:**  
  - Update Approved Status (Airtable)  
  - Send Confirmation Mail (Gmail)  
  - Update Pending Status (Airtable)  
  - Send Message (Slack fallback)

- **Node Details:**

  - **Update Approved Status**  
    - Type: Airtable node  
    - Role: Updates tender status to "Approved" for tenders approved in Slack.  
    - Configuration: Matches record by TenderRefNo; updates Status field to "Approved".  
    - Input: True branch from Check Approved node  
    - Output: None  
    - Edge cases: Airtable API issues, mismatched TenderRefNo, concurrency updates.

  - **Send Confirmation Mail**  
    - Type: Gmail node  
    - Role: Sends email notification to bid team with tender summary and next steps after approval.  
    - Configuration:  
      - Recipient email hardcoded (replace with environment variable recommended)  
      - Subject includes tender reference number  
      - Body includes summary, priority score, recommendation, Airtable review link, and instructions.  
    - Credentials: Gmail OAuth2 configured.  
    - Input: True branch from Check Approved node  
    - Output: None  
    - Edge cases: Email quota limits, invalid email address, credentials expired.

  - **Update Pending Status**  
    - Type: Airtable node  
    - Role: Updates tender status to "Approved" on false branch of Check Approved (likely a logic error—should probably update to "Rejected" or keep "Pending").  
    - Configuration: Matches TenderRefNo to update Status field.  
    - Input: False branch from Check Approved node  
    - Output: None  
    - Edge cases: Logic ambiguity; could cause incorrect status updates.

  - **Send Message (Slack fallback)**  
    - Type: Slack node  
    - Role: Sends fallback message to Slack channel if no high-priority tenders are available.  
    - Configuration: Static text "There is No Priority Tender Available." in the same Slack channel as approvals.  
    - Credentials: Slack API token configured.  
    - Input: False branch from Check Priority (no qualifying tenders)  
    - Output: None  
    - Edge cases: Slack API errors.

---

#### 2.5 Error Handling

- **Overview:**  
  Catches any runtime errors in the workflow and posts an alert message to Slack for monitoring and debugging.

- **Nodes Involved:**  
  - Error Handler Trigger  
  - Slack: Send Error Alert

- **Node Details:**

  - **Error Handler Trigger**  
    - Type: Error Trigger  
    - Role: Captures any workflow node failure or error.  
    - Input: Global catch  
    - Output: Routes error info to Slack alert node.

  - **Slack: Send Error Alert**  
    - Type: Slack node  
    - Role: Sends a formatted error alert message to a configured Slack channel.  
    - Configuration: Message includes node name, error message, and timestamp.  
    - Credentials: Slack API token configured.  
    - Edge cases: Slack API downtime; error messages that are too verbose or missing details.

---

### 3. Summary Table

| Node Name                              | Node Type                          | Functional Role                            | Input Node(s)                     | Output Node(s)                                  | Sticky Note                                                                                   |
|--------------------------------------|----------------------------------|--------------------------------------------|----------------------------------|------------------------------------------------|----------------------------------------------------------------------------------------------|
| Schedule Trigger                     | Schedule Trigger                 | Starts workflow daily at 9 AM              | None                             | Fetch Pending Record From Airtable              | ## 📡 Trigger & Fetch Pending Tenders\nDaily trigger checks Airtable for high priority tenders. |
| Fetch Pending Record From Airtable  | Airtable                        | Retrieves high priority, pending tenders  | Schedule Trigger                 | AI Agent OpenAI — RFP Summary + Scoring with JSON output | See above                                                                                   |
| AI Model: GPT-4 Priority Engine     | LangChain LM Chat OpenAI        | Provides GPT-4 model for AI analysis       | Fetch Pending Record From Airtable | AI Agent OpenAI — RFP Summary + Scoring with JSON output | ## 🧠 AI Analysis & Summary\nEvaluates urgency, opportunity, and risk.                    |
| AI Memory: Priority Context          | LangChain Memory Buffer Window  | Maintains AI session context                | AI Agent OpenAI node (memory input) | AI Agent OpenAI — RFP Summary + Scoring with JSON output | See above                                                                                   |
| AI Agent OpenAI — RFP Summary + Scoring with JSON output | LangChain AI Agent              | Generates tender analysis and JSON output  | Fetch Pending Record From Airtable, AI Model, AI Memory | Parse AI Output (Structured JSON)                    | See above                                                                                   |
| Parse AI Output (Structured JSON)   | LangChain Output Parser Structured | Validates and parses AI JSON output         | AI Agent OpenAI agent            | Format Data From AI Agent                        | See above                                                                                   |
| Format Data From AI Agent            | Set                            | Formats AI output and enriches with URLs   | Parse AI Output                  | Check Priority                                  | See above                                                                                   |
| Check Priority                      | If                             | Filters tenders based on urgency, score, and goNoGo | Format Data From AI Agent        | Send Tender Details and wait for response (true), Send Message (false) | ## 🏛 Management Approval Flow\nHigh-value tenders routed for Slack approval.            |
| Send Tender Details and wait for response | Slack (sendAndWait)             | Sends tender summary to Slack for approval | Check Priority (true)            | Check Approved                                  | See above                                                                                   |
| Check Approved                     | If                             | Checks Slack approval response              | Send Tender Details and wait for response | Send Confirmation Mail, Update Approved Status (true), Update Pending Status (false) | See above                                                                                   |
| Send Confirmation Mail             | Gmail                          | Sends approval confirmation email           | Check Approved (true)            | None                                           | ## 📊 Status Update & Notifications\nSends email upon approval.                            |
| Update Approved Status             | Airtable                       | Updates tender status to "Approved"          | Check Approved (true)            | None                                           | See above                                                                                   |
| Update Pending Status              | Airtable                       | Updates tender status for non-approval       | Check Approved (false)           | None                                           | See above                                                                                   |
| Send Message                     | Slack                         | Sends fallback message if no tenders found  | Check Priority (false)           | None                                           | See above                                                                                   |
| Error Handler Trigger             | Error Trigger                 | Captures any workflow errors                  | Global error                    | Slack: Send Error Alert                         | ## 🚨 Error Handling\nCatches failures and alerts Slack.                                  |
| Slack: Send Error Alert           | Slack                        | Sends error alert message to Slack            | Error Handler Trigger           | None                                           | See above                                                                                   |
| Sticky Note                      | Sticky Note                  | Tender Summary Generator overview and setup | None                           | None                                           | ## Tender Summary Generator for Management Approval (full workflow explanation)           |
| Sticky Note1                     | Sticky Note                  | Explains Trigger & Fetch block                 | None                           | None                                           | See above                                                                                   |
| Sticky Note2                     | Sticky Note                  | Explains AI Analysis block                      | None                           | None                                           | See above                                                                                   |
| Sticky Note3                     | Sticky Note                  | Explains Management Approval block              | None                           | None                                           | See above                                                                                   |
| Sticky Note4                     | Sticky Note                  | Explains Status Update & Notifications block    | None                           | None                                           | See above                                                                                   |
| Sticky Note5                     | Sticky Note                  | Credentials & Security reminder                   | None                           | None                                           | ## 🔐 Credentials & Security\nEnsure secure token storage and data privacy.               |
| Sticky Note7                     | Sticky Note                  | Explains Error Handling block                       | None                           | None                                           | See above                                                                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger node:**  
   - Type: Schedule Trigger  
   - Set to trigger daily at 9:00 AM (local time).  

2. **Create Airtable node to fetch tenders:**  
   - Type: Airtable  
   - Credentials: Airtable Personal Access Token  
   - Configure Base and Table to your tender data source.  
   - Operation: Search  
   - Filter formula: `AND({Priority} = "High", {Status} = "Pending")`  
   - Connect output from Schedule Trigger to this node.

3. **Create LangChain AI Model node:**  
   - Type: LangChain LM Chat OpenAI  
   - Credentials: OpenAI API key  
   - Model: "gpt-4o-mini"  
   - Temperature: 0.7  
   - Connect output from Airtable node.

4. **Create LangChain AI Memory node:**  
   - Type: LangChain Memory Buffer Window  
   - Session Key: "AI Agenda"  
   - Session ID Type: Custom key  
   - Connect memory input to AI Agent node (to be created next).

5. **Create LangChain AI Agent node:**  
   - Type: LangChain AI Agent  
   - Connect AI Model node as language model input.  
   - Connect AI Memory node as memory input.  
   - Text prompt: Include tender fields (TenderRefNo, Company Name, Country, State, City, TenderBrief, Opening Date, Closing Date, Description Link, Original_Source, Status).  
   - System message: Expert instructions including evaluation rules and JSON-only response requirement.  
   - Enable output parser.

6. **Create LangChain Output Parser (Structured JSON):**  
   - Type: LangChain Output Parser Structured JSON  
   - Provide JSON schema example with fields: urgency, priorityScore, summary, goNoGo, reason.  
   - Connect AI Agent main output.

7. **Create Set node to format AI output:**  
   - Type: Set  
   - Assign variables: Urgency, PriorityScore, Summary, goNoGo, Reason, AirtableURL (constructed with record id), TenderRefNo.  
   - Connect output from parser.

8. **Create If node "Check Priority":**  
   - Type: If  
   - Conditions:  
     - Urgency equals "High"  
     - PriorityScore > 70  
     - goNoGo equals "Go"  
   - Connect from Set node.  
   - True output: Slack approval node  
   - False output: Slack fallback message node.

9. **Create Slack node (sendAndWait) for approval:**  
   - Type: Slack  
   - Operation: Send and Wait  
   - Channel: Your Slack channel ID (e.g. "general-information")  
   - Message: Include tender summary, go/no-go decision, reason, priority score, and Airtable review link.  
   - Approval type: Double, labels "Accept" and "Reject".  
   - Credentials: Slack OAuth token.  
   - Connect true output of Check Priority.

10. **Create If node "Check Approved":**  
    - Type: If  
    - Condition: `data.approved` is true  
    - Connect Slack approval output.

11. **Create Airtable node "Update Approved Status":**  
    - Type: Airtable  
    - Operation: Update  
    - Match record by TenderRefNo  
    - Set Status to "Approved".  
    - Credentials: Airtable Personal Access Token.  
    - Connect true output from Check Approved.

12. **Create Gmail node "Send Confirmation Mail":**  
    - Type: Gmail  
    - Recipient: Bid team email address  
    - Subject: Include tender reference number  
    - Body: Summary, priority score, recommendation, Airtable review link, next steps.  
    - Credentials: Gmail OAuth2.  
    - Connect true output from Check Approved.

13. **Create Airtable node "Update Pending Status":**  
    - Type: Airtable  
    - Operation: Update  
    - Match record by TenderRefNo  
    - Set Status to "Approved" (review this logic; may need correction).  
    - Connect false output from Check Approved.

14. **Create Slack node "Send Message" fallback:**  
    - Type: Slack  
    - Operation: Send  
    - Channel: Same as approval channel  
    - Message: "There is No Priority Tender Available."  
    - Credentials: Slack OAuth token.  
    - Connect false output from Check Priority.

15. **Create Error Trigger node:**  
    - Type: Error Trigger  
    - Global error catcher.

16. **Create Slack node "Send Error Alert":**  
    - Type: Slack  
    - Operation: Send  
    - Channel: Error monitoring Slack channel  
    - Message: Includes error node name, message, timestamp.  
    - Credentials: Slack OAuth token.  
    - Connect error trigger output.

17. **Connect all nodes according to the logical flow:**  
    - Schedule Trigger → Fetch Pending Record From Airtable → AI Model, AI Memory, AI Agent → Output Parser → Format Data → Check Priority  
    - Check Priority true → Slack approval → Check Approved  
    - Check Approved true → Update Approved Status + Send Confirmation Mail  
    - Check Approved false → Update Pending Status  
    - Check Priority false → Slack fallback message  
    - Error Trigger → Slack error alert

18. **Test the workflow end-to-end:**  
    - Validate API credentials for Airtable, OpenAI, Slack, Gmail.  
    - Confirm Airtable base and table names are correct.  
    - Adjust Slack channel IDs and email recipients as needed.  
    - Enable workflow and observe scheduled runs.

---

### 5. General Notes & Resources

| Note Content                                                                                   | Context or Link                                                                              |
|-----------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------|
| This workflow uses OpenAI GPT-4 via LangChain nodes to generate structured JSON evaluations.  | Requires OpenAI API key and LangChain nodes installed in n8n.                              |
| Slack approval messages use "sendAndWait" for interactive buttons (Approve/Reject).           | Slack API scopes must allow message posting and interactive components.                    |
| Airtable Personal Access Token must have read/write access to the specified base and tables.  | Review Airtable API limits and pagination if scaling.                                     |
| Gmail OAuth2 credentials are used for sending confirmation emails; ensure token refresh setup. | Protect sensitive credentials; avoid hardcoding emails in shared workflows.                |
| The logic for updating tender status on rejection branch appears to set status to "Approved".  | Review and correct to "Rejected" or maintain "Pending" as per business rules.              |
| Workflow includes error handling that reports errors to Slack for rapid response.              | Slack error alerts can be customized with additional context as needed.                    |
| For security, replace any personal emails or workspace links with placeholders before sharing. | Sticky notes provide setup instructions and contextual info for users and maintainers.    |
| Detailed tender data fields (e.g., TenderRefNo, Opening Date) must be present in Airtable data. | Missing critical data triggers "Review Required" urgency in AI evaluation.                 |
| Slack channel IDs and Airtable base/table IDs are environment-specific and must be configured.| Use environment variables or credentials for easier portability and security.             |

---

**Disclaimer:** This text is derived exclusively from an automated workflow created with n8n, a tool for integration and automation. It strictly respects current content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.