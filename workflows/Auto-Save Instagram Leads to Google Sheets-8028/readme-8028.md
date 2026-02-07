Auto-Save Instagram Leads to Google Sheets

https://n8nworkflows.xyz/workflows/auto-save-instagram-leads-to-google-sheets-8028


# Auto-Save Instagram Leads to Google Sheets

### 1. Workflow Overview

This workflow automates the capture and storage of Instagram lead form submissions into a Google Sheets spreadsheet. It is designed for users who gather lead information via Instagram forms and want to centralize that data in a spreadsheet for easy tracking and follow-up.

The workflow consists of three main logical blocks:

- **1.1 Input Reception:** Receives lead data via a webhook triggered by Instagram lead form submissions.
- **1.2 Data Normalization:** Processes and standardizes the incoming data fields into a consistent format.
- **1.3 Data Storage:** Appends the normalized lead data into a specified Google Sheets document.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block waits for incoming POST requests from Instagram lead forms via a webhook, serving as the entry point of the workflow.

- **Nodes Involved:**  
  - Instagram Lead Webhook

- **Node Details:**

  - **Instagram Lead Webhook**  
    - Type: Webhook (HTTP endpoint listener)  
    - Configuration:  
      - HTTP Method: POST  
      - Path: `instagram-leads`  
      - Webhook ID: `instagram-leads-webhook` (unique identifier)  
    - Inputs: External HTTP POST requests from Instagram forms  
    - Outputs: Passes raw JSON data from the request body to the next node  
    - Version: 1  
    - Edge Cases / Potential Failures:  
      - If Instagram does not send data as expected, the webhook may receive malformed or empty requests.  
      - Possible network or authentication issues if using secured endpoints (not configured here).  
    - Notes: This is the primary trigger node; its URL must be configured in Instagram’s lead form settings to send data here.

#### 1.2 Data Normalization

- **Overview:**  
  This block transforms the raw Instagram lead data into a uniform JSON structure, ensuring consistent field names and adding metadata.

- **Nodes Involved:**  
  - Normalize Lead Data

- **Node Details:**

  - **Normalize Lead Data**  
    - Type: Code (JavaScript)  
    - Configuration:  
      - Custom JS code extracts fields `name`, `email`, `phone`, `message` from various possible input keys, defaults missing values, adds a static `source` field ("Instagram"), timestamps the record, and stores the entire raw payload as a JSON string.  
    - Key Expressions:  
      - Accesses `$input.first().json.body` or `$input.first().json`  
      - Constructs normalized object with fallback logic for missing fields  
      - Adds current ISO timestamp as `timestamp`  
      - Logs normalized data to console for debugging  
    - Inputs: Raw webhook JSON data  
    - Outputs: JSON object with standardized lead fields  
    - Version: 2  
    - Edge Cases / Potential Failures:  
      - If input JSON structure changes or is missing expected fields, normalization might produce incomplete data.  
      - The function assumes some field combinations (e.g., `firstName` + `lastName`); if these are absent, defaults to `'Unknown'`.  
      - JSON.stringify may fail if input contains circular references (unlikely here).  
    - Notes: This node enables consistent downstream processing regardless of Instagram form field naming variations.

#### 1.3 Data Storage

- **Overview:**  
  This block appends the normalized lead data to a Google Sheets spreadsheet for record-keeping.

- **Nodes Involved:**  
  - Save to Google Sheets

- **Node Details:**

  - **Save to Google Sheets**  
    - Type: Google Sheets node  
    - Configuration:  
      - Operation: `appendOrUpdate` (append new rows)  
      - Sheet Name: `Sheet1` (default sheet)  
      - Document ID: Placeholder `YOUR_GOOGLE_SHEET_ID` (must be replaced with actual Google Sheets ID)  
      - Append Mode: Enabled (adds data as new rows)  
    - Inputs: Normalized JSON data containing lead fields (name, email, phone, message, source, timestamp)  
    - Outputs: Data confirmation or error  
    - Version: 4  
    - Credential Requirements: Google Sheets OAuth2 credentials with write access to the target spreadsheet  
    - Edge Cases / Potential Failures:  
      - Incorrect or missing Google Sheet ID causes operation failure.  
      - Insufficient permissions or invalid credentials prevent writing data.  
      - Rate limits or API errors from Google Sheets API.  
    - Notes: The spreadsheet must have columns matching the expected fields: Name, Email, Phone, Message, Source, Date (per setup instructions).

---

### 3. Summary Table

| Node Name             | Node Type        | Functional Role         | Input Node(s)          | Output Node(s)          | Sticky Note                                                                                                      |
|-----------------------|------------------|------------------------|------------------------|-------------------------|------------------------------------------------------------------------------------------------------------------|
| Setup Instructions     | Sticky Note      | Setup Guidance         | -                      | -                       | 📋 **SETUP REQUIRED:**<br>1. Create Google Sheet with columns: Name, Email, Phone, Message, Source, Date<br>2. Get Sheet ID and replace placeholder<br>3. Connect Instagram Form webhook URL with fields: name, email, phone, message |
| Instagram Lead Webhook | Webhook          | Input Reception        | -                      | Normalize Lead Data      | See setup instructions for webhook URL configuration.                                                           |
| Normalize Lead Data    | Code             | Data Normalization     | Instagram Lead Webhook  | Save to Google Sheets    |                                                                                                                  |
| Save to Google Sheets  | Google Sheets    | Data Storage           | Normalize Lead Data     | -                       |                                                                                                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Google Sheet:**
   - Open Google Sheets and create a new spreadsheet.
   - Name the first sheet tab `Sheet1`.
   - Add column headers in the first row:
     - A1: Name
     - B1: Email
     - C1: Phone
     - D1: Message
     - E1: Source
     - F1: Date
   - Copy the spreadsheet ID from the URL (the long string between `/d/` and `/edit`).

2. **Create the n8n Workflow:**

   - **Add Webhook Node:**
     - Name: `Instagram Lead Webhook`
     - Type: Webhook
     - HTTP Method: POST
     - Path: `instagram-leads`
     - Save credentials if needed (usually none for webhook)
     - This is the entry node; note the webhook URL generated.

   - **Add Code Node:**
     - Name: `Normalize Lead Data`
     - Type: Code (JavaScript)
     - Set language version to 2 if prompted.
     - Paste the following JavaScript code:
       ```javascript
       // Normalize Instagram lead data
       const body = $input.first().json.body || $input.first().json;

       // Normalize fields with fallbacks
       const normalizedData = {
         name: body.name || body.full_name || (body.firstName && body.lastName ? body.firstName + ' ' + body.lastName : 'Unknown'),
         email: body.email || body.email_address || '',
         phone: body.phone || body.phone_number || '',
         message: body.message || body.comments || '',
         source: 'Instagram',
         timestamp: new Date().toISOString(),
         raw_data: JSON.stringify(body)
       };

       console.log('Normalized Instagram Lead Data:', normalizedData);

       return { json: normalizedData };
       ```
     - Connect the output of the webhook node to this node.

   - **Add Google Sheets Node:**
     - Name: `Save to Google Sheets`
     - Type: Google Sheets
     - Operation: Append or Update (append)
     - Document ID: Paste your copied Google Sheets ID here
     - Sheet Name: `Sheet1`
     - Set options to append rows
     - Configure Google Sheets credentials with OAuth2 having write access
     - Connect the output of the code node to this node.

3. **Connect Instagram Lead Form:**
   - Use the webhook URL generated by the `Instagram Lead Webhook` node in your Instagram lead generation form settings.
   - Map form fields: `name`, `email`, `phone`, `message` to be sent as POST data.

4. **Activation and Testing:**
   - Activate the workflow to enable the webhook.
   - Submit a test lead through Instagram form or a POST request mimicking Instagram’s structure.
   - Verify that data appears correctly in the Google Sheet.

---

### 5. General Notes & Resources

| Note Content                                                                                                         | Context or Link                                                |
|----------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| Setup instructions include creating a Google Sheet with specified columns and replacing placeholder IDs accordingly. | Included in the sticky note named "Setup Instructions" node.  |
| Ensure the Instagram lead form sends data to the exact webhook URL path `instagram-leads` configured in the webhook. | Instagram lead form setup requirement.                         |
| Google Sheets node requires OAuth2 credentials with appropriate permissions to append data to the target spreadsheet. | Credential setup for Google Sheets node.                       |

---

**Disclaimer:** The text provided stems exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to applicable content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.