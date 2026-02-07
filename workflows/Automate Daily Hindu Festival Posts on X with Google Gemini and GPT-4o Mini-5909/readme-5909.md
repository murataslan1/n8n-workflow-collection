Automate Daily Hindu Festival Posts on X with Google Gemini and GPT-4o Mini

https://n8nworkflows.xyz/workflows/automate-daily-hindu-festival-posts-on-x-with-google-gemini-and-gpt-4o-mini-5909


# Automate Daily Hindu Festival Posts on X with Google Gemini and GPT-4o Mini

### 1. Workflow Overview

This workflow automates the daily posting of Hindu festival updates on X (formerly Twitter) by integrating Google Gemini and GPT-4o Mini AI models. It serves two main purposes:

- **Data Enrichment and Management:** It fetches Hindu festival data for 2025 from an external API, processes and enriches this data with structured details (including Hindi translations), and stores it in a Google Sheet for persistent reference.
- **Daily Social Media Posting:** On a scheduled daily trigger, the workflow retrieves the festival matching the current date, generates multiple social media post options blending English and Hindi, selects the best post via AI evaluation, and publishes it directly on X.

The workflow is logically divided into two main blocks:

- **1.1 Data Acquisition and Structuring:** Fetches raw festival data, uses AI for structured parsing and enrichment, then writes the enriched dataset into Google Sheets.
- **1.2 Daily Post Generation and Publishing:** Triggered daily; it matches the date to a festival, generates several post drafts, selects the best one, and posts it on X.

Other supporting components include manual triggers for testing and multiple AI model nodes for content generation and evaluation.

---

### 2. Block-by-Block Analysis

#### 2.1 Data Acquisition and Structuring

**Overview:**  
This block fetches the raw list of Hindu festivals for 2025 from an external API, processes the raw Markdown data into structured festival records enriched with Hindi names and descriptions using AI, and appends the data into a Google Sheet.

**Nodes Involved:**  
- When clicking ‘Execute workflow’ (Manual Trigger)  
- Get Festival Data (HTTP Request)  
- Generate Structured Data (Langchain AI Chain LLM)  
- Transform to add all Data at once (Code)  
- Add all Rows at once (Google Sheets)  
- Schema for Data (Output Parser Structured)  

**Node Details:**

- **When clicking ‘Execute workflow’**  
  - *Type:* Manual Trigger  
  - *Role:* Enables on-demand manual execution for testing or one-off runs.  
  - *Connections:* Output → Get Festival Data  
  - *Edge Cases:* None. Manual initiation only.

- **Get Festival Data**  
  - *Type:* HTTP Request  
  - *Role:* Retrieves raw Hindu festival data (Markdown table) from an external API endpoint (`https://r.jina.ai/https://www.calendarlabs.com/2025-hindu-calendar`).  
  - *Authentication:* HTTP Bearer token (JinaAI Bearer credential).  
  - *Output:* Raw data in JSON, presumably with a 'data' field containing the Markdown table.  
  - *Edge Cases:* HTTP errors (401 Unauthorized, 404 Not Found, timeouts), malformed or unexpected data format.

- **Generate Structured Data**  
  - *Type:* Langchain Chain LLM  
  - *Role:* Parses the raw Markdown table, extracts festival names and dates, converts dates to DD/MM/YYYY, enriches with Hindi names and bilingual descriptions using AI.  
  - *Model:* Configured implicitly (likely Google Gemini or OpenAI as per credentials).  
  - *Prompt:* Detailed instructions for parsing, formatting, and enrichment.  
  - *Output:* Structured festival data including English and Hindi descriptions.  
  - *Edge Cases:* AI output parsing errors, incomplete or inconsistent data extraction, API quota limits.

- **Transform to add all Data at once**  
  - *Type:* Code (JavaScript)  
  - *Role:* Converts AI output array into an array of JSON objects suitable for batch insertion in Google Sheets.  
  - *Code Summary:* Maps each festival object from AI output to `{ json: festival }` format.  
  - *Edge Cases:* Empty or malformed AI output.

- **Add all Rows at once**  
  - *Type:* Google Sheets  
  - *Role:* Appends the transformed festival data rows to the Google Sheet 'Sheet1' (gid=0).  
  - *Mapping:* Maps fields - Date, Hindi Description, English Description, Name of Festival.  
  - *Credentials:* Google Sheets OAuth2 account.  
  - *Edge Cases:* API limits, permission errors, network issues, schema mismatch.

- **Schema for Data**  
  - *Type:* Langchain Output Parser Structured  
  - *Role:* Ensures the AI output confirms to a strict JSON schema defining expected properties and types for each festival object.  
  - *Schema:* Array of objects with required fields: Name of Festival, Date (DD/MM/YYYY), English Short Description, Hindi Translation.  
  - *Edge Cases:* Schema validation failures, causing workflow errors or retries.

---

#### 2.2 Daily Post Generation and Publishing

**Overview:**  
Scheduled daily at 8 AM, this block obtains the current date, retrieves the matching festival from Google Sheets, generates multiple social media post drafts blending English and Hindi, selects the best post via AI evaluation, and publishes it to an X account.

**Nodes Involved:**  
- Everyday Trigger (Schedule Trigger)  
- Get Today's Date (Code)  
- Fetch Data of Matched Date (Google Sheets)  
- Generate Posts (Langchain Chain LLM)  
- Select Best Post (Langchain Chain LLM)  
- Post to X (Twitter)  
- Generator Model (Langchain LM Chat Google Gemini)  
- Selector Model (Langchain LM Chat OpenAI)  
- Structured Posts (Langchain Output Parser Structured)  
- Structured Output Parser1 (Langchain Output Parser Structured)

**Node Details:**

- **Everyday Trigger**  
  - *Type:* Schedule Trigger  
  - *Role:* Automatically triggers the workflow once daily at 08:00 AM.  
  - *Output:* Starts the chain → Get Today's Date.  
  - *Edge Cases:* Missed triggers if workflow inactive or server downtime.

- **Get Today's Date**  
  - *Type:* Code (JavaScript)  
  - *Role:* Computes the current date formatted as DD/MM/YYYY for matching.  
  - *Output:* Single JSON object with `date` field.  
  - *Edge Cases:* System clock misconfiguration, timezone issues.

- **Fetch Data of Matched Date**  
  - *Type:* Google Sheets  
  - *Role:* Queries the Google Sheet for rows where the 'Date' column matches today’s date.  
  - *Filters:* Lookup on Date = current date.  
  - *Output:* Festival data row(s) matching the date.  
  - *Credentials:* Google Sheets OAuth2 account.  
  - *Edge Cases:* No matching row found, multiple rows for same date, Google API errors.

- **Generate Posts**  
  - *Type:* Langchain Chain LLM  
  - *Role:* Generates exactly 3 draft social media post options for X, blending English and relevant Hindi words, emojis, hashtags, and calls to action.  
  - *Prompt:* Detailed instructions emphasizing character limits (<=280), language blend, engagement, and formatting.  
  - *AI Model:* Uses Google Gemini via Generator Model node.  
  - *Output Parser:* StructuredPosts node for JSON parsing of results.  
  - *Edge Cases:* AI hallucination, incomplete generation, exceeding character limits.

- **Structured Posts**  
  - *Type:* Langchain Output Parser Structured  
  - *Role:* Parses AI-generated posts ensuring JSON array format with fields: text, hashtags, call_to_action.  
  - *Edge Cases:* Parsing errors, malformed AI output.

- **Select Best Post**  
  - *Type:* Langchain Chain LLM  
  - *Role:* Reviews the 3 post options and selects the single best post based on impact, clarity, language blend, hashtags, emojis, and call to action.  
  - *Prompt:* Explicit multi-criteria evaluation instructions.  
  - *AI Model:* Uses OpenAI GPT-4o Mini via Selector Model node.  
  - *Output Parser:* Structured Output Parser1 to parse chosen post.  
  - *Edge Cases:* Ambiguous choice, AI bias, parsing failures.

- **Structured Output Parser1**  
  - *Type:* Langchain Output Parser Structured  
  - *Role:* Parses the selected post output into structured JSON (text, hashtags, call_to_action).  
  - *Edge Cases:* Parsing errors.

- **Post to X**  
  - *Type:* Twitter (X) node  
  - *Role:* Publishes the selected post text along with hashtags and call to action to the connected X account.  
  - *Credentials:* OAuth2 for X account.  
  - *Edge Cases:* API limits, authentication errors, post rejection due to content or formatting, network failure.

- **Generator Model**  
  - *Type:* Langchain LM Chat Google Gemini  
  - *Role:* Provides AI language model backend for Generate Posts node.  
  - *Model:* Gemini 2.5 Flash.  
  - *Edge Cases:* API quota, latency.

- **Selector Model**  
  - *Type:* Langchain LM Chat OpenAI  
  - *Role:* Provides AI language model backend for Select Best Post node.  
  - *Model:* GPT-4o Mini.  
  - *Edge Cases:* API quota, latency.

---

### 3. Summary Table

| Node Name                   | Node Type                             | Functional Role                                  | Input Node(s)                  | Output Node(s)                | Sticky Note                                                                                                  |
|-----------------------------|-------------------------------------|-------------------------------------------------|-------------------------------|------------------------------|--------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                     | Manual start for data acquisition block          |                               | Get Festival Data             | 🟥 Execute workflow<br>Trigger node to manually run the workflow on demand for quick testing or use.          |
| Get Festival Data           | HTTP Request                        | Fetch raw Hindu festival data (Markdown table)  | When clicking ‘Execute workflow’ | Generate Structured Data      | 🟪 Get Festival Data<br>- Makes a GET request to fetch festival data from a remote API.<br>- [URL](https://r.jina.ai/https://www.calendarlabs.com/2025-hindu-calendar) |
| Generate Structured Data    | Langchain Chain LLM                 | Parse and enrich raw festival data using AI     | Get Festival Data             | Transform to add all Data at once | 🔗 Generate Structured Data<br>Uses an AI model (OpenAI or Gemini) to structure raw festival data.             |
| Transform to add all Data at once | Code (JavaScript)                  | Convert AI output to Google Sheets batch format | Generate Structured Data      | Add all Rows at once          | 🟧 Transform Data<br>JavaScript/Code node reshapes structured output into the format required for Google Sheets. |
| Add all Rows at once        | Google Sheets                      | Batch append structured festival data            | Transform to add all Data at once |                              | 🟩 Feel Google Sheet<br>Appends all transformed rows to a Google Sheet in one go.                             |
| Schema for Data             | Langchain Output Parser Structured | Validate AI structured data against schema       |                              | Generate Structured Data      |                                                                                                              |
| Everyday Trigger            | Schedule Trigger                   | Daily trigger at 8 AM to start posting block     |                               | Get Today's Date              | 🔁 Everyday Trigger<br>Schedules the workflow to run automatically once every day to generate and publish a new post based on the date. |
| Get Today's Date            | Code (JavaScript)                  | Get current date formatted as DD/MM/YYYY          | Everyday Trigger              | Fetch Data of Matched Date    | 📆 Get Today's Date<br>JavaScript code to fetch today's date.                                               |
| Fetch Data of Matched Date  | Google Sheets                     | Retrieve festival data matching today's date     | Get Today's Date             | Generate Posts               | 🟩 Match Date<br>Reads a Google Sheet and filters the row(s) matching today’s date.                           |
| Generate Posts             | Langchain Chain LLM                | Generate 3 draft social media posts for X         | Fetch Data of Matched Date    | Select Best Post             | 🧠 Generate Posts<br>Uses an AI model (e.g., Gemini or OpenAI) to generate multiple draft social media posts.  |
| Structured Posts            | Langchain Output Parser Structured | Parse generated posts JSON array                   | Generate Posts               |                              |                                                                                                              |
| Select Best Post            | Langchain Chain LLM                | Select the best post from generated options       | Generate Posts, Structured Posts | Post to X                   | 🧠 Select Best Post<br>Uses a second AI model to evaluate and select the best-performing or most relevant post. |
| Structured Output Parser1   | Langchain Output Parser Structured | Parse the selected post into structured JSON      | Select Best Post             | Post to X                   |                                                                                                              |
| Post to X                  | Twitter (X)                        | Publish selected post to X account                  | Select Best Post             |                              | 🐦 Post to X (Twitter)<br>Shares the chosen post directly to an X (formerly Twitter) account.                  |
| Generator Model             | Langchain LM Chat Google Gemini   | AI model for generating posts                      | Generate Posts               | Generate Posts               |                                                                                                              |
| Selector Model              | Langchain LM Chat OpenAI          | AI model for selecting best post                   | Select Best Post             | Select Best Post             |                                                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Purpose: For manual workflow execution to fetch and process festival data once.

2. **Create HTTP Request Node: Get Festival Data**  
   - URL: `https://r.jina.ai/https://www.calendarlabs.com/2025-hindu-calendar`  
   - Authentication: HTTP Bearer Token using credential "JinaAI Bearer"  
   - Connect output of Manual Trigger → HTTP Request.

3. **Create Langchain Chain LLM Node: Generate Structured Data**  
   - Model: Connected implicitly via Langchain configuration (Google Gemini or OpenAI)  
   - Prompt: Provide detailed instructions to parse Markdown table with festival names and dates, convert dates to DD/MM/YYYY, enrich with Hindi names and bilingual descriptions.  
   - Connect output of HTTP Request → Generate Structured Data.

4. **Create Langchain Output Parser Structured Node: Schema for Data**  
   - Define schema requiring: Name of Festival (string), Date (DD/MM/YYYY string), Short English description, Hindi translation.  
   - Connect output of Schema for Data → Generate Structured Data input parser.

5. **Create Code Node: Transform to add all Data at once**  
   - JavaScript: `return $json.output.map(festival => ({ json: festival }));`  
   - Connect output of Generate Structured Data → Code node.

6. **Create Google Sheets Node: Add all Rows at once**  
   - Operation: Append  
   - Sheet: Specify Google Sheet document and sheet (gid=0)  
   - Map columns: Date, Hindi Description, English Description, Name of Festival  
   - Credentials: Google Sheets OAuth2  
   - Connect output of Code node → Google Sheets append node.

7. **Create Schedule Trigger Node: Everyday Trigger**  
   - Set to trigger daily at 08:00 AM.

8. **Create Code Node: Get Today's Date**  
   - JavaScript:  
     ```js
     const today = new Date();
     const day = String(today.getDate()).padStart(2, '0');
     const month = String(today.getMonth() + 1).padStart(2, '0');
     const year = today.getFullYear();
     const formattedDate = `${day}/${month}/${year}`;
     return { date: formattedDate };
     ```  
   - Connect output of Schedule Trigger → Get Today's Date node.

9. **Create Google Sheets Node: Fetch Data of Matched Date**  
   - Operation: Read  
   - Filter: Date column equals `={{ $json.date }}`  
   - Credentials: Google Sheets OAuth2  
   - Connect output of Get Today's Date → Google Sheets node.

10. **Create Langchain Chain LLM Node: Generate Posts**  
    - Model: Google Gemini (via Langchain LM Chat Google Gemini node)  
    - Prompt: Generate 3 distinct social media posts for X blending English and Hindi, including hashtags, emojis, call to action, max 280 chars.  
    - Connect output of Google Sheets (matched festival data) → Generate Posts.

11. **Create Langchain Output Parser Structured Node: Structured Posts**  
    - Define example JSON array with fields: text, hashtags, call_to_action  
    - Connect output of Generate Posts → Structured Posts.

12. **Create Langchain Chain LLM Node: Select Best Post**  
    - Model: OpenAI GPT-4o Mini (via Langchain LM Chat OpenAI node)  
    - Prompt: Select best post among 3 options based on engagement, clarity, language blend, hashtags, emojis, call to action.  
    - Connect output of Generate Posts → Select Best Post.

13. **Create Langchain Output Parser Structured Node: Structured Output Parser1**  
    - Parse selected post JSON with fields: text, hashtags, call_to_action  
    - Connect output of Select Best Post → Structured Output Parser1.

14. **Create Twitter Node: Post to X**  
    - Text:  
      ```
      {{$json.output.text}}

      {{$json.output.call_to_action}}

      {{$json.output.hashtags}}
      ```  
    - Credentials: Twitter OAuth2 (X account)  
    - Connect output of Structured Output Parser1 → Post to X.

15. **Configure Credentials:**  
    - Google Sheets OAuth2 for Google Sheets nodes  
    - HTTP Bearer Token for API calls  
    - Google Gemini API Key for Gemini model nodes  
    - OpenAI API Key for GPT-4o Mini nodes  
    - Twitter OAuth2 for posting on X

---

### 5. General Notes & Resources

| Note Content                                                                                              | Context or Link                                                                                               |
|-----------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| The workflow uses a dual AI model approach: Google Gemini for content generation and OpenAI GPT-4o Mini for selection. | Ensures balanced generation and editorial quality.                                                            |
| Source API for Hindu calendar data: [https://r.jina.ai/https://www.calendarlabs.com/2025-hindu-calendar](https://r.jina.ai/https://www.calendarlabs.com/2025-hindu-calendar) | Raw data source for festival dates and names.                                                                  |
| Character limit enforcement in post generation (280 chars) matches X’s current limits.                     | Critical for valid and publishable social media posts.                                                        |
| Includes manual trigger node for testing workflow end-to-end without waiting for scheduled run.            | Helpful for debugging and development.                                                                         |
| Hindi words inclusion in posts enhances cultural relevance and audience engagement.                        | Important for targeted social media strategy.                                                                  |

---

**Disclaimer:**  
This document is based exclusively on an n8n automation workflow designed with publicly accessible APIs and AI models. All data used is legal and non-protected. No unauthorized or offensive content is included.