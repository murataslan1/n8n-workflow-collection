Automate B2B Lead Generation with Apollo, GPT-4o Scoring, and Brevo Email Outreach

https://n8nworkflows.xyz/workflows/automate-b2b-lead-generation-with-apollo--gpt-4o-scoring--and-brevo-email-outreach-4539


# Automate B2B Lead Generation with Apollo, GPT-4o Scoring, and Brevo Email Outreach

---

### 1. Workflow Overview

This workflow automates B2B lead generation by integrating Apollo.io lead scraping, AI-based lead scoring using GPT-4o, and Brevo email outreach automation. It processes leads, enriches them with AI-driven insights, manages email personalization and outreach, and updates lead statuses in a NocoDB database.

Logical blocks:

- **1.1 Trigger and Lead Scraping:** Starts manually, scrapes leads from Apollo.io API.
- **1.2 Lead Filtering and Storage:** Filters leads without emails, edits fields, and stores leads in NocoDB.
- **1.3 Lead Enrichment & Crawling:** For leads with organizational websites, initiates data crawling via Apify and Crawl4AI services, processes crawl results, and updates lead statuses.
- **1.4 AI Scoring:** Fetches leads, applies GPT-4o scoring via OpenAI integration, stores scores in NocoDB.
- **1.5 Email Personalization and Outreach:** Generates personalized emails with AI, sends emails via Brevo, creates contacts, monitors email interactions, and updates lead statuses accordingly.
- **1.6 Lead Status Management:** Updates lead statuses based on email events (opened, unwanted), handles failed processes, and manages contact deletion.
- **1.7 Batch Processing and Loops:** Uses batch splitting nodes to handle leads in manageable chunks during processing, scoring, and outreach.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger and Lead Scraping

- **Overview:** Initiates workflow manually and scrapes leads from Apollo.io.
- **Nodes Involved:**  
  - When clicking ‘Test workflow’  
  - Scrape Leads From Apollo  
  - Filter leads without email  
  - Edit Fields  
  - NocoDB  

- **Node Details:**

  - **When clicking ‘Test workflow’**  
    - Type: Manual Trigger  
    - Role: Starts the workflow on user command.  
    - Connections: Outputs to "Scrape Leads From Apollo".  
    - Edge cases: None inherent; manual start.

  - **Scrape Leads From Apollo**  
    - Type: HTTP Request  
    - Role: Calls Apollo API to retrieve lead data.  
    - Config: Set to query Apollo’s lead endpoints with appropriate API key credentials configured in n8n.  
    - Connections: Outputs to "Filter leads without email".  
    - Edge cases: API rate limits, auth errors, network timeouts.

  - **Filter leads without email**  
    - Type: If node  
    - Role: Filters out leads missing email addresses to ensure only valid contacts proceed.  
    - Connections: True branch to "Edit Fields", false branch (discard).  
    - Edge cases: Leads missing or malformed emails.

  - **Edit Fields**  
    - Type: Set node  
    - Role: Adjusts or formats lead fields before database insertion.  
    - Connections: Outputs to "NocoDB".  
    - Edge cases: Expression or mapping errors if fields missing.

  - **NocoDB**  
    - Type: NocoDB node  
    - Role: Inserts or updates filtered leads into the NocoDB database.  
    - Connections: Outputs to "Get 'Entered' Leads From Apify".  
    - Edge cases: DB connection issues, write conflicts.

---

#### 1.2 Lead Enrichment & Crawling

- **Overview:** For leads with websites, enriches data via crawling services Apify and Crawl4AI, processes crawl results, and updates lead statuses.

- **Nodes Involved:**  
  - Get 'Entered' Leads From Apify  
  - Loop over entered leads  
  - If organization website exists  
  - Apify Crawl Request  
  - Process Apify Crawl  
  - Mark as failed_to_process  
  - Loop Over Entered Leads Crawl4AI  
  - If organization website exists Crawl4AI  
  - Crawl4AI  
  - Crawl4AI resolve  
  - If pending  
  - If not success  
  - Set Lead Status -> 'processed'  
  - Set Lead Status -> 'failed_to_process'  

- **Node Details:**

  - **Get 'Entered' Leads From Apify**  
    - Type: NocoDB  
    - Role: Fetch leads marked as 'entered' for Apify crawling.  
    - Connections: Outputs to "Loop over entered leads".  
    - Edge cases: DB retrieval errors.

  - **Loop over entered leads**  
    - Type: SplitInBatches  
    - Role: Processes entered leads in batches for scalability.  
    - Connections: True branch to "Fetch data to prepare for scoring" and "If organization website exists".  
    - Edge cases: Batch size misconfiguration.

  - **If organization website exists**  
    - Type: If node  
    - Role: Checks if lead has a website to crawl.  
    - Connections: True branch to "Apify Crawl Request", false branch to "Mark as failed_to_process".  
    - Edge cases: Missing or invalid URLs.

  - **Apify Crawl Request**  
    - Type: HTTP Request  
    - Role: Sends crawl request to Apify service.  
    - Connections: Main to "Process Apify Crawl", alternate to "Mark as failed_to_process".  
    - Edge cases: API failures, timeout, invalid responses.

  - **Process Apify Crawl**  
    - Type: NocoDB  
    - Role: Stores crawl results and updates lead status.  
    - Connections: Outputs to "Loop over entered leads".  
    - Edge cases: DB write errors.

  - **Mark as failed_to_process**  
    - Type: NocoDB  
    - Role: Marks leads that failed crawling for review.  
    - Connections: Outputs back to "Loop over entered leads".  
    - Edge cases: DB update failures.

  - **Loop Over Entered Leads Crawl4AI**  
    - Type: SplitInBatches  
    - Role: Batch processing for Crawl4AI leads.  
    - Connections: Outputs to "If organization website exists Crawl4AI".  
    - Edge cases: Same as other batch nodes.

  - **If organization website exists Crawl4AI**  
    - Type: If node  
    - Role: Checks website presence for Crawl4AI crawling.  
    - Connections: True branch to "Crawl4AI", false to "Loop Over Entered Leads Crawl4AI".  
    - Edge cases: URL validation.

  - **Crawl4AI**  
    - Type: HTTP Request  
    - Role: Calls Crawl4AI API for data enrichment.  
    - Connections: Outputs to "Wait".  
    - Edge cases: API errors, rate limits.

  - **Crawl4AI resolve**  
    - Type: HTTP Request  
    - Role: Checks crawl job status or resolves crawl data.  
    - Connections: True branch to "If pending", false branch to "Set Lead Status -> 'failed_to_process'".  
    - Edge cases: Polling failures, timeouts.

  - **If pending**  
    - Type: If node  
    - Role: Determines if crawl job is still pending.  
    - Connections: True branch loops back to "Wait", false to "If not success".  
    - Edge cases: Infinite wait risk if not handled.

  - **If not success**  
    - Type: If node  
    - Role: Checks if crawl did not succeed.  
    - Connections: True branch to "Set Lead Status -> 'failed_to_process'", false to "Set Lead Status -> 'processed'".  
    - Edge cases: Incorrect status parsing.

  - **Set Lead Status -> 'processed'**  
    - Type: NocoDB  
    - Role: Marks lead as processed after successful crawl.  
    - Connections: Outputs to "Loop Over Entered Leads Crawl4AI".  
    - Edge cases: DB update errors.

  - **Set Lead Status -> 'failed_to_process'**  
    - Type: NocoDB  
    - Role: Marks lead as failed after unsuccessful crawl.  
    - Connections: Outputs to "Loop Over Entered Leads Crawl4AI".  
    - Edge cases: DB update errors.

---

#### 1.3 AI Scoring

- **Overview:** Uses GPT-4o via OpenAI node to score leads, stores scores in NocoDB, and loops for batch processing.

- **Nodes Involved:**  
  - Fetch data to prepare for scoring  
  - Loop Over Leads For Scoring  
  - If not scored  
  - Ai Scoring (OpenAI)  
  - Add a score  

- **Node Details:**

  - **Fetch data to prepare for scoring**  
    - Type: NocoDB  
    - Role: Retrieves leads ready for scoring.  
    - Connections: Outputs to "Loop Over Leads For Scoring".  
    - Edge cases: DB retrieval issues.

  - **Loop Over Leads For Scoring**  
    - Type: SplitInBatches  
    - Role: Processes leads in batches for scoring.  
    - Connections: True branch to "Fetch processed leads", false branch to "If not scored".  
    - Edge cases: Batch size and retry configurations.

  - **If not scored**  
    - Type: If node  
    - Role: Checks if lead lacks a score.  
    - Connections: True branch to "Loop Over Leads For Scoring" (retry), false branch to "Ai Scoring".  
    - Edge cases: Logic loop risk.

  - **Ai Scoring**  
    - Type: OpenAI (Langchain)  
    - Role: Sends lead data to GPT-4o for scoring.  
    - Config: Uses OpenAI API credentials; prompts and parameters configured for scoring.  
    - Connections: Outputs to "Add a score".  
    - Edge cases: API rate limits, response formatting errors.

  - **Add a score**  
    - Type: NocoDB  
    - Role: Writes the AI-generated score back to the lead record.  
    - Connections: Outputs to "Loop Over Leads For Scoring".  
    - Edge cases: DB write failures.

---

#### 1.4 Email Personalization and Outreach

- **Overview:** Generates personalized emails with AI, creates contacts in Brevo, sends emails, loops over batches, and monitors email sending status.

- **Nodes Involved:**  
  - Fetch Leads With Created Emails  
  - Personalized Mail Loop  
  - If mail not created  
  - Email Personalization (OpenAI)  
  - Add Personalized mail  
  - If not contacted and email created  
  - Create Contact (Brevo)  
  - Email Send (Brevo)  
  - Mark as contacted  
  - Email Exists -> Mark as Contacted  

- **Node Details:**

  - **Fetch Leads With Created Emails**  
    - Type: NocoDB  
    - Role: Retrieves leads that already have personalized emails created.  
    - Connections: Outputs to "Personalized Mail Loop".  
    - Edge cases: DB retrieval issues.

  - **Personalized Mail Loop**  
    - Type: SplitInBatches  
    - Role: Loops through leads with emails for outreach.  
    - Connections: True branch (no output) or false branch to "If not contacted and email created".  
    - Edge cases: Batch size misconfigurations.

  - **If mail not created**  
    - Type: If node  
    - Role: Checks if personalized email exists.  
    - Connections: True branch to "Email Personalization", false branch to "Loop Over Processed Leads".  
    - Edge cases: Logic check errors.

  - **Email Personalization**  
    - Type: OpenAI (Langchain)  
    - Role: Generates personalized email content for leads using AI.  
    - Config: Uses OpenAI API with prompt templates for personalization.  
    - Connections: Outputs to "Add Personalized mail" and "Loop Over Processed Leads".  
    - Edge cases: API errors, response invalidity.

  - **Add Personalized mail**  
    - Type: NocoDB  
    - Role: Stores personalized emails in the database.  
    - Connections: Outputs to "Loop Over Processed Leads".  
    - Edge cases: DB write errors.

  - **If not contacted and email created**  
    - Type: If node  
    - Role: Checks if the lead is not yet contacted but has an email ready.  
    - Connections: True branch to "Create Contact", false to "Personalized Mail Loop".  
    - Edge cases: Status logic errors.

  - **Create Contact**  
    - Type: Brevo (SendInBlue)  
    - Role: Creates a contact in Brevo email marketing platform.  
    - Connections: True branch to "Email Send", alternate to "Email Exists -> Mark as Contacted".  
    - Edge cases: API auth failures, duplicate contacts.

  - **Email Send**  
    - Type: Brevo (SendInBlue)  
    - Role: Sends personalized emails to contacts via Brevo.  
    - Connections: True branch to "Mark as contacted", alternate to "Mark as Trash".  
    - Edge cases: Sending errors, quota exceeded.

  - **Mark as contacted**  
    - Type: NocoDB  
    - Role: Updates lead status as contacted after successful email send.  
    - Connections: Outputs to "Personalized Mail Loop".  
    - Edge cases: DB update failures.

  - **Email Exists -> Mark as Contacted**  
    - Type: NocoDB  
    - Role: Marks lead as contacted if email already exists.  
    - Connections: Outputs to "Personalized Mail Loop".  
    - Edge cases: DB update issues.

---

#### 1.5 Lead Status Management

- **Overview:** Handles email event triggers, updates lead statuses based on email opening, unwanted emails, and manages contact deletion.

- **Nodes Involved:**  
  - Email Opened (disabled)  
  - Get by user email  
  - Lead Status -> Email Opened  
  - If Email Opened More Than Once  
  - Lead Status -> Warm  
  - Email Unwanted (disabled)  
  - Delete Contact In Brevo  
  - Get by email  
  - Lead Status -> Trash  
  - Lead Status -> Warm  
  - Mark as Trash  

- **Node Details:**

  - **Email Opened**  
    - Type: Brevo Trigger (SendInBlueTrigger)  
    - Disabled: Yes  
    - Role: Trigger on email opened event.  
    - Connections: Outputs to "Get by user email".  
    - Edge cases: Disabled, hence inactive.

  - **Get by user email**  
    - Type: NocoDB  
    - Role: Retrieves lead by email to update status.  
    - Connections: Outputs to "Lead Status -> Email Opened".  
    - Edge cases: DB retrieval failure.

  - **Lead Status -> Email Opened**  
    - Type: NocoDB  
    - Role: Updates lead status to reflect email opened.  
    - Connections: Outputs to "If Email Opened More Than Once".  
    - Edge cases: DB write errors.

  - **If Email Opened More Than Once**  
    - Type: If node  
    - Role: Checks if lead opened email multiple times to upgrade status.  
    - Connections: True branch to "Lead Status -> Warm".  
    - Edge cases: Logic evaluation errors.

  - **Lead Status -> Warm**  
    - Type: NocoDB  
    - Role: Marks lead as warm based on engagement.  
    - Connections: No further outputs.  
    - Edge cases: DB update errors.

  - **Email Unwanted**  
    - Type: Brevo Trigger (SendInBlueTrigger)  
    - Disabled: Yes  
    - Role: Would trigger on unwanted email events.  
    - Connections: Outputs to "Delete Contact In Brevo".  
    - Edge cases: Disabled, inactive.

  - **Delete Contact In Brevo**  
    - Type: Brevo (SendInBlue)  
    - Role: Deletes contact from Brevo list on unwanted email.  
    - Connections: Outputs to "Get by email".  
    - Edge cases: API errors, permission issues.

  - **Get by email**  
    - Type: NocoDB  
    - Role: Retrieves lead record by email for status update.  
    - Connections: Outputs to "Lead Status -> Trash".  
    - Edge cases: DB lookup failures.

  - **Lead Status -> Trash**  
    - Type: NocoDB  
    - Role: Marks lead as trash (unwanted).  
    - Connections: Outputs to "Personalized Mail Loop".  
    - Edge cases: DB update failures.

  - **Mark as Trash**  
    - Type: NocoDB  
    - Role: Marks a lead as trash after failed email send.  
    - Connections: Outputs to "Personalized Mail Loop".  
    - Edge cases: DB update issues.

---

#### 1.6 Batch Processing and Loops

- **Overview:** Uses split-batch nodes to handle leads in manageable chunks during multiple phases (entered leads, processed leads, scoring, personalization).

- **Nodes Involved:**  
  - Loop over entered leads  
  - Loop Over Entered Leads Crawl4AI  
  - Loop Over Processed Leads  
  - Loop Over Leads For Scoring  
  - Personalized Mail Loop  

- **Node Details:**

  - **Loop over entered leads**  
    - Type: SplitInBatches  
    - Role: Batch processing of newly entered leads.  
    - Connections: Multiple downstream connections based on conditions.  
    - Edge cases: Batch size tuning critical to performance.

  - **Loop Over Entered Leads Crawl4AI**  
    - Type: SplitInBatches  
    - Role: Batch processing for Crawl4AI data enrichment.  
    - Edge cases: Same as above.

  - **Loop Over Processed Leads**  
    - Type: SplitInBatches  
    - Role: Processes leads after crawling for email personalization.  
    - Edge cases: Batch size and execution timing.

  - **Loop Over Leads For Scoring**  
    - Type: SplitInBatches  
    - Role: Batch processes leads for AI scoring.  
    - Edge cases: Retry on fail enabled, important for API reliability.

  - **Personalized Mail Loop**  
    - Type: SplitInBatches  
    - Role: Iterates over leads to manage personalized email sending.  
    - Edge cases: Ensures not to overload mailing system.

---

### 3. Summary Table

| Node Name                        | Node Type                     | Functional Role                          | Input Node(s)                  | Output Node(s)                              | Sticky Note |
|---------------------------------|-------------------------------|----------------------------------------|-------------------------------|---------------------------------------------|-------------|
| When clicking ‘Test workflow’    | Manual Trigger                | Workflow start                         | None                          | Scrape Leads From Apollo                    |             |
| Scrape Leads From Apollo         | HTTP Request                 | Apollo leads retrieval                 | When clicking ‘Test workflow’ | Filter leads without email                   |             |
| Filter leads without email       | If                           | Filters leads missing email            | Scrape Leads From Apollo       | Edit Fields (true), discard (false)          |             |
| Edit Fields                     | Set                          | Field formatting before DB insert     | Filter leads without email     | NocoDB                                      |             |
| NocoDB                          | NocoDB                       | Insert/update lead records             | Edit Fields                   | Get 'Entered' Leads From Apify               |             |
| Get 'Entered' Leads From Apify   | NocoDB                       | Fetch leads for Apify crawling        | NocoDB                       | Loop over entered leads                      |             |
| Loop over entered leads          | SplitInBatches               | Batch process entered leads            | Get 'Entered' Leads From Apify | Fetch data to prepare for scoring, If org website exists |             |
| If organization website exists   | If                           | Check for lead website                 | Loop over entered leads       | Apify Crawl Request (true), Mark as failed_to_process (false) |             |
| Apify Crawl Request              | HTTP Request                 | Initiate Apify crawl                   | If organization website exists | Process Apify Crawl (success), Mark as failed_to_process (fail) |             |
| Process Apify Crawl              | NocoDB                       | Store crawl data, update status       | Apify Crawl Request           | Loop over entered leads                      |             |
| Mark as failed_to_process        | NocoDB                       | Mark crawl failure                     | If organization website exists (false), Apify Crawl Request (fail) | Loop over entered leads                      |             |
| Loop Over Entered Leads Crawl4AI | SplitInBatches               | Batch process Crawl4AI leads           | Set Lead Status -> 'processed' | If organization website exists Crawl4AI     |             |
| If organization website exists Crawl4AI | If                      | Check for website for Crawl4AI        | Loop Over Entered Leads Crawl4AI | Crawl4AI (true), Loop Over Entered Leads Crawl4AI (false) |             |
| Crawl4AI                       | HTTP Request                 | Call Crawl4AI API for enrichment      | If organization website exists Crawl4AI | Wait                                       |             |
| Wait                           | Wait                         | Delay for crawl completion             | Crawl4AI                     | Crawl4AI resolve                            |             |
| Crawl4AI resolve               | HTTP Request                 | Poll crawl job status                  | Wait                         | If pending (true), Set Lead Status -> 'failed_to_process' (false) |             |
| If pending                    | If                           | Check if crawl job pending             | Crawl4AI resolve             | Wait (true), If not success (false)          |             |
| If not success                | If                           | Check crawl success                    | If pending                   | Set Lead Status -> 'failed_to_process' (true), Set Lead Status -> 'processed' (false) |             |
| Set Lead Status -> 'processed' | NocoDB                       | Mark lead processed                    | If not success (false)         | Loop Over Entered Leads Crawl4AI             |             |
| Set Lead Status -> 'failed_to_process' | NocoDB                  | Mark lead failed processing            | If not success (true), Crawl4AI resolve (false) | Loop Over Entered Leads Crawl4AI             |             |
| Fetch data to prepare for scoring | NocoDB                    | Fetch leads data for scoring           | Loop over entered leads       | Loop Over Leads For Scoring                   |             |
| Loop Over Leads For Scoring      | SplitInBatches               | Batch process leads for scoring        | Fetch data to prepare for scoring | Fetch processed leads, If not scored        |             |
| Fetch processed leads            | NocoDB                       | Fetch leads that are processed         | Loop Over Leads For Scoring (true) | Loop Over Processed Leads                   |             |
| If not scored                   | If                           | Check if lead is already scored        | Loop Over Leads For Scoring (false) | Loop Over Leads For Scoring (true), Ai Scoring (false) |             |
| Ai Scoring                     | OpenAI (Langchain)           | Score lead with GPT-4o                 | If not scored                | Add a score                                  |             |
| Add a score                    | NocoDB                       | Save AI score to lead record           | Ai Scoring                   | Loop Over Leads For Scoring                   |             |
| Loop Over Processed Leads        | SplitInBatches               | Batch leads after processing           | Fetch processed leads         | Fetch Leads With Created Emails, If mail not created |             |
| Fetch Leads With Created Emails  | NocoDB                       | Leads with personalized emails         | Loop Over Processed Leads     | Personalized Mail Loop                        |             |
| Personalized Mail Loop           | SplitInBatches               | Batch process leads for email sending | Fetch Leads With Created Emails | If not contacted and email created (false) |             |
| If mail not created             | If                           | Check for existing personalized email | Loop Over Processed Leads     | Email Personalization (true), Loop Over Processed Leads (false) |             |
| Email Personalization          | OpenAI (Langchain)           | Generate personalized email content    | If mail not created          | Add Personalized mail, Loop Over Processed Leads |             |
| Add Personalized mail          | NocoDB                       | Store personalized email content       | Email Personalization        | Loop Over Processed Leads                     |             |
| If not contacted and email created | If                       | Check if lead not contacted but email ready | Personalized Mail Loop        | Create Contact (true), Personalized Mail Loop (false) |             |
| Create Contact                | Brevo (SendInBlue)           | Create contact in Brevo                 | If not contacted and email created | Email Send (success), Email Exists -> Mark as Contacted (fail) |             |
| Email Send                   | Brevo (SendInBlue)           | Send personalized email                 | Create Contact               | Mark as contacted (success), Mark as Trash (fail) |             |
| Mark as contacted            | NocoDB                       | Update lead as contacted                | Email Send                   | Personalized Mail Loop                         |             |
| Email Exists -> Mark as Contacted | NocoDB                   | Mark lead contacted if email exists    | Create Contact (fail)         | Personalized Mail Loop                         |             |
| Email Opened (disabled)       | Brevo Trigger (SendInBlueTrigger) | Trigger on email open event           | None                        | Get by user email                             |             |
| Get by user email             | NocoDB                       | Get lead record by user email           | Email Opened                 | Lead Status -> Email Opened                    |             |
| Lead Status -> Email Opened   | NocoDB                       | Update lead status on email open        | Get by user email            | If Email Opened More Than Once                 |             |
| If Email Opened More Than Once | If                         | Check multiple opens                     | Lead Status -> Email Opened  | Lead Status -> Warm                            |             |
| Lead Status -> Warm           | NocoDB                       | Update lead as warm                      | If Email Opened More Than Once | None                                         |             |
| Email Unwanted (disabled)     | Brevo Trigger (SendInBlueTrigger) | Trigger on unwanted email event        | None                        | Delete Contact In Brevo                        |             |
| Delete Contact In Brevo       | Brevo (SendInBlue)           | Remove contact on unwanted email        | Email Unwanted              | Get by email                                  |             |
| Get by email                 | NocoDB                       | Get lead by email for status update     | Delete Contact In Brevo      | Lead Status -> Trash                           |             |
| Lead Status -> Trash          | NocoDB                       | Mark lead as trash/unwanted              | Get by email                | Personalized Mail Loop                         |             |
| Mark as Trash                | NocoDB                       | Mark lead as trash after failed email   | Email Send (fail)            | Personalized Mail Loop                         |             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger Node** named "When clicking ‘Test workflow’" to start the workflow manually.

2. **Add an HTTP Request node** named "Scrape Leads From Apollo" configured to call the Apollo.io API with the proper API key credentials. Set method and endpoint according to Apollo API docs to fetch leads.

3. **Add an If node** named "Filter leads without email" to check if the lead’s email field exists and is valid. Connect true output to next node.

4. **Add a Set node** named "Edit Fields" to format or modify lead data fields as needed before DB insertion.

5. **Add a NocoDB node** named "NocoDB" to insert/update leads into your NocoDB database. Configure with correct credentials and target table.

6. **Add a NocoDB node** named "Get 'Entered' Leads From Apify" to fetch leads marked as 'entered' for crawling.

7. **Add a SplitInBatches node** named "Loop over entered leads" to process leads in batches.

8. **Add an If node** named "If organization website exists" to check if the lead has a non-empty website URL.

9. **Add an HTTP Request node** named "Apify Crawl Request" to send crawl requests to Apify API for leads with websites.

10. **Add a NocoDB node** named "Process Apify Crawl" to store crawl results and update lead statuses.

11. **Add a NocoDB node** named "Mark as failed_to_process" to mark leads failing crawling.

12. **Connect "If organization website exists" false output to "Mark as failed_to_process".**

13. **Add a SplitInBatches node** named "Loop Over Entered Leads Crawl4AI" for Crawl4AI lead processing.

14. **Add an If node** named "If organization website exists Crawl4AI" to check website presence before Crawl4AI API call.

15. **Add an HTTP Request node** named "Crawl4AI" configured for Crawl4AI API calls.

16. **Add a Wait node** named "Wait" to delay between crawl requests and results retrieval.

17. **Add an HTTP Request node** named "Crawl4AI resolve" to poll crawl status.

18. **Add If nodes** "If pending" and "If not success" to control crawl result handling and lead status updating.

19. **Add NocoDB nodes** "Set Lead Status -> 'processed'" and "Set Lead Status -> 'failed_to_process'" to update lead statuses accordingly.

20. **Add a NocoDB node** named "Fetch data to prepare for scoring" to retrieve leads ready for AI scoring.

21. **Add a SplitInBatches node** named "Loop Over Leads For Scoring" to handle leads in batches.

22. **Add an If node** named "If not scored" to check if leads lack scores.

23. **Add an OpenAI node** named "Ai Scoring" configured with GPT-4o credentials and prompts for lead scoring.

24. **Add a NocoDB node** named "Add a score" to save AI scoring results.

25. **Add a NocoDB node** named "Fetch Leads With Created Emails" to get leads with existing personalized emails.

26. **Add a SplitInBatches node** named "Personalized Mail Loop" for email outreach processing.

27. **Add an If node** named "If mail not created" to check if personalized emails exist.

28. **Add an OpenAI node** named "Email Personalization" configured to generate personalized email content.

29. **Add a NocoDB node** named "Add Personalized mail" to save generated emails.

30. **Add an If node** named "If not contacted and email created" to filter leads ready for outreach.

31. **Add a Brevo node** named "Create Contact" configured with OAuth2 credentials to add contacts to Brevo.

32. **Add a Brevo node** named "Email Send" configured to send emails via Brevo.

33. **Add NocoDB nodes** "Mark as contacted" and "Email Exists -> Mark as Contacted" to update contact statuses.

34. **Add NocoDB node** "Mark as Trash" to mark leads as trash if email sending fails.

35. **Add Brevo Trigger nodes** "Email Opened" and "Email Unwanted" (optional, currently disabled) to receive webhook events.

36. **Add NocoDB nodes** "Get by user email", "Lead Status -> Email Opened", "If Email Opened More Than Once", "Lead Status -> Warm" to manage engagement status updates.

37. **Add Brevo node** "Delete Contact In Brevo" for removing unwanted contacts.

38. **Add NocoDB nodes** "Get by email" and "Lead Status -> Trash" for unwanted email handling.

39. **Configure all nodes for error handling:** set "On Error" to continue or ignore as appropriate to maintain workflow stability.

40. **Tune batch sizes** in SplitInBatches nodes according to API limits and processing speed.

---

### 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                                                                 |
|-------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Core workflow automates end-to-end B2B lead generation, enrichment, scoring, and email outreach | Workflow name: Automate B2B Lead Generation with Apollo, GPT-4o Scoring, and Brevo Email Outreach |
| OpenAI integration uses GPT-4o for lead scoring and email personalization                        | Requires OpenAI API key with GPT-4o access                                                     |
| Apollo.io API requires API key for lead scraping                                               | Apollo API documentation: https://apollo.io/api                                                |
| Brevo (SendInBlue) requires OAuth2 credentials for contact and email management                 | Brevo API documentation: https://developers.brevo.com/                                        |
| Crawl4AI and Apify used for data enrichment and crawling                                       | Crawl4AI: https://crawl4.ai/ , Apify: https://apify.com/docs/api                              |
| Batch processing nodes optimize API usage and processing time                                  | Adjust batch sizes carefully to avoid API rate limits                                         |
| Disabled SendInBlueTrigger nodes can be activated for real-time email event handling           | Ensure webhook URLs are correctly configured in Brevo dashboard                               |

---

Disclaimer: The text provided is extracted exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.

---