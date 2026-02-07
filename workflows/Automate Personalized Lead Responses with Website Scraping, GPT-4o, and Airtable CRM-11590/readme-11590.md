Automate Personalized Lead Responses with Website Scraping, GPT-4o, and Airtable CRM

https://n8nworkflows.xyz/workflows/automate-personalized-lead-responses-with-website-scraping--gpt-4o--and-airtable-crm-11590


# Automate Personalized Lead Responses with Website Scraping, GPT-4o, and Airtable CRM

### 1. Workflow Overview

This workflow automates the process of responding instantly and personally to inbound lead form submissions on a website. Its key use case is for businesses that rely on inbound leads from forms (e.g., on websites or via CRM) and want to:

- Quickly check if a lead already exists in their CRM (Airtable),
- Scrape and analyze the lead’s company website to generate personalized insights,
- Compose and send a tailored follow-up email using AI (GPT-4o),
- Track appointment bookings (via Calendly email notifications),
- Update CRM records accordingly,
- Automate the entire "speed-to-lead" process to maximize conversion rates and reduce manual follow-up.

The workflow is logically divided into these main blocks:

**1.1 Lead Intake and Deduplication**  
- Receives inbound lead data via Webhook  
- Parses and normalizes the data  
- Checks if lead already exists in Airtable CRM  
- If existing, sends a courtesy email acknowledging prior inquiry  
- If new, creates a new CRM record

**1.2 Website Data Acquisition and Cleaning**  
- Scrapes the lead’s main website URL and optionally the /about page  
- Converts raw HTML responses to markdown  
- Cleans the markdown to remove noise, navigation, and irrelevant data

**1.3 AI-Powered Website Summarization**  
- Aggregates cleaned website data  
- Uses GPT-4o to extract key company information, metrics, clients, features, etc.  
- Updates the CRM record with the website summary

**1.4 Personalized Email Composition and Sending**  
- Uses GPT-4o to draft a personalized follow-up email based on website summary and lead goals  
- Sends the email to the lead via Gmail

**1.5 Appointment Booking Monitoring and CRM Update**  
- Watches Gmail inbox for Calendly booking confirmation emails  
- Extracts appointment date/time and lead email from booking email  
- Updates the corresponding CRM record with appointment details  
- Sends a confirmation email to the lead

---

### 2. Block-by-Block Analysis

---

#### 2.1 Lead Intake and Deduplication

**Overview:**  
This block listens for inbound lead submissions via a webhook, parses the incoming data, and checks whether the lead (by email or company name) already exists in Airtable. It branches depending on whether the lead is new or returning.

**Nodes Involved:**  
- Webhook  
- Parse Webhook Data  
- Key Value Pair (parser)  
- Check to see if record exist already (Airtable search)  
- have they filled a form already? (Switch)  
- Send a message (Gmail) — for returning leads  
- Create a record (Airtable) — for new leads

**Node Details:**

- **Webhook**  
  - Type: HTTP Webhook Trigger  
  - Role: Entry point, receives inbound form data  
  - Config: Path specified, listens continuously  
  - Inputs: External HTTP POST requests  
  - Outputs: Raw JSON payload  
  - Failures possible on HTTP errors or malformed payloads  

- **Parse Webhook Data**  
  - Type: Set node  
  - Role: Extracts and assigns raw JSON body for processing  
  - Config: Assigns `body` property from incoming payload  
  - Inputs: Webhook output  
  - Outputs: JSON with `body` field  
  - Edge cases: Payload may be nested or malformed

- **Key Value Pair**  
  - Type: Code node (JavaScript)  
  - Role: Robustly parses potentially wrapped or stringified payloads into a usable object  
  - Config: Custom JS function attempts JSON parse, array unwrapping, fallback  
  - Inputs: Parsed webhook data  
  - Outputs: Clean JSON object with lead fields (email, company, etc.)  
  - Failure: Throws error if payload cannot be parsed to object

- **Check to see if record exist already**  
  - Type: Airtable (Search)  
  - Role: Searches Airtable for existing leads by Email or Company Name (case insensitive)  
  - Config: Filter formula using `LOWER()` and input data fields  
  - Inputs: Lead data from parser  
  - Outputs: Found record(s) or empty  
  - Potential failures: Airtable API errors, rate limits, incorrect field config

- **have they filled a form already?**  
  - Type: Switch  
  - Role: Routes flow depending on whether the lead has an existing email record  
  - Config: Checks if `Email` field exists and is non-empty  
  - Inputs: Search result from Airtable  
  - Outputs: Two branches: yes (existing), no (new lead)

- **Send a message**  
  - Type: Gmail (Send Email)  
  - Role: Sends an email to leads who have already submitted an inquiry before  
  - Config: Personalized message referencing prior submission date and goals  
  - Inputs: Existing lead data from Airtable  
  - Outputs: None  
  - Failures: Gmail API auth issues, invalid email addresses

- **Create a record**  
  - Type: Airtable (Create)  
  - Role: Creates a new lead record with form submission details  
  - Config: Maps lead fields: Role, Email, Goals, Website, Names, Company  
  - Inputs: New lead data  
  - Outputs: Newly created Airtable record with Record ID  
  - Failures: Airtable API errors, missing required fields

---

#### 2.2 Website Data Acquisition and Cleaning

**Overview:**  
For new leads, the system scrapes their website homepage and about page (if available), converts HTML to markdown, and cleans it to remove clutter and extraneous UI elements.

**Nodes Involved:**  
- scrape website (HTTP Request)  
- Markdown (HTML to Markdown converter)  
- Clean markdown (Code node)  
- Scrape website about page (HTTP Request)  
- Markdown1 (HTML to Markdown converter)  
- Clean markdown1 (Code node)  
- Merge  
- Aggregate

**Node Details:**

- **scrape website**  
  - Type: HTTP Request  
  - Role: Fetches the lead's main website HTML  
  - Config: URL dynamically set from lead's Website field; custom headers mimic browser user-agent  
  - Inputs: Lead data from Airtable create record node  
  - Outputs: Raw HTML content  
  - Edge cases: Website down, redirects, non-HTML responses, timeouts  
  - On error: Continues with error output branch

- **Markdown**  
  - Type: Markdown converter node  
  - Role: Converts fetched HTML into markdown format to simplify text extraction  
  - Inputs: Raw HTML from scrape website  
  - Outputs: Markdown text string  

- **Clean markdown**  
  - Type: Code node (JS)  
  - Role: Cleans markdown using regex to remove images, links, URLs, navigation text, emails, repetitive punctuation, copyright notices, and UI artifacts  
  - Inputs: Markdown from Markdown node  
  - Outputs: Cleaned markdown text along with stats (original length, cleaned length, reduction %)  
  - Edge cases: Over-aggressive regex may remove relevant info; malformed markdown

- **Scrape website about page**  
  - Type: HTTP Request  
  - Role: Attempts to fetch the /about page of the lead’s website for more info  
  - Config: URL is lead's Website + "/about"  
  - Inputs: Lead data  
  - Outputs: Raw HTML or error (continues on error)  

- **Markdown1**  
  - Type: Markdown converter  
  - Role: Converts about page HTML to markdown  
  - Inputs: HTML from Scrape website about page  
  - Outputs: Markdown text  

- **Clean markdown1**  
  - Type: Code node (JS)  
  - Role: Same cleaning logic as Clean markdown, applied to about page markdown  
  - Inputs: Markdown1 output  
  - Outputs: Cleaned markdown1

- **Merge**  
  - Type: Merge node  
  - Role: Combines cleaned markdown from homepage and about page into one stream  
  - Inputs: Two inputs from Clean markdown and Clean markdown1  
  - Outputs: Combined dataset for aggregation

- **Aggregate**  
  - Type: Aggregate node  
  - Role: Aggregates all markdown data into a single field to pass to summarizer  
  - Inputs: Merged markdown items  
  - Outputs: Aggregated combined text

---

#### 2.3 AI-Powered Website Summarization

**Overview:**  
Uses OpenAI GPT-4o via the LangChain node to analyze cleaned website data and extract a detailed summary including company description, numbers, clients, features, testimonials, integrations, and social proof.

**Nodes Involved:**  
- Summarizer (OpenAI GPT-4o)  
- Add summary to airtable (Airtable update)

**Node Details:**

- **Summarizer**  
  - Type: LangChain OpenAI node  
  - Role: Takes aggregated website markdown data as input and prompts GPT-4o to generate a structured summary  
  - Config: Custom system prompt instructs GPT to extract exact numbers, names, testimonials, features, ratings, etc., and format all info into a concise summary field  
  - Inputs: Aggregated markdown text  
  - Outputs: JSON with `summary` field from GPT response  
  - Failures: API quota, network errors, prompt misinterpretation

- **Add summary to airtable**  
  - Type: Airtable (Update)  
  - Role: Updates the existing lead record with the AI-generated website summary  
  - Config: Uses Record ID from the created record, updates "Website summary" field  
  - Inputs: Output from Summarizer and Create a record nodes  
  - Outputs: Updated Airtable record  
  - Failures: Airtable API errors, invalid record ID

---

#### 2.4 Personalized Email Composition and Sending

**Overview:**  
Using the website summary and lead’s stated goals, this block generates a personalized follow-up email via GPT-4o and sends it via Gmail.

**Nodes Involved:**  
- Compose personalized email (OpenAI GPT-4o)  
- send email (Gmail)

**Node Details:**

- **Compose personalized email**  
  - Type: LangChain OpenAI node  
  - Role: Constructs a natural, brief, friendly, professional follow-up email using a strict template and inputs including website summary and lead’s goals  
  - Config: System prompt defines tone, structure, and variables to fill, including a specific compliment from the website summary  
  - Inputs: Website summary from Airtable update, lead’s notes/goals, and lead info  
  - Outputs: Email body text only, no signature or greeting  
  - Failures: API errors, output formatting issues, missing variables

- **send email**  
  - Type: Gmail node (Send)  
  - Role: Sends the personalized email to the lead’s email address  
  - Config: Subject dynamically includes lead’s first name, email text from GPT output, plain text format  
  - Inputs: Composed email text and recipient address from lead data  
  - Outputs: None  
  - Failures: Gmail OAuth errors, invalid email format, rate limits

---

#### 2.5 Appointment Booking Monitoring and CRM Update

**Overview:**  
This branch continuously watches the Gmail inbox for Calendly booking confirmation emails, extracts appointment info, updates the CRM record, and sends a confirmation email.

**Nodes Involved:**  
- Watch for booking email (Gmail Trigger)  
- Email from calendly? (Switch)  
- Booking email? (Switch)  
- Covert time to ISO (OpenAI GPT-4.1-mini)  
- Extract Appointment Date (Code node)  
- Search records1 (Airtable search)  
- Update record (Airtable update)  
- Send appointment confirmed (Gmail send)

**Node Details:**

- **Watch for booking email**  
  - Type: Gmail Trigger  
  - Role: Polls Gmail inbox every minute for new emails  
  - Config: No filters, continuous polling  
  - Outputs: Incoming emails

- **Email from calendly?**  
  - Type: Switch  
  - Role: Routes only emails from "Calendly <notifications@calendly.com>" to next node  
  - Inputs: Incoming Gmail emails  
  - Outputs: Calendly emails or others

- **Booking email?**  
  - Type: Switch  
  - Role: Filters Calendly emails with subject containing "New Event"  
  - Inputs: Calendly emails  
  - Outputs: Booking event emails or others

- **Covert time to ISO**  
  - Type: LangChain OpenAI GPT-4.1-mini  
  - Role: Extracts email and appointment datetime in ISO 8601 format from email snippet text  
  - Inputs: Booking email content snippet  
  - Outputs: JSON with keys `email` and `eventDateTime`  

- **Extract Appointment Date**  
  - Type: Code node  
  - Role: Parses JSON string output from AI, extracting email and eventDateTime keys cleanly  
  - Inputs: Output from Covert time to ISO  
  - Outputs: Parsed appointment details

- **Search records1**  
  - Type: Airtable (Search)  
  - Role: Finds lead record by email in Airtable to update appointment info  
  - Inputs: Extracted email from appointment data  
  - Outputs: Matching Airtable record

- **Update record**  
  - Type: Airtable (Update)  
  - Role: Updates the lead record with booked appointment date and marks “Booked appointment?” as true  
  - Inputs: Found record ID and appointment date  
  - Outputs: Updated Airtable record  

- **Send appointment confirmed**  
  - Type: Gmail (Send)  
  - Role: Sends confirmation email to the lead confirming the booked appointment date/time  
  - Inputs: Lead email, first name, and appointment date (formatted)  
  - Outputs: None  

---

### 3. Summary Table

| Node Name                     | Node Type                       | Functional Role                          | Input Node(s)                     | Output Node(s)                         | Sticky Note                                                                            |
|-------------------------------|--------------------------------|----------------------------------------|----------------------------------|---------------------------------------|----------------------------------------------------------------------------------------|
| Webhook                       | Webhook Trigger                | Entry point for inbound lead form      | -                                | Parse Webhook Data                    | ## Potential client fills out form on website                                         |
| Parse Webhook Data            | Set                            | Extracts JSON body from webhook        | Webhook                          | Key Value Pair                       |                                                                                        |
| key value pair                | Code                           | Parses wrapped/formatted payload JSON  | Parse Webhook Data               | Check to see if record exist already  |                                                                                        |
| Check to see if record exist already | Airtable Search              | Searches Airtable for existing lead    | key value pair                   | have they filled a form already?      | ## Check if this person has filled out a form before                                  |
| have they filled a form already? | Switch                        | Branch for existing vs new lead         | Check to see if record exist already | Send a message (existing), Create a record (new) |                                                                                        |
| Send a message                | Gmail Send                     | Email for already-inquired leads       | have they filled a form already? (existing branch) | This is whatever you use to notify your team | ## Send Already inquired email and notify team                                       |
| This is whatever you use to notify your team | NoOp                           | Placeholder for notification            | Send a message                  | -                                     |                                                                                        |
| Create a record              | Airtable Create                | Creates new lead record                 | have they filled a form already? (new branch) | scrape website, Scrape website about page |                                                                                        |
| scrape website               | HTTP Request                   | Scrapes lead's homepage                 | Create a record                 | Markdown, If website errors           | ## If new lead scrape website home page and about page if the about page exist         |
| If website errors            | Airtable Update                | Logs invalid website error in CRM      | scrape website (error output)   | Send a message2                      |                                                                                        |
| Markdown                     | Markdown Converter             | Converts homepage HTML to markdown      | scrape website                  | Clean markdown                      |                                                                                        |
| Clean markdown               | Code                           | Cleans and sanitizes homepage markdown | Markdown                      | Merge                              |                                                                                        |
| Scrape website about page    | HTTP Request                   | Scrapes /about page HTML                | Create a record                 | Markdown1                           |                                                                                        |
| Markdown1                    | Markdown Converter             | Converts about page HTML to markdown   | Scrape website about page       | Clean markdown1                    |                                                                                        |
| Clean markdown1              | Code                           | Cleans and sanitizes about page markdown | Markdown1                     | Merge                              |                                                                                        |
| Merge                       | Merge                          | Merges cleaned homepage and about markdown | Clean markdown, Clean markdown1 | Aggregate                          |                                                                                        |
| Aggregate                   | Aggregate                      | Aggregates all markdown content         | Merge                         | Summarizer                        |                                                                                        |
| Summarizer                  | LangChain OpenAI (GPT-4o)     | Summarizes website data into key points | Aggregate                     | Add summary to airtable            | ## Summarize website data add summary to CRM \n### Feed in markdown form the website into an llm that summarizes the info |
| Add summary to airtable      | Airtable Update                | Updates CRM record with website summary | Summarizer, Create a record     | Compose personalized email          |                                                                                        |
| Compose personalized email   | LangChain OpenAI (GPT-4o)     | Drafts personalized follow-up email    | Add summary to airtable          | send email                        | ## Use website summary to draft and send personalized email                          |
| send email                  | Gmail Send                    | Sends personalized email to lead       | Compose personalized email       | -                                 |                                                                                        |
| Watch for booking email      | Gmail Trigger                 | Watches inbox for booking emails        | -                              | Email from calendly?                | ## Watch inbox for calendly booking email                                            |
| Email from calendly?         | Switch                       | Filters emails from Calendly             | Watch for booking email          | Booking email?                     |                                                                                        |
| Booking email?               | Switch                       | Filters booking confirmation emails     | Email from calendly?             | Covert time to ISO                |                                                                                        |
| Covert time to ISO           | LangChain OpenAI (GPT-4.1-mini) | Extracts email and appointment datetime in ISO format | Booking email?                 | Extract Appointment Date           |                                                                                        |
| Extract Appointment Date     | Code                         | Parses JSON output from AI               | Covert time to ISO               | Search records1                   |                                                                                        |
| Search records1              | Airtable Search              | Finds lead record by email for updating | Extract Appointment Date         | Update record                    |                                                                                        |
| Update record               | Airtable Update              | Updates record with appointment details | Search records1                 | Send appointment confirmed        |                                                                                        |
| Send appointment confirmed   | Gmail Send                  | Sends appointment confirmation email    | Update record                   | -                               | ## Send email telling inquiry we got the booked appointment                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Webhook Node:**
   - Type: Webhook  
   - Configure path (e.g., `bcc30636-4ea2-4f2f-9ccf-ea0b7e81cfc0`)  
   - Set to listen for HTTP POST from inbound lead form submissions  

2. **Add a Set Node ("Parse Webhook Data"):**
   - Extract the `body` from webhook JSON payload for easier access  

3. **Add a Code Node ("key value pair"):**
   - Use JavaScript to robustly parse the payload (handle strings, arrays, nested JSON)  
   - Return parsed object with lead fields: email, company, first/last name, role, goals, website  

4. **Add Airtable Search Node ("Check to see if record exist already"):**
   - Connect credentials for Airtable API  
   - Configure base and table for inbound leads  
   - Filter formula: `=OR(LOWER({Email}) = "{{ $json.email.toLowerCase() }}", LOWER({Company Name}) = "{{ $json.company.toLowerCase() }}")`  

5. **Add a Switch Node ("have they filled a form already?"):**
   - Condition: Check if Email field exists and is non-empty  
   - Two outputs: true (existing lead), false (new lead)  

6. **For existing leads:**
   - Add Gmail Send Node ("Send a message"):  
     - Recipient: lead’s email  
     - Subject and body personalized referencing previous inquiry date and goals  
     - Connect Gmail OAuth2 credentials  

   - Optional NoOp Node to mark notification step (for team notifications)  

7. **For new leads:**
   - Add Airtable Create Node ("Create a record"):  
     - Map incoming lead data fields (Role, Email, Goals, Website, Names, Company)  
     - Store record ID for later use  

   - Add HTTP Request Node ("scrape website"):  
     - URL: `https://{{ $json.fields.Website }}`  
     - Use browser-like headers (User-Agent, Accept, etc.)  
     - Enable redirect following  
     - On error: continue with error branch  

   - Add Markdown Node: Convert website HTML to markdown  

   - Add Code Node ("Clean markdown"):  
     - Paste provided JavaScript cleaning code to remove noise, links, navigation, emails, etc.  

   - Add HTTP Request Node ("Scrape website about page"):  
     - URL: `https://{{ $json.fields.Website }}/about`  
     - Similar headers and redirect settings  
     - On error: continue  

   - Add Markdown Node ("Markdown1") and Code Node ("Clean markdown1") for about page cleaning (same as homepage)  

   - Add Merge Node to combine cleaned markdown from homepage and about page  

   - Add Aggregate Node to concatenate all markdown text into one string  

   - Add LangChain OpenAI Node ("Summarizer"):  
     - Model: GPT-4o  
     - System prompt instructing to extract company description, exact numbers, clients, features, testimonials, ratings, integrations, etc.  
     - Output JSON with `summary` field  

   - Add Airtable Update Node ("Add summary to airtable"):  
     - Update record using Record ID from created record  
     - Field: Website summary = summarizer output  

   - Add LangChain OpenAI Node ("Compose personalized email"):  
     - Model: GPT-4o  
     - System prompt with detailed email template and instructions to fill variables from website summary and lead goals  
     - Output: plain email body text only (no greeting/signature)  

   - Add Gmail Send Node ("send email"):  
     - Recipient: lead’s email  
     - Subject: includes lead’s first name  
     - Message: output from Compose personalized email  
     - Gmail OAuth2 credentials  

8. **Appointment Booking Monitoring Branch:**

   - Add Gmail Trigger Node ("Watch for booking email"):  
     - Poll every minute  
     - Gmail OAuth2 credentials  

   - Add Switch Node ("Email from calendly?"):  
     - Filter emails from `Calendly <notifications@calendly.com>`  

   - Add Switch Node ("Booking email?"):  
     - Filter emails where subject contains "New Event"  

   - Add LangChain OpenAI Node ("Covert time to ISO"):  
     - Model: GPT-4.1-mini  
     - Prompt to extract email and event date/time in ISO 8601 format from email snippet  

   - Add Code Node ("Extract Appointment Date"):  
     - Parses JSON string output from AI into clean JSON with email and eventDateTime  

   - Add Airtable Search Node ("Search records1"):  
     - Search by extracted email  

   - Add Airtable Update Node ("Update record"):  
     - Update "Booked appointment?" = true, "Appointment date" = extracted ISO datetime  

   - Add Gmail Send Node ("Send appointment confirmed"):  
     - Send confirmation email to lead’s email with appointment date formatted nicely  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                           | Context or Link                                                                                                                  |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------|
| This workflow is designed and shared by Jordan Austin.                                                                                                                                                                                                 | [Jordan Austin’s Profile on Skool](https://www.skool.com/ai-growth-lab-4394/about?ref=5065ab28874b4325b44ef3ead8105722)           |
| The workflow was originally tested with Lovable form builder; integration with other form tools may require additional formatting or intermediate tools like Zapier or Make.                                                                             | Lovable form integration note                                                                                                  |
| Replace all Airtable Base and Table IDs with your own to avoid connection errors.                                                                                                                                                                       | Critical setup requirement                                                                                                     |
| Ensure Gmail OAuth2 credentials have permissions to send emails and read inbox for booking notifications.                                                                                                                                               | Gmail API setup                                                                                                                |
| OpenAI API credentials must have access to GPT-4o and GPT-4.1-mini models; API quota and rate limits apply.                                                                                                                                              | OpenAI API usage constraints                                                                                                  |
| Video resource on setting up Google APIs is linked in workflow notes.                                                                                                                                                                                   | [YouTube Video on Google API Setup](https://youtube.com/shorts/FBRQNmCN0F8?feature=share)                                        |
| Airtable base structure includes fields for Contact info, Website, Goals, Website summary, Appointment date, Booked appointment flag, and Record ID.                                                                                                   | [Airtable Base Link](https://airtable.com/appdQOiJbMCveHwt4/shrQr4RjDfw1e2Tn3)                                                  |
| The cleaning JavaScript code aggressively removes navigation, social media, email addresses, URLs, and UI artifacts to maximize relevance for AI summarization.                                                                                      | Important to test for false positives in content removal                                                                      |
| Email templates enforce a professional, friendly, and casual tone—avoid generic or salesy language; compliments are based on specific extracted company data.                                                                                        | Email style instructions in Compose personalized email node                                                                    |

---

**Disclaimer:**  
The provided workflow and documentation were created exclusively using n8n automation. All content respects applicable content policies and contains no illegal, offensive, or protected material. All data processed is legal and publicly accessible.