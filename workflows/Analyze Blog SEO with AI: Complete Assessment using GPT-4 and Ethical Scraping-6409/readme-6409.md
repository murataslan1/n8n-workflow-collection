Analyze Blog SEO with AI: Complete Assessment using GPT-4 and Ethical Scraping

https://n8nworkflows.xyz/workflows/analyze-blog-seo-with-ai--complete-assessment-using-gpt-4-and-ethical-scraping-6409


# Analyze Blog SEO with AI: Complete Assessment using GPT-4 and Ethical Scraping

### 1. Workflow Overview

This workflow, titled **"Analyze Blog SEO with AI: Complete Assessment using GPT-4 and Ethical Scraping"**, is designed to perform an automated, comprehensive SEO analysis of a given blog URL. It targets users who want to evaluate blog content for SEO optimization, keyword strategy, technical SEO factors, and backlink potential by leveraging both ethical web scraping and advanced AI processing.

The workflow is structured into the following logical blocks:

- **1.1 Input Reception & Preparation:** Receives a POST webhook request containing a blog URL, extracts and formats the input data for processing.
- **1.2 Input Validation & Security Checks:** Validates the URL format and required fields; sets default CSS selectors for scraping.
- **1.3 Ethical Scraping Enforcement:** Retrieves and analyzes the target site’s `robots.txt` to determine if scraping is allowed on the provided URL path.
- **1.4 Content Scraping:** If permitted by robots.txt, performs an HTTP GET request to fetch the blog’s HTML content.
- **1.5 AI Analysis:** Sends the scraped HTML content to an OpenAI GPT-4 model configured with a detailed SEO analysis prompt to generate a structured blog SEO report.
- **1.6 Response Handling:** Returns either the AI-generated SEO report or an error message based on the scraping permission outcome.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Preparation

- **Overview:**  
  This block receives the webhook POST data, extracts the blog URL from multiple possible fields (`blogUrl` or `message`), and formats it into a standard structure for downstream processing.

- **Nodes Involved:**  
  - Webhook  
  - Edit Fields

- **Node Details:**

  - **Webhook**  
    - *Type & Role:* HTTP Webhook listener (POST) that triggers the workflow.  
    - *Configuration:* Path set to a unique webhook ID; accepts requests from any origin (`allowedOrigins` = "*").  
    - *Expressions:* None.  
    - *Connections:* Output connected to Edit Fields.  
    - *Edge Cases:* Invalid or missing webhook calls will not trigger workflow; no explicit validation here.

  - **Edit Fields**  
    - *Type & Role:* Data transformation node to extract the URL from webhook payload.  
    - *Configuration:* Sets JSON body with field `url` taken from either `blogUrl` or `message` in the webhook body.  
    - *Expressions:* Uses expression to select between `blogUrl` or `message`.  
    - *Connections:* Output connects to validate-input node.  
    - *Edge Cases:* If both fields are missing or empty, downstream validation will catch it.

---

#### 2.2 Input Validation & Security Checks

- **Overview:**  
  Validates the presence and format of the URL and optional user prompts/selectors. Also sets default CSS selectors if none provided.

- **Nodes Involved:**  
  - validate-input

- **Node Details:**

  - **validate-input**  
    - *Type & Role:* Code node performing JavaScript validation and defaults setup.  
    - *Configuration:*  
      - Checks for presence of `body` or `chatInput`.  
      - Validates URL presence and format with a regex enforcing HTTP/HTTPS schemes.  
      - Sets default CSS selectors for title, content, links, and images if none provided.  
      - Returns a structured JSON with `url`, optional `userPrompt`, `selectors`, and current timestamp.  
    - *Expressions:* Uses `$input.first().json.body` and regex for URL.  
    - *Connections:* Output connects to Check robots.txt node.  
    - *Edge Cases:* Throws errors on missing URL or invalid URL format. Potential failure if input structure changes or regex fails.

---

#### 2.3 Ethical Scraping Enforcement (Robots.txt Compliance)

- **Overview:**  
  Fetches the target domain’s `robots.txt` and analyzes it to ensure scraping the requested URL is allowed, to maintain ethical standards.

- **Nodes Involved:**  
  - Check robots.txt  
  - analyze-robots  
  - If  
  - Respond to Webhook1 (error response)  
  - No Operation, do nothing (final node if disallowed)

- **Node Details:**

  - **Check robots.txt**  
    - *Type & Role:* HTTP Request node fetching `robots.txt` from the target domain root.  
    - *Configuration:*  
      - URL dynamically built from the first 3 parts of the input URL (`protocol + domain`).  
      - Timeout 10 seconds, max redirects 3.  
    - *Connections:* Output connects to analyze-robots.  
    - *Edge Cases:* Network timeout, HTTP errors, missing robots.txt handled downstream.

  - **analyze-robots**  
    - *Type & Role:* Code node parsing the robots.txt content.  
    - *Configuration:*  
      - Reads robots.txt content line by line, looking for `User-agent` entries matching `*` or `n8n`.  
      - Checks if any `Disallow` directives match the URL path.  
      - Throws an error if scraping disallowed.  
      - Passes along original validated input with scraping permission flag and robots.txt info string.  
    - *Connections:* Output connects to If node.  
    - *Edge Cases:* If robots.txt not found or empty, defaults to allow scraping with caution. Errors thrown if scraping disallowed.

  - **If**  
    - *Type & Role:* Conditional node branching based on `scrapingAllowed` boolean.  
    - *Configuration:* Checks if `scrapingAllowed` is `true`.  
    - *Connections:*  
      - True branch → Scrape Website node  
      - False branch → Respond to Webhook1 node  
    - *Edge Cases:* Logical failures if flag missing or malformed.

  - **Respond to Webhook1**  
    - *Type & Role:* Responds with HTTP 500 status and error message indicating scraping is not allowed.  
    - *Connections:* Output connects to No Operation node.  
    - *Edge Cases:* Provides graceful failure response to requester.

  - **No Operation, do nothing**  
    - *Type & Role:* Terminates workflow execution after error response.  
    - *Edge Cases:* None.

---

#### 2.4 Content Scraping

- **Overview:**  
  Scrapes the HTML content of the target blog URL using an HTTP GET request.

- **Nodes Involved:**  
  - Scrape Website  
  - Markdown

- **Node Details:**

  - **Scrape Website**  
    - *Type & Role:* HTTP Request node fetching the actual blog page HTML.  
    - *Configuration:*  
      - URL from input JSON `url`.  
      - Timeout 30 seconds, max redirects 5 for robustness.  
    - *Connections:* Output connects to Markdown node.  
    - *Edge Cases:* Network issues, HTTP errors, large pages causing timeouts.

  - **Markdown**  
    - *Type & Role:* Converts raw HTML content (from `data` field) to markdown format.  
    - *Configuration:*  
      - Uses fenced code block style, supports link references.  
      - Input expression extracts `data` field from HTTP response.  
    - *Connections:* Output connects to SEO Blog Analysis (OpenAI node).  
    - *Edge Cases:* Malformed HTML may cause incomplete markdown conversion.

---

#### 2.5 AI Analysis

- **Overview:**  
  Sends the scraped blog content markdown to OpenAI’s GPT-4 model with a detailed SEO analysis system prompt, generating a structured SEO assessment report.

- **Nodes Involved:**  
  - SEO Blog Analysis  
  - Code  
  - Respond to Webhook

- **Node Details:**

  - **SEO Blog Analysis**  
    - *Type & Role:* OpenAI LangChain node calling GPT-4.1 model for SEO analysis.  
    - *Configuration:*  
      - Model: GPT-4.1  
      - Temperature: 0.1 for precise, deterministic output  
      - Top-p: 0.6 to balance diversity and focus  
      - System prompt: Extensive, defines a four-pillar SEO analysis framework (Content, Keyword, Technical SEO, Backlink Building) with detailed evaluation criteria and output structure.  
      - Input: Markdown converted blog content.  
    - *Credentials:* OpenAI API credentials configured.  
    - *Connections:* Output connects to Code node.  
    - *Edge Cases:* API rate limits, network failures, prompt length limits, response JSON parsing errors.

  - **Code**  
    - *Type & Role:* Post-processing step to stringify JSON fields from AI output if needed.  
    - *Configuration:* Loops over input items, stringifies a JSON field named `someObject` into `myStringifiedField`.  
    - *Connections:* Output connects to Respond to Webhook.  
    - *Edge Cases:* Assumes presence of `someObject`; may fail if absent.

  - **Respond to Webhook**  
    - *Type & Role:* Sends the final SEO report back to the original requester as HTTP response.  
    - *Connections:* Terminal node.  
    - *Edge Cases:* Large payloads may cause response delays; network issues.

---

#### 2.6 Sticky Notes and Documentation Nodes

- Multiple sticky notes are used throughout the workflow to document architecture, data preparation, validation, robots.txt compliance, scraping, and AI analysis steps. These are for human reference only and do not affect execution.

---

### 3. Summary Table

| Node Name          | Node Type                        | Functional Role                         | Input Node(s)        | Output Node(s)                  | Sticky Note                                                                                                  |
|--------------------|---------------------------------|---------------------------------------|----------------------|--------------------------------|--------------------------------------------------------------------------------------------------------------|
| Webhook            | n8n-nodes-base.webhook           | Receive blog URL POST request          |                      | Edit Fields                    | Data Preparation: Extracts and formats blog URL from payload                                                  |
| Edit Fields        | n8n-nodes-base.set               | Extract URL from webhook payload       | Webhook              | validate-input                 | Data Preparation: Handles `blogUrl` and `message` fields                                                     |
| validate-input     | n8n-nodes-base.code              | Validate URL and input parameters      | Edit Fields           | Check robots.txt               | Input Validation & Security: URL format and default selectors                                                |
| Check robots.txt   | n8n-nodes-base.httpRequest       | Fetch robots.txt for domain            | validate-input        | analyze-robots                | Robots.txt Compliance: Fetch and check `robots.txt`                                                          |
| analyze-robots     | n8n-nodes-base.code              | Parse robots.txt and check permissions | Check robots.txt      | If                            | Robots.txt Parser: Analyze User-agent and Disallow rules, block if disallowed                                 |
| If                 | n8n-nodes-base.if                | Branch on scraping permission          | analyze-robots        | Scrape Website / Respond to Webhook1 |                                                                                                              |
| Respond to Webhook1| n8n-nodes-base.respondToWebhook  | Respond with error if scraping disallowed | If (False branch)     | No Operation                  |                                                                                                              |
| No Operation, do nothing | n8n-nodes-base.noOp          | Terminate workflow after error         | Respond to Webhook1   |                                |                                                                                                              |
| Scrape Website     | n8n-nodes-base.httpRequest       | Fetch blog page HTML content            | If (True branch)      | Markdown                      | Content Extractor: HTTP GET blog content with timeout and redirects                                          |
| Markdown           | n8n-nodes-base.markdown          | Convert raw HTML content to markdown   | Scrape Website        | SEO Blog Analysis             |                                                                                                              |
| SEO Blog Analysis  | @n8n/n8n-nodes-langchain.openAi | AI SEO analysis using GPT-4             | Markdown              | Code                         | AI Content Intelligence Engine: Comprehensive SEO analysis prompt and model                                  |
| Code               | n8n-nodes-base.code              | Post-process AI output JSON             | SEO Blog Analysis     | Respond to Webhook            |                                                                                                              |
| Respond to Webhook | n8n-nodes-base.respondToWebhook  | Return final SEO report to requester    | Code                  |                                |                                                                                                              |
| Sticky Note        | n8n-nodes-base.stickyNote        | Documentation                          |                      |                                | Architecture Overview: Ethical scraping + AI analysis pipeline                                              |
| Sticky Note1       | n8n-nodes-base.stickyNote        | Documentation                          |                      |                                | Data Preparation: Extract and format blog URL from webhook payload                                          |
| Sticky Note2       | n8n-nodes-base.stickyNote        | Documentation                          |                      |                                | Input Validation & Security: URL validation, default selectors                                              |
| Sticky Note3       | n8n-nodes-base.stickyNote        | Documentation                          |                      |                                | Robots.txt Compliance: Fetch and check before scraping                                                     |
| Sticky Note4       | n8n-nodes-base.stickyNote        | Documentation                          |                      |                                | Robots.txt Parser: Logic to analyze robots.txt and enforce compliance                                       |
| Sticky Note5       | n8n-nodes-base.stickyNote        | Documentation                          |                      |                                | Content Extractor: Blog content HTTP GET with timeout                                                     |
| Sticky Note6       | n8n-nodes-base.stickyNote        | Documentation                          |                      |                                | AI Content Intelligence Engine: Detailed SEO analysis prompt and model settings                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node:**  
   - Type: `Webhook`  
   - HTTP Method: POST  
   - Path: Unique identifier (e.g., "44af52f1-6a3c-439f-b1b6-90e37f2dec8b")  
   - Allowed Origins: `*`  
   - Response Mode: `responseNode` (to send response later)  

2. **Add Set Node (Edit Fields):**  
   - Type: `Set`  
   - Mode: Raw JSON  
   - JSON Body:  
     ```json
     {
       "body": {
         "url": "={{ $item(0).$node[\"Webhook\"].json[\"body\"][\"blogUrl\"] || $item(0).$node[\"Webhook\"].json[\"body\"][\"message\"] }}"
       }
     }
     ```  
   - Connect Webhook output → Edit Fields input.

3. **Add Code Node (validate-input):**  
   - Type: `Code`  
   - Language: JavaScript  
   - Script:  
     - Confirm presence of `body` or `chatInput`.  
     - Extract `url`, `userPrompt`, `selectors` from input.  
     - Validate `url` presence.  
     - Validate URL format with regex for HTTP/HTTPS.  
     - Set default CSS selectors if `selectors` not provided:  
       - title: "title, h1"  
       - content: "p, .content, article"  
       - links: "a[href]"  
       - images: "img[src]"  
     - Return JSON with `url`, `userPrompt`, `selectors`, `timestamp`.  
   - Connect Edit Fields output → validate-input input.

4. **Add HTTP Request Node (Check robots.txt):**  
   - Type: `HTTP Request`  
   - Method: GET  
   - URL: `={{ $json.url.split('/').slice(0, 3).join('/') }}/robots.txt`  
   - Timeout: 10,000 ms  
   - Max Redirects: 3  
   - Connect validate-input output → Check robots.txt input.

5. **Add Code Node (analyze-robots):**  
   - Type: `Code`  
   - Script:  
     - Retrieve robots.txt content.  
     - Parse lines looking for user-agent `*` or `n8n`.  
     - Check for disallow rules matching URL path.  
     - If disallowed, throw error to prevent scraping.  
     - Return input data plus `robotsInfo` and `scrapingAllowed` flags.  
   - Connect Check robots.txt output → analyze-robots input.

6. **Add If Node (Check scrapingAllowed):**  
   - Type: `If`  
   - Condition: `scrapingAllowed` equals `true` (boolean).  
   - Connect analyze-robots output → If input.

7. **Add HTTP Request Node (Scrape Website):**  
   - Type: `HTTP Request`  
   - Method: GET  
   - URL: `={{ $json.url }}`  
   - Timeout: 30,000 ms  
   - Max Redirects: 5  
   - Connect If "true" output → Scrape Website input.

8. **Add Markdown Node:**  
   - Type: `Markdown`  
   - Input HTML: `={{ $json.data }}`  
   - Code Block Style: Fence  
   - Connect Scrape Website output → Markdown input.

9. **Add OpenAI Node (SEO Blog Analysis):**  
   - Type: `OpenAI` (LangChain)  
   - Model: GPT-4.1 (or latest GPT-4 available)  
   - Temperature: 0.1  
   - Top-p: 0.6  
   - System Prompt: Use the detailed SEO blog analysis prompt defining four strategic pillars and output format (copy from workflow).  
   - Input Messages: Pass Markdown content as user content.  
   - Credentials: Configure OpenAI API credentials.  
   - Connect Markdown output → SEO Blog Analysis input.

10. **Add Code Node:**  
    - Purpose: Post-process AI output if needed (e.g., stringify JSON fields).  
    - Script: Loop over input items, stringify `someObject` to `myStringifiedField`.  
    - Connect SEO Blog Analysis output → Code input.

11. **Add Respond to Webhook Node (Success Response):**  
    - Type: `Respond to Webhook`  
    - Connect Code output → Respond to Webhook input.

12. **Add Respond to Webhook Node (Error Response):**  
    - Type: `Respond to Webhook`  
    - Response code: 500  
    - Respond with text: "The scrapping of the website is not allowed"  
    - Connect If "false" output → Respond to Webhook (error) input.

13. **Add No Operation Node:**  
    - Type: `No Operation`  
    - Connect Respond to Webhook (error) output → No Operation input.

---

### 5. General Notes & Resources

| Note Content                                                                                                              | Context or Link                                                                                          |
|---------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| Architecture Overview: Ethical scraping + AI analysis pipeline with webhook trigger, validation, robots.txt compliance.   | Sticky Note at workflow start                                                                            |
| Data Preparation: Handles extracting URL from webhook fields `blogUrl` or `message`.                                       | Sticky Note near Edit Fields node                                                                        |
| Input Validation & Security: Validates URL presence, format, sets default CSS selectors for scraping.                      | Sticky Note near validate-input node                                                                     |
| Robots.txt Compliance: Fetches and analyzes robots.txt with timeout and redirect limits to enforce ethical scraping.      | Sticky Note near Check robots.txt node                                                                   |
| Robots.txt Parser: Checks User-agent and Disallow rules, blocks scraping if disallowed.                                    | Sticky Note near analyze-robots node                                                                     |
| Content Extractor: HTTP GET with 30-second timeout, 5 max redirects, optimized for large pages.                           | Sticky Note near Scrape Website node                                                                     |
| AI Content Intelligence Engine: Detailed SEO analysis prompt covering content, keywords, technical SEO, backlinks.        | Sticky Note near SEO Blog Analysis node                                                                  |
| OpenAI Model Configuration: GPT-4.1 with low temperature for precise, reliable SEO reports.                                | Included in SEO Blog Analysis node                                                                        |
| Comprehensive SEO Analysis Framework: Multi-dimensional evaluation including executive summary, detailed metrics, and roadmap. | Described in system prompt used in AI node                                                               |

---

**Disclaimer:** This workflow was created solely using n8n automation tooling, fully compliant with content policies. It processes only lawful, public data and respects website scraping ethics.