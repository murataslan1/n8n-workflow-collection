Automate Resume Analysis & Candidate Screening with JotForm, Azure OCR, GPT-4.1, Zoho CRM

https://n8nworkflows.xyz/workflows/automate-resume-analysis---candidate-screening-with-jotform--azure-ocr--gpt-4-1--zoho-crm-9540


# Automate Resume Analysis & Candidate Screening with JotForm, Azure OCR, GPT-4.1, Zoho CRM

---

### 1. Workflow Overview

This workflow automates resume analysis and candidate screening by integrating form submissions, OCR text extraction, AI-powered resume evaluation, data storage, CRM updates, and email notifications. It targets HR teams and recruitment processes to streamline candidate assessment from resume submission to feedback delivery.

**Logical Blocks:**

- **1.1 Input Reception & Data Storage**  
  Capture candidate resume submissions via JotForm, extract name, email, and resume file URL, and store this data in a PostgreSQL database.

- **1.2 Resume Text Extraction (OCR)**  
  Convert submitted PDF resumes to JPG images using PDF.co API, then extract text via Azure OCR with retry logic to handle asynchronous processing.

- **1.3 AI Resume Analysis**  
  Use a GPT-4.1-powered LangChain assistant to analyze the extracted resume text, producing structured feedback including strengths, areas for improvement, and a numeric score.

- **1.4 Decision & Data Update**  
  Based on the resume score threshold, update Zoho CRM with qualified candidate data and send either a congratulatory or constructive feedback email using Gmail.

- **1.5 Schema Setup (Optional Initialization)**  
  A node to create the PostgreSQL `resume` table schema, likely for setup or documentation purposes.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Data Storage

- **Overview:**  
  This block triggers on new JotForm submissions capturing candidate details and stores them in a PostgreSQL table.

- **Nodes Involved:**  
  - JotForm Trigger1  
  - record data for submission  
  - create leads table1 (optional schema creation)  
  - Sticky Note8 (comment)  
  - Sticky Note9 (comment)

- **Node Details:**

  - **JotForm Trigger1**  
    - Type: JotForm Trigger  
    - Role: Entry point capturing form submissions from JotForm form ID `252434958811059`.  
    - Configuration: Webhook set up to listen to all submissions; does not resolve answers or data.  
    - Inputs: Webhook requests from JotForm.  
    - Outputs: Emits raw submission JSON including candidate name, email, and uploaded resume file URL.  
    - Edge Cases: Webhook failures, missing or malformed submission fields.  
    - Credentials: JotForm API credentials configured.

  - **record data for submission**  
    - Type: PostgreSQL node  
    - Role: Inserts candidate name, email, and resume file URL into `resume` table.  
    - Configuration: Inserts into public.resume with columns `given_name`, `given_email`, `resume_loc`.  
    - Uses expressions to map JotForm submission fields to DB columns.  
    - Inputs: Data from JotForm Trigger1 node.  
    - Outputs: Confirmation of DB insert.  
    - Edge Cases: Connection errors, data type mismatches, duplicates if no constraints.  
    - Credentials: Postgres account configured.

  - **create leads table1**  
    - Type: PostgreSQL node  
    - Role: Creates `resume` table schema with columns for candidate name, email, resume location.  
    - Configuration: Runs a CREATE TABLE SQL query.  
    - Inputs: None (manual or setup).  
    - Outputs: Execution result.  
    - Edge Cases: Table already exists, permissions errors.  
    - Credentials: Postgres account configured.

  - **Sticky Note8 & Sticky Note9**  
    - Role: Documentation comments explaining JotForm capture and Postgres storage.  
    - No configuration or execution role.

#### 2.2 Resume Text Extraction (OCR)

- **Overview:**  
  Converts uploaded PDF resumes to JPG images, sends the image URL to Azure OCR service, polls for extraction results with retry, and combines the extracted text.

- **Nodes Involved:**  
  - convert pdf to image  
  - send images to azure ocr  
  - extract operation id  
  - get extracted results  
  - if extraction completed?  
  - wait extraction to be completed  
  - Combine OCR text  
  - Sticky Note5 (comment)

- **Node Details:**

  - **convert pdf to image**  
    - Type: PDF.co API node  
    - Role: Converts the resume PDF URL to JPG image (first page only).  
    - Configuration: Uses resume URL from DB record, converts page 0 to JPG.  
    - Inputs: Resume URL from `record data for submission`.  
    - Outputs: URL of converted JPG image.  
    - Credentials: PDF.co account configured.  
    - Edge Cases: Invalid PDF URL, API rate limits, conversion failures.

  - **send images to azure ocr**  
    - Type: HTTP Request  
    - Role: Sends JPG image URL to Azure Cognitive Services Read API to start OCR.  
    - Configuration: POST to Azure OCR endpoint with JSON body containing image URL.  
    - Inputs: JPG URL from `convert pdf to image`.  
    - Outputs: HTTP response headers with operation-location URL for status.  
    - Credentials: Azure OCR HTTP Header Auth configured.  
    - Edge Cases: Authentication failure, invalid URL, service downtime.

  - **extract operation id**  
    - Type: Code node  
    - Role: Extracts operation ID from Azure OCR operation-location header for polling.  
    - Configuration: Parses header URL, extracts last segment as operation ID.  
    - Inputs: HTTP response headers from Azure OCR request.  
    - Outputs: JSON with operationLocation and operationId.  
    - Edge Cases: Missing headers, malformed URL.

  - **get extracted results**  
    - Type: HTTP Request  
    - Role: Polls Azure OCR API using operationId to fetch OCR results.  
    - Configuration: GET request to Azure OCR analyzeResults endpoint with operationId.  
    - Inputs: operationId from `extract operation id`.  
    - Outputs: OCR JSON results including readResults.  
    - Credentials: Azure OCR HTTP Header Auth configured.  
    - Edge Cases: Operation not complete, authentication issues.

  - **if extraction completed?**  
    - Type: If node  
    - Role: Checks if OCR extraction status is "succeeded".  
    - Configuration: Condition comparing `$json.status` to "succeeded".  
    - Inputs: OCR results from `get extracted results`.  
    - Outputs:  
      - True: Continue processing extracted text.  
      - False: Wait and retry.  
    - Edge Cases: Status other than succeeded or failed, infinite loops.

  - **wait extraction to be completed**  
    - Type: Wait node  
    - Role: Pauses flow for 2 seconds before retrying OCR result polling.  
    - Inputs: From false branch of `if extraction completed?`.  
    - Outputs: Triggers `get extracted results` again.

  - **Combine OCR text**  
    - Type: Code node  
    - Role: Concatenates all lines from OCR readResults into a single text string with line breaks.  
    - Inputs: OCR JSON from `get extracted results`.  
    - Outputs: Object with combined text property.  
    - Edge Cases: Empty or malformed OCR results.

  - **Sticky Note5**  
    - Role: Explains this block’s purpose: PDF to JPG conversion, Azure OCR text extraction, status checking with retry.

#### 2.3 AI Resume Analysis

- **Overview:**  
  Uses a GPT-4.1 assistant to analyze the extracted resume text, generating detailed feedback and a quantitative score.

- **Nodes Involved:**  
  - Resume Analyzer  
  - Information Extractor  
  - convert score to number  
  - Sticky Note7 (comment)  
  - Sticky Note10 (comment)

- **Node Details:**

  - **Resume Analyzer**  
    - Type: LangChain OpenAI assistant node  
    - Role: Sends combined OCR text to a pre-created GPT-4.1 assistant ("Resume Analyzer 101") for analysis.  
    - Configuration: Passes `text` parameter with extracted resume text. Uses assistant ID of the created assistant.  
    - Inputs: Combined OCR text from `Combine OCR text`.  
    - Outputs: Assistant’s structured feedback (JSON with overall impression, strengths, improvements, score).  
    - Credentials: OpenAI API configured.  
    - Edge Cases: API limits, malformed inputs, assistant downtime.

  - **Information Extractor**  
    - Type: LangChain Information Extractor node  
    - Role: Extracts specific attributes from assistant’s output:  
      - good_side (strengths bullets)  
      - to_improve (areas for improvement bullets)  
      - Score (numeric score)  
    - Configuration: Defines three attributes with descriptions.  
    - Inputs: Output from `Resume Analyzer`.  
    - Outputs: JSON with extracted attributes.  
    - Credentials: OpenAI API configured.  
    - Edge Cases: Missing attributes in response, parsing errors.

  - **convert score to number**  
    - Type: Set node  
    - Role: Converts extracted `Score` attribute to numeric type for conditional checks.  
    - Configuration: Assigns `output.Score` as number from string.  
    - Inputs: Extracted score JSON from `Information Extractor`.  
    - Outputs: JSON with numeric score.  
    - Edge Cases: Conversion failure if score is invalid or missing.

  - **Sticky Note7 & Sticky Note10**  
    - Role: Comments describing assistant creation and analysis logic including thresholds and actions.

#### 2.4 Decision & Data Update

- **Overview:**  
  Based on the resume score, update Zoho CRM with qualified candidates and send customized emails via Gmail.

- **Nodes Involved:**  
  - if score > 58?  
  - add qualified to zoho crm1  
  - send congratulations  
  - send feedback for changes  
  - Sticky Note6 (comment)

- **Node Details:**

  - **if score > 58?**  
    - Type: If node  
    - Role: Checks if resume score is greater than 85 (threshold for qualification).  
    - Inputs: Numeric score from `convert score to number`.  
    - Outputs:  
      - True branch for qualified candidates.  
      - False branch for sending feedback.  
    - Edge Cases: Score missing or invalid.

  - **add qualified to zoho crm1**  
    - Type: HTTP Request  
    - Role: Sends POST request to Zoho CRM API to add candidate as a qualified lead with relevant info.  
    - Configuration: JSON body includes Name, Email, resume_Score, qualified=true, strengths, and recommended action.  
    - Inputs: Data from JotForm Trigger and `Information Extractor`.  
    - Outputs: CRM API response.  
    - Credentials: Zoho OAuth2 configured.  
    - Edge Cases: API failures, auth errors, data validation issues.

  - **send congratulations**  
    - Type: Gmail node  
    - Role: Sends a congratulatory email to candidate with strengths highlighted.  
    - Configuration: Email HTML is styled with sections for strengths and warm regards.  
    - Inputs: Candidate email from JotForm, strengths from extracted info.  
    - Credentials: Gmail OAuth2 configured.  
    - Edge Cases: Email sending errors, invalid email addresses.

  - **send feedback for changes**  
    - Type: Gmail node  
    - Role: Sends constructive feedback email to candidate with strengths and areas for improvement.  
    - Configuration: Styled HTML email with bulleted lists for strengths and improvements.  
    - Inputs: Candidate email, extracted feedback info.  
    - Credentials: Gmail OAuth2 configured.  
    - Edge Cases: Email sending errors, invalid email addresses.

  - **Sticky Note6**  
    - Role: Comment explaining creation of results table (likely refers to CRM data or DB schema).

---

### 3. Summary Table

| Node Name                | Node Type                 | Functional Role                                      | Input Node(s)            | Output Node(s)                 | Sticky Note                                                                                       |
|--------------------------|---------------------------|-----------------------------------------------------|--------------------------|-------------------------------|-------------------------------------------------------------------------------------------------|
| JotForm Trigger1         | JotForm Trigger           | Capture resume submissions from JotForm             | -                        | record data for submission     | ## JotForm Captures resume submissions (name, email, PDF URL). Stores data in PostgreSQL `resume` table. |
| record data for submission| PostgreSQL                | Store submission data in `resume` table              | JotForm Trigger1          | convert pdf to image           | ## postgress store all submissions in postgress                                                  |
| create leads table1       | PostgreSQL                | Create `resume` table schema (setup)                 | -                        | -                             |                                                                                                |
| convert pdf to image      | PDF.co API                | Convert PDF resume to JPG image                       | record data for submission| send images to azure ocr       | ## Convert PDF to JPG (PDF.co API). Extract text via Azure OCR. Check status and retry if needed. |
| send images to azure ocr  | HTTP Request              | Start Azure OCR text extraction                       | convert pdf to image      | extract operation id           |                                                                                                 |
| extract operation id      | Code                      | Extract Azure OCR operation ID from response header  | send images to azure ocr  | get extracted results          |                                                                                                 |
| get extracted results     | HTTP Request              | Poll Azure OCR for text extraction results            | extract operation id      | if extraction completed?       |                                                                                                 |
| if extraction completed?  | If                        | Check if Azure OCR extraction succeeded               | get extracted results     | Combine OCR text / wait extraction to be completed |                                                                                                 |
| wait extraction to be completed | Wait                | Pause before polling Azure OCR results again          | if extraction completed?  | get extracted results          |                                                                                                 |
| Combine OCR text          | Code                      | Combine extracted OCR text lines into single text     | if extraction completed? (true) | Resume Analyzer           |                                                                                                 |
| Resume Analyzer           | LangChain OpenAI Assistant| Analyze resume text with GPT-4.1 assistant            | Combine OCR text          | Information Extractor          | ## create assistant to analyze results                                                          |
| Information Extractor     | LangChain Info Extractor  | Extract strengths, improvements, score from analysis  | Resume Analyzer           | convert score to number        |                                                                                                 |
| convert score to number   | Set                       | Convert score to numeric for conditional logic        | Information Extractor     | if score > 58?                 |                                                                                                 |
| if score > 58?            | If                        | Check if resume score exceeds threshold (85)          | convert score to number   | add qualified to zoho crm1/send feedback for changes |                                                                                                 |
| add qualified to zoho crm1| HTTP Request             | Add qualified candidate to Zoho CRM                    | if score > 58? (true)     | send congratulations          |                                                                                                 |
| send congratulations      | Gmail                     | Send congratulatory email to qualified candidate      | add qualified to zoho crm1| -                             |                                                                                                 |
| send feedback for changes | Gmail                     | Send constructive feedback email for lower scores     | if score > 58? (false)    | -                             |                                                                                                 |
| Sticky Note5              | Sticky Note               | Comment on PDF conversion & Azure OCR extraction      | -                        | -                             | ## Convert PDF to JPG (PDF.co API). Extract text via Azure OCR. Check status and retry if needed.|
| Sticky Note6              | Sticky Note               | Comment on creating table for submitted results       | -                        | -                             | ## create table for submitted results                                                           |
| Sticky Note7              | Sticky Note               | Comment on creating assistant for resume analysis     | -                        | -                             | ## create assistant to analyze results                                                          |
| Sticky Note8              | Sticky Note               | Comment on JotForm capturing data                      | -                        | -                             | ## JotForm Captures resume submissions (name, email, PDF URL). Stores data in PostgreSQL `resume` table. |
| Sticky Note9              | Sticky Note               | Comment on storing submissions in PostgreSQL           | -                        | -                             | ## postgress store all submissions in postgress                                                  |
| Sticky Note10             | Sticky Note               | Comment on analysis logic and email sending            | -                        | -                             | ## Analyze resume text (OpenAI). Extract strengths, improvements, score. If score > 85: add to Zoho CRM, send congratulatory email. Else: send feedback email.|

---

### 4. Reproducing the Workflow from Scratch

1. **Create PostgreSQL table for resume data (optional setup):**  
   - Add PostgreSQL node named `create leads table1`.  
   - Set operation to `executeQuery`.  
   - Use SQL:  
     ```sql
     CREATE TABLE resume (
       id SERIAL PRIMARY KEY,
       given_name VARCHAR(10000),
       given_email VARCHAR(10000),
       resume_loc VARCHAR(10000)
     );
     ```  
   - Connect with Postgres credentials.

2. **Set up JotForm Trigger:**  
   - Add `JotForm Trigger` node named `JotForm Trigger1`.  
   - Select form ID `252434958811059`.  
   - Set `onlyAnswers` and `resolveData` to false.  
   - Connect JotForm API credentials.

3. **Store submission data in PostgreSQL:**  
   - Add PostgreSQL node `record data for submission`.  
   - Operation: Insert into schema `public`, table `resume`.  
   - Map columns:  
     - `given_name` → expression: `{{$json.rawRequest.q4_name.first}} {{$json.rawRequest.q4_name.last}}`  
     - `given_email` → expression: `{{$json.rawRequest.q5_email}}`  
     - `resume_loc` → expression: `{{$json.rawRequest.fileUpload[0]}}`  
   - Connect Postgres credentials.  
   - Connect output of `JotForm Trigger1` to this node.

4. **Convert PDF resume to JPG image (PDF.co):**  
   - Add `PDF.co API` node named `convert pdf to image`.  
   - Operation: Convert from PDF to JPG.  
   - Input URL: `={{ $json.resume_loc }}` (from previous node output).  
   - Set advanced options to convert page 0 only.  
   - Connect PDF.co credentials.  
   - Connect output of `record data for submission` to this node.

5. **Send image URL to Azure OCR:**  
   - Add HTTP Request node named `send images to azure ocr`.  
   - Method: POST to Azure Read API endpoint (e.g. `https://<your-region>.cognitiveservices.azure.com/vision/v3.2/read/analyze`).  
   - JSON body: `{ "url": "{{ $json.body }}" }` where body contains JPG URL from previous node.  
   - Use HTTP Header Auth with Azure OCR credentials.  
   - Connect output of `convert pdf to image` to this node.

6. **Extract operation ID from Azure OCR response:**  
   - Add Code node named `extract operation id`.  
   - JavaScript code:  
     ```js
     const url = $json.headers["operation-location"];
     return [{
       operationLocation: url,
       operationId: url.split("/").pop()
     }];
     ```  
   - Connect output of `send images to azure ocr` to this node.

7. **Poll Azure OCR results:**  
   - Add HTTP Request node named `get extracted results`.  
   - Method: GET to `https://<your-region>.cognitiveservices.azure.com/vision/v3.2/read/analyzeResults/{{ $json.operationId }}`.  
   - Use same Azure OCR credentials.  
   - Connect output of `extract operation id` to this node.

8. **Check if extraction completed:**  
   - Add If node `if extraction completed?`.  
   - Condition: `$json.status` equals `"succeeded"`.  
   - Connect output of `get extracted results` to this node.

9. **If extraction not completed, wait and retry:**  
   - Add Wait node `wait extraction to be completed`.  
   - Wait time: 2 seconds.  
   - Connect false branch of `if extraction completed?` to this node.  
   - Connect output of `wait extraction to be completed` back to `get extracted results` node.

10. **Combine OCR text lines:**  
    - Add Code node `Combine OCR text`.  
    - Code:  
      ```js
      return [{
        text: $json["analyzeResult"]["readResults"]
          .flatMap(p => p.lines.map(l => l.text))
          .join("\n")
      }];
      ```  
    - Connect true branch of `if extraction completed?` to this node.

11. **Create and configure GPT-4.1 assistant:**  
    - Use LangChain OpenAI node `Create an assistant1` (outside main flow) to create assistant with:  
      - Name: Resume Analyzer 101  
      - Model: GPT-4.1  
      - Instructions: Detailed prompt to analyze resume text and provide structured feedback including score.  
    - Save assistant and note assistant ID for next step.

12. **Analyze combined OCR text:**  
    - Add LangChain OpenAI assistant node `Resume Analyzer`.  
    - Resource: assistant  
    - Assistant ID: ID from step 11.  
    - Text parameter: `=resume: {{ $json.text }}` (combined OCR text).  
    - Connect output of `Combine OCR text` to this node.

13. **Extract structured feedback:**  
    - Add LangChain Information Extractor node `Information Extractor`.  
    - Text input: `={{ $json.output }}` (from `Resume Analyzer`).  
    - Define attributes:  
      - `good_side` for strengths  
      - `to_improve` for improvements  
      - `Score` for numeric score  
    - Connect output of `Resume Analyzer` to this node.

14. **Convert score to numeric:**  
    - Add Set node `convert score to number`.  
    - Assign `output.Score` as number: `={{ $json.output.Score }}`.  
    - Connect output of `Information Extractor` to this node.

15. **Conditional path based on score threshold:**  
    - Add If node `if score > 58?` (threshold 85).  
    - Condition: `output.Score > 85`.  
    - Connect output of `convert score to number` to this node.

16. **Add qualified candidate to Zoho CRM:**  
    - Add HTTP Request node `add qualified to zoho crm1`.  
    - Method: POST to `https://www.zohoapis.com/crm/v6/qualified_resume`.  
    - JSON body includes:  
      - Name from JotForm submission  
      - Email from JotForm submission  
      - resume_Score from Information Extractor  
      - qualified = true  
      - Key_Strength from Information Extractor  
      - Recommended_Action = "followup"  
    - Use Zoho OAuth2 credentials.  
    - Connect true output of `if score > 58?` to this node.

17. **Send congratulatory email to qualified candidates:**  
    - Add Gmail node `send congratulations`.  
    - To: candidate email from JotForm.  
    - Subject: "Resume Analyzed Results"  
    - HTML message: Styled email congratulating candidate with strengths.  
    - Use Gmail OAuth2 credentials.  
    - Connect output of `add qualified to zoho crm1` to this node.

18. **Send constructive feedback email to others:**  
    - Add Gmail node `send feedback for changes`.  
    - To: candidate email from JotForm.  
    - Subject: "Resume Analyzed Results"  
    - HTML message: Styled email with strengths and areas for improvement in bullet lists.  
    - Use Gmail OAuth2 credentials.  
    - Connect false output of `if score > 58?` to this node.

---

### 5. General Notes & Resources

| Note Content                                                                                                  | Context or Link                                                             |
|---------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------|
| Workflow automates resume screening using JotForm, Azure OCR, GPT-4.1, Zoho CRM, and Gmail integration.      | Workflow title and description                                             |
| Azure OCR is used asynchronously: polling is implemented with wait and retry logic.                           | Azure OCR nodes & polling logic details                                    |
| GPT-4.1 assistant designed as professional career coach for resume feedback.                                 | Assistant creation node and prompt instructions                            |
| Email templates use styled HTML for clear branded communication.                                             | Gmail nodes with embedded HTML email content                              |
| PostgreSQL stores submission metadata for tracking and future reference.                                     | DB nodes and schema creation                                               |
| Zoho CRM integration via OAuth2 updates candidate status for qualified resumes.                              | HTTP Request node with Zoho API and credentials                           |
| PDF.co API converts PDF resumes to JPG images to enable Azure OCR.                                           | PDF conversion node details                                               |

---

**Disclaimer:**  
The provided content is extracted exclusively from an automated n8n workflow designed with compliance to current content policies. It contains no illegal, offensive, or protected material. All processed data is lawful and public.

---