Automate Job Opportunity Digests with OpenRouter GPT-5 and Email

https://n8nworkflows.xyz/workflows/automate-job-opportunity-digests-with-openrouter-gpt-5-and-email-9303


# Automate Job Opportunity Digests with OpenRouter GPT-5 and Email

### 1. Workflow Overview

This workflow automates the collection, summarization, and email distribution of recent job opportunities posted on the n8n community forum. It is designed for job seekers or recruiters who want a curated weekly digest of automation-related job postings, enhanced by AI-generated summaries for quick understanding.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Trigger & Data Acquisition:** Initiates weekly scraping of the n8n jobs forum and extracts individual job posting links and dates.
- **1.2 Data Preparation & Filtering:** Merges extracted links with posting dates and filters jobs posted within the last 7 days.
- **1.3 Detailed Job Data Extraction:** Retrieves each job posting page and extracts the job title and description metadata.
- **1.4 AI-Powered Job Summary Generation:** Uses OpenRouter GPT-5-mini to generate concise summaries of what the client is looking for in each job posting.
- **1.5 Data Aggregation & Formatting:** Combines raw job data with AI summaries, formats the results, and aggregates all jobs.
- **1.6 Email Digest Composition & Sending:** Builds a structured HTML email digest grouped by job source and sends it to a configured email address.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger & Data Acquisition

**Overview:**  
This block triggers the workflow every Monday at 9 AM and scrapes the n8n community jobs forum to obtain a list of recent job postings and their posting dates.

**Nodes Involved:**  
- Run Weekly on Monday Morning  
- Get list page  
- Extract posts  
- Merge objects

**Node Details:**

- **Run Weekly on Monday Morning**  
  - *Type:* Schedule Trigger  
  - *Role:* Starts the workflow on a weekly cron schedule (every Monday at 09:00).  
  - *Configuration:* Cron expression `0 9 * * 1`.  
  - *Input/Output:* No input; output triggers the next node.  
  - *Edge Cases:* Workflow won't trigger if n8n server is down or schedule misconfigured.

- **Get list page**  
  - *Type:* HTTP Request  
  - *Role:* Fetches the HTML content of the n8n jobs forum page (`https://community.n8n.io/c/jobs/13`).  
  - *Configuration:* Simple GET request, no authentication.  
  - *Input:* Trigger from schedule node.  
  - *Output:* Raw HTML page content.  
  - *Failures:* Network errors, page structure changes.

- **Extract posts**  
  - *Type:* HTML Extract  
  - *Role:* Parses the forum page HTML to extract all job posting links and their posting dates.  
  - *Configuration:* Extracts all elements with CSS class `.raw-link` for href attributes as `jobLink` (array). Extracts dates from last table cell `.topic-list-item td:last-child` (array).  
  - *Input:* HTML content from "Get list page".  
  - *Output:* JSON arrays of links and dates.  
  - *Failures:* Broken selectors, page redesign.

- **Merge objects**  
  - *Type:* Code  
  - *Role:* Combines the extracted arrays of job links and dates into a single array of objects with keys: `jobLink`, `date`, and a static `source` field set to `"n8n-forum"`.  
  - *Configuration:* JavaScript map function merging arrays by index.  
  - *Input:* Extraction data from "Extract posts".  
  - *Output:* Array of job objects for further processing.  
  - *Failures:* Mismatched array lengths, empty arrays.

---

#### 2.2 Data Preparation & Filtering

**Overview:**  
Filters the merged job postings to only those published within the last 7 days.

**Nodes Involved:**  
- Last 7 days

**Node Details:**

- **Last 7 days**  
  - *Type:* Filter  
  - *Role:* Filters job objects by comparing their `date` field to the current date minus 7 days.  
  - *Configuration:* DateTime operator "after" with expression `{{$now.minus({days: 7})}}`.  
  - *Input:* Merged job objects from "Merge objects".  
  - *Output:* Filtered list of recent job postings.  
  - *Failures:* Date parsing errors, timezone mismatches.

---

#### 2.3 Detailed Job Data Extraction

**Overview:**  
For each filtered job link, fetches the job posting page and extracts structured metadata: job title and description.

**Nodes Involved:**  
- Each post  
- Extract title & description

**Node Details:**

- **Each post**  
  - *Type:* HTTP Request  
  - *Role:* Fetches each job posting URL HTML content individually.  
  - *Configuration:* URL dynamically set to the current job's `jobLink` field. Batching configured with batch size 10, 5 seconds interval between batches to prevent overloading the server.  
  - *Input:* Filtered jobs from "Last 7 days".  
  - *Output:* Raw HTML content of each job posting.  
  - *Failures:* HTTP errors, rate limiting, invalid URLs.

- **Extract title & description**  
  - *Type:* HTML Extract  
  - *Role:* Extracts the job posting's title and description from meta tags `og:title` and `og:description`.  
  - *Configuration:* Extracts the `content` attribute from meta tags.  
  - *Input:* HTML from "Each post".  
  - *Output:* JSON with `jobTitle` and `jobDescription`.  
  - *Failures:* Missing meta tags, changed page structure.

---

#### 2.4 AI-Powered Job Summary Generation

**Overview:**  
Uses OpenRouter GPT-5-mini model to analyze the raw HTML content of each job posting and generate a concise JSON summary describing what the client is looking to build.

**Nodes Involved:**  
- OpenRouter Chat Model  
- Structured Output Parser  
- Generate Job Summary

**Node Details:**

- **OpenRouter Chat Model**  
  - *Type:* LangChain OpenRouter Chat Model  
  - *Role:* Sends the job posting HTML content to OpenRouter GPT-5-mini for processing.  
  - *Configuration:* Model set to `openai/gpt-5-mini`. Credentials use OpenRouter API key.  
  - *Input:* Job posting HTML content from "Generate Job Summary".  
  - *Output:* Raw AI response.  
  - *Failures:* API auth errors, rate limit, network issues.

- **Structured Output Parser**  
  - *Type:* LangChain Structured Output Parser  
  - *Role:* Parses AI response to JSON format based on provided schema example `{ "summary": "..." }`.  
  - *Configuration:* JSON schema example given to ensure structured response.  
  - *Input:* AI raw response from "OpenRouter Chat Model".  
  - *Output:* Structured JSON summary.  
  - *Failures:* Parsing errors if AI returns unexpected format.

- **Generate Job Summary**  
  - *Type:* LangChain Chain LLM  
  - *Role:* Defines the prompt and chains the AI model and output parser to generate a high-level summary of the job posting.  
  - *Configuration:* Prompt instructs AI to output JSON with a summary describing what the client wants to build, based only on relevant HTML content.  
  - *Input:* Raw HTML content from "Each post".  
  - *Output:* Parsed job summary JSON.  
  - *Failures:* Expression errors in prompt, AI model errors.

---

#### 2.5 Data Aggregation & Formatting

**Overview:**  
Combines the job metadata, AI-generated summaries, formats the combined data, and aggregates all job entries into one collection.

**Nodes Involved:**  
- Combine Job Data & Summary  
- Format Summary Output  
- Aggregate All Jobs

**Node Details:**

- **Combine Job Data & Summary**  
  - *Type:* Merge  
  - *Role:* Combines three inputs by position:  
    1. Extracted job title & description  
    2. Filtered job metadata (link, date, source)  
    3. AI-generated job summary  
  - *Configuration:* Combine mode with no unpaired inputs included.  
  - *Input:* Outputs from "Extract title & description", "Last 7 days", and "Generate Job Summary".  
  - *Output:* Combined job data objects.  
  - *Failures:* Mismatched input lengths causing dropped data.

- **Format Summary Output**  
  - *Type:* Code  
  - *Role:* Cleans up the merged output by extracting the `summary` field from the AI output and removing redundant fields.  
  - *Configuration:* JavaScript code to map input items and set `summary` field, clearing the raw output field.  
  - *Input:* Combined data from previous merge.  
  - *Output:* Cleaned job data with summary.  
  - *Failures:* JavaScript errors if input missing fields.

- **Aggregate All Jobs**  
  - *Type:* Code  
  - *Role:* Aggregates all individual job objects into a single data array under the key `data` for final email composition.  
  - *Configuration:* Simple JavaScript mapping of input JSONs.  
  - *Input:* Formatted job summary items.  
  - *Output:* Aggregated JSON object `{ data: [...] }`.  
  - *Failures:* Unexpected input structure.

---

#### 2.6 Email Digest Composition & Sending

**Overview:**  
Formats the aggregated job data into a well-structured HTML email grouped by source and sends it to a configured recipient.

**Nodes Involved:**  
- Send Weekly Job Digest

**Node Details:**

- **Send Weekly Job Digest**  
  - *Type:* Email Send  
  - *Role:* Sends an HTML email summarizing all job opportunities grouped by source (n8n forum, Make forum, Reddit).  
  - *Configuration:*  
    - Dynamic HTML body composed via JavaScript function that sorts jobs by date, groups by source, and formats each job item with title link, date, source, and AI summary.  
    - Subject set to "Job Opportunities".  
    - `toEmail` and `fromEmail` set to `test@example.com` (should be customized).  
    - SMTP credentials configured for sending email.  
  - *Input:* Aggregated job data from "Aggregate All Jobs".  
  - *Output:* Email delivery status.  
  - *Failures:* SMTP authentication issues, invalid email addresses, email delivery failures.

---

### 3. Summary Table

| Node Name                  | Node Type                      | Functional Role                              | Input Node(s)                | Output Node(s)                      | Sticky Note                                                                                                  |
|----------------------------|--------------------------------|----------------------------------------------|------------------------------|-----------------------------------|--------------------------------------------------------------------------------------------------------------|
| Run Weekly on Monday Morning | Schedule Trigger               | Triggers workflow weekly on Monday at 9 AM | -                            | Get list page                     |                                                                                                              |
| Get list page              | HTTP Request                   | Fetches job forum HTML page                   | Run Weekly on Monday Morning | Extract posts                    |                                                                                                              |
| Extract posts             | HTML Extract                   | Extracts job links and posting dates          | Get list page                | Merge objects                   |                                                                                                              |
| Merge objects             | Code                           | Merges job links and dates into objects       | Extract posts                | Last 7 days                    |                                                                                                              |
| Last 7 days               | Filter                         | Filters jobs posted within last 7 days        | Merge objects                | Combine Job Data & Summary, Each post | ## ⏱️ DATE FILTERING Only processes jobs posted within the last 7 days. Adjust the filter condition to change this timeframe. |
| Each post                 | HTTP Request                   | Fetches individual job posting pages          | Last 7 days                  | Extract title & description, Generate Job Summary |                                                                                                              |
| Extract title & description | HTML Extract                   | Extracts job title and description metadata   | Each post                   | Combine Job Data & Summary       |                                                                                                              |
| Generate Job Summary       | LangChain Chain LLM            | Uses AI to summarize job posting               | Each post                   | Combine Job Data & Summary       | ## 🤖 AI EXTRACTION Uses GPT-5-mini to read the job posting HTML and extract a clear summary of what the client wants to build. |
| OpenRouter Chat Model      | LangChain OpenRouter Chat      | AI language model for generating summaries    | Generate Job Summary (ai_languageModel) | Generate Job Summary (ai_outputParser) |                                                                                                              |
| Structured Output Parser   | LangChain Output Parser        | Parses AI output into structured JSON         | OpenRouter Chat Model       | Generate Job Summary             |                                                                                                              |
| Combine Job Data & Summary | Merge                         | Combines job metadata, extracted info, AI summary | Extract title & description, Last 7 days, Generate Job Summary | Format Summary Output           |                                                                                                              |
| Format Summary Output      | Code                           | Cleans and formats combined job data           | Combine Job Data & Summary   | Aggregate All Jobs              |                                                                                                              |
| Aggregate All Jobs         | Code                           | Aggregates all job objects into one collection | Format Summary Output        | Send Weekly Job Digest          |                                                                                                              |
| Send Weekly Job Digest     | Email Send                    | Sends formatted job digest email                | Aggregate All Jobs           | -                               | ## 📧 EMAIL FORMATTING Creates a beautiful HTML email with jobs organized by source. Update the fromEmail and toEmail parameters to your addresses. |
| Sticky Note               | Sticky Note                    | Workflow start overview note                    | -                            | -                               | ## 🎯 WORKFLOW START This workflow scrapes job postings from the n8n community forum, uses AI to summarize each opportunity, and emails you a digest. |
| Sticky Note1              | Sticky Note                    | Date filtering explanation note                 | -                            | -                               | ## ⏱️ DATE FILTERING Only processes jobs posted within the last 7 days. Adjust the filter condition to change this timeframe. |
| Sticky Note2              | Sticky Note                    | AI extraction explanation note                   | -                            | -                               | ## 🤖 AI EXTRACTION Uses GPT-5-mini to read the job posting HTML and extract a clear summary of what the client wants to build. This makes scanning opportunities much faster! |
| Sticky Note3              | Sticky Note                    | Email formatting explanation note                | -                            | -                               | ## 📧 EMAIL FORMATTING Creates a beautiful HTML email with jobs organized by source. Update the fromEmail and toEmail parameters to your addresses. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node: "Run Weekly on Monday Morning"**  
   - Type: Schedule Trigger  
   - Configure cron expression to `0 9 * * 1` (9AM every Monday).  
   - Connect this to the next node.

2. **Add HTTP Request Node: "Get list page"**  
   - URL: `https://community.n8n.io/c/jobs/13`  
   - Method: GET (default)  
   - Connect input from "Run Weekly on Monday Morning".

3. **Add HTML Extract Node: "Extract posts"**  
   - Operation: Extract Html Content  
   - Extraction Values:  
     - Key: `jobLink`, CSS Selector: `.raw-link`, Attribute: `href`, Return Array: true  
     - Key: `date`, CSS Selector: `.topic-list-item td:last-child`, Return Array: true  
   - Connect input from "Get list page".

4. **Add Code Node: "Merge objects"**  
   - JavaScript (JS Code):  
     ```js
     const jobLinks = items[0].json["jobLink"];
     const dates = items[0].json.date;
     const merged = jobLinks.map((link, index) => ({
       "jobLink": link,
       "date": dates[index],
       "source": "n8n-forum"
     }));
     return merged.map(item => ({ json: item }));
     ```  
   - Connect input from "Extract posts".

5. **Add Filter Node: "Last 7 days"**  
   - Condition:  
     - Left value: `{{$json.date}}`  
     - Operator: DateTime "after"  
     - Right value: `{{$now.minus({days: 7})}}` (date 7 days ago)  
   - Connect input from "Merge objects".

6. **Add HTTP Request Node: "Each post"**  
   - Set URL dynamically to `={{ $json["jobLink"] }}`  
   - Enable batching with batch size 10 and batch interval 5000 ms to avoid server overload.  
   - Connect input from "Last 7 days".

7. **Add HTML Extract Node: "Extract title & description"**  
   - Operation: Extract Html Content  
   - Extraction Values:  
     - `jobDescription`: CSS Selector `meta[property="og:description"]`, Attribute `content`  
     - `jobTitle`: CSS Selector `meta[property="og:title"]`, Attribute `content`  
   - Connect input from "Each post".

8. **Add LangChain Chain LLM Node: "Generate Job Summary"**  
   - Text input: `=<content> {{ $('Each post').item.json.data }} </content>`  
   - Messages: Define prompt with instructions to generate a JSON summary describing the client's automation needs based on HTML input.  
   - Enable Output Parser with JSON schema example: `{ "summary": "What the client is looking to build" }`  
   - Connect input from "Each post".

9. **Add LangChain OpenRouter Chat Model Node: "OpenRouter Chat Model"**  
   - Model: `openai/gpt-5-mini`  
   - Connect as AI language model for "Generate Job Summary".  
   - Set OpenRouter API credentials.

10. **Add LangChain Structured Output Parser Node: "Structured Output Parser"**  
    - Provide JSON schema example for parsing AI output.  
    - Connect as AI output parser for "Generate Job Summary".

11. **Add Merge Node: "Combine Job Data & Summary"**  
    - Mode: Combine  
    - Combine by position, include unpaired: false  
    - Inputs:  
      1. "Extract title & description" output  
      2. "Last 7 days" filtered job metadata  
      3. "Generate Job Summary" AI summary  
    - Connect outputs accordingly.

12. **Add Code Node: "Format Summary Output"**  
    - JavaScript code:  
      ```js
      return $input.all().map((item) => ({...item.json, summary: item.json.output.summary, output: undefined}));
      ```  
    - Connect input from "Combine Job Data & Summary".

13. **Add Code Node: "Aggregate All Jobs"**  
    - JavaScript code:  
      ```js
      const items = $input.all().map(item => ({ ...item.json }));
      return { data: items };
      ```  
    - Connect input from "Format Summary Output".

14. **Add Email Send Node: "Send Weekly Job Digest"**  
    - From Email and To Email: configure your email address.  
    - Subject: "Job Opportunities"  
    - HTML Body: Use the provided JavaScript template that groups jobs by source, sorts by date, and formats each job with title, date, source, and AI summary.  
    - Connect input from "Aggregate All Jobs".  
    - Configure SMTP credentials for sending email.

15. **Add Sticky Notes** (optional for documentation within n8n canvas)  
    - Workflow start note at beginning.  
    - Notes on date filtering, AI extraction, and email formatting at relevant places.

---

### 5. General Notes & Resources

| Note Content                                                                                                         | Context or Link                                                  |
|----------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------|
| This workflow scrapes job postings from the n8n community forum, uses AI to summarize each opportunity, and emails you a digest. | Workflow purpose summary (Sticky Note)                          |
| Only processes jobs posted within the last 7 days. Adjust the filter condition to change this timeframe.             | Date filtering explanation (Sticky Note)                        |
| Uses GPT-5-mini to read the job posting HTML and extract a clear summary of what the client wants to build.          | AI extraction explanation (Sticky Note)                         |
| Creates a beautiful HTML email with jobs organized by source. Update the fromEmail and toEmail parameters to your addresses. | Email formatting explanation (Sticky Note)                      |

---

**Disclaimer:** The text provided is extracted exclusively from an automated workflow created with n8n, respecting all applicable content policies. It contains no illegal, offensive, or protected content. All data handled are legal and publicly available.