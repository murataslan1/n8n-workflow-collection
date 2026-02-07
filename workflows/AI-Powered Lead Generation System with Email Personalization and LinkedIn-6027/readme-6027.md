AI-Powered Lead Generation System with Email Personalization and LinkedIn

https://n8nworkflows.xyz/workflows/ai-powered-lead-generation-system-with-email-personalization-and-linkedin-6027


# AI-Powered Lead Generation System with Email Personalization and LinkedIn

### 1. Workflow Overview

This workflow is an AI-powered lead generation system designed to identify promising companies on LinkedIn, score and enrich company data, find decision-makers within those companies, retrieve verified emails, and generate personalized cold email sequences. It integrates LinkedIn data via the Ghost Genius API, AI-driven scoring and email personalization via OpenAI, and data storage/management in Google Sheets.

**Target Use Cases:**  
- Sales teams seeking qualified leads with personalized outreach  
- Marketing automation for cold email campaigns  
- Lead enrichment and CRM updating  

**Logical Blocks:**  
- **1.1 LinkedIn Company Search & Scoring:** Search LinkedIn for companies matching criteria, enrich details, score with AI, and store qualified companies.  
- **1.2 Daily Trigger & Company Loading:** Triggered daily, loads qualified companies from storage for further processing.  
- **1.3 Decision Makers Identification & Email Enrichment:** For each qualified company, find decision-makers, enrich their profiles, and retrieve verified emails.  
- **1.4 AI-Powered Email Personalization & Generation:** Generate personalized email setups, cold email sequences, and subject lines using OpenAI models.  
- **1.5 Data Storage & Status Updates:** Store leads and emails in Google Sheets and update company status accordingly.  
- **1.6 Controls & Error Handling:** Includes validation for API key presence, company existence checks, and graceful handling when no decision-makers are found.

---

### 2. Block-by-Block Analysis

#### 2.1 LinkedIn Company Search & Scoring

- **Overview:**  
  This block initiates the lead generation by searching LinkedIn companies via the Ghost Genius API, extracting relevant data, filtering based on quality, scoring companies with AI, and storing them in a CRM Google Sheet.

- **Nodes Involved:**  
  - Start (Manual Trigger)  
  - Get Settings (Google Sheets)  
  - Aggregate1 (Aggregation)  
  - If (Validation for API key and Account ID)  
  - Make the perfect request (OpenAI - keyword extraction)  
  - Search Companies (HTTP Request to Ghost Genius)  
  - Extract Company Data (SplitOut)  
  - Process Each Company (SplitInBatches)  
  - Get Company Info (HTTP Request)  
  - Filter Valid Companies (If)  
  - Check If Company Exists (Google Sheets)  
  - Is New Company? (If)  
  - AI Company Scoring (OpenAI)  
  - Add Company to CRM (Google Sheets)  
  - Sticky Notes (explanations)

- **Node Details:**  

  - **Start**  
    - Type: Manual Trigger  
    - Role: Entry point for manual execution.  
    - Connections: Triggers Get Settings node.  
    - Edge cases: None.

  - **Get Settings**  
    - Type: Google Sheets (read)  
    - Role: Loads user-configured settings from the "Settings" sheet.  
    - Key Config: Reads settings once per execution; pulls API keys, target audience, etc.  
    - Edge cases: Failure to connect or missing data triggers the If node fail path.

  - **Aggregate1**  
    - Type: Aggregate  
    - Role: Aggregates all settings into a single JSON object for easy access downstream.  
    - Edge cases: Empty or malformed settings may cause failures in dependent nodes.

  - **If**  
    - Type: Conditional check  
    - Role: Validates presence of API key and Account ID in settings.  
    - Edge cases: Stops workflow with error if credentials are missing.

  - **Make the perfect request**  
    - Type: OpenAI (LangChain)  
    - Role: Extracts clean keywords from user input to optimize LinkedIn company search.  
    - Key expressions: Uses settings for target audience to generate keywords.  
    - Edge cases: AI response failure or empty keyword list.

  - **Search Companies**  
    - Type: HTTP Request  
    - Role: Queries Ghost Genius API to search LinkedIn companies matching keywords, location, and size filters.  
    - Pagination enabled with delays to respect API limits.  
    - Edge cases: API limits, network errors, or empty results.

  - **Extract Company Data**  
    - Type: SplitOut  
    - Role: Splits paginated search results into individual company items.  
    - Edge cases: Empty or malformed data.

  - **Process Each Company**  
    - Type: SplitInBatches  
    - Role: Processes companies one by one in batches to prevent rate limits.  
    - Edge cases: Large datasets may cause slow execution or timeouts.

  - **Get Company Info**  
    - Type: HTTP Request  
    - Role: Enriches company info using Ghost Genius API by LinkedIn company URL.  
    - Retry enabled with delay.  
    - Edge cases: API failure, invalid URLs.

  - **Filter Valid Companies**  
    - Type: If  
    - Role: Filters companies with a valid website and minimum 200 followers to ensure credibility.  
    - Edge cases: Incorrect filtering logic or missing fields.

  - **Check If Company Exists**  
    - Type: Google Sheets (search)  
    - Role: Checks if the company already exists in the CRM based on LinkedIn ID to avoid duplicates.  
    - Edge cases: Sheet connection failures.

  - **Is New Company?**  
    - Type: If  
    - Role: Branches logic to score new companies or skip existing ones.  
    - Edge cases: Incorrect condition evaluation.

  - **AI Company Scoring**  
    - Type: OpenAI (LangChain)  
    - Role: Scores companies from 0 to 10 based on fit to product and potential interest.  
    - Uses detailed company data as input.  
    - Outputs JSON with score and explanation.  
    - Edge cases: AI timeout or malformed response.

  - **Add Company to CRM**  
    - Type: Google Sheets (append)  
    - Role: Adds qualified companies with score and details to "Companies" sheet, setting state to "Qualified".  
    - Edge cases: Sheet write failures.

  - **Sticky Notes**  
    - Explain API limits, filtering rationale, and setup tips.  
    - Provide context on LinkedIn Sales Navigator limits and Ghost Genius API usage.

---

#### 2.2 Daily Trigger & Company Loading

- **Overview:**  
  Triggered daily by a schedule node, this block loads qualified companies from the CRM for further processing (finding contacts, enriching, and emailing).

- **Nodes Involved:**  
  - Schedule Trigger  
  - Get Settings1 (Google Sheets)  
  - Aggregate  
  - If1 (Validation for API key and Account ID)  
  - Companies Recovery (Google Sheets)  
  - Filter Score and State (Filter)  
  - Limit (Limit node to max 100 companies)  
  - Loop Over Items (SplitInBatches)  
  - Sticky Notes

- **Node Details:**

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Starts the workflow on a set interval (daily).  
    - Edge cases: Execution missed or delayed.

  - **Get Settings1**  
    - Same as Get Settings, loads user settings once.

  - **Aggregate**  
    - Same as Aggregate1, aggregates settings.

  - **If1**  
    - Validates presence of API key and Account ID; stops if missing.

  - **Companies Recovery**  
    - Google Sheets Read node fetching all companies from "Companies" sheet.

  - **Filter Score and State**  
    - Filters companies with Score >= 7 and State = "Qualified" for further processing.

  - **Limit**  
    - Limits processing to max 100 companies per day to stay within API limits.

  - **Loop Over Items**  
    - Processes companies one by one in batches.

  - **Sticky Notes**  
    - Explain rationale for filters and API limits, emphasizing the need to respect LinkedIn Sales Navigator daily limits.

---

#### 2.3 Decision Makers Identification & Email Enrichment

- **Overview:**  
  For each qualified company, this block finds decision-makers via the Ghost Genius API, enriches their LinkedIn profiles, retrieves verified emails, and handles cases where no decision-makers are found.

- **Nodes Involved:**  
  - Find Employees (HTTP Request)  
  - Check profiles Found (If)  
  - Split Profiles (SplitOut)  
  - Get Profile details (HTTP Request)  
  - Get Email (HTTP Request)  
  - No decision maker found (Google Sheets update)  
  - Sticky Notes

- **Node Details:**

  - **Find Employees**  
    - HTTP Request to Ghost Genius Sales Navigator endpoint querying decision-makers by company ID, account ID, and job titles from settings.  
    - Retries enabled with delay to handle API limits.  
    - Edge cases: API failure, no results.

  - **Check profiles Found**  
    - If node checking if at least one profile was found (total >= 1).  
    - Branches to Split Profiles if found; otherwise, updates company state to "No decision maker found".

  - **Split Profiles**  
    - Splits decision-maker profiles for individual processing.

  - **Get Profile details**  
    - Fetches detailed profile info from Ghost Genius by LinkedIn URL.  
    - Retry with delay enabled.

  - **Get Email**  
    - Uses Ghost Genius contact/email endpoint with prospect first name, last name, and company domain to find verified email.  
    - Batching and retry enabled to respect rate limits.

  - **No decision maker found**  
    - Updates company state in Google Sheets to indicate no contacts found.

  - **Sticky Note**  
    - Explains the process of finding decision-makers, email enrichment, and fallback handling.

---

#### 2.4 AI-Powered Email Personalization & Generation

- **Overview:**  
  Using enriched profiles, this block generates personalization setups, writes 3 cold email messages, and creates subject lines using OpenAI models.

- **Nodes Involved:**  
  - Keep relevant information (Code)  
  - Create Personalization (OpenAI)  
  - Generate Emails Messages (OpenAI)  
  - Generate Emails Subjects (OpenAI)  
  - Add lead(s) (Google Sheets)  
  - Lead(s) found (Google Sheets update)  
  - Sticky Notes

- **Node Details:**

  - **Keep relevant information**  
    - Code node extracting and simplifying profile info for downstream AI prompts.  
    - Inputs: Profile details and company info.  
    - Outputs: first_name, last_name, headline, position, position_description, summary, company_name.

  - **Create Personalization**  
    - OpenAI node using "o3-mini" model that analyzes prospect data and company info to recommend one specific personalization angle.  
    - Outputs a structured setup for another AI to write personalized cold emails later.  
    - Edge cases: AI response failure or incomplete output.

  - **Generate Emails Messages**  
    - OpenAI node writing three short, informal cold emails designed to attract attention and provoke responses without selling.  
    - Uses personalization setup and prospect info as input.  
    - Outputs structured JSON with initial email and two follow-ups.  
    - Edge cases: AI limitations or inappropriate content generation.

  - **Generate Emails Subjects**  
    - OpenAI node creating subject lines for the 3 emails.  
    - Uses the email bodies as input to craft short, curiosity-piquing subject lines.  
    - Edge cases: AI response failures.

  - **Add lead(s)**  
    - Google Sheets append node storing enriched lead data, emails, and subjects in "Leads" sheet.  
    - Mapping includes email, names, LinkedIn URL, company name, current position, email messages, and subjects.  
    - Edge cases: Sheet write failure.

  - **Lead(s) found**  
    - Updates company state in "Companies" sheet to "Enriched" after lead data is stored.

  - **Sticky Note**  
    - Explains the email generation and storage process, with notes on prompt customization for better personalization.

---

#### 2.5 Controls & Error Handling

- **Overview:**  
  This block ensures the workflow stops gracefully if required credentials are missing or if no decision makers are found.

- **Nodes Involved:**  
  - If (Credential checks)  
  - If1 (Credential checks)  
  - Missing API Key or Account ID (StopAndError)  
  - Missing API Key or Account ID1 (StopAndError)  
  - No decision maker found (Google Sheets update)  
  - Sticky Notes ("Exit")

- **Node Details:**  

  - **If and If1**  
    - Checks for presence of API key and Account ID before progressing.  
    - Branches to StopAndError nodes on failure.

  - **Missing API Key or Account ID / Missing API Key or Account ID1**  
    - Stops workflow with error message to alert user of missing credentials.

  - **No decision maker found**  
    - Updates company state in Google Sheets and loops back to next company.

  - **Sticky Notes**  
    - Mark exit points for clarity.

---

### 3. Summary Table

| Node Name                  | Node Type                   | Functional Role                                    | Input Node(s)                  | Output Node(s)                         | Sticky Note                                                   |
|----------------------------|-----------------------------|---------------------------------------------------|-------------------------------|---------------------------------------|---------------------------------------------------------------|
| Start                      | Manual Trigger              | Manual workflow start                             | -                             | Get Settings                         |                                                               |
| Get Settings               | Google Sheets               | Load settings for company search                  | Start                         | Aggregate1                           |                                                               |
| Aggregate1                 | Aggregate                   | Aggregate settings data                            | Get Settings                  | If                                   |                                                               |
| If                         | If                          | Check API key and Account ID presence             | Aggregate1                    | Make the perfect request / Stop      |                                                               |
| Make the perfect request   | OpenAI (LangChain)          | Extract keywords for company search               | If                           | Search Companies                    |                                                               |
| Search Companies           | HTTP Request                | Search companies on LinkedIn via Ghost Genius API| Make the perfect request      | Extract Company Data                 | Sticky Note4: LinkedIn company search explanation             |
| Extract Company Data       | SplitOut                   | Extract individual companies from search results | Search Companies              | Process Each Company                |                                                               |
| Process Each Company       | SplitInBatches             | Batch process each company                         | Extract Company Data          | Get Company Info / (skip)            |                                                               |
| Get Company Info           | HTTP Request                | Enrich company data                               | Process Each Company          | Filter Valid Companies              |                                                               |
| Filter Valid Companies     | If                          | Filter companies by website and followers count  | Get Company Info              | Check If Company Exists / Process Each Company |                                                               |
| Check If Company Exists    | Google Sheets               | Check if company already exists in CRM            | Filter Valid Companies        | Is New Company?                     |                                                               |
| Is New Company?            | If                          | Branch for new or existing companies              | Check If Company Exists       | AI Company Scoring / Process Each Company |                                                               |
| AI Company Scoring         | OpenAI (LangChain)          | Score company fit for lead generation              | Is New Company?               | Add Company to CRM                 | Sticky Note5: AI scoring and storage explanation              |
| Add Company to CRM         | Google Sheets               | Store scored company in CRM                         | AI Company Scoring            | Process Each Company                |                                                               |
| Schedule Trigger           | Schedule Trigger            | Daily trigger for second workflow                  | -                             | Get Settings1                      |                                                               |
| Get Settings1              | Google Sheets               | Load settings for lead processing                  | Schedule Trigger             | Aggregate                          |                                                               |
| Aggregate                  | Aggregate                   | Aggregate settings data                            | Get Settings1                 | If1                              |                                                               |
| If1                        | If                          | Check API key and Account ID presence             | Aggregate                    | Companies Recovery / Stop           |                                                               |
| Companies Recovery         | Google Sheets               | Load qualified companies from CRM                  | If1                         | Filter Score and State             | Sticky Note: Data recovery explanation                        |
| Filter Score and State     | Filter                      | Filter companies with score >=7 and state Qualified | Companies Recovery           | Limit                             |                                                               |
| Limit                      | Limit                       | Limit number of companies processed daily         | Filter Score and State       | Loop Over Items                   |                                                               |
| Loop Over Items            | SplitInBatches             | Process companies one by one                        | Limit                        | Find Employees / (empty branch)   | Sticky Note2: Find decision makers explanation                |
| Find Employees             | HTTP Request                | Find decision-makers for each company              | Loop Over Items              | Check profiles Found              |                                                               |
| Check profiles Found       | If                          | Check if decision-makers found                      | Find Employees               | Split Profiles / No decision maker found |                                                               |
| Split Profiles             | SplitOut                   | Split decision-maker profiles                       | Check profiles Found         | Get Profile details              |                                                               |
| Get Profile details        | HTTP Request                | Enrich profile details                             | Split Profiles              | Get Email                        |                                                               |
| Get Email                  | HTTP Request                | Retrieve verified email                             | Get Profile details          | Keep relevant information        |                                                               |
| No decision maker found    | Google Sheets               | Update company state to "No decision maker found" | Check profiles Found         | Loop Over Items                  |                                                               |
| Keep relevant information  | Code                        | Simplify profile data for AI personalization       | Get Email                   | Create Personalization           |                                                               |
| Create Personalization     | OpenAI (LangChain)          | Generate personalization setup for emails          | Keep relevant information    | Generate Emails Messages         | Sticky Note6: Email generation and storage explanation        |
| Generate Emails Messages   | OpenAI (LangChain)          | Write 3 cold email messages                         | Create Personalization       | Generate Emails Subjects         |                                                               |
| Generate Emails Subjects   | OpenAI (LangChain)          | Write subject lines for emails                      | Generate Emails Messages     | Add lead(s)                     |                                                               |
| Add lead(s)                | Google Sheets               | Append lead and email data to CRM                   | Generate Emails Subjects     | Lead(s) found                  |                                                               |
| Lead(s) found             | Google Sheets               | Update company state to "Enriched"                  | Add lead(s)                 | Loop Over Items                 |                                                               |
| Missing API Key or Account ID | StopAndError          | Stop workflow with error message                    | If / If1                    | -                               |                                                               |
| Sticky Notes (various)     | Sticky Note                 | Explanations, instructions, and exit points        | -                           | -                               | Various notes with setup instructions and context             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node** (Start)  
   - Purpose: Manual start of lead search and scoring workflow.

2. **Add Google Sheets Node "Get Settings"**  
   - Connect from Start.  
   - Configure to read settings sheet from your Google Sheets document (Settings tab).  
   - Ensure Google Sheets credentials set up.  
   - Set mode to read all rows automatically.

3. **Add Aggregate Node "Aggregate1"**  
   - Connect from Get Settings.  
   - Aggregate all rows into a single JSON object named "settings".

4. **Add If Node "If"**  
   - Connect from Aggregate1.  
   - Condition: Check if API Key (settings[6]) and Account ID (settings[2]) are non-empty strings.  
   - If true, continue; if false, connect to StopAndError node.

5. **Add StopAndError Node "Missing API Key or Account ID"**  
   - Connect from If false branch.  
   - Set error message: "Missing API Key or Account ID in the Google Sheet".

6. **Add OpenAI Node "Make the perfect request"**  
   - Connect from If true branch.  
   - Model: "o3-mini" or preferred OpenAI model.  
   - System prompt to extract clean keywords from user target audience input (see node details).  
   - Input: settings[1] (target audience description).  
   - JSON output enabled.

7. **Add HTTP Request Node "Search Companies"**  
   - Connect from Make the perfect request.  
   - URL: Ghost Genius API endpoint for company search.  
   - Query params: keywords (from AI output), locations, company size (from settings).  
   - Headers: Authorization Bearer token from API key in settings.  
   - Enable pagination with rate limiting (1 request per 2 seconds).  
   - Set max pages (e.g., 100) to avoid exceeding API limits.

8. **Add SplitOut Node "Extract Company Data"**  
   - Connect from Search Companies.  
   - Split out "data" field containing list of companies.

9. **Add SplitInBatches Node "Process Each Company"**  
   - Connect from Extract Company Data.  
   - Batch size: 1 or as needed for API limits.

10. **Add HTTP Request Node "Get Company Info"**  
    - Connect from Process Each Company.  
    - URL: Ghost Genius company detail endpoint.  
    - Query param: LinkedIn URL from current item.  
    - Header: Authorization with Bearer token.  
    - Retry on fail enabled with 1.5 sec interval.

11. **Add If Node "Filter Valid Companies"**  
    - Connect from Get Company Info.  
    - Conditions: website is not empty AND followers count > 200.

12. **Add Google Sheets Node "Check If Company Exists"**  
    - Connect from Filter Valid Companies true branch.  
    - Search "Companies" sheet filtering by LinkedIn ID.  
    - Return matches if any.

13. **Add If Node "Is New Company?"**  
    - Connect from Check If Company Exists.  
    - Condition: No existing entry found.

14. **Add OpenAI Node "AI Company Scoring"**  
    - Connect from Is New Company? true branch.  
    - Model: "o3-mini".  
    - Prompt: Score company 0-10 for interest in product (from settings).  
    - Input: company data from Get Company Info.  
    - JSON output enabled.

15. **Add Google Sheets Node "Add Company to CRM"**  
    - Connect from AI Company Scoring.  
    - Append new company with score, explanation, and state "Qualified" to "Companies" sheet.

16. **Connect Add Company to CRM back to Process Each Company** for next iteration.

17. **Create second workflow or branch starting with Schedule Trigger**  
    - Schedule daily trigger node.

18. **Add Google Sheets Node "Get Settings1"**  
    - Connect from Schedule Trigger.  
    - Reads same settings sheet.

19. **Add Aggregate Node "Aggregate"**  
    - Aggregate settings data.

20. **Add If Node "If1"**  
    - Validate presence of API key and account ID.

21. **Add StopAndError Node "Missing API Key or Account ID1"**  
    - Connect if validation fails.

22. **Add Google Sheets Node "Companies Recovery"**  
    - Connect from If1 true branch.  
    - Read all companies from "Companies" sheet.

23. **Add Filter Node "Filter Score and State"**  
    - Filter companies with Score >=7 and State == "Qualified".

24. **Add Limit Node "Limit"**  
    - Limit to max 100 companies per day.

25. **Add SplitInBatches Node "Loop Over Items"**  
    - Process companies in batches.

26. **Add HTTP Request Node "Find Employees"**  
    - Connect from Loop Over Items.  
    - Query Ghost Genius Sales Navigator endpoint for decision-makers by company ID, account ID, and job titles (from settings).  
    - Retry enabled.

27. **Add If Node "Check profiles Found"**  
    - Check if total profiles found >=1.

28. **Add SplitOut Node "Split Profiles"**  
    - Split profiles if found.

29. **Add HTTP Request Node "Get Profile details"**  
    - For each profile, get detailed info.

30. **Add HTTP Request Node "Get Email"**  
    - Retrieve verified emails using first name, last name, and company URL.

31. **Add Code Node "Keep relevant information"**  
    - Simplify profile and company info for AI email personalization.

32. **Add OpenAI Node "Create Personalization"**  
    - Generate email personalization setup with product and prospect info.

33. **Add OpenAI Node "Generate Emails Messages"**  
    - Generate 3 cold email messages using personalization.

34. **Add OpenAI Node "Generate Emails Subjects"**  
    - Generate subject lines for each email.

35. **Add Google Sheets Node "Add lead(s)"**  
    - Append lead data, emails, subjects, and profile info to "Leads" sheet.

36. **Add Google Sheets Node "Lead(s) found"**  
    - Update company state to "Enriched" in "Companies" sheet.

37. **Add Google Sheets Node "No decision maker found"**  
    - Update company state as "No decision maker found" if no profiles.

38. **Add StopAndError nodes for missing credentials where needed.**

39. **Add Sticky Notes** (optional) with instructions and explanations for clarity.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                         | Context or Link                                                                                                                    |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| The workflow handles LinkedIn Sales Navigator rate limits by limiting company processing to 100 per day to avoid hitting daily limits of 2,500 search results.       | Sticky Note near Limit node                                                                                                       |
| Ghost Genius API provides cookieless access to LinkedIn public and private endpoints, simplifying data retrieval without personal account risks.                    | https://ghostgenius.fr                                                                                                            |
| OpenAI prompts are highly customizable for both company scoring and email generation; adjusting them improves personalization effectiveness.                       | Sticky Note6 and Sticky Note5                                                                                                    |
| Google Sheets used as CRM and data storage; ensure correct credential setup via n8n and proper sheet sharing permissions.                                           | https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googlesheets/                                                    |
| Setup instructions include obtaining API keys for Ghost Genius and OpenAI, configuring Google Sheets, and linking Sales Navigator account with Ghost Genius API.   | Sticky Note10                                                                                                                    |
| For additional support or customization, users can book a call or contact the author via LinkedIn.                                                                  | https://cal.com/soufiane-ghostgenius/workflows-setup-x-ghost-genius-copy and www.linkedin.com/in/matthieu-belin83                 |
| This automation is designed for use with Ghost Genius API but can be adapted to other CRM or data providers with sufficient technical skill.                        | Sticky Note11                                                                                                                    |

---

**Disclaimer:** The provided information is extracted from an automated n8n workflow. It complies fully with content policies and processes only legal, public data.