AI-Powered Invoice Extractor via Telegram to Airtable

https://n8nworkflows.xyz/workflows/ai-powered-invoice-extractor-via-telegram-to-airtable-8396


# AI-Powered Invoice Extractor via Telegram to Airtable

### 1. Workflow Overview

This workflow is designed to automate the extraction of invoice data sent as PDF files via Telegram, leveraging AI capabilities to parse and structure the data, and then storing it systematically in Airtable. Its primary use case is for businesses or teams that receive invoices through Telegram and want to automate data entry and record keeping without manual intervention.

**Logical Blocks:**

- **1.1 Input Reception:** Handles incoming messages from Telegram, validates PDF invoice attachments, and extracts text from PDF files.
- **1.2 Data Preparation:** Prepares and formats extracted data and user messages for AI processing.
- **1.3 AI Processing:** Utilizes an AI agent with OpenAI GPT-4o model and conversational memory to extract structured invoice and line item data.
- **1.4 Data Storage:** Creates records in Airtable for both invoice headers and line items, establishing relational links.
- **1.5 User Feedback:** Sends confirmation or feedback messages back to the user on Telegram.
- **1.6 Setup & Documentation:** Notes and sticky notes providing setup instructions, data structure, troubleshooting, and configuration details.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  Listens for Telegram messages, filters for PDF attachments, and extracts text from PDFs for AI analysis.

- **Nodes Involved:**  
  - Telegram Trigger1  
  - Switch1  
  - Telegram2  
  - Extract from File1

- **Node Details:**

  - **Telegram Trigger1**  
    - Type: Telegram Trigger  
    - Role: Receives inbound Telegram messages including document attachments.  
    - Config: Listens for "message" updates only.  
    - Inputs: Incoming Telegram webhook messages.  
    - Outputs: Passes message data to Switch1.  
    - Edge cases: Messages without attachments or with unsupported file types.

  - **Switch1**  
    - Type: Switch  
    - Role: Checks if the incoming Telegram message contains a PDF document (MIME type `application/pdf`).  
    - Config: One rule matching exact MIME type for PDFs; fallback routes to "extra" output (non-PDF handling).  
    - Inputs: Message data from Telegram Trigger1.  
    - Outputs: Routes PDF messages to Telegram2; others to Edit Fields1.  
    - Edge cases: Non-PDF files, corrupted MIME type, or missing file info.

  - **Telegram2**  
    - Type: Telegram  
    - Role: Downloads the PDF file from Telegram using the file ID.  
    - Config: Uses the document’s `file_id` to fetch the file resource.  
    - Inputs: PDF file metadata from Switch1.  
    - Outputs: Passes the downloaded file to Extract from File1.  
    - Failure types: File download failures, Telegram API errors, invalid file IDs.

  - **Extract from File1**  
    - Type: Extract from File  
    - Role: Extracts text content from the PDF file for AI processing.  
    - Config: Operation set to "pdf" for PDF text extraction.  
    - Inputs: File buffer from Telegram2.  
    - Outputs: Extracted text data sent to Edit Fields1.  
    - Edge cases: Scanned PDFs without selectable text, large file size, extraction errors.

---

#### 1.2 Data Preparation

- **Overview:**  
  Prepares the extracted PDF text and user messages into structured format, setting up AI prompts and session keys for conversational context.

- **Nodes Involved:**  
  - Edit Fields1  
  - Simple Memory

- **Node Details:**

  - **Edit Fields1**  
    - Type: Set  
    - Role: Combines user message text and extracted PDF text into a single message string; assigns a memory session key.  
    - Config:  
      - `Message`: Concatenates `$json.text` (extracted PDF text) and `$json.message.text` (user message).  
      - `memory_id`: Set to Telegram chat ID for session tracking.  
    - Inputs: Extracted text from Extract from File1 or fallback from Switch1.  
    - Outputs: Sends formatted message to AI Agent1.  
    - Edge cases: Missing message text or extracted text.

  - **Simple Memory**  
    - Type: LangChain Memory Buffer Window  
    - Role: Maintains conversational memory keyed by Telegram chat ID to provide context for AI.  
    - Config: Session key dynamically set to `$('Telegram Trigger1').item.json.message.chat.id`.  
    - Inputs: Memory storage for AI Agent1.  
    - Outputs: Linked to AI Agent1’s memory input.  
    - Edge cases: Memory persistence issues, session ID mismatches.

---

#### 1.3 AI Processing

- **Overview:**  
  Orchestrates AI-driven extraction of invoice data and line items, guided by a structured system prompt. Uses GPT-4o to parse and respond with structured data.

- **Nodes Involved:**  
  - AI Agent1  
  - OpenAI Chat Model  
  - Create Invoice1  
  - Create Line Item1

- **Node Details:**

  - **AI Agent1**  
    - Type: LangChain Agent  
    - Role: Core AI orchestrator; processes combined input message, applies system instructions for invoice extraction, interacts with Airtable tools.  
    - Config:  
      - Uses GPT-4o via OpenAI Chat Model.  
      - System message defines a multi-step conversational flow:  
        1. Request client/company name.  
        2. Request invoice upload if missing.  
        3. Extract invoice header fields and create invoice record in Airtable.  
        4. Extract line items and create linked records in Airtable, ignoring items with zero quantity.  
      - Enforces data format rules (numeric fields without currency symbols, dates in YYYY-MM-DD, missing fields filled with "MISSING").  
      - Uses output from Create Invoice1 and Create Line Item1 nodes as AI tools for data persistence.  
    - Inputs: Message string from Edit Fields1, conversational memory from Simple Memory.  
    - Outputs: Confirmation message text to Telegram3.  
    - Edge cases: AI response errors, missing or malformed data, API rate limits, invalid Airtable responses.

  - **OpenAI Chat Model**  
    - Type: LangChain OpenAI Chat Model  
    - Role: Provides GPT-4o model AI completions used by AI Agent1.  
    - Config: Model set to "gpt-4o".  
    - Inputs: AI Agent1 prompt requests.  
    - Outputs: AI-generated text to AI Agent1.  
    - Edge cases: OpenAI API key invalid, API quota exceeded, network errors.

  - **Create Invoice1**  
    - Type: Airtable Tool  
    - Role: Creates a new invoice record in Airtable’s "Invoices" table with extracted header fields.  
    - Config: Maps AI-extracted fields such as Invoice Number, Date, Supplier, PO Number, Tax, Amount, Dates, and Addresses.  
    - Inputs: AI Agent1’s AI tool call.  
    - Outputs: Returns newly created record ID to AI Agent1 for linking line items.  
    - Edge cases: Missing required fields, Airtable API errors, field type mismatches.

  - **Create Line Item1**  
    - Type: Airtable Tool  
    - Role: Creates individual line item records linked to the invoice record in Airtable’s "Line Items" table.  
    - Config: Maps fields including Quantity, Sub Total, Unit Type, Unit Price, Description, Product Code, and linked Invoice record (passed as JSON array string).  
    - Inputs: AI Agent1’s AI tool call, includes linked Invoice record ID.  
    - Outputs: Confirmation of line item creation.  
    - Edge cases: Zero quantity items ignored per instruction, API errors, linking failures.

---

#### 1.4 Data Storage

- This block is functionally embedded within AI Processing nodes (Create Invoice1 and Create Line Item1) which handle all Airtable record creation and linking. Refer to nodes in 1.3.

---

#### 1.5 User Feedback

- **Overview:**  
  Sends the AI-generated confirmation or response back to the user on Telegram.

- **Nodes Involved:**  
  - Telegram3

- **Node Details:**

  - **Telegram3**  
    - Type: Telegram  
    - Role: Sends text messages back to the Telegram chat from which the invoice was received.  
    - Config:  
      - Message text is pulled from AI Agent1’s output JSON field `output`.  
      - Chat ID dynamically set to the Telegram chat ID from the trigger.  
    - Inputs: Text output from AI Agent1.  
    - Outputs: None (terminal step).  
    - Edge cases: Telegram API failures, invalid chat ID, message length limits.

---

#### 1.6 Setup & Documentation

- **Overview:**  
  Provides critical setup information, usage instructions, data structure details, troubleshooting tips, and configuration notes as sticky notes within the workflow canvas.

- **Nodes Involved:**  
  - Setup Requirements  
  - Workflow Overview  
  - Usage Instructions  
  - Data Structure  
  - Troubleshooting  
  - Configuration Notes

- **Node Details:**  
  Each sticky note contains detailed human-readable content aimed at aiding setup, usage, and maintenance. These do not interact programmatically but are essential for operators and developers.

---

### 3. Summary Table

| Node Name           | Node Type                           | Functional Role                           | Input Node(s)           | Output Node(s)           | Sticky Note                                                                                                  |
|---------------------|-----------------------------------|-----------------------------------------|------------------------|--------------------------|--------------------------------------------------------------------------------------------------------------|
| Telegram Trigger1    | Telegram Trigger                  | Receives Telegram messages               | -                      | Switch1                  |                                                                                                              |
| Switch1             | Switch                           | Filters for PDF attachments              | Telegram Trigger1       | Telegram2, Edit Fields1   |                                                                                                              |
| Telegram2            | Telegram                         | Downloads PDF file from Telegram         | Switch1                 | Extract from File1        |                                                                                                              |
| Extract from File1   | Extract from File                | Extracts text content from PDF           | Telegram2               | Edit Fields1              |                                                                                                              |
| Edit Fields1         | Set                             | Prepares combined message & sets memory  | Extract from File1, Switch1 fallback | AI Agent1          |                                                                                                              |
| Simple Memory        | LangChain Memory Buffer Window  | Provides conversational memory context   | -                      | AI Agent1 (ai_memory)     |                                                                                                              |
| AI Agent1            | LangChain Agent                 | AI-driven invoice and line item extraction, calls Airtable tools | Edit Fields1, Simple Memory | Telegram3           |                                                                                                              |
| OpenAI Chat Model    | LangChain OpenAI Chat Model    | GPT-4o model AI completions              | AI Agent1 (ai_languageModel) | AI Agent1           |                                                                                                              |
| Create Invoice1      | Airtable Tool                  | Creates invoice record in Airtable       | AI Agent1 (ai_tool)     | AI Agent1 (ai_tool)       |                                                                                                              |
| Create Line Item1    | Airtable Tool                  | Creates line item records linked to invoice | AI Agent1 (ai_tool)  | AI Agent1 (ai_tool)       |                                                                                                              |
| Telegram3            | Telegram                       | Sends confirmation message to Telegram  | AI Agent1               | -                        |                                                                                                              |
| Setup Requirements   | Sticky Note                   | Setup prerequisites and credentials info | -                      | -                        | 📋 SETUP REQUIREMENTS... Telegram Bot Token, OpenAI API Key, Airtable API credentials required                |
| Workflow Overview    | Sticky Note                   | High-level workflow purpose and flow     | -                      | -                        | 🤖 INVOICE CATEGORISER WORKFLOW overview                                                                    |
| Usage Instructions   | Sticky Note                   | User interaction steps                    | -                      | -                        | 📱 HOW TO USE instructions                                                                                   |
| Data Structure       | Sticky Note                   | Airtable tables and field definitions     | -                      | -                        | 📊 AIRTABLE DATA STRUCTURE details                                                                           |
| Troubleshooting      | Sticky Note                   | Common issues and fixes                    | -                      | -                        | 🔧 TROUBLESHOOTING common errors and tips                                                                     |
| Configuration Notes  | Sticky Note                   | AI and workflow config notes               | -                      | -                        | ⚙️ CONFIGURATION NOTES including AI agent settings and data validation rules                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node (Telegram Trigger1):**  
   - Type: Telegram Trigger  
   - Listen for message updates.  
   - Configure with your Telegram Bot credentials.  
   - This node receives incoming messages from users.

2. **Add Switch Node (Switch1):**  
   - Type: Switch  
   - Add a rule to check if the message contains a document MIME type equal to `application/pdf`.  
   - Route "true" path to Telegram node for file download; route "false" to Set node for fallback.

3. **Create Telegram Node for File Download (Telegram2):**  
   - Type: Telegram  
   - Set Resource to "file".  
   - File ID expression: `{{$json["message"]["document"]["file_id"]}}`.  
   - Connect from Switch1’s PDF output.

4. **Add Extract from File Node (Extract from File1):**  
   - Type: Extract from File  
   - Operation: PDF  
   - Connect Telegram2 output to this node.  
   - This extracts text content from the PDF file.

5. **Create Set Node (Edit Fields1):**  
   - Type: Set  
   - Define two fields:  
     - `Message` = `{{$json["text"]}} {{$json["message"]["text"]}}`  
     - `memory_id` = `{{$json["message"]["chat"]["id"]}}`  
   - Connect from Extract from File1.  
   - Also connect fallback from Switch1 (non-PDF path) directly to this node to handle messages without PDFs.

6. **Add LangChain Memory Buffer Window Node (Simple Memory):**  
   - Type: LangChain Memory Buffer Window  
   - Session key set to Telegram chat ID: `={{ $('Telegram Trigger1').item.json.message.chat.id }}`.  
   - This maintains stateful conversational memory per chat.

7. **Create LangChain Agent Node (AI Agent1):**  
   - Type: LangChain Agent  
   - Text input set to the `Message` field from Edit Fields1.  
   - Configure system prompt with detailed instructions for a 4-step process:  
     1. Ask for client/company name.  
     2. Ask for invoice upload if missing.  
     3. Extract invoice header fields, create invoice record in Airtable.  
     4. Extract line items, create linked records in Airtable, ignoring zero quantity.  
   - Use the GPT-4o OpenAI Chat Model (create and connect separately).  
   - Connect Simple Memory to AI Agent1’s memory input.  
   - Connect Create Invoice1 and Create Line Item1 nodes as AI tools for database operations.

8. **Create LangChain OpenAI Chat Model Node (OpenAI Chat Model):**  
   - Type: LangChain OpenAI Chat Model  
   - Model: GPT-4o.  
   - Connect to AI Agent1’s AI language model input.

9. **Create Airtable Tool Node for Invoice (Create Invoice1):**  
   - Type: Airtable Tool  
   - Base: Select your Airtable base (e.g., 'Invoice Tracker Proper').  
   - Table: 'Invoices'.  
   - Map fields exactly from AI-extracted data: Invoice Number, Date, Supplier, PO Number, Total Tax, Total Amount, Due Date, Delivery Date, Receiver Name, Receiver Address, Supplier Address, Supplier Tax ID.  
   - Operation: Create.  
   - Connect as AI tool input to AI Agent1.

10. **Create Airtable Tool Node for Line Items (Create Line Item1):**  
    - Type: Airtable Tool  
    - Base: Same Airtable base.  
    - Table: 'Line Items'.  
    - Map fields: Quantity, Sub Total, Unit Type, Unit Price, Description, Product Code, and link to Invoice record as a JSON array string.  
    - Operation: Create.  
    - Connect as AI tool input to AI Agent1.

11. **Create Telegram Node for Sending Messages (Telegram3):**  
    - Type: Telegram  
    - Text: `{{$json["output"]}}` (output text from AI Agent1).  
    - Chat ID: `={{ $('Telegram Trigger1').item.json.message.chat.id }}`.  
    - Connect from AI Agent1 output.

12. **Configure Credentials:**  
    - Telegram Bot credentials for Telegram nodes.  
    - OpenAI API key with GPT-4o access for LangChain OpenAI Chat Model.  
    - Airtable API key with access to the specified base and tables.

13. **Add Sticky Notes (optional but recommended):**  
    - Add notes for Setup Requirements, Workflow Overview, Usage Instructions, Data Structure, Troubleshooting, Configuration Notes with the contents provided in the original workflow for team reference.

---

### 5. General Notes & Resources

| Note Content                                                                                                   | Context or Link                                                                                          |
|---------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| 📋 SETUP REQUIREMENTS: Telegram Bot Token, OpenAI API Key (GPT-4o), Airtable API credentials needed           | Found in Setup Requirements sticky note                                                                |
| 🤖 INVOICE CATEGORISER WORKFLOW overview with process and feature summary                                     | Workflow Overview sticky note                                                                           |
| 📱 HOW TO USE: conversation starts with any message, bot asks for client name, then invoice upload, extraction | Usage Instructions sticky note                                                                           |
| 📊 AIRTABLE DATA STRUCTURE: Invoices and Line Items tables, fields, and linking details                        | Data Structure sticky note                                                                               |
| 🔧 TROUBLESHOOTING guidance for common issues: file processing, AI, Airtable, Telegram, and memory problems    | Troubleshooting sticky note                                                                              |
| ⚙️ CONFIGURATION NOTES: AI agent settings, data validation, workflow logic, and performance tips               | Configuration Notes sticky note                                                                          |
| **Links:** Airtable base URL: https://airtable.com/appG8Paox9E4p7vMR                                           | Referenced in Airtable nodes for base and tables                                                        |

---

This completes a thorough, structured reference for the "AI-Powered Invoice Extractor via Telegram to Airtable" workflow, enabling advanced users and AI agents to understand, reproduce, and maintain the automation effectively.