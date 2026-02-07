Auto Invoice & Receipt OCR to Google Sheets – Drive, Gmail, & Telegram Triggers

https://n8nworkflows.xyz/workflows/auto-invoice---receipt-ocr-to-google-sheets---drive--gmail----telegram-triggers-3618


# Auto Invoice & Receipt OCR to Google Sheets – Drive, Gmail, & Telegram Triggers

### 1. Workflow Overview

This workflow automates the extraction of invoice and receipt data using Optical Character Recognition (OCR) powered by Google’s Gemini API, directly populating a Google Sheet for bookkeeping purposes. It supports multiple input sources — Google Drive, Gmail, and Telegram — enabling seamless processing of invoices and receipts from various channels.

The workflow is logically divided into three main blocks:

- **1.1 Core OCR Processing (Google Drive Trigger Path):**  
  Handles new files added to a designated Google Drive folder. It downloads each file, converts it to base64, sends it to the Gemini OCR API with a detailed prompt, parses the structured JSON response, and appends the extracted data to a Google Sheet.

- **1.2 Gmail Attachment Processing:**  
  Monitors Gmail for emails with a specific label, iterates over emails and attachments, renames attachments with a date-sender format, saves them to the Google Drive folder, triggering the core OCR process.

- **1.3 Telegram Image Processing:**  
  Listens for images sent to a Telegram bot, renames images with a date-Telegram format, saves them to the Google Drive folder, also triggering the core OCR process.

Supporting nodes manage batching, waiting to avoid rate limits, and file naming conventions.

---

### 2. Block-by-Block Analysis

#### 2.1 Core OCR Processing (Google Drive Trigger Path)

- **Overview:**  
  This block triggers when new files are added to a specified Google Drive folder. It processes each file individually by downloading, converting to base64, sending to Gemini OCR API, parsing the response, and appending results to Google Sheets.

- **Nodes Involved:**  
  - Google Drive Trigger New Files  
  - Loop Over Items  
  - Google Drive Get Receipt  
  - Move file to base64 string  
  - Prompt  
  - Gemini API  
  - JSON to string  
  - Parse string  
  - Add to Google Sheets  
  - Wait For Saving Data  
  - Loop Over Items (loop restart)  

- **Node Details:**

  - **Google Drive Trigger New Files**  
    - *Type:* Trigger  
    - *Role:* Watches a specific Google Drive folder for new files (PDFs/images).  
    - *Config:* Folder ID set to target invoice/receipt folder.  
    - *Input:* None (trigger)  
    - *Output:* New file metadata  
    - *Failure modes:* API auth errors, folder misconfiguration, network issues.

  - **Loop Over Items**  
    - *Type:* SplitInBatches  
    - *Role:* Processes files one by one to avoid API rate limits.  
    - *Config:* Batch size = 1  
    - *Input:* Array of new files from trigger  
    - *Output:* Single file per iteration  
    - *Failure modes:* Large batch sizes may cause rate limit errors.

  - **Google Drive Get Receipt**  
    - *Type:* Google Drive node  
    - *Role:* Downloads the actual file content for processing.  
    - *Config:* Uses file ID from previous node.  
    - *Input:* File metadata  
    - *Output:* Binary file data  
    - *Failure modes:* File access permission errors, file not found.

  - **Move file to base64 string**  
    - *Type:* ExtractFromFile  
    - *Role:* Converts binary file content to base64 string for API consumption.  
    - *Config:* Default extraction to base64.  
    - *Input:* Binary file data  
    - *Output:* Base64 string of file  
    - *Failure modes:* Corrupt file data, unsupported file formats.

  - **Prompt**  
    - *Type:* Set  
    - *Role:* Defines the detailed prompt text and model name for the Gemini API request.  
    - *Config:* Contains a structured prompt requesting JSON output with specific fields and formatting instructions; model set to `gemini-2.0-flash`.  
    - *Input:* Base64 file string  
    - *Output:* Prompt text and model parameters  
    - *Failure modes:* Incorrect prompt formatting may cause API errors or inaccurate OCR.

  - **Gemini API**  
    - *Type:* HTTP Request  
    - *Role:* Sends the OCR request to Google’s Gemini API with the prompt and base64 file.  
    - *Config:* POST request with query parameter for API key; URL includes model name from Prompt node.  
    - *Input:* Prompt and base64 file data  
    - *Output:* JSON response from Gemini API  
    - *Failure modes:* API key invalid, rate limits, network errors, malformed requests.

  - **JSON to string**  
    - *Type:* Set  
    - *Role:* Converts the JSON response to a string for parsing.  
    - *Config:* Converts response body to string format.  
    - *Input:* Gemini API JSON response  
    - *Output:* JSON string  
    - *Failure modes:* Unexpected response format.

  - **Parse string**  
    - *Type:* Code (JavaScript)  
    - *Role:* Parses the JSON string to extract structured invoice fields.  
    - *Config:* Custom JS code to parse and validate JSON, extract fields like Invoice Date, Category, Sender, Amount, Currency, etc.  
    - *Input:* JSON string  
    - *Output:* Structured data object for Google Sheets  
    - *Failure modes:* Parsing errors if JSON malformed or fields missing.

  - **Add to Google Sheets**  
    - *Type:* Google Sheets  
    - *Role:* Appends extracted invoice data as a new row in a specified Google Sheet.  
    - *Config:* Spreadsheet ID and Sheet name set; columns mapped to extracted fields plus file name and URL.  
    - *Input:* Parsed invoice data  
    - *Output:* Confirmation of row addition  
    - *Failure modes:* Sheet access errors, column mismatch, quota limits.

  - **Wait For Saving Data**  
    - *Type:* Wait  
    - *Role:* Pauses workflow briefly to avoid hitting Google Sheets or API rate limits.  
    - *Config:* Default wait time (seconds)  
    - *Input:* After Google Sheets append  
    - *Output:* Triggers next batch processing  
    - *Failure modes:* None significant; long waits slow processing.

  - **Loop Over Items (restart)**  
    - *Type:* SplitInBatches  
    - *Role:* Loops back to process next file from trigger batch.  
    - *Config:* Batch size = 1  
    - *Input:* Original file list  
    - *Output:* Next file item  
    - *Failure modes:* Same as initial Loop Over Items.

---

#### 2.2 Gmail Attachment Processing

- **Overview:**  
  Watches Gmail for emails with a specific label, iterates over emails and their attachments, renames attachments with a date-sender format, and saves them to the Google Drive folder, triggering the core OCR process.

- **Nodes Involved:**  
  - Gmail Trigger  
  - Loop Over Emails  
  - If (filter for emails with attachments)  
  - Loop Over Attachments  
  - Create File Name  
  - Google Drive Save Files  
  - Wait For Saving  

- **Node Details:**

  - **Gmail Trigger**  
    - *Type:* Trigger  
    - *Role:* Monitors Gmail inbox for new emails with a specified label (e.g., "receipts").  
    - *Config:* Label filter set to user-defined label.  
    - *Input:* None (trigger)  
    - *Output:* New emails metadata  
    - *Failure modes:* Gmail API auth errors, label misconfiguration.

  - **Loop Over Emails**  
    - *Type:* SplitInBatches  
    - *Role:* Processes each email individually.  
    - *Config:* Batch size = 1  
    - *Input:* Emails array  
    - *Output:* Single email per iteration  
    - *Failure modes:* Large batch sizes cause rate limits.

  - **If**  
    - *Type:* Conditional  
    - *Role:* Checks if the email contains attachments to process.  
    - *Config:* Condition on attachment presence.  
    - *Input:* Single email  
    - *Output:* True (has attachments) or False (skip)  
    - *Failure modes:* Incorrect condition logic.

  - **Loop Over Attachments**  
    - *Type:* SplitInBatches  
    - *Role:* Processes each attachment individually.  
    - *Config:* Batch size = 1  
    - *Input:* Attachments array  
    - *Output:* Single attachment per iteration  
    - *Failure modes:* Large batch sizes cause rate limits.

  - **Create File Name**  
    - *Type:* Code (JavaScript)  
    - *Role:* Generates a new file name for the attachment in the format `YYYY-MM-DD_SenderUsername`.  
    - *Config:* Uses email date and sender username extracted from email metadata.  
    - *Input:* Attachment metadata and email info  
    - *Output:* New file name string  
    - *Failure modes:* Date parsing errors, missing sender info.

  - **Google Drive Save Files**  
    - *Type:* Google Drive  
    - *Role:* Saves the renamed attachment to the designated Google Drive folder.  
    - *Config:* Target folder ID set to the same folder monitored by the Drive trigger.  
    - *Input:* Attachment binary data and new file name  
    - *Output:* Confirmation of file saved  
    - *Failure modes:* Permission errors, folder misconfiguration.

  - **Wait For Saving**  
    - *Type:* Wait  
    - *Role:* Pauses briefly to ensure file is saved before triggering OCR process.  
    - *Config:* Default wait time  
    - *Input:* After file save  
    - *Output:* Triggers next attachment processing  
    - *Failure modes:* None significant.

---

#### 2.3 Telegram Image Processing

- **Overview:**  
  Listens for images sent to a Telegram bot, renames images with a date-Telegram format, saves them to the Google Drive folder, triggering the core OCR process.

- **Nodes Involved:**  
  - Telegram Trigger Image  
  - Create File Name For Telegram  
  - Google Save Files 2  

- **Node Details:**

  - **Telegram Trigger Image**  
    - *Type:* Trigger  
    - *Role:* Listens for incoming images sent to the configured Telegram bot.  
    - *Config:* Telegram bot credentials configured.  
    - *Input:* Incoming image message  
    - *Output:* Image file metadata and binary data  
    - *Failure modes:* Bot auth errors, message format issues.

  - **Create File Name For Telegram**  
    - *Type:* Code (JavaScript)  
    - *Role:* Generates a new file name in the format `YYYY-MM-DD_Telegram`.  
    - *Config:* Uses message date/time for naming.  
    - *Input:* Telegram message metadata  
    - *Output:* New file name string  
    - *Failure modes:* Date parsing errors.

  - **Google Save Files 2**  
    - *Type:* Google Drive  
    - *Role:* Saves the renamed image file to the designated Google Drive folder.  
    - *Config:* Target folder ID same as Drive trigger folder.  
    - *Input:* Image binary data and new file name  
    - *Output:* Confirmation of file saved  
    - *Failure modes:* Permission errors, folder misconfiguration.

---

### 3. Summary Table

| Node Name                 | Node Type           | Functional Role                                    | Input Node(s)                 | Output Node(s)               | Sticky Note                                                                                   |
|---------------------------|---------------------|---------------------------------------------------|------------------------------|-----------------------------|-----------------------------------------------------------------------------------------------|
| Google Drive Trigger New Files | Google Drive Trigger | Watches Drive folder for new files                 | None                         | Loop Over Items              |                                                                                               |
| Loop Over Items           | SplitInBatches      | Processes new Drive files one by one               | Google Drive Trigger New Files | Google Drive Get Receipt     |                                                                                               |
| Google Drive Get Receipt  | Google Drive        | Downloads file content                              | Loop Over Items              | Move file to base64 string   |                                                                                               |
| Move file to base64 string | ExtractFromFile     | Converts file binary to base64 string               | Google Drive Get Receipt     | Prompt                      |                                                                                               |
| Prompt                   | Set                 | Sets detailed Gemini OCR prompt and model          | Move file to base64 string   | Gemini API                  |                                                                                               |
| Gemini API               | HTTP Request        | Sends OCR request to Gemini API                      | Prompt                      | JSON to string              | Replace placeholder API key with your Gemini API Key in Query Parameters                       |
| JSON to string           | Set                 | Converts JSON response to string                     | Gemini API                  | Parse string                |                                                                                               |
| Parse string             | Code                | Parses JSON string to extract invoice fields        | JSON to string              | Add to Google Sheets        |                                                                                               |
| Add to Google Sheets     | Google Sheets       | Appends extracted data to Google Sheet               | Parse string                | Wait For Saving Data        | Ensure Google Sheet columns match extracted fields                                            |
| Wait For Saving Data     | Wait                | Pauses to avoid rate limits                           | Add to Google Sheets        | Loop Over Items             |                                                                                               |
| Gmail Trigger            | Gmail Trigger       | Watches Gmail for emails with specific label         | None                       | Loop Over Emails            |                                                                                               |
| Loop Over Emails         | SplitInBatches      | Processes emails one by one                           | Gmail Trigger               | If                         |                                                                                               |
| If                       | If                  | Checks if email has attachments                       | Loop Over Emails            | Split Out Binary Files / Loop Over Attachments |                                                                                               |
| Split Out Binary Files   | Code                | Extracts binary attachments from emails               | If                         | Loop Over Emails            |                                                                                               |
| Loop Over Attachments    | SplitInBatches      | Processes attachments one by one                      | Loop Over Emails / Wait For Saving | Create File Name          |                                                                                               |
| Create File Name         | Code                | Renames attachments as `YYYY-MM-DD_SenderUsername`   | Loop Over Attachments       | Google Drive Save Files     |                                                                                               |
| Google Drive Save Files  | Google Drive        | Saves renamed attachments to Drive folder             | Create File Name            | Wait For Saving             |                                                                                               |
| Wait For Saving          | Wait                | Pauses to ensure file save before OCR processing      | Google Drive Save Files     | Loop Over Attachments       |                                                                                               |
| Telegram Trigger Image   | Telegram Trigger    | Listens for images sent to Telegram bot               | None                       | Create File Name For Telegram |                                                                                               |
| Create File Name For Telegram | Code            | Renames Telegram images as `YYYY-MM-DD_Telegram`     | Telegram Trigger Image      | Google Save Files 2         |                                                                                               |
| Google Save Files 2      | Google Drive        | Saves renamed Telegram images to Drive folder         | Create File Name For Telegram |                            |                                                                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Credentials:**
   - Google OAuth2 (for Drive, Sheets, Gmail)
   - Telegram Bot credentials
   - Gemini API Key (from Google AI Studio)

2. **Create Google Drive Folder:**
   - Designate a folder for invoices/receipts.
   - Note folder ID for use in nodes.

3. **Create Google Sheet:**
   - Use or clone the provided template.
   - Ensure columns for Invoice Date, Category, Sender, Description, Amount (0% VAT), VAT %, Total, Currency, Note, File Name, File URL.

4. **Set up Google Drive Trigger New Files node:**
   - Type: Google Drive Trigger
   - Folder ID: your designated folder
   - Trigger on new files (PDF/image)

5. **Add SplitInBatches node (Loop Over Items):**
   - Batch size: 1
   - Connect from Drive Trigger

6. **Add Google Drive node (Google Drive Get Receipt):**
   - Operation: Download file
   - File ID: from Loop Over Items output
   - Connect from Loop Over Items

7. **Add ExtractFromFile node (Move file to base64 string):**
   - Extract: Base64 string from binary data
   - Connect from Google Drive Get Receipt

8. **Add Set node (Prompt):**
   - Set prompt text with detailed instructions for Gemini OCR
   - Include model name (default: `gemini-2.0-flash`)
   - Connect from ExtractFromFile

9. **Add HTTP Request node (Gemini API):**
   - Method: POST
   - URL: Gemini API endpoint with model name from Prompt node
   - Query Parameters: include your Gemini API key
   - Body: include prompt and base64 file data
   - Connect from Prompt

10. **Add Set node (JSON to string):**
    - Convert Gemini API JSON response to string
    - Connect from Gemini API

11. **Add Code node (Parse string):**
    - JavaScript to parse JSON string and extract invoice fields
    - Connect from JSON to string

12. **Add Google Sheets node (Add to Google Sheets):**
    - Operation: Append row
    - Spreadsheet ID and Sheet Name: your target sheet
    - Map extracted fields to columns
    - Connect from Parse string

13. **Add Wait node (Wait For Saving Data):**
    - Pause to avoid rate limits (e.g., few seconds)
    - Connect from Add to Google Sheets

14. **Connect Wait node back to Loop Over Items:**
    - To process next file

15. **Set up Gmail Trigger node:**
    - Label filter: your Gmail label (e.g., "receipts")
    - Connect to SplitInBatches node (Loop Over Emails)

16. **Add SplitInBatches node (Loop Over Emails):**
    - Batch size: 1
    - Connect from Gmail Trigger

17. **Add If node:**
    - Condition: email has attachments
    - Connect from Loop Over Emails

18. **Add Code node (Split Out Binary Files):**
    - Extract binary attachments from emails
    - Connect from If (true branch)

19. **Add SplitInBatches node (Loop Over Attachments):**
    - Batch size: 1
    - Connect from Split Out Binary Files

20. **Add Code node (Create File Name):**
    - Rename attachment as `YYYY-MM-DD_SenderUsername`
    - Use email date and sender info
    - Connect from Loop Over Attachments

21. **Add Google Drive node (Google Drive Save Files):**
    - Save renamed attachment to Drive folder
    - Connect from Create File Name

22. **Add Wait node (Wait For Saving):**
    - Pause after saving to ensure file availability
    - Connect from Google Drive Save Files

23. **Connect Wait node back to Loop Over Attachments:**
    - To process next attachment

24. **Set up Telegram Trigger node (Telegram Trigger Image):**
    - Configure Telegram bot credentials
    - Connect to Code node (Create File Name For Telegram)

25. **Add Code node (Create File Name For Telegram):**
    - Rename image as `YYYY-MM-DD_Telegram`
    - Connect from Telegram Trigger Image

26. **Add Google Drive node (Google Save Files 2):**
    - Save renamed Telegram image to Drive folder
    - Connect from Create File Name For Telegram

27. **Ensure Google Drive folder monitored by Google Drive Trigger New Files includes files saved by Gmail and Telegram paths.**

28. **Test each trigger path with sample files/emails/images.**

29. **Activate workflow.**

---

### 5. General Notes & Resources

| Note Content                                                                                      | Context or Link                                                                                      |
|-------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Obtain Gemini API Key from Google AI Studio                                                     | https://aistudio.google.com/                                                                        |
| Google Sheet template for invoice data extraction                                               | https://docs.google.com/spreadsheets/d/1HX12aLkBrFjKSvtMlhFbDQkvn8MQrhZQVkkxpXY5c0M/edit?usp=sharing |
| Workflow uses `gemini-2.0-flash` model by default; verify model compatibility with API endpoint | Important for API request URL and prompt configuration                                              |
| Use SplitInBatches and Wait nodes to avoid API rate limits and ensure sequential processing     | Helps prevent errors due to rate limiting                                                           |
| Customize prompt in Set node to adjust extracted fields, categories, and formatting             | Allows tailoring to specific bookkeeping needs                                                     |
| Rename attachments/images with date and sender/source for easier tracking                        | Naming conventions used in Gmail and Telegram paths                                                |
| AI OCR accuracy depends on prompt quality and input file clarity; always verify extracted data  | Final manual review recommended to avoid bookkeeping errors                                        |
| No personalized support offered; use n8n docs or ChatGPT for troubleshooting                     | Support disclaimer                                                                                  |

---

This document provides a detailed, structured reference for understanding, reproducing, and customizing the "Auto Invoice & Receipt OCR to Google Sheets" workflow, ensuring both human users and automation agents can effectively work with it.