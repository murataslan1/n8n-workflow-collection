Automate Restaurant Orders with AI Dish Recommendations using Gemini and Telegram

https://n8nworkflows.xyz/workflows/automate-restaurant-orders-with-ai-dish-recommendations-using-gemini-and-telegram-6001


# Automate Restaurant Orders with AI Dish Recommendations using Gemini and Telegram

### 1. Workflow Overview

This workflow automates restaurant order processing with integrated AI-powered dish recommendations and customer engagement via Telegram. It is designed for restaurants to streamline order intake, store customer and dish data, and enhance customer experience by suggesting related dishes based on their current order using Google’s Gemini AI. The workflow orchestrates input reception, data extraction and formatting, data storage, AI processing of orders for recommendations, and direct messaging of suggestions to customers through Telegram.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Captures customer orders via an online form.
- **1.2 Data Extraction & Formatting:** Parses and structures the order data, generates customer IDs, and separates dish details.
- **1.3 Data Storage:** Saves customer and dish information into corresponding Google Sheets spreadsheets.
- **1.4 AI Processing:** Prepares aggregated dish data for the AI, sends it to Google Gemini AI for dish suggestion generation.
- **1.5 Suggestion Formatting & Delivery:** Parses AI output, formats it for Telegram, and sends personalized dish recommendations to the customer.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block initiates the workflow when a customer submits their order through a web form, capturing name, phone number, and dish quantities.

- **Nodes Involved:**  
  - New Order Trigger (Form)  
  - Sticky Note (comment on trigger)

- **Node Details:**  

  1. **New Order Trigger (Form)**  
     - Type: Form Trigger  
     - Role: Listens for new form submissions to start the workflow.  
     - Configuration:  
       - Form titled "Oneclick Restaurant Order - Table number 1".  
       - Fields: Customer name (required text), phone number (number), and quantities for 10 dishes with labeled prices.  
       - Form description instructs customers to enter dish quantities to place orders.  
     - Inputs: External HTTP form submission.  
     - Outputs: JSON object with all form field values.  
     - Edge Cases: Missing required name field; quantity fields empty or zero (valid but filtered later).  
     - Sticky Note Content: "Triggered when a customer submits their dish order form."

---

#### 2.2 Data Extraction & Formatting

- **Overview:**  
  Parses raw form input, generates a unique customer ID, filters dish entries with quantities greater than zero, and structures customer and order details into JSON.

- **Nodes Involved:**  
  - Extract & Format Order Data (Code)  
  - Sticky Note (formats incoming form fields)

- **Node Details:**  

  1. **Extract & Format Order Data**  
     - Type: Code node (JavaScript)  
     - Role: Processes raw form data into structured format with customer info and dish details.  
     - Configuration:  
       - Extracts customer name and phone number.  
       - Generates a random 6-character alphanumeric customer ID prefixed with "CUST-".  
       - Iterates over form fields to identify dish names and prices using regex on field labels.  
       - Filters dishes with quantity >= 1.  
       - Outputs JSON with `customerId`, `name`, `mobile`, and `dishes` array (each dish with name, quantity, unit price, total price).  
     - Input: Raw form submission JSON.  
     - Output: Structured order JSON for downstream nodes.  
     - Edge Cases: Non-numeric or missing quantity values are filtered out; failure if regex does not match expected dish label format.  
     - Sticky Note Content: "Formats incoming form fields for further processing."

---

#### 2.3 Data Storage

- **Overview:**  
  Stores customer info and detailed dish order data into separate Google Sheets for tracking and analytics.

- **Nodes Involved:**  
  - Save Customer Info (Google Sheets)  
  - Save Dish Info (Code)  
  - Prepare Dish Details for AI (Google Sheets)  
  - Sticky Notes (for customer info and dish info storage)

- **Node Details:**  

  1. **Save Customer Info**  
     - Type: Google Sheets node  
     - Role: Appends customer ID, name, and mobile number to the "customer details" sheet.  
     - Configuration:  
       - Uses service account authentication.  
       - Document ID and sheet ID target the "customer details" sheet.  
       - Maps fields: Customer id, Customer name, costomer mobile number (note typo in column name).  
     - Input: Output of Extract & Format Order Data.  
     - Output: Passes data to Save Dish Info node.  
     - Edge Cases: Google Sheets API errors, authentication failure, sheet access issues.  
     - Sticky Note Content: "Adds customer details to the Google Sheet."

  2. **Save Dish Info**  
     - Type: Code node  
     - Role: Extracts dish array from previous node for individual processing.  
     - Configuration:  
       - Reads dishes from Extract & Format Order Data node's JSON.  
       - Returns each dish as a separate item.  
     - Input: Output from Save Customer Info.  
     - Output: Passes to Prepare Dish Details for AI.  
     - Edge Cases: Missing or malformed dish data.  
     - Sticky Note Content: "Stores ordered dish quantities and types to a separate sheet."

  3. **Prepare Dish Details for AI**  
     - Type: Google Sheets node  
     - Role: Appends detailed dish data with customer ID to "customer order details" sheet.  
     - Configuration:  
       - Service account authentication.  
       - Document and Sheet IDs target correct spreadsheet tab.  
       - Maps columns: dish name, Customer id, actual price, dish quantity, per unit price.  
     - Input: Output of Save Dish Info.  
     - Output: Passes to Clean Data for AI Input.  
     - Edge Cases: Google Sheets errors, field mapping issues.  
     - Sticky Note Content: "Gathers final dish data to send to the AI agent."

---

#### 2.4 AI Processing

- **Overview:**  
  Aggregates all dish data rows into a single JSON object, sends it to the Gemini AI model to generate personalized dish suggestions, and receives structured JSON output.

- **Nodes Involved:**  
  - Clean Data for AI Input (Code)  
  - Gemini AI Dish Suggestion Agent (Langchain Agent with Gemini model)  
  - Chat Model (Gemini AI language model node, linked internally to AI Agent)  
  - Think Tool (Langchain tool referenced by AI Agent)  
  - Sticky Note (AI recommendation use)

- **Node Details:**  

  1. **Clean Data for AI Input**  
     - Type: Code node  
     - Role: Bundles all dish rows into a single JSON payload under `data.rows` to improve AI input clarity.  
     - Configuration:  
       - Collects all input items into an array of JSON rows.  
       - Returns one JSON item with combined dataset.  
     - Input: Output of Prepare Dish Details for AI.  
     - Output: Passed to Gemini AI Dish Suggestion Agent.  
     - Edge Cases: Empty input array, malformed data rows.  
     - Sticky Note Content: "Reformats the data to improve AI understanding."

  2. **Gemini AI Dish Suggestion Agent**  
     - Type: Langchain Agent node with integrated Gemini AI model  
     - Role: Analyzes customer order and recommends 3-5 dishes with reasons in strict JSON format.  
     - Configuration:  
       - System message guides AI to analyze cuisine types, flavors, and quantities.  
       - Input text set dynamically from cleaned data JSON.  
       - Model: Gemini 2.5 Pro.  
       - Uses Chat Model and Think Tool nodes internally for language model and tool chaining.  
     - Input: JSON dataset from Clean Data for AI Input.  
     - Output: AI-generated JSON with `suggestions` array.  
     - Edge Cases: AI latency, malformed AI output, authentication failure with Gemini API.  
     - Sticky Note Content: "Uses Gemini AI to recommend related dishes or offers."

---

#### 2.5 Suggestion Formatting & Delivery

- **Overview:**  
  Parses the AI’s JSON output, sanitizes it for Telegram message formatting, and sends personalized dish suggestions to the customer via Telegram.

- **Nodes Involved:**  
  - Format AI Suggestions for Telegram (Code)  
  - Send Suggestions via Telegram  
  - Sticky Notes (Telegram formatting and sending)

- **Node Details:**  

  1. **Format AI Suggestions for Telegram**  
     - Type: Code node  
     - Role: Extracts AI output, removes markdown code fences, parses JSON, and splits suggestions into individual items for messaging.  
     - Configuration:  
       - Uses regex to strip ```json fences if present.  
       - Safely parses JSON to handle errors gracefully.  
       - Maps each suggestion to a separate JSON item with dishName and reason.  
     - Input: Gemini AI Dish Suggestion Agent output.  
     - Output: Array of suggestions ready for Telegram.  
     - Edge Cases: Parsing errors if AI output is malformed; missing `suggestions` key.  
     - Sticky Note Content: "Converts Gemini output into Telegram-friendly message format."

  2. **Send Suggestions via Telegram**  
     - Type: Telegram node  
     - Role: Sends each AI recommendation as a message to the customer’s Telegram chat.  
     - Configuration:  
       - Dynamic message text combining dish name and reason.  
       - Chat ID statically set as "newchatid" (likely placeholder; should be dynamic for real usage).  
       - Uses Telegram API OAuth credentials.  
     - Input: Formatted suggestions array.  
     - Output: Telegram message delivery status.  
     - Edge Cases: Invalid chat ID, Telegram API failures, rate limits.  
     - Sticky Note Content: "Sends dish suggestions directly to the customer."

---

### 3. Summary Table

| Node Name                     | Node Type                    | Functional Role                           | Input Node(s)                   | Output Node(s)                  | Sticky Note                                                                                              |
|-------------------------------|------------------------------|------------------------------------------|--------------------------------|---------------------------------|---------------------------------------------------------------------------------------------------------|
| New Order Trigger (Form)       | Form Trigger                 | Starts workflow on customer form submit  | -                              | Extract & Format Order Data      | Triggered when a customer submits their dish order form.                                                |
| Extract & Format Order Data    | Code                        | Parses form data, generates customer ID  | New Order Trigger (Form)        | Save Customer Info              | Formats incoming form fields for further processing.                                                    |
| Save Customer Info             | Google Sheets               | Saves customer info to Google Sheet      | Extract & Format Order Data     | Save Dish Info                  | Adds customer details to the Google Sheet.                                                             |
| Save Dish Info                | Code                        | Extracts dishes array for storage         | Save Customer Info              | Prepare Dish Details for AI     | Stores ordered dish quantities and types to a separate sheet.                                          |
| Prepare Dish Details for AI    | Google Sheets               | Saves detailed dish data for AI input    | Save Dish Info                 | Clean Data for AI Input         | Gathers final dish data to send to the AI agent.                                                       |
| Clean Data for AI Input        | Code                        | Bundles dish rows into single JSON object| Prepare Dish Details for AI     | Gemini AI Dish Suggestion Agent | Reformats the data to improve AI understanding.                                                        |
| Gemini AI Dish Suggestion Agent| Langchain Agent (Gemini AI) | Generates dish recommendations from AI  | Clean Data for AI Input         | Format AI Suggestions for Telegram | Uses Gemini AI to recommend related dishes or offers.                                                   |
| Format AI Suggestions for Telegram | Code                  | Parses AI output, prepares Telegram messages | Gemini AI Dish Suggestion Agent | Send Suggestions via Telegram   | Converts Gemini output into Telegram-friendly message format.                                           |
| Send Suggestions via Telegram  | Telegram                    | Sends AI dish suggestions to customer    | Format AI Suggestions for Telegram | -                             | Sends dish suggestions directly to the customer.                                                       |
| Chat Model                    | Langchain LM Chat (Gemini)  | Language model node for AI agent          | -                              | Gemini AI Dish Suggestion Agent |                                                                                                         |
| Think Tool                   | Langchain Tool              | Tool for AI agent reasoning                | -                              | Gemini AI Dish Suggestion Agent |                                                                                                         |
| Sticky Note                  | Sticky Note                 | Comment: Form trigger                     | -                              | -                              | Triggered when a customer submits their dish order form.                                                |
| Sticky Note1                 | Sticky Note                 | Comment: Customer info storage            | -                              | -                              | Adds customer details to the Google Sheet.                                                             |
| Sticky Note2                 | Sticky Note                 | Comment: Dish info storage                 | -                              | -                              | Gathers final dish data to send to the AI agent.                                                       |
| Sticky Note3                 | Sticky Note                 | Comment: Data reformatting for AI         | -                              | -                              | Reformats the data to improve AI understanding.                                                        |
| Sticky Note4                 | Sticky Note                 | Comment: Format Gemini output for Telegram| -                              | -                              | Converts Gemini output into Telegram-friendly message format.                                           |
| Sticky Note5                 | Sticky Note                 | Comment: Send suggestions to customer     | -                              | -                              | Sends dish suggestions directly to the customer.                                                       |
| Sticky Note6                 | Sticky Note                 | Comment: Store ordered dish details       | -                              | -                              | Stores ordered dish quantities and types to a separate sheet.                                          |
| Sticky Note7                 | Sticky Note                 | Comment: AI dish recommendation           | -                              | -                              | Uses Gemini AI to recommend related dishes or offers.                                                  |
| Sticky Note8                 | Sticky Note                 | Comment: Format form fields                | -                              | -                              | Formats incoming form fields for further processing.                                                    |
| Sticky Note9                 | Sticky Note                 | Summary comment on workflow purpose       | -                              | -                              | This workflow helps automate restaurant order processing and customer engagement by: [details in note] |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Form Trigger Node**  
   - Type: Form Trigger  
   - Title: "Oneclick Restaurant Order - Table number 1"  
   - Fields:  
     - Name (text, required)  
     - Phone number (number)  
     - Dish quantity inputs (number) for: Tandoori Chicken (250), Biryani (200), Masala Dosa (150), Idli vada (100), Dal Tadka (150), Steam Rice (100), Paratha (30), Paneer butter masal (250), Fix Thali (150)  
   - Description: "Please add your dish quantity and submit to place your order"  

2. **Add Code Node "Extract & Format Order Data"**  
   - Paste the JavaScript code that:  
     - Extracts name and phone number.  
     - Generates a 6-character alphanumeric customer ID prefixed with "CUST-".  
     - Parses dish quantities and prices using regex on field labels.  
     - Filters out dishes with quantity <1.  
     - Returns structured JSON with customerId, name, mobile, dishes array.  
   - Connect output of Form Trigger to this node.

3. **Add Google Sheets Node "Save Customer Info"**  
   - Operation: Append  
   - Document ID: Your Google Sheet document for customer orders.  
   - Sheet Name: "customer details" (gid=0)  
   - Columns mapped: Customer id, Customer name, costomer mobile number (ensure correct spelling in your sheet).  
   - Authentication: Use Google API Service Account credentials.  
   - Connect output of "Extract & Format Order Data" to this node.

4. **Add Code Node "Save Dish Info"**  
   - JavaScript: Extract `dishes` array from the previous node's JSON and return each dish as a separate item for iteration.  
   - Connect output of "Save Customer Info" to this node.

5. **Add Google Sheets Node "Prepare Dish Details for AI"**  
   - Operation: Append  
   - Document ID: Same Google Sheet as above.  
   - Sheet Name: "customer order details" (use correct gid)  
   - Columns mapped: dish name, Customer id, actual price (totalPrice), dish quantity, per unit price  
   - Authentication: Use same Google API credentials.  
   - Connect output of "Save Dish Info" to this node.

6. **Add Code Node "Clean Data for AI Input"**  
   - JavaScript: Bundles all incoming dish rows into a single JSON object under `data.rows`.  
   - Connect output of "Prepare Dish Details for AI" to this node.

7. **Add Langchain Agent Node "Gemini AI Dish Suggestion Agent"**  
   - Model: Gemini 2.5 Pro  
   - Input text: Bind to `{{$json.data}}` from previous node.  
   - System message: Provide detailed instructions to analyze dishes and output JSON with 3–5 suggestions, each with dishName and reason.  
   - Connect output of "Clean Data for AI Input" to this node.

8. **Add Code Node "Format AI Suggestions for Telegram"**  
   - JavaScript:  
     - Extract AI output string.  
     - Remove markdown code fences with regex.  
     - Parse JSON safely.  
     - Map suggestions array to individual items with dishName and reason.  
   - Connect output of Gemini AI node to this node.

9. **Add Telegram Node "Send Suggestions via Telegram"**  
   - Chat ID: Set dynamically if possible; placeholder "newchatid" otherwise.  
   - Message text: `{{$json.dishName}}\n\n{{$json.reason}}`  
   - Credentials: Use Telegram API OAuth2 credentials.  
   - Connect output of formatting node to this node.

10. **(Optional) Add Langchain Chat Model and Think Tool Nodes**  
    - Chat Model: Configure with Gemini API credentials and model "models/gemini-2.5-pro".  
    - Think Tool: Link as tool for AI agent.  
    - Connect these internally to the Gemini AI Dish Suggestion Agent as per Langchain agent requirements.

11. **Add Sticky Notes**  
    - Add descriptive sticky notes for each logical block to improve clarity and documentation.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                              | Context or Link                                                                                              |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| This workflow helps automate restaurant order processing and customer engagement by: saving time, personalizing experience with AI dish suggestions, centralizing data in Google Sheets, instant outreach via Telegram, and scalability for growing restaurants.            | Sticky Note summary in workflow near top left corner                                                        |
| Google Sheets credential uses service account authentication; ensure the service account has write access to the target spreadsheets.                                                                                                                                     | Credential setup note                                                                                         |
| Telegram node requires valid chat ID; for production use, chat ID should be dynamically derived from user data or Telegram webhook context to send messages to the correct customer chat.                                                                                   | Telegram integration best practice                                                                            |
| Gemini AI model "models/gemini-2.5-pro" requires API access and proper credentials configured in n8n Langchain nodes.                                                                                                                                                      | Gemini AI/PaLM API documentation                                                                              |
| Customer ID generation is randomized and could produce collisions in rare cases; consider a more robust system if needed (e.g., database UUIDs).                                                                                                                            | Code node comment                                                                                            |
| The AI prompt enforces strict JSON output format; parsing errors may occur if AI deviates – handle exceptions accordingly.                                                                                                                                                  | AI output formatting node error handling                                                                      |

---

_Disclaimer: The provided content is exclusively derived from an automated n8n workflow. It complies strictly with all current content policies and contains no illegal, offensive, or protected material. All data processed is legal and publicly accessible._