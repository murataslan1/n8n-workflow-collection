Automate Incident Reporting & Alerts with Forms, Google Sheets and Gmail

https://n8nworkflows.xyz/workflows/automate-incident-reporting---alerts-with-forms--google-sheets-and-gmail-7575


# Automate Incident Reporting & Alerts with Forms, Google Sheets and Gmail

### 1. Workflow Overview

This workflow automates incident reporting and alerting by integrating Google Forms, Google Sheets, and Gmail via n8n. It is designed for organizations needing a streamlined, real-time incident management system where reports submitted through a form are automatically logged and emailed to a support team for immediate action.

**Use Cases:**  
- Workplace safety incident logging  
- Equipment failure or security breach reporting  
- Any scenario requiring structured incident data capture and alerting

**Logical Blocks:**  
- **1.1 Input Reception:** Receives incident report submissions via a form webhook.  
- **1.2 Data Logging:** Appends the incident data as a new row in a Google Sheets document for centralized record-keeping.  
- **1.3 Alerting:** Sends an email notification to the support team with incident details for rapid response.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block initiates the workflow by capturing incident report submissions from a Google Form via webhook trigger. It ensures all required form fields are collected and made available downstream.

- **Nodes Involved:**  
  - On form submission

- **Node Details:**

  - **Node Name:** On form submission  
  - **Type:** Form Trigger (Webhook)  
  - **Technical Role:** Listens for new entries submitted through a specified Google Form titled "Incident Report".  
  - **Configuration:**  
    - Form titled "Incident Report" with fields: Name of Reporter (required), Contact Email (required), Date & Time of Incident (date, required), Location (required), Incident Category/Type (dropdown: Equipment Failure, Safety, Security), Severity (dropdown: Low, Medium, High, Critical), Detailed Description (required), Actions Taken, Attach Photos (file, single).  
    - Form description instructs users on confidentiality and purpose.  
    - No special options enabled beyond required fields enforcement.  
  - **Expressions/Variables:**  
    - Submits all form data as JSON for use in downstream nodes.  
  - **Input/Output Connections:**  
    - No input (trigger node)  
    - Outputs data to Gmail and Google Sheets nodes.  
  - **Version Requirements:** Uses version 2.2 of the form trigger node.  
  - **Potential Failures:**  
    - Webhook connectivity issues.  
    - Missing required fields if form is edited improperly.  
    - Submission format changes leading to expression errors downstream.  

#### 1.2 Data Logging

- **Overview:**  
  This block appends each new incident report as a row in a specified Google Sheet, creating an auditable log of all submissions with all essential details preserved.

- **Nodes Involved:**  
  - Google Sheets

- **Node Details:**

  - **Node Name:** Google Sheets  
  - **Type:** Google Sheets (Append Row)  
  - **Technical Role:** Inserts form data into the first sheet (Sheet1) of a Google Sheets document using OAuth2 credentials.  
  - **Configuration:**  
    - Maps form fields directly to sheet columns: Name of Reporter, Contact Email, Date & Time of Incident, Location, Incident Category/Type, Severity, Detailed Description, Actions Taken, Attach Photos, and a timestamp field "submitted_at" (mapped from submission time).  
    - Uses "append" operation to add new rows.  
    - Sheet selection via GID=0 (Sheet1).  
  - **Expressions/Variables:**  
    - Each field is dynamically mapped from incoming JSON data using expressions, e.g. `{{$json["Location"]}}`.  
  - **Input/Output Connections:**  
    - Input: Data from On form submission node.  
    - Output: None (terminal for data logging).  
  - **Version Requirements:** Version 4.6 of Google Sheets node.  
  - **Potential Failures:**  
    - Authentication/authorization failures with Google Sheets OAuth2.  
    - Sheet access or permissions errors.  
    - Schema mismatch if Google Sheet columns are renamed or removed.  
    - Network or API rate limiting issues.

#### 1.3 Alerting

- **Overview:**  
  Sends an immediate email notification to the support team containing key incident details to ensure quick awareness and response.

- **Nodes Involved:**  
  - Gmail

- **Node Details:**

  - **Node Name:** Gmail  
  - **Type:** Gmail (Send Email)  
  - **Technical Role:** Sends an alert email using Gmail OAuth2 credentials.  
  - **Configuration:**  
    - Recipient: supportteam@mailinator.com (placeholder for actual support email).  
    - Subject: Includes severity and truncated detailed description, e.g. "Incident Alert: High - [First 50 chars of description]".  
    - Message Body: Text email with formatted fields including date/time, reporter name/email, location, category/type, severity, description, actions taken, and attachments. Uses fallback values if fields are missing.  
    - Attribution disabled (no appended signature).  
  - **Expressions/Variables:**  
    - Uses expressions to extract data for subject and body, e.g. `{{$json.Severity}}`, `{{$json["Detailed Description"]?.substring(0, 50)}}`.  
    - Uses `$now` to insert current time in formatted string.  
  - **Input/Output Connections:**  
    - Input: Data from On form submission node.  
    - Output: None (terminal for alerting).  
  - **Version Requirements:** Version 2.1 of Gmail node.  
  - **Potential Failures:**  
    - Authentication errors with Gmail OAuth2 credentials.  
    - Email sending quota exceeded or API limits.  
    - Malformed email addresses or missing required fields.  
    - Large attachment handling (attachments are referenced as field but no explicit upload/link processing).  

---

### 3. Summary Table

| Node Name          | Node Type           | Functional Role              | Input Node(s)          | Output Node(s)           | Sticky Note                                                                                                               |
|--------------------|---------------------|-----------------------------|-----------------------|--------------------------|---------------------------------------------------------------------------------------------------------------------------|
| On form submission  | Form Trigger        | Receives form submissions    | None                  | Gmail, Google Sheets     | ## Description\n\n**1. Node: On form submission**\nRecommended Name in n8n:\nForm Submission Webhook\n\nReceives incident report data from the Google Form (via webhook trigger). This node starts the workflow every time a new form entry is submitted. |
| Gmail              | Gmail (Send Email)  | Sends alert emails           | On form submission    | None                     | **3. Node: Gmail (send: message)**\nRecommended Name in n8n:\nSend Alert Email to Support Team\n\nSends an immediate notification email to the support/response team. Includes key incident details (such as message, location, severity, and timestamp) to ensure rapid awareness and response. |
| Google Sheets       | Google Sheets       | Logs form data to spreadsheet | On form submission    | None                     | **2. Node: Google Sheets (append: sheet)**\nRecommended Name in n8n:\nLog Incident to Google Sheet\n\nAppends each new incident report as a row in the specified Google Sheet. Creates a real-time, easily auditable log of all incident submissions. |
| Sticky Note        | Sticky Note          | Documentation and notes      | None                  | None                     | ## Incident Reporting & Management Workflow (n8n + Webhook + Google Sheets + Email)                                          |
| Sticky Note1       | Sticky Note          | Documentation and notes      | None                  | None                     | ## Description\n\n**1. Node: On form submission**\nRecommended Name in n8n:\nForm Submission Webhook\n\nReceives incident report data from the Google Form (via webhook trigger). This node starts the workflow every time a new form entry is submitted.\n\n**2. Node: Google Sheets (append: sheet)**\nRecommended Name in n8n:\nLog Incident to Google Sheet\n\nAppends each new incident report as a row in the specified Google Sheet.\nCreates a real-time, easily auditable log of all incident submissions.\n\n**3. Node: Gmail (send: message)**\nRecommended Name in n8n:\nSend Alert Email to Support Team\n\nSends an immediate notification email to the support/response team.\nIncludes key incident details (such as message, location, severity, and timestamp) to ensure rapid awareness and response.\n\n**Sample Workflow Description (For Workflow/Group Note)**\nIncident Reporting & Management Workflow (Google Forms → n8n Webhook → Google Sheets & Email) |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n and name it "Incident_Reporting_Management".**

2. **Add a Form Trigger node:**  
   - Set node name to "On form submission".  
   - Configure webhook for Google Form integration.  
   - Set Form Title to "Incident Report".  
   - Add these form fields with exact labels and settings:  
     - "Name of Reporter" (text, required)  
     - "Contact Email" (text, required)  
     - "Date & Time of Incident" (date, required)  
     - "Location" (text, required)  
     - "Incident Category/Type" (dropdown, required) with options: Equipment Failure, Safety, Security  
     - "Severity" (dropdown, required) with options: Low, Medium, High, Critical  
     - "Detailed Description" (text, required)  
     - "Actions Taken" (text, optional)  
     - "Attach Photos" (file, single upload, optional)  
   - Add a descriptive form description about confidentiality and purpose.

3. **Add a Gmail node:**  
   - Name it "Gmail".  
   - Set operation to "Send Email".  
   - Configure OAuth2 credentials for Gmail (e.g., "Gmail account 5").  
   - Set "Send To" address as the support team email (replace placeholder "supportteam@mailinator.com" with actual).  
   - Compose subject line using expression: `Incident Alert: {{$json.Severity}} - {{$json["Detailed Description"]?.substring(0,50)}}`  
   - Compose message body as plain text with the following content using expressions:  
     ```
     Incident Reported: 🚨

     Date & Time: {{$json["Date & Time of Incident"] || $now}}
     Reported By: {{$json['Name of Reporter'] || "Not provided"}}
     Email: {{$json["Contact Email"] || "Not provided"}}
     Location: {{$json["Location"]}}
     Category/Type: {{$json["Incident Category/Type"] || "Not provided"}}
     Severity: {{$json.Severity}}

     Description:
     {{$json["Detailed Description"] || "Not provided"}}

     Actions Taken:
     {{$json["Actions Taken"] || "Not provided"}}

     Attachments: 
     {{$json["Attach Photos"]}}

     ----
     This is an automated notification sent on {{$now.format("HH 'hours and' mm 'minutes'")}}.
     ```  
   - Disable attribution (no signature appended).

4. **Add a Google Sheets node:**  
   - Name it "Google Sheets".  
   - Set operation to "Append" row.  
   - Configure OAuth2 credentials for Google Sheets (e.g., "Google Sheets account 2").  
   - Specify the target spreadsheet and sheet (use GID=0 for Sheet1).  
   - Map columns as follows using expressions:  
     - Name of Reporter: `{{$json["Name of Reporter"]}}`  
     - Contact Email: `{{$json["Contact Email"]}}`  
     - Date & Time of Incident: `{{$json["Date & Time of Incident"]}}`  
     - Location: `{{$json["Location"]}}`  
     - Incident Category/Type: `{{$json["Incident Category/Type"]}}`  
     - Severity: `{{$json["Severity"]}}`  
     - Detailed Description: `{{$json["Detailed Description"]}}`  
     - Actions Taken: `{{$json["Actions Taken"]}}`  
     - Attach Photos: `{{$json["Attach Photos"]}}`  
     - submitted_at: `{{$json.submittedAt}}` (timestamp from form submission)

5. **Connect the workflow:**  
   - Connect output of "On form submission" node to the "Gmail" node input.  
   - Connect output of "Gmail" node to the "Google Sheets" node input.  
   - This ensures the email is sent before logging the data.

6. **Save and activate the workflow.**

7. **Test by submitting the Google Form and verifying:**  
   - The support team receives the alert email with correct details.  
   - The new row is appended in the Google Sheet with all incident data.  

---

### 5. General Notes & Resources

| Note Content                                                                                                      | Context or Link                                                                                   |
|------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Incident Reporting & Management Workflow (n8n + Webhook + Google Sheets + Email)                                  | General workflow description and branding.                                                      |
| Sample workflow description aligns with Google Forms → n8n Webhook → Google Sheets & Email integration pattern.  | Sticky notes in the workflow provide concise summaries and naming conventions for nodes.       |
| Use OAuth2 credentials securely and ensure proper Google API and Gmail API permissions are granted for accounts. | Credential setup is crucial for smooth execution and avoiding authentication errors.            |
| For detailed Google Sheets API limits and Gmail sending limits, refer to Google documentation to avoid errors.  | https://developers.google.com/sheets/api/limits and https://support.google.com/a/answer/166852  |

---

**Disclaimer:** The provided text exclusively originates from an automated n8n workflow. It complies strictly with content policies and contains no illegal, offensive, or protected elements. All processed data is legal and public.