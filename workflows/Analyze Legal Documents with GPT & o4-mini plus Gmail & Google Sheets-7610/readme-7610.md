Analyze Legal Documents with GPT & o4-mini plus Gmail & Google Sheets

https://n8nworkflows.xyz/workflows/analyze-legal-documents-with-gpt---o4-mini-plus-gmail---google-sheets-7610


# Analyze Legal Documents with GPT & o4-mini plus Gmail & Google Sheets

### 1. Workflow Overview

This workflow, titled **"PDF Document Assistant 2.0"**, automates the processing and detailed AI-powered analysis of PDF documents uploaded via a webhook. Its primary use case is to assist users—particularly those handling legal, compliance, or business-critical documents—in understanding complex documents by delivering a professional, richly formatted email report. The workflow integrates PDF text extraction, chunked summarization via OpenAI models, advanced AI document analysis using a LangChain AI Agent, email delivery through Gmail, and logging of interactions in Google Sheets.

The workflow is logically divided into the following functional blocks:

- **1.1 Entry Point & File Reception:** Receives uploaded PDF files and user metadata (name, email, title) via a webhook.
- **1.2 PDF Text Extraction & Preprocessing:** Extracts raw text from the PDF and splits it into manageable chunks enriched with user data.
- **1.3 AI Summarization Chain:** Sequentially summarizes each text chunk using OpenAI's GPT-3.5-turbo model to produce a consolidated summary.
- **1.4 Advanced AI Document Analysis:** Employs a LangChain AI Agent with a custom prompt to perform deep, structured document review and generates a professional email-style analysis.
- **1.5 Email Delivery:** Sends the AI-generated analysis as a formatted email to the user via Gmail.
- **1.6 Logging & Tracking:** Appends metadata about the processed document and user interaction into a Google Sheets spreadsheet for record-keeping and status tracking.
- **1.7 Webhook Response:** Immediately responds to the upload request with a 302 redirect to a success webpage.

---

### 2. Block-by-Block Analysis

#### 2.1 Entry Point & File Reception

- **Overview:**  
  This block listens for HTTP POST requests on a webhook endpoint, receiving uploaded PDF files alongside user information (name, email, and document title). It provides immediate acknowledgment to the client.

- **Nodes Involved:**  
  - `Webhook`  
  - `Respond to Webhook`  
  - `Sticky Note1`  
  - `Sticky Note5`

- **Node Details:**  
  - **Webhook**  
    - *Type:* HTTP Webhook Listener  
    - *Configuration:*  
      Listens on path `/upload-pqx92oa`, HTTP method POST. Returns response via downstream node.  
    - *Inputs:* External HTTP POST with PDF binary and user metadata.  
    - *Outputs:* Passes received data (binary PDF, JSON body) downstream.  
    - *Edge Cases:* Missing or malformed uploads, unsupported file types, large files causing timeouts.  
  - **Respond to Webhook**  
    - *Type:* Webhook Response Node  
    - *Configuration:*  
      Sends HTTP 302 redirect with "Content-Type: text/html" header to a success page URL upon upload completion.  
    - *Inputs:* Triggered immediately after file reception.  
    - *Outputs:* Sends HTTP response to client.  

#### 2.2 PDF Text Extraction & Preprocessing

- **Overview:**  
  Extracts text content from the uploaded PDF. Splits the extracted text into chunks (~4000 characters each) to ensure compatibility with downstream AI model input size limits. Enriches each chunk with user metadata.

- **Nodes Involved:**  
  - `Extract from File`  
  - `Code`  
  - `Sticky Note2`

- **Node Details:**  
  - **Extract from File**  
    - *Type:* File Text Extraction  
    - *Configuration:*  
      Extracts text from the binary property named `data` using PDF operation.  
    - *Inputs:* PDF binary from Webhook node.  
    - *Outputs:* Extracted raw text.  
    - *Edge Cases:* Corrupted PDFs, encrypted or scanned PDFs without embedded text.  
  - **Code**  
    - *Type:* JavaScript Function  
    - *Configuration:*  
      Splits extracted text into chunks of 4000 characters; pulls user name, email, and document title from webhook data; outputs array of JSON objects, each with a text chunk and metadata.  
    - *Inputs:* Extracted text JSON.  
    - *Outputs:* Array of chunked text objects.  
    - *Edge Cases:* Empty or very short text, missing user metadata.  

#### 2.3 AI Summarization Chain

- **Overview:**  
  Performs the first level of AI processing: summarizing each chunk of extracted text using OpenAI GPT-3.5-turbo to produce condensed, coherent summaries retaining legal and business meaning.

- **Nodes Involved:**  
  - `Basic LLM Chain`  
  - `OpenAI Chat Model1`  
  - `Code1`  
  - `Sticky Note3`  
  - `Sticky Note4`

- **Node Details:**  
  - **Basic LLM Chain**  
    - *Type:* LangChain LLM Chain Node  
    - *Configuration:*  
      Uses prompt: "Summarize the following section of a document. Retain legal terms, obligations, or business meaning." with input variable `{{ $json.chunk }}`.  
    - *Inputs:* Chunked text JSON from Code node.  
    - *Outputs:* Summary text for each chunk.  
  - **OpenAI Chat Model1**  
    - *Type:* OpenAI GPT-3.5 Chat Model  
    - *Configuration:*  
      Model set to `gpt-3.5-turbo`. Connected as language model for Basic LLM Chain.  
    - *Credentials:* Uses OpenAI API key (OpenAi account 2).  
    - *Edge Cases:* Rate limits, API errors, partial responses.  
  - **Code1**  
    - *Type:* JavaScript Function  
    - *Configuration:*  
      Concatenates all chunk summaries into a single full summary string and attaches user metadata for downstream use.  
    - *Inputs:* Summarized chunk outputs.  
    - *Outputs:* Single JSON with `full_summary`, `name`, `email`, and `title`.  

#### 2.4 Advanced AI Document Analysis

- **Overview:**  
  Applies an advanced AI Agent powered by LangChain and OpenAI's o4-mini model to deeply analyze the full summarized document text. It performs classification, detailed chapter-by-chapter review, legal or business insights, risk flagging, and generates a professional email-style report.

- **Nodes Involved:**  
  - `AI Agent`  
  - `OpenAI Chat Model`  
  - `Sticky Note`  
  - `Sticky Note4`

- **Node Details:**  
  - **AI Agent**  
    - *Type:* LangChain Agent Node  
    - *Configuration:*  
      Receives a rich prompt designed to guide the AI through expert-level document classification, analysis, and report generation. Uses variables for user name, email, extracted text summary, and document title.  
      Output is a fully formatted HTML email content.  
    - *Inputs:* Full summarized text and metadata from Code1.  
    - *Outputs:* Formatted AI-generated email content.  
    - *Edge Cases:* Prompt failures, incomplete AI responses, model latency or API errors.  
  - **OpenAI Chat Model**  
    - *Type:* OpenAI Chat Model  
    - *Configuration:*  
      Model set to `o4-mini-2025-04-16` for deeper reasoning and analysis. Connected as the language model for AI Agent.  
    - *Credentials:* Uses OpenAI API key (OpenAi account 2).  

#### 2.5 Email Delivery

- **Overview:**  
  Sends the AI Agent's formatted email response directly to the user’s email address, with a subject referencing the document title.

- **Nodes Involved:**  
  - `Gmail1`  
  - `Sticky Note6`

- **Node Details:**  
  - **Gmail1**  
    - *Type:* Gmail Node  
    - *Configuration:*  
      Sends to email address extracted from the original webhook input. Uses subject line “Summary of your attached Document - [Document Title]”.  
      Message body is the AI Agent's HTML output.  
      Sender name set to "Swot AI".  
    - *Credentials:* Uses Gmail OAuth2 credentials ("Gmail account 3").  
    - *Edge Cases:* SMTP authentication failure, invalid recipient email, Gmail API rate limits.  

#### 2.6 Logging & Tracking

- **Overview:**  
  Logs the processing event, including user name, email, document title, status label (from Gmail node metadata), and timestamp into a Google Sheets document for audit and tracking.

- **Nodes Involved:**  
  - `Google Sheets`

- **Node Details:**  
  - **Google Sheets**  
    - *Type:* Google Sheets Node  
    - *Configuration:*  
      Appends a new row with columns: Date, Time, Name, Email, Status, Filename. Uses ISO date/time formatting for timestamp.  
      Targets specific spreadsheet and sheet (`SwotAI_Users` sheet in a known Google Sheet ID).  
    - *Credentials:* Google OAuth2 credentials ("Google Sheets account").  
    - *Edge Cases:* Spreadsheet access permissions, API quota limits, data formatting issues.  

---

### 3. Summary Table

| Node Name         | Node Type                          | Functional Role                        | Input Node(s)           | Output Node(s)            | Sticky Note                                                                                      |
|-------------------|----------------------------------|--------------------------------------|------------------------|---------------------------|------------------------------------------------------------------------------------------------|
| Webhook           | HTTP Webhook                     | Entry point, receive upload & metadata | -                      | Extract from File, Respond to Webhook | ## Entry point — receives uploaded PDF via POST request.                                       |
| Respond to Webhook | Webhook Response                 | Sends immediate HTTP redirect response | Webhook                | -                         | ## Respond to Webhook — sends immediate acknowledgment back to the client after upload.        |
| Extract from File  | Extract Text from PDF            | Extracts raw text from uploaded PDF   | Webhook                 | Code                      |                                                                                                |
| Code              | JavaScript Function              | Splits text into chunks, enriches with metadata | Extract from File        | Basic LLM Chain           | ## Code (pre-processing) - Clean/format the extracted text (remove line breaks, non-text).      |
| Basic LLM Chain    | LangChain LLM Chain              | Summarizes each text chunk             | Code                    | Code1                     | ## Basic LLM Chain - First AI pass: summarization / restructuring of document content.          |
| OpenAI Chat Model1 | OpenAI GPT-3.5 Chat Model        | Provides language model for summarization | Basic LLM Chain (ai_languageModel) | Basic LLM Chain           |                                                                                                |
| Code1             | JavaScript Function              | Combines chunk summaries and metadata | Basic LLM Chain          | AI Agent                  |                                                                                                |
| AI Agent          | LangChain Agent Node             | Deep document analysis & report generation | Code1                   | Gmail1                    | ## AI Agent - Central intelligence handling prompts, memory, reasoning, and detailed analysis.  |
| OpenAI Chat Model  | OpenAI Chat Model (o4-mini)       | Language model for AI Agent            | AI Agent (ai_languageModel) | AI Agent                  |                                                                                                |
| Gmail1            | Gmail Node                      | Sends formatted analysis email to user | AI Agent                 | Google Sheets              | ## Gmail - Sends formatted results to the user (summary, clauses, flagged risks, etc.).         |
| Google Sheets     | Google Sheets Append Row         | Logs user and document metadata        | Gmail1                   | -                         |                                                                                                |
| Sticky Note1       | Sticky Note                     | Annotation for Webhook block            | -                        | -                         | ## Entry point — receives uploaded PDF via POST request.                                       |
| Sticky Note2       | Sticky Note                     | Annotation for Code pre-processing       | -                        | -                         | ## Code (pre-processing) - Clean/format the extracted text (remove line breaks, non-text).      |
| Sticky Note3       | Sticky Note                     | Annotation for Basic LLM Chain           | -                        | -                         | ## Basic LLM Chain - First AI pass: summarization / restructuring of document content.          |
| Sticky Note4       | Sticky Note                     | Annotation for AI Agent                   | -                        | -                         | ## AI Agent - Central intelligence handling prompts, memory, reasoning, and detailed analysis.  |
| Sticky Note5       | Sticky Note                     | Annotation for Respond to Webhook        | -                        | -                         | ## Respond to Webhook - Sends immediate acknowledgment back to the client after upload.         |
| Sticky Note6       | Sticky Note                     | Annotation for Gmail node                 | -                        | -                         | ## Gmail - Sends formatted results to the user (summary, clauses, flagged risks, etc.).         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: HTTP Webhook  
   - Parameters:  
     - Path: `upload-pqx92oa`  
     - HTTP Method: POST  
     - Response Mode: Response Node  
   - Purpose: Receive uploaded PDF and user metadata.

2. **Create Respond to Webhook Node**  
   - Type: Respond to Webhook  
   - Parameters:  
     - Response Code: 302  
     - Response Headers: Content-Type = text/html  
     - Redirect URL: `https://swot-ai25.github.io/pdf-document-assistant/success.html`  
   - Connect Webhook → Respond to Webhook.

3. **Create Extract from File Node**  
   - Type: Extract from File  
   - Parameters:  
     - Operation: pdf  
     - Binary Property Name: `data` (matches uploaded file property)  
   - Connect Webhook → Extract from File.

4. **Create Code Node (Text Chunking & Metadata Injection)**  
   - Type: Code (JavaScript)  
   - Parameters:  
     - JavaScript to:  
       - Retrieve extracted text from `text` property  
       - Retrieve `name`, `email`, and `title` from webhook JSON body  
       - Split text into 4000-character chunks  
       - Output array of chunk objects, each with chunk text and metadata  
   - Connect Extract from File → Code.

5. **Create Basic LLM Chain Node**  
   - Type: LangChain Chain LLM  
   - Parameters:  
     - Prompt: "Summarize the following section of a document. Retain legal terms, obligations, or business meaning.\n\n{{ $json.chunk }}"  
   - Connect Code → Basic LLM Chain.

6. **Create OpenAI Chat Model Node (GPT-3.5 Turbo)**  
   - Type: OpenAI Chat Model  
   - Model: `gpt-3.5-turbo`  
   - Assign credentials for OpenAI API.  
   - Connect as language model to Basic LLM Chain.

7. **Create Code1 Node (Concatenate Summaries)**  
   - Type: Code (JavaScript)  
   - Parameters:  
     - Combine all chunk summaries into a single string in `full_summary`  
     - Pass along `name`, `email`, and `title` from earlier steps  
   - Connect Basic LLM Chain → Code1.

8. **Create AI Agent Node**  
   - Type: LangChain Agent  
   - Parameters:  
     - Use detailed prompt template for document classification, chapter-by-chapter analysis, legal/business insights, risk flagging, and professional email generation (HTML format)  
   - Connect Code1 → AI Agent.

9. **Create OpenAI Chat Model Node (o4-mini)**  
   - Type: OpenAI Chat Model  
   - Model: `o4-mini-2025-04-16`  
   - Assign credentials for OpenAI API.  
   - Connect as language model to AI Agent.

10. **Create Gmail Node**  
    - Type: Gmail  
    - Parameters:  
      - Send To: `={{ $('Code1').item.json.email }}`  
      - Subject: `Summary of your attached Document - {{ $('Code1').item.json.title }}`  
      - Message: `={{ $json.output }}` (HTML formatted from AI Agent)  
      - Sender Name: "Swot AI"  
      - Append Attribution: false  
    - Assign Gmail OAuth2 credentials.  
    - Connect AI Agent → Gmail.

11. **Create Google Sheets Node**  
    - Type: Google Sheets Append Row  
    - Parameters:  
      - Document ID and Sheet Name for user logs  
      - Columns: Date (current date), Time (current time), Name, Email, Status (from Gmail labelIds), Filename  
    - Assign Google Sheets OAuth2 credentials.  
    - Connect Gmail → Google Sheets.

12. **Add Sticky Notes** for documentation (optional but recommended):  
    - Mark entry point, code preprocessing, AI summarization, AI Agent, response, and email sending steps.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                 | Context or Link                                                                                   |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| The workflow uses LangChain nodes for advanced AI orchestration, integrating OpenAI chat models for summarization and detailed reasoning.                   | https://docs.n8n.io/integrations/builtin/nodes/n8n-nodes-langchain/                              |
| Gmail node uses OAuth2 for secure email sending; ensure Gmail account is authorized with appropriate scopes (send email).                                    | https://developers.google.com/gmail/api/auth/about-auth                                       |
| Google Sheets node appends metadata logs for audit and tracking; requires Google Sheets API enabled and OAuth2 credentials configured.                      | https://developers.google.com/sheets/api/quickstart/js                                         |
| The chunk size of 4000 characters balances prompt length limits and summarization quality for GPT-3.5-turbo.                                                 | GPT-3.5-turbo max tokens ~4096 tokens; chunk size chosen conservatively for safe prompt limits.  |
| The AI Agent prompt is designed for legal/business document analysis with professional email formatting in HTML, suitable for direct user communication.      | Prompt text embedded in AI Agent node parameters, following best practices for clarity and tone.|
| Immediate webhook response prevents client timeouts and provides user feedback on upload success via a redirect to a static success page.                    | https://swot-ai25.github.io/pdf-document-assistant/success.html                                |

---

This completes a detailed, structured reference of the **"PDF Document Assistant 2.0"** workflow, enabling understanding, reproduction, and extension.