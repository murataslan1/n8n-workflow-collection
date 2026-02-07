Automate Invoice Processing with OCR.Space, GPT-4 & Google Drive to Gmail

https://n8nworkflows.xyz/workflows/automate-invoice-processing-with-ocr-space--gpt-4---google-drive-to-gmail-8139


# Automate Invoice Processing with OCR.Space, GPT-4 & Google Drive to Gmail

### 1. Workflow Overview

This workflow automates the processing and sending of scanned invoice documents added to a specific Google Drive folder. It is designed for companies or service providers who receive invoices as scanned PDFs and want to automatically extract invoice data, cross-reference client information, and send invoices directly via email.

The workflow consists of the following logical blocks:

- **1.1 Input Reception and File Handling:** Watches a designated Google Drive folder for new invoice files, handles multiple invoices, and downloads each file for processing.

- **1.2 OCR Text Extraction:** Sends the invoice files to OCR.space for Optical Character Recognition (OCR) to extract text from the scanned PDFs.

- **1.3 Text Parsing and Company Name Extraction:** Processes the extracted text to find the company name billed on the invoice.

- **1.4 AI Cross-Referencing:** Uses an AI agent powered by GPT-4 to cross-reference the extracted company name against a Google Sheets database to retrieve the recipient's email address.

- **1.5 Conditional Logic and Error Handling:** Determines if the company was found; if not, sends error notification emails for manual intervention.

- **1.6 Sending Invoice Email:** Sends the invoice with the attached file to the identified recipient's email address.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and File Handling

**Overview:**  
This block detects new invoices placed in a specific Google Drive folder, supports processing multiple files by looping over them, and downloads each invoice file for OCR processing.

**Nodes Involved:**  
- Google Drive Trigger1  
- Loop Over Items  
- Google Drive  
- No Operation, do nothing1  
- Merge

**Node Details:**

- **Google Drive Trigger1**  
  - *Type:* Trigger node  
  - *Role:* Watches a configured Google Drive folder, polling every minute to detect newly added invoice files.  
  - *Configuration:* Watches a specific folder ID (to be set by user).  
  - *Credentials:* Google Drive OAuth2 required.  
  - *Input:* None (trigger)  
  - *Output:* List of new files detected.  
  - *Potential Failures:* Authentication errors, folder permission issues, API quota limits.  
  - *Sticky Note:* "Here we set a google drive folder, where any time an invoice is added, the automation will be triggered automatically."

- **Loop Over Items**  
  - *Type:* SplitInBatches  
  - *Role:* Processes each invoice file individually, handling multiple invoices added simultaneously.  
  - *Configuration:* Default batching, no special options.  
  - *Input:* Files from Google Drive Trigger1.  
  - *Output:* One file at a time for sequential processing.  
  - *Sticky Note:* "Here we loop over the items, because we may have more than 1 invoice placed in the folder."  
  - *Failures:* Large batches may cause delays; batch size defaults should be considered.

- **Google Drive**  
  - *Type:* Google Drive node  
  - *Role:* Downloads the invoice file using file ID from the trigger.  
  - *Configuration:* Operation set to "download" with dynamic file ID from trigger.  
  - *Credentials:* Google Drive OAuth2 required.  
  - *Input:* File ID from Loop Over Items.  
  - *Output:* Binary file data.  
  - *Sticky Note:* "Here we download the invoice to pass it on to the OCR from ocr space."  
  - *Failures:* File access errors, download failures, permission errors.

- **No Operation, do nothing1**  
  - *Type:* NoOp  
  - *Role:* Used as a pass-through or flow control node for connection purposes.  
  - *Input:* From Google Drive node.  
  - *Output:* Passes data unchanged.  
  - *Sticky Note:* None.

- **Merge**  
  - *Type:* Merge (combine mode)  
  - *Role:* Combines outputs from the No Operation node and AI Agent (later in the flow) to coordinate processing steps.  
  - *Input:* Receives from No Operation and AI Agent nodes.  
  - *Output:* Sends combined data to the If node for conditional checking.  
  - *Sticky Note:* None.  
  - *Failures:* Mismatched inputs or timing issues could cause sync problems.

---

#### 2.2 OCR Text Extraction

**Overview:**  
Sends each downloaded invoice file to the OCR.space API to extract text content from the scanned invoice.

**Nodes Involved:**  
- HTTP Request1  
- Edit Fields

**Node Details:**

- **HTTP Request1**  
  - *Type:* HTTP Request  
  - *Role:* Sends invoice binary file to OCR.space API endpoint using multipart/form-data POST request.  
  - *Configuration:*  
    - URL: https://api.ocr.space/parse/image  
    - Method: POST  
    - Parameters: Language set to English ("eng"), file sent as binary form data.  
    - Authentication: Generic header with API key (apikey header).  
  - *Credentials:* Generic HTTP Header Auth with OCR.space API key.  
  - *Input:* Binary file from Google Drive node.  
  - *Output:* JSON response with parsed text results.  
  - *Sticky Note:* "Here we are sending the downloaded file to OCR space, and getting the extracted information from the invoice."  
  - *Failures:* API key invalid or quota exceeded, network timeout, malformed file errors.

- **Edit Fields**  
  - *Type:* Set node  
  - *Role:* Extracts and assigns the parsed text string from the OCR API response for easier access downstream.  
  - *Configuration:* Sets a JSON field "text" with value from `ParsedResults[0].ParsedText`.  
  - *Input:* OCR JSON response.  
  - *Output:* JSON with assigned "text" field.  
  - *Sticky Note:* "Assigning name to the text."  
  - *Failures:* Missing or unexpected OCR response structure.

---

#### 2.3 Text Parsing and Company Name Extraction

**Overview:**  
Parses the OCR-extracted text to identify the company name listed after the phrase "Billed to" on the invoice.

**Nodes Involved:**  
- Code

**Node Details:**

- **Code**  
  - *Type:* Code (JavaScript)  
  - *Role:* Splits the extracted text into lines, finds the line containing "Billed to", and extracts the company name from the following lines using heuristic checks.  
  - *Configuration:*  
    - Searches case-insensitive for "billed to".  
    - Validates lines for probable company name based on length and letter casing.  
    - Throws error if company name not found.  
  - *Input:* JSON with "text" field from Edit Fields.  
  - *Output:* JSON object with key "company" containing extracted company name.  
  - *Sticky Note:* "Extracting company name. In this case after the billed to:"  
  - *Failures:*  
    - OCR text does not contain "Billed to" phrase.  
    - Company name line missing or malformed.  
    - Throws error caught by workflow error handling.

---

#### 2.4 AI Cross-Referencing

**Overview:**  
Uses an AI agent (GPT-4-based) to cross-reference the extracted company name against a Google Sheets database to find a matching company and retrieve the associated email address.

**Nodes Involved:**  
- AI Agent  
- Google Sheets  
- OpenAI Chat Model  
- Structured Output Parser1  
- Merge1  
- Error1

**Node Details:**

- **AI Agent**  
  - *Type:* Langchain AI Agent  
  - *Role:* Receives company name and queries Google Sheets database to find exact case-insensitive match for company name; returns JSON with company name and email or an error message.  
  - *Configuration:*  
    - System message instructs querying a Google Sheet with company names and emails.  
    - Returns structured JSON.  
    - Retry enabled with 5-second wait between tries.  
  - *Input:* Company name from Code node.  
  - *Output:* JSON with "company_name" and "email" or error message.  
  - *Sticky Note:* "AI Agent cross references name with Database and returns the recipients email address."  
  - *Failures:*  
    - Network or API errors.  
    - No match found (returns error JSON).  
    - Google Sheets access issues.

- **Google Sheets**  
  - *Type:* Google Sheets Tool  
  - *Role:* Provides access to the company database spreadsheet.  
  - *Configuration:* Reads from a specific Google Sheet document ID and sheet name.  
  - *Credentials:* Google Sheets OAuth2 required.  
  - *Input:* Used internally by AI Agent for lookup.  
  - *Output:* Company and email data for AI logic.  
  - *Failures:* Permission errors, sheet ID changes.

- **OpenAI Chat Model**  
  - *Type:* Langchain OpenAI Chat Model  
  - *Role:* Executes GPT-4 chat completion requests as part of the AI agent's processing.  
  - *Configuration:* Model set to "gpt-4o-mini" (a variant of GPT-4).  
  - *Credentials:* OpenAI API key required.  
  - *Input:* Prompts from AI Agent.  
  - *Output:* GPT-4 responses.  
  - *Failures:* Quota limits, auth failures.

- **Structured Output Parser1**  
  - *Type:* Langchain Structured Output Parser  
  - *Role:* Parses GPT-4 response into structured JSON as defined by schema (email and name fields).  
  - *Configuration:* Auto-fix enabled to handle minor format errors.  
  - *Failures:* Parsing errors if output format is unexpected.

- **Merge1**  
  - *Type:* Merge (combine mode)  
  - *Role:* Combines AI Agent outputs with error handling and flow control.  
  - *Failures:* Timing or data mismatch issues.

- **Error1**  
  - *Type:* Gmail node  
  - *Role:* Sends error notification email if AI Agent returns an error (company not found).  
  - *Configuration:*  
    - Sends to configured operator email.  
    - Message instructs manual check of database and invoice file.  
  - *Credentials:* Gmail OAuth2 required.  
  - *Failures:* Email sending errors, credential failures.

---

#### 2.5 Conditional Logic and Error Handling

**Overview:**  
Checks if the AI Agent found a company email; if yes, proceeds to send the invoice email; if no, triggers error email notifications.

**Nodes Involved:**  
- If  
- Error  
- Send Email

**Node Details:**

- **If**  
  - *Type:* If node  
  - *Role:* Checks if AI Agent output is not empty (i.e., valid company found).  
  - *Condition:* Verifies that the AI Agent output JSON is not empty.  
  - *Input:* Merged data containing AI Agent output.  
  - *Output:*  
    - True branch: proceeds to send invoice email.  
    - False branch: triggers error email.  
  - *Failures:* Logic errors if output format changes.

- **Error**  
  - *Type:* Gmail node  
  - *Role:* Sends error notification email if no valid company email found or other issues.  
  - *Configuration:*  
    - Same error message as Error1.  
    - Sends to operator email.  
  - *Credentials:* Gmail OAuth2 required.  
  - *Sticky Note:* "If we have any errors, we send an email to the operator for manual review."  
  - *Failures:* Email sending failures.

- **Send Email**  
  - *Type:* Gmail node  
  - *Role:* Sends the invoice email with the attached file to the recipient's email found by AI Agent.  
  - *Configuration:*  
    - Uses recipient email from AI Agent output.  
    - Attaches original invoice binary file.  
    - Sends plain text message (can be customized).  
  - *Credentials:* Gmail OAuth2 required.  
  - *Sticky Note:* "Send email to recipient with the invoice attached."  
  - *Failures:* Email sending failures, attachment size limits.

---

### 3. Summary Table

| Node Name               | Node Type                          | Functional Role                                               | Input Node(s)              | Output Node(s)            | Sticky Note                                                                                  |
|-------------------------|----------------------------------|---------------------------------------------------------------|----------------------------|---------------------------|----------------------------------------------------------------------------------------------|
| Google Drive Trigger1    | Google Drive Trigger              | Watches Google Drive folder for new invoices                   | None                       | Loop Over Items            | Here we set a google drive folder, where any time an invoice is added, the automation triggers automatically |
| Loop Over Items          | SplitInBatches                   | Processes each invoice file individually                        | Google Drive Trigger1       | No Operation, do nothing / Google Drive | Here we loop over the items, because we may have more than 1 invoice placed in the folder     |
| Google Drive            | Google Drive                     | Downloads invoice file                                         | Loop Over Items             | HTTP Request1, Merge1, No Operation, do nothing1 | Here we download the invoice to pass it on to the OCR from ocr space                          |
| No Operation, do nothing1| No Operation                    | Pass-through for flow control                                  | Google Drive                | Merge                     |                                                                                              |
| Merge                   | Merge (combine)                 | Combines AI Agent and NoOp outputs                             | No Operation, do nothing1, AI Agent | If                        |                                                                                              |
| HTTP Request1           | HTTP Request                   | Sends invoice file to OCR.space API                            | Google Drive                | Edit Fields                | Here we are sending the downloaded file to OCR space, and getting the extracted information from the invoice |
| Edit Fields             | Set                            | Extracts parsed text from OCR response                         | HTTP Request1              | Code                      | Assigning name to the text.                                                                  |
| Code                    | Code (JavaScript)              | Extracts company name from OCR text                            | Edit Fields                | AI Agent, Merge1           | Extracting company name. In this case after the billed to:                                  |
| AI Agent                | Langchain AI Agent             | Cross-references company name with Google Sheets database      | Code                       | Merge, Merge1              | AI Agent cross references name with Database and returns the recipients email address        |
| Google Sheets           | Google Sheets Tool             | Provides company name and email database                       | AI Agent (ai_tool input)   | AI Agent (ai_tool output)  |                                                                                              |
| OpenAI Chat Model       | Langchain OpenAI Chat Model    | Executes GPT-4 prompts                                        | AI Agent (ai_languageModel input) | AI Agent (ai_languageModel output) |                                                                                              |
| Structured Output Parser1| Langchain Structured Output Parser | Parses AI response into structured JSON                      | OpenAI Chat Model (ai_outputParser output) | AI Agent (ai_outputParser input) |                                                                                              |
| Merge1                  | Merge (combine)                | Combines AI Agent outputs for error handling                  | Google Drive, AI Agent      | Error1                    |                                                                                              |
| Error1                  | Gmail                         | Sends error notification email to operator                    | Merge1                     | Loop Over Items            | If we have any errors, we send an email to the operator for manual review                    |
| If                      | If                            | Checks if AI Agent found valid company email                   | Merge                      | Send Email (true), Error (false) |                                                                                              |
| Error                   | Gmail                         | Sends error notification email to operator                    | If                         | Loop Over Items            | If we have any errors, we send an email to the operator for manual review                    |
| Send Email              | Gmail                         | Sends invoice email with attachment to client                 | If                         | Loop Over Items            | Send email to recipient with the invoice attached                                           |
| No Operation, do nothing | No Operation                  | Pass-through node                                             | Loop Over Items             | Merge                     |                                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Google Drive Trigger:**  
   - Create a Google Drive Trigger node.  
   - Set it to poll "every minute".  
   - Configure it to watch a specific folder (set folder ID).  
   - Connect Google Drive OAuth2 credentials.

2. **Loop Over Items:**  
   - Add a SplitInBatches node named "Loop Over Items".  
   - Connect it to the Google Drive Trigger output.  
   - Use default batch size.

3. **Google Drive (Download):**  
   - Add a Google Drive node.  
   - Set operation to "Download".  
   - Use expression to set File ID from the trigger item JSON (e.g., `{{$json["id"]}}`).  
   - Connect "Loop Over Items" output to this node.  
   - Use same Google Drive OAuth2 credentials.

4. **No Operation (Pass-through):**  
   - Add a No Operation node named "No Operation, do nothing1".  
   - Connect Google Drive node output to it.

5. **Merge:**  
   - Add a Merge node with mode "combine" and combine by position.  
   - Connect "No Operation, do nothing1" output to first input.  
   - Connect AI Agent output (to be created later) to second input.

6. **HTTP Request (OCR):**  
   - Add an HTTP Request node named "HTTP Request1".  
   - Set method to POST, URL to `https://api.ocr.space/parse/image`.  
   - Set content type to multipart/form-data.  
   - Add body parameters:
     - language = "eng"  
     - file = binary form data from the invoice file (field: "data").  
   - Set Authentication to Generic Credential Type with HTTP Header Auth.  
   - Create credentials with header key "apikey" and your OCR.space API key as value.  
   - Connect Google Drive node output to this HTTP Request.

7. **Edit Fields:**  
   - Add a Set node named "Edit Fields".  
   - Configure to set a JSON field "text" with value `{{$json["ParsedResults"][0]["ParsedText"]}}`.  
   - Connect HTTP Request node output to this node.

8. **Code (Extract Company):**  
   - Add a Code node named "Code".  
   - Paste the JavaScript code that splits text by lines, searches for "Billed to", extracts company name from next lines with validation.  
   - Set error handling to continue on error.  
   - Connect "Edit Fields" to this node.

9. **Google Sheets:**  
   - Add a Google Sheets node.  
   - Set operation to read data from your configured Google Sheet containing company names and emails.  
   - Connect Google Sheets OAuth2 credentials.  
   - This node will be configured as an AI tool input (see AI Agent below).

10. **OpenAI Chat Model:**  
    - Add the Langchain OpenAI Chat Model node.  
    - Select model "gpt-4o-mini".  
    - Connect OpenAI API credentials.  
    - This node will be configured as AI language model input for AI Agent.

11. **Structured Output Parser:**  
    - Add Langchain Structured Output Parser node.  
    - Set schema example with fields "email" and "name".  
    - Enable auto-fix.  
    - Connect this to AI Agent output parser input.

12. **AI Agent:**  
    - Add Langchain AI Agent node.  
    - Configure system prompt to instruct cross-referencing company name against the Google Sheets database (as per the prompt in workflow).  
    - Set retry on fail with 5-second wait.  
    - Connect inputs:
      - Text input connected from "Code" node output (field: company name).  
      - AI tool input from Google Sheets node.  
      - AI language model from OpenAI Chat Model node.  
      - AI output parser from Structured Output Parser node.  
    - Connect AI Agent output to second input of Merge node.

13. **Merge1:**  
    - Add a Merge node (combine mode by position) named "Merge1".  
    - Connect outputs from Google Drive node (download) and AI Agent to this node.

14. **Error1:**  
    - Add Gmail node named "Error1".  
    - Configure to send email to operator with subject "Error in workflow" and message explaining manual review needed.  
    - Configure Gmail OAuth2 credentials.  
    - Connect output from Merge1 to Error1.

15. **If Node:**  
    - Add an If node.  
    - Condition checks if AI Agent output JSON is not empty (specifically, `$('AI Agent').item.json.output` is not empty).  
    - Connect Merge node output to If node input.

16. **Error Node:**  
    - Add Gmail node named "Error".  
    - Configure same as Error1 (operator notification).  
    - Connect If node false output to this node.

17. **Send Email:**  
    - Add Gmail node named "Send Email".  
    - Configure to send email to recipient using email address from AI Agent output JSON.  
    - Attach the original invoice file binary.  
    - Connect If node true output to this node.  
    - Connect Send Email output back to Loop Over Items to continue processing next invoices.

18. **No Operation, do nothing:**  
    - Add a No Operation node named "No Operation, do nothing".  
    - Connect Loop Over Items first output to this node.  
    - Connect No Operation output to Merge node first input.

19. **Connect all nodes according to the flow:**  
    - Google Drive Trigger1 → Loop Over Items  
    - Loop Over Items → No Operation, do nothing (first output) → Merge (first input)  
    - Loop Over Items → Google Drive (second output) → HTTP Request1 → Edit Fields → Code → AI Agent → Merge (second input)  
    - Merge → If  
    - If true → Send Email → Loop Over Items  
    - If false → Error → Loop Over Items  
    - Google Drive → Merge1 → Error1 → Loop Over Items  

20. **Credentials Setup:**  
    - Google Drive OAuth2 (for trigger and file download).  
    - Gmail OAuth2 (for sending emails).  
    - OpenAI API key (for GPT-4).  
    - Generic HTTP Header Auth with OCR.space API key.  
    - Google Sheets OAuth2 (for accessing company database).

---

### 5. General Notes & Resources

| Note Content                                                                                                                                            | Context or Link                                                                                                   |
|---------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| Setting up the workflow: Connect Google Drive, Gmail, OCR.space (with API key), OpenAI GPT-4, and Google Sheets Database.                              | Sticky Note4 details in the workflow.                                                                            |
| OCR Space website: https://ocr.space                                                                                                                   | Official OCR API used for scanned text extraction.                                                               |
| Google Sheet Database template: https://docs.google.com/spreadsheets/d/1M0sS7KZzOn9Bu8Dy0lcrh2jWqVkLa0qFQfki1jecxeE/edit?usp=sharing (make a copy)      | Company database for AI cross-referencing.                                                                        |
| The AI Agent uses GPT-4 to perform fuzzy and case-insensitive matching of company names in the spreadsheet and returns structured output.               | Important for ensuring accurate email retrieval.                                                                 |
| Error handling includes notifying an operator by email if the company is not found or if any processing error occurs.                                  | Ensures manual intervention and workflow robustness.                                                             |
| The workflow supports multiple invoices by processing files in batches from the Google Drive folder.                                                   | Ensures scalability for multiple invoices arriving simultaneously.                                               |

---

**Disclaimer:**  
The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This process strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.