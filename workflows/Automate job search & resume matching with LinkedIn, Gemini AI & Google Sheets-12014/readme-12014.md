Automate job search & resume matching with LinkedIn, Gemini AI & Google Sheets

https://n8nworkflows.xyz/workflows/automate-job-search---resume-matching-with-linkedin--gemini-ai---google-sheets-12014


# Automate job search & resume matching with LinkedIn, Gemini AI & Google Sheets

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Title:** Automate job search & resume matching with LinkedIn, Gemini AI & Google Sheets  
**Workflow name (in JSON):** 5 Smart Job Screener with AI Resume Matching

This workflow automates daily job discovery on LinkedIn, evaluates each job against your resume using Gemini-powered AI agents, generates a tailored cover letter plus resume improvement suggestions, saves everything to Google Sheets, and finally emails you a completion notification.

### Logical blocks
1.1 **Trigger & Global Configuration**: scheduled execution + global preferences (remote, easy apply, per-search job limit).  
1.2 **Resume Intake & Text Extraction**: download resume PDF from Google Drive and extract text.  
1.3 **AI Search Filter Generation**: Gemini agent reads resume and proposes 3–5 LinkedIn search filters; workflow normalizes/enriches them and writes them to a “Filter” sheet.  
1.4 **LinkedIn Job Fetching & Link Parsing**: build LinkedIn search URL, fetch HTML, extract job links, and limit number of jobs.  
1.5 **Per-Job Detail Extraction**: iterate job links, fetch each job page, extract title/company/location/description/job id, and normalize fields.  
1.6 **AI Matching, Scoring, and Output Preparation**: Gemini agent produces strict JSON (score, gaps, cover letter); workflow parses/sanitizes JSON.  
1.7 **Resume Improvement Suggestions + Persist Results**: Gemini agent emits crisp edit suggestions; append/update rows in “Result” sheet keyed by job link.  
1.8 **Notification**: send Gmail message with the Google Sheet link when processing completes.

---

## 2. Block-by-Block Analysis

### 2.1 Trigger & Global Configuration

**Overview:** Runs the workflow daily on a schedule and defines global preferences that override AI-generated search parameters and limit jobs per search.

**Nodes involved:**  
- Schedule Trigger  
- Config

#### Node: Schedule Trigger
- **Type / role:** `n8n-nodes-base.scheduleTrigger` — entry point, time-based automation.
- **Configuration:** Triggers at **05:00** (server time) using an interval rule with `triggerAtHour: 5`.
- **Connections:** Outputs to **Config**.
- **Failure/edge cases:**  
  - Timezone is n8n instance timezone; if you expect local time, adjust instance settings or node schedule.

#### Node: Config
- **Type / role:** `n8n-nodes-base.set` — provides constants used later.
- **Configuration choices (interpreted):**
  - `maxJobsPerSearch`: `"2"` (stored as string; later code treats as numeric-ish)
  - `preferredRemote`: `"Remote"`
  - `preferredEasyApply`: `"No"`
- **Key variables used downstream:** `Config.json.maxJobsPerSearch`, `Config.json.preferredRemote`, `Config.json.preferredEasyApply`
- **Connections:** Outputs to **Download file**.
- **Failure/edge cases:**  
  - `maxJobsPerSearch` is a string; later code slices arrays and will work, but safer to store as number to avoid accidental coercion issues.

---

### 2.2 Resume Intake & Text Extraction

**Overview:** Downloads a resume PDF from Google Drive and extracts its text so agents can analyze it.

**Nodes involved:**  
- Download file  
- Extract from File

#### Node: Download file
- **Type / role:** `n8n-nodes-base.googleDrive` — downloads a file binary from Drive.
- **Configuration:**
  - Operation: **download**
  - `fileId`: selected from Drive (`1W-6jGxQJ2-f-hqfYP5pwAmJRou0fTXWS`)
- **Credentials:** Google Drive OAuth2.
- **Connections:** Outputs to **Extract from File**.
- **Failure/edge cases:**  
  - Auth/permission errors if the file isn’t accessible to the connected Google account.  
  - File ID must be updated if you replace the resume.

#### Node: Extract from File
- **Type / role:** `n8n-nodes-base.extractFromFile` — converts binary PDF to text.
- **Configuration:** Operation: **pdf** (PDF text extraction).
- **Connections:** Outputs to **Resume Analyzer Agent**.
- **Failure/edge cases:**  
  - Scanned/image-only PDFs may extract poorly (empty/garbled text); consider OCR pre-step if needed.

---

### 2.3 AI Search Filter Generation (from resume) + Persist Filters

**Overview:** Gemini reads the resume text and proposes multiple LinkedIn search filter objects; workflow enforces preferences and writes them into Google Sheets (“Filter” tab).

**Nodes involved:**  
- Gemini Model  
- Resume Analyzer Agent  
- Build Search Rows  
- Append row in sheet

#### Node: Gemini Model
- **Type / role:** `@n8n/n8n-nodes-langchain.lmChatGoogleGemini` — LangChain chat model provider for the agent.
- **Configuration:** default options.
- **Credentials:** Google PaLM / Gemini (`googlePalmApi`).
- **Connections:** Provides **ai_languageModel** connection to **Resume Analyzer Agent**.
- **Failure/edge cases:**  
  - Model quota/rate limits; credential misconfiguration.

#### Node: Resume Analyzer Agent
- **Type / role:** `@n8n/n8n-nodes-langchain.agent` — generates LinkedIn job searches from resume.
- **Configuration choices:**
  - Prompt requires JSON-only output:
    - `{"searches":[{"keyword":"...","location":"...","experience_level":"Internship|Entry level|New Grad"}]}`
  - Rules claim remote/easy_apply values too, but the JSON schema in prompt only shows `keyword/location/experience_level`. (Downstream code *can* consume `remote` and `easy_apply` if the model includes them.)
  - Resume text injected via: `{{ $node["Extract from File"].data.text }}`
- **Connections:**
  - Main output to **Build Search Rows**
  - AI language model comes from **Gemini Model**
- **Failure/edge cases:**
  - If the agent returns non-JSON or fenced JSON with extra text, downstream parsing may fail (Build Search Rows throws).
  - If resume text is empty, results may be generic or malformed.

#### Node: Build Search Rows
- **Type / role:** `n8n-nodes-base.code` — parses agent JSON and applies config preferences.
- **Configuration choices (interpreted):**
  - Reads global overrides:
    - `preferredRemote`, `preferredEasyApply`, `maxJobsPerSearch` from **Config**
  - Validates presence of `items[0].json.output`; otherwise throws error.
  - Strips ```json fences and parses JSON.
  - Produces rows with fields:
    - `Keyword`, `Location`, `Experience Level`, `Remote`, `Easy Apply`, `maxJobsPerSearch`
  - Overrides:
    - `Remote` := config preferredRemote if set, else `s.remote`
    - `Easy Apply` := config preferredEasyApply if set, else `s.easy_apply`
- **Connections:** Outputs to **Append row in sheet**.
- **Failure/edge cases:**
  - Hard failure if JSON parse fails or `output` missing.
  - If model doesn’t include `remote/easy_apply`, config overrides still populate them (good).

#### Node: Append row in sheet
- **Type / role:** `n8n-nodes-base.googleSheets` — persists generated filters.
- **Configuration:**
  - Operation: **append**
  - Document: “Job Search N8N” (ID `1YwGBu2A9APwEh_b9Yt_Y8WiSOLp0g7BF46qD1lehYx0`)
  - Sheet: “Filter” (gid=0)
  - Columns written: Keyword, Location, Experience Level, Remote, Easy Apply
- **Credentials:** Google Sheets OAuth2.
- **Connections:** Outputs to **LinkedIn Search URL**.
- **Failure/edge cases:**
  - Sheet schema mismatch (renamed columns/tabs) breaks mapping.
  - Missing permissions to the spreadsheet.

---

### 2.4 LinkedIn Job Fetching & Link Parsing

**Overview:** Builds a LinkedIn Jobs search URL for each filter row, downloads the HTML, extracts job links, then limits how many jobs to process.

**Nodes involved:**  
- LinkedIn Search URL  
- Fetch jobs from LinkedIn  
- HTML  
- Limit Jobs  
- Split Out

#### Node: LinkedIn Search URL
- **Type / role:** `n8n-nodes-base.code` — constructs LinkedIn job search URL.
- **Configuration choices:**
  - Base URL: `https://www.linkedin.com/jobs/search/?f_TPR=r86400` (last 24h)
  - Adds query params when fields are non-empty:
    - `keywords=...`
    - `location=...`
    - Experience mapping to LinkedIn `f_E`:
      - Internship → 1, Entry level → 2, New Grad → 3
    - Always appends `&f_EA=true` (Easy Apply forced ON regardless of Config/row)
    - Remote mapping to `f_WT`:
      - On-Site → 1, Remote → 2, Hybrid → 3
  - Returns `{ url }`
- **Connections:** Outputs to **Fetch jobs from LinkedIn**.
- **Failure/edge cases:**
  - **Important logic mismatch:** Config has `preferredEasyApply = "No"` but this node always enforces `f_EA=true`. If you truly want “No”, remove or conditionalize that line.
  - LinkedIn may require auth/cookies and may serve different HTML to unauthenticated requests.

#### Node: Fetch jobs from LinkedIn
- **Type / role:** `n8n-nodes-base.httpRequest` — fetches LinkedIn search results page.
- **Configuration:**
  - URL: `={{ $json.url }}`
  - Default options (no custom headers/user-agent shown).
- **Connections:** Outputs to **HTML**.
- **Failure/edge cases:**
  - 999/403 responses or CAPTCHA due to scraping protection.
  - HTML content can vary; selectors might stop matching.

#### Node: HTML
- **Type / role:** `n8n-nodes-base.html` — extracts job link hrefs from search results HTML.
- **Configuration:**
  - Operation: extractHtmlContent
  - Extract key `jobs` from selector:  
    `ul.jobs-search__results-list li div a[class*="base-card"]` attribute `href`, returned as array.
- **Connections:** Outputs to **Limit Jobs**.
- **Failure/edge cases:**
  - Selector changes or requires logged-in HTML; extraction returns empty array.

#### Node: Limit Jobs
- **Type / role:** `n8n-nodes-base.code` — limits number of jobs processed per search.
- **Configuration:** `items.slice(0, limit)` where `limit = Config.json.maxJobsPerSearch || 10`.
- **Connections:** Outputs to **Split Out**.
- **Failure/edge cases:**
  - If `maxJobsPerSearch` is a string, slice still works via coercion, but best as number.

#### Node: Split Out
- **Type / role:** `n8n-nodes-base.splitOut` — transforms `jobs: [..]` into individual items.
- **Configuration:** Field to split: `jobs`
- **Connections:** Outputs to **Loop Over Items**.
- **Failure/edge cases:**
  - If `jobs` is missing or empty, loop won’t run and you’ll immediately hit completion path (email).

---

### 2.5 Per-Job Iteration + Detail Extraction

**Overview:** Iterates over each job link, waits briefly (throttling), fetches the job page, extracts fields, and normalizes them.

**Nodes involved:**  
- Loop Over Items  
- Wait  
- Parse Job Links  
- Extract HTML Job Details  
- Set Job Details

#### Node: Loop Over Items
- **Type / role:** `n8n-nodes-base.splitInBatches` — batching loop controller.
- **Configuration:** default options (batch size default in node UI; not explicitly set here).
- **Connections:**
  - Output 0 → **Send a message** (this is the “done” path once batches complete in n8n’s batching semantics)
  - Output 1 → **Wait** (continues loop)
  - Also receives input back from **Update Rows with Job Detials** to continue batching.
- **Failure/edge cases:**
  - If batching is miswired, you can send the email too early or not at all. Here it’s wired in the typical pattern: after each item processed → update → back to loop.

#### Node: Wait
- **Type / role:** `n8n-nodes-base.wait` — throttles requests.
- **Configuration:** `amount: 2` (seconds by default for this node type/version).
- **Connections:** Outputs to **Parse Job Links**.
- **Failure/edge cases:**
  - For heavy scraping protection, 2 seconds may be insufficient; consider randomized longer waits.

#### Node: Parse Job Links
- **Type / role:** `n8n-nodes-base.httpRequest` — downloads individual job page HTML.
- **Configuration:** URL `={{ $json.jobs }}` (from Split Out item).
- **Connections:** Outputs to **Extract HTML Job Details**.
- **Failure/edge cases:**
  - Same LinkedIn anti-bot risks as earlier; may need headers, cookies, proxy, or official APIs.

#### Node: Extract HTML Job Details
- **Type / role:** `n8n-nodes-base.html` — scrapes job title, company, location, description, and job id token.
- **Configuration (selectors):**
  - Title: `div h1`
  - Company: `div span a`
  - Location: `div span[class*='topcard__flavor topcard__flavor--bullet']`
  - Description: `div.description__text.description__text--rich`
  - Job ID: selector `a[data-item-type='semaphore']` attribute `data-semaphore-content-urn`
- **Connections:** Outputs to **Set Job Details**.
- **Failure/edge cases:**
  - Selectors are brittle; LinkedIn DOM changes can break extraction.
  - Description extraction can include large/HTML text; downstream agents must handle length.

#### Node: Set Job Details
- **Type / role:** `n8n-nodes-base.set` — normalizes extracted fields for downstream AI and sheet storage.
- **Configuration (key expressions):**
  - `Description`: `={{ $json.Description.replaceAll(/\s+/g, " ")}}` (collapse whitespace)
  - `Job ID`: `={{ $json['Job ID'].split(":").last() }}`
  - `Apply Link`: `={{ "https://www.linkedin.com/jobs/view/" + $json['Job ID'].split(":").last() }}`
  - Pass-through: Title, Company, Location
- **Connections:** Outputs to **Job Matching Agent**.
- **Failure/edge cases:**
  - If `Job ID` is missing/undefined, `.split(":")` will throw. Consider guarding with conditional expressions.

---

### 2.6 AI Matching, Scoring, Cover Letter + JSON Sanitization

**Overview:** Gemini agent compares job description vs resume and returns strict JSON (score, explanations, gaps, cover letter). A Set node then robustly extracts/parses the JSON object.

**Nodes involved:**  
- Google Gemini Chat Model  
- Job Matching Agent  
- Prepare Values for GSheet

#### Node: Google Gemini Chat Model
- **Type / role:** `@n8n/n8n-nodes-langchain.lmChatGoogleGemini` — model provider for matching agent.
- **Credentials:** Google PaLM / Gemini.
- **Connections:** AI language model connection to **Job Matching Agent**.

#### Node: Job Matching Agent
- **Type / role:** `@n8n/n8n-nodes-langchain.agent` — produces structured job-match analysis.
- **Configuration choices:**
  - Very strict prompt: must return **one JSON object** wrapped in ```json fences, then literal `END_OF_JSON`.
  - Inputs:
    - `job_description: {{ $json.Description }}`
    - `my_resume: {{ $node["Extract from File"].data.text }}`
  - Enforces schema including: `job_analysis`, `resume_analysis`, `match_score`, `score_explanation`, `red_flags`, `gaps_and_suggestions`, `cover_letter`.
- **Connections:** Outputs to **Prepare Values for GSheet**.
- **Failure/edge cases:**
  - If the agent outputs invalid JSON or extra prose, parsing may fail. This workflow mitigates via the next node’s robust parsing.

#### Node: Prepare Values for GSheet
- **Type / role:** `n8n-nodes-base.set` (raw JSON mode) — parses/sanitizes AI output into a real JSON object.
- **Configuration highlights:**
  - Reads raw agent output: `$('Job Matching Agent').item.json.output`
  - Removes code fences (```json / ```), normalizes curly quotes, cuts at `END_OF_JSON`.
  - Extracts the **first complete `{...}`** by brace counting (string-aware).
  - `JSON.parse(cleaned)`; on failure returns `{}` (keeps execution alive).
- **Connections:** Outputs to **Resume Editor Agent**.
- **Failure/edge cases:**
  - If the model returns no `{`, node returns `{}` causing downstream sheet fields to become empty/undefined.
  - If the JSON is huge, could hit n8n memory limits; keep prompts concise.

---

### 2.7 Resume Improvement Suggestions + Persist Results

**Overview:** Generates concise per-job resume edit actions and writes combined results (job info + match score + cover letter + suggestions) into “Result” sheet, updating existing rows by job link.

**Nodes involved:**  
- Google Gemini Chat Model1  
- Resume Editor Agent  
- Update Rows with Job Detials

#### Node: Google Gemini Chat Model1
- **Type / role:** Gemini model provider for resume editor agent.
- **Credentials:** Google PaLM / Gemini.
- **Connections:** AI language model connection to **Resume Editor Agent**.

#### Node: Resume Editor Agent
- **Type / role:** `@n8n/n8n-nodes-langchain.agent` — outputs point-wise resume improvements.
- **Configuration choices:**
  - Inputs:
    - `job_description: {{ $json.Description }}`
    - `my_resume: {{ $('Extract from File').item.json.text }}`
  - Output constraints: numbered list, one line per point, tags like `[ADD]`, `[REWRITE]`, etc; no extra text.
- **Connections:** Outputs to **Update Rows with Job Detials**.
- **Failure/edge cases:**
  - If the agent adds prose or formatting, it still writes to sheet but may reduce usability.

#### Node: Update Rows with Job Detials
- **Type / role:** `n8n-nodes-base.googleSheets` — append or update job result row in sheet.
- **Configuration:**
  - Operation: **appendOrUpdate**
  - Document: same spreadsheet ID `1YwGBu2A9APwEh_b9Yt_Y8WiSOLp0g7BF46qD1lehYx0`
  - Sheet: “Result” (gid `11035642`)
  - **Matching column:** `Link` (acts as unique key)
  - Columns written (mapping highlights):
    - Link: from **Set Job Details** → `Apply Link`
    - Score: from **Prepare Values for GSheet** → `match_score`
    - Title/Location/Company: from **Set Job Details**
    - Skills: from **Prepare Values for GSheet** → `resume_analysis.core_skills`
    - Cover Letter: from **Prepare Values for GSheet** → `cover_letter`
    - Improvements: `={{ $json.output }}` (resume editor agent output)
- **Connections:** Outputs back to **Loop Over Items** to continue next job.
- **Failure/edge cases:**
  - Sheet column typo present: `Locaton` and `Company ` (with trailing space). Your sheet must match exactly or mapping breaks.
  - If `match_score` missing (empty `{}`), Score becomes blank.
  - Large text in Cover Letter/Improvements may exceed cell limits (Google Sheets cell character limits).

---

### 2.8 Results Notification

**Overview:** Once the loop finishes processing all job items, the workflow sends a Gmail email pointing to the Google Sheet.

**Nodes involved:**  
- Send a message

#### Node: Send a message
- **Type / role:** `n8n-nodes-base.gmail` — sends completion notification.
- **Configuration:**
  - To: `<YOUR-EMAIL-ID>` (must be replaced)
  - Subject: “Job search results”
  - Body includes the sheet link:  
    `https://docs.google.com/spreadsheets/d/1YwGBu2A9APwEh_b9Yt_Y8WiSOLp0g7BF46qD1lehYx0/edit?usp=sharing`
  - Sender name: “Job Automation Agent”
- **Credentials:** Gmail OAuth2.
- **Connections:** none (terminal).
- **Failure/edge cases:**
  - Gmail OAuth scope/consent issues; “From” address tied to credential owner.
  - If loop wiring is altered, this email can fire prematurely.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Schedule Trigger | n8n-nodes-base.scheduleTrigger | Daily trigger | — | Config | ## Trigger & Configuration\n\nControls when the workflow runs and defines global preferences such as remote type, Easy Apply preference, and maximum jobs per search. |
| Config | n8n-nodes-base.set | Global preferences/constants | Schedule Trigger | Download file | ## Trigger & Configuration\n\nControls when the workflow runs and defines global preferences such as remote type, Easy Apply preference, and maximum jobs per search. |
| Download file | n8n-nodes-base.googleDrive | Download resume PDF | Config | Extract from File | ## Resume Intake & Analysis\n\nDownloads the resume, extracts text, and uses AI to understand skills, experience level, and suitable job roles. |
| Extract from File | n8n-nodes-base.extractFromFile | Extract text from PDF | Download file | Resume Analyzer Agent | ## Resume Intake & Analysis\n\nDownloads the resume, extracts text, and uses AI to understand skills, experience level, and suitable job roles. |
| Gemini Model | @n8n/n8n-nodes-langchain.lmChatGoogleGemini | LLM provider for resume analysis | — | Resume Analyzer Agent (ai) | ## Resume Intake & Analysis\n\nDownloads the resume, extracts text, and uses AI to understand skills, experience level, and suitable job roles. |
| Resume Analyzer Agent | @n8n/n8n-nodes-langchain.agent | Generate LinkedIn search filters | Extract from File | Build Search Rows | ## Resume Intake & Analysis\n\nDownloads the resume, extracts text, and uses AI to understand skills, experience level, and suitable job roles.\n\n## Job Search Generation\n\nBuilds LinkedIn job search filters from resume insights and stores them in Google Sheets for tracking and reuse. |
| Build Search Rows | n8n-nodes-base.code | Parse/normalize AI JSON + apply config | Resume Analyzer Agent | Append row in sheet | ## Job Search Generation\n\nBuilds LinkedIn job search filters from resume insights and stores them in Google Sheets for tracking and reuse. |
| Append row in sheet | n8n-nodes-base.googleSheets | Write filters to “Filter” tab | Build Search Rows | LinkedIn Search URL | ## Job Search Generation\n\nBuilds LinkedIn job search filters from resume insights and stores them in Google Sheets for tracking and reuse. |
| LinkedIn Search URL | n8n-nodes-base.code | Build LinkedIn search URL | Append row in sheet | Fetch jobs from LinkedIn | ## Job Fetching & Parsing\n\nFetches job listings from LinkedIn, extracts job links, and parses detailed job information from each listing. |
| Fetch jobs from LinkedIn | n8n-nodes-base.httpRequest | Fetch search results HTML | LinkedIn Search URL | HTML | ## Job Fetching & Parsing\n\nFetches job listings from LinkedIn, extracts job links, and parses detailed job information from each listing. |
| HTML | n8n-nodes-base.html | Extract job links from HTML | Fetch jobs from LinkedIn | Limit Jobs | ## Job Fetching & Parsing\n\nFetches job listings from LinkedIn, extracts job links, and parses detailed job information from each listing. |
| Limit Jobs | n8n-nodes-base.code | Cap jobs per search | HTML | Split Out | ## Job Fetching & Parsing\n\nFetches job listings from LinkedIn, extracts job links, and parses detailed job information from each listing. |
| Split Out | n8n-nodes-base.splitOut | Split job links array into items | Limit Jobs | Loop Over Items | ## Job Fetching & Parsing\n\nFetches job listings from LinkedIn, extracts job links, and parses detailed job information from each listing. |
| Loop Over Items | n8n-nodes-base.splitInBatches | Iterate job links | Split Out; Update Rows with Job Detials | Wait; Send a message | ## Job Fetching & Parsing\n\nFetches job listings from LinkedIn, extracts job links, and parses detailed job information from each listing.\n\n## Results & Notification\n\nWrites job results, scores, and suggestions to Google Sheets and notifies the user by email when processing completes. |
| Wait | n8n-nodes-base.wait | Throttle per-job requests | Loop Over Items | Parse Job Links | ## Job Fetching & Parsing\n\nFetches job listings from LinkedIn, extracts job links, and parses detailed job information from each listing. |
| Parse Job Links | n8n-nodes-base.httpRequest | Fetch job page HTML | Wait | Extract HTML Job Details | ## Job Fetching & Parsing\n\nFetches job listings from LinkedIn, extracts job links, and parses detailed job information from each listing. |
| Extract HTML Job Details | n8n-nodes-base.html | Scrape job details | Parse Job Links | Set Job Details | ## Job Fetching & Parsing\n\nFetches job listings from LinkedIn, extracts job links, and parses detailed job information from each listing. |
| Set Job Details | n8n-nodes-base.set | Normalize fields + apply link | Extract HTML Job Details | Job Matching Agent | ## Job Fetching & Parsing\n\nFetches job listings from LinkedIn, extracts job links, and parses detailed job information from each listing. |
| Google Gemini Chat Model | @n8n/n8n-nodes-langchain.lmChatGoogleGemini | LLM provider for matching/scoring | — | Job Matching Agent (ai) | ## Job Matching & Scoring\n\nCompares each job description with the resume to calculate a match score, identify gaps, and generate a tailored cover letter. |
| Job Matching Agent | @n8n/n8n-nodes-langchain.agent | Produce strict match JSON | Set Job Details | Prepare Values for GSheet | ## Job Matching & Scoring\n\nCompares each job description with the resume to calculate a match score, identify gaps, and generate a tailored cover letter. |
| Prepare Values for GSheet | n8n-nodes-base.set | Parse/clean AI JSON output | Job Matching Agent | Resume Editor Agent | ## Job Matching & Scoring\n\nCompares each job description with the resume to calculate a match score, identify gaps, and generate a tailored cover letter. |
| Google Gemini Chat Model1 | @n8n/n8n-nodes-langchain.lmChatGoogleGemini | LLM provider for resume edits | — | Resume Editor Agent (ai) | ## Resume Improvement Suggestions\n\nGenerates concise, actionable resume edits to improve alignment with each job role. |
| Resume Editor Agent | @n8n/n8n-nodes-langchain.agent | Generate edit suggestions | Prepare Values for GSheet | Update Rows with Job Detials | ## Resume Improvement Suggestions\n\nGenerates concise, actionable resume edits to improve alignment with each job role. |
| Update Rows with Job Detials | n8n-nodes-base.googleSheets | Append/update “Result” tab | Resume Editor Agent | Loop Over Items | ## Results & Notification\n\nWrites job results, scores, and suggestions to Google Sheets and notifies the user by email when processing completes. |
| Send a message | n8n-nodes-base.gmail | Email completion notice | Loop Over Items | — | ## Results & Notification\n\nWrites job results, scores, and suggestions to Google Sheets and notifies the user by email when processing completes. |
| Sticky Note | n8n-nodes-base.stickyNote | Comment block | — | — | ## How it works\n\nThis workflow automates job discovery, resume matching, and application preparation using LinkedIn job listings and AI agents.\n\nOn a schedule, the workflow downloads your resume, analyzes it, and generates multiple LinkedIn job search filters tailored to your profile. These filters are saved to Google Sheets and then used to fetch recent job listings from LinkedIn.\n\nEach job listing is processed individually. The workflow extracts job details, compares the job description with your resume using AI, and calculates a match score. It also generates a tailored cover letter and clear resume improvement suggestions for that specific role.\n\nAll results are saved to Google Sheets so you can review, prioritize, and apply efficiently. Once the run completes, you receive an email notification with a link to the updated sheet.\n\nThis setup removes manual searching, screening, and comparison work, allowing you to focus only on high-fit opportunities.\n\n## Setup steps\n\n1. Make a copy of the Google Sheets template:  \n   https://docs.google.com/spreadsheets/d/1ia_82B7GMRdd896vo1md6a5VqXGxjma-QoBwBWDr77o/copy\n2. Upload your resume PDF to Google Drive.\n3. Connect Google Drive, Google Sheets, Gmail, and Gemini credentials.\n4. Update the **Config** node (remote preference, Easy Apply, job limit).\n5. Replace the Sheet IDs in the workflow with your copied sheet.\n6. Enable the Schedule Trigger to run automatically. |
| Sticky Note1 | n8n-nodes-base.stickyNote | Comment block | — | — |  |
| Sticky Note2 | n8n-nodes-base.stickyNote | Comment block | — | — |  |
| Sticky Note3 | n8n-nodes-base.stickyNote | Comment block | — | — |  |
| Sticky Note4 | n8n-nodes-base.stickyNote | Comment block | — | — |  |
| Sticky Note5 | n8n-nodes-base.stickyNote | Comment block | — | — |  |
| Sticky Note6 | n8n-nodes-base.stickyNote | Comment block | — | — |  |
| Sticky Note7 | n8n-nodes-base.stickyNote | Comment block | — | — |  |

> Note: Sticky notes are included as nodes in the JSON; their *content* is already duplicated on the functional nodes they visually describe via the “Sticky Note” column. The sticky-note-only rows above intentionally have blank sticky-note association cells.

---

## 4. Reproducing the Workflow from Scratch

1) **Create credentials**
   1. Google Drive OAuth2 (access to resume PDF).
   2. Google Sheets OAuth2 (access to the spreadsheet template copy).
   3. Gmail OAuth2 (send email).
   4. Google Gemini / PaLM API credential (for all Gemini LangChain model nodes).

2) **Create the trigger**
   1. Add **Schedule Trigger**.
   2. Configure: run daily at **05:00** (or your desired hour).

3) **Add configuration constants**
   1. Add **Set** node named **Config** after the trigger.
   2. Add fields:
      - `maxJobsPerSearch` (number recommended; original uses `"2"`)
      - `preferredRemote` (e.g., `Remote`)
      - `preferredEasyApply` (e.g., `No`)

4) **Resume download + extraction**
   1. Add **Google Drive** node “Download file” (operation: **download**).
      - Select your resume PDF file ID.
      - Attach Google Drive OAuth2 credential.
   2. Add **Extract From File** node (operation: **pdf**) to extract text.
   3. Connect: Trigger → Config → Download file → Extract from File.

5) **Resume-to-searches AI generation**
   1. Add **Google Gemini Chat Model** node named **Gemini Model** (LangChain).
      - Select Gemini credential.
   2. Add **AI Agent** node named **Resume Analyzer Agent**.
      - Prompt: instruct it to output JSON with 3–5 searches (keyword, location, experience_level).
      - Ensure it returns JSON only.
      - In the prompt, inject extracted resume text from **Extract from File**.
   3. Connect **Gemini Model** to **Resume Analyzer Agent** via the **ai_languageModel** connection.
   4. Add **Code** node named **Build Search Rows**:
      - Parse `items[0].json.output` as JSON.
      - Apply config overrides for Remote and Easy Apply.
      - Output one item per search with fields: Keyword, Location, Experience Level, Remote, Easy Apply.
   5. Add **Google Sheets** node named **Append row in sheet**:
      - Operation: **append**
      - Document: your copied template spreadsheet
      - Sheet: `Filter`
      - Map columns: Keyword/Location/Experience Level/Remote/Easy Apply
   6. Connect: Extract from File → Resume Analyzer Agent → Build Search Rows → Append row in sheet.

6) **Build LinkedIn URL + fetch listing HTML**
   1. Add **Code** node “LinkedIn Search URL”:
      - Start with `https://www.linkedin.com/jobs/search/?f_TPR=r86400`
      - Append `keywords`, `location`, `f_E` mappings.
      - Decide how to handle Easy Apply:
        - Original workflow forces `&f_EA=true` always (even if config says “No”).
   2. Add **HTTP Request** node “Fetch jobs from LinkedIn”:
      - URL from previous node (`{{$json.url}}`).
      - Consider setting a realistic User-Agent header if LinkedIn blocks you.
   3. Add **HTML** node “HTML” to extract job links:
      - Selector: `ul.jobs-search__results-list li div a[class*="base-card"]`
      - Extract attribute `href` into array `jobs`.
   4. Add **Code** node “Limit Jobs” to slice the items array to `Config.maxJobsPerSearch`.
   5. Add **Split Out** node “Split Out” to split the `jobs` array into individual items.
   6. Connect: Append row in sheet → LinkedIn Search URL → Fetch jobs from LinkedIn → HTML → Limit Jobs → Split Out.

7) **Loop jobs, throttle, fetch job page, extract details**
   1. Add **Split In Batches** node “Loop Over Items”.
   2. Connect Split Out → Loop Over Items.
   3. Add **Wait** node (2 seconds) and connect Loop Over Items (continue output) → Wait.
   4. Add **HTTP Request** node “Parse Job Links”:
      - URL: `{{$json.jobs}}`
   5. Add **HTML** node “Extract HTML Job Details” with selectors:
      - Title: `div h1`
      - Company: `div span a`
      - Location: `div span[class*='topcard__flavor topcard__flavor--bullet']`
      - Description: `div.description__text.description__text--rich`
      - Job ID: `a[data-item-type='semaphore']` attribute `data-semaphore-content-urn`
   6. Add **Set** node “Set Job Details”:
      - Normalize Description whitespace
      - Extract numeric job id from the urn and build Apply Link: `https://www.linkedin.com/jobs/view/<id>`
   7. Connect: Wait → Parse Job Links → Extract HTML Job Details → Set Job Details.

8) **Job matching + strict JSON parsing**
   1. Add **Google Gemini Chat Model** node named “Google Gemini Chat Model”.
   2. Add **AI Agent** node “Job Matching Agent” with the strict JSON schema prompt (score, cover letter, etc.).
      - Inject `{{ $json.Description }}` and resume text from Extract from File.
      - Force JSON fenced output + END_OF_JSON (as in original) if you keep the robust parser.
   3. Connect model to agent via **ai_languageModel**.
   4. Add **Set** node “Prepare Values for GSheet” in raw JSON mode:
      - Implement robust parsing: strip fences, normalize quotes, cut at END_OF_JSON, brace-count first object, JSON.parse.
   5. Connect: Set Job Details → Job Matching Agent → Prepare Values for GSheet.

9) **Resume edits + write results + continue loop**
   1. Add **Google Gemini Chat Model** node named “Google Gemini Chat Model1”.
   2. Add **AI Agent** node “Resume Editor Agent” with the numbered tagged-line output format.
   3. Connect model to agent via **ai_languageModel**.
   4. Add **Google Sheets** node “Update Rows with Job Detials”:
      - Operation: **appendOrUpdate**
      - Sheet: `Result`
      - Matching column: `Link`
      - Map columns using:
        - Job fields from Set Job Details
        - Score/Skills/Cover Letter from Prepare Values for GSheet
        - Improvements from Resume Editor Agent output
      - Ensure your sheet column names match exactly (including `Locaton` and `Company ` if you keep them).
   5. Connect: Prepare Values for GSheet → Resume Editor Agent → Update Rows with Job Detials → Loop Over Items (to continue batches).

10) **Completion email**
   1. Add **Gmail** node “Send a message”.
      - Set recipient email.
      - Include the spreadsheet link.
   2. Connect **Loop Over Items** “done” output → Send a message.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| Google Sheets template copy link | https://docs.google.com/spreadsheets/d/1ia_82B7GMRdd896vo1md6a5VqXGxjma-QoBwBWDr77o/copy |
| Results spreadsheet used in the workflow (must be replaced with your copy) | https://docs.google.com/spreadsheets/d/1YwGBu2A9APwEh_b9Yt_Y8WiSOLp0g7BF46qD1lehYx0/edit?usp=sharing |
| Key setup reminders from sticky note | Connect Google Drive/Sheets/Gmail/Gemini credentials; upload resume PDF; update Config; replace Sheet IDs; enable schedule trigger. |
| Important behavioral note | “LinkedIn Search URL” forces Easy Apply with `f_EA=true` even if Config says “No”; adjust if needed. |