Automate Sales Outreach & Response Management with GPT-4o, Brevo & NocoDB

https://n8nworkflows.xyz/workflows/automate-sales-outreach---response-management-with-gpt-4o--brevo---nocodb-10128


# Automate Sales Outreach & Response Management with GPT-4o, Brevo & NocoDB

### 1. Workflow Overview

This workflow automates sales outreach and response management by integrating GPT-4o AI, Brevo (Sendinblue), and NocoDB. It is designed for sales and marketing teams to efficiently engage leads, classify incoming emails, generate AI-driven responses, and track engagement metrics to optimize communication strategies. The workflow handles lead scoring, re-engagement scheduling, manual reviews, and analytics reporting.

The workflow logic is grouped into these main blocks:

- **1.1 Lead Management & Scoring:** Retrieves active leads, calculates score decay and updates scores, schedules re-engagements, and processes lead status.
- **1.2 Incoming Email Processing & Classification:** Listens for incoming Gmail messages, parses data, finds leads by email, classifies intent via GPT-4o, and routes responses accordingly.
- **1.3 AI Response Generation & Sending:** Generates AI-based email responses, delays for natural timing, sends replies via Gmail, and logs interactions.
- **1.4 Sales Outreach Campaign:** Periodically triggers batch outreach to top leads, generates personalized emails, sends initial outreach via Brevo/HTTP, and logs outreach activities.
- **1.5 Engagement Event Logging & Manual Review:** Logs engagement events from Brevo webhook data, updates engagement scores, flags special cases for manual review, and notifies sales team.
- **1.6 Analytics & Reporting:** Aggregates interaction and outreach data, generates analytics reports, and stores results for sales insights.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Lead Management & Scoring

**Overview:**  
This block retrieves active leads and top leads, manages lead scoring with decay and updates, schedules re-engagement if needed, and updates lead statuses.

**Nodes Involved:**  
- Daily Trigger  
- Get All Active Leads  
- Process in Batches  
- Calculate Score Decay  
- Update Lead Scores  
- Needs Re-engagement? (IF)  
- Schedule Re-engagement  
- Update Lead Status  
- Get Top 10 Leads  
- Loop Over Leads  

**Node Details:**

- **Daily Trigger**  
  - Type: Cron Trigger  
  - Role: Fires daily to start lead score recalculation  
  - Config: Default daily schedule  
  - Input: None  
  - Output: Triggers "Get All Active Leads"  
  - Failures: Cron misconfiguration or system downtime  

- **Get All Active Leads**  
  - Type: NocoDB Node  
  - Role: Fetches all leads currently active for outreach  
  - Config: Selects leads with active status  
  - Input: Trigger from Daily Trigger  
  - Output: Leads list to Process in Batches  
  - Failures: Database connectivity or query errors  

- **Process in Batches**  
  - Type: Split In Batches  
  - Role: Processes leads in manageable chunks  
  - Config: Batch size default or configured  
  - Input: Leads array  
  - Output: Each batch to "Calculate Score Decay" or end of processing to "Collect All Results"  
  - Failures: Batch size misconfiguration, data issues  

- **Calculate Score Decay**  
  - Type: Code  
  - Role: Applies decay logic to lead scores based on elapsed time or inactivity  
  - Config: Custom JS code implementing decay formula  
  - Input: Batch of leads  
  - Output: Updated scores to "Update Lead Scores"  
  - Failures: Code errors, invalid data input  

- **Update Lead Scores**  
  - Type: NocoDB  
  - Role: Persists updated lead scores back to DB  
  - Input: Updated scores from code node  
  - Output: Leads to "Needs Re-engagement?" decision node  
  - Failures: Database write failures  

- **Needs Re-engagement?** (IF)  
  - Type: IF  
  - Role: Determines if leads require re-engagement based on scores or other flags  
  - Input: Updated lead data  
  - Output: Yes to "Schedule Re-engagement", No back to "Process in Batches" for next batch  
  - Failures: Logic errors or missing fields  

- **Schedule Re-engagement**  
  - Type: NocoDB  
  - Role: Creates or updates re-engagement tasks/schedules for leads  
  - Input: Leads flagged for re-engagement  
  - Output: Loops back to batch processing for continuous updates  
  - Failures: DB write errors  

- **Update Lead Status**  
  - Type: NocoDB  
  - Role: Updates lead statuses post outreach or engagement  
  - Input: Leads from outreach logging  
  - Output: Loops over leads for next operations  
  - Failures: DB update failures  

- **Get Top 10 Leads**  
  - Type: NocoDB  
  - Role: Retrieves top scoring leads for outreach batch  
  - Input: Hourly Trigger  
  - Output: Leads to "Loop Over Leads"  
  - Failures: Query errors  

- **Loop Over Leads**  
  - Type: Split In Batches  
  - Role: Processes lead batches for outreach preparation  
  - Output branches to product info, previous correspondence, and template fetching  
  - Failures: Batch or data errors  

---

#### 2.2 Incoming Email Processing & Classification

**Overview:**  
Handles incoming Gmail messages, extracts lead info, finds the lead in DB, classifies the intent of the email using GPT-4o, and routes the workflow based on intent.

**Nodes Involved:**  
- Gmail Webhook  
- Parse Response Data (Code)  
- Find Lead by Email (NocoDB)  
- AI Intent Classification (OpenAI Langchain)  
- Route By Response Type (Switch)  

**Node Details:**

- **Gmail Webhook**  
  - Type: Gmail Trigger  
  - Role: Listens for incoming emails in the sales inbox  
  - Config: OAuth2 credential for Gmail account  
  - Output: Passes email data to parsing node  
  - Failures: Auth errors, Gmail API quota limits  

- **Parse Response Data**  
  - Type: Code  
  - Role: Extracts relevant fields (email, body, subject) from Gmail webhook payload  
  - Output: Transformed data to "Find Lead by Email"  
  - Failures: Unexpected payload formats  

- **Find Lead by Email**  
  - Type: NocoDB  
  - Role: Queries leads table by sender email address  
  - Output: Leads found passed to AI Intent Classification  
  - Failures: DB query errors, missing email field  

- **AI Intent Classification**  
  - Type: OpenAI Langchain (GPT-4o)  
  - Role: Classifies email intent into categories (e.g., unsubscribe, out of office, review needed)  
  - Config: Prompt templates designed for intent classification  
  - Input: Email content and context  
  - Output: Intent category to "Route By Response Type"  
  - Failures: API call failures, rate limits, malformed prompts  

- **Route By Response Type**  
  - Type: Switch  
  - Role: Routes workflow based on AI-classified intent  
  - Output branches:  
    - Lead Pending Review  
    - Lead Unsubscribed  
    - Lead Out Of Office  
    - Default: Fetch previous exchange and product info for response generation  
  - Failures: Missing or unexpected intent values  

---

#### 2.3 AI Response Generation & Sending

**Overview:**  
Generates personalized AI email responses based on aggregated data and templates, delays sending to mimic natural response time, sends emails via Gmail, and logs interactions.

**Nodes Involved:**  
- Get Previous Exchange (NocoDB)  
- Get All Products (NocoDB)  
- Aggregate For Response (Aggregate)  
- Generate AI Response (OpenAI Langchain)  
- Natural Response Delay (Wait)  
- Send AI Response (Gmail)  
- Log Interaction (NocoDB)  
- Update Lead Score (NocoDB)  

**Node Details:**

- **Get Previous Exchange**  
  - Type: NocoDB  
  - Role: Retrieves prior email exchanges with the lead for context  
  - Output: Passed to aggregation node  
  - Failures: Query errors  

- **Get All Products**  
  - Type: NocoDB  
  - Role: Fetches product info relevant to the lead or inquiry  
  - Output: Passed to aggregation node  

- **Aggregate For Response**  
  - Type: Aggregate  
  - Role: Combines previous exchanges and product info into a single dataset  
  - Output: Input to AI generation  
  - Failures: Aggregation errors  

- **Generate AI Response**  
  - Type: OpenAI Langchain (GPT-4o)  
  - Role: Creates a personalized email response based on aggregated data and templates  
  - Config: Prompt crafted for sales response generation  
  - Output: Response text to "Natural Response Delay"  
  - Failures: API failures, prompt errors  

- **Natural Response Delay**  
  - Type: Wait  
  - Role: Adds a configurable delay to simulate human response time  
  - Output: Triggers "Send AI Response"  
  - Failures: Timeout misconfigurations  

- **Send AI Response**  
  - Type: Gmail  
  - Role: Sends the AI-generated email reply  
  - Config: OAuth2 Gmail credential, dynamic email content  
  - Output: Triggers "Log Interaction"  
  - Failures: Sending errors, auth failures  

- **Log Interaction**  
  - Type: NocoDB  
  - Role: Logs the sent interaction in the database for tracking  
  - Output: Triggers "Update Lead Score"  
  - Failures: DB write errors  

- **Update Lead Score**  
  - Type: NocoDB  
  - Role: Updates lead scoring based on interaction outcomes  
  - Failures: DB update issues  

---

#### 2.4 Sales Outreach Campaign

**Overview:**  
Runs hourly to select top leads, generate personalized outreach emails using AI, send them via Brevo, and log outreach actions.

**Nodes Involved:**  
- Hourly Trigger  
- Get Top 10 Leads (NocoDB)  
- Loop Over Leads (Split In Batches)  
- Get Product Info (NocoDB)  
- Get Previous Correspondance (NocoDB)  
- Get Current Template (NocoDB)  
- Merge, Aggregate, Set Outreach Variables (Data prep nodes)  
- Generate Personalized Email (OpenAI Langchain)  
- Send Initial Outreach Email (HTTP Request)  
- Log Outreach (NocoDB)  
- Update Lead Status (NocoDB)  

**Node Details:**

- **Hourly Trigger**  
  - Fires every hour to start outreach process  

- **Get Top 10 Leads**  
  - Retrieves top scoring leads for outreach  

- **Loop Over Leads**  
  - Processes leads in batches for outreach preparation  

- **Get Product Info, Get Previous Correspondance, Get Current Template**  
  - Fetch data required for personalized email generation  

- **Merge, Aggregate, Set Outreach Variables**  
  - Combines and formats data for AI prompt input  

- **Generate Personalized Email**  
  - GPT-4o generates tailored outreach emails  

- **Send Initial Outreach Email**  
  - Sends emails using Brevo API via HTTP Request node  
  - Config: Brevo API credentials (not detailed)  

- **Log Outreach**  
  - Logs sent outreach in DB  

- **Update Lead Status**  
  - Updates lead status post outreach  

Failures in this block can include API errors (Brevo), data fetch failures, or rate limits.

---

#### 2.5 Engagement Event Logging & Manual Review

**Overview:**  
Captures engagement events from Brevo webhooks, logs them, updates lead engagement score, and creates manual review tasks for special cases.

**Nodes Involved:**  
- Brevo Event (SendInBlue Trigger)  
- Parse Event Data (Code)  
- Find Lead (NocoDB)  
- Lead Found? (IF)  
- Log Engagement Event (NocoDB)  
- Calculate Score Update (Code)  
- Update Lead Engagement (NocoDB)  
- Special Action Needed? (IF)  
- Create Manual Review (NocoDB)  
- Notify Sales Team (Gmail)  
- Delete a row (NocoDB) (if special action needed)  

**Node Details:**

- **Brevo Event**  
  - Webhook node for incoming Brevo engagement events (opens, clicks, bounces)  

- **Parse Event Data**  
  - Extracts event details from webhook payload  

- **Find Lead**  
  - Locates lead associated with event  

- **Lead Found?** (IF)  
  - Checks if lead exists to proceed  

- **Log Engagement Event**  
  - Records event in database  

- **Calculate Score Update**  
  - Updates engagement score based on event type  

- **Update Lead Engagement**  
  - Persists updated engagement score  

- **Special Action Needed?** (IF)  
  - Detects if event requires manual review (e.g., unsubscribe)  

- **Create Manual Review**  
  - Adds a manual review record for sales team  

- **Notify Sales Team**  
  - Sends email notification for manual review  

- **Delete a row**  
  - Deletes interaction or review row if flagged for cleanup  

Failures include webhook authentication, DB errors, or missing lead references.

---

#### 2.6 Analytics & Reporting

**Overview:**  
Aggregates all interaction and outreach data, generates analytics reports, and sends them via email, storing results for performance tracking.

**Nodes Involved:**  
- Collect All Results (Aggregate)  
- Generate Analytics Report (Code)  
- Send a message (Gmail)  
- Store Analytics (NocoDB)  

**Node Details:**

- **Collect All Results**  
  - Aggregates data across batches or processes  

- **Generate Analytics Report**  
  - Custom code generating summarized reports and insights  

- **Send a message**  
  - Sends analytics report to designated recipients  

- **Store Analytics**  
  - Saves report data for historical reference  

Failures could include code exceptions, email sending errors, or DB write issues.

---

### 3. Summary Table

| Node Name                   | Node Type                        | Functional Role                           | Input Node(s)                          | Output Node(s)                       | Sticky Note                         |
|-----------------------------|---------------------------------|-----------------------------------------|--------------------------------------|------------------------------------|-----------------------------------|
| Daily Trigger               | Cron Trigger                    | Start daily lead score recalculation    | -                                    | Get All Active Leads                |                                   |
| Get All Active Leads        | NocoDB                         | Retrieve all active leads                | Daily Trigger                       | Process in Batches                  |                                   |
| Process in Batches          | SplitInBatches                 | Batch processing of leads                | Get All Active Leads                | Calculate Score Decay / Collect All Results |                                   |
| Calculate Score Decay       | Code                           | Apply score decay logic                   | Process in Batches                  | Update Lead Scores                 |                                   |
| Update Lead Scores          | NocoDB                         | Update lead scores in DB                  | Calculate Score Decay               | Needs Re-engagement?                |                                   |
| Needs Re-engagement?        | IF                             | Decide if re-engagement needed            | Update Lead Scores                 | Schedule Re-engagement / Process in Batches |                                   |
| Schedule Re-engagement      | NocoDB                         | Schedule re-engagement tasks              | Needs Re-engagement? (Yes)           | Process in Batches                  |                                   |
| Update Lead Status          | NocoDB                         | Update lead status                         | Log Outreach                      | Loop Over Leads                   |                                   |
| Get Top 10 Leads            | NocoDB                         | Select top leads for outreach             | Hourly Trigger                    | Loop Over Leads                   |                                   |
| Loop Over Leads             | SplitInBatches                 | Process leads batch-wise                   | Get Top 10 Leads / Update Lead Status | Get Product Info / Get Previous Correspondance / Get Current Template |                                   |
| Get Product Info            | NocoDB                         | Fetch product info                         | Loop Over Leads                   | All Products                      |                                   |
| Get Previous Correspondance | NocoDB                         | Fetch previous email exchanges             | Loop Over Leads                   | All Correspondance                 |                                   |
| Get Current Template        | NocoDB                         | Fetch email template                       | Loop Over Leads                   | Current Template                  |                                   |
| All Products                | Aggregate                      | Aggregate product data                      | Get Product Info                  | Merge                           |                                   |
| All Correspondance          | Aggregate                      | Aggregate previous correspondence          | Get Previous Correspondance       | Merge                           |                                   |
| Current Template            | Aggregate                      | Aggregate template data                     | Get Current Template              | Merge                           |                                   |
| Merge                      | Merge                         | Merge products, correspondence, template  | All Products / All Correspondance / Current Template | Set Outreach Variables           |                                   |
| Set Outreach Variables      | Set                           | Prepare variables for AI prompt             | Merge                           | Generate Personalized Email       |                                   |
| Generate Personalized Email | OpenAI Langchain (GPT-4o)      | Generate outreach email content             | Set Outreach Variables           | Send Initial Outreach Email       |                                   |
| Send Initial Outreach Email | HTTP Request                  | Send email via Brevo API                     | Generate Personalized Email       | Log Outreach                    |                                   |
| Log Outreach               | NocoDB                         | Log outreach email sent                      | Send Initial Outreach Email       | Update Lead Status               |                                   |
| Gmail Webhook              | Gmail Trigger                  | Listen for incoming emails                   | -                               | Parse Response Data              |                                   |
| Parse Response Data        | Code                           | Parse incoming Gmail message                  | Gmail Webhook                   | Find Lead by Email              |                                   |
| Find Lead by Email         | NocoDB                         | Find lead by email address                    | Parse Response Data             | AI Intent Classification       |                                   |
| AI Intent Classification   | OpenAI Langchain (GPT-4o)      | Classify email intent                          | Find Lead by Email              | Route By Response Type          |                                   |
| Route By Response Type     | Switch                        | Route based on AI intent                       | AI Intent Classification       | Lead Pending Review / Lead Unsubscribed / Lead Out Of Office / Get Previous Exchange & Get All Products |                                   |
| Lead Pending Review        | NocoDB                         | Mark lead for manual review                     | Route By Response Type          | Create Manual Review             |                                   |
| Lead Unsubscribed          | NocoDB                         | Mark lead as unsubscribed                        | Route By Response Type          | -                              |                                   |
| Lead Out Of Office         | NocoDB                         | Mark lead as out of office                       | Route By Response Type          | -                              |                                   |
| Get Previous Exchange      | NocoDB                         | Fetch previous email exchanges                   | Route By Response Type          | All Exchanges                  |                                   |
| Get All Products           | NocoDB                         | Fetch all products                               | Route By Response Type          | Aggregated Products            |                                   |
| Aggregated Products        | Aggregate                      | Aggregate product data                            | Get All Products               | Merge1                         |                                   |
| All Exchanges              | Aggregate                      | Aggregate email exchanges                          | Get Previous Exchange          | Merge1                         |                                   |
| Merge1                     | Merge                         | Merge aggregated data                              | Aggregated Products / All Exchanges | Aggregate For Response         |                                   |
| Aggregate For Response     | Aggregate                      | Prepare data for AI response generation            | Merge1                        | Generate AI Response          |                                   |
| Generate AI Response       | OpenAI Langchain (GPT-4o)      | Generate AI email response                          | Aggregate For Response        | Natural Response Delay        |                                   |
| Natural Response Delay     | Wait                          | Delay to simulate natural response time               | Generate AI Response          | Send AI Response             |                                   |
| Send AI Response           | Gmail                         | Send AI generated reply                             | Natural Response Delay        | Log Interaction             |                                   |
| Log Interaction            | NocoDB                         | Log sent interaction                               | Send AI Response              | Update Lead Score           |                                   |
| Update Lead Score          | NocoDB                         | Update lead score based on interaction               | Log Interaction              | -                           |                                   |
| Brevo Event                | SendInBlue Trigger            | Receive engagement events webhook                    | -                           | Parse Event Data            |                                   |
| Parse Event Data           | Code                          | Parse Brevo engagement event data                      | Brevo Event                  | Find Lead                  |                                   |
| Find Lead                 | NocoDB                         | Find lead for engagement event                        | Parse Event Data             | Lead Found?                |                                   |
| Lead Found?                | IF                            | Check if lead exists                                   | Find Lead                   | Log Engagement Event / -    |                                   |
| Log Engagement Event       | NocoDB                         | Log engagement event                                   | Lead Found?                 | Calculate Score Update      |                                   |
| Calculate Score Update     | Code                          | Calculate score adjustment based on event             | Log Engagement Event         | Update Lead Engagement      |                                   |
| Update Lead Engagement     | NocoDB                         | Update lead engagement score                           | Calculate Score Update       | Special Action Needed?      |                                   |
| Special Action Needed?     | IF                            | Check if manual review needed (unsubscribe, etc.)      | Update Lead Engagement       | Delete a row / -            |                                   |
| Create Manual Review       | NocoDB                         | Create manual review task                              | Lead Pending Review          | Notify Sales Team           |                                   |
| Notify Sales Team          | Gmail                         | Notify sales team of manual review                      | Create Manual Review         | -                          |                                   |
| Delete a row              | NocoDB                         | Deletes flagged rows for special cases                   | Special Action Needed?       | -                          |                                   |
| Collect All Results        | Aggregate                     | Aggregate batch results for analytics                    | Process in Batches           | Generate Analytics Report  |                                   |
| Generate Analytics Report  | Code                         | Generate analytics report                                | Collect All Results          | Send a message             |                                   |
| Send a message             | Gmail                        | Email analytics report                                   | Generate Analytics Report    | Store Analytics            |                                   |
| Store Analytics            | NocoDB                       | Persist analytics data                                   | Send a message              | -                          |                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Triggers:**
   - Add a **Daily Trigger** (Cron) node, default daily schedule.
   - Add an **Hourly Trigger** (Cron) node, default hourly schedule.
   - Add a **Gmail Webhook** node, configure OAuth2 credentials for the Gmail account.
   - Add a **Brevo Event** node (SendInBlue Trigger) with webhook URL configured.

2. **Lead Retrieval and Scoring:**
   - Add **Get All Active Leads** (NocoDB) node querying leads table where status = active.
   - Connect Daily Trigger → Get All Active Leads.
   - Add **Process in Batches** node with desired batch size.
   - Connect Get All Active Leads → Process in Batches.
   - Add **Calculate Score Decay** (Code) node implementing score decay logic.
   - Connect Process in Batches (first output) → Calculate Score Decay.
   - Add **Update Lead Scores** (NocoDB) node to update scores in DB.
   - Connect Calculate Score Decay → Update Lead Scores.
   - Add **Needs Re-engagement?** (IF) node, configure conditions based on score thresholds.
   - Connect Update Lead Scores → Needs Re-engagement?.
   - On True branch, add **Schedule Re-engagement** (NocoDB) node to create tasks.
   - Connect Needs Re-engagement? True → Schedule Re-engagement.
   - Connect Schedule Re-engagement → Process in Batches for looping.
   - On False branch, connect back to Process in Batches to continue processing.
   - Add **Get Top 10 Leads** (NocoDB) node, querying leads sorted by score descending.
   - Connect Hourly Trigger → Get Top 10 Leads.
   - Add **Loop Over Leads** (Split In Batches) node.
   - Connect Get Top 10 Leads → Loop Over Leads.

3. **Sales Outreach Preparation:**
   - Add **Get Product Info**, **Get Previous Correspondance**, and **Get Current Template** (NocoDB) nodes.
   - Connect Loop Over Leads (second output) → each of these three nodes.
   - Add **All Products**, **All Correspondance**, and **Current Template** (Aggregate) nodes respectively connected to their data sources.
   - Connect Get Product Info → All Products; Get Previous Correspondance → All Correspondance; Get Current Template → Current Template.
   - Add **Merge** node to combine All Products, All Correspondance, and Current Template.
   - Connect Aggregate nodes → Merge.
   - Add **Set Outreach Variables** (Set) node, prepare variables for AI prompt.
   - Connect Merge → Set Outreach Variables.
   - Add **Generate Personalized Email** (OpenAI Langchain) node, configure with GPT-4o credentials and prompt template.
   - Connect Set Outreach Variables → Generate Personalized Email.
   - Add **Send Initial Outreach Email** (HTTP Request) node configured for Brevo API with required auth.
   - Connect Generate Personalized Email → Send Initial Outreach Email.
   - Add **Log Outreach** (NocoDB) node.
   - Connect Send Initial Outreach Email → Log Outreach.
   - Add **Update Lead Status** (NocoDB) node.
   - Connect Log Outreach → Update Lead Status.
   - Connect Update Lead Status → Loop Over Leads to continue batch process.

4. **Incoming Email Handling:**
   - Connect Gmail Webhook → **Parse Response Data** (Code) node extracting email info.
   - Connect Parse Response Data → **Find Lead by Email** (NocoDB).
   - Connect Find Lead by Email → **AI Intent Classification** (OpenAI Langchain) node.
   - Configure AI Intent Classification with GPT-4o and intent classification prompt.
   - Connect AI Intent Classification → **Route By Response Type** (Switch).
   - Configure Switch node with branches: Lead Pending Review, Lead Unsubscribed, Lead Out Of Office, Default (previous exchange & products).
   - Connect branches accordingly:
     - Lead Pending Review → **Lead Pending Review** (NocoDB) → **Create Manual Review** (NocoDB) → **Notify Sales Team** (Gmail).
     - Lead Unsubscribed → **Lead Unsubscribed** (NocoDB).
     - Lead Out Of Office → **Lead Out Of Office** (NocoDB).
     - Default branch → **Get Previous Exchange** (NocoDB) and **Get All Products** (NocoDB).
   - Connect Get Previous Exchange and Get All Products → **Aggregated Products** and **All Exchanges** (Aggregate).
   - Connect Aggregated Products and All Exchanges → **Merge1** node.
   - Connect Merge1 → **Aggregate For Response** (Aggregate).
   - Connect Aggregate For Response → **Generate AI Response** (OpenAI Langchain).
   - Connect Generate AI Response → **Natural Response Delay** (Wait).
   - Connect Natural Response Delay → **Send AI Response** (Gmail).
   - Connect Send AI Response → **Log Interaction** (NocoDB).
   - Connect Log Interaction → **Update Lead Score** (NocoDB).

5. **Engagement Event Logging:**
   - Connect Brevo Event → **Parse Event Data** (Code).
   - Connect Parse Event Data → **Find Lead** (NocoDB).
   - Connect Find Lead → **Lead Found?** (IF).
   - True branch → **Log Engagement Event** (NocoDB).
   - Connect Log Engagement Event → **Calculate Score Update** (Code).
   - Connect Calculate Score Update → **Update Lead Engagement** (NocoDB).
   - Connect Update Lead Engagement → **Special Action Needed?** (IF).
   - True branch → **Delete a row** (NocoDB) (for cleanup).
   - False branch ends or continues as needed.

6. **Analytics & Reporting:**
   - Connect Process in Batches (second output) → **Collect All Results** (Aggregate).
   - Connect Collect All Results → **Generate Analytics Report** (Code).
   - Connect Generate Analytics Report → **Send a message** (Gmail).
   - Connect Send a message → **Store Analytics** (NocoDB).

7. **Credentials:**
   - Configure OAuth2 credentials for Gmail nodes.
   - Configure API credentials for OpenAI nodes (GPT-4o).
   - Configure Brevo API credentials in HTTP Request node.
   - Configure NocoDB credentials for database access.

---

### 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                                                                      |
|-------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Workflow integrates GPT-4o via n8n-nodes-langchain for AI-driven sales email generation          | Official n8n Langchain OpenAI node documentation                                                   |
| Brevo webhook used for engagement event tracking and email sending                               | Brevo (Sendinblue) API documentation                                                                |
| Use OAuth2 for Gmail nodes to ensure secure and compliant email access                           | Gmail API OAuth2 guidelines                                                                         |
| Manual review creation triggers notification to sales team by email                             | Ensures human oversight on special cases such as unsubscribe requests or out-of-office replies     |
| Natural response delay simulates human-like response times to avoid spam filters                 | Wait node configured with a delay between AI generation and sending                                 |
| Batch processing nodes optimize performance and API rate limit compliance                        | SplitInBatches node usage for scalable lead processing                                             |
| Analytics generation provides actionable insights for sales team                                | Custom JS in Code nodes aggregates and formats report data                                         |
| Sticky Notes within the workflow can contain extra instructions or reminders                      | Refer to sticky notes positioned near nodes in n8n editor for additional context                    |

---

**Disclaimer:**  
The provided description and analysis are based exclusively on the automated workflow exported from n8n. All data and operations comply with applicable content policies and legal requirements.