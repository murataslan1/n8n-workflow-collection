Automate Lead Generation with Apollo, AI Parsing, and Timed Email Follow-ups

https://n8nworkflows.xyz/workflows/automate-lead-generation-with-apollo--ai-parsing--and-timed-email-follow-ups-9034


# Automate Lead Generation with Apollo, AI Parsing, and Timed Email Follow-ups

### 1. Workflow Overview

**Title:** Automate Lead Generation with Apollo, AI Parsing, and Timed Email Follow-ups

**Purpose:**  
This workflow automates the entire lead generation and outreach process, starting from defining lead search criteria, scraping lead data from Apollo via Apify, parsing and formatting the data using AI, storing leads in Google Sheets, sending initial outreach emails, and scheduling follow-up emails for non-responders. It targets businesses aiming to automate prospecting and email outreach with intelligent parsing and timed follow-ups, primarily in the health and wellness coaching domain.

**Logical Blocks:**

- **1.1 Lead Definition and Data Acquisition**  
  From user input or scheduled triggers, generates Apollo search URLs, executes scraping via Apify, retrieves raw lead data.

- **1.2 Data Parsing and Storage**  
  Uses AI agents to parse raw JSON lead data into structured fields, adds or updates leads in Google Sheets.

- **1.3 Initial Email Outreach**  
  Sends personalized outreach emails to leads marked as "not sent" in the sheet, updates status on successful sends.

- **1.4 Follow-up Email Scheduling and Processing**  
  Periodically checks for leads needing follow-up (based on a delay after initial email), sends follow-up emails, updates sheet accordingly.

- **1.5 Workflow Management and Control**  
  Includes scheduling triggers, delay generators for randomized timing, conditional checks for flow control, and manual or form-based triggers for starting the process.

---

### 2. Block-by-Block Analysis

#### 1.1 Lead Definition and Data Acquisition

**Overview:**  
This block handles the definition of lead search parameters, constructs a precise Apollo search URL, triggers the Apify scraping actor, and retrieves the raw lead data.

**Nodes Involved:**  
- `On form submission` (disabled)  
- `Apollo URL Generator`  
- `Run Apify`  
- `proper json`

**Node Details:**

- **On form submission**  
  - *Type:* Form Trigger (disabled)  
  - *Role:* Intended to receive lead search criteria from a form (e.g., job title, company size).  
  - *Configuration:* Form fields include Job Title, Company Size, Keywords, and Location.  
  - *Connections:* Output to `Apollo URL Generator`.  
  - *Edge Cases:* Disabled, so inactive; if enabled, requires correct form setup and webhook exposure.

- **Apollo URL Generator**  
  - *Type:* Chain LLM (Langchain)  
  - *Role:* Converts structured input (job title, size, keywords, location) into an Apollo search URL.  
  - *Configuration:* Custom prompt instructing to generate a valid Apollo people search URL with specific URL parameters only.  
  - *Connection:* Outputs URL to `Run Apify`.  
  - *Edge Cases:* URL syntax or parameter errors if input is malformed; requires API credentials for OpenAI.

- **Run Apify**  
  - *Type:* HTTP Request  
  - *Role:* Calls Apify actor API to run the Apollo scrape with generated URL, requesting 5 records including personal and work emails.  
  - *Configuration:* POST request with JSON body containing the URL and record count. Authentication via HTTP Basic with stored credential.  
  - *Connection:* Output JSON to `proper json`.  
  - *Edge Cases:* API rate limits, authentication failure, network timeouts, malformed URL.

- **proper json**  
  - *Type:* Code  
  - *Role:* Loads sample JSON data representing scraped leads for testing and development (mock data).  
  - *Configuration:* Outputs array of lead objects as individual items for downstream processing.  
  - *Connection:* Outputs to `Parse Lead Data1`.  
  - *Edge Cases:* None; used for testing.

---

#### 1.2 Data Parsing and Storage

**Overview:**  
Parses raw lead JSON into structured fields (name, email, title, LinkedIn, company) using AI, synthesizes summaries, and inserts or updates the Google Sheet with lead data.

**Nodes Involved:**  
- `Parse Lead Data1`  
- `AI Agent`  
- `Parse Lead Data`  
- `AI Agent` (another instance)  
- `Structured Output Parser` & `Structured Output Parser1`  
- `Add to Google Sheet`  
- `Add to Google Sheet1`  
- `If` (email presence check)  
- `If2` (duplicate email check)

**Node Details:**

- **Parse Lead Data1**  
  - *Type:* Chain LLM  
  - *Role:* Parses individual raw lead JSON into key fields plus a professional summary.  
  - *Configuration:* Custom prompt instructs extraction of fields with fallback to null, plus summary generation.  
  - *Connection:* Output to `Structured Output Parser1`. On error, continues.  
  - *Edge Cases:* Parsing errors, malformed input.

- **Structured Output Parser1**  
  - *Type:* Structured Output Parser  
  - *Role:* Validates and structures AI output as JSON matching schema with keys like fullName, email, title, LinkedIn, companyName, companyWebsite.  
  - *Connection:* Output to `If2`.

- **If2**  
  - *Type:* Conditional  
  - *Role:* Checks if the lead's email matches any existing email in the sheet to avoid duplicates.  
  - *Configuration:* Condition compares current item with sheet data.  
  - *Connection:* True path leads to `Loop Over Items` for batch processing; False path ends.  
  - *Edge Cases:* Missing or malformed emails.

- **Loop Over Items**  
  - *Type:* Split in Batches  
  - *Role:* Iterates over parsed leads to append or update in Google Sheet.  
  - *Connection:* Outputs to `Add to Google Sheet1`.

- **Add to Google Sheet1**  
  - *Type:* Google Sheets  
  - *Role:* Appends or updates lead data in the sheet, marking status as "not sent" and setting follow-up status.  
  - *Configuration:* Uses email as unique key for upsert.  
  - *Edge Cases:* Credential failures, API rate limits.

- **Parse Lead Data** (parallel parsing for different data flow)  
  - *Type:* Chain LLM  
  - *Role:* Similar parsing as `Parse Lead Data1` but for a different flow; extracts key data and summary.  
  - *Connection:* Output to `Structured Output Parser`.

- **Structured Output Parser**  
  - *Type:* Structured Output Parser  
  - *Role:* Validates AI output JSON for the initial outreach flow.  
  - *Connection:* Output to `Add to Google Sheet`.

- **Add to Google Sheet**  
  - *Type:* Google Sheets  
  - *Role:* Appends or updates lead data in sheet, marking status as "not sent".  
  - *Edge Cases:* Same as above.

- **If**  
  - *Type:* Conditional  
  - *Role:* Checks if the extracted lead email is non-empty before continuing to send email.  
  - *Edge Cases:* Empty or missing emails.

- **AI Agent**  
  - *Type:* Agent (Langchain)  
  - *Role:* Generates personalized email content using a fixed email template, inserting the lead's name and tailored messaging.  
  - *Configuration:* Uses OpenAI GPT-4 mini model with fixed prompt.  
  - *Connection:* Output to `OpenAI Chat Model` and further to `Send message`.  
  - *Edge Cases:* API failures, prompt errors.

---

#### 1.3 Initial Email Outreach

**Overview:**  
Sends initial personalized outreach emails to leads marked as "not sent" and updates the sheet to mark the lead as contacted with timestamp.

**Nodes Involved:**  
- `Get row(s) in sheet`  
- `Wait`  
- `AI Agent`  
- `OpenAI Chat Model`  
- `Send a message`  
- `Update row in sheet`

**Node Details:**

- **Get row(s) in sheet**  
  - *Type:* Google Sheets  
  - *Role:* Retrieves the first lead row with Status = "not sent" for outreach.  
  - *Configuration:* Filter on Status column.  
  - *Connection:* Output to `Wait`.  
  - *Edge Cases:* Empty result if no leads to send.

- **Wait**  
  - *Type:* Wait  
  - *Role:* Introduces delay before sending to spread load, delay time derived from `delayMinutes` variable (randomized).  
  - *Connection:* Output to `AI Agent`.  
  - *Edge Cases:* Long delays could block throughput.

- **AI Agent**  
  - *Role:* Generates the outreach email content.  
  - *Connection:* Output to `OpenAI Chat Model`.

- **OpenAI Chat Model**  
  - *Type:* Chat Completion  
  - *Role:* Runs GPT-4 mini to finalize email content.  
  - *Connection:* Output to `Send a message`.

- **Send a message**  
  - *Type:* Gmail (OAuth)  
  - *Role:* Sends email to the lead's email with personalized subject and body.  
  - *Configuration:* Subject includes lead's first name, body from AI output; credentials configured.  
  - *Connection:* Output to `Update row in sheet`.  
  - *Edge Cases:* Email sending failures, invalid email addresses.

- **Update row in sheet**  
  - *Type:* Google Sheets  
  - *Role:* Updates lead row marking Status = "sent" and logging date/time of email sent.  
  - *Edge Cases:* API failures, concurrency issues.

---

#### 1.4 Follow-up Email Scheduling and Processing

**Overview:**  
Periodically checks for leads with pending follow-up, delays sending follow-up emails with randomized timing, sends personalized follow-up messages, and updates lead sheet accordingly.

**Nodes Involved:**  
- `Schedule Trigger`  
- `Delay generator`  
- `Delay` (Wait)  
- `Get row(s) in sheet1`  
- `Time checker`  
- `If1`  
- `AI Agent1`  
- `Send a message1`  
- `Update row in sheet1`

**Node Details:**

- **Schedule Trigger**  
  - *Type:* Scheduled Trigger  
  - *Role:* Triggers workflow every 100 minutes to process follow-ups.  
  - *Edge Cases:* Timing conflicts or overlaps.

- **Delay generator** (and `Delay`)  
  - *Type:* Code and Wait  
  - *Role:* Generates random delay (5-20 minutes) before sending follow-up to avoid burst.  
  - *Edge Cases:* Delay too long blocking timely follow-up.

- **Get row(s) in sheet1**  
  - *Type:* Google Sheets  
  - *Role:* Retrieves lead rows with Followed up = "not sent".  
  - *Edge Cases:* Empty results.

- **Time checker**  
  - *Type:* Code  
  - *Role:* Checks if at least 2 days have passed since initial email (Date sent) to qualify for follow-up.  
  - *Outputs:* `canSend` flag and days passed.  
  - *Edge Cases:* Date format parsing errors, missing dates.

- **If1**  
  - *Type:* Conditional  
  - *Role:* Only proceeds if `canSend` is true.  
  - *Edge Cases:* False negatives prevent sending.

- **AI Agent1**  
  - *Type:* Agent  
  - *Role:* Generates personalized follow-up email content, reminding about previous outreach and benefits of AI automation.  
  - *Edge Cases:* API failures.

- **Send a message1**  
  - *Type:* Gmail  
  - *Role:* Sends follow-up email with customized subject.  
  - *Edge Cases:* Email failures.

- **Update row in sheet1**  
  - *Type:* Google Sheets  
  - *Role:* Marks lead as "Followed up = sent" to avoid duplicate follow-ups.  
  - *Edge Cases:* API failures.

---

#### 1.5 Workflow Management and Control

**Overview:**  
Manages execution triggers, manual starts, batching, and limits, orchestrating the flow and controlling execution rate.

**Nodes Involved:**  
- `Schedule Trigger` & `Schedule Trigger1`  
- `Manual Trigger` (`When clicking Execute`)  
- `Limit` (disabled)  
- `Loop Over Items`  
- `If` and `If2` for flow control  
- `Delay generator` and `Delay generator1` for random time delays  
- `Sticky Note` nodes for documentation and notes

**Node Details:**

- **Manual Trigger**  
  - *Role:* Allows manual start of the workflow for testing or ad-hoc runs.

- **Limit** (disabled)  
  - *Role:* Intended to limit processing to max items, but disabled.

- **Loop Over Items**  
  - *Role:* Processes leads in batches for performance management.

- **Delay Generators**  
  - *Role:* Generate randomized delays to distribute email sending and API calls.

- **Sticky Notes**  
  - Provide documentation and user guidance directly in the workflow UI.

---

### 3. Summary Table

| Node Name             | Node Type                        | Functional Role                              | Input Node(s)           | Output Node(s)          | Sticky Note                                                  |
|-----------------------|---------------------------------|---------------------------------------------|-------------------------|-------------------------|--------------------------------------------------------------|
| On form submission     | Form Trigger                    | Receives lead criteria from form input      |                         | Apollo URL Generator     |                                                              |
| Apollo URL Generator   | Chain LLM                      | Generates Apollo search URL                  | On form submission      | Run Apify               |                                                              |
| Run Apify             | HTTP Request                   | Runs Apify actor to scrape leads             | Apollo URL Generator    | proper json             |                                                              |
| proper json           | Code                          | Provides sample JSON lead data                | Run Apify               | Parse Lead Data1        |                                                              |
| Parse Lead Data1      | Chain LLM                     | Parses raw JSON to structured lead fields    | proper json             | Structured Output Parser1|                                                              |
| Structured Output Parser1 | Structured Output Parser    | Validates AI output JSON                      | Parse Lead Data1        | If2                     |                                                              |
| If2                   | Conditional                   | Checks for duplicate emails                   | Structured Output Parser1| Loop Over Items          |                                                              |
| Loop Over Items       | Split in Batches              | Processes leads in batches                     | If2                     | Add to Google Sheet1    |                                                              |
| Add to Google Sheet1  | Google Sheets                | Inserts or updates leads in sheet              | Loop Over Items          |                         |                                                              |
| Parse Lead Data       | Chain LLM                     | Parses raw JSON for initial outreach          | proper json variant     | Structured Output Parser |                                                              |
| Structured Output Parser | Structured Output Parser    | Validates AI output JSON                       | Parse Lead Data          | Add to Google Sheet      |                                                              |
| Add to Google Sheet   | Google Sheets                | Inserts or updates leads in sheet              | Structured Output Parser |                         |                                                              |
| Get row(s) in sheet   | Google Sheets                | Fetches leads with Status = "not sent"        |                         | Wait                    |                                                              |
| Wait                  | Wait                         | Delays to distribute sending                  | Get row(s) in sheet     | AI Agent                 |                                                              |
| AI Agent              | Agent                        | Generates personalized email content          | Wait                    | OpenAI Chat Model        |                                                              |
| OpenAI Chat Model     | Chat Completion              | Finalizes email text with GPT-4                | AI Agent                | Send a message           |                                                              |
| Send a message        | Gmail                        | Sends initial outreach email                    | OpenAI Chat Model       | Update row in sheet      |                                                              |
| Update row in sheet   | Google Sheets                | Marks lead as emailed (Status = "sent")        | Send a message          |                         |                                                              |
| Schedule Trigger      | Scheduled Trigger            | Triggers follow-up workflow every 100 minutes |                         | Delay generator          |                                                              |
| Delay generator       | Code                         | Generates randomized delay for follow-up       | Schedule Trigger        | Wait                    |                                                              |
| Wait                  | Wait                         | Waits for randomized delay before follow-up    | Delay generator         | Get row(s) in sheet1     |                                                              |
| Get row(s) in sheet1  | Google Sheets                | Fetches leads with Followed up = "not sent"    |                         | Time checker             |                                                              |
| Time checker          | Code                         | Checks if 2 days passed since email sent        | Get row(s) in sheet1    | If1                      |                                                              |
| If1                   | Conditional                  | Proceeds only if follow-up delay elapsed        | Time checker            | AI Agent1                |                                                              |
| AI Agent1             | Agent                        | Creates follow-up email content                  | If1                     | Send a message1          |                                                              |
| Send a message1       | Gmail                        | Sends follow-up email                            | AI Agent1               | Update row in sheet1     |                                                              |
| Update row in sheet1  | Google Sheets                | Marks lead as followed up                         | Send a message1         |                         |                                                              |
| Delay generator1      | Code                         | Generates randomized delay before initial send  | Schedule Trigger1       | Wait                    |                                                              |
| Schedule Trigger1     | Scheduled Trigger            | Triggers initial email sending every 100 mins   |                         | Delay generator1         |                                                              |
| Get row(s) in sheet2  | Google Sheets                | Retrieves data for parsing                        |                         | proper json              |                                                              |
| Structured Output Parser | Structured Output Parser    | Validates parsed lead data                        | Parse Lead Data          | Add to Google Sheet      |                                                              |
| Parse Lead Data1      | Chain LLM                    | Parses individual lead JSON                       | proper json             | Structured Output Parser1|                                                              |
| If                    | Conditional                 | Checks lead email presence before sending email | Parse Lead Data1         | AI Agent                 |                                                              |
| Sticky Note           | Sticky Note                 | Documentation and instructions                    |                         |                         | See sections 1.1 and 1.4 for usage details                   |
| Sticky Note1          | Sticky Note                 | Notes on timing, usage, and customization          |                         |                         | Explains delay strategy, follow-up timing, and requirements  |

---

### 4. Reproducing the Workflow from Scratch

**Step 1: Setup Credentials**  
- Create Google Sheets OAuth credential linked to your target spreadsheet.  
- Setup Gmail OAuth credential for sending emails.  
- Setup HTTP Basic Authentication credential for Apify API (Apify token).  
- Setup OpenAI API credential with your OpenAI API key.

---

**Step 2: Lead Acquisition Flow**

1. **Add a "Manual Trigger" node** named `When clicking Execute` for manual start.  
2. **Add a "Google Sheets" node** named `Get row(s) in sheet2`.  
   - Operation: Read rows.  
   - Sheet: Your leads sheet, filter none (or as required).  
   - Credentials: Google Sheets OAuth.  
3. **Add a "Code" node** named `proper json` to simulate or load sample JSON data for parsing.  
   - Paste sample JSON array representing leads from Apollo scrape (or connect to Apify output).  
4. **Add a "Chain LLM" node** named `Parse Lead Data1`.  
   - Use custom prompt to extract lead fields (Full Name, Email, Title, LinkedIn, Company Name, Website).  
   - Enable error continuation.  
   - Connect input as JSON from `proper json`.  
5. **Add a "Structured Output Parser" node** named `Structured Output Parser1`.  
   - Define JSON schema matching parsed fields.  
6. **Add an "If" node** named `If2`.  
   - Condition: Check if parsed lead email matches existing sheet emails to avoid duplicates.  
7. **Add a "Split In Batches" node** named `Loop Over Items` to process leads in manageable chunks.  
8. **Add a "Google Sheets" node** named `Add to Google Sheet1`.  
   - Operation: Append or update using Email as unique key.  
   - Map extracted fields to respective columns.  
9. Connect nodes accordingly: `When clicking Execute` → `Get row(s) in sheet2` → `proper json` → `Parse Lead Data1` → `Structured Output Parser1` → `If2` → `Loop Over Items` → `Add to Google Sheet1`.

---

**Step 3: Apollo Scrape and Parsing**

1. **Add a "Form Trigger" node** named `On form submission` (optional).  
2. **Add a "Chain LLM" node** named `Apollo URL Generator`.  
   - Prompt to generate Apollo search URL from form data (job title, location, size, keywords).  
3. **Add an "HTTP Request" node** named `Run Apify`.  
   - POST to Apify actor URL with JSON body containing URL and record count.  
   - Use HTTP Basic Auth credentials.  
4. **Add a "Chain LLM" node** named `Parse Lead Data`.  
   - Prompt for extracting lead data and summary from raw JSON.  
5. **Add a "Structured Output Parser" node** named `Structured Output Parser`.  
   - Validate parsed output.  
6. **Add a "Google Sheets" node** named `Add to Google Sheet`.  
   - Append or update leads with Status "not sent".  
7. Connect: `On form submission` → `Apollo URL Generator` → `Run Apify` → `Parse Lead Data` → `Structured Output Parser` → `Add to Google Sheet`.

---

**Step 4: Initial Email Outreach**

1. **Add a "Scheduled Trigger" node** named `Schedule Trigger1`.  
   - Interval every 100 minutes.  
2. **Add a "Code" node** named `Delay generator1`.  
   - Script to generate random delay (5-20 minutes).  
3. **Add a "Wait" node** named `Wait`.  
   - Wait for `delayMinutes` from the code node.  
4. **Add a "Google Sheets" node** named `Get row(s) in sheet`.  
   - Fetch first lead with Status = "not sent".  
5. **Add an "Agent" node** named `AI Agent`.  
   - Generates email content using fixed template with lead's name.  
6. **Add an "OpenAI Chat Model" node** for finalizing email content.  
7. **Add a "Gmail" node** named `Send a message` to send the email.  
8. **Add a "Google Sheets" node** named `Update row in sheet`.  
   - Update lead Status to "sent" and record send date/time.  
9. Connect nodes accordingly: `Schedule Trigger1` → `Delay generator1` → `Wait` → `Get row(s) in sheet` → `AI Agent` → `OpenAI Chat Model` → `Send a message` → `Update row in sheet`.

---

**Step 5: Follow-up Email Processing**

1. **Add a "Scheduled Trigger" node** named `Schedule Trigger`.  
   - Interval every 100 minutes.  
2. **Add a "Code" node** named `Delay generator`.  
   - Generates random delay (5-20 minutes).  
3. **Add a "Wait" node** named `Wait` for delay.  
4. **Add a "Google Sheets" node** named `Get row(s) in sheet1`.  
   - Fetch leads where Followed up = "not sent".  
5. **Add a "Code" node** named `Time checker`.  
   - Checks if ≥2 days passed since Date sent. Outputs `canSend` flag.  
6. **Add an "If" node** named `If1`.  
   - Only proceed if `canSend` true.  
7. **Add an "Agent" node** named `AI Agent1`.  
   - Generates follow-up email content.  
8. **Add a "Gmail" node** named `Send a message1`.  
   - Sends follow-up email.  
9. **Add a "Google Sheets" node** named `Update row in sheet1`.  
   - Marks lead as Followed up = "sent".  
10. Connect nodes as: `Schedule Trigger` → `Delay generator` → `Wait` → `Get row(s) in sheet1` → `Time checker` → `If1` → `AI Agent1` → `Send a message1` → `Update row in sheet1`.

---

**Step 6: Workflow Notes and Documentation**

- Add `Sticky Note` nodes near major sections for documentation and user instructions.  
- Include notes about credential setup, usage, and limitations (e.g., Apify membership required).

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                      | Context or Link                                                                                                                        |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| The workflow runs hourly with randomized delay to spread load and avoid API throttling.                                                                                                                                          | Workflow operation principle                                                                                                          |
| Records exact date/time of outreach emails for tracking and scheduling follow-ups after 2 days automatically.                                                                                                                   | Follow-up logic                                                                                                                       |
| Requires active Apify membership and API key to run scraping actor; costs approx. $1.20 per 1000 leads plus monthly fees.                                                                                                       | Cost considerations, API requirements                                                                                                |
| Uses Apollo platform for lead search; URL generated by AI based on user input.                                                                                                                                                    | Lead source integration                                                                                                              |
| Google Sheets used as CRM to store and manage leads, track statuses, and avoid duplicate outreach.                                                                                                                               | Data storage and deduplication                                                                                                       |
| Emails sent via configured Gmail OAuth, personalized through AI-generated templates.                                                                                                                                             | Email outreach methodology                                                                                                           |
| Follow-ups are triggered only if lead was emailed >2 days ago and not yet followed up; delayed randomly to avoid bursts.                                                                                                         | Follow-up timing and throttling                                                                                                      |
| Customizable: can extend to other CRMs or notification platforms (Slack, SMS), modify timing, add more conditional branches or enrich AI prompts.                                                                                | Extensibility note                                                                                                                   |
| Apollo scraping actor used: https://console.apify.com/actors/jljBwyykqr (example; actual endpoint to be replaced).                                                                                                               | Actor reference                                                                                                                      |
| Note: The `proper json` node contains sample data for testing; in production, connect Apify output instead.                                                                                                                      | Development tip                                                                                                                      |
| AI prompts designed to produce strict JSON output for reliable parsing. Failures in AI output may cause data loss; error handling configured to continue.                                                                          | AI reliability and error handling                                                                                                   |
| Delay generators use randomized wait times between 5 and 20 minutes to throttle request and email sends.                                                                                                                        | Rate limiting strategy                                                                                                              |

---

**Disclaimer:** The content analyzed is from an automated n8n workflow respecting all policy guidelines. All data processed is public or test data. No illegal or harmful content is included.