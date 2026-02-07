Automate Personalized HR Email Outreach using Gmail, Google Sheets with Rate Limiting

https://n8nworkflows.xyz/workflows/automate-personalized-hr-email-outreach-using-gmail--google-sheets-with-rate-limiting-11329


# Automate Personalized HR Email Outreach using Gmail, Google Sheets with Rate Limiting

### 1. Workflow Overview

This workflow automates personalized HR outreach emails using Gmail and Google Sheets, incorporating rate limiting to comply with daily sending quotas. It is designed for HR professionals or recruiters who want to efficiently contact candidates or contacts stored in Google Sheets, ensuring data quality, respecting email sending limits, and logging outreach activities.

The workflow is logically divided into the following blocks:

- **1.1 Trigger & Data Import:** Initiates the workflow via schedule or manual trigger, then imports HR contact data from Google Sheets.
- **2.1 Data Cleanup & Validation:** Removes duplicate contacts and validates email addresses to filter out invalid or generic emails.
- **3.1 Rate Limiting & Email Preparation:** Enforces a daily sending limit and generates personalized email content.
- **4.1 Send & Handle Email:** Downloads resumes as email attachments, sends emails through Gmail, and processes success or failure responses.
- **5.1 Log Results:** Logs email sending statuses back to Google Sheets for tracking and analytics.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger & Data Import

- **Overview:** This block starts the workflow either manually or on a schedule (daily at 9 AM), then imports HR contact data from a specified Google Sheets document.
- **Nodes Involved:** 
  - `When clicking ‘Execute workflow’`
  - `Schedule Trigger`
  - `Google Sheets - Read HR Data`
- **Node Details:**

  - **When clicking ‘Execute workflow’**  
    - Type: Manual Trigger  
    - Role: Allows manual start of workflow for testing or on-demand runs  
    - Inputs: None  
    - Outputs: Triggers the flow to read Google Sheets  
    - Edge Cases: None specific; manual execution requires user intervention  
    
  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Automatically triggers the workflow daily at 9 AM  
    - Configuration: Sets trigger rule for 9:00 AM local time  
    - Inputs: None  
    - Outputs: Triggers the flow to read Google Sheets  
    - Edge Cases: Timezone considerations may affect actual trigger time  
    
  - **Google Sheets - Read HR Data**  
    - Type: Google Sheets  
    - Role: Reads HR contacts data from a specified Google Sheets document and sheet  
    - Configuration: User must provide Document ID and Sheet Name (resource IDs)  
    - Inputs: Trigger nodes output  
    - Outputs: List of contact entries (rows)  
    - Edge Cases: Authentication failures, missing or incorrect sheet/document IDs, empty sheets  
    - Notes: User must import CSV data into Google Sheets before workflow start  

#### 2.1 Data Cleanup & Validation

- **Overview:** This block removes duplicate email addresses and validates email formats, also filtering out generic or non-personal email addresses.
- **Nodes Involved:**  
  - `Remove Duplicates`  
  - `Email Validation1`
- **Node Details:**

  - **Remove Duplicates**  
    - Type: Remove Duplicates  
    - Role: Eliminates duplicate records based on email address to avoid redundant emails  
    - Inputs: Data from Google Sheets node  
    - Outputs: Unique contacts only  
    - Edge Cases: Case sensitivity in emails, incomplete email fields  

  - **Email Validation1**  
    - Type: If (Conditional node)  
    - Role: Validates email addresses with regex and excludes generic emails (e.g., info@, support@)  
    - Configuration:  
      - Regex checks for proper email format  
      - Filters out generic email prefixes such as info, support, sales, admin, no-reply, contact, help, marketing, team, hello, hi  
    - Inputs: Unique contacts from Remove Duplicates  
    - Outputs: Only validated, personal emails proceed  
    - Edge Cases: Strict validation may exclude some uncommon but valid emails; regex failure if email field missing or malformed  

#### 3.1 Rate Limiting & Email Preparation

- **Overview:** Controls the number of emails sent per day according to a ramp-up schedule and generates personalized email content.
- **Nodes Involved:**  
  - `Rate Limiter`  
  - `Email Creator`  
  - `Loop Over Items`  
  - `Wait` (used for batching control)
- **Node Details:**

  - **Rate Limiter**  
    - Type: Code  
    - Role: Implements dynamic daily limit on the number of emails sent, based on weeks elapsed since a start date  
    - Configuration:  
      - `RAMP_START`: Starting date for counting weeks (2025-09-21)  
      - `LIMIT_BY_WEEK`: Array indicating allowed emails per week (e.g., [150])  
      - Tracks emails sent today in workflow static data to avoid exceeding limit  
      - Returns only the allowed number of emails for sending today  
    - Inputs: Validated emails from Email Validation node  
    - Outputs: Emails permitted for sending with metadata (`canSend`, `currentSentToday`, etc.)  
    - Edge Cases: Misconfigured start date or limits may cause no emails to be sent; static data persistence issues; timezone effects on daily counters  

  - **Email Creator**  
    - Type: Code  
    - Role: Generates personalized email subject and body content for each recipient  
    - Configuration: User must replace placeholder (`YOUR_URL_HERE`) with code or template generating email content  
    - Inputs: Emails allowed by Rate Limiter with metadata  
    - Outputs: Emails enriched with `emailSubject` and `emailBody` fields  
    - Edge Cases: Missing or incorrect personalization variables may cause errors or generic emails  

  - **Loop Over Items**  
    - Type: Split In Batches  
    - Role: Processes emails one by one or in batches to control sending rate and allow for wait times  
    - Inputs: Emails with generated content  
    - Outputs: Individual or batch email items to downstream nodes  
    - Edge Cases: Batch size configuration not explicitly shown; large batches may hit Gmail limits  

  - **Wait**  
    - Type: Wait  
    - Role: Introduces a delay (60 seconds) between batches or individual emails to prevent rate-limit hits on Gmail  
    - Inputs: Output from Loop Over Items' second output (for batching)  
    - Outputs: Delayed flow to next node  
    - Edge Cases: Delays may accumulate and increase total workflow time; connectivity interruptions during wait  

#### 4.1 Send & Handle Email

- **Overview:** Downloads the recipient’s resume as an attachment, sends the personalized email via Gmail, and handles success or failure of the sending process.
- **Nodes Involved:**  
  - `Download Resume`  
  - `Send Gmail`  
  - `If` (checks send success)  
  - `Update Counter1` (on success)  
  - `Handle Failures1` (on failure)  
  - `Edit Fields1` (prepares data for logging)
- **Node Details:**

  - **Download Resume**  
    - Type: HTTP Request  
    - Role: Downloads a resume file from a specified URL as binary data to attach to the email  
    - Configuration: User must replace placeholder URL (`YOUR_GOOGLE_DRIVE_URL_HERE`) with actual resume link repository  
    - Inputs: Emails with content from Wait node  
    - Outputs: Email data with binary attachment (resume)  
    - Edge Cases: URL not reachable, permission errors, large file size causing timeouts or memory issues  

  - **Send Gmail**  
    - Type: Gmail  
    - Role: Sends the personalized email with attachments to the recipient’s email address  
    - Configuration:  
      - Sends to `Email` field from input JSON  
      - Uses `emailSubject` and `emailBody` fields for content  
      - Attaches binary data from `Download Resume` node  
      - OAuth2 authentication required via Gmail credentials  
      - `continueOnFail` enabled to allow workflow continuation on individual send errors  
    - Inputs: Email with attachment from Download Resume  
    - Outputs: Success or error response to If node  
    - Edge Cases: Gmail API quota exceeded, invalid credentials, attachment size limits, network errors  

  - **If**  
    - Type: If (Conditional)  
    - Role: Checks if the Gmail send operation returned a valid message ID to determine success  
    - Inputs: Output from Send Gmail  
    - Outputs:  
      - Success path to `Update Counter1`  
      - Failure path to `Handle Failures1`  
    - Edge Cases: Unexpected Gmail response format or missing fields  

  - **Update Counter1**  
    - Type: Code  
    - Role: Updates the workflow static data counter tracking how many emails have been successfully sent today  
    - Logic:  
      - Increments count by 1  
      - Records the sending date and status for logging  
    - Inputs: Successful email send confirmation from If node  
    - Outputs: Updates JSON with success status fields  
    - Edge Cases: Static data persistence failure, date boundary edge cases  

  - **Handle Failures1**  
    - Type: Code  
    - Role: Processes failed email send attempts, extracts error messages, and flags failure status  
    - Inputs: Failed send info from If node  
    - Outputs: JSON enriched with failure status and reason  
    - Edge Cases: Missing or nested error messages may complicate parsing  

  - **Edit Fields1**  
    - Type: Set  
    - Role: Consolidates and prepares fields for logging, combining original data with send results (success/failure)  
    - Inputs: Both Update Counter1 and Handle Failures1 outputs  
    - Outputs: Formatted data for logging to Google Sheets  
    - Edge Cases: Missing expected fields from upstream nodes may cause empty or incomplete logs  

#### 5.1 Log Results

- **Overview:** Logs the outcome of each email sent (success or failure) by appending a record to a Google Sheets tracking document.
- **Nodes Involved:**  
  - `Log to Google Sheets1`
- **Node Details:**

  - **Log to Google Sheets1**  
    - Type: Google Sheets  
    - Role: Appends a new row to a specified Google Sheets document logging the email status, recipient info, subject, and timestamp  
    - Configuration:  
      - User must specify Document ID and Sheet Name for logging  
      - Columns mapped: Name, Email, status, Company, sentDate (timestamp), emailSubject  
    - Inputs: Data from Edit Fields1 node  
    - Outputs: Confirmation of append operation  
    - Edge Cases: Authentication issues, sheet access permissions, quota limits  

---

### 3. Summary Table

| Node Name                     | Node Type           | Functional Role                           | Input Node(s)                    | Output Node(s)                    | Sticky Note                                                                                       |
|-------------------------------|---------------------|-----------------------------------------|---------------------------------|----------------------------------|-------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger      | Manual start of workflow                 | None                            | Google Sheets - Read HR Data      |                                                                                                 |
| Schedule Trigger              | Schedule Trigger    | Scheduled daily trigger at 9 AM          | None                            | Google Sheets - Read HR Data      |                                                                                                 |
| Google Sheets - Read HR Data | Google Sheets       | Reads HR contacts from Google Sheets     | Schedule Trigger, Manual Trigger| Remove Duplicates                 | Import your HR contacts CSV to Google Sheets first                                              |
| Remove Duplicates            | Remove Duplicates   | Removes duplicate email addresses        | Google Sheets - Read HR Data    | Email Validation1                 | Removes duplicate email addresses                                                              |
| Email Validation1            | If                  | Validates email format, filters generic  | Remove Duplicates               | Rate Limiter                     | Validates email format and filters generic emails                                              |
| Rate Limiter                 | Code                | Enforces daily email sending limit       | Email Validation1               | Email Creator                   |                                                                                                 |
| Email Creator               | Code                | Generates personalized email content     | Rate Limiter                   | Loop Over Items                  | Define email content in this node                                                              |
| Loop Over Items             | Split In Batches    | Processes emails in batches               | Email Creator                  | Wait (on second output),          |                                                                                                 |
| Wait                        | Wait                | Delays between email sends                | Loop Over Items (batch output) | Download Resume                  |                                                                                                 |
| Download Resume             | HTTP Request        | Downloads resume for email attachment     | Wait                          | Send Gmail                      | Downloads resume as binary data                                                                 |
| Send Gmail                  | Gmail               | Sends personalized email with attachment | Download Resume                | If                             | Send email to actual recipient with resume                                                     |
| If                         | If                  | Branches on send success or failure       | Send Gmail                    | Update Counter1 (success), Handle Failures1 (failure)|                                                                                                 |
| Update Counter1             | Code                | Updates daily sent email counter          | If (success path)              | Edit Fields1                   |                                                                                                 |
| Handle Failures1            | Code                | Processes failed email send attempts      | If (failure path)              | Edit Fields1                   |                                                                                                 |
| Edit Fields1                | Set                 | Prepares data for logging                  | Update Counter1, Handle Failures1 | Log to Google Sheets1           |                                                                                                 |
| Log to Google Sheets1       | Google Sheets       | Logs email send status to Google Sheets   | Edit Fields1                  | Loop Over Items (batch input)    | Log sent emails for tracking                                                                   |
| Main Sticky                 | Sticky Note         | Overview and instructions                  | None                          | None                           | ## Automate Personalized HR Email Outreach with Rate Limiting... (detailed workflow description)|
| Section 1                   | Sticky Note         | Marks Trigger & Data Import block          | None                          | None                           | ## 1. Trigger & Data Import                                                                     |
| Section 2                   | Sticky Note         | Marks Data Cleanup & Validation block      | None                          | None                           | ## 2. Data Cleanup & Validation                                                                 |
| Section 3                   | Sticky Note         | Marks Rate Limiting & Email Prep block     | None                          | None                           | ## 3. Rate Limiting & Email Prep                                                                |
| Section 4                   | Sticky Note         | Marks Send & Handle Email block             | None                          | None                           | ## 4. Send & Handle Email                                                                        |
| Section 5                   | Sticky Note         | Marks Log Results block                      | None                          | None                           | ## 5. Log Results                                                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes:**
   - Add a **Manual Trigger** node named `When clicking ‘Execute workflow’`.
   - Add a **Schedule Trigger** node named `Schedule Trigger`, set to trigger daily at 9:00 AM.

2. **Add Google Sheets Read Node:**
   - Add a **Google Sheets** node named `Google Sheets - Read HR Data`.
   - Configure with your Google Sheets credentials.
   - Set Document ID and Sheet Name to your HR contacts sheet.
   - Connect outputs of both trigger nodes to this node.

3. **Add Remove Duplicates Node:**
   - Add a **Remove Duplicates** node named `Remove Duplicates`.
   - Connect input from `Google Sheets - Read HR Data`.
   - Configure to remove duplicates based on the `Email` field.

4. **Add Email Validation Node:**
   - Add an **If** node named `Email Validation1`.
   - Set two conditions combined with AND:
     - Regex match on `Email` for valid email format: `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`
     - Regex NOT match on `Email` for generic sender prefixes like `info@`, `support@`, `no-reply@`, etc.
   - Connect input from `Remove Duplicates`.
   - Connect the "true" output forward.

5. **Add Rate Limiter Node:**
   - Add a **Code** node named `Rate Limiter`.
   - Copy the JavaScript code that:
     - Defines `RAMP_START` (e.g., '2025-09-21')
     - Defines `LIMIT_BY_WEEK` array (e.g., `[150]`)
     - Tracks daily sent count in static workflow data
     - Filters input items to allowed emails per day
   - Connect input from `Email Validation1`.

6. **Add Email Creator Node:**
   - Add a **Code** node named `Email Creator`.
   - Implement or replace placeholder code to generate personalized email subject and body using fields from input JSON.
   - Connect input from `Rate Limiter`.

7. **Add Loop Over Items Node:**
   - Add a **Split In Batches** node named `Loop Over Items`.
   - Connect input from `Email Creator`.
   - Default batch size can be used or configured as needed.

8. **Add Wait Node:**
   - Add a **Wait** node named `Wait`.
   - Set wait time to 60 seconds.
   - Connect the second output of `Loop Over Items` (batch completion) to this node.

9. **Add Download Resume Node:**
   - Add an **HTTP Request** node named `Download Resume`.
   - Set HTTP Method to GET.
   - Set URL to the location of the resume file (e.g., Google Drive URL).
   - Set response to download as file (binary).
   - Connect input from `Wait`.

10. **Add Send Gmail Node:**
    - Add a **Gmail** node named `Send Gmail`.
    - Configure with Gmail OAuth2 credentials.
    - Set "To" address to `{{$json.Email}}`.
    - Set subject to `{{$json.emailSubject}}`.
    - Set message body to `{{$json.emailBody}}`.
    - Attach binary data from `Download Resume`.
    - Enable `continueOnFail` to allow workflow to continue on errors.
    - Connect input from `Download Resume`.

11. **Add If Node to Check Send Success:**
    - Add an **If** node named `If`.
    - Condition: Check if `id` field in Gmail response is not empty (indicating success).
    - Connect input from `Send Gmail`.
    - Connect "true" output to `Update Counter1`.
    - Connect "false" output to `Handle Failures1`.

12. **Add Update Counter Node:**
    - Add a **Code** node named `Update Counter1`.
    - Implement code to increment daily sent email count in static workflow data.
    - Add metadata: success status, sent date, total sent today.
    - Connect input from `If` success output.

13. **Add Handle Failures Node:**
    - Add a **Code** node named `Handle Failures1`.
    - Extract error messages from Gmail failure response.
    - Mark email status as failed with failure reason and timestamp.
    - Connect input from `If` failure output.

14. **Add Edit Fields Node:**
    - Add a **Set** node named `Edit Fields1`.
    - Map fields to prepare for logging: `Name`, `Email`, `Company`, `emailStatus`, `failureReason`, `emailSubject`, `sentDate`, `firstName`, `Title`, `SNo`.
    - Use expressions to pull data from `Download Resume` and status nodes.
    - Connect input from both `Update Counter1` and `Handle Failures1`.

15. **Add Log to Google Sheets Node:**
    - Add a **Google Sheets** node named `Log to Google Sheets1`.
    - Configure with your Google Sheets credentials.
    - Set Document ID and Sheet Name for logging.
    - Configure columns to log: Name, Email, Company, status, sentDate, emailSubject.
    - Operation: Append.
    - Connect input from `Edit Fields1`.

16. **Connect Looping Back:**
    - Connect output of `Log to Google Sheets1` back to the first input of `Loop Over Items` node to process next batch if any.

17. **Add Sticky Notes (Optional):**
    - Add Sticky Note nodes to mark each section as described in the original workflow for clarity.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Context or Link                                                                                          |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| This workflow streamlines HR outreach by fetching contact data, validating emails, enforcing daily sending limits, and sending personalized emails with attachments, while logging activity. Adjust the `Rate Limiter` node’s `RAMP_START` and `LIMIT_BY_WEEK` variables to control sending schedule and volume.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Overview sticky note content in the workflow                                                          |
| Import your HR contacts CSV data into Google Sheets first before running the workflow.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Note on `Google Sheets - Read HR Data` node                                                           |
| The Gmail node requires OAuth2 credentials configured in n8n with appropriate scopes for sending emails. Rate limiting is essential to avoid Gmail quota or spam blocking. Wait node introduces a 60-second delay between email batches to spread sending over time.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Operational considerations for Gmail integration and rate limiting                                   |
| Email validation excludes common generic addresses like info@, support@, no-reply@, etc., to improve personalization and deliverability.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Email Validation node logic details                                                                   |
| Download Resume node expects a valid URL to a resume file (e.g., Google Drive link). Ensure public or authorized access to avoid request failures.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Download Resume node note                                                                             |
| Log to Google Sheets tracks success or failure of each email sent, useful for auditing and follow-up.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Logging node purpose                                                                                   |
| Adapt email content generation in the `Email Creator` node to your campaign style and personalization needs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Email Creator node customization reminder                                                            |

---

**Disclaimer:** The provided text is exclusively derived from an automated n8n workflow. It complies fully with current content policies, contains no illegal or offensive content, and handles only legal, public data.