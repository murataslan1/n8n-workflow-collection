AI-Powered Receipt and Expense Tracker with Telegram, Google Sheets & OpenAI

https://n8nworkflows.xyz/workflows/ai-powered-receipt-and-expense-tracker-with-telegram--google-sheets---openai-4950


# AI-Powered Receipt and Expense Tracker with Telegram, Google Sheets & OpenAI

### 1. Workflow Overview

This workflow, titled **"AI-Powered Receipt and Expense Tracker with Telegram, Google Sheets & OpenAI"**, is designed as a smart money management system that automates the process of tracking income and expenses through Telegram interactions, AI-powered OCR and natural language processing, and data storage in Google Sheets. It targets users who want to log financial transactions conveniently via chat and receive categorized, structured records with minimal manual input.

The logical blocks of the workflow are:

- **1.1 Telegram Interaction & Input Reception:** Handles user messages, triggers, and commands from Telegram, distinguishing between income, expenses, and other inputs.

- **1.2 AI-Powered OCR & Document Parsing:** Processes receipt images or PDFs sent by users through OCR (Google Vision) and external PDF parsing via LlamaIndex, converting documents into structured text.

- **1.3 AI Categorization & Natural Language Understanding:** Uses OpenAI and LangChain nodes to categorize financial inputs and parse the structured output into actionable data.

- **1.4 Data Validation & Conditional Routing:** Checks critical values such as transaction price and type, ensuring valid inputs and directing the flow accordingly.

- **1.5 Data Storage & Summary Reporting:** Saves validated income and expense records into Redis for session/state management, appends the entries to Google Sheets, and sends summary messages back to Telegram.

- **1.6 Workflow Control & Error Handling:** Includes delay nodes for polling external services, retry logic, and error notifications via Telegram.

---

### 2. Block-by-Block Analysis

#### 1.1 Telegram Interaction & Input Reception

**Overview:**  
This block triggers on Telegram messages, identifies if the message indicates income, expense, or other commands, and routes accordingly.

**Nodes Involved:**  
- Telegram Trigger  
- Check Start  
- Welcome Menu  
- Check Income  
- Save Income to Redis  
- Check Expenses  
- Save Expenses to Redis  
- Check Input  
- Get Transaction Type  
- Extract Transaction Type  
- Content Type Router  
- Request Pemasukan (Request Income)  
- Request expense (Request Expense)  

**Node Details:**

- **Telegram Trigger**  
  - Type: Telegram Trigger node  
  - Role: Entry point activated by Telegram messages  
  - Configuration: Listens for all incoming messages; webhook linked to Telegram bot  
  - Connections: Outputs to multiple "Check" nodes for message classification  
  - Failures: Network/webhook errors, Telegram API limits  

- **Check Start**  
  - Type: If node  
  - Role: Checks if the message is a "start" command to trigger the welcome menu  
  - Key Expression: Compares message text to start command  
  - Connections: Output to Welcome Menu node  

- **Welcome Menu**  
  - Type: Telegram node  
  - Role: Sends welcome message/menu to user  
  - Configuration: Text message with options or instructions  
  - Failures: Telegram message send failures  

- **Check Income**  
  - Type: If node  
  - Role: Detects if the message relates to income input  
  - Key Expression: Matches income-related keywords or commands  
  - Connections: Routes to Save Income to Redis  

- **Save Income to Redis**  
  - Type: Redis node  
  - Role: Saves income transaction data temporarily for state management  
  - Configuration: Uses Redis credentials; stores transaction under user/session key  
  - Failures: Redis connection/auth errors  

- **Check Expenses**  
  - Type: If node  
  - Role: Detects if message relates to expense input  
  - Connections: Routes to Save Expenses to Redis  

- **Save Expenses to Redis**  
  - Type: Redis node  
  - Role: Saves expense transaction data temporarily  
  - Failures: See Save Income to Redis  

- **Check Input**  
  - Type: If node  
  - Role: Checks if input is a transaction requiring processing  
  - Connections: Routes to Get Transaction Type  

- **Get Transaction Type**  
  - Type: Redis node  
  - Role: Retrieves stored transaction type for the current session  
  - Failures: Redis failures as above  

- **Extract Transaction Type**  
  - Type: Set node  
  - Role: Extracts and formats transaction type for routing  
  - Connections: Output to Content Type Router  

- **Content Type Router**  
  - Type: Switch node  
  - Role: Routes based on content type (image, PDF, text, etc.)  
  - Connections: To image download, PDF upload, text extraction nodes  

- **Request Pemasukan (Income Request)** and **Request expense**  
  - Type: Telegram nodes  
  - Role: Sends prompts to users to enter income or expense details  
  - Failures: Telegram send errors  

**Edge Cases & Failure Types:**  
- Missing or malformed Telegram messages  
- Redis connectivity outages  
- Unexpected message content leading to routing errors  

---

#### 1.2 AI-Powered OCR & Document Parsing

**Overview:**  
Handles receipt images or PDFs sent by users, converts them into base64, calls Google Vision OCR and LlamaIndex for document parsing, and polls for parsing results.

**Nodes Involved:**  
- Download Image  
- Convert to Base64  
- Google Vision OCR  
- Check OCR Result  
- Extract OCR Text  
- 📥 Download PDF from Telegram  
- ☁️ Upload PDF to LlamaIndex  
- ⏳ Check Parsing Status  
- 🔁 Condition: Was Parsing Successful?  
- ⏱ Delay Before Recheck  
- 📥 Get Parsed Markdown Result  
- Download VN  
- OpenAI  

**Node Details:**

- **Download Image**  
  - Type: Telegram node  
  - Role: Downloads receipt image sent by user  
  - Failures: Telegram API limits, missing file  

- **Convert to Base64**  
  - Type: Code node  
  - Role: Converts downloaded image to base64 string for API upload  
  - Failures: Encoding errors  

- **Google Vision OCR**  
  - Type: HTTP Request node  
  - Role: Sends base64 image to Google Vision OCR API for text extraction  
  - Configuration: Uses Google API credentials and endpoint  
  - Failures: API quota, auth errors, network timeouts  

- **Check OCR Result**  
  - Type: Code node  
  - Role: Validates OCR response, ensures text was extracted  
  - Failures: Empty or malformed API response  

- **Extract OCR Text**  
  - Type: Set node  
  - Role: Extracts and formats OCR text for downstream processing  

- **📥 Download PDF from Telegram**  
  - Type: Telegram node  
  - Role: Downloads PDF files sent by users  

- **☁️ Upload PDF to LlamaIndex**  
  - Type: HTTP Request node  
  - Role: Uploads PDF to LlamaIndex API for parsing  

- **⏳ Check Parsing Status**  
  - Type: HTTP Request node  
  - Role: Polls LlamaIndex for parsing status  

- **🔁 Condition: Was Parsing Successful?**  
  - Type: If node  
  - Role: Checks if parsing is complete and successful  

- **⏱ Delay Before Recheck**  
  - Type: Wait node  
  - Role: Implements delay between polling attempts  

- **📥 Get Parsed Markdown Result**  
  - Type: HTTP Request node  
  - Role: Retrieves final parsed result from LlamaIndex  

- **Download VN**  
  - Type: HTTP Request node  
  - Role: Downloads auxiliary data for AI processing (likely vendor notes or similar)  

- **OpenAI**  
  - Type: LangChain OpenAI node  
  - Role: Uses OpenAI to process or refine parsed data  

**Edge Cases & Failure Types:**  
- OCR failures or incomplete text extraction  
- LlamaIndex upload or parsing failures  
- API rate limits or timeouts  
- PDF file corruption or unsupported formats  

---

#### 1.3 AI Categorization & Natural Language Understanding

**Overview:**  
Processes extracted text using LangChain AI models to categorize transactions and produce structured output.

**Nodes Involved:**  
- AI Categorizer  
- OpenRouter Chat Model  
- Structured Output Parser  
- Extract AI Result  

**Node Details:**

- **AI Categorizer**  
  - Type: LangChain chain LLM node  
  - Role: Classifies transaction data (e.g., income, expense categories)  
  - Configuration: Uses retry on failure to enhance robustness  
  - Input: Merged data from OCR/text extraction and user input  

- **OpenRouter Chat Model**  
  - Type: LangChain LM Chat node  
  - Role: Provides conversational AI model backend for categorization  
  - Configuration: Uses OpenRouter API as LLM provider  

- **Structured Output Parser**  
  - Type: LangChain output parser node  
  - Role: Parses AI output into structured JSON or defined schema for processing  

- **Extract AI Result**  
  - Type: Telegram node  
  - Role: Receives AI result and prepares it for storing and reporting  

**Edge Cases & Failure Types:**  
- Model API authentication or quota issues  
- Unexpected AI output format or parsing errors  
- Retry logic prevents some failures but prolonged outages remain a risk  

---

#### 1.4 Data Validation & Conditional Routing

**Overview:**  
Validates key transaction data such as price, routes transactions depending on their validity and type, and handles errors.

**Nodes Involved:**  
- check price  
- price greater than 0?  
- Expenses?  
- Send Error  

**Node Details:**

- **check price**  
  - Type: Set node  
  - Role: Extracts and prepares price value for validation  

- **price greater than 0?**  
  - Type: If node  
  - Role: Validates the price is a positive number  
  - True: Routes to Expenses? node  
  - False: Routes to Send Error node  

- **Expenses?**  
  - Type: If node  
  - Role: Checks if transaction is an expense  
  - True: Routes to Send Expense Summary  
  - False: Routes to Send Income Summary  

- **Send Error**  
  - Type: Telegram node  
  - Role: Sends error message to user for invalid input  

**Edge Cases & Failure Types:**  
- Missing or zero/negative price values  
- Incorrect transaction typing causing misrouting  

---

#### 1.5 Data Storage & Summary Reporting

**Overview:**  
Stores validated transaction data into Google Sheets and Redis, sends summary messages back to Telegram users.

**Nodes Involved:**  
- Append Expenses  
- Append Income  
- Send Expense Summary  
- Send Income Summary  
- Transform to Sheets Format  
- Delay  
- Input Accept  

**Node Details:**

- **Append Expenses / Append Income**  
  - Type: Google Sheets node  
  - Role: Appends transaction data to respective sheets (expenses or income)  
  - Configuration: Uses Google OAuth2 credentials, target spreadsheet and worksheet specified  
  - Failures: OAuth token expiry, API limits  

- **Send Expense Summary / Send Income Summary**  
  - Type: Telegram nodes  
  - Role: Sends summary messages to users after successful recording  

- **Transform to Sheets Format**  
  - Type: Code node  
  - Role: Transforms AI parsed data into Google Sheets compatible row format  

- **Delay**  
  - Type: Wait node  
  - Role: Adds delay before final acceptance to allow asynchronous processes to complete  

- **Input Accept**  
  - Type: Telegram node  
  - Role: Sends confirmation to user that input was accepted  

**Edge Cases & Failure Types:**  
- Google Sheets API quota or permission errors  
- Telegram message delivery failures  

---

#### 1.6 Workflow Control & Error Handling

**Overview:**  
Implements polling delays, retries, and error notifications to ensure robustness.

**Nodes Involved:**  
- Delay (general)  
- ⏱ Delay Before Recheck  
- Send Error  

**Node Details:**

- **Delay** and **⏱ Delay Before Recheck**  
  - Type: Wait nodes  
  - Role: Control timing between retries or status checks, essential for asynchronous API polling  

- **Send Error**  
  - As above, notifies user of errors or invalid inputs  

**Edge Cases & Failure Types:**  
- Excessive delays causing user experience degradation  
- Missed error notifications if Telegram is unreachable  

---

### 3. Summary Table

| Node Name                    | Node Type                         | Functional Role                         | Input Node(s)                       | Output Node(s)                     | Sticky Note                   |
|------------------------------|----------------------------------|---------------------------------------|-----------------------------------|----------------------------------|------------------------------|
| Telegram Trigger             | Telegram Trigger                 | Entry point for Telegram messages      |                                   | Check Start, Check Income, Check Expenses, Check Input |                              |
| Check Start                 | If                              | Detects 'start' command                 | Telegram Trigger                  | Welcome Menu                     |                              |
| Welcome Menu                | Telegram                        | Sends welcome message                   | Check Start                      |                                  |                              |
| Check Income                | If                              | Detects income-related input            | Telegram Trigger                  | Save Income to Redis             |                              |
| Save Income to Redis        | Redis                           | Stores income data temporarily          | Check Income                     | Request Pemasukan               |                              |
| Request Pemasukan           | Telegram                        | Prompts for income details              | Save Income to Redis             |                                  |                              |
| Check Expenses              | If                              | Detects expense-related input           | Telegram Trigger                  | Save Expenses to Redis           |                              |
| Save Expenses to Redis      | Redis                           | Stores expense data temporarily         | Check Expenses                   | Request expense                 |                              |
| Request expense             | Telegram                        | Prompts for expense details             | Save Expenses to Redis           |                                  |                              |
| Check Input                 | If                              | Checks if input is transaction          | Telegram Trigger                  | Get Transaction Type            |                              |
| Get Transaction Type        | Redis                           | Retrieves stored transaction type       | Check Input                     | Extract Transaction Type        |                              |
| Extract Transaction Type    | Set                             | Prepares transaction type for routing  | Get Transaction Type             | Content Type Router             |                              |
| Content Type Router         | Switch                          | Routes based on content type            | Extract Transaction Type         | Download Image, Notify PDF, Ambil Vn, Extract Text Input |                              |
| Download Image              | Telegram                        | Downloads image from Telegram            | Content Type Router              | Convert to Base64               |                              |
| Convert to Base64           | Code                            | Converts image to base64                 | Download Image                  | Google Vision OCR              |                              |
| Google Vision OCR           | HTTP Request                   | Calls Google OCR API for text extraction | Convert to Base64               | Check OCR Result               |                              |
| Check OCR Result            | Code                            | Validates OCR response                   | Google Vision OCR               | Extract OCR Text               |                              |
| Extract OCR Text            | Set                             | Extracts OCR text                        | Check OCR Result                | Merge                         |                              |
| 📥 Download PDF from Telegram | Telegram                      | Downloads PDF from Telegram              | Content Type Router             | ☁️ Upload PDF to LlamaIndex     |                              |
| ☁️ Upload PDF to LlamaIndex  | HTTP Request                   | Uploads PDF for parsing                  | 📥 Download PDF from Telegram   | ⏳ Check Parsing Status         |                              |
| ⏳ Check Parsing Status       | HTTP Request                   | Polls for parsing result status          | ☁️ Upload PDF to LlamaIndex      | 🔁 Condition: Was Parsing Successful? |                              |
| 🔁 Condition: Was Parsing Successful? | If                    | Checks parsing completion                 | ⏳ Check Parsing Status          | 📥 Get Parsed Markdown Result, ⏱ Delay Before Recheck |                              |
| ⏱ Delay Before Recheck       | Wait                           | Waits before re-polling                   | 🔁 Condition: Was Parsing Successful? | ⏳ Check Parsing Status         |                              |
| 📥 Get Parsed Markdown Result | HTTP Request                   | Retrieves final parsed markdown           | 🔁 Condition: Was Parsing Successful? | Merge                         |                              |
| Merge                      | Merge                           | Combines data streams                     | Extract OCR Text, 📥 Get Parsed Markdown Result, Extract Text Input | Input Accept                   |                              |
| Input Accept               | Telegram                        | Confirms input acceptance                 | Merge                          | AI Categorizer                 |                              |
| AI Categorizer             | LangChain Chain LLM             | Categorizes transaction                   | Input Accept                   | Extract AI Result              |                              |
| OpenRouter Chat Model      | LangChain LM Chat               | Chat-based AI categorization              | AI Categorizer (ai_languageModel) | AI Categorizer               |                              |
| Structured Output Parser   | LangChain Output Parser         | Parses AI output into structured format   | AI Categorizer (ai_outputParser) | AI Categorizer               |                              |
| Extract AI Result          | Telegram                        | Receives AI output to process further     | AI Categorizer                 | Transform to Sheets Format     |                              |
| Transform to Sheets Format | Code                           | Formats data for Google Sheets             | Extract AI Result              | Delay                         |                              |
| Delay                      | Wait                           | Waits before final processing              | Transform to Sheets Format     | check price                   |                              |
| check price                | Set                            | Extracts price for validation               | Delay                         | price greater than 0?          |                              |
| price greater than 0?      | If                             | Validates price positive                     | check price                   | Expenses?, Send Error          |                              |
| Expenses?                  | If                             | Determines if transaction is expense         | price greater than 0?          | Send Expense Summary, Send Income Summary |                              |
| Send Expense Summary       | Telegram                       | Sends expense summary to user                 | Expenses?                    | Append Expenses               |                              |
| Send Income Summary        | Telegram                       | Sends income summary to user                  | Expenses?                    | Append Income                 |                              |
| Append Expenses            | Google Sheets                  | Appends expense data to Google Sheets         | Send Expense Summary          |                              |                              |
| Append Income              | Google Sheets                  | Appends income data to Google Sheets          | Send Income Summary           |                              |                              |
| Send Error                 | Telegram                       | Sends error message for invalid input          | price greater than 0?          |                              |                              |
| Download VN                | HTTP Request                  | Downloads additional data for AI processing    | 📥 Get Parsed Markdown Result | OpenAI                       |                              |
| OpenAI                    | LangChain OpenAI               | AI processing/refinement of parsed data        | Download VN                   | Merge                        |                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Type: Telegram Trigger  
   - Configure with Telegram Bot credentials and webhook URL  
   - Set to listen for all message updates  

2. **Add "Check Start" If Node**  
   - Condition: message text equals "/start" or equivalent  
   - Connect Telegram Trigger output to this node  

3. **Add "Welcome Menu" Telegram Node**  
   - Configure to send welcome text/menu to user  
   - Connect "Check Start" true branch to this node  

4. **Add "Check Income" If Node**  
   - Condition: message matches income keywords (e.g., "income", "salary")  
   - Connect Telegram Trigger to this node  

5. **Add "Save Income to Redis" Node**  
   - Configure Redis credentials  
   - Store income transaction under user/session key  
   - Connect "Check Income" true branch here  

6. **Add "Request Pemasukan" Telegram Node**  
   - Sends prompt for income details  
   - Connect "Save Income to Redis" output here  

7. **Add "Check Expenses" If Node**  
   - Condition: message matches expense keywords (e.g., "expense", "bill")  
   - Connect Telegram Trigger to this node  

8. **Add "Save Expenses to Redis" Node**  
   - Similar Redis setup as income  
   - Connect "Check Expenses" true branch here  

9. **Add "Request expense" Telegram Node**  
   - Sends prompt for expense details  
   - Connect "Save Expenses to Redis" output here  

10. **Add "Check Input" If Node**  
    - Checks if message requires transaction processing  
    - Connect Telegram Trigger to this node  

11. **Add "Get Transaction Type" Redis Node**  
    - Retrieve transaction type stored previously  
    - Connect "Check Input" true branch here  

12. **Add "Extract Transaction Type" Set Node**  
    - Extract and format transaction type for routing  
    - Connect "Get Transaction Type" output here  

13. **Add "Content Type Router" Switch Node**  
    - Configure cases for image, PDF, text inputs  
    - Connect "Extract Transaction Type" output here  

14. **Add "Download Image" Telegram Node**  
    - Downloads image files from Telegram messages  
    - Connect to Content Type Router case "image"  

15. **Add "Convert to Base64" Code Node**  
    - Convert downloaded image binary to base64 string  
    - Connect from "Download Image"  

16. **Add "Google Vision OCR" HTTP Request Node**  
    - Configure with Google Vision API credentials  
    - Send base64 image for OCR  
    - Connect from "Convert to Base64"  

17. **Add "Check OCR Result" Code Node**  
    - Validate OCR response contains text  
    - Connect from "Google Vision OCR"  

18. **Add "Extract OCR Text" Set Node**  
    - Extract and format OCR text  
    - Connect from "Check OCR Result"  

19. **Add "📥 Download PDF from Telegram" Telegram Node**  
    - Download PDF files sent by users  
    - Connect to Content Type Router case "PDF"  

20. **Add "☁️ Upload PDF to LlamaIndex" HTTP Request Node**  
    - Upload PDF for parsing  
    - Connect from "📥 Download PDF from Telegram"  

21. **Add "⏳ Check Parsing Status" HTTP Request Node**  
    - Poll LlamaIndex for parsing status  
    - Connect from "☁️ Upload PDF to LlamaIndex"  

22. **Add "🔁 Condition: Was Parsing Successful?" If Node**  
    - Check if parsing is complete  
    - Connect from "⏳ Check Parsing Status"  

23. **Add "⏱ Delay Before Recheck" Wait Node**  
    - Delay before polling again  
    - Connect from "🔁 Condition" false branch back to "⏳ Check Parsing Status"  

24. **Add "📥 Get Parsed Markdown Result" HTTP Request Node**  
    - Get final parsed text  
    - Connect from "🔁 Condition" true branch  

25. **Add "Download VN" HTTP Request Node**  
    - Download supplementary data for AI processing  
    - Connect from "📥 Get Parsed Markdown Result"  

26. **Add "OpenAI" LangChain Node**  
    - Configure with OpenAI credentials  
    - Connect from "Download VN"  

27. **Add "Merge" Node**  
    - Merge data streams from OCR and AI processing  
    - Connect "Extract OCR Text" and "📥 Get Parsed Markdown Result" to this node  
    - Connect "OpenAI" output to this node  

28. **Add "Input Accept" Telegram Node**  
    - Send confirmation message to user  
    - Connect from "Merge"  

29. **Add "AI Categorizer" LangChain Chain LLM Node**  
    - Configure with retry on fail enabled  
    - Connect from "Input Accept"  

30. **Add "OpenRouter Chat Model" LangChain LM Chat Node**  
    - Attach as AI language model provider to "AI Categorizer"  

31. **Add "Structured Output Parser" LangChain Output Parser Node**  
    - Attach as output parser to "AI Categorizer"  

32. **Add "Extract AI Result" Telegram Node**  
    - Receives AI categorization results  
    - Connect from "AI Categorizer"  

33. **Add "Transform to Sheets Format" Code Node**  
    - Formats AI result for Google Sheets insertion  
    - Connect from "Extract AI Result"  

34. **Add "Delay" Wait Node**  
    - Adds pause before validation  
    - Connect from "Transform to Sheets Format"  

35. **Add "check price" Set Node**  
    - Extracts price field for validation  
    - Connect from "Delay"  

36. **Add "price greater than 0?" If Node**  
    - Checks price positive  
    - Connect from "check price"  

37. **Add "Expenses?" If Node**  
    - Checks if transaction is expense or income  
    - Connect from "price greater than 0?" true branch  

38. **Add "Send Error" Telegram Node**  
    - Sends error message if price invalid  
    - Connect from "price greater than 0?" false branch  

39. **Add "Send Expense Summary" Telegram Node**  
    - Sends summary message for expenses  
    - Connect from "Expenses?" true branch  

40. **Add "Send Income Summary" Telegram Node**  
    - Sends summary message for income  
    - Connect from "Expenses?" false branch  

41. **Add "Append Expenses" Google Sheets Node**  
    - Appends expense transaction to sheet  
    - Connect from "Send Expense Summary"  

42. **Add "Append Income" Google Sheets Node**  
    - Appends income transaction to sheet  
    - Connect from "Send Income Summary"  

---

### 5. General Notes & Resources

| Note Content                                                                                  | Context or Link                                                                                 |
|-----------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| The workflow integrates Google Vision OCR for text extraction from images.                    | Google Vision API documentation: https://cloud.google.com/vision/docs/ocr                      |
| Uses LlamaIndex API to parse PDFs asynchronously with polling and retry logic.                 | LlamaIndex docs: https://llamaindex.ai/docs                                                     |
| AI categorization leverages LangChain integration with OpenAI and OpenRouter Chat API.        | LangChain n8n nodes: https://n8n.io/integrations/n8n-nodes-langchain                           |
| Redis is used for temporary session storage of transaction types and states.                  | Redis official: https://redis.io/                                                               |
| Google Sheets nodes use OAuth2 credentials for appending financial data in separate sheets.   | Google Sheets API: https://developers.google.com/sheets/api                                    |
| Telegram nodes require Telegram Bot API token and webhook setup for message handling.          | Telegram Bot API: https://core.telegram.org/bots/api                                           |

---

**Disclaimer:** The provided content is exclusively derived from an automated n8n workflow. It strictly adheres to content policies and contains no illegal or protected data. All data processed is legal and public.