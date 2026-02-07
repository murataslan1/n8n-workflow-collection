Automate Meeting Documentation with SharePoint, Word, Excel & Outlook

https://n8nworkflows.xyz/workflows/automate-meeting-documentation-with-sharepoint--word--excel---outlook-8671


# Automate Meeting Documentation with SharePoint, Word, Excel & Outlook

### 1. Workflow Overview

This workflow automates the documentation of meeting minutes by integrating Microsoft SharePoint, Word, Excel, and Outlook via n8n automation. Upon receiving meeting data through a webhook, it parses and structures the information, merges it with a Word template downloaded from SharePoint, generates a filled meeting document, uploads the final DOCX back to SharePoint, appends meeting details into an Excel sheet for record-keeping, and finally emails the generated document through Outlook.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Webhook node receives meeting data submitted via HTTP POST.
- **1.2 Data Parsing and Structuring:** Code node processes raw JSON input to clean, format, and structure meeting details.
- **1.3 Data Logging:** Append meeting data to an Excel sheet for archival and tracking.
- **1.4 Template Retrieval:** Download a pre-defined Word template from SharePoint.
- **1.5 Document Generation:** Fill the Word template with meeting data using DocxTemplater.
- **1.6 Upload and Distribution:** Upload the completed document back to SharePoint and send it via Microsoft Outlook email.
- **1.7 Data Merging:** Combine outputs from template download and parsed data to feed DocxTemplater.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Input Reception

- **Overview:**  
  This block initiates the workflow by receiving meeting data from external sources through a webhook endpoint.

- **Nodes Involved:**  
  - Webhook

- **Node Details:**  
  - **Webhook**  
    - Type: HTTP Webhook Receiver  
    - Configuration: Set to listen on a unique POST path to accept meeting data submissions.  
    - Key Parameters:  
      - HTTP Method: POST  
      - Path: Unique identifier string (e.g., `34ff798e-6c25-4cbd-bc04-10103438a111`)  
    - Input: Incoming HTTP request JSON payload containing meeting details  
    - Output: Passes raw JSON data downstream  
    - Edge Cases / Failure Modes:  
      - Network accessibility issues blocking webhook calls  
      - Unexpected data formats causing downstream parsing errors  
      - Missing or malformed POST data  
    - Sub-workflow: None

---

#### 2.2 Data Parsing and Structuring

- **Overview:**  
  Processes the raw JSON received via webhook, cleans multi-line text inputs, parses participants, discussion points, and action items into formatted strings, and computes statistics about the meeting.

- **Nodes Involved:**  
  - Parse Meeting Data (Code)

- **Node Details:**  
  - **Parse Meeting Data**  
    - Type: Code (JavaScript) node  
    - Configuration: Custom JS script parses input JSON, performs text cleaning, formatting, and outputs a structured JSON object.  
    - Key Expressions / Variables:  
      - Input data extraction and JSON parsing with fallback logic  
      - Text cleaning function replacing line breaks, tabs, and trimming spaces  
      - Formatting attendees and absentees as semicolon-separated strings  
      - Formatting discussion points and action items as semicolon-separated entries with comma-separated properties  
      - Calculation of statistics: counts of attendees, absentees, discussion points, and action items  
      - Debug logging statements included for troubleshooting  
    - Input: Raw JSON from Webhook  
    - Output: Structured meeting data JSON with cleaned and formatted fields  
    - Edge Cases / Failure Modes:  
      - Parsing failure if JSON string is malformed  
      - Missing fields fallback to empty strings or empty arrays  
      - Unexpected data structures causing runtime errors  
    - Sub-workflow: None

---

#### 2.3 Data Logging

- **Overview:**  
  Appends the structured meeting data into a specific Excel workbook and worksheet to maintain a historical log.

- **Nodes Involved:**  
  - Append data to excel sheet

- **Node Details:**  
  - **Append data to excel sheet**  
    - Type: Microsoft Excel node  
    - Configuration:  
      - Operation: Append  
      - Resource: Worksheet  
      - Workbook Id: Specific Excel workbook ID configured  
      - Worksheet Id: Specific worksheet ID configured  
      - Field Mappings: Date, Time, Attendees, Absentees, Opening & Agenda Approval, Discussion Points, Action Items, Any Other Business, Closing, Location mapped with expressions to corresponding JSON fields  
    - Input: Parsed meeting data JSON  
    - Output: Confirmation of appended data or error details  
    - Version Requirements: Supports Excel Online via Microsoft credentials  
    - Edge Cases / Failure Modes:  
      - Permission or access errors to workbook or worksheet  
      - Incorrect or missing workbook/worksheet IDs  
      - Data type mismatches  
    - Sub-workflow: None

---

#### 2.4 Template Retrieval

- **Overview:**  
  Downloads a pre-existing Word (.docx) template file from a specified SharePoint site and folder.

- **Nodes Involved:**  
  - Download word template

- **Node Details:**  
  - **Download word template**  
    - Type: Microsoft SharePoint node  
    - Configuration:  
      - Operation: Download file  
      - Site: SharePoint site selection by ID or URL  
      - Folder: Folder ID where the template is stored  
      - File: Specific file ID of the Word template  
    - Input: Triggered by Webhook data reception  
    - Output: Binary file content of the Word template  
    - Edge Cases / Failure Modes:  
      - Authentication or insufficient permission errors  
      - Incorrect site/folder/file IDs causing file not found  
      - Network issues during download  
    - Sub-workflow: None

---

#### 2.5 Data Merging

- **Overview:**  
  Combines the downloaded Word template content and the parsed meeting data into a single data stream for templating.

- **Nodes Involved:**  
  - Merge

- **Node Details:**  
  - **Merge**  
    - Type: Merge node  
    - Configuration:  
      - Mode: Combine  
      - Combine By: Position (merges the first input with the first input of the second stream)  
    - Input:  
      - Parsed meeting data output  
      - Downloaded Word template output  
    - Output: Combined data including both the template binary and meeting JSON context  
    - Edge Cases / Failure Modes:  
      - Mismatched input lengths or missing inputs can cause empty merges  
      - Data structure inconsistencies affect downstream nodes  
    - Sub-workflow: None

---

#### 2.6 Document Generation

- **Overview:**  
  Uses the DocxTemplater node to inject structured meeting data into the downloaded Word template, producing a finalized meeting minutes document.

- **Nodes Involved:**  
  - DocxTemplater

- **Node Details:**  
  - **DocxTemplater**  
    - Type: DocxTemplater node (specialized for Word template processing)  
    - Configuration:  
      - Context: Set to the combined JSON object containing meeting data (`={{ $json }}`)  
      - Output File Name: `meeting_YYYY-MM-DD.docx` dynamically generated based on current date  
    - Input: Combined data containing template and context from Merge node  
    - Output: Generated DOCX file binary data under property `data`  
    - Edge Cases / Failure Modes:  
      - Template placeholders must match field names exactly; mismatch results in unpopulated fields  
      - Template file integrity issues causing processing failure  
      - Insufficient memory for large templates  
    - Sub-workflow: None

---

#### 2.7 Upload and Distribution

- **Overview:**  
  Uploads the generated DOCX file to a SharePoint folder and sends the document via Microsoft Outlook email as an attachment.

- **Nodes Involved:**  
  - Upload DOCX  
  - Send a message

- **Node Details:**  
  - **Upload DOCX**  
    - Type: Microsoft SharePoint node  
    - Configuration:  
      - Operation: Upload file  
      - Site: Target SharePoint site  
      - Folder: Folder ID for storing meeting documents  
      - File Name: Dynamically generated as `meeting_YYYY-MM-DD.docx`  
      - File Contents: Binary data from DocxTemplater node (`data` property)  
    - Input: Generated DOCX from DocxTemplater  
    - Output: Metadata of uploaded file (ID, URL, etc.)  
    - Edge Cases / Failure Modes:  
      - Authentication or permission errors  
      - Folder not found or inaccessible  
      - File name conflicts or invalid characters  
    - Sub-workflow: None

  - **Send a message**  
    - Type: Microsoft Outlook node  
    - Configuration:  
      - Subject: Fixed string `"Meeting summery "` (note the typo should be corrected to "summary")  
      - Attachments: Uses binary property `data` containing the DOCX file  
      - Credentials: Requires configured Microsoft Outlook OAuth2 credentials  
    - Input: Generated DOCX file binary from DocxTemplater  
    - Output: Confirmation or error of email send action  
    - Edge Cases / Failure Modes:  
      - Credential misconfiguration or token expiry  
      - Attachment size limits or format issues  
      - Network failures during send  
    - Sub-workflow: None

---

### 3. Summary Table

| Node Name               | Node Type                  | Functional Role                     | Input Node(s)             | Output Node(s)                | Sticky Note                                                                                                                       |
|-------------------------|----------------------------|-----------------------------------|---------------------------|------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| Webhook                 | n8n-nodes-base.webhook     | Receives incoming meeting data    | -                         | Parse Meeting Data, Download word template | ## 🌐 Webhook ... Ensure the webhook URL is properly exposed and accessible from external sources.                              |
| Parse Meeting Data      | n8n-nodes-base.code        | Parses and structures meeting data| Webhook                   | Append data to excel sheet, Merge | ## 📁 Parse Meeting Data ... Debug info is logged; remove in production.                                                         |
| Download word template  | n8n-nodes-base.microsoftSharePoint | Downloads Word template file       | Webhook                   | Merge                        | ## 📄 Download Word Template ... Verify SharePoint credentials and IDs to avoid errors.                                          |
| Append data to excel sheet | n8n-nodes-base.microsoftExcel | Logs meeting details into Excel    | Parse Meeting Data         | Merge                        | ## 📁 Append Data to Excel Sheet ... Confirm workbook and worksheet access and field mapping.                                    |
| Merge                   | n8n-nodes-base.merge       | Combines parsed data and template | Append data to excel sheet, Download word template | DocxTemplater                | ## Merge ... Combine mode merges data by position; input structure must be consistent.                                           |
| DocxTemplater           | n8n-nodes-docxtemplater.docxTemplater | Generates DOCX from template       | Merge                     | Upload DOCX, Send a message   | ## 📄 DocxTemplater ... Ensure template matches context data; output file named by current date.                                |
| Upload DOCX             | n8n-nodes-base.microsoftSharePoint | Uploads generated DOCX to SharePoint | DocxTemplater             | Send a message               | ## 📁 Upload DOCX ... Confirm folder ID and credentials; watch for upload errors.                                                |
| Send a message          | n8n-nodes-base.microsoftOutlook | Sends email with DOCX attachment   | DocxTemplater             | -                            | ## 📩 Send a Message ... Proper Outlook credentials required; verify attachment property and email configuration.               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook node**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: Set a unique endpoint string, e.g. `34ff798e-6c25-4cbd-bc04-10103438a111`  
   - Purpose: Receive meeting data via HTTP POST request

2. **Add Code node for parsing meeting data**  
   - Type: Code (JavaScript)  
   - Paste the provided JS script that:  
     - Parses input JSON body (handles string or object)  
     - Cleans multiline text fields (replaces line breaks, tabs)  
     - Formats attendees and absentees as semicolon-separated strings  
     - Formats discussion points and action items into structured strings  
     - Calculates statistics (counts)  
     - Outputs a structured JSON with all above data  
   - Connect Webhook output to this node input

3. **Add Microsoft Excel node for appending data**  
   - Type: Microsoft Excel  
   - Operation: Append  
   - Resource: Worksheet  
   - Configure Workbook: Select or enter the workbook ID where meeting logs will be stored  
   - Configure Worksheet: Select or enter the worksheet ID in the workbook  
   - Map fields:  
     - Date → `={{ $json.date }}`  
     - Time → `={{ $json.time }}`  
     - Attendees → `={{ $json.attendees }}`  
     - Absentees → `={{ $json.absentees }}`  
     - Opening & Agenda Approval → `={{ $json.opening }}`  
     - Discussion Points → `={{ $json.discussionPoints }}`  
     - Action Items → `={{ $json.actionItems }}`  
     - Any Other Business → `={{ $json.aob }}`  
     - Closing → `={{ $json.closing }}`  
     - Location → `={{ $json.location }}`  
   - Connect Code node output to this node

4. **Add Microsoft SharePoint node to download Word template**  
   - Type: Microsoft SharePoint  
   - Operation: Download file  
   - Configure Site: Select SharePoint site containing the template  
   - Configure Folder: Enter folder ID where template is stored  
   - Configure File: Enter file ID for the Word template (e.g., meeting_minutes_template.docx)  
   - Connect Webhook output to this node as well (parallel branch)

5. **Add Merge node**  
   - Type: Merge  
   - Mode: Combine  
   - Combine By: combineByPosition  
   - Connect outputs of Excel Append node and SharePoint Download node as inputs to Merge node

6. **Add DocxTemplater node**  
   - Type: DocxTemplater  
   - Context: Set to `={{ $json }}` to use combined data JSON as template context  
   - Output File Name: `=meeting_{{$now.format("yyyy-MM-dd")}}.docx`  
   - Connect Merge node output to DocxTemplater input

7. **Add Microsoft SharePoint node to upload generated DOCX**  
   - Type: Microsoft SharePoint  
   - Operation: Upload file  
   - Configure Site: Same or target SharePoint site for document storage  
   - Configure Folder: Folder ID where meeting documents are stored  
   - File Name: `=meeting_{{$now.format("yyyy-MM-dd")}}.docx`  
   - File Contents: Reference binary property `data` from DocxTemplater output  
   - Connect DocxTemplater output to this node

8. **Add Microsoft Outlook node to send email**  
   - Type: Microsoft Outlook  
   - Subject: "Meeting summary" (correct typo if needed)  
   - Attachments: Reference binary property `data` containing the generated DOCX  
   - Configure Microsoft Outlook OAuth2 credentials to enable sending  
   - Connect DocxTemplater output to this node as well (parallel with SharePoint upload)

9. **Credential Setup**  
   - Configure Microsoft SharePoint credentials with appropriate permissions for download and upload  
   - Configure Microsoft Excel credentials (Microsoft 365) with permissions for workbook editing  
   - Configure Microsoft Outlook credentials for sending emails

10. **Test Workflow**  
    - Test webhook with sample meeting data JSON matching expected structure  
    - Confirm Excel data appends correctly  
    - Confirm Word template downloads and fills correctly  
    - Confirm DOCX uploads to SharePoint  
    - Confirm email sends with attachment

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                          | Context or Link                                                                                                                |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| The workflow includes a minimal HTML form to submit meeting data via the webhook. This form is designed to be n8n-compatible and demonstrates the expected data structure for webhook POST requests. The webhook URL must be replaced with your actual n8n webhook endpoint in the form's JavaScript.                                                                                                         | HTML form snippet included in sticky note node; useful for frontend integration or testing                                     |
| The workflow’s core idea is to automate meeting documentation and distribution, reducing manual effort and ensuring consistent record-keeping across SharePoint, Excel, and Outlook.                                                                                                                                                                                                                      | Overall project goal                                                                                                          |
| Pay attention to SharePoint folder and file IDs; they are critical and must be valid for the workflow to access templates and store files.                                                                                                                                                                                                                                                            | SharePoint nodes configuration                                                                                                |
| Microsoft Outlook node requires OAuth2 credentials setup with delegated permission to send emails on behalf of the user or service account. Ensure token refresh is enabled for long-running workflows.                                                                                                                                                                                               | Outlook node credential requirements                                                                                           |
| The workflow currently uses a fixed email subject "Meeting summery "; consider correcting the typo to "Meeting summary" for professionalism.                                                                                                                                                                                                                                                          | Send a message node sticky note                                                                                               |
| Debug logging is enabled inside the code node for parsing meeting data, which is helpful during development but should be removed or disabled in production to clean logs and improve performance.                                                                                                                                                                                                       | Parse Meeting Data node sticky note                                                                                           |
| Ensure the Excel workbook and worksheet have columns named exactly as mapped in the Append data to excel sheet node to avoid data insertion errors.                                                                                                                                                                                                                                                  | Excel node configuration                                                                                                      |

---

**Disclaimer:** The text provided is exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly respects applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.