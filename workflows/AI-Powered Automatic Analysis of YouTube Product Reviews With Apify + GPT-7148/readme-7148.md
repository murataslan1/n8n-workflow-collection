AI-Powered Automatic Analysis of YouTube Product Reviews With Apify + GPT

https://n8nworkflows.xyz/workflows/ai-powered-automatic-analysis-of-youtube-product-reviews-with-apify---gpt-7148


# AI-Powered Automatic Analysis of YouTube Product Reviews With Apify + GPT

### 1. Workflow Overview

This workflow performs an AI-powered automated analysis of YouTube product reviews using data extraction via Apify and natural language processing through GPT (OpenAI API). It automates the ingestion, processing, summarization, and emailing of product review insights.

**Target Use Cases:**  
- Automating extraction and summarization of YouTube product reviews for marketing or research teams.  
- Providing AI-enhanced sentiment and content analysis on product feedback from YouTube.  
- Sending processed and formatted insights via email.

**Logical Blocks:**

- **1.1 Input Reception:** Receiving input requests via webhook or manual trigger, extracting product information.  
- **1.2 Data Extraction:** Using Apify API to scrape or retrieve product review data from YouTube.  
- **1.3 Data Batching and Processing:** Splitting data into manageable batches, handling API request limits and retries.  
- **1.4 AI Processing:** Sending batched review data to GPT/OpenAI for analysis via Langchain node.  
- **1.5 Data Merging and Formatting:** Merging AI responses, renaming fields for clarity, converting markdown to HTML.  
- **1.6 Output & Notification:** Sending email with results and responding to webhook calls.  
- **1.7 Error Handling:** Nodes dedicated to handling errors and edge cases during API calls or processing.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block captures incoming requests either via a Webhook or manual trigger, then sets initial product parameters.

**Nodes Involved:**  
- Webhook  
- Manual  
- PRODUCT (Set node)  

**Node Details:**

- **Webhook**  
  - Type: `webhook`  
  - Role: Entry point for external HTTP requests triggering the workflow.  
  - Configuration: Uses a specific webhook ID, no explicit parameters.  
  - Inputs: External HTTP request  
  - Outputs: Passes data to PRODUCT node  
  - Edge cases: Incoming malformed requests or missing parameters might cause failure downstream.

- **Manual**  
  - Type: `manualTrigger`  
  - Role: Allows manual execution in n8n UI for testing or ad hoc runs.  
  - No parameters.  
  - Outputs: Passes data to PRODUCT node.

- **PRODUCT**  
  - Type: `set`  
  - Role: Initializes or sets product-related variables for the workflow.  
  - Inputs: From Webhook or Manual trigger.  
  - Outputs: Passes to Apify API node.  
  - Notes: Likely sets product identifiers, URLs, or keywords for scraping.

---

#### 1.2 Data Extraction

**Overview:**  
This block calls the Apify API to retrieve YouTube product review data based on the input product information.

**Nodes Involved:**  
- Apify API (Set node)  
- Email send (Set node)  

**Node Details:**

- **Apify API**  
  - Type: `set` (although the name suggests API usage, configured as Set node)  
  - Role: Likely prepares or stores Apify API request parameters or results.  
  - Inputs: PRODUCT node output  
  - Outputs: Email send node  
  - Edge cases: API rate limits, malformed requests, or empty responses.

- **Email send**  
  - Type: `set`  
  - Role: Sets or formats email parameters or content before further processing.  
  - Inputs: Apify API output  
  - Outputs: Method detect node.

---

#### 1.3 Data Batching and Processing

**Overview:**  
This block manages large data sets by batching items, limits requests, and controls flow to downstream AI analysis nodes.

**Nodes Involved:**  
- Agent 1 (HTTP Request)  
- Limit (Limit)  
- Loop Over Items (SplitInBatches)  
- Agent 2 (HTTP Request)  

**Node Details:**

- **Agent 1**  
  - Type: `httpRequest`  
  - Role: Sends HTTP requests, presumably to Apify or another data source.  
  - Config: Retries on failure with 5-second intervals, continues on error outputs.  
  - Inputs: LANG node output  
  - Outputs: Limit node and error node (Error why)  
  - Edge cases: Network failures, API maintenance downtime, rate limiting (explicitly noted).

- **Limit**  
  - Type: `limit`  
  - Role: Controls execution speed or concurrency to avoid API overload.  
  - Inputs: Agent 1 output  
  - Outputs: Loop Over Items node.

- **Loop Over Items**  
  - Type: `splitInBatches`  
  - Role: Splits incoming array data into batches for sequential processing.  
  - Inputs: Limit node output  
  - Outputs: Rename node and Agent 2 node.

- **Agent 2**  
  - Type: `httpRequest`  
  - Role: Additional HTTP requests possibly for fetching or validating each batch item.  
  - Config: Same retry and error continuation as Agent 1.  
  - Inputs: Loop Over Items output  
  - Outputs: Loop Over Items node continuation and error node.  
  - Edge cases: Same as Agent 1.

---

#### 1.4 AI Processing

**Overview:**  
This block sends batched review data to OpenAI's GPT model for semantic analysis and message generation.

**Nodes Involved:**  
- Rename (Set)  
- Merge (Code)  
- Method detect (Code)  
- Code1 (Code)  
- LANG (Set)  
- Message a model (Langchain OpenAI)  

**Node Details:**

- **Rename**  
  - Type: `set`  
  - Role: Renames or restructures data fields for consistency before AI processing.  
  - Inputs: Loop Over Items output  
  - Outputs: Merge node  
  - Notes: Marked optional but improves output clarity.

- **Merge**  
  - Type: `code`  
  - Role: Merges multiple batch results into a single dataset for AI input.  
  - Inputs: Rename node  
  - Outputs: Message a model node.

- **Method detect**  
  - Type: `code`  
  - Role: Contains logic to determine processing method or route based on data.  
  - Inputs: Email send node  
  - Outputs: Code1 node.

- **Code1**  
  - Type: `code`  
  - Role: Potentially performs data transformations or prepares final payloads.  
  - Inputs: Method detect node  
  - Outputs: LANG node.

- **LANG**  
  - Type: `set`  
  - Role: Sets language-specific or contextual variables before AI call.  
  - Inputs: Code1 node  
  - Outputs: Agent 1 node.

- **Message a model**  
  - Type: `@n8n/n8n-nodes-langchain.openAi`  
  - Role: Sends processed review batch data to OpenAI GPT for analysis and synthesis.  
  - Inputs: Merge node  
  - Outputs: Markdown to HTML node.

---

#### 1.5 Data Merging and Formatting

**Overview:**  
Converts AI textual output from markdown format to HTML and prepares it for emailing and webhook responses.

**Nodes Involved:**  
- Markdown to HTML  
- Send Review (Gmail)  
- Respond to Webhook  

**Node Details:**

- **Markdown to HTML**  
  - Type: `markdown`  
  - Role: Converts GPT markdown output into HTML format suitable for email.  
  - Inputs: Message a model node  
  - Outputs: Send Review and Respond to Webhook nodes.

- **Send Review**  
  - Type: `gmail`  
  - Role: Sends the final review analysis email to configured recipients.  
  - Inputs: Markdown to HTML output  
  - Outputs: None (terminal node).  
  - Credentials: Requires configured Gmail OAuth2 credentials.

- **Respond to Webhook**  
  - Type: `respondToWebhook`  
  - Role: Returns the processed result as HTTP response for the initial webhook trigger.  
  - Inputs: Markdown to HTML output  
  - Outputs: None (terminal node).

---

#### 1.6 Error Handling

**Overview:**  
Handles failures in API calls or processing steps by stopping the workflow and reporting errors.

**Nodes Involved:**  
- Error why (Stop and Error)  

**Node Details:**

- **Error why**  
  - Type: `stopAndError`  
  - Role: Stops workflow execution and raises an error message when critical failures occur.  
  - Inputs: Agent 1 and Agent 2 error outputs  
  - Outputs: None.  
  - Use: Captures and surfaces HTTP request failures or API issues.

---

### 3. Summary Table

| Node Name          | Node Type                | Functional Role                             | Input Node(s)             | Output Node(s)                   | Sticky Note                                                                                   |
|--------------------|--------------------------|---------------------------------------------|---------------------------|---------------------------------|------------------------------------------------------------------------------------------------|
| Webhook            | webhook                  | Entry point for external requests            | -                         | PRODUCT                         |                                                                                                |
| Manual             | manualTrigger            | Manual trigger for testing                    | -                         | PRODUCT                         |                                                                                                |
| PRODUCT            | set                      | Initialize product parameters                 | Webhook, Manual           | Apify API                      |                                                                                                |
| Apify API          | set                      | Prepare or handle Apify API requests/results | PRODUCT                   | Email send                     |                                                                                                |
| Email send         | set                      | Set email parameters                          | Apify API                 | Method detect                  |                                                                                                |
| Method detect      | code                     | Determine processing method                   | Email send                | Code1                         |                                                                                                |
| Code1              | code                     | Data transformation/prep                      | Method detect             | LANG                          |                                                                                                |
| LANG               | set                      | Set language/context variables                | Code1                     | Agent 1                       |                                                                                                |
| Agent 1            | httpRequest              | HTTP request with retry and error handling   | LANG                      | Limit, Error why               | Agents can also fail due to maintenance or API limits being reached.                            |
| Limit              | limit                    | Control API request rate                       | Agent 1                   | Loop Over Items                |                                                                                                |
| Loop Over Items    | splitInBatches           | Batch splitting for processing                 | Limit                     | Rename, Agent 2                |                                                                                                |
| Agent 2            | httpRequest              | HTTP request with retry and error handling    | Loop Over Items           | Loop Over Items, Error why     | Agents can also fail due to maintenance or API limits being reached.                            |
| Rename             | set                      | Rename fields for clarity                       | Loop Over Items           | Merge                         | Optional but the output is clearer and more polished                                           |
| Merge              | code                     | Merge batch results                            | Rename                    | Message a model               |                                                                                                |
| Message a model    | @n8n/n8n-nodes-langchain.openAi | Send text to GPT for AI analysis              | Merge                     | Markdown to HTML              |                                                                                                |
| Markdown to HTML   | markdown                 | Convert markdown to HTML                        | Message a model           | Send Review, Respond to Webhook |                                                                                                |
| Send Review        | gmail                    | Send email with review analysis                | Markdown to HTML          | -                             |                                                                                                |
| Respond to Webhook | respondToWebhook         | Return HTTP response to webhook trigger        | Markdown to HTML          | -                             |                                                                                                |
| Error why          | stopAndError             | Stop workflow with error                        | Agent 1, Agent 2 (errors) | -                             |                                                                                                |
| Sticky Note1       | stickyNote               | -                                              | -                         | -                             |                                                                                                |
| Sticky Note3       | stickyNote               | -                                              | -                         | -                             |                                                                                                |
| Sticky Note5       | stickyNote               | -                                              | -                         | -                             |                                                                                                |
| Sticky Note7       | stickyNote               | -                                              | -                         | -                             |                                                                                                |
| Sticky Note8       | stickyNote               | -                                              | -                         | -                             |                                                                                                |
| Sticky Note        | stickyNote               | -                                              | -                         | -                             |                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Input Nodes:**  
   - Create a **Webhook** node with a unique webhook ID to receive external HTTP requests.  
   - Create a **Manual Trigger** node to allow manual execution.

2. **Set Product Parameters:**  
   - Add a **Set** node named `PRODUCT` to initialize product-related parameters (e.g., YouTube URL, product ID).

3. **Call Apify API:**  
   - Add a **Set** node named `Apify API` to prepare or simulate API request parameters for Apify (actual HTTP request node can be substituted if needed).  
   - Connect `PRODUCT` output to `Apify API`.

4. **Prepare Email Parameters:**  
   - Add a **Set** node named `Email send` to format email data or content placeholders.  
   - Connect `Apify API` output to `Email send`.

5. **Determine Processing Method:**  
   - Add a **Code** node named `Method detect` to implement logic to decide processing flow based on inputs.  
   - Connect `Email send` to `Method detect`.

6. **Process Data Transformations:**  
   - Add a **Code** node named `Code1` for data transformation or preparation before language settings.  
   - Connect `Method detect` output to `Code1`.

7. **Set Language or Context:**  
   - Add a **Set** node named `LANG` to set any language or context variables.  
   - Connect `Code1` output to `LANG`.

8. **HTTP Request for Data (Agent 1):**  
   - Add an **HTTP Request** node named `Agent 1` configured to communicate with data source or APIs, with:  
     - Retry enabled with 5-second wait between tries  
     - Error handling set to continue on error output  
   - Connect `LANG` to `Agent 1`.

9. **Limit Node:**  
   - Add a **Limit** node to control concurrency or rate limiting.  
   - Connect `Agent 1` main output (success path) to `Limit`.

10. **Batch Processing:**  
    - Add a **SplitInBatches** node named `Loop Over Items` to process data arrays in batches.  
    - Connect `Limit` output to `Loop Over Items`.

11. **HTTP Request for Each Batch (Agent 2):**  
    - Add another **HTTP Request** node named `Agent 2` similar to `Agent 1` with retries and error continuation enabled.  
    - Connect `Loop Over Items` second output (batch) to `Agent 2`.

12. **Error Handling:**  
    - Add a **Stop and Error** node named `Error why` to capture errors from both `Agent 1` and `Agent 2`.  
    - Connect error outputs of `Agent 1` and `Agent 2` to `Error why`.

13. **Rename Fields:**  
    - Add a **Set** node named `Rename` to rename or restructure data fields for clarity.  
    - Connect first output of `Loop Over Items` to `Rename`.

14. **Merge Batches:**  
    - Add a **Code** node named `Merge` to merge all batch outputs into a single dataset.  
    - Connect `Rename` output to `Merge`.

15. **Send Data to OpenAI GPT:**  
    - Add a **Langchain OpenAI** node named `Message a model`, configure with appropriate OpenAI credentials and prompt, to send merged data for AI processing.  
    - Connect `Merge` output to `Message a model`.

16. **Convert Markdown to HTML:**  
    - Add a **Markdown** node named `Markdown to HTML` to convert GPT markdown results to HTML.  
    - Connect `Message a model` output to `Markdown to HTML`.

17. **Send Email:**  
    - Add a **Gmail** node named `Send Review` configured with Gmail OAuth2 credentials to send the final email.  
    - Connect `Markdown to HTML` output to `Send Review`.

18. **Respond to Webhook:**  
    - Add a **Respond to Webhook** node named `Respond to Webhook` to return the processed results to the initial webhook caller.  
    - Connect `Markdown to HTML` output also to `Respond to Webhook`.

---

### 5. General Notes & Resources

| Note Content                                                                                              | Context or Link                                  |
|-----------------------------------------------------------------------------------------------------------|-------------------------------------------------|
| Agents can fail due to maintenance or API limits; retries with 5s delay implemented for robustness.        | Sticky notes on Agent 1 and Agent 2 HTTP Request nodes |
| Optional renaming node improves output clarity and polishing of the data structure.                        | Sticky note on Rename node                        |
| Workflow integrates Apify platform for data scraping and OpenAI GPT for AI analysis via Langchain node.    | Workflow description and node naming             |

---

**Disclaimer:**  
The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.