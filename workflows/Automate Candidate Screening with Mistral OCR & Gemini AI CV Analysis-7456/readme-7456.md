Automate Candidate Screening with Mistral OCR & Gemini AI CV Analysis

https://n8nworkflows.xyz/workflows/automate-candidate-screening-with-mistral-ocr---gemini-ai-cv-analysis-7456


# Automate Candidate Screening with Mistral OCR & Gemini AI CV Analysis

### 1. Workflow Overview

This n8n workflow automates candidate screening by integrating form submissions, OCR text extraction, AI-powered CV evaluation, and data storage in Google Sheets. It targets recruitment teams aiming to streamline the initial hiring pipeline by automatically extracting text from uploaded CV PDFs, analyzing candidate qualifications against a specific job profile, and logging structured results for easy review and follow-up.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Captures candidate application data and CV file via a customizable web form.
- **1.2 Text Extraction:** Uses Mistral OCR to extract text content from the submitted CV PDF.
- **1.3 AI Processing:** Employs Google Gemini AI to analyze extracted CV text against defined job requirements and outputs a qualification score with explanation.
- **1.4 Data Logging and Update:** Logs candidate basic info immediately on form submission, then updates the Google Sheet with AI analysis results after evaluation.
- **1.5 Initialization and Setup:** Creates and configures the Google Sheets spreadsheet with appropriate columns before processing begins.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block collects candidate information and CV uploads via a secure, stylized web form. It triggers the workflow upon submission.

- **Nodes Involved:**  
  - Application Form (Form Trigger)

- **Node Details:**

  - **Application Form**  
    - Type: Form Trigger  
    - Role: Receives candidate data (Full Name, Email) and CV PDF file upload from users.  
    - Configuration:  
      - Webhook path set for unique form access.  
      - Custom dark theme CSS for styling.  
      - Fields: Full Name (required), Email (required), Upload CV (PDF, required).  
      - Response mode configured to return last node’s output.  
    - Inputs: External HTTP form submission  
    - Outputs: Emits JSON with form data and binary file data (CV PDF)  
    - Edge Cases:  
      - Form submission without required fields will be blocked by UI validation.  
      - File upload type restriction (.pdf) enforced to avoid incompatible inputs.  
    - Sticky Note Reference:  
      - "💡 Later, activate this workflow and share the public form URL to let candidates share their CV!"  
    - Integration Issues:  
      - Requires public webhook exposure and proper SSL configuration for secure form usage.

#### 2.2 Text Extraction

- **Overview:**  
  Extracts textual content from the uploaded CV PDF using Mistral OCR service for accurate downstream AI analysis.

- **Nodes Involved:**  
  - Extract CV Text (Mistral AI Node)  
  - Log Candidate Submission (Google Sheets Append)

- **Node Details:**

  - **Extract CV Text**  
    - Type: Mistral AI OCR Node  
    - Role: Converts binary PDF data into raw text from candidate CVs.  
    - Configuration:  
      - Binary property configured dynamically to the uploaded file from the form node.  
      - Uses Mistral Cloud API credentials for authentication.  
    - Inputs: Binary PDF from Application Form node  
    - Outputs: JSON with extracted text of CV  
    - Version Requirements: Mistral API key setup required  
    - Edge Cases:  
      - OCR failure due to unsupported file format or corrupted PDF.  
      - API timeout or rate limiting may cause extraction errors.  
    - Sticky Note Reference:  
      - "This uses **[Mistral OCR](https://mistral.ai/fr/news/mistral-ocr)**, it extracts the text perfectly from a candidate's CV (PDF)."  
      - "**[Get your Mistral API key here](https://console.mistral.ai/api-keys)**"  

  - **Log Candidate Submission**  
    - Type: Google Sheets — Append Operation  
    - Role: Immediately logs candidate’s Full Name and Email upon form submission to ensure data persistence even if later steps fail.  
    - Configuration:  
      - Appends to the "CVs" Google Sheet on sheet "gid=0".  
      - Maps FullName and Email from form JSON to sheet columns.  
      - Uses OAuth2 credentials for Google Sheets access.  
    - Inputs: JSON data from Application Form  
    - Outputs: Confirmation of append operation  
    - Edge Cases:  
      - Google Sheets API quota or permission issues.  
      - Network errors causing failure to log data promptly.  
    - Sticky Note Reference:  
      - "Adds the applicant's name and email to the Google Sheet right after they submit the form to have it logged even if the workflow fails."

#### 2.3 AI Processing

- **Overview:**  
  Analyzes the extracted CV text against predefined job requirements for a Senior Frontend Developer role using Google Gemini AI, producing a structured qualification score and explanation.

- **Nodes Involved:**  
  - Gemini 2.5 Flash Lite (Google Gemini AI Node)  
  - JSON Output Parser (LangChain Structured Output Parser)  
  - AI Qualification (LangChain LLM Chain)

- **Node Details:**

  - **Gemini 2.5 Flash Lite**  
    - Type: LangChain Google Gemini Chat Model Node  
    - Role: Executes the AI language model prompt to evaluate CV content.  
    - Configuration:  
      - Model set to "models/gemini-2.5-flash-lite".  
      - Temperature parameter set to 0.4 for balanced creativity and determinism.  
      - Uses Google Palm API OAuth credentials.  
    - Inputs: Text extracted from CV node output  
    - Outputs: Raw AI response (text)  
    - Edge Cases:  
      - API key invalid or quota exceeded.  
      - Model downtime or connectivity issues.  
    - Sticky Note Reference:  
      - "1. [In Google AI Studio](https://aistudio.google.com/app/apikey) click **“Create API key in new project”** and copy it."  
      - "2. Open the `Connect Gemini` node: select credential, create new, then paste API key and save."

  - **JSON Output Parser**  
    - Type: LangChain Output Parser (Structured)  
    - Role: Enforces structured JSON schema on AI output to ensure consistent data format (`qualificationRate`, `explanation`).  
    - Configuration:  
      - Manual schema defines required numeric and string fields without additional properties.  
    - Inputs: Raw AI text from Gemini node  
    - Outputs: Validated and parsed JSON object for downstream use  
    - Edge Cases:  
      - AI output not conforming to schema causing parse errors.  
      - Schema mismatch if AI prompt changes.  

  - **AI Qualification**  
    - Type: LangChain LLM Chain Node  
    - Role: Implements the full AI prompt chain combining role instructions, job requirements context, evaluation criteria, and output format.  
    - Configuration:  
      - Prompt includes detailed Senior Frontend Developer job description, core & preferred requirements, evaluation logic, and output JSON format.  
      - Has output parser linked to JSON Output Parser node for structured results.  
    - Inputs: Parsed extracted CV text  
    - Outputs: JSON object with candidate qualification data  
    - Edge Cases:  
      - Prompt formatting errors or truncation.  
      - AI model response delays or failures.  
    - Sticky Note Reference:  
      - "Adapt the `job requirements` in the prompt to **your position & criteria**."

#### 2.4 Data Logging and Update

- **Overview:**  
  Updates the existing Google Sheet entry for the candidate with their AI qualification results, linking by email for record integrity.

- **Nodes Involved:**  
  - Add CV Analysis (Google Sheets Update)

- **Node Details:**

  - **Add CV Analysis**  
    - Type: Google Sheets — Update Operation  
    - Role: Updates candidate row in "CVs" sheet matching by Email with AI-generated qualification score and explanation text.  
    - Configuration:  
      - Matches rows by Email column.  
      - Updates QualificationRate and QualificationDescription columns with AI data.  
      - Uses OAuth2 credentials.  
    - Inputs: JSON output from AI Qualification and original form data for email  
    - Outputs: Confirmation of update operation  
    - Edge Cases:  
      - No matching email row found causing update failure.  
      - Google Sheets API permission or quota issues.  
    - Sticky Note Reference:  
      - "Check your Google Sheets! You now have the analysis of the candidate."

#### 2.5 Initialization and Setup

- **Overview:**  
  Sets up a new Google Sheets spreadsheet titled "CVs" with necessary columns to store candidate information and analysis results.

- **Nodes Involved:**  
  - Create 'CVs' Spreadsheet  
  - Sticky Notes (multiple for instructions and workflow goal)

- **Node Details:**

  - **Create 'CVs' Spreadsheet**  
    - Type: Google Sheets — Spreadsheet Creation  
    - Role: Initializes a new Google Sheet with columns: FullName, Email, QualificationRate, QualificationDescription.  
    - Configuration:  
      - Spreadsheet title set to "CVs".  
      - Separate sheets created for each column title (sheet names match column names).  
      - Uses OAuth2 credentials.  
    - Inputs: Manual trigger or workflow start  
    - Outputs: Spreadsheet ID and URL for access  
    - Edge Cases:  
      - Google API quota or permissions errors.  
    - Sticky Note Reference:  
      - "Initializes a new Google Sheet with columns for applicant data. Can be replaced with Airtable, Notion, etc."

  - **Sticky Notes**  
    - Provide workflow goals, instructions for credential setup, and user tips, such as sharing form URL and adapting prompts.

---

### 3. Summary Table

| Node Name               | Node Type                               | Functional Role                        | Input Node(s)       | Output Node(s)           | Sticky Note                                                                                                                       |
|-------------------------|---------------------------------------|-------------------------------------|---------------------|--------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| Start Here              | Manual Trigger                        | Workflow manual start trigger        | —                   | Create 'CVs' Spreadsheet  | © 2025 Lucas Peyrin                                                                                                              |
| Create 'CVs' Spreadsheet| Google Sheets (Spreadsheet Create)   | Initializes candidate data spreadsheet| Start Here          | Application Form          | Initializes a new Google Sheet with columns for applicant data. Can be replaced with Airtable, Notion, etc.                       |
| Application Form        | Form Trigger                         | Captures candidate’s info and CV     | Create 'CVs' Spreadsheet | Extract CV Text, Log Candidate Submission | 💡 Later, activate this workflow and share the public form URL to let candidates share their CV!                                   |
| Extract CV Text         | Mistral AI OCR                       | Extracts text from candidate CV PDF  | Application Form     | AI Qualification          | This uses **[Mistral OCR](https://mistral.ai/fr/news/mistral-ocr)**, it extracts the text perfectly from a candidate's CV (PDF). \n**[Get your Mistral API key here](https://console.mistral.ai/api-keys)** |
| Log Candidate Submission| Google Sheets (Append)               | Logs candidate basic info immediately| Application Form     | —                        | Adds the applicant's name and email to the Google Sheet right after they submit the form to have it logged even if the workflow fails.|
| Gemini 2.5 Flash Lite   | LangChain Google Gemini AI Model     | Runs AI model for CV analysis        | Extract CV Text      | AI Qualification          | 1. [In Google AI Studio](https://aistudio.google.com/app/apikey) click **“Create API key in new project”** and copy it.\n2. Open the `Connect Gemini` node and paste API key.|
| JSON Output Parser      | LangChain Output Parser (Structured) | Parses AI output into structured JSON| Gemini 2.5 Flash Lite | AI Qualification          | Ensures the AI's response is perfectly structured as JSON (e.g., `qualificationRate`, `explanation`), making data reliable.       |
| AI Qualification        | LangChain LLM Chain                  | Evaluates CV text against job criteria| Extract CV Text, Gemini 2.5 Flash Lite, JSON Output Parser | Add CV Analysis            | Adapt the `job requirements` in the prompt to **your position & criteria**.                                                        |
| Add CV Analysis         | Google Sheets (Update)               | Updates candidate row with AI analysis| AI Qualification    | —                        | Check your Google Sheets! You now have the analysis of the candidate.                                                             |
| Sticky Note - Workflow Goal1 | Sticky Note                      | Describes workflow purpose and usage | —                   | —                        | ## Automated CV Scanner\nThis workflow automates your hiring pipeline: 1. Collects applications via form, 2. Extracts CV text, 3. Analyzes CV with AI, 4. Stores results in Google Sheets.  |
| Sticky Note - Create Spreadsheet1 | Sticky Note                  | Notes about spreadsheet setup        | —                   | —                        | Initializes a new Google Sheet with columns for applicant data. Can be replaced with Airtable, Notion, etc.                       |
| Sticky Note - Append Row1 | Sticky Note                        | Notes about logging candidate info   | —                   | —                        | Adds the applicant's name and email to the Google Sheet right after they submit the form to have it logged even if the workflow fails.|
| Sticky Note - Extract Text1 | Sticky Note                      | Notes about Mistral OCR usage         | —                   | —                        | This uses **[Mistral OCR](https://mistral.ai/fr/news/mistral-ocr)**, it extracts the text perfectly from a candidate's CV (PDF).  |
| Sticky Note - LLM Chain1 | Sticky Note                        | Notes about prompt adaptation         | —                   | —                        | Adapt the `job requirements` in the prompt to **your position & criteria**.                                                        |
| Sticky Note - Output Parser1 | Sticky Note                    | Notes about output parsing            | —                   | —                        | Ensures the AI's response is perfectly structured as JSON (e.g., `qualificationRate`, `explanation`), making the data reliable.    |
| Sticky Note - Update Row1 | Sticky Note                      | Notes about final Google Sheets update| —                   | —                        | Check your Google Sheets! You now have the analysis of the candidate.                                                             |
| Sticky Note12           | Sticky Note                        | Reminds to activate workflow and share form | —                   | —                        | 💡 Later, activate this workflow and share the public form URL to let candidates share their CV!                                   |
| Sticky Note             | Sticky Note                        | Instructions for Gemini AI API key setup | —                   | —                        | 1. [In Google AI Studio](https://aistudio.google.com/app/apikey) click **“Create API key in new project”** and copy it.\n2. Open the `Connect Gemini` node: select credential, create new, paste API key and save. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Name: "Start Here"  
   - Purpose: Manual workflow start for initialization.

2. **Create Google Sheets Node to Initialize Spreadsheet**  
   - Name: "Create 'CVs' Spreadsheet"  
   - Type: Google Sheets — Create Spreadsheet  
   - Parameters:  
     - Title: "CVs"  
     - Sheets: Create columns as separate sheets titled "FullName", "Email", "QualificationRate", "QualificationDescription"  
   - Credentials: OAuth2 Google Sheets with proper permission for creating spreadsheets.  
   - Connect "Start Here" node output to this node input.

3. **Create Form Trigger Node**  
   - Name: "Application Form"  
   - Type: Form Trigger  
   - Parameters:  
     - Webhook path: unique path for public access  
     - Form fields:  
       - Full Name (required, text)  
       - Email (required, text)  
       - Upload CV (required, file, accept only .pdf)  
     - Custom CSS: Use provided dark professional theme CSS for UI  
     - Submit button label: "Submit Application"  
     - Form description: "Please fill out the form below and upload your CV to apply."  
   - Connect output of "Create 'CVs' Spreadsheet" node to this node.

4. **Create Mistral OCR Node**  
   - Name: "Extract CV Text"  
   - Type: Mistral AI  
   - Parameters:  
     - Binary Property: dynamically set to the uploaded CV file from "Application Form" node, using expression  
       `={{ $('Application Form').last().binary.keys()[0] }}`  
   - Credentials: Mistral Cloud API key (register and obtain from https://console.mistral.ai/api-keys)  
   - Connect output of "Application Form" to this node.

5. **Create Google Sheets Append Node**  
   - Name: "Log Candidate Submission"  
   - Type: Google Sheets — Append  
   - Parameters:  
     - Document ID: ID of the "CVs" spreadsheet created previously  
     - Sheet Name: "gid=0" (default first sheet)  
     - Columns to append: FullName mapped from `{{$json["Full Name"]}}`, Email mapped from `{{$json.Email}}`  
   - Credentials: OAuth2 Google Sheets  
   - Connect output of "Application Form" to this node (parallel with "Extract CV Text").

6. **Create Google Gemini AI Node**  
   - Name: "Gemini 2.5 Flash Lite"  
   - Type: LangChain Google Gemini Chat Model  
   - Parameters:  
     - Model: "models/gemini-2.5-flash-lite"  
     - Temperature: 0.4  
   - Credentials: Google Palm API (create API key at https://aistudio.google.com/app/apikey, then configure credential in n8n)  
   - Connect output of "Extract CV Text" node to this node.

7. **Create LangChain Output Parser Node**  
   - Name: "JSON Output Parser"  
   - Type: LangChain Output Parser (Structured)  
   - Parameters:  
     - Schema type: manual  
     - Input schema:  
       ```json
       {
         "type": "object",
         "properties": {
           "qualificationRate": { "type": "number" },
           "explanation": { "type": "string" }
         },
         "required": ["qualificationRate", "explanation"],
         "additionalProperties": false
       }
       ```  
   - Connect output of "Gemini 2.5 Flash Lite" node to this node (as AI output parser).

8. **Create LangChain LLM Chain Node**  
   - Name: "AI Qualification"  
   - Type: LangChain Chain LLM  
   - Parameters:  
     - Text: Full AI prompt including:  
       - Goal: Evaluate CV against Senior Frontend Developer job requirements  
       - Context: Job description detailing core and preferred qualifications  
       - Evaluation Logic: Scoring rules and explanation requirements  
       - Output format: Strict JSON object with `qualificationRate` and `explanation`  
     - Has output parser: enabled, linked to "JSON Output Parser"  
   - Connect output of "Extract CV Text" node (for CV text input) and connect AI model and output parser nodes appropriately as inputs for chain processing.

9. **Create Google Sheets Update Node**  
   - Name: "Add CV Analysis"  
   - Type: Google Sheets — Update  
   - Parameters:  
     - Document ID: Same "CVs" spreadsheet ID  
     - Sheet Name: "gid=0"  
     - Matching column: Email  
     - Columns to update:  
       - QualificationRate: mapped from `{{$json.output.qualificationRate}}` from AI Qualification output  
       - QualificationDescription: mapped from `{{$json.output.explanation}}`  
   - Credentials: OAuth2 Google Sheets  
   - Connect output of "AI Qualification" node to this node.

10. **Validate connections:**  
    - Application Form → Extract CV Text → Gemini 2.5 Flash Lite → JSON Output Parser → AI Qualification → Add CV Analysis  
    - Application Form → Log Candidate Submission (parallel branch)  
    - Start Here → Create 'CVs' Spreadsheet → Application Form

11. **Credential Setup:**  
    - Google Sheets OAuth2: Required for all Google Sheets nodes.  
    - Mistral API Key: For OCR node.  
    - Google Palm API Key: For Gemini AI node.

12. **Optional:** Add Sticky Notes to document each step and provide instructions on credential setup, workflow goals, and usage tips for maintainability.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                  | Context or Link                                                                                      |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Workflow automates hiring pipeline: collects applications, extracts CV text via OCR, analyzes with AI, and stores structured results in Google Sheets for easy review.                                                                                                                       | Workflow Goal Sticky Note                                                                            |
| Mistral OCR provides high-quality text extraction from PDFs. Requires API key setup at https://console.mistral.ai/api-keys.                                                                                                                                                                | https://mistral.ai/fr/news/mistral-ocr and https://console.mistral.ai/api-keys                      |
| Google Gemini AI model (Gemini 2.5 Flash Lite) requires API key from Google AI Studio (https://aistudio.google.com/app/apikey).                                                                                                                                                              | https://aistudio.google.com/app/apikey                                                              |
| Suggested to adapt AI prompt’s job requirements to match the specific position and evaluation criteria you need.                                                                                                                                                                            | Sticky note on LLM Chain node                                                                        |
| The form uses a modern dark theme with CSS for enhanced user experience; customization is possible as needed.                                                                                                                                                                               | Application Form node CSS settings                                                                   |
| For feedback or custom workflow development, contact via unified AI-powered form: https://api.ia2s.app/form/templates/academy                                                                                                                                                              | Workflow Goal Sticky Note                                                                            |

---

**Disclaimer:** The provided content is derived solely from an automated n8n workflow. It fully complies with current content policies and contains no illegal, offensive, or protected elements. All processed data is legal and public.