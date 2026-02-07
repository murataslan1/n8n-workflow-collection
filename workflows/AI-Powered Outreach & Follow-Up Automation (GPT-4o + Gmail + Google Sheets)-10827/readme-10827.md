AI-Powered Outreach & Follow-Up Automation (GPT-4o + Gmail + Google Sheets)

https://n8nworkflows.xyz/workflows/ai-powered-outreach---follow-up-automation--gpt-4o---gmail---google-sheets--10827


# AI-Powered Outreach & Follow-Up Automation (GPT-4o + Gmail + Google Sheets)

### 1. Workflow Overview

This workflow automates personalized email outreach and follow-up processes for sales leads using GPT-4o (Azure OpenAI), Gmail, and Google Sheets. It targets sales teams aiming to efficiently engage cold or warm leads by generating customized emails, sending them, monitoring replies, and updating lead statuses in a CRM spreadsheet without manual intervention.

The workflow is logically structured into these main blocks:

- **1.1 Input Reception and Lead Retrieval:** Trigger and fetch lead data from Google Sheets.
- **1.2 Lead Validation and Filtering:** Validate lead emails and filter for leads based on booking status.
- **1.3 AI-Powered Email Generation:** Use GPT-4o to create personalized outreach emails.
- **1.4 Initial Email Dispatch and Reply Monitoring:** Send outreach email via Gmail, wait, then check for replies.
- **1.5 Reply Handling and Lead Status Update:** Parse replies and update lead status as “BOOKED” if positive.
- **1.6 Follow-Up Email and Second Reply Monitoring:** Send follow-up emails if no reply, wait, check for replies.
- **1.7 Final Lead Status Update:** Update lead as “BOOKED” upon reply or “Declined” if no response after follow-up.
- **1.8 Logging Invalid Leads:** Log invalid or incomplete lead entries for data quality.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Lead Retrieval

**Overview:**  
Starts the workflow manually, then retrieves lead records from a designated Google Sheets document to serve as the outreach database.

**Nodes Involved:**  
- When clicking ‘Execute workflow’ (Manual Trigger)  
- Retrieve Lead Records from Google Sheets

**Node Details:**

- **When clicking ‘Execute workflow’**  
  - *Type:* Manual Trigger  
  - *Role:* Entry point; manually triggers the workflow start.  
  - *Config:* Default, no parameters.  
  - *Input:* None  
  - *Output:* Triggers downstream lead retrieval.  
  - *Failures:* None expected.  

- **Retrieve Lead Records from Google Sheets**  
  - *Type:* Google Sheets  
  - *Role:* Reads all lead data from a specific sheet (“sample_leads_50”) and tab (“outreach automation”).  
  - *Config:* Document ID and Sheet GID configured for the target spreadsheet. Uses OAuth2 credentials.  
  - *Key Variables:* Retrieves columns including Company Name, Contact Person, Email, Booking Status, etc.  
  - *Input:* Trigger from manual start.  
  - *Output:* Full lead list as JSON array for validation.  
  - *Failures:* API auth errors, sheet access issues, empty data.  

---

#### 1.2 Lead Validation and Filtering

**Overview:**  
Validates email format with regex, filters out invalid leads, and separates leads by booking status, forwarding only booked leads for email generation.

**Nodes Involved:**  
- Validate Lead Data Payload (If)  
- Filter for Booked Leads (If)  
- Log Invalid Leads to Google Sheets

**Node Details:**

- **Validate Lead Data Payload**  
  - *Type:* If Condition  
  - *Role:* Checks if each lead’s Email field matches a valid email regex pattern.  
  - *Config:* Regex pattern `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` ensures proper email format.  
  - *Input:* Lead records from Google Sheets.  
  - *Output:* Valid leads continue; invalid leads branch to logging.  
  - *Edge Cases:* Empty or malformed emails, regex evaluation errors.  

- **Filter for Booked Leads**  
  - *Type:* If Condition  
  - *Role:* Filters leads with “Booking Status” equal to “BOOKED.” Only these proceed to email generation.  
  - *Config:* Strict string equals “BOOKED” check on lead data.  
  - *Input:* Valid leads from previous node.  
  - *Output:* Leads matching status are processed; others bypass email generation.  
  - *Edge Cases:* Case sensitivity, missing “Booking Status” fields.  

- **Log Invalid Leads to Google Sheets**  
  - *Type:* Google Sheets (Append)  
  - *Role:* Stores invalid leads (e.g., invalid emails) in a separate sheet for quality tracking.  
  - *Config:* Target sheet unspecified (needs setup), OAuth2 credentials used.  
  - *Input:* Invalid leads from validation node.  
  - *Output:* Confirmation of logging.  
  - *Failures:* Missing or misconfigured target sheet.  

---

#### 1.3 AI-Powered Email Generation

**Overview:**  
Generates personalized outreach email content in HTML using GPT-4o based on lead details, then parses output into usable JSON for mailing.

**Nodes Involved:**  
- Configure GPT-4o Model (Azure OpenAI node)  
- Generate Personalized Outreach Email (AI) (Langchain Agent)  
- Parse AI Email Output (JavaScript)

**Node Details:**

- **Configure GPT-4o Model**  
  - *Type:* Azure OpenAI language model (GPT-4o)  
  - *Role:* Sets up GPT-4o as the AI engine for email generation.  
  - *Config:* Model set to “gpt-4o” with default options. Uses Azure OpenAI credentials.  
  - *Input:* None directly; used by downstream AI agent.  
  - *Output:* Provides model connection for AI node.  
  - *Edge Cases:* API key invalid, quota exceeded, network issues.  

- **Generate Personalized Outreach Email (AI)**  
  - *Type:* Langchain Agent (AI prompt)  
  - *Role:* Crafts a brief, warm, professional HTML email and subject line per lead data.  
  - *Config:* System message instructs tone, style, and JSON output format with “subject” and “body_html” keys. Prompt injects lead fields (Company Name, Contact Person, etc.) dynamically.  
  - *Input:* Valid booked leads, GPT-4o model configured.  
  - *Output:* Raw AI JSON output as string.  
  - *Edge Cases:* AI output missing keys, malformed JSON, rate limits.  

- **Parse AI Email Output (JavaScript)**  
  - *Type:* Code (JavaScript)  
  - *Role:* Cleans AI output by stripping markdown code blocks and parses JSON safely to extract subject and body.  
  - *Config:* Parses each item’s `output` string, handling parse errors gracefully.  
  - *Input:* Raw AI output.  
  - *Output:* Parsed JSON with keys `subject` and `body_html`.  
  - *Failures:* Malformed JSON from AI, empty output.  

---

#### 1.4 Initial Email Dispatch and Reply Monitoring

**Overview:**  
Sends the AI-generated outreach email through Gmail, waits 24 hours, then checks the email thread for client replies.

**Nodes Involved:**  
- Send Initial Outreach Email via Gmail  
- Wait Before Thread Check (24 hr)  
- Fetch Sent Email Thread from Gmail  
- Check for Client Reply (If Condition)

**Node Details:**

- **Send Initial Outreach Email via Gmail**  
  - *Type:* Gmail (Send Email)  
  - *Role:* Sends personalized email to lead’s address, stores Gmail thread ID for tracking.  
  - *Config:* Uses Gmail OAuth2 credentials; `sendTo`, `subject`, and `message` populated from parsed AI output and lead email.  
  - *Input:* Parsed AI email JSON and lead email.  
  - *Output:* Contains Gmail threadId for follow-up check.  
  - *Failures:* OAuth errors, invalid email addresses, Gmail API limits.  

- **Wait Before Thread Check (24 hr)**  
  - *Type:* Wait  
  - *Role:* Delays workflow execution for 24 hours to allow lead time to respond.  
  - *Config:* Amount set to 24 hours (86400 seconds).  
  - *Input:* After sending email.  
  - *Output:* Triggers email thread fetch.  
  - *Edge Cases:* Workflow interruptions during wait.  

- **Fetch Sent Email Thread from Gmail**  
  - *Type:* Gmail (Get Thread)  
  - *Role:* Retrieves the full email thread linked to the sent outreach to check replies.  
  - *Config:* Uses threadId from send email node; OAuth2 used.  
  - *Input:* Wait completion.  
  - *Output:* Email thread JSON including messages array.  
  - *Failures:* ThreadId invalid or expired, Gmail API errors.  

- **Check for Client Reply (If Condition)**  
  - *Type:* If Condition  
  - *Role:* Checks if the second message in the thread contains a reply indicating interest (e.g., contains “Yes”).  
  - *Config:* Inspects snippet of message index 1 for substring “Yes”.  
  - *Input:* Email thread JSON.  
  - *Output:* If reply found, proceed to extract reply; else send follow-up email.  
  - *Edge Cases:* False positives/negatives due to snippet content, thread with no second message.  

---

#### 1.5 Reply Handling and Lead Status Update

**Overview:**  
Extracts details from client reply and updates the lead record in Google Sheets with a “BOOKED” status, message, and timestamp.

**Nodes Involved:**  
- Extract Reply Details (JavaScript)  
- Update Lead Record – Booked (Google Sheets)

**Node Details:**

- **Extract Reply Details (JavaScript)**  
  - *Type:* Code (JavaScript)  
  - *Role:* Parses the client’s reply email snippet, extracts sender email, contact person, thread ID, subject, and cleans message content.  
  - *Config:* Removes quoted Gmail text heuristically (split on “On Wed” etc.) and prepares structured JSON with a booking status “BOOKED” and current timestamp.  
  - *Input:* Email thread with reply.  
  - *Output:* Clean JSON object for CRM update.  
  - *Edge Cases:* Unexpected snippet format, missing fields.  

- **Update Lead Record – Booked (Google Sheets)**  
  - *Type:* Google Sheets (Append or Update)  
  - *Role:* Updates lead row matching Email with new Booking Status “BOOKED”, client message, thread ID, and update timestamp.  
  - *Config:* Matching column: Email; maps relevant fields for update. OAuth2 credentials used.  
  - *Input:* Cleaned reply data.  
  - *Output:* Confirmation of update.  
  - *Failures:* Sheet access issues, concurrency conflicts.  

---

#### 1.6 Follow-Up Email and Second Reply Monitoring

**Overview:**  
If no reply after initial outreach, sends a polite follow-up email, waits another 24 hours, then fetches the follow-up thread to check for a second reply.

**Nodes Involved:**  
- Send Second Follow-Up Email via Gmail  
- Wait Before Second Thread Check (24 hr)  
- Fetch Follow-Up Thread from Gmail  
- Check for Second Reply (If Condition)

**Node Details:**

- **Send Second Follow-Up Email via Gmail**  
  - *Type:* Gmail (Send Email)  
  - *Role:* Sends a follow-up email with a polite tone encouraging response if the first message went unanswered.  
  - *Config:* Uses lead contact person’s name dynamically, fixed subject “Still open to a quick chat.” OAuth2 credentials.  
  - *Input:* Leads without positive first replies.  
  - *Output:* Gmail threadId for follow-up tracking.  
  - *Failures:* Same as initial email node.  

- **Wait Before Second Thread Check (24 hr)**  
  - *Type:* Wait  
  - *Role:* Waits 24 hours after follow-up email before checking for responses.  
  - *Config:* 24-hour delay set.  
  - *Input:* After sending follow-up email.  
  - *Output:* Triggers follow-up thread fetch.  

- **Fetch Follow-Up Thread from Gmail**  
  - *Type:* Gmail (Get Thread)  
  - *Role:* Retrieves the email thread for the follow-up message to check for new replies.  
  - *Config:* Uses threadId from follow-up email.  
  - *Input:* After wait.  
  - *Output:* Thread messages JSON.  
  - *Failures:* Invalid threadId, API rate limits.  

- **Check for Second Reply (If Condition)**  
  - *Type:* If Condition  
  - *Role:* Checks second message snippet for “Yes” indicating reply to follow-up.  
  - *Config:* Same substring check as first reply detection.  
  - *Input:* Follow-up thread JSON.  
  - *Output:* If reply found, proceed to extract and update; else mark as declined.  
  - *Edge Cases:* Same as first reply check.  

---

#### 1.7 Final Lead Status Update

**Overview:**  
Updates lead status to “BOOKED” if second reply exists or to “Declined” if no reply after follow-up.

**Nodes Involved:**  
- Extract Second Reply Details (JavaScript)  
- Update Lead Record – Replied (Google Sheets)  
- Update Lead Status to Declined (Set Node)  
- Update Lead Record – Declined (Google Sheets)

**Node Details:**

- **Extract Second Reply Details (JavaScript)**  
  - *Type:* Code (JavaScript)  
  - *Role:* Similar to first reply extraction; cleans and structures reply data from follow-up thread.  
  - *Config:* Same cleaning logic and fields as first extraction.  
  - *Input:* Follow-up thread with positive reply.  
  - *Output:* JSON for CRM update.  

- **Update Lead Record – Replied (Google Sheets)**  
  - *Type:* Google Sheets (Append or Update)  
  - *Role:* Updates lead record with “BOOKED” status and reply details from follow-up.  
  - *Config:* Matches by Email; updates relevant fields.  
  - *Failures:* Sheet write conflicts.  

- **Update Lead Status to Declined (Set Node)**  
  - *Type:* Set  
  - *Role:* Prepares JSON with “Booking Status” set to “Declined” and email for leads without replies.  
  - *Config:* Static assignment of “Declined” status.  
  - *Input:* Leads with no follow-up reply.  

- **Update Lead Record – Declined (Google Sheets)**  
  - *Type:* Google Sheets (Append or Update)  
  - *Role:* Updates lead’s status to “Declined” in Google Sheets to avoid further outreach.  
  - *Config:* Matches by Email; updates Booking Status field only.  

---

#### 1.8 Logging Invalid Leads

**Overview:**  
Stores leads rejected during validation due to invalid email or incomplete data into a dedicated Google Sheet for data hygiene and quality control.

**Nodes Involved:**  
- Log Invalid Leads to Google Sheets

**Node Details:**

- **Log Invalid Leads to Google Sheets**  
  - *Type:* Google Sheets (Append)  
  - *Role:* Appends invalid leads to a separate sheet (configuration needed) for review.  
  - *Config:* OAuth2 credentials; sheet and document ID require setup.  
  - *Input:* Leads failing validation step.  
  - *Output:* Confirmation of logging.  

---

### 3. Summary Table

| Node Name                              | Node Type                    | Functional Role                         | Input Node(s)                          | Output Node(s)                                 | Sticky Note                                                            |
|--------------------------------------|------------------------------|---------------------------------------|--------------------------------------|-----------------------------------------------|------------------------------------------------------------------------|
| When clicking ‘Execute workflow’      | Manual Trigger               | Workflow start trigger                 | None                                 | Retrieve Lead Records from Google Sheets       |                                                                        |
| Retrieve Lead Records from Google Sheets | Google Sheets               | Fetch lead data from spreadsheet      | When clicking ‘Execute workflow’      | Validate Lead Data Payload                      | ## 🧾 Retrieve Lead Records from Google Sheets                          |
| Validate Lead Data Payload             | If                          | Validate lead email format             | Retrieve Lead Records from Google Sheets | Filter for Booked Leads, Log Invalid Leads to Google Sheets | ## 🧩 Validate Lead Data Payload                                        |
| Filter for Booked Leads                | If                          | Filter leads by booking status         | Validate Lead Data Payload            | Generate Personalized Outreach Email (AI)      | ## 🎯 Filter for Booked Leads                                           |
| Log Invalid Leads to Google Sheets     | Google Sheets (Append)       | Log invalid leads                      | Validate Lead Data Payload (invalid) | None                                          | ## ⚠️ Log Invalid Leads to Google Sheets                                |
| Configure GPT-4o Model                 | Azure OpenAI (GPT-4o)        | Setup GPT model                        | None                                 | Generate Personalized Outreach Email (AI)      | ## ⚙️ Configure GPT-4o Model                                           |
| Generate Personalized Outreach Email (AI) | Langchain Agent             | Generate personalized email content   | Filter for Booked Leads, Configure GPT-4o Model | Parse AI Email Output                            | ## ✉️ Generate Personalized Outreach Email (AI)                       |
| Parse AI Email Output (JavaScript)    | Code (JavaScript)            | Clean and parse AI JSON output         | Generate Personalized Outreach Email (AI) | Send Initial Outreach Email via Gmail           | ## 🧠 Parse AI Email Output (JavaScript)                               |
| Send Initial Outreach Email via Gmail | Gmail Send Email             | Send initial outreach email            | Parse AI Email Output                 | Wait Before Thread Check (24 hr)                | ## 📤 Send Initial Outreach Email via Gmail                            |
| Wait Before Thread Check (24 hr)       | Wait                        | Delay 24 hours before checking replies | Send Initial Outreach Email via Gmail | Fetch Sent Email Thread from Gmail               | ## ⏱️ Wait Before Thread Check                                         |
| Fetch Sent Email Thread from Gmail     | Gmail Get Thread             | Retrieve email thread for initial email | Wait Before Thread Check (24 hr)     | Check for Client Reply (If Condition)            | ## 🧩 Check for Client Reply                                           |
| Check for Client Reply (If Condition)  | If                          | Check if client replied positively      | Fetch Sent Email Thread from Gmail   | Extract Reply Details, Send Second Follow-Up Email | ## 🧩 Check for Client Reply                                           |
| Extract Reply Details (JavaScript)     | Code (JavaScript)            | Parse and clean client reply details    | Check for Client Reply (true)         | Update Lead Record – Booked (Google Sheets)     | ## 📬 Extract Reply Details (JavaScript)                              |
| Update Lead Record – Booked (Google Sheets) | Google Sheets (Append/Update) | Update lead as BOOKED in sheet          | Extract Reply Details                 | None                                          | ## ✅ Update Lead Record – Booked (Google Sheets)                     |
| Send Second Follow-Up Email via Gmail  | Gmail Send Email             | Send polite follow-up email             | Check for Client Reply (false)        | Wait Before Second Thread Check (24 hr)          | ## 🔁 Send Second Follow-Up Email via Gmail                           |
| Wait Before Second Thread Check (24 hr) | Wait                        | Delay 24 hours before checking follow-up replies | Send Second Follow-Up Email via Gmail | Fetch Follow-Up Thread from Gmail                 | ## ⏱️ Wait Before Thread Check                                         |
| Fetch Follow-Up Thread from Gmail      | Gmail Get Thread             | Retrieve follow-up email thread          | Wait Before Second Thread Check       | Check for Second Reply (If Condition)             | ## 📨 Fetch Follow-Up Thread from Gmail                              |
| Check for Second Reply (If Condition)  | If                          | Check if client replied to follow-up    | Fetch Follow-Up Thread from Gmail     | Extract Second Reply Details, Update Lead Status to Declined | ## 🔍 Check for Second Reply                                          |
| Extract Second Reply Details (JavaScript) | Code (JavaScript)          | Parse second client reply details        | Check for Second Reply (true)          | Update Lead Record – Replied (Google Sheets)     | ## 🧾 Extract Second Reply Details (JavaScript)                      |
| Update Lead Record – Replied (Google Sheets) | Google Sheets (Append/Update) | Update lead status as BOOKED after follow-up | Extract Second Reply Details           | None                                          | ## ✅ Update Lead Record – Booked (Google Sheets)                     |
| Update Lead Status to Declined (Set Node) | Set                        | Prepare lead status as Declined          | Check for Second Reply (false)         | Update Lead Record – Declined (Google Sheets)     |                                                                        |
| Update Lead Record – Declined (Google Sheets) | Google Sheets (Append/Update) | Update lead status as Declined in sheet  | Update Lead Status to Declined          | None                                          | ## ❌ Update Lead Record – Declined (Google Sheets)                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger Node** named “When clicking ‘Execute workflow’” as the workflow entry point.

2. **Add a Google Sheets Node** named “Retrieve Lead Records from Google Sheets”:  
   - Operation: Read all rows  
   - Document ID: Set to the target Google Sheets document containing leads.  
   - Sheet Name: Select the specific sheet/tab with leads (e.g., “outreach automation”).  
   - Credentials: Configure Google Sheets OAuth2 credentials.  
   - Output: Lead records JSON with all necessary fields.

3. **Add an If Node** named “Validate Lead Data Payload”:  
   - Condition: Use regex to validate Email field: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`  
   - If true: proceed to next node.  
   - If false: connect to node that logs invalid leads.

4. **Add an If Node** named “Filter for Booked Leads”:  
   - Condition: Check if “Booking Status” equals “BOOKED” (case sensitive).  
   - If true: proceed to AI email generation.  
   - If false: do not proceed with email generation.

5. **Add a Google Sheets Node** named “Log Invalid Leads to Google Sheets”:  
   - Operation: Append  
   - Target sheet for invalid leads (create if missing).  
   - Credentials: Same Google Sheets OAuth2.

6. **Add an Azure OpenAI Node** named “Configure GPT-4o Model”:  
   - Model: “gpt-4o”  
   - Credentials: Azure OpenAI API key setup.

7. **Add a Langchain Agent Node** named “Generate Personalized Outreach Email (AI)”:  
   - Model: Use configured GPT-4o node.  
   - Prompt: Include lead details (Company Name, Contact Person, Job Title, Industry, Location, Lead Source, Booking Status).  
   - System Message: Instruct AI to generate short, warm, professional B2B outreach emails in JSON format with “subject” and “body_html” keys.  
   - Output: Raw AI JSON string.

8. **Add a Code Node** named “Parse AI Email Output (JavaScript)”:  
   - JavaScript: Remove markdown code fences and parse JSON safely.  
   - Output: Parsed JSON with subject and body_html.

9. **Add a Gmail Node** named “Send Initial Outreach Email via Gmail”:  
   - Operation: Send Email  
   - To: Lead Email from previous nodes.  
   - Subject and Message: Use parsed AI output.  
   - Credentials: Gmail OAuth2.  
   - Store threadId for follow-up.

10. **Add a Wait Node** named “Wait Before Thread Check (24 hr)”:  
    - Duration: 24 hours.

11. **Add a Gmail Node** named “Fetch Sent Email Thread from Gmail”:  
    - Operation: Get Thread  
    - ThreadId: From initial email send node.  
    - Credentials: Gmail OAuth2.

12. **Add an If Node** named “Check for Client Reply (If Condition)”:  
    - Condition: Check if second message snippet contains “Yes”.  
    - If true: Extract reply details.  
    - If false: Send follow-up email.

13. **Add a Code Node** named “Extract Reply Details (JavaScript)”:  
    - JavaScript: Parse reply message, clean quoted text, extract Email, Contact Person, ThreadID, Subject, ClientMessage, and mark BookingStatus as “BOOKED” with timestamp.

14. **Add a Google Sheets Node** named “Update Lead Record – Booked (Google Sheets)”:  
    - Operation: Append or Update  
    - Matching Column: Email  
    - Update booking status and reply details.  
    - Credentials: Google Sheets OAuth2.

15. **Add a Gmail Node** named “Send Second Follow-Up Email via Gmail”:  
    - Send polite follow-up email if no reply after first outreach.  
    - Use dynamic Contact Person and fixed subject.  
    - Credentials: Gmail OAuth2.

16. **Add a Wait Node** named “Wait Before Second Thread Check (24 hr)”:  
    - Duration: 24 hours.

17. **Add a Gmail Node** named “Fetch Follow-Up Thread from Gmail”:  
    - Operation: Get Thread  
    - ThreadId: From follow-up email send node.  
    - Credentials: Gmail OAuth2.

18. **Add an If Node** named “Check for Second Reply (If Condition)”:  
    - Condition: Check for “Yes” in second message snippet.  
    - If true: Extract second reply details.  
    - If false: Mark lead as declined.

19. **Add a Code Node** named “Extract Second Reply Details (JavaScript)”:  
    - Same logic as first reply extraction.

20. **Add a Google Sheets Node** named “Update Lead Record – Replied (Google Sheets)”:  
    - Update lead with “BOOKED” status after follow-up reply.

21. **Add a Set Node** named “Update Lead Status to Declined (Set Node)”:  
    - Assign Booking Status = “Declined” and Email from thread.

22. **Add a Google Sheets Node** named “Update Lead Record – Declined (Google Sheets)”:  
    - Update lead with “Declined” status in sheet.

23. **Connect all nodes respecting logical flow and error handling paths.**

24. **Configure all credentials:**
    - Azure OpenAI API key for GPT-4o.  
    - Google Sheets OAuth2 credentials with read/write access.  
    - Gmail OAuth2 credentials with send/read permissions.

25. **Test the workflow step-by-step with sample data before production use.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                   | Context or Link                                                                                                                                                                                                                 |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Automates personalized outreach, follow-ups, and lead status management directly from Google Sheets using GPT-4o and Gmail. Ideal for sales teams to automate email campaigns and CRM updates.                               | Core workflow summary and use case.                                                                                                                                                                                            |
| Pulls all lead data from the specified Google Sheet (“sample_leads_50”), including company name, contact person, job title, industry, and booking status. Acts as the entry point for the outreach campaign.                   | Data source setup.                                                                                                                                                                                                             |
| Ensures that each record has a valid email address format using regex. Invalid leads are logged separately to improve data quality.                                                                                         | Data validation and quality control.                                                                                                                                                                                          |
| Filters leads by “Booking Status” to only process those marked “BOOKED,” preventing outreach to already converted or declined leads.                                                                                        | Leads filtering logic.                                                                                                                                                                                                         |
| Azure OpenAI GPT-4o model is configured to generate professional and concise emails with contextual personalization.                                                                                                         | AI model configuration.                                                                                                                                                                                                       |
| GPT-4o generates short, friendly B2B outreach emails in clean HTML (<p>, <b>, <br> tags), signed as “Saurabh Garg, Sales Team,” with a clear call to action. Output is JSON with “subject” and “body_html” fields.              | AI email content generation instructions.                                                                                                                                                                                    |
| JavaScript code nodes clean AI output by removing markdown formatting and parsing JSON safely to prepare for email sending.                                                                                                  | AI output parsing and error handling.                                                                                                                                                                                        |
| Emails are sent via Gmail using OAuth2 credentials. Gmail thread IDs are stored to track replies and follow-ups.                                                                                                              | Email delivery and reply tracking.                                                                                                                                                                                           |
| Wait nodes introduce controlled delays (24 hours) before checking replies or sending follow-ups, ensuring natural response windows.                                                                                         | Timing and pacing of outreach.                                                                                                                                                                                               |
| Replies are detected by searching for “Yes” in the second message snippet of the Gmail thread, triggering booking status updates or follow-up emails accordingly.                                                           | Reply detection heuristic.                                                                                                                                                                                                   |
| JavaScript nodes extract and sanitize client reply details (email, message content, thread ID) before updating CRM records to maintain clean and current lead information.                                                    | Reply data extraction and CRM update preparation.                                                                                                                                                                           |
| Leads that reply to follow-up emails are marked “BOOKED,” while leads who do not respond after follow-up are marked “Declined” to avoid repeated outreach and maintain CRM hygiene.                                         | Final lead status management.                                                                                                                                                                                                |
| Invalid leads are recorded in a separate Google Sheet tab for later review and data cleansing.                                                                                                                              | Data quality tracking.                                                                                                                                                                                                       |
| Workflow uses standard OAuth2 credentials for Google Sheets and Gmail, and Azure OpenAI API keys for GPT-4o. Ensure these credentials have appropriate scopes and permissions configured.                                  | Credential and permission requirements.                                                                                                                                                                                     |
| For detailed GPT-4o prompt guidelines and best practices, see: https://learn.microsoft.com/en-us/azure/cognitive-services/openai/how-to/ prompts and https://platform.openai.com/docs/models/gpt-4o                           | External resource for AI prompt design.                                                                                                                                                                                     |

---

*Disclaimer: The text provided is exclusively generated from an automated n8n workflow process. It adheres strictly to content policies and contains no illegal or offensive content. All data handled is legal and public.*