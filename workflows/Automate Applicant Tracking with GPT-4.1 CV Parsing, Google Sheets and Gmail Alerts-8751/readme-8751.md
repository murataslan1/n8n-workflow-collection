Automate Applicant Tracking with GPT-4.1 CV Parsing, Google Sheets and Gmail Alerts

https://n8nworkflows.xyz/workflows/automate-applicant-tracking-with-gpt-4-1-cv-parsing--google-sheets-and-gmail-alerts-8751


# Automate Applicant Tracking with GPT-4.1 CV Parsing, Google Sheets and Gmail Alerts

### 1. Workflow Overview

This workflow automates applicant tracking by integrating form submissions, AI-powered CV parsing, data storage, and email notifications. It is designed to streamline the initial hiring process by extracting structured data from unstructured PDF CVs submitted via an online form, saving candidate details to Google Sheets, and sending confirmation and notification emails.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Captures applicant data and CV file via an n8n form.
- **1.2 AI CV Parsing Engine:** Extracts text from the PDF CV and uses OpenAI GPT-4.1 to analyze and structure the CV data into JSON.
- **1.3 Data Validation and Storage:** Checks for duplicate applicants in Google Sheets and appends or updates the applicant data accordingly.
- **1.4 Email Notifications:** Sends a confirmation email to the applicant and a notification email to the recruiter.
- **1.5 Utility and No-Operation Nodes:** Includes debugging and flow control nodes.
- **1.6 Documentation:** Sticky notes provide context and setup instructions.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block captures the applicant’s basic information and uploaded CV through a customized form, triggering the workflow upon submission.

- **Nodes Involved:**  
  - `1. Applicant Submits Form`  
  - `Code`

- **Node Details:**

  - **1. Applicant Submits Form**  
    - Type & Role: `formTrigger` node; triggers workflow on form submission.  
    - Configuration: Form titled "test" with fields: Name surname (required), email (required), CV (PDF file, required), Experience Years (number, required).  
    - Expressions: N/A  
    - Input/Output: No input; outputs form data including binary CV file.  
    - Version: 2.3  
    - Edge Cases: Missing required fields; file upload errors; invalid file types.  

  - **Code**  
    - Type & Role: `code` node; used for debugging input data structure.  
    - Configuration: Logs JSON keys and binary keys of the input for inspection; passes input unchanged.  
    - Expressions: Uses JavaScript `console.log` for inspection.  
    - Input/Output: Input from form node; output passes through unchanged.  
    - Version: 2  
    - Edge Cases: None expected; purely diagnostic.  

#### 2.2 AI CV Parsing Engine

- **Overview:**  
  This core block extracts text from the uploaded PDF CV and processes it with OpenAI GPT-4.1 to extract structured applicant data in JSON format.

- **Nodes Involved:**  
  - `2. Extract Text from PDF CV`  
  - `3. Analyze & Structure CV with AI`  
  - `4. Parse AI Output`

- **Node Details:**

  - **2. Extract Text from PDF CV**  
    - Type & Role: `extractFromFile` node; extracts text content from PDF binary data.  
    - Configuration: Operation set to "pdf"; binary property name set to "CV" (the uploaded file).  
    - Expressions: N/A  
    - Input/Output: Input from Code node; outputs extracted text.  
    - Version: 1  
    - Edge Cases: Corrupt or password-protected PDFs; unsupported PDF versions; extraction failures.  

  - **3. Analyze & Structure CV with AI**  
    - Type & Role: `@n8n/n8n-nodes-langchain.openAi` node; sends extracted CV text and form data to OpenAI GPT-4.1-mini model.  
    - Configuration: Model "gpt-4.1-mini" selected; prompt instructs AI to parse CV text and form data into a strict JSON format for Google Sheets.  
    - Key Expressions: Uses form data (`Name surname`, `email`, `Experience Years`) via expressions and inserts extracted CV text (`{{ $json.text }}`). The prompt enforces JSON-only output without extra text.  
    - Input/Output: Input from Extract Text node; outputs AI response as JSON.  
    - Version: 1.8  
    - Edge Cases: API authentication errors; rate limits; malformed AI responses; prompt failures; network timeouts.  

  - **4. Parse AI Output**  
    - Type & Role: `code` node; parses the AI's JSON response from text into a usable JSON object.  
    - Configuration: Assumes AI content is already an object; simply extracts `message.content` and returns it as JSON.  
    - Expressions: Accesses `items[0].json.message.content`.  
    - Input/Output: Input from AI node; output is structured JSON for downstream use.  
    - Version: 2  
    - Edge Cases: Unexpected AI response formats; parsing errors if AI does not strictly follow instructions.  

#### 2.3 Data Validation and Storage

- **Overview:**  
  Checks for duplicate applicants by email in Google Sheets and stores new or updated applicant data accordingly.

- **Nodes Involved:**  
  - `5. Check for Duplicate Applicant`  
  - `6. If Applicant is New...`  
  - `No Operation, do nothing`  
  - `7. Save Applicant Data to Google Sheets`

- **Node Details:**

  - **5. Check for Duplicate Applicant**  
    - Type & Role: `googleSheets` node; searches Google Sheet for existing applicant by email.  
    - Configuration: Filter on column "email" matching AI-parsed email (`={{ $node["4. Parse AI Output"].json.email }}`); uses document and sheet IDs linked to external Google Sheet.  
    - Expressions: Lookup value and document URL configured via expressions.  
    - Input/Output: Input from Parse AI Output node; outputs found rows or empty if none.  
    - Version: 4.7  
    - Edge Cases: Google API authentication errors; network issues; rate limits; missing or renamed sheet columns.  

  - **6. If Applicant is New...**  
    - Type & Role: `if` node; conditionally routes workflow based on presence of applicant email in Google Sheets.  
    - Configuration: Checks if `email` field is not empty (indicating existing applicant). If empty, applicant is new.  
    - Expressions: `={{ $json.email }}` used for condition.  
    - Input/Output: Input from Check Duplicate node; two outputs: true (existing applicant), false (new applicant).  
    - Version: 2.2  
    - Edge Cases: Missing or malformed data; logic errors if email field is not properly propagated.  

  - **No Operation, do nothing**  
    - Type & Role: `noOp` node; terminates flow for existing applicants (no update).  
    - Configuration: No parameters.  
    - Input/Output: Input from If node (existing applicant branch); no output connections.  
    - Version: 1  
    - Edge Cases: None.  

  - **7. Save Applicant Data to Google Sheets**  
    - Type & Role: `googleSheets` node; appends or updates applicant data in Google Sheet.  
    - Configuration:  
      - Mapping mode: Define columns below.  
      - Columns mapped from AI output JSON fields: name, email, phone, experience years, education, work experience, skills, certifications, languages, address, CV summary, application date, status.  
      - Matching column for update: email.  
      - Document and sheet details same as in node 5.  
    - Expressions: Used extensively to map AI output fields to sheet columns.  
    - Input/Output: Input from If node (new applicant branch); outputs to email notification nodes.  
    - Version: 4.7  
    - Edge Cases: Sheet write errors; permission issues; schema mismatches; network or API failures.  

#### 2.4 Email Notifications

- **Overview:**  
  Sends email confirmations to applicants and notification emails to recruiters upon successful data saving.

- **Nodes Involved:**  
  - `8a. Send Confirmation Email to Applicant`  
  - `8b. Send Notification Email to Recruiter`

- **Node Details:**

  - **8a. Send Confirmation Email to Applicant**  
    - Type & Role: `gmail` node; sends confirmation email to applicant’s email address.  
    - Configuration:  
      - Recipient: AI parsed applicant email.  
      - Subject: "Your Application Has Been Received".  
      - Message body includes personalized details (name, email, experience years, application date).  
    - Expressions: Dynamic content inserted via expressions from AI output JSON.  
    - Input/Output: Input from Save Applicant Data node; no output connections.  
    - Version: 2.1  
    - Edge Cases: Gmail API authentication errors; email address invalid; quota limits.  

  - **8b. Send Notification Email to Recruiter**  
    - Type & Role: `gmail` node; sends notification email to a fixed recruiter email address.  
    - Configuration:  
      - Recipient: Hardcoded to `bsezi1409@gmail.com` (should be customized).  
      - Subject: Includes applicant name dynamically.  
      - Message body contains applicant’s key info and AI-generated CV summary.  
    - Expressions: Uses AI output JSON fields for dynamic content.  
    - Input/Output: Input from Save Applicant Data node; no output connections.  
    - Version: 2.1  
    - Edge Cases: Same as above; ensure email is correct to avoid missed notifications.  

#### 2.5 Utility and No-Operation Nodes

- **Overview:**  
  Support nodes for debugging and flow control.

- **Nodes Involved:**  
  - `Code` (already detailed in 2.1)  
  - `No Operation, do nothing` (already detailed in 2.3)  

- **Node Details:**  
  Covered above.

#### 2.6 Documentation and Sticky Notes

- **Overview:**  
  Contains textual documentation, usage instructions, and block explanations to aid users.

- **Nodes Involved:**  
  - `Sticky Note`  
  - `Sticky Note1`

- **Node Details:**

  - **Sticky Note** (Positioned top-left)  
    - Content: Describes workflow purpose, setup steps for credentials, form customization, recruiter email configuration, and linking Google Sheets.  
    - Usage: Quick start guide for users to configure and activate the workflow.  

  - **Sticky Note1** (Near AI parsing nodes)  
    - Content: Explains Phase 1 focusing on AI CV parsing engine with node descriptions and purpose.  
    - Usage: Contextual explanation for the AI processing block.

---

### 3. Summary Table

| Node Name                         | Node Type               | Functional Role                          | Input Node(s)              | Output Node(s)                                  | Sticky Note                                                                                                                       |
|----------------------------------|-------------------------|----------------------------------------|----------------------------|------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| 1. Applicant Submits Form         | formTrigger             | Captures form data and CV file         | —                          | Code                                           | See Sticky Note for setup instructions.                                                                                          |
| Code                             | code                    | Debugs input data structure             | 1. Applicant Submits Form   | 2. Extract Text from PDF CV                      | See Sticky Note for setup instructions.                                                                                          |
| 2. Extract Text from PDF CV       | extractFromFile         | Extracts text content from uploaded PDF | Code                       | 3. Analyze & Structure CV with AI               | See Sticky Note1 for AI CV parsing explanation.                                                                                  |
| 3. Analyze & Structure CV with AI| openAi (Langchain)      | Parses CV text with GPT-4.1 into JSON   | 2. Extract Text from PDF CV | 4. Parse AI Output                              | See Sticky Note1 for AI CV parsing explanation.                                                                                  |
| 4. Parse AI Output                | code                    | Parses AI response JSON string           | 3. Analyze & Structure CV with AI | 5. Check for Duplicate Applicant               | See Sticky Note1 for AI CV parsing explanation.                                                                                  |
| 5. Check for Duplicate Applicant | googleSheets            | Checks if applicant email already exists| 4. Parse AI Output          | 6. If Applicant is New...                        | See Sticky Note for Google Sheets integration instructions.                                                                      |
| 6. If Applicant is New...         | if                      | Routes flow based on applicant presence  | 5. Check for Duplicate Applicant | No Operation, do nothing (existing) / 7. Save Applicant Data (new) | See Sticky Note for Google Sheets integration instructions.                                                                      |
| No Operation, do nothing          | noOp                    | Stops flow for existing applicants       | 6. If Applicant is New... (existing branch) | —                                              |                                                                                                                                  |
| 7. Save Applicant Data to Google Sheets | googleSheets       | Appends or updates applicant data        | 6. If Applicant is New... (new branch) | 8a. Send Confirmation Email / 8b. Send Notification Email | See Sticky Note for Google Sheets integration instructions.                                                                      |
| 8a. Send Confirmation Email to Applicant | gmail              | Sends email confirmation to applicant    | 7. Save Applicant Data to Google Sheets | —                                              | See Sticky Note for Gmail credential setup.                                                                                      |
| 8b. Send Notification Email to Recruiter | gmail              | Sends notification email to recruiter    | 7. Save Applicant Data to Google Sheets | —                                              | See Sticky Note for Gmail credential setup.                                                                                      |
| Sticky Note                      | stickyNote              | Workflow overview and setup instructions | —                          | —                                              | Contains setup guide, credential info, and configuration instructions.                                                          |
| Sticky Note1                     | stickyNote              | Explains AI CV parsing phase             | —                          | —                                              | Explains nodes 2, 3, 4 as AI CV parsing engine core.                                                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add a `formTrigger` node named `1. Applicant Submits Form`:**  
   - Set form title to "test".  
   - Add the following fields:  
     - Name surname (string, required)  
     - email (string, required)  
     - CV (file upload, accept `.pdf`, single file, required)  
     - Experience Years (number, required)  
   - Save and note the webhook URL for form submissions.

3. **Add a `code` node named `Code`:**  
   - JavaScript code to log input JSON and binary keys for debugging:  
     ```js
     console.log("JSON Keys:", Object.keys($input.first().json));
     console.log("Binary Keys:", Object.keys($input.first().binary || {}));
     console.log("Full Binary:", $input.first().binary);
     return $input.all();
     ```  
   - Connect `1. Applicant Submits Form` output to `Code` input.

4. **Add an `extractFromFile` node named `2. Extract Text from PDF CV`:**  
   - Set operation to `pdf`.  
   - Set binary property name to `CV` (the uploaded file field).  
   - Connect `Code` node output to this node input.

5. **Add an OpenAI node (Langchain) named `3. Analyze & Structure CV with AI`:**  
   - Select model `gpt-4.1-mini` (ensure OpenAI credentials configured).  
   - Configure messages with the system prompt including form data and extracted CV text, requesting structured JSON output (see prompt in the original workflow).  
   - Enable JSON output parsing (`jsonOutput: true`).  
   - Connect `2. Extract Text from PDF CV` output to this node input.  
   - Configure OpenAI credentials.

6. **Add a `code` node named `4. Parse AI Output`:**  
   - JavaScript code to parse AI response JSON:  
     ```js
     const data = items[0].json.message.content;
     return [{ json: data }];
     ```  
   - Connect `3. Analyze & Structure CV with AI` output to this node input.

7. **Add a `googleSheets` node named `5. Check for Duplicate Applicant`:**  
   - Configure with your Google Sheets OAuth2 credentials.  
   - Set operation to search/filter rows.  
   - Set sheet and document ID to your Google Sheet.  
   - Add filter condition: column `email` equals `={{ $node["4. Parse AI Output"].json.email }}`.  
   - Connect `4. Parse AI Output` output to this node input.

8. **Add an `if` node named `6. If Applicant is New...`:**  
   - Condition: Check if `email` field from input JSON is empty or not.  
   - Expression: `={{ $json.email }}` with operator "not empty" for existing applicants.  
   - Connect `5. Check for Duplicate Applicant` output to this node input.

9. **Add a `noOp` node named `No Operation, do nothing`:**  
   - Connect to the true branch (existing applicant) output of the `if` node.

10. **Add a `googleSheets` node named `7. Save Applicant Data to Google Sheets`:**  
    - Configure with your Google Sheets OAuth2 credentials.  
    - Set operation to append or update row based on matching `email`.  
    - Map columns using expressions from `4. Parse AI Output` JSON fields, including name, email, phone, experience years, education, work experience, skills, certifications, languages, address, CV summary, application date, and status.  
    - Connect the false branch (new applicant) output of the `if` node to this node input.

11. **Add a `gmail` node named `8a. Send Confirmation Email to Applicant`:**  
    - Configure Gmail OAuth2 credentials.  
    - Set recipient to applicant email from AI output JSON.  
    - Compose subject and message body with dynamic fields (name, email, experience, date).  
    - Connect `7. Save Applicant Data to Google Sheets` output to this node input.

12. **Add another `gmail` node named `8b. Send Notification Email to Recruiter`:**  
    - Configure Gmail OAuth2 credentials.  
    - Set recipient to your recruiter email (e.g., `bsezi1409@gmail.com`).  
    - Compose subject with applicant name and message body with applicant details and AI CV summary.  
    - Connect `7. Save Applicant Data to Google Sheets` output to this node input.

13. **Add Sticky Notes for Documentation:**  
    - Create notes describing the workflow purpose, setup steps for credentials, form customization, and AI CV parsing explanation near relevant nodes as a best practice.

14. **Activate the workflow:**  
    - Test end to end by submitting the form and verifying Google Sheets update and email notifications.

---

### 5. General Notes & Resources

| Note Content                                                                                                                          | Context or Link                                                                                   |
|---------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| AI-Powered Applicant Tracking System (ATS) automates initial hiring with form input, AI CV parsing, Google Sheets storage, and emails.| Sticky Note at top-left of workflow.                                                             |
| Quick setup requires configuring OpenAI, Google Sheets, and Gmail credentials, customizing form fields, and setting recruiter email. | Sticky Note at top-left of workflow.                                                             |
| Phase 1 (AI CV Parsing Engine) transforms unstructured CV PDFs into structured JSON for database entry.                              | Sticky Note near nodes 2, 3, 4 explains this core processing block.                              |
| Use the OpenAI GPT-4.1-mini model with a strict prompt to ensure AI outputs valid JSON for downstream processing.                     | Node 3 configuration and prompt details.                                                        |
| Google Sheets must have columns matching the mapped fields (email, name surname, telephone, experience_years, education, etc.)       | Nodes 5 and 7 require correct sheet schema and permissions.                                     |
| Gmail nodes require OAuth2 credentials with send email scope for delivering confirmation and notification emails.                    | Nodes 8a and 8b require Gmail OAuth2 credentials.                                               |
| Replace recruiter email in node 8b with your actual hiring manager or HR email address.                                                | Node 8b configuration note.                                                                     |
| Form submissions trigger the workflow via webhook; ensure the form URL is shared with applicants.                                     | Node 1 webhook URL must be distributed externally for application intake.                       |

---

**Disclaimer:**  
The text provided is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.