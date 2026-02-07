Automate Meeting Scheduling through Telegram with Google Calendar & Notion CRM

https://n8nworkflows.xyz/workflows/automate-meeting-scheduling-through-telegram-with-google-calendar---notion-crm-8593


# Automate Meeting Scheduling through Telegram with Google Calendar & Notion CRM

### 1. Workflow Overview

This workflow automates client nurture email sequences and collects testimonials from Notion data, integrating with Telegram for notifications. It is designed for businesses or consultants who manage client relationships via Notion and want to automate outreach and testimonial gathering efficiently.

The workflow includes the following logical blocks:

- **1.1 Triggering Block**: Initiates the workflow manually or automatically on a daily schedule.
- **1.2 Date and Notion Query Block**: Obtains the current date, queries Notion for relevant client data, and calculates days elapsed since client engagement.
- **1.3 Conditional Email Sending Block**: Based on the days calculated (7, 30, or 60), sends tailored nurture emails.
- **1.4 Telegram Notification Block**: Sends Telegram messages notifying about emails sent.
- **1.5 Testimonial Collection Block**: Receives testimonial submissions via webhook, parses them, sends Telegram notifications, and responds to the webhook.

---

### 2. Block-by-Block Analysis

#### 2.1 Triggering Block

- **Overview:**  
  Starts the workflow either manually triggered by the user or automatically on a daily schedule to automate client nurturing.

- **Nodes Involved:**  
  - Manual Trigger  
  - Schedule Daily  
  - Settings

- **Node Details:**

  - **Manual Trigger**  
    - Type: Trigger node, manual start of the workflow.  
    - Configuration: No parameters; simply triggers the flow on user command.  
    - Input: None.  
    - Output: Connects to Settings node.  
    - Edge Cases: None typical; manual initiation.

  - **Schedule Daily**  
    - Type: Trigger node, executes workflow once daily on a schedule.  
    - Configuration: Default daily schedule parameters.  
    - Input: None.  
    - Output: Connects to Settings node.  
    - Edge Cases: Scheduler misconfiguration or downtime may delay runs.

  - **Settings**  
    - Type: Set node, prepares or resets any workflow parameters before proceeding.  
    - Configuration: No parameters set here, possibly a placeholder for future expansions or environment variables.  
    - Input: From Manual Trigger or Schedule Daily.  
    - Output: Connects to Get Today Date node.  
    - Edge Cases: None.

#### 2.2 Date and Notion Query Block

- **Overview:**  
  Retrieves the current date, queries the Notion database for client data, then computes the number of days elapsed since the clients’ initial engagement for conditional logic.

- **Nodes Involved:**  
  - Get Today Date  
  - Query Notion  
  - Calculate Days

- **Node Details:**

  - **Get Today Date**  
    - Type: Code node (JavaScript), calculates today’s date.  
    - Configuration: Executes a code snippet to generate the current date in expected format.  
    - Expressions: Likely uses JavaScript `new Date()` and formatting.  
    - Input: From Settings.  
    - Output: To Query Notion.  
    - Edge Cases: Time zone issues may affect date correctness.

  - **Query Notion**  
    - Type: HTTP Request node, queries Notion database via API.  
    - Configuration: Uses Notion API credentials; configured to fetch client records relevant to nurturing.  
    - Expressions: May include dynamic date filters or pagination logic.  
    - Input: From Get Today Date.  
    - Output: To Calculate Days.  
    - Edge Cases: API rate limits, authorization failure, network errors.

  - **Calculate Days**  
    - Type: Code node (JavaScript), computes days difference between today's date and client engagement date from Notion data.  
    - Configuration: Custom code calculating day intervals for each client.  
    - Input: From Query Notion.  
    - Output: To conditional IF nodes (Day 7, Day 30, Day 60).  
    - Edge Cases: Data inconsistencies, missing dates, null values.

#### 2.3 Conditional Email Sending Block

- **Overview:**  
  Uses conditional nodes to check if clients are at day 7, 30, or 60 post-engagement, respectively, and sends corresponding nurture emails.

- **Nodes Involved:**  
  - IF Day 7  
  - IF Day 30  
  - IF Day 60  
  - Email Day 7  
  - Email Day 30  
  - Email Day 60

- **Node Details:**

  - **IF Day 7 / IF Day 30 / IF Day 60**  
    - Type: If nodes, evaluate if the calculated days equal 7, 30, or 60.  
    - Configuration: Expression-based conditions checking days count.  
    - Input: From Calculate Days.  
    - Output: On true, respective Email Day node; on false, no action.  
    - Edge Cases: Off-by-one errors, data type mismatches.

  - **Email Day 7 / Email Day 30 / Email Day 60**  
    - Type: Email Send nodes, send nurture emails to clients.  
    - Configuration: Uses SMTP credentials; email content varies by day.  
    - Expressions: Likely uses client email addresses and personalized tokens.  
    - Input: From respective IF node (true branch).  
    - Output: To Telegram Notify node.  
    - Edge Cases: SMTP server failures, invalid email addresses, rate limiting.

#### 2.4 Telegram Notification Block

- **Overview:**  
  Notifies a Telegram channel or group about the emails sent for monitoring and logging purposes.

- **Nodes Involved:**  
  - Telegram Notify

- **Node Details:**

  - **Telegram Notify**  
    - Type: Telegram node, sends messages via Telegram Bot API.  
    - Configuration: Uses Telegram API credentials; message content includes details about which email was sent.  
    - Input: From all Email Day nodes.  
    - Output: None further.  
    - Edge Cases: Telegram API limits, bot permissions, message formatting errors.

#### 2.5 Testimonial Collection Block

- **Overview:**  
  Receives client testimonials via webhook, parses testimonial data, notifies via Telegram, and sends a response to the webhook originator.

- **Nodes Involved:**  
  - Testimonial Webhook  
  - Parse Testimonial  
  - Notify Testimonial  
  - Respond

- **Node Details:**

  - **Testimonial Webhook**  
    - Type: Webhook node, listens for incoming HTTP POST requests containing testimonial data.  
    - Configuration: Public URL endpoint; expects JSON payload.  
    - Input: External HTTP request.  
    - Output: To Parse Testimonial.  
    - Edge Cases: Unauthorized access, invalid payloads, downtime.

  - **Parse Testimonial**  
    - Type: Code node, extracts relevant testimonial fields from incoming data.  
    - Configuration: JavaScript code parsing JSON payload, validating required fields.  
    - Input: From webhook.  
    - Output: To Notify Testimonial.  
    - Edge Cases: Malformed JSON, missing fields.

  - **Notify Testimonial**  
    - Type: Telegram node, sends notification about new testimonial received.  
    - Configuration: Uses Telegram API credentials; message includes testimonial content.  
    - Input: From Parse Testimonial.  
    - Output: To Respond node.  
    - Edge Cases: Telegram API errors.

  - **Respond**  
    - Type: Respond to Webhook node, sends HTTP response to confirm receipt.  
    - Configuration: Sends success acknowledgment or error if parsing fails.  
    - Input: From Notify Testimonial.  
    - Output: None.  
    - Edge Cases: Timeout, response formatting.

---

### 3. Summary Table

| Node Name          | Node Type           | Functional Role                            | Input Node(s)            | Output Node(s)           | Sticky Note                    |
|--------------------|---------------------|------------------------------------------|--------------------------|--------------------------|--------------------------------|
| Manual Trigger     | Manual Trigger      | Manual start of workflow                  |                          | Settings                 |                                |
| Schedule Daily     | Schedule Trigger    | Automatic daily start                     |                          | Settings                 |                                |
| Settings           | Set                 | Initialize or reset parameters            | Manual Trigger, Schedule | Get Today Date           |                                |
| Get Today Date     | Code                 | Get current date                          | Settings                 | Query Notion             |                                |
| Query Notion       | HTTP Request         | Fetch client data from Notion             | Get Today Date           | Calculate Days           |                                |
| Calculate Days     | Code                 | Calculate days since engagement           | Query Notion             | IF Day 7, IF Day 30, IF Day 60 |                            |
| IF Day 7           | If                   | Check if day 7 reached                     | Calculate Days           | Email Day 7              |                                |
| IF Day 30          | If                   | Check if day 30 reached                    | Calculate Days           | Email Day 30             |                                |
| IF Day 60          | If                   | Check if day 60 reached                    | Calculate Days           | Email Day 60             |                                |
| Email Day 7        | Email Send            | Send nurture email for day 7               | IF Day 7                 | Telegram Notify          |                                |
| Email Day 30       | Email Send            | Send nurture email for day 30              | IF Day 30                | Telegram Notify          |                                |
| Email Day 60       | Email Send            | Send nurture email for day 60              | IF Day 60                | Telegram Notify          |                                |
| Telegram Notify    | Telegram              | Notify via Telegram about sent emails      | Email Day 7,30,60        |                          |                                |
| Testimonial Webhook | Webhook               | Receive testimonial submissions            | External HTTP request    | Parse Testimonial        |                                |
| Parse Testimonial  | Code                  | Extract testimonial data                    | Testimonial Webhook      | Notify Testimonial       |                                |
| Notify Testimonial | Telegram              | Notify via Telegram about new testimonial  | Parse Testimonial        | Respond                  |                                |
| Respond            | Respond to Webhook    | Reply to testimonial webhook sender        | Notify Testimonial       |                          |                                |
| Setup Guide        | Sticky Note           | Setup instructions                          |                          |                          |                                |
| Configuration Instructions | Sticky Note     | Configuration instructions                  |                          |                          |                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - No parameters needed.

2. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Set to run once daily (default daily schedule).

3. **Create Set Node ("Settings")**  
   - Type: Set  
   - No parameters set initially; connect outputs of Manual Trigger and Schedule Trigger to this node.

4. **Create Code Node ("Get Today Date")**  
   - Type: Code (JavaScript)  
   - Script: Return current date in ISO format or as per later used format. Example: `return [{ json: { today: new Date().toISOString().slice(0,10) } }];`  
   - Connect input from Settings.

5. **Create HTTP Request Node ("Query Notion")**  
   - Type: HTTP Request  
   - Method: POST or GET depending on Notion API endpoint.  
   - URL: Notion API endpoint for querying database.  
   - Authentication: Use Notion API credentials (OAuth or integration token).  
   - Headers: Content-Type application/json, Authorization Bearer token.  
   - Body: JSON payload with filters if needed (e.g., clients to nurture).  
   - Connect input from Get Today Date.

6. **Create Code Node ("Calculate Days")**  
   - Type: Code  
   - Script: Parse Notion response, for each client calculate days difference between their engagement date and current date. Output days count per client with client data.  
   - Connect input from Query Notion.

7. **Create If Nodes ("IF Day 7", "IF Day 30", "IF Day 60")**  
   - Type: If  
   - Condition: Check if days count equals 7, 30, or 60 respectively (use expression like `{{$json["days"] === 7}}`).  
   - Connect input from Calculate Days.

8. **Create Email Send Nodes ("Email Day 7", "Email Day 30", "Email Day 60")**  
   - Type: Email Send  
   - SMTP Credentials: Configure SMTP credentials for sending emails.  
   - Recipients: Use client email from previous node data.  
   - Subject and Body: Tailored email content per day milestone.  
   - Connect each Email node to the true output of corresponding If node.

9. **Create Telegram Node ("Telegram Notify")**  
   - Type: Telegram  
   - Credentials: Telegram Bot API credentials.  
   - Message: Notify about the email sent with relevant client details.  
   - Connect input from each Email Send node.

10. **Create Webhook Node ("Testimonial Webhook")**  
    - Type: Webhook  
    - HTTP Method: POST  
    - Path: Define endpoint path (e.g., /testimonial-submit).  
    - No authentication by default (consider adding if needed).  

11. **Create Code Node ("Parse Testimonial")**  
    - Type: Code  
    - Script: Extract testimonial text, client name, and other fields from webhook payload. Validate data presence.  
    - Connect input from Webhook.

12. **Create Telegram Node ("Notify Testimonial")**  
    - Type: Telegram  
    - Credentials: Same Telegram Bot credentials.  
    - Message: Include testimonial details for notification.  
    - Connect input from Parse Testimonial.

13. **Create Respond to Webhook Node ("Respond")**  
    - Type: Respond to Webhook  
    - Configuration: Send success message or error status.  
    - Connect input from Notify Testimonial.

14. **Connect all nodes sequentially as per above connections.**

15. **Add Sticky Notes Nodes (Optional)**  
    - Add two Sticky Note nodes for setup guide and configuration instructions at appropriate positions for user reference.

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                        |
|----------------------------------------------------------------------------------------------------|-------------------------------------------------------|
| This workflow uses Notion API with appropriate credentials; ensure API token has read access.       | Notion API documentation: https://developers.notion.com/ |
| SMTP credentials must be valid and allow sending emails from your domain to avoid spam filters.    | Configure SMTP provider accordingly.                   |
| Telegram Bot must have permissions to send messages to designated chat/group.                       | Telegram Bot API docs: https://core.telegram.org/bots/api |
| Consider timezone handling in "Get Today Date" node to align with client time zones.               | JavaScript Date timezone considerations.               |
| Webhook endpoint must be publicly accessible for testimonial submissions to be received.            | Use n8n webhook URL or custom domain.                   |

---

**Disclaimer:** The provided content is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with existing content policies and contains no illegal, offensive, or protected elements. All data handled is lawful and public.