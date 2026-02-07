Automate Invoice Data Extraction with OCR.Space, GPT & Google Sheets

https://n8nworkflows.xyz/workflows/automate-invoice-data-extraction-with-ocr-space--gpt---google-sheets-10269


# Automate Invoice Data Extraction with OCR.Space, GPT & Google Sheets

---

### 1. Workflow Overview

This workflow automates the extraction of invoice data from PDF or image files stored in a Google Drive folder. It performs OCR (Optical Character Recognition) on the files using the OCR.Space API, cleans and normalizes the extracted text, then applies an AI model (GPT-4o-mini) to convert the noisy OCR text into a structured JSON format representing invoice details. Finally, it appends the extracted structured data into a Google Sheets document for accounting and record-keeping.

The workflow is designed for Japanese invoices and handles localized date and currency formats. It runs on a weekly schedule but can also be manually triggered.

**Logical blocks:**

- **1.1 Schedule Trigger:** Periodically initiates the process.
- **1.2 Google Drive Folder Discovery:** Identifies the target Drive folders and lists invoice files.
- **1.3 OCR Processing:** Downloads files and extracts text via OCR.Space API, includes text cleanup.
- **1.4 AI Extraction & JSON Parsing:** Converts cleaned OCR text into structured invoice JSON using GPT, then parses AI output safely.
- **1.5 Append to Google Sheets:** Inserts extracted invoice data as rows into a specified Google Sheets sheet.

---

### 2. Block-by-Block Analysis

#### 1.1 Schedule Trigger

- **Overview:**  
  Triggers the workflow execution weekly on a specified day and time to scan the invoice folder. Enables periodic automation without manual intervention.

- **Nodes Involved:**  
  - Schedule Trigger (Weekly Scan)

- **Node Details:**  
  - **Schedule Trigger (Weekly Scan)**  
    - Type: Schedule Trigger  
    - Configuration: Fires every week on Monday at 20:00 (8 PM).  
    - Inputs: None (start node)  
    - Outputs: Connects to "Get Parent Folder" node  
    - Edge cases: Potential issues if the workflow is not active or system time zone misalignment.  
    - Notes: Supports manual triggering for debugging.  
 
#### 1.2 Google Drive Folder Discovery

- **Overview:**  
  Locates the parent folder named "支払い請求書自動計算用フォルダ" (Folder for automatic invoice calculation), then discovers the current month’s subfolder (e.g., "2025年10月分"). Lists all invoice files (PDFs and images) inside that monthly folder.

- **Nodes Involved:**  
  - Get Parent Folder  
  - Get Monthly Subfolder  
  - List Files

- **Node Details:**  
  - **Get Parent Folder**  
    - Type: Google Drive node (fileFolder resource)  
    - Configuration: Queries folder named exactly "支払い請求書自動計算用フォルダ". Returns all matching folders (should be unique).  
    - Credentials: Google Drive OAuth2 API  
    - Input: Trigger from Schedule Trigger  
    - Output: Passes folder ID to "Get Monthly Subfolder"  
    - Edge cases: Folder not found or multiple folders with same name—may cause empty or ambiguous results.  
  - **Get Monthly Subfolder**  
    - Type: Google Drive node (fileFolder resource)  
    - Configuration: Filters folders with parent ID from previous node, MIME type folder, and name containing current year and month in Japanese format (e.g., "2025年10月分"), using Asia/Tokyo timezone.  
    - Credentials: Google Drive OAuth2 API  
    - Input: From "Get Parent Folder"  
    - Output: Passes monthly folder ID to "List Files"  
    - Edge cases: If monthly folder is missing (e.g., early in the month), results will be empty; workflow should handle gracefully.  
  - **List Files**  
    - Type: Google Drive node (fileFolder resource)  
    - Configuration: Lists files under monthly folder ID, filtering for PDFs and image MIME types only.  
    - Credentials: Google Drive OAuth2 API  
    - Input: From "Get Monthly Subfolder"  
    - Output: List of invoice files passed to "Download File (Binary from Drive)"  
    - Edge cases: No files found; empty output. Permissions errors if Drive access is insufficient.

#### 1.3 OCR Processing (PDF → Text Cleanup)

- **Overview:**  
  Downloads each listed invoice file as binary data. Sends binary to OCR.Space API for text extraction (Japanese language, table detection enabled). Then cleans and normalizes the raw OCR text to reduce noise, unify line breaks, and standardize spacing and characters.

- **Nodes Involved:**  
  - Download File (Binary from Drive)  
  - OCR (OCR.Space Parsing)  
  - Clean OCR Text (Noise Removal)

- **Node Details:**  
  - **Download File (Binary from Drive)**  
    - Type: Google Drive node (download operation)  
    - Configuration: Downloads file by ID from "List Files" node. Binary property named "data".  
    - Credentials: Google Drive OAuth2 API  
    - Input: Each file from List Files  
    - Output: Binary data sent to OCR node  
    - Edge cases: Download errors if file is missing or permission denied; network timeout.  
  - **OCR (OCR.Space Parsing)**  
    - Type: HTTP Request node  
    - Configuration: POST multipart/form-data to OCR.Space API endpoint; sends binary file data, language set to Japanese "jpn", OCR engine 2, table detection enabled, no overlay. API key passed in header.  
    - Input: Binary data from previous node  
    - Output: JSON OCR results  
    - Edge cases: API key invalid or quota exceeded, OCR timeout, malformed response, file too large.  
  - **Clean OCR Text (Noise Removal)**  
    - Type: Code (JavaScript) node  
    - Configuration: Processes OCR JSON response, extracts raw parsed text, applies regex replacements to unify line breaks, remove extra spaces, convert full-width spaces to half-width, normalize quotation marks, unify yen symbols, and trim.  
    - Input: OCR JSON response  
    - Output: Cleaned plain text JSON with key "text"  
    - Edge cases: Missing ParsedResults or ParsedText; malformed JSON.

#### 1.4 AI Extraction & JSON Parsing

- **Overview:**  
  Uses GPT-4o-mini to analyze cleaned Japanese invoice text and extract structured invoice data as a strict JSON object. Then parses the AI’s JSON output safely to handle parsing errors.

- **Nodes Involved:**  
  - AI Extraction (Generate Structured JSON)  
  - Parse AI Output to JSON

- **Node Details:**  
  - **AI Extraction (Generate Structured JSON)**  
    - Type: LangChain OpenAI node (GPT-4o-mini)  
    - Configuration:  
      - System prompt instructs AI to parse Japanese invoice OCR text with noise and layout issues into a fixed JSON schema including invoice_date, due_date, client_name, subtotal, tax, total, bank_info, items array, and notes.  
      - Enforces strict output format: JSON only, no explanations or extra text.  
      - Language and date normalization rules included in prompt.  
    - Credentials: OpenAI API  
    - Input: Cleaned OCR text from prior node  
    - Output: AI response with JSON string in message.content  
    - Edge cases: API rate limits, malformed or incomplete AI output, non-JSON output, network issues.  
  - **Parse AI Output to JSON**  
    - Type: Code (JavaScript) node  
    - Configuration: Parses the AI’s message.content string safely as JSON. If invalid, outputs an error object with raw content for troubleshooting.  
    - Input: AI response JSON string  
    - Output: Parsed JSON invoice data or error JSON  
    - Edge cases: Parsing failures, unexpected AI output formats.

#### 1.5 Append to Google Sheets

- **Overview:**  
  Appends the extracted invoice data as a new row into a Google Sheets document. Uses monthly subfolder name as the sheet name (fallback to "請求書台帳"). Maps invoice fields including totals, dates, bank info, client name, and a link to the original PDF.

- **Nodes Involved:**  
  - Append to Google Sheets

- **Node Details:**  
  - **Append to Google Sheets**  
    - Type: Google Sheets node  
    - Configuration:  
      - Document ID specified by parameter.  
      - Sheet name dynamically set to monthly folder name or default "請求書台帳".  
      - Columns mapped: 合計 (total), 小計 (subtotal), 消費税 (tax), 請求日 (invoice_date), 支払期限 (due_date), 取引先名 (client_name), 銀行名 (bank_name + branch + account_type), 口座名義 (account_name), 口座番号 (account_number), PDFリンク (webViewLink from Drive).  
      - Append operation (adds new row).  
    - Credentials: Google Sheets OAuth2 API  
    - Input: Parsed AI JSON and file metadata from earlier nodes  
    - Output: None (end of flow)  
    - Edge cases: Sheet or document ID incorrect, permission errors, mapping failures, missing data fields.

---

### 3. Summary Table

| Node Name                      | Node Type                        | Functional Role                            | Input Node(s)               | Output Node(s)                      | Sticky Note                                                                                                      |
|-------------------------------|---------------------------------|--------------------------------------------|-----------------------------|-----------------------------------|-----------------------------------------------------------------------------------------------------------------|
| Schedule Trigger (Weekly Scan) | Schedule Trigger                 | Periodic trigger to start workflow weekly  | None                        | Get Parent Folder                 | ## Schedule Trigger (Recurring Execution) Purpose - Periodically scan the Drive folder that stores invoice PDFs. - Can also be executed manually for debugging. |
| Get Parent Folder              | Google Drive                    | Locate parent invoice folder                 | Schedule Trigger (Weekly Scan) | Get Monthly Subfolder             | ## Google Drive Folder Discovery Purpose - Get the parent folder (e.g., "支払い請求書自動計算用フォルダ"). - Auto-detect current month subfolder. - Search PDF/image files inside. |
| Get Monthly Subfolder          | Google Drive                    | Locate current month subfolder               | Get Parent Folder            | List Files                      | See above note                                                                                                  |
| List Files                    | Google Drive                    | List invoice PDF/image files                  | Get Monthly Subfolder        | Download File (Binary from Drive) | See above note                                                                                                  |
| Download File (Binary from Drive) | Google Drive (download)          | Download invoice file as binary               | List Files                  | OCR (OCR.Space Parsing)           | ## OCR Processing (PDF → Text Cleanup) Purpose - Download Drive files as binary. - Use OCR.Space API for extraction. - Remove noise and normalize line breaks. |
| OCR (OCR.Space Parsing)        | HTTP Request                   | Perform OCR text extraction on binary file   | Download File (Binary from Drive) | Clean OCR Text (Noise Removal)    | See above note                                                                                                  |
| Clean OCR Text (Noise Removal) | Code (JavaScript)              | Clean and normalize raw OCR text              | OCR (OCR.Space Parsing)      | AI Extraction (Generate Structured JSON) | See above note                                                                                                  |
| AI Extraction (Generate Structured JSON) | LangChain OpenAI (GPT-4o-mini) | Extract structured invoice JSON from cleaned text | Clean OCR Text (Noise Removal) | Parse AI Output to JSON           | ## AI Structured Extraction & Google Sheets Append Purpose - Convert OCR results to strict JSON using GPT. - Extract invoice_date, due_date, client_name, subtotal, tax, total, bank_info, etc. - Normalize with Code node, append to Google Sheets. |
| Parse AI Output to JSON        | Code (JavaScript)              | Safely parse AI JSON output                   | AI Extraction (Generate Structured JSON) | Append to Google Sheets          | See above note                                                                                                  |
| Append to Google Sheets        | Google Sheets                  | Append extracted invoice data as new row     | Parse AI Output to JSON      | None                            | See above note                                                                                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Type: Schedule Trigger  
   - Set to trigger weekly on Monday at 20:00 (8 PM) in your desired timezone.

2. **Add a Google Drive node: Get Parent Folder**  
   - Resource: File/Folder  
   - Operation: List  
   - Query: `=支払い請求書自動計算用フォルダ` (exact folder name, Japanese)  
   - Credentials: Configure Google Drive OAuth2 API with appropriate scopes (read access).

3. **Add another Google Drive node: Get Monthly Subfolder**  
   - Resource: File/Folder  
   - Operation: List  
   - Query: `='{{$json["id"]}}' in parents and mimeType='application/vnd.google-apps.folder' and name contains '{{$now.setZone("Asia/Tokyo").format("yyyy年MM月")}}分'`  
   - Credentials: Same Google Drive OAuth2 API  
   - Connect input from Get Parent Folder node.

4. **Add a Google Drive node: List Files**  
   - Resource: File/Folder  
   - Operation: List  
   - Query: `='{{$json["id"]}}' in parents and (mimeType='application/pdf' or mimeType contains 'image/')`  
   - Fields: Include `webViewLink`, `id`, `mimeType`, `name`  
   - Credentials: Same Google Drive OAuth2 API  
   - Connect input from Get Monthly Subfolder node.

5. **Add Google Drive node: Download File (Binary from Drive)**  
   - Operation: Download  
   - File ID: Use expression `{{$json["id"]}}` from List Files node  
   - Binary Property Name: `data`  
   - Credentials: Same Google Drive OAuth2 API  
   - Connect input from List Files node.

6. **Add HTTP Request node: OCR (OCR.Space Parsing)**  
   - Method: POST  
   - URL: `https://api.ocr.space/parse/image`  
   - Content Type: multipart/form-data  
   - Body Parameters:  
     - `file`: binary data from previous node's `data` field  
     - `language`: `jpn`  
     - `isOverlayRequired`: `false`  
     - `OCREngine`: `2`  
     - `isTable`: `true`  
     - `scale`: `true`  
   - Headers:  
     - `apikey`: your OCR.Space API key  
   - Connect input from Download File node.

7. **Add Code node: Clean OCR Text (Noise Removal)**  
   - Language: JavaScript  
   - Script:  
     ```js
     return items.map(item => {
       const parsed = item.json["ParsedResults"]?.[0];
       let text = parsed?.ParsedText || "";

       text = text
         .replace(/\r/g, "\n")
         .replace(/\n{2,}/g, "\n")
         .replace(/[^\S\n]+/g, " ")
         .replace(/　/g, " ")
         .replace(/[“”]/g, '"')
         .replace(/[‘’]/g, "'")
         .replace(/[円¥]/g, "円");

       return { json: { text: text.trim() } };
     });
     ```
   - Connect input from OCR node.

8. **Add LangChain OpenAI node: AI Extraction (Generate Structured JSON)**  
   - Model: GPT-4o-mini  
   - System Prompt: Provide detailed instructions to parse Japanese invoice text from OCR into structured JSON with fields invoice_date, due_date, client_name, subtotal, tax, total, bank_info, items, notes (use the prompt text from the workflow).  
   - Input: The cleaned OCR text from previous node as `{{ $json.text }}`  
   - Credentials: OpenAI API key with appropriate access  
   - Connect input from Clean OCR Text node.

9. **Add Code node: Parse AI Output to JSON**  
   - Language: JavaScript  
   - Script:  
     ```js
     return items.map(item => {
       const content = item.json.message?.content;
       let parsed = {};
       try {
         parsed = typeof content === "string" ? JSON.parse(content) : content;
       } catch (e) {
         parsed = { error: "Invalid JSON", raw: content };
       }
       return { json: parsed };
     });
     ```
   - Connect input from AI Extraction node.

10. **Add Google Sheets node: Append to Google Sheets**  
    - Operation: Append  
    - Document ID: Your target Google Sheets document ID  
    - Sheet Name: Expression `={{ ($item(0).$node["Get Monthly Subfolder"].json.name || "請求書台帳").trim() }}`  
    - Map columns (define below):  
      - 請求日: `={{ $json.invoice_date }}`  
      - 支払期限: `={{ $json.due_date }}`  
      - 取引先名: `={{ $json.client_name }}`  
      - 小計: `={{ $json.subtotal }}`  
      - 消費税: `={{ $json.tax }}`  
      - 合計: `={{ $json.total }}`  
      - 銀行名: `={{ $json.bank_info.bank_name }} {{ $json.bank_info.branch }} {{ $json.bank_info.account_type }}`  
      - 口座名義: `={{ $json.bank_info.account_name }}`  
      - 口座番号: `={{ $json.bank_info.account_number }}`  
      - PDFリンク: `={{ $('List Files').item.json.webViewLink }}`  
    - Credentials: Google Sheets OAuth2 API with write access  
    - Connect input from Parse AI Output node.

11. **Connect all nodes according to the flow:**  
    - Schedule Trigger → Get Parent Folder → Get Monthly Subfolder → List Files → Download File → OCR → Clean OCR Text → AI Extraction → Parse AI Output → Append to Google Sheets

12. **Credential Setup:**  
    - Google Drive OAuth2 API: with drive.readonly or appropriate scopes  
    - Google Sheets OAuth2 API: with sheets API read/write scopes  
    - OpenAI API key: with access to GPT-4o-mini or equivalent  
    - OCR.Space API key: with quota for OCR requests

13. **Optional:**  
    - Add error handling nodes (e.g., catch errors and send notifications)  
    - Activate workflow and test with sample invoices.

---

### 5. General Notes & Resources

| Note Content                                                                                                            | Context or Link                                                                                                  |
|-------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| The workflow is tailored for Japanese invoices, handling localized date and currency formats (e.g., "2025年10月分").       | Japanese invoice processing context                                                                              |
| AI prompt enforces strict JSON output with no extra text or code fences to ensure clean data parsing.                    | GPT prompt design best practices                                                                                 |
| OCR.Space API allows table detection and Japanese language recognition, improving accuracy on structured invoices.       | https://ocr.space/OCRAPI                                                                                        |
| Google Drive folder naming convention uses year-month in Japanese format, requiring timezone-aware date formatting.      | n8n Date-time formatting with timezone                                                                             |
| Google Sheets columns and sheet names must match the mapped fields for proper data insertion.                           | Google Sheets API and n8n documentation                                                                          |
| Workflow includes sticky notes explaining the purpose of each functional block for easier maintenance and onboarding.    | Visual documentation embedded in n8n workflow                                                                     |

---

**Disclaimer:** The provided text is exclusively generated from an n8n automated workflow export. It fully respects content policies and contains no illegal or protected content. All processed data is legal and public.

---