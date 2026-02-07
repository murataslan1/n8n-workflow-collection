AI-Powered Invoice Reminder & Payment Tracker for Finance & Accounting

https://n8nworkflows.xyz/workflows/ai-powered-invoice-reminder---payment-tracker-for-finance---accounting-10111


# AI-Powered Invoice Reminder & Payment Tracker for Finance & Accounting

---

### 1. Workflow Overview

This workflow automates invoice payment reminders and payment tracking for finance and accounting teams. It is designed to:

- Periodically check for unpaid or overdue invoices from a database.
- Apply intelligent logic to determine when and what type of reminder to send.
- Use AI (OpenAI GPT model) to generate professional, personalized reminder emails.
- Format emails with HTML styling including invoice details.
- Send reminder emails via SMTP.
- Log reminder activities for auditing.
- Generate and email a daily summary report of reminders sent.
- React to incoming payment notifications via webhook, update invoice status, and send payment confirmation emails.

Logical blocks:

- **1.1 Scheduled Invoice Retrieval:** Daily trigger and database query for pending invoices.
- **1.2 Invoice Filtering & Reminder Logic:** Filtering invoices and applying reminder timing logic.
- **1.3 AI-Powered Email Generation:** Creating personalized prompts, invoking AI to draft emails, and formatting the emails.
- **1.4 Email Dispatch and Logging:** Sending emails, updating database reminder status, and logging activities.
- **1.5 Reporting:** Summarizing daily reminder activities and emailing the summary to finance.
- **1.6 Payment Webhook Handling:** Receiving payment notifications, updating payment status, and sending confirmation emails.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Invoice Retrieval

**Overview:**  
Triggers workflow daily at 9 AM and retrieves unpaid or soon-to-be-due invoices from the Postgres database.

**Nodes Involved:**  
- Schedule Daily Check  
- Fetch Pending Invoices

**Node Details:**

- **Schedule Daily Check**  
  - Type: Schedule Trigger  
  - Config: Runs every day at 9 AM using cron expression `0 9 * * *`  
  - Inputs: None (trigger)  
  - Outputs: Connects to "Fetch Pending Invoices"  
  - Edge cases: Cron misconfiguration could stop triggering; time zone considerations may affect timing.

- **Fetch Pending Invoices**  
  - Type: Postgres node (executeQuery)  
  - Config: SQL query selecting unpaid or overdue invoices with due date within next 7 days; orders by due date ascending.  
  - Credentials: Postgres database connection  
  - Inputs: From Schedule Daily Check  
  - Outputs: To "Filter Overdue Invoices"  
  - Edge cases: DB connection failure, query errors, empty result set.

---

#### 1.2 Invoice Filtering & Reminder Logic

**Overview:**  
Separates overdue invoices from upcoming ones and applies smart logic to decide reminder type, urgency, and whether to send.

**Nodes Involved:**  
- Filter Overdue Invoices  
- Calculate Reminder Logic

**Node Details:**

- **Filter Overdue Invoices**  
  - Type: If node  
  - Config: Filters invoices where `payment_status` = "unpaid" AND `days_overdue` >= 0 (i.e., overdue invoices only)  
  - Inputs: From "Fetch Pending Invoices"  
  - Outputs: To "Calculate Reminder Logic"  
  - Edge cases: Misinterpretation of conditions may exclude invoices; type validation ensures strict matching.

- **Calculate Reminder Logic**  
  - Type: Code (JavaScript)  
  - Config: For each invoice, calculates days overdue, days since last reminder, and decides reminder type (`final_notice`, `second_reminder`, etc.) and urgency (`critical`, `high`, etc.) based on thresholds (e.g., overdue >30 days with last reminder ≥3 days ago triggers final notice). Only invoices matching "shouldSendReminder" = true are passed forward.  
  - Inputs: From "Filter Overdue Invoices"  
  - Outputs: To "Prepare AI Prompt"  
  - Edge cases: Date parsing errors, null `last_reminder_sent`, logic errors could cause wrong reminders.

---

#### 1.3 AI-Powered Email Generation

**Overview:**  
Constructs personalized AI prompts per invoice and uses OpenAI GPT to generate professional email content, then formats the AI output into styled HTML emails.

**Nodes Involved:**  
- Prepare AI Prompt  
- AI Agent For Generate Email Content (LangChain Agent)  
- Generate Email (OpenAI Chat Completion)  
- Format Email

**Node Details:**

- **Prepare AI Prompt**  
  - Type: Set node  
  - Config: Builds a detailed string prompt with invoice details, reminder type, urgency, and instructions for polite, professional tone and structure.  
  - Inputs: From "Calculate Reminder Logic"  
  - Outputs: To "AI Agent For Generate Email Content"  
  - Edge cases: Expression errors if invoice fields missing.

- **AI Agent For Generate Email Content**  
  - Type: LangChain Agent  
  - Config: Receives prompt, coordinates with OpenAI model to generate text; acts as orchestrator.  
  - Inputs: From "Prepare AI Prompt" and "Generate Email" (model)  
  - Outputs: To "Format Email"  
  - Edge cases: API errors, rate limiting.

- **Generate Email**  
  - Type: LangChain LM Chat OpenAI  
  - Config: Uses GPT-4o-mini model with temperature 0.7 and max 500 tokens to generate email text.  
  - Credentials: OpenAI API key  
  - Inputs: From "AI Agent For Generate Email Content"  
  - Outputs: Back to "AI Agent For Generate Email Content"  
  - Edge cases: API timeout, exceeded max tokens, invalid credentials.

- **Format Email**  
  - Type: Code (JavaScript)  
  - Config: Extracts subject line and body from AI response; converts to HTML with invoice details table styled for clarity; includes polite footer note about automated message. Also produces plain text version.  
  - Inputs: From "AI Agent For Generate Email Content"  
  - Outputs: To "Send Email Reminder"  
  - Edge cases: Parsing AI response fails if format unexpected; missing fields.

---

#### 1.4 Email Dispatch and Logging

**Overview:**  
Sends the formatted reminder email, updates the invoice reminder status in DB, logs activity, and chains into reporting.

**Nodes Involved:**  
- Send Email Reminder  
- Update Reminder Status  
- Create Activity Log  
- Save to Activity Log

**Node Details:**

- **Send Email Reminder**  
  - Type: Email Send (SMTP)  
  - Config: Sends email using SMTP credentials with subject and recipient email from previous node's JSON data; sender and recipient emails are statically set (e.g., `xyz@gmail.com` to `abc@gmail.com`).  
  - Inputs: From "Format Email"  
  - Outputs: To "Update Reminder Status"  
  - Credentials: SMTP server  
  - Edge cases: SMTP errors, invalid email addresses, network issues.

- **Update Reminder Status**  
  - Type: Postgres executeQuery  
  - Config: Updates invoice record with current timestamp as `last_reminder_sent`, increments `reminder_count`, and records `last_reminder_type`. Uses invoice ID from JSON.  
  - Inputs: From "Send Email Reminder"  
  - Outputs: To "Create Activity Log"  
  - Edge cases: DB connection failure, concurrent updates.

- **Create Activity Log**  
  - Type: Set node  
  - Config: Creates a JSON object capturing timestamp, invoice details, reminder type, urgency, days overdue, and status as `"reminder_sent"`.  
  - Inputs: From "Update Reminder Status"  
  - Outputs: To "Save to Activity Log"

- **Save to Activity Log**  
  - Type: Postgres insert  
  - Config: Inserts the log entry into `invoice_activity_log` table in Postgres DB.  
  - Inputs: From "Create Activity Log"  
  - Outputs: To "Generate Daily Summary"  
  - Edge cases: DB insert errors.

---

#### 1.5 Reporting

**Overview:**  
Aggregates the day's reminders into a summary report and emails it to the finance team.

**Nodes Involved:**  
- Generate Daily Summary  
- Send Summary to Finance Team

**Node Details:**

- **Generate Daily Summary**  
  - Type: Code (JavaScript)  
  - Config: Aggregates total reminders, counts by urgency and reminder type, sums outstanding amounts, and compiles client/invoice info in a summary object.  
  - Inputs: From "Save to Activity Log" (all items)  
  - Outputs: To "Send Summary to Finance Team"  
  - Edge cases: Empty input (no reminders sent), calculation errors.

- **Send Summary to Finance Team**  
  - Type: Email Send (SMTP)  
  - Config: Sends summary email with subject including current date; recipient and sender emails are statically defined (e.g., `xyz@gmail.com` to `abc@gmail.com`).  
  - Inputs: From "Generate Daily Summary"  
  - Outputs: None  
  - Credentials: SMTP  
  - Edge cases: SMTP failure.

---

#### 1.6 Payment Webhook Handling

**Overview:**  
Handles incoming payment notifications via webhook, updates invoice status, and sends payment confirmation emails.

**Nodes Involved:**  
- Webhook: Payment Received  
- Update Payment Status  
- Webhook Response  
- Send Payment Confirmation

**Node Details:**

- **Webhook: Payment Received**  
  - Type: Webhook (HTTP POST)  
  - Config: Listens at path `/invoice-paid`, accepts POST requests signaling payment; triggers workflow branch.  
  - Outputs: To "Update Payment Status"  
  - Edge cases: Unauthorized calls, malformed payloads.

- **Update Payment Status**  
  - Type: Postgres executeQuery  
  - Config: Updates invoice row to mark `payment_status` as `'paid'`, sets `payment_date` to current timestamp, and records payment amount and method from webhook payload; returns updated row.  
  - Inputs: From webhook  
  - Outputs: To "Webhook Response" and "Send Payment Confirmation"  
  - Edge cases: DB errors, missing invoice_number in payload.

- **Webhook Response**  
  - Type: Respond to Webhook  
  - Config: Sends JSON response confirming successful payment recording with invoice number, amount paid, and status.  
  - Inputs: From "Update Payment Status"  
  - Outputs: None (response)  
  - Edge cases: Response formatting errors.

- **Send Payment Confirmation**  
  - Type: Email Send (SMTP)  
  - Config: Sends payment confirmation email to client, with subject referencing invoice number; recipient and sender are statically set.  
  - Inputs: From "Update Payment Status"  
  - Outputs: None  
  - Credentials: SMTP  
  - Edge cases: SMTP failure.

---

### 3. Summary Table

| Node Name                    | Node Type                   | Functional Role                          | Input Node(s)                  | Output Node(s)                      | Sticky Note                                                       |
|------------------------------|-----------------------------|----------------------------------------|--------------------------------|-----------------------------------|------------------------------------------------------------------|
| Schedule Daily Check          | Schedule Trigger            | Triggers workflow daily at 9 AM        | -                              | Fetch Pending Invoices             | Starts the workflow automatically each morning.                  |
| Fetch Pending Invoices        | Postgres                   | Retrieves unpaid/overdue invoices       | Schedule Daily Check            | Filter Overdue Invoices            | Gets unpaid invoices from the database.                          |
| Filter Overdue Invoices       | If                         | Filters overdue invoices only            | Fetch Pending Invoices          | Calculate Reminder Logic           | Keeps only overdue invoices.                                     |
| Calculate Reminder Logic      | Code                       | Determines reminder timing and type     | Filter Overdue Invoices         | Prepare AI Prompt                 | Decides when and how to send reminders.                         |
| Prepare AI Prompt             | Set                        | Builds personalized AI email prompt     | Calculate Reminder Logic        | AI Agent For Generate Email Content| Creates a personalized AI prompt for each client.               |
| AI Agent For Generate Email Content | LangChain Agent         | Coordinates AI email generation          | Prepare AI Prompt, Generate Email| Format Email                    | Uses AI to draft reminder emails.                                |
| Generate Email               | LangChain LM Chat OpenAI    | Generates AI-based email content         | AI Agent For Generate Email Content | AI Agent For Generate Email Content | Generates thank-you massage via AI.                              |
| Format Email                 | Code                       | Formats AI response as HTML email       | AI Agent For Generate Email Content | Send Email Reminder             | Converts AI text to a professional HTML email.                   |
| Send Email Reminder          | Email Send (SMTP)          | Sends reminder email to client           | Format Email                   | Update Reminder Status             | Sends the email via Gmail or SMTP.                               |
| Update Reminder Status       | Postgres                   | Updates DB with reminder sent status     | Send Email Reminder            | Create Activity Log                | Marks reminder as sent in the database.                          |
| Create Activity Log          | Set                        | Prepares log data for reminder activity  | Update Reminder Status         | Save to Activity Log              | Records reminder activity for audit.                             |
| Save to Activity Log         | Postgres                   | Inserts reminder activity log into DB    | Create Activity Log            | Generate Daily Summary            | Stores raw workflow data for review.                             |
| Generate Daily Summary       | Code                       | Aggregates reminders into daily report   | Save to Activity Log           | Send Summary to Finance Team       | Prepares a report of reminders sent.                             |
| Send Summary to Finance Team | Email Send (SMTP)          | Emails daily summary to finance team     | Generate Daily Summary         | -                                 | Emails summary to the finance team.                              |
| Webhook: Payment Received    | Webhook                    | Receives payment notification             | -                            | Update Payment Status              | Captures payment notifications.                                 |
| Update Payment Status        | Postgres                   | Marks invoice as paid in DB                | Webhook: Payment Received      | Webhook Response, Send Payment Confirmation | Updates invoice as “paid.”                                      |
| Webhook Response            | Respond to Webhook          | Sends JSON confirmation response          | Update Payment Status          | -                                 | -                                                                |
| Send Payment Confirmation    | Email Send (SMTP)          | Sends payment receipt email                | Update Payment Status          | -                                 | Sends payment receipt to client.                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create "Schedule Daily Check" node**  
   - Type: Schedule Trigger  
   - Set cron expression to `0 9 * * *` (daily at 9 AM).

2. **Create "Fetch Pending Invoices" node**  
   - Type: Postgres  
   - Configure credentials for your Postgres database.  
   - Query:  
     ```sql
     SELECT 
       invoice_id,
       client_name,
       client_email,
       invoice_number,
       invoice_amount,
       currency,
       issue_date,
       due_date,
       payment_status,
       days_overdue,
       last_reminder_sent
     FROM invoices
     WHERE payment_status != 'paid' 
       AND due_date <= CURRENT_DATE + INTERVAL '7 days'
     ORDER BY due_date ASC;
     ```  
   - Connect: Schedule Daily Check → Fetch Pending Invoices.

3. **Create "Filter Overdue Invoices" node**  
   - Type: If  
   - Conditions:  
     - payment_status equals "unpaid" (string, case sensitive)  
     - days_overdue greater or equal to 0 (number)  
   - Connect: Fetch Pending Invoices → Filter Overdue Invoices.

4. **Create "Calculate Reminder Logic" node**  
   - Type: Code  
   - Paste the JavaScript code that computes days overdue, days since last reminder, and sets reminder type and urgency.  
   - Connect: Filter Overdue Invoices → Calculate Reminder Logic.

5. **Create "Prepare AI Prompt" node**  
   - Type: Set  
   - Assign a string field `aiPrompt` with a templated prompt including invoice details, reminder type, urgency, and instructions for a professional reminder email.  
   - Connect: Calculate Reminder Logic → Prepare AI Prompt.

6. **Create "AI Agent For Generate Email Content" node**  
   - Type: LangChain Agent  
   - No special parameters needed.  
   - Connect: Prepare AI Prompt → AI Agent For Generate Email Content.

7. **Create "Generate Email" node**  
   - Type: LangChain LM Chat OpenAI  
   - Model: `gpt-4o-mini`  
   - Parameters: maxTokens 500, temperature 0.7  
   - Configure OpenAI API credentials.  
   - Connect: AI Agent For Generate Email Content (ai_languageModel) → Generate Email.  
   - Connect: Generate Email (main) → AI Agent For Generate Email Content (main).

8. **Create "Format Email" node**  
   - Type: Code  
   - Use JavaScript code that extracts subject and body from AI output, applies HTML formatting including invoice details table, and produces both HTML and plain text versions.  
   - Connect: AI Agent For Generate Email Content → Format Email.

9. **Create "Send Email Reminder" node**  
   - Type: Email Send (SMTP)  
   - Set subject: `={{ $json.emailSubject }}`  
   - Set recipient email (e.g., `abc@gmail.com`)  
   - Set sender email (e.g., `xyz@gmail.com`)  
   - Configure SMTP credentials.  
   - Connect: Format Email → Send Email Reminder.

10. **Create "Update Reminder Status" node**  
    - Type: Postgres  
    - Query:  
      ```sql
      UPDATE invoices
      SET
        last_reminder_sent = CURRENT_TIMESTAMP,
        reminder_count = reminder_count + 1,
        last_reminder_type = '{{ $json.reminderType }}'
      WHERE invoice_id = '{{ $json.invoice_id }}';
      ```  
    - Use same Postgres credentials.  
    - Connect: Send Email Reminder → Update Reminder Status.

11. **Create "Create Activity Log" node**  
    - Type: Set  
    - Assign field `logEntry` as an object including timestamp, invoice details, reminder type, urgency, days overdue, and status `"reminder_sent"`.  
    - Connect: Update Reminder Status → Create Activity Log.

12. **Create "Save to Activity Log" node**  
    - Type: Postgres Insert  
    - Table: `invoice_activity_log` in schema `public`  
    - Map input data automatically.  
    - Use same Postgres credentials.  
    - Connect: Create Activity Log → Save to Activity Log.

13. **Create "Generate Daily Summary" node**  
    - Type: Code  
    - JavaScript code to aggregate reminders count, sum outstanding amounts, and collect client details into a summary object.  
    - Connect: Save to Activity Log → Generate Daily Summary.

14. **Create "Send Summary to Finance Team" node**  
    - Type: Email Send (SMTP)  
    - Subject: `=Daily Invoice Reminder Report - {{ $now.toFormat('yyyy-MM-dd') }}`  
    - Recipient and sender emails same as reminder email.  
    - SMTP credentials configured.  
    - Connect: Generate Daily Summary → Send Summary to Finance Team.

15. **Create "Webhook: Payment Received" node**  
    - Type: Webhook  
    - HTTP Method: POST  
    - Path: `invoice-paid`  
    - Connect: (start of payment update branch) → Update Payment Status.

16. **Create "Update Payment Status" node**  
    - Type: Postgres  
    - Query:  
      ```sql
      UPDATE invoices
      SET
        payment_status = 'paid',
        payment_date = CURRENT_TIMESTAMP,
        payment_amount = {{ $json.body.amount }},
        payment_method = '{{ $json.body.payment_method }}'
      WHERE invoice_number = '{{ $json.body.invoice_number }}'
      RETURNING *;
      ```  
    - Use Postgres credentials.  
    - Connect: Webhook: Payment Received → Update Payment Status.

17. **Create "Webhook Response" node**  
    - Type: Respond to Webhook  
    - Respond with JSON: success message, invoice number, amount paid, and status from updated invoice.  
    - Connect: Update Payment Status → Webhook Response.

18. **Create "Send Payment Confirmation" node**  
    - Type: Email Send (SMTP)  
    - Subject: `=Payment Confirmation - Invoice {{ $json.invoice_number }}`  
    - Recipient and sender emails same as above.  
    - SMTP credentials configured.  
    - Connect: Update Payment Status → Send Payment Confirmation.

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                                                                  |
|----------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| The workflow includes several sticky notes summarizing key blocks and functionality for clarity.   | Visible in workflow editor near related nodes.                                                 |
| AI generation relies on OpenAI GPT-4o-mini model with temperature 0.7 for balanced creativity.      | Requires OpenAI API key credential setup in n8n.                                              |
| Email sending uses SMTP; configure credentials and ensure sender emails are authorized.             | Replace placeholder emails with real finance and client emails as needed.                      |
| Webhook endpoint `/invoice-paid` must be exposed publicly and secured as per organizational policy.| Used to receive real-time payment confirmations from external systems.                         |
| Date calculations assume server time zone consistency; adjust if running in different zones.        | Important for accurate overdue and reminder logic.                                            |
| Database schema includes `invoices` and `invoice_activity_log` tables with necessary fields.        | Ensure DB tables exist with fields used in queries.                                           |
| Error handling is not explicitly implemented in nodes; consider adding error workflows or notifications.| Critical for production robustness.                                                          |

---

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

---