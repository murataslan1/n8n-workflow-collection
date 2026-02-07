Automate job matching with Gemini AI, Decodo scraping & resume analysis to Telegram

https://n8nworkflows.xyz/workflows/automate-job-matching-with-gemini-ai--decodo-scraping---resume-analysis-to-telegram-11774


# Automate job matching with Gemini AI, Decodo scraping & resume analysis to Telegram

Disclaimer: Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Purpose:**  
This workflow periodically downloads a resume PDF from Google Drive, extracts and summarizes it with **Google Gemini**, scrapes job listings from **SimplyHired** via **Decodo**, uses a **Gemini-powered AI agent** to extract structured job fields from raw HTML and compute an `isMatch` flag against the resume, then stores each job record in **Google Sheets** and sends a per-job notification via **Telegram**.

**Target use cases:**
- Automated job monitoring for a given search query/location (SimplyHired search URL)
- AI-assisted parsing of job cards into clean structured data
- Simple resume-to-job matching for alerting
- Lightweight “database” logging of job postings to Google Sheets

### Logical blocks
**1.1 Scheduled start & resume acquisition**  
Schedule → Download resume PDF → Extract PDF text → Normalize text field

**1.2 Resume summarization (Gemini)**  
Send extracted resume text into Gemini summarization chain to create a condensed representation used later for matching.

**1.3 Job scraping & HTML extraction (Decodo + HTML node)**  
Scrape SimplyHired search page with Decodo → Extract job card HTML containers.

**1.4 AI job extraction & matching (Gemini Agent + Structured Parser)**  
Gemini agent receives raw job-card HTML + resume text → outputs structured JSON per schema (including `isMatch`).

**1.5 Per-job processing, storage & notification**  
Split jobs array → Append row to Google Sheets → Send Telegram alert (one message per job), after storage.

---

## 2. Block-by-Block Analysis

### 2.1 Scheduled start & resume acquisition

**Overview:**  
Triggers on a schedule, downloads a specific resume PDF from Google Drive, extracts its text, and ensures it is stored in a predictable JSON field for downstream AI nodes.

**Nodes involved:**  
- Schedule Trigger  
- Download Resume (Google Drive)  
- Extract Resume (Extract From File)  
- Get Content (Set)

#### Node: Schedule Trigger
- **Type / role:** `n8n-nodes-base.scheduleTrigger` — entry point; runs workflow on a schedule.
- **Configuration choices:** Uses an “interval” rule, but the provided configuration has an empty object (`interval: [{}]`). In n8n UI, this typically means the schedule isn’t fully defined and must be set (e.g., every hour/day).
- **Connections:**  
  - **Output →** Download Resume
- **Edge cases / failures:**
  - Misconfigured schedule rule may prevent runs or cause unexpected frequency.
  - Timezone differences (instance vs. user expectation).

#### Node: Download Resume
- **Type / role:** `n8n-nodes-base.googleDrive` — downloads a resume file binary from Google Drive.
- **Configuration choices:**
  - **Operation:** Download
  - **File:** selected by File ID (`cv_rully_saputra.pdf`)
  - Requires Google Drive OAuth2 credentials.
- **Input / output:**
  - **Input:** trigger item
  - **Output:** binary data (PDF) on the item
- **Connections:**  
  - **Output →** Extract Resume
- **Credentials:** `googleDriveOAuth2Api`
- **Edge cases / failures:**
  - 401/403 if OAuth scopes/consent invalid or file not shared with credential owner.
  - 404 if file ID changed/removed.
  - Large PDFs can increase memory/time.

#### Node: Extract Resume
- **Type / role:** `n8n-nodes-base.extractFromFile` — extracts text from the downloaded PDF.
- **Configuration choices:**
  - **Operation:** `pdf` (PDF text extraction)
- **Input / output:**
  - **Input:** binary PDF from Google Drive node
  - **Output:** extracted text in `$json.text` (typical behavior for this node)
- **Connections:**  
  - **Output →** Get Content
- **Edge cases / failures:**
  - Scanned/image-only PDFs may yield empty/poor text (no OCR here).
  - Corrupted PDFs cause extraction failure.

#### Node: Get Content
- **Type / role:** `n8n-nodes-base.set` — normalizes extracted resume content into a known field.
- **Configuration choices:**
  - Sets `text` to `{{ $json.text }}`
  - Ensures downstream nodes can reliably reference `$('Get Content').item.json.text`
- **Connections:**  
  - **Output →** Resume Summarizer
- **Edge cases / failures:**
  - If extraction returns no `text`, the field becomes empty; later matching quality degrades.
  - Expression errors if upstream structure differs.

**Sticky note context (applies to this block):**  
“Resume Processing & Summarization: Downloads resume PDFs from Google Drive, extracts full text content, and uses AI to generate a concise, structured summary…”

---

### 2.2 Resume summarization (Gemini)

**Overview:**  
Summarizes the extracted resume content using a Gemini chat model via the LangChain summarization chain. This summarized content is then used later in the job extraction agent prompt for `isMatch`.

**Nodes involved:**  
- Resume Summarizer (Chain)  
- Google Gemini Chat Model1 (Language Model)

#### Node: Google Gemini Chat Model1
- **Type / role:** `@n8n/n8n-nodes-langchain.lmChatGoogleGemini` — provides Gemini chat model to LangChain nodes.
- **Configuration choices:** Default options (none specified).
- **Connections:**
  - Connected via **AI languageModel** output to Resume Summarizer.
- **Credentials:** `googlePalmApi` (Gemini/PaLM credential in n8n naming)
- **Edge cases / failures:**
  - Auth errors if API key invalid/revoked.
  - Model availability/quotas/rate limits.
  - Safety filters could affect output depending on content.

#### Node: Resume Summarizer
- **Type / role:** `@n8n/n8n-nodes-langchain.chainSummarization` — produces a summary of long text using the provided LLM.
- **Configuration choices:**
  - `chunkSize: 100000`, `chunkOverlap: 2000` (very large chunk size; typically reduces chunking but may hit token limits depending on model/input)
- **Input / output:**
  - **Input:** `$json.text` from Get Content
  - **Output:** summarized text (exact output field depends on node; commonly `text`/`summary`)
- **Connections:**  
  - **Output →** Decodo (starts scraping only after resume summary finishes)
- **Edge cases / failures:**
  - Token limit errors if resume text is large and chunking still exceeds model constraints.
  - Summarization output not actually used downstream except indirectly: the Job Application Extractor references `$('Get Content').item.json.text` (raw extracted resume text), not the summary. If the intent was to use the summary, the prompt should reference Resume Summarizer output instead.

---

### 2.3 Job scraping & HTML extraction (Decodo + HTML)

**Overview:**  
Scrapes a SimplyHired search results page via Decodo and extracts the HTML blocks representing job cards using a CSS selector.

**Nodes involved:**  
- Decodo  
- Extract HTML

#### Node: Decodo
- **Type / role:** `@decodo/n8n-nodes-decodo.decodo` — fetches/scrapes web content via Decodo service.
- **Configuration choices:**
  - URL: `https://www.simplyhired.com/search?q=software+engineer&l=Remote`
- **Input / output:**
  - **Input:** from Resume Summarizer
  - **Output:** results array; Extract HTML reads `results[0].content`
- **Connections:**  
  - **Output →** Extract HTML
- **Credentials:** `decodoApi`
- **Edge cases / failures:**
  - Scrape blocked, CAPTCHA, or content changes.
  - Rate limits or Decodo quota exhaustion.
  - If Decodo returns empty `results` or different structure, downstream extraction fails.

**Sticky note (Decodo):**
- Use SimplyHired search URL only; avoid scraping company/review pages; avoid parallel requests.

#### Node: Extract HTML
- **Type / role:** `n8n-nodes-base.html` — extracts sections from an HTML document using CSS selectors.
- **Configuration choices:**
  - **Operation:** Extract HTML Content
  - **Source property:** `results[0].content`
  - **Extraction values:** key `job`, selector `.css-13ia03s`
  - Produces a field named `job` containing the extracted HTML snippets (job card containers).
- **Connections:**  
  - **Output →** Job Application Extractor
- **Edge cases / failures:**
  - Selector `.css-13ia03s` is likely brittle (CSS modules / A-B tests). If SimplyHired changes markup, extraction returns empty.
  - If `results[0].content` is missing, node errors.
  - Extracted data may be an array of matches; the agent expects “raw HTML (job)”, so confirm whether it’s a string vs. array in your n8n version.

**Sticky note (Extract HTML):**
- Extract only job card containers; use stable selector `.css-13ia03s` (adjust as needed); output field must be named `job`.

---

### 2.4 AI job extraction & matching (Gemini Agent + Structured Parser)

**Overview:**  
A LangChain AI agent uses Gemini to parse the raw job-card HTML into a structured JSON schema and computes `isMatch` by comparing resume content with the job’s title/requirements. The structured output parser enforces the schema.

**Nodes involved:**  
- Job Application Extractor (Agent)  
- Google Gemini Chat Model (Language Model)  
- Structured Output Parser

#### Node: Google Gemini Chat Model
- **Type / role:** `@n8n/n8n-nodes-langchain.lmChatGoogleGemini` — LLM provider for the job extraction agent.
- **Configuration choices:** Default options.
- **Connections:**  
  - **AI languageModel →** Job Application Extractor
- **Credentials:** `googlePalmApi`
- **Edge cases / failures:**
  - Same as other Gemini model node: quota/rate limits, auth failures.

#### Node: Structured Output Parser
- **Type / role:** `@n8n/n8n-nodes-langchain.outputParserStructured` — enforces a structured JSON output schema from the agent.
- **Configuration choices:**
  - Provides a **JSON schema example** expecting:
    ```json
    {
      "jobs": [
        {
          "company_name": "...",
          "location": "...",
          "salary_range": "...",
          "type": "...",
          "title": "...",
          "benefits": "...",
          "isQuickApply": true,
          "requirements": "...",
          "url": "...",
          "isMatch": true
        }
      ]
    }
    ```
- **Connections:**  
  - **AI outputParser →** Job Application Extractor
- **Edge cases / failures:**
  - If the model outputs invalid JSON or deviates from keys/types, parsing fails.
  - The schema is an “example” not a strict JSON Schema; enforcement depends on node behavior/version.

#### Node: Job Application Extractor
- **Type / role:** `@n8n/n8n-nodes-langchain.agent` — agent that extracts structured fields from HTML using the LLM and output parser.
- **Configuration choices:**
  - **Prompt type:** define
  - **Text input:** `{{ $json.job }}`
  - **System message (key logic):**
    - “act as an expert data extractor”
    - Extract from HTML and follow parser format
    - Compute `isMatch` by comparing resume with title+requirements
    - Benefits fallback to `'N/A'`
    - Injects resume content: `{{ $('Get Content').item.json.text }}`
  - `hasOutputParser: true`
- **Input / output:**
  - **Input:** extracted job HTML container(s)
  - **Output:** a JSON object with `output.jobs` (as implied by downstream Split Out using `output.jobs`)
- **Connections:**  
  - **Output →** Split Out
- **Edge cases / failures:**
  - If `$json.job` is empty or not raw HTML, extraction quality fails.
  - Prompt refers to “html file” but actually receives HTML string(s); keep consistent.
  - Resume reference uses **Get Content** raw text; if you intended the summary, change expression to Resume Summarizer output.
  - `isMatch` is subjective; without explicit rubric/threshold, model may be inconsistent.

**Sticky note (AI Agent):**
- Input must be raw HTML (job); output must follow structured parser schema; one job card → one structured job; add resume to generate `isMatch`.

---

### 2.5 Per-job processing, storage & notification

**Overview:**  
Splits the extracted jobs array into one item per job, appends each to Google Sheets with mapped columns, then notifies via Telegram after the database insert.

**Nodes involved:**  
- Split Out  
- Store to Database (Google Sheets)  
- Notify User (Telegram)

#### Node: Split Out
- **Type / role:** `n8n-nodes-base.splitOut` — converts an array into individual items.
- **Configuration choices:**
  - Field to split: `output.jobs`
- **Connections:**  
  - **Output →** Store to Database
- **Edge cases / failures:**
  - If `output.jobs` is missing or not an array, node errors or yields no items.

#### Node: Store to Database
- **Type / role:** `n8n-nodes-base.googleSheets` — appends a row per job to Google Sheets (used as a database).
- **Configuration choices:**
  - **Operation:** Append
  - **Spreadsheet:** document URL points to a specific spreadsheet
  - **Sheet name:** `job listings`
  - **Column mapping (notable expressions):**
    - `url`: `https://www.simplyhired.com{{ $json.url }}`
    - `date extracted`: `{{ DateTime.now().format('yyyy-MM-dd') }}`
    - Maps `company_name → company name`, `salary_range → salary range`, `isQuickApply → quick apply?`, etc.
  - `attemptToConvertTypes: false` (values stored as provided)
- **Input / output:**
  - **Input:** one job item per execution item
  - **Output:** Google Sheets append result (plus prior fields depending on n8n behavior)
- **Connections:**  
  - **Output →** Notify User
- **Credentials:** `googleSheetsOAuth2Api`
- **Edge cases / failures:**
  - Permission issues on spreadsheet, wrong sheet ID, or renamed sheet.
  - Schema mismatch if sheet columns differ.
  - Duplicate entries: no deduplication logic (same job may be appended repeatedly on each schedule run).

#### Node: Notify User
- **Type / role:** `n8n-nodes-base.telegram` — sends a formatted Telegram message per job.
- **Configuration choices:**
  - Message text includes multiple fields and a SimplyHired URL prefix.
  - Uses fields like `{{ $json['company name'] }}` and `{{ $json['salary range'] }}` (note: these names match the *Google Sheets column names*, not the agent output keys).
- **Connections:** none (end node)
- **Credentials:** `telegramApi`
- **Edge cases / failures:**
  - If the Telegram node runs after Google Sheets, the `$json` may contain Google Sheets output rather than the original mapped fields depending on node output configuration. In many cases, the Google Sheets node returns appended row data, but field names may not match exactly.
  - Bot not started by user, wrong chat ID, or insufficient permissions.
  - Message formatting issues if values are null/undefined.

**Sticky note (Telegram):**
- Trigger only after DB insert; concat domain for relative paths; one message per job; keep format consistent.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Schedule Trigger | scheduleTrigger | Time-based workflow entry point | — | Download Resume |  |
| Download Resume | googleDrive | Download resume PDF from Drive | Schedule Trigger | Extract Resume | ### Resume Processing & Summarization: Downloads resume PDFs from Google Drive, extracts full text content, and uses AI to generate a concise, structured summary highlighting key skills, experience, and relevant insights. Ensures files are accessible and optimized for accurate AI analysis. |
| Extract Resume | extractFromFile | Extract text from PDF | Download Resume | Get Content | ### Resume Processing & Summarization: Downloads resume PDFs from Google Drive, extracts full text content, and uses AI to generate a concise, structured summary highlighting key skills, experience, and relevant insights. Ensures files are accessible and optimized for accurate AI analysis. |
| Get Content | set | Normalize resume text into `text` field | Extract Resume | Resume Summarizer | ### Resume Processing & Summarization: Downloads resume PDFs from Google Drive, extracts full text content, and uses AI to generate a concise, structured summary highlighting key skills, experience, and relevant insights. Ensures files are accessible and optimized for accurate AI analysis. |
| Resume Summarizer | chainSummarization | Summarize resume using Gemini | Get Content | Decodo | ### Resume Processing & Summarization: Downloads resume PDFs from Google Drive, extracts full text content, and uses AI to generate a concise, structured summary highlighting key skills, experience, and relevant insights. Ensures files are accessible and optimized for accurate AI analysis. |
| Google Gemini Chat Model1 | lmChatGoogleGemini | LLM provider for resume summarizer | — (AI connection) | Resume Summarizer (AI) | ### Resume Processing & Summarization: Downloads resume PDFs from Google Drive, extracts full text content, and uses AI to generate a concise, structured summary highlighting key skills, experience, and relevant insights. Ensures files are accessible and optimized for accurate AI analysis. |
| Decodo | decodo | Scrape SimplyHired search results | Resume Summarizer | Extract HTML | ### Decodo: Use SimplyHired search URL only (you can replace by your own preference); Do not scrape company or review pages; Avoid parallel requests |
| Extract HTML | html | Extract job-card HTML containers from page | Decodo | Job Application Extractor | ### Extract HTML: Extract only job card containers; Use stable selector: .css-13ia03s (you must adjusting the selector according to your preferred page); Output field must be named job |
| Job Application Extractor | langchain.agent | Parse job HTML + compute `isMatch` via Gemini | Extract HTML | Split Out | ### AI Agent: Input must be raw HTML (job); Role: expert data extractor; Output must follow structured parser schema; One job card → one structured job; Add resume for generate `isMatch` value |
| Google Gemini Chat Model | lmChatGoogleGemini | LLM provider for job extraction agent | — (AI connection) | Job Application Extractor (AI) | ### AI Agent: Input must be raw HTML (job); Role: expert data extractor; Output must follow structured parser schema; One job card → one structured job; Add resume for generate `isMatch` value |
| Structured Output Parser | outputParserStructured | Enforce structured JSON output schema | — (AI connection) | Job Application Extractor (AI) | ### AI Agent: Input must be raw HTML (job); Role: expert data extractor; Output must follow structured parser schema; One job card → one structured job; Add resume for generate `isMatch` value |
| Split Out | splitOut | Split `output.jobs` array into items | Job Application Extractor | Store to Database |  |
| Store to Database | googleSheets | Append each job to Google Sheets | Split Out | Notify User |  |
| Notify User | telegram | Send Telegram alert per job | Store to Database | — | ### Telegram Notifier: Trigger only after DB insert; Concat the url with the domain if you only have relative path; One message per job; Keep message format consistent |
| Sticky Note | stickyNote | Comment | — | — | ### Decodo: Use SimplyHired search URL only (you can replace by your own preference); Do not scrape company or review pages; Avoid parallel requests |
| Sticky Note1 | stickyNote | Comment | — | — | ### Extract HTML: Extract only job card containers; Use stable selector: .css-13ia03s (you must adjusting the selector according to your preferred page); Output field must be named job |
| Sticky Note2 | stickyNote | Comment | — | — | ### AI Agent: Input must be raw HTML (job); Role: expert data extractor; Output must follow structured parser schema; One job card → one structured job; Add resume for generate `isMatch` value |
| Sticky Note3 | stickyNote | Comment | — | — | ### Telegram Notifier: Trigger only after DB insert; Concat the url with the domain if you only have relative path; One message per job; Keep message format consistent |
| Sticky Note4 | stickyNote | Comment | — | — | ## AI Job Matcher with Decodo, Gemini AI & Resume Analysis in n8n: How it works (1–9) + Setup steps (1–7) |
| Sticky Note5 | stickyNote | Comment | — | — | ### Resume Processing & Summarization: Downloads resume PDFs from Google Drive, extracts full text content, and uses AI to generate a concise, structured summary highlighting key skills, experience, and relevant insights. Ensures files are accessible and optimized for accurate AI analysis. |

---

## 4. Reproducing the Workflow from Scratch

1) **Create “Schedule Trigger” (Schedule Trigger node)**
- Set an actual schedule (e.g., every day at 09:00 or every 6 hours).  
- This is the workflow entry node.

2) **Add “Download Resume” (Google Drive node)**
- Operation: **Download**
- Select the resume **File ID** (or paste it).
- Configure **Google Drive OAuth2** credentials with access to that file.
- Connect: **Schedule Trigger → Download Resume**

3) **Add “Extract Resume” (Extract From File node)**
- Operation: **PDF**
- Connect: **Download Resume → Extract Resume**

4) **Add “Get Content” (Set node)**
- Add a field:
  - Name: `text`
  - Value (expression): `{{ $json.text }}`
- Connect: **Extract Resume → Get Content**

5) **Add “Google Gemini Chat Model1” (Google Gemini Chat Model)**
- Configure **Google Gemini/PaLM API** credential.
- Leave options default (or select model if your n8n version exposes it).

6) **Add “Resume Summarizer” (Summarization Chain node)**
- Chunk size: `100000`
- Chunk overlap: `2000`
- Attach LLM: connect **Google Gemini Chat Model1** to Resume Summarizer via the **AI Language Model** connector.
- Connect main flow: **Get Content → Resume Summarizer**

7) **Add “Decodo” (Decodo node)**
- Set URL to a SimplyHired search results URL, e.g.:  
  `https://www.simplyhired.com/search?q=software+engineer&l=Remote`
- Configure **Decodo API** credentials.
- Connect: **Resume Summarizer → Decodo**

8) **Add “Extract HTML” (HTML node)**
- Operation: **Extract HTML Content**
- Source property: `results[0].content`
- Add extraction value:
  - Key: `job`
  - CSS selector: `.css-13ia03s` (adjust after inspecting page HTML)
- Connect: **Decodo → Extract HTML**

9) **Add “Google Gemini Chat Model” (second Gemini model node)**
- Configure same Gemini credential (or another).
- Will be used by the job extraction agent.

10) **Add “Structured Output Parser” (Structured Output Parser node)**
- Define the expected JSON example with top-level `jobs` array and fields:
  - `company_name`, `location`, `salary_range`, `type`, `title`, `benefits`, `isQuickApply`, `requirements`, `url`, `isMatch`

11) **Add “Job Application Extractor” (LangChain Agent node)**
- Prompt type: **Define**
- Text input expression: `{{ $json.job }}`
- System message should include:
  - role = expert data extractor
  - extract fields from HTML and follow the structured parser format
  - compute `isMatch` by comparing resume with job title/requirements
  - benefits fallback to `N/A`
  - include resume text variable, e.g. `{{ $('Get Content').item.json.text }}`
- Enable output parser (`hasOutputParser`)
- Connect AI:
  - **Google Gemini Chat Model → (AI Language Model) → Job Application Extractor**
  - **Structured Output Parser → (AI Output Parser) → Job Application Extractor**
- Connect main flow: **Extract HTML → Job Application Extractor**

12) **Add “Split Out” (Split Out node)**
- Field to split: `output.jobs`
- Connect: **Job Application Extractor → Split Out**

13) **Add “Store to Database” (Google Sheets node)**
- Operation: **Append**
- Set Spreadsheet (Document) and Sheet (tab) to store rows.
- Map columns using expressions, for example:
  - `company name` = `{{ $json.company_name }}`
  - `salary range` = `{{ $json.salary_range }}`
  - `quick apply?` = `{{ $json.isQuickApply }}`
  - `url` = `https://www.simplyhired.com{{ $json.url }}`
  - `date extracted` = `{{ DateTime.now().format('yyyy-MM-dd') }}`
- Configure **Google Sheets OAuth2** credential with edit access.
- Connect: **Split Out → Store to Database**

14) **Add “Notify User” (Telegram node)**
- Operation: **Send Message**
- Configure Telegram bot credential and set Chat ID in the node (in UI).
- Message text: use a consistent template and include job fields and final URL.
- Connect: **Store to Database → Notify User** (ensures notification only after storage)

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| “AI Job Matcher with Decodo, Gemini AI & Resume Analysis in n8n” with “How it works” steps (1–9) and “Setup steps” (1–7). | Sticky Note block describing overall flow and setup items (Decodo creds, SimplyHired URL, Gemini key, Google Drive, Sheets DB, Telegram bot/chat, selector/prompt adjustments). |
| Selector stability warning: `.css-13ia03s` may change; inspect the page and update selector. | From Extract HTML sticky note; practical maintenance requirement. |
| Potential logic mismatch: job matching uses `$('Get Content').item.json.text` (raw resume) even though resume summarization is computed. | Consider referencing the summarizer output if that was the intent. |
| No deduplication: repeated runs can append the same jobs again. | Consider adding a “lookup by URL” step in Sheets or a database uniqueness constraint. |