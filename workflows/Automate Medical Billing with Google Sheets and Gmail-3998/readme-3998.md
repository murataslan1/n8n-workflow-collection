Automate Medical Billing with Google Sheets and Gmail

https://n8nworkflows.xyz/workflows/automate-medical-billing-with-google-sheets-and-gmail-3998


# Automate Medical Billing with Google Sheets and Gmail

### 1. Workflow Overview

This n8n workflow automates the medical billing process for private clinics and health service providers. It streamlines patient data capture, invoice calculation, email delivery, and record-keeping in Google Sheets, while ensuring error handling and administrative notifications.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Captures patient billing data through an embedded form.
- **1.2 Data Preparation:** Structures raw input and formats visit dates for professional display.
- **1.3 Invoice Calculation:** Computes total invoice amounts based on selected treatments.
- **1.4 Validation & Error Handling:** Checks for missing critical information and routes workflow accordingly.
- **1.5 Communication:** Sends personalized invoice emails to patients and notifies admins of errors.
- **1.6 Logging:** Appends invoice records to a designated Google Sheet for audit and tracking.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block initiates the workflow by capturing patient billing information via an n8n form embedded on a website or portal.

- **Nodes Involved:**  
  - On form submission

- **Node Details:**  
  - **On form submission**  
    - *Type:* Form Trigger  
    - *Role:* Entry point that waits for patient form submissions containing name, email, visit date, and selected treatments.  
    - *Configuration:* Uses a webhook internally to receive form data.  
    - *Inputs:* External HTTP Form POST  
    - *Outputs:* Passes form data downstream for processing.  
    - *Edge Cases:* Form submissions missing required fields might cause downstream errors if not handled.  
    - *Notes:* Customizable form fields to add extra patient info.

#### 1.2 Data Preparation

- **Overview:**  
  This block structures the incoming raw data and formats the visit date for consistent invoice presentation.

- **Nodes Involved:**  
  - Data Structure1  
  - Format Date

- **Node Details:**  
  - **Data Structure1**  
    - *Type:* Set Node  
    - *Role:* Initializes or restructures JSON data to standardize field names and prepare for processing.  
    - *Inputs:* Form data from “On form submission”  
    - *Outputs:* Passes structured data to “Format Date”  
    - *Edge Cases:* May require adjustment if form fields change.  

  - **Format Date**  
    - *Type:* Code Node (JavaScript)  
    - *Role:* Converts raw visit date into a human-readable, professional format (e.g., "March 15, 2024").  
    - *Inputs:* Structured data from “Data Structure1”  
    - *Outputs:* Adds formatted date field for use in emails and logs.  
    - *Expressions:* Uses JavaScript date parsing and formatting.  
    - *Edge Cases:* Invalid or missing date formats could cause parsing errors.

#### 1.3 Invoice Calculation

- **Overview:**  
  Calculates the total cost of selected treatments using predefined pricing.

- **Nodes Involved:**  
  - Calculate prices

- **Node Details:**  
  - **Calculate prices**  
    - *Type:* Code Node (JavaScript)  
    - *Role:* Maps selected treatments to prices, sums totals, and generates line item details.  
    - *Inputs:* Data with formatted date and treatment selections  
    - *Outputs:* Adds total cost and line items to workflow data  
    - *Key Code:* Uses a treatmentPrices object mapping treatment names to costs (modifiable)  
    - *Edge Cases:* Unknown treatments or typos could cause missing prices; no default fallback is shown.  
    - *Customization:* User can edit treatmentPrices dictionary.

#### 1.4 Validation & Error Handling

- **Overview:**  
  Ensures that required information, especially email, is present before proceeding. Routes flow to error notification or invoice sending accordingly.

- **Nodes Involved:**  
  - Error Check1  
  - Generate Error Message1  
  - Admin Notification1

- **Node Details:**  
  - **Error Check1**  
    - *Type:* If Node  
    - *Role:* Checks for presence of mandatory fields like patient email.  
    - *Inputs:* Calculated invoice data  
    - *Outputs:* Two branches—error path triggers error message; success path continues to email sending.  
    - *Edge Cases:* Missing email or critical info diverts workflow to admin alert.  

  - **Generate Error Message1**  
    - *Type:* Set Node  
    - *Role:* Creates a descriptive error message payload for admin notification.  
    - *Inputs:* From error path of “Error Check1”  
    - *Outputs:* Prepares data for HTTP request to Slack or another notification service.  

  - **Admin Notification1**  
    - *Type:* HTTP Request Node  
    - *Role:* Sends error notification (e.g., to Slack webhook URL) alerting staff of missing data.  
    - *Inputs:* Error message data  
    - *Outputs:* Ends error handling branch  
    - *Edge Cases:* Incorrect webhook URL or network failure could prevent notifications.

#### 1.5 Communication

- **Overview:**  
  Sends personalized invoice emails to patients using Gmail once validation succeeds.

- **Nodes Involved:**  
  - Send Patient Invoice Email

- **Node Details:**  
  - **Send Patient Invoice Email**  
    - *Type:* Gmail Node  
    - *Role:* Sends email to patient with invoice details, including treatments, dates, and totals.  
    - *Inputs:* Validated billing data with formatted date and calculated prices  
    - *Outputs:* On success, triggers logging to Google Sheets  
    - *Configuration:* Uses Gmail OAuth2 credentials with send permission  
    - *Expressions:* Email body templated with expressions like `{{ $json.patientName }}` and `{{ $json.totalCost }}`  
    - *Edge Cases:* Gmail API quota limits or credential issues may block sending.

#### 1.6 Logging

- **Overview:**  
  Logs the finalized invoice record into a Google Sheet for bookkeeping and auditing.

- **Nodes Involved:**  
  - Log Invoice to Googlesheets

- **Node Details:**  
  - **Log Invoice to Googlesheets**  
    - *Type:* Google Sheets Node  
    - *Role:* Appends a new row with invoice number, patient details, total cost, line items, and payment status.  
    - *Inputs:* Successful invoice data from email node  
    - *Parameters:* Spreadsheet ID and sheet name must be configured  
    - *Credentials:* Google Sheets OAuth2 with spreadsheet access  
    - *Edge Cases:* Incorrect spreadsheet ID or permissions prevent logging.

---

### 3. Summary Table

| Node Name                 | Node Type          | Functional Role                 | Input Node(s)            | Output Node(s)                 | Sticky Note                  |
|---------------------------|--------------------|--------------------------------|--------------------------|-------------------------------|------------------------------|
| On form submission        | Form Trigger       | Captures patient billing input | -                        | Data Structure1               |                              |
| Data Structure1           | Set                | Structures form data            | On form submission       | Format Date                   |                              |
| Format Date               | Code               | Formats visit date              | Data Structure1          | Calculate prices              |                              |
| Calculate prices          | Code               | Computes invoice totals         | Format Date              | Error Check1                  |                              |
| Error Check1              | If                 | Validates critical data         | Calculate prices         | Generate Error Message1, Send Patient Invoice Email |                              |
| Generate Error Message1   | Set                | Prepares error message          | Error Check1 (error path)| Admin Notification1           |                              |
| Admin Notification1       | HTTP Request       | Sends admin alert (Slack)       | Generate Error Message1  | -                             |                              |
| Send Patient Invoice Email| Gmail              | Sends invoice email to patient | Error Check1 (success)   | Log Invoice to Googlesheets   |                              |
| Log Invoice to Googlesheets| Google Sheets      | Logs invoice in Google Sheets   | Send Patient Invoice Email| -                            |                              |
| Sticky Note               | Sticky Note        | Visual annotation               | -                        | -                             |                              |
| Sticky Note1              | Sticky Note        | Visual annotation               | -                        | -                             |                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create "On form submission" node**  
   - Type: Form Trigger  
   - Configure webhook for form input with fields: Patient Name, Email, Visit Date, Selected Treatments (multi-select)  
   - Position at start of workflow.

2. **Add "Data Structure1" node**  
   - Type: Set  
   - Connect input from "On form submission"  
   - Configure to set or rename fields to standardized keys as per form data.

3. **Add "Format Date" node**  
   - Type: Code (JavaScript)  
   - Connect input from "Data Structure1"  
   - Script to parse visit date and output formatted string (e.g., using `new Date().toLocaleDateString()` or similar).

4. **Add "Calculate prices" node**  
   - Type: Code (JavaScript)  
   - Connect input from "Format Date"  
   - Define `treatmentPrices` object mapping treatment names to numeric prices (customizable)  
   - Sum prices for selected treatments, create line items text, add `totalCost` and `lineItems` to output JSON.

5. **Add "Error Check1" node**  
   - Type: If node  
   - Connect input from "Calculate prices"  
   - Condition: Check if patient email exists and is valid  
   - True branch: proceed to send email  
   - False branch: proceed to error handling.

6. **Add "Generate Error Message1" node**  
   - Type: Set  
   - Connect input from false branch of "Error Check1"  
   - Configure to create error notification payload (e.g., message text with missing fields).

7. **Add "Admin Notification1" node**  
   - Type: HTTP Request  
   - Connect input from "Generate Error Message1"  
   - Configure to POST to Slack webhook URL or alternative notification endpoint  
   - Set HTTP method, headers, and body accordingly.

8. **Add "Send Patient Invoice Email" node**  
   - Type: Gmail  
   - Connect input from true branch of "Error Check1"  
   - Configure with Gmail OAuth2 credentials  
   - Set recipient to patient email variable  
   - Compose message body using expressions for patient name, formatted date, line items, and total cost.

9. **Add "Log Invoice to Googlesheets" node**  
   - Type: Google Sheets  
   - Connect input from "Send Patient Invoice Email"  
   - Configure with Google Sheets OAuth2 credentials  
   - Set target spreadsheet ID and sheet name  
   - Map fields to columns: Invoice No, Patient Name, Email, Date, Total Cost, Line Items, Payment Status.

10. **Activate the workflow and perform tests** to verify form submissions trigger invoicing, email delivery works, and data logs to Google Sheets. Adjust credentials and parameters as needed.

---

### 5. General Notes & Resources

| Note Content                                                                                   | Context or Link                                               |
|-----------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| This template is designed for self-hosted n8n instances only.                                 | Workflow description                                          |
| Treatment prices can be customized in the "Calculate prices" code node.                       | Pricing customization step                                    |
| The Google Sheet must have exact column headers to match node mappings.                       | Google Sheet setup instructions                              |
| Slack alerting can be replaced with email or CRM notifications by changing "Admin Notification1" node. | Error handling customization                                  |
| For detailed n8n usage, visit the official documentation: https://docs.n8n.io/               | n8n official resources                                        |
| Community support is available at: https://community.n8n.io                                  | n8n community forum                                           |
| Template creator contact: David Olusola, support email: Dimejicole21@gmail.com                | Support and inquiries                                         |

---

This comprehensive reference enables advanced users and automation agents to understand, reproduce, and maintain the Medical Billing workflow efficiently.