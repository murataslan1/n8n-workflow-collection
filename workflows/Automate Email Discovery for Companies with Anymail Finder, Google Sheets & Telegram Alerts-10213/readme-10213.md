Automate Email Discovery for Companies with Anymail Finder, Google Sheets & Telegram Alerts

https://n8nworkflows.xyz/workflows/automate-email-discovery-for-companies-with-anymail-finder--google-sheets---telegram-alerts-10213


# Automate Email Discovery for Companies with Anymail Finder, Google Sheets & Telegram Alerts

### 1. Workflow Overview

This workflow automates the discovery of email addresses associated with companies by integrating Google Sheets, the Anymail Finder API, and Telegram alerts. Its main use case is to process a list of companies stored in a Google Sheet, find their email addresses via Anymail Finder, update the sheet with the results, and send notifications when emails are not found.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Manual trigger initiation and retrieval of company data from Google Sheets.
- **1.2 Iterative Processing:** Looping through each company record to request email discovery.
- **1.3 Email Discovery and Classification:** Sending requests to Anymail Finder API, classifying email status with a switch node.
- **1.4 Output Handling:** Updating Google Sheets with results depending on email status and sending Telegram alerts when no email is found.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block starts the workflow manually and fetches the list of companies from a Google Sheet for processing.

- **Nodes Involved:**  
  - Manual Trigger  
  - Get Leads  

- **Node Details:**  

  - **Manual Trigger**  
    - Type: Manual trigger node  
    - Role: Initiates workflow execution on demand  
    - Config: No parameters; default manual start  
    - Inputs: None  
    - Outputs: Connects to "Get Leads"  
    - Edge Cases: None specific; user must trigger workflow  
      
  - **Get Leads**  
    - Type: Google Sheets node  
    - Role: Reads company data from a specified Google Sheet  
    - Config:  
      - Reads from sheet named "Foglio1" (gid=0) in the spreadsheet "Find Email by Company"  
      - Filters data where PROCESSING column is empty (condition on PROCESSING)  
      - Uses OAuth2 credentials for Google Sheets access  
    - Expressions: None dynamic beyond sheet and document IDs  
    - Inputs: From "Manual Trigger"  
    - Outputs: Connects to "Loop Over Items"  
    - Edge Cases:  
      - Google Sheets access errors (auth, sheet not found)  
      - Empty or invalid data rows  
      - Filter may exclude all rows, leading to no processing  

#### 1.2 Iterative Processing

- **Overview:**  
  This block processes each company entry individually by splitting the data into batches (effectively item-by-item).

- **Nodes Involved:**  
  - Loop Over Items  

- **Node Details:**  

  - **Loop Over Items**  
    - Type: SplitInBatches node  
    - Role: Processes each company record one at a time  
    - Config: Default batch size (1 item per batch)  
    - Inputs: From "Get Leads"  
    - Outputs: Two outputs: first for batch control (unused), second connects to "Email finder" and "Send Alert"  
    - Edge Cases:  
      - Large datasets might slow down processing  
      - If no items, downstream nodes receive no data  

#### 1.3 Email Discovery and Classification

- **Overview:**  
  This block sends each company’s data to Anymail Finder API to discover email addresses, then classifies the email status for further processing.

- **Nodes Involved:**  
  - Email finder  
  - Switch  

- **Node Details:**  

  - **Email finder**  
    - Type: HTTP Request node  
    - Role: Sends POST requests to Anymail Finder API to find emails for each company  
    - Config:  
      - URL: `https://api.anymailfinder.com/v5.1/find-email/company`  
      - Method: POST  
      - Body parameters: domain (from `WEBSITE` column), company_name (from `COMPANY NAME` column)  
      - Authentication: HTTP Header Auth with Anymail Finder API key in Authorization header  
      - Timeout: 180 seconds  
      - On error: Continue workflow execution even if request fails  
    - Inputs: From "Loop Over Items" (batch output)  
    - Outputs: Connects to "Switch"  
    - Notes: Ensure API key is set properly in credentials  
    - Edge Cases:  
      - API key invalid or missing → auth error  
      - API timeouts or network errors  
      - Unexpected API responses or empty results  
      
  - **Switch**  
    - Type: Switch node  
    - Role: Routes workflow based on email status returned by Anymail Finder  
    - Config:  
      - Checks `email_status` field in response JSON  
      - Routes to:  
        - "valid" → email found path  
        - "risky" → email found path (treated same as valid)  
        - "" (empty) → email not found path  
    - Inputs: From "Email finder"  
    - Outputs: Three outputs connected to "Email found" (for valid and risky) and "Email not found" nodes  
    - Edge Cases:  
      - Missing or malformed `email_status` field  
      - Unexpected status values not handled explicitly  

#### 1.4 Output Handling

- **Overview:**  
  This block writes back the results to Google Sheets, marking rows as processed and updating email fields. It also sends Telegram alerts if no email is found.

- **Nodes Involved:**  
  - Email found  
  - Email not found  
  - Send Alert  

- **Node Details:**  

  - **Email found**  
    - Type: Google Sheets node  
    - Role: Updates the Google Sheet row with found email data and marks PROCESSING with "x"  
    - Config:  
      - Updates row identified by `row_number` from "Loop Over Items"  
      - Sets EMAIL column to stringified JSON of emails from API response  
      - Sets PROCESSING column to "x"  
      - Uses OAuth2 credentials for Google Sheets  
      - Targets the same sheet and document as "Get Leads"  
    - Inputs: From "Switch" (valid and risky outputs)  
    - Outputs: Feeds back to "Loop Over Items" (control flow)  
    - Edge Cases:  
      - Google Sheets update errors (auth, quota)  
      - Data type mismatches or JSON stringification issues  
      
  - **Email not found**  
    - Type: Google Sheets node  
    - Role: Updates the Google Sheet row to mark PROCESSING with "x" and clears EMAIL field when no email is found  
    - Config:  
      - Updates row by `row_number`  
      - EMAIL column set to empty string  
      - PROCESSING column set to "x"  
      - Uses same sheet and credentials as above  
    - Inputs: From "Switch" (empty output)  
    - Outputs: Connects to "Send Alert"  
    - Edge Cases: Similar to "Email found" regarding updates  
      
  - **Send Alert**  
    - Type: Telegram node  
    - Role: Sends Telegram alert notifying that email was not found for a company  
    - Config:  
      - ChatId: configured for specific Telegram chat  
      - Message text: "Alert! Email not found"  
      - Uses Telegram API credentials  
    - Inputs: From "Email not found"  
    - Outputs: None (end of this branch)  
    - Edge Cases:  
      - Telegram API failures or invalid chat ID  
      - Rate limits on Telegram messaging  

---

### 3. Summary Table

| Node Name       | Node Type               | Functional Role                                  | Input Node(s)          | Output Node(s)         | Sticky Note                                                                                                               |
|-----------------|-------------------------|-------------------------------------------------|------------------------|------------------------|---------------------------------------------------------------------------------------------------------------------------|
| Manual Trigger  | Manual Trigger          | Initiates the workflow manually                  | None                   | Get Leads              | - Clone this [sheet](https://docs.google.com/spreadsheets/d/1yH5f_z6HeHN5KJBdMbij_-KKX47rKnSIGPj_OUTO0LU/edit?usp=sharing) - Get your [Anymail Finder](https://anymailfinder.com) API Key (FREE Trial) - In "Email finder" node create credential “Anymail Finder” with HTTP Header Auth using your API key. |
| Get Leads      | Google Sheets           | Retrieves company data from Google Sheets        | Manual Trigger         | Loop Over Items         |                                                                                                                           |
| Loop Over Items | SplitInBatches          | Processes each company record one-by-one          | Get Leads              | Email finder, Send Alert|                                                                                                                           |
| Email finder   | HTTP Request            | Queries Anymail Finder API for company emails     | Loop Over Items        | Switch                 | This node sends the request to Anymailfinder. Make sure you've connected your API key in the credentials (HTTP Header Auth). |
| Switch        | Switch                   | Routes workflow based on email status             | Email finder           | Email found, Email not found | Classify if email is valid, risky and not found.                                                                           |
| Email found   | Google Sheets            | Updates sheet with discovered emails and marks processed | Switch                 | Loop Over Items         |                                                                                                                           |
| Email not found | Google Sheets            | Updates sheet marking email as not found          | Switch                 | Send Alert              |                                                                                                                           |
| Send Alert    | Telegram                 | Sends Telegram alert if email not found           | Email not found        | None                   |                                                                                                                           |
| Sticky Note   | Sticky Note              | Instructional notes                               | None                   | None                   | ## Find email address by company with Anymail Finder... This automation retrieves company information from a Google Sheet, uses the Anymail Finder API to discover emails, and writes results back. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Purpose: Start workflow on demand  
   - No parameters needed  

2. **Create Google Sheets Node "Get Leads"**  
   - Operation: Read rows  
   - Spreadsheet ID: `1yH5f_z6HeHN5KJBdMbij_-KKX47rKnSIGPj_OUTO0LU`  
   - Sheet Name: `gid=0` (usually "Foglio1")  
   - Filter: Only rows where PROCESSING column is empty  
   - Credentials: Configure Google Sheets OAuth2 credentials  
   - Connect manual trigger output to this node input  

3. **Create SplitInBatches Node "Loop Over Items"**  
   - Default batch size (1)  
   - Connect "Get Leads" output to this node input  

4. **Create HTTP Request Node "Email finder"**  
   - Method: POST  
   - URL: `https://api.anymailfinder.com/v5.1/find-email/company`  
   - Authentication: HTTP Header Auth  
     - Name: `Authorization`  
     - Value: Your Anymail Finder API key (e.g., `Bearer YOUR_API_KEY`)  
   - Body Parameters (JSON):  
     - `domain`: `={{ $json["WEBSITE"] }}`  
     - `company_name`: `={{ $json["COMPANY NAME"] }}`  
   - Timeout: 180000 ms (3 minutes)  
   - On Error: Continue  
   - Connect second output of "Loop Over Items" to this node input  

5. **Create Switch Node "Switch"**  
   - Condition: Evaluate `email_status` in response JSON  
   - Outputs:  
     - Output 1 (valid): `email_status == "valid"`  
     - Output 2 (risky): `email_status == "risky"`  
     - Output 3 (not found): `email_status == ""` (empty string)  
   - Connect "Email finder" output to "Switch" input  

6. **Create Google Sheets Node "Email found"**  
   - Operation: Update row  
   - Spreadsheet ID and Sheet Name: same as "Get Leads"  
   - Mapping:  
     - `EMAIL`: `={{JSON.stringify($json.emails)}}`  
     - `PROCESSING`: `"x"`  
     - `row_number`: `={{ $('Loop Over Items').item.json.row_number }}`  
   - Credentials: Google Sheets OAuth2  
   - Connect "valid" and "risky" outputs of "Switch" to this node input  

7. **Create Google Sheets Node "Email not found"**  
   - Operation: Update row  
   - Spreadsheet ID and Sheet Name: same as above  
   - Mapping:  
     - `EMAIL`: `=""` (empty string)  
     - `PROCESSING`: `"x"`  
     - `row_number`: `={{ $('Loop Over Items').item.json.row_number }}`  
   - Credentials: Google Sheets OAuth2  
   - Connect "not found" output of "Switch" to this node input  

8. **Create Telegram Node "Send Alert"**  
   - Chat ID: Your Telegram chat ID  
   - Text: `"Alert! Email not found"`  
   - Credentials: Telegram API OAuth2  
   - Connect "Email not found" node output to this node input  

9. **Connect "Email found" node output back to first output of "Loop Over Items"**  
   - This continues batch processing loop for next item  

10. **Final checks:**  
    - Verify all OAuth2 credentials for Google Sheets and Telegram are valid and authorized  
    - Verify Anymail Finder HTTP Header Auth credential has the correct API key  
    - Test workflow with a small dataset to confirm processing and error handling  
    - Optionally clone the referenced Google Sheet template for correct columns and formats  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                     | Context or Link                                                                                              |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| Clone this Google Sheet template to start: https://docs.google.com/spreadsheets/d/1yH5f_z6HeHN5KJBdMbij_-KKX47rKnSIGPj_OUTO0LU/edit?usp=sharing                     | Google Sheet template with necessary columns                                                                |
| Get your free trial API key from Anymail Finder: https://anymailfinder.com                                                                                       | Anymail Finder official website for API key registration                                                     |
| How to create HTTP Header Auth credential in n8n: Name = "Authorization", Value = "YOUR_API_KEY"                                                                | Credential setup instructions                                                                                 |
| Telegram API setup: obtain bot token and chat ID; ensure bot can send messages to the target chat                                                              | Telegram Bot API documentation                                                                                |
| Workflow handles API errors gracefully by continuing on errors from Anymail Finder HTTP requests                                                                | Ensures batch processing continues despite occasional API failures                                           |
| Email status classification logic distinguishes between valid, risky, and not found emails to route processing accordingly                                      | Improves data quality and allows targeted alerting                                                           |

---

**Disclaimer:**  
The text above is an analysis and documentation of an n8n workflow automation. It respects all content policies and processes only legal and public data.