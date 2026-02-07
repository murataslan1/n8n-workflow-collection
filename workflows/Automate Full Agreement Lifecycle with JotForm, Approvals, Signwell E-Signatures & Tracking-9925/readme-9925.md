Automate Full Agreement Lifecycle with JotForm, Approvals, Signwell E-Signatures & Tracking

https://n8nworkflows.xyz/workflows/automate-full-agreement-lifecycle-with-jotform--approvals--signwell-e-signatures---tracking-9925


# Automate Full Agreement Lifecycle with JotForm, Approvals, Signwell E-Signatures & Tracking

### 1. Workflow Overview

This workflow automates the entire lifecycle of client agreements starting from form submission through JotForm, internal approval, document preparation, e-signature via Signwell, to final delivery and record-keeping. It targets service businesses or freelancers who regularly send agreements and want a fully automated, trackable process integrating form data, document generation, approval, and e-signature.

The workflow is organized into three main logical blocks:

- **1.1 Draft Creation and Internal Review**: Captures client data from JotForm, prepares a personalized Google Docs agreement draft, logs it internally, and sends an approval request email to the internal team.

- **1.2 Approval, PDF Conversion, and E-Signature Preparation**: Monitors for internal approval via email, converts the draft to PDF, uploads it, shares it temporarily for Signwell integration, creates a Signwell document with embedded signature fields, sends the signing link to the client, and updates internal records.

- **1.3 Signature Completion and Final Delivery**: Detects Signwell completion notification emails, extracts signed document links, downloads and uploads the signed PDF to Google Drive final folder, updates records, emails the client the signed agreement, and cleans up Signwell storage.

---

### 2. Block-by-Block Analysis

#### 2.1 Draft Creation and Internal Review

**Overview:**  
This block handles input reception via JotForm, extracts and standardizes client data, copies a Google Docs template to create a draft agreement, replaces placeholders with client info, logs the draft in an internal Data Table, and emails the internal team for approval.

**Nodes Involved:**  
- JotForm Trigger  
- Edit Fields  
- Copy and Rename File  
- Update New File  
- Get Clean Doc URL  
- Share Email Draft  
- Insert New Row  
- Sticky Note (for documentation)

**Node Details:**

- **JotForm Trigger**  
  - Type: Trigger node for JotForm form submissions  
  - Configuration: Watches form ID 252888042997475; uses JotForm API credentials  
  - Input: Client form submission  
  - Output: Raw form data  
  - Failure types: Webhook inactive, API auth failure  

- **Edit Fields**  
  - Type: Set node to normalize and structure form data  
  - Configuration: Extracts company name, address (concatenates multiple address fields), full client name (first + last), client job title, email, and form submission date (current date)  
  - Key expressions: JavaScript inline to format address and concatenate names  
  - Input: JotForm Trigger output  
  - Output: Structured client info JSON  
  - Failure types: Missing form fields, null values  

- **Copy and Rename File**  
  - Type: Google Drive node (copy operation)  
  - Configuration: Copies a Google Docs template file, renames it dynamically with client company name and date, saves it in "Services Agreements - Drafts" folder  
  - Input: Edited fields JSON (client info)  
  - Output: New Google Docs file metadata including new file ID and name  
  - Failure types: Drive permission error, invalid folder ID, template missing  

- **Update New File**  
  - Type: Google Docs node (update document)  
  - Configuration: Replaces placeholders (`{{clientCompanyName}}`, `{{clientFullName}}`, etc.) in the copied Google Doc with client-specific data and formatted dates  
  - Input: Copied file ID from previous node  
  - Output: Updated document metadata  
  - Failure types: Incorrect placeholder names, Google Docs API errors  

- **Get Clean Doc URL**  
  - Type: Set node  
  - Configuration: Constructs a clean Google Docs URL using the new document ID for easy access  
  - Input: Updated file metadata  
  - Output: JSON with `documentUrl` property  
  - Failure types: Document ID missing  

- **Share Email Draft**  
  - Type: Gmail node (send email)  
  - Configuration: Sends an email to the internal team to notify them the draft is ready for review and approval. Uses dynamic subject and message body with client and document details. Uses Gmail OAuth2 credentials.  
  - Input: Document URL and client info  
  - Output: Email sent confirmation  
  - Failure types: Gmail auth failure, invalid email, network issues  

- **Insert New Row**  
  - Type: n8n Data Table node (insert operation)  
  - Configuration: Inserts a new record to "Services Agreements" Data Table with client and document metadata including URL and file name, approval status initially empty  
  - Input: Client and document info  
  - Output: Inserted row metadata  
  - Failure types: Data Table access issues, schema mismatch  

- **Sticky Note (Documentation)**  
  - Contains an overview label: "Get Client Form Inputs > Create + Send Agreement Draft (Internally)"  

---

#### 2.2 Approval, PDF Conversion, and E-Signature Preparation

**Overview:**  
This block listens for internal approval emails, marks the record as approved, converts the Google Docs draft to PDF, uploads the PDF, grants temporary public sharing for Signwell, creates an embedded signing document in Signwell, sends the signing link to the client, revokes sharing, and updates Data Tables with e-signature details.

**Nodes Involved:**  
- Check for Email Approval  
- Get Relevant Agreement Record  
- Update Row - Approval Status  
- Download File as PDF  
- Upload PDF File  
- Grant Sharing Access to PDF File  
- Create Document in Signwell  
- Send Prepared Agreement to Client  
- Remove Sharing Access to PDF File  
- Update Row - Additional Doc Details  
- Sticky Note (documentation)

**Node Details:**

- **Check for Email Approval**  
  - Type: Gmail trigger node  
  - Configuration: Watches for emails from internal domain containing "Re: Approval Request: Draft" and word "Approved" in subject/body, filtered by label "Agreement-Approvals"  
  - Input: Incoming emails  
  - Output: Email metadata on approval  
  - Failure types: Gmail label misconfiguration, OAuth failure  

- **Get Relevant Agreement Record**  
  - Type: Data Table node (get operation)  
  - Configuration: Retrieves the agreement record matching the document file name parsed from approval email subject  
  - Input: Email approval data  
  - Output: Agreement record JSON  
  - Failure types: Missing record, matching errors  

- **Update Row - Approval Status**  
  - Type: Data Table node (update operation)  
  - Configuration: Updates the approvalStatus field to "Approved" for the matched agreement record  
  - Input: Agreement record  
  - Output: Updated record metadata  
  - Failure types: Data Table update errors  

- **Download File as PDF**  
  - Type: Google Drive node (download + conversion)  
  - Configuration: Downloads Google Docs draft file as PDF (binary data), using document URL from record  
  - Input: Approved record with document URL  
  - Output: PDF binary data  
  - Failure types: Conversion errors, Drive API errors  

- **Upload PDF File**  
  - Type: Google Drive node (upload operation)  
  - Configuration: Uploads the downloaded PDF to "Services Agreements - Drafts" folder, retaining file name  
  - Input: PDF binary from previous node  
  - Output: Uploaded file metadata including file ID and webViewLink  
  - Failure types: Upload failure, folder ID errors  

- **Grant Sharing Access to PDF File**  
  - Type: Google Drive node (share operation)  
  - Configuration: Grants public "reader" access to the uploaded PDF file to allow Signwell to fetch it  
  - Input: Uploaded PDF file ID  
  - Output: Sharing confirmation  
  - Failure types: Permission errors  

- **Create Document in Signwell**  
  - Type: HTTP Request node  
  - Configuration: Calls Signwell API to create a signing document in test mode with embedded signing enabled, attaches the Google Drive PDF URL, specifies recipient details, and signature/date fields coordinates for page 2  
  - Headers include API key  
  - Input: Shared PDF file metadata and agreement client info  
  - Output: Signwell document creation response including signing URL  
  - Failure types: API key invalid, malformed payload, network issues  

- **Send Prepared Agreement to Client**  
  - Type: Gmail node (send email)  
  - Configuration: Sends an email to the client with the embedded signing URL, personalized with client first name, using Gmail OAuth2  
  - Input: Signwell document recipient data  
  - Output: Email sent confirmation  
  - Failure types: Gmail auth failure, invalid client email  

- **Remove Sharing Access to PDF File**  
  - Type: HTTP Request node  
  - Configuration: Revokes public sharing permission on the PDF file in Google Drive for security after Signwell ingestion  
  - Input: PDF file ID  
  - Output: Confirmation of permission removal  
  - Failure types: Google Drive API permission errors  

- **Update Row - Additional Doc Details**  
  - Type: Data Table node (update operation)  
  - Configuration: Updates the agreement record with sentDate, Signwell URL, Signwell document ID, and PDF URL metadata  
  - Input: Signwell document response and PDF details  
  - Output: Updated record metadata  
  - Failure types: Data Table update errors  

- **Sticky Note (Documentation)**  
  - Content: "Get Internal Approval  >  Create Signwell Doc  >  Send Agreement to Client "  

---

#### 2.3 Signature Completion and Final Delivery

**Overview:**  
This block monitors Gmail for Signwell completion notifications, extracts the signed document download link from the email thread, downloads the signed PDF, uploads it to the final folder in Google Drive, updates the Data Table with completion status, sends the signed document to the client, and deletes the document from Signwell to free storage.

**Nodes Involved:**  
- Check Email for Completed Notification  
- Extract Full Email Thread - Completed Doc URL  
- Get Signwell Completed Doc URL + Data (Code node)  
- Download Completed Doc from Signwell  
- Upload Completed Doc  
- Get Relevant Agreement Record2  
- Update Row - Completed Doc Details  
- Merge Data  
- Send Client Completed Agreement PDF  
- Remove Completed Doc from Signwell  
- Sticky Note (documentation)

**Node Details:**

- **Check Email for Completed Notification**  
  - Type: Gmail trigger node  
  - Configuration: Watches emails from signwelldocs@signwell.com with subject containing "document completed (digital services agreement" filtered by label "Agreement-Completed"  
  - Input: Incoming Signwell completion notifications  
  - Output: Email thread metadata  
  - Failure types: Label misconfiguration, Gmail auth issues  

- **Extract Full Email Thread - Completed Doc URL**  
  - Type: Gmail node (get thread data)  
  - Configuration: Fetches full email thread by thread ID from notification email to capture all messages in the thread  
  - Input: Trigger email metadata  
  - Output: Complete thread messages JSON  
  - Failure types: Thread ID missing, Gmail API errors  

- **Get Signwell Completed Doc URL + Data (Code Node)**  
  - Type: Code node (JavaScript)  
  - Configuration: Parses the Gmail thread messages to extract the Signwell signed document download link using regex matching, decodes email content, extracts filename and message text  
  - Input: Email thread JSON  
  - Output: JSON with `downloadLink`, `extractedFilename`, and decoded text  
  - Failure types: Parsing errors, unexpected email format  

- **Download Completed Doc from Signwell**  
  - Type: HTTP Request node  
  - Configuration: Downloads the signed PDF from the extracted Signwell download link (file response)  
  - Input: Download link from previous node  
  - Output: Binary PDF data  
  - Failure types: Link invalid, network errors  

- **Upload Completed Doc**  
  - Type: Google Drive node (upload operation)  
  - Configuration: Uploads the signed PDF to "Services Agreements - Final Versions" folder, named using extracted filename with suffix "_SIGNED.pdf"  
  - Input: PDF binary data  
  - Output: Uploaded file metadata including webContentLink  
  - Failure types: Upload failure, folder ID errors  

- **Get Relevant Agreement Record2**  
  - Type: Data Table node (get operation)  
  - Configuration: Retrieves the original agreement record matching the extracted file name  
  - Input: Filename from signed doc upload  
  - Output: Agreement record JSON  
  - Failure types: Missing record  

- **Update Row - Completed Doc Details**  
  - Type: Data Table node (update operation)  
  - Configuration: Updates the record to mark document as signed, adds links to final executed Google Drive file and Signwell URL  
  - Input: Uploaded signed doc metadata and agreement record  
  - Output: Updated record metadata  
  - Failure types: Data Table update failure  

- **Merge Data**  
  - Type: Merge node  
  - Configuration: Combines data from updated agreement record and uploaded document info for downstream use  
  - Input: Data from updated row and uploaded document  
  - Output: Merged JSON  
  - Failure types: Data mismatch  

- **Send Client Completed Agreement PDF**  
  - Type: Gmail node (send email)  
  - Configuration: Sends the fully signed agreement PDF as attachment to the client email, personalized with client first name  
  - Input: Merged data including client email and signed PDF binary  
  - Output: Email sent confirmation  
  - Failure types: Gmail auth failure, attachment size limits  

- **Remove Completed Doc from Signwell**  
  - Type: HTTP Request node  
  - Configuration: Deletes the signed document from Signwell using stored Signwell document ID to free storage  
  - Headers include API key  
  - Input: Signwell document ID from record  
  - Output: Deletion confirmation  
  - Failure types: API auth failure, invalid document ID  

- **Sticky Note (Documentation)**  
  - Content: "Get Completed Signwell Doc Notification > Download & Store Completed Agreement > Share With Client"  

---

### 3. Summary Table

| Node Name                         | Node Type                 | Functional Role                                    | Input Node(s)                  | Output Node(s)                      | Sticky Note                                                                                                          |
|----------------------------------|---------------------------|---------------------------------------------------|-------------------------------|-----------------------------------|----------------------------------------------------------------------------------------------------------------------|
| JotForm Trigger                  | JotForm Trigger           | Trigger on client form submission                  | -                             | Edit Fields                       | Get Client Form Inputs > Create + Send Agreement Draft (Internally)                                                  |
| Edit Fields                     | Set                       | Normalize and extract client data                   | JotForm Trigger               | Copy and Rename File              | Get Client Form Inputs > Create + Send Agreement Draft (Internally)                                                  |
| Copy and Rename File            | Google Drive              | Copy template and rename for new draft              | Edit Fields                  | Update New File                  | Get Client Form Inputs > Create + Send Agreement Draft (Internally)                                                  |
| Update New File                 | Google Docs               | Replace placeholders with client data               | Copy and Rename File          | Get Clean Doc URL                | Get Client Form Inputs > Create + Send Agreement Draft (Internally)                                                  |
| Get Clean Doc URL               | Set                       | Construct clean document URL                         | Update New File              | Share Email Draft, Insert New Row | Get Client Form Inputs > Create + Send Agreement Draft (Internally)                                                  |
| Share Email Draft               | Gmail                     | Email internal team for draft approval              | Get Clean Doc URL            | -                               | Get Client Form Inputs > Create + Send Agreement Draft (Internally)                                                  |
| Insert New Row                  | Data Table                | Log draft agreement record internally               | Get Clean Doc URL            | -                               | Get Client Form Inputs > Create + Send Agreement Draft (Internally)                                                  |
| Check for Email Approval        | Gmail Trigger             | Monitor internal approval emails                     | -                           | Get Relevant Agreement Record     | Get Internal Approval  >  Create Signwell Doc  >  Send Agreement to Client                                            |
| Get Relevant Agreement Record   | Data Table                | Retrieve agreement record by file name               | Check for Email Approval      | Update Row - Approval Status       | Get Internal Approval  >  Create Signwell Doc  >  Send Agreement to Client                                            |
| Update Row - Approval Status    | Data Table                | Update approval status to "Approved"                 | Get Relevant Agreement Record | Download File as PDF              | Get Internal Approval  >  Create Signwell Doc  >  Send Agreement to Client                                            |
| Download File as PDF            | Google Drive              | Export Google Doc to PDF format                       | Update Row - Approval Status  | Upload PDF File                  | Get Internal Approval  >  Create Signwell Doc  >  Send Agreement to Client                                            |
| Upload PDF File                | Google Drive              | Upload the generated PDF draft                        | Download File as PDF          | Grant Sharing Access to PDF File  | Get Internal Approval  >  Create Signwell Doc  >  Send Agreement to Client                                            |
| Grant Sharing Access to PDF File| Google Drive              | Grant public read access for Signwell ingestion      | Upload PDF File              | Create Document in Signwell      | Get Internal Approval  >  Create Signwell Doc  >  Send Agreement to Client                                            |
| Create Document in Signwell    | HTTP Request              | Create Signwell e-signature document with embedded fields | Grant Sharing Access to PDF File | Send Prepared Agreement to Client, Remove Sharing Access to PDF File, Update Row - Additional Doc Details | Get Internal Approval  >  Create Signwell Doc  >  Send Agreement to Client                                            |
| Send Prepared Agreement to Client| Gmail                   | Send client email with signing link                  | Create Document in Signwell  | -                               | Get Internal Approval  >  Create Signwell Doc  >  Send Agreement to Client                                            |
| Remove Sharing Access to PDF File| HTTP Request             | Revoke public sharing on PDF after Signwell import   | Create Document in Signwell  | -                               | Get Internal Approval  >  Create Signwell Doc  >  Send Agreement to Client                                            |
| Update Row - Additional Doc Details| Data Table             | Update record with Signwell and PDF metadata         | Create Document in Signwell  | -                               | Get Internal Approval  >  Create Signwell Doc  >  Send Agreement to Client                                            |
| Check Email for Completed Notification| Gmail Trigger        | Monitor for Signwell document completed emails       | -                           | Extract Full Email Thread - Completed Doc URL | Get Completed Signwell Doc Notification > Download & Store Completed Agreement > Share With Client                  |
| Extract Full Email Thread - Completed Doc URL | Gmail       | Retrieve full email thread for signed document link | Check Email for Completed Notification | Get Signwell Completed Doc URL + Data | Get Completed Signwell Doc Notification > Download & Store Completed Agreement > Share With Client                  |
| Get Signwell Completed Doc URL + Data| Code (JavaScript)     | Parse email thread to extract signed document URL   | Extract Full Email Thread - Completed Doc URL | Download Completed Doc from Signwell | Get Completed Signwell Doc Notification > Download & Store Completed Agreement > Share With Client                  |
| Download Completed Doc from Signwell| HTTP Request           | Download signed PDF from Signwell                     | Get Signwell Completed Doc URL + Data | Upload Completed Doc             | Get Completed Signwell Doc Notification > Download & Store Completed Agreement > Share With Client                  |
| Upload Completed Doc            | Google Drive              | Upload signed PDF to final folder                     | Download Completed Doc from Signwell | Get Relevant Agreement Record2    | Get Completed Signwell Doc Notification > Download & Store Completed Agreement > Share With Client                  |
| Get Relevant Agreement Record2  | Data Table                | Retrieve original agreement record by file name      | Upload Completed Doc          | Update Row - Completed Doc Details, Merge Data | Get Completed Signwell Doc Notification > Download & Store Completed Agreement > Share With Client                  |
| Update Row - Completed Doc Details| Data Table             | Mark agreement as signed and add final document URLs | Get Relevant Agreement Record2 | Remove Completed Doc from Signwell | Get Completed Signwell Doc Notification > Download & Store Completed Agreement > Share With Client                  |
| Merge Data                     | Merge                     | Combine updated record and uploaded signed doc data  | Update Row - Completed Doc Details, Download Completed Doc from Signwell | Send Client Completed Agreement PDF | Get Completed Signwell Doc Notification > Download & Store Completed Agreement > Share With Client                  |
| Send Client Completed Agreement PDF| Gmail                  | Email the fully signed agreement PDF to client       | Merge Data                   | -                               | Get Completed Signwell Doc Notification > Download & Store Completed Agreement > Share With Client                  |
| Remove Completed Doc from Signwell| HTTP Request           | Delete signed document from Signwell to free storage | Update Row - Completed Doc Details | -                               | Get Completed Signwell Doc Notification > Download & Store Completed Agreement > Share With Client                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create JotForm Trigger node**  
   - Node Type: JotForm Trigger  
   - Configure with your JotForm API credentials  
   - Select the form ID that captures client agreement data (must include fields: Company Name, Company Address, Full Name, Position, Email)  

2. **Add Set node "Edit Fields"**  
   - Extract and normalize form fields: company name, full client name (concatenate first and last names), full company address (concatenate address lines), client job title, client email, form submission date (current date)  
   - Use JavaScript expressions to format address and names as in the workflow  

3. **Add Google Drive node "Copy and Rename File"**  
   - Operation: Copy file  
   - Credentials: Google Drive OAuth2  
   - Source file: Your Google Docs template for the agreement  
   - Destination folder: Your "Services Agreements - Drafts" folder ID  
   - New file name: Use expression to include client company name and current date (e.g., `Digital Services Agreement - {{clientCompanyName}} - {{formCompletedDate}} - Ref-{{timestamp}}`)  

4. **Add Google Docs node "Update New File"**  
   - Operation: Update document with replaceAll actions  
   - Replace template placeholders (`{{clientCompanyName}}`, `{{clientFullName}}`, `{{clientNamePosition}}`, `{{clientCompanyAddress}}`, `{{agreementDate1}}`, `{{agreementDate2}}`) with corresponding client data  
   - Credentials: Google Docs OAuth2  
   - Document URL/ID: from copied file output  

5. **Add Set node "Get Clean Doc URL"**  
   - Construct clean Google Docs URL using document ID from updated file, e.g., `https://docs.google.com/document/d/{{documentId}}`  

6. **Add Gmail node "Share Email Draft"**  
   - Send to your internal approval email  
   - Subject: Include dynamic draft name  
   - Body: Include draft URL and client details, instruct to reply "Approved" to proceed  
   - Credentials: Gmail OAuth2  

7. **Add Data Table node "Insert New Row"**  
   - Insert a new record into your "Services Agreements" Data Table  
   - Fields: clientEmail, documentUrl, clientFullName, documentFileName, clientCompanyName, clientNamePosition, clientCompanyAddress  

8. **Add Gmail Trigger node "Check for Email Approval"**  
   - Watch your inbox for emails from internal domain with subject containing "Re: Approval Request: Draft" and the keyword "Approved"  
   - Filter by label "Agreement-Approvals"  

9. **Add Data Table node "Get Relevant Agreement Record"**  
   - Retrieve record matching document file name parsed from approval email subject  

10. **Add Data Table node "Update Row - Approval Status"**  
    - Update `approvalStatus` to "Approved" for matched record  

11. **Add Google Drive node "Download File as PDF"**  
    - Download Google Doc draft as PDF binary  
    - Use document URL from approved record  

12. **Add Google Drive node "Upload PDF File"**  
    - Upload the PDF to "Services Agreements - Drafts" folder  
    - Keep the original file name  

13. **Add Google Drive node "Grant Sharing Access to PDF File"**  
    - Share the uploaded PDF publicly with "reader" permission to allow Signwell to access  

14. **Add HTTP Request node "Create Document in Signwell"**  
    - POST to https://www.signwell.com/api/v1/documents/  
    - Headers: Content-Type application/json, X-Api-Key your Signwell API key  
    - Body: JSON including test_mode true (disable for production), embedded signing enabled, file URL from shared PDF, recipient info from agreement record, signature and date field coordinates on page 2  
    - Enable sending headers and JSON body  

15. **Add Gmail node "Send Prepared Agreement to Client"**  
    - Email client with personalized signing URL from Signwell document response  
    - Use Gmail OAuth2  

16. **Add HTTP Request node "Remove Sharing Access to PDF File"**  
    - DELETE public sharing permission on the PDF file after Signwell document creation  

17. **Add Data Table node "Update Row - Additional Doc Details"**  
    - Update agreement record with Signwell document ID, signing URL, PDF URL, and sent date  

18. **Add Gmail Trigger node "Check Email for Completed Notification"**  
    - Monitor emails from signwelldocs@signwell.com containing "document completed (digital services agreement"  
    - Filter by label "Agreement-Completed"  

19. **Add Gmail node "Extract Full Email Thread - Completed Doc URL"**  
    - Retrieve full thread by thread ID from notification email  

20. **Add Code node "Get Signwell Completed Doc URL + Data"**  
    - Parse email thread to find first Signwell signed document URL and extract the filename  

21. **Add HTTP Request node "Download Completed Doc from Signwell"**  
    - Download signed PDF from extracted Signwell link  

22. **Add Google Drive node "Upload Completed Doc"**  
    - Upload signed PDF to "Services Agreements - Final Versions" folder  
    - Name file as extracted filename + "_SIGNED.pdf"  

23. **Add Data Table node "Get Relevant Agreement Record2"**  
    - Retrieve agreement record matching extracted filename  

24. **Add Data Table node "Update Row - Completed Doc Details"**  
    - Mark document signed, add final Google Drive link and Signwell URL  

25. **Add Merge node "Merge Data"**  
    - Combine updated record and uploaded file data for email sending  

26. **Add Gmail node "Send Client Completed Agreement PDF"**  
    - Email client with signed agreement PDF attached  
    - Use client email from merged data  

27. **Add HTTP Request node "Remove Completed Doc from Signwell"**  
    - Delete the signed document from Signwell via document ID to free space  

28. **Activate workflow**  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Context or Link                                                                                                  |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| This workflow automates the entire agreement lifecycle from client form to signed document delivery, including internal approvals and e-signature integration with Signwell. It is designed for service providers who want to streamline contract handling without manual intervention or costly platforms.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Workflow overview and target user description                                                                    |
| Signwell integration is configured in test mode by default — switch `"test_mode": true` to `false` in the "Create Document in Signwell" node when ready for live signing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Signwell API usage instructions                                                                                   |
| Requires JotForm for form input, Gmail OAuth2 for email communication, Google Drive and Docs OAuth2 for document handling, Signwell API key for e-signature.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Credentials setup                                                                                                 |
| Google Drive folders "Services Agreements - Drafts" and "Services Agreements - Final Versions" must exist and folder IDs updated in respective nodes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Folder structure requirement                                                                                       |
| Requires creation of Gmail labels: "_AGREEMENTS" with nested "Agreement-Approvals" and "Agreement-Completed" for filtering approval and signed document emails.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Gmail label setup                                                                                                |
| Template Google Doc must include variables exactly matching placeholders used in "Update New File" node: `{{clientCompanyName}}`, `{{clientFullName}}`, `{{clientNamePosition}}`, `{{clientCompanyAddress}}`, `{{agreementDate1}}`, `{{agreementDate2}}`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Template preparation                                                                                              |
| Troubleshooting tips include checking webhook activation, Gmail label correctness, OAuth credential validity, and Signwell API key correctness. Signature field coordinates in Signwell may require adjustment based on template layout.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Sticky note "Quick Troubleshooting"                                                                              |
| Sample files and screenshots provided in sticky notes demonstrate expected outputs: Google Docs draft files, uploaded PDFs, and final signed agreements.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Sample outputs and file references: [Template](https://docs.google.com/document/d/1Nz2sAkDiIxMylzec7vNqOwjP2RRIeV8VOip4UWh2JD8/edit?usp=sharing), [Signed sample](https://drive.google.com/file/d/1zV4iQ1SDiofNQ9fNXWSABa7-ki0Txhvz/view?usp=sharing) |
| For multi-signer workflows or additional fields, modify the Signwell document creation JSON accordingly. Add reminder emails or Slack notifications as needed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Customization suggestions                                                                                         |

---

**Disclaimer:** The text provided is exclusively derived from an automated n8n workflow and complies with current content policies. It contains no illegal, offensive, or protected elements. All processed data is legal and public.