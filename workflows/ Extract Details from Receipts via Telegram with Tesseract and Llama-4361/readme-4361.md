 Extract Details from Receipts via Telegram with Tesseract and Llama

https://n8nworkflows.xyz/workflows/-extract-details-from-receipts-via-telegram-with-tesseract-and-llama-4361


#  Extract Details from Receipts via Telegram with Tesseract and Llama

### 1. Workflow Overview

This workflow automates the extraction of detailed expense information from receipts sent via Telegram messages, either as images or text. It leverages image processing (Tesseract OCR) and AI language models (OpenRouter-powered Langchain nodes) to parse and categorize financial data such as store details, transaction date/time, items purchased, totals, and expense categories. The processed summary is then sent back to the user on Telegram.  

The workflow is organized into the following logical blocks:  

- **1.1 Input Reception:** Receives Telegram messages containing either text or receipt images.  
- **1.2 Image Handling & Text Extraction:** If the input is an image, downloads the file from Telegram and extracts text using Tesseract OCR.  
- **1.3 AI Processing & Parsing:** Uses AI to categorize the text input or OCR output, parsing it into structured financial data.  
- **1.4 Message Formatting:** Formats the parsed data into a user-friendly summary message.  
- **1.5 Validation & Response:** Checks for invalid or suspicious inputs, then sends either an error message or the expense summary back to the user on Telegram.  

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception  
- **Overview:** Receives incoming messages from Telegram users, triggering the workflow. Determines if the message contains an image or plain text to route processing accordingly.  
- **Nodes Involved:**  
  - Telegram Trigger  
  - Check for Image  
  - Extract Text Input  

- **Node Details:**  
  - **Telegram Trigger**  
    - Type: Telegram trigger node  
    - Role: Entry point for all Telegram messages (photo or text) to start processing  
    - Config: Listens to "message" updates; uses Telegram API credentials  
    - Inputs: Telegram user messages  
    - Outputs: Passes message data downstream  
    - Failures: Telegram API auth errors, webhook issues  
    - Sticky Note: Explains the trigger's role in expense tracking initiation  

  - **Check for Image**  
    - Type: If node  
    - Role: Determines if incoming message has a photo to branch processing  
    - Config: Checks if `message.photo` field exists  
    - Inputs: Telegram Trigger node output  
    - Outputs: Two branches — image present or text input  
    - Failures: Expression errors if message structure changes  
    - Sticky Note: Notes the routing based on input type  

  - **Extract Text Input**  
    - Type: Set node  
    - Role: Extracts plain text from Telegram message for AI processing  
    - Config: Assigns `message` variable from `message.text` field  
    - Inputs: Text branch of Check for Image  
    - Outputs: Passes text to AI Categorizer  
    - Failures: Missing or empty text field  
    - Sticky Note: Describes handling of plain text input  

#### 2.2 Image Handling & Text Extraction  
- **Overview:** For messages containing images, the workflow retrieves the image file from Telegram, downloads it, and extracts text using Tesseract OCR.  
- **Nodes Involved:**  
  - Get Telegram File  
  - Download Image  
  - Extract Value From Image  

- **Node Details:**  
  - **Get Telegram File**  
    - Type: HTTP Request  
    - Role: Queries Telegram API to get the file path from the photo file ID  
    - Config: URL dynamically constructed with Telegram Bot token and photo file ID (fourth photo size)  
    - Inputs: Image branch of Check for Image  
    - Outputs: JSON with file path for download  
    - Failures: Invalid token, missing photo sizes, Telegram API downtime  
    - Sticky Note: Explains fetching file ID of uploaded receipt image  

  - **Download Image**  
    - Type: HTTP Request  
    - Role: Downloads the receipt image file using the file path from previous node  
    - Config: URL composed from Telegram Bot token and file path; expects file response  
    - Inputs: Output of Get Telegram File  
    - Outputs: Binary image data for OCR  
    - Failures: Network timeouts, invalid file path, Telegram API issues  
    - Sticky Note: Notes the download and preparation of receipt photo  

  - **Extract Value From Image**  
    - Type: Tesseract OCR node  
    - Role: Extracts plain text from the downloaded image file  
    - Config: Uses default OCR options on binary image input  
    - Inputs: Download Image node output (binary)  
    - Outputs: Text extracted from receipt image  
    - Failures: OCR inaccuracies, unreadable images, unsupported languages  
    - Sticky Note: Describes text extraction from image  

#### 2.3 AI Processing & Parsing  
- **Overview:** Processes text input (from plain text or OCR output) with AI to classify and extract structured receipt data including store info, transaction details, items, totals, and categories.  
- **Nodes Involved:**  
  - AI Categorizer  
  - AI Analyzer  
  - Receipt Parser  

- **Node Details:**  
  - **AI Categorizer**  
    - Type: Langchain chain LLM node  
    - Role: Categorizes input text as "Income" or "Expense" with subcategories, handling multilingual inputs and relative dates  
    - Config: Prompt includes category options, instructions to output in input language, fallback for not found, and uses date from Telegram Trigger context  
    - Inputs: Text from Extract Text Input or Extract Value From Image  
    - Outputs: Categorization result with total amount and expense category  
    - Failures: API rate limits, parsing errors, unexpected input formats  
    - Sticky Note: Explains AI classification logic  

  - **AI Analyzer**  
    - Type: Langchain LM Chat OpenRouter node  
    - Role: Interfaces with OpenRouter AI for advanced NLP tasks (details not fully exposed)  
    - Config: Uses OpenRouter API credentials  
    - Inputs: Output from Receipt Parser’s AI output parser  
    - Outputs: Refined AI output for parsing receipt data  
    - Failures: OpenRouter API auth, network issues  
    - Sticky Note: Describes OpenRouter AI model configuration  

  - **Receipt Parser**  
    - Type: Langchain output parser structured node  
    - Role: Converts AI output into structured JSON with keys: store, transaction, items, summary  
    - Config: Uses a JSON schema example for expected output format (store name/location, date/time, items array, summary with total/payment/category)  
    - Inputs: AI Analyzer output  
    - Outputs: Structured data object representing receipt details  
    - Failures: Parsing mismatches, incomplete data  
    - Sticky Note: Details parsed receipt data structure  

#### 2.4 Message Formatting  
- **Overview:** Converts structured receipt data into a human-readable summary message for Telegram. Handles missing data and checks for suspicious zero totals.  
- **Nodes Involved:**  
  - Format Summary Message  

- **Node Details:**  
  - **Format Summary Message**  
    - Type: Code node (JavaScript)  
    - Role: Constructs a formatted message string summarizing store, location, date/time, items, total, and category  
    - Config: Uses fallback values for missing fields; warns if total is zero; formats currency with "Rp" prefix; includes emoji icons per section  
    - Inputs: AI Categorizer output JSON (structured)  
    - Outputs: Single JSON with `message` field containing formatted text  
    - Failures: Expression errors if input structure changes  
    - Sticky Note: Notes creation of clear expense summary message  

#### 2.5 Validation & Response  
- **Overview:** Validates the formatted message for errors (e.g., zero total), sends appropriate error or summary messages back to the user on Telegram.  
- **Nodes Involved:**  
  - Check Invalid Input  
  - Send Error Message  
  - Send Expense Summary  

- **Node Details:**  
  - **Check Invalid Input**  
    - Type: If node  
    - Role: Checks if the message text equals the zero-total warning message  
    - Config: Strict string equality check against "Looks like an input error, total is 0? Did you get this for free? Please check again."  
    - Inputs: Format Summary Message output  
    - Outputs: Two branches — error message or success summary  
    - Failures: Text mismatch, message formatting changes  
    - Sticky Note: Explains detection of invalid or zero-value entries  

  - **Send Error Message**  
    - Type: Telegram node  
    - Role: Sends an error warning to the Telegram user if input is invalid  
    - Config: Uses Telegram API credentials; sends personalized message with user's first name and error text  
    - Inputs: Error branch of Check Invalid Input  
    - Outputs: Telegram message sent confirmation  
    - Failures: Telegram API limits, chat ID missing  
    - Sticky Note: Describes sending warnings to user  

  - **Send Expense Summary**  
    - Type: Telegram node  
    - Role: Sends the formatted expense summary to the user on Telegram  
    - Config: Uses Telegram API credentials; personalized greeting with summary message; Indonesian language used in greeting ("Ini Rekap Belanjamu")  
    - Inputs: Success branch of Check Invalid Input  
    - Outputs: Telegram message sent confirmation  
    - Failures: Telegram API issues, chat ID missing  
    - Sticky Note: Notes sending summary back to user  

---

### 3. Summary Table

| Node Name                | Node Type                           | Functional Role                             | Input Node(s)               | Output Node(s)              | Sticky Note                                                                                                                 |
|--------------------------|-----------------------------------|--------------------------------------------|-----------------------------|-----------------------------|-----------------------------------------------------------------------------------------------------------------------------|
| Telegram Trigger          | telegramTrigger                   | Entry point, receives Telegram messages     |                             | Check for Image             | 📲 **Telegram Trigger** Receives user messages (text or photo) from Telegram to start the expense tracking flow.            |
| Check for Image           | if                               | Determines if input is image or text        | Telegram Trigger            | Get Telegram File (image branch), Extract Text Input (text branch) | 🔍 **Check for Image** Determines whether the input is an image or text to route accordingly.                                |
| Extract Text Input        | set                              | Extracts text from Telegram text message    | Check for Image (text branch) | AI Categorizer             | 📝 **Extract Text Input** Handles plain text inputs when no image is provided by the user.                                   |
| Get Telegram File         | httpRequest                      | Gets file path for receipt image from Telegram | Check for Image (image branch) | Download Image             | 📦 **Get Telegram File** Fetches the file ID of a receipt image uploaded via Telegram.                                        |
| Download Image            | httpRequest                      | Downloads receipt image file                 | Get Telegram File           | Extract Value From Image    | ⬇️ **Download Image** Downloads the receipt photo and prepares it for text extraction.                                       |
| Extract Value From Image  | tesseractNode                    | Performs OCR to extract text from image     | Download Image              | AI Categorizer             | 🖼️ **Text Extractor** Extract text from given image                                                                        |
| AI Categorizer            | langchain.chainLlm               | Categorizes and annotates text input        | Extract Text Input, Extract Value From Image | Format Summary Message | 🧠 **AI Categorizer** Uses AI to classify input into categories like income or expenses, handling dates and languages.         |
| Format Summary Message    | code                             | Formats structured data into summary message| AI Categorizer              | Check Invalid Input         | 🧾 **Format Message** Creates a clear summary of expenses with store, date, items, total, and category.                      |
| Check Invalid Input       | if                               | Checks for invalid or zero-value inputs     | Format Summary Message      | Send Error Message (error), Send Expense Summary (valid) | 🚫 **Check Invalid Input** Detects and flags incorrect or zero-value entries before sending a response.                      |
| Send Error Message        | telegram                         | Sends error message to user                  | Check Invalid Input (error) |                             | ❗ **Send Error Message** Sends a warning to the user if the input is invalid or incomplete.                                  |
| Send Expense Summary      | telegram                         | Sends expense summary message to user       | Check Invalid Input (valid) |                             | 📬 **Send Expense Summary** Sends a summary of the recognized receipt or input to the user's Telegram chat.                  |
| AI Analyzer               | langchain.lmChatOpenRouter       | Refines AI output using OpenRouter           | Receipt Parser (ai_outputParser) | AI Categorizer (ai_outputParser) | 🤖 **OpenRouter AI Model** Configures the language model to extract structured information from natural language input.     |
| Receipt Parser            | langchain.outputParserStructured | Parses AI output into structured JSON       | AI Analyzer                 | AI Categorizer (ai_outputParser) | 📊 **Parse Receipt Data** Converts AI output into structured JSON with store, transaction, items, and totals.                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Type: Telegram Trigger  
   - Configure with your Telegram Bot credentials (OAuth2 or Bot Token)  
   - Set to listen for "message" updates  

2. **Add If Node "Check for Image"**  
   - Condition: Check if `message.photo` exists in incoming Telegram data  
   - Outputs: Two branches — image exists or not  

3. **For Text Input Branch:**  
   - Add Set Node "Extract Text Input"  
     - Assign `message` = `{{$json.message.text}}`  

4. **For Image Input Branch:**  
   - Add HTTP Request Node "Get Telegram File"  
     - URL: `https://api.telegram.org/bot<your_bot_token>/getFile?file_id={{$json.message.photo[3].file_id}}` (replace `<your_bot_token>` with your bot token)  
   - Add HTTP Request Node "Download Image"  
     - URL: `https://api.telegram.org/file/bot<your_bot_token>/{{$node["Get Telegram File"].json["result"]["file_path"]}}`  
     - Response format: file (binary)  

   - Add Tesseract OCR Node "Extract Value From Image"  
     - Input: binary data from Download Image  
     - Use default OCR settings  

5. **Add Langchain Chain LLM Node "AI Categorizer"**  
   - Input text: from Extract Text Input or Extract Value From Image  
   - Configure prompt to classify input as Income or Expense, with subcategories and multilingual support  
   - Include context for date handling using Telegram Trigger message date  

6. **Add Code Node "Format Summary Message"**  
   - Input: JSON from AI Categorizer node  
   - Script to build a formatted message including store, location, date/time, items, total, category  
   - Handle missing data with defaults, warn if total is zero  

7. **Add If Node "Check Invalid Input"**  
   - Condition: message equals zero total warning string  
   - Branches: error or valid  

8. **Add Telegram Node "Send Error Message"**  
   - Send error message to user's chat ID  
   - Use template including user’s first name and error message  

9. **Add Telegram Node "Send Expense Summary"**  
   - Send formatted expense summary message to user's chat ID  
   - Use a greeting and the formatted message  

10. **Add Langchain LM Chat OpenRouter Node "AI Analyzer"**  
    - Configure with OpenRouter API credentials  
    - Input from Receipt Parser's ai_outputParser output  

11. **Add Langchain Output Parser Structured Node "Receipt Parser"**  
    - Provide JSON schema example defining store, transaction, items, and summary fields  
    - Input from AI Analyzer output  

12. **Connect Nodes**  
    - Connect Telegram Trigger → Check for Image  
    - Image branch: Check for Image → Get Telegram File → Download Image → Extract Value From Image → AI Categorizer  
    - Text branch: Check for Image → Extract Text Input → AI Categorizer  
    - AI Categorizer → Format Summary Message → Check Invalid Input  
    - Check Invalid Input error branch → Send Error Message  
    - Check Invalid Input valid branch → Send Expense Summary  
    - Receipt Parser and AI Analyzer connected for structured parsing and refinement  

13. **Set Credentials**  
    - Telegram nodes: Use Telegram API credentials with bot token  
    - AI nodes: Use OpenRouter API credentials  
    - HTTP nodes: No additional credentials needed beyond bot token in URL  

14. **Test Workflow**  
    - Send text and photo messages via Telegram bot to validate extraction and responses  

---

### 5. General Notes & Resources

| Note Content                                                                                                         | Context or Link                                            |
|----------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------|
| MoneyMate is free to use! Feedback and ideas welcomed at https://khmuhtadin.com                                     | Project homepage and contact                                |
| Support development by buying coffee: https://buymeacoffee.com/khmuhtadin                                            | Donation link for workflow author                           |
| Workflow uses OpenRouter API for versatile AI language model integration                                             | Requires valid OpenRouter API key                           |
| Telegram Bot Token must be correctly inserted in HTTP Request URLs for file retrieval                                | Replace `<your_bot_token_here>` placeholder in URLs        |
| Handles input in English and Bahasa Indonesia, auto-detects language for output                                      | Multilingual AI prompt configured                           |
| Uses Tesseract OCR node to extract text from images; accuracy depends on image quality                               | OCR may fail on blurry or complex receipts                  |
| Zero-total detection prevents sending incorrect expense summaries and prompts user to verify                        | Prevents false positive expense entries                     |

---

**Disclaimer:** The provided text is extracted exclusively from an automated workflow created with n8n integration and automation tool. All content respects current content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.