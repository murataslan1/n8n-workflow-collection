Automate B2B Lead Generation & Email Campaigns with Google Maps, SendGrid & AI

https://n8nworkflows.xyz/workflows/automate-b2b-lead-generation---email-campaigns-with-google-maps--sendgrid---ai-8269


# Automate B2B Lead Generation & Email Campaigns with Google Maps, SendGrid & AI

### 1. Workflow Overview

This workflow automates B2B lead generation and email campaigns by integrating data extraction from Google Maps, lead filtering, email personalization, and multi-stage email outreach using SendGrid and Gmail, enhanced with AI-powered classification. It targets sales and marketing teams aiming to streamline lead collection, validation, and automated follow-up sequences.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & Lead Extraction:** Handles form submissions or manual triggers, runs web scraping actors to gather lead data, and processes raw data into usable lead information.

- **1.2 Lead Filtering & Preparation:** Filters leads with valid emails, extracts and cleans email addresses, and prepares lead data for campaign.

- **1.3 Email Campaign Execution:** Manages email template retrieval, random selection, personalization, and sending via SendGrid, including pacing with wait nodes.

- **1.4 Gmail Inbox Engagement Monitoring:** Periodically checks Gmail inbox for replies or interactions, classifies engagements using AI, and updates lead statuses.

- **1.5 Email Stage Routing & Database Updates:** Routes leads through different email campaign stages (original, follow-ups), updates Google Sheets databases, and applies Gmail labels accordingly.

- **1.6 Support Utilities:** Includes batching, merging, waiting, and fallback nodes to handle rate limits, retries, and error handling.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Lead Extraction

**Overview:**  
This block initiates lead generation either via a form submission webhook or manual trigger. It uses Apify actors to scrape Google Maps or similar sources, then retrieves dataset items for processing.

**Nodes Involved:**  
- On form submission (Form Trigger)  
- Run an Actor (Apify node)  
- Get dataset items (Apify node)  
- Grab Desired Fields (Set node)  
- Limit (Limit node)  

**Node Details:**

- **On form submission**  
  - Type: Form Trigger  
  - Role: Starts workflow on user form submission  
  - Config: Default webhook, listens for HTTP POST with form data  
  - Output: Leads raw data to "Run an Actor"  
  - Failures: Webhook misconfiguration, network issues  

- **Run an Actor**  
  - Type: Apify Node  
  - Role: Runs an Apify actor to scrape B2B leads (e.g., Google Maps)  
  - Config: Uses preconfigured actor on Apify platform  
  - Inputs: Form data from trigger  
  - Outputs: Dataset ID for subsequent retrieval  
  - Failures: Actor runtime errors, Apify API limits, auth errors  

- **Get dataset items**  
  - Type: Apify Node  
  - Role: Retrieves scraped data from Apify dataset  
  - Config: Uses dataset ID from previous node  
  - Outputs: Raw lead records array  
  - Failures: Dataset not found, API errors  

- **Grab Desired Fields**  
  - Type: Set (Data transformation)  
  - Role: Extracts specific fields (e.g., company name, website) from raw data  
  - Config: Set node fields configured to map raw data keys to usable keys  
  - Outputs: Cleaned lead data  
  - Failures: Missing fields or unexpected data structure  

- **Limit**  
  - Type: Limit  
  - Role: Restricts number of leads processed per execution to control rate  
  - Config: Default limit (can be configured)  
  - Outputs: Limited lead list  

---

#### 2.2 Lead Filtering & Preparation

**Overview:**  
Processes leads to ensure they contain valid email addresses, extracts emails from text or websites, and prepares leads for email campaign batching.

**Nodes Involved:**  
- Loop Over Items (SplitInBatches)  
- Filter Leads with Email only (Filter)  
- Extract Email Address (Code)  
- Grab Desired Fields1 (Set)  
- Append row in sheet (Google Sheets)  

**Node Details:**

- **Loop Over Items**  
  - Type: SplitInBatches  
  - Role: Process leads in manageable batches for downstream steps  
  - Config: Batch size set for rate limiting and resource control  
  - Outputs: Individual lead items  

- **Filter Leads with Email only**  
  - Type: Filter  
  - Role: Filters leads to pass only those with email fields present  
  - Config: Expression to check if email field is not empty or valid format  
  - Outputs: Leads with valid emails  

- **Extract Email Address**  
  - Type: Code (JavaScript)  
  - Role: Parses text fields or website content to extract email addresses  
  - Config: Custom regex or parsing logic  
  - Outputs: Leads with extracted emails  
  - Failures: Parsing errors, malformed input  

- **Grab Desired Fields1**  
  - Type: Set  
  - Role: Finalizes lead data structure for storage or sending  
  - Config: Sets or modifies fields as needed for campaign  
  - Outputs: Prepared leads  

- **Append row in sheet**  
  - Type: Google Sheets  
  - Role: Stores leads in Google Sheets database for tracking  
  - Config: Sheet ID, worksheet, and field mappings configured  
  - Failures: Google API auth errors, rate limits  

---

#### 2.3 Email Campaign Execution

**Overview:**  
Retrieves email templates from Google Sheets, selects a random template per lead, personalizes the content, sends emails via SendGrid, and implements pacing/waiting between sends.

**Nodes Involved:**  
- Parse Email Template from DB (Google Sheets)  
- Pick a random template (Code)  
- Fix Variables (Set)  
- Send an email (SendGrid)  
- Wait (Wait)  

**Node Details:**

- **Parse Email Template from DB**  
  - Type: Google Sheets  
  - Role: Reads email templates stored in a Google Sheet  
  - Config: Sheet and range parameters targeting templates  
  - Outputs: Template list  

- **Pick a random template**  
  - Type: Code  
  - Role: Selects one template randomly for personalization  
  - Config: JavaScript random selection logic  

- **Fix Variables**  
  - Type: Set  
  - Role: Sets or replaces placeholders with lead-specific variables (e.g., name, company)  
  - Config: Expressions like `{{$json["leadName"]}}`  

- **Send an email**  
  - Type: SendGrid  
  - Role: Sends personalized email to lead  
  - Config: SendGrid API credentials, sender, subject, body set dynamically  
  - Failures: API errors, quota exceeded, invalid emails  

- **Wait**  
  - Type: Wait  
  - Role: Introduces delay between email sends to avoid spamming or rate limit triggers  
  - Config: Delay duration (seconds or minutes)  

---

#### 2.4 Gmail Inbox Engagement Monitoring

**Overview:**  
Periodically fetches emails from Gmail inbox, filters replies related to campaigns, classifies engagement status with AI, and triggers appropriate follow-up actions.

**Nodes Involved:**  
- Schedule Trigger (multiple)  
- Get many messages (Gmail)  
- Email reply only (Filter)  
- Extract unprocessed emails (Merge)  
- Classify Engagements (Code)  
- OpenAI Chat Model (AI classification)  

**Node Details:**

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Runs workflow on schedule (e.g., every few hours) to poll Gmail inbox  
  - Config: Cron or interval schedule  

- **Get many messages (20)**  
  - Type: Gmail  
  - Role: Retrieves up to 20 recent emails matching campaign criteria  
  - Config: Label filters, query parameters  
  - Failures: Gmail API auth errors, quota limits  

- **Email reply only**  
  - Type: Filter  
  - Role: Filters emails that are replies to campaign messages  
  - Config: Checks for "In-Reply-To" header or similar  

- **Extract unprocessed emails**  
  - Type: Merge  
  - Role: Consolidates new replies for processing  

- **Classify Engagements**  
  - Type: Code  
  - Role: Applies custom logic to determine if engagement is positive, negative, or neutral  

- **OpenAI Chat Model**  
  - Type: AI Language Model (LangChain OpenAI)  
  - Role: Uses OpenAI GPT model to classify email content sentiment or intent  
  - Config: OpenAI API key, prompt templates  
  - Failures: API errors, rate limits, model response errors  

---

#### 2.5 Email Stage Routing & Database Updates

**Overview:**  
Routes leads through email stages (Original, Follow-Up 1, Follow-Up 2), applies Gmail labels based on engagement, updates Google Sheets tracking databases, and manages timing for next stage emails.

**Nodes Involved:**  
- Route Email Stages (Switch)  
- Original DB Update (Google Sheets)  
- Follow-Up 1 DB Update (Google Sheets)  
- Follow-Up 2 DB Update (Google Sheets)  
- Create email labels (AI Text Classifier)  
- Label Interested / Not Interested / Misc (Gmail)  
- Update DB nodes (multiple Google Sheets updates)  

**Node Details:**

- **Route Email Stages**  
  - Type: Switch  
  - Role: Directs leads to appropriate follow-up based on email engagement status  
  - Config: Conditions based on lead email stage field  

- **Original / Follow-Up DB Updates**  
  - Type: Google Sheets  
  - Role: Updates lead status and activity timestamps in tracking sheets  

- **Create email labels**  
  - Type: AI Text Classifier  
  - Role: Classifies lead email replies into categories (Interested, Not Interested, Misc) for labeling  

- **Label Interested / Not Interested / Misc**  
  - Type: Gmail  
  - Role: Applies Gmail labels for sorting and workflow management  

- **Update DB nodes**  
  - Type: Google Sheets  
  - Role: Various updates for lead conversion and campaign progress  

---

#### 2.6 Support Utilities

**Overview:**  
Includes batching, merging, waiting, no-operation nodes for flow control, error handling, and rate limiting throughout the workflow.

**Nodes Involved:**  
- Loop Over Items (multiple SplitInBatches)  
- Merge (multiple Merge nodes)  
- Wait (multiple Wait nodes)  
- No Operation, do nothing (NoOp nodes)  

**Node Details:**

- **Loop Over Items**  
  - Breaks large arrays into smaller batches for processing  

- **Merge**  
  - Combines parallel branches or data arrays for consolidated processing  

- **Wait**  
  - Delays execution to comply with API rate limits or pacing  

- **No Operation, do nothing**  
  - Used as fallbacks or to gracefully handle empty or irrelevant branches  

---

### 3. Summary Table

| Node Name                          | Node Type                  | Functional Role                         | Input Node(s)                             | Output Node(s)                              | Sticky Note                                  |
|-----------------------------------|----------------------------|---------------------------------------|------------------------------------------|---------------------------------------------|----------------------------------------------|
| On form submission                | Form Trigger               | Start on form submission               | -                                        | Run an Actor                                |                                              |
| Run an Actor                     | Apify                      | Run scraping actor                     | On form submission                       | Get dataset items                           |                                              |
| Get dataset items                | Apify                      | Retrieve scraped leads                 | Run an Actor                            | Grab Desired Fields                         |                                              |
| Grab Desired Fields              | Set                        | Extract relevant lead data             | Get dataset items                       | Limit                                       |                                              |
| Limit                           | Limit                      | Limit leads per execution              | Grab Desired Fields                     | Loop Over Items                             |                                              |
| Loop Over Items                 | SplitInBatches             | Batch processing of leads              | Limit                                  | Filter Leads with Email only, Parse url/website |                                              |
| Filter Leads with Email only    | Filter                     | Filter leads having emails             | Loop Over Items1                       | Grab Desired Fields1                         |                                              |
| Extract Email Address           | Code                       | Extract emails from data               | Loop Over Items1                       | Wait1                                       |                                              |
| Grab Desired Fields1            | Set                        | Prepare lead data for storage          | Filter Leads with Email only            | Append row in sheet                          |                                              |
| Append row in sheet             | Google Sheets              | Store lead data                        | Grab Desired Fields1                    | -                                           |                                              |
| Parse url/website               | Set                        | Normalize URLs                         | Loop Over Items                        | Remove Query Parameters & Fragments          |                                              |
| Remove Query Parameters & Fragments | Code                    | Clean URLs                            | Parse url/website                      | User-Agents                                  |                                              |
| User-Agents                    | Set                        | Set User-Agent header for requests    | Remove Query Parameters & Fragments    | Website Scraping                             |                                              |
| Website Scraping               | HTTP Request               | Scrape website for emails              | User-Agents                           | Markdown                                     |                                              |
| Markdown                      | Markdown                   | Format scraped content                 | Website Scraping                      | Random Wait                                  |                                              |
| Random Wait                   | Wait                       | Random delay for scraping              | Markdown                             | Merge                                        |                                              |
| Merge                        | Merge                      | Combine batches                        | Random Wait, Loop Over Items          | Loop Over Items1                             |                                              |
| Loop Over Items1              | SplitInBatches             | Batch processing                      | Merge                                | Filter Leads with Email only, Extract Email Address |                                              |
| Wait1                        | Wait                       | Delay after email extraction           | Extract Email Address                | Merge1                                       |                                              |
| Merge1                       | Merge                      | Combine filtered leads                  | Loop Over Items1, Wait1              | -                                           |                                              |
| Parse Email Template from DB  | Google Sheets              | Retrieve email templates                | Loop Over Items2                     | Pick a random template                        |                                              |
| Pick a random template        | Code                       | Select random email template            | Parse Email Template from DB         | Merge2                                       |                                              |
| Merge2                       | Merge                      | Combine template with lead data         | Pick a random template, Fix Variables | Send an email                                |                                              |
| Fix Variables                | Set                        | Personalize email content               | Merge2                             | Send an email                                |                                              |
| Send an email                | SendGrid                   | Send email via SendGrid                 | Fix Variables                      | Wait                                         |                                              |
| Wait                        | Wait                       | Wait after sending email                | Send an email                      | Loop Over Items2                             |                                              |
| Loop Over Items2             | SplitInBatches             | Batch email sending                     | Wait                               | Parse Email Template from DB, Merge2          |                                              |
| Get Leads                   | Google Sheets              | Retrieve leads for sending              | Manual Trigger                     | Email Not Sent (Not Delivered)               |                                              |
| Email Not Sent (Not Delivered) | If                         | Filter leads where email not delivered  | Get Leads                        | Limit1, No Operation                          |                                              |
| Limit1                      | Limit                      | Limit leads not delivered               | Email Not Sent (Not Delivered)      | Loop Over Items2                             |                                              |
| Email reply only             | Filter                     | Filter emails that are replies          | Get many messages (Gmail)          | Extract unprocessed emails                   |                                              |
| Get many messages (20)       | Gmail                      | Fetch recent emails                     | Schedule Trigger                   | Email reply only                             |                                              |
| Extract unprocessed emails   | Merge                      | Merge new replies for processing        | Email reply only, Get Reply_Message_Id | Loop Over Items3                             |                                              |
| Loop Over Items3             | SplitInBatches             | Batch process email replies             | Extract unprocessed emails          | Parse items with Extract ID only, Extract ID |
| Extract ID                  | Code                       | Extract unique ID from email data       | Loop Over Items3                  | Edit Fields                                  |                                              |
| Edit Fields                 | Set                        | Prepare email reply data                 | Extract ID                       | Loop Over Items3                             |                                              |
| Parse items with Extract ID only | Set                    | Filter items with valid IDs              | Loop Over Items3                  | Update Email Workflow DB, Switch1, Update Processed Gmail IDs DB |
| Update Email Workflow DB    | Google Sheets              | Update email workflow records            | Parse items with Extract ID only  | Switch1                                      |                                              |
| Switch1                    | Switch                     | Route leads by email stage               | Parse items with Extract ID only  | Original Email, 1st Follow-Up Email, 2nd Follow-Up Email |
| Original Email             | Google Sheets              | Retrieve original email template         | Switch1                         | -                                           |                                              |
| 1st Follow-Up Email        | Google Sheets              | Retrieve 1st follow-up email template    | Switch1                         | -                                           |                                              |
| 2nd Follow-Up Email        | Google Sheets              | Retrieve 2nd follow-up email template    | Switch1                         | -                                           |                                              |
| Personalize Email          | Set                        | Personalize follow-up email content      | Merge4                          | Send an email2                               |                                              |
| Send an email2             | SendGrid                   | Send follow-up emails                     | Personalize Email               | Wait4                                        |                                              |
| Wait4                      | Wait                       | Wait between follow-up emails            | Send an email2                  | Loop Over Items4                             |                                              |
| Loop Over Items4           | SplitInBatches             | Batch follow-up 1 email sending           | 5 Days & 10 Days Route           | Get Follow-Up Email Template from DB, Merge4 |
| Get Follow-Up Email Template from DB | Google Sheets       | Get follow-up email templates             | Loop Over Items4                | Pick a random template2                       |                                              |
| Pick a random template2    | Code                       | Pick random follow-up template            | Get Follow-Up Email Template from DB | Merge4                                    |                                              |
| Personalize Email1         | Set                        | Personalize second follow-up email        | Merge5                         | Send an email1                               |                                              |
| Send an email1             | SendGrid                   | Send second follow-up emails               | Personalize Email1             | Wait5                                        |                                              |
| Wait5                      | Wait                       | Wait between second follow-up emails      | Send an email1                 | Loop Over Items5                             |                                              |
| Loop Over Items5           | SplitInBatches             | Batch second follow-up email sending       | 5 Days & 10 Days Route          | Get 2nd Follow-Up Email Template From DB, Merge5 |
| Get 2nd Follow-Up Email Template From DB | Google Sheets      | Get 2nd follow-up email templates           | Loop Over Items5                | Pick a random template1                       |                                              |
| Pick a random template1    | Code                       | Pick random 2nd follow-up template          | Get 2nd Follow-Up Email Template From DB | Merge5                                   |                                              |
| Route Email Stages         | Switch                     | Route leads through email campaign stages | Wait2                         | Original DB Update, Follow-Up 1 DB Update, Follow-Up 2 DB Update |
| Original DB Update         | Google Sheets              | Update DB after original email             | Route Email Stages             | -                                           |                                              |
| Follow-Up 1 DB Update      | Google Sheets              | Update DB after first follow-up            | Route Email Stages             | -                                           |                                              |
| Follow-Up 2 DB Update      | Google Sheets              | Update DB after second follow-up           | Route Email Stages             | -                                           |                                              |
| Create email labels        | AI Text Classifier         | Classify email replies into categories     | OpenAI Chat Model, Only Emails with ID | Label Interested, Label Not Interested, Label Misc |
| Label Interested           | Gmail                      | Label emails as interested                   | Create email labels            | Update DB4, Forward Emails (Sales Dept), Leads Converted |
| Label Not Interested       | Gmail                      | Label emails as not interested               | Create email labels            | Update DB1                                  |                                              |
| Label Misc                 | Gmail                      | Label miscellaneous emails                   | Create email labels            | Update DB2                                  |                                              |
| Update DB4                 | Google Sheets              | Update DB for interested leads               | Label Interested               | -                                           |                                              |
| Forward Emails (Sales Dept) | SplitInBatches            | Forward important emails to sales dept       | Label Interested               | Email Structure                              |                                              |
| Email Structure            | Code                       | Construct forwarded email structure           | Forward Emails (Sales Dept)    | Send a message                               |                                              |
| Send a message             | Gmail                      | Send forwarded email                           | Email Structure               | Forward Emails (Sales Dept)                   |                                              |
| Leads Converted            | SplitInBatches             | Batch process leads converted                   | Label Interested               | Edit Fields1                                 |                                              |
| Edit Fields1               | Set                        | Prepare converted leads data                      | Leads Converted               | Update DB3                                   |                                              |
| Update DB3                 | Google Sheets              | Update DB after conversion                        | Edit Fields1                  | Leads Converted (second output)               |                                              |
| Schedule Trigger           | Schedule Trigger           | Trigger periodic Gmail inbox polling             | -                            | Get many messages (20), Get Reply_Message_Id |                                              |
| Get Reply_Message_Id       | Google Sheets              | Get message IDs of replied emails                | Schedule Trigger              | Extract unprocessed emails                     |                                              |
| Get Route_Message_Id       | Google Sheets              | Get routing message IDs                            | Schedule Trigger1             | Extract unprocessed emails1                    |                                              |
| Schedule Trigger1          | Schedule Trigger           | Trigger secondary periodic Gmail polling          | -                            | Get many messages (20)1, Get Route_Message_Id |                                              |
| Schedule Trigger2          | Schedule Trigger           | Trigger lead grab for sending follow-ups           | -                            | Grab Lead from DB                              |                                              |
| Grab Lead from DB          | Google Sheets              | Retrieve leads for follow-up campaigns             | Schedule Trigger2             | Email Delivered But No Replied                  |                                              |
| Email Delivered But No Replied | If                       | Filter leads that received email but no reply      | Grab Lead from DB             | Email Opened Or Clicked, No Operation, do nothing4 |
| Email Opened Or Clicked    | If                         | Check if email was opened or clicked                 | Email Delivered But No Replied | 5 Days & 10 Days Route, No Operation, do nothing3 |
| 5 Days & 10 Days Route     | Switch                     | Route leads based on days since last email           | Email Opened Or Clicked       | Loop Over Items4, Loop Over Items5              |
| No Operation, do nothing   | NoOp                       | Fallback node                                          | Various                      | -                                           |                                              |
| No Operation, do nothing1  | NoOp                       | Fallback node                                          | Switch                      | -                                           |                                              |
| No Operation, do nothing2  | NoOp                       | Fallback node                                          | Only Emails with ID          | -                                           |                                              |
| No Operation, do nothing3  | NoOp                       | Fallback node                                          | Email Opened Or Clicked      | -                                           |                                              |
| No Operation, do nothing4  | NoOp                       | Fallback node                                          | Email Delivered But No Replied | -                                         |                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes:**  
   - Add a *Form Trigger* node named "On form submission" to accept lead data from a form.  
   - Add a *Manual Trigger* node named "When clicking ‘Execute workflow’" for manual start.

2. **Lead Extraction:**  
   - Add an *Apify* node "Run an Actor" configured with your Apify actor ID for lead scraping. Connect from form trigger.  
   - Add *Apify* node "Get dataset items" to retrieve scraped data using dataset ID from previous node.

3. **Data Cleaning:**  
   - Add *Set* node "Grab Desired Fields" to map and extract fields like company name, website, etc.  
   - Add *Limit* node to restrict number of leads per run.  
   - Connect to *SplitInBatches* node "Loop Over Items" to batch process leads.

4. **Lead Filtering:**  
   - Add *Filter* node "Filter Leads with Email only" to pass leads with valid email.  
   - Add *Code* node "Extract Email Address" to parse emails from text/website.  
   - Add *Set* node "Grab Desired Fields1" to finalize lead data.  
   - Add *Google Sheets* node "Append row in sheet" to record leads.  

5. **Website Scraping (Optional):**  
   - Add *Set* node "Parse url/website" to clean URLs.  
   - Add *Code* node "Remove Query Parameters & Fragments" to sanitize URLs.  
   - Add *Set* node "User-Agents" to set HTTP headers.  
   - Add *HTTP Request* node "Website Scraping" to scrape websites for emails.  
   - Add *Markdown* node for formatting scraped content and a *Wait* node for pacing.  
   - Merge outputs back into lead flow.

6. **Email Campaign Setup:**  
   - Add *Google Sheets* node "Parse Email Template from DB" with your email templates sheet.  
   - Add *Code* node "Pick a random template" for random selection.  
   - Add *Set* node "Fix Variables" to apply lead-specific variable replacements.  
   - Add *SendGrid* node "Send an email" with API credentials for sending emails.  
   - Add *Wait* node to space out emails.  

7. **Email Follow-Up:**  
   - Add *SplitInBatches* nodes for batch sending of follow-up emails.  
   - Add *Google Sheets* nodes for retrieving follow-up email templates and updating DBs.  
   - Add corresponding *Code* nodes to pick random templates.  
   - Add *Set* nodes to personalize follow-up emails.  
   - Add *SendGrid* nodes to send follow-ups, followed by *Wait* nodes.

8. **Gmail Inbox Monitoring:**  
   - Add *Schedule Trigger* nodes to poll Gmail periodically.  
   - Add *Gmail* nodes "Get many messages (20)" to fetch recent emails.  
   - Add *Filter* nodes "Email reply only" to isolate campaign replies.  
   - Add *Merge* nodes to collate unprocessed emails.  
   - Add *Code* node "Classify Engagements" with logic to categorize replies.  
   - Add *OpenAI Chat Model* node for AI-based classification (requires OpenAI credentials).  

9. **Email Stage Routing:**  
   - Add *Switch* node "Route Email Stages" to direct leads to original or follow-ups based on status.  
   - Add Google Sheets nodes to update lead statuses for each stage.  
   - Add *AI Text Classifier* node "Create email labels" to categorize replies.  
   - Add *Gmail* nodes to apply labels ("Interested", "Not Interested", "Misc").  
   - Add nodes to forward interested leads to sales team with email construction and sending.

10. **Support & Flow Control:**  
    - Use *SplitInBatches* nodes to manage processing batch size.  
    - Use *Merge* nodes to combine data flows.  
    - Use *Wait* nodes to avoid rate limits.  
    - Use *No Operation* nodes as placeholders or error handling branches.

11. **Credentials Setup:**  
    - Configure Apify API credentials.  
    - Configure Google Sheets credentials with access to proper spreadsheets.  
    - Configure SendGrid API credentials with appropriate sender identity.  
    - Configure Gmail OAuth2 credentials with required scopes.  
    - Configure OpenAI API credentials for AI nodes.

12. **Testing & Deployment:**  
    - Test each block individually.  
    - Validate webhook triggers and scheduled executions.  
    - Monitor logs for errors such as auth failures, API limits, or data parsing issues.  

---

### 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                                                                   |
|-------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| This workflow integrates Google Maps lead scraping via Apify actors and Google Sheets for DB.    | Workflow design focuses on combining web scraping, data processing, and email automation.       |
| SendGrid is used for outbound email sending, Gmail API for inbox monitoring and label management.| Requires API credentials and proper OAuth scopes for Gmail and Google Sheets.                    |
| AI-powered classification uses OpenAI GPT models via n8n LangChain nodes for email intent analysis.| See official OpenAI API docs for rate limits and best practices: https://platform.openai.com/docs|
| Rate limiting and batching nodes are essential to avoid API overuse and maintain deliverability. | Use Wait and Limit nodes carefully to comply with SendGrid and Gmail API policies.               |
| Email templates and lead data are stored and managed in Google Sheets, enabling easy updates.    | Keep sheets organized and ensure data consistency for smooth operation.                          |

---

This document fully describes the structure, logic, and reproduction steps for the "Automate B2B Lead Generation & Email Campaigns with Google Maps, SendGrid & AI" workflow, enabling advanced users and automation agents to understand, replicate, and extend it effectively.

---

**Disclaimer:** The text provided is generated exclusively from an n8n workflow automation. All processed data is legal and public, respecting current content policies.