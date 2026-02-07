AI Email Analyzer: Process PDFs, Images & Save to Google Drive + Telegram

https://n8nworkflows.xyz/workflows/ai-email-analyzer--process-pdfs--images---save-to-google-drive---telegram-3169


# AI Email Analyzer: Process PDFs, Images & Save to Google Drive + Telegram

### 1. Workflow Overview

This workflow automates the analysis and summarization of incoming emails and their attachments (PDFs and images) using AI models. It extracts content from emails and attachments, generates summaries, saves these summaries to Google Sheets, and sends a consolidated summary via Telegram. The workflow is designed to streamline email content processing, making important information easily accessible and actionable.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Monitoring incoming emails and detecting attachments.
- **1.2 Attachment Extraction and Classification:** Extracting attachments and separating PDFs from images.
- **1.3 Attachment Content Analysis:** Extracting text from PDFs and analyzing images using AI.
- **1.4 Email Content Summarization:** Converting email HTML content to text and summarizing it.
- **1.5 Summary Storage:** Saving summaries of PDFs, images, and email text to Google Sheets.
- **1.6 Summary Consolidation:** Aggregating all summaries and generating a unified final summary.
- **1.7 Final Notification:** Sending the consolidated summary via Telegram.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block monitors an email inbox for new emails and checks if they contain attachments to process.

- **Nodes Involved:**  
  - Email Trigger (IMAP)  
  - Contain attachments?

- **Node Details:**

  - **Email Trigger (IMAP)**  
    - *Type & Role:* Email trigger node that listens for new emails via IMAP.  
    - *Configuration:* Downloads attachments automatically (`downloadAttachments: true`).  
    - *Credentials:* Uses configured IMAP credentials for the monitored email account.  
    - *Input/Output:* No input; outputs new email data including attachments.  
    - *Edge Cases:* IMAP connection failures, authentication errors, large attachment handling.  
    - *Notes:* Entry point of the workflow.

  - **Contain attachments?**  
    - *Type & Role:* Conditional node that checks if the email contains attachments.  
    - *Configuration:* Checks if the binary data (attachments) is not empty.  
    - *Input:* Email data from Email Trigger.  
    - *Output:* Two branches: true (attachments present) and false (no attachments).  
    - *Edge Cases:* Emails with unsupported attachment types or corrupted attachments.

---

#### 1.2 Attachment Extraction and Classification

- **Overview:**  
  Extracts all attachments from the email and classifies them into PDFs or images for specialized processing.

- **Nodes Involved:**  
  - Get PDF and images attachments  
  - Switch  
  - Sticky Note1 (comment)

- **Node Details:**

  - **Get PDF and images attachments**  
    - *Type & Role:* Code node that extracts all binary attachments from the email into separate items.  
    - *Configuration:* Iterates over all binary keys in the input and outputs each attachment as a separate item with binary data under `data`.  
    - *Input:* Email with attachments from Contain attachments? node.  
    - *Output:* Multiple items, each representing one attachment.  
    - *Edge Cases:* Emails with no attachments, attachments with unsupported formats.

  - **Switch**  
    - *Type & Role:* Routes attachments based on file extension to either PDF or image processing.  
    - *Configuration:*  
      - Condition 1: If file extension equals "pdf", route to PDF branch.  
      - Condition 2: If file extension matches regex `/^(jpg|png)$/i`, route to image branch.  
    - *Input:* Attachments from Get PDF and images attachments.  
    - *Output:* Two outputs: `pdf` and `image`.  
    - *Edge Cases:* Attachments with other extensions are ignored (no route). Case sensitivity handled.

  - **Sticky Note1**  
    - *Content:* "Get all attachments present in the email (in this WF only PDFs and images are considered)".  
    - *Context:* Clarifies scope of attachment processing.

---

#### 1.3 Attachment Content Analysis

- **Overview:**  
  Processes PDFs by extracting text and summarizing content; analyzes images using AI to generate descriptive summaries.

- **Nodes Involved:**  
  - Upload attachments  
  - Extract from PDF  
  - PDF Analyzer  
  - Gemini 2.0 Flash (AI model for PDF analysis)  
  - Structured Output Parser  
  - Save summary PDF  
  - Analyze image  
  - Save summary image  
  - Map image summaries  
  - Sticky Note2, Sticky Note3

- **Node Details:**

  - **Upload attachments**  
    - *Type & Role:* Uploads attachments (both PDFs and images) to a specified Google Drive folder.  
    - *Configuration:*  
      - File name generated dynamically with timestamp and original file name.  
      - Uploads to folder ID `1CV5PgqBQIVFEacmbApdCApjNEtoNPzXQ` in "My Drive".  
    - *Input:* Attachments from Switch node.  
    - *Output:* Confirmation of upload.  
    - *Edge Cases:* Google Drive API errors, permission issues.

  - **Extract from PDF**  
    - *Type & Role:* Extracts text content from PDF files.  
    - *Configuration:* Uses built-in PDF extraction operation.  
    - *Input:* PDF attachments from Upload attachments node.  
    - *Output:* Extracted text content.  
    - *Edge Cases:* Corrupted PDFs, extraction failures.

  - **PDF Analyzer**  
    - *Type & Role:* AI chain node that summarizes extracted PDF text.  
    - *Configuration:*  
      - Uses a detailed system prompt to instruct AI to produce concise, accurate summaries of documents.  
      - Input is the extracted PDF text.  
      - Output parser configured to produce structured output with a `content` string field.  
    - *Input:* Extracted PDF text from Extract from PDF node.  
    - *Output:* Summarized PDF content.  
    - *AI Model:* Gemini 2.0 Flash (OpenRouter credentials).  
    - *Edge Cases:* AI model timeouts, incomplete summaries, prompt failures.

  - **Structured Output Parser**  
    - *Type & Role:* Parses AI output into structured JSON with a `content` field.  
    - *Input:* Raw AI output from PDF Analyzer.  
    - *Output:* Parsed summary content.  
    - *Edge Cases:* Parsing errors if AI output format changes.

  - **Save summary PDF**  
    - *Type & Role:* Saves PDF summaries to Google Sheets.  
    - *Configuration:*  
      - Appends a row with columns: ID (email message ID), DATE (current date), TYPE ("pdf"), EMAIL (sender), SUBJECT, SUMMARY (AI summary).  
      - Uses Google Sheets OAuth2 credentials.  
      - Targets a specific Google Sheet and worksheet.  
    - *Input:* Parsed PDF summary from PDF Analyzer.  
    - *Output:* Confirmation of append operation.  
    - *Edge Cases:* Google Sheets API errors, quota limits.

  - **Analyze image**  
    - *Type & Role:* AI node analyzing image content to generate descriptive text.  
    - *Configuration:*  
      - Uses OpenAI GPT-4o-mini model.  
      - Input is the image binary data in base64.  
      - System prompt instructs detailed, factual image description.  
    - *Input:* Image attachments from Switch node.  
    - *Output:* Text description of image content.  
    - *Edge Cases:* AI model errors, unsupported image formats.

  - **Save summary image**  
    - *Type & Role:* Saves image summaries to Google Sheets.  
    - *Configuration:* Similar to Save summary PDF but TYPE is "image".  
    - *Input:* Image description from Analyze image.  
    - *Output:* Confirmation of append operation.  
    - *Edge Cases:* Same as Save summary PDF.

  - **Map image summaries**  
    - *Type & Role:* Sets the `content` field explicitly from AI response for further aggregation.  
    - *Input:* Output from Save summary image.  
    - *Output:* Mapped summary content.  
    - *Edge Cases:* Data mapping errors.

  - **Sticky Note2**  
    - *Content:* "Analyze the content of PDF files and make a summary for each one".  
    - *Context:* Clarifies PDF processing.

  - **Sticky Note3**  
    - *Content:* "Analyze the content of the image and describe it accurately".  
    - *Context:* Clarifies image processing.

---

#### 1.4 Email Content Summarization

- **Overview:**  
  Converts the email's HTML content to plain text and generates a concise summary using AI.

- **Nodes Involved:**  
  - Convert text  
  - DeepSeek R1  
  - Email Summarization Chain  
  - Save summary text  
  - Email summary  
  - Sticky Note4

- **Node Details:**

  - **Convert text**  
    - *Type & Role:* Converts HTML email body to plain text using markdown node.  
    - *Configuration:* Input is the email's `textHtml` field.  
    - *Input:* Email data from Contain attachments? node (both branches).  
    - *Output:* Plain text version of email content.  
    - *Edge Cases:* Malformed HTML, empty email bodies.

  - **DeepSeek R1**  
    - *Type & Role:* AI language model node using DeepSeek model via OpenRouter.  
    - *Configuration:* Model set to `deepseek/deepseek-r1:free`.  
    - *Input:* Plain text email content from Convert text node.  
    - *Output:* AI-generated summary text.  
    - *Edge Cases:* AI API errors, rate limits.

  - **Email Summarization Chain**  
    - *Type & Role:* AI summarization chain node that produces a concise summary of the email text.  
    - *Configuration:*  
      - Uses a detailed prompt instructing the AI to summarize email content in 3-5 sentences, preserving key details and tone.  
      - Input is the plain text email content.  
    - *Input:* Output from DeepSeek R1 or Convert text node.  
    - *Output:* Summarized email text.  
    - *Edge Cases:* AI failures, prompt misinterpretation.

  - **Save summary text**  
    - *Type & Role:* Saves email text summaries to Google Sheets.  
    - *Configuration:* Similar to other Save summary nodes but TYPE is "email".  
    - *Input:* Summarized email text from Email Summarization Chain.  
    - *Output:* Confirmation of append operation.  
    - *Edge Cases:* Google Sheets errors.

  - **Email summary**  
    - *Type & Role:* Sets the `content` field with the AI summary text for aggregation.  
    - *Input:* Output from Email Summarization Chain.  
    - *Output:* Prepared summary content.  
    - *Edge Cases:* Data mapping errors.

  - **Sticky Note4**  
    - *Content:* "Analyze the content of the email and summarize it".  
    - *Context:* Clarifies email text summarization.

---

#### 1.5 Summary Storage

- **Overview:**  
  Saves the generated summaries for PDFs, images, and email text into a Google Sheet for record-keeping and easy access.

- **Nodes Involved:**  
  - Save summary PDF  
  - Save summary image  
  - Save summary text

- **Node Details:**  
  - All three nodes use Google Sheets node configured to append rows with columns: ID, DATE, TYPE, EMAIL, SUBJECT, SUMMARY.  
  - They use the same Google Sheets credentials and target the same spreadsheet and worksheet.  
  - Inputs come from respective summarization nodes.  
  - Edge cases include API quota limits, permission issues, and data format mismatches.

---

#### 1.6 Summary Consolidation

- **Overview:**  
  Aggregates all individual summaries (email text, PDFs, images) and synthesizes them into a single comprehensive summary using AI.

- **Nodes Involved:**  
  - All summaries  
  - Parsing  
  - Aggregate  
  - Create final summary  
  - OpenRouter Chat Model1  
  - Sticky Note5

- **Node Details:**

  - **All summaries**  
    - *Type & Role:* Merge node that combines three inputs: email summary, image summaries, and PDF summaries.  
    - *Configuration:* Set to accept 3 inputs.  
    - *Input:* Summaries from Email summary, Map image summaries, and Split Out (from PDF Analyzer).  
    - *Output:* Combined array of summaries.  
    - *Edge Cases:* Missing inputs if any summary type is absent.

  - **Parsing**  
    - *Type & Role:* Code node that extracts the summary text from each input item and formats it for aggregation.  
    - *Configuration:* Maps each item to an object with `data.output` field containing the summary text.  
    - *Input:* Output from All summaries.  
    - *Output:* Formatted summary data.  
    - *Edge Cases:* Missing or malformed summary fields.

  - **Aggregate**  
    - *Type & Role:* Aggregates all summary texts into a single array under `data.output`.  
    - *Input:* Output from Parsing node.  
    - *Output:* Aggregated summaries array.  
    - *Edge Cases:* Empty input array.

  - **Create final summary**  
    - *Type & Role:* AI chain node that synthesizes all summaries into one unified summary.  
    - *Configuration:*  
      - Uses a detailed system prompt instructing AI to combine email, image, and PDF summaries into a coherent narrative.  
      - Input is the aggregated summaries array.  
      - Model used: OpenRouter Gemini 2.0 Flash.  
    - *Input:* Aggregated summaries from Aggregate node.  
    - *Output:* Final consolidated summary text.  
    - *Edge Cases:* AI model errors, incomplete synthesis.

  - **OpenRouter Chat Model1**  
    - *Type & Role:* AI language model node used internally by Create final summary.  
    - *Configuration:* Uses Gemini 2.0 Flash model via OpenRouter API credentials.  
    - *Edge Cases:* API errors, rate limits.

  - **Sticky Note5**  
    - *Content:* "All the summaries of the email components (text, PDF, images) are aggregated and a final summary is generated".  
    - *Context:* Clarifies summary consolidation.

---

#### 1.7 Final Notification

- **Overview:**  
  Sends the final consolidated summary via Telegram to a specified chat ID.

- **Nodes Involved:**  
  - Send final summary

- **Node Details:**

  - **Send final summary**  
    - *Type & Role:* Telegram node that sends a text message.  
    - *Configuration:*  
      - Text is the final summary from Create final summary node.  
      - Chat ID must be configured with the recipient's Telegram chat ID.  
      - Uses Telegram API credentials.  
    - *Input:* Final summary text.  
    - *Output:* Confirmation of message sent.  
    - *Edge Cases:* Telegram API errors, invalid chat ID, network issues.

---

### 3. Summary Table

| Node Name                 | Node Type                              | Functional Role                              | Input Node(s)                      | Output Node(s)                   | Sticky Note                                                                                   |
|---------------------------|--------------------------------------|----------------------------------------------|----------------------------------|---------------------------------|----------------------------------------------------------------------------------------------|
| Email Trigger (IMAP)       | emailReadImap                        | Monitors inbox for new emails                 | -                                | Contain attachments?             |                                                                                              |
| Contain attachments?       | if                                  | Checks if email has attachments               | Email Trigger (IMAP)             | Get PDF and images attachments, Convert text |                                                                                              |
| Get PDF and images attachments | code                             | Extracts all attachments into separate items | Contain attachments? (true branch) | Switch                         | Get all attachments present in the email (in this WF only PDFs and images are considered)    |
| Switch                    | switch                              | Routes attachments by file type (PDF/image)  | Get PDF and images attachments   | Upload attachments + Extract from PDF (pdf), Upload attachments + Analyze image (image) |                                                                                              |
| Upload attachments         | googleDrive                         | Uploads attachments to Google Drive           | Switch                          | Extract from PDF, Analyze image  |                                                                                              |
| Extract from PDF           | extractFromFile                     | Extracts text from PDFs                        | Upload attachments (pdf branch) | PDF Analyzer                    |                                                                                              |
| PDF Analyzer               | chainLlm                           | Summarizes extracted PDF text                  | Extract from PDF                 | Save summary PDF, Split Out      | Analyze the content of PDF files and make a summary for each one                             |
| Gemini 2.0 Flash           | lmChatOpenRouter                   | AI model for PDF summarization                 | PDF Analyzer (ai_languageModel) | PDF Analyzer                    |                                                                                              |
| Structured Output Parser   | outputParserStructured             | Parses AI output into structured JSON          | PDF Analyzer                    | PDF Analyzer                    |                                                                                              |
| Save summary PDF           | googleSheets                      | Saves PDF summaries to Google Sheets           | PDF Analyzer                    | -                              |                                                                                              |
| Analyze image              | openAi (image analysis)            | Analyzes image content and describes it        | Upload attachments (image branch) | Save summary image             | Analyze the content of the image and describe it accurately                                 |
| Save summary image         | googleSheets                      | Saves image summaries to Google Sheets          | Analyze image                   | Map image summaries             |                                                                                              |
| Map image summaries        | set                               | Maps AI image description for aggregation      | Save summary image              | All summaries                  |                                                                                              |
| Convert text               | markdown                          | Converts email HTML content to plain text      | Contain attachments? (both branches) | Email Summarization Chain     |                                                                                              |
| DeepSeek R1                | lmChatOpenAi                      | AI model for email text summarization           | Convert text                   | Email Summarization Chain       |                                                                                              |
| Email Summarization Chain  | chainSummarization                | Summarizes email text content                    | Convert text, DeepSeek R1       | Save summary text, Email summary | Analyze the content of the email and summarize it                                           |
| Save summary text          | googleSheets                      | Saves email text summaries to Google Sheets     | Email Summarization Chain       | -                              |                                                                                              |
| Email summary              | set                               | Prepares email summary content for aggregation | Email Summarization Chain       | All summaries                  |                                                                                              |
| All summaries              | merge                             | Merges summaries from email, images, PDFs       | Email summary, Map image summaries, Split Out | Parsing                     | All the summaries of the email components (text, PDF, images) are aggregated and a final summary is generated |
| Parsing                   | code                              | Extracts summary text from merged summaries      | All summaries                  | Aggregate                     |                                                                                              |
| Aggregate                 | aggregate                         | Aggregates all summaries into one array          | Parsing                       | Create final summary           |                                                                                              |
| Create final summary       | chainLlm                         | Synthesizes all summaries into one final summary | Aggregate                     | Send final summary             |                                                                                              |
| OpenRouter Chat Model1     | lmChatOpenRouter                 | AI model used by Create final summary            | Create final summary (ai_languageModel) | Create final summary        |                                                                                              |
| Send final summary         | telegram                         | Sends final summary via Telegram                  | Create final summary           | -                              |                                                                                              |
| Sticky Note                | stickyNote                       | Workflow overview and setup instructions          | -                            | -                              | # AI Email Analyzer: Process PDFs, Images ... Clone this [Google Drive Sheet](https://docs.google.com/spreadsheets/d/1rBa0RI6XFfMerylVCV0dlKhJT_f4UAd8S6jyYX4aRRo/edit?usp=sharing) ... Insert your Chat_ID in Telegram node ... Choose the AI model you prefer |
| Sticky Note1               | stickyNote                       | Attachment extraction explanation                  | -                            | -                              | Get all attachments present in the email (in this WF only PDFs and images are considered)    |
| Sticky Note2               | stickyNote                       | PDF analysis explanation                            | -                            | -                              | Analyze the content of PDF files and make a summary for each one                             |
| Sticky Note3               | stickyNote                       | Image analysis explanation                          | -                            | -                              | Analyze the content of the image and describe it accurately                                 |
| Sticky Note4               | stickyNote                       | Email summarization explanation                      | -                            | -                              | Analyze the content of the email and summarize it                                           |
| Sticky Note5               | stickyNote                       | Summary aggregation explanation                      | -                            | -                              | All the summaries of the email components (text, PDF, images) are aggregated and a final summary is generated |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Email Trigger (IMAP) Node**  
   - Type: Email Trigger (IMAP)  
   - Configure IMAP credentials for your email account.  
   - Set to download attachments (`downloadAttachments: true`).  
   - Position: Start of the workflow.

2. **Add If Node "Contain attachments?"**  
   - Type: If  
   - Condition: Check if binary data is not empty (`{{$binary.isNotEmpty()}} == true`).  
   - Connect Email Trigger output to this node.

3. **Add Code Node "Get PDF and images attachments"**  
   - Type: Code  
   - JavaScript code: Iterate over all binary keys in input and output each attachment as a separate item with binary data under `data`.  
   - Connect "Contain attachments?" true branch to this node.

4. **Add Switch Node "Switch"**  
   - Type: Switch  
   - Add two rules:  
     - Output "pdf" if file extension equals "pdf" (case insensitive).  
     - Output "image" if file extension matches regex `/^(jpg|png)$/i`.  
   - Connect "Get PDF and images attachments" output to this node.

5. **Add Google Drive Node "Upload attachments"**  
   - Type: Google Drive  
   - Configure Google Drive OAuth2 credentials.  
   - Set file name to `{{$now.format('yyyyLLddhhiiss')}}-{{$binary.data.fileName}}`.  
   - Set folder ID to your target folder (e.g., `1CV5PgqBQIVFEacmbApdCApjNEtoNPzXQ`).  
   - Connect both "pdf" and "image" outputs from Switch to this node.

6. **PDF Processing Branch:**  
   - Add Extract from File Node "Extract from PDF"  
     - Operation: PDF text extraction.  
     - Connect from Upload attachments (pdf output).  
   - Add Chain LLM Node "PDF Analyzer"  
     - Use Gemini 2.0 Flash model (OpenRouter credentials).  
     - Configure prompt to summarize PDF text with detailed instructions.  
     - Connect Extract from PDF output to this node.  
   - Add Output Parser Node "Structured Output Parser"  
     - Schema: Object with string property `content`.  
     - Connect AI output of PDF Analyzer to this node.  
   - Add Google Sheets Node "Save summary PDF"  
     - Configure Google Sheets OAuth2 credentials.  
     - Set spreadsheet ID and sheet name.  
     - Map columns: ID (email message ID), DATE (current date), TYPE ("pdf"), EMAIL (sender), SUBJECT, SUMMARY (from AI output).  
     - Connect Structured Output Parser output to this node.  
   - Add Split Out Node "Split Out"  
     - Field to split out: `output` (summary content).  
     - Connect Save summary PDF output to this node.

7. **Image Processing Branch:**  
   - Add OpenAI Node "Analyze image"  
     - Model: GPT-4o-mini (OpenAI credentials).  
     - Operation: Analyze image (input type base64).  
     - Use detailed prompt for image description.  
     - Connect Upload attachments (image output) to this node.  
   - Add Google Sheets Node "Save summary image"  
     - Same Google Sheets setup as PDF summary but TYPE is "image".  
     - Connect Analyze image output to this node.  
   - Add Set Node "Map image summaries"  
     - Assign `content` field from AI response text.  
     - Connect Save summary image output to this node.

8. **Email Text Summarization Branch:**  
   - Add Markdown Node "Convert text"  
     - Input: email HTML content (`textHtml`).  
     - Converts HTML to plain text.  
     - Connect "Contain attachments?" node output (both branches) to this node.  
   - Add AI Model Node "DeepSeek R1"  
     - Model: deepseek/deepseek-r1:free (OpenRouter credentials).  
     - Connect Convert text output to this node.  
   - Add Chain Summarization Node "Email Summarization Chain"  
     - Use detailed prompt for concise email summary.  
     - Input from Convert text and DeepSeek R1 nodes.  
     - Connect DeepSeek R1 output to this node's AI input.  
   - Add Google Sheets Node "Save summary text"  
     - Same Google Sheets setup but TYPE is "email".  
     - Connect Email Summarization Chain output to this node.  
   - Add Set Node "Email summary"  
     - Assign `content` field from AI summary text.  
     - Connect Email Summarization Chain output to this node.

9. **Summary Aggregation:**  
   - Add Merge Node "All summaries"  
     - Number of inputs: 3  
     - Connect outputs: Email summary, Map image summaries, Split Out (PDF summaries).  
   - Add Code Node "Parsing"  
     - Extracts `output` or `content` from each item into `data.output`.  
     - Connect All summaries output to this node.  
   - Add Aggregate Node "Aggregate"  
     - Aggregates all `data.output` fields into an array.  
     - Connect Parsing output to this node.

10. **Final Summary Generation:**  
    - Add Chain LLM Node "Create final summary"  
      - Model: Gemini 2.0 Flash (OpenRouter credentials).  
      - Prompt instructs AI to synthesize all summaries into one coherent summary.  
      - Input: aggregated summaries array from Aggregate node.  
      - Connect Aggregate output to this node.

11. **Send Final Summary via Telegram:**  
    - Add Telegram Node "Send final summary"  
      - Configure Telegram API credentials.  
      - Set Chat ID to your target chat.  
      - Text input: final summary text from Create final summary node.  
      - Connect Create final summary output to this node.

12. **Add Sticky Notes** (optional for clarity):  
    - Add notes describing each major block and key nodes as per the original workflow.

---

### 5. General Notes & Resources

| Note Content                                                                                                    | Context or Link                                                                                           |
|----------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| Clone this [Google Drive Sheet](https://docs.google.com/spreadsheets/d/1rBa0RI6XFfMerylVCV0dlKhJT_f4UAd8S6jyYX4aRRo/edit?usp=sharing) to store summaries. | Google Sheets template used for saving summaries.                                                        |
| Insert your Telegram Chat ID in the Telegram node to receive final summaries.                                   | Telegram integration setup.                                                                              |
| AI models used include DeepSeek, Gemini 2.0 Flash, and OpenRouter for summarization and analysis.              | AI model credentials must be configured in n8n.                                                         |
| Optional: Replace IMAP trigger with Gmail or Outlook triggers for different email providers.                   | Workflow flexibility for different email sources.                                                       |
| Optional: Extend workflow to include other notification channels or storage services (Slack, Dropbox, AWS S3). | Customization possibilities for enhanced automation.                                                    |

---

This documentation provides a detailed, structured reference for understanding, reproducing, and modifying the "AI Email Analyzer: Process PDFs, Images & Save to Google Drive + Telegram" workflow in n8n. It covers all nodes, their roles, configurations, and integration points, enabling advanced users and AI agents to work effectively with this workflow.