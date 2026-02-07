AI-Powered Lead Generation with Apollo, LinkedIn Research & 4-Step Personalized Emails

https://n8nworkflows.xyz/workflows/ai-powered-lead-generation-with-apollo--linkedin-research---4-step-personalized-emails-6101


# AI-Powered Lead Generation with Apollo, LinkedIn Research & 4-Step Personalized Emails

### 1. Workflow Overview

This workflow orchestrates an AI-powered lead generation process integrating Apollo, LinkedIn data scraping, and a multi-step personalized email campaign.  
The goal is to automatically identify, enrich, and contact prospects tailored to a defined target audience, optimizing outreach with AI-generated personalized messaging.

The workflow is logically divided into these blocks:

- **1.1 Input Reception & Query Construction**  
  Receives the target audience definition via a form, generates and constructs a query for Apollo prospect data extraction.

- **1.2 Prospect Retrieval & Filtering**  
  Uses Apollo’s API to scrape prospect data, extracts relevant info, filters it, and saves the clean prospect list in Google Sheets.

- **1.3 LinkedIn and Company Data Enrichment**  
  Iterates over prospects, conditionally scrapes LinkedIn profiles, enriches data with company information, and organizes the enriched data.

- **1.4 AI-Powered Personalization and Email Generation**  
  Calls OpenAI models to generate personalized LinkedIn openers and multi-step email sequences, analyzes data, and sets email parameters including timezone and sender address.

- **1.5 Email Finalization and Storage**  
  Adds opt-out tokens to emails, saves finalized emails and analysis results to Google Sheets, ready for outbound campaigns.

- **1.6 Orchestration and Scheduling**  
  Controls execution timing with a schedule trigger and batch processing for scalability.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Input Reception & Query Construction

**Overview:**  
This block receives the target audience input from a web form, then generates and builds an Apollo search URL query.

**Nodes Involved:**  
- Enter Target Audience (Form Trigger)  
- Generate Query (Set)  
- Create Apollo URL (Code)

**Node Details:**

- **Enter Target Audience**  
  - Type: Form Trigger — Listens for user input on target audience criteria.  
  - Configuration: Standard webhook form trigger, no additional parameters.  
  - Inputs: None (webhook event).  
  - Outputs: Triggers downstream nodes with form data.  
  - Edge Cases: Form input missing or malformed could cause empty queries.

- **Generate Query**  
  - Type: Set — Initializes or formats query parameters based on form input.  
  - Configuration: Sets fields for Apollo search criteria.  
  - Inputs: Data from Enter Target Audience.  
  - Outputs: Passes formatted query to next node.  
  - Edge Cases: Missing or invalid query parameters could yield empty or incorrect searches.

- **Create Apollo URL**  
  - Type: Code — Builds a fully qualified Apollo search URL from query parameters.  
  - Configuration: Custom JavaScript to encode and construct URL.  
  - Inputs: Query data from Generate Query.  
  - Outputs: Complete Apollo API endpoint URL.  
  - Edge Cases: URL encoding errors or malformed queries could cause API call failures.

---

#### 1.2 Prospect Retrieval & Filtering

**Overview:**  
This block calls Apollo’s API to fetch prospect data, extracts necessary info, filters out unqualified leads, and saves the prospects to Google Sheets.

**Nodes Involved:**  
- Apollo Scraper (httpRequest)  
- Extract Info (Set)  
- Filter (Filter)  
- Save Prospects (Google Sheets)

**Node Details:**

- **Apollo Scraper**  
  - Type: HTTP Request — Calls Apollo API with constructed URL to fetch prospects.  
  - Configuration: Authenticated request (likely with API key), GET method.  
  - Inputs: URL from Create Apollo URL.  
  - Outputs: Raw prospect data JSON.  
  - Edge Cases: API rate limits, auth failures, network timeouts.

- **Extract Info**  
  - Type: Set — Parses and extracts relevant fields from Apollo response for further use.  
  - Configuration: Maps raw JSON properties to structured prospect attributes.  
  - Inputs: Apollo Scraper response.  
  - Outputs: Cleaned prospect data.  
  - Edge Cases: Unexpected response schemas or missing fields.

- **Filter**  
  - Type: Filter — Applies criteria to exclude prospects not matching target criteria (e.g., industry, location).  
  - Configuration: Logical conditions on prospect fields.  
  - Inputs: Extracted prospect data.  
  - Outputs: Filtered prospects only.  
  - Edge Cases: Overly strict filters may exclude all data.

- **Save Prospects**  
  - Type: Google Sheets — Appends filtered prospects to a designated spreadsheet for record keeping.  
  - Configuration: Spreadsheet ID, sheet name, column mappings.  
  - Inputs: Filter output.  
  - Outputs: Confirmation of save action.  
  - Edge Cases: Google Sheets API quota, auth errors.

---

#### 1.3 LinkedIn and Company Data Enrichment

**Overview:**  
Iterates over saved prospects in batches, checks for LinkedIn presence, scrapes LinkedIn and company data, then prepares data for AI processing.

**Nodes Involved:**  
- Schedule Trigger (Schedule Trigger)  
- Get Prospects (Google Sheets)  
- Loop Over Items (Split In Batches)  
- If Linkedin Exists? (If)  
- Linkedin Scraper (httpRequest)  
- Edit Fields (Set)  
- Company Scraper (httpRequest)  
- About You (Set)  
- Analyse Data (OpenAI)

**Node Details:**

- **Schedule Trigger**  
  - Type: Schedule Trigger — Initiates the loop at configured intervals.  
  - Configuration: Cron or interval timing.  
  - Inputs: None.  
  - Outputs: Triggers Get Prospects node.  
  - Edge Cases: Scheduling misconfiguration.

- **Get Prospects**  
  - Type: Google Sheets — Reads prospect list for processing.  
  - Configuration: Spreadsheet and sheet selection.  
  - Inputs: Trigger from Schedule Trigger.  
  - Outputs: List of prospects.  
  - Edge Cases: Empty sheet, API issues.

- **Loop Over Items**  
  - Type: Split In Batches — Processes prospects in manageable batch sizes.  
  - Configuration: Batch size parameter.  
  - Inputs: Prospect list.  
  - Outputs: Single prospect per iteration.  
  - Edge Cases: Batch size zero or too large.

- **If Linkedin Exists?**  
  - Type: If — Checks if LinkedIn URL or identifier is present for the prospect.  
  - Configuration: Condition on LinkedIn field presence.  
  - Inputs: Single prospect.  
  - Outputs: True (scrape LinkedIn) or False (skip).  
  - Edge Cases: Missing or malformed LinkedIn info.

- **Linkedin Scraper**  
  - Type: HTTP Request — Scrapes LinkedIn profile data via API or scraping service.  
  - Configuration: Auth tokens, request headers.  
  - Inputs: Prospect LinkedIn info from If node.  
  - Outputs: LinkedIn profile data.  
  - Edge Cases: LinkedIn blocking, auth failure, rate limiting.  
  - On Error: Continues workflow with empty data to avoid blocking.

- **Edit Fields**  
  - Type: Set — Cleans and reformats LinkedIn data fields for consistency.  
  - Configuration: Field mappings and transformations.  
  - Inputs: LinkedIn scraper output.  
  - Outputs: Cleaned LinkedIn data.  
  - Edge Cases: Missing data fields.

- **Company Scraper**  
  - Type: HTTP Request — Fetches company-related data for prospect.  
  - Configuration: API endpoint, auth tokens.  
  - Inputs: Edited LinkedIn/company identifiers.  
  - Outputs: Company profile data.  
  - Edge Cases: API failures, missing company info.  
  - On Error: Continues workflow to avoid blocking.

- **About You**  
  - Type: Set — Augments data with static or user-provided info about the sender or campaign context.  
  - Configuration: Set static fields.  
  - Inputs: Company Scraper output.  
  - Outputs: Enriched data for AI analysis.  
  - Edge Cases: N/A.

- **Analyse Data**  
  - Type: OpenAI (Langchain) — Analyzes combined prospect and company data to inform personalization.  
  - Configuration: Prompt template, model selection.  
  - Inputs: About You node output.  
  - Outputs: Analytical insights.  
  - Edge Cases: AI model errors, API rate limits.

---

#### 1.4 AI-Powered Personalization and Email Generation

**Overview:**  
Generates personalized LinkedIn openers and multi-step email sequences using OpenAI, sets sending parameters including timezone and sender email.

**Nodes Involved:**  
- Organise Response (Code)  
- Generate LinkedIn Opener (OpenAI)  
- Genrate Emails (OpenAI)  
- Check Time Zone (Code)  
- Assign Sender Email (Code)

**Node Details:**

- **Organise Response**  
  - Type: Code — Prepares AI analysis output into structured format for messaging generation.  
  - Configuration: Custom JavaScript processing.  
  - Inputs: Analyse Data output.  
  - Outputs: Structured data for AI generation nodes.  
  - Edge Cases: Parsing errors.

- **Generate LinkedIn Opener**  
  - Type: OpenAI — Creates a personalized LinkedIn message opener.  
  - Configuration: Prompt instructing AI to generate engaging openers.  
  - Inputs: Organised response data.  
  - Outputs: LinkedIn opener text.  
  - Edge Cases: AI generation failures.

- **Genrate Emails**  
  - Type: OpenAI — Produces a 4-step personalized email sequence for outreach.  
  - Configuration: Prompt with instructions for multi-step email generation.  
  - Inputs: LinkedIn opener and structured data.  
  - Outputs: Email drafts.  
  - Edge Cases: Model timeouts or errors.

- **Check Time Zone**  
  - Type: Code — Determines recipient timezone for optimal send timing.  
  - Configuration: Custom code using prospect location data.  
  - Inputs: Genrate Emails output.  
  - Outputs: Timezone info appended.  
  - Edge Cases: Missing or ambiguous location data.

- **Assign Sender Email**  
  - Type: Code — Selects or assigns the sender email address based on rules or availability.  
  - Configuration: Custom logic for sender email selection.  
  - Inputs: Output of Check Time Zone.  
  - Outputs: Email with sender assigned.  
  - Edge Cases: No valid sender found.

---

#### 1.5 Email Finalization and Storage

**Overview:**  
Adds opt-out tokens to emails and saves the finalized email content and analysis results into Google Sheets for record-keeping and compliance.

**Nodes Involved:**  
- Add Opt Out Token (Code)  
- Save Emails (Google Sheets)  
- Save Analysis (Google Sheets)

**Node Details:**

- **Add Opt Out Token**  
  - Type: Code — Embeds an opt-out link or token for compliance in each email.  
  - Configuration: Custom code generating tokenized unsubscribe links.  
  - Inputs: Email data with sender assigned.  
  - Outputs: Final email content with opt-out.  
  - Edge Cases: Token generation failures.

- **Save Emails**  
  - Type: Google Sheets — Stores finalized emails in a spreadsheet.  
  - Configuration: Spreadsheet and sheet details.  
  - Inputs: Emails with opt-out tokens.  
  - Outputs: Confirmation.  
  - Edge Cases: API limits, auth failure.

- **Save Analysis**  
  - Type: Google Sheets — Logs AI analysis and related data for auditing and review.  
  - Configuration: Spreadsheet and sheet details.  
  - Inputs: Analytical insights from earlier steps.  
  - Outputs: Confirmation.  
  - Edge Cases: Same as Save Emails.

---

#### 1.6 Orchestration and Scheduling

**Overview:**  
Controls the overall execution timing and batch processing of prospects to handle large datasets efficiently.

**Nodes Involved:**  
- Schedule Trigger  
- Loop Over Items

**Node Details:**

- **Schedule Trigger**  
  - See above in 1.3.  
  - Controls when prospect retrieval and processing runs.

- **Loop Over Items**  
  - See above in 1.3.  
  - Enables batch-wise processing with error continuation on LinkedIn scraping.

---

### 3. Summary Table

| Node Name              | Node Type              | Functional Role                              | Input Node(s)               | Output Node(s)              | Sticky Note                         |
|------------------------|------------------------|----------------------------------------------|-----------------------------|-----------------------------|-----------------------------------|
| Sticky Note2           | Sticky Note            | Visual/comment element                        |                             |                             |                                   |
| Generate Query         | Set                    | Formats query parameters from form input     | Enter Target Audience        | Create Apollo URL            |                                   |
| Create Apollo URL      | Code                   | Constructs Apollo API URL from query          | Generate Query               | Apollo Scraper              |                                   |
| Filter                 | Filter                 | Filters prospects based on criteria           | Extract Info                 | Save Prospects              |                                   |
| Save Prospects         | Google Sheets          | Stores filtered prospect data                  | Filter                      |                             |                                   |
| Sticky Note3           | Sticky Note            | Visual/comment element                         |                             |                             |                                   |
| Sticky Note4           | Sticky Note            | Visual/comment element                         |                             |                             |                                   |
| Sticky Note            | Sticky Note            | Visual/comment element                         |                             |                             |                                   |
| Apollo Scraper (paid)  | HTTP Request           | Calls Apollo API to fetch prospect data        | Create Apollo URL            | Extract Info                |                                   |
| Apollo Scraper         | HTTP Request           | Calls Apollo API to fetch prospect data        | Create Apollo URL            | Extract Info                |                                   |
| Extract Info           | Set                    | Parses Apollo response to extract fields       | Apollo Scraper               | Filter                      |                                   |
| Edit Fields            | Set                    | Cleans and formats LinkedIn scraped data       | Linkedin Scraper             | Company Scraper             |                                   |
| Check Time Zone        | Code                   | Determines recipient timezone                   | Genrate Emails              | Assign Sender Email         |                                   |
| Assign Sender Email    | Code                   | Assigns sender email address                     | Check Time Zone             | Add Opt Out Token           |                                   |
| Add Opt Out Token      | Code                   | Adds opt-out tokens for compliance               | Assign Sender Email         | Save Emails                 |                                   |
| Save Emails            | Google Sheets          | Stores finalized emails                           | Add Opt Out Token           | Save Analysis               |                                   |
| Save Analysis          | Google Sheets          | Logs AI analysis data                             | Save Emails                 | Loop Over Items             |                                   |
| Generate LinkedIn Opener | OpenAI (Langchain)    | Creates personalized LinkedIn message opener     | Organise Response           | Genrate Emails              |                                   |
| Analyse Data           | OpenAI (Langchain)     | AI analysis of prospect and company data          | About You                  | Organise Response           |                                   |
| Genrate Emails         | OpenAI (Langchain)     | Generates 4-step personalized email sequence      | Generate LinkedIn Opener    | Check Time Zone             |                                   |
| Schedule Trigger       | Schedule Trigger       | Initiates workflow execution on schedule           |                             | Get Prospects               |                                   |
| If Linkedin Exists?    | If                     | Checks for LinkedIn presence                        | Loop Over Items (batch)      | Linkedin Scraper / Loop Over Items |                                   |
| Get Prospects          | Google Sheets          | Reads prospect list for processing                   | Schedule Trigger            | Loop Over Items             |                                   |
| Loop Over Items        | Split In Batches       | Batch processes prospects                            | Get Prospects               | If Linkedin Exists?         |                                   |
| Linkedin Scraper       | HTTP Request           | Scrapes LinkedIn profile data                        | If Linkedin Exists?          | Edit Fields                 | On error continues workflow       |
| Company Scraper        | HTTP Request           | Scrapes company data                                  | Edit Fields                 | About You                   | On error continues workflow       |
| Organise Response      | Code                   | Structures AI analysis output                         | Analyse Data                | Generate LinkedIn Opener    |                                   |
| About You              | Set                    | Adds sender/campaign context info                      | Company Scraper             | Analyse Data                |                                   |
| Sticky Note5           | Sticky Note            | Visual/comment element                                 |                             |                             |                                   |
| Enter Target Audience  | Form Trigger           | Receives target audience input                        |                             | Generate Query              |                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Input Reception Block**  
   - Add a **Form Trigger** node named *Enter Target Audience*. Configure webhook as needed for input.  
   - Add a **Set** node named *Generate Query* connected to the Form Trigger. Configure it to map form fields into query parameters for Apollo.  
   - Add a **Code** node named *Create Apollo URL* connected to *Generate Query*. Implement JavaScript code that builds the Apollo API search URL from the query parameters.

2. **Set Up Prospect Retrieval & Filtering**  
   - Add an **HTTP Request** node named *Apollo Scraper* connected to *Create Apollo URL*. Configure with Apollo API credentials and GET method.  
   - Add a **Set** node named *Extract Info* connected to *Apollo Scraper*. Map and parse the relevant data fields from Apollo’s JSON response.  
   - Add a **Filter** node named *Filter* connected to *Extract Info*. Define filtering rules to include only qualified prospects.  
   - Add a **Google Sheets** node named *Save Prospects* connected to *Filter*. Configure sheet ID, tab, and columns for storing filtered prospects.

3. **Build LinkedIn and Company Data Enrichment**  
   - Add a **Schedule Trigger** node named *Schedule Trigger*. Set desired cron schedule.  
   - Add a **Google Sheets** node named *Get Prospects* connected to *Schedule Trigger*. Configure to read saved prospects.  
   - Add a **Split In Batches** node named *Loop Over Items* connected to *Get Prospects*. Set batch size (e.g., 10-20).  
   - Add an **If** node named *If Linkedin Exists?* connected to the first output of *Loop Over Items*. Configure condition to check LinkedIn URL presence.  
   - Add an **HTTP Request** node named *Linkedin Scraper* connected to the true branch of *If Linkedin Exists?*. Configure scraping API with auth. Set error handling to continue on failure.  
   - Add a **Set** node named *Edit Fields* connected to *Linkedin Scraper*. Set field mappings and cleanup logic.  
   - Add an **HTTP Request** node named *Company Scraper* connected to *Edit Fields*. Configure company data API call with auth and error handling.  
   - Add a **Set** node named *About You* connected to *Company Scraper*. Add static info about sender or campaign context.  
   - Add an **OpenAI (Langchain)** node named *Analyse Data* connected to *About You*. Configure with OpenAI credentials, prompt template for analyzing prospect data.

4. **Configure AI-Powered Personalization and Email Generation**  
   - Add a **Code** node named *Organise Response* connected to *Analyse Data*. Format AI output for next steps.  
   - Add an **OpenAI (Langchain)** node named *Generate LinkedIn Opener* connected to *Organise Response*. Configure prompt to generate personalized LinkedIn openers.  
   - Add an **OpenAI (Langchain)** node named *Genrate Emails* connected to *Generate LinkedIn Opener*. Configure prompt to generate 4-step personalized email sequences.  
   - Add a **Code** node named *Check Time Zone* connected to *Genrate Emails*. Implement logic to assign timezone based on prospect data.  
   - Add a **Code** node named *Assign Sender Email* connected to *Check Time Zone*. Implement logic to assign sender email address dynamically.

5. **Finalize Emails and Save Outputs**  
   - Add a **Code** node named *Add Opt Out Token* connected to *Assign Sender Email*. Implement unsubscribe token insertion.  
   - Add a **Google Sheets** node named *Save Emails* connected to *Add Opt Out Token*. Configure to save final emails.  
   - Add a **Google Sheets** node named *Save Analysis* connected to *Save Emails*. Configure to save AI analysis data.  
   - Connect *Save Analysis* back to *Loop Over Items* to continue batch processing.

6. **Add Error Handling and Continuity**  
   - For HTTP Request nodes that might fail (Linkedin Scraper, Company Scraper), set error workflow to continue to avoid halting batch processing.

7. **Add Sticky Notes**  
   - Place sticky notes as visual documentation or reminders as needed in the editor.

8. **Credential Setup**  
   - Configure API credentials for Apollo, LinkedIn (if applicable), Google Sheets (OAuth2), and OpenAI.  
   - Ensure API keys and OAuth tokens are properly secured and tested.

9. **Test and Debug**  
   - Test each block individually, verify data integrity at each step.  
   - Monitor for API quota limits, timeout issues, and data parsing errors.  
   - Adjust batch sizes and schedules according to performance.

---

### 5. General Notes & Resources

| Note Content                                                                                          | Context or Link                                                  |
|-----------------------------------------------------------------------------------------------------|-----------------------------------------------------------------|
| Apollo scraping requires a paid account with API access for reliable prospect data retrieval.        | https://www.apollo.io/                                          |
| LinkedIn scraping may be subject to blocking or legal restrictions; use compliant APIs or services. | Consider LinkedIn API usage policies and rate limits.           |
| OpenAI prompts should be carefully designed to ensure relevant and coherent output.                   | See OpenAI prompt best practices documentation.                  |
| Google Sheets integration requires OAuth2 credentials with proper scopes for read/write access.      | https://developers.google.com/sheets/api/guides/authorizing     |
| Error handling is implemented to continue processing in case of individual LinkedIn or company scraping failures. | Prevents batch interruption on partial failures.                |
| For personalization, timezone detection improves email engagement by optimizing send times.         | Consider edge cases with ambiguous location data.               |

---

**Disclaimer:**  
The provided description and analysis are based exclusively on the n8n workflow JSON metadata shared and respect all applicable content policies. All data handled is public and legal.