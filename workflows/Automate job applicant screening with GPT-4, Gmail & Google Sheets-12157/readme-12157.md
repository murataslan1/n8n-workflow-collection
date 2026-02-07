Automate job applicant screening with GPT-4, Gmail & Google Sheets

https://n8nworkflows.xyz/workflows/automate-job-applicant-screening-with-gpt-4--gmail---google-sheets-12157


# Automate job applicant screening with GPT-4, Gmail & Google Sheets

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Title:** Automate job applicant screening with GPT-4, Gmail & Google Sheets  
**Workflow name (in JSON):** Screen job applicants with AI and schedule interviews via Gmail

**Purpose:**  
Automates the end-to-end screening of job applicants: receives application payloads, downloads resume/CV files, extracts text, uses GPT‑4 to evaluate skill match and culture fit, generates interview questions, stores results in Google Sheets, emails the candidate an interview invite, and notifies the hiring team in Slack. If required data is missing, it sends an error alert to Slack.

### 1.1 Input Reception & Normalization
Receives applications via webhook and normalizes the incoming JSON structure for downstream nodes.

### 1.2 Validation & Error Handling
Validates that essential fields exist (candidate email and resume URL). Routes to an error Slack message if validation fails.

### 1.3 Document Retrieval & Text Extraction
Downloads resume and CV files (as binary) and extracts text content (intended for PDFs) for AI evaluation.

### 1.4 AI Evaluation & Question Generation
Calls GPT‑4 to produce evaluation scores and a recommendation, parses the response into a structured `evaluation` object, then calls GPT‑4 again to generate tailored interview questions and parses them.

### 1.5 Recording, Candidate Outreach, and Team Notification
Appends evaluation results to Google Sheets, generates a scheduling link, emails the candidate, prepares a summary report payload, and posts a Slack notification to the recruiting team.

---

## 2. Block-by-Block Analysis

### Block 1 — Intake & Validation

**Overview:**  
Accepts new applications via HTTP POST, reshapes the payload, then checks for mandatory fields. If missing, it notifies the team in Slack and ends (since webhook response mode is “last node”, the Slack error node becomes the responder on that branch).

**Nodes involved:**
- Webhook: New Application
- Normalize Data
- Check Required Fields
- Slack: Error Notification

#### Node: **Webhook: New Application**
- **Type / role:** `Webhook` (trigger). Entry point for new applications from a job board/ATS/form.
- **Configuration (interpreted):**
  - **Method:** POST
  - **Path:** `recruitment-application` (Production URL must be registered with the source system)
  - **Response mode:** `lastNode` (the last executed node in the branch returns the webhook response)
- **Inputs/Outputs:** No input. Output to **Normalize Data**.
- **Edge cases / failures:**
  - Source sends unexpected schema → downstream expressions like `$json.applicant.email` fail/resolve to empty.
  - Large payloads / attachments should not be sent directly (workflow expects URLs for documents).
  - `lastNode` can unintentionally return Slack/Gmail/Sheets node output as HTTP response; some sources require a fixed response body.
- **Version notes:** Node `typeVersion 1.1` (older webhook versions have slightly different option sets; ensure n8n supports this).

#### Node: **Normalize Data**
- **Type / role:** `Set` (data shaping).
- **Configuration (interpreted):**
  - No explicit fields defined in JSON. Practically, this node is a placeholder for mapping the inbound webhook payload into a canonical structure:
    - `applicant` (e.g., `name`, `email`)
    - `job` (e.g., `title`)
    - `documents` (e.g., `resume_url`, `cv_url`)
- **Inputs/Outputs:** Input from Webhook; output to **Check Required Fields**.
- **Edge cases / failures:**
  - If left unconfigured, it won’t “normalize” anything; downstream nodes rely on paths like `$json.documents.resume_url`.
- **Version notes:** `typeVersion 3.2`.

#### Node: **Check Required Fields**
- **Type / role:** `If` (validation gate).
- **Configuration (interpreted):**
  - شرط AND:
    - `$json.applicant.email` is not empty
    - `$json.documents.resume_url` is not empty
- **Routing:**
  - **True branch:** continues to document download (Resume + CV in parallel).
  - **False branch:** goes to **Slack: Error Notification**
- **Inputs/Outputs:** Input from Normalize Data.
- **Edge cases / failures:**
  - If `$json.applicant` or `$json.documents` is missing, the expression may evaluate to `undefined` and fail strict validation depending on n8n behavior; typically it becomes empty and fails the notEmpty check.
  - CV URL is *not* required here, but later there is a node that downloads CV; if CV URL is missing, the workflow may still fail at **HTTP: Download CV** unless handled in code.
- **Version notes:** `typeVersion 2`.

#### Node: **Slack: Error Notification**
- **Type / role:** `Slack` (send message).
- **Configuration (interpreted):**
  - Sends a plain text alert with placeholders:
    - `Email: {{ $json.email || 'Unknown' }}`
    - `Job ID: {{ $json.job_id || 'Unknown' }}`
  - Error reason: missing required data (Email or Resume URL)
- **Inputs/Outputs:** Input from IF false branch; no outputs.
- **Credentials:** Slack API credential or webhook (depends on node setup in n8n UI).
- **Edge cases / failures:**
  - The message references `$json.email` and `$json.job_id`, but earlier the workflow expects `$json.applicant.email` and `$json.job.title`. If Normalize Data doesn’t set `email`/`job_id`, Slack will show “Unknown” even when data exists (schema mismatch).
  - Slack auth errors, missing channel, insufficient scopes.
- **Version notes:** `typeVersion 2.1`.

---

### Block 2 — Document Processing

**Overview:**  
Downloads resume and CV files from URLs, then extracts text (intended for PDFs) so the AI can evaluate the candidate based on actual content rather than metadata.

**Nodes involved:**
- HTTP: Download Resume
- HTTP: Download CV
- Code: Extract PDF Text

#### Node: **HTTP: Download Resume**
- **Type / role:** `HTTP Request` (file download).
- **Configuration (interpreted):**
  - **URL:** `{{$json.documents.resume_url}}`
  - **Timeout:** 30s
  - **Response format:** File (binary)
- **Inputs/Outputs:** From IF true branch; outputs to **Code: Extract PDF Text**.
- **Edge cases / failures:**
  - 404/403 or expiring signed URLs.
  - Non-PDF content returned (HTML error page) but still treated as “file”.
  - Large files may exceed memory limits depending on n8n binary data settings.
- **Version notes:** `typeVersion 4.2`.

#### Node: **HTTP: Download CV**
- **Type / role:** `HTTP Request` (file download).
- **Configuration (interpreted):**
  - **URL:** `{{$json.documents.cv_url}}`
  - **Timeout:** 30s
  - **Response format:** File (binary)
- **Inputs/Outputs:** From IF true branch; outputs to **Code: Extract PDF Text**.
- **Edge cases / failures:**
  - `cv_url` might be empty/not provided but not validated earlier → likely runtime failure.
- **Version notes:** `typeVersion 4.2`.

#### Node: **Code: Extract PDF Text**
- **Type / role:** `Code` (JavaScript), text extraction from binary PDFs.
- **Configuration (interpreted):**
  - Mode: “Run once for each item”.
  - Expected behavior (implied by name): read binary data from the downloaded files and output extracted plaintext fields like `resume_text` and `cv_text`.
- **Inputs/Outputs:**
  - Inputs from **HTTP: Download Resume** and **HTTP: Download CV** (both connect into this node).
  - Output to **Code: Prepare Data for AI**.
- **Important integration detail:**  
  In n8n, when two parallel branches connect into a single node without a Merge node, executions can arrive as separate items (one per download). If the intent is to combine resume+cv into one item, typically you must use a **Merge** node (e.g., “Merge By Index” or “Wait/Combine”). As-is, this node will likely run twice (once per file), unless the code itself merges items.
- **Edge cases / failures:**
  - PDF parsing requires a library; in n8n Code node you may not have pdf-parse available. Many builds don’t include arbitrary npm modules.
  - If the download is DOCX/PNG, extraction will fail unless handled.
  - Binary property name assumptions (e.g., `data`) can break if HTTP node outputs a different binary key.
- **Version notes:** `typeVersion 2`.

---

### Block 3 — AI Evaluation

**Overview:**  
Prepares an AI prompt payload using the extracted document text and job context, calls GPT‑4 for scoring and recommendation, parses results into structured JSON, then calls GPT‑4 again to generate interview questions and parses them.

**Nodes involved:**
- Code: Prepare Data for AI
- OpenAI: Evaluate Skill & Culture
- Code: Parse Evaluation
- OpenAI: Generate Questions
- Code: Parse Questions

#### Node: **Code: Prepare Data for AI**
- **Type / role:** `Code` (JavaScript), prompt/input assembly.
- **Configuration (interpreted):**
  - Produces a clean object likely containing:
    - candidate profile (`applicant`)
    - job description/requirements (`job`)
    - `resume_text` / `cv_text`
    - instructions for the model to output a strict JSON schema
- **Inputs/Outputs:** From Extract PDF Text; outputs to **OpenAI: Evaluate Skill & Culture**.
- **Edge cases / failures:**
  - If prior node outputs two separate items (resume vs CV), you might end up evaluating only one document per run.
  - Missing job description fields → lower-quality evaluation or prompt errors.

#### Node: **OpenAI: Evaluate Skill & Culture**
- **Type / role:** `OpenAI` chat completion (analysis/scoring).
- **Configuration (interpreted):**
  - **Model:** `gpt-4`
  - **Max tokens:** 2000
  - **Temperature:** 0.3 (more deterministic)
  - Resource: Chat
- **Inputs/Outputs:** From Prepare Data for AI; outputs to **Code: Parse Evaluation**.
- **Credentials:** OpenAI API key configured in n8n.
- **Edge cases / failures:**
  - Model name `gpt-4` may not be available on all OpenAI accounts or may be deprecated in favor of newer model IDs; adjust as needed.
  - Output may not be valid JSON → parsing code must be robust (strip markdown fences, recover partial JSON).
  - Token limits: long resumes can exceed context window; may require truncation/summarization.

#### Node: **Code: Parse Evaluation**
- **Type / role:** `Code` (JavaScript), response parsing/validation.
- **Configuration (interpreted):**
  - Extracts fields into `$json.evaluation`, likely:
    - `skill_match_score` (0–100)
    - `culture_fit_score` (0–100)
    - `overall_recommendation` (e.g., Strong Yes / Yes / Maybe / No)
    - `career_summary` (short narrative)
    - possibly strengths/risks
- **Inputs/Outputs:** From OpenAI Evaluate; outputs to **OpenAI: Generate Questions**.
- **Edge cases / failures:**
  - If the AI returns natural language, parsing fails.
  - Missing fields will break later nodes (Sheets columns, Slack formatting).

#### Node: **OpenAI: Generate Questions**
- **Type / role:** `OpenAI` chat completion (content generation).
- **Configuration (interpreted):**
  - **Model:** `gpt-4`
  - **Max tokens:** 2000
  - **Temperature:** 0.5 (more creative)
- **Inputs/Outputs:** From Parse Evaluation; outputs to **Code: Parse Questions**.
- **Edge cases / failures:**
  - If prompt not constrained, questions may be verbose or not structured.

#### Node: **Code: Parse Questions**
- **Type / role:** `Code` (JavaScript), normalize questions to a list/string for storage and reporting.
- **Inputs/Outputs:** From Generate Questions; outputs to **G Sheets: Save Evaluation**.
- **Edge cases / failures:**
  - Ensure consistent type (array vs string) for Google Sheets append.

---

### Block 4 — Recording & Outreach

**Overview:**  
Stores the evaluation in Google Sheets, generates an interview scheduling link with a deadline, and emails the candidate a formatted invitation via Gmail.

**Nodes involved:**
- G Sheets: Save Evaluation
- Code: Generate Scheduling Link
- Gmail: Send Invite

#### Node: **G Sheets: Save Evaluation**
- **Type / role:** `Google Sheets` (append row).
- **Configuration (interpreted):**
  - Operation: Append
  - Document ID and Sheet Name are set to “select from list” but empty in JSON (must be configured).
  - Expected mapping: columns should match the workflow’s `evaluation` object (as noted in sticky note).
- **Inputs/Outputs:** From Parse Questions; outputs to **Code: Generate Scheduling Link**.
- **Credentials:** Google OAuth2 (Sheets scope).
- **Edge cases / failures:**
  - Empty `documentId`/`sheetName` → node fails until configured.
  - Column mismatch: append may misalign data or fail depending on “Columns” mode.
  - Rate limits / permission issues.
- **Version notes:** `typeVersion 4.5`.

#### Node: **Code: Generate Scheduling Link**
- **Type / role:** `Code` (JavaScript), scheduling URL and deadline creation.
- **Configuration (interpreted):**
  - Produces `$json.scheduling.link` and `$json.scheduling.deadline`.
  - Intended to incorporate your scheduling system (Calendly, Google Appointment Slots, custom booking page).
- **Inputs/Outputs:** From Sheets; outputs to **Gmail: Send Invite**.
- **Edge cases / failures:**
  - Timezone handling for deadline.
  - If link generation depends on candidate/job identifiers, ensure they exist and are URL-safe.

#### Node: **Gmail: Send Invite**
- **Type / role:** `Gmail` (send email).
- **Configuration (interpreted):**
  - **To:** `{{$json.applicant.email}}`
  - **Subject:** `[{{ $json.job.title }}] First Interview Invitation: {{ $json.applicant.name }}`
  - **HTML body:** Includes:
    - job title and applicant name
    - scheduling link: `{{$json.scheduling.link}}`
    - deadline formatted with JS: `new Date($json.scheduling.deadline).toLocaleDateString('en-US')`
- **Inputs/Outputs:** From Generate Scheduling Link; outputs to **Code: Prepare Report**.
- **Credentials:** Google OAuth2 (Gmail send scope).
- **Edge cases / failures:**
  - If `scheduling.deadline` is not ISO/parseable, `new Date(...)` may output “Invalid Date”.
  - Gmail “From” identity restrictions (must be authorized sender).
  - HTML sanitization/format quirks.
- **Version notes:** `typeVersion 2.1`.

---

### Block 5 — Team Notification

**Overview:**  
Builds an internal report payload (including a report URL) and posts a Slack message with scores, recommendation, and action buttons.

**Nodes involved:**
- Code: Prepare Report
- Slack: Notify Team

#### Node: **Code: Prepare Report**
- **Type / role:** `Code` (JavaScript), prepares Slack-ready summary and report URL.
- **Configuration (interpreted):**
  - Expected to create something like:
    - `$json.report.report_url` (used by Slack button)
    - maybe a formatted summary string
- **Inputs/Outputs:** From Gmail; outputs to **Slack: Notify Team**.
- **Edge cases / failures:**
  - If no report URL is generated, Slack “View Report” button will be broken/empty.

#### Node: **Slack: Notify Team**
- **Type / role:** `Slack` (post Block Kit message).
- **Configuration (interpreted):**
  - Uses blocks:
    - Header section: “New Application Evaluated”
    - Fields: candidate, position, skill score, culture score
    - Recommendation + summary
    - Buttons:
      - “View Report” → `{{$json.report.report_url}}`
      - “Applicant List” → hardcoded Google Sheets URL placeholder `YOUR_SHEET_ID`
- **Inputs/Outputs:** From Prepare Report; terminal node.
- **Credentials:** Slack API credential/webhook.
- **Edge cases / failures:**
  - Block kit errors if text fields exceed Slack limits.
  - If `evaluation.skill_match_score` etc. are missing/non-numeric → confusing message.
  - Hardcoded sheet link must be updated.
- **Version notes:** `typeVersion 2.1`.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Workflow Overview | Sticky Note | Documentation / overview | — | — | ## 📊 Workflow Overview  \nThis workflow automates the screening process for new job applications. It analyzes resumes using AI, evaluates skills and culture fit, records data, and handles interview scheduling.\n\n## How it works\n1.  **Ingest**: Receives application data via Webhook.\n2.  **Extract**: Downloads resumes/CVs and extracts text.\n3.  **Analyze**: Uses GPT-4 to score skills/culture fit and generate interview questions.\n4.  **Action**: Logs results to Google Sheets and emails the candidate.\n5.  **Notify**: Alerts the hiring team via Slack.\n\n## Setup steps\n1.  **Credentials**: Configure OpenAI, Google (Sheets/Gmail), and Slack.\n2.  **Webhook**: Register the Production URL with your job board.\n3.  **Spreadsheet**: Create a Google Sheet with columns matching the `evaluation` object.\n4.  **Email**: Customize the Gmail template with your scheduling link logic. |
| Group: Intake | Sticky Note | Documentation block label | — | — | ## 1. Intake & Validation  \nReceives applicant data and validates essential fields. Sends an error notification to Slack if data is missing. |
| Group: Docs | Sticky Note | Documentation block label | — | — | ## 2. Document Processing  \nDownloads Resume and CV files from URLs and extracts text content for AI analysis. |
| Group: AI | Sticky Note | Documentation block label | — | — | ## 3. AI Evaluation  \nUses GPT-4 to evaluate the candidate against the job description and generate tailored interview questions. |
| Group: Outreach | Sticky Note | Documentation block label | — | — | ## 4. Recording & Outreach  \nSaves evaluation scores to Google Sheets and sends an automated interview invitation email to the candidate. |
| Group: Notify | Sticky Note | Documentation block label | — | — | ## 5. Team Notification  \nPrepares a summary report and notifies the recruitment team via Slack with a call to action. |
| Webhook: New Application | Webhook | Entry point (receive application) | — | Normalize Data | ## 1. Intake & Validation  \nReceives applicant data and validates essential fields. Sends an error notification to Slack if data is missing. |
| Normalize Data | Set | Canonicalize/shape inbound payload | Webhook: New Application | Check Required Fields | ## 1. Intake & Validation  \nReceives applicant data and validates essential fields. Sends an error notification to Slack if data is missing. |
| Check Required Fields | If | Validate required fields | Normalize Data | HTTP: Download Resume; HTTP: Download CV (true) / Slack: Error Notification (false) | ## 1. Intake & Validation  \nReceives applicant data and validates essential fields. Sends an error notification to Slack if data is missing. |
| Slack: Error Notification | Slack | Alert on invalid/missing data | Check Required Fields (false) | — | ## 1. Intake & Validation  \nReceives applicant data and validates essential fields. Sends an error notification to Slack if data is missing. |
| HTTP: Download Resume | HTTP Request | Download resume file as binary | Check Required Fields (true) | Code: Extract PDF Text | ## 2. Document Processing  \nDownloads Resume and CV files from URLs and extracts text content for AI analysis. |
| HTTP: Download CV | HTTP Request | Download CV file as binary | Check Required Fields (true) | Code: Extract PDF Text | ## 2. Document Processing  \nDownloads Resume and CV files from URLs and extracts text content for AI analysis. |
| Code: Extract PDF Text | Code | Extract text from downloaded PDFs | HTTP: Download Resume; HTTP: Download CV | Code: Prepare Data for AI | ## 2. Document Processing  \nDownloads Resume and CV files from URLs and extracts text content for AI analysis. |
| Code: Prepare Data for AI | Code | Build prompts / assemble AI input | Code: Extract PDF Text | OpenAI: Evaluate Skill & Culture | ## 3. AI Evaluation  \nUses GPT-4 to evaluate the candidate against the job description and generate tailored interview questions. |
| OpenAI: Evaluate Skill & Culture | OpenAI | Score skill match & culture fit | Code: Prepare Data for AI | Code: Parse Evaluation | ## 3. AI Evaluation  \nUses GPT-4 to evaluate the candidate against the job description and generate tailored interview questions. |
| Code: Parse Evaluation | Code | Parse GPT output into `evaluation` object | OpenAI: Evaluate Skill & Culture | OpenAI: Generate Questions | ## 3. AI Evaluation  \nUses GPT-4 to evaluate the candidate against the job description and generate tailored interview questions. |
| OpenAI: Generate Questions | OpenAI | Generate interview questions | Code: Parse Evaluation | Code: Parse Questions | ## 3. AI Evaluation  \nUses GPT-4 to evaluate the candidate against the job description and generate tailored interview questions. |
| Code: Parse Questions | Code | Parse questions into structured fields | OpenAI: Generate Questions | G Sheets: Save Evaluation | ## 3. AI Evaluation  \nUses GPT-4 to evaluate the candidate against the job description and generate tailored interview questions. |
| G Sheets: Save Evaluation | Google Sheets | Append evaluation record | Code: Parse Questions | Code: Generate Scheduling Link | ## 4. Recording & Outreach  \nSaves evaluation scores to Google Sheets and sends an automated interview invitation email to the candidate. |
| Code: Generate Scheduling Link | Code | Create booking link & deadline | G Sheets: Save Evaluation | Gmail: Send Invite | ## 4. Recording & Outreach  \nSaves evaluation scores to Google Sheets and sends an automated interview invitation email to the candidate. |
| Gmail: Send Invite | Gmail | Email candidate interview invitation | Code: Generate Scheduling Link | Code: Prepare Report | ## 4. Recording & Outreach  \nSaves evaluation scores to Google Sheets and sends an automated interview invitation email to the candidate. |
| Code: Prepare Report | Code | Prepare report URL and summary payload | Gmail: Send Invite | Slack: Notify Team | ## 5. Team Notification  \nPrepares a summary report and notifies the recruitment team via Slack with a call to action. |
| Slack: Notify Team | Slack | Notify recruiting team with results | Code: Prepare Report | — | ## 5. Team Notification  \nPrepares a summary report and notifies the recruitment team via Slack with a call to action. |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a new workflow**
   - Name it: *Screen job applicants with AI and schedule interviews via Gmail* (or your preferred name).
   - Keep it **inactive** until credentials and URLs are configured.

2. **Add the trigger: Webhook**
   - Node: **Webhook**
   - Name: **Webhook: New Application**
   - Method: **POST**
   - Path: **recruitment-application**
   - Response mode: **Last node**
   - Copy the **Production URL** (later) into your job board/ATS integration.

3. **Add normalization: Set**
   - Node: **Set**
   - Name: **Normalize Data**
   - Configure it to output a consistent schema used everywhere else, for example:
     - `applicant.name`
     - `applicant.email`
     - `job.title`
     - `documents.resume_url`
     - `documents.cv_url` (optional but recommended)
     - (optionally) `job_id` and `email` if you want Slack error node to display them
   - Connect: **Webhook: New Application → Normalize Data**

4. **Add validation: IF**
   - Node: **IF**
   - Name: **Check Required Fields**
   - Conditions (AND):
     - String **not empty**: `{{$json.applicant.email}}`
     - String **not empty**: `{{$json.documents.resume_url}}`
   - Connect: **Normalize Data → Check Required Fields**

5. **Add error handling: Slack**
   - Node: **Slack**
   - Name: **Slack: Error Notification**
   - Action: send message (simple text)
   - Use the message from the workflow (adjust variable paths to your normalized schema if needed).
   - Connect: **Check Required Fields (false) → Slack: Error Notification**
   - Configure Slack credentials (OAuth or webhook) and target channel.

6. **Add document downloads: HTTP Request (2 nodes)**
   - Node 1: **HTTP Request**
     - Name: **HTTP: Download Resume**
     - URL: `{{$json.documents.resume_url}}`
     - Response: **File**
     - Timeout: **30000ms**
   - Node 2: **HTTP Request**
     - Name: **HTTP: Download CV**
     - URL: `{{$json.documents.cv_url}}`
     - Response: **File**
     - Timeout: **30000ms**
   - Connect: **Check Required Fields (true) → HTTP: Download Resume**
   - Connect: **Check Required Fields (true) → HTTP: Download CV**

7. **(Recommended) Add a Merge node (to avoid split/duplicate item issues)**
   - Node: **Merge**
   - Mode: typically **Merge By Index** (resume item + cv item)
   - Connect: **HTTP: Download Resume → Merge (Input 1)** and **HTTP: Download CV → Merge (Input 2)**
   - If you do not add Merge, ensure your extraction code can handle separate items.

8. **Add text extraction: Code**
   - Node: **Code**
   - Name: **Code: Extract PDF Text**
   - Implement logic to:
     - read binary content of resume and CV
     - extract plaintext
     - output unified fields like `documents.resume_text` and `documents.cv_text`
   - Connect:
     - If using Merge: **Merge → Code: Extract PDF Text**
     - Otherwise: connect both HTTP nodes to this node and handle multi-item logic.

9. **Add prompt preparation: Code**
   - Node: **Code**
   - Name: **Code: Prepare Data for AI**
   - Build:
     - a job context (title, description if available)
     - combined candidate text (resume + CV)
     - instructions requiring **strict JSON output** for reliable parsing
   - Connect: **Code: Extract PDF Text → Code: Prepare Data for AI**

10. **Add OpenAI evaluation: OpenAI node**
    - Node: **OpenAI**
    - Name: **OpenAI: Evaluate Skill & Culture**
    - Resource: **Chat**
    - Model: **gpt-4** (or an available GPT‑4-class model in your account)
    - Temperature: **0.3**, Max tokens: **2000**
    - Configure OpenAI credentials (API key).
    - Connect: **Code: Prepare Data for AI → OpenAI: Evaluate Skill & Culture**

11. **Add evaluation parsing: Code**
    - Node: **Code**
    - Name: **Code: Parse Evaluation**
    - Parse the model response into a stable object, e.g.:
      - `evaluation.skill_match_score`
      - `evaluation.culture_fit_score`
      - `evaluation.overall_recommendation`
      - `evaluation.career_summary`
    - Connect: **OpenAI: Evaluate Skill & Culture → Code: Parse Evaluation**

12. **Add question generation: OpenAI**
    - Node: **OpenAI**
    - Name: **OpenAI: Generate Questions**
    - Resource: **Chat**
    - Model: **gpt-4**
    - Temperature: **0.5**, Max tokens: **2000**
    - Prompt should request a structured list (JSON array) of interview questions tailored to gaps/risks.
    - Connect: **Code: Parse Evaluation → OpenAI: Generate Questions**

13. **Add question parsing: Code**
    - Node: **Code**
    - Name: **Code: Parse Questions**
    - Normalize to fields for storage, e.g. `evaluation.interview_questions` (string) or `questions[]`.
    - Connect: **OpenAI: Generate Questions → Code: Parse Questions**

14. **Add Google Sheets append**
    - Node: **Google Sheets**
    - Name: **G Sheets: Save Evaluation**
    - Operation: **Append**
    - Select:
      - Google **credentials**
      - **Document ID** (spreadsheet)
      - **Sheet name**
    - Map columns to your normalized output (ensure columns exist).
    - Connect: **Code: Parse Questions → G Sheets: Save Evaluation**

15. **Add scheduling link generation: Code**
    - Node: **Code**
    - Name: **Code: Generate Scheduling Link**
    - Output:
      - `scheduling.link`
      - `scheduling.deadline` (ISO string recommended)
    - Connect: **G Sheets: Save Evaluation → Code: Generate Scheduling Link**

16. **Add Gmail send**
    - Node: **Gmail**
    - Name: **Gmail: Send Invite**
    - To: `{{$json.applicant.email}}`
    - Subject/body: use the provided HTML template; ensure it references existing fields.
    - Configure Gmail OAuth2 credentials and sending identity.
    - Connect: **Code: Generate Scheduling Link → Gmail: Send Invite**

17. **Add report preparation: Code**
    - Node: **Code**
    - Name: **Code: Prepare Report**
    - Create:
      - `report.report_url` (must be a valid URL for Slack button)
    - Connect: **Gmail: Send Invite → Code: Prepare Report**

18. **Add Slack team notification**
    - Node: **Slack**
    - Name: **Slack: Notify Team**
    - Use Block Kit message with:
      - candidate/job/score fields
      - “View Report” button using `{{$json.report.report_url}}`
      - Update the hardcoded Google Sheet link with your real spreadsheet ID.
    - Connect: **Code: Prepare Report → Slack: Notify Team**

19. **Activate and register webhook**
    - Switch workflow to **Active**.
    - Use the **Production URL** in your job board/ATS webhook settings.
    - Send a test payload that includes `applicant.email` and `documents.resume_url` at minimum.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| Configure OpenAI, Google (Sheets/Gmail), and Slack credentials before activating. | From “Workflow Overview” sticky note |
| Register the webhook Production URL with your job board. | From “Workflow Overview” sticky note |
| Create a Google Sheet with columns matching the `evaluation` object. | From “Workflow Overview” sticky note |
| Customize the Gmail template and scheduling link logic. | From “Workflow Overview” sticky note |

