Automate Instagram Complaint Handling with Claude AI, Tickets & SLA Management

https://n8nworkflows.xyz/workflows/automate-instagram-complaint-handling-with-claude-ai--tickets---sla-management-10324


# Automate Instagram Complaint Handling with Claude AI, Tickets & SLA Management

---

### 1. Workflow Overview

This workflow automates the handling of customer complaints posted as Instagram comments by leveraging Claude AI for complaint detection and severity classification, then managing support tickets with Google Sheets and SLA (Service Level Agreement) monitoring. It is designed for customer support teams needing automated ticket creation, assignment, and escalation based on Instagram feedback to ensure timely resolution.

Logical blocks include:

- **1.1 Input Reception & Scheduling:** Receives new Instagram posts/comments either on schedule or via webhook.
- **1.2 Instagram Data Retrieval:** Fetches latest posts and associated comments.
- **1.3 Comment Processing & AI Classification:** Processes comments individually, uses Claude AI to detect complaints and extract issue details.
- **1.4 Complaint Branching:** Routes comments based on AI classification—proceeds with complaint handling or terminates for non-complaints.
- **1.5 Ticket Management:** Creates tickets in Google Sheets, assigns team members, and notifies assignees via Slack.
- **1.6 SLA Monitoring & Escalation:** Waits for SLA check, verifies ticket status, and escalates unresolved or near-breach tickets to managers via Slack.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Scheduling

- **Overview:** Triggers workflow execution either every 15 minutes or via an incoming webhook endpoint.
- **Nodes Involved:** `Schedule Trigger`, `Webhook`
- **Node Details:**

  - **Schedule Trigger**
    - Type: Cron Trigger
    - Configuration: Default schedule (runs every 15 minutes)
    - Input: None (time-based trigger)
    - Output: Triggers `Get Instagram Posts`
    - Edge cases: Cron failures unlikely but check workflow activation.
  
  - **Webhook**
    - Type: Webhook Trigger
    - Configuration: Path `/91c34f5b-2ba6-4151-8ce0-5bc776a1f429`
    - Input: External HTTP requests to this path
    - Output: Triggers `Get Instagram Posts`
    - Edge cases: Unauthorized requests; no auth configured here (recommend securing webhook)
  
- **Sticky Note:** "Runs every 15 minutes or via webhook (/complaint-handler)"

---

#### 2.2 Instagram Data Retrieval

- **Overview:** Fetches the latest media posts from the Instagram business account and then retrieves comments from the most recent post.
- **Nodes Involved:** `Get Instagram Posts`, `Get Comments`
- **Node Details:**

  - **Get Instagram Posts**
    - Type: HTTP Request
    - Configuration:
      - URL: Instagram Graph API endpoint for media items with Instagram Business Account ID and Access Token.
      - Method: GET
      - No authentication configured in node; access token passed in URL query string.
    - Input: Trigger from `Schedule Trigger` or `Webhook`
    - Output: JSON array of posts to `Get Comments`
    - Edge cases: API rate limits, expired/invalid access tokens, empty post data.
  
  - **Get Comments**
    - Type: HTTP Request
    - Configuration:
      - URL: Dynamically constructed to fetch comments of the first post (`data[0].id`).
      - Method: GET
      - Uses HTTP Header Authentication credentials (likely for token)
    - Input: Output from `Get Instagram Posts`
    - Output: Comments array to `Loop Over Comments`
    - Edge cases: Missing post ID, API errors, no comments available.
  
- **Sticky Notes:**
  - "Fetches recent posts from Instagram Graph API"
  - "Retrieves comments for the latest post"

---

#### 2.3 Comment Processing & AI Classification

- **Overview:** Processes each comment individually to avoid rate limits; extracts original text and username; uses Claude AI to classify if the comment is a complaint and to extract issue type and severity.
- **Nodes Involved:** `Loop Over Comments`, `Capture Original Comment`, `Detect Complaint (Claude AI)`
- **Node Details:**

  - **Loop Over Comments**
    - Type: Split In Batches
    - Configuration: Batch size of 1 (process comments one at a time)
    - Input: Comments from `Get Comments`
    - Output: Individual comment JSON to `Capture Original Comment`
    - Edge cases: Large comment volumes could slow workflow.
  
  - **Capture Original Comment**
    - Type: Set
    - Configuration: Sets two string fields:
      - `original_text`: comment text from current JSON
      - `original_username`: comment username
    - Input: Single comment from `Loop Over Comments`
    - Output: Enriched JSON to `Detect Complaint (Claude AI)`
  
  - **Detect Complaint (Claude AI)**
    - Type: HTTP Request
    - Configuration:
      - URL: Anthropic Claude API endpoint (`https://api.anthropic.com/v1/messages`)
      - Method: POST
      - Body: JSON with model `claude-3-5-sonnet-20241022`, max tokens 1024.
      - Messages: Sends prompt to classify comment as complaint yes/no, extract issue type and severity.
      - Uses expression to insert `original_text` into prompt.
    - Input: Comment with captured text
    - Output: AI response JSON to `IF Complaint`
    - Edge cases: API rate limits, invalid tokens, malformed AI responses, timeout.
  
- **Sticky Notes:**
  - "Processes each comment individually to avoid rate limits"
  - "Uses AI to classify if complaint, extract issue/severity"

---

#### 2.4 Complaint Branching

- **Overview:** Based on AI classification, routes workflow to either process complaint further or terminate for non-complaints.
- **Nodes Involved:** `IF Complaint`, `Get Team Members`, `End (Non-Complaint Path)`
- **Node Details:**

  - **IF Complaint**
    - Type: If (Conditional)
    - Configuration:
      - Checks if AI response text field contains `is_complaint: yes` (case-insensitive)
      - Expression parses AI output from the first message text.
    - Input: AI response from `Detect Complaint (Claude AI)`
    - Output (True): `Get Team Members` — proceed to ticket creation
    - Output (False): `End (Non-Complaint Path)` — terminates branch
    - Edge cases: Parsing failure if AI response format changes.
  
  - **Get Team Members**
    - Type: Google Sheets
    - Configuration:
      - Reads team roster from a Google Sheet (`your-team-members-sheet-id!A:B`)
      - Operation: Read rows (default)
    - Input: True branch from `IF Complaint`
    - Output: Team members JSON to `Assign Ticket`
    - Edge cases: Sheet access errors, empty team list.
  
  - **End (Non-Complaint Path)**
    - Type: Set
    - Configuration: Clears data (keepOnlySet: true)
    - Input: False branch from `IF Complaint`
    - Output: Ends workflow branch
    - Edge cases: None
  
- **Sticky Notes:**
  - "Branches: Proceed if yes, end if no"
  - "Loads team roster from TeamMembers sheet or Terminates non-complaint branches"

---

#### 2.5 Ticket Management

- **Overview:** Assigns tickets randomly to team members, appends ticket details to Google Sheets, and notifies assigned member on Slack.
- **Nodes Involved:** `Assign Ticket`, `Create Ticket (Google Sheet)`, `Notify Assignee (Slack)`, `Wait for SLA Check`
- **Node Details:**

  - **Assign Ticket**
    - Type: Set
    - Configuration:
      - Assigns `assignedTo` field by randomly selecting one team member email from the team roster input.
      - Uses JavaScript expression to pick randomly.
    - Input: Team members from `Get Team Members`
    - Output: Enriched JSON to `Create Ticket (Google Sheet)`
    - Edge cases: Empty team list causes failure or empty assignment.
  
  - **Create Ticket (Google Sheet)**
    - Type: Google Sheets
    - Configuration:
      - Appends new row with ticket details to support tickets sheet (`your-support-tickets-sheet-id!A:Z`)
      - Operation: Append row
      - Fields: Includes `ticketId`, `issueType`, `assignedTo`, SLA due date, etc. (assumed from input)
    - Input: Assigned ticket data from `Assign Ticket`
    - Output: Created ticket JSON to `Notify Assignee (Slack)` and `Wait for SLA Check`
    - Edge cases: Sheet access issues, duplicate ticket IDs.
  
  - **Notify Assignee (Slack)**
    - Type: Slack
    - Configuration:
      - Sends message to configured Slack channel with new ticket details, including ticket ID, issue type, assignee, and SLA due.
      - Channel: `"your-slack-channel"`
    - Input: Created ticket info from `Create Ticket (Google Sheet)`
    - Output: None (end of branch for notification)
    - Edge cases: Slack API failures, invalid channel.
  
  - **Wait for SLA Check**
    - Type: Wait
    - Configuration:
      - Wait node configured with webhook ID (used to delay workflow until SLA check trigger)
      - Presumably set to wait until SLA due date approaches
    - Input: Created ticket data from `Create Ticket (Google Sheet)`
    - Output: To `Check Ticket Status`
    - Edge cases: Wait node timeout or misconfiguration.
  
- **Sticky Notes:**
  - "Sets assignee via round-robin logic"
  - "Appends new ticket with details and SLA due date"
  - "Alerts assigned team member"
  - "Delays to near-SLA-breach point (e.g., 20 hours)"

---

#### 2.6 SLA Monitoring & Escalation

- **Overview:** Checks ticket status near SLA breach; if unresolved, escalates to manager via Slack notification.
- **Nodes Involved:** `Check Ticket Status`, `IF SLA Breach Near`, `Escalate to Manager (Slack)`
- **Node Details:**

  - **Check Ticket Status**
    - Type: Google Sheets Lookup
    - Configuration:
      - Looks up ticket by `ticketId` in support tickets sheet (`your-support-tickets-sheet-id!A:Z`)
      - Operation: Lookup row based on `ticketId` from previous `Create Ticket`
    - Input: SLA check trigger from `Wait for SLA Check`
    - Output: Ticket status data to `IF SLA Breach Near`
    - Edge cases: Missing ticket, sheet access failure.
  
  - **IF SLA Breach Near**
    - Type: If (Conditional)
    - Configuration:
      - Checks if ticket `status` is not equal to "Resolved"
      - If not resolved, triggers escalation
    - Input: Ticket status from `Check Ticket Status`
    - Output (True): `Escalate to Manager (Slack)`
    - Output (False): Ends branch silently
    - Edge cases: Status field missing or misformatted.
  
  - **Escalate to Manager (Slack)**
    - Type: Slack
    - Configuration:
      - Sends alert message to manager Slack channel
      - Message includes ticket ID, issue type, assignee, and escalation note
      - Channel: `"manager-slack-channel"`
    - Input: True branch from `IF SLA Breach Near`
    - Output: None
    - Edge cases: Slack API failures, invalid channel.
  
- **Sticky Notes:**
  - "Looks up ticket status in sheet"
  - "Checks if unresolved; escalates if yes"
  - "Notifies manager for urgent action"

---

### 3. Summary Table

| Node Name               | Node Type          | Functional Role                                  | Input Node(s)                   | Output Node(s)                         | Sticky Note                                                                                  |
|-------------------------|--------------------|-------------------------------------------------|--------------------------------|--------------------------------------|----------------------------------------------------------------------------------------------|
| Schedule Trigger         | Cron Trigger       | Periodic workflow start                          | None                           | Get Instagram Posts                   | Runs every 15 minutes or via webhook (/complaint-handler)                                   |
| Webhook                 | Webhook Trigger    | External HTTP trigger                            | None                           | Get Instagram Posts                   | Runs every 15 minutes or via webhook (/complaint-handler)                                   |
| Get Instagram Posts      | HTTP Request       | Fetch latest Instagram business account posts   | Schedule Trigger, Webhook      | Get Comments                         | Fetches recent posts from Instagram Graph API                                               |
| Get Comments             | HTTP Request       | Fetch comments for latest post                   | Get Instagram Posts            | Loop Over Comments                   | Retrieves comments for the latest post                                                     |
| Loop Over Comments       | Split In Batches   | Process comments individually                     | Get Comments                  | Capture Original Comment             | Processes each comment individually to avoid rate limits                                   |
| Capture Original Comment | Set                | Extract comment text and username                 | Loop Over Comments             | Detect Complaint (Claude AI)         | Uses AI to classify if complaint, extract issue/severity                                   |
| Detect Complaint (Claude AI) | HTTP Request   | Call Claude AI to classify complaint and extract details | Capture Original Comment       | IF Complaint                       | Uses AI to classify if complaint, extract issue/severity                                   |
| IF Complaint             | If                 | Branch based on AI classification                 | Detect Complaint (Claude AI)   | Get Team Members, End (Non-Complaint Path) | Branches: Proceed if yes, end if no                                                        |
| Get Team Members         | Google Sheets      | Load support team roster                           | IF Complaint (True branch)     | Assign Ticket                      | Loads team roster from TeamMembers sheet or Terminates non-complaint branches               |
| Assign Ticket            | Set                | Assign ticket randomly to team member             | Get Team Members               | Create Ticket (Google Sheet)        | Sets assignee via round-robin logic                                                       |
| Create Ticket (Google Sheet) | Google Sheets  | Append new ticket details                           | Assign Ticket                  | Notify Assignee (Slack), Wait for SLA Check | Appends new ticket with details and SLA due date                                           |
| Notify Assignee (Slack)  | Slack              | Notify assigned team member of new ticket         | Create Ticket (Google Sheet)   | None                             | Alerts assigned team member                                                              |
| Wait for SLA Check       | Wait               | Delay until SLA check time                          | Create Ticket (Google Sheet)   | Check Ticket Status                | Delays to near-SLA-breach point (e.g., 20 hours)                                          |
| Check Ticket Status      | Google Sheets      | Lookup ticket status                                | Wait for SLA Check             | IF SLA Breach Near                 | Looks up ticket status in sheet                                                          |
| IF SLA Breach Near       | If                 | Check if ticket unresolved near SLA breach         | Check Ticket Status            | Escalate to Manager (Slack)        | Checks if unresolved; escalates if yes                                                   |
| Escalate to Manager (Slack) | Slack           | Notify manager for urgent action                    | IF SLA Breach Near (True)      | None                             | Notifies manager for urgent action                                                       |
| End (Non-Complaint Path) | Set                | End branch for non-complaints                       | IF Complaint (False)           | None                             | Loads team roster from TeamMembers sheet or Terminates non-complaint branches             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes:**
   - Add a **Cron Trigger** node named `Schedule Trigger`.
     - Set to run every 15 minutes (default).
   - Add a **Webhook** node named `Webhook`.
     - Set path to `91c34f5b-2ba6-4151-8ce0-5bc776a1f429`.
     - No authentication configured (recommend adding for security).

2. **Connect both trigger nodes to a new HTTP Request node `Get Instagram Posts`:**
   - Set method to GET.
   - URL: `https://graph.facebook.com/v12.0/YOUR_INSTAGRAM_BUSINESS_ACCOUNT_ID/media?access_token=YOUR_INSTAGRAM_ACCESS_TOKEN`
   - Replace `YOUR_INSTAGRAM_BUSINESS_ACCOUNT_ID` and `YOUR_INSTAGRAM_ACCESS_TOKEN` with actual values.
   - No additional authentication.
  
3. **Add HTTP Request node `Get Comments`:**
   - Method: GET
   - URL: Use expression:  
     `https://graph.facebook.com/v12.0/{{$node["Get Instagram Posts"].json["data"][0]["id"]}}/comments?access_token=YOUR_INSTAGRAM_ACCESS_TOKEN`
   - Use HTTP Header Auth credentials with Instagram Access Token.
   - Connect output of `Get Instagram Posts` to `Get Comments`.

4. **Add Split In Batches node `Loop Over Comments`:**
   - Batch size: 1.
   - Connect output of `Get Comments` to this node.

5. **Add Set node `Capture Original Comment`:**
   - Set two string fields:
     - `original_text` = `={{ $json["text"] }}`
     - `original_username` = `={{ $json["username"] }}`
   - Connect `Loop Over Comments` output here.

6. **Add HTTP Request node `Detect Complaint (Claude AI)`:**
   - Method: POST
   - URL: `https://api.anthropic.com/v1/messages`
   - Body (JSON Parameters enabled):  
     ```json
     {
       "model": "claude-3-5-sonnet-20241022",
       "max_tokens": 1024,
       "messages": [
         {
           "role": "user",
           "content": "Classify this Instagram comment as a complaint (yes/no). If yes, extract issue type (e.g., product issue, service delay) and severity (low/medium/high). Output in format: is_complaint: yes/no, issue_type: X, severity: Y. Comment: {{$json[\"original_text\"]}}"
         }
       ]
     }
     ```
   - Connect output of `Capture Original Comment` here.
   - Set API authentication and headers as per Anthropic Claude API requirements.

7. **Add If node `IF Complaint`:**
   - Condition:  
     - String condition comparing:  
       `={{ $json["content"][0]["text"].toLowerCase().split(',')[0].split(':')[1].trim() }}` equals `yes`
   - Connect output from `Detect Complaint (Claude AI)` here.
   - True output: proceed to next nodes.
   - False output: terminate branch.

8. **Add Google Sheets node `Get Team Members`:**
   - Operation: Read rows.
   - Sheet ID: `your-team-members-sheet-id!A:B`
   - Connect from True output of `IF Complaint`.

9. **Add Set node `Assign Ticket`:**
   - Set string field `assignedTo` with expression:  
     `={{ $input.all()[Math.floor(Math.random() * $input.all().length)].email }}`
   - Connect from `Get Team Members`.

10. **Add Google Sheets node `Create Ticket (Google Sheet)`:**
    - Operation: Append row.
    - Sheet ID: `your-support-tickets-sheet-id!A:Z`
    - Configure fields to include ticket details such as `ticketId`, `issueType`, `assignedTo`, and SLA due date.
    - Connect from `Assign Ticket`.

11. **Add Slack node `Notify Assignee (Slack)`:**
    - Channel: `your-slack-channel`
    - Message text:  
      ```
      New Complaint Ticket: {{$node["Create Ticket (Google Sheet)"].json["ticketId"]}}
      Issue: {{$node["Create Ticket (Google Sheet)"].json["issueType"]}}
      Assigned to: {{$node["Assign Ticket"].json["assignedTo"]}}
      SLA Due: {{$node["Create Ticket (Google Sheet)"].json["slaDue"]}}
      ```
    - Connect from `Create Ticket (Google Sheet)`.

12. **Add Wait node `Wait for SLA Check`:**
    - Configure with webhook ID for external triggering when SLA check is due.
    - Connect from `Create Ticket (Google Sheet)` parallel to `Notify Assignee`.

13. **Add Google Sheets node `Check Ticket Status`:**
    - Operation: Lookup row.
    - Sheet ID: `your-support-tickets-sheet-id!A:Z`
    - Lookup column: `ticketId`
    - Lookup value: `={{ $node["Create Ticket (Google Sheet)"].json["ticketId"] }}`
    - Connect from `Wait for SLA Check`.

14. **Add If node `IF SLA Breach Near`:**
    - Condition: `status` field not equal to `Resolved`.
    - Connect from `Check Ticket Status`.

15. **Add Slack node `Escalate to Manager (Slack)`:**
    - Channel: `manager-slack-channel`
    - Message text:  
      ```
      SLA Breach Alert! Ticket {{$node["Check Ticket Status"].json["ticketId"]}} is nearing breach.
      Issue: {{$node["Check Ticket Status"].json["issueType"]}}
      Assigned: {{$node["Check Ticket Status"].json["assignedTo"]}}
      Escalating...
      ```
    - Connect from True output of `IF SLA Breach Near`.

16. **Add Set node `End (Non-Complaint Path)`:**
    - Keep only set (empty) to terminate non-complaint branch.
    - Connect from False output of `IF Complaint`.

17. **Credentials Setup:**
    - Configure Google API credentials with access to required Google Sheets.
    - Configure Slack API credentials with proper OAuth tokens.
    - Configure HTTP Header Authentication for Instagram API.
    - Configure API credentials for Anthropic Claude AI.

18. **Test Workflow:**
    - Validate triggers.
    - Test Instagram API connectivity.
    - Test AI classification accuracy.
    - Test Google Sheets read/write.
    - Test Slack notifications.
    - Test SLA wait and escalation flow.

---

### 5. General Notes & Resources

| Note Content                                                                                                   | Context or Link                                     |
|---------------------------------------------------------------------------------------------------------------|----------------------------------------------------|
| The workflow processes batches of comments one at a time to avoid Instagram API rate limits and ensure reliability. | Sticky Note at `Loop Over Comments`                |
| SLA wait node uses webhook ID to allow external SLA check triggering; configure accordingly in production.     | Wait node configuration                             |
| Slack notifications are split between assignees and managers to ensure proper escalation and awareness.        | Slack nodes in Ticket Management and Escalation    |
| OpenAI Claude model used: `claude-3-5-sonnet-20241022`; update as needed for API changes or improvements.      | Detect Complaint node prompt                        |
| Secure the webhook endpoint to prevent unauthorized access and excessive calls.                                | Webhook node configuration                          |
| Google Sheets used as lightweight ticketing and team roster system; ensure sheets are properly shared and structured. | Google Sheets nodes and configuration               |

---

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

---