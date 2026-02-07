Automate Personalized Cold Email Sequences with GPT-4, Mailgun and Supabase

https://n8nworkflows.xyz/workflows/automate-personalized-cold-email-sequences-with-gpt-4--mailgun-and-supabase-6402


# Automate Personalized Cold Email Sequences with GPT-4, Mailgun and Supabase

### 1. Workflow Overview

This n8n workflow automates personalized cold email sequences using GPT-4, Mailgun, and Supabase. It targets businesses or sales teams aiming to scale outreach efficiently through AI-generated, fully tailored 3-email follow-up sequences. The workflow incorporates lead scraping, email validation, AI-driven content generation, scheduling, sending, and tracking of email campaigns with multi-step follow-ups.

The workflow is logically divided into the following blocks:

- **1.1 Lead Acquisition and Filtering:** Receive leads from various sources (e.g., Telegram), scrape and enrich them, filter for verified and new leads.
- **1.2 AI-Powered Research and Email Content Generation:** Use GPT-4 and LangChain agents to research companies and generate personalized email sequences.
- **1.3 Email Sending and Follow-Up Scheduling:** Send out initial emails and automated follow-ups via Mailgun, managing timing with wait nodes and batching.
- **1.4 Email Tracking and State Management:** Utilize Supabase for database operations to track sent emails, evaluate sending status, and update lead states.
- **1.5 Error Handling and Control Flow:** Use switches, limits, and no-operation nodes to control execution paths and handle edge cases or failures.

---

### 2. Block-by-Block Analysis

#### 1.1 Lead Acquisition and Filtering

**Overview:**  
This block collects leads from Telegram messages or file uploads, transcribes audio if needed, scrapes web data to enrich leads, filters verified emails, and removes duplicates by comparing against existing leads in the database.

**Nodes Involved:**  
- User message (Telegram Trigger)  
- Voice or Text1 (Switch)  
- Download File1 (Telegram)  
- Transcribe1 (OpenAI LangChain)  
- Text1 (Set)  
- Scraper agent (LangChain Agent)  
- Generate query payload (Set)  
- Create URL (Code)  
- Run an Actor (Apify)  
- Extract Info (Set)  
- Only Keep Verified Emails (Filter)  
- Select already scraped mails (Postgres)  
- Keep only the new leads (Compare Datasets)  
- Already scraped (No Operation)  
- Create rows with new leads (Supabase)  
- Set Telegram message (Set)  
- Confirmation message (Telegram)

**Node Details:**

- **User message**  
  - *Type:* Telegram Trigger  
  - *Role:* Entry point for lead data from Telegram user messages.  
  - *Input:* Telegram user message webhook.  
  - *Output:* Routes to voice or text detection.  
  - *Edge cases:* Missing or unsupported message types.

- **Voice or Text1**  
  - *Type:* Switch  
  - *Role:* Distinguishes between voice and text input.  
  - *Output:* Routes to either file download or direct text processing.  
  - *Edge cases:* Unexpected message formats.

- **Download File1**  
  - *Type:* Telegram node  
  - *Role:* Downloads voice message files.  
  - *Output:* Passes file to transcription.  
  - *Failure:* Network issues, missing files.

- **Transcribe1**  
  - *Type:* OpenAI (LangChain)  
  - *Role:* Converts voice to text using AI.  
  - *Failure:* API timeouts, transcription errors.

- **Text1**  
  - *Type:* Set  
  - *Role:* Prepares text data for scraping.  
  - *Output:* Feeds into the Scraper agent.

- **Scraper agent**  
  - *Type:* LangChain Agent  
  - *Role:* Performs web scraping for lead enrichment.  
  - *Input:* Query payload, memory buffer for context.  
  - *Output:* Leads data for filtering.  
  - *Failure:* Scraping errors, rate limits.

- **Generate query payload**  
  - *Type:* Set  
  - *Role:* Prepares input data for web scraping actor.  
  - *Output:* To Create URL node.

- **Create URL**  
  - *Type:* Code  
  - *Role:* Constructs dynamic URLs for scraping.  
  - *Output:* To Run an Actor.

- **Run an Actor**  
  - *Type:* Apify  
  - *Role:* Runs scraping actor on Apify platform.  
  - *Failure:* Actor execution errors, API limits.

- **Extract Info**  
  - *Type:* Set  
  - *Role:* Extracts relevant lead info from scraping results.  
  - *Output:* To filtering node.

- **Only Keep Verified Emails**  
  - *Type:* Filter  
  - *Role:* Filters leads with verified email addresses.  
  - *Edge cases:* No verified emails found.

- **Select already scraped mails**  
  - *Type:* Postgres  
  - *Role:* Queries database for existing leads.  
  - *Failure:* DB connection errors.

- **Keep only the new leads**  
  - *Type:* Compare Datasets  
  - *Role:* Removes duplicates by comparing with DB.  
  - *Output:* Routes to No Operation or new lead creation.

- **Already scraped**  
  - *Type:* No Operation  
  - *Role:* Stops processing for duplicates.

- **Create rows with new leads**  
  - *Type:* Supabase  
  - *Role:* Inserts new leads into Supabase database.  
  - *Failure:* DB write errors.

- **Set Telegram message**  
  - *Type:* Set  
  - *Role:* Prepares confirmation message for Telegram.

- **Confirmation message**  
  - *Type:* Telegram  
  - *Role:* Sends confirmation back to user.

---

#### 1.2 AI-Powered Research and Email Content Generation

**Overview:**  
This block uses GPT-4 and LangChain agents to research target companies and generate personalized cold email sequences with three tailored follow-ups.

**Nodes Involved:**  
- research about company (OpenAI LangChain)  
- General analysis (OpenAI LangChain)  
- OpenAI Chat Model (LangChain LM)  
- create email sequence (LangChain Agent)  
- Code  
- Structured Output Parser (disabled)  
- Structured Output Parser1  

**Node Details:**

- **research about company**  
  - *Type:* OpenAI LangChain  
  - *Role:* Researches company info to personalize emails.  
  - *Output:* Feeds into general analysis node.

- **General analysis**  
  - *Type:* OpenAI LangChain  
  - *Role:* Refines research output.  
  - *Output:* Triggers email sequence creation.

- **OpenAI Chat Model**  
  - *Type:* LangChain LM Chat OpenAI  
  - *Role:* Language model used by the agent to generate content.  
  - *Credentials:* Requires OpenAI API key.  
  - *Edge cases:* API rate limits, prompt failures.

- **create email sequence**  
  - *Type:* LangChain Agent  
  - *Role:* Generates 3-email personalized cold outreach sequence.  
  - *Output:* Passes content to Code node.

- **Code**  
  - *Type:* Code  
  - *Role:* Performs custom processing or formatting on generated sequence.  
  - *Output:* Merges with other data.

- **Structured Output Parser / Structured Output Parser1**  
  - *Type:* LangChain Output Parser  
  - *Role:* Intended to structure AI outputs (one disabled).  
  - *Note:* Disabled parser suggests output handling is manual or alternative.

---

#### 1.3 Email Sending and Follow-Up Scheduling

**Overview:**  
This block manages the scheduling and sending of emails through Mailgun, with automated follow-ups controlled by wait nodes and batching for scalability.

**Nodes Involved:**  
- Schedule Trigger1, Schedule Trigger3, Schedule Trigger4, Schedule Trigger6  
- Supabase2, Supabase11, Supabase13, Supabase3, Supabase4, Supabase12, Supabase14, Supabase15, Supabase16, Your leads table  
- Switch, Switch5, Switch6  
- Loop Over Items, Loop Over Items1, Loop Over Items7, Loop Over Items8, Loop Over Items10, Loop Over Items11  
- Wait, Wait1, Wait7, Wait8, Wait10, Wait11  
- Mailgun, Mailgun1, Mailgun6, Mailgun7, Mailgun8, Mailgun9  
- Limit, Limit1, Limit2, Limit3, Limit4  

**Node Details:**

- **Schedule Triggers**  
  - *Type:* Schedule Trigger  
  - *Role:* Initiate sequences at scheduled intervals for different campaign stages.

- **Supabase Nodes**  
  - *Type:* Supabase  
  - *Role:* Fetch and update lead and email sending data for each campaign stage.

- **Switch, Switch5, Switch6**  
  - *Type:* Switch  
  - *Role:* Direct batches into different sending or follow-up paths based on lead/email state.

- **Loop Over Items***  
  - *Type:* SplitInBatches  
  - *Role:* Process leads in manageable batches for scalability.

- **Wait Nodes**  
  - *Type:* Wait  
  - *Role:* Delay between sending emails or follow-ups, enabling timed sequences.

- **Mailgun Nodes**  
  - *Type:* Mailgun  
  - *Role:* Send emails via Mailgun API. Configured to continue on error to avoid stopping workflow.  
  - *Credentials:* Mailgun API key and domain required.  
  - *Edge cases:* API errors, rate limits, invalid emails.

- **Limit Nodes**  
  - *Type:* Limit  
  - *Role:* Restrict the number of processed items per execution to prevent overload or rate limiting.

---

#### 1.4 Email Tracking and State Management

**Overview:**  
This block evaluates sent emails, updates lead states in Supabase, and controls the logic for follow-up emails based on timing and response.

**Nodes Involved:**  
- Supabase11, Supabase13  
- Evualute when the mail was sent, Evualute when the mail was sent1 (Code)  
- If, If1, If2, If3 (If nodes)  
- Sort, Sort1, Sort2, Sort3 (Sort nodes)  
- No Operation, No Operation do nothing (multiple)  

**Node Details:**

- **Supabase11 / Supabase13**  
  - *Type:* Supabase  
  - *Role:* Retrieve lead email send timestamps and states.

- **Evualute when the mail was sent / Evualute when the mail was sent1**  
  - *Type:* Code  
  - *Role:* Calculate timing to decide if follow-up emails are due.

- **If nodes**  
  - *Type:* If  
  - *Role:* Conditional branching based on email status or timing.

- **Sort nodes**  
  - *Type:* Sort  
  - *Role:* Order leads, e.g., by date or priority before processing.

- **No Operation nodes**  
  - *Type:* No Operation  
  - *Role:* Placeholder to terminate certain branches cleanly.

---

#### 1.5 Error Handling and Control Flow

**Overview:**  
This block contains auxiliary nodes to manage flow control, batching, and error tolerance during execution.

**Nodes Involved:**  
- Merge  
- No Operation (various)  
- Limit (several)  
- Sticky Notes (multiple)  

**Node Details:**

- **Merge**  
  - *Type:* Merge  
  - *Role:* Combines data streams after parallel processing steps.

- **No Operation**  
  - *Type:* No Operation  
  - *Role:* Stops processing or provides branch termination.

- **Limit**  
  - *Type:* Limit  
  - *Role:* Controls batch sizes and execution limits to avoid overload.

- **Sticky Notes**  
  - *Type:* Sticky Note  
  - *Role:* Document comments, instructions, or reminders (content mostly empty here).

---

### 3. Summary Table

| Node Name                 | Node Type                        | Functional Role                                    | Input Node(s)                  | Output Node(s)                  | Sticky Note                              |
|---------------------------|---------------------------------|---------------------------------------------------|--------------------------------|--------------------------------|-----------------------------------------|
| User message              | Telegram Trigger                | Entry point for lead input from Telegram          | –                              | Voice or Text1                 |                                         |
| Voice or Text1            | Switch                         | Detects message type: voice or text               | User message                   | Download File1, Text1          |                                         |
| Download File1            | Telegram                       | Downloads voice message file                       | Voice or Text1                 | Transcribe1                   |                                         |
| Transcribe1               | OpenAI LangChain               | Transcribes voice to text                          | Download File1                 | Scraper agent                 |                                         |
| Text1                     | Set                           | Prepares text data                                | Voice or Text1                 | Scraper agent                 |                                         |
| Scraper agent             | LangChain Agent                | Scrapes/enriches leads                            | Generate query payload, Simple Memory | Generate query payload, Select already scraped mails |                                         |
| Generate query payload    | Set                           | Creates scraping query payload                    | Scraper agent                  | Create URL                    |                                         |
| Create URL                | Code                          | Builds dynamic scraping URLs                      | Generate query payload         | Run an Actor                  |                                         |
| Run an Actor              | Apify                         | Executes scraping actor                           | Create URL                    | Extract Info                  |                                         |
| Extract Info              | Set                           | Extracts lead info from scraping results          | Run an Actor                  | Only Keep Verified Emails     |                                         |
| Only Keep Verified Emails | Filter                        | Filters leads with verified emails                 | Extract Info                  | Keep only the new leads       |                                         |
| Select already scraped mails | Postgres                    | Queries DB for existing leads                      | Scraper agent                 | Keep only the new leads       |                                         |
| Keep only the new leads   | Compare Datasets              | Removes duplicates                                 | Select already scraped mails, Only Keep Verified Emails | Already scraped, Create rows with new leads |                                         |
| Already scraped           | No Operation                  | Ends processing for duplicates                     | Keep only the new leads        | –                            |                                         |
| Create rows with new leads| Supabase                      | Inserts new leads into DB                          | Keep only the new leads        | Set Telegram message          |                                         |
| Set Telegram message      | Set                           | Prepares confirmation message                      | Create rows with new leads     | Confirmation message          |                                         |
| Confirmation message      | Telegram                      | Sends confirmation to user                         | Set Telegram message           | –                            |                                         |
| research about company    | OpenAI LangChain              | Researches company info for personalization       | Limit                        | General analysis             |                                         |
| General analysis          | OpenAI LangChain              | Processes research data                            | research about company         | create email sequence         |                                         |
| OpenAI Chat Model         | LangChain LM Chat OpenAI      | Language model for AI content generation           | create email sequence (ai_languageModel) | create email sequence         | Requires OpenAI API credentials          |
| create email sequence     | LangChain Agent               | Generates personalized 3-email sequence           | General analysis, OpenAI Chat Model | Code                       |                                         |
| Code                      | Code                          | Post-processes generated email sequence            | create email sequence          | Merge                        |                                         |
| Merge                     | Merge                         | Combines multiple data inputs                      | Limit, Code                   | Time Zone                    |                                         |
| Time Zone                 | Code                          | Adjusts times for scheduling                        | Merge                        | Sender Email                 |                                         |
| Sender Email              | Code                          | Determines sender email address                    | Time Zone                    | Your leads table             |                                         |
| Your leads table          | Supabase                      | Retrieves leads from DB                            | Sender Email                 | Switch                      |                                         |
| Switch                    | Switch                        | Routes leads to different email sequences          | Limit1                       | Loop Over Items, Loop Over Items1 |                                         |
| Loop Over Items           | SplitInBatches                | Processes batch of leads for email sending         | Switch                      | Supabase3, Mailgun1          |                                         |
| Loop Over Items1          | SplitInBatches                | Processes batch for follow-up sequence              | Switch                      | Supabase4, Mailgun           |                                         |
| Supabase3                 | Supabase                      | Updates DB for first email batch                    | Loop Over Items              | –                          |                                         |
| Supabase4                 | Supabase                      | Updates DB for follow-up batch                      | Loop Over Items1             | –                          |                                         |
| Mailgun1                  | Mailgun                       | Sends first email batch                             | Loop Over Items              | Wait                        |                                         |
| Mailgun                   | Mailgun                       | Sends follow-up emails                              | Loop Over Items1             | Wait1                       |                                         |
| Wait                      | Wait                          | Delays between first email and follow-up           | Mailgun1                    | Loop Over Items             |                                         |
| Wait1                     | Wait                          | Delays between follow-up email and next step       | Mailgun                     | Loop Over Items1            |                                         |
| Schedule Trigger1         | Schedule Trigger              | Starts main workflow periodically                   | –                          | Supabase2                   |                                         |
| Supabase2                 | Supabase                      | Retrieves leads to start sequence                    | Schedule Trigger1           | Sort2                       |                                         |
| Sort2                     | Sort                          | Sorts leads for processing                           | Supabase2                   | If2                         |                                         |
| If2                       | If                            | Checks condition for processing leads               | Sort2                       | Limit1, No Operation do nothing2 |                                         |
| Limit1                    | Limit                         | Limits number of leads to process                    | If2                         | Switch                      |                                         |
| Switch5                   | Switch                        | Routes batches for later follow-ups                  | Limit2                      | Loop Over Items7, Loop Over Items10 |                                         |
| Loop Over Items7          | SplitInBatches                | Processes batch for second follow-up emails          | Switch5                     | Supabase12, Mailgun7        |                                         |
| Loop Over Items10         | SplitInBatches                | Processes batch for third follow-up emails           | Switch5                     | Supabase14, Mailgun6        |                                         |
| Mailgun7                  | Mailgun                       | Sends second follow-up emails                         | Loop Over Items7            | Wait7                       |                                         |
| Mailgun6                  | Mailgun                       | Sends third follow-up emails                          | Loop Over Items10           | Wait10                      |                                         |
| Wait7                     | Wait                          | Delay before sending second follow-up                | Mailgun7                   | Loop Over Items7            |                                         |
| Wait10                    | Wait                          | Delay before sending third follow-up                 | Mailgun6                   | Loop Over Items10           |                                         |
| Supabase12                | Supabase                      | Updates DB for second follow-up batch                 | Loop Over Items7            | –                          |                                         |
| Supabase14                | Supabase                      | Updates DB for third follow-up batch                  | Loop Over Items10           | –                          |                                         |
| Schedule Trigger3         | Schedule Trigger              | Triggers retrieval of leads periodically              | –                          | Get many rows               |                                         |
| Get many rows             | Supabase                      | Retrieves multiple lead rows                           | Schedule Trigger3           | If3                        |                                         |
| If3                       | If                            | Determines action based on lead data                   | Get many rows               | Sort1, No Operation do nothing |                                         |
| Sort1                     | Sort                          | Sorts leads                                           | If3                        | Limit                      |                                         |
| Limit                     | Limit                         | Limits processing count                               | Sort1                      | Merge                      |                                         |
| Evualute when the mail was sent | Code                   | Checks last sent email date for follow-up scheduling | Supabase11                 | If1                        |                                         |
| Supabase11                | Supabase                      | Retrieves email send timestamps                        | Schedule Trigger4           | Evualute when the mail was sent |                                         |
| If1                       | If                            | Decides if follow-up email is due                      | Evualute when the mail was sent | Sort, No Operation do nothing1 |                                         |
| Sort                      | Sort                          | Sorts leads for next steps                             | If1                        | Limit2                     |                                         |
| Limit2                    | Limit                         | Limits leads for processing                            | Sort                       | Switch5                    |                                         |
| Evualute when the mail was sent1 | Code                  | Similar check for another email batch                  | Supabase13                 | If                         |                                         |
| Supabase13                | Supabase                      | Retrieves email send timestamps for other batch        | Schedule Trigger6           | Evualute when the mail was sent1 |                                         |
| If                        | If                            | Conditional routing                                    | Evualute when the mail was sent1 | Sort3, No Operation do nothing4 |                                         |
| Sort3                     | Sort                          | Sorts leads                                           | If                         | Limit4                     |                                         |
| Limit4                    | Limit                         | Limits leads for processing                            | Sort3                      | Switch6                    |                                         |
| Switch6                   | Switch                        | Routes leads for final follow-up batches               | Limit4                     | Loop Over Items8, Loop Over Items11 |                                         |
| Loop Over Items8          | SplitInBatches                | Batch processing for final follow-up                    | Switch6                    | Supabase15, Mailgun9       |                                         |
| Loop Over Items11         | SplitInBatches                | Batch processing for alternate final follow-up         | Switch6                    | Supabase16, Mailgun8       |                                         |
| Mailgun9                  | Mailgun                       | Sends final follow-up emails                           | Loop Over Items8           | Wait8                      |                                         |
| Mailgun8                  | Mailgun                       | Sends alternate final follow-up emails                 | Loop Over Items11          | Wait11                     |                                         |
| Wait8                     | Wait                          | Delay before sending final follow-up                    | Mailgun9                   | Loop Over Items8           |                                         |
| Wait11                    | Wait                          | Delay before sending alternate final follow-up          | Mailgun8                   | Loop Over Items11          |                                         |
| Supabase15                | Supabase                      | Updates DB for final follow-up batch                     | Loop Over Items8           | –                          |                                         |
| Supabase16                | Supabase                      | Updates DB for alternate final follow-up batch          | Loop Over Items11          | –                          |                                         |
| Set Telegram message      | Set                           | Prepares Telegram notification                         | Create rows with new leads   | Limit3                     |                                         |
| Limit3                    | Limit                         | Limits Telegram notification batch                      | Set Telegram message         | Confirmation message        |                                         |
| Confirmation message      | Telegram                      | Sends Telegram confirmation                            | Limit3                      | –                          |                                         |
| No Operation nodes        | No Operation                  | Branch termination or pass-through                     | Various                    | –                          |                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger node ("User message")**  
   - Configure webhook to receive Telegram messages.  
   - Connect output to "Voice or Text1".

2. **Add Switch node ("Voice or Text1")**  
   - Configure conditions to detect if incoming message is voice or text.  
   - Voice path goes to "Download File1", text path goes to "Text1".

3. **Add Telegram node ("Download File1")**  
   - Configure to download voice message files from Telegram.  
   - Connect to "Transcribe1".

4. **Add OpenAI LangChain node ("Transcribe1")**  
   - Set to transcribe audio to text using OpenAI API.  
   - Connect to "Scraper agent".

5. **Add Set node ("Text1")**  
   - Prepare text payload for scraping.  
   - Connect to "Scraper agent".

6. **Add LangChain Agent node ("Scraper agent")**  
   - Configure with scraping logic and OpenAI memory buffer.  
   - Connect to "Generate query payload" and "Select already scraped mails".

7. **Add Set node ("Generate query payload")**  
   - Prepare query parameters for scraping actor.  
   - Connect to "Create URL".

8. **Add Code node ("Create URL")**  
   - Write code to build dynamic URLs for scraping.  
   - Connect to "Run an Actor".

9. **Add Apify node ("Run an Actor")**  
   - Configure with Apify actor ID and input from URL node.  
   - Connect to "Extract Info".

10. **Add Set node ("Extract Info")**  
    - Extract relevant lead data from actor output.  
    - Connect to filter node.

11. **Add Filter node ("Only Keep Verified Emails")**  
    - Configure filter to pass only leads with verified emails.  
    - Connect to "Keep only the new leads".

12. **Add Postgres node ("Select already scraped mails")**  
    - Query your DB for existing leads.  
    - Connect to "Keep only the new leads".

13. **Add Compare Datasets node ("Keep only the new leads")**  
    - Configure to compare and exclude duplicates.  
    - Connect to "Already scraped" (No Op) for duplicates and "Create rows with new leads" for new leads.

14. **Add No Operation node ("Already scraped")**  
    - To stop processing duplicates.

15. **Add Supabase node ("Create rows with new leads")**  
    - Configure to insert new leads into Supabase table.  
    - Connect to "Set Telegram message".

16. **Add Set node ("Set Telegram message")**  
    - Prepare confirmation message text for Telegram.

17. **Add Telegram node ("Confirmation message")**  
    - Send confirmation back to user.

18. **Add OpenAI LangChain nodes ("research about company", "General analysis")**  
    - Configure GPT-4 to research companies and analyze data.  
    - Chain output to "create email sequence".

19. **Add LangChain LM Chat OpenAI node ("OpenAI Chat Model")**  
    - Configure with OpenAI API credentials, linked to "create email sequence".

20. **Add LangChain Agent node ("create email sequence")**  
    - Configure to generate personalized 3-email sequence.

21. **Add Code node ("Code")**  
    - Custom code for post-processing email content.

22. **Add Merge node ("Merge")**  
    - Combine outputs from "Limit" and "Code".

23. **Add Code nodes ("Time Zone", "Sender Email")**  
    - Adjust scheduling times and set sender email address.

24. **Add Supabase node ("Your leads table")**  
    - Retrieve leads for sending emails.

25. **Add Switch node ("Switch")**  
    - Route leads into two paths for initial email and follow-ups.

26. **Add SplitInBatches nodes ("Loop Over Items", "Loop Over Items1")**  
    - Batch processing for scalable sending.

27. **Add Supabase nodes ("Supabase3", "Supabase4")**  
    - Update DB records for email sending status.

28. **Add Mailgun nodes ("Mailgun1", "Mailgun")**  
    - Send emails via Mailgun with error continuation.

29. **Add Wait nodes ("Wait", "Wait1")**  
    - Delay between email sends and follow-ups.

30. **Repeat batch processing, sending, and waiting for subsequent follow-ups** using nodes like:  
    - Switch5, Loop Over Items7/10, Mailgun7/6, Wait7/10, Supabase12/14  
    - Switch6, Loop Over Items8/11, Mailgun9/8, Wait8/11, Supabase15/16

31. **Add Schedule Trigger nodes ("Schedule Trigger1", "Schedule Trigger3", "Schedule Trigger4", "Schedule Trigger6")**  
    - Set periodic triggers to start respective workflow parts.

32. **Add Supabase nodes ("Supabase2", "Supabase11", "Supabase13")**  
    - Retrieve leads and email send timestamps.

33. **Add Code nodes ("Evualute when the mail was sent", "Evualute when the mail was sent1")**  
    - Calculate if follow-up emails are due based on timestamps.

34. **Add If nodes ("If", "If1", "If2", "If3")**  
    - Conditional branches based on timing and lead state.

35. **Add Sort nodes ("Sort", "Sort1", "Sort2", "Sort3")**  
    - Order leads for processing.

36. **Add Limit nodes ("Limit", "Limit1", "Limit2", "Limit3", "Limit4")**  
    - Throttle batch sizes.

37. **Add No Operation nodes**  
    - As branch terminators where needed.

38. **Add Telegram notification nodes ("Set Telegram message", "Confirmation message")**  
    - Notify user upon lead insertion.

39. **Configure credentials:**  
    - OpenAI API key for GPT-4 and LangChain nodes.  
    - Mailgun API key and domain for email sending.  
    - Supabase credentials for DB access.  
    - Telegram bot token for Telegram nodes.  
    - Apify API token for scraping actor.

---

### 5. General Notes & Resources

| Note Content                                                                 | Context or Link                                                                                  |
|------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This workflow relies on advanced LangChain integration with OpenAI's GPT-4.   | n8n LangChain nodes require correct OpenAI API setup and may incur usage costs.                 |
| Mailgun nodes are configured to continue on error to avoid workflow stoppage.| Useful for high-volume email sending where some failures are expected.                          |
| Supabase is used as the primary database for leads and email tracking.       | Ensure Supabase project and tables are correctly configured with appropriate permissions.       |
| Telegram nodes enable user interaction and confirmations via chat.           | Requires Telegram bot credentials and webhook setup.                                           |
| Apify actor is used for scraping leads; configure actor ID and input JSON.   | Apify platform account and token required.                                                     |
| Careful scheduling with Wait nodes spaces out email sends to comply with limits.| Helps avoid spam filters and service rate limits.                                              |
| The workflow includes multiple scheduled triggers for different sequence stages.| This enables campaign automation and periodic refresh of leads and follow-ups.                |

---

*Disclaimer: The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.*