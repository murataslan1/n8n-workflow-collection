Automate Employee Reimbursement Workflow with Gmail, Google Drive & AI Validation

https://n8nworkflows.xyz/workflows/automate-employee-reimbursement-workflow-with-gmail--google-drive---ai-validation-7271


# Automate Employee Reimbursement Workflow with Gmail, Google Drive & AI Validation

### 1. Workflow Overview

This n8n workflow automates the employee reimbursement claim process by integrating form submission, Google Drive file management, AI-based validation, and email notifications via Gmail. It is designed to handle expense claims by employees, validate the uploaded bills against claimed amounts, and notify users and finance teams accordingly. The workflow comprises the following logical blocks:

- **1.1 Input Reception:** Captures reimbursement claim details via a web form.
- **1.2 Bill File Validation and Management:** Checks if uploaded bills already exist in Google Drive; uploads new bills or downloads existing ones.
- **1.3 AI Content Extraction and Validation:** Uses OpenAI to extract and structure billing information from uploaded receipts and compares claimed amounts to actual billed amounts.
- **1.4 Claim Decision and Notification:** Determines validity of claims and sends appropriate email notifications to employees and the finance department.
- **1.5 Record Keeping:** Logs valid reimbursement requests into a Google Sheet for tracking and further processing.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Input Reception

**Overview:**  
Receives reimbursement request details submitted by employees through a custom web form, capturing personal data, claim details, and uploaded bill files.

**Nodes Involved:**  
- On form submission  
- Search_Bill  
- Merge

**Node Details:**  

- **On form submission**  
  - *Type:* Form Trigger  
  - *Role:* Entry point capturing employee reimbursement data including employee name, ID, email, claim amount, nature of bill, and uploaded bill file(s).  
  - *Configuration:* Custom form with required fields; supports file upload (.jpg, .png, .pdf). Confirmation message sent to user after submission.  
  - *Key expressions:* Uses form data fields directly in downstream nodes via `$json`.  
  - *Input:* External user form submission (webhook).  
  - *Output:* Form data including file metadata.  
  - *Potential failures:* Missing required fields or file upload failures.  

- **Search_Bill**  
  - *Type:* Google Drive (File Search)  
  - *Role:* Checks if the uploaded bill file already exists in a specific Google Drive folder (“Reimburse Bills”).  
  - *Configuration:* Searches by filename in a designated folder; retrieves file ID, name, and web view link.  
  - *Input:* Filename from form submission node.  
  - *Output:* Search result with file metadata or empty if no match.  
  - *Potential failures:* Google Drive API quota limits, connectivity issues.  
  - *On error:* Continues workflow even if search fails (to allow upload of new bill).  

- **Merge**  
  - *Type:* Merge (choose branch mode)  
  - *Role:* Combines two branches for further processing depending on whether bill exists or not.  
  - *Configuration:* Uses the output of Search_Bill and the form submission data.  
  - *Input:* Two branches: existing bill found or not found.  
  - *Output:* Merged data flow for next steps.  
  - *Potential failures:* Branching logic errors if inputs are missing or misaligned.

---

#### 1.2 Bill File Validation and Management

**Overview:**  
Determines whether the uploaded bill exists and manages file upload or download accordingly for further processing.

**Nodes Involved:**  
- if Bill Exists  
- Download Existing Bill  
- Upload_Bills  
- Download_Bills  
- Merge

**Node Details:**  

- **if Bill Exists**  
  - *Type:* If Node  
  - *Role:* Conditional check comparing the filename from Google Drive search with the uploaded file name to decide if bill exists.  
  - *Configuration:* Checks strict equality of filenames.  
  - *Input:* Search_Bill results and form submission file metadata.  
  - *Output:* Two branches: True (bill exists), False (bill does not exist).  
  - *Potential failures:* Filename mismatches due to case sensitivity or naming variations.  

- **Download Existing Bill**  
  - *Type:* Google Drive (Download)  
  - *Role:* Downloads the existing bill file from Google Drive for OCR and validation.  
  - *Configuration:* Uses file ID from the if Bill Exists True branch.  
  - *Input:* File ID from Google Drive search.  
  - *Output:* Binary file content for downstream nodes.  
  - *Potential failures:* Download failures due to permissions or connectivity.  

- **Upload_Bills**  
  - *Type:* Google Drive (Upload)  
  - *Role:* Uploads the user's newly submitted bill file to the designated Google Drive folder.  
  - *Configuration:* Uploads the binary file from form submission to “Reimburse Bills” folder.  
  - *Input:* Binary file from Merge node (False branch of if Bill Exists).  
  - *Output:* Metadata including file ID and web view link.  
  - *Potential failures:* Upload failures due to file size limits or auth issues.  

- **Download_Bills**  
  - *Type:* Google Drive (Download)  
  - *Role:* Downloads the newly uploaded bill file to ensure consistent processing downstream.  
  - *Configuration:* Uses uploaded file ID.  
  - *Input:* Uploaded file metadata from Upload_Bills.  
  - *Output:* Binary file content.  
  - *Potential failures:* Download issues similar to Download Existing Bill.  

- **Merge** (previously mentioned)  
  - *Role:* Integrates the flow such that whether the bill exists or is newly uploaded, the binary file is passed forward for analysis.

---

#### 1.3 AI Content Extraction and Validation

**Overview:**  
Uses AI (OpenAI) to extract structured billing data from the uploaded receipt binary and validates the claim by comparing extracted total with claimed amount.

**Nodes Involved:**  
- MergeInputs  
- Validate False Claims

**Node Details:**  

- **MergeInputs**  
  - *Type:* OpenAI (LangChain integration)  
  - *Role:* Processes the downloaded binary file via AI to extract relevant receipt data and formats it as JSON.  
  - *Configuration:* Sends prompt to OpenAI GPT-4o-mini model with instructions to create structured JSON containing employee details, bill type, claimed amount, total bill extracted from receipt, and file link.  
  - *Input:* Binary file from download nodes, plus form submission data.  
  - *Output:* JSON string with structured billing data.  
  - *Potential failures:* AI API quota limits, misinterpretation of receipt content, incomplete extraction.  

- **Validate False Claims**  
  - *Type:* Code (JavaScript)  
  - *Role:* Parses JSON output from AI, compares claimed amount vs extracted total bill to detect mismatches (false claims).  
  - *Configuration:* Returns boolean flag `isFalseClaim` and attaches a generated unique request ID combining employee ID and random alphanumeric string.  
  - *Input:* JSON from MergeInputs.  
  - *Output:* JSON with claim validity flag and receipt content.  
  - *Potential failures:* JSON parsing errors, logic errors in claim comparison.  

---

#### 1.4 Claim Decision and Notification

**Overview:**  
Routes claims based on validation results, sending either rejection or acceptance emails to employees and logging valid claims.

**Nodes Involved:**  
- If (on isFalseClaim)  
- Mail Invalid Claim  
- Add Request  
- Mail Valid Claim

**Node Details:**  

- **If**  
  - *Type:* If Node  
  - *Role:* Routes workflow based on the `isFalseClaim` boolean from Validate False Claims.  
  - *Configuration:* Checks if `isFalseClaim` is true to determine next path.  
  - *Input:* Output of Validate False Claims.  
  - *Output:* Two branches: True (invalid claim), False (valid claim).  
  - *Potential failures:* Logic errors, missing property errors if upstream nodes fail.  

- **Mail Invalid Claim**  
  - *Type:* Gmail (Send Email)  
  - *Role:* Notifies employee their claim is invalid with details and requests resubmission; CCs finance team.  
  - *Configuration:*  
    - Recipient: Employee email from form submission.  
    - Subject includes claimed amount.  
    - Email body details claimed amount, total bill from receipt, bill type, and uploaded file name.  
  - *Input:* Invalid claim branch from If node.  
  - *Output:* Email sent confirmation.  
  - *Potential failures:* Gmail API limits, OAuth credential issues.  

- **Add Request**  
  - *Type:* Google Sheets (Append Row)  
  - *Role:* Logs valid reimbursement requests into a Google Sheet for record keeping and further approvals.  
  - *Configuration:* Appends a row with request ID, employee details, claim info, timestamps, receipt link, and approval status defaulted to "No".  
  - *Input:* Valid claim branch from If node.  
  - *Output:* Confirmation of sheet update.  
  - *Potential failures:* Google Sheets API quota, permission issues.  

- **Mail Valid Claim**  
  - *Type:* Gmail (Send Email)  
  - *Role:* Sends confirmation email to employee with request ID and claim summary; CCs finance team.  
  - *Configuration:*  
    - Recipient: Employee email.  
    - Subject includes claimed amount and request ID.  
    - Email body confirms receipt and review status.  
  - *Input:* Output of Add Request node.  
  - *Output:* Email sent confirmation.  
  - *Potential failures:* Similar to Mail Invalid Claim.

---

#### 1.5 Record Keeping

**Overview:**  
Maintains a centralized Google Sheet to track reimbursement requests, their statuses, and details for finance processing.

**Nodes Involved:**  
- Add Request  

**Node Details:**  

- **Add Request** (detailed above)  
  - *Role:* Stores reimbursement requests with key fields such as RequestID, Employee ID, Name, Bill Type, Total Billed Amount, timestamps, receipt link, and approval status.  

---

### 3. Summary Table

| Node Name           | Node Type                         | Functional Role                                  | Input Node(s)                       | Output Node(s)                      | Sticky Note                                                                                  |
|---------------------|----------------------------------|-------------------------------------------------|-----------------------------------|-----------------------------------|----------------------------------------------------------------------------------------------|
| On form submission   | Form Trigger                     | Capture employee reimbursement form data       | (Webhook trigger)                 | Search_Bill, Merge                 | Submit Form: This form will get all required information from the user and pass it to other nodes |
| Search_Bill          | Google Drive (File Search)       | Check if uploaded bill exists in Google Drive  | On form submission               | if Bill Exists                    | Validate User Uploaded Bills: Validate if the user uploaded bill already exists into the system. If yes reuse, else upload. |
| if Bill Exists       | If                              | Check filename equality to confirm bill existence | Search_Bill                     | Download Existing Bill, Merge      | See note on Validate User Uploaded Bills above.                                              |
| Download Existing Bill | Google Drive (Download)         | Download existing bill file for processing      | if Bill Exists (True)             | MergeInputs                      | Uploads and Downloads: If bill exists, download for OCR; else upload and download.           |
| Merge                | Merge (choose branch)            | Combine branches based on bill existence        | On form submission, if Bill Exists (False) | Upload_Bills                    | Uploads and Downloads (see above).                                                           |
| Upload_Bills         | Google Drive (Upload)            | Upload newly submitted bill to Google Drive     | Merge                           | Download_Bills                   | Uploads and Downloads (see above).                                                           |
| Download_Bills       | Google Drive (Download)          | Download uploaded bill file for processing      | Upload_Bills                    | MergeInputs                      | Uploads and Downloads (see above).                                                           |
| MergeInputs          | OpenAI (LangChain)               | Extract structured data from bill using AI      | Download Existing Bill or Download_Bills | Validate False Claims            | Extract, Validate: Extract content from bill, validate claim amounts.                        |
| Validate False Claims | Code (JavaScript)               | Compare claimed vs extracted amount; generate ID | MergeInputs                    | If                             | Extract, Validate (see above).                                                               |
| If                  | If                              | Route based on claim validity                    | Validate False Claims            | Mail Invalid Claim, Add Request  | Extract, Validate (see above).                                                               |
| Mail Invalid Claim   | Gmail (Send Email)               | Notify user of invalid claim                      | If (True branch)                 | (none)                          | Invalid Claim: Notify user to resubmit.                                                      |
| Add Request          | Google Sheets (Append Row)       | Log valid reimbursement request                   | If (False branch)                | Mail Valid Claim                 | Valid Claim: Notify user with request ID and notify finance team.                            |
| Mail Valid Claim     | Gmail (Send Email)               | Notify user of valid claim receipt                | Add Request                     | (none)                          | Valid Claim (see above).                                                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Form Trigger Node ("On form submission")**  
   - Type: Form Trigger  
   - Configure form fields:  
     - Employee Name (required)  
     - Employee ID (required)  
     - Email (email type, required)  
     - Claim Amount (number, required)  
     - Nature of Bill (dropdown: Food, Travel, Accommodation, Others; required)  
     - Upload Bills (file upload; accept .jpg, .png, .pdf; required)  
   - Set confirmation message: "Thank you! You will receive an email shortly about your reimbursement request from Finance Department."  

2. **Add Google Drive File Search Node ("Search_Bill")**  
   - Type: Google Drive (Search files)  
   - Credential: Google Drive OAuth2  
   - Folder ID: Set to your reimbursement bills folder (e.g., “Reimburse Bills”)  
   - Query: Use expression to search by filename from form submission uploaded file  
   - Fields: Return file ID, name, webViewLink  
   - Error handling: Continue on error  

3. **Add If Node ("if Bill Exists")**  
   - Type: If  
   - Condition: Check if filename from search equals uploaded filename (case-sensitive, strict)  
   - True branch: Bill exists  
   - False branch: Bill does not exist  

4. **Add Google Drive Download Node ("Download Existing Bill")**  
   - Type: Google Drive (Download file)  
   - Credential: Google Drive OAuth2  
   - File ID: Use ID from Search_Bill node  
   - Connect from True branch of if Bill Exists  

5. **Add Merge Node ("Merge")**  
   - Type: Merge (choose branch mode)  
   - Input 1: False branch from if Bill Exists (bill does not exist)  
   - Input 2: Form submission node (to get binary file)  

6. **Add Google Drive Upload Node ("Upload_Bills")**  
   - Type: Google Drive (Upload file)  
   - Credential: Google Drive OAuth2  
   - Folder ID: Same as above (Reimburse Bills)  
   - Filename: Use uploaded file name from form submission  
   - Input: From Merge node (False branch)  

7. **Add Google Drive Download Node ("Download_Bills")**  
   - Type: Google Drive (Download file)  
   - Credential: Google Drive OAuth2  
   - File ID: From Upload_Bills node output  
   - Connect from Upload_Bills  

8. **Connect Download Existing Bill and Download_Bills to OpenAI Node ("MergeInputs")**  
   - Type: OpenAI (LangChain integration)  
   - Credential: OpenAI API  
   - Model: GPT-4o-mini  
   - Input Type: Base64 binary of downloaded file  
   - Prompt:  
     ```
     Create a JSON as below and just return structured JSON in string:

     {
       empID: {{ Emp ID from form }},
       empName: {{ Emp Name from form }},
       empEmail: {{ Email from form }},
       billType: {{ Nature of Bill from form }},
       amountClaimed: {{ Claim Amount from form }},
       totalBill: Extract the total amount from the binary,
       uploadedFile: {{ webViewLink to file }}
     }
     NOTE: Do not append ```json\n in the output
     ```  

9. **Add Code Node ("Validate False Claims")**  
   - Type: Code (JavaScript)  
   - Script:  
     ```js
     var jsonObj = JSON.parse($input.first().json.content);
     if (jsonObj.amountClaimed != jsonObj.totalBill) {
       return {isFalseClaim: true, receiptContent: jsonObj, requestID: generateRandomString()};
     } else {
       return {isFalseClaim: false, receiptContent: jsonObj, requestID: generateRandomString()};
     }

     function generateRandomString(length = 20) {
       const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
       let result = jsonObj.empID + '_';
       for (let i = 0; i < length; i++) {
         result += chars.charAt(Math.floor(Math.random() * chars.length));
       }
       return result;
     }
     ```  
   - Input: Output of MergeInputs  

10. **Add If Node ("If")**  
    - Type: If  
    - Condition: Check if `isFalseClaim` is true  
    - True branch: Invalid claim  
    - False branch: Valid claim  

11. **Add Gmail Node ("Mail Invalid Claim")**  
    - Type: Gmail (Send Email)  
    - Credential: Gmail OAuth2  
    - To: Employee email from form submission  
    - CC: finance email (e.g., prath002@gmail.com)  
    - Subject: “New Reimbursement Request - INR {{ Claim Amount }} /-”  
    - Body: Detailed message including claimed amount, total bill, uploaded file name, bill type, and instructions to resubmit  

12. **Add Google Sheets Node ("Add Request")**  
    - Type: Google Sheets (Append Row)  
    - Credential: Google Sheets OAuth2  
    - Sheet: Your tracking sheet (provide document ID and sheet name)  
    - Columns to append:  
      - RequestID, Employee ID, Employee Name, Receipt Type, Total Billed Amount, Bill Date (current timestamp), Uploaded On (current timestamp), Receipt Link, Is_Approved (default “No”)  
    - Input: False branch from If node (valid claim)  

13. **Add Gmail Node ("Mail Valid Claim")**  
    - Type: Gmail (Send Email)  
    - Credential: Gmail OAuth2  
    - To: Employee email  
    - CC: finance email  
    - Subject: “New Reimbursement Request - INR {{ Claim Amount }} /- | {{ RequestID }}”  
    - Body: Confirmation message with request ID and claim details  

14. **Connect nodes according to branches:**  
    - On form submission → Search_Bill → if Bill Exists  
    - if Bill Exists True → Download Existing Bill → MergeInputs  
    - if Bill Exists False → Merge → Upload_Bills → Download_Bills → MergeInputs  
    - MergeInputs → Validate False Claims → If  
    - If True → Mail Invalid Claim  
    - If False → Add Request → Mail Valid Claim  

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                  |
|----------------------------------------------------------------------------------------------------|-------------------------------------------------|
| Form submission confirmation message configured to provide immediate user feedback on submission. | Form Trigger node configuration                  |
| Folder used for storing bills: Google Drive folder ID “1huBmHtSlSU2nV5xbRDDOaBY-CKIPmnjs” (Reimburse Bills). | Google Drive nodes                                |
| Finance department email for CC in notifications: prath002@gmail.com                                | Gmail nodes                                       |
| Uses OpenAI GPT-4o-mini model for receipt content extraction and structuring                       | OpenAI node configuration                         |
| Generated RequestID combines employee ID and a random alphanumeric string for uniqueness           | Code node logic                                   |
| Workflow requires OAuth2 credentials for Gmail, Google Drive, Google Sheets, and OpenAI API keys   | Credential setup in n8n for respective services  |
| Error handling configured to continue workflow even if bill search fails to ensure new uploads proceed | Search_Bill node error handling                    |

---

This document thoroughly explains the workflow’s structure, node configurations, expected behavior, and instructions for recreation, enabling users or automation agents to understand, replicate, or extend this reimbursement automation solution effectively.