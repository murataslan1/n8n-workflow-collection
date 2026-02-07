Automate Invoice Processing & Stock Management with AI, Gmail, Sheets & Slack

https://n8nworkflows.xyz/workflows/automate-invoice-processing---stock-management-with-ai--gmail--sheets---slack-11678


# Automate Invoice Processing & Stock Management with AI, Gmail, Sheets & Slack

### 1. Workflow Overview

This workflow automates the processing of invoice emails to manage stock and procurement efficiently. It listens to Gmail for incoming invoice PDFs, extracts structured order data using AI, logs the sales order in Google Sheets, checks inventory levels, and based on stock availability either creates a work order and notifies the team via Slack or generates a purchase requisition and sends an email to procurement.

**Logical blocks:**

- **1.1 Input Reception:** Monitoring Gmail inbox for new invoice emails with PDF attachments.
- **1.2 Invoice Data Extraction:** Extracting text data from PDF attachments and parsing it into structured order information using AI.
- **1.3 Sales Order Logging:** Appending the extracted order details into a Google Sheets sales order log.
- **1.4 Inventory Check:** Querying current stock levels from the inventory sheet.
- **1.5 Conditional Procurement Logic:**
  - If stock is sufficient, create a work order in Google Sheets and send a Slack notification.
  - If stock is out, create a purchase requisition record and email the procurement team.
- **1.6 Notifications and Communication:** Sending emails for purchase requisitions and Slack messages for work order summaries.
- **1.7 Documentation and Configuration Notes:** Sticky notes providing setup instructions and workflow explanations.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
Monitors Gmail for incoming emails from a specified sender with invoice PDFs attached and downloads the attachments for processing.

**Nodes Involved:**  
- Gmail Trigger

**Node Details:**  
- **Gmail Trigger**  
  - Type: Trigger node for Gmail  
  - Configuration: Filters emails from `example@gmail.com`, polls every minute, downloads attachments.  
  - Inputs: None (trigger)  
  - Outputs: Email data including attachment binaries  
  - Edge cases: Gmail authentication failures, attachment download issues, no new emails found.  
  - Version: 1.3

---

#### 2.2 Invoice Data Extraction

**Overview:**  
Extracts text from PDF attachments and uses an AI language model to parse the invoice content into structured order data.

**Nodes Involved:**  
- Extract from File  
- OpenAI Chat Model  
- Structured Output Parser  
- Extract Invoice Record

**Node Details:**  
- **Extract from File**  
  - Type: File extraction node  
  - Configuration: Extracts text from the PDF binary property `attachment_0`.  
  - Inputs: Email attachment binary from Gmail Trigger  
  - Outputs: Extracted raw text of PDF  
  - Edge cases: Corrupt or scanned PDFs that hinder text extraction.  
  - Version: 1

- **OpenAI Chat Model**  
  - Type: Language model node (OpenAI GPT-4o)  
  - Configuration: Uses GPT-4o for natural language understanding.  
  - Inputs: Text extracted from PDF passed as prompt  
  - Outputs: AI-generated response to parse order details  
  - Credentials: Requires OpenAI API key  
  - Edge cases: API rate limits, timeouts, or malformed prompts.  
  - Version: 1.2

- **Structured Output Parser**  
  - Type: Langchain output parser  
  - Configuration: Parses AI output into JSON with schema fields: order_id, sku, customer_name, email, phone, item_name, quantity, price, total.  
  - Inputs: AI response from OpenAI Chat Model  
  - Outputs: Structured JSON object with order data  
  - Edge cases: Parsing errors if AI output does not match schema.  
  - Version: 1.3

- **Extract Invoice Record**  
  - Type: Langchain agent node  
  - Configuration: Accepts extracted text and uses AI plus the output parser to generate structured invoice record.  
  - Inputs: Extracted text from PDF  
  - Outputs: Parsed order data JSON  
  - Edge cases: AI understanding failures, missing data fields  
  - Version: 2.2

---

#### 2.3 Sales Order Logging

**Overview:**  
Appends the structured order data into the "Customer order" sheet in a Google Sheets document.

**Nodes Involved:**  
- Sales Order Creation

**Node Details:**  
- **Sales Order Creation**  
  - Type: Google Sheets Append operation  
  - Configuration: Maps parsed JSON fields (SKU, email, phone, price, total, order_id, quantity, item_name, customer_name) into corresponding columns in the "Customer order" sheet.  
  - Inputs: Parsed order data from Extract Invoice Record  
  - Outputs: Confirmation of appended row  
  - Credentials: Google Sheets OAuth2  
  - Edge cases: Spreadsheet permission issues, schema mismatches, network errors  
  - Version: 4.7

---

#### 2.4 Inventory Check

**Overview:**  
Checks the current stock for the ordered item by querying the "Product inventory" sheet.

**Nodes Involved:**  
- Stock & Shortage Check

**Node Details:**  
- **Stock & Shortage Check**  
  - Type: Google Sheets Lookup  
  - Configuration: Filters rows where "Item Name" matches the ordered item name, retrieves current stock level.  
  - Inputs: Item name from Sales Order Creation  
  - Outputs: Inventory data for the item  
  - Credentials: Google Sheets OAuth2  
  - Edge cases: Item not found, multiple matches, permission errors  
  - Version: 4.7

---

#### 2.5 Conditional Procurement Logic

**Overview:**  
Evaluates stock levels to determine whether to create a purchase requisition or a work order.

**Nodes Involved:**  
- If Negative  
- Create Purchase Requisition  
- Create Work Order

**Node Details:**  
- **If Negative**  
  - Type: Conditional node  
  - Configuration: Checks if the "Stock " field equals "out of Stock" (string comparison) to branch the workflow.  
  - Inputs: Inventory data from Stock & Shortage Check  
  - Outputs:  
    - True branch: Create Purchase Requisition  
    - False branch: Create Work Order  
  - Edge cases: Stock field missing or incorrectly formatted  
  - Version: 2.2

- **Create Purchase Requisition**  
  - Type: Google Sheets Append  
  - Configuration: Adds a new row to "Purchase Requisition" sheet with fields: Priority (High), item name, current date, SKU, current quantity, quantity requested. Uses current date in `yyyy-MM-dd` format.  
  - Inputs: Order and stock data (from Sales Order Creation and Stock & Shortage Check)  
  - Outputs: Confirmation of append  
  - Credentials: Google Sheets OAuth2  
  - Edge cases: Date formatting errors, sheet access issues  
  - Version: 4.7

- **Create Work Order**  
  - Type: Google Sheets Append  
  - Configuration: Adds a new row to "Work Order Create" sheet with SKU, order id, item name, customer name, planned due date (3 days from current date), quantity to produce.  
  - Inputs: Order data from Sales Order Creation  
  - Outputs: Confirmation of append  
  - Credentials: Google Sheets OAuth2  
  - Edge cases: Date calculation errors, permission problems  
  - Version: 4.7

---

#### 2.6 Notifications and Communication

**Overview:**  
Sends purchase requisition emails and work order summaries to appropriate channels.

**Nodes Involved:**  
- Send a message (Email)  
- Send Order Summary (Slack)

**Node Details:**  
- **Send a message**  
  - Type: Gmail send node  
  - Configuration: Sends a styled HTML email to procurement with purchase requisition details dynamically inserted from Google Sheets data. Subject includes item name and SKU.  
  - Inputs: Rows appended by Create Purchase Requisition  
  - Outputs: Email sent confirmation  
  - Credentials: Gmail OAuth2  
  - Edge cases: SMTP errors, invalid email addresses, template expression failures  
  - Version: 2.1

- **Send Order Summary**  
  - Type: Slack message node  
  - Configuration: Sends a formatted message to a Slack channel summarizing the work order details including order id, SKU, item name, customer, quantity, and due date.  
  - Inputs: Rows appended by Create Work Order  
  - Outputs: Confirmation of message sent  
  - Credentials: Slack webhook with access token  
  - Edge cases: Slack API errors, invalid channel ID  
  - Version: 2.3

---

#### 2.7 Documentation and Configuration Notes

**Overview:**  
Sticky notes provide workflow explanation, setup instructions, and operational overview for maintainers.

**Nodes Involved:**  
- Sticky Note  
- Sticky Note1  
- Sticky Note2

**Node Details:**  
- **Sticky Note**  
  - Content:  
    - Overview of workflow automation flow  
    - Setup instructions for Gmail, OpenAI, Google Sheets, Slack credentials  
    - Sample spreadsheet link: https://docs.google.com/spreadsheets/d/1X_iuREMFdiefIF_ukCwTBUMXGURwR1mC-RMl1hztssw  
  - Position: Near start nodes for visibility

- **Sticky Note1**  
  - Content: Explains invoice processing with AI extraction of order data from PDFs.

- **Sticky Note2**  
  - Content: Describes stock availability checking logic and subsequent decision paths (work order vs purchase requisition).

---

### 3. Summary Table

| Node Name               | Node Type                           | Functional Role                         | Input Node(s)             | Output Node(s)                   | Sticky Note                                                                                          |
|-------------------------|-----------------------------------|---------------------------------------|---------------------------|---------------------------------|----------------------------------------------------------------------------------------------------|
| Gmail Trigger           | Gmail Trigger                     | Detect new invoice emails              | -                         | Extract from File                | See Sticky Note: Setup instructions for Gmail and overview of workflow                              |
| Extract from File       | Extract from File                 | Extract text from PDF attachment       | Gmail Trigger             | Extract Invoice Record           | See Sticky Note1: Invoice Processing explanation                                                   |
| OpenAI Chat Model       | Langchain LM Chat OpenAI          | Parse extracted text with AI           | Extract Invoice Record (ai_languageModel) | Extract Invoice Record (ai_languageModel) | Setup instructions require OpenAI API key                                                          |
| Structured Output Parser| Langchain Output Parser            | Structure AI output as JSON             | OpenAI Chat Model (ai_outputParser) | Extract Invoice Record (ai_outputParser) |                                                                                                |
| Extract Invoice Record  | Langchain Agent                   | Combine AI and parser to output order data | Extract from File         | Sales Order Creation             |                                                                                                |
| Sales Order Creation    | Google Sheets Append              | Log order data in sales order sheet    | Extract Invoice Record    | Stock & Shortage Check           | See Sticky Note: Sample Google Sheet provided                                                      |
| Stock & Shortage Check  | Google Sheets Lookup              | Retrieve current stock for item         | Sales Order Creation      | If Negative                     | See Sticky Note2: Explains stock check and conditional logic                                       |
| If Negative             | If Node                          | Branch based on stock availability      | Stock & Shortage Check    | Create Purchase Requisition, Create Work Order |                                                                                                |
| Create Purchase Requisition | Google Sheets Append           | Log purchase requisition if stock low  | If Negative (true)        | Send a message                  |                                                                                                |
| Send a message          | Gmail Send                       | Email purchase requisition details      | Create Purchase Requisition | -                              | See Sticky Note: Email template with dynamic content                                              |
| Create Work Order       | Google Sheets Append              | Log work order if stock sufficient      | If Negative (false)       | Send Order Summary              |                                                                                                |
| Send Order Summary      | Slack Message                    | Notify team with work order summary     | Create Work Order         | -                              |                                                                                                |
| Sticky Note             | Sticky Note                     | Workflow overview and setup instructions | -                         | -                              | Workflow overview, setup steps, sample sheet link provided                                        |
| Sticky Note1            | Sticky Note                     | Invoice extraction explanation          | -                         | -                              | Invoice Processing block explanation                                                             |
| Sticky Note2            | Sticky Note                     | Stock check and conditional logic explanation | -                         | -                              | Stock availability and procurement decision logic explanation                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger Node**  
   - Type: Gmail Trigger  
   - Configure: Filter emails from `example@gmail.com`, enable attachment downloads, poll every minute.  
   - Set Gmail OAuth2 credentials.

2. **Create Extract from File Node**  
   - Type: Extract from File  
   - Operation: Extract PDF text from binary property `attachment_0`  
   - Connect input from Gmail Trigger.

3. **Create OpenAI Chat Model Node**  
   - Type: Langchain LM Chat OpenAI  
   - Model: Select GPT-4o  
   - Credentials: Add OpenAI API key credentials.  
   - Input: Extracted PDF text.  
   - Connect output to Extract Invoice Record node (ai_languageModel input).

4. **Create Structured Output Parser Node**  
   - Type: Langchain Output Parser Structured  
   - Define JSON schema with fields: order_id, sku, customer_name, email, phone, item_name, quantity, price, total.  
   - Connect input from OpenAI Chat Model (ai_outputParser output).

5. **Create Extract Invoice Record Node**  
   - Type: Langchain Agent  
   - Parameters: Set text input from `{{$json.text}}`.  
   - Enable output parser.  
   - Connect input from Extract from File.  
   - Connect OpenAI Chat Model and Structured Output Parser nodes to this node’s respective inputs.

6. **Create Sales Order Creation Node**  
   - Type: Google Sheets Append  
   - Spreadsheet: Use your Google Sheet document ID.  
   - Sheet: "Customer order"  
   - Map columns to parsed order data fields (SKU, Email, Phone, Price, Total, Order id, Quantity, Item Name, Customer Name).  
   - Connect input from Extract Invoice Record.  
   - Set Google Sheets OAuth2 credentials.

7. **Create Stock & Shortage Check Node**  
   - Type: Google Sheets Lookup  
   - Spreadsheet: Same Google Sheet document ID.  
   - Sheet: "Product inventory"  
   - Filter rows where "Item Name" equals `{{$json['Item Name']}}` from sales order.  
   - Connect input from Sales Order Creation.

8. **Create If Negative Node**  
   - Type: If Node  
   - Condition: Check if field `Stock ` equals string "out of Stock".  
   - Connect input from Stock & Shortage Check.

9. **Create Create Purchase Requisition Node**  
   - Type: Google Sheets Append  
   - Spreadsheet: Same document ID  
   - Sheet: "Purchase Requisition"  
   - Columns: Priority="High", item name from inventory check, Request Date = current date (`$now.format('yyyy-MM-dd')`), SKU from Sales Order Creation, Current Quantity from inventory, Quantity Requested from Sales Order Creation.  
   - Connect input from If Negative (true branch).

10. **Create Send a message Node (Email)**  
    - Type: Gmail Send  
    - Recipient: procurement email (`example@gmail.com`)  
    - Subject: Use dynamic expression including item name and SKU.  
    - Message: HTML formatted email body with dynamic content from purchase requisition data.  
    - Connect input from Create Purchase Requisition.  
    - Use Gmail OAuth2 credentials.

11. **Create Create Work Order Node**  
    - Type: Google Sheets Append  
    - Spreadsheet: Same document ID  
    - Sheet: "Work Order Create"  
    - Columns: SKU, order id, item name, Customer name from sales order, Planned Due Date = today + 3 days (formatted as ISO date), Quantity to Produce from sales order.  
    - Connect input from If Negative (false branch).

12. **Create Send Order Summary Node (Slack)**  
    - Type: Slack Message  
    - Configure Slack webhook with access token.  
    - Channel: Select Slack channel ID.  
    - Message: Formatted text with order summary details dynamically inserted.  
    - Connect input from Create Work Order.

13. **Add Sticky Note Nodes** (optional but recommended)  
    - Add notes for workflow overview, invoice processing explanation, and stock check logic for documentation and team reference.

---

### 5. General Notes & Resources

| Note Content                                                                                           | Context or Link                                                                                     |
|------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Sample Google Sheets file for workflow testing and setup                                             | https://docs.google.com/spreadsheets/d/1X_iuREMFdiefIF_ukCwTBUMXGURwR1mC-RMl1hztssw               |
| Workflow automates order procurement by monitoring Gmail for invoices and integrates AI for parsing  | Sticky Note summarizing high-level workflow logic                                                 |
| Setup instructions include connecting Gmail, OpenAI, Google Sheets, and Slack credentials            | Included in main Sticky Note node                                                                 |
| Email template for purchase requisition includes styled HTML with dynamic fields                      | Node: Send a message (Gmail)                                                                       |
| Slack message summarizes work order with key order details                                           | Node: Send Order Summary (Slack)                                                                   |

---

**Disclaimer:**  
The text provided is exclusively from an automated n8n workflow. The processing respects all current content policies and contains no illegal, offensive, or protected content. All data handled is legal and public.