Automate Purchase Order Form Submissions from Outlook Excel Attachments with AI

https://n8nworkflows.xyz/workflows/automate-purchase-order-form-submissions-from-outlook-excel-attachments-with-ai-3545


# Automate Purchase Order Form Submissions from Outlook Excel Attachments with AI

### 1. Workflow Overview

This workflow automates the processing of purchase order (PO) form submissions received via Outlook email attachments in XLSX format. It targets organizations that receive purchase orders as Excel files and want to reduce manual data entry by leveraging AI-powered document understanding.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Intent Classification:** Watches a shared Outlook inbox for incoming emails with attachments, filters for purchase order submissions using AI-based text classification.
- **1.2 File Format Validation:** Checks if the attachment is an XLSX file; rejects invalid formats.
- **1.3 XLSX to Markdown Conversion:** Extracts the XLSX file content and converts it into markdown table format for AI consumption.
- **1.4 AI Extraction of Purchase Order Details:** Uses an AI Information Extractor node to parse the markdown and extract structured PO data.
- **1.5 Data Correction and Validation:** Fixes Excel date formats, runs validation checks on extracted data (e.g., presence of PO number, date validity, line items, math correctness).
- **1.6 Conditional Responses:** Sends automated replies to the buyer based on validation results—either acceptance confirmation or rejection with error details.
- **1.7 Post-Processing Placeholder:** Placeholder node for further processing such as sending data to ERP or accounting systems.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Intent Classification

- **Overview:**  
  Watches a shared Outlook inbox for incoming emails with attachments and uses an AI text classifier to determine if the email is a purchase order submission.

- **Nodes Involved:**  
  - Outlook Trigger  
  - OpenAI Chat Model1 (Text Classifier)  
  - Is Submitting a Purchase Order? (Text Classifier)  
  - Do Nothing (NoOp)

- **Node Details:**

  - **Outlook Trigger**  
    - Type: Trigger node for Microsoft Outlook  
    - Configuration: Watches for emails with attachments in all folders; downloads attachments; polls every hour.  
    - Inputs: None (trigger)  
    - Outputs: Email metadata and attachments  
    - Edge Cases: Network or auth failures; no attachments; delayed polling  
    - Credentials: Microsoft Outlook OAuth2

  - **OpenAI Chat Model1**  
    - Type: AI language model (OpenAI GPT-4o-mini)  
    - Configuration: Used as a text classifier with fallback category "other"  
    - Input: Concatenated email sender, subject, and body content  
    - Output: Classification category (e.g., "is_purchase_order")  
    - Credentials: OpenAI API  
    - Edge Cases: API rate limits, unexpected input format

  - **Is Submitting a Purchase Order?**  
    - Type: Text Classifier (LangChain)  
    - Configuration: Classifies if the email intent is to submit a purchase order  
    - Input: Text from the OpenAI Chat Model1 node  
    - Output: Boolean classification  
    - Connections:  
      - If true → proceed to file format validation  
      - If false → Do Nothing node

  - **Do Nothing**  
    - Type: NoOp  
    - Role: Ends workflow for non-PO emails

---

#### 2.2 File Format Validation

- **Overview:**  
  Checks if the email attachment is an XLSX file; rejects the email with a reply if not.

- **Nodes Involved:**  
  - Is Excel Document? (If node)  
  - Reply Invalid Format (Microsoft Outlook)

- **Node Details:**

  - **Is Excel Document?**  
    - Type: If node  
    - Configuration: Checks if attachment MIME type equals "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"  
    - Input: Attachment binary data from Outlook Trigger  
    - Output:  
      - True → proceed to XLSX extraction  
      - False → Reply Invalid Format node

  - **Reply Invalid Format**  
    - Type: Microsoft Outlook node (reply)  
    - Configuration: Sends a reply to the sender indicating rejection due to invalid file format; replies only to sender  
    - Input: Message ID from original email  
    - Credentials: Microsoft Outlook OAuth2  
    - Edge Cases: Email sending failures, invalid message ID

---

#### 2.3 XLSX to Markdown Conversion

- **Overview:**  
  Extracts the XLSX file content and converts it into a markdown table string, enabling AI to parse the data effectively.

- **Nodes Involved:**  
  - Extract from File  
  - XLSX to Markdown Table (Code node)  
  - Sticky Note (explanatory)

- **Node Details:**

  - **Extract from File**  
    - Type: ExtractFromFile node  
    - Configuration: Extracts raw XLSX data including empty cells, no header row  
    - Input: XLSX attachment binary  
    - Output: Array of rows representing spreadsheet data  
    - Edge Cases: Corrupt XLSX files, large files causing timeouts

  - **XLSX to Markdown Table**  
    - Type: Code node (JavaScript)  
    - Configuration:  
      - Converts extracted rows into markdown table format:  
        - First row as header  
        - Second row as separator line  
        - Remaining rows filtered for non-empty cells  
      - Returns a markdown string under key `table`  
    - Input: Rows from Extract from File node  
    - Output: Markdown table string  
    - Edge Cases: Empty or malformed rows, special characters in cells

  - **Sticky Note**  
    - Content: Explains rationale for XLSX to markdown conversion and links to documentation.

---

#### 2.4 AI Extraction of Purchase Order Details

- **Overview:**  
  Uses an AI Information Extractor node to parse the markdown table and extract structured purchase order details and line items.

- **Nodes Involved:**  
  - Extract Purchase Order Details (Information Extractor)  
  - OpenAI Chat Model (GPT-4o-mini)  
  - Sticky Note (explanatory)

- **Node Details:**

  - **Extract Purchase Order Details**  
    - Type: Information Extractor (LangChain)  
    - Configuration:  
      - Input text: markdown table string from previous block  
      - Schema: Manual JSON schema defining expected fields such as purchase_order_number, purchase_order_date, vendor_name, items array with description, quantity, unit_price, etc.  
      - System prompt instructs to capture values as seen without converting dates  
    - Input: Markdown table string  
    - Output: Structured JSON object with purchase order data  
    - Edge Cases: Partial or missing data, AI misinterpretation, schema mismatch

  - **OpenAI Chat Model**  
    - Type: AI language model (GPT-4o-mini)  
    - Role: Provides the underlying LLM for the Information Extractor node  
    - Credentials: OpenAI API

  - **Sticky Note**  
    - Content: Explains the use of AI for data entry automation and links to Information Extractor documentation.

---

#### 2.5 Data Correction and Validation

- **Overview:**  
  Fixes Excel date serial numbers to JavaScript Date objects and runs validation checks on extracted data to ensure completeness and correctness.

- **Nodes Involved:**  
  - Fix Excel Dates (Set node)  
  - Run Checks (Set node)  
  - Is Valid Purchase Order? (If node)  
  - Sticky Note (explanatory)

- **Node Details:**

  - **Fix Excel Dates**  
    - Type: Set node  
    - Configuration: Converts Excel serial date number for purchase_order_date into JavaScript Date object using Excel epoch offset  
    - Input: Extracted purchase order JSON  
    - Output: Updated JSON with corrected date  
    - Edge Cases: Missing or invalid date values

  - **Run Checks**  
    - Type: Set node  
    - Configuration: Creates boolean flags:  
      - has_po_number: true if purchase_order_number exists  
      - has_valid_po_date: true if purchase_order_date is before tomorrow  
      - has_items: true if items array length > 0  
      - is_math_correct: true if sum of (unit_price * quantity) matches purchase_order_total (rounded to 2 decimals)  
    - Input: Corrected purchase order JSON  
    - Output: JSON with validation flags  
    - Edge Cases: Missing fields, floating point rounding errors

  - **Is Valid Purchase Order?**  
    - Type: If node  
    - Configuration: Checks all validation flags are true  
    - Output:  
      - True → proceed to acceptance reply  
      - False → proceed to rejection reply

  - **Sticky Note**  
    - Content: Explains the validation logic and links to documentation for the Set node.

---

#### 2.6 Conditional Responses

- **Overview:**  
  Sends automated email replies to the buyer based on validation results: acceptance confirmation or rejection with detailed error messages.

- **Nodes Involved:**  
  - Reply Accepted (Microsoft Outlook)  
  - Reply Rejection (Microsoft Outlook)

- **Node Details:**

  - **Reply Accepted**  
    - Type: Microsoft Outlook node (reply)  
    - Configuration: Sends a thank-you message confirming receipt of purchase order  
    - Input: Message ID from original email  
    - Credentials: Microsoft Outlook OAuth2  
    - Edge Cases: Email sending failures

  - **Reply Rejection**  
    - Type: Microsoft Outlook node (reply)  
    - Configuration: Sends rejection message listing which validation checks failed (missing PO number, invalid date, no items, math mismatch)  
    - Input: Message ID from original email  
    - Credentials: Microsoft Outlook OAuth2  
    - Edge Cases: Email sending failures

---

#### 2.7 Post-Processing Placeholder

- **Overview:**  
  Placeholder node representing where further processing of validated purchase orders would occur, such as integration with ERP or accounting systems.

- **Nodes Involved:**  
  - Do Something with Purchase Order (NoOp)

- **Node Details:**

  - **Do Something with Purchase Order**  
    - Type: NoOp  
    - Role: Placeholder for custom downstream processing  
    - Input: Validated purchase order data  
    - Output: None  
    - Edge Cases: None (no operation)

---

### 3. Summary Table

| Node Name                   | Node Type                          | Functional Role                          | Input Node(s)               | Output Node(s)                   | Sticky Note                                                                                          |
|-----------------------------|----------------------------------|----------------------------------------|-----------------------------|---------------------------------|----------------------------------------------------------------------------------------------------|
| Outlook Trigger             | Microsoft Outlook Trigger         | Watches inbox for emails with attachments | None                        | Is Submitting a Purchase Order?  | See Sticky Note3 for overview and usage details                                                    |
| OpenAI Chat Model1          | AI Language Model (OpenAI GPT)    | Provides text classification model     | Outlook Trigger             | Is Submitting a Purchase Order?  |                                                                                                    |
| Is Submitting a Purchase Order? | Text Classifier (LangChain)       | Classifies if email is a PO submission | OpenAI Chat Model1          | Is Excel Document?, Do Nothing   |                                                                                                    |
| Do Nothing                  | NoOp                             | Ends workflow for non-PO emails        | Is Submitting a Purchase Order? (false) | None                        |                                                                                                    |
| Is Excel Document?          | If Node                         | Validates attachment is XLSX            | Is Submitting a Purchase Order? (true) | Extract from File, Reply Invalid Format |                                                                                                    |
| Reply Invalid Format        | Microsoft Outlook                | Replies to sender if attachment invalid | Is Excel Document? (false)  | None                            |                                                                                                    |
| Extract from File           | ExtractFromFile                  | Extracts XLSX file content              | Is Excel Document? (true)   | XLSX to Markdown Table           | See Sticky Note for XLSX to markdown conversion explanation                                        |
| XLSX to Markdown Table      | Code                            | Converts XLSX rows to markdown table    | Extract from File           | Extract Purchase Order Details   | See Sticky Note for XLSX to markdown conversion explanation                                        |
| Extract Purchase Order Details | Information Extractor (LangChain) | Extracts structured PO data from markdown | XLSX to Markdown Table      | Fix Excel Dates                  | See Sticky Note1 for AI extraction overview                                                       |
| OpenAI Chat Model           | AI Language Model (OpenAI GPT)    | Provides LLM for Information Extractor | Extract Purchase Order Details (ai_languageModel) | Extract Purchase Order Details |                                                                                                    |
| Fix Excel Dates             | Set                             | Converts Excel serial dates to JS Date | Extract Purchase Order Details | Run Checks                      |                                                                                                    |
| Run Checks                  | Set                             | Runs validation checks on extracted data | Fix Excel Dates             | Is Valid Purchase Order?         | See Sticky Note2 for validation explanation                                                       |
| Is Valid Purchase Order?    | If Node                         | Determines if PO passes all validation  | Run Checks                  | Reply Accepted, Reply Rejection  |                                                                                                    |
| Reply Accepted             | Microsoft Outlook                | Sends acceptance confirmation email    | Is Valid Purchase Order? (true) | Do Something with Purchase Order |                                                                                                    |
| Reply Rejection            | Microsoft Outlook                | Sends rejection email with error details | Is Valid Purchase Order? (false) | None                            |                                                                                                    |
| Do Something with Purchase Order | NoOp                             | Placeholder for further processing      | Reply Accepted              | None                            |                                                                                                    |
| Sticky Note                | Sticky Note                     | Explanatory notes                       | None                        | None                            | Multiple sticky notes provide detailed explanations and links to documentation and examples       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Outlook Trigger Node**  
   - Type: Microsoft Outlook Trigger  
   - Configure to watch all folders for emails with attachments  
   - Enable attachment download  
   - Set polling interval (e.g., every hour)  
   - Connect credentials for Microsoft Outlook OAuth2

2. **Create OpenAI Chat Model1 Node**  
   - Type: AI Language Model (OpenAI GPT)  
   - Model: gpt-4o-mini  
   - No special options needed  
   - Connect OpenAI API credentials

3. **Create Text Classifier Node ("Is Submitting a Purchase Order?")**  
   - Type: LangChain Text Classifier  
   - Input Text: Concatenate sender name/email, subject, and body content from Outlook Trigger  
   - Categories: One category named "is_purchase_order" with description "The message's intent is to submit a purchase order"  
   - Fallback category: "other"  
   - Connect input from OpenAI Chat Model1

4. **Create NoOp Node ("Do Nothing")**  
   - Type: NoOp  
   - Connect from "Is Submitting a Purchase Order?" node's false output

5. **Create If Node ("Is Excel Document?")**  
   - Type: If node  
   - Condition: Check if attachment MIME type equals "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"  
   - Connect true output to next block, false output to reply invalid format

6. **Create Microsoft Outlook Node ("Reply Invalid Format")**  
   - Type: Microsoft Outlook (reply)  
   - Message: "PO rejected due to invalid file format. Please try again with XLSX."  
   - Reply only to sender  
   - Use message ID from Outlook Trigger  
   - Connect credentials for Microsoft Outlook OAuth2

7. **Create ExtractFromFile Node ("Extract from File")**  
   - Type: ExtractFromFile  
   - Operation: xlsx  
   - Options: rawData=true, headerRow=false, includeEmptyCells=true  
   - Input: Attachment binary from Outlook Trigger  
   - Connect true output from "Is Excel Document?"

8. **Create Code Node ("XLSX to Markdown Table")**  
   - Type: Code (JavaScript)  
   - Code:  
     ```javascript
     const rows = $input.all().map(item => item.json.row);
     const maxLength = Math.max(...rows.map(row => row.length));

     const table = [
       '|' + rows[0].join('|') + '|',
       '|' + Array(maxLength).fill(0).map(_ => '-').join('|') + '|',
       rows.slice(1).filter(row => row.some(Boolean)).map(row => '|' + row.join('|') + '|').join('\n')
     ].join('\n');

     return { table };
     ```
   - Connect from Extract from File

9. **Create Information Extractor Node ("Extract Purchase Order Details")**  
   - Type: LangChain Information Extractor  
   - Input Text: Use expression `{{$json.table}}` from previous node  
   - Schema Type: Manual  
   - Input Schema: JSON schema defining purchase order fields and items array (as per workflow)  
   - System Prompt: "Capture the values as seen. Do not convert dates."  
   - Connect from XLSX to Markdown Table

10. **Create OpenAI Chat Model Node**  
    - Type: AI Language Model (OpenAI GPT)  
    - Model: gpt-4o-mini  
    - Connect as AI language model for Information Extractor node  
    - Use OpenAI API credentials

11. **Create Set Node ("Fix Excel Dates")**  
    - Type: Set  
    - Mode: Raw  
    - JSON Output:  
      ```javascript
      {
        output: {
          ...$json.output,
          purchase_order_date: $json.output.purchase_order_date
            ? new Date((new Date(1900, 0, 1)).getTime() + (Number($json.output.purchase_order_date) - 2) * (24 * 60 * 60 * 1000))
            : $json.output.purchase_order_date
        }
      }
      ```
    - Connect from Extract Purchase Order Details

12. **Create Set Node ("Run Checks")**  
    - Type: Set  
    - Assign boolean fields:  
      - has_po_number: `Boolean($json.output.purchase_order_number)`  
      - has_valid_po_date: `$json.output.purchase_order_date.toDateTime() < $now.plus({ 'day': 1 })`  
      - has_items: `$json.output.items.length > 0`  
      - is_math_correct: `$json.output.items.map(item => item.unit_price * item.quantity).sum().round(2) === $json.output.purchase_order_total.round(2)`  
    - Connect from Fix Excel Dates

13. **Create If Node ("Is Valid Purchase Order?")**  
    - Type: If node  
    - Condition: All four boolean fields above must be true  
    - True output: Reply Accepted  
    - False output: Reply Rejection  
    - Connect from Run Checks

14. **Create Microsoft Outlook Node ("Reply Accepted")**  
    - Type: Microsoft Outlook (reply)  
    - Message: "Thank you for the purchase order.\nThis is an automated reply."  
    - Reply only to sender  
    - Use message ID from Outlook Trigger  
    - Connect credentials for Microsoft Outlook OAuth2  
    - Connect from true output of Is Valid Purchase Order?

15. **Create Microsoft Outlook Node ("Reply Rejection")**  
    - Type: Microsoft Outlook (reply)  
    - Message:  
      ```
      PO Rejected due to the following errors:
      {{[
        !$json.has_po_number ? '* PO number was not provided' : '',
        !$json.has_valid_po_date ? '* PO date was missing or invalid' : '',
        !$json.has_items ? '* No line items detected' : '',
        !$json.is_math_correct ? '* Line items prices do not match up to PO total' : ''
      ].compact().join('\n')}}
      ```  
    - Reply only to sender  
    - Use message ID from Outlook Trigger  
    - Connect credentials for Microsoft Outlook OAuth2  
    - Connect from false output of Is Valid Purchase Order?

16. **Create NoOp Node ("Do Something with Purchase Order")**  
    - Type: NoOp  
    - Placeholder for downstream processing  
    - Connect from Reply Accepted

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                          | Context or Link                                                                                              |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| This n8n template automates purchase order form submissions from Outlook XLSX attachments using AI to reduce manual data entry.                                                                                                                                                                                                                                       | Workflow purpose                                                                                             |
| Outlook credentials setup guide: https://docs.n8n.io/integrations/builtin/credentials/microsoft/                                                                                                                                                                                                                                                                      | Credential setup                                                                                             |
| OpenAI credentials are required for AI-based text classification and information extraction.                                                                                                                                                                                                                                                                          | Credential setup                                                                                             |
| Purchase Order Example XLSX file used in this template: https://1drv.ms/x/c/8f1f7dda12b7a145/ETWH8dKwgZ1OiVz7ISUWYf8BwiyihBjXPXEbCYkVi8XDyw?e=WWU2eR                                                                                                                                                                                                           | Example file                                                                                                |
| Sticky Note explaining XLSX to Markdown conversion: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.extractfromfile/                                                                                                                                                                                                                              | Node documentation                                                                                           |
| Sticky Note explaining AI Information Extractor usage: https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.information-extractor                                                                                                                                                                                                   | Node documentation                                                                                           |
| Sticky Note explaining validation logic with Set node: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.set                                                                                                                                                                                                                                        | Node documentation                                                                                           |
| Join the n8n Discord community for help: https://discord.com/invite/XPKeKXeB7d                                                                                                                                                                                                                                                                                         | Community support                                                                                             |
| Ask questions or share ideas on the n8n Forum: https://community.n8n.io/                                                                                                                                                                                                                                                                                              | Community support                                                                                             |

---

This structured documentation enables advanced users and AI agents to fully understand, reproduce, and customize the workflow, anticipate potential failure points, and integrate it into broader automation ecosystems.