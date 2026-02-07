Automate Resume Screening with Gmail, Gemini AI, and Airtable to Google Sheets

https://n8nworkflows.xyz/workflows/automate-resume-screening-with-gmail--gemini-ai--and-airtable-to-google-sheets-7469


# Automate Resume Screening with Gmail, Gemini AI, and Airtable to Google Sheets

---
### 1. Workflow Overview

This workflow, named **ResumeRadar**, automates the resume screening process by integrating Gmail, Airtable, Google Drive, Google Sheets, and Gemini AI (Google’s generative language model). It targets recruitment teams or HR automation scenarios to efficiently process incoming job applications received via email with PDF attachments, match candidates to job listings, evaluate resumes with AI, and store structured results for review.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Monitor Gmail inbox for emails with attachments (resumes).
- **1.2 Job Matching:** Extract job titles from email subjects and find matching job listings from Airtable.
- **1.3 Resume Preparation:** Filter and process resume attachments, extracting sender info and preparing files.
- **1.4 AI Prompt Construction:** Build a detailed prompt combining job metadata and email content for Gemini AI.
- **1.5 Gemini API Interaction:** Upload resume files, send structured prompt to Gemini AI, and receive evaluation.
- **1.6 Data Aggregation:** Combine AI results with metadata, parse response, and prepare final data.
- **1.7 Storage and Output:** Save resumes to Google Drive and append candidate evaluation data to Google Sheets.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** Watches Gmail inbox continuously for new emails containing attachments, downloads those attachments for processing.
- **Nodes Involved:** Gmail Trigger, Airtable, Merge1

**Node Details:**

- **Gmail Trigger**
  - Type: Trigger node for Gmail
  - Configuration: Polls every minute for emails with any attachments (`q: has:attachment`), downloads attachments.
  - Credentials: Gmail OAuth2
  - Input/Output: No input; outputs email data including attachments.
  - Potential Failures: OAuth token expiration, Gmail API rate limits.
  
- **Airtable**
  - Type: Database search node
  - Role: Searches Airtable “Job Descriptions” table with job listings (for later matching).
  - Credentials: Airtable Personal Access Token
  - Input: Triggered by Gmail Trigger output (email data)
  - Output: Job listings data for matching.
  - Edge Cases: Empty or inconsistent Airtable data.
  
- **Merge1**
  - Type: Merge node
  - Role: Joins Gmail Trigger output with subsequent Resume Preparation output to synchronize data flow.
  - Inputs: Two inputs connected (from Gmail Trigger and ReadyAttachment downstream).
  - Output: Feeds into Resume Preparation block.

---

#### 2.2 Job Matching

- **Overview:** Extracts job titles from email subjects using regex-based heuristics and fuzzy matching against Airtable job listings to identify relevant job openings.
- **Nodes Involved:** EmailMatcher, If

**Node Details:**

- **EmailMatcher**
  - Type: Code node (JavaScript)
  - Role: Extracts job title keywords from email subject lines using regex patterns and smart similarity scoring (combining Jaccard and Levenshtein distance).
  - Key Config: MIN_SCORE threshold at 0.60 for match confidence.
  - Inputs: Airtable job listings and Gmail email data.
  - Outputs: JSON with match results, matched job metadata if found, or failure reason.
  - Edge Cases: No extractable job title, low confidence matches, empty email subjects.
  
- **If**
  - Type: Conditional node
  - Role: Routes workflow depending on whether a job match was found.
  - Input: Output from EmailMatcher.
  - Outputs: True branch (job match found) proceeds to PromptBuilder; False branch halts or skips further steps.

---

#### 2.3 Resume Preparation

- **Overview:** Filters attachments to only process PDF resumes, extracts sender information like email and name, and prepares files for AI processing.
- **Nodes Involved:** ReadyAttachment, Merge

**Node Details:**

- **ReadyAttachment**
  - Type: Code node
  - Role: Filters attachments to allow only PDFs (configurable ALLOWED set), extracts sender email and name, timestamps, and prepares binary data.
  - Key Logic: Extract sender from headers, prefer internalDate for timestamp, validate attachment MIME type.
  - Outputs: Items with filtered binary resume data and metadata.
  - Edge Cases: Non-PDF attachments filtered out, missing sender info, malformed emails.
  
- **Merge**
  - Type: Merge node
  - Role: Combines outputs from PromptBuilder (AI prompt) and FileUpload nodes (uploaded resume file metadata).
  - Inputs: Two inputs, merges to feed Gemini API request builder.
  
---

#### 2.4 AI Prompt Construction

- **Overview:** Constructs a structured prompt for Gemini AI including the resume text (from email), job metadata, and instructions for scoring and extracting candidate info.
- **Nodes Involved:** PromptBuilder

**Node Details:**

- **PromptBuilder**
  - Type: Code node
  - Role: Builds a detailed prompt string incorporating email subject, email body, job title, job code, description, skills, experience, and location.
  - Logic: Strips HTML from email body, chooses best available subject and body text, limits prompt size to 5000 characters.
  - Output: JSON object with `prompt` string and job metadata.
  - Edge Cases: Missing email body or subject handled gracefully by fallbacks.
  - Sticky Note: Explains prompt purpose and customization options.
  
---

#### 2.5 Gemini API Interaction

- **Overview:** Uploads resume file to Gemini API, sends the prompt and file for content generation, and receives structured JSON output with candidate score and details.
- **Nodes Involved:** FileUpload, PayloadBuilder, ResponseGenerator

**Node Details:**

- **FileUpload**
  - Type: HTTP Request node
  - Role: Uploads the resume binary data to Gemini API `/upload/v1beta/files` endpoint with appropriate headers.
  - Configuration: Uses environment variable for Gemini API key, sets Content-Type according to attachment MIME type.
  - Edge Cases: Upload failures, invalid API key, network issues.
  
- **PayloadBuilder**
  - Type: Code node
  - Role: Constructs the request body for the Gemini content generation API, combining prompt, email body, job metadata, and file URI.
  - Key Config: Sets temperature to 0.1 for deterministic behavior, defines strict JSON response schema.
  - Inputs: Merged data from PromptBuilder and FileUpload nodes.
  - Edge Cases: Missing file URI, malformed prompt JSON.
  - Sticky Note: Describes the payload construction and configuration.
  
- **ResponseGenerator**
  - Type: HTTP Request node
  - Role: Sends the content generation request to Gemini API model `gemini-2.0-flash:generateContent`, including API key in query.
  - Output: Raw JSON response from Gemini AI.
  - Edge Cases: API errors, timeout, invalid response.
  
---

#### 2.6 Data Aggregation

- **Overview:** Combines and parses the Gemini AI response, normalizes candidate phone number, and constructs the final structured data item.
- **Nodes Involved:** CombineData, ParseResponse

**Node Details:**

- **CombineData**
  - Type: Merge node
  - Role: Combines multiple inputs from FileUpload, ResponseGenerator, Google Drive, and PromptBuilder nodes to synchronize data.
  - Configuration: Combines by position expecting 4 inputs.
  
- **ParseResponse**
  - Type: Code node
  - Role: Parses Gemini response JSON, extracts candidate name, phone, AI score, explanation, and resume link, normalizes phone to digits only.
  - Outputs: Structured JSON ready for storage.
  - Edge Cases: Invalid JSON from AI, missing fields.
  
---

#### 2.7 Storage and Output

- **Overview:** Saves the resume files to Google Drive with a naming convention based on sender and timestamp, and appends candidate evaluation data to Google Sheets.
- **Nodes Involved:** Google Drive, Google Sheets

**Node Details:**

- **Google Drive**
  - Type: Google Drive node
  - Role: Uploads resume files to a specified Drive folder with a dynamic filename based on sender email prefix and date/time.
  - Credentials: Google Drive OAuth2
  - Inputs: Filtered resume binary files and metadata.
  - Edge Cases: API quota, folder permission errors.
  
- **Google Sheets**
  - Type: Google Sheets node
  - Role: Appends parsed candidate data (name, email, phone, AI score, explanation, resume link, job title) as a new row into a specified Google Sheet.
  - Credentials: Google Sheets OAuth2
  - Configuration: Defines columns explicitly with mapping expressions.
  - Edge Cases: Sheet access issues, data type mismatches.

---

### 3. Summary Table

| Node Name       | Node Type           | Functional Role               | Input Node(s)             | Output Node(s)           | Sticky Note                                                                                                    |
|-----------------|---------------------|------------------------------|---------------------------|--------------------------|---------------------------------------------------------------------------------------------------------------|
| Gmail Trigger   | gmailTrigger        | Monitors Gmail for emails with attachments | None                      | Airtable, Merge1          | Explains overall workflow purpose and setup requirements                                                     |
| Airtable        | airtable            | Fetches job listings for matching | Gmail Trigger             | EmailMatcher              |                                                                                                               |
| EmailMatcher    | code                | Extracts job title, matches jobs | Airtable                  | If                       | Details job matching logic, regex and similarity scoring                                                      |
| If              | if                  | Checks if job match found      | EmailMatcher              | Merge1, PromptBuilder     |                                                                                                               |
| Merge1          | merge               | Joins data streams             | Gmail Trigger, ReadyAttachment | ReadyAttachment         |                                                                                                               |
| ReadyAttachment | code                | Filters valid resume PDFs, extracts sender info | Merge1                    | FileUpload, Google Drive, CombineData | Discusses accepted formats and sender extraction                                                             |
| PromptBuilder   | code                | Builds AI prompt with job and email info | If (true branch)          | Merge                     | Describes AI prompt construction and customization                                                           |
| Merge           | merge               | Combines prompt and file upload data | PromptBuilder, FileUpload | PayloadBuilder            |                                                                                                               |
| FileUpload      | httpRequest         | Uploads resume file to Gemini API | ReadyAttachment           | Merge                     |                                                                                                               |
| PayloadBuilder  | code                | Builds Gemini API request payload | Merge                     | ResponseGenerator         | Explains Gemini request payload and response schema                                                           |
| ResponseGenerator | httpRequest       | Sends prompt and file to Gemini API | PayloadBuilder            | CombineData               |                                                                                                               |
| CombineData     | merge               | Combines results from various nodes | ReadyAttachment, ResponseGenerator, Google Drive, PromptBuilder | ParseResponse             |                                                                                                               |
| ParseResponse   | code                | Parses Gemini AI response, normalizes data | CombineData               | Google Sheets             |                                                                                                               |
| Google Drive    | googleDrive         | Saves resumes to Drive folder  | ReadyAttachment           | CombineData               |                                                                                                               |
| Google Sheets   | googleSheets        | Appends candidate data to spreadsheet | ParseResponse             | None                     |                                                                                                               |
| Sticky Note     | stickyNote          | Documentation note             | None                      | None                     | Overview of workflow and setup instructions                                                                   |
| Sticky Note1    | stickyNote          | Documentation note             | None                      | None                     | Job Matching Logic explanation                                                                                 |
| Sticky Note2    | stickyNote          | Documentation note             | None                      | None                     | Resume processing and allowed formats                                                                          |
| Sticky Note3    | stickyNote          | Documentation note             | None                      | None                     | AI Prompt explanation                                                                                           |
| Sticky Note4    | stickyNote          | Documentation note             | None                      | None                     | Gemini API request builder details                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n and name it appropriately (e.g., "ResumeRadar").**

2. **Add a Gmail Trigger node:**
   - Set it to poll every minute.
   - Filter emails with query `has:attachment`.
   - Enable attachment download.
   - Configure Gmail OAuth2 credentials.

3. **Add an Airtable node:**
   - Operation: Search.
   - Connect Gmail Trigger output to Airtable input.
   - Select your Airtable base and the "Job Descriptions" table.
   - Configure Airtable credentials (Personal Access Token).

4. **Add a Code node named EmailMatcher:**
   - Connect Airtable output to this node.
   - Paste the JavaScript code that extracts job titles from email subjects and matches against Airtable listings using regex and similarity measures.
   - Adjust the `MIN_SCORE` constant if needed.

5. **Add an If node:**
   - Connect EmailMatcher output to If.
   - Condition: Check if `matchFound` field is true.
   - True branch proceeds to next steps; False branch can be left unconnected or used for logging.

6. **Add a Merge node (Merge1):**
   - Connect Gmail Trigger output and the output of the downstream node ReadyAttachment (to be created) to this node.
   - Set mode to default (append).

7. **Add a Code node named ReadyAttachment:**
   - Connect Merge1 output to this node.
   - Insert the JavaScript code that filters PDF attachments, extracts sender email/name, timestamps, and prepares binary data.
   - Modify the ALLOWED set if you want to support other file types.

8. **Add an HTTP Request node named FileUpload:**
   - Connect ReadyAttachment output.
   - Method: POST.
   - URL: `https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=media`
   - Set content type to binaryData.
   - Add header `x-goog-api-key` with your Gemini API key (stored in environment variables).
   - Pass binary data property `data`.

9. **Add a Code node named PromptBuilder:**
   - Connect If node (true branch) output here.
   - Paste the code that builds the Gemini AI prompt using email subject, body, and matched job metadata.
   - Ensure it extracts and strips HTML from email bodies and limits prompt length.

10. **Add a Merge node:**
    - Connect PromptBuilder and FileUpload outputs to this merge node.

11. **Add a Code node named PayloadBuilder:**
    - Connect Merge output.
    - Paste the code that builds the request payload for Gemini AI content generation, combining prompt, job metadata, and file URI.
    - Set temperature to 0.1 and define strict JSON response schema.

12. **Add an HTTP Request node named ResponseGenerator:**
    - Connect PayloadBuilder output.
    - Method: POST.
    - URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
    - Body type: JSON, pass `body` from previous node.
    - Query parameter `key` uses Gemini API key from environment.
    - Header `Content-Type: application/json`.

13. **Add a Google Drive node:**
    - Connect ReadyAttachment output.
    - Configure to upload file to your Drive folder.
    - Use dynamic file naming based on sender email prefix and timestamp.
    - Configure Google Drive OAuth2 credentials.

14. **Add a Merge node named CombineData:**
    - Connect outputs from ReadyAttachment, ResponseGenerator, Google Drive, and PromptBuilder nodes.
    - Set mode to "combine" by position, expecting 4 inputs.

15. **Add a Code node named ParseResponse:**
    - Connect CombineData output.
    - Paste code that parses Gemini JSON response, normalizes phone numbers, and builds structured output with candidate info and resume links.

16. **Add a Google Sheets node:**
    - Connect ParseResponse output.
    - Operation: Append.
    - Configure the target Google Sheet document and sheet tab.
    - Map columns: Job Title, Candidate Name, Email, Contact, Resume (as hyperlink), AI Score, AI Explanation.
    - Configure Google Sheets OAuth2 credentials.

17. **(Optional) Add Sticky Note nodes for internal documentation:**
    - Add notes for workflow overview, job matching logic, resume processing, AI prompt, and Gemini API payload as per your team needs.

18. **Save the workflow and execute test runs with emails containing PDF resumes.**

---

### 5. General Notes & Resources

| Note Content                                                                                                         | Context or Link                                                                                      |
|----------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| This workflow automates resume screening using Gmail, Airtable, Gemini AI, Google Drive, and Google Sheets.          | Overall project description                                                                          |
| Job matching uses regex and smart similarity (Jaccard + Levenshtein) with synonyms and stopwords to improve accuracy.| Sticky Note1 content                                                                                 |
| Currently only PDF attachments are processed; to add support for other formats, edit the ALLOWED set in ReadyAttachment node. | Sticky Note2 content                                                                                 |
| The AI prompt is carefully structured to instruct Gemini to extract candidate info and score fit on a 1-10 scale.    | Sticky Note3 content                                                                                 |
| Gemini API payload uses low temperature (0.1) for consistent results and strict JSON schema for parsing.             | Sticky Note4 content                                                                                 |
| Gemini API key must be stored in environment variable `GEMINI_API_KEY`.                                              | Environment configuration note                                                                       |
| Airtable must contain a "Job Descriptions" table with relevant fields: Job Title, Job Code, Description, Skills, etc.| Airtable setup requirement                                                                            |
| Google Drive folder and Google Sheet must be pre-configured with appropriate permissions for n8n OAuth2 credentials.| Google Drive and Sheets setup                                                                         |

---

**Disclaimer:**  
The text provided is derived exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.

---