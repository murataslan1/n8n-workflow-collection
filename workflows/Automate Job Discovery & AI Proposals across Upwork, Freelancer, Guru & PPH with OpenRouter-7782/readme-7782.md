Automate Job Discovery & AI Proposals across Upwork, Freelancer, Guru & PPH with OpenRouter

https://n8nworkflows.xyz/workflows/automate-job-discovery---ai-proposals-across-upwork--freelancer--guru---pph-with-openrouter-7782


# Automate Job Discovery & AI Proposals across Upwork, Freelancer, Guru & PPH with OpenRouter

### 1. Workflow Overview

This workflow automates the discovery of freelance job postings from multiple platforms (Upwork, Freelancer, Guru, PeoplePerHour) using RSS feeds, analyzes and extracts relevant job details, generates AI-based customized proposals, and manages communication and tracking through email and Google Sheets updates. It is designed to streamline the job application process by integrating AI-driven content generation with real-time job feed ingestion and structured data management.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & Filtering:** Receives new job postings via RSS feed, filters and limits items for processing.
- **1.2 Job Data Extraction:** Processes each job posting to extract key details such as title, budget, URL, and source.
- **1.3 AI Proposal Generation:** Uses OpenRouter and LangChain agents to generate tailored job proposals based on extracted data.
- **1.4 Data Management & Aggregation:** Updates Google Sheets with job and proposal data, manages waiting for batch completion, aggregates data for reporting.
- **1.5 Email Notification:** Builds and sends an aggregated HTML email summarizing new proposals submitted.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Filtering

- **Overview:**  
  This block triggers the workflow upon new RSS feed entries, applies a limit on the number of items to process, and filters them to refine which jobs are passed downstream.

- **Nodes Involved:**  
  - RSS Feed Trigger  
  - Limit  
  - Filter  
  - Loop Over Items

- **Node Details:**

  - **RSS Feed Trigger**  
    - Type: `rssFeedReadTrigger`  
    - Role: Initiates workflow on new RSS feed entries from job platforms.  
    - Config: Default settings, polling new feed items automatically.  
    - Inputs: None (trigger node)  
    - Outputs: Emits new feed items to Limit node.  
    - Edge Cases: Failure if RSS source is down or malformed feed data.  

  - **Limit**  
    - Type: `limit`  
    - Role: Restricts number of feed items processed per trigger execution to avoid overload.  
    - Config: Typically set to a low number (e.g., 10) to batch manageable sets.  
    - Inputs: RSS feed items.  
    - Outputs: Limited feed items to Filter node.  
    - Edge Cases: No items if limit zero or less; ensure limit fits use case.  

  - **Filter**  
    - Type: `filter`  
    - Role: Applies criteria to discard irrelevant job posts (e.g., based on keywords or budget).  
    - Config: Custom expressions or conditions based on job attributes.  
    - Inputs: Limited feed items.  
    - Outputs: Filtered items to Loop Over Items node.  
    - Edge Cases: Incorrect filter logic may exclude all items; handle empty outputs gracefully.  

  - **Loop Over Items**  
    - Type: `splitInBatches`  
    - Role: Processes each feed item individually or in small batches for downstream extraction.  
    - Config: Batch size can be adjusted (default 1 for item-wise processing).  
    - Inputs: Filtered feed items.  
    - Outputs: Individual items to Extract Title & Budget node.  
    - Edge Cases: Large batch sizes may cause timeout or memory issues.

---

#### 2.2 Job Data Extraction

- **Overview:**  
  Extracts critical details from each job posting: title, budget, URL, and source platform, preparing them for AI processing.

- **Nodes Involved:**  
  - Extract Title & Budget  
  - Decode URL & Source

- **Node Details:**

  - **Extract Title & Budget**  
    - Type: `code` (JavaScript)  
    - Role: Parses raw feed item JSON to extract job title and budget information.  
    - Config: Script parses title and budget fields using JSON path or regex.  
    - Inputs: Single feed item.  
    - Outputs: Enriched item with structured title and budget fields to Decode URL & Source.  
    - Edge Cases: Missing or malformed fields can cause parsing errors; script should handle undefined gracefully.

  - **Decode URL & Source**  
    - Type: `code` (JavaScript)  
    - Role: Decodes and normalizes job URL, identifies source platform from URL or feed metadata.  
    - Config: Script extracts URL parameters, decodes encoded URLs, and sets source platform tag.  
    - Inputs: Item with extracted title and budget.  
    - Outputs: Fully structured job post data to AI Proposal Agent.  
    - Edge Cases: Invalid URL encoding or unknown platforms; should default or flag errors.

---

#### 2.3 AI Proposal Generation

- **Overview:**  
  Generates customized job proposals using a LangChain agent connected to OpenRouter language model, based on structured job data.

- **Nodes Involved:**  
  - AI Proposal Agent  
  - OpenRouter Chat Model  
  - Set Variables

- **Node Details:**

  - **OpenRouter Chat Model**  
    - Type: `lmChatOpenRouter`  
    - Role: Provides AI language model interface using OpenRouter API for chat completion.  
    - Config: API key credential configured, model parameters like temperature and max tokens set as needed.  
    - Inputs: Prompt from AI Proposal Agent.  
    - Outputs: AI-generated text proposal to AI Proposal Agent.  
    - Version Notes: Requires n8n version supporting LangChain OpenRouter nodes.  
    - Edge Cases: API rate limits, connectivity issues, invalid credentials.

  - **AI Proposal Agent**  
    - Type: `agent` (LangChain)  
    - Role: Orchestrates prompt construction, context management, and AI call to generate proposal text.  
    - Config: Uses OpenRouter Chat Model as language model backend; prompt templates configured to incorporate job details.  
    - Inputs: Job data from Decode URL & Source, plus OpenRouter Chat Model output.  
    - Outputs: Generated proposal text to Set Variables node.  
    - Edge Cases: Prompt errors, API failures, retry enabled to handle transient issues.

  - **Set Variables**  
    - Type: `set`  
    - Role: Stores generated proposal text and job metadata into variables for downstream processing.  
    - Config: Maps AI response fields and job details to named workflow variables.  
    - Inputs: AI Proposal Agent output.  
    - Outputs: Data to Update Database and Wait nodes.  
    - Edge Cases: Missing or malformed AI output; set node configured to continue on error.

---

#### 2.4 Data Management & Aggregation

- **Overview:**  
  Updates Google Sheets with job and proposal data, manages workflow pacing with wait, aggregates multiple processed items for summary.

- **Nodes Involved:**  
  - Update Datatbase (Google Sheets)  
  - Wait  
  - Aggregate

- **Node Details:**

  - **Update Datatbase**  
    - Type: `googleSheets`  
    - Role: Updates or inserts rows in a Google Sheet to track job proposals and statuses.  
    - Config: Sheet ID, worksheet name, key columns for upsert defined.  
    - Inputs: Variables from Set Variables node.  
    - Outputs: Passes item to Loop Over Items node for further processing or batching.  
    - Edge Cases: Authentication failures, sheet access issues, quota limits.

  - **Wait**  
    - Type: `wait`  
    - Role: Pauses workflow execution to manage rate limits or batch timing before aggregation.  
    - Config: Fixed or dynamic wait time (seconds or minutes).  
    - Inputs: From Set Variables node.  
    - Outputs: To Aggregate node.  
    - Edge Cases: Excessive wait times may delay workflow; no output if interrupted.

  - **Aggregate**  
    - Type: `aggregate`  
    - Role: Collects multiple items into a single array or object for batch processing or reporting.  
    - Config: Aggregation method set to combine all processed job proposals.  
    - Inputs: From Wait node after batch completion.  
    - Outputs: Combined data to Build a single HTML string node.  
    - Edge Cases: Empty input leads to empty aggregate; should be handled downstream.

---

#### 2.5 Email Notification

- **Overview:**  
  Constructs an HTML email summary of all proposals processed in the batch and sends it via Gmail, then logs sent email to Google Sheets.

- **Nodes Involved:**  
  - Build a single HTML string  
  - HTML Aggregated email  
  - Send a message  
  - Append row in sheet

- **Node Details:**

  - **Build a single HTML string**  
    - Type: `code` (JavaScript)  
    - Role: Generates a consolidated HTML string from aggregated job proposal data for email body.  
    - Config: Script loops over aggregated items, builds formatted HTML content.  
    - Inputs: Aggregated data object.  
    - Outputs: HTML content to HTML Aggregated email node.  
    - Edge Cases: Malformed HTML if input data is corrupted.

  - **HTML Aggregated email**  
    - Type: `html`  
    - Role: Wraps code-generated HTML string into a proper HTML email format.  
    - Config: Default or custom email styling applied.  
    - Inputs: HTML string from Build a single HTML string node.  
    - Outputs: Formatted email content to Send a message node.  
    - Edge Cases: Email client compatibility issues with HTML content.

  - **Send a message**  
    - Type: `gmail`  
    - Role: Sends the aggregated email to predefined recipients via Gmail OAuth2 credentials.  
    - Config: Recipient email address, subject, and message body set from previous nodes.  
    - Inputs: Formatted HTML email.  
    - Outputs: Data about sent email to Append row in sheet node.  
    - Edge Cases: Authentication errors, quota limits, invalid email addresses.

  - **Append row in sheet**  
    - Type: `googleSheets`  
    - Role: Logs confirmation of sent email with timestamps and details in Google Sheets.  
    - Config: Target Sheet ID and worksheet, columns mapped to email metadata fields.  
    - Inputs: Email send result data.  
    - Outputs: End of workflow branch.  
    - Edge Cases: Sheet access issues, improper data formatting.

---

### 3. Summary Table

| Node Name             | Node Type                      | Functional Role                        | Input Node(s)                | Output Node(s)                | Sticky Note                           |
|-----------------------|--------------------------------|-------------------------------------|-----------------------------|------------------------------|-------------------------------------|
| RSS Feed Trigger       | rssFeedReadTrigger             | Triggers workflow on new RSS items  | None                        | Limit                        |                                     |
| Limit                 | limit                         | Limits number of items processed     | RSS Feed Trigger            | Filter                       |                                     |
| Filter                | filter                        | Filters relevant job posts           | Limit                       | Loop Over Items              |                                     |
| Loop Over Items       | splitInBatches                 | Processes items individually         | Filter                      | Extract Title & Budget (main) |                                     |
| Extract Title & Budget | code                          | Extracts job title and budget        | Loop Over Items             | Decode URL & Source           |                                     |
| Decode URL & Source    | code                          | Decodes URL and identifies source   | Extract Title & Budget      | AI Proposal Agent             |                                     |
| AI Proposal Agent      | LangChain agent               | Generates AI job proposals           | Decode URL & Source, OpenRouter Chat Model | Set Variables               | Retry enabled for transient errors  |
| OpenRouter Chat Model  | lmChatOpenRouter               | Provides AI language model backend   | AI Proposal Agent (prompt)  | AI Proposal Agent (response) | Requires OpenRouter API credential  |
| Set Variables          | set                           | Stores variables for downstream use | AI Proposal Agent           | Update Datatbase, Wait        | Continues on error                   |
| Update Datatbase       | googleSheets                  | Updates job/proposal tracking sheet  | Set Variables               | Loop Over Items               |                                     |
| Wait                  | wait                          | Pauses execution for rate management | Set Variables               | Aggregate                    |                                     |
| Aggregate             | aggregate                     | Aggregates batch processed items     | Wait                        | Build a single HTML string    |                                     |
| Build a single HTML string | code                      | Builds HTML email body from data     | Aggregate                   | HTML Aggregated email         |                                     |
| HTML Aggregated email  | html                          | Wraps HTML string for email          | Build a single HTML string  | Send a message                |                                     |
| Send a message         | gmail                         | Sends email via Gmail OAuth2         | HTML Aggregated email       | Append row in sheet           |                                     |
| Append row in sheet    | googleSheets                  | Logs email sent confirmation         | Send a message              | None                         |                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create RSS Feed Trigger node**  
   - Type: `rssFeedReadTrigger`  
   - Parameters: Set RSS feed URLs from Upwork, Freelancer, Guru, PPH.  
   - No credentials needed.  

2. **Add Limit node**  
   - Type: `limit`  
   - Parameters: Set maximum number of items per execution (e.g., 10).  
   - Connect input from RSS Feed Trigger.  

3. **Add Filter node**  
   - Type: `filter`  
   - Parameters: Define conditions to include only relevant jobs (e.g., keywords, budget range).  
   - Connect input from Limit node.  

4. **Add Loop Over Items node**  
   - Type: `splitInBatches`  
   - Parameters: Batch size 1 for per-item processing.  
   - Connect input from Filter node.  

5. **Add Extract Title & Budget node**  
   - Type: `code`  
   - Parameters: JavaScript to parse job title and budget from feed item JSON.  
   - Connect input from Loop Over Items node.  

6. **Add Decode URL & Source node**  
   - Type: `code`  
   - Parameters: JavaScript to decode job posting URL and identify source platform.  
   - Connect input from Extract Title & Budget node.  

7. **Add OpenRouter Chat Model node**  
   - Type: `lmChatOpenRouter`  
   - Credentials: Configure OpenRouter API key.  
   - Set model parameters (temperature, max tokens).  

8. **Add AI Proposal Agent node**  
   - Type: `agent` (LangChain)  
   - Parameters: Configure prompt templates to include job data fields.  
   - Connect AI language model input to OpenRouter Chat Model node.  
   - Connect data input from Decode URL & Source node.  
   - Enable retry on fail.  

9. **Add Set Variables node**  
   - Type: `set`  
   - Parameters: Map AI proposal text and job details to variables.  
   - Set "Continue on Error" to true.  
   - Connect input from AI Proposal Agent node.  

10. **Add Update Datatbase node**  
    - Type: `googleSheets`  
    - Credentials: Configure Google Sheets OAuth2 credentials.  
    - Parameters: Sheet ID, worksheet, upsert key columns.  
    - Connect input from Set Variables node.  

11. **Connect Update Datatbase to Loop Over Items node**  
    - To enable batch processing continuation.  

12. **Add Wait node**  
    - Type: `wait`  
    - Parameters: Set wait time to manage rate limits (e.g., 5 seconds).  
    - Connect input from Set Variables node.  

13. **Add Aggregate node**  
    - Type: `aggregate`  
    - Parameters: Aggregate all processed items into one batch.  
    - Connect input from Wait node.  

14. **Add Build a single HTML string node**  
    - Type: `code`  
    - Parameters: JavaScript to build HTML email body from aggregated data.  
    - Connect input from Aggregate node.  

15. **Add HTML Aggregated email node**  
    - Type: `html`  
    - Parameters: Wrap HTML content appropriately for email clients.  
    - Connect input from Build a single HTML string node.  

16. **Add Send a message node**  
    - Type: `gmail`  
    - Credentials: Configure Gmail OAuth2 credentials.  
    - Parameters: Set recipient email, subject, and message body (from previous node).  
    - Connect input from HTML Aggregated email node.  

17. **Add Append row in sheet node**  
    - Type: `googleSheets`  
    - Credentials: Same Google Sheets OAuth2 credentials as before.  
    - Parameters: Sheet ID and worksheet to log sent emails.  
    - Connect input from Send a message node.  

18. **Validate all connections and credentials**  
    - Test RSS feed connectivity, AI API key validity, Google Sheets and Gmail OAuth2.  

19. **Activate workflow and monitor executions**  
    - Adjust parameters as needed based on load and API limits.

---

### 5. General Notes & Resources

| Note Content                                                                                               | Context or Link                                                                                      |
|------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| This workflow uses the OpenRouter API as an alternative to direct OpenAI API calls, enabling flexible AI backend selection.  | OpenRouter: https://openrouter.ai/                                                                  |
| LangChain nodes are leveraged for advanced prompt management and retry handling of AI interactions.       | n8n LangChain integration docs                                                                       |
| Google Sheets nodes require OAuth2 credentials with appropriate spreadsheet access and edit permissions.  | Google Sheets API documentation                                                                     |
| Gmail node uses OAuth2; ensure Gmail account has enabled API access and necessary scopes.                   | Gmail API and OAuth2 setup                                                                           |
| The workflow can be extended to support additional freelance platforms by adding new RSS feed URLs and parsing logic. |                                                                                                    |
| For troubleshooting, monitor API rate limits and handle errors gracefully via node retry and error workflows. |                                                                                                    |

---

**Disclaimer:**  
The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. The processing strictly adheres to current content policies and contains no illegal, offensive, or protected material. All handled data is legal and public.