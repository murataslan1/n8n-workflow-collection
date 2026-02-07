Analyse papers from Hugging Face with AI and store them in Notion

https://n8nworkflows.xyz/workflows/analyse-papers-from-hugging-face-with-ai-and-store-them-in-notion-2804


# Analyse papers from Hugging Face with AI and store them in Notion

### 1. Workflow Overview

This workflow automates the retrieval, analysis, and storage of academic paper summaries from Hugging Face into Notion. It is designed to run automatically on weekdays at 8 AM, fetching the latest papers, analyzing their abstracts with OpenAI’s GPT model, and saving structured insights into a Notion database. The workflow is logically divided into the following blocks:

- **1.1 Scheduled Trigger:** Initiates the workflow automatically on weekdays at 8 AM.
- **1.2 Fetching Paper Data:** Retrieves the list of recent papers from Hugging Face using their API.
- **1.3 Extracting Paper URLs:** Parses the HTML response to extract individual paper URLs.
- **1.4 Looping Over Papers:** Processes each paper URL one by one.
- **1.5 Duplicate Check in Notion:** Checks if the paper already exists in the Notion database to avoid duplicates.
- **1.6 Fetching Paper Details:** For new papers, fetches detailed HTML content of the paper page.
- **1.7 Extracting Paper Abstract and Title:** Extracts the abstract and title from the paper’s HTML.
- **1.8 OpenAI Content Analysis:** Sends the abstract to OpenAI GPT-4o for detailed analysis and structured extraction.
- **1.9 Storing Results in Notion:** Saves the analyzed data and metadata into the Notion database.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger

- **Overview:** Automatically triggers the workflow at 8 AM on weekdays (Monday to Friday).
- **Nodes Involved:** `Schedule Trigger`
- **Node Details:**
  - Type: Schedule Trigger (Cron-like)
  - Configuration: Runs weekly on days 1-5 (Mon-Fri) at hour 8.
  - Inputs: None (trigger node)
  - Outputs: Initiates the HTTP request to fetch Hugging Face papers.
  - Edge Cases: Misconfiguration could cause missed runs or runs on weekends.
  - Version: 1.2

#### 2.2 Fetching Paper Data

- **Overview:** Sends an HTTP GET request to Hugging Face’s papers endpoint, querying papers from the previous day.
- **Nodes Involved:** `Request Hugging Face Paper`
- **Node Details:**
  - Type: HTTP Request
  - Configuration: URL `https://huggingface.co/papers` with query parameter `date` set dynamically to yesterday’s date in `yyyy-MM-dd` format.
  - Inputs: Trigger from Schedule Trigger
  - Outputs: Raw HTML response containing paper listings.
  - Edge Cases: API downtime, rate limiting, or changes in Hugging Face’s API/HTML structure.
  - Version: 4.2

#### 2.3 Extracting Paper URLs

- **Overview:** Parses the HTML response to extract URLs of individual papers using CSS selectors.
- **Nodes Involved:** `Extract Hugging Face Paper`
- **Node Details:**
  - Type: HTML Extract
  - Configuration: Extracts `href` attributes from elements matching `.line-clamp-3` CSS selector, returning an array of URLs.
  - Inputs: Output of HTTP Request node
  - Outputs: List of paper URLs for further processing.
  - Edge Cases: Changes in HTML structure or CSS classes could break extraction.
  - Version: 1.2

#### 2.4 Splitting and Looping Over Papers

- **Overview:** Splits the list of paper URLs into individual items and processes them sequentially.
- **Nodes Involved:** `Split Out`, `Loop Over Items`
- **Node Details:**
  - `Split Out`:
    - Type: Split Out
    - Configuration: Splits out the `url` field from the extracted URLs.
    - Inputs: Extracted URLs
    - Outputs: Individual paper URLs
    - Version: 1
  - `Loop Over Items`:
    - Type: Split In Batches
    - Configuration: Processes one paper URL at a time without resetting.
    - Inputs: Output from Split Out
    - Outputs: Single paper URL per iteration
    - Edge Cases: Large number of papers could slow processing.
    - Version: 3

#### 2.5 Duplicate Check in Notion

- **Overview:** Checks if the current paper URL already exists in the Notion database to avoid duplicate entries.
- **Nodes Involved:** `Check Paper URL Existed`, `If`
- **Node Details:**
  - `Check Paper URL Existed`:
    - Type: Notion (Get All Pages)
    - Configuration: Queries Notion database filtering pages where the `URL` property equals the full Hugging Face paper URL.
    - Inputs: Single paper URL from Loop Over Items
    - Outputs: List of matching pages (empty if none)
    - Credentials: Notion API token required
    - Edge Cases: Notion API rate limits, incorrect database ID or property keys.
    - Version: 2.2
  - `If`:
    - Type: Conditional
    - Configuration: Checks if the output from Notion query is empty (paper not found).
    - Inputs: Output from Notion check
    - Outputs: If true (paper new) proceeds to fetch details; if false loops to next paper.
    - Edge Cases: Expression errors if data format changes.
    - Version: 2.2

#### 2.6 Fetching Paper Details

- **Overview:** For new papers, fetches the detailed HTML page of the paper from Hugging Face.
- **Nodes Involved:** `Request Hugging Face Paper Detail`
- **Node Details:**
  - Type: HTTP Request
  - Configuration: URL dynamically constructed by concatenating `https://huggingface.co` with the paper URL.
  - Inputs: Paper URL from If node (new papers only)
  - Outputs: HTML content of the paper detail page.
  - Edge Cases: Network errors, page not found, or HTML structure changes.
  - Version: 4.2

#### 2.7 Extracting Paper Abstract and Title

- **Overview:** Extracts the abstract and title text from the paper’s HTML detail page.
- **Nodes Involved:** `Extract Hugging Face Paper Abstract`
- **Node Details:**
  - Type: HTML Extract
  - Configuration: Extracts text content from `.text-gray-700` (abstract) and `.text-2xl` (title) CSS selectors.
  - Inputs: HTML content from paper detail request
  - Outputs: JSON with `abstract` and `title` fields.
  - Edge Cases: Changes in CSS selectors or page layout.
  - Version: 1.2

#### 2.8 OpenAI Content Analysis

- **Overview:** Sends the extracted abstract to OpenAI GPT-4o for detailed structured analysis, extracting key insights in JSON format.
- **Nodes Involved:** `OpenAI Analysis Abstract`
- **Node Details:**
  - Type: OpenAI (Langchain node)
  - Configuration:
    - Model: GPT-4o-2024-11-20
    - System prompt instructs the model to extract:
      - Core Introduction
      - Keywords (2-5)
      - Key Data and Results
      - Technical Details
      - Classification (academic categories)
    - User prompt: The paper abstract text.
    - Output: JSON with structured fields.
  - Inputs: Abstract text from HTML extraction
  - Outputs: JSON with analyzed content
  - Credentials: OpenAI API key required
  - Edge Cases: API rate limits, prompt failures, or unexpected output format.
  - Version: 1.8

#### 2.9 Storing Results in Notion

- **Overview:** Saves the analyzed paper data and metadata into a Notion database for future reference.
- **Nodes Involved:** `Store Abstract Notion`
- **Node Details:**
  - Type: Notion (Create Database Page)
  - Configuration:
    - Database ID: Specified Notion database for Hugging Face abstracts.
    - Properties mapped:
      - URL: Full Hugging Face paper URL
      - Title: Extracted paper title
      - Abstract: Abstract text truncated to 2000 characters
      - Scrap Date: Current date (no time)
      - Classification, Technical Details, Data and Results, Keywords, Core Introduction: From OpenAI JSON output
  - Inputs: Output from OpenAI analysis node
  - Credentials: Notion API token required
  - Edge Cases: API limits, property mismatches, data truncation issues.
  - Version: 2.2

---

### 3. Summary Table

| Node Name                   | Node Type                     | Functional Role                      | Input Node(s)                   | Output Node(s)                   | Sticky Note                                                                                         |
|-----------------------------|-------------------------------|------------------------------------|---------------------------------|---------------------------------|---------------------------------------------------------------------------------------------------|
| Schedule Trigger            | Schedule Trigger               | Initiates workflow on weekdays 8AM | None                            | Request Hugging Face Paper       |                                                                                                   |
| Request Hugging Face Paper  | HTTP Request                  | Fetches paper list HTML from API  | Schedule Trigger                | Extract Hugging Face Paper       |                                                                                                   |
| Extract Hugging Face Paper  | HTML Extract                  | Extracts paper URLs from HTML      | Request Hugging Face Paper      | Split Out                       |                                                                                                   |
| Split Out                  | Split Out                     | Splits URLs into individual items  | Extract Hugging Face Paper      | Loop Over Items                 |                                                                                                   |
| Loop Over Items            | Split In Batches              | Processes each paper URL sequentially | Split Out                      | Check Paper URL Existed          |                                                                                                   |
| Check Paper URL Existed    | Notion (Get All Pages)        | Checks if paper URL exists in Notion | Loop Over Items                | If                             |                                                                                                   |
| If                         | If                           | Conditional: proceed if paper new | Check Paper URL Existed         | Request Hugging Face Paper Detail (true), Loop Over Items (false) |                                                                                                   |
| Request Hugging Face Paper Detail | HTTP Request              | Fetches detailed paper HTML page  | If (true branch)                | Extract Hugging Face Paper Abstract |                                                                                                   |
| Extract Hugging Face Paper Abstract | HTML Extract              | Extracts abstract and title from HTML | Request Hugging Face Paper Detail | OpenAI Analysis Abstract        |                                                                                                   |
| OpenAI Analysis Abstract   | OpenAI (Langchain)            | Analyzes abstract with GPT-4o      | Extract Hugging Face Paper Abstract | Store Abstract Notion           |                                                                                                   |
| Store Abstract Notion      | Notion (Create Database Page) | Stores analyzed data in Notion     | OpenAI Analysis Abstract        | Loop Over Items                 |                                                                                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node:**
   - Type: Schedule Trigger
   - Set to run weekly on Monday to Friday at 8 AM.
   - No credentials needed.

2. **Add an HTTP Request node named "Request Hugging Face Paper":**
   - URL: `https://huggingface.co/papers`
   - Method: GET
   - Query Parameter: `date` = `={{ $now.minus(1,'days').format('yyyy-MM-dd') }}`
   - Connect Schedule Trigger output to this node.

3. **Add an HTML Extract node named "Extract Hugging Face Paper":**
   - Operation: Extract HTML content
   - Extraction Values:
     - Key: `url`
     - CSS Selector: `.line-clamp-3`
     - Attribute: `href`
     - Return Array: true
   - Connect "Request Hugging Face Paper" output to this node.

4. **Add a Split Out node named "Split Out":**
   - Field to split out: `url`
   - Connect "Extract Hugging Face Paper" output to this node.

5. **Add a Split In Batches node named "Loop Over Items":**
   - Default batch size (process one item at a time)
   - Connect "Split Out" output to this node.

6. **Add a Notion node named "Check Paper URL Existed":**
   - Resource: Database Page
   - Operation: Get All
   - Database ID: Your Notion database ID for storing papers
   - Filter: Property `URL` equals `={{ 'https://huggingface.co'+$json.url }}`
   - Credentials: Configure Notion API credentials
   - Connect "Loop Over Items" output to this node.

7. **Add an If node named "If":**
   - Condition: Check if the output from "Check Paper URL Existed" is empty (no existing page)
   - Expression: `={{ $json.length === 0 }}`
   - Connect "Check Paper URL Existed" output to this node.

8. **Add an HTTP Request node named "Request Hugging Face Paper Detail":**
   - URL: `={{ 'https://huggingface.co'+$('Split Out').item.json.url }}`
   - Method: GET
   - Connect "If" node’s true output to this node.

9. **Add an HTML Extract node named "Extract Hugging Face Paper Abstract":**
   - Operation: Extract HTML content
   - Extraction Values:
     - Key: `abstract`, CSS Selector: `.text-gray-700`
     - Key: `title`, CSS Selector: `.text-2xl`
   - Connect "Request Hugging Face Paper Detail" output to this node.

10. **Add an OpenAI node named "OpenAI Analysis Abstract":**
    - Model: GPT-4o-2024-11-20 (or latest GPT-4 variant)
    - System Prompt: Provide instructions to extract Core Introduction, Keywords, Data and Results, Technical Details, Classification in JSON format.
    - User Prompt: `={{ $json.abstract }}`
    - Enable JSON output parsing.
    - Credentials: Configure OpenAI API credentials.
    - Connect "Extract Hugging Face Paper Abstract" output to this node.

11. **Add a Notion node named "Store Abstract Notion":**
    - Resource: Database Page
    - Operation: Create
    - Database ID: Same as in step 6
    - Map properties:
      - URL: `={{ 'https://huggingface.co'+$('Split Out').item.json.url }}`
      - Title: `={{ $('Extract Hugging Face Paper Abstract').item.json.title }}`
      - Abstract: `={{ $('Extract Hugging Face Paper Abstract').item.json.abstract.substring(0,2000) }}`
      - Scrap Date: `={{ $today.format('yyyy-MM-dd') }}`
      - Classification: `={{ $json.message.content.Classification.join(',') }}`
      - Technical Details: `={{ $json.message.content.Technical_Details }}`
      - Data and Results: `={{ $json.message.content.Data_and_Results }}`
      - Keywords: `={{ $json.message.content.Keywords.join(',') }}`
      - Core Introduction: `={{ $json.message.content.Core_Introduction }}`
    - Credentials: Notion API credentials
    - Connect "OpenAI Analysis Abstract" output to this node.

12. **Connect the false output of the "If" node back to "Loop Over Items" to continue processing remaining papers.**

13. **Ensure all credentials (OpenAI, Notion) are properly set up in n8n.**

14. **Activate the workflow.**

---

### 5. General Notes & Resources

| Note Content                                                                                                   | Context or Link                                                                                   |
|---------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| The workflow uses GPT-4o-2024-11-20, a GPT-4 variant optimized for academic and technical content analysis.    | OpenAI model selection in the OpenAI node.                                                      |
| Notion database must have properties matching the keys used in the workflow (URL, title, abstract, classification, etc.) | Notion database schema setup.                                                                    |
| Hugging Face papers page HTML structure is critical for CSS selectors `.line-clamp-3`, `.text-gray-700`, `.text-2xl` | Changes in Hugging Face website may require updates to HTML extraction nodes.                    |
| Scheduled trigger uses n8n’s built-in cron-like scheduling for weekday runs at 8 AM.                            | n8n Schedule Trigger documentation: https://docs.n8n.io/nodes/n8n-nodes-base.scheduleTrigger/    |
| OpenAI prompt is designed to output JSON for easy parsing and storage.                                         | Prompt engineering is key to consistent output format.                                          |
| Image illustrating workflow result is referenced as `huggingface.png` (fileId:918)                             | Visual asset for documentation or UI display.                                                    |

---

This document fully describes the workflow structure, node configurations, and setup instructions to enable reproduction, modification, and troubleshooting by advanced users or automation agents.