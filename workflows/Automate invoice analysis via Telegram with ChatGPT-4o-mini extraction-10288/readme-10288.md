Automate invoice analysis via Telegram with ChatGPT-4o-mini extraction

https://n8nworkflows.xyz/workflows/automate-invoice-analysis-via-telegram-with-chatgpt-4o-mini-extraction-10288


# Automate invoice analysis via Telegram with ChatGPT-4o-mini extraction

### 1. Workflow Overview

This workflow automates the analysis of invoices sent via Telegram by leveraging AI-powered extraction with ChatGPT-4o-mini. It is designed primarily for accountants, finance teams, or any users needing quick and structured extraction of invoice details from uploaded documents.  

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Listens to incoming Telegram messages and filters for document uploads.
- **1.2 File Retrieval:** Downloads the invoice file from Telegram servers.
- **1.3 Data Extraction:** Extracts raw text from the invoice PDF.
- **1.4 AI Processing:** Uses an AI agent (ChatGPT-based) to analyze the extracted text and generate structured invoice data.
- **1.5 Response Formatting and Delivery:** Formats the AI response and sends the analysis back to the Telegram chat.
- **1.6 Error Handling:** Notifies the user if the input is not a valid document.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block listens for new messages in Telegram, specifically looking for invoice documents uploaded by users.

- **Nodes Involved:**  
  - Telegram Trigger  
  - Check if Document  
  - Send Error Message  

- **Node Details:**  

  1. **Telegram Trigger**  
     - Type: Telegram Trigger  
     - Role: Entry point that listens to Telegram updates/messages.  
     - Configuration: Subscribed to "message" updates only.  
     - Inputs: None (Webhook triggered).  
     - Outputs: Forwards message JSON to next node.  
     - Edge cases: Telegram API downtime, webhook misconfiguration.  
     - Notes: Requires Telegram bot credentials configured with proper webhook URLs.

  2. **Check if Document**  
     - Type: If  
     - Role: Checks if the incoming message contains a document property (i.e., a file).  
     - Configuration: Condition tests if `$json.message.document` exists.  
     - Inputs: Receives Telegram message JSON.  
     - Outputs:  
       - True branch: message contains a document → proceed to file retrieval.  
       - False branch: message has no document → triggers error message node.  
     - Edge cases: Message with unsupported media types, missing fields, or malformed JSON.

  3. **Send Error Message**  
     - Type: Telegram  
     - Role: Sends a prompt back to user if the uploaded message is not a document.  
     - Configuration: Sends a fixed text instructing user to send a document file (PDF/image).  
     - Inputs: Receives message JSON with chat ID to respond to.  
     - Outputs: None.  
     - Edge cases: Telegram send message API failures, invalid chat ID.

#### 2.2 File Retrieval

- **Overview:**  
  This block fetches the invoice document file metadata and downloads the raw file content from Telegram's servers.

- **Nodes Involved:**  
  - Get File from Telegram  
  - HTTP Request - Download File  

- **Node Details:**  

  1. **Get File from Telegram**  
     - Type: Telegram  
     - Role: Retrieves file metadata including file_path using Telegram API.  
     - Configuration: Uses `file_id` from the incoming document message.  
     - Inputs: Message JSON with document info.  
     - Outputs: File metadata including `file_path`.  
     - Edge cases: Invalid file ID, Telegram API rate limits.  
     - Requires valid Telegram API credentials.

  2. **HTTP Request - Download File**  
     - Type: HTTP Request  
     - Role: Downloads the actual invoice file from Telegram file server.  
     - Configuration:  
       - URL constructed dynamically using Telegram bot token and file_path from previous node.  
       - Response type set to "file" for binary download.  
     - Inputs: File metadata JSON with file_path.  
     - Outputs: Binary file data for downstream processing.  
     - Edge cases: Network timeouts, invalid URL, file size limits, authorization errors.

#### 2.3 Data Extraction

- **Overview:**  
  Extracts readable text content from the downloaded invoice PDF file.

- **Nodes Involved:**  
  - Extract Invoice Data  

- **Node Details:**  

  1. **Extract Invoice Data**  
     - Type: Extract From File (n8n built-in)  
     - Role: Extracts text content from PDF binary data.  
     - Configuration: Operation set to "extractFromPDF".  
     - Inputs: Binary PDF file from previous HTTP request node.  
     - Outputs: JSON containing extracted text under `$json.text`.  
     - Edge cases: Corrupt or scanned PDFs without selectable text, extraction failures.

#### 2.4 AI Processing

- **Overview:**  
  Uses an AI agent powered by ChatGPT-4o-mini to analyze extracted text and parse key invoice information in a structured format.

- **Nodes Involved:**  
  - AI Agent - Analyze Invoice  
  - OpenAI Chat Model  

- **Node Details:**  

  1. **AI Agent - Analyze Invoice**  
     - Type: Langchain Agent  
     - Role: Primary AI node that sends extracted text for analysis.  
     - Configuration:  
       - Prompt instructs the AI to extract specific invoice fields (invoice number, date, vendor, total, currency, due date, line items, payment status, discrepancies).  
       - System message sets the AI role as an expert invoice analyst.  
       - Output parser enabled for structured output.  
     - Inputs: Extracted text JSON.  
     - Outputs: Structured AI output JSON.  
     - Edge cases: Token limits exceeded, ambiguous text, AI API errors.

  2. **OpenAI Chat Model**  
     - Type: Langchain LLM (OpenAI Chat)  
     - Role: Underlying language model used by AI Agent for processing.  
     - Configuration: Temperature set low (0.2) for deterministic output.  
     - Credentials: Uses OpenAI API key credential labeled "OpenAi account 2".  
     - Inputs: Receives prompt from AI Agent.  
     - Outputs: AI response forwarded back.  
     - Edge cases: API quota exceeded, auth failures, network errors.

#### 2.5 Response Formatting and Delivery

- **Overview:**  
  Formats the AI response into a Telegram-friendly message and sends the invoice analysis back to the user.

- **Nodes Involved:**  
  - Format Response  
  - Send Analysis to Telegram  

- **Node Details:**  

  1. **Format Response**  
     - Type: Code (JavaScript)  
     - Role: Combines AI output with original chat metadata for final message preparation.  
     - Configuration:  
       - Extracts AI analysis from input JSON.  
       - Retrieves chat ID and original file name from Telegram message.  
       - Adds timestamp of analysis.  
     - Inputs: AI Agent output JSON and original Telegram JSON (via node reference).  
     - Outputs: JSON with chatId, analysis text, fileName, and timestamp.  
     - Edge cases: Missing original message data or AI output.

  2. **Send Analysis to Telegram**  
     - Type: Telegram  
     - Role: Sends back the formatted invoice analysis in Markdown to the user’s chat.  
     - Configuration:  
       - Uses Markdown parse mode for formatting.  
       - Message includes file name, timestamp, and detailed AI analysis.  
     - Inputs: Formatted JSON from previous node with chat ID and analysis text.  
     - Outputs: None.  
     - Edge cases: Telegram API send message failures, invalid chat ID.

---

### 3. Summary Table

| Node Name               | Node Type                      | Functional Role                  | Input Node(s)               | Output Node(s)                  | Sticky Note                                         |
|-------------------------|--------------------------------|---------------------------------|-----------------------------|--------------------------------|----------------------------------------------------|
| Telegram Trigger        | Telegram Trigger               | Incoming Telegram messages       | -                           | Check if Document              | Covers overall workflow introduction and setup    |
| Check if Document       | If                            | Validate if message has document | Telegram Trigger            | Get File from Telegram, Send Error Message | Covers overall workflow introduction and setup |
| Send Error Message      | Telegram                      | Notify user to send document     | Check if Document (false)    | -                              |                                                    |
| Get File from Telegram  | Telegram                      | Retrieve file metadata           | Check if Document (true)     | HTTP Request - Download File    |                                                    |
| HTTP Request - Download File | HTTP Request             | Download invoice file            | Get File from Telegram       | Extract Invoice Data           |                                                    |
| Extract Invoice Data    | Extract From File             | Extract text from PDF            | HTTP Request - Download File | AI Agent - Analyze Invoice     |                                                    |
| AI Agent - Analyze Invoice | Langchain Agent             | AI analysis of extracted text   | Extract Invoice Data         | Format Response                |                                                    |
| OpenAI Chat Model       | Langchain LLM Chat           | Underlying OpenAI language model| AI Agent - Analyze Invoice   | AI Agent - Analyze Invoice (ai_languageModel input) |                                          |
| Format Response         | Code                         | Format AI output for Telegram   | AI Agent - Analyze Invoice   | Send Analysis to Telegram      |                                                    |
| Send Analysis to Telegram | Telegram                    | Deliver analysis to user        | Format Response              | -                              |                                                    |
| Sticky Note             | Sticky Note                  | Workflow overview and instructions | -                         | -                              | ## Introduction and Setup Instructions             |
| Sticky Note1            | Sticky Note                  | Prerequisites and benefits      | -                           | -                              | ## Prerequisites and Benefits                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger node:**  
   - Node Type: Telegram Trigger  
   - Configuration: Subscribe to "message" updates only.  
   - Credentials: Link Telegram Bot API credentials (bot token).  
   - Position: Entry point.

2. **Add If node "Check if Document":**  
   - Node Type: If  
   - Condition: Check if `$json.message.document` exists (object exists).  
   - Input: Connect from Telegram Trigger main output.  
   - Output True branch: Proceed to file retrieval.  
   - Output False branch: Send error message.

3. **Add Telegram node "Send Error Message":**  
   - Node Type: Telegram  
   - Parameters:  
     - Text: "❌ Please send a document file (PDF or image) to check the invoice."  
     - Chat ID: Expression - `{{$json.message.chat.id}}`  
   - Input: Connect from "Check if Document" False branch.

4. **Add Telegram node "Get File from Telegram":**  
   - Node Type: Telegram  
   - Parameters:  
     - Resource: File  
     - File ID: Expression - `{{$json.message.document.file_id}}`  
   - Input: Connect from "Check if Document" True branch.

5. **Add HTTP Request node "HTTP Request - Download File":**  
   - Node Type: HTTP Request  
   - Parameters:  
     - HTTP Method: GET  
     - URL: Expression - `https://api.telegram.org/file/bot{{$credentials.telegramApi.accessToken}}/{{$json.result.file_path}}`  
     - Response Format: File (binary)  
   - Input: Connect from "Get File from Telegram" main output.

6. **Add Extract From File node "Extract Invoice Data":**  
   - Node Type: Extract From File  
   - Parameters: Operation set to "extractFromPDF".  
   - Input: Connect from HTTP Request node (binary file input).

7. **Set up AI Agent node "AI Agent - Analyze Invoice":**  
   - Node Type: Langchain Agent  
   - Parameters:  
     - Text prompt:  
       ```
       Analyze the following invoice text and extract key information:

       {{ $json.text }}

       Provide the following details:
       1. Invoice Number
       2. Invoice Date
       3. Vendor/Supplier Name
       4. Total Amount
       5. Currency
       6. Due Date
       7. Line Items (if available)
       8. Payment Status
       9. Any discrepancies or issues found

       Format the response in a clear, structured manner.
       ```  
     - System message: "You are an expert invoice analyst. Extract accurate information from invoices and identify any potential issues or discrepancies."  
     - Enable output parser.  
   - Input: Connect from Extract Invoice Data node.

8. **Configure OpenAI Chat Model node "OpenAI Chat Model":**  
   - Node Type: Langchain LLM Chat (OpenAI)  
   - Parameters: Temperature = 0.2 for deterministic output.  
   - Credentials: Use OpenAI API key credential (e.g., "OpenAi account 2").  
   - Connect as AI language model provider for AI Agent node.

9. **Add Code node "Format Response":**  
   - Node Type: Code (JavaScript)  
   - Code:  
     ```javascript
     const aiResponse = $input.first().json.output;
     const originalMessage = $('Telegram Trigger').first().json;

     return {
       json: {
         chatId: originalMessage.message.chat.id,
         analysis: aiResponse,
         fileName: originalMessage.message.document?.file_name || 'Unknown',
         timestamp: new Date().toISOString()
       }
     };
     ```  
   - Input: Connect from AI Agent node.

10. **Add Telegram node "Send Analysis to Telegram":**  
    - Node Type: Telegram  
    - Parameters:  
      - Text (Markdown):  
        ```
        📄 *Invoice Analysis Complete*

        *File:* {{ $json.fileName }}
        *Analyzed at:* {{ $json.timestamp }}

        *Results:*
        {{ $json.analysis }}

        ✅ Analysis completed successfully!
        ```  
      - Chat ID: Expression - `{{$json.chatId}}`  
      - Parse Mode: Markdown  
    - Input: Connect from Format Response node.

---

### 5. General Notes & Resources

| Note Content                                                                                                  | Context or Link                                    |
|--------------------------------------------------------------------------------------------------------------|---------------------------------------------------|
| Workflow enables uploading invoices via Telegram, receiving structured extraction powered by OpenAI GPT.     | Overview and introduction sticky note in workflow |
| Setup requires creating a Telegram Bot via BotFather and linking credentials in n8n.                         | Setup instructions in sticky note                  |
| Requires OpenAI API key configured as credential in n8n for Langchain nodes.                                 | Credential configuration note                       |
| Workflow template demonstrates end-to-end automation reducing manual invoice data entry and errors.          | Benefits and customization sticky note             |
| Potential extensions include database storage or integration with accounting software for further automation.| Recommendations in sticky notes                      |

---

This detailed documentation provides a comprehensive understanding of the workflow’s structure, logic, and configuration to support efficient use, modification, or reproduction.