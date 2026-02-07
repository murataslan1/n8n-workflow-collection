Automate Invoice Processing with OCR, GPT-4 & Salesforce Opportunity Creation

https://n8nworkflows.xyz/workflows/automate-invoice-processing-with-ocr--gpt-4---salesforce-opportunity-creation-10029


# Automate Invoice Processing with OCR, GPT-4 & Salesforce Opportunity Creation

---

### 1. Workflow Overview

This workflow automates the end-to-end processing of PDF invoices stored in a Google Drive folder, utilizing OCR and GPT-4 for semantic extraction, and integrates the extracted data into Salesforce by creating/ updating accounts (buyers), opportunities, and opportunity line items (products). The original invoices are archived to OneDrive for record-keeping.

**Target Use Case:**  
Automate invoice data ingestion and Salesforce opportunity creation to reduce manual data entry, improve accuracy, and maintain document archives.

**Logical Blocks:**  
- **1.1 Input Reception & File Handling:** Monitor a specific Google Drive folder for new PDF invoices, download the files, and archive them to OneDrive.  
- **1.2 OCR & AI Extraction:** Extract raw text via OCR, then process the text with GPT-4 to generate normalized invoice JSON objects.  
- **1.3 Salesforce Account Upsert:** Upsert buyer information as Salesforce accounts using extracted tax IDs.  
- **1.4 Salesforce Opportunity Creation:** Create an Opportunity linked to the buyer account with invoice metadata.  
- **1.5 PricebookEntry Query & Opportunity Line Items Creation:** Build a SOQL query based on product codes, query Salesforce for matching PricebookEntry records, assemble OpportunityLineItem payloads, and create these line items via Salesforce API.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & File Handling

**Overview:**  
This block triggers the workflow on new files appearing in a designated Google Drive folder, downloads the invoice PDF, and archives the original file to OneDrive.

**Nodes Involved:**  
- Google Drive Trigger  
- Download File From Google  
- Update File to One Drive

**Node Details:**  

- **Google Drive Trigger**  
  - *Type:* Trigger node for Google Drive  
  - *Configuration:* Watches for `fileCreated` events every minute in a specific folder (ID `125tDoA_XgewTZetNg4UhYoYuoomIKLuP`)  
  - *Credentials:* Google Drive OAuth2  
  - *Connections:* Output → Download File From Google  
  - *Edge Cases:*  
    - Permission errors if folder access is revoked  
    - Missed triggers if polling interval too sparse  
    - Large file uploads may delay triggering  

- **Download File From Google**  
  - *Type:* Google Drive node, operation: download  
  - *Configuration:* Downloads file by ID from trigger  
  - *Credentials:* Google Drive OAuth2  
  - *Input:* File metadata from trigger  
  - *Output:* Binary data of PDF  
  - *Connections:* Output → Extract from File AND Update File to One Drive  
  - *Edge Cases:*  
    - Download failure due to network issues or revoked credentials  
    - Unsupported file formats or corrupt files  

- **Update File to One Drive**  
  - *Type:* Microsoft OneDrive node, operation: upload  
  - *Configuration:* Uploads the downloaded PDF binary to a specified OneDrive folder (`folder_id_onedrive` placeholder) with original filename  
  - *Credentials:* Microsoft OneDrive OAuth2  
  - *Input:* Binary from Download File From Google  
  - *Edge Cases:*  
    - Upload failure due to invalid folder ID or auth issues  
    - Large file size limits  
    - Naming conflicts in OneDrive folder  

#### 2.2 OCR & AI Extraction

**Overview:**  
Extracts text from the PDF using built-in OCR if necessary, then sends the extracted text to GPT-4 for detailed invoice parsing and normalization into a strict JSON schema.

**Nodes Involved:**  
- Extract from File  
- Message a model (OpenAI GPT-4)

**Node Details:**  

- **Extract from File**  
  - *Type:* Extract from File node (PDF)  
  - *Configuration:* Operation set to `pdf`, OCR enabled for scanned PDFs  
  - *Input:* Binary PDF from Download File From Google  
  - *Output:* Extracted plain text (`$json.text`)  
  - *Connections:* Output → Message a model  
  - *Edge Cases:*  
    - OCR failure on poor-quality scans  
    - Empty or incomplete text extraction  
    - Timeout on very large PDFs  

- **Message a model (OpenAI GPT-4)**  
  - *Type:* Langchain OpenAI node  
  - *Configuration:* Uses GPT-4.1 model with a detailed system prompt instructing strict JSON output of invoice arrays, covering seller, buyer, invoice metadata, products, summary, software info, and parsing warnings  
  - *Prompt Highlights:*  
    - Strict JSON array output only  
    - Locale-aware normalization of numbers, currencies, dates  
    - Multi-invoice batches handled  
    - Anti-hallucination rules to avoid invented data  
  - *Credentials:* OpenAI API  
  - *Input:* Extracted text from previous node  
  - *Output:* Parsed JSON invoices array  
  - *Connections:* Output → Create or update an account  
  - *Edge Cases:*  
    - API rate limiting or auth errors  
    - Model hallucination despite prompt (mitigated by strict instructions)  
    - Non-JSON output if prompt fails or response malformed  
    - Large input text causing truncation or timeouts  

#### 2.3 Salesforce Account Upsert

**Overview:**  
Upserts buyer information as Salesforce Accounts keyed on tax ID, ensuring buyer records are created or updated before opportunity creation.

**Nodes Involved:**  
- Create or update an account

**Node Details:**  

- **Create or update an account**  
  - *Type:* Salesforce node (account resource)  
  - *Operation:* Upsert by external ID field `tax_id__c` using buyer tax ID from parsed JSON  
  - *Fields:* Name populated from buyer name in JSON  
  - *Credentials:* Salesforce OAuth2  
  - *Input:* JSON from GPT-4 output  
  - *Output:* Salesforce Account ID and metadata  
  - *Connections:* Output → Create an opportunity  
  - *Edge Cases:*  
    - Salesforce API auth errors or throttling  
    - Missing or null buyer tax ID (may cause upsert failure or duplicate accounts)  
    - Data validation errors in Salesforce  

#### 2.4 Salesforce Opportunity Creation

**Overview:**  
Creates a Salesforce Opportunity record linked to the upserted Account, using invoice metadata such as invoice code, issue date, stage, and grand total.

**Nodes Involved:**  
- Create an opportunity

**Node Details:**  

- **Create an opportunity**  
  - *Type:* Salesforce node (opportunity resource)  
  - *Fields:*  
    - `name`: invoice code from LLM output  
    - `closeDate`: invoice issue date  
    - `stageName`: fixed value `Closed Won`  
    - `amount`: grand total from invoice summary  
    - `accountId`: from Salesforce Account upsert result  
  - *Credentials:* Salesforce OAuth2  
  - *Input:* Account ID + JSON invoice data  
  - *Output:* Opportunity ID and metadata  
  - *Connections:* Output → Build SOQL  
  - *Edge Cases:*  
    - Missing invoice code or date causing creation failure  
    - Salesforce validation rules blocking creation  
    - API errors or timeouts  

#### 2.5 PricebookEntry Query & Opportunity Line Items Creation

**Overview:**  
Collects product codes from the invoice, builds a SOQL query to find matching PricebookEntry records, queries Salesforce, then assembles and creates OpportunityLineItem records linked to the Opportunity.

**Nodes Involved:**  
- Build SOQL  
- Query PricebookEntries  
- Code in JavaScript (build OLI payload)  
- Create Opportunity Line Items (HTTP Request to Salesforce composite API)

**Node Details:**  

- **Build SOQL**  
  - *Type:* Code node (JavaScript)  
  - *Function:*  
    - Extracts unique product codes from invoice products array  
    - Constructs a SOQL query string filtering PricebookEntry by Pricebook2Id (hardcoded placeholder `'01sxxxxxxxxxxxxxxx'`) and product codes  
    - Throws error if no product codes found  
  - *Input:* JSON invoice products from GPT-4 output  
  - *Output:* Object with `soql` query string and list of codes  
  - *Connections:* Output → Query PricebookEntries  
  - *Edge Cases:*  
    - Missing or empty product list  
    - Product codes with special characters needing escaping  
    - Hardcoded Pricebook2Id must be replaced per environment  

- **Query PricebookEntries**  
  - *Type:* Salesforce node (search resource)  
  - *Configuration:* Executes SOQL query from previous node  
  - *Credentials:* Salesforce OAuth2  
  - *Input:* SOQL query  
  - *Output:* Records of PricebookEntry matching product codes  
  - *Connections:* Output → Code in JavaScript (build OLI payload)  
  - *Edge Cases:*  
    - Query failures or no matching entries found  
    - API throttling or auth errors  

- **Code in JavaScript (build OLI payloads)**  
  - *Type:* Code node (JavaScript)  
  - *Function:*  
    - Reads Opportunity ID from Create an opportunity node  
    - Reads product line array from GPT-4 output  
    - Reads PricebookEntry records from query results  
    - Maps product codes to PricebookEntry IDs  
    - Constructs array of OpportunityLineItem records with OpportunityId, PricebookEntryId, Quantity, UnitPrice  
    - Ignores discounts for simplicity (discount calculation commented out)  
    - Throws error if PricebookEntry not found for any product code  
  - *Input:* Multiple inputs - SOQL query result, Opportunity ID, products array  
  - *Output:* JSON body formatted for Salesforce composite API batch insert  
  - *Connections:* Output → Create Opportunity Line Items  
  - *Edge Cases:*  
    - Missing opportunity ID or empty products array  
    - Missing PricebookEntry mapping for product code  
    - Data conversion errors for quantity/price fields  

- **Create Opportunity Line Items**  
  - *Type:* HTTP Request node  
  - *Configuration:*  
    - Method: POST  
    - URL: Salesforce composite sObjects API endpoint (`https://mydomain.salesforce.com/services/data/v65.0/composite/sobjects`) - replace `mydomain` with actual Salesforce domain  
    - Auth: Salesforce OAuth2  
    - Body: JSON from previous code node (`records` array)  
  - *Input:* JSON body with OpportunityLineItem records  
  - *Output:* Salesforce API response for batch insert  
  - *Edge Cases:*  
    - API errors if records fail validation or PricebookEntryId incorrect  
    - Authentication or network failures  
    - Rate limiting on Salesforce API  

---

### 3. Summary Table

| Node Name                 | Node Type                       | Functional Role                                 | Input Node(s)                | Output Node(s)                | Sticky Note                                                                                                                |
|---------------------------|--------------------------------|------------------------------------------------|------------------------------|------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| Google Drive Trigger       | Google Drive Trigger            | Trigger workflow on new file in Drive folder   |                              | Download File From Google     | ## 1) Google Drive Trigger - Op: fileCreated in folder (ID) - Poll: every minute - Creds: Google Drive OAuth2 - Note: Ensure access/Shared Drive rights |
| Download File From Google  | Google Drive                   | Download file binary by ID from Drive           | Google Drive Trigger          | Extract from File, Update File to One Drive | ## 2) Download from Drive - Op: download by {{$json.id}} - Binary key: data (default) - Creds: Google Drive OAuth2           |
| Update File to One Drive   | Microsoft OneDrive             | Archive original PDF to OneDrive                 | Download File From Google     |                              | ## 11) Upload to OneDrive - Op: upload - Name: ={{ $json.name }} - Parent Folder ID: (set) - Binary: from step 2 - Creds: OneDrive OAuth2 |
| Extract from File          | Extract from File (PDF/OCR)    | Extract text from PDF, enable OCR if needed     | Download File From Google     | Message a model              | ## 3) Extract from File - Op: pdf (enable OCR for scans) - Output: {{$json.text}}                                           |
| Message a model            | OpenAI GPT-4 (Langchain node)  | Parse extracted text to structured JSON invoices| Extract from File             | Create or update an account  | ## 4) Message a Model (JSON) - Node: @n8n/n8n-nodes-langchain.openAi - Model: gpt-4.1 - Prompt: strict schema; **return only JSON array** - jsonOutput: true - Output path (first item): $('Message a model').first().json.message.content |
| Create or update an account| Salesforce (account upsert)    | Upsert buyer account by tax ID                   | Message a model              | Create an opportunity        | ## 5) Salesforce: Upsert Account (Buyer) - Node: salesforce (account upsert) - External Id: tax_id__c - externalIdValue: ={{ $json.message.content.buyer.tax_id }} - name: ={{ $json.message.content.buyer.name }} |
| Create an opportunity      | Salesforce (opportunity create)| Create Opportunity linked to Account             | Create or update an account   | Build SOQL                  | ## 6) Salesforce: Create Opportunity - Node: salesforce (resource: opportunity) - name: ={{ $('Message a model').item.json.message.content.invoice.code }} - closeDate: ={{ $('Message a model').item.json.message.content.invoice.issue_date }} - stageName: Closed Won - amount: ={{ $('Message a model').item.json.message.content.summary.grand_total }} - accountId: ={{ $json.id }}  // from Upsert Account |
| Build SOQL                 | Code (JavaScript)              | Build SOQL query for PricebookEntry by product codes | Create an opportunity        | Query PricebookEntries       | ## 7) Code: Build SOQL (PricebookEntry) - Node: Code (JS) - Purpose: collect ProductCodes from LLM products → build SOQL for PricebookEntry by Pricebook2Id - Output: { soql, codes } |
| Query PricebookEntries     | Salesforce (search)            | Query PricebookEntry records matching product codes | Build SOQL                  | Code in JavaScript           | ## 8) Salesforce: Query PricebookEntries - Node: salesforce (search) - query: ={{ $json.soql }}                          |
| Code in JavaScript         | Code (JavaScript)              | Build OpportunityLineItem payloads for creation  | Query PricebookEntries        | Create Opportunity Line Items| ## 9) Code: Build OLI Payloads - Node: Code (JS) - Inputs: OpportunityId, Lines, PBE rows - Output: { body: { allOrNone:false, records:[{ OpportunityLineItem... }] } } |
| Create Opportunity Line Items | HTTP Request (Salesforce API) | Batch create Opportunity Line Items in Salesforce | Code in JavaScript           |                              | ## 10) HTTP Request: Create Opportunity Line Items - Method: POST - URL: https://<your-instance>.my.salesforce.com/services/data/v65.0/composite/sobjects - Auth: salesforceOAuth2Api - Body (JSON): ={{ $json.body }} |
| Sticky Note                | Sticky Note                   | Documentation block                              |                              |                              | # PDF Invoice Extractor (AI) to Salesforce Opportunity\n\nWhat it does:\nWatch a Drive folder → OCR PDF → extract invoices (JSON) via LLM → mirror file to OneDrive → upsert Buyer to Salesforce → create Opportunity → add Opportunity Line Items from Pricebook.\n\n\n## Flow\n 1)Drive Trigger → 2) Download → 3) Extract → 4) → 5) Upsert Account → 6) Create Opportunity → 7) Build SOQL → 8) Query PBE → 9) Build OLI → 10) Create OLIs -> 11) OneDrive  \n\n\n## Outputs\n- LLM: normalized JSON array of invoices\n- Salesforce: Account (buyer), Opportunity, Line Items\n- OneDrive: original PDF archived\n\n## Quick Troubleshooting\n- Empty OCR → enable OCR in step 3\n- Non-JSON → enforce jsonOutput:true + strict prompt\n- Missing PBE → verify ProductCode matches Salesforce & Pricebook2Id\n- Auth errors → re-connect Google/OneDrive/Salesforce/OpenAI\n\n## Notes\n- Keep numbers as JSON numbers; dates YYYY-MM-DD\n- If fields missing, return null; log warnings in parsing.warnings\n- Replace hardcoded IDs (Pricebook2Id, OneDrive Folder, SF domain) with your values |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Google Drive Trigger node:**  
   - Type: Google Drive Trigger  
   - Event: `fileCreated`  
   - Folder to watch: set folder ID where invoices are uploaded  
   - Poll interval: every minute  
   - Credentials: Google Drive OAuth2 (set up with appropriate scopes and access to folder)  

2. **Add a Google Drive node to download files:**  
   - Type: Google Drive  
   - Operation: `download`  
   - File ID: from trigger output (`{{$json.id}}`)  
   - Credentials: Google Drive OAuth2 (same as above)  
   - Connect from Google Drive Trigger  

3. **Add Extract from File node:**  
   - Type: Extract from File  
   - Operation: `pdf`  
   - Enable OCR to support scanned documents  
   - Input: binary file from Google Drive download node  
   - Connect from Download File From Google  

4. **Add OpenAI GPT-4 node (Langchain OpenAI):**  
   - Type: @n8n/n8n-nodes-langchain.openAi  
   - Model: `gpt-4.1` or `gpt-4.1-mini`  
   - Messages:  
     - System prompt: use detailed strict JSON extraction prompt as described, instructing extraction of invoice fields into JSON array format  
   - Enable `jsonOutput` to parse response automatically  
   - Credentials: OpenAI API key with GPT-4 access  
   - Connect from Extract from File  

5. **Add Salesforce node to upsert Account:**  
   - Type: Salesforce  
   - Resource: `account`  
   - Operation: `upsert`  
   - External ID Field: `tax_id__c`  
   - External ID Value: `={{ $json.message.content.buyer.tax_id }}`  
   - Name: `={{ $json.message.content.buyer.name }}`  
   - Credentials: Salesforce OAuth2 (with access to Account object)  
   - Connect from OpenAI node  

6. **Add Salesforce node to create Opportunity:**  
   - Type: Salesforce  
   - Resource: `opportunity`  
   - Operation: `create`  
   - Name: `={{ $('Message a model').item.json.message.content.invoice.code }}`  
   - Close Date: `={{ $('Message a model').item.json.message.content.invoice.issue_date }}`  
   - Stage Name: `Closed Won`  
   - Amount: `={{ $('Message a model').item.json.message.content.summary.grand_total }}`  
   - AccountId: `={{ $json.id }}` (from upserted Account node)  
   - Credentials: Salesforce OAuth2  
   - Connect from Create or update an account node  

7. **Add a Code node to build SOQL for PricebookEntry query:**  
   - Type: Code (JavaScript)  
   - Purpose: Extract unique product codes from invoice, construct SOQL query string with hardcoded Pricebook2Id  
   - Store results as `{ soql, codes }`  
   - Connect from Create an opportunity node  

8. **Add Salesforce node to query PricebookEntries:**  
   - Type: Salesforce  
   - Resource: `search`  
   - Query: `={{ $json.soql }}`  
   - Credentials: Salesforce OAuth2  
   - Connect from Build SOQL node  

9. **Add a Code node to build OpportunityLineItem payloads:**  
   - Type: Code (JavaScript)  
   - Purpose:  
     - Use Opportunity ID from Create Opportunity node  
     - Use product lines from GPT-4 output  
     - Map product codes to PricebookEntry IDs from query results  
     - Create array of OpportunityLineItem records with Quantity, UnitPrice, OpportunityId, PricebookEntryId  
   - Output JSON body compatible with Salesforce composite batch insert API  
   - Connect from Query PricebookEntries node  

10. **Add HTTP Request node to create Opportunity Line Items:**  
    - Type: HTTP Request  
    - Method: POST  
    - URL: `https://<your-salesforce-domain>.my.salesforce.com/services/data/v65.0/composite/sobjects` (replace domain)  
    - Authentication: Salesforce OAuth2  
    - Body: JSON from previous code node (`{{$json.body}}`)  
    - Specify body type as JSON  
    - Connect from Code in JavaScript node  

11. **Connect Download File From Google output to Microsoft OneDrive node:**  
    - Type: Microsoft OneDrive  
    - Operation: Upload file to archive folder  
    - File Name: `={{ $json.name }}` from downloaded file metadata  
    - Parent Folder ID: configure your OneDrive folder ID  
    - Binary Data: set to the binary data from Google Drive download node  
    - Credentials: Microsoft OneDrive OAuth2  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                               | Context or Link                                                                                             |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| The workflow requires replacing placeholder IDs such as Pricebook2Id (`01sxxxxxxxxxxxxxxx`), OneDrive Folder ID (`folder_id_onedrive`), and Salesforce domain in HTTP Request URL with your organization's actual values.       | Critical customization step before deployment.                                                             |
| Troubleshooting tips include enabling OCR in Extract from File if no text is extracted, forcing strict JSON output in GPT-4 node, verifying product codes and Pricebook2Id consistency in Salesforce, and reconnecting all OAuth2 credentials upon auth errors. | See sticky note content in workflow for quick guidance.                                                    |
| The GPT-4 prompt enforces strict JSON output with a comprehensive invoice schema to avoid hallucination and ensure data quality, including normalization of dates, currencies, and numeric fields.                         | Prompt text is embedded in the "Message a model" node's system message parameter.                           |
| Salesforce API version used is v65.0 for composite sObjects in HTTP Request node for batch OpportunityLineItem creation.                                                                                                  | Update API version if your Salesforce environment requires it.                                             |
| This workflow is designed for multi-invoice PDFs and complex invoice layouts, splitting batches and handling line wrapping and discounts.                                                                                | See system prompt instructions in "Message a model" node for details.                                      |

---

**Disclaimer:** The text provided is derived solely from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All processed data is legal and public.

---