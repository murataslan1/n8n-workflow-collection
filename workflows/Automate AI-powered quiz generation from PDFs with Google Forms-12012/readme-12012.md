Automate AI-powered quiz generation from PDFs with Google Forms

https://n8nworkflows.xyz/workflows/automate-ai-powered-quiz-generation-from-pdfs-with-google-forms-12012


# Automate AI-powered quiz generation from PDFs with Google Forms

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Title:** Automate AI-powered quiz generation from PDFs with Google Forms  
**Purpose:** Accept a user-uploaded PDF and desired number of questions, extract the PDF text, generate multiple-choice quiz questions via OpenAI (structured to match Google Forms API batchUpdate format), create a Google Form in quiz mode, insert student detail fields + questions, and log all generated questions/answers (plus the quiz URL) into Google Sheets.

### 1.1 Input Reception
Receives a PDF file and a question count from an n8n Form Trigger.

### 1.2 Content Extraction
Extracts raw text from the uploaded PDF binary.

### 1.3 AI Question Generation (Structured)
Uses an OpenAI chat model + a structured output parser to generate **valid JSON** formatted as Google Forms `batchUpdate` requests.

### 1.4 Google Form Creation & Population
Creates a new Google Form, enables quiz mode, inserts AI-generated questions, then inserts a “Student Information” section at the beginning.

### 1.5 Output Logging to Google Sheets
Transforms generated questions into row-based tabular data and appends them to a specific Google Sheet (including the quiz responder URL).

---

## 2. Block-by-Block Analysis

### Block 1 — Input Reception
**Overview:** Collects the PDF document and user-defined question count through an n8n-hosted form endpoint. This is the workflow entry point.  
**Nodes Involved:** `On form submission`

#### Node: On form submission
- **Type / Role:** `n8n-nodes-base.formTrigger` — webhook-based form intake.
- **Configuration (interpreted):**
  - Form title: **“PDF”**
  - Fields:
    1. **PDF** (file upload), required, accepts `.pdf`
    2. **How many questions would you like to have in the quiz?** (text/number-like), required, placeholder `e.g. 20`
- **Key variables / output:**
  - Binary file available under **binary property `PDF`** (used downstream).
  - Question count available at:  
    `$('On form submission').item.json['How many questions would you like to have in the quiz?']`
- **Connections:**
  - **Main output →** `Extract from File`
- **Edge cases / failures:**
  - Missing/invalid PDF upload (blocked by required field, but still possible if client misbehaves).
  - Non-numeric question count (later used in prompt; may lead to unexpected LLM output volume).
- **Version notes:** TypeVersion **2.3**; ensure your n8n instance supports Form Trigger v2+.

---

### Block 2 — Content Extraction
**Overview:** Converts the uploaded PDF binary into text for the LLM prompt.  
**Nodes Involved:** `Extract from File`

#### Node: Extract from File
- **Type / Role:** `n8n-nodes-base.extractFromFile` — file text extraction.
- **Configuration (interpreted):**
  - Operation: **pdf**
  - Binary property name: **PDF**
- **Inputs:**
  - Receives the submission item containing `binary.PDF`.
- **Outputs:**
  - Produces extracted text in the item JSON (commonly `json.text`), referenced later as `{{ $json.text }}`.
- **Connections:**
  - **Main output →** `Questions Generate`
- **Edge cases / failures:**
  - Encrypted/scanned PDFs may extract poorly or yield empty text.
  - Large PDFs may cause long processing time or truncation depending on node limits.
  - Corrupted PDF binary results in extraction failure.
- **Version notes:** TypeVersion **1.1**.

---

### Block 3 — AI Question Generation (Structured)
**Overview:** Uses OpenAI to generate Google Forms-compatible quiz question creation requests as strict JSON, enforced via a structured output parser.  
**Nodes Involved:** `OpenAI Chat Model`, `Structured Output Parser`, `Questions Generate`

#### Node: OpenAI Chat Model
- **Type / Role:** `@n8n/n8n-nodes-langchain.lmChatOpenAi` — provides the LLM backend for LangChain nodes.
- **Configuration (interpreted):**
  - Model: **gpt-4o-mini**
  - Timeout: **500000 ms** (very high to tolerate long generations)
  - Responses API: disabled
- **Credentials:**
  - OpenAI API credential (named “openAiApi Credential” in the workflow)
- **Connections:**
  - Provides **AI Language Model** connection → `Questions Generate`
- **Edge cases / failures:**
  - Auth/quota errors from OpenAI.
  - Very large extracted text may exceed model context limits, causing truncation or refusal.
  - High timeout may hold execution resources for long periods.
- **Version notes:** TypeVersion **1.3**.

#### Node: Structured Output Parser
- **Type / Role:** `@n8n/n8n-nodes-langchain.outputParserStructured` — validates/coerces LLM output into a defined JSON schema example.
- **Configuration (interpreted):**
  - Provides a **JSON schema example** matching Google Forms `batchUpdate` request format with:
    - `requests[]`
    - `createItem.item.title`
    - `questionItem.question.choiceQuestion.options[4]`
    - `grading.correctAnswers.answers[0].value`
    - feedback texts, shuffle enabled
- **Connections:**
  - Provides **AI Output Parser** connection → `Questions Generate`
- **Edge cases / failures:**
  - If the model outputs invalid JSON or deviates from structure, parsing fails and the workflow stops before Form creation.
  - Mismatch between correct answer and options can still happen if model violates instructions; later steps may fail in Google API validation.
- **Version notes:** TypeVersion **1.3**.

#### Node: Questions Generate
- **Type / Role:** `@n8n/n8n-nodes-langchain.chainLlm` — prompt-driven generation with attached model and output parser.
- **Configuration (interpreted):**
  - Prompt includes:
    - Input content: `Input : {{ $json.text }}`
    - Required question count:  
      `{{ $('On form submission').item.json['How many questions would you like to have in the quiz?'] }}`
    - Strict requirements: 4 options, 1 correct, 1 point, shuffle true, indexes increment from 0, valid JSON output in *exact structure*.
  - Output parser enabled (`hasOutputParser: true`)
- **Inputs:**
  - Receives extracted PDF text from `Extract from File`
  - Receives AI model from `OpenAI Chat Model` (AI connection)
  - Receives parser from `Structured Output Parser` (AI connection)
- **Outputs:**
  - Produces `json.output` containing the final structured object. Downstream usage:
    - `$('Questions Generate').item.json.output` (passed directly to Google Forms batchUpdate)
    - `$('Questions Generate').first().json.output.requests` (used in Code node)
- **Connections:**
  - **Main output →** `Create Form`
- **Edge cases / failures:**
  - Prompt injection from PDF content could degrade output; the parser helps but cannot guarantee semantic correctness.
  - If question count is very high, generation can be slow or exceed token limits.
  - If indexes are wrong or duplicated, Google Forms API may error when inserting items.
- **Version notes:** TypeVersion **1.7**.

---

### Block 4 — Google Form Creation & Population
**Overview:** Creates a Google Form, turns it into a quiz, inserts generated questions, then inserts student info fields at the top (indexes 0–5).  
**Nodes Involved:** `Create Form`, `Enable Quiz Mode`, `Add Questions`, `Add Student Details`

#### Node: Create Form
- **Type / Role:** `n8n-nodes-base.httpRequest` — calls Google Forms API to create a form.
- **Configuration (interpreted):**
  - Method: **POST**
  - URL: `https://forms.googleapis.com/v1/forms`
  - JSON body creates:
    - `info.title`: **"My Quiz Form"**
    - `info.documentTitle`: **"Quiz Form"**
  - Authentication: **Predefined Credential Type → Google OAuth2 API**
- **Outputs:**
  - Important fields used later:
    - `formId` (used in subsequent batchUpdate URLs)
    - `responderUri` (used for logging; stored as quiz URL)
- **Connections:**
  - **Main output →** `Enable Quiz Mode`
- **Edge cases / failures:**
  - Google OAuth scope missing (Forms API requires appropriate scopes).
  - Forms API not enabled in GCP project.
  - HTTP 403/401 for auth issues; 429 for rate limits.
- **Version notes:** TypeVersion **4.3**.

#### Node: Enable Quiz Mode
- **Type / Role:** `n8n-nodes-base.httpRequest` — batchUpdate to enable quiz settings.
- **Configuration (interpreted):**
  - Method: **POST**
  - URL expression:  
    `https://forms.googleapis.com/v1/forms/{{ $('Create Form').item.json.formId }}:batchUpdate`
  - Body: `updateSettings` setting `quizSettings.isQuiz = true`
  - updateMask: `quizSettings.isQuiz`
  - Auth: Google OAuth2 API
- **Connections:**
  - **Main output →** `Add Questions`
- **Edge cases / failures:**
  - If `Create Form` didn’t return `formId`, the URL expression fails.
  - Incorrect permissions to modify the form.
- **Version notes:** TypeVersion **4.3**.

#### Node: Add Questions
- **Type / Role:** `n8n-nodes-base.httpRequest` — batchUpdate to insert all generated items.
- **Configuration (interpreted):**
  - Method: **POST**
  - URL expression:  
    `https://forms.googleapis.com/v1/forms/{{ $('Create Form').item.json.formId }}:batchUpdate`
  - Body expression:  
    `{{ $('Questions Generate').item.json.output }}`
    (expects the entire `{ "requests": [...] }` object)
  - Auth: Google OAuth2 API
- **Connections:**
  - **Main output →** `Add Student Details`
- **Edge cases / failures:**
  - If LLM output is not valid per Forms API, this call fails (common errors: invalid item structure, missing required fields, correct answer not matching options, invalid indexes).
  - If all questions use `location.index: 0` (or non-incrementing), order may be wrong or API may reject depending on behavior.
- **Version notes:** TypeVersion **4.3**.

#### Node: Add Student Details
- **Type / Role:** `n8n-nodes-base.httpRequest` — batchUpdate to insert student information section and fields.
- **Configuration (interpreted):**
  - Method: **POST**
  - URL expression:  
    `https://forms.googleapis.com/v1/forms/{{ $('Create Form').item.json.formId }}:batchUpdate`
  - Body creates (at fixed indexes):
    - Index 0: Page break “Student Information”
    - Index 1: “Full Name” (required text)
    - Index 2: “Email Address” (required text)
    - Index 3: “Student ID” (required text)
    - Index 4: “Class/Grade” (required text)
    - Index 5: Page break “Quiz Questions”
  - Auth: Google OAuth2 API
- **Connections:**
  - **Main output →** `Set a Google Sheet Structure for all Questions`
- **Edge cases / failures:**
  - **Index collisions:** because questions were added earlier, inserting student items at indices 0–5 shifts existing items. This is likely intended (student fields appear first), but if the question insertion also used early indices incorrectly, results may be unpredictable.
  - Permissions/scopes as above.
- **Version notes:** TypeVersion **4.3**.

---

### Block 5 — Output Logging to Google Sheets
**Overview:** Converts the generated quiz request payload into per-question rows and appends them to a Google Sheet for tracking/audit.  
**Nodes Involved:** `Set a Google Sheet Structure for all Questions`, `Append All Questions`

#### Node: Set a Google Sheet Structure for all Questions
- **Type / Role:** `n8n-nodes-base.code` — transforms AI output into a flat table.
- **Configuration (interpreted):**
  - Reads questions from:  
    `$('Questions Generate').first().json.output.requests`
  - Reads quiz URL from:  
    `$('Create Form').first().json.responderUri || ""`
  - For each request item, extracts:
    - `question` = `item.title`
    - `options[]` = `choiceQuestion.options[].value`
    - `correct_answer` = `grading.correctAnswers.answers[0].value`
  - Adds `quiz_url` only on the **first row** (others blank)
  - Returns items like:
    - `question`, `option1..4`, `correct_answer`, `quiz_url`
- **Connections:**
  - **Main output →** `Append All Questions`
- **Edge cases / failures:**
  - Assumes every request is a `createItem` with a `choiceQuestion` with 4 options and `grading` present; if the LLM deviates, this code throws.
  - If options are fewer than 4, it fills missing with empty strings (safe for sheet, but indicates generation issue).
- **Version notes:** TypeVersion **2** (Code node v2 behavior for item returns).

#### Node: Append All Questions
- **Type / Role:** `n8n-nodes-base.googleSheets` — append rows to a sheet.
- **Configuration (interpreted):**
  - Operation: **Append**
  - Spreadsheet (Document ID): `1mpAObyL-Un8_369o1omQSzr415lyW3HxstODO41DHTQ`
  - Sheet tab (GID/list value): `1003708851` (named “Quiz Form” in cached result)
  - Columns mapped:
    - Question ← `{{$json.question}}`
    - Option1..4 ← `{{$json.option1}}` etc.
    - Correct_answer ← `{{$json.correct_answer}}`
    - Quiz Url ← `{{$json.quiz_url}}`
  - Type conversion disabled (values appended as-is)
- **Credentials:**
  - Uses Google Sheets OAuth2 (via Google node credential selection in n8n UI).
- **Connections:**
  - Terminal node (no outgoing connections).
- **Edge cases / failures:**
  - Spreadsheet permission issues (403).
  - Sheet/tab mismatch or renamed columns causing mapping issues.
  - Rate limits on Sheets API for large batches.
- **Version notes:** TypeVersion **4.7**.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Workflow Overview | Sticky Note | Documentation / operator guidance | — | — | ## How it works / Setup steps (as written in note) |
| Sticky Note | Sticky Note | Link reference to Google Sheet | — | — | ## Google sheet  \nhttps://docs.google.com/spreadsheets/d/1mpAObyL-Un8_369o1omQSzr415lyW3HxstODO41DHTQ/edit?usp=sharing |
| Input Section | Sticky Note | Section label | — | — | ## Input Section  \nForm trigger accepts PDF uploads and question count from users |
| AI Processing Section | Sticky Note | Section label | — | — | ## AI Processing Section  \nExtracts PDF text and uses OpenAI to generate structured quiz questions with answers |
| Form Creation Section | Sticky Note | Section label | — | — | ## Form Creation Section  \nBuilds Google Form with quiz mode, adds AI-generated questions and student info fields |
| Output Section | Sticky Note | Section label | — | — | ## Output Section  \nFormats and logs all questions with answers to Google Sheets for tracking |
| On form submission | Form Trigger | Entry point: collect PDF + question count | — | Extract from File | ## Input Section  \nForm trigger accepts PDF uploads and question count from users |
| Extract from File | Extract From File | Convert uploaded PDF to text | On form submission | Questions Generate | ## AI Processing Section  \nExtracts PDF text and uses OpenAI to generate structured quiz questions with answers |
| OpenAI Chat Model | LangChain Chat Model (OpenAI) | LLM provider for generation | — (AI connection) | Questions Generate (AI) | ## AI Processing Section  \nExtracts PDF text and uses OpenAI to generate structured quiz questions with answers |
| Structured Output Parser | LangChain Structured Output Parser | Enforce JSON structure for Forms API | — (AI connection) | Questions Generate (AI) | ## AI Processing Section  \nExtracts PDF text and uses OpenAI to generate structured quiz questions with answers |
| Questions Generate | LangChain LLM Chain | Generate Forms API batchUpdate requests (questions) | Extract from File; OpenAI Chat Model (AI); Structured Output Parser (AI) | Create Form | ## AI Processing Section  \nExtracts PDF text and uses OpenAI to generate structured quiz questions with answers |
| Create Form | HTTP Request | Create Google Form via Forms API | Questions Generate | Enable Quiz Mode | ## Form Creation Section  \nBuilds Google Form with quiz mode, adds AI-generated questions and student info fields |
| Enable Quiz Mode | HTTP Request | Turn on quiz mode via batchUpdate | Create Form | Add Questions | ## Form Creation Section  \nBuilds Google Form with quiz mode, adds AI-generated questions and student info fields |
| Add Questions | HTTP Request | Insert AI-generated questions via batchUpdate | Enable Quiz Mode | Add Student Details | ## Form Creation Section  \nBuilds Google Form with quiz mode, adds AI-generated questions and student info fields |
| Add Student Details | HTTP Request | Insert student info section + fields | Add Questions | Set a Google Sheet Structure for all Questions | ## Form Creation Section  \nBuilds Google Form with quiz mode, adds AI-generated questions and student info fields |
| Set a Google Sheet Structure for all Questions | Code | Flatten questions to rows; add quiz URL | Add Student Details | Append All Questions | ## Output Section  \nFormats and logs all questions with answers to Google Sheets for tracking |
| Append All Questions | Google Sheets | Append rows to a spreadsheet | Set a Google Sheet Structure for all Questions | — | ## Output Section  \nFormats and logs all questions with answers to Google Sheets for tracking |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a new workflow** in n8n and name it: *Automate AI-powered quiz generation from PDFs with Google Forms*.

2. **Add Form Trigger node**
   - Node: **Form Trigger**
   - Form title: `PDF`
   - Add fields:
     - File field: label `PDF`, required, accept `.pdf`
     - Text field: label `How many questions would you like to have in the quiz?`, required, placeholder `e.g. 20`
   - This becomes the **entry node**.

3. **Add Extract From File node**
   - Node: **Extract From File**
   - Operation: **PDF**
   - Binary property name: `PDF`
   - Connect: **Form Trigger → Extract From File**

4. **Add OpenAI Chat Model node (LangChain)**
   - Node: **OpenAI Chat Model**
   - Model: `gpt-4o-mini`
   - Timeout: `500000` ms (or lower if you prefer)
   - Credentials: configure **OpenAI API** credential in n8n (API key).

5. **Add Structured Output Parser node (LangChain)**
   - Node: **Structured Output Parser**
   - Paste a schema/example matching Google Forms `batchUpdate` format (requests/createItem/questionItem/grading/choiceQuestion with 4 options).
   - This should mirror the workflow’s example so the output is a `{ "requests": [...] }` object.

6. **Add Questions Generate node (LangChain LLM Chain)**
   - Node: **LLM Chain** (LangChain)
   - Prompt: include extracted text and enforce structure. Key expressions:
     - PDF text: `{{ $json.text }}`
     - Question count: `{{ $('On form submission').item.json['How many questions would you like to have in the quiz?'] }}`
   - Enable output parser usage.
   - Connect:
     - **Extract From File → Questions Generate** (main)
     - **OpenAI Chat Model → Questions Generate** (AI language model connection)
     - **Structured Output Parser → Questions Generate** (AI output parser connection)

7. **Add HTTP Request node: Create Form**
   - Node: **HTTP Request**
   - Method: `POST`
   - URL: `https://forms.googleapis.com/v1/forms`
   - Authentication: **Predefined Credential Type → Google OAuth2 API**
   - Body (JSON):
     - `info.title`: `"My Quiz Form"`
     - `info.documentTitle`: `"Quiz Form"`
   - Google credential requirements:
     - OAuth client configured in n8n
     - Google Cloud project has **Google Forms API enabled**
     - Scopes sufficient for form creation/editing (commonly include Forms scopes).
   - Connect: **Questions Generate → Create Form**

8. **Add HTTP Request node: Enable Quiz Mode**
   - Method: `POST`
   - URL (expression):  
     `https://forms.googleapis.com/v1/forms/{{ $('Create Form').item.json.formId }}:batchUpdate`
   - Body (JSON): update settings to set `quizSettings.isQuiz` true with updateMask `quizSettings.isQuiz`
   - Auth: same Google OAuth2 API credential
   - Connect: **Create Form → Enable Quiz Mode**

9. **Add HTTP Request node: Add Questions**
   - Method: `POST`
   - URL (expression): same `:batchUpdate` using `formId`
   - Body (expression):  
     `{{ $('Questions Generate').item.json.output }}`
   - Auth: Google OAuth2 API
   - Connect: **Enable Quiz Mode → Add Questions**

10. **Add HTTP Request node: Add Student Details**
    - Method: `POST`
    - URL (expression): same `:batchUpdate` using `formId`
    - Body: create items at indices 0–5:
      - Page break “Student Information”
      - Required text questions: Full Name, Email Address, Student ID, Class/Grade
      - Page break “Quiz Questions”
    - Auth: Google OAuth2 API
    - Connect: **Add Questions → Add Student Details**

11. **Add Code node: Set a Google Sheet Structure for all Questions**
    - Node: **Code**
    - Logic:
      - Read `requests` array from `Questions Generate` output
      - Extract question/options/correct answer
      - Add `responderUri` (quiz URL) from `Create Form` only to the first row
      - Return one item per question for Sheets append
    - Connect: **Add Student Details → Code**

12. **Add Google Sheets node: Append All Questions**
    - Node: **Google Sheets**
    - Operation: **Append**
    - Credentials: Google Sheets OAuth2
    - Select Spreadsheet + Sheet tab
    - Define columns:
      - `Question`, `Option1..4`, `Correct_answer`, `Quiz Url`
    - Map each to the Code output fields (`{{$json.question}}`, etc.)
    - Connect: **Code → Google Sheets**

13. **Run a test**
    - Open the Form Trigger test URL, upload a PDF, set a question count, submit.
    - Verify:
      - Google Form created and quiz mode enabled
      - Student info section appears before questions
      - Sheet appended with question rows and quiz URL on first row

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| Google sheet link used by the workflow | https://docs.google.com/spreadsheets/d/1mpAObyL-Un8_369o1omQSzr415lyW3HxstODO41DHTQ/edit?usp=sharing |
| Setup guidance (credentials + sheet configuration) | Included in the “Workflow Overview” sticky note inside the workflow canvas |
| Key dependency: Google Forms API must be enabled in the Google Cloud project used by OAuth | Applies to all HTTP Request nodes calling `forms.googleapis.com` |