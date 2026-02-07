Automate Vendor Contract Renewals & Reminders with GPT-4.1 mini, Slack, and Gmail

https://n8nworkflows.xyz/workflows/automate-vendor-contract-renewals---reminders-with-gpt-4-1-mini--slack--and-gmail-6935


# Automate Vendor Contract Renewals & Reminders with GPT-4.1 mini, Slack, and Gmail

### 1. Workflow Overview

This workflow automates the management of vendor contract renewals and reminders for finance and procurement teams. It runs daily to identify contracts nearing expiration and handles communication via Slack and email. The workflow supports both automatic renewals, which are simply notified to the finance team, and manual renewals, which require approval before initiating vendor outreach.

Logical blocks:

- **1.1 Daily Trigger**: A scheduler triggers the workflow every day at 6:00 AM.
- **1.2 Contract Data Retrieval and Filtering**: Vendor contracts are fetched from a Google Sheet, then filtered to find those approaching expiration based on the contract end date and notice period.
- **1.3 Renewal Type Branching and Messaging**:
  - **1.3.1 Auto-Renew Contracts**: Compose and send Slack notifications to finance contacts about auto-renewing contracts.
  - **1.3.2 Manual Renewal Contracts**: Use OpenAI GPT-4.1 mini to generate personalized Slack messages, send them to finance contacts, and wait for approval.
- **1.4 Email Vendor on Approval**: Upon approval for manual renewals, generate a formal HTML email and send it to the vendor to initiate the contract extension.
- **1.5 Optional Logging & Extensibility**: While not implemented in this workflow, logging of messages, approvals, and emails can be added.

---

### 2. Block-by-Block Analysis

#### 1.1 Daily Trigger

- **Overview**: This block initializes the workflow once every day at 6:00 AM to ensure timely processing of expiring contracts.
- **Nodes Involved**: 
  - Daily Scheduler
  - Sticky Note1 (comment)
- **Node Details**:
  - **Daily Scheduler**
    - Type: Schedule Trigger
    - Configuration: Cron-like trigger set to run daily at 6:00 AM.
    - Input: None (trigger node)
    - Output: Starts the workflow chain.
    - Edge Cases: Scheduler misconfiguration may cause missed runs.
  - **Sticky Note1**
    - Provides a reminder of the trigger schedule.
  
#### 1.2 Contract Data Retrieval and Filtering

- **Overview**: Fetches the full vendor contract list from a Google Sheet and filters contracts based on their end dates and notice periods to identify those requiring reminders.
- **Nodes Involved**:
  - Get vendor contract list
  - Find expiring vendor(s)
  - Is auto-renew contract? (branch condition)
  - Sticky Note2, Sticky Note15 (comments)
- **Node Details**:
  - **Get vendor contract list**
    - Type: Google Sheets node (read)
    - Configuration: Reads all rows from the specified Google Sheet containing vendor contract data.
    - Key parameters: Sheet ID and Sheet Name (gid=0).
    - Credentials: Google Sheets OAuth2.
    - Input: Trigger from Daily Scheduler.
    - Output: JSON array of contract records.
    - Edge Cases: API failures, permission issues, empty sheets.
  - **Find expiring vendor(s)**
    - Type: Code Node (JavaScript)
    - Role: Filters contracts to those where the current date is between the reminder date (end date minus notice period) and the contract end date.
    - Key Expressions:
      - Calculates reminderDate = Contract End Date - Notice Period (days).
      - Checks if current date is within alert window.
      - Outputs filtered contracts with added fields: remind (bool), reminderDate (ISO string), daysUntilExpiry (integer).
    - Input: Contract list JSON.
    - Output: Filtered contracts JSON.
    - Edge Cases: Invalid date formats, missing notice period, timezone issues.
  - **Is auto-renew contract?**
    - Type: If Node
    - Role: Branches workflow based on whether the contract's “Renewal Type” field equals “Auto-Renew”.
    - Input: Filtered contracts.
    - Output: Two paths — auto-renew true or false.
    - Edge Cases: Case sensitivity or missing Renewal Type field.
  - **Sticky Notes** provide descriptive context for this block.
  
#### 1.3 Renewal Type Branching and Messaging

##### 1.3.1 Auto-Renew Contracts Notification

- **Overview**: For contracts with auto-renewal, this block composes a Slack message summarizing the contract status and notifies the finance team.
- **Nodes Involved**:
  - Compose slack message
  - Notify auto-renew contract to finance (Slack send)
  - Sticky Note5 (comment)
- **Node Details**:
  - **Compose slack message**
    - Type: Code Node (JavaScript)
    - Purpose: Constructs a detailed Slack message covering vendor name, service type, renewal date, contract value, notes, and contact info.
    - Key Expressions: Uses contract fields and computes message text with formatting.
    - Input: Auto-renew contract JSON.
    - Output: JSON containing Slack message text and target Slack ID.
    - Edge Cases: Missing Slack ID or contact info may cause failure to deliver.
  - **Notify auto-renew contract to finance**
    - Type: Slack node
    - Operation: Sends message to specified Slack channel using OAuth2 authentication.
    - Input: Message text and Slack channel ID.
    - Output: None (fire and forget).
    - Edge Cases: Slack API rate limits, authentication failures.
  - **Sticky Note5** describes this block’s purpose.
  
##### 1.3.2 Manual Renewal Contracts Handling

- **Overview**: For manual renewal contracts, this block uses OpenAI to generate a personalized Slack reminder message, sends it to the finance team, and waits up to 8 hours for approval before proceeding.
- **Nodes Involved**:
  - OpenAI Chat Model
  - Structured Output Parser
  - Vendor reminder agent (LangChain)
  - Remind Finance Contact & Waiting For Approval (Slack sendAndWait)
  - Sticky Note6 (comment)
- **Node Details**:
  - **OpenAI Chat Model**
    - Type: LangChain OpenAI Chat node
    - Model: GPT-4.1 mini
    - Role: Generates preliminary AI response (this node’s output feeds into a structured output parser).
    - Credentials: OpenAI API key.
    - Input: Contract data.
    - Output: AI-generated text.
    - Edge Cases: API quota limits, network timeouts, malformed prompts.
  - **Structured Output Parser**
    - Type: LangChain output parser
    - Role: Parses AI output into structured JSON including subject and body fields.
    - Input: Raw AI chat output.
    - Output: Parsed JSON with message components.
  - **Vendor reminder agent**
    - Type: LangChain Chain LLM node
    - Role: Uses contract info to draft a professional email reminder for finance contacts.
    - Prompt: Includes instructions to generate subject and body with contract context.
    - Output Parser: Enabled to produce structured output.
  - **Remind Finance Contact & Waiting For Approval**
    - Type: Slack node (sendAndWait)
    - Role: Sends the generated message to a Slack channel and waits for finance contact approval (timeout set to 8 hours).
    - Input: Parsed message subject and body.
    - Output: Triggers next step on approval.
    - Edge Cases: Timeout without approval, Slack API errors.
  - **Sticky Note6** explains this sub-block.
  
#### 1.4 Email Vendor on Approval

- **Overview**: After receiving approval for manual renewals, this block composes a formal HTML email and sends it to the vendor to initiate the contract extension.
- **Nodes Involved**:
  - Compose email template (Code node)
  - Send manual extend contract email (Email node)
  - Sticky Note8 (comment)
- **Node Details**:
  - **Compose email template**
    - Type: Code Node (JavaScript)
    - Role: Generates a branded, HTML email body with vendor and contract details, addressed formally.
    - Key Expressions: Constructs subject and HTML message using contract and finance contact data.
    - Input: Approved contract data from Slack node output.
    - Output: JSON object with `to`, `subject`, and `html` fields.
    - Edge Cases: Missing email addresses, invalid HTML formatting.
  - **Send manual extend contract email**
    - Type: Email Send node
    - Service: SMTP or Gmail configured
    - Role: Sends the composed email to the vendor.
    - Input: Email fields from previous node.
    - Credentials: SMTP account.
    - Edge Cases: SMTP server errors, invalid recipient email.
  - **Sticky Note8** describes the purpose of this block.
  
#### 1.5 Optional Logging & Extensibility

- **Overview**: The workflow includes suggestions for optional logging or extensions such as contract PDF preview, GPT summaries, or task creation but does not implement these.
- **Nodes Involved**: None (optional future work)
- **Notes**: Refer to Sticky Note7 for detailed context and setup instructions.

---

### 3. Summary Table

| Node Name                             | Node Type                   | Functional Role                                    | Input Node(s)                  | Output Node(s)                      | Sticky Note                                  |
|-------------------------------------|-----------------------------|--------------------------------------------------|-------------------------------|-----------------------------------|----------------------------------------------|
| Daily Scheduler                     | Schedule Trigger            | Triggers workflow daily at 6:00 AM                | None                          | Get vendor contract list           | ## 1. Workflow trigger on daily basis every 6AM |
| Get vendor contract list            | Google Sheets               | Fetches vendor contract data                       | Daily Scheduler               | Find expiring vendor(s)            | ## 2. Get vendor contract list & find expiring contract |
| Find expiring vendor(s)             | Code Node                  | Filters contracts by expiry and notice period     | Get vendor contract list      | Is auto-renew contract?            |                                              |
| Is auto-renew contract?             | If Node                    | Branches contracts into auto-renew or manual      | Find expiring vendor(s)       | Compose slack message; Vendor reminder agent |                                              |
| Compose slack message               | Code Node                  | Composes Slack message for auto-renew contracts   | Is auto-renew contract?       | Notify auto-renew contract to finance | ## 3.1 Notify finance team about auto-renew contract |
| Notify auto-renew contract to finance | Slack                     | Sends Slack notification for auto-renew contracts | Compose slack message         | None                             |                                              |
| Vendor reminder agent               | LangChain Chain LLM        | Generates personalized Slack message for manual renewals | Is auto-renew contract?       | Remind Finance Contact & Waiting For Approval | ## 3.2 Send manual contract extension notice to finance team |
| OpenAI Chat Model                  | LangChain LLM Chat         | Initial AI chat generation (feeds Vendor reminder agent) |                               | Vendor reminder agent             |                                              |
| Structured Output Parser            | LangChain Output Parser    | Parses AI output into structured JSON             | OpenAI Chat Model             | Vendor reminder agent             |                                              |
| Remind Finance Contact & Waiting For Approval | Slack (sendAndWait)        | Sends Slack message and waits for approval        | Vendor reminder agent         | Compose email template            |                                              |
| Compose email template              | Code Node                  | Creates formal HTML email for vendor               | Remind Finance Contact & Waiting For Approval | Send manual extend contract email | ## 4. Send email to vendor to initiate the contract extend process |
| Send manual extend contract email  | Email Send                 | Sends email to vendor to initiate renewal          | Compose email template        | None                             |                                              |
| Sticky Note1                       | Sticky Note                | Comments on daily trigger                           | None                         | None                             | ## 1. Workflow trigger on daily basis every 6AM |
| Sticky Note2                       | Sticky Note                | Comments on contract data retrieval                 | None                         | None                             | ## 2. Get vendor contract list & find expiring contract |
| Sticky Note3                       | Sticky Note                | Screenshot image (visual aid)                      | None                         | None                             |                                              |
| Sticky Note4                       | Sticky Note                | Screenshot image (visual aid)                      | None                         | None                             |                                              |
| Sticky Note5                       | Sticky Note                | Comments on auto-renew notification                 | None                         | None                             | ## 3.1 Notify finance team about auto-renew contract |
| Sticky Note6                       | Sticky Note                | Comments on manual renewal notification             | None                         | None                             | ## 3.2 Send manual contract extension notice to finance team |
| Sticky Note7                       | Sticky Note                | Workflow overview, use cases, setup instructions   | None                         | None                             | Full workflow description and setup instructions |
| Sticky Note8                       | Sticky Note                | Comments on email sending to vendor                 | None                         | None                             | ## 4. Send email to vendor to initiate the contract extend process |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Daily Scheduler Node**
   - Type: Schedule Trigger
   - Set to trigger every day at 6:00 AM.
   - No credentials required.

2. **Create Google Sheets Node: Get vendor contract list**
   - Type: Google Sheets
   - Operation: Read rows from Sheet.
   - Configure with Google Sheets OAuth2 credentials.
   - Enter Document ID (Google Sheet ID with vendor contracts).
   - Set Sheet Name or GID (e.g., gid=0).
   - Connect Daily Scheduler node output to this node.

3. **Create Code Node: Find expiring vendor(s)**
   - Type: Code
   - Paste JavaScript code to:
     - For each contract, parse “Contract End Date” and “Notice Period (days)”.
     - Calculate reminder date = End Date - Notice Period.
     - Filter contracts where today is between reminder date and end date.
     - Append `remind: true`, `reminderDate`, and `daysUntilExpiry`.
   - Connect output of Google Sheets node here.

4. **Create If Node: Is auto-renew contract?**
   - Type: If
   - Condition: `Renewal Type` equals `Auto-Renew` (case-sensitive string).
   - Connect output of code node.

5. **Create Code Node: Compose slack message** (Auto-Renew path)
   - Type: Code
   - Compose a Slack message string with contract details (vendor, service, contract end date, value, notes).
   - Outputs JSON with `slack_message` and `slack_target` (Slack ID).
   - Connect “true” output of If node.

6. **Create Slack Node: Notify auto-renew contract to finance**
   - Type: Slack
   - Authentication: OAuth2 with Slack API credentials.
   - Operation: Send message to channel.
   - Configure channel ID for finance notifications.
   - Message text: Use `slack_message` from previous node.
   - Connect output of Compose slack message node.

7. **Create LangChain OpenAI Chat Node: OpenAI Chat Model** (Manual renewal path)
   - Type: LangChain OpenAI Chat
   - Model: GPT-4.1 mini
   - Credentials: OpenAI API key.
   - Input: Contract JSON.
   - Connect “false” output of If node.

8. **Create LangChain Output Parser Node: Structured Output Parser**
   - Type: LangChain structured output parser
   - Define JSON schema with fields: subject, body, original_json.
   - Connect output of OpenAI Chat Model node.

9. **Create LangChain Chain LLM Node: Vendor reminder agent**
   - Type: LangChain Chain LLM
   - Prompt: Instruct to draft professional email reminder for finance contact.
   - Input: Uses structured output parser data.
   - Enable output parser.
   - Connect output of Structured Output Parser node.

10. **Create Slack Node: Remind Finance Contact & Waiting For Approval**
    - Type: Slack
    - Authentication: OAuth2 with Slack API.
    - Operation: SendAndWait (message with approval wait).
    - Configure channel ID for finance contact.
    - Message text: Combine subject and body from vendor reminder agent output.
    - Set wait timeout to 8 hours (configurable).
    - Connect output of Vendor reminder agent.

11. **Create Code Node: Compose email template**
    - Type: Code
    - Parse JSON from Slack approval message.
    - Compose HTML email with vendor and contract details, finance contact signature.
    - Output JSON: to (vendor email), subject, html body.
    - Connect output of Slack approval wait node.

12. **Create Email Send Node: Send manual extend contract email**
    - Type: Email Send
    - Credentials: SMTP or Gmail account.
    - Use inputs from email template node: To, Subject, HTML body.
    - Connect output of Compose email template node.

13. **Add Sticky Notes at appropriate positions** to provide contextual comments and workflow documentation referencing the detailed content above.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Context or Link                                                                                                                                                                                                                                                     |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| This workflow automates contract renewal reminders combining Slack, Gmail, and OpenAI GPT-4.1 mini to streamline vendor contract management for finance teams. It is designed for daily operation at 6AM and supports both auto-renew and manual renewal contract flows with approval.                                                                                                                                                                                                                              | Full workflow description and setup guidance located in Sticky Note7 within the workflow JSON.                                                                                                                                                                   |
| Sample Google Sheet template with required columns: Vendor Name, Vendor Email, Service Type, Contract Start Date, Contract End Date, Notice Period (days), Renewal Type, Finance Contact, Contact Email, Slack ID, Contract Value, Notes. Sample link: https://docs.google.com/spreadsheets/d/1zdDgKyL0sY54By57Yz4dNokQC_oIbVxcCKeWJ6PADBM/edit?usp=sharing                                                                                                                                    | Google Sheets setup for vendor contract data input.                                                                                                                                                                                                                |
| Slack API OAuth2 authentication is required for sending messages and waiting for approval. Ensure the Slack app has permissions for chat:write and channels:read.                                                                                                                                                                                                                                                                                                                                                          | Slack API permissions and OAuth2 setup.                                                                                                                                                                                                                            |
| OpenAI GPT-4.1 mini is used for generating personalized manual renewal reminders. Ensure OpenAI API keys are valid and have sufficient quota.                                                                                                                                                                                                                                                                                                                                                                             | OpenAI API usage and quota.                                                                                                                                                                                                                                        |
| Email sending requires SMTP or Gmail OAuth2 credentials configured in n8n. Use verified sender email addresses.                                                                                                                                                                                                                                                                                                                                                                                                              | Email credential setup for transactional emails.                                                                                                                                                                                                                   |
| The approval wait on Slack uses sendAndWait operation; if timeout occurs without approval, subsequent email sending will not trigger. Adjust timeout as needed.                                                                                                                                                                                                                                                                                                                                                              | Slack sendAndWait node behavior and timeout configuration.                                                                                                                                                                                                        |
| Potential extensions include logging all notifications and approvals to Google Sheets or databases, adding PDF contract previews, GPT-based contract summaries, or creating Jira tickets for contract reviews.                                                                                                                                                                                                                                                                                                               | Future workflow enhancements described in Sticky Note7.                                                                                                                                                                                                          |

---

**Disclaimer:**  
The text provided is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.