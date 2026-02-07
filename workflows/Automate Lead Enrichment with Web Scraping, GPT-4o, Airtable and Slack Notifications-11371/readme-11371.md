Automate Lead Enrichment with Web Scraping, GPT-4o, Airtable and Slack Notifications

https://n8nworkflows.xyz/workflows/automate-lead-enrichment-with-web-scraping--gpt-4o--airtable-and-slack-notifications-11371


# Automate Lead Enrichment with Web Scraping, GPT-4o, Airtable and Slack Notifications

### 1. Workflow Overview

This workflow automates lead enrichment by processing form-submitted leads, scraping their websites for relevant content, analyzing the extracted data with GPT-4o, storing insights in Airtable, and sending Slack notifications to the sales team. It targets businesses seeking to optimize "speed-to-lead," automate prospect research, and enrich CRM data with AI-generated summaries.

The workflow is logically divided into these blocks:

- **1.1 Input Reception:** Captures lead data from an embedded web form.
- **1.2 Website Scraping:** Fetches the lead's homepage HTML content.
- **1.3 AI Content Analysis:** Uses GPT-4o to analyze homepage content; decides if further detail is needed.
- **1.4 Secondary Scraping (if needed):** Scrapes a fallback URL (e.g., "About Us" page) when homepage text is vague.
- **1.5 AI Secondary Analysis:** Analyzes the secondary page content to generate a concise summary.
- **1.6 Data Processing:** Cleans and aggregates AI output for CRM insertion.
- **1.7 CRM Logging:** Writes enriched lead data to Airtable.
- **1.8 Notifications:** Sends Slack messages with the new lead and AI insights.
- **1.9 Error Handling:** Logs scraping or processing failures into Airtable for manual review.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  Collects lead details (Name, Email, Website) via a form submission trigger node.

- **Nodes Involved:**  
  - On form submission

- **Node Details:**  
  - **On form submission**  
    - **Type:** Form Trigger  
    - **Role:** Entry point capturing user input from a custom form titled "Contact Us" with fields for Name (required), Email (required, email type), and Website (required).  
    - **Configuration:** Button label "Submit"; no attribution appended; includes placeholder hints for fields.  
    - **Input:** User interaction on the form.  
    - **Output:** JSON object containing submitted Name, Email, Website, and timestamp.  
    - **Edge Cases:** Missing required fields prevented by form validation; invalid email format rejected by form; no direct error handling beyond form validation.

---

#### 1.2 Website Scraping

- **Overview:**  
  Scrapes the submitted website URL’s homepage HTML content to extract key textual elements for initial AI analysis.

- **Nodes Involved:**  
  - Scrape home page  
  - HTML

- **Node Details:**  
  - **Scrape home page**  
    - **Type:** HTTP Request  
    - **Role:** Fetches the homepage HTML of the submitted website URL, with logic to normalize the URL (adds https:// if missing, prepends www. for root domains).  
    - **Configuration:** Returns raw HTML text; follows redirects; on error continues workflow (does not fail).  
    - **Input:** Website URL from form submission node.  
    - **Output:** Raw homepage HTML content as text.  
    - **Edge Cases:** Invalid or unreachable URLs cause node to fail but continue error output; malformed URL input handled via try/catch logic.  
  - **HTML**  
    - **Type:** HTML Extractor  
    - **Role:** Parses homepage HTML content to extract:  
      - `<h1>` text (key header)  
      - All `<h2>` elements (array)  
      - Meta description content  
      - All links in `<nav>` or `<header>` tags (array of href attributes)  
    - **Input:** Raw HTML from "Scrape home page" node.  
    - **Output:** JSON with extracted fields: h1, h2[], meta_description, nav_links[].  
    - **Edge Cases:** Missing elements yield empty strings or empty arrays; malformed HTML could affect extraction but rare.

---

#### 1.3 AI Content Analysis

- **Overview:**  
  Uses GPT-4o to interpret homepage text and decide if it clearly explains the company. Outputs a summary or a fallback URL path for deeper scraping.

- **Nodes Involved:**  
  - Message a model  
  - Switch

- **Node Details:**  
  - **Message a model**  
    - **Type:** OpenAI (LangChain)  
    - **Role:** Receives extracted homepage text (h1, h2, meta description, nav_links) and prompts GPT-4o to classify if the homepage content clearly explains the business or if more info is needed.  
    - **Configuration:**  
      - Model: chatgpt-4o-latest  
      - System prompt instructs the model to output JSON ONLY with: `status` ("success" or "need_more_info"), `summary` (if success), or `fallback_url` path (if need_more_info).  
      - Input prompt includes homepage text and nav_links for reference.  
    - **Input:** JSON from HTML extraction node.  
    - **Output:** JSON string with status and either summary or fallback URL path.  
    - **Edge Cases:** Model may output invalid JSON if prompt misunderstood; network or API rate limit errors possible; requires valid OpenAI credentials.  
  - **Switch**  
    - **Type:** Conditional Router  
    - **Role:** Parses GPT output JSON string and routes workflow based on `status`:  
      - "success" → proceed with summary processing  
      - "need_more_info" → proceed to construct secondary URL for deeper scraping  
      - default → error handling (unknown status)  
    - **Input:** GPT JSON text  
    - **Output:** Three outputs named "Script Ready", "Need Deep Dive", and fallback "extra".  
    - **Edge Cases:** Malformed or missing JSON causes fallback routing; expression parsing errors if GPT output format changes.

---

#### 1.4 Secondary Scraping (Conditional)

- **Overview:**  
  If the homepage is vague, constructs a full fallback URL (usually the "About Us" page) and scrapes that page for additional details.

- **Nodes Involved:**  
  - Construct secondary URL  
  - Scrape secondary URL  
  - HTML1

- **Node Details:**  
  - **Construct secondary URL**  
    - **Type:** Set  
    - **Role:** Parses the fallback URL path from GPT JSON output, combines it with the base website URL (ensuring protocol and domain correctness) to produce a full fallback URL.  
    - **Input:** GPT output JSON and original form URL.  
    - **Output:** JSON with property `Fallback URL`.  
    - **Edge Cases:** Missing or malformed fallback_url path can cause URL build failures; assumes relative paths unless full URL provided.  
  - **Scrape secondary URL**  
    - **Type:** HTTP Request  
    - **Role:** Fetches HTML content of the constructed fallback URL.  
    - **Configuration:** Returns raw HTML text; on error continues error output.  
    - **Input:** `Fallback URL` from previous node.  
    - **Output:** Raw HTML text of fallback page.  
    - **Edge Cases:** Network errors, 404s if fallback URL invalid; continues with error output.  
  - **HTML1**  
    - **Type:** HTML Extractor  
    - **Role:** Extracts the main textual content from the fallback page by selecting the `<main>` element’s inner text.  
    - **Input:** HTML text from fallback URL fetch.  
    - **Output:** JSON with key `about_text`.  
    - **Edge Cases:** Missing `<main>` element yields empty string; malformed HTML affects extraction.

---

#### 1.5 AI Secondary Analysis

- **Overview:**  
  Sends the "About Us" or fallback page text to GPT-4o for a concise 2-sentence summary tailored for sales reps.

- **Nodes Involved:**  
  - Message a model1  
  - Clean Data1

- **Node Details:**  
  - **Message a model1**  
    - **Type:** OpenAI (LangChain)  
    - **Role:** Receives `about_text` and prompts GPT-4o to generate a 2-sentence summary focusing on mission/history for sales understanding.  
    - **Configuration:**  
      - Model: chatgpt-4o-latest  
      - System prompt instructs raw text output (no JSON) limited to 2 sentences.  
    - **Input:** Extracted `about_text`.  
    - **Output:** Raw text summary string.  
    - **Edge Cases:** Model output variance; network issues; requires OpenAI credentials.  
  - **Clean Data1**  
    - **Type:** Set  
    - **Role:** Assigns the raw text summary to field `final_script` for downstream use.  
    - **Input:** Raw text from Message a model1.  
    - **Output:** JSON with `final_script` property.  
    - **Edge Cases:** Null or empty model output; expression failures if output missing.

---

#### 1.6 Data Processing & Aggregation

- **Overview:**  
  Wraps the AI output into a consistent format and aggregates data for CRM insertion.

- **Nodes Involved:**  
  - Clean Data  
  - Aggregate

- **Node Details:**  
  - **Clean Data**  
    - **Type:** Set  
    - **Role:** Extracts the `summary` string from the GPT JSON output and assigns it to `final_script`.  
    - **Input:** GPT JSON text from "Script Ready" branch.  
    - **Output:** JSON with `final_script` property.  
    - **Edge Cases:** Expression parsing errors if JSON format changes.  
  - **Aggregate**  
    - **Type:** Aggregate  
    - **Role:** Aggregates all input item data into a single JSON object to prepare for Airtable insertion.  
    - **Input:** `final_script` and original form fields.  
    - **Output:** Single aggregated JSON object.  
    - **Edge Cases:** No items input yields empty aggregation.

---

#### 1.7 CRM Logging

- **Overview:**  
  Creates a new record in Airtable with lead information and AI-generated insights.

- **Nodes Involved:**  
  - Create a record

- **Node Details:**  
  - **Create a record**  
    - **Type:** Airtable  
    - **Role:** Inserts a new lead record into a specified Airtable base and table, mapping Date, Name, Email, Website, and AI Insight fields.  
    - **Configuration:**  
      - Uses a personal access token credential.  
      - Date field uses the form submission timestamp.  
      - AI Insight field receives `final_script` from AI analysis.  
      - Typecasting enabled for correct data types.  
    - **Input:** Aggregated JSON with lead data and AI summary.  
    - **Output:** Airtable record creation response.  
    - **Edge Cases:** API errors, permission issues, or schema mismatches cause failures; no retry logic shown.

---

#### 1.8 Notifications

- **Overview:**  
  Sends a Slack message to a designated channel notifying the sales team of the new enriched lead.

- **Nodes Involved:**  
  - Send a message

- **Node Details:**  
  - **Send a message**  
    - **Type:** Slack  
    - **Role:** Posts a formatted message to a specific Slack channel with lead Name, Email, Website, and AI Insight.  
    - **Configuration:**  
      - Uses OAuth2 credentials for Slack.  
      - Channel selected from a list (e.g., "all-n8n-test").  
      - Includes no link back to workflow for discretion.  
    - **Input:** Airtable record fields from previous node.  
    - **Output:** Slack API response.  
    - **Edge Cases:** Slack API rate limits or auth failures; channel ID must be valid.

---

#### 1.9 Error Handling

- **Overview:**  
  Logs any scraping or processing failures into the CRM with a fixed "Scrape Failed" AI Insight message for manual follow-up.

- **Nodes Involved:**  
  - Error handling

- **Node Details:**  
  - **Error handling**  
    - **Type:** Airtable  
    - **Role:** Creates a record in the same Airtable table as successful leads, but with AI Insight set to "Scrape Failed - Check URL manually".  
    - **Input:** Original lead data from form submission; triggered on errors from scraping or AI nodes.  
    - **Output:** Airtable record creation response.  
    - **Edge Cases:** If Airtable API fails here, errors may be lost; no retry or alert mechanism included.

---

### 3. Summary Table

| Node Name             | Node Type                         | Functional Role                        | Input Node(s)           | Output Node(s)                 | Sticky Note                                                                                                            |
|-----------------------|----------------------------------|-------------------------------------|-------------------------|-------------------------------|------------------------------------------------------------------------------------------------------------------------|
| On form submission     | Form Trigger                     | Lead data input from user form       | -                       | Scrape home page              |                                                                                                                        |
| Scrape home page       | HTTP Request                    | Fetch homepage HTML                   | On form submission       | HTML; Error handling          | "## Scrape the URL provided\nWe begin by scraping the URL that the user submitted in the form and assess whether it contains enough substance to summarize." |
| HTML                  | HTML Extractor                   | Extract homepage textual content     | Scrape home page         | Message a model               |                                                                                                                        |
| Message a model        | OpenAI LangChain                | Analyze homepage text with GPT-4o    | HTML                    | Switch                       |                                                                                                                        |
| Switch                 | Conditional Router              | Route based on AI status             | Message a model          | Clean Data; Construct secondary URL; Error handling |                                                                                                                        |
| Construct secondary URL| Set                            | Build full fallback URL              | Switch                   | Scrape secondary URL         | "## Construct a secondary URL\nIf the provided URL does not contain enough information, a secondary URL is constructed and scraped based on the initial scraping performed." |
| Scrape secondary URL   | HTTP Request                   | Fetch fallback page HTML             | Construct secondary URL  | HTML1; Error handling        |                                                                                                                        |
| HTML1                 | HTML Extractor                 | Extract text from fallback page      | Scrape secondary URL     | Message a model1             |                                                                                                                        |
| Message a model1       | OpenAI LangChain               | Generate summary from fallback text  | HTML1                    | Clean Data1                  |                                                                                                                        |
| Clean Data1            | Set                            | Assign fallback summary to field     | Message a model1         | Aggregate                    |                                                                                                                        |
| Clean Data             | Set                            | Extract summary from primary AI JSON | Switch                   | Aggregate                    |                                                                                                                        |
| Aggregate              | Aggregate                      | Aggregate data for Airtable insert   | Clean Data; Clean Data1  | Create a record              |                                                                                                                        |
| Create a record        | Airtable                       | Insert lead and AI insight to CRM    | Aggregate                | Send a message               | "## CRM logging and Slack notif\nWe log the customer data in our CRM and send an instant notification to our Slack channel for follow-up" |
| Send a message         | Slack                         | Notify team of new enriched lead     | Create a record          | -                           |                                                                                                                        |
| Error handling         | Airtable                      | Log failed scraping attempts         | Scrape home page; Scrape secondary URL; Switch | -                           | "## Error Handling\nIn the event the web scraping fails, we log it into our CRM for the user to check manually"          |
| Sticky Note            | Sticky Note                   | Documentation and workflow overview  | -                       | -                           | Detailed introduction and usage notes                                                                                  |
| Sticky Note1           | Sticky Note                   | Notes on initial scraping step       | -                       | -                           | See above for content                                                                                                   |
| Sticky Note2           | Sticky Note                   | Notes on secondary URL construction  | -                       | -                           | See above for content                                                                                                   |
| Sticky Note3           | Sticky Note                   | Explanation of error handling         | -                       | -                           | See above for content                                                                                                   |
| Sticky Note4           | Sticky Note                   | CRM and Slack notification details   | -                       | -                           | See above for content                                                                                                   |

---

### 4. Reproducing the Workflow from Scratch

**Step 1:** Create the entry form trigger node.

- Node: *On form submission*  
- Type: Form Trigger  
- Configure form with title "Contact Us" and description "Fill out this form and we'll get back to you as soon as we can!"  
- Add fields:  
  - Name (text, required, placeholder "Your good name...")  
  - Email (email type, required, placeholder "Your best email")  
  - Website (text, required)  
- Set button label to "Submit"  
- Save webhook URL.

---

**Step 2:** Add HTTP Request node to scrape homepage.

- Node: *Scrape home page*  
- Type: HTTP Request  
- URL: Use expression code to clean and normalize URL submitted:  
  ```
  (() => {
    let url = $json.Website.trim();
    if (!url.match(/^https?:\/\//)) url = 'https://' + url;
    try {
      const urlObj = new URL(url);
      if (!urlObj.hostname.startsWith('www.') && urlObj.hostname.split('.').length === 2) {
        urlObj.hostname = 'www.' + urlObj.hostname;
      }
      return urlObj.toString();
    } catch {
      return url;
    }
  })()
  ```  
- Response format: Text  
- Follow redirects enabled  
- On error: continue workflow (do not fail)

---

**Step 3:** Add HTML Extract node to parse homepage content.

- Node: *HTML*  
- Type: HTML Extract  
- Operation: Extract HTML content  
- Extraction keys:  
  - h1: selector `h1`  
  - h2: selector `h2` (return array)  
  - meta_description: selector `meta[name="description"]` attribute `content`  
  - nav_links: selectors `nav a, header a` attribute `href` (return array)

---

**Step 4:** Add OpenAI LangChain node to analyze homepage text.

- Node: *Message a model*  
- Type: OpenAI (LangChain)  
- Model: chatgpt-4o-latest  
- System prompt: Explain role as Sales Researcher; request JSON-only output with `status`, `summary`, or `fallback_url`.  
- User prompt: Pass extracted h1, h2, description, nav_links using expressions:  
  ```
  H1: {{ $json.h1 }} H2: {{ $json.h2 }} Description: {{ $json.meta_description }} Links: {{ $json.nav_links }}
  ```  
- Credentials: OpenAI API key configured.

---

**Step 5:** Add Switch node to route based on AI output.

- Node: *Switch*  
- Type: Switch (conditional)  
- Rules:  
  - Output "Script Ready" if AI output JSON contains `"status": "success"`  
  - Output "Need Deep Dive" if AI output JSON contains `"status": "need_more_info"`  
  - Fallback output for errors or unknown status

---

**Step 6:** For "Script Ready" path, add Set node to extract summary.

- Node: *Clean Data*  
- Type: Set  
- Expression to extract summary from AI JSON string:  
  ```
  {{ $json.output[0].content[0].text.match(/"summary":\s*"([^"]+)"/)[1] }}
  ```  
- Assign to field `final_script`.

---

**Step 7:** For "Need Deep Dive" path, add Set node to build fallback URL.

- Node: *Construct secondary URL*  
- Type: Set  
- Expression to build fallback URL combining base website and fallback path from AI JSON:  
  ```
  (() => {
    const extractedPath = $json.output[0].content[0].text.match(/"fallback_url":\s*"([^"]+)"/)[1];
    const rawBase = $('On form submission').item.json.Website;
    const cleanBase = (rawBase.startsWith('http') ? rawBase : 'https://' + rawBase).replace(/\/$/, "");
    return extractedPath.startsWith('http') ? extractedPath : cleanBase + extractedPath;
  })()
  ```  
- Assign to field `Fallback URL`.

---

**Step 8:** Add HTTP Request node to scrape fallback URL.

- Node: *Scrape secondary URL*  
- Type: HTTP Request  
- URL: `{{$json["Fallback URL"]}}`  
- Response format: Text  
- On error: continue workflow (do not fail)

---

**Step 9:** Add HTML Extract node to parse fallback page content.

- Node: *HTML1*  
- Type: HTML Extract  
- Operation: Extract HTML content  
- Extraction key: `about_text` from selector `main`

---

**Step 10:** Add OpenAI LangChain node to generate fallback summary.

- Node: *Message a model1*  
- Type: OpenAI (LangChain)  
- Model: chatgpt-4o-latest  
- System prompt: Role as Sales Rep, generate 2-sentence summary from `about_text`, no JSON output.  
- User prompt:  
  ```
  Page Text: {{ $json.about_text }}
  ```  
- Credentials: OpenAI API key.

---

**Step 11:** Add Set node to assign fallback summary.

- Node: *Clean Data1*  
- Type: Set  
- Assign raw text output from previous node to `final_script` field.

---

**Step 12:** Add Aggregate node to prepare data for Airtable.

- Node: *Aggregate*  
- Type: Aggregate  
- Aggregate mode: aggregateAllItemData (combine all fields into one JSON)

---

**Step 13:** Add Airtable node to create lead record.

- Node: *Create a record*  
- Type: Airtable  
- Base and Table: Select your Airtable CRM base and table (e.g., "n8n Smart Lead CRM")  
- Columns mapping:  
  - Date: `={{ $('On form submission').item.json.submittedAt }}`  
  - Name: `={{ $('On form submission').item.json.Name }}`  
  - Email: `={{ $('On form submission').item.json.Email }}`  
  - Website: `={{ $('On form submission').item.json.Website }}`  
  - AI Insight: `={{ $json.data[0].final_script }}`  
- Enable typecasting  
- Credentials: Airtable Personal Access Token

---

**Step 14:** Add Slack node to send notification.

- Node: *Send a message*  
- Type: Slack  
- Channel: Select Slack channel by ID (e.g., "C09UQRDCTT4")  
- Message text:  
  ```
  New lead acquired.  
  Name:  {{ $json.fields.Name }}  
  Email: {{ $json.fields.Email }}  
  Website: {{ $json.fields.Website }}  
  AI Insight: {{ $json.fields['AI Insight'] }}
  ```  
- Authentication: OAuth2  
- Credentials: Slack OAuth2 account

---

**Step 15:** Add Error Handling path.

- Node: *Error handling*  
- Type: Airtable  
- Same base and table as main record creation  
- Columns mapping same as main but AI Insight fixed to: `"Scrape Failed - Check URL manually"`  
- Trigger this node from error outputs of scraping and switch nodes.

---

**Step 16:** Connect all nodes as per logical flow:

- On form submission → Scrape home page → HTML → Message a model → Switch  
- Switch "Script Ready" → Clean Data → Aggregate → Create a record → Send a message  
- Switch "Need Deep Dive" → Construct secondary URL → Scrape secondary URL → HTML1 → Message a model1 → Clean Data1 → Aggregate → Create a record → Send a message  
- Switch fallback or scraping errors → Error handling

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                | Context or Link                                                                                                   |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| This workflow automates lead enrichment using AI and integrates web scraping, Airtable CRM, and Slack notifications for sales teams.                                                       | Workflow overview sticky note in the original workflow.                                                         |
| Requires valid OpenAI API credentials (GPT-4o model) to process website content and generate summaries.                                                                                    | Credential setup instruction.                                                                                     |
| Airtable base must have columns: Name, Email, Website, Date, AI Insight for proper data mapping.                                                                                            | Configuration note in Create a record node.                                                                       |
| Slack OAuth2 credentials must have permission to post to the selected channel.                                                                                                              | Slack node configuration.                                                                                         |
| The workflow includes robust error handling to log scrape failures for manual review in Airtable.                                                                                           | Error handling sticky note.                                                                                        |
| The fallback URL logic intelligently appends www. and https if missing, and constructs relative URLs based on AI suggestions.                                                             | Scrape home page and Construct secondary URL node explanation.                                                   |
| The AI models are prompted to either output JSON (for initial analysis) or plain text (for final summary) to simplify parsing and downstream processing.                                    | Message a model and Message a model1 node prompts.                                                                |
| Slack notifications exclude workflow links to keep messages clean and focused on lead details.                                                                                             | Slack node parameter "includeLinkToWorkflow" disabled.                                                           |
| Testing with real, valid websites is essential to ensure scraping and AI analysis perform correctly.                                                                                        | Usage instructions in Sticky Note.                                                                                |
| This workflow is inactive by default and requires activation before use.                                                                                                                    | Workflow metadata.                                                                                                |

---

**Disclaimer:**  
The text and nodes described come exclusively from an automated workflow built with n8n, fully respecting applicable content policies. No illegal or protected data is involved. All processed data is public or user-submitted.