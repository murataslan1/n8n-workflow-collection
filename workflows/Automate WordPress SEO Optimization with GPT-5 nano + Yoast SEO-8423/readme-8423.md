Automate WordPress SEO Optimization with GPT-5 nano + Yoast SEO

https://n8nworkflows.xyz/workflows/automate-wordpress-seo-optimization-with-gpt-5-nano---yoast-seo-8423


# Automate WordPress SEO Optimization with GPT-5 nano + Yoast SEO

### 1. Workflow Overview

This workflow automates SEO optimization for WordPress websites using OpenAI's GPT-5 nano model in combination with Yoast SEO. It is designed to process multiple URLs or pages from a website, generate SEO meta titles and descriptions via AI, validate or enhance them using Yoast SEO tools, and finally store or email the results for further use.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Handles manual and webhook triggers to start the workflow with a provided target website URL.

- **1.2 User Agent Rotation & Options Setup:** Prepares HTTP request headers (rotating User Agents) and sets options for further processing.

- **1.3 URL Mapping and Sitemap Processing:** Requests and processes the sitemap or URL list, handling errors if the sitemap is invalid.

- **1.4 Pagination and Batch Processing:** Splits the list of URLs into batches and iterates over them for scalable processing.

- **1.5 SEO Meta Title and Description Generation:** Uses OpenAI GPT-5 nano to generate meta titles and descriptions for each URL.

- **1.6 SEO Validation with Yoast:** Sends generated metadata for validation or enhancement via Yoast SEO API.

- **1.7 Formatting and Result Handling:** Converts data into Markdown, counts results, appends them into Google Sheets, and optionally sends email notifications.

- **1.8 Error Handling:** Handles potential failures such as sitemap errors and HTTP request errors gracefully.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Input Reception

- **Overview:** Accepts workflow start triggers either manually or via webhook with a URL parameter to process.

- **Nodes Involved:**  
  - `Webhook`  
  - `MANUAL`

- **Node Details:**

  - **Webhook**  
    - Type: Webhook trigger node  
    - Role: Listen for HTTP requests with a query parameter `pag` representing the target site URL.  
    - Configuration: Activated via a unique webhook URL (example provided in notes).  
    - Inputs: External HTTP request with URL parameter.  
    - Outputs: Passes URL parameter downstream.  
    - Edge Cases: Missing or malformed `pag` parameter; webhook downtime.

  - **MANUAL**  
    - Type: Manual trigger node  
    - Role: Allows manual start of the workflow for testing or manual runs.  
    - Inputs: None (manual activation).  
    - Outputs: Triggers downstream processing.  

---

#### 1.2 User Agent Rotation & Options Setup

- **Overview:** Generates rotating User-Agent strings for HTTP requests to simulate diverse clients and sets workflow options.

- **Nodes Involved:**  
  - `UA Rotativo`  
  - `OPTIONS`

- **Node Details:**

  - **UA Rotativo**  
    - Type: Code node (JavaScript)  
    - Role: Produces a rotating User-Agent string to avoid blocking or detection.  
    - Configuration: Custom code generating or selecting User-Agent headers dynamically.  
    - Inputs: Trigger from `Webhook` or `MANUAL`.  
    - Outputs: Passes User-Agent info to `OPTIONS`.  
    - Edge Cases: User-Agent list empty or malformed; code execution errors.

  - **OPTIONS**  
    - Type: Set node  
    - Role: Stores options or flags required for subsequent processing steps.  
    - Configuration: Sets variables or default parameters (details abstracted).  
    - Inputs: From `UA Rotativo`.  
    - Outputs: Passes options to selection logic.  

---

#### 1.3 URL Mapping and Sitemap Processing

- **Overview:** Retrieves the sitemap or list of URLs to process, handling errors where the sitemap is missing or invalid.

- **Nodes Involved:**  
  - `Selected`  
  - `Split Out`  
  - `Loop Over Items`  
  - `Maping urls`  
  - `Split Out1`  
  - `HTTP Request1`  
  - `Maping urls1`  
  - `Sitemap Error`  
  - `Req Error4`

- **Node Details:**

  - **Selected**  
    - Type: Code node  
    - Role: Selects or filters URLs for processing based on options.  
    - Inputs: From `OPTIONS`.  
    - Outputs: Passes filtered URLs to `Split Out`.  
    - Edge Cases: Empty URL list, filtering logic errors.

  - **Split Out**  
    - Type: SplitOut node  
    - Role: Splits data into multiple outputs for parallel processing paths.  
    - Inputs: From `Selected`.  
    - Outputs: Directs data to `Loop Over Items`.  

  - **Loop Over Items**  
    - Type: SplitInBatches node  
    - Role: Processes URLs in manageable batches to avoid overload.  
    - Inputs: From `Split Out`.  
    - Outputs: Sends each batch to `SEO Result` and `Maping urls`.  

  - **Maping urls**  
    - Type: HTTP Request node  
    - Role: Requests sitemap or related URL data from target site.  
    - Configuration: Uses rotating User-Agent; retries on failure.  
    - Inputs: From `Loop Over Items`.  
    - Outputs: On success to `Split Out1`, on failure to `Sitemap Error`.  
    - Edge Cases: HTTP errors, timeouts, invalid sitemap format.

  - **Split Out1**  
    - Type: SplitOut node  
    - Role: Splits HTTP request output into success and error paths.  
    - Inputs: From `Maping urls`.  
    - Outputs: Success to `HTTP Request1`, error to `Req Error4`.  

  - **HTTP Request1**  
    - Type: HTTP Request node  
    - Role: Further HTTP calls for sitemap or URL details.  
    - Inputs: From `Split Out1` success.  
    - Outputs: To `Iterar Páginas` and also to `Maping urls1`.  
    - Edge Cases: Request failures, malformed response.

  - **Maping urls1**  
    - Type: HTTP Request node  
    - Role: Additional URL mapping or validation.  
    - Inputs: From `HTTP Request1`.  
    - Outputs: To `Iterar Páginas`.  

  - **Sitemap Error**  
    - Type: StopAndError node  
    - Role: Stops workflow and signals error if sitemap retrieval fails.  
    - Inputs: From `Maping urls` failure path.  
    - Outputs: None (workflow stops).  

  - **Req Error4**  
    - Type: StopAndError node  
    - Role: Stops workflow on HTTP request errors.  
    - Inputs: From `Split Out1` error path.  

---

#### 1.4 Pagination and Batch Processing

- **Overview:** Iterates over pages or URLs in batches for scalable processing and passes them to SEO analysis.

- **Nodes Involved:**  
  - `Iterar Páginas`  
  - `Loop Over Items1`

- **Node Details:**

  - **Iterar Páginas**  
    - Type: SplitInBatches node  
    - Role: Splits incoming URL lists into smaller batches for processing.  
    - Inputs: From `HTTP Request1` and `meta desc and title SEO YOAST` nodes.  
    - Outputs: To `Loop Over Items` and `Markdown`.  
    - Edge Cases: Empty batches, batch size misconfiguration.

  - **Loop Over Items1**  
    - Type: SplitInBatches node  
    - Role: Secondary batch processing, likely for final result aggregation.  
    - Inputs: From `SEO Result`.  
    - Outputs: To `Count` and `Append row in sheet`.  

---

#### 1.5 SEO Meta Title and Description Generation

- **Overview:** Generates SEO meta titles and descriptions using OpenAI GPT-5 nano model.

- **Nodes Involved:**  
  - `Markdown`  
  - `meta descr and title gen`  
  - `meta desc and title SEO YOAST`

- **Node Details:**

  - **Markdown**  
    - Type: Markdown node  
    - Role: Formats data into Markdown before passing to AI generation.  
    - Inputs: From `Iterar Páginas`.  
    - Outputs: To `meta descr and title gen`.  

  - **meta descr and title gen**  
    - Type: OpenAI (LangChain) node  
    - Role: Calls GPT-5 nano for generation of meta description and title.  
    - Configuration: Uses OpenAI credentials with prompt designed for SEO text generation.  
    - Inputs: From `Markdown`.  
    - Outputs: To `meta desc and title SEO YOAST`.  
    - Edge Cases: API rate limiting, prompt failures, incomplete responses.

  - **meta desc and title SEO YOAST**  
    - Type: HTTP Request node  
    - Role: Sends generated SEO metadata to Yoast SEO API for validation or enhancement.  
    - Inputs: From `meta descr and title gen`.  
    - Outputs: To `Iterar Páginas`.  
    - Edge Cases: Authentication failures, API errors.

---

#### 1.6 SEO Validation with Yoast

- **Overview:** Validates or enhances AI-generated SEO metadata using Yoast SEO services.

- **Nodes Involved:**  
  - `meta desc and title SEO YOAST` (also listed above; this node serves dual role)

- **Node Details:**  
  See above in 1.5.

---

#### 1.7 Formatting and Result Handling

- **Overview:** Converts final results to Markdown, counts processed items, appends results to Google Sheets, and optionally sends email notifications.

- **Nodes Involved:**  
  - `SEO Result`  
  - `Count`  
  - `Append row in sheet`  
  - `Text email`  
  - `Send a message`

- **Node Details:**

  - **SEO Result**  
    - Type: Code node  
    - Role: Processes SEO results for final formatting or filtering.  
    - Inputs: From `Loop Over Items`.  
    - Outputs: To `Loop Over Items1`.  

  - **Count**  
    - Type: Summarize node  
    - Role: Counts or summarizes the number of processed SEO entries.  
    - Inputs: From `Loop Over Items1`.  
    - Outputs: To `Text email`.  

  - **Append row in sheet**  
    - Type: Google Sheets node  
    - Role: Appends SEO result rows into a Google Sheet for record-keeping.  
    - Inputs: From `Loop Over Items1`.  
    - Outputs: Back to `Loop Over Items1` for further processing or looping.  
    - Edge Cases: Google API quota limits, authentication errors.

  - **Text email**  
    - Type: OpenAI (LangChain) node  
    - Role: Generates email text summarizing SEO results.  
    - Inputs: From `Count`.  
    - Outputs: To `Send a message`.  

  - **Send a message**  
    - Type: Gmail node  
    - Role: Sends the generated email message via Gmail.  
    - Inputs: From `Text email`.  
    - Outputs: None (end node).  
    - Configuration: Requires Gmail OAuth2 credentials.  
    - Edge Cases: Gmail API limits, authentication failures.

---

#### 1.8 Error Handling

- **Overview:** Stops workflow execution and raises errors on critical failures.

- **Nodes Involved:**  
  - `Sitemap Error`  
  - `Req Error4`

- **Node Details:**

  - **Sitemap Error**  
    - Type: StopAndError node  
    - Role: Stops workflow with error if sitemap retrieval fails.  
    - Inputs: From failed `Maping urls` HTTP requests.  

  - **Req Error4**  
    - Type: StopAndError node  
    - Role: Stops workflow on HTTP request failure downstream.  

---

### 3. Summary Table

| Node Name                       | Node Type                      | Functional Role                         | Input Node(s)                | Output Node(s)                | Sticky Note                       |
|--------------------------------|--------------------------------|---------------------------------------|-----------------------------|------------------------------|---------------------------------|
| Webhook                        | Webhook trigger                | Input reception via HTTP trigger      | -                           | UA Rotativo                  | using: pag=example.com; Real example: https://yourspace.app.n8n.cloud/webhook-test/bbdf9cca-e5f4-4bae-afb1-a893ffb51b18?pag=onlineseoscan.com |
| MANUAL                        | Manual trigger                 | Manual workflow start                  | -                           | UA Rotativo                  |                                 |
| UA Rotativo                   | Code                          | Rotate User-Agent header for requests | Webhook, MANUAL             | OPTIONS                     |                                 |
| OPTIONS                       | Set                           | Set options and flags                  | UA Rotativo                 | Selected                    |                                 |
| Selected                      | Code                          | Select/filter URLs                     | OPTIONS                     | Split Out                   |                                 |
| Split Out                    | SplitOut                      | Split data for parallel paths          | Selected                    | Loop Over Items             |                                 |
| Loop Over Items               | SplitInBatches                | Batch processing of URLs               | Split Out                   | SEO Result, Maping urls     |                                 |
| SEO Result                   | Code                          | Process SEO results                     | Loop Over Items             | Loop Over Items1            |                                 |
| Loop Over Items1             | SplitInBatches                | Batch processing of SEO results        | SEO Result                  | Count, Append row in sheet  |                                 |
| Count                        | Summarize                     | Count processed SEO results             | Loop Over Items1            | Text email                  |                                 |
| Text email                   | OpenAI (LangChain)            | Generate email content                  | Count                       | Send a message              |                                 |
| Send a message               | Gmail                         | Send email notification                 | Text email                  | -                          |                                 |
| Markdown                     | Markdown                      | Format data to Markdown                 | Iterar Páginas              | meta descr and title gen    |                                 |
| meta descr and title gen      | OpenAI (LangChain)            | Generate SEO meta title and description | Markdown                    | meta desc and title SEO YOAST |                                 |
| meta desc and title SEO YOAST | HTTP Request                  | Validate/enhance SEO metadata via Yoast | meta descr and title gen    | Iterar Páginas              |                                 |
| Iterar Páginas               | SplitInBatches                | Batch process pages/URLs                | HTTP Request1, meta desc and title SEO YOAST | Loop Over Items, Markdown     |                                 |
| Maping urls                  | HTTP Request                  | Retrieve sitemap or URL list            | Loop Over Items             | Split Out1, Sitemap Error   |                                 |
| Split Out1                  | SplitOut                      | Split success and error paths           | Maping urls                 | HTTP Request1, Req Error4   |                                 |
| HTTP Request1               | HTTP Request                  | Additional URL mapping/validation       | Split Out1                  | Iterar Páginas, Maping urls1 |                                 |
| Maping urls1                | HTTP Request                  | Additional URL processing                | HTTP Request1               | Iterar Páginas              |                                 |
| Sitemap Error               | StopAndError                  | Stop workflow on sitemap retrieval fail | Maping urls (error path)    | -                          |                                 |
| Req Error4                  | StopAndError                  | Stop workflow on HTTP request error     | Split Out1 (error path)     | -                          |                                 |
| Append row in sheet         | Google Sheets                 | Append SEO results to Google Sheets     | Loop Over Items1            | Loop Over Items1            |                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Webhook Node**  
   - Type: Webhook  
   - Configure with a unique URL to receive `pag` URL parameter (target site).  
   - No authentication required.  

2. **Create a Manual Trigger Node**  
   - Type: Manual Trigger  
   - No configuration needed; for manual runs.  

3. **Create a Code Node: UA Rotativo**  
   - Purpose: Generate rotating User-Agent strings for HTTP requests.  
   - Script to cycle through a list of User-Agent headers.  
   - Connect outputs of Webhook and Manual Trigger to this node.  

4. **Create a Set Node: OPTIONS**  
   - Purpose: Store workflow options and parameters.  
   - Configure any default flags or options needed downstream.  
   - Connect output of UA Rotativo to OPTIONS.  

5. **Create a Code Node: Selected**  
   - Purpose: Filter or select URLs to process based on options.  
   - Inputs: OPTIONS output.  
   - Configure filtering logic (e.g., only specific URL patterns).  

6. **Create a SplitOut Node: Split Out**  
   - Purpose: Split data for branching.  
   - Connect Selected output to this node.  

7. **Create a SplitInBatches Node: Loop Over Items**  
   - Purpose: Process URLs in batches (set appropriate batch size).  
   - Connect Split Out output to this node.  

8. **Create an HTTP Request Node: Maping urls**  
   - Purpose: Request sitemap or URL list from website.  
   - Use rotating User-Agent header from OPTIONS or UA Rotativo.  
   - Enable retry on failure with delay (e.g., 5 seconds).  
   - Connect Loop Over Items output to this node.  

9. **Create a SplitOut Node: Split Out1**  
   - Purpose: Split Maping urls response into success and error outputs.  
   - Connect Maping urls output.  

10. **Create HTTP Request Nodes: HTTP Request1 & Maping urls1**  
    - HTTP Request1: Further sitemap or URL validation requests.  
    - Maping urls1: Additional URL mapping or validation.  
    - Connect Split Out1 success output to HTTP Request1.  
    - Connect HTTP Request1 output to Maping urls1.  

11. **Create StopAndError Nodes: Sitemap Error & Req Error4**  
    - Sitemap Error: Connect Maping urls error output to stop workflow on sitemap failure.  
    - Req Error4: Connect Split Out1 error output to stop workflow on request failure.  

12. **Create SplitInBatches Node: Iterar Páginas**  
    - Purpose: Batch process pages/URLs for SEO analysis.  
    - Connect outputs from HTTP Request1 and meta desc and title SEO YOAST nodes to this node.  

13. **Create Markdown Node**  
    - Purpose: Format data into Markdown for input to AI.  
    - Connect Iterar Páginas output to Markdown node.  

14. **Create OpenAI Node: meta descr and title gen**  
    - Purpose: Generate SEO meta titles and descriptions via GPT-5 nano.  
    - Configure with OpenAI credentials, model set to GPT-5 nano.  
    - Input: Markdown output.  
    - Output: Connect to meta desc and title SEO YOAST node.  

15. **Create HTTP Request Node: meta desc and title SEO YOAST**  
    - Purpose: Validate/enhance metadata via Yoast SEO API.  
    - Configure with Yoast API details and authentication if required.  
    - Input: Output from meta descr and title gen.  
    - Output: Connect back to Iterar Páginas.  

16. **Create Code Node: SEO Result**  
    - Purpose: Process and prepare SEO results for output.  
    - Input: Loop Over Items output.  
    - Output: Connect to Loop Over Items1.  

17. **Create SplitInBatches Node: Loop Over Items1**  
    - Purpose: Secondary batch processing of SEO results.  
    - Input: SEO Result output.  
    - Output: Connect to Count and Append row in sheet nodes.  

18. **Create Summarize Node: Count**  
    - Purpose: Summarize/count SEO entries processed.  
    - Input: Loop Over Items1 output.  
    - Output: Connect to Text email node.  

19. **Create Google Sheets Node: Append row in sheet**  
    - Purpose: Store SEO results in Google Sheets.  
    - Configure Google Sheets credentials and target spreadsheet and sheet.  
    - Input: Loop Over Items1 output.  
    - Output: Connect back to Loop Over Items1 for iteration.  

20. **Create OpenAI Node: Text email**  
    - Purpose: Generate summary email content.  
    - Configure OpenAI credentials.  
    - Input: Count output.  
    - Output: Connect to Send a message node.  

21. **Create Gmail Node: Send a message**  
    - Purpose: Send SEO summary email.  
    - Configure Gmail OAuth2 credentials.  
    - Input: Text email output.  

---

### 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                                                                                      |
|-------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| Webhook example usage: `https://yourspace.app.n8n.cloud/webhook-test/bbdf9cca-e5f4-4bae-afb1-a893ffb51b18?pag=onlineseoscan.com` | Webhook node usage example                                                                                           |
| Use rotating User-Agent headers to prevent IP blocking or rate limiting during HTTP requests.    | Mentioned in UA Rotativo node                                                                                         |
| Google Sheets API quota limits and OAuth2 authentication required for appending rows.            | Applies to Append row in sheet node                                                                                   |
| Gmail API requires OAuth2 authentication with necessary scopes for sending emails.                | Applies to Send a message node                                                                                        |
| Handle OpenAI API errors such as rate limits or incomplete responses gracefully.                  | Applies to OpenAI nodes: meta descr and title gen, Text email                                                        |
| Workflow respects error handling by stopping on sitemap retrieval or HTTP request failures.      | See Sitemap Error and Req Error4 nodes                                                                                |
| The workflow is designed to be scalable by using batch processing nodes (SplitInBatches).        | Applies to Iterar Páginas, Loop Over Items, Loop Over Items1                                                         |

---

**Disclaimer:**  
The provided text exclusively originates from an automated workflow constructed with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.