AI-Powered Invoice Data Extraction from Email PDFs to Airtable with GPT-4o

https://n8nworkflows.xyz/workflows/ai-powered-invoice-data-extraction-from-email-pdfs-to-airtable-with-gpt-4o-4434


# AI-Powered Invoice Data Extraction from Email PDFs to Airtable with GPT-4o

### 1. Workflow Overview

This workflow automates the extraction of invoice data from email PDF attachments and uploads structured data into Airtable for accounts payable (AP) automation. It targets finance teams or businesses seeking to digitize invoice processing by leveraging AI (GPT-4o) for data extraction from invoices, including OCR from images. The workflow consists of the following logical blocks:

- **1.1 Email Reception & Filtering:** Listens for incoming Gmail messages containing invoice PDFs, filtering out previously processed emails.
- **1.2 PDF to Image Conversion:** Converts PDF attachments to JPG images for AI image analysis.
- **1.3 AI-Based Invoice Data Extraction:** Uses GPT-4o models to extract structured invoice data from images and text.
- **1.4 Vendor Data Retrieval & Matching:** Retrieves vendor records from Airtable and matches extracted vendor info against existing records.
- **1.5 Data Mapping & Upload to Airtable:** Maps extracted invoice data and vendor IDs, then upserts the data into the Airtable "Invoices" table.
- **1.6 Email Labeling:** Applies a Gmail label to mark processed emails.
- **1.7 Setup & Documentation Notes:** Contains sticky notes with setup instructions and links for users.

---

### 2. Block-by-Block Analysis

#### 1.1 Email Reception & Filtering

- **Overview:**  
  This block triggers on new Gmail messages, filters for invoices with attachments that have not yet been processed, and downloads attachments.

- **Nodes Involved:**  
  - Gmail Trigger  
  - Gmail1  
  - Sticky Note1  
  - Sticky Note7

- **Node Details:**

  - **Gmail Trigger**  
    - Type: Trigger node for Gmail  
    - Configuration: Polls Gmail every hour for new messages (no filters on trigger)  
    - Inputs: None (trigger)  
    - Outputs: Message metadata  
    - Failures: OAuth2 auth failure, Gmail API rate limits  

  - **Gmail1**  
    - Type: Gmail node to fetch messages  
    - Configuration: Queries inbox for messages with attachments, containing "invoice" in text, and excludes messages labeled "invoice_checked"  
    - Downloads attachments automatically  
    - Inputs: Trigger output  
    - Outputs: Full message data with attachments  
    - Failures: Attachment download errors, Gmail API issues  

  - **Sticky Note1**  
    - Informational only: Explains Gmail1 filter criteria  
    - No inputs/outputs  

  - **Sticky Note7**  
    - Setup instructions about creating the "invoice_checked" Gmail label and OAuth2 credential setup for Gmail nodes  

#### 1.2 PDF to Image Conversion

- **Overview:**  
  Converts the first PDF attachment from each email into JPG images using ConvertAPI for further AI analysis.

- **Nodes Involved:**  
  - PDF -> JPG - ConvertAPI  
  - Get image data  
  - Get all img_url  
  - Sticky Note3  
  - Sticky Note9

- **Node Details:**

  - **PDF -> JPG - ConvertAPI**  
    - Type: HTTP Request node  
    - Configuration: POST to ConvertAPI PDF-to-JPG endpoint, uploads the first attachment from Gmail1  
    - Uses Header Auth credential for API key  
    - Retries on failure with 5s delay  
    - Inputs: Gmail1 output (attachment_0)  
    - Outputs: URLs of generated JPG images  
    - Failures: API key invalid, network timeout, rate limits  

  - **Get image data**  
    - Type: SplitOut node  
    - Configuration: Splits the "Files" array from ConvertAPI response into individual items for processing  
    - Inputs: ConvertAPI output  
    - Outputs: Individual image file data  

  - **Get all img_url**  
    - Type: Set node  
    - Configuration: Sets a single string field "url" to the URL of each image file for downstream nodes  
    - Inputs: Get image data output  
    - Outputs: JSON with "url" field  

  - **Sticky Note3**  
    - Setup instructions for ConvertAPI account, API key, and credential creation  

  - **Sticky Note9**  
    - Reminder to add ConvertAPI Header Auth credential to the ConvertAPI node  

#### 1.3 AI-Based Invoice Data Extraction

- **Overview:**  
  Uses GPT-4o to extract structured invoice data by analyzing the JPG images and the text output from the AI model. The data is parsed into a JSON schema.

- **Nodes Involved:**  
  - Analyze image  
  - OpenAI Model  
  - Apply Data Extraction Rules  
  - Structured Output Parser  
  - Map Output  
  - Sticky Note5

- **Node Details:**

  - **Analyze image**  
    - Type: LangChain OpenAI Image Analysis  
    - Configuration: Sends image URLs to GPT-4o with a prompt to extract all relevant invoice fields (dates, vendor info, products, prices)  
    - Inputs: URLs from Get all img_url  
    - Outputs: Raw text extraction of invoice data  

  - **OpenAI Model**  
    - Type: LangChain OpenAI Text Model  
    - Configuration: Uses GPT-4o with temperature 0 for deterministic output  
    - Inputs: Not directly connected but AI chain input for text extraction rules  

  - **Apply Data Extraction Rules**  
    - Type: LangChain Chain LLM  
    - Configuration: Uses a prompt defining the JSON schema for invoice fields, instructing to extract only known info without hallucination  
    - Connects AI model output and applies structured output parser  
    - Inputs: Output text from Analyze image and OpenAI Model  
    - Outputs: Structured JSON of extracted data  

  - **Structured Output Parser**  
    - Type: LangChain Output Parser  
    - Configuration: JSON schema enforcing types/formats for invoice date, due date, vendor, products, prices  
    - Inputs: Text output from Apply Data Extraction Rules  
    - Outputs: Parsed JSON  

  - **Map Output**  
    - Type: Set node  
    - Configuration: Maps parsed output JSON into "output" property for further processing  
    - Inputs: Apply Data Extraction Rules output  
    - Outputs: Normalized data JSON  

  - **Sticky Note5**  
    - Overview and demo video link, explains the overall automation concept  

#### 1.4 Vendor Data Retrieval & Matching

- **Overview:**  
  Retrieves the vendor list from Airtable and matches the extracted vendor info to existing vendor records to obtain vendor IDs.

- **Nodes Involved:**  
  - Get list of vendors  
  - Edit Fields  
  - Information Extractor  
  - OpenAI Chat Model  
  - Merge

- **Node Details:**

  - **Get list of vendors**  
    - Type: Airtable node  
    - Configuration: Searches the "Vendors" table in Airtable base for all vendor records  
    - Inputs: None (triggered downstream)  
    - Outputs: List of vendor records  

  - **Edit Fields**  
    - Type: Set node  
    - Configuration: Transforms Airtable vendor records into an array of objects with `id` and `Name` properties for matching  
    - Inputs: Get list of vendors  
    - Outputs: Array of vendors in simplified structure  

  - **Information Extractor**  
    - Type: LangChain Information Extractor  
    - Configuration: Receives vendor list and extracted vendor name and tax ID, uses GPT-4o to find matching vendor ID or empty string if no match  
    - Inputs: Merged data of vendor list and extracted vendor info  
    - Outputs: Extracted `vendor_id` for mapping  

  - **OpenAI Chat Model**  
    - Type: LangChain Chat OpenAI  
    - Configuration: Uses GPT-4o for vendor matching prompt with system prompt defining extraction logic  
    - Inputs: Information Extractor input  
    - Outputs: Vendor ID extraction  

  - **Merge**  
    - Type: Merge node  
    - Configuration: Combines vendor mapping output with mapped invoice output data  
    - Inputs: Edit Fields and Map Output outputs  

#### 1.5 Data Mapping & Upload to Airtable

- **Overview:**  
  Combines all extracted and matched data, then upserts invoice records into Airtable, and applies a Gmail label for processed emails.

- **Nodes Involved:**  
  - Merge1  
  - Airtable  
  - Gmail  
  - Sticky Note4  
  - Sticky Note6

- **Node Details:**

  - **Merge1**  
    - Type: Merge node  
    - Configuration: Combines outputs from image URL processing, vendor matching, and invoice data mapping by position to consolidate data for Airtable  
    - Inputs: Get all img_url, Information Extractor, Map Output  

  - **Airtable**  
    - Type: Airtable node  
    - Configuration: Upserts invoice data into the "Invoices" table of the designated Airtable base  
    - Maps fields with vendor ID, invoice URL, dates, product, invoice number, prices  
    - Has type casting enabled  
    - Inputs: Merge1 output  
    - Outputs: Upsert result  

  - **Gmail**  
    - Type: Gmail node  
    - Configuration: Adds the label "invoice_checked" to the processed email message ID to avoid reprocessing  
    - Inputs: Airtable output (uses message id from Gmail1)  
    - Failures: Gmail API errors, label not found  

  - **Sticky Note4**  
    - Reminder to change Airtable base and table to the duplicated base and "Invoices" table  

  - **Sticky Note6**  
    - Reminder to change Airtable base/table for "Vendors" table  

---

### 3. Summary Table

| Node Name               | Node Type                                   | Functional Role                        | Input Node(s)                       | Output Node(s)                   | Sticky Note                                                                                                                        |
|-------------------------|---------------------------------------------|-------------------------------------|-----------------------------------|---------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| Gmail Trigger           | n8n-nodes-base.gmailTrigger                  | Trigger on new Gmail messages       | None                              | Gmail1                          | # 3. Set up Gmail instructions (Sticky Note7)                                                                                    |
| Gmail1                  | n8n-nodes-base.gmail                         | Fetch invoices from Gmail Inbox     | Gmail Trigger                    | PDF -> JPG - ConvertAPI          | Gets all messages with attachment, invoice text, without 'invoice_checked' label (Sticky Note1)                                 |
| PDF -> JPG - ConvertAPI | n8n-nodes-base.httpRequest                    | Convert PDF attachment to JPG       | Gmail1                           | Get image data                  | Setup ConvertAPI and Header Auth (Sticky Note3, Sticky Note9)                                                                    |
| Get image data          | n8n-nodes-base.splitOut                       | Split JPG files for processing      | PDF -> JPG - ConvertAPI           | Get all img_url                 |                                                                                                                                  |
| Get all img_url         | n8n-nodes-base.set                            | Extract image URLs for analysis     | Get image data                   | Analyze image, Merge1            |                                                                                                                                  |
| Analyze image           | @n8n/n8n-nodes-langchain.openAi              | Extract invoice data from images    | Get all img_url                  | Apply Data Extraction Rules      |                                                                                                                                  |
| OpenAI Model            | @n8n/n8n-nodes-langchain.lmOpenAi             | AI text model for invoice extraction|                                | Apply Data Extraction Rules (ai_languageModel) |                                                                                                                                  |
| Apply Data Extraction Rules | @n8n/n8n-nodes-langchain.chainLlm           | Extract structured invoice info     | Analyze image, OpenAI Model       | Map Output                      |                                                                                                                                  |
| Structured Output Parser| @n8n/n8n-nodes-langchain.outputParserStructured | Parse AI output to JSON schema      | Apply Data Extraction Rules       | Apply Data Extraction Rules (ai_outputParser) |                                                                                                                                  |
| Map Output              | n8n-nodes-base.set                            | Prepare extracted data for matching | Apply Data Extraction Rules       | Merge                          |                                                                                                                                  |
| Get list of vendors     | n8n-nodes-base.airtable                        | Retrieve vendor records             | None                            | Edit Fields                    | # TODO: Change Airtable base/table to duplicated "Vendors" (Sticky Note6)                                                        |
| Edit Fields             | n8n-nodes-base.set                            | Format vendor data                  | Get list of vendors              | Merge                          |                                                                                                                                  |
| Information Extractor   | @n8n/n8n-nodes-langchain.informationExtractor | Match vendor info to vendor ID     | Merge                          | Merge1                         |                                                                                                                                  |
| OpenAI Chat Model       | @n8n/n8n-nodes-langchain.lmChatOpenAi          | AI model for vendor matching       | Information Extractor (ai_languageModel) | Information Extractor        |                                                                                                                                  |
| Merge                   | n8n-nodes-base.merge                          | Combine vendor ID and invoice data | Edit Fields, Map Output          | Information Extractor          |                                                                                                                                  |
| Merge1                  | n8n-nodes-base.merge                          | Combine all data for Airtable       | Get all img_url, Information Extractor, Map Output | Airtable                   |                                                                                                                                  |
| Airtable                | n8n-nodes-base.airtable                        | Upsert invoice records             | Merge1                         | Gmail                         | # TODO: Change Airtable base/table to duplicated "Invoices" (Sticky Note4)                                                       |
| Gmail                   | n8n-nodes-base.gmail                          | Label processed email               | Airtable                       | None                          |                                                                                                                                  |
| Sticky Note1            | n8n-nodes-base.stickyNote                      | Explains Gmail1 filtering          | None                          | None                          | Gets all messages that have an attachment, text matches invoice, and no invoice_checked label                                    |
| Sticky Note3            | n8n-nodes-base.stickyNote                      | ConvertAPI setup instructions      | None                          | None                          | # 2. Set Up ConvertAPI with link and API key instructions                                                                        |
| Sticky Note4            | n8n-nodes-base.stickyNote                      | Reminder for Airtable Invoices setup | None                          | None                          | TODO: Change Airtable base/table to the duplicated base and "Invoices"                                                           |
| Sticky Note5            | n8n-nodes-base.stickyNote                      | Workflow overview and demo video   | None                          | None                          | # Invoice Processing Automation with video demo link                                                                             |
| Sticky Note6            | n8n-nodes-base.stickyNote                      | Reminder for Airtable Vendors setup | None                          | None                          | TODO: Change Airtable base/table to the duplicated base and "Vendors" table                                                     |
| Sticky Note7            | n8n-nodes-base.stickyNote                      | Gmail setup instructions           | None                          | None                          | # 3. Setup Gmail label and credentials instructions                                                                               |
| Sticky Note9            | n8n-nodes-base.stickyNote                      | Reminder to add ConvertAPI Auth    | None                          | None                          | TODO: Add the ConvertAPI Header Auth                                                                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger node**  
   - Type: Gmail Trigger  
   - Poll every hour for new messages  
   - Authenticate with Gmail OAuth2 credentials  

2. **Add Gmail node ("Gmail1")**  
   - Operation: Get All Messages  
   - Query: `in:inbox has:attachment invoice -label:invoice_checked`  
   - Download attachments enabled  
   - Connect Gmail Trigger → Gmail1  
   - Use the same Gmail OAuth2 credentials  

3. **Add HTTP Request node ("PDF -> JPG - ConvertAPI")**  
   - Method: POST  
   - URL: `https://v2.convertapi.com/convert/pdf/to/jpg`  
   - Authentication: HTTP Header Auth (create credential with your ConvertAPI key)  
   - Body: multipart-form-data  
     - StoreFile: true  
     - ImageOutputFormat: jpg  
     - File: Attachment from Gmail1 `attachment_0`  
   - Retry on failure: Enabled, wait 5 seconds between tries  
   - Connect Gmail1 → PDF -> JPG - ConvertAPI  

4. **Add SplitOut node ("Get image data")**  
   - Field to split out: `Files` (from ConvertAPI response)  
   - Connect PDF -> JPG - ConvertAPI → Get image data  

5. **Add Set node ("Get all img_url")**  
   - Set field `url` to `{{$json.Url}}` (extract image URL)  
   - Connect Get image data → Get all img_url  

6. **Add LangChain OpenAI node ("Analyze image")**  
   - Resource: Image  
   - Operation: Analyze  
   - Model: gpt-4o  
   - Image URLs: `{{$json.url}}` from Get all img_url  
   - Prompt: Instruct to extract invoice fields from image, no hallucination  
   - Connect Get all img_url → Analyze image  
   - Use OpenAI API credential  

7. **Add LangChain OpenAI node ("OpenAI Model")**  
   - Model: gpt-4o  
   - Temperature: 0 (deterministic)  
   - Connect as ai_languageModel to "Apply Data Extraction Rules"  

8. **Add LangChain Chain LLM node ("Apply Data Extraction Rules")**  
   - Prompt: Defines JSON schema extraction for invoice fields, strict no hallucination  
   - Connect Analyze image main output → Apply Data Extraction Rules main input  
   - Connect OpenAI Model ai_languageModel output → Apply Data Extraction Rules ai_languageModel input  
   - Enable output parser  

9. **Add LangChain Output Parser node ("Structured Output Parser")**  
   - JSON schema for invoice fields: Invoice Date, Due Date (date strings), Invoice Number, Vendor Name, Vendor Tax ID, Product Name, Price with/without Tax (numbers)  
   - Connect Apply Data Extraction Rules ai_outputParser output → Structured Output Parser ai_outputParser input  

10. **Connect Structured Output Parser → Apply Data Extraction Rules main input** (feedback loop)  

11. **Add Set node ("Map Output")**  
    - Set JSON output to `{{$json.output}}`  
    - Connect Apply Data Extraction Rules main output → Map Output  

12. **Add Airtable node ("Get list of vendors")**  
    - Operation: Search  
    - Base: Your duplicated Airtable base for Invoice Processing  
    - Table: Vendors  
    - Connect Map Output → Get list of vendors  

13. **Add Set node ("Edit Fields")**  
    - Transform Airtable vendor list to array of `{id, Name}`  
    - Expression: `{{$input.all().map(({ json: { id, Name } }) => ({ id, Name }))}}`  
    - Connect Get list of vendors → Edit Fields  

14. **Add Merge node ("Merge")**  
    - Mode: Combine all  
    - Connect Edit Fields → Merge input 1  
    - Connect Map Output → Merge input 2  

15. **Add LangChain Information Extractor node ("Information Extractor")**  
    - Attributes: `vendor_id` (required)  
    - System prompt: Expert extraction algorithm, omit unknown attributes  
    - Text prompt includes vendor list, extracted vendor name and tax ID  
    - Connect Merge → Information Extractor  

16. **Add LangChain Chat OpenAI node ("OpenAI Chat Model")**  
    - Model: gpt-4o  
    - Connect Information Extractor ai_languageModel input → OpenAI Chat Model output  

17. **Add Merge node ("Merge1")**  
    - Mode: Combine by position  
    - Number of inputs: 3  
    - Connect Get all img_url → Merge1 input 1  
    - Connect Information Extractor → Merge1 input 2  
    - Connect Map Output → Merge1 input 3  

18. **Add Airtable node ("Airtable")**  
    - Operation: Upsert  
    - Base: Duplicated Airtable base  
    - Table: Invoices  
    - Map columns for: Vendor (array with vendor_id), Invoice (array with URL), Due Date, Invoice Date, Product Name, Invoice Number (prefix "Invoice "), Price with/without Tax  
    - Enable type cast  
    - Connect Merge1 → Airtable  

19. **Add Gmail node ("Gmail")**  
    - Operation: Add Labels  
    - Label IDs: The ID of the "invoice_checked" label in Gmail  
    - Message ID: `{{$json["id"]}}` from Gmail1  
    - Connect Airtable → Gmail  

20. **Add Sticky Notes** as needed for setup instructions:  
    - Setup Airtable accounts, duplicate base, set credentials  
    - Setup ConvertAPI and credentials  
    - Setup Gmail label and OAuth2  
    - Setup OpenAI credentials  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                               | Context or Link                                                                                      |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Video walkthrough and demo for invoice processing automation: https://www.youtube.com/watch?v=rfu4MSvtpAw                                                                                                                                  | Workflow overview sticky note (Sticky Note5)                                                      |
| To get a similar business tool tailored to your processes, book a call: https://automable.ai/book-a-call/ or email vasarmilan@gmail.com                                                                                                   | Sticky Note5                                                                                       |
| Airtable setup: Register, duplicate base, create PAT for credentials, link Airtable nodes to tables                                                                                                                                        | Sticky Note (Sticky Note) near Airtable nodes                                                      |
| ConvertAPI setup: Register for account, get API key, create HTTP Header Auth credential in n8n, link to ConvertAPI node                                                                                                                   | Sticky Note3                                                                                       |
| Gmail setup: Create "invoice_checked" label, configure OAuth2 credentials per https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/                                                                            | Sticky Note7                                                                                       |
| OpenAI setup: Follow n8n instructions for OpenAI credential https://docs.n8n.io/integrations/builtin/credentials/openai/                                                                                                                  | Sticky Note8                                                                                       |
| TODO reminders in sticky notes to update Airtable base and table IDs to your duplicated base and tables for Vendors and Invoices                                                                                                          | Sticky Note4, Sticky Note6                                                                         |
| Reminder to add ConvertAPI Header Auth credential to the ConvertAPI HTTP Request node                                                                                                                                                      | Sticky Note9                                                                                       |

---

This document provides a thorough, stepwise description and analysis of the workflow "AI-Powered Invoice Data Extraction from Email PDFs to Airtable with GPT-4o," enabling reproduction, modification, and troubleshooting by technical users and AI agents alike.