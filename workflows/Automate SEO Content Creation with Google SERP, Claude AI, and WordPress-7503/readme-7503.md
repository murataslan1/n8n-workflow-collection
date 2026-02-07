Automate SEO Content Creation with Google SERP, Claude AI, and WordPress

https://n8nworkflows.xyz/workflows/automate-seo-content-creation-with-google-serp--claude-ai--and-wordpress-7503


# Automate SEO Content Creation with Google SERP, Claude AI, and WordPress

### 1. Workflow Overview

This workflow automates the creation of SEO-optimized blog posts starting from prioritized keywords received via a webhook, integrating live data from Google SERP, AI content analysis and generation with Claude AI models, and finally publishing draft posts to a WordPress website. It also updates progress back to a Google Sheet used for keyword management.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Item Extraction**  
  Receives keyword data via webhook, splits input into individual keywords, and updates progress status in Google Sheets.

- **1.2 SERP Data Retrieval and Content Extraction**  
  Queries Google Custom Search API for real-time SERP results per keyword, splits results, fetches raw web pages, and extracts clean text with heading markers.

- **1.3 AI-Based Article Analysis and Aggregation**  
  Analyzes extracted web page texts using Claude AI to identify content structure, intent, and gaps. Aggregates individual analyses into a summarized dataset.

- **1.4 AI Content Brief Creation**  
  Generates a comprehensive content brief from aggregated analyses, including SEO recommendations, outlines, and unique angles.

- **1.5 AI Content Draft Generation**  
  Creates a full content draft based on the content brief and analyzed SERP data with Claude AI, formatted as SEO-friendly HTML.

- **1.6 Content Publishing and Sheet Updates**  
  Publishes the draft as a WordPress post (draft state) and updates Google Sheets to mark progress completion.

---

### 2. Block-by-Block Analysis

---

#### Block 1.1: Input Reception and Item Extraction

**Overview:**  
Starts the workflow by receiving prioritized keywords via webhook, splitting the batch into individual keyword rows, and marking the processing start in Google Sheets.

**Nodes Involved:**  
- Webhook  
- Split Out  
- Update Progress Info  
- Sticky Note (Item Extraction explanation)  
- Sticky Note (Workflow explanation overview)

**Node Details:**

- **Webhook**  
  - Type: Webhook (HTTP POST endpoint)  
  - Configuration: Receives POST requests at path `208f9a1a-60ce-40d8-ac20-1909f0ac4257`  
  - Role: Entry point receiving JSON payload with prioritized keyword rows from Google Sheets.  
  - Input: HTTP POST data from Google Sheets script  
  - Output: JSON data forwarded downstream  
  - Edge cases:  
    - Invalid/malformed POST data may cause failures  
    - Webhook must be publicly accessible and secured externally  
  - Version: n8n v2

- **Split Out**  
  - Type: Split Out node  
  - Configuration: Splits the input JSON array found in field `body.rows` into individual items  
  - Role: Separates batch keyword rows for independent processing  
  - Input: Webhook output (batch JSON)  
  - Output: Individual keyword records  
  - Edge cases: Empty or missing `body.rows` will result in no output  
  - Version: v1

- **Update Progress Info (Google Sheets node)**  
  - Type: Google Sheets (Update operation)  
  - Configuration: Updates the cell `Column 1` with text "Started processing" for the row number received in the item  
  - Role: Marks in Google Sheet that processing for this keyword has begun  
  - Input: Individual keyword item with `rowNumber` property  
  - Output: Updated sheet confirmation  
  - Credentials: Requires Google Sheets OAuth2 with edit permissions  
  - Edge cases:  
    - Authentication failure or API quota limits  
    - Incorrect row number mapping  
  - Version: v4.5

- **Sticky Notes**  
  - Provide documentation and explanation for the input extraction logic and overall workflow  

---

#### Block 1.2: SERP Data Retrieval and Content Extraction

**Overview:**  
Queries Google Custom Search API for each keyword, splits SERP results, fetches each linked page content, and extracts readable text with heading markers for AI processing.

**Nodes Involved:**  
- Search in Google Search API1  
- split into different SERP results (Split Out)  
- Get Raw Web Page (HTTP Request)  
- Extract Text from Web Page (Code)  
- Sticky Note (SERP Extraction)  

**Node Details:**

- **Search in Google Search API1**  
  - Type: HTTP Request  
  - Configuration: Sends GET request to `https://www.googleapis.com/customsearch/v1` with query parameters:  
    - `q` = keyword string from current item  
    - API key and Custom Search Engine ID (`key`, `cx`) configured as per credentials  
  - Role: Retrieves top Google SERP results for the keyword in real-time  
  - Input: Keyword item JSON  
  - Output: JSON containing SERP results array `items`  
  - Edge cases:  
    - API rate limits or invalid credentials  
    - Empty or malformed SERP response  
  - Version: v4.2

- **split into different SERP results**  
  - Type: Split Out  
  - Configuration: Splits the `items` array from SERP response into individual search result objects  
  - Role: Allows processing each SERP item separately  
  - Input: SERP JSON response  
  - Output: Single SERP item per execution  
  - Edge cases: No items field or empty results  
  - Version: v1

- **Get Raw Web Page**  
  - Type: HTTP Request  
  - Configuration: GET request to URL found in current item's `link` property  
  - Role: Downloads raw HTML content of the SERP result page  
  - Input: Single SERP item with `link` property  
  - Output: Raw HTML page content  
  - Error Handling: Set to continue on error (e.g., 404 or timeout)  
  - Edge cases: Page not reachable, blocked by CORS or anti-bot measures, slow response  
  - Version: v4.2

- **Extract Text from Web Page**  
  - Type: Code (JavaScript)  
  - Configuration: Cleans HTML by removing scripts/styles, replaces heading tags with markers like `[H1] Title [/H1]`, strips other tags, normalizes whitespace  
  - Role: Produces clean extracted text with heading context for AI analysis  
  - Input: Raw HTML content  
  - Output: JSON with `text` field containing cleaned content  
  - Error Handling: Continue on error (e.g., malformed HTML)  
  - Edge cases: Complex or heavily scripted pages may lose content, malformed HTML breaks parser  
  - Version: v2

- **Sticky Note (SERP Extraction)**  
  - Documents the purpose of this block: getting SERPs for keywords  

---

#### Block 1.3: AI-Based Article Analysis and Aggregation

**Overview:**  
Analyzes each extracted page text with Claude AI to identify SEO-relevant content structure and insights, then aggregates all analyses per keyword.

**Nodes Involved:**  
- Claude Haiku 3.5 Model (Anthropic Claude AI)  
- AI Article Analysis (Chain LLM)  
- Content Analysis Structure (Output Parser Structured)  
- Aggregate  
- Sticky Note (AI Article Analysis explanation)  

**Node Details:**

- **Claude Haiku 3.5 Model**  
  - Type: Langchain Anthropic Claude AI model node  
  - Configuration: Uses model `claude-3-5-haiku-20241022` with provided Anthropic API credentials  
  - Role: Receives extracted text to produce preliminary semantic analysis results  
  - Input: Extracted text JSON  
  - Output: Raw AI-generated JSON or text data  
  - Edge cases: API failures, timeouts, rate limits, malformed input causing prompt failures  
  - Version: v1.3

- **AI Article Analysis**  
  - Type: Chain LLM (Langchain workflow)  
  - Configuration: Uses prompt instructing AI to identify content format, type, intent clues, headings, subtopics, takeaways, questions answered, unique angles, content gaps from the input text  
  - Input: Output of Claude Haiku 3.5 Model parsed text  
  - Output: Structured JSON analysis per article  
  - Error Handling: false (continue on error)  
  - Edge cases: AI misinterpretation, incomplete data, inconsistent headings  
  - Version: v1.7

- **Content Analysis Structure**  
  - Type: Output Parser Structured  
  - Configuration: JSON schema example defines expected keys like contentFormat, contentType, intentClues, headings, subtopics, etc.  
  - Role: Parses AI raw output into structured JSON for further processing  
  - Input: AI Article Analysis raw output  
  - Output: Structured JSON  
  - Version: v1.3

- **Aggregate**  
  - Type: Aggregate node  
  - Configuration: Aggregates all AI analysis outputs (field `output`) into a single array for content brief generation  
  - Role: Collects all individual article analyses for the keyword  
  - Input: Multiple AI Article Analysis outputs  
  - Output: Combined JSON array  
  - Version: v1

- **Sticky Note (AI Article Analysis)**  
  - Marks this block’s purpose is AI-based article analysis  

---

#### Block 1.4: AI Content Brief Creation

**Overview:**  
Generates a comprehensive SEO content brief by analyzing aggregated article data, identifying dominant formats, content gaps, recommended structure, and metadata.

**Nodes Involved:**  
- Content Brief Structure (Output Parser Structured)  
- Claude Haiku 3.5 Model (shared with previous block)  
- AI Content Brief Generator (Chain LLM)  

**Node Details:**

- **Content Brief Structure**  
  - Type: Output Parser Structured  
  - Configuration: Parses AI output to ensure the brief matches expected schema, including fields like targetKeyword, searchIntent, recommendedFormat, idealLength, outline, mustIncludeSubtopics, answeredQuestions, uniqueAngle, contentGapsToFill, ctaSuggestion  
  - Input: AI Content Brief Generator raw output  
  - Output: Structured content brief JSON  
  - Version: v1.3

- **AI Content Brief Generator**  
  - Type: Chain LLM (Langchain)  
  - Configuration: Receives aggregated article analyses JSON and target keyword; prompt instructs AI to act as expert SEO strategist to generate detailed content brief as JSON  
  - Input: Aggregated analyses + keyword  
  - Output: JSON content brief per schema  
  - Edge cases: AI misunderstanding, incomplete data, unexpected JSON format  
  - Version: v1.7

---

#### Block 1.5: AI Content Draft Generation

**Overview:**  
Generates a full SEO-optimized blog post draft in HTML format based on the content brief and aggregated article summaries using Claude AI.

**Nodes Involved:**  
- Claude Sonnet 3.7 (Anthropic Claude AI model)  
- AI Content Draft (Chain LLM)  

**Node Details:**

- **Claude Sonnet 3.7**  
  - Type: Langchain Anthropic Claude AI model node  
  - Configuration: Model `claude-3-7-sonnet-20250219` used for content generation with Anthropic credentials  
  - Role: Provides AI model to generate the blog post draft using input from content brief and summaries  
  - Input: Content brief and aggregated article data  
  - Output: Draft content as raw AI response  
  - Edge cases: API limits, prompt failures  
  - Version: v1.3

- **AI Content Draft**  
  - Type: Chain LLM (Langchain)  
  - Configuration: Prompt instructs AI to write warm, clear, SEO-friendly blog post HTML; inputs are keyword, content brief JSON, and article summaries JSON  
  - Output: HTML blog post draft text  
  - Version: v1.7

---

#### Block 1.6: Content Publishing and Sheet Updates

**Overview:**  
Publishes the generated draft post to WordPress as a draft and updates the Google Sheet to mark processing completion.

**Nodes Involved:**  
- Send Draft to WordPress (WordPress node)  
- Update Excel Sheet (Google Sheets node)  
- Sticky Notes (WordPress publishing and Excel update explanations)

**Node Details:**

- **Send Draft to WordPress**  
  - Type: WordPress node  
  - Configuration: Creates a new post with title (hardcoded as "Testtest" in config, could be dynamic) and content from AI Content Draft output; uses WordPress API credentials  
  - Role: Publishes the SEO draft to WordPress site as draft content  
  - Input: Draft HTML content from AI Content Draft  
  - Output: WordPress post creation confirmation  
  - Credentials: WordPress API (OAuth or Application password)  
  - Edge cases: Authentication failure, API limits, malformed content  
  - Version: v1

- **Update Excel Sheet**  
  - Type: Google Sheets (Update operation)  
  - Configuration: Updates the `Column 1` field to "processing finished" for the row number corresponding to the keyword processed  
  - Role: Marks in Google Sheet that content generation and publishing are done  
  - Input: WordPress publish confirmation and original row number  
  - Credentials: Google Sheets OAuth2 with write access  
  - Edge cases: API failure, incorrect row mapping  
  - Version: v4.5

- **Sticky Notes**  
  - Document the purpose of publishing and sheet update blocks  

---

### 3. Summary Table

| Node Name                  | Node Type                                   | Functional Role                                  | Input Node(s)               | Output Node(s)                    | Sticky Note                                                                                                  |
|----------------------------|---------------------------------------------|-------------------------------------------------|-----------------------------|----------------------------------|--------------------------------------------------------------------------------------------------------------|
| Webhook                    | Webhook                                     | Entry point, receives prioritized keywords      |                             | Split Out                        |                                                                                                              |
| Split Out                  | Split Out                                   | Splits batch input JSON into individual keywords| Webhook                     | Update Progress Info, Search in Google Search API1 |                                                                                                              |
| Update Progress Info       | Google Sheets                               | Updates Google Sheet to mark start of processing| Split Out                   |                                  |                                                                                                              |
| Search in Google Search API1| HTTP Request                               | Queries Google Custom Search API for SERP results| Split Out                   | split into different SERP results | ## SERP Extraction Get the SERPS from Google for given Keyword                                              |
| split into different SERP results | Split Out                           | Splits SERP JSON items into individual results  | Search in Google Search API1 | Get Raw Web Page                 |                                                                                                              |
| Get Raw Web Page           | HTTP Request                               | Downloads raw HTML content of SERP result pages | split into different SERP results | Extract Text from Web Page     |                                                                                                              |
| Extract Text from Web Page | Code                                        | Cleans HTML and extracts text with heading info | Get Raw Web Page             | AI Article Analysis              |                                                                                                              |
| Claude Haiku 3.5 Model     | Langchain Anthropic Claude AI Model        | Performs initial semantic analysis on extracted text | Extract Text from Web Page | AI Article Analysis, AI Content Brief Generator | ## AI Article Analysis                                                                                         |
| AI Article Analysis        | Chain LLM (Langchain)                       | Extracts SEO content structure and insights     | Claude Haiku 3.5 Model      | Aggregate                       |                                                                                                              |
| Content Analysis Structure | Output Parser Structured                    | Parses AI output into structured JSON analysis  | AI Article Analysis         |                                  |                                                                                                              |
| Aggregate                  | Aggregate                                   | Aggregates all article analyses into one array  | AI Article Analysis         | AI Content Brief Generator       |                                                                                                              |
| AI Content Brief Generator | Chain LLM (Langchain)                       | Generates SEO content brief from aggregated data| Aggregate, Claude Haiku 3.5 Model | AI Content Draft              |                                                                                                              |
| Content Brief Structure    | Output Parser Structured                    | Parses content brief JSON                        | AI Content Brief Generator  |                                  |                                                                                                              |
| Claude Sonnet 3.7          | Langchain Anthropic Claude AI Model        | Generates blog post draft content from brief    | AI Content Brief Generator  | AI Content Draft                 |                                                                                                              |
| AI Content Draft           | Chain LLM (Langchain)                       | Produces SEO-friendly blog post HTML draft      | Claude Sonnet 3.7           | Send Draft to WordPress          |                                                                                                              |
| Send Draft to WordPress    | WordPress                                   | Publishes draft post to WordPress site           | AI Content Draft            | Update Excel Sheet               | ## Send Draft to Wordpress                                                                                     |
| Update Excel Sheet         | Google Sheets                               | Marks content generation and publishing complete| Send Draft to WordPress     |                                  | ## Update Excel Uddating the rows that are being processed                                                    |
| Sticky Notes               | Sticky Note                                 | Various documentation and workflow explanations | Various                     |                                  | Multiple sticky notes provide detailed explanations at key workflow points                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: Webhook  
   - Method: POST  
   - Path: `208f9a1a-60ce-40d8-ac20-1909f0ac4257`  
   - Purpose: Receive prioritized keyword rows JSON from Google Sheets script

2. **Add Split Out Node**  
   - Type: Split Out  
   - Field to split: `body.rows`  
   - Connect Webhook → Split Out

3. **Add Google Sheets Node (Update Progress Info)**  
   - Operation: Update  
   - Document ID and Sheet Name: Connect to your Google Sheet with keyword data  
   - Mapping: Update `Column 1` with "Started processing" for row number from input  
   - Credentials: Google Sheets OAuth2 API with write access  
   - Connect Split Out → Update Progress Info

4. **Add HTTP Request Node (Google Custom Search API)**  
   - URL: `https://www.googleapis.com/customsearch/v1`  
   - Method: GET  
   - Query Parameters:  
     - `q`: `{{$json.keywordString}}` (keyword from item)  
     - `key`: Your Google API key  
     - `cx`: Your Custom Search Engine ID  
   - Connect Split Out → Search in Google Search API1

5. **Add Split Out Node (split into different SERP results)**  
   - Field to split: `items` (from Google Search API response)  
   - Connect Search in Google Search API1 → split into different SERP results

6. **Add HTTP Request Node (Get Raw Web Page)**  
   - Method: GET  
   - URL: `={{ $json.link }}` (link from SERP item)  
   - Error handling: Continue on error  
   - Connect split into different SERP results → Get Raw Web Page

7. **Add Code Node (Extract Text from Web Page)**  
   - JavaScript code to:  
     - Remove `<script>` and `<style>` tags  
     - Replace heading tags `<h1>` to `<h6>` with `[HX] Heading [/HX]` markers  
     - Strip remaining HTML tags  
     - Normalize whitespace  
   - Error handling: Continue on error  
   - Connect Get Raw Web Page → Extract Text from Web Page

8. **Add Langchain Anthropic Node (Claude Haiku 3.5 Model)**  
   - Model: `claude-3-5-haiku-20241022`  
   - Credentials: Anthropic API Key  
   - Connect Extract Text from Web Page → Claude Haiku 3.5 Model

9. **Add Chain LLM Node (AI Article Analysis)**  
   - Prompt: SEO-focused content analysis extracting format, type, intent clues, headings, subtopics, takeaways, questions, unique angles, content gaps  
   - Input: Text from Claude Haiku 3.5 Model  
   - Output parser: Output Parser Structured node with defined JSON schema  
   - Connect Claude Haiku 3.5 Model → AI Article Analysis → Content Analysis Structure

10. **Add Aggregate Node**  
    - Aggregate field: `output` from AI Article Analysis  
    - Connect AI Article Analysis → Aggregate

11. **Add Chain LLM Node (AI Content Brief Generator)**  
    - Prompt: Generate SEO content brief (title, meta, outline, gaps, CTA) from aggregated article analyses and target keyword  
    - Input: Aggregate output + Claude Haiku 3.5 Model (shared input)  
    - Output parser: Output Parser Structured with content brief schema  
    - Connect Aggregate → AI Content Brief Generator → Content Brief Structure

12. **Add Langchain Anthropic Node (Claude Sonnet 3.7 Model)**  
    - Model: `claude-3-7-sonnet-20250219`  
    - Credentials: Anthropic API Key  
    - Connect AI Content Brief Generator → Claude Sonnet 3.7

13. **Add Chain LLM Node (AI Content Draft)**  
    - Prompt: Generate SEO-friendly blog post draft HTML based on content brief and article summaries  
    - Input: Claude Sonnet 3.7 model output  
    - Connect Claude Sonnet 3.7 → AI Content Draft

14. **Add WordPress Node (Send Draft to WordPress)**  
    - Operation: Create Post (draft)  
    - Title: Dynamic from content brief or fallback (currently hardcoded "Testtest")  
    - Content: `={{ $json.text }}` (HTML from AI Content Draft)  
    - Credentials: WordPress API credentials with post creation rights  
    - Connect AI Content Draft → Send Draft to WordPress

15. **Add Google Sheets Node (Update Excel Sheet)**  
    - Operation: Update  
    - Update `Column 1` with "processing finished" for corresponding `row_number`  
    - Credentials: Google Sheets OAuth2 API with write access  
    - Connect Send Draft to WordPress → Update Excel Sheet

---

### 5. General Notes & Resources

| Note Content                                                                                                                | Context or Link                                                                                                   |
|-----------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| Workflow last updated 11.08.2025                                                                                            | Sticky Note on Workflow explanation                                                                              |
| Setup steps: copy Excel template, add webhook to Google Script, create Custom Search API key, add Claude API key, connect WordPress | Workflow explanation Sticky Note                                                                                 |
| Full Setup Guide: https://opaque-face-45b.notion.site/Content-Automation-Pipeline-Walkthrough-221f1bceaabe808fb4efdc7c7be71bac | Workflow explanation Sticky Note                                                                                 |
| AI Article Analysis block uses Claude Haiku 3.5 for initial semantic analysis and Claude Sonnet 3.7 for content generation    | Sticky Notes and node naming                                                                                      |
| The Google Sheets nodes update the same sheet managing keywords, marking progress at start and finish                         | Sticky Notes on Excel update                                                                                      |
| WordPress Draft post creation currently uses static title "Testtest" but should be replaced with dynamic titles from brief   | Recommendation for improvement                                                                                   |

---

**Disclaimer:**  
The provided text is extracted exclusively from an automated workflow created with n8n, respecting all policies and containing no illegal or offensive content. All data handled are legal and public.