Automate Solar Lead Qualification & Follow-ups with Google Sheets and Gmail

https://n8nworkflows.xyz/workflows/automate-solar-lead-qualification---follow-ups-with-google-sheets-and-gmail-3794


# Automate Solar Lead Qualification & Follow-ups with Google Sheets and Gmail

### 1. Workflow Overview

This workflow automates the solar lead qualification and follow-up process for solar installation companies, sales teams, and renewable energy consultants. It captures lead data via a webhook, securely stores utility bill documents in Google Drive, records lead details in Google Sheets, evaluates qualification criteria, updates the lead status, and sends personalized emails based on qualification results.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and File Handling:** Receives lead submissions via webhook, uploads utility bills to Google Drive, makes them viewable, and generates shareable links.
- **1.2 Lead Data Recording:** Saves lead information along with utility bill links into Google Sheets.
- **1.3 Lead Qualification:** Detects new leads in the sheet, evaluates qualification criteria (homeownership, credit score, absence of trees), and updates the qualification status.
- **1.4 Follow-up Communication:** Based on qualification, sends acceptance or rejection emails to the leads.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and File Handling

**Overview:**  
This block captures incoming lead data from a website form via a webhook, uploads the utility bill file to Google Drive, sets the file permissions to be publicly viewable, and creates a shareable link to the uploaded bill.

**Nodes Involved:**  
- `[STEP 1] Receive Form Submission`  
- `[STEP 2] Upload Utility Bill`  
- `[STEP 3] Make Bill Viewable`  
- `[STEP 4] Create Bill Link`

**Node Details:**

- **[STEP 1] Receive Form Submission**  
  - *Type:* Webhook  
  - *Role:* Entry point for lead data submitted from a web form via HTTP POST.  
  - *Configuration:* Default webhook settings; expects form fields including firstName, lastName, address, hasTreesOnRoof, creditScore, phone, zipCode, email, homeOwnership, and utilityBill (file upload).  
  - *Input:* HTTP POST request from form.  
  - *Output:* Passes form data and uploaded file to next node.  
  - *Edge Cases:* Missing fields, incorrect field names, or file upload failures may cause incomplete data reception.

- **[STEP 2] Upload Utility Bill**  
  - *Type:* Google Drive node (Upload file)  
  - *Role:* Uploads the utility bill file to a specified Google Drive folder.  
  - *Configuration:* Uses Google Drive OAuth2 credentials; configured to upload the file from webhook data to the designated folder (e.g., "Solar Lead Utility Bills").  
  - *Input:* File from webhook node.  
  - *Output:* File metadata including file ID.  
  - *Edge Cases:* Authentication errors, insufficient permissions, folder ID misconfiguration, or upload failures.

- **[STEP 3] Make Bill Viewable**  
  - *Type:* Google Drive node (Update permissions)  
  - *Role:* Sets the uploaded utility bill file’s sharing permissions to "Anyone with the link can view".  
  - *Configuration:* Uses Google Drive credentials; sets permission type to "anyone" with role "reader".  
  - *Input:* File metadata from upload node.  
  - *Output:* Confirmation of permission update.  
  - *Edge Cases:* Permission update failures due to insufficient scopes or API limits.

- **[STEP 4] Create Bill Link**  
  - *Type:* Function node  
  - *Role:* Generates a shareable URL for the uploaded utility bill file based on its Google Drive file ID.  
  - *Configuration:* Custom JavaScript code constructs the URL using the file ID.  
  - *Input:* File metadata with file ID.  
  - *Output:* Adds a field with the public URL for the utility bill.  
  - *Edge Cases:* Missing or invalid file ID could cause URL generation failure.

---

#### 2.2 Lead Data Recording

**Overview:**  
This block saves the complete lead information, including the utility bill link, into a Google Sheet for centralized tracking.

**Nodes Involved:**  
- `[STEP 5] Save Lead to Spreadsheet`

**Node Details:**

- **[STEP 5] Save Lead to Spreadsheet**  
  - *Type:* Google Sheets node (Append row)  
  - *Role:* Inserts a new row into the Google Sheet with all lead data fields and the utility bill link.  
  - *Configuration:* Uses Google Sheets OAuth2 credentials; targets the configured spreadsheet and sheet; maps incoming data fields to columns named exactly as per setup instructions (Name, Address, Has Trees on Roof, credit score, phone, Zip code, Email, Homeowner, utility bill, Qualification status, Disqualification reason).  
  - *Input:* Lead data including the utility bill URL from previous function node.  
  - *Output:* Confirmation of row insertion.  
  - *Edge Cases:* Spreadsheet ID or sheet name misconfiguration, permission issues, or column name mismatches.

---

#### 2.3 Lead Qualification

**Overview:**  
This block detects new entries in the Google Sheet, evaluates the lead against qualification criteria, updates the qualification status and disqualification reason accordingly.

**Nodes Involved:**  
- `[STEP 6] Detect New Leads`  
- `[STEP 7] Check Qualification Criteria`  
- `[STEP 8] Update Qualification Status`  
- `Check Qualification Status` (If node)

**Node Details:**

- **[STEP 6] Detect New Leads**  
  - *Type:* Google Sheets Trigger  
  - *Role:* Watches the Google Sheet for new rows (leads) added.  
  - *Configuration:* Uses Google Sheets credentials; triggers on new rows in the specified sheet.  
  - *Input:* None (triggered by sheet changes).  
  - *Output:* New lead row data.  
  - *Edge Cases:* Trigger delays, missed triggers if sheet is edited outside expected parameters.

- **[STEP 7] Check Qualification Criteria**  
  - *Type:* Code node (JavaScript)  
  - *Role:* Evaluates three qualification criteria: homeownership status, credit score ≥ 650, and absence of trees on roof. Sets qualification status and disqualification reason accordingly.  
  - *Configuration:* Custom JavaScript logic parsing input row fields; example credit score thresholds and boolean checks.  
  - *Input:* Lead data row from trigger node.  
  - *Output:* Updated lead data with Qualification status and Disqualification reason fields.  
  - *Edge Cases:* Unexpected data formats, missing fields, or logic errors in code.

- **[STEP 8] Update Qualification Status**  
  - *Type:* Google Sheets node (Update row)  
  - *Role:* Updates the lead’s row in the Google Sheet with the qualification status and disqualification reason.  
  - *Configuration:* Uses Google Sheets credentials; identifies row by unique key or index; updates specific columns.  
  - *Input:* Lead data with updated qualification info.  
  - *Output:* Confirmation of update.  
  - *Edge Cases:* Row identification errors, permission issues, or concurrent edits.

- **Check Qualification Status**  
  - *Type:* If node  
  - *Role:* Branches workflow based on whether the lead is qualified or not.  
  - *Configuration:* Condition checks if Qualification status equals "Qualified" (or equivalent).  
  - *Input:* Updated lead data.  
  - *Output:* Routes to acceptance or rejection email nodes.  
  - *Edge Cases:* Case sensitivity or unexpected status values causing misrouting.

---

#### 2.4 Follow-up Communication

**Overview:**  
This block sends personalized emails to leads based on their qualification status, either congratulating qualified leads or providing helpful feedback to disqualified leads.

**Nodes Involved:**  
- `[STEP 10A] Send Acceptance Email`  
- `[STEP 10B] Send Rejection Email`

**Node Details:**

- **[STEP 10A] Send Acceptance Email**  
  - *Type:* Gmail node (Send email)  
  - *Role:* Sends a congratulatory email with next steps to qualified leads.  
  - *Configuration:* Uses Gmail OAuth2 credentials; email subject and body are customizable and can include dynamic variables from lead data (e.g., name, next steps).  
  - *Input:* Lead data from If node’s qualified branch.  
  - *Output:* Email sent confirmation.  
  - *Edge Cases:* Authentication errors, Gmail API limits, invalid email addresses.

- **[STEP 10B] Send Rejection Email**  
  - *Type:* Gmail node (Send email)  
  - *Role:* Sends a rejection email explaining disqualification reasons and suggestions.  
  - *Configuration:* Uses Gmail credentials; customizable subject and body with dynamic lead data.  
  - *Input:* Lead data from If node’s disqualified branch.  
  - *Output:* Email sent confirmation.  
  - *Edge Cases:* Same as acceptance email node.

---

### 3. Summary Table

| Node Name                      | Node Type              | Functional Role                          | Input Node(s)                  | Output Node(s)                 | Sticky Note                          |
|-------------------------------|------------------------|----------------------------------------|-------------------------------|-------------------------------|------------------------------------|
| [STEP 1] Receive Form Submission | Webhook                | Receives lead form submissions          | —                             | [STEP 2] Upload Utility Bill   |                                    |
| [STEP 2] Upload Utility Bill   | Google Drive           | Uploads utility bill file to Drive      | [STEP 1] Receive Form Submission | [STEP 3] Make Bill Viewable    |                                    |
| [STEP 3] Make Bill Viewable    | Google Drive           | Sets file permission to public view    | [STEP 2] Upload Utility Bill   | [STEP 4] Create Bill Link      |                                    |
| [STEP 4] Create Bill Link      | Function               | Creates shareable URL for utility bill | [STEP 3] Make Bill Viewable    | [STEP 5] Save Lead to Spreadsheet |                                    |
| [STEP 5] Save Lead to Spreadsheet | Google Sheets          | Saves lead data and bill link           | [STEP 4] Create Bill Link      | —                             |                                    |
| [STEP 6] Detect New Leads      | Google Sheets Trigger  | Detects new lead rows in sheet          | —                             | [STEP 7] Check Qualification Criteria |                                    |
| [STEP 7] Check Qualification Criteria | Code                   | Evaluates lead qualification criteria   | [STEP 6] Detect New Leads      | [STEP 8] Update Qualification Status |                                    |
| [STEP 8] Update Qualification Status | Google Sheets          | Updates qualification status in sheet   | [STEP 7] Check Qualification Criteria | Check Qualification Status     |                                    |
| Check Qualification Status     | If                     | Routes based on qualification status    | [STEP 8] Update Qualification Status | [STEP 10A] Send Acceptance Email, [STEP 10B] Send Rejection Email |                                    |
| [STEP 10A] Send Acceptance Email | Gmail                  | Sends acceptance email to qualified leads | Check Qualification Status (true branch) | —                             |                                    |
| [STEP 10B] Send Rejection Email | Gmail                  | Sends rejection email to disqualified leads | Check Qualification Status (false branch) | —                             |                                    |
| Sticky Note                   | Sticky Note            | —                                      | —                             | —                             |                                    |
| Sticky Note1                  | Sticky Note            | —                                      | —                             | —                             |                                    |
| Sticky Note2                  | Sticky Note            | —                                      | —                             | —                             |                                    |
| Sticky Note3                  | Sticky Note            | —                                      | —                             | —                             |                                    |
| Sticky Note4                  | Sticky Note            | —                                      | —                             | —                             |                                    |
| Sticky Note5                  | Sticky Note            | —                                      | —                             | —                             |                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Name: `[STEP 1] Receive Form Submission`  
   - Type: Webhook  
   - Configure to accept POST requests with form fields: firstName, lastName, address, hasTreesOnRoof, creditScore, phone, zipCode, email, homeOwnership, utilityBill (file upload).  
   - Save and note the webhook URL.

2. **Create Google Drive Upload Node**  
   - Name: `[STEP 2] Upload Utility Bill`  
   - Type: Google Drive (Upload file)  
   - Configure credentials with Google Drive OAuth2.  
   - Set folder ID to your "Solar Lead Utility Bills" folder.  
   - Map the file input from webhook’s utilityBill field.

3. **Create Google Drive Permission Node**  
   - Name: `[STEP 3] Make Bill Viewable`  
   - Type: Google Drive (Update permissions)  
   - Use same credentials.  
   - Set permission type to "anyone" and role to "reader".  
   - Input file ID from upload node.

4. **Create Function Node to Generate Link**  
   - Name: `[STEP 4] Create Bill Link`  
   - Type: Function  
   - Add code to construct URL:  
     ```javascript
     const fileId = $input.item.json.id;
     return [{ json: { utilityBillLink: `https://drive.google.com/file/d/${fileId}/view?usp=sharing` } }];
     ```  
   - Input: file metadata from previous node.

5. **Create Google Sheets Append Node**  
   - Name: `[STEP 5] Save Lead to Spreadsheet`  
   - Type: Google Sheets (Append row)  
   - Configure credentials with Google Sheets OAuth2.  
   - Set spreadsheet ID and sheet name.  
   - Map fields: Name (concatenate firstName + lastName), Address, Has Trees on Roof, credit score, phone, Zip code, Email, Homeowner, utility bill (use utilityBillLink), Qualification status (leave blank), Disqualification reason (leave blank).

6. **Create Google Sheets Trigger Node**  
   - Name: `[STEP 6] Detect New Leads`  
   - Type: Google Sheets Trigger  
   - Configure to trigger on new rows in the same spreadsheet and sheet.

7. **Create Code Node for Qualification**  
   - Name: `[STEP 7] Check Qualification Criteria`  
   - Type: Code  
   - Use JavaScript to check:  
     - Homeowner status is true/yes  
     - Credit score ≥ 650 (parse string ranges if needed)  
     - Has Trees on Roof is false/no  
   - Set fields: Qualification status ("Qualified" or "Disqualified") and Disqualification reason (explain which criteria failed).

8. **Create Google Sheets Update Node**  
   - Name: `[STEP 8] Update Qualification Status`  
   - Type: Google Sheets (Update row)  
   - Configure to update the same row detected by trigger.  
   - Update Qualification status and Disqualification reason columns.

9. **Create If Node to Branch by Qualification**  
   - Name: `Check Qualification Status`  
   - Type: If  
   - Condition: Qualification status equals "Qualified".  
   - True branch → acceptance email node.  
   - False branch → rejection email node.

10. **Create Gmail Send Email Node for Acceptance**  
    - Name: `[STEP 10A] Send Acceptance Email`  
    - Type: Gmail  
    - Configure Gmail OAuth2 credentials with send scope.  
    - Set recipient email from lead data.  
    - Customize subject and body with dynamic variables (e.g., name, next steps).

11. **Create Gmail Send Email Node for Rejection**  
    - Name: `[STEP 10B] Send Rejection Email`  
    - Type: Gmail  
    - Configure with same Gmail credentials.  
    - Set recipient email from lead data.  
    - Customize subject and body to explain disqualification and suggestions.

12. **Connect Nodes in Order:**  
    - `[STEP 1] Receive Form Submission` → `[STEP 2] Upload Utility Bill` → `[STEP 3] Make Bill Viewable` → `[STEP 4] Create Bill Link` → `[STEP 5] Save Lead to Spreadsheet`  
    - `[STEP 6] Detect New Leads` → `[STEP 7] Check Qualification Criteria` → `[STEP 8] Update Qualification Status` → `Check Qualification Status`  
    - `Check Qualification Status` true → `[STEP 10A] Send Acceptance Email`  
    - `Check Qualification Status` false → `[STEP 10B] Send Rejection Email`

13. **Activate Webhook Node** and test by submitting form data to the webhook URL.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                | Context or Link                                                                                   |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| This workflow requires exact Google Sheets column names as specified to function correctly.                                                                                                 | Setup instructions in Step 1 Google Sheets Setup section                                        |
| Google Drive folder must have "Anyone with the link can view" permission to allow public access to utility bills.                                                                            | Setup instructions in Step 2 Google Drive Setup section                                         |
| Gmail credentials require the Gmail API enabled in Google Cloud Console and proper OAuth2 scopes for sending emails.                                                                          | Setup instructions in Step 3 Configure Google Credentials in n8n                                |
| For troubleshooting webhook issues, verify form POST configuration and CORS settings on your website.                                                                                       | Troubleshooting section                                                                         |
| To customize qualification criteria, edit the JavaScript code in `[STEP 7] Check Qualification Criteria` node.                                                                               | Customization section                                                                           |
| To extend the workflow, consider adding CRM integration nodes after qualification update to sync leads with external systems.                                                                | Customization section                                                                           |
| Created by David Olusola. Consider starring the template in the n8n community if helpful.                                                                                                     | Credits                                                                                         |
| n8n documentation on webhooks and Google integrations is useful for deeper understanding and troubleshooting.                                                                                | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/                      |
| Google Sheets and Drive API documentation for permission and API quota management.                                                                                                            | https://developers.google.com/sheets/api and https://developers.google.com/drive/api           |

---

This structured reference document provides a comprehensive understanding of the Solar Lead Qualification workflow, enabling users and automation agents to reproduce, modify, and troubleshoot the automation effectively.