Automate Receipt Processing for Expense Tracking with Google Drive, VLM Run & Airtable

https://n8nworkflows.xyz/workflows/automate-receipt-processing-for-expense-tracking-with-google-drive--vlm-run---airtable-8393


# Automate Receipt Processing for Expense Tracking with Google Drive, VLM Run & Airtable

### 1. Workflow Overview

This workflow automates the processing of expense receipts to streamline business or personal finance tracking. It continuously monitors a specified Google Drive folder for new receipt files (images or PDFs), downloads them, uses the VLM Run AI service to extract structured data (merchant, amount, date, currency, customer info), and then stores the parsed data into an Airtable base for easy tracking and reporting.

**Use Cases:**

- Business expense reporting automation  
- Personal finance and travel expense management  
- Accounting data entry automation  

**Logical Blocks:**

- **1.1 Input Reception:** Detect new receipt uploads in a designated Google Drive folder and download the files.  
- **1.2 AI Processing:** Send downloaded receipt files to the VLM Run AI node for data extraction.  
- **1.3 Data Formatting:** Transform raw AI response into structured fields matching the Airtable schema.  
- **1.4 Storage:** Save the structured receipt data as new records in an Airtable base.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  Continuously watches a specific Google Drive folder for newly uploaded receipt files and downloads them for processing.

- **Nodes Involved:**  
  - Monitor Receipt Uploads  
  - Download Receipt File

- **Node Details:**

  - **Monitor Receipt Uploads**  
    - *Type:* Google Drive Trigger  
    - *Role:* Watches a specified folder in Google Drive and triggers the workflow each time a new file is created.  
    - *Configuration:*  
      - Watches folder with ID `1reWORwI1tMa-eGB75NCXq9eRw4CiQIhX`  
      - Polls every minute to detect new files  
      - Triggers on file creation event only  
    - *Inputs:* None (trigger node)  
    - *Outputs:* Passes metadata of the new file (including file ID)  
    - *Potential Failures:*  
      - Authentication errors if Google Drive OAuth2 token expires or is revoked  
      - API quota limits on polling frequency  
      - Folder ID misconfiguration leading to missed files  

  - **Download Receipt File**  
    - *Type:* Google Drive  
    - *Role:* Downloads the actual file content of the newly uploaded receipt using the file ID from the trigger.  
    - *Configuration:*  
      - File ID dynamically set from previous node’s `$json.id`  
      - Downloads file binary data into property named `data`  
    - *Inputs:* File metadata (file ID)  
    - *Outputs:* Binary file data for AI processing  
    - *Potential Failures:*  
      - File access permission issues (if file is restricted)  
      - Network or API timeouts  
      - Unsupported file formats (though all supported formats are handled downstream)  

#### 1.2 AI Processing

- **Overview:**  
  Sends the downloaded receipt file to the VLM Run AI node that extracts key receipt data fields.

- **Nodes Involved:**  
  - VLM Run Receipt Parser

- **Node Details:**

  - **VLM Run Receipt Parser**  
    - *Type:* VLM Run AI Node  
    - *Role:* Uses AI-powered OCR and document recognition to parse receipt images or PDFs.  
    - *Configuration:*  
      - Domain set to `document.receipt` to signal receipt-specific extraction model  
      - Uses VLM Run API credentials  
    - *Inputs:* Binary file data from Download Receipt File node  
    - *Outputs:* JSON with extracted fields: `merchant_name`, `customer_name`, `total`, `currency`, `transaction_date`  
    - *Potential Failures:*  
      - API authentication failures or quota limits  
      - Poor image quality leading to inaccurate extraction  
      - Unsupported receipt formats or highly unusual layouts  
      - Timeout if files are large or processing is slow  

#### 1.3 Data Formatting

- **Overview:**  
  Transforms the raw AI response into a clean, structured format with fields aligned to Airtable columns.

- **Nodes Involved:**  
  - Format Receipt Data

- **Node Details:**

  - **Format Receipt Data**  
    - *Type:* Set Node  
    - *Role:* Extracts and renames relevant fields from the AI response, preparing the data to match Airtable’s schema.  
    - *Configuration:*  
      - Sets new fields: Customer, Merchant, Amount, Currency, Date, each mapped from `$json.response` properties.  
      - Keeps only these set fields, discarding any other data to ensure clean output.  
    - *Inputs:* JSON from VLM Run Receipt Parser  
    - *Outputs:* Structured JSON fields ready for Airtable insertion  
    - *Potential Failures:*  
      - Missing or null fields if AI extraction fails partially  
      - Date formatting issues if the date is in unexpected format  

#### 1.4 Storage

- **Overview:**  
  Creates a new record in an Airtable base and table, storing the structured receipt data for future use.

- **Nodes Involved:**  
  - Create a record

- **Node Details:**

  - **Create a record**  
    - *Type:* Airtable  
    - *Role:* Adds a new record to an Airtable table with all receipt details.  
    - *Configuration:*  
      - Uses Airtable OAuth2 credentials  
      - Base ID: `appuQQOmev4FlXUlz` (Receipt Data base)  
      - Table ID: `tblAlP7xMFINzScRN` (Tasks table)  
      - Maps fields: Date, Amount, Currency, Customer, Merchant  
      - Field types respected: Date as datetime, Amount as number, Currency as number (note: Currency field type is number but usually stored as text or single select — double-check schema)  
    - *Inputs:* Structured JSON from Format Receipt Data  
    - *Outputs:* Confirmation of record creation (record ID)  
    - *Potential Failures:*  
      - Authentication errors with Airtable OAuth2  
      - Field type mismatches causing record creation failure  
      - Airtable API rate limits or downtime  

---

### 3. Summary Table

| Node Name              | Node Type                           | Functional Role                          | Input Node(s)          | Output Node(s)        | Sticky Note                                                                                          |
|------------------------|-----------------------------------|----------------------------------------|-----------------------|-----------------------|----------------------------------------------------------------------------------------------------|
| 🧾 Workflow Overview   | Sticky Note                       | Provides high-level workflow overview  | None                  | None                  | Overview of receipt processing workflow purpose, features, and requirements                         |
| 📁 Input Processing Documentation | Sticky Note                       | Documents input reception logic        | None                  | None                  | Details on monitoring Google Drive folder and supported receipt formats                            |
| 🤖 AI Extraction Documentation | Sticky Note                       | Documents AI extraction logic          | None                  | None                  | Explains VLM Run AI extraction capabilities and outputs                                           |
| 📊 Storage Documentation | Sticky Note                       | Documents Airtable storage              | None                  | None                  | Explains Airtable field mappings and data types                                                   |
| Monitor Receipt Uploads | Google Drive Trigger              | Triggers workflow on new Drive files   | None                  | Download Receipt File  | Monitors Google Drive folder for new receipt uploads and triggers processing automatically         |
| Download Receipt File   | Google Drive                     | Downloads receipt files from Drive     | Monitor Receipt Uploads | VLM Run Receipt Parser | Downloads receipt files from Google Drive for AI processing                                        |
| VLM Run Receipt Parser  | VLM Run AI Node                  | Extracts receipt data using AI          | Download Receipt File  | Format Receipt Data    | Uses VLM AI to extract merchant name, amount, currency, and date from receipt images               |
| Format Receipt Data     | Set                             | Formats extracted data for Airtable    | VLM Run Receipt Parser | Create a record        | Transforms AI-extracted receipt data into clean, structured format for spreadsheet storage          |
| Create a record        | Airtable                        | Stores receipt data as new Airtable record | Format Receipt Data    | None                  | Saves parsed receipt data into Airtable base and table, mapping extracted fields accordingly        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Sticky Notes** (optional but recommended for documentation):  
   - Add four sticky notes with the same content as in the workflow’s documentation nodes:  
     - Workflow Overview  
     - Input Processing Documentation  
     - AI Extraction Documentation  
     - Storage Documentation  

2. **Create Google Drive Trigger node ("Monitor Receipt Uploads"):**  
   - Node Type: Google Drive Trigger  
   - Authentication: Configure Google Drive OAuth2 credentials with access to your Drive  
   - Trigger event: `fileCreated`  
   - Poll interval: every 1 minute  
   - Folder to watch: Set the folder ID where receipts will be uploaded (e.g., `1reWORwI1tMa-eGB75NCXq9eRw4CiQIhX`)  
   - Save the node.

3. **Create Google Drive node ("Download Receipt File"):**  
   - Node Type: Google Drive  
   - Operation: `download`  
   - File ID: Set to expression `{{$json["id"]}}` from the trigger node’s output  
   - Binary Property Name: `data`  
   - Authentication: Use the same Google Drive OAuth2 credentials as above  
   - Connect input from "Monitor Receipt Uploads" node.

4. **Create VLM Run AI node ("VLM Run Receipt Parser"):**  
   - Node Type: VLM Run (requires installing VLM Run integration)  
   - Domain: Set to `document.receipt` to specify receipt extraction AI model  
   - Authentication: Configure with your VLM Run API credentials  
   - Connect input from "Download Receipt File" node so it receives the binary file data.

5. **Create Set node ("Format Receipt Data"):**  
   - Node Type: Set  
   - Keep only set fields: Enabled  
   - Add the following fields with expressions from VLM Run output (`$json.response`):  
     - Customer → `{{$json["response"]["customer_name"]}}`  
     - Merchant → `{{$json["response"]["merchant_name"]}}`  
     - Amount → `{{$json["response"]["total"]}}`  
     - Currency → `{{$json["response"]["currency"]}}`  
     - Date → `{{$json["response"]["transaction_date"]}}`  
   - Connect input from "VLM Run Receipt Parser".

6. **Create Airtable node ("Create a record"):**  
   - Node Type: Airtable  
   - Operation: Create  
   - Authentication: Configure Airtable OAuth2 credentials using a personal access token with write access  
   - Base: Select your Airtable base where receipts will be stored (e.g., Receipt Data base)  
   - Table: Select appropriate table (e.g., Tasks)  
   - Map fields:  
     - Date → `{{$json["Date"]}}` (ensure field type in Airtable is date/time)  
     - Amount → `{{$json["Amount"]}}` (number or currency type)  
     - Currency → `{{$json["Currency"]}}` (consider changing Airtable field type to single select or text if needed)  
     - Customer → `{{$json["Customer"]}}` (text)  
     - Merchant → `{{$json["Merchant"]}}` (text)  
   - Connect input from "Format Receipt Data".

7. **Test the workflow:**  
   - Upload a receipt file (image or PDF) to the monitored Google Drive folder  
   - Verify the workflow triggers, downloads the file, extracts data, and creates a record in Airtable  
   - Adjust field mappings or formatting as necessary based on actual AI output and Airtable schema

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                                                                         |
|----------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| VLM Run API documentation: https://vlm.run/docs/                                                    | Official documentation for configuring and using VLM Run AI                                           |
| Airtable API and OAuth2 setup guide: https://airtable.com/api                                      | For creating personal access tokens and managing API keys                                            |
| Google Drive API quota and best practices: https://developers.google.com/drive/api/v3/handle-errors | Important to avoid quota errors when polling and downloading files frequently                         |
| This workflow supports JPG, PNG, WEBP images and PDF receipts including those taken by mobile cameras | Ensures broad compatibility for receipt uploads                                                       |

---

**Disclaimer:** The text provided is exclusively generated from an automated n8n workflow. The process complies strictly with content policies, containing no illegal, offensive, or protected material. All data handled is legal and publicly available.