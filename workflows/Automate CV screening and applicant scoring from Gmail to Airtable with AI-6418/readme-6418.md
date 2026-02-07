Automate CV screening and applicant scoring from Gmail to Airtable with AI

https://n8nworkflows.xyz/workflows/automate-cv-screening-and-applicant-scoring-from-gmail-to-airtable-with-ai-6418


# Automate CV screening and applicant scoring from Gmail to Airtable with AI

### 1. Workflow Overview

This workflow automates the process of screening job applications received via Gmail and scores applicants against job requirements stored in Airtable using AI models (Google Gemini). It extracts relevant applicant information from attached CVs, matches the applicant to a job posting by job code, scores the applicant’s fit, and logs the structured data and scores into Airtable.

Logical blocks with key roles and node dependencies:

- **1.1 Input Reception**  
  Watches Gmail inbox for new emails with CV attachments.

- **1.2 Job Identification**  
  Extracts a job code from the email subject and looks up the corresponding job posting in Airtable.

- **1.3 CV Content Extraction**  
  Extracts text from PDF CV attachments.

- **1.4 AI CV Parsing**  
  Uses Google Gemini AI to extract structured applicant data from the CV text.

- **1.5 Data Merging**  
  Combines job posting data and parsed CV data into a single dataset.

- **1.6 AI Applicant Scoring**  
  Uses Google Gemini AI to score the applicant’s fit to the job and generate a brief reasoning summary.

- **1.7 Data Persistence**  
  Saves the scored applicant data and notes into Airtable’s Applications table.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  Listens for new Gmail messages with attachments (CVs) and downloads those attachments for processing.

- **Nodes Involved:**  
  - Watch for New Applications

- **Node Details:**  
  - **Watch for New Applications**  
    - Type: Gmail Trigger  
    - Configuration: Filters for emails containing attachments/documents (`has:attachment OR has:document`), downloads attachments using prefix `CV_`. Polls every minute.  
    - Inputs: None (trigger node)  
    - Outputs: Email data with attachments saved in binary under keys like `CV_0`  
    - Potential Failures: Gmail OAuth2 authentication issues, API rate limits, no new emails found, attachment download errors.

---

#### 1.2 Job Identification

- **Overview:**  
  Extracts a job code from the email subject using regex, then queries Airtable to find detailed job post data matching that code.

- **Nodes Involved:**  
  - Extract Job Code  
  - Find Job Post

- **Node Details:**  
  - **Extract Job Code**  
    - Type: Set Node  
    - Configuration: Uses regex `([A-Z]{2}-\d{3})` on email subject to extract job code into a field named `Job Code`.  
    - Inputs: Email JSON from Gmail trigger  
    - Outputs: Email JSON plus added `Job Code` field  
    - Edge Cases: No match found (sets `Job Code` null), malformed subject lines, regex errors.

  - **Find Job Post**  
    - Type: Airtable Node  
    - Configuration: Searches Airtable “Job Posts” table for record where `{Job Code}` equals extracted job code.  
    - Inputs: Output from Extract Job Code  
    - Outputs: Job post data (e.g., Job Title, Required Skills, Experience, Description)  
    - Potential Failures: Airtable API auth errors, no matching job found (empty result), connection timeout.

---

#### 1.3 CV Content Extraction

- **Overview:**  
  Extracts raw text from the attached CV PDF to prepare for AI parsing.

- **Nodes Involved:**  
  - Read CV (PDF) Text

- **Node Details:**  
  - **Read CV (PDF) Text**  
    - Type: Extract From File  
    - Configuration: Extract text from binary PDF attachment named `CV_0`.  
    - Inputs: Binary attachment from Gmail trigger  
    - Outputs: JSON with extracted text key `text`  
    - Edge Cases: Corrupted or non-PDF attachments, empty text extraction, unsupported file formats.

---

#### 1.4 AI CV Parsing

- **Overview:**  
  Uses Google Gemini AI to parse extracted CV text and email subject, extracting structured applicant data such as name, email, skills, experience, etc.

- **Nodes Involved:**  
  - AI CV Parser  
  - Google Gemini Chat Model

- **Node Details:**  
  - **Google Gemini Chat Model**  
    - Type: AI Language Model (Google Gemini)  
    - Configuration: Uses the model `models/gemini-2.5-flash-preview-04-17` with credentials linked to Google Palm API.  
    - Inputs: Prompt and system instructions from AI CV Parser node  
    - Outputs: AI-generated text (structured JSON)  
    - Edge Cases: API quota limits, latency, malformed prompts, unexpected AI responses.

  - **AI CV Parser**  
    - Type: LangChain Information Extractor  
    - Configuration: Sends a system prompt instructing the AI to extract specified fields only (job_code, name, email, phone, etc.) from CV text and email subject. Returns structured JSON only.  
    - Inputs: Extracted CV text, email subject  
    - Outputs: Parsed applicant JSON data  
    - Edge Cases: Ambiguous CV content, missing fields, AI parsing errors, JSON parse failures.

---

#### 1.5 Data Merging

- **Overview:**  
  Combines the job posting data from Airtable and the structured applicant data from AI parsing for scoring.

- **Nodes Involved:**  
  - Combine Job & CV Data

- **Node Details:**  
  - **Combine Job & CV Data**  
    - Type: Merge Node  
    - Configuration: Combines two inputs by matching fields: `Job Code` from job data and `output.job_code` from applicant data.  
    - Inputs: Job post data (primary), parsed CV data (secondary)  
    - Outputs: Merged JSON containing both job and applicant details  
    - Edge Cases: No matching job code, missing fields, merge conflicts.

---

#### 1.6 AI Applicant Scoring

- **Overview:**  
  Uses Google Gemini AI to evaluate how well the applicant fits the job requirements and returns a score (1–100) with a brief summary in Bahasa Indonesia.

- **Nodes Involved:**  
  - AI Applicant Scorer  
  - Google Gemini Chat Model1  
  - Structured Output Parser

- **Node Details:**  
  - **Google Gemini Chat Model1**  
    - Type: AI Language Model (Google Gemini)  
    - Configuration: Same model as earlier, used for scoring. Credentials reused.  
    - Inputs: Prompt from AI Applicant Scorer node including merged job and applicant data.  
    - Outputs: Raw AI response JSON string.  
    - Edge Cases: AI response format errors, API failures.

  - **AI Applicant Scorer**  
    - Type: LangChain Chain LLM (Prompt Definition)  
    - Configuration: Defines a prompt instructing the AI to score the applicant and return JSON with `score` (1–100) and `fit_summary` (max 2 sentences in Bahasa Indonesia). Uses the combined data.  
    - Inputs: Merged job and applicant data  
    - Outputs: Raw AI output (to be parsed)  
    - Edge Cases: Missing input data, prompt generation errors.

  - **Structured Output Parser**  
    - Type: LangChain Structured Output Parser  
    - Configuration: Parses AI JSON output to extract `score` and `fit_summary` fields.  
    - Inputs: AI raw output from Gemini Chat Model1  
    - Outputs: Parsed structured data for further use  
    - Edge Cases: Malformed or unexpected AI output, JSON parse errors.

---

#### 1.7 Data Persistence

- **Overview:**  
  Saves the applicant’s structured data, score, and notes into the Airtable “Applications” table for record keeping and further processing.

- **Nodes Involved:**  
  - Save Applicant

- **Node Details:**  
  - **Save Applicant**  
    - Type: Airtable Node  
    - Configuration: Creates a new record in the “Applications” table including fields: Applicant Name, Email, Score, Notes (fit summary), linked Job Post, Years of Experience (default 0), etc.  
    - Inputs: Output from Structured Output Parser with scoring data and merged applicant/job data  
    - Outputs: Confirmation of record creation  
    - Edge Cases: Airtable API errors, missing mandatory fields, data type mismatches.

---

### 3. Summary Table

| Node Name              | Node Type                           | Functional Role                      | Input Node(s)              | Output Node(s)            | Sticky Note                                                                                     |
|------------------------|-----------------------------------|------------------------------------|----------------------------|---------------------------|------------------------------------------------------------------------------------------------|
| Watch for New Applications | Gmail Trigger                    | Triggers workflow on new emails with attachments | None                       | Extract Job Code, Read CV (PDF) Text | ## Watches for email with attachments                                                           |
| Extract Job Code        | Set Node                          | Extracts job code from email subject | Watch for New Applications | Find Job Post              | ## Fetch the Job Post In Airtable Uses Regex to find a code like FN-001 in the email subject and use it to find the Job Post in Airtable |
| Find Job Post           | Airtable                         | Finds job posting by extracted job code | Extract Job Code           | Combine Job & CV Data      | ## Fetch the Job Post In Airtable Uses Regex to find a code like FN-001 in the email subject and use it to find the Job Post in Airtable |
| Read CV (PDF) Text      | Extract From File                 | Extracts text from CV PDF attachment | Watch for New Applications | AI CV Parser              | ## Extract and Parse the CV Information Gemini AI reads the CV text and extracts key info (name, skills, etc.) into structured JSON.       |
| AI CV Parser            | LangChain Information Extractor  | Parses CV text with AI to structured applicant data | Read CV (PDF) Text          | Combine Job & CV Data      | ## Extract and Parse the CV Information Gemini AI reads the CV text and extracts key info (name, skills, etc.) into structured JSON.       |
| Combine Job & CV Data   | Merge Node                      | Combines job posting and applicant data | Find Job Post, AI CV Parser | AI Applicant Scorer       |                                                                                                |
| AI Applicant Scorer     | LangChain Chain LLM              | Scores applicant fit and returns summary | Combine Job & CV Data       | Save Applicant            | ## Score Applicant with AI Compares the CV to the job details and generates a score (1-100) and a summary.                                |
| Google Gemini Chat Model | AI Language Model (Google Gemini) | Provides language model for CV parsing | AI CV Parser (ai_languageModel) | AI CV Parser (ai_languageModel) |                                                                                                |
| Google Gemini Chat Model1 | AI Language Model (Google Gemini) | Provides language model for applicant scoring | AI Applicant Scorer (ai_languageModel) | AI Applicant Scorer (ai_languageModel) |                                                                                                |
| Structured Output Parser | LangChain Structured Output Parser | Parses AI JSON score output          | Google Gemini Chat Model1 (ai_outputParser) | AI Applicant Scorer (ai_outputParser) |                                                                                                |
| Save Applicant          | Airtable                         | Saves applicant data and AI scores into Airtable | AI Applicant Scorer         | None                      |                                                                                                |
| Sticky Note1            | Sticky Note                     | Overview and setup instructions      | None                       | None                      | ## Automate CV Screening and Applicant Scoring from Gmail to Airtable with AI This workflow automates the CV screening process using AI. It monitors a Gmail inbox for incoming applications, extracts and scores CVs based on job requirements stored in Airtable, and logs structured applicant data—saving hours of manual work. |
| Sticky Note             | Sticky Note                     | Notes for Gmail trigger              | None                       | None                      | ## Watches for email with attachments                                                           |
| Sticky Note2            | Sticky Note                     | Notes for job post lookup            | None                       | None                      | ## Fetch the Job Post In Airtable Uses Regex to find a code like FN-001 in the email subject and use it to find the Job Post in Airtable |
| Sticky Note3            | Sticky Note                     | Notes for CV parsing                 | None                       | None                      | ## Extract and Parse the CV Information Gemini AI reads the CV text and extracts key info (name, skills, etc.) into structured JSON.       |
| Sticky Note4            | Sticky Note                     | Notes for applicant scoring          | None                       | None                      | ## Score Applicant with AI Compares the CV to the job details and generates a score (1-100) and a summary.                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger Node:**  
   - Type: Gmail Trigger  
   - Configure OAuth2 credentials for Gmail  
   - Set filter query: `has:attachment OR has:document`  
   - Enable attachment download with prefix `CV_`  
   - Set polling interval to every minute  

2. **Add Set Node to Extract Job Code:**  
   - Type: Set  
   - Use expression on `{{$json["subject"]}}` with regex `/([A-Z]{2}-\d{3})/` to extract job code  
   - Assign to field named `Job Code`  
   - Include all other fields from input  

3. **Add Airtable Node to Find Job Post:**  
   - Type: Airtable  
   - Configure Airtable API credentials  
   - Select base and table for Job Posts  
   - Operation: Search  
   - Filter formula: `={Job Code} = '{{ $json["Job Code"] }}'`  

4. **Add Extract From File Node to Read CV Text:**  
   - Type: Extract From File  
   - Operation: PDF  
   - Set binary property name to `CV_0` (matching attachment key)  

5. **Add LangChain Information Extractor Node for AI CV Parsing:**  
   - Type: LangChain Information Extractor  
   - Configure Google Gemini Chat Model node for AI model: `models/gemini-2.5-flash-preview-04-17` with Google Palm API credentials  
   - Use system prompt to extract structured JSON fields from CV text and email subject (job_code, name, email, phone, etc.)  
   - Input text: CV text + email subject embedded in prompt  

6. **Add Merge Node to Combine Job & CV Data:**  
   - Type: Merge  
   - Mode: Combine  
   - Merge by fields: `Job Code` (Job Post) and `output.job_code` (CV Parsing output)  

7. **Add LangChain Chain LLM Node for Applicant Scoring:**  
   - Type: Chain LLM  
   - Configure Google Gemini Chat Model1 node (same model and credentials)  
   - Prompt: Provide job post details and applicant CV info, ask for score (1-100) and fit summary in Bahasa Indonesia only, output JSON with keys `score` and `fit_summary`  
   - Enable structured output parser  

8. **Add Structured Output Parser Node:**  
   - Type: LangChain Structured Output Parser  
   - Configure JSON schema example with `score` (number) and `fit_summary` (string)  
   - Connect to output of Google Gemini Chat Model1  

9. **Add Airtable Node to Save Applicant:**  
   - Type: Airtable  
   - Select Applications table  
   - Operation: Create  
   - Map fields: Applicant Name, Email, Score, Notes (fit_summary), linked Job Post (by Job Code), Years of Experience (default 0 if missing)  
   - Use API credentials  

10. **Connect Nodes:**  
    - Gmail Trigger → Extract Job Code and Read CV (PDF) Text  
    - Extract Job Code → Find Job Post  
    - Find Job Post and AI CV Parser → Combine Job & CV Data  
    - Combine Job & CV Data → AI Applicant Scorer  
    - AI Applicant Scorer → Save Applicant  

11. **Add Sticky Notes for documentation (optional):**  
    - Add notes describing each block and setup instructions  

12. **Activate the Workflow:**  
    - Test with sample emails containing CV attachments  
    - Verify extraction, scoring, and Airtable record creation  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Context or Link                                                                                                 |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| This workflow automates CV screening and scoring using AI, reducing manual HR effort. It relies on Gmail for input, Airtable for job/applicant data storage, and Google Gemini AI models for natural language understanding and scoring.                                                                                                                                                                                                                                                     | Workflow description from Sticky Note1                                                                         |
| Setup requires Airtable bases with two tables: Job Posts (with Job Code, Title, Skills, Experience, Description) and Applications (with Applicant Name, Email, Score, Notes, linked Job Post).                                                                                                                                                                                                                                                                                                   | Setup instructions from Sticky Note1                                                                           |
| Gmail credentials must have OAuth2 access and permission to read emails and download attachments.                                                                                                                                                                                                                                                                                                                                                                                           | Credential note                                                                                                 |
| Google Gemini AI requires Google Palm API credentials set up in n8n; model version used is `models/gemini-2.5-flash-preview-04-17`.                                                                                                                                                                                                                                                                                                                                                           | AI model credential note                                                                                        |
| Airtable token API credentials must have read/write permissions on the relevant base and tables.                                                                                                                                                                                                                                                                                                                                                                                             | Airtable credential note                                                                                        |
| Regex used to extract job code assumes format like `FN-001` (two uppercase letters, hyphen, three digits) in email subject. Adjust regex if job codes vary.                                                                                                                                                                                                                                                                                                                                 | Regex note from Extract Job Code node                                                                           |
| AI prompts are carefully designed to limit output to structured JSON only, minimizing parsing errors. However, malformed CVs or unusual content may cause parsing or scoring inaccuracies.                                                                                                                                                                                                                                                                                                    | AI prompt design note                                                                                           |
| Score is generated in Bahasa Indonesia for local context; adjust prompt language if targeting other markets.                                                                                                                                                                                                                                                                                                                                                                                  | Language note from AI Applicant Scorer node                                                                    |

---

**Disclaimer:** The provided text is derived exclusively from an automated workflow created with n8n, an integration and automation tool. This process strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.