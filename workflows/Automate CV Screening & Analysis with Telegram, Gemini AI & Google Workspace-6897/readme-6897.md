Automate CV Screening & Analysis with Telegram, Gemini AI & Google Workspace

https://n8nworkflows.xyz/workflows/automate-cv-screening---analysis-with-telegram--gemini-ai---google-workspace-6897


# Automate CV Screening & Analysis with Telegram, Gemini AI & Google Workspace

### 1. Workflow Overview

This workflow automates the screening and analysis of candidate CVs submitted via Telegram. It validates that incoming files are PDFs, downloads the CV, uploads it to Google Drive, extracts text content from the PDF, uses Google Gemini AI for advanced CV content analysis, and finally saves structured candidate information into a Google Sheet. The workflow is designed for HR teams or recruiters to efficiently process CV submissions and maintain an organized candidate database.

**Logical Blocks:**

- **1.1 Input Reception:** Captures incoming CV files from Telegram messages.
- **1.2 File Validation & Feedback:** Checks if the submitted file is a PDF; requests resubmission if not.
- **1.3 File Download & Storage:** Downloads the CV from Telegram and uploads it to Google Drive.
- **1.4 Text Extraction:** Extracts textual content from the uploaded PDF file.
- **1.5 AI-powered CV Analysis:** Uses Google Gemini AI and a LangChain agent to analyze CV content and extract structured data.
- **1.6 Data Cleaning & Storage:** Parses AI output to clean and map data, then updates a Google Sheet with candidate details.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** Listens for incoming Telegram messages containing candidate CVs.
- **Nodes Involved:** `Message Trigger`
- **Node Details:**

  - **Message Trigger**
    - **Type:** Telegram Trigger node
    - **Role:** Listens for incoming messages in the Telegram bot.
    - **Configuration:** Watches for "message" updates.
    - **Key Variables:** Extracts `$json.message.document` which contains file metadata.
    - **Inputs:** None (trigger node).
    - **Outputs:** Passes message JSON forward.
    - **Potential Failures:** Telegram API downtime, webhook misconfiguration.
  
  - **Sticky Note:** "Captures incoming CV PDFs from candidates"

#### 2.2 File Validation & Feedback

- **Overview:** Validates that the submitted file is a PDF. If not, sends a Telegram message requesting a PDF.
- **Nodes Involved:** `File Validation`, `PDF Request`
- **Node Details:**

  - **File Validation**
    - **Type:** If node (conditional)
    - **Role:** Checks if the incoming file's MIME type equals 'application/pdf'.
    - **Configuration:** Condition uses expression `{{$json.message.document.mime_type === 'application/pdf'}}`.
    - **Inputs:** From `Message Trigger`.
    - **Outputs:** 
      - True branch: continues processing.
      - False branch: triggers PDF request message.
    - **Edge Cases:** Non-PDF files, missing document field.
  
  - **PDF Request**
    - **Type:** Telegram node (sending message)
    - **Role:** Sends a message to the candidate asking to resend CV in PDF format.
    - **Configuration:** Sends fixed text "Please send your CV in PDF format only" to the chat ID extracted from incoming message.
    - **Inputs:** From false branch of `File Validation`.
    - **Outputs:** None.
    - **Failure Modes:** Telegram API issues, invalid chat ID.
  
  - **Sticky Notes:**  
    - On `File Validation`: "Filters out non-PDF submissions"  
    - On `PDF Request`: "Sends a message asking the user to resend the CV in PDF format if validation fails."

#### 2.3 File Download & Storage

- **Overview:** Downloads the validated PDF file from Telegram and uploads it to Google Drive for storage.
- **Nodes Involved:** `Download CV File`, `Download Actual File`, `Store CV`, `Merge`
- **Node Details:**

  - **Download CV File**
    - **Type:** HTTP Request
    - **Role:** Calls Telegram API endpoint `getFile` to retrieve file path using `file_id`.
    - **Configuration:** URL constructed with Telegram bot token and `file_id` from message.
    - **Inputs:** True branch of `File Validation`.
    - **Outputs:** Provides JSON containing file path.
    - **Edge Cases:** Invalid token, file_id missing or expired.
  
  - **Download Actual File**
    - **Type:** HTTP Request
    - **Role:** Downloads the actual PDF file using the file path obtained.
    - **Configuration:** URL constructed from Telegram file download endpoint and file path.
    - **Inputs:** From `Download CV File`.
    - **Outputs:** Binary data of PDF file.
    - **Edge Cases:** Network timeout, file not found.
  
  - **Store CV**
    - **Type:** Google Drive node
    - **Role:** Uploads downloaded PDF binary to a specific Google Drive folder.
    - **Configuration:** Uses OAuth2 credentials, uploads with original filename, targets designated folder.
    - **Inputs:** From `Download Actual File`.
    - **Outputs:** Metadata of uploaded file including Google Drive file ID.
    - **Edge Cases:** Google Drive API limits, auth token expiry.
  
  - **Merge**
    - **Type:** Merge node
    - **Role:** Combines data streams from file storage and actual file download to pass complete info downstream.
    - **Configuration:** Mode "Choose Branch", uses data of second input.
    - **Inputs:** From `Store CV` and `Download Actual File`.
    - **Outputs:** Merged data with file info and binary content.
  
  - **Sticky Notes:**  
    - On `Download CV File`: "Gets the file download link from Telegram"  
    - On `Download Actual File`: "Downloads the actual PDF file"  
    - On `Store CV`: "Uploads the downloaded PDF file to Google Drive."  
    - On `Merge`: "Combines the file storage and download paths to pass data forward to extraction."

#### 2.4 Text Extraction

- **Overview:** Extracts textual content from the uploaded PDF for later AI analysis.
- **Nodes Involved:** `Extract cv content`
- **Node Details:**

  - **Extract cv content**
    - **Type:** Extract From File node
    - **Role:** Reads PDF binary input and extracts text.
    - **Configuration:** Operation set to "pdf".
    - **Inputs:** From `Merge`.
    - **Outputs:** Text content of the CV.
    - **Edge Cases:** Corrupt PDF, extraction errors.
  
  - **Sticky Note:** "Extracts text content from the uploaded PDF file for analysis."

#### 2.5 AI-powered CV Analysis

- **Overview:** Uses Google Gemini AI and a LangChain agent to analyze extracted CV text and produce structured candidate information.
- **Nodes Involved:** `Google Gemini Chat Model`, `Qualify CV Agent`
- **Node Details:**

  - **Google Gemini Chat Model**
    - **Type:** Google Gemini Chat Model (LangChain LM)
    - **Role:** Provides a large language model backend for the LangChain agent.
    - **Configuration:** Uses Google Palm API credentials; no additional options configured.
    - **Inputs:** AI language model input from `Qualify CV Agent`.
    - **Outputs:** AI-generated analysis text.
    - **Edge Cases:** API quota limits, latency.
  
  - **Qualify CV Agent**
    - **Type:** LangChain Agent node
    - **Role:** Acts as an expert HR assistant to parse CV text and extract structured data.
    - **Configuration:** Uses a detailed prompt that instructs the agent to extract full name, phone number, email, job title, and calculate experience with categorization logic.
    - **Key Expression:** Input text from extracted CV content: `From {{ $json.text }}`
    - **Output:** AI returns a strict JSON object with candidate details.
    - **Inputs:** From `Extract cv content` and AI language model connection from `Google Gemini Chat Model`.
    - **Outputs:** Passes AI output JSON text downstream.
    - **Edge Cases:** AI misinterpretation, malformed JSON output.
  
  - **Sticky Note:**  
    - On `Qualify CV Agent`: "Analyzes CV text and extracts structured data like name, phone number, email, experience, and job title."

#### 2.6 Data Cleaning & Storage

- **Overview:** Parses and cleans the AI output JSON, then saves candidate info, including CV link, into a Google Sheet.
- **Nodes Involved:** `Clean & Map Extracted Data`, `Save Candidate Info to Sheet`
- **Node Details:**

  - **Clean & Map Extracted Data**
    - **Type:** Set node
    - **Role:** Parses the AI output JSON string, removes markdown formatting (```json blocks), and assigns fields to usable variables.
    - **Configuration:** Uses expressions to parse and assign `full name`, `phone number`, `email`, `job title`, and `experience`.
    - **Inputs:** From `Qualify CV Agent`.
    - **Outputs:** Structured data fields for Google Sheets.
    - **Edge Cases:** Parsing errors if AI output is invalid JSON.
  
  - **Save Candidate Info to Sheet**
    - **Type:** Google Sheets node
    - **Role:** Appends or updates a Google Sheet with candidate details and a clickable CV link.
    - **Configuration:** 
      - Maps columns: Name, Email, Job Title, Experience, Phone Number, CV link.
      - Matches rows by Name to update existing entries.
      - Uses OAuth2 credentials.
      - Targets specific spreadsheet and sheet by ID and gid.
    - **Inputs:** From `Clean & Map Extracted Data`.
    - **Outputs:** Confirmation of sheet update.
    - **Edge Cases:** API quota, invalid spreadsheet ID, data conflicts.
  
  - **Sticky Notes:**  
    - On `Clean & Map Extracted Data`: "Cleans and maps the structured JSON AI output into individual fields for use in Google Sheets"  
    - On `Save Candidate Info to Sheet`: "Saves the extracted candidate information and CV link into a Google Sheet, updating existing entries if needed."

---

### 3. Summary Table

| Node Name                 | Node Type                       | Functional Role                                 | Input Node(s)             | Output Node(s)                | Sticky Note                                                                                   |
|---------------------------|--------------------------------|------------------------------------------------|---------------------------|------------------------------|----------------------------------------------------------------------------------------------|
| Message Trigger           | Telegram Trigger                | Captures incoming CV PDFs from candidates       | None                      | File Validation              | Captures incoming CV PDFs from candidates                                                   |
| File Validation           | If                             | Filters out non-PDF submissions                  | Message Trigger           | Download CV File (true), PDF Request (false) | Filters out non-PDF submissions                                                              |
| PDF Request               | Telegram                       | Requests user to resend CV in PDF format         | File Validation           | None                         | Sends a message asking the user to resend the CV in PDF format if validation fails.          |
| Download CV File          | HTTP Request                   | Gets the file download link from Telegram       | File Validation           | Download Actual File         | Gets the file download link from Telegram                                                   |
| Download Actual File      | HTTP Request                   | Downloads the actual PDF file                     | Download CV File          | Store CV, Merge              | Downloads the actual PDF file                                                                |
| Store CV                  | Google Drive                   | Uploads the downloaded PDF to Google Drive       | Download Actual File      | Merge                        | Uploads the downloaded PDF file to Google Drive.                                            |
| Merge                     | Merge                         | Combines file storage and download data          | Store CV, Download Actual File | Extract cv content          | Combines the file storage and download paths to pass data forward to extraction.             |
| Extract cv content        | Extract From File              | Extracts text content from the uploaded PDF      | Merge                     | Qualify CV Agent             | Extracts text content from the uploaded PDF file for analysis.                              |
| Google Gemini Chat Model  | LangChain LM Chat Model       | AI language model backend for CV analysis         | Qualify CV Agent (ai_languageModel) | Qualify CV Agent (ai_languageModel) |                                                                                              |
| Qualify CV Agent          | LangChain Agent               | Analyzes CV text and extracts structured data    | Extract cv content, Google Gemini Chat Model | Clean & Map Extracted Data    | Analyzes CV text and extracts structured data like name, phone number, email, experience, and job title. |
| Clean & Map Extracted Data | Set                           | Parses and cleans AI output JSON for storage     | Qualify CV Agent          | Save Candidate Info to Sheet | Cleans and maps the structured JSON AI output into individual fields for use in Google Sheets |
| Save Candidate Info to Sheet | Google Sheets                | Saves candidate info and CV link into spreadsheet | Clean & Map Extracted Data | None                        | Saves the extracted candidate information and CV link into a Google Sheet, updating existing entries if needed. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**
   - Type: Telegram Trigger
   - Configure: Listen to "message" updates.
   - Connect Telegram Bot credentials.
   - Position: Input start node.

2. **Add If Node "File Validation"**
   - Condition: Check if `{{$json.message.document.mime_type === 'application/pdf'}}` equals true.
   - Input: Connect from Telegram Trigger.
   - True branch: proceed with file processing.
   - False branch: send PDF request message.

3. **Add Telegram Node "PDF Request"**
   - Type: Telegram
   - Action: Send message.
   - Text: "Please send your CV in PDF format only."
   - Chat ID: `={{ $json.message.chat.id }}`
   - Input: Connect from false branch of File Validation.
   - Credentials: Telegram Bot credentials.

4. **Add HTTP Request Node "Download CV File"**
   - URL: `https://api.telegram.org/bot[YOUR_BOT_TOKEN]/getFile?file_id={{ $json.message.document.file_id }}`
   - Method: GET
   - Input: Connect from true branch of File Validation.

5. **Add HTTP Request Node "Download Actual File"**
   - URL: `https://api.telegram.org/file/bot[YOUR_BOT_TOKEN]/{{ $json.result.file_path }}`
   - Method: GET
   - Input: Connect from Download CV File.

6. **Add Google Drive Node "Store CV"**
   - Operation: Upload file
   - File Name: `={{ $('Message Trigger').item.json.message.document.file_name }}`
   - Folder ID: Set to your Google Drive folder ID (e.g., "HR-CVs" folder)
   - Credentials: Google Drive OAuth2
   - Input: Connect from Download Actual File.

7. **Add Merge Node "Merge"**
   - Mode: Choose Branch, use data of input 2.
   - Inputs: 
     - Input 1: Store CV
     - Input 2: Download Actual File

8. **Add Extract From File Node "Extract cv content"**
   - Operation: pdf
   - Input: Connect from Merge node.

9. **Add Google Gemini Chat Model Node**
   - Connect Google Palm API credentials.
   - No additional configuration required.

10. **Add LangChain Agent Node "Qualify CV Agent"**
    - Text prompt: Paste the detailed instructions for CV analysis including extraction and categorization rules (see Block 2.5).
    - Input: Connect from Extract cv content.
    - Connect AI language model input to Google Gemini Chat Model node.

11. **Add Set Node "Clean & Map Extracted Data"**
    - Add assignments for variables:
      - full name: `={{ JSON.parse($json["output"].replace(/```json|```/g, "").trim()).name }}`
      - phone number: `={{ JSON.parse($json["output"].replace(/```json|```/g, "").trim()).phone_number }}`
      - email: `={{ JSON.parse($json["output"].replace(/```json|```/g, "").trim()).email }}`
      - job title: `={{ JSON.parse($json["output"].replace(/```json|```/g, "").trim()).job_title }}`
      - experience: `={{ JSON.parse($json["output"].replace(/```json|```/g, "").trim()).experience }}`
    - Input: Connect from Qualify CV Agent.

12. **Add Google Sheets Node "Save Candidate Info to Sheet"**
    - Operation: Append or Update
    - Document ID: Your Google Sheets document ID.
    - Sheet Name: e.g., "gid=0" or sheet name.
    - Map columns:
      - CV: `"CV": "https://drive.google.com/file/d/{{ $node['Store CV'].json.id }}/view"`
      - Name, Email, Job Title, Experience, Phone Number: map from Set node fields.
    - Matching Columns: Name
    - Credentials: Google Sheets OAuth2
    - Input: Connect from Clean & Map Extracted Data.

13. **Finalize Connections:**
    - Connect nodes as per the logical flow:
      - Message Trigger → File Validation
      - File Validation true → Download CV File → Download Actual File → Store CV → Merge → Extract cv content → Qualify CV Agent → Clean & Map Extracted Data → Save Candidate Info to Sheet
      - File Validation false → PDF Request

14. **Credential Setup:**
    - Telegram Bot Account with bot token.
    - Google Drive OAuth2 credentials for file storage.
    - Google Sheets OAuth2 credentials for sheet access.
    - Google Palm API credentials for Google Gemini AI.

15. **Testing & Validation:**
    - Test with valid PDF CV submissions via Telegram.
    - Test with invalid file formats to confirm PDF Request message.
    - Verify Google Drive uploads and Google Sheets updates.

---

### 5. General Notes & Resources

| Note Content                                                                                                   | Context or Link                                                                                      |
|---------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| The workflow uses Google Gemini AI via LangChain for advanced natural language processing on CV content.      | Requires Google Palm API credentials.                                                              |
| CV experience calculation includes detailed rules such as internship weighting and overlap handling.         | Prompt embedded in `Qualify CV Agent` node.                                                        |
| Google Drive folder and Google Sheets document IDs must be replaced with valid IDs from your own workspace.   | Folder: Replace `[YOUR_FOLDER_ID]`, Sheet: Replace `[YOUR_SPREADSHEET_ID]`.                         |
| Telegram bot token must be replaced in HTTP request URLs.                                                     | Replace `[YOUR_BOT_TOKEN]` in Download CV File and Download Actual File nodes.                      |
| Telegram API rate limits and Google API quotas may affect workflow performance under heavy usage.             | Monitor API usage and consider quota management.                                                   |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.